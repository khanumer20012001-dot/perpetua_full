# Perpetua — Backend Architecture (Production-Grade Structure)

> **Purpose:** This document describes the complete backend project structure, architectural flow, and design pattern usage for the Perpetua Learning Management System (LMS) backend — following a flat, role-separated layered architecture where `routes/`, `controllers/`, `services/`, and `repositories/` are top-level folders rather than buried inside feature modules.
>
> **What this document is NOT:** No source code is modified by reading this document. It serves as the structural contract and engineering blueprint for building, scaling, and maintaining the Perpetua backend.

---

## Table of Contents

1. [The Layered Flow — Explained Before Structured](#1-the-layered-flow)
   - 1.1 [Route — "Which URL goes where?"](#11-route)
   - 1.2 [Controller — "Translate HTTP ↔ Application"](#12-controller)
   - 1.3 [Mediator — "Coordinate Without Coupling"](#13-mediator)
   - 1.4 [Service — "Business Rules & Core Calculations"](#14-service)
   - 1.5 [Repository — "Database Abstraction & Data Access"](#15-repository)
2. [Design Pattern Mapping](#2-design-pattern-mapping)
3. [Full Project Structure](#3-full-project-structure)
4. [CRUD Flow Walkthroughs](#4-crud-flow-walkthroughs)
   - 4.1 [Flow 1: OTP Authentication (Send & Verify OTP)](#41-flow-1-otp-authentication)
   - 4.2 [Flow 2: Designer Course Creation & Publishing](#42-flow-2-designer-course-creation--publishing)
   - 4.3 [Flow 3: Learner Enrollment & Progress Tracking](#43-flow-3-learner-enrollment--progress-tracking)
   - 4.4 [Flow 4: Assessment / Quiz Evaluation & Scoring](#44-flow-4-assessment--quiz-evaluation--scoring)
   - 4.5 [Flow 5: Certificate Auto-Generation](#45-flow-5-certificate-auto-generation)
5. [Plugin Architecture](#5-plugin-architecture)
6. [Event System (Observer / Pub-Sub)](#6-event-system)
7. [Database Architecture & Migration Strategy](#7-database-architecture--migration-strategy)
8. [How This Stays Extensible](#8-how-this-stays-extensible)

---

## 1. The Layered Flow

Before examining the folder tree, understand what happens when an HTTP request enters the Perpetua backend and travels through each architectural layer.

We will trace Perpetua's central workflow:  
**"A Designer creates a Course with Modules and Chapters — a Learner enrolls, completes chapters, and receives a Certificate."**

### The Big Picture in One Sentence

> An HTTP request enters through a **Route**, is validated by a **Fastify Plugin** preHandler, parsed and dispatched by a **Controller** as a typed **Command or Query** through the **Mediator**, which delegates execution to a **Service**, which calls a **Repository** to perform safe transactional queries via **Prisma ORM** against PostgreSQL.

```
[ HTTP Request ]
       │
       ▼
 ┌──────────────────────────────────────────┐
 │  plugins/auth.plugin.ts                 │  ← preHandler: JWT verify + req.user
 │  plugins/cors.plugin.ts                 │  ← CORS headers
 │  plugins/error-handler.plugin.ts        │  ← Global error → HTTP response
 └──────────────────┬───────────────────────┘
                    │
                    ▼
 ┌──────────┐    ┌───────────────┐    ┌──────────────┐
 │  Route   │──► │  Controller   │──► │   Mediator   │
 └──────────┘    └───────────────┘    └──────┬───────┘
                                             │ (Dispatches Command / Query)
                                             ▼
 ┌──────────┐    ┌───────────────┐    ┌──────────────┐
 │ Database │◄── │  Repository   │◄── │   Service    │
 └──────────┘    └───────────────┘    └──────────────┘
```

---

### 1.1 Route

**Location:** `src/routes/`

A route is the entry boundary of the API. It maps an HTTP method + URL pattern to a controller function, binds Fastify/Zod schema validation, and attaches preHandler plugin guards.

```
POST   /api/auth/send-otp                → authController.sendOtp
POST   /api/auth/verify-otp             → authController.verifyOtp
GET    /api/learner/courses              → coursesController.getPublishedCourses
POST   /api/designer/courses            → coursesController.createCourse
POST   /api/designer/courses/:id/modules → coursesController.createModule
POST   /api/learner/courses/:id/enroll  → enrollmentsController.enroll
POST   /api/quizzes/:id/submit          → quizzesController.submitQuiz
GET    /api/certificates/:userId        → certificatesController.getUserCertificates
GET    /api/gemini/generate-course      → geminiController.generateCourse
```

**Why separate Routes from Controllers?**
- Routes are **declarative configuration**: HTTP verb, URL path, Zod body/params schema, and preHandler guards.
- Controllers are **behavior execution**: they unpack HTTP requests and produce application Commands/Queries.
- In Fastify, routes are registered as encapsulated plugins allowing modular prefix mounting in `app.ts`.

---

### 1.2 Controller

**Location:** `src/controllers/`

The Controller has one job: **translate HTTP request → Command/Query → HTTP response**. No database calls, no business logic.

For "Create Course":
1. **Reads** `request.body` (`{ title, description, cover_image, created_by_id }`)
2. **Constructs** a `CreateCourseCommand` object
3. **Dispatches** via `mediator.send(command)`
4. **Returns** standardized JSON: `ApiResponse.success(course)` with status `201`

**Controller Golden Rule:** Controllers must never contain `prisma.*` calls, score calculations, or multi-step coordination logic.

---

### 1.3 Mediator

**Location:** `src/mediator/`

The Mediator pattern decouples HTTP Controllers from concrete domain Services. The Controller sends a single typed Command — the Mediator resolves the correct Handler and executes it.

```typescript
// Controller stays thin & clean
async function createCourse(request: FastifyRequest, reply: FastifyReply) {
  const command = new CreateCourseCommand(request.body as any);
  const course = await mediator.send(command);
  return reply.status(201).send(ApiResponse.success(course));
}
```

Commands are in `src/mediator/commands/<domain>/` — Queries in `src/mediator/queries/<domain>/`.

**Without Mediator:** The controller would need to import and coordinate `CourseService`, `ModuleService`, `ChapterService`, `UserService` simultaneously — becoming tightly coupled and untestable.

**With Mediator:** Controller sends one Command. The registered Handler orchestrates the required services in an isolated, unit-testable context.

---

### 1.4 Service

**Location:** `src/services/`

Services contain all business logic, validation rules, state transitions, and calculation algorithms.

| Service | Responsibility |
| :--- | :--- |
| `auth.service.ts` | OTP lifecycle: generate code, send email, verify code, upsert User, issue JWT |
| `courses.service.ts` | Course CRUD, status transitions (`DRAFT` → `PUBLISHED`), duration aggregations |
| `enrollment.service.ts` | Verify course is PUBLISHED before enrolling, check duplicate enrollment, init progress at 0% |
| `assessment.service.ts` | Evaluate quiz answers against `isCorrect` flags, calculate score %, determine pass/fail |
| `certificate.service.ts` | Verify 100% enrollment progress, resolve the JSON or PDF certificate Strategy, generate the output, emit domain event |
| `gemini.service.ts` | AI course generation: build prompt → call Gemini API → parse structured JSON response |
| `users.service.ts` | Role toggling (`LEARNER ↔ DESIGNER`), profile management |

Services are completely agnostic of HTTP details. They accept DTOs or primitive values and return domain entities.

---

### 1.5 Repository

**Location:** `src/repositories/`

The Repository layer wraps **Prisma ORM** behind clean domain-focused interfaces.

```
[ Service Layer ]
       │
       ▼ (calls ICourseRepository)
 ┌──────────────────────────────────────────────┐
 │         courses.repository.ts                │
 │                                              │
 │  - findById(id: string)                     │
 │  - findAllPublished()                       │
 │  - create(data: CreateCourseDTO)            │
 │  - updateStatus(id, status)                 │
 │  - createWithModulesAndChapters(data, tx)   │
 └──────────────────────────────────────────────┘
       │
       ▼ (Singleton PrismaClient)
 ┌──────────────────────────────────────────────┐
 │   src/db/prisma.ts   (PrismaClient)         │
 └──────────────────────────────────────────────┘
```

**Why use Repositories with Prisma?**
1. **Centralized Queries**: All `include`, `where`, `orderBy` logic lives in one file per domain.
2. **Transactional Boundary**: Complex multi-table writes wrapped in `prisma.$transaction([...])`.
3. **Mockability**: Services are unit-tested by swapping real repositories with mock interfaces.

---

## 2. Design Pattern Mapping

| Pattern | Location | Purpose in Perpetua |
| :--- | :--- | :--- |
| **Mediator** | `src/mediator/` | Dispatches Commands & Queries to specific Handlers. Eliminates tight coupling between controllers and services. |
| **Repository** | `src/repositories/` | Encapsulates all Prisma ORM queries behind domain-focused interfaces. |
| **Plugin (Fastify)** | `src/plugins/` | Encapsulates cross-cutting concerns: JWT auth, CORS, error handling as Fastify lifecycle hooks. |
| **Strategy** | `src/strategies/` | Pluggable algorithms: OTP Auth Strategy, JSON/PDF Certificate Strategy. |
| **Factory** | `src/shared/response/` | `ApiResponse.success(data)` and `ApiResponse.error(code, msg)` across all endpoints. |
| **Singleton** | `src/db/prisma.ts` | Single shared `PrismaClient` instance for connection pool management. |
| **Observer / Domain Events** | `src/events/` | Publishes `CourseCompletedEvent`. `CertificateIssuedListener` catches it and triggers certificate generation. |
| **Facade** | `src/modules/gemini/` | `gemini.service.ts` is the single entry point hiding prompt construction, API calls, and response parsing. |

---

## 3. Full Project Structure

```
perpetua_backend/
├── docker-compose.yml              # Local PostgreSQL container (Port 5433, pgvector/pg16)
├── package.json                    # Project dependencies & npm scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── .env                            # Environment variables (DATABASE_URL, JWT_SECRET, SMTP_*)
├── .env.example                    # Documented env variable template
├── prisma/
│   ├── schema.prisma               # Single-source-of-truth Prisma DB schema
│   └── migrations/                 # Incremental SQL migration history
│       └── 20260906_init/          # Initial SQL migration
└── src/
    ├── app.ts                      # Fastify instance creation + plugin/route registration
    ├── server.ts                   # Entry point: binds port, starts listening, graceful shutdown
    │
    ├── config/                     # Environment configuration (Singleton pattern)
    │   ├── env.config.ts           # Type-safe env variable loader + validation
    │   └── logger.config.ts        # Pino logger config per NODE_ENV
    │
    ├── plugins/                    # Fastify lifecycle plugins (registered in app.ts)
    │   ├── auth.plugin.ts          # preHandler: jwtVerify + populates req.user
    │   ├── cors.plugin.ts          # CORS configuration (@fastify/cors)
    │   ├── swagger.plugin.ts       # OpenAPI/Swagger docs (@fastify/swagger)
    │   └── error-handler.plugin.ts # Global error → standardized HTTP response mapping
    │
    ├── routes/                     # URL → controller mapping (zero business logic)
    │   ├── auth.routes.ts          # POST /api/auth/send-otp, POST /api/auth/verify-otp
    │   ├── courses.routes.ts       # GET /api/learner/courses, POST /api/designer/courses/*
    │   ├── enrollments.routes.ts   # POST /api/learner/enroll, GET /api/learner/enrollments/:userId
    │   ├── quizzes.routes.ts       # GET /api/quizzes/:id, POST /api/quizzes/:id/submit
    │   ├── certificates.routes.ts  # GET /api/certificates/:userId, GET /api/certificates/verify/:id
    │   ├── users.routes.ts         # GET /api/users, PATCH /api/users/:id/role
    │   └── gemini.routes.ts        # POST /api/gemini/generate-course
    │
    ├── controllers/                # HTTP ↔ Application translation (thin layer)
    │   ├── auth.controller.ts      # Parses OTP requests → dispatches SendOtpCommand / VerifyOtpCommand
    │   ├── courses.controller.ts   # Parses course/module/chapter payloads → dispatches course Commands
    │   ├── enrollments.controller.ts # Parses enrollment payloads → dispatches EnrollCourseCommand
    │   ├── quizzes.controller.ts   # Parses quiz answers → dispatches SubmitQuizCommand
    │   ├── certificates.controller.ts # Dispatches GetCertificatesQuery
    │   ├── users.controller.ts     # Dispatches user Commands and Queries
    │   └── gemini.controller.ts    # Dispatches GenerateCourseCommand to Gemini service
    │
    ├── mediator/                   # Command / Query dispatch (Mediator pattern)
    │   ├── mediator.interface.ts   # IMediator interface: send<TResult>(request): Promise<TResult>
    │   ├── mediator.ts             # Concrete Mediator: handler registry + dispatch bus
    │   ├── commands/               # Write intents — change application state
    │   │   ├── auth/
    │   │   │   ├── send-otp.command.ts        # { email }
    │   │   │   └── verify-otp.command.ts      # { email, code }
    │   │   ├── courses/
    │   │   │   ├── create-course.command.ts   # { title, description, cover_image, created_by_id }
    │   │   │   ├── create-module.command.ts   # { course_id, title, subtitle, order }
    │   │   │   ├── create-chapter.command.ts  # { module_id, title, content, duration, order }
    │   │   │   ├── create-full-course.command.ts # Nested: course + modules + chapters + quiz
    │   │   │   └── publish-course.command.ts  # { courseId } → status: DRAFT → PUBLISHED
    │   │   ├── enrollments/
    │   │   │   ├── enroll-course.command.ts   # { courseId, userId }
    │   │   │   └── update-progress.command.ts # { enrollmentId, completedChapters, totalChapters }
    │   │   ├── assessments/
    │   │   │   └── submit-quiz.command.ts     # { quizId, userId, answers[] }
    │   │   └── gemini/
    │   │       └── generate-course.command.ts # { prompt, createdById }
    │   │
    │   └── queries/                # Read intents — no state change
    │       ├── courses/
    │       │   ├── get-published-courses.query.ts
    │       │   ├── get-course-detail.query.ts  # { courseId }
    │       │   └── get-designer-courses.query.ts # { designerId }
    │       ├── enrollments/
    │       │   ├── get-user-enrollments.query.ts # { userId }
    │       │   └── get-dashboard-stats.query.ts  # { userId }
    │       └── users/
    │           ├── get-all-users.query.ts
    │           └── get-user-by-id.query.ts     # { userId }
    │
    ├── services/                   # Business logic & domain rules (HTTP-agnostic)
    │   ├── auth.service.ts         # OTP generation, email dispatch, JWT issuance, User upsert
    │   ├── courses.service.ts      # Course CRUD, DRAFT→PUBLISHED validation, duration aggregation
    │   ├── enrollment.service.ts   # Enrollment validation, progress %, completion detection
    │   ├── assessment.service.ts   # Quiz evaluation, score %, pass/fail determination
    │   ├── certificate.service.ts  # Certificate generation (Strategy), domain event emission
    │   ├── users.service.ts        # Role management, user profile operations
    │   └── gemini.service.ts       # Prompt building, Gemini API call, response parsing
    │
    ├── repositories/               # Database access (only layer touching Prisma)
    │   ├── auth.repository.ts      # OtpCode table: saveOtp, findLatestOtp, deleteOtp
    │   ├── user.repository.ts      # User table: findByEmail, create, updateRole, findAll
    │   ├── courses.repository.ts   # Course table: create, findAllPublished, findById, updateStatus
    │   ├── modules.repository.ts   # Module table: create, findByCourse, updateOrder
    │   ├── chapters.repository.ts  # Chapter table: create, findByModule, createMany
    │   ├── enrollment.repository.ts # Enrollment table: create, findByUserAndCourse, updateProgress
    │   ├── assessment.repository.ts # Quiz + Question + Option tables: create, findWithAnswers
    │   └── certificate.repository.ts # Certificate table: create, findByUser, findByVerificationId
    │
    ├── db/                         # Database infrastructure
    │   └── prisma.ts               # Singleton PrismaClient initialization & connection check
    │
    ├── strategies/                 # Strategy pattern: pluggable algorithm implementations
    │   ├── auth/
    │   │   ├── auth-strategy.interface.ts    # IAuthStrategy: generateAndSend(), verify()
    │   │   └── otp-auth.strategy.ts          # Generates 6-digit OTP, returns code + expiresAt
    │   └── certificate/
    │       ├── cert-strategy.interface.ts    # ICertificateStrategy: generate(data)
    │       ├── json-certificate.strategy.ts  # Generates JSON cert payload with verificationId
    │       └── pdf-certificate.strategy.ts   # Generates PDF cert buffer (pdf-lib) with verificationId
    │
    ├── modules/                    # Complex cross-cutting modules (Facade pattern)
    │   └── gemini/                 # AI Course Generation Facade
    │       ├── gemini.service.ts   # Entry point: generateCourse(prompt, userId)
    │       ├── handlers/           # Mediator handler for GenerateCourseCommand
    │       │   └── generate-course.handler.ts
    │       └── prompts/            # Prompt template builders
    │           └── course-generation.prompt.ts
    │
    ├── events/                     # Observer / Pub-Sub pattern
    │   ├── event-bus.ts            # Typed in-process EventEmitter singleton
    │   ├── events/                 # Domain event payload definitions
    │   │   ├── course-completed.event.ts     # { userId, courseId, enrollmentId }
    │   │   ├── otp-requested.event.ts        # { email, code }
    │   │   └── certificate-issued.event.ts   # { userId, courseId, certificateId }
    │   └── listeners/              # Event handlers (side-effects, async)
    │       ├── certificate-issued.listener.ts  # On CourseCompletedEvent → call CertificateService
    │       └── otp-email.listener.ts           # On OtpRequestedEvent → send email via Nodemailer
    │
    └── shared/                     # Cross-cutting utilities
        ├── types/                  # Shared TypeScript interfaces & DTOs
        │   ├── auth.types.ts       # SendOtpDTO, VerifyOtpDTO, AuthResponseDTO
        │   ├── course.types.ts     # CreateCourseDTO, CourseResponseDTO
        │   ├── enrollment.types.ts # EnrollCourseDTO, EnrollmentResponseDTO
        │   ├── assessment.types.ts # SubmitQuizDTO, QuizResultDTO
        │   └── api.types.ts        # ApiResponse<T> envelope type
        ├── errors/                 # Custom domain error classes
        │   ├── app-error.ts        # Base: AppError extends Error + statusCode
        │   ├── not-found.error.ts  # NotFoundError(404)
        │   ├── unauthorized.error.ts # UnauthorizedError(401)
        │   ├── forbidden.error.ts  # ForbiddenError(403)
        │   └── bad-request.error.ts # BadRequestError(400)
        ├── response/               # Factory: standardized ApiResponse envelope
        │   └── api-response.ts     # ApiResponse.success(data) / ApiResponse.error(msg)
        └── utils/                  # Pure utility functions
            └── helpers.ts          # generateOtp(), expiresInMinutes(), calcProgressPercent()
```

---

## 4. CRUD Flow Walkthroughs

### 4.1 Flow 1: OTP Authentication

```
[ Client ] ──► POST /api/auth/send-otp ──► auth.routes.ts ──► AuthController.sendOtp
                                                                        │
                                                                        ▼
                                                              SendOtpCommand { email }
                                                                        │
                                                                        ▼
                                                                    Mediator
                                                                        │
                                                                        ▼
                                                              SendOtpCommandHandler
                                                                        │
                                           ┌────────────────────────────┴──────────────────────────────┐
                                           ▼                                                           ▼
                                  OtpAuthStrategy                                           AuthRepository
                              (generates 6-digit OTP                                  (saves OtpCode record
                               + returns expiresAt)                                    in DB via Prisma)
                                           │
                                           ▼
                                  AuthService.requestOtp()
                                  (sends email via Nodemailer)
```

**Step-by-step:**
1. **Client Request**: `POST /api/auth/send-otp` with `{ "email": "learner@perpetua.com" }`
2. **Route**: `auth.routes.ts` validates body schema using Zod + `fastify-type-provider-zod`
3. **Controller**: `AuthController.sendOtp()` instantiates `SendOtpCommand({ email })` → dispatches to Mediator
4. **Handler**: `SendOtpCommandHandler` calls `OtpAuthStrategy.generateAndSend()` to create 6-digit OTP + expiry
5. **Repository**: `AuthRepository.saveOtp(email, code, expiresAt)` → `prisma.otpCode.create(...)`
6. **Email**: `AuthService` dispatches Nodemailer email to the user

**Verify OTP (`POST /api/auth/verify-otp`)**:
1. `VerifyOtpCommandHandler` fetches latest OTP record via `AuthRepository.findLatestOtp(email, code)`
2. Validates `expiresAt > now()` and code matches
3. Upserts `User` record via `UserRepository`
4. Issues JWT bearer token with `{ userId, role }` payload
5. Returns `{ token, user }` to client

---

### 4.2 Flow 2: Designer Course Creation & Publishing

1. **Auth Guard**: `plugins/auth.plugin.ts` verifies JWT → populates `req.user = { id, role }`
2. **Role Guard**: Route attaches `requireRole('DESIGNER')` preHandler via `middlewares/role.middleware.ts`
3. **Controller**: `CoursesController.createCourse()` extracts `request.body` → dispatches `CreateCourseCommand`
4. **Handler**: `CreateCourseCommandHandler` executes inside a Prisma transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const course = await courseRepository.create(courseData, tx);
     for (const mod of modules) {
       const module = await moduleRepository.create(mod, course.id, tx);
       await chapterRepository.createMany(mod.chapters, module.id, tx);
     }
     return course;
   });
   ```
5. **Publish**: `PATCH /api/designer/courses/:id/publish` → `PublishCourseCommand` → `CourseService.publish()` validates at least 1 module + 1 chapter exist before transitioning `DRAFT → PUBLISHED`

---

### 4.3 Flow 3: Learner Enrollment & Progress Tracking

**Enrollment (`POST /api/learner/enroll`)**:
1. `EnrollCourseCommandHandler` calls `EnrollmentService.enroll(courseId, userId)`:
   - Verifies `Course.status === PUBLISHED`
   - Checks no existing enrollment via `EnrollmentRepository.findByUserAndCourse()`
   - Creates enrollment with `progressPercent: 0.0`

**Progress Update (`PATCH /api/learner/enrollments/:id/progress`)**:
1. `UpdateProgressCommand { enrollmentId, completedChapters, totalChapters }`
2. `EnrollmentService.updateProgress()` calculates:

   $$\text{progressPercent} = \left( \frac{\text{completedChapters}}{\text{totalChapters}} \right) \times 100$$

3. `EnrollmentRepository.updateProgress(enrollmentId, percent)` → updates DB record
4. **If `progressPercent === 100`**: `EnrollmentService` emits `CourseCompletedEvent` via `eventBus`
5. **`CertificateIssuedListener`** catches event → calls `CertificateService.generateCertificate()`

---

### 4.4 Flow 4: Assessment / Quiz Evaluation & Scoring

1. **Client Request**: Learner submits to `POST /api/quizzes/:id/submit`:
   ```json
   {
     "userId": "user-123",
     "answers": [
       { "questionId": "q1", "selectedOptionIndex": 2 },
       { "questionId": "q2", "selectedOptionIndex": 0 }
     ]
   }
   ```
2. **Controller**: dispatches `SubmitQuizCommand { quizId, userId, answers }`
3. **Handler → AssessmentService**:
   - Fetches quiz questions + options (with `isCorrect` flags) via `AssessmentRepository.findWithAnswers(quizId)`
   - Compares submitted option indices against `isCorrect === true`
   - Calculates:
     $$\text{Score\%} = \left( \frac{\text{Correct Answers}}{\text{Total Questions}} \right) \times 100$$
4. **Response**: `{ scorePercent: 85.0, passed: true, totalQuestions: 4, correctCount: 3 }`

---

### 4.5 Flow 5: Certificate Auto-Generation

```
CourseCompletedEvent { userId, courseId, enrollmentId }
        │
        ▼  (published by EnrollmentService when progress = 100%)
  event-bus.ts (EventEmitter)
        │
        ▼  (received by listener)
  certificate-issued.listener.ts
        │
        ▼
  CertificateService.generateCertificate(userId, courseId, format = 'PDF')
        │
        ├── fetches User name from UserRepository
        ├── fetches Course title from CourseRepository
        ├── resolves the Strategy by `format`  ← Strategy Pattern
        │     ├── format === 'JSON' → JsonCertificateStrategy.generate(data)
        │     │      → produces { verificationId, payload }
        │     └── format === 'PDF'  → PdfCertificateStrategy.generate(data)
        │            → produces { verificationId, fileBuffer }
        └── CertificateRepository.create(...)
              ├── JSON → saves `payload` (jsonb) to `certificates` table
              └── PDF  → uploads `fileBuffer`, saves `fileUrl` to `certificates` table
```

**Step-by-step:**
1. `EnrollmentService` emits `CourseCompletedEvent` once `progressPercent` hits 100
2. `certificate-issued.listener.ts` receives it and calls `CertificateService.generateCertificate(userId, courseId)`
3. `CertificateService` looks up the User and Course, then picks a Strategy based on the requested/default `format` — this is the swap point the Strategy pattern exists for, so adding a third format later never touches this branching logic itself, only the resolver's lookup table
4. The chosen Strategy returns a `verificationId` plus either a JSON `payload` or a PDF `fileBuffer`
5. `CertificateRepository.create()` persists the record — a JSON certificate stores its `payload` inline; a PDF certificate stores the generated file and records its `fileUrl`
6. `CertificateIssuedEvent { userId, courseId, certificateId }` fires so other listeners (e.g. "email the certificate") can react

Learner can then access: `GET /api/certificates/:userId` and verify via `GET /api/certificates/verify/:verificationId`

---

## 5. Plugin Architecture

**Location:** `src/plugins/`

Plugins are Fastify lifecycle hooks registered globally in `app.ts`. They run before every request hits a route handler.

| Plugin | Hook | Purpose |
| :--- | :--- | :--- |
| `cors.plugin.ts` | `onRequest` | Attaches CORS headers for frontend access |
| `auth.plugin.ts` | `preHandler` | Calls `request.jwtVerify()` → populates `request.user` |
| `swagger.plugin.ts` | `onReady` | Serves OpenAPI spec at `/docs` |
| `error-handler.plugin.ts` | `setErrorHandler` | Maps `AppError` subclasses to HTTP status codes; catches Zod validation errors |

**Registration order in `app.ts`:**
```typescript
// 1. CORS (must be first for preflight requests)
app.register(corsPlugin);
// 2. JWT plugin (enables app.jwtVerify())
app.register(jwtPlugin, { secret: env.JWT_SECRET });
// 3. Swagger (must register before routes)
app.register(swaggerPlugin);
// 4. Global error handler
app.setErrorHandler(globalErrorHandler);
// 5. Domain routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(coursesRoutes, { prefix: '/api' });
// ...
```

---

## 6. Event System

**Location:** `src/events/`

The Observer / Pub-Sub pattern enables loose coupling between domain services and their side-effects (emails, certificate generation, notifications).

```
src/events/
├── event-bus.ts          # Singleton typed EventEmitter
├── events/               # Event payload type definitions
│   ├── course-completed.event.ts
│   ├── otp-requested.event.ts
│   └── certificate-issued.event.ts
└── listeners/            # Side-effect handlers
    ├── certificate-issued.listener.ts
    └── otp-email.listener.ts
```

**Usage:**
```typescript
// In EnrollmentService (publish)
eventBus.emit(DomainEvents.COURSE_COMPLETED, { userId, courseId, enrollmentId });

// In certificate-issued.listener.ts (subscribe — registered at app startup)
eventBus.on(DomainEvents.COURSE_COMPLETED, async (payload) => {
  await certificateService.generateCertificate(payload.userId, payload.courseId);
});
```

This means `EnrollmentService` never imports `CertificateService` — zero coupling between domains.

---

## 7. Database Architecture & Migration Strategy

Perpetua uses **PostgreSQL** (Docker: `pgvector/pgvector:pg16` on port `5433`) managed by **Prisma ORM**.

```
┌───────────────────────────────────────────────────┐
│              Docker Host / Local OS               │
│                                                   │
│   ┌─────────────────────────────────────────┐     │
│   │  Docker Container (perpetua_db)         │     │
│   │  Image: pgvector/pgvector:pg16          │     │
│   │  Port: 5433:5432                        │     │
│   │  Database: postgres                     │     │
│   └──────────────────▲──────────────────────┘     │
└──────────────────────│───────────────────────────┘
                       │ (TCP Connection via DATABASE_URL)
┌──────────────────────│───────────────────────────┐
│  Fastify Backend Process                         │
│                                                   │
│   ┌───────────────────────────────────────────┐   │
│   │  PrismaClient  (src/db/prisma.ts)         │   │
│   │  Singleton — shared across all repos      │   │
│   └───────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

### Prisma Domain Models

| Model | Table | Key Relations |
| :--- | :--- | :--- |
| `User` | `users` | Has many `Enrollment`, `Certificate`, `OtpCode`, `Course` |
| `Course` | `courses` | Has many `Module`; belongs to `User` (designer) |
| `Module` | `modules` | Has many `Chapter`, `Quiz`; belongs to `Course` |
| `Chapter` | `chapters` | Belongs to `Module` |
| `Quiz` | `quizzes` | Has many `Question`; belongs to `Module` |
| `Question` | `questions` | Has many `Option`; belongs to `Quiz` |
| `Enrollment` | `enrollments` | Belongs to `User` + `Course`; tracks `progressPercent` |
| `Certificate` | `certificates` | Belongs to `User` + `Course`; has `verificationId`, `format` (`JSON` \| `PDF`), plus `payload` (used when `format = JSON`) or `fileUrl` (used when `format = PDF`) |
| `OtpCode` | `otp_codes` | Belongs to `User`; has `expiresAt` |

### Migration Workflow

1. **Single Source of Truth**: All schema changes start in `prisma/schema.prisma`
2. **Development**: `npx prisma migrate dev --name <descriptive_name>`
   - Generates immutable `.sql` file in `prisma/migrations/`
   - Applies migration to Docker PostgreSQL
   - Auto-runs `prisma generate` to update TypeScript types
3. **Production**: `npx prisma migrate deploy` — applies pending migrations without data loss

---

## 8. How This Stays Extensible

1. **Adding a New Domain (e.g., Payments)**:
   - Add `PaymentService` in `src/services/`
   - Add `PaymentRepository` in `src/repositories/`
   - Add `CreatePaymentCommand` in `src/mediator/commands/payments/`
   - Add `payments.routes.ts` in `src/routes/`
   - Add `PaymentsController` in `src/controllers/`
   - Register route in `app.ts` with `{ prefix: '/api/payments' }`
   - **Zero changes** to any existing domain code

2. **Adding a New Auth Strategy (e.g., Google OAuth)**:
   - Implement `GoogleOAuthStrategy` in `src/strategies/auth/`
   - Swap strategy in `SendOtpCommandHandler` — no other code changes
   - The `IAuthStrategy` interface is the contract

3. **Replacing Gemini with OpenAI**:
   - Add `openai.adapter.ts` in `src/modules/gemini/`
   - Update `gemini.service.ts` to use the new adapter
   - All routes, controllers, and mediator handlers remain unchanged

4. **Adding a Third Certificate Format (e.g., Blockchain-Verified)**:
   - `PdfCertificateStrategy` already ships alongside `JsonCertificateStrategy` in `src/strategies/certificate/`, selected by `CertificateService` via the `format` parameter
   - Implement `BlockchainCertificateStrategy` against the same `ICertificateStrategy` interface
   - Register it in `CertificateService`'s strategy resolver — `JsonCertificateStrategy` and `PdfCertificateStrategy` remain untouched

5. **Multi-Role Expansion (e.g., INSTRUCTOR role)**:
   - Add `INSTRUCTOR` to the `Role` enum in `prisma/schema.prisma`
   - Update `requireRole()` calls in affected route preHandlers
   - All other layers remain untouched
