import { ICommand, IHandler } from '../../../mediator/mediator.interface';
import { generateCourseDraft } from '../gemini.service';
import { sanitizeCourseJson } from '../../../shared/utils/content-sanitizer';

export class StreamCourseDraftCommand implements ICommand<{ rawResponse: string; parsed: any }> {
  readonly kind = 'StreamCourseDraftCommand';
  constructor(public readonly brief: string, public readonly onChunk?: (text: string) => void) {}
}

export class StreamCourseDraftCommandHandler
  implements IHandler<StreamCourseDraftCommand, { rawResponse: string; parsed: any }>
{
  async handle(command: StreamCourseDraftCommand): Promise<{ rawResponse: string; parsed: any }> {
    const rawResponse = await generateCourseDraft(command.brief || 'General course draft', command.onChunk);

    let parsed: any = null;
    try {
      let cleaned = rawResponse.trim();
      
      // Extract from the first '{' to the last '}' to ignore any markdown wrapping or conversational text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        // Fallback: If AI included literal unescaped newlines, we try to fix them by replacing literal newlines with \\n
        // Only if it's inside quotes? It's safer to just replace all literal newlines with space if we absolutely have to, 
        // but let's try to just use a basic cleanup.
        cleaned = cleaned.replace(/[\u0000-\u001F]+/g, ' ');
        parsed = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('Failed to parse AI generated course draft JSON:', e);
      throw new Error('Failed to parse AI generated course draft. Please try again.');
    }

    if (!parsed || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      throw new Error('AI generated an empty or invalid course structure. Please try again.');
    }

    parsed = sanitizeCourseJson(parsed);

    // Ensure the assessment module is titled and structured properly
    let assessmentMod = parsed.modules.find(
      (m: any) => m.title && (m.title.toLowerCase().includes('assessment') || m.title.toLowerCase().includes('readiness'))
    );

    if (assessmentMod) {
      assessmentMod.title = 'Course Assessment';
      assessmentMod.subtitle = 'Final Readiness Check Assessment';
      if (Array.isArray(assessmentMod.questions) && assessmentMod.questions.length > 0) {
        assessmentMod.quiz = assessmentMod.questions[0];
      }
    }

    return { rawResponse, parsed };
  }
}
