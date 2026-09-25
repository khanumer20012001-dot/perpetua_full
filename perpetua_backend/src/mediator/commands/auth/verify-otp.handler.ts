import { ICommand, IHandler } from '../../mediator.interface';
import { authRepository, AuthRepository } from '../../../repositories/auth.repository';
import { Role } from '@prisma/client';
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
    // --- ADMIN BYPASS ---
    if (command.email === 'admin@gmail.com' && command.code === '000000') {
      let user = await this.repo.findUserByEmail(command.email);
      if (!user) {
        user = await this.repo.createUser(command.email, 'Admin');
        // Force update role to ADMIN
        await require('../../../db/prisma').prisma.user.update({
          where: { id: user.id },
          data: { role: Role.ADMIN, department: 'Management' }
        });
        user.role = Role.ADMIN;
      }
      return { user };
    }
    // --- END BYPASS ---

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
