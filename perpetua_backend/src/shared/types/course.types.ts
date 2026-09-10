// ─── Course DTOs ──────────────────────────────────────────────────────────────

export interface CreateCourseDTO {
  title: string;
  description: string;
  cover_image?: string;
  created_by_id: string;
}

export interface CreateModuleDTO {
  course_id: string;
  title: string;
  subtitle?: string;
  order: number;
}

export interface CreateChapterDTO {
  module_id: string;
  title: string;
  content: string;          // Markdown content
  duration: number;         // Duration in minutes
  order: number;
}

export interface CreateFullCourseDTO {
  title: string;
  description?: string;
  created_by_id: string;
  modules: Array<{
    title: string;
    duration?: string;
    content: string;
    quiz?: {
      question: string;
      options: string[];
      correctAnswerIndex: number;
    };
  }>;
}

export interface CourseResponseDTO {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  status: string;
  created_by_id: string;
  created_at: Date;
}
