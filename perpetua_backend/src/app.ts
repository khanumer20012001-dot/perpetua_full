import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

// Config
import { env } from './config/env.config';
import { loggerConfig } from './config/logger.config';

// Plugins
import { authPlugin } from './plugins/auth.plugin';
import { corsPlugin } from './plugins/cors.plugin';
import { swaggerPlugin } from './plugins/swagger.plugin';
import { globalErrorHandler } from './plugins/error-handler.plugin';

// Routes
import { authRoutes } from './routes/auth.routes';
import { designerCourseRoutes, learnerCourseRoutes } from './routes/courses.routes';
import { enrollmentRoutes } from './routes/enrollments.routes';
import { quizRoutes } from './routes/quizzes.routes';
import { certificateRoutes } from './routes/certificates.routes';
import { geminiRoutes } from './routes/gemini.routes';
import { usersRoutes } from './routes/users.routes';

// ─── Create Fastify Application Instance ─────────────────────────────────────
const app = Fastify({
  logger: loggerConfig,
}).withTypeProvider<ZodTypeProvider>();

// ─── Zod Type Provider (Validation & Serialization) ──────────────────────────
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.setErrorHandler(globalErrorHandler);

// ─── Plugins ──────────────────────────────────────────────────────────────────
app.register(corsPlugin);
app.register(authPlugin);
app.register(swaggerPlugin);

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
