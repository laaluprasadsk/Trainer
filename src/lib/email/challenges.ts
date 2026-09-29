import "server-only";
import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assert } from "@/lib/http";
import { digest } from "@/lib/auth";

export const LINK_TTL_MS = 30 * 60 * 1000;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

function challengeSecret() {
  const secret = process.env.EMAIL_TOKEN_SECRET;
  assert(
    secret && secret.length >= 32,
    "Email authentication is temporarily unavailable. Please try again later.",
    503,
  );
  return secret;
}

export function otpDigest(userId: string, kind: string, code: string) {
  return createHmac("sha256", challengeSecret())
    .update(`${userId}:${kind}:${code}`)
    .digest("hex");
}

export async function createLinkChallenge(
  userId: string,
  kind: string,
  payload?: string,
) {
  const token = randomBytes(32).toString("hex");
  const id = digest(token);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.authToken.findFirst({
      where: { userId, kind },
      orderBy: { createdAt: "desc" },
    });
    assert(
      !previous?.resendAt || previous.resendAt <= new Date(),
      "Wait 60 seconds before requesting another email.",
      429,
    );
    await tx.authToken.deleteMany({ where: { userId, kind } });
    await tx.authToken.create({
      data: {
        id,
        userId,
        kind,
        payload,
        resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
        expiresAt: new Date(Date.now() + LINK_TTL_MS),
      },
    });
  });
  return { token, id };
}

export async function createOtpChallenge(userId: string, kind: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const id = otpDigest(userId, kind, code);
  await prisma.$transaction(async (tx) => {
    const previous = await tx.authToken.findFirst({
      where: { userId, kind },
      orderBy: { createdAt: "desc" },
    });
    assert(
      !previous?.resendAt || previous.resendAt <= new Date(),
      "Wait 60 seconds before requesting another code.",
      429,
    );
    await tx.authToken.deleteMany({ where: { userId, kind } });
    await tx.authToken.create({
      data: {
        id,
        userId,
        kind,
        resendAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  });
  return { code, id };
}

export async function consumeOtp(userId: string, kind: string, code: string) {
  assert(/^\d{6}$/.test(code), "Enter the six-digit code.");
  const challenge = await prisma.authToken.findFirst({
    where: { userId, kind },
    orderBy: { createdAt: "desc" },
  });
  assert(
    challenge && challenge.expiresAt > new Date(),
    "This code is invalid or expired. Request a new code.",
  );
  const attempt = await prisma.authToken.updateMany({
    where: {
      id: challenge.id,
      attempts: { lt: MAX_OTP_ATTEMPTS },
      expiresAt: { gt: new Date() },
    },
    data: { attempts: { increment: 1 } },
  });
  assert(
    attempt.count === 1,
    "Too many attempts. Request a new code after the cooldown.",
    429,
  );
  const supplied = Buffer.from(otpDigest(userId, kind, code), "hex");
  const expected = Buffer.from(challenge.id, "hex");
  assert(
    supplied.length === expected.length && timingSafeEqual(supplied, expected),
    "This code is invalid or expired. Request a new code.",
  );
  const consumed = await prisma.authToken.deleteMany({
    where: { id: challenge.id, userId, kind },
  });
  assert(consumed.count === 1, "This code was already used.");
}

export function accountName(user: {
  clientProfile?: { firstName: string } | null;
  trainerProfile?: { firstName: string } | null;
}) {
  return (
    user.clientProfile?.firstName || user.trainerProfile?.firstName || "there"
  );
}
