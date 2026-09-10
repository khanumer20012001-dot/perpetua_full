import { UsersRepository, usersRepository } from '../repositories/user.repository';
import { Role } from '@prisma/client';
import { NotFoundError } from '../shared/errors/custom-errors';

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async listUsers() {
    return this.repo.findAllUsers();
  }

  async updateUserRole(userId: string, role: Role) {
    try {
      const updatedUser = await this.repo.updateUserRole(userId, role);
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

export const usersService = new UsersService();
