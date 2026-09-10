import { prisma } from '../db/prisma';
import { Role } from '@prisma/client';

export class UsersRepository {
  async findAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateUserRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}

export const usersRepository = new UsersRepository();
