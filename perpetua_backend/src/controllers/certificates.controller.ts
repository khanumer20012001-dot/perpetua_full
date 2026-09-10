import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { IssueCertificateCommand, GetUserCertificatesQuery } from '../mediator/commands/certificates/issue-certificate.handler';

export class CertificatesController {
  async issueCertificate(request: FastifyRequest<any>, reply: FastifyReply) {
    const { user_id, course_id, format } = request.body as { user_id: string; course_id: string; format?: any };
    try {
      const result = await mediator.send(new IssueCertificateCommand(user_id, course_id, format));
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 400).send({ detail: error.message });
    }
  }

  async getUserCertificates(request: FastifyRequest<any>, reply: FastifyReply) {
    const { user_id } = request.params as { user_id: string };
    try {
      const certificates = await mediator.send(new GetUserCertificatesQuery(user_id));
      return reply.send(certificates);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }
}

export const certificatesController = new CertificatesController();
