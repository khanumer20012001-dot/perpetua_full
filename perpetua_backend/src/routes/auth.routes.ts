import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import { RequestOtpCommand, RequestOtpCommandHandler } from '../mediator/commands/auth/request-otp.handler';
import { VerifyOtpCommand, VerifyOtpCommandHandler } from '../mediator/commands/auth/verify-otp.handler';
import { authController } from '../controllers/auth.controller';

// Register mediator handlers
mediator.register('RequestOtpCommand', new RequestOtpCommandHandler());
mediator.register('VerifyOtpCommand', new VerifyOtpCommandHandler());

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
