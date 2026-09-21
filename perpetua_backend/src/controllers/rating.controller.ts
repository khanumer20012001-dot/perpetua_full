import { FastifyReply, FastifyRequest } from 'fastify';
import { ratingRepository } from '../repositories/rating.repository';

type FastifyReq = FastifyRequest<any>;

export class RatingController {
  async submitRating(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const body = (request.body || {}) as Record<string, any>;

      const courseId = params.course_id;
      const rating = Number(body.rating);
      const userId = body.user_id || body.userId || null;

      if (!courseId || isNaN(rating) || rating < 1 || rating > 10) {
        return reply.status(400).send({ detail: 'Invalid course_id or rating (must be 1-10)' });
      }

      const record = await ratingRepository.submitRating(courseId, userId, rating);
      const stats = await ratingRepository.getCourseRatingStats(courseId);

      return reply.send({
        success: true,
        record,
        feedbackScore: stats.formatted,
        average: stats.average,
        count: stats.count,
      });
    } catch (error: any) {
      return reply.status(500).send({ detail: error.message });
    }
  }

  async getCourseRatingStats(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const courseId = params.course_id;
      const stats = await ratingRepository.getCourseRatingStats(courseId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ detail: error.message });
    }
  }

  async getCombinedRatingStats(request: FastifyReq, reply: FastifyReply) {
    try {
      const stats = await ratingRepository.getCombinedRatingStats();
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ detail: error.message });
    }
  }
}

export const ratingController = new RatingController();
