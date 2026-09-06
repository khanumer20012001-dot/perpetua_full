import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../../mediator/mediator';
import { GenerateAiCourseCommand } from './handlers/generate-ai-course.handler';

export class GeminiController {
  async handleAiRequest(request: FastifyRequest<any>, reply: FastifyReply) {
    const { action, prompt, content, feedback, material, brief } = request.body as {
      action: 'generate' | 'refine' | 'analyze' | 'discovery' | 'draft';
      prompt?: string;
      content?: string;
      feedback?: string;
      material?: string;
      brief?: string;
    };
    try {
      const result = await mediator.send(
        new GenerateAiCourseCommand(action, { prompt, content, feedback, material, brief })
      );
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ error: error.message });
    }
  }
}

export const geminiController = new GeminiController();
