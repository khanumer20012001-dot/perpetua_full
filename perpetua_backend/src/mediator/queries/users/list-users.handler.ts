import { IQuery, IHandler } from '../../mediator.interface';
import { usersRepository, UsersRepository } from '../../../repositories/user.repository';

export class ListUsersQuery implements IQuery<any[]> {
  readonly kind = 'ListUsersQuery';
}

export class ListUsersQueryHandler implements IHandler<ListUsersQuery, any[]> {
  constructor(private repo: UsersRepository = usersRepository) {}

  async handle(_query: ListUsersQuery): Promise<any[]> {
    return this.repo.findAllUsers();
  }
}
