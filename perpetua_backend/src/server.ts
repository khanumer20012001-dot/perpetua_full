import { app } from './app';

// Graceful shutdown
const start = async () => {
  try {
    await app.listen({ port: 8000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
