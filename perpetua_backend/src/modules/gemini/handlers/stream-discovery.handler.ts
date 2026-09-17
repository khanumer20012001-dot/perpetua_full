import { ICommand, IHandler } from '../../../mediator/mediator.interface';
import { generateDiscoveryQuestions } from '../gemini.service';

export class StreamDiscoveryQuestionsCommand implements ICommand<{ rawResponse: string; parsed: any }> {
  readonly kind = 'StreamDiscoveryQuestionsCommand';
  constructor(public readonly brief: string) {}
}

export class StreamDiscoveryQuestionsCommandHandler
  implements IHandler<StreamDiscoveryQuestionsCommand, { rawResponse: string; parsed: any }>
{
  async handle(command: StreamDiscoveryQuestionsCommand): Promise<{ rawResponse: string; parsed: any }> {
    const rawResponse = await generateDiscoveryQuestions(command.brief || 'General course brief');
    let parsed: any = null;
    try {
      const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse discovery JSON:', e);
    }
    return { rawResponse, parsed };
  }
}
