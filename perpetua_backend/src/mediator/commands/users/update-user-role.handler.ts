import { ICommand, IHandler } from '../../mediator.interface';
import { usersService, UsersService } from '../../../services/users.service';
import { Role } from '@prisma/client';

export class UpdateUserRoleCommand implements ICommand<any> {
  readonly kind = 'UpdateUserRoleCommand';
  constructor(
    public readonly userId: string,
    public readonly role: Role
  ) {}
}

export class UpdateUserRoleCommandHandler implements IHandler<UpdateUserRoleCommand, any> {
  constructor(private service: UsersService = usersService) {}

  async handle(command: UpdateUserRoleCommand): Promise<any> {
    return this.service.updateUserRole(command.userId, command.role);
  }
}
