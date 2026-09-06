import { IAuthStrategy } from './auth-strategy.interface';
import { generateOtp, expiresInMinutes } from '../../common/utils/helpers';

/**
 * OTP Email Auth Strategy
 * Generates a 6-digit numeric OTP and returns expiry time.
 * The actual email dispatch is handled by AuthService (via Nodemailer).
 */
export class OtpAuthStrategy implements IAuthStrategy {
  async generateAndSend(_email: string): Promise<{ code: string; expiresAt: Date }> {
    const code = generateOtp(6);
    const expiresAt = expiresInMinutes(5);
    return { code, expiresAt };
  }

  async verify(_email: string, _code: string): Promise<boolean> {
    // Actual verification is done in AuthRepository (checks OTP record in DB)
    // This method exists for interface compliance
    return true;
  }
}

export const otpAuthStrategy = new OtpAuthStrategy();
