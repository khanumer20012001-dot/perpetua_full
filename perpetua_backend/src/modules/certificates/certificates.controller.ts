import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../../mediator/mediator';
import { IssueCertificateCommand } from './handlers/issue-certificate.handler';

export class CertificatesController {
  async issueCertificate(request: FastifyRequest<any>, reply: FastifyReply) {
    const { user_id, course_id } = request.body as { user_id: string; course_id: string };
    try {
      const result = await mediator.send(new IssueCertificateCommand(user_id, course_id));
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 400).send({ detail: error.message });
    }
  }
}

export const certificatesController = new CertificatesController();
