import { CertificatesRepository, certificatesRepository } from './certificates.repository';
import { BadRequestError } from '../../common/errors/custom-errors';

export class CertificatesService {
  constructor(private repo: CertificatesRepository = certificatesRepository) {}

  async issueCertificate(userId: string, courseId: string) {
    const enrollment = await this.repo.findEnrollment(courseId, userId);
    if (!enrollment || enrollment.progressPercent < 100.0) {
      throw new BadRequestError('Course not fully completed yet');
    }

    const existingCert = await this.repo.findCertificate(courseId, userId);
    if (existingCert) {
      return { message: 'Certificate already issued', certificate_id: existingCert.id };
    }

    const newCert = await this.repo.createCertificate(userId, courseId);
    return { message: 'Certificate issued successfully', certificate_id: newCert.id };
  }
}

export const certificatesService = new CertificatesService();
