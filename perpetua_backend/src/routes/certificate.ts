import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../db/prisma';

export const certificateRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Issue Certificate
  server.post(
    '/issue',
    {
      schema: {
        body: z.object({
          user_id: z.string(),
          course_id: z.string()
        })
      }
    },
    async (request, reply) => {
      const { user_id, course_id } = request.body;

      // Check if they have 100% progress
      const enrollment = await prisma.enrollment.findFirst({
        where: { course_id, user_id }
      });

      if (!enrollment || enrollment.progress_percent < 100.0) {
        return reply.status(400).send({ detail: "Course not fully completed yet" });
      }

      // Check if already issued
      const existingCert = await prisma.certificate.findFirst({
        where: { course_id, user_id }
      });

      if (existingCert) {
        return { message: "Certificate already issued", certificate_id: existingCert.id };
      }

      // Issue new certificate
      const newCert = await prisma.certificate.create({
        data: {
          user_id,
          course_id,
          issued_at: new Date()
        }
      });

      return { message: "Certificate issued successfully", certificate_id: newCert.id };
    }
  );
};
