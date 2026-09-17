import { prisma } from '../db/prisma';

export class EnrollmentsRepository {
  async findEnrollment(courseId: string, userId: string) {
    return prisma.enrollment.findFirst({
      where: { courseId, userId },
    });
  }

  async createEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progressPercent: 0.0,
      },
    });
  }

  async findEnrollmentsByUserId(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      include: {
        course: {
          include: {
            modules: true,
          },
        },
      },
    });
  }

  async countInProgress(userId: string) {
    return prisma.enrollment.count({
      where: {
        userId,
        progressPercent: { lt: 100 },
      },
    });
  }

  async countCompleted(userId: string) {
    return prisma.enrollment.count({
      where: {
        userId,
        progressPercent: 100,
      },
    });
  }

  async countCertificates(userId: string) {
    return prisma.certificate.count({
      where: { userId },
    });
  }

  async findContinueCourse(userId: string) {
    return prisma.enrollment.findFirst({
      where: {
        userId,
        progressPercent: { lt: 100 },
      },
      orderBy: { lastActiveAt: 'desc' },
      include: {
        course: {
          include: { modules: true },
        },
      },
    });
  }

  async findLatestPublishedCourse() {
    return prisma.course.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProgress(userId: string, courseId: string, progressPercent: number) {
    let enrollment = await this.findEnrollment(courseId, userId);
    if (!enrollment) {
      enrollment = await this.createEnrollment(userId, courseId);
    }
    return prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        lastActiveAt: new Date(),
        completedAt: progressPercent >= 100 ? new Date() : enrollment.completedAt,
      },
    });
  }
}

export const enrollmentsRepository = new EnrollmentsRepository();
