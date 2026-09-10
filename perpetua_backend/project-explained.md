# Perpetua Backend — Complete Architecture & Codebase Walkthrough

> **Overview:** Ye document Perpetua Backend k poore codebase ka detailed, file-by-file walkthrough hai. Yahan har folder, har file, uska main maqsad, design pattern, upstream/downstream connections, aur har domain ka end-to-end execution flow easy-to-understand Roman Urdu + English developer style main explain kiya gaya hai.

---

## 1. High-Level Layered Flow — In One Sentence

Perpetua Backend ka main architecture **Flat Layered CQRS + Mediator Pattern** par base karta hai:

> Jab koi HTTP Request aati hai to wo pehle **Plugins/Middlewares** se filter hoti hai, phir **Route** se hoti wi **Controller** tak poonchti hai. Controller request payload pakad kar ek **Command/Query** banata hai aur **Mediator** ko bhejta hai. Mediator correct **Handler** ko invoke karta hai jo **Service** ki business logic chalata hai, aur Service **Repository** k zariye **Prisma ORM** se PostgreSQL database par safe query run karti hai.

```
[ HTTP Request ]
       │
       ▼
 ┌──────────────────────────────────────────┐
 │  plugins/cors.plugin.ts                 │  ← CORS preflight check
 │  plugins/auth.plugin.ts                 │  ← JWT verify & attach req.user
 │  plugins/error-handler.plugin.ts        │  ← Catch errors & format JSON
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

## 2. Root Config & Bootstrapping Files

### `package.json`
- **One Job:** Project k dependencies, npm scripts, aur metadata manage karta hai.
- **Main Content:** `dev` script (`nodemon --watch src --ext ts --exec "tsx --env-file=.env src/server.ts"`), dependencies like `fastify`, `@fastify/jwt`, `zod`, `@prisma/client`, `pdf-lib`, `nodemailer`.
- **Calls/Called By:** `npm run dev` ya `npm start` se trigger hota hai.

### `tsconfig.json`
- **One Job:** TypeScript compiler ki configurations define karta hai (Strict type checking, Target ES2022, CommonJS module system).
- **Main Content:** `"rootDir": "./src"`, `"outDir": "./dist"`, `"skipLibCheck": true`, `"strict": true`.
- **Calls/Called By:** `npx tsc --noEmit` aur `tsx` execution runner isko use karte hain.

### `.env` & `.env.example`
- **One Job:** Database URLs, JWT secrets, SMTP credentials, aur port numbers securely environment variables main set karte hain.
- **Main Content:** `DATABASE_URL`, `JWT_SECRET`, `PORT=8000`, `SMTP_EMAIL`, `SMTP_PASSWORD`.
- **Calls/Called By:** `src/config/env.config.ts` se load hote hain.

### `docker-compose.yml`
- **One Job:** Local development k liye PostgreSQL (pgvector/pg16) database container run karta hai on port `5433`.
- **Main Content:** PostgreSQL container configuration, port mapping `5433:5432`, environment credentials.
- **Calls/Called By:** `docker compose up -d` se PostgreSQL DB live ho jata hai.

### `src/server.ts`
- **One Job:** Backend application ka main Entry Point hai jo HTTP server ko port 8000 par listen karwata hai.
- **Main Content:** `app.listen({ port: env.PORT, host: '0.0.0.0' })`, error handling, graceful shutdown.
- **Calls/Called By:** Node process `tsx src/server.ts` isy sab se pehle execute karta hai. Downstream `app.ts` ko import karta hai.

### `src/app.ts`
- **One Job:** Fastify instance create karta hai, global plugins/error handlers register karta hai, aur 7 main domain routes mount karta hai.
- **Main Content:** Fastify app initialization, `setErrorHandler(globalErrorHandler)`, plugin registrations (`cors`, `auth`, `swagger`), route prefix mounts (`/api/auth`, `/api/designer`, `/api/learner`, `/api/quizzes`, `/api/certificates`, `/api/gemini`, `/api/users`).
- **Calls/Called By:** `server.ts` isey call karta hai. Ye `config/`, `plugins/`, aur sare `routes/` files ko import karta hai.

### `src/config/env.config.ts`
- **One Job:** Environment variables ko safely load aur validate karta hai taake missing `.env` parameters server crash honay se pehle hi catching mein aa jayen.
- **Design Pattern:** **Singleton** — ek baar env parse ho kar global export ho jata hai.
- **Upstream/Downstream:** `app.ts`, `server.ts`, `auth.plugin.ts` isey import karte hain.

### `src/config/logger.config.ts`
- **One Job:** Fastify k built-in Pino logger ki formatting environment k hisab se set karta hai.
- **Upstream/Downstream:** `app.ts` main Fastify options main pass hota hai.

### `src/plugins/cors.plugin.ts`
- **One Job:** `@fastify/cors` plugin wrapping jo frontend web/mobile apps k cross-origin HTTP requests ko allow karti hai.
- **Design Pattern:** **Fastify Plugin** wrapper via `fastify-plugin` (`fp`).

### `src/plugins/auth.plugin.ts`
- **One Job:** `@fastify/jwt` ko register karta hai aur `fastify.authenticate` decorator function export karta hai jo incoming JWT bearer token ko verify karke `request.user` set karta hai.
- **Design Pattern:** **Fastify Plugin** + Decorator.

### `src/plugins/swagger.plugin.ts`
- **One Job:** `@fastify/swagger` aur `@fastify/swagger-ui` register karta hai taake interactive API documentation `/docs` endpoint par live accessible ho.
- **Design Pattern:** **Fastify Plugin**.

### `src/plugins/error-handler.plugin.ts`
- **One Job:** Global error handler function (`globalErrorHandler`) jo `AppError` subclasses, Fastify validation errors, aur uncaught errors ko handle karke standardized JSON response banata hai.
- **Upstream/Downstream:** `app.ts` main `app.setErrorHandler()` par pass hota hai.

---

## 3. Domain-by-Domain Codebase Walkthrough

---

### Domain 1: Auth (Authentication & OTP)

#### `src/routes/auth.routes.ts`
- **Maqsad:** `POST /api/auth/send-otp`, `POST /api/auth/request-otp`, aur `POST /api/auth/verify-otp` endpoints define karta hai with Zod request body schemas.
- **Connections:** Mediator handlers ko register karta hai aur requests `authController` ko bhejta hai.

#### `src/controllers/auth.controller.ts`
- **Maqsad:** HTTP Controller jo request body se email aur OTP code parhta hai, `RequestOtpCommand` ya `VerifyOtpCommand` create karke `mediator.send()` ko deta hai, aur verify hone par Fastify JWT sign karke token + user profile return karta hai.
- **Design Pattern:** Controller layer (Zero business logic, zero DB calls).

#### `src/mediator/commands/auth/request-otp.handler.ts` & `verify-otp.handler.ts` & `auth.commands.ts`
- **Maqsad:** `RequestOtpCommand` aur `VerifyOtpCommand` classes and unke discrete Handlers (`RequestOtpCommandHandler`, `VerifyOtpCommandHandler`).
- **Design Pattern:** **Mediator Command Pattern** — Command data carrier hai, Handler service execution karta hai.

#### `src/services/auth.service.ts`
- **Maqsad:** Asal OTP business logic. OTP generate karna (`OtpAuthStrategy`), Nodemailer se email bhej na, expiry check karna, DB main `User` record upsert (create if not exists) karna.
- **Upstream/Downstream:** Called by Mediator Handlers. Calls `AuthRepository`, `UserRepository`, and `OtpAuthStrategy`.

#### `src/repositories/auth.repository.ts`
- **Maqsad:** `otp_codes` table par Prisma queries run karna (`saveOtp`, `findLatestOtp`, `deleteOtp`).
- **Design Pattern:** **Repository Pattern** — Encapsulates Prisma DB queries.

#### `src/strategies/auth/auth-strategy.interface.ts` & `otp-auth.strategy.ts`
- **Maqsad:** `IAuthStrategy` interface define karta hai aur `OtpAuthStrategy` 6-digit random code generate karne aur 10-minute expiration calculate karne ka algorithm implementation karta hai.
- **Design Pattern:** **Strategy Pattern** — Future main Password Auth ya OAuth (Google) add karna bilkul seamless ho jaye.

> **End-to-End Recap (Auth Flow):**  
> Client `POST /api/auth/send-otp` par email bhejta hai. Route validate kar k `AuthController.requestOtp` ko deta hai. Controller `RequestOtpCommand` Mediator ko bhejta hai. Mediator `RequestOtpCommandHandler` chalata hai jo `AuthService.requestOtp` call karta hai. Service `OtpAuthStrategy` se 6-digit code banwati hai, `AuthRepository` k zariye `otp_codes` DB table main save karti hai, aur user ko email bhejti hai. Jab user verify karta hai to `VerifyOtpCommand` se OTP matching & expiry verify hoti hai, `UserRepository` user ko insert/update karta hai, aur controller signed JWT bearer token client ko wapis bhej deta hai.

---

### Domain 2: Users (User Profiles & Roles)

#### `src/routes/users.routes.ts`
- **Maqsad:** `GET /api/users` aur `PATCH /api/users/:user_id/role` endpoints map karta hai.

#### `src/controllers/users.controller.ts`
- **Maqsad:** Request parse karke `ListUsersQuery` ya `UpdateUserRoleCommand` create karke Mediator ko dispatcher karta hai.

#### `src/mediator/queries/users/list-users.handler.ts` & `users.queries.ts` & `commands/users/update-user-role.handler.ts`
- **Maqsad:** User queries (`ListUsersQuery`) aur commands (`UpdateUserRoleCommand`) aur unke handlers jo `UsersService` ko invoke karte hain.

#### `src/services/users.service.ts`
- **Maqsad:** All users fetch karna aur User ka role update karna (`LEARNER` ↔ `DESIGNER` ↔ `ADMIN`).

#### `src/repositories/user.repository.ts`
- **Maqsad:** Prisma queries on `users` table (`findMany`, `findById`, `findByEmail`, `updateRole`, `create`).

> **End-to-End Recap (Users Flow):**  
> Admin ya client jab `PATCH /api/users/:id/role` hit karta hai body `{ role: "DESIGNER" }` k sath, to controller `UpdateUserRoleCommand` Mediator ko bhejta hai. Mediator `UpdateUserRoleCommandHandler` chalata hai jo `UsersService.updateUserRole` call karta hai. Service `UserRepository.updateRole` run karke PostgreSQL DB main `users` table ka role update karti hai aur updated profile return ho jata hai.

---

### Domain 3: Courses (Designer & Learner Course Management)

#### `src/routes/courses.routes.ts`
- **Maqsad:** Designer endpoints (`POST /api/designer/courses`, `POST /api/designer/courses/:id/modules`, `POST /api/designer/modules/:id/chapters`, `POST /api/designer/courses/full`) aur Learner endpoints (`GET /api/learner/courses`, `GET /api/learner/courses/:id`) define karta hai.

#### `src/controllers/courses.controller.ts`
- **Maqsad:** Body aur route parameters unpack karke `CreateCourseCommand`, `CreateModuleCommand`, `CreateChapterCommand`, `CreateFullCourseCommand`, `GetPublishedCoursesQuery`, ya `GetCourseDetailQuery` Mediator main dispatch karta hai.

#### `src/mediator/commands/courses/course.handlers.ts` & `courses.commands.ts` & `queries/courses/courses.queries.ts`
- **Maqsad:** Course creation/publishing commands and queries along with their registered Handlers.

#### `src/services/courses.service.ts`
- **Maqsad:** Course business validation (e.g. course publish karne se pehle check karna k 1 module aur 1 chapter exist kare, total duration calculate karna, modules/chapters cascade handles).

#### `src/repositories/courses.repository.ts`
- **Maqsad:** Prisma transactional writes (`prisma.$transaction`) across `courses`, `modules`, `chapters` tables.

> **End-to-End Recap (Courses Flow):**  
> Designer `POST /api/designer/courses` call karke title & description bhejta hai. Controller `CreateCourseCommand` Mediator ko bhejta hai. Mediator handler `CoursesService.createCourse` invoke karta hai jo `CoursesRepository.createCourse` ke zariye DB main `DRAFT` status k sath course record write karta hai. Jab designer modules aur chapters add karke publish request karta hai to service validation k baad DB status `DRAFT → PUBLISHED` update ho jata hai.

---

### Domain 4: Enrollments (Course Enrollment & Progress)

#### `src/routes/enrollments.routes.ts`
- **Maqsad:** `POST /api/learner/courses/:course_id/enroll`, `GET /api/learner/enrollments/:user_id`, aur `GET /api/learner/dashboard/:user_id` map karta hai.

#### `src/controllers/enrollments.controller.ts`
- **Maqsad:** Learner requests parse karke `EnrollCourseCommand`, `GetUserEnrollmentsQuery`, ya `GetDashboardStatsQuery` Mediator par dispatch karta hai.

#### `src/mediator/commands/enrollments/enrollment.handlers.ts` & `enrollments.commands.ts` & `queries/enrollments/enrollments.queries.ts`
- **Maqsad:** Enrollment write & read handlers.

#### `src/services/enrollment.service.ts`
- **Maqsad:** Check karna k course `PUBLISHED` hai ya nahi, double-enrollment prevent karna, initial progress 0% set karna, progress calculation algorithm chalana, aur progress 100% hone par domain event emit karna.

#### `src/repositories/enrollment.repository.ts`
- **Maqsad:** `enrollments` table par Prisma CRUD queries (`create`, `findByUserAndCourse`, `updateProgress`, `getUserEnrollments`).

> **End-to-End Recap (Enrollments Flow):**  
> Learner course page par "Enroll" button click karta hai (`POST /api/learner/courses/:id/enroll`). Route validation k baad controller `EnrollCourseCommand` Mediator ko bhejta hai. Handler `EnrollmentService.enroll` chalata hai jo verify karta hai k course published hai aur student pehle se enrolled nahi hai. Phir `EnrollmentRepository` DB main new enrollment record creates karta hai. Jab student progress 100% tak poonchata hai to service automatically domain event raise kar deti hai.

---

### Domain 5: Quizzes / Assessments

#### `src/routes/quizzes.routes.ts`
- **Maqsad:** `GET /api/quizzes/:assessment_id` (quiz questions fetch karna) aur `POST /api/quizzes/:assessment_id/submit` (answers submit karna) endpoints map karta hai.

#### `src/controllers/quizzes.controller.ts`
- **Maqsad:** Request parse karke `GetQuizQuery` ya `SubmitQuizCommand` Mediator ko bhejta hai.

#### `src/mediator/commands/assessments/quiz.handlers.ts` & `assessments.commands.ts`
- **Maqsad:** Quiz fetch aur submission Command/Query handlers.

#### `src/services/assessment.service.ts`
- **Maqsad:** Answer evaluation algorithm: learner k submitted option IDs ko DB k `isCorrect=true` flags se compare karna, score percentage calculate karna, pass/fail result nikalna (70% passing threshold), aur pass hone par enrollment progress 100% mark karna.

#### `src/repositories/assessment.repository.ts`
- **Maqsad:** `assessments`, `questions`, `options` tables se relation queries run karna.

> **End-to-End Recap (Quiz Flow):**  
> Learner quiz submit karta hai (`POST /api/quizzes/:id/submit`). Controller `SubmitQuizCommand` Mediator main bhejta hai. Handler `QuizzesService.submitQuiz` call karta hai. Service DB se correct answers fetch karke comparison karti hai: `(Correct Answers / Total Questions) * 100`. Agar score ≥ 70% ho to quiz `passed: true` return karta hai aur auto-enrollment completion update shuru ho jata hai.

---

### Domain 6: Certificates (JSON & Real PDF Auto-Generation)

#### `src/routes/certificates.routes.ts`
- **Maqsad:** `POST /api/certificates` & `POST /api/certificates/issue` (certificate issue karna in JSON or PDF format) aur `GET /api/certificates/:user_id` (user k sare certificates fetch karna) map karta hai.

#### `src/controllers/certificates.controller.ts`
- **Maqsad:** Request payload parse karke `IssueCertificateCommand` ya `GetUserCertificatesQuery` Mediator ko bhejta hai.

#### `src/mediator/commands/certificates/issue-certificate.handler.ts`
- **Maqsad:** Certificate issuance & retrieval handlers.

#### `src/services/certificate.service.ts`
- **Maqsad:** Verify karna k course 100% completed hai, duplicate certificate prevent karna, requested format (`JSON` vs `PDF`) k mutabiq Strategy pick karna, result DB main save karwana, aur certificate response build karna.

#### `src/repositories/certificate.repository.ts`
- **Maqsad:** `certificates` table par CRUD (`createCertificate`, `findCertificate`, `findCertificatesByUserId`).

#### `src/strategies/certificate/cert-strategy.interface.ts`, `json-certificate.strategy.ts`, & `pdf-certificate.strategy.ts`
- **Maqsad:** `ICertificateStrategy` contract implement karte hain. `JsonCertificateStrategy` JSON payload & verification ID generate karta hai. `PdfCertificateStrategy` `pdf-lib` engine se real PDF binary graphics create karke `uploads/certificates/` directory main `.pdf` file write karta hai.
- **Design Pattern:** **Strategy Pattern** — Certificate generation formats ko modular and pluggable rakhta hai.

> **End-to-End Recap (Certificates Flow):**  
> Student request bhejta hai `POST /api/certificates` `{ format: "PDF" }`. Controller `IssueCertificateCommand` Mediator ko bhejta hai. Handler `CertificatesService.issueCertificate` ko call karta hai. Service checks k banda 100% progress par hai, phir `PdfCertificateStrategy` execute hoti hai jo `pdf-lib` vector engine se real PDF page build karke disk file `uploads/certificates/cert_...pdf` banati hai. DB record save hota hai aur PDF download URL response main wapis chala jata hai.

---

### Domain 7: Gemini (AI Course Generation Facade)

#### `src/routes/gemini.routes.ts`
- **Maqsad:** `POST /api/gemini/generate-course` endpoint define karta hai.

#### `src/controllers/gemini.controller.ts`
- **Maqsad:** Request se prompt text aur user ID lekar `GenerateAiCourseCommand` Mediator ko bhejta hai.

#### `src/modules/gemini/handlers/generate-course.handler.ts`
- **Maqsad:** Mediator handler jo `GeminiService` Facade ko invoke karta hai.

#### `src/modules/gemini/prompts/course-generation.prompt.ts`
- **Maqsad:** Gemini LLM k liye structured JSON prompt template construct karta hai.

#### `src/modules/gemini/gemini.service.ts`
- **Maqsad:** Gemini API call karta hai, raw text JSON parse karta hai, aur automatically `CoursesService` & `CoursesRepository` k zariye poora course structure (Course + Modules + Chapters + Quiz) database main insert kar deta hai.
- **Design Pattern:** **Facade Pattern** — AI prompt engineering, external API calls, and course creation coordination ko ek simple entry point k peechay hide karta hai.

> **End-to-End Recap (Gemini Flow):**  
> Designer prompt bhejta hai "Build a 3-module Flutter course". Request `GeminiController` → Mediator → `GenerateAiCourseCommandHandler` → `GeminiService` Facade tak jati hai. Service prompt template banati hai, Gemini API se full JSON response leti hai, parse kar ke nested database transaction chalati hai, aur complete ready-to-publish course create karke return kar deti hai.

---

## 4. Cross-Cutting Concerns & Shared Utilities

### `src/middlewares/role.middleware.ts`
- **Maqsad:** Role-based access control factory (`requireRole('DESIGNER')`, `requireRole('ADMIN')`). Check karta hai k `request.user.role` allowed roles list main hai ya nahi, varna 403 Forbidden Error throw karta hai.
- **Design Pattern:** Middleware / Route Guard.

### `src/events/event-bus.ts`
- **Maqsad:** Node.js EventEmitter par base karta hua in-process typed Event Bus singleton.
- **Design Pattern:** **Observer / Pub-Sub Pattern** — Decouples event publishers (e.g. `EnrollmentService`) from listeners (e.g. email notifications, badge awards) without direct code dependency.

### `src/shared/errors/custom-errors.ts`
- **Maqsad:** Base `AppError` class aur HTTP-specific domain error classes (`NotFoundError`(404), `UnauthorizedError`(401), `ForbiddenError`(403), `BadRequestError`(400)).
- **Upstream/Downstream:** Har Service aur Plugin throws in errors ko karta hai, aur `error-handler.plugin.ts` automatically intercept karke standard HTTP JSON response deta hai.

### `src/shared/response/api-response.ts`
- **Maqsad:** Standardized API JSON envelope builder (`ApiResponse.success(data)`, `ApiResponse.error(message)`).
- **Design Pattern:** **Factory Pattern**.

### `src/shared/types/*.types.ts`
- **Maqsad:** Domain-specific DTO interfaces (`auth.types.ts`, `course.types.ts`, `enrollment.types.ts`, `assessment.types.ts`, `certificate.types.ts`, `users.types.ts`).
- **Calls/Called By:** Controllers, Services, aur Repositories isey type-safety k liye use karte hain.

### `src/shared/utils/helpers.ts`
- **Maqsad:** Pure utility functions: random OTP string generator, progress percentage calculator, date expirations.

### `src/db/prisma.ts`
- **Maqsad:** Single shared `PrismaClient` instance initialize karta hai aur connection lifecycle manage karta hai.
- **Design Pattern:** **Singleton Pattern** — Database connection pool reuse and memory leaks prevention k liye single instance use hoti hai.

### `src/types/otp-generator.d.ts`
- **Maqsad:** Third-party module `otp-generator` ki ambient TypeScript type definitions declare karta hai taake compiler type errors na de.

### `prisma/schema.prisma`
- **Maqsad:** Project ka single-source-of-truth database schema. PostgreSQL models define karta hai: `User`, `Course`, `Module`, `Chapter`, `Assessment`, `Question`, `Option`, `Enrollment`, `Certificate`, `OtpCode`.

---

## 5. Complete Summary Table of Design Patterns

| Pattern | Location | Purpose in Perpetua |
| :--- | :--- | :--- |
| **Mediator** | `src/mediator/` | Controller aur Service layer k darmian loose coupling banata hai by dispatching Commands & Queries. |
| **Repository** | `src/repositories/` | Prisma ORM queries ko domain interfaces k peeche encapsulate karta hai. |
| **Strategy** | `src/strategies/` | Pluggable algorithms: Auth Strategies (`OtpAuthStrategy`), Certificate Strategies (`JsonCertificateStrategy`, `PdfCertificateStrategy`). |
| **Facade** | `src/modules/gemini/` | Complex AI prompt engineering and API logic ko ek simple `GeminiService` facade k peechay chhupata hai. |
| **Singleton** | `src/db/prisma.ts`, `src/config/env.config.ts` | Global shared instances (Prisma Client connection pool, validated env config). |
| **Observer / Pub-Sub** | `src/events/event-bus.ts` | Event-driven decoupled communication for domain events. |
| **Factory** | `src/shared/response/api-response.ts` | Uniform `ApiResponse` envelope creation across all endpoints. |
