import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password@localhost:5433/postgres?schema=public"
    }
  }
});
