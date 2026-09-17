import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import { GenerateAiCourseCommandHandler } from '../modules/gemini/handlers/generate-course.handler';
import { geminiController } from '../controllers/gemini.controller';

// Register mediator handler
mediator.register('GenerateAiCourseCommand', new GenerateAiCourseCommandHandler());

export const geminiRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/',
    {
      schema: {
        body: z.object({
          action: z.enum(['generate', 'refine', 'analyze', 'discovery', 'draft']),
          prompt: z.string().optional(),
          content: z.string().optional(),
          feedback: z.string().optional(),
          material: z.string().optional(),
          brief: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      return geminiController.handleAiRequest(request, reply);
    }
  );

  server.post(
    '/stream-discovery',
    {
      schema: {
        body: z.object({
          brief: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      return geminiController.handleStreamDiscovery(request, reply);
    }
  );

  server.post(
    '/stream-draft',
    {
      schema: {
        body: z.object({
          brief: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      return geminiController.handleStreamDraft(request, reply);
    }
  );
};
