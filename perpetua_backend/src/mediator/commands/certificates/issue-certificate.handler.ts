import { ICommand, IHandler } from '../../mediator.interface';
import { certificatesService, CertificatesService } from '../../../services/certificate.service';
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
  constructor(private service: CertificatesService = certificatesService) {}
  async handle(command: IssueCertificateCommand): Promise<any> {
    return this.service.issueCertificate(command.userId, command.courseId, command.format);
  }
}

export class GetUserCertificatesQuery implements ICommand<any> {
  readonly kind = 'GetUserCertificatesQuery';
  constructor(public readonly userId: string) {}
}

export class GetUserCertificatesQueryHandler implements IHandler<GetUserCertificatesQuery, any> {
  constructor(private service: CertificatesService = certificatesService) {}
  async handle(query: GetUserCertificatesQuery): Promise<any> {
    return this.service.getUserCertificates(query.userId);
  }
}
