import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { quizzesService, QuizzesService } from '../../../services/assessment.service';

export class GetQuizQuery implements IQuery<any> {
  readonly kind = 'GetQuizQuery';
  constructor(public readonly assessmentId: string) {}
}

export class GetQuizQueryHandler implements IHandler<GetQuizQuery, any> {
  constructor(private service: QuizzesService = quizzesService) {}
  async handle(query: GetQuizQuery): Promise<any> {
    return this.service.getQuiz(query.assessmentId);
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
  constructor(private service: QuizzesService = quizzesService) {}
  async handle(command: SubmitQuizCommand): Promise<any> {
    return this.service.submitQuiz(command.assessmentId, command.userId, command.answers);
  }
}
