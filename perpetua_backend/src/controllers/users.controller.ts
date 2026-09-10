import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { ListUsersQuery } from '../mediator/queries/users/list-users.handler';
import { UpdateUserRoleCommand } from '../mediator/commands/users/update-user-role.handler';
import { Role } from '@prisma/client';

export class UsersController {
  async listUsers(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await mediator.send(new ListUsersQuery());
      return reply.send(users);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async updateUserRole(request: FastifyRequest<any>, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role } = request.body as { role: Role };
    try {
      const result = await mediator.send(new UpdateUserRoleCommand(id, role));
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }
}

export const usersController = new UsersController();
