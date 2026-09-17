import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import { ICommand, IHandler } from '../../mediator.interface';
import { authRepository, AuthRepository } from '../../../repositories/auth.repository';

export class RequestOtpCommand implements ICommand<{ message: string }> {
  readonly kind = 'RequestOtpCommand';
  constructor(public readonly email: string) {}
}

export class RequestOtpCommandHandler implements IHandler<RequestOtpCommand, { message: string }> {
  private transporter;

  constructor(private repo: AuthRepository = authRepository) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async handle(command: RequestOtpCommand): Promise<{ message: string }> {
    const code = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.repo.saveOtp(command.email, code, expiresAt);

    try {
      await this.transporter.sendMail({
        from: `"Perpetua Learning" <${process.env.SMTP_EMAIL}>`,
        to: command.email,
        subject: 'Your Perpetua Login Code',
        text: `Your login code is: ${code}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome to Perpetua</h2>
            <p>Your one-time login code is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px; font-size: 32px;">${code}</h1>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('SMTP Error:', error);
      throw new Error('Failed to send OTP email. SMTP Error: ' + (error as Error).message);
    }

    return { message: 'OTP sent successfully' };
  }
}
