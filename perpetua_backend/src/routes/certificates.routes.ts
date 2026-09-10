import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import { IssueCertificateCommandHandler, GetUserCertificatesQueryHandler } from '../mediator/commands/certificates/issue-certificate.handler';
import { certificatesController } from '../controllers/certificates.controller';

// Register mediator handler
mediator.register('IssueCertificateCommand', new IssueCertificateCommandHandler());
mediator.register('GetUserCertificatesQuery', new GetUserCertificatesQueryHandler());

export const certificateRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Issue Certificate
  const issueSchema = {
    schema: {
      body: z.object({
        user_id: z.string(),
        course_id: z.string(),
        format: z.enum(['JSON', 'PDF']).optional(),
      }),
    },
  };

  server.post('/', issueSchema, async (request, reply) => {
    return certificatesController.issueCertificate(request, reply);
  });

  server.post('/issue', issueSchema, async (request, reply) => {
    return certificatesController.issueCertificate(request, reply);
  });

  // Get User Certificates
  server.get(
    '/:user_id',
    {
      schema: {
        params: z.object({ user_id: z.string() }),
      },
    },
    async (request, reply) => {
      return certificatesController.getUserCertificates(request, reply);
    }
  );
};
