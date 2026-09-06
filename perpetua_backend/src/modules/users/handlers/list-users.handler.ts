import { IQuery, IHandler } from '../../../mediator/mediator.interface';
import { usersService, UsersService } from '../users.service';

export class ListUsersQuery implements IQuery<any[]> {
  readonly kind = 'ListUsersQuery';
}

export class ListUsersQueryHandler implements IHandler<ListUsersQuery, any[]> {
  constructor(private service: UsersService = usersService) {}

  async handle(_query: ListUsersQuery): Promise<any[]> {
    return this.service.listUsers();
  }
}
