import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { quizzesRepository, QuizzesRepository } from '../../../repositories/assessment.repository';
import { NotFoundError } from '../../../shared/errors/custom-errors';
import { eventBus, DomainEvents } from '../../../events/event-bus';

export class GetQuizQuery implements IQuery<any> {
  readonly kind = 'GetQuizQuery';
  constructor(public readonly assessmentId: string) {}
}

export class GetQuizQueryHandler implements IHandler<GetQuizQuery, any> {
  constructor(private repo: QuizzesRepository = quizzesRepository) {}
  async handle(query: GetQuizQuery): Promise<any> {
    const assessment = await this.repo.findAssessmentById(query.assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }
    return assessment;
  }
}

export class SubmitQuizCommand implements ICommand<any> {
  readonly kind = 'SubmitQuizCommand';
  constructor(
    public readonly assessmentId: string,
    public readonly userId: string,
    public readonly answers: Record<string, string>
  ) {}
}

export class SubmitQuizCommandHandler implements IHandler<SubmitQuizCommand, any> {
  constructor(private repo: QuizzesRepository = quizzesRepository) {}
  async handle(command: SubmitQuizCommand): Promise<any> {
    const { assessmentId, userId, answers } = command;
    const selectedOptionIds = Object.values(answers);
    const selectedOptions = await this.repo.findOptionsByIds(selectedOptionIds);

    const score = selectedOptions.filter((opt: any) => opt.isCorrect).length;
    const totalQuestions = Object.keys(answers).length;
    const passed = score >= totalQuestions * 0.7;

    if (passed) {
      const assessment = await this.repo.findAssessmentById(assessmentId);
      if (assessment) {
        const enrollment = await this.repo.findEnrollment(assessment.courseId, userId);
        if (enrollment) {
          await this.repo.updateEnrollmentProgress(enrollment.id, 100.0);
          await eventBus.emitAsync(DomainEvents.COURSE_COMPLETED, {
            userId,
            courseId: assessment.courseId,
            enrollmentId: enrollment.id,
          });
        }
      }
    }

    return {
      score,
      total_questions: totalQuestions,
      passed,
    };
  }
}
