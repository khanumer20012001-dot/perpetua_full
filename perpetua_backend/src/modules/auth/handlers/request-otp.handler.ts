import { ICommand, IHandler } from '../../../mediator/mediator.interface';
import { authService, AuthService } from '../auth.service';

export class RequestOtpCommand implements ICommand<{ message: string }> {
  readonly kind = 'RequestOtpCommand';
  constructor(public readonly email: string) {}
}

export class RequestOtpCommandHandler implements IHandler<RequestOtpCommand, { message: string }> {
  constructor(private service: AuthService = authService) {}

  async handle(command: RequestOtpCommand): Promise<{ message: string }> {
    return this.service.requestOtp(command.email);
  }
}
