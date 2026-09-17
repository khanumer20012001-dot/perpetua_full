import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5433/postgres?schema=public";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
