import { EnrollmentsRepository, enrollmentsRepository } from '../repositories/enrollment.repository';
import { prisma } from '../db/prisma';

export class EnrollmentsService {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}

  async enrollUser(courseId: string, userId: string) {
    let targetUserId = userId;
    if (!targetUserId || targetUserId === 'anonymous') {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        targetUserId = firstUser.id;
      }
    } else {
      const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!existingUser) {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
          targetUserId = firstUser.id;
        }
      }
    }

    const existing = await this.repo.findEnrollment(courseId, targetUserId);
    if (existing) {
      return { message: 'Already enrolled', enrollment_id: existing.id };
    }

    const newEnrollment = await this.repo.createEnrollment(targetUserId, courseId);
    return { message: 'Enrolled successfully', enrollment_id: newEnrollment.id };
  }

  async getUserEnrollments(userId: string) {
    return this.repo.findEnrollmentsByUserId(userId);
  }

  async getDashboardStats(userId: string) {
    const inProgressCount = await this.repo.countInProgress(userId);
    const completedCount = await this.repo.countCompleted(userId);
    const certificatesCount = await this.repo.countCertificates(userId);
    const enrollments = await this.repo.findEnrollmentsByUserId(userId);

    let totalMinutes = 0;
    for (const e of enrollments) {
      totalMinutes += e.course.durationMinutes * (e.progressPercent / 100);
    }
    const totalHours = Math.round(totalMinutes / 60);

    const continueCourseRaw = await this.repo.findContinueCourse(userId);
    let continueCourse = null;
    if (continueCourseRaw) {
      continueCourse = {
        id: continueCourseRaw.course.id,
        title: continueCourseRaw.course.title,
        description: continueCourseRaw.course.description,
        modulesCount: continueCourseRaw.course.modules.length,
        progressPercent: continueCourseRaw.progressPercent,
        durationMinutes: continueCourseRaw.course.durationMinutes,
      };
    }

    const latestCourseRaw = await this.repo.findLatestPublishedCourse();

    return {
      stats: {
        inProgressCourses: inProgressCount,
        completedCourses: completedCount,
        completedCapabilities: 0,
        pendingPolicies: 0,
        earnedCertificates: certificatesCount,
        totalTimeSpentHours: totalHours,
      },
      continueCourse,
      latestCourse: latestCourseRaw
        ? {
            id: latestCourseRaw.id,
            title: latestCourseRaw.title,
            description: latestCourseRaw.description,
          }
        : null,
    };
  }

  async updateProgress(userId: string, courseId: string, progressPercent: number) {
    let targetUserId = userId;
    if (!targetUserId || targetUserId === 'anonymous') {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        targetUserId = firstUser.id;
      }
    } else {
      const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!existingUser) {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
          targetUserId = firstUser.id;
        }
      }
    }
    return this.repo.updateProgress(targetUserId, courseId, progressPercent);
  }
}

export const enrollmentsService = new EnrollmentsService();
