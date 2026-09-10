import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { enrollmentsService, EnrollmentsService } from '../../../services/enrollment.service';

export class EnrollCourseCommand implements ICommand<any> {
  readonly kind = 'EnrollCourseCommand';
  constructor(
    public readonly courseId: string,
    public readonly userId: string
  ) {}
}

export class EnrollCourseCommandHandler implements IHandler<EnrollCourseCommand, any> {
  constructor(private service: EnrollmentsService = enrollmentsService) {}
  async handle(command: EnrollCourseCommand): Promise<any> {
    return this.service.enrollUser(command.courseId, command.userId);
  }
}

export class GetUserEnrollmentsQuery implements IQuery<any[]> {
  readonly kind = 'GetUserEnrollmentsQuery';
  constructor(public readonly userId: string) {}
}

export class GetUserEnrollmentsQueryHandler implements IHandler<GetUserEnrollmentsQuery, any[]> {
  constructor(private service: EnrollmentsService = enrollmentsService) {}
  async handle(query: GetUserEnrollmentsQuery): Promise<any[]> {
    return this.service.getUserEnrollments(query.userId);
  }
}

export class GetDashboardStatsQuery implements IQuery<any> {
  readonly kind = 'GetDashboardStatsQuery';
  constructor(public readonly userId: string) {}
}

export class GetDashboardStatsQueryHandler implements IHandler<GetDashboardStatsQuery, any> {
  constructor(private service: EnrollmentsService = enrollmentsService) {}
  async handle(query: GetDashboardStatsQuery): Promise<any> {
    return this.service.getDashboardStats(query.userId);
  }
}
