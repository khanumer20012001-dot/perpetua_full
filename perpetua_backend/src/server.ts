import { app } from './app';
import { env } from './config/env.config';

// Graceful shutdown
const start = async () => {
  try {
    await app.listen({ port: env.PORT || 8080, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

