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
    reply.raw.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (reply.raw as any).flush === 'function') {
        (reply.raw as any).flush();
      }
    };

    let currentProgress = 15;
    let latestTitle = "";
    let accumulatedText = "";
    let generatedModulesCount = 1;

    sendEvent('progress', {
      progress: currentProgress,
      currentModule: 1,
      totalModules: 5,
      statusText: 'Analyzing brief and initializing AI...',
      timeRemainingMinutes: 2,
    });

    const onChunk = (chunk: string) => {
      accumulatedText += chunk;
      const titleMatches = [...accumulatedText.matchAll(/"title"\s*:\s*"([^"]+)"/g)];
      if (titleMatches.length > 0) {
        const lastTitle = titleMatches[titleMatches.length - 1][1];
        if (lastTitle !== latestTitle) {
          latestTitle = lastTitle;
          generatedModulesCount = Math.max(1, Math.min(5, titleMatches.length));
          
          sendEvent('progress', {
            progress: currentProgress,
            currentModule: generatedModulesCount,
            totalModules: 5,
            statusText: `Generating: ${latestTitle}...`,
            timeRemainingMinutes: 1,
          });
        }
      }
    };

    // Start a heartbeat interval to simulate ongoing work
    const heartbeat = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 3) + 1; // Increment by 1-3%
        
        let statusText = latestTitle ? `Generating: ${latestTitle}...` : 'Structuring lessons & chapter content...';
        
        sendEvent('progress', {
          progress: currentProgress,
          currentModule: generatedModulesCount,
          totalModules: 5,
          statusText,
          timeRemainingMinutes: 1,
        });
      }
    }, 2000); // Send an update every 2 seconds

    try {
      const { rawResponse, parsed } = (await mediator.send(
        new StreamCourseDraftCommand(brief || 'General course draft', onChunk)
      )) as { rawResponse: string; parsed: any };

      clearInterval(heartbeat);

      sendEvent('complete', {
        progress: 100,
        currentModule: parsed?.modules?.length || 5,
        totalModules: parsed?.modules?.length || 5,
        statusText: 'Course content generated!',
        result: parsed,
        content: rawResponse,
      });
    } catch (err: any) {
      clearInterval(heartbeat);
      console.error('Error in stream draft:', err);
      sendEvent('error', { error: err.message || 'Course draft generation failed' });
    } finally {
      reply.raw.end();
    }
  }
}

export const geminiController = new GeminiController();
