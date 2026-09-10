import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env.config';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
});
