import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../db/prisma';

export const quizRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get Quiz
  server.get(
    '/:assessment_id',
    {
      schema: {
        params: z.object({ assessment_id: z.string() })
      }
    },
    async (request, reply) => {
      const assessmentId = request.params.assessment_id;

      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });

      if (!assessment) {
        return reply.status(404).send({ detail: "Assessment not found" });
      }

      return assessment;
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
          answers: z.record(z.string(), z.string()) // Record<question_id, option_id>
        })
      }
    },
    async (request, reply) => {
      const assessmentId = request.params.assessment_id;
      const { user_id, answers } = request.body;

      const selectedOptionIds = Object.values(answers);

      // Fetch all selected options to check correctness
      const selectedOptions = await prisma.option.findMany({
        where: { id: { in: selectedOptionIds } }
      });

      const score = selectedOptions.filter((opt: any) => opt.isCorrect).length;
      const totalQuestions = Object.keys(answers).length;
      const passed = score >= (totalQuestions * 0.7);

      // Update progress if passed
      if (passed) {
        const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
        if (assessment) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              course_id: assessment.course_id,
              user_id: user_id
            }
          });

          if (enrollment) {
            await prisma.enrollment.update({
              where: { id: enrollment.id },
              data: { progress_percent: 100.0 }
            });
          }
        }
      }

      return {
        score,
        total_questions: totalQuestions,
        passed
      };
    }
  );
};
