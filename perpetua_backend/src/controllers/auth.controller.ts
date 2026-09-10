import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { RequestOtpCommand } from '../mediator/commands/auth/request-otp.handler';
import { VerifyOtpCommand } from '../mediator/commands/auth/verify-otp.handler';

export class AuthController {
  async requestOtp(request: FastifyRequest<any>, reply: FastifyReply) {
    const { email } = request.body as { email: string };
    try {
      const result = await mediator.send(new RequestOtpCommand(email));
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async verifyOtp(request: FastifyRequest<any>, reply: FastifyReply, appJwt: any) {
    const { email, code } = request.body as { email: string; code: string };
    try {
      const { user } = (await mediator.send(new VerifyOtpCommand(email, code))) as { user: any };
      const token = appJwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error: any) {
      return reply.status(error.statusCode || 400).send({ detail: error.message });
    }
  }
}

export const authController = new AuthController();
