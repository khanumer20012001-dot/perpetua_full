import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../shared/errors/custom-errors';
import { env } from '../config/env.config';

export const authPlugin = fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new UnauthorizedError('Invalid or missing JWT token');
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
