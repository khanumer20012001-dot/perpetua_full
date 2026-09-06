// ─── Assessment (Quiz) Commands ───────────────────────────────────────────────

export class SubmitQuizCommand {
  readonly type = 'SubmitQuizCommand' as const;
  constructor(
    public readonly quizId: string,
    public readonly userId: string,
    public readonly answers: Array<{
      questionId: string;
      selectedOptionIndex: number;
    }>
  ) {}
}
