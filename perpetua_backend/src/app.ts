import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';

// Config
import { env } from './config/env.config';
import { loggerConfig } from './config/logger.config';

// Global error handler
import { globalErrorHandler } from './middlewares/error.handler';

// Domain module routes
import { authRoutes } from './modules/auth/auth.routes';
import { designerCourseRoutes, learnerCourseRoutes } from './modules/courses/courses.routes';
import { enrollmentRoutes } from './modules/enrollments/enrollments.routes';
import { quizRoutes } from './modules/quizzes/quizzes.routes';
import { certificateRoutes } from './modules/certificates/certificates.routes';
import { geminiRoutes } from './modules/gemini/gemini.routes';
import { usersRoutes } from './modules/users/users.routes';

// ─── Create Fastify Application Instance ─────────────────────────────────────
const app = Fastify({
  logger: loggerConfig,
}).withTypeProvider<ZodTypeProvider>();

// ─── Zod Type Provider (Validation & Serialization) ──────────────────────────
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.setErrorHandler(globalErrorHandler);

// ─── Swagger / OpenAPI Docs ───────────────────────────────────────────────────
app.register(swagger, {
  openapi: {
    info: {
      title: 'Perpetua API',
      description: 'REST API for the Perpetua Learning Management System',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

// ─── Plugins ──────────────────────────────────────────────────────────────────
app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

app.register(import('@fastify/jwt'), {
  secret: env.JWT_SECRET,
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async () => {
  return { status: 'healthy', uptime: process.uptime() };
});

// ─── Domain Module Routes ─────────────────────────────────────────────────────
app.register(authRoutes, { prefix: '/api/auth' });
app.register(designerCourseRoutes, { prefix: '/api/designer' });
app.register(learnerCourseRoutes, { prefix: '/api/learner' });
app.register(enrollmentRoutes, { prefix: '/api/learner' });
app.register(quizRoutes, { prefix: '/api/quizzes' });
app.register(certificateRoutes, { prefix: '/api/certificates' });
app.register(geminiRoutes, { prefix: '/api/gemini' });
app.register(usersRoutes, { prefix: '/api/users' });

export { app };
