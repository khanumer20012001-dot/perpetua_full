import { IQuery, IHandler } from '../../mediator.interface';
import { usersService, UsersService } from '../../../services/users.service';

export class ListUsersQuery implements IQuery<any[]> {
  readonly kind = 'ListUsersQuery';
}

export class ListUsersQueryHandler implements IHandler<ListUsersQuery, any[]> {
  constructor(private service: UsersService = usersService) {}

  async handle(_query: ListUsersQuery): Promise<any[]> {
    return this.service.listUsers();
  }
}
