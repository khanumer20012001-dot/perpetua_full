import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { certificatesRepository, CertificatesRepository } from '../../../repositories/certificate.repository';
import { BadRequestError } from '../../../shared/errors/custom-errors';
import { JsonCertificateStrategy } from '../../../strategies/certificate/json-certificate.strategy';
import { PdfCertificateStrategy } from '../../../strategies/certificate/pdf-certificate.strategy';
import { CertificateFormat } from '@prisma/client';

export class IssueCertificateCommand implements ICommand<any> {
  readonly kind = 'IssueCertificateCommand';
  constructor(
    public readonly userId: string,
    public readonly courseId: string,
    public readonly format?: CertificateFormat
  ) {}
}

export class IssueCertificateCommandHandler implements IHandler<IssueCertificateCommand, any> {
  private jsonStrategy = new JsonCertificateStrategy();
  private pdfStrategy = new PdfCertificateStrategy();

  constructor(private repo: CertificatesRepository = certificatesRepository) {}

  async handle(command: IssueCertificateCommand): Promise<any> {
    const { userId, courseId } = command;
    const format: CertificateFormat = command.format || 'JSON';

    const enrollment = await this.repo.findEnrollment(courseId, userId);
    if (!enrollment || enrollment.progressPercent < 100.0) {
      throw new BadRequestError('Course not fully completed yet');
    }

    const existingCert = await this.repo.findCertificate(courseId, userId);
    if (existingCert) {
      return { message: 'Certificate already issued', certificate_id: existingCert.id };
    }

    const certData = {
      userId,
      courseId,
      userName: enrollment.user.fullName,
      courseTitle: enrollment.course.title,
      completedAt: enrollment.completedAt || new Date(),
    };

    let strategyResult;
    if (format === 'PDF') {
      strategyResult = await this.pdfStrategy.generate(certData);
    } else {
      strategyResult = await this.jsonStrategy.generate(certData);
    }

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
      fileUrl: strategyResult.certificateUrl,
    };
  }
}

export class GetUserCertificatesQuery implements IQuery<any> {
  readonly kind = 'GetUserCertificatesQuery';
  constructor(public readonly userId: string) {}
}

export class GetUserCertificatesQueryHandler implements IHandler<GetUserCertificatesQuery, any> {
  constructor(private repo: CertificatesRepository = certificatesRepository) {}

  async handle(query: GetUserCertificatesQuery): Promise<any> {
    return this.repo.findCertificatesByUserId(query.userId);
  }
}
