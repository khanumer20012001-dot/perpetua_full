import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../common/errors/custom-errors';

/**
 * JWT Auth Middleware (preHandler hook)
 * Decodes JWT from Authorization header and populates req.user
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Invalid or missing JWT token');
  }
}
