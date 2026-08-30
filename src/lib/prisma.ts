import { PrismaClient } from "@prisma/client";

const dbUrl =
  "postgresql://postgres.rzesylsnicaheicrqrou:FitnessAppBengaluru2026@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

// Ensure process.env.DATABASE_URL is always defined for Prisma internal validator
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;