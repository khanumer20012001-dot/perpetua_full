import { ICertificateStrategy } from './cert-strategy.interface';
import crypto from 'crypto';

/**
 * JSON Certificate Strategy
 * Generates a verifiable JSON certificate payload with a unique verification ID.
 * Future enhancement: generate an actual PDF using PDFKit or Puppeteer.
 */
export class JsonCertificateStrategy implements ICertificateStrategy {
  async generate(data: {
    userId: string;
    courseId: string;
    userName: string;
    courseTitle: string;
    completedAt: Date;
  }): Promise<{ certificateUrl?: string; payload: Record<string, unknown> }> {
    const verificationId = crypto.randomUUID();

    const payload = {
      verificationId,
      issuedTo: data.userName,
      courseTitle: data.courseTitle,
      completedAt: data.completedAt.toISOString(),
      issuedBy: 'Perpetua Learning Platform',
      verifyUrl: `/api/certificates/verify/${verificationId}`,
    };

    return { payload };
  }
}

export const jsonCertificateStrategy = new JsonCertificateStrategy();
