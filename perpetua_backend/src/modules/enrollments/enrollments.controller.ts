import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../../mediator/mediator';
import {
  EnrollCourseCommand,
  GetUserEnrollmentsQuery,
  GetDashboardStatsQuery,
} from './handlers/enrollment.handlers';

type FastifyReq = FastifyRequest<any>;

export class EnrollmentsController {
  async enroll(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as any;
      const body = (request.body || {}) as any;
      const result = await mediator.send(
        new EnrollCourseCommand(params.course_id, body.user_id)
      );
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async getUserEnrollments(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as any;
      const enrollments = await mediator.send(
        new GetUserEnrollmentsQuery(params.user_id)
      );
      return reply.send(enrollments);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async getDashboardStats(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as any;
      const stats = await mediator.send(new GetDashboardStatsQuery(params.user_id));
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }
}

export const enrollmentsController = new EnrollmentsController();
