import { prisma } from '../../db/prisma';

export class QuizzesRepository {
  async findAssessmentById(id: string) {
    return prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  async findOptionsByIds(optionIds: string[]) {
    return prisma.option.findMany({
      where: { id: { in: optionIds } },
    });
  }

  async findEnrollment(courseId: string, userId: string) {
    return prisma.enrollment.findFirst({
      where: {
        courseId,
        userId,
      },
    });
  }

  async updateEnrollmentProgress(enrollmentId: string, progressPercent: number) {
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progressPercent },
    });
  }
}

export const quizzesRepository = new QuizzesRepository();
