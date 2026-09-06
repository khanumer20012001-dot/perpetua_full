/**
 * Auth Strategy Interface (Strategy Pattern)
 * Defines the contract for all authentication strategies.
 * Current implementation: OTP Email Auth
 * Future: Google OAuth, GitHub OAuth
 */
export interface IAuthStrategy {
  /**
   * Generate and send an OTP or auth token for the given email.
   */
  generateAndSend(email: string): Promise<{ code: string; expiresAt: Date }>;

  /**
   * Verify the provided code/token for the given email.
   */
  verify(email: string, code: string): Promise<boolean>;
}
