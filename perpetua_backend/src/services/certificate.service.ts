import { CertificatesRepository, certificatesRepository } from '../repositories/certificate.repository';
import { BadRequestError } from '../shared/errors/custom-errors';
import { JsonCertificateStrategy } from '../strategies/certificate/json-certificate.strategy';
import { PdfCertificateStrategy } from '../strategies/certificate/pdf-certificate.strategy';
import { CertificateFormat } from '@prisma/client';

export class CertificatesService {
  private jsonStrategy = new JsonCertificateStrategy();
  private pdfStrategy = new PdfCertificateStrategy();

  constructor(private repo: CertificatesRepository = certificatesRepository) {}

  async issueCertificate(userId: string, courseId: string, format: CertificateFormat = 'JSON') {
    const enrollment = await this.repo.findEnrollment(courseId, userId);
    if (!enrollment || enrollment.progressPercent < 100.0) {
      throw new BadRequestError('Course not fully completed yet');
    }

    const existingCert = await this.repo.findCertificate(courseId, userId);
    if (existingCert) {
      return { message: 'Certificate already issued', certificate_id: existingCert.id };
    }

    // Use Strategy based on format
    let strategyResult;
    const certData = {
      userId,
      courseId,
      userName: enrollment.user.fullName,
      courseTitle: enrollment.course.title,
      completedAt: enrollment.completedAt || new Date(),
    };

    if (format === 'PDF') {
      strategyResult = await this.pdfStrategy.generate(certData);
    } else {
      strategyResult = await this.jsonStrategy.generate(certData);
    }

    // Save to DB via repository
    const newCert = await this.repo.createCertificate(
      userId, 
      courseId, 
      format, 
      strategyResult.payload, 
      strategyResult.certificateUrl
    );

    return { 
      message: 'Certificate issued successfully', 
      certificate_id: newCert.id,
      format,
      payload: strategyResult.payload,
      fileUrl: strategyResult.certificateUrl
    };
  }

  async getUserCertificates(userId: string) {
    return this.repo.findCertificatesByUserId(userId);
  }
}

export const certificatesService = new CertificatesService();
