import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../shared/errors/custom-errors';

type Role = 'LEARNER' | 'DESIGNER' | 'ADMIN';

/**
 * Role-based access guard factory (preHandler hook)
 * Usage: { preHandler: [authenticate, requireRole('DESIGNER')] }
 */
export function requireRole(...allowedRoles: Role[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const user = (request as any).user as { role?: Role };
    if (!user?.role || !allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }
  };
}
