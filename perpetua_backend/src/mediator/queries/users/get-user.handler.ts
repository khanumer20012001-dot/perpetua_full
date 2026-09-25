import { IQuery, IHandler } from '../../mediator.interface';
import { prisma } from '../../../db/prisma';
import { NotFoundError } from '../../../shared/errors/custom-errors';

export class GetUserQuery implements IQuery<any> {
  readonly kind = 'GetUserQuery';
  constructor(public readonly id: string) {}
}

export class GetUserQueryHandler implements IHandler<GetUserQuery, any> {
  async handle(query: GetUserQuery): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: query.id }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
