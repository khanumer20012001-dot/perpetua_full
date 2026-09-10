// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface SendOtpDTO {
  email: string;
}

export interface VerifyOtpDTO {
  email: string;
  code: string;
}

export interface AuthResponseDTO {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
