import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import { GetQuizQueryHandler, SubmitQuizCommandHandler } from '../mediator/commands/assessments/quiz.handlers';
import { quizzesController } from '../controllers/quizzes.controller';

// Register mediator handlers
mediator.register('GetQuizQuery', new GetQuizQueryHandler());
mediator.register('SubmitQuizCommand', new SubmitQuizCommandHandler());

export const quizRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get Quiz
  server.get(
    '/:assessment_id',
    {
      schema: {
        params: z.object({ assessment_id: z.string() }),
      },
    },
    async (request, reply) => {
      return quizzesController.getQuiz(request, reply);
    }
  );

  // Submit Quiz
  server.post(
    '/:assessment_id/submit',
    {
      schema: {
        params: z.object({ assessment_id: z.string() }),
        body: z.object({
          user_id: z.string(),
          answers: z.record(z.string(), z.string()),
        }),
      },
    },
    async (request, reply) => {
      return quizzesController.submitQuiz(request, reply);
    }
  );
};
