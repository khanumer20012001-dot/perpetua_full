import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../../mediator/mediator';
import {
  EnrollCourseCommandHandler,
  GetUserEnrollmentsQueryHandler,
  GetDashboardStatsQueryHandler,
} from './handlers/enrollment.handlers';
import { enrollmentsController } from './enrollments.controller';

// Register mediator handlers
mediator.register('EnrollCourseCommand', new EnrollCourseCommandHandler());
mediator.register('GetUserEnrollmentsQuery', new GetUserEnrollmentsQueryHandler());
mediator.register('GetDashboardStatsQuery', new GetDashboardStatsQueryHandler());

export const enrollmentRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Enroll in Course
  server.post(
    '/courses/:course_id/enroll',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
        body: z.object({ user_id: z.string() }),
      },
    },
    async (request, reply) => {
      return enrollmentsController.enroll(request, reply);
    }
  );

  // Get Learner Dashboard Stats
  server.get(
    '/dashboard/:user_id',
    {
      schema: {
        params: z.object({ user_id: z.string() }),
      },
    },
    async (request, reply) => {
      return enrollmentsController.getDashboardStats(request, reply);
    }
  );

  // Get User Enrollments
  server.get(
    '/enrollments/:user_id',
    {
      schema: {
        params: z.object({ user_id: z.string() }),
      },
    },
    async (request, reply) => {
      return enrollmentsController.getUserEnrollments(request, reply);
    }
  );
};
