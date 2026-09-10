// ─── Enrollment DTOs ──────────────────────────────────────────────────────────

export interface EnrollCourseDTO {
  course_id: string;
  user_id: string;
}

export interface UpdateProgressDTO {
  enrollment_id: string;
  completed_chapters: number;
  total_chapters: number;
}

export interface EnrollmentResponseDTO {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: Date;
  completed_at?: Date;
}
