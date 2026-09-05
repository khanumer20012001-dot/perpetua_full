import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';

export const authRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Nodemailer transport using the real Gmail credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  server.post(
    '/request-otp',
    {
      schema: {
        body: z.object({
          email: z.string().email()
        })
      }
    },
    async (request, reply) => {
      const { email } = request.body;

      // Generate a 6-digit OTP
      const code = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

      // Save to database with 5 minutes expiration
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      await prisma.otpCode.create({
        data: {
          email,
          code,
          expiresAt
        }
      });

      // Send the real email via Gmail
      try {
        await transporter.sendMail({
          from: `"Perpetua Learning" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: 'Your Perpetua Login Code',
          text: `Your login code is: ${code}. It expires in 5 minutes.`,
          html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
              <h2>Welcome to Perpetua</h2>
              <p>Your one-time login code is:</p>
              <h1 style="color: #4F46E5; letter-spacing: 5px; font-size: 32px;">${code}</h1>
              <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
            </div>
          `
        });
      } catch (error) {
        console.error("SMTP Error:", error);
        return reply.status(500).send({ detail: "Failed to send OTP email. SMTP Error: " + (error as Error).message });
      }

      return { message: "OTP sent successfully" };
    }
  );

  server.post(
    '/verify-otp',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          code: z.string().length(6)
        })
      }
    },
    async (request, reply) => {
      const { email, code } = request.body;

      // Find the OTP code in the database
      const otpRecord = await prisma.otpCode.findFirst({
        where: { email, code },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return reply.status(400).send({ detail: "Invalid code" });
      }

      if (otpRecord.expiresAt < new Date()) {
        return reply.status(400).send({ detail: "Code has expired" });
      }

      // Valid OTP! Delete it so it can't be reused
      await prisma.otpCode.delete({ where: { id: otpRecord.id } });

      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } });

      // If user doesn't exist, create them
      if (!user) {
        const defaultName = email.split('@')[0];
        user = await prisma.user.create({
          data: {
            email,
            fullName: defaultName,
            role: 'LEARNER'
          }
        });
      }

      // Generate a JWT token containing their user ID and role
      const token = app.jwt.sign({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      return { 
        message: "Login successful", 
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      };
    }
  );
};
