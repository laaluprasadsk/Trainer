import { randomBytes } from "node:crypto";
import { api, assert, body, text } from "@/lib/http";
import { digest, rateLimit, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { msg91, sendEmail, smsConfigured } from "@/lib/messaging";
export const GET = api(async () => {
  const user = await requireUser();
  return {
    email: user.email,
    phone: user.phoneNumber,
    emailVerified: !!user.emailVerifiedAt,
    phoneVerified: !!user.phoneVerifiedAt,
  };
});
export const POST = api(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const action = text(b.action, "Action");
  await rateLimit(`verification:${user.id}`, 15);
  if (action === "SEND_EMAIL") {
    await rateLimit(`verification-email:${user.id}`, 3);
    assert(process.env.APP_URL, "Email verification is not configured.", 503);
    const token = randomBytes(32).toString("hex");
    const id = digest(token);
    await prisma.$transaction(async (tx) => {
      await tx.authToken.deleteMany({
        where: { userId: user.id, kind: "VERIFY_EMAIL" },
      });
      await tx.authToken.create({
        data: {
          id,
          userId: user.id,
          kind: "VERIFY_EMAIL",
          expiresAt: new Date(Date.now() + 1800000),
        },
      });
    });
    await sendEmail(
      user.email,
      "Verify your Trainrr email",
      `Confirm your email within 30 minutes by opening this secure link:\n${process.env.APP_URL}/verify-account?token=${token}\n\nIf you did not create this account, you can ignore this email.`,
      `verify-${id}`,
    );
    return {
      message: "Verification email sent. The link expires in 30 minutes.",
    };
  }
  if (action === "VERIFY_EMAIL") {
    assert(
      typeof b.token === "string" && b.token.length > 0,
      "This verification link is missing, invalid, expired or already used.",
    );
    const id = digest(text(b.token, "Verification token", 100));
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.authToken.deleteMany({
        where: {
          id,
          userId: user.id,
          kind: "VERIFY_EMAIL",
          expiresAt: { gt: new Date() },
        },
      });
      assert(
        consumed.count === 1,
        "Verification link is invalid, expired or already used.",
      );
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    });
    return { message: "Email verified." };
  }
  smsConfigured();
  const phone = user.phoneNumber.replace(/^\+/, "");
  assert(
    /^91[6-9]\d{9}$/.test(phone),
    "Use an Indian mobile number with +91 in your profile.",
  );
  if (action === "SEND_PHONE") {
    assert(
      process.env.MSG91_OTP_TEMPLATE_ID,
      "OTP template is not configured.",
      503,
    );
    await rateLimit(`otp-send:${phone}`, 3);
    const expiresAt = new Date(Date.now() + 300000);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const old = await tx.phoneChallenge.findUnique({
        where: { userId: user.id },
      });
      assert(
        !old || old.resendAt <= new Date(),
        "Wait 60 seconds before requesting another code.",
        429,
      );
      await tx.phoneChallenge.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          phone,
          expiresAt,
          resendAt: new Date(Date.now() + 60000),
        },
        update: {
          phone,
          attempts: 0,
          expiresAt,
          resendAt: new Date(Date.now() + 60000),
        },
      });
    });
    // MSG91 generates and verifies the code. No plaintext OTP is persisted by Trainrr.
    await msg91(
      `otp?${new URLSearchParams({ template_id: process.env.MSG91_OTP_TEMPLATE_ID, mobile: phone, otp_expiry: "5", otp_length: "6" })}`,
      "POST",
      {},
    );
    return {
      message:
        "Code requested. It expires in five minutes; resend is available after 60 seconds.",
    };
  }
  assert(action === "VERIFY_PHONE", "Unknown verification action.");
  const otp = text(b.otp, "OTP", 6);
  assert(/^\d{6}$/.test(otp), "Enter the six-digit code.");
  const challenge = await prisma.phoneChallenge.findUnique({
    where: { userId: user.id },
  });
  assert(
    challenge && challenge.phone === phone && challenge.expiresAt > new Date(),
    "Request a new code.",
  );
  const attempt = await prisma.phoneChallenge.updateMany({
    where: {
      userId: user.id,
      expiresAt: challenge.expiresAt,
      attempts: { lt: 5 },
    },
    data: { attempts: { increment: 1 } },
  });
  assert(
    attempt.count === 1,
    "Too many attempts. Request a new code after the cooldown.",
    429,
  );
  const result = await msg91(
    `otp/verify?${new URLSearchParams({ mobile: phone, otp })}`,
    "GET",
  );
  assert(result === "OTP verified success", "Code is invalid or already used.");
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.phoneChallenge.deleteMany({
      where: { userId: user.id, phone, expiresAt: challenge.expiresAt },
    });
    assert(consumed.count === 1, "Code already used or replaced.");
    const updated = await tx.user.updateMany({
      where: { id: user.id, phoneNumber: user.phoneNumber },
      data: { phoneVerifiedAt: new Date() },
    });
    assert(updated.count === 1, "Phone changed. Request a new code.");
  });
  return { message: "Phone verified." };
}, true);
