import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../../mediator/mediator';
import { ListUsersQuery, ListUsersQueryHandler } from './handlers/list-users.handler';
import { UpdateUserRoleCommand, UpdateUserRoleCommandHandler } from './handlers/update-user-role.handler';
import { usersController } from './users.controller';

// Register mediator handlers
mediator.register('ListUsersQuery', new ListUsersQueryHandler());
mediator.register('UpdateUserRoleCommand', new UpdateUserRoleCommandHandler());

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
