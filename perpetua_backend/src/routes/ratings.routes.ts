import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ratingController } from '../controllers/rating.controller';

export const ratingRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Submit Rating for a Course
  server.post(
    '/courses/:course_id/rate',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
        body: z.object({
          rating: z.number().min(1).max(10),
          user_id: z.string().optional(),
          userId: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      return ratingController.submitRating(request, reply);
    }
  );

  // Get Course Rating Stats
  server.get(
    '/courses/:course_id/rating',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
      },
    },
    async (request, reply) => {
      return ratingController.getCourseRatingStats(request, reply);
    }
  );

  // Get Combined Rating Stats Across All Courses
  server.get('/ratings/combined', async (request, reply) => {
    return ratingController.getCombinedRatingStats(request, reply);
  });
};
