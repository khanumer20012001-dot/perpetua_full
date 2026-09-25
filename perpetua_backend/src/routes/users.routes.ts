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

  // Create user
  server.post(
    '/',
    {
      schema: {
        body: z.object({
          fullName: z.string().min(1),
          email: z.string().email(),
          role: z.enum(['LEARNER', 'DESIGNER', 'ADMIN']),
          department: z.string().min(1),
          status: z.enum(['ACTIVE', 'INACTIVE']),
          phoneNumber: z.string().optional(),
          jobTitle: z.string().optional(),
          profileImage: z.string().url().optional(),
        }),
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      return usersController.createUser(request, reply);
    }
  );

  // Get single user
  server.get(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      return usersController.getUser(request, reply);
    }
  );

  // Update user
  server.put(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          fullName: z.string().min(1),
          email: z.string().email(),
          role: z.enum(['LEARNER', 'DESIGNER', 'ADMIN']),
          department: z.string().min(1),
          status: z.enum(['ACTIVE', 'INACTIVE']),
          phoneNumber: z.string().optional(),
          jobTitle: z.string().optional(),
          professionalSummary: z.string().max(500).optional(),
          profileImage: z.string().url().optional(),
        }),
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      return usersController.updateUser(request, reply);
    }
  );

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
