import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
nextEnv.loadEnvConfig(process.cwd());
const { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
if (
  !ADMIN_EMAIL ||
  !ADMIN_PHONE ||
  !ADMIN_PASSWORD ||
  ADMIN_PASSWORD.length < 12
)
  throw new Error(
    "Set ADMIN_EMAIL, ADMIN_PHONE and ADMIN_PASSWORD (12+ characters) in your environment.",
  );
const db = new PrismaClient();
try {
  const salt = randomBytes(16).toString("hex");
  await db.user.create({
    data: {
      email: ADMIN_EMAIL.toLowerCase(),
      phoneNumber: ADMIN_PHONE,
      passwordHash: `${salt}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Administrator created. Sign in at /login.");
} finally {
  await db.$disconnect();
}
