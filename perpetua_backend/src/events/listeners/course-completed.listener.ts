import { eventBus, DomainEvents, CourseCompletedPayload } from '../event-bus';
import { mediator } from '../../mediator/mediator';
import { IssueCertificateCommand } from '../../mediator/commands/certificates/issue-certificate.handler';

export function registerCourseCompletedListener(): void {
  eventBus.on<CourseCompletedPayload>(DomainEvents.COURSE_COMPLETED, async (payload) => {
    try {
      console.log(`[EventBus] CourseCompletedEvent received for user=${payload.userId}, course=${payload.courseId}. Issuing certificate...`);
      await mediator.send(new IssueCertificateCommand(payload.userId, payload.courseId, 'JSON'));
    } catch (error) {
      console.error(`[EventBus Error] Failed to auto-issue certificate for user=${payload.userId}:`, error);
    }
  });
}
