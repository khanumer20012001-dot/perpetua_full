import { ICommand, IHandler } from '../../mediator.interface';
import { usersRepository, UsersRepository } from '../../../repositories/user.repository';
import { Role } from '@prisma/client';
import { NotFoundError } from '../../../shared/errors/custom-errors';

export class UpdateUserRoleCommand implements ICommand<any> {
  readonly kind = 'UpdateUserRoleCommand';
  constructor(
    public readonly userId: string,
    public readonly role: Role
  ) {}
}

export class UpdateUserRoleCommandHandler implements IHandler<UpdateUserRoleCommand, any> {
  constructor(private repo: UsersRepository = usersRepository) {}

  async handle(command: UpdateUserRoleCommand): Promise<any> {
    try {
      const updatedUser = await this.repo.updateUserRole(command.userId, command.role);
      return {
        message: 'User role updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      };
    } catch (error) {
      throw new NotFoundError('User not found');
    }
  }
}
