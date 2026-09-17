import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { GenerateAiCourseCommand } from '../modules/gemini/handlers/generate-course.handler';
import { generateDiscoveryQuestions, generateCourseDraft } from '../modules/gemini/gemini.service';

function create10CourseQuestions(courseTitle: string, modules: any[]): any[] {
  const title = courseTitle || 'Course Material';
  const modTitles = modules.map((m: any) => m.title).filter(Boolean);

  return [
    {
      question: `What is the primary objective of ${title}?`,
      options: [
        `Mastering core concepts, practical skills, and industry best practices in ${title}`,
        `Rushing execution without proper planning or verification`,
        `Disabling error logging and system monitoring`,
        `Relying exclusively on unverified manual workarounds`
      ],
      correctAnswerIndex: 0
    },
    {
      question: `Which requirement is critical during the initial phase of ${modTitles[0] || title}?`,
      options: [
        `Executing commands without environment verification`,
        `Establishing clear baselines, analyzing prerequisites, and configuring essential tools`,
        `Deleting repository history to start from scratch`,
        `Skipping initial setup to speed up deployment`
      ],
      correctAnswerIndex: 1
    },
    {
      question: `When implementing concepts from ${modTitles[1] || title}, what is the recommended configuration practice?`,
      options: [
        `Hardcoding access credentials directly in source files`,
        `Storing sensitive configurations in secure, versioned environment variables`,
        `Disabling authentication mechanisms during testing`,
        `Sharing API keys in public repositories`
      ],
      correctAnswerIndex: 1
    },
    {
      question: `What is a key indicator of clean and maintainable architecture in ${title}?`,
      options: [
        `High coupling and redundant logic across modules`,
        `Modular separation of concerns, readability, and consistent design patterns`,
        `Absence of inline documentation and type definitions`,
        `Ignoring error handling for edge cases`
      ],
      correctAnswerIndex: 1
    },
    {
      question: `How should runtime exceptions and system errors be handled in ${modTitles[2] || title}?`,
      options: [
        `Suppressing exceptions silently without logging`,
        `Inspecting detailed tracebacks, identifying the root cause, and applying verified fixes`,
        `Restarting the service repeatedly without investigating`,
        `Commenting out failing assertions in unit tests`
      ],
      correctAnswerIndex: 1
    },
    {
      question: `What is the primary benefit of continuous testing and validation in ${title}?`,
      options: [
        `Detecting regressions early and ensuring compliance with quality standards`,
        `Slowing down development without providing value`,
        `Increasing server resource consumption unnecessarily`,
        `Replacing the need for architectural planning`
      ],
      correctAnswerIndex: 0
    },
    {
      question: `When scaling applications built with ${title}, which pattern provides optimal performance?`,
      options: [
        `Monolithic single-point-of-failure deployment`,
        `Asynchronous processing, efficient state management, and resource caching`,
        `Increasing network timeout limits indefinitely`,
        `Disabling database indexing to reduce storage`
      ],
      correctAnswerIndex: 1
    },
    {
      question: `In professional projects utilizing ${title}, why is clear technical documentation essential?`,
      options: [
        `It enables seamless team onboarding, maintainability, and knowledge transfer`,
        `It is purely decorative and serves no technical purpose`,
        `It restricts developers from updating code`,
        `It increases build and deployment latency`
      ],
      correctAnswerIndex: 0
    },
    {
      question: `What is the purpose of conducting a Readiness Check before deployment in ${title}?`,
      options: [
        `To verify that all learning objectives and operational criteria are met`,
        `To delay project completion artificially`,
        `To replace automated unit test suites`,
        `To prevent users from accessing the system`
      ],
      correctAnswerIndex: 0
    },
    {
      question: `Upon completing all modules of ${title}, what should a learner be capable of?`,
      options: [
        `Applying learned principles independently to solve real-world problems effectively`,
        `Memorizing definitions without understanding implementation details`,
        `Ignoring industry standards and established patterns`,
        `Avoiding further learning and professional development`
      ],
      correctAnswerIndex: 0
    }
  ];
}

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

      const rawResponse = await generateDiscoveryQuestions(brief || 'General course brief');
      
      let parsed = null;
      try {
        const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse discovery JSON:', e);
      }

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

      const rawResponse = await generateCourseDraft(brief || 'General course draft');

      let parsed: any = null;
      try {
        let cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        cleaned = cleaned.replace(/[\u0000-\u001F]+/g, ' ');
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse course draft JSON:', e);
      }

      if (parsed && Array.isArray(parsed.modules)) {
        let assessmentMod = parsed.modules.find(
          (m: any) => m.title && (m.title.toLowerCase().includes('assessment') || m.title.toLowerCase().includes('readiness'))
        );

        const generatedQuestions = create10CourseQuestions(parsed.courseTitle || 'Course', parsed.modules);

        if (!assessmentMod) {
          assessmentMod = {
            id: `m_assessment_${Date.now()}`,
            title: 'Course Assessment',
            subtitle: 'Final Readiness Check Assessment',
            duration: '25 mins',
            content: `This final readiness check assessment evaluates your mastery of all key concepts covered in **${parsed.courseTitle || 'this course'}**. Answer all 10 questions to verify your learning outcomes.`,
            questions: generatedQuestions,
            quiz: generatedQuestions[0]
          };
          parsed.modules.push(assessmentMod);
        } else {
          assessmentMod.title = 'Course Assessment';
          assessmentMod.subtitle = 'Final Readiness Check Assessment';
          assessmentMod.questions = generatedQuestions;
          assessmentMod.quiz = generatedQuestions[0];
        }
      }

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

