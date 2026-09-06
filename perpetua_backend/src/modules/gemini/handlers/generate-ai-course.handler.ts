import { ICommand, IHandler } from '../../../mediator/mediator.interface';
import * as geminiService from '../../../services/gemini';
import { BadRequestError } from '../../../common/errors/custom-errors';

export class GenerateAiCourseCommand implements ICommand<{ content: string }> {
  readonly kind = 'GenerateAiCourseCommand';
  constructor(
    public readonly action: 'generate' | 'refine' | 'analyze' | 'discovery' | 'draft',
    public readonly payload: {
      prompt?: string;
      content?: string;
      feedback?: string;
      material?: string;
      brief?: string;
    }
  ) {}
}

export class GenerateAiCourseCommandHandler
  implements IHandler<GenerateAiCourseCommand, { content: string }>
{
  async handle(command: GenerateAiCourseCommand): Promise<{ content: string }> {
    const { action, payload } = command;
    let result = '';

    switch (action) {
      case 'generate':
        if (!payload.prompt) throw new BadRequestError('prompt is required');
        result = await geminiService.generateCourseContent(payload.prompt);
        break;
      case 'refine':
        if (!payload.content || !payload.feedback)
          throw new BadRequestError('content and feedback are required');
        result = await geminiService.refineCourseContent(payload.content, payload.feedback);
        break;
      case 'analyze':
        if (!payload.material) throw new BadRequestError('material is required');
        result = await geminiService.analyzeSourceMaterial(payload.material);
        break;
      case 'discovery':
        if (!payload.brief) throw new BadRequestError('brief is required');
        result = await geminiService.generateDiscoveryQuestions(payload.brief);
        break;
      case 'draft':
        if (!payload.brief) throw new BadRequestError('brief is required');
        result = await geminiService.generateCourseDraft(payload.brief);
        break;
    }

    return { content: result };
  }
}
