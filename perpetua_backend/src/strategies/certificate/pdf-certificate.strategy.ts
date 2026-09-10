import { ICertificateStrategy } from './cert-strategy.interface';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF Certificate Strategy
 * Generates a real PDF certificate using pdf-lib and saves it to local disk.
 */
export class PdfCertificateStrategy implements ICertificateStrategy {
  async generate(data: {
    userId: string;
    courseId: string;
    userName: string;
    courseTitle: string;
    completedAt: Date;
  }): Promise<{ certificateUrl?: string; payload: Record<string, unknown> }> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    const verificationId = crypto.randomUUID();

    // Draw Certificate Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 3,
    });

    // Draw Title
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: 100,
      y: height - 80,
      size: 24,
      font,
      color: rgb(0.1, 0.2, 0.5),
    });

    page.drawText('This is to certify that', {
      x: 210,
      y: height - 130,
      size: 14,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Learner Name
    page.drawText(data.userName || 'Learner', {
      x: 150,
      y: height - 170,
      size: 22,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText('has successfully completed the course:', {
      x: 170,
      y: height - 210,
      size: 14,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Course Title
    page.drawText(data.courseTitle || 'Course', {
      x: 120,
      y: height - 250,
      size: 18,
      font,
      color: rgb(0.1, 0.5, 0.3),
    });

    // Date & Verification ID
    page.drawText(`Issued on: ${data.completedAt.toISOString().split('T')[0]}`, {
      x: 50,
      y: 50,
      size: 10,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`Verification ID: ${verificationId}`, {
      x: 250,
      y: 50,
      size: 10,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `cert_${data.userId}_${verificationId}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    const certificateUrl = `/uploads/certificates/${filename}`;

    const payload = {
      format: 'PDF',
      verificationId,
      issuedTo: data.userName,
      courseTitle: data.courseTitle,
      completedAt: data.completedAt.toISOString(),
      filePath,
      certificateUrl,
    };

    return {
      certificateUrl,
      payload,
    };
  }
}

export const pdfCertificateStrategy = new PdfCertificateStrategy();

