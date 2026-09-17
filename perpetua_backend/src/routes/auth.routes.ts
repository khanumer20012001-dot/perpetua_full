import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authController } from '../controllers/auth.controller';

export const authRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/send-otp',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      return authController.requestOtp(request, reply);
    }
  );

  server.post(
    '/request-otp',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      return authController.requestOtp(request, reply);
    }
  );

  server.post(
    '/verify-otp',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          code: z.string().length(6),
        }),
      },
    },
    async (request, reply) => {
      return authController.verifyOtp(request, reply, app.jwt);
    }
  );
};
