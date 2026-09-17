import { mediator } from './mediator';

// Handlers
import { RequestOtpCommandHandler } from './commands/auth/request-otp.handler';
import { VerifyOtpCommandHandler } from './commands/auth/verify-otp.handler';
import {
  CreateCourseCommandHandler,
  CreateModuleCommandHandler,
  CreateChapterCommandHandler,
  CreateFullCourseCommandHandler,
  UpdateFullCourseCommandHandler,
  GetPublishedCoursesQueryHandler,
  GetCourseDetailQueryHandler,
  PublishCourseCommandHandler,
  DeleteCourseCommandHandler,
  GetAllCoursesQueryHandler,
} from './commands/courses/course.handlers';
import {
  EnrollCourseCommandHandler,
  GetUserEnrollmentsQueryHandler,
  GetDashboardStatsQueryHandler,
  UpdateProgressCommandHandler,
} from './commands/enrollments/enrollment.handlers';
import { GetQuizQueryHandler, SubmitQuizCommandHandler } from './commands/assessments/quiz.handlers';
import { IssueCertificateCommandHandler, GetUserCertificatesQueryHandler } from './commands/certificates/issue-certificate.handler';
import { ListUsersQueryHandler } from './queries/users/list-users.handler';
import { UpdateUserRoleCommandHandler } from './commands/users/update-user-role.handler';
import { GenerateAiCourseCommandHandler } from '../modules/gemini/handlers/generate-course.handler';
import { StreamDiscoveryQuestionsCommandHandler } from '../modules/gemini/handlers/stream-discovery.handler';
import { StreamCourseDraftCommandHandler } from '../modules/gemini/handlers/stream-draft.handler';

let isRegistered = false;

/**
 * Centralized Mediator Handler Registration.
 * Bootstrapped on app startup to prevent top-level side effects in route files.
 */
export function registerMediatorHandlers(): void {
  if (isRegistered) return;

  // Auth
  mediator.register('RequestOtpCommand', new RequestOtpCommandHandler());
  mediator.register('VerifyOtpCommand', new VerifyOtpCommandHandler());

  // Courses
  mediator.register('CreateCourseCommand', new CreateCourseCommandHandler());
  mediator.register('CreateModuleCommand', new CreateModuleCommandHandler());
  mediator.register('CreateChapterCommand', new CreateChapterCommandHandler());
  mediator.register('CreateFullCourseCommand', new CreateFullCourseCommandHandler());
  mediator.register('UpdateFullCourseCommand', new UpdateFullCourseCommandHandler());
  mediator.register('GetPublishedCoursesQuery', new GetPublishedCoursesQueryHandler());
  mediator.register('GetCourseDetailQuery', new GetCourseDetailQueryHandler());
  mediator.register('PublishCourseCommand', new PublishCourseCommandHandler());
  mediator.register('DeleteCourseCommand', new DeleteCourseCommandHandler());
  mediator.register('GetAllCoursesQuery', new GetAllCoursesQueryHandler());

  // Enrollments
  mediator.register('EnrollCourseCommand', new EnrollCourseCommandHandler());
  mediator.register('GetUserEnrollmentsQuery', new GetUserEnrollmentsQueryHandler());
  mediator.register('GetDashboardStatsQuery', new GetDashboardStatsQueryHandler());
  mediator.register('UpdateProgressCommand', new UpdateProgressCommandHandler());

  // Assessments & Quizzes
  mediator.register('GetQuizQuery', new GetQuizQueryHandler());
  mediator.register('SubmitQuizCommand', new SubmitQuizCommandHandler());

  // Certificates
  mediator.register('IssueCertificateCommand', new IssueCertificateCommandHandler());
  mediator.register('GetUserCertificatesQuery', new GetUserCertificatesQueryHandler());

  // Users
  mediator.register('ListUsersQuery', new ListUsersQueryHandler());
  mediator.register('UpdateUserRoleCommand', new UpdateUserRoleCommandHandler());

  // Gemini AI
  mediator.register('GenerateAiCourseCommand', new GenerateAiCourseCommandHandler());
  mediator.register('StreamDiscoveryQuestionsCommand', new StreamDiscoveryQuestionsCommandHandler());
  mediator.register('StreamCourseDraftCommand', new StreamCourseDraftCommandHandler());

  isRegistered = true;
}
