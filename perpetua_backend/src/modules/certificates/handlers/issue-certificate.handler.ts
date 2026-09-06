import { ICommand, IHandler } from '../../../mediator/mediator.interface';
import { certificatesService, CertificatesService } from '../certificates.service';

export class IssueCertificateCommand implements ICommand<any> {
  readonly kind = 'IssueCertificateCommand';
  constructor(
    public readonly userId: string,
    public readonly courseId: string
  ) {}
}

export class IssueCertificateCommandHandler implements IHandler<IssueCertificateCommand, any> {
  constructor(private service: CertificatesService = certificatesService) {}
  async handle(command: IssueCertificateCommand): Promise<any> {
    return this.service.issueCertificate(command.userId, command.courseId);
  }
}
