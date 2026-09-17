import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { GenerateAiCourseCommand } from '../modules/gemini/handlers/generate-course.handler';
import { StreamDiscoveryQuestionsCommand } from '../modules/gemini/handlers/stream-discovery.handler';
import { StreamCourseDraftCommand } from '../modules/gemini/handlers/stream-draft.handler';

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

  async handleStreamDiscovery(request: FastifyRequest<any>, reply: FastifyReply) {
    const { brief } = request.body as { brief: string };

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    const sendEvent = (event: string, data: any) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('progress', {
        step: 0,
        stepName: 'Analyzing your brief',
        progress: 25,
        info: 'Analyzing target audience & core objectives...',
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

      sendEvent('progress', {
        step: 1,
        stepName: 'Mapping discovery areas',
        progress: 50,
        info: 'Identifying skill gaps & learning domains...',
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

      sendEvent('progress', {
        step: 2,
        stepName: 'Generating questions',
        progress: 75,
        info: 'Formulating discovery question set via AI...',
      });

      const { rawResponse, parsed } = (await mediator.send(
        new StreamDiscoveryQuestionsCommand(brief || 'General course brief')
      )) as { rawResponse: string; parsed: any };

      sendEvent('complete', {
        step: 3,
        stepName: 'Finalizing',
        progress: 100,
        info: 'Discovery plan finalized!',
        result: parsed,
        content: rawResponse,
      });
    } catch (err: any) {
      console.error('Error in stream discovery:', err);
      sendEvent('error', { error: err.message || 'Discovery generation failed' });
    } finally {
      reply.raw.end();
    }
  }

  async handleStreamDraft(request: FastifyRequest<any>, reply: FastifyReply) {
    const { brief } = request.body as { brief: string };

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    const sendEvent = (event: string, data: any) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('progress', {
        progress: 15,
        currentModule: 1,
        totalModules: 5,
        statusText: 'Generating module structure...',
        timeRemainingMinutes: 2,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      sendEvent('progress', {
        progress: 40,
        currentModule: 2,
        totalModules: 5,
        statusText: 'Structuring lessons & chapter content...',
        timeRemainingMinutes: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      sendEvent('progress', {
        progress: 75,
        currentModule: 4,
        totalModules: 5,
        statusText: 'Crafting assessments & 10-question final evaluation...',
        timeRemainingMinutes: 1,
      });

      const { rawResponse, parsed } = (await mediator.send(
        new StreamCourseDraftCommand(brief || 'General course draft')
      )) as { rawResponse: string; parsed: any };

      sendEvent('complete', {
        progress: 100,
        currentModule: parsed?.modules?.length || 5,
        totalModules: parsed?.modules?.length || 5,
        statusText: 'Course content generated!',
        result: parsed,
        content: rawResponse,
      });
    } catch (err: any) {
      console.error('Error in stream draft:', err);
      sendEvent('error', { error: err.message || 'Course draft generation failed' });
    } finally {
      reply.raw.end();
    }
  }
}

export const geminiController = new GeminiController();
