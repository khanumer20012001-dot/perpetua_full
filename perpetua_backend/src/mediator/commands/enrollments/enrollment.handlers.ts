import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { enrollmentsRepository, EnrollmentsRepository } from '../../../repositories/enrollment.repository';
import { prisma } from '../../../db/prisma';

async function resolveUserId(userId: string): Promise<string> {
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
  return targetUserId;
}

export class EnrollCourseCommand implements ICommand<any> {
  readonly kind = 'EnrollCourseCommand';
  constructor(
    public readonly courseId: string,
    public readonly userId: string
  ) {}
}

export class EnrollCourseCommandHandler implements IHandler<EnrollCourseCommand, any> {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}
  async handle(command: EnrollCourseCommand): Promise<any> {
    const targetUserId = await resolveUserId(command.userId);
    const existing = await this.repo.findEnrollment(command.courseId, targetUserId);
    if (existing) {
      return { message: 'Already enrolled', enrollment_id: existing.id };
    }

    const newEnrollment = await this.repo.createEnrollment(targetUserId, command.courseId);
    return { message: 'Enrolled successfully', enrollment_id: newEnrollment.id };
  }
}

export class GetUserEnrollmentsQuery implements IQuery<any[]> {
  readonly kind = 'GetUserEnrollmentsQuery';
  constructor(public readonly userId: string) {}
}

export class GetUserEnrollmentsQueryHandler implements IHandler<GetUserEnrollmentsQuery, any[]> {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}
  async handle(query: GetUserEnrollmentsQuery): Promise<any[]> {
    return this.repo.findEnrollmentsByUserId(query.userId);
  }
}

export class GetDashboardStatsQuery implements IQuery<any> {
  readonly kind = 'GetDashboardStatsQuery';
  constructor(public readonly userId: string) {}
}

export class GetDashboardStatsQueryHandler implements IHandler<GetDashboardStatsQuery, any> {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}
  async handle(query: GetDashboardStatsQuery): Promise<any> {
    const userId = query.userId;
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

export class UpdateProgressCommand implements ICommand<any> {
  readonly kind = 'UpdateProgressCommand';
  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly progressPercent: number
  ) {}
}

export class UpdateProgressCommandHandler implements IHandler<UpdateProgressCommand, any> {
  constructor(private repo: EnrollmentsRepository = enrollmentsRepository) {}
  async handle(command: UpdateProgressCommand): Promise<any> {
    const targetUserId = await resolveUserId(command.userId);
    return this.repo.updateProgress(targetUserId, command.courseId, command.progressPercent);
  }
}
