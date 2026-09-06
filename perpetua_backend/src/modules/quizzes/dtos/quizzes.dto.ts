// ─── Quiz / Assessment DTOs ───────────────────────────────────────────────────

export interface SubmitQuizDTO {
  quiz_id: string;
  user_id: string;
  answers: Array<{
    question_id: string;
    selected_option_index: number;
  }>;
}

export interface QuizResultDTO {
  score_percent: number;
  passed: boolean;
  total_questions: number;
  correct_count: number;
}
