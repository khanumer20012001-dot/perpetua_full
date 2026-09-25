import { prisma } from '../../../db/prisma';
import { Role, UserStatus } from '@prisma/client'; // Force re-parse
import { ConflictError } from '../../../shared/errors/custom-errors';
import { ICommand, IHandler } from '../../mediator.interface';

export class CreateUserCommand implements ICommand<any> {
  readonly kind = 'CreateUserCommand';
  constructor(
    public fullName: string,
    public email: string,
    public role: Role,
    public department: string,
    public status: UserStatus,
    public phoneNumber?: string,
    public jobTitle?: string,
    public profileImage?: string
  ) { }
}

export class CreateUserCommandHandler implements IHandler<CreateUserCommand, any> {
  async handle(command: CreateUserCommand): Promise<any> {
    const existingUser = await prisma.user.findUnique({
      where: { email: command.email }
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists.');
    }

    const newUser = await prisma.user.create({
      data: {
        fullName: command.fullName,
        email: command.email,
        role: command.role,
        department: command.department,
        status: command.status,
        phoneNumber: command.phoneNumber,
        jobTitle: command.jobTitle,
        profileImage: command.profileImage
      }
    });

    return newUser;
  }
}
