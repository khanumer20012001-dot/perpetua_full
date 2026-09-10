// ─── Certificate DTOs ─────────────────────────────────────────────────────────

export interface CertificateResponseDTO {
  id: string;
  user_id: string;
  course_id: string;
  verification_id: string;
  issued_at: Date;
  payload: Record<string, unknown>;
}
