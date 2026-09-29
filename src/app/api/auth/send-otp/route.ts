import { api, assert, body, text } from "@/lib/http";
import { normalizeEmail, rateLimit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountName, createOtpChallenge } from "@/lib/email/challenges";
import { sendEmailOtp } from "@/lib/email/auth-emails";

const neutral = {
  message: "If this account can sign in, a six-digit code has been sent.",
};

export const POST = api(async (req) => {
  const b = await body(req);
  const email = normalizeEmail(text(b.email, "Email", 254));
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email.");
  await rateLimit("email-login-otp:global", 500);
  await rateLimit(`email-login-otp:${email}`, 3);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { clientProfile: true, trainerProfile: true },
  });
  if (!user || user.status !== "ACTIVE") return neutral;
  try {
    const recent = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        kind: "EMAIL_LOGIN_OTP",
        resendAt: { gt: new Date() },
      },
    });
    if (!recent) {
      const { code, id } = await createOtpChallenge(user.id, "EMAIL_LOGIN_OTP");
      await sendEmailOtp(
        { id: user.id, email: user.email, name: accountName(user) },
        code,
        id,
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "login_otp_delivery_failed",
        error: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  }
  return neutral;
}, true);
