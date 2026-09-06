import { prisma } from '../../db/prisma';

export class AuthRepository {
  async saveOtp(email: string, code: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });
  }

  async findLatestOtp(email: string, code: string) {
    return prisma.otpCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteOtp(id: string) {
    return prisma.otpCode.delete({
      where: { id },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(email: string, fullName: string) {
    return prisma.user.create({
      data: {
        email,
        fullName,
        role: 'LEARNER',
      },
    });
  }
}

export const authRepository = new AuthRepository();
