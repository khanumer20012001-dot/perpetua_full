import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../../mediator/mediator';
import { GetQuizQuery, SubmitQuizCommand } from './handlers/quiz.handlers';

type FastifyReq = FastifyRequest<any>;

export class QuizzesController {
  async getQuiz(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as any;
      const assessment = await mediator.send(new GetQuizQuery(params.assessment_id));
      return reply.send(assessment);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }

  async submitQuiz(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as any;
      const body = (request.body || {}) as any;
      const { user_id, answers } = body;
      const result = await mediator.send(
        new SubmitQuizCommand(params.assessment_id, user_id, answers)
      );
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }
}

export const quizzesController = new QuizzesController();
