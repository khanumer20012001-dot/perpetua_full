import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { usersController } from '../controllers/users.controller';

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // List all users
  server.get('/', async (request, reply) => {
    return usersController.listUsers(request, reply);
  });

  // Update user role
  server.patch(
    '/:id/role',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          role: z.enum(['LEARNER', 'DESIGNER', 'ADMIN']),
        }),
      },
    },
    async (request, reply) => {
      return usersController.updateUserRole(request, reply);
    }
  );
};
