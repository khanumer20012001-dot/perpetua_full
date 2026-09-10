import { prisma } from '../db/prisma';
import { CertificateFormat } from '@prisma/client';

export class CertificatesRepository {
  async findEnrollment(courseId: string, userId: string) {
    return prisma.enrollment.findFirst({
      where: { courseId, userId },
      include: {
        user: true,
        course: true,
      }
    });
  }

  async findCertificate(courseId: string, userId: string) {
    return prisma.certificate.findFirst({
      where: { courseId, userId },
    });
  }

  async createCertificate(userId: string, courseId: string, format: CertificateFormat, payload?: any, fileUrl?: string) {
    return prisma.certificate.create({
      data: {
        userId,
        courseId,
        issuedAt: new Date(),
        format,
        payload,
        fileUrl,
      },
    });
  }

  async findCertificatesByUserId(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, title: true, description: true },
        },
      },
    });
  }
}

export const certificatesRepository = new CertificatesRepository();
