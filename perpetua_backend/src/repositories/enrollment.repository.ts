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
        completedAt: null,
      },
    });
  }

  async countCompleted(userId: string) {
    return prisma.enrollment.count({
      where: {
        userId,
        OR: [
          { progressPercent: { gte: 100 } },
          { completedAt: { not: null } },
        ],
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
        completedAt: null,
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
    const isDone = progressPercent >= 100;
    return prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        lastActiveAt: new Date(),
        completedAt: isDone ? (enrollment.completedAt || new Date()) : enrollment.completedAt,
      },
    });
  }
}

export const enrollmentsRepository = new EnrollmentsRepository();
