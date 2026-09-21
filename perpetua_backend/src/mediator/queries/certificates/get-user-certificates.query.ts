import { IQuery, IHandler } from '../../mediator.interface';
import { certificatesRepository, CertificatesRepository } from '../../../repositories/certificate.repository';

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
