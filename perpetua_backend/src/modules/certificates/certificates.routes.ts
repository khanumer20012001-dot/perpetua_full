import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../../mediator/mediator';
import { IssueCertificateCommandHandler } from './handlers/issue-certificate.handler';
import { certificatesController } from './certificates.controller';

// Register mediator handler
mediator.register('IssueCertificateCommand', new IssueCertificateCommandHandler());

export const certificateRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Issue Certificate
  server.post(
    '/issue',
    {
      schema: {
        body: z.object({
          user_id: z.string(),
          course_id: z.string(),
        }),
      },
    },
    async (request, reply) => {
      return certificatesController.issueCertificate(request, reply);
    }
  );
};
