import { prisma } from '../../db/prisma';

export class CertificatesRepository {
  async findEnrollment(courseId: string, userId: string) {
    return prisma.enrollment.findFirst({
      where: { courseId, userId },
    });
  }

  async findCertificate(courseId: string, userId: string) {
    return prisma.certificate.findFirst({
      where: { courseId, userId },
    });
  }

  async createCertificate(userId: string, courseId: string) {
    return prisma.certificate.create({
      data: {
        userId,
        courseId,
        issuedAt: new Date(),
      },
    });
  }
}

export const certificatesRepository = new CertificatesRepository();
