import { ICommand, IHandler } from '../../mediator.interface';
import { prisma } from '../../../db/prisma';
import { NotFoundError } from '../../../shared/errors/custom-errors';
import { Role, UserStatus } from '@prisma/client';

export class UpdateUserCommand implements ICommand<any> {
  readonly kind = 'UpdateUserCommand';
  constructor(
    public readonly id: string,
    public readonly data: {
      fullName: string;
      email: string;
      role: Role;
      department: string;
      status: UserStatus;
      phoneNumber?: string;
      jobTitle?: string;
      professionalSummary?: string;
      profileImage?: string;
    }
  ) {}
}

export class UpdateUserCommandHandler implements IHandler<UpdateUserCommand, any> {
  async handle(command: UpdateUserCommand): Promise<any> {
    const existingUser = await prisma.user.findUnique({
      where: { id: command.id }
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: command.id },
      data: command.data
    });

    return updatedUser;
  }
}
