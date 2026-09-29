import { api, assert, body, text } from "@/lib/http";
import {
  createSession,
  normalizeEmail,
  publicUser,
  rateLimit,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountName, consumeOtp } from "@/lib/email/challenges";
import { sendLoginAlert } from "@/lib/email/auth-emails";

export const POST = api(async (req) => {
  const b = await body(req);
  const email = normalizeEmail(text(b.email, "Email", 254));
  const otp = text(b.otp, "Code", 6);
  assert(/^\d{6}$/.test(otp), "Enter the six-digit code.");
  await rateLimit("email-login-verify:global", 1000);
  await rateLimit(`email-login-verify:${email}`, 10);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { clientProfile: true, trainerProfile: true },
  });
  assert(
    user && user.status === "ACTIVE",
    "This code is invalid or expired. Request a new code.",
    401,
  );
  await consumeOtp(user.id, "EMAIL_LOGIN_OTP", otp);
  await createSession(user.id);
  try {
    await sendLoginAlert(
      { id: user.id, email: user.email, name: accountName(user) },
      Date.now().toString(36),
    );
  } catch {}
  return { user: publicUser(user) };
}, true);
