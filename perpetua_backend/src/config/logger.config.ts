import { env } from './env.config';

// Simple logger config — avoids pino-pretty dependency requirement.
// In development: pretty logs via Fastify's built-in logger: true
// In production: structured JSON logs
export const loggerConfig: boolean | object =
  env.NODE_ENV === 'production'
    ? { level: 'info' }
    : true;

