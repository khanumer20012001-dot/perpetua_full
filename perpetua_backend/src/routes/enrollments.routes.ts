import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import {
  EnrollCourseCommandHandler,
  GetUserEnrollmentsQueryHandler,
  GetDashboardStatsQueryHandler,
  UpdateProgressCommandHandler,
} from '../mediator/commands/enrollments/enrollment.handlers';
import { enrollmentsController } from '../controllers/enrollments.controller';

// Register mediator handlers
mediator.register('EnrollCourseCommand', new EnrollCourseCommandHandler());
mediator.register('GetUserEnrollmentsQuery', new GetUserEnrollmentsQueryHandler());
mediator.register('GetDashboardStatsQuery', new GetDashboardStatsQueryHandler());
mediator.register('UpdateProgressCommand', new UpdateProgressCommandHandler());

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

  // Update Course Progress
  server.post(
    '/enrollments/:course_id/progress',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
        body: z.object({ user_id: z.string().optional(), userId: z.string().optional(), progressPercent: z.number() }),
      },
    },
    async (request, reply) => {
      return enrollmentsController.updateProgress(request, reply);
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
