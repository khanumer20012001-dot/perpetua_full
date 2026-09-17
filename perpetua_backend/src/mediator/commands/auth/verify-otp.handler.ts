import { ICommand, IHandler } from '../../mediator.interface';
import { authRepository, AuthRepository } from '../../../repositories/auth.repository';
import { BadRequestError } from '../../../shared/errors/custom-errors';

export class VerifyOtpCommand implements ICommand<{ user: any }> {
  readonly kind = 'VerifyOtpCommand';
  constructor(
    public readonly email: string,
    public readonly code: string
  ) {}
}

export class VerifyOtpCommandHandler implements IHandler<VerifyOtpCommand, { user: any }> {
  constructor(private repo: AuthRepository = authRepository) {}

  async handle(command: VerifyOtpCommand): Promise<{ user: any }> {
    const otpRecord = await this.repo.findLatestOtp(command.email, command.code);

    if (!otpRecord) {
      throw new BadRequestError('Invalid code');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestError('Code has expired');
    }

    await this.repo.deleteOtp(otpRecord.id);

    let user = await this.repo.findUserByEmail(command.email);

    if (!user) {
      const defaultName = command.email.split('@')[0];
      user = await this.repo.createUser(command.email, defaultName);
    }

    return { user };
  }
}
