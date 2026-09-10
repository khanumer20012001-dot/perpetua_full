import { ICommand, IHandler } from '../../mediator.interface';
import { authService, AuthService } from '../../../services/auth.service';

export class VerifyOtpCommand implements ICommand<{ user: any }> {
  readonly kind = 'VerifyOtpCommand';
  constructor(
    public readonly email: string,
    public readonly code: string
  ) {}
}

export class VerifyOtpCommandHandler implements IHandler<VerifyOtpCommand, { user: any }> {
  constructor(private service: AuthService = authService) {}

  async handle(command: VerifyOtpCommand): Promise<{ user: any }> {
    return this.service.verifyOtp(command.email, command.code);
  }
}
