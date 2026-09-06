import { EnrollmentsRepository, enrollmentsRepository } from './enrollments.repository';

export class EnrollmentsService {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}

  async enrollUser(courseId: string, userId: string) {
    const existing = await this.repo.findEnrollment(courseId, userId);
    if (existing) {
      return { message: 'Already enrolled', enrollment_id: existing.id };
    }

    const newEnrollment = await this.repo.createEnrollment(userId, courseId);
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
}

export const enrollmentsService = new EnrollmentsService();
