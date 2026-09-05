import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { prisma } from './db/prisma';

// Import routes
import { designerRoutes } from './routes/designer';
import { learnerRoutes } from './routes/learner';
import { quizRoutes } from './routes/quiz';
import { certificateRoutes } from './routes/certificate';
import { authRoutes } from './routes/auth';
import { geminiRoutes } from './routes/gemini';

const server = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>();

// Configure Zod for validation
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// Register Swagger
server.register(swagger, {
  openapi: {
    info: {
      title: 'Perpetua API',
      description: 'API for Perpetua Learning Platform',
      version: '1.0.0'
    },
  },
  transform: jsonSchemaTransform,
});

server.register(swaggerUi, {
  routePrefix: '/docs',
});

// Register plugins
server.register(cors, {
  origin: true,
  credentials: true
});

server.register(import('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'super-secret'
});

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });

// Health check
server.get('/health', async () => {
  return { status: 'healthy', message: 'Fastify is running extremely fast!' };
});

// Register routes
server.register(designerRoutes, { prefix: '/api/designer' });
server.register(learnerRoutes, { prefix: '/api/learner' });
server.register(quizRoutes, { prefix: '/api/quizzes' });
server.register(certificateRoutes, { prefix: '/api/certificates' });
server.register(geminiRoutes, { prefix: '/api/gemini' });

// Graceful shutdown
const start = async () => {
  try {
    await server.listen({ port: 8000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
