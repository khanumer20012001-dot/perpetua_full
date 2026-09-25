import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { ListUsersQuery } from '../mediator/queries/users/list-users.handler';
import { GetUserQuery } from '../mediator/queries/users/get-user.handler';
import { UpdateUserRoleCommand } from '../mediator/commands/users/update-user-role.handler';
import { CreateUserCommand } from '../mediator/commands/users/create-user.handler';
import { UpdateUserCommand } from '../mediator/commands/users/update-user.handler';
import { Role, UserStatus } from '@prisma/client';

export class UsersController {
  async listUsers(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await mediator.send(new ListUsersQuery());
      return reply.send(users);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async createUser(request: FastifyRequest<any>, reply: FastifyReply) {
    const data = request.body as {
      fullName: string;
      email: string;
      role: Role;
      department: string;
      status: UserStatus;
      phoneNumber?: string;
      jobTitle?: string;
      profileImage?: string;
    };
    try {
      const result = await mediator.send(
        new CreateUserCommand(
          data.fullName,
          data.email,
          data.role,
          data.department,
          data.status,
          data.phoneNumber,
          data.jobTitle,
          data.profileImage
        )
      );
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async getUser(request: FastifyRequest<any>, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      const result = await mediator.send(new GetUserQuery(id));
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async updateUser(request: FastifyRequest<any>, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      const result = await mediator.send(new UpdateUserCommand(id, data));
      return reply.send(result);
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
