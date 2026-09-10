import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../shared/errors/custom-errors';

/**
 * Global error handler — maps all thrown errors to standardized HTTP responses.
 * Registered in app.ts via app.setErrorHandler(globalErrorHandler)
 */
export function globalErrorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error(error);

  // Domain errors (NotFoundError, UnauthorizedError, etc.)
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
    return;
  }

  // Fastify validation errors (Zod schema failures)
  if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
    reply.status((error as any).statusCode).send({
      success: false,
      error: error.message,
    });
    return;
  }

  // Unexpected server errors
  reply.status(500).send({
    success: false,
    error: 'Internal Server Error',
  });
}
