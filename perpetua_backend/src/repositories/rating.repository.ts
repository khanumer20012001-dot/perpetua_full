import { prisma } from '../db/prisma';

export class RatingRepository {
  async submitRating(courseId: string, userId: string | null, rating: number) {
    return (prisma as any).courseRating.create({
      data: {
        courseId,
        userId: userId || null,
        rating,
      },
    });
  }

  async getCourseRatingStats(courseId: string) {
    const ratings = await (prisma as any).courseRating.findMany({
      where: { courseId },
      select: { rating: true },
    });

    if (!ratings || ratings.length === 0) {
      return { count: 0, average: null, formatted: '-' };
    }

    const totalSum = ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const avg = totalSum / ratings.length;
    const formatted = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

    return {
      count: ratings.length,
      average: avg,
      formatted,
    };
  }

  async getCombinedRatingStats() {
    const allRatings = await (prisma as any).courseRating.findMany({
      select: { rating: true },
    });

    if (!allRatings || allRatings.length === 0) {
      return { count: 0, average: null, formatted: '- / 10' };
    }

    const totalSum = allRatings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const avg = totalSum / allRatings.length;
    const formatted = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

    return {
      count: allRatings.length,
      average: avg,
      formatted: `${formatted} / 10`,
    };
  }
}

export const ratingRepository = new RatingRepository();
