// ─── User DTOs ────────────────────────────────────────────────────────────────

export interface UpdateUserRoleDTO {
  user_id: string;
  role: 'LEARNER' | 'DESIGNER' | 'ADMIN';
}

export interface UserResponseDTO {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}
