import { api, assert, body, text } from "@/lib/http";
import {
  createSession,
  digest,
  normalizeEmail,
  rateLimit,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountName, createLinkChallenge } from "@/lib/email/challenges";
import {
  sendEmailChanged,
  sendEmailChangeVerification,
} from "@/lib/email/auth-emails";

export const POST = api(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const action = text(b.action, "Action", 20);
  await rateLimit(`email-change:${user.id}`, 10);

  if (action === "REQUEST") {
    assert(
      verifyPassword(
        text(b.currentPassword, "Current password", 128),
        user.passwordHash,
      ),
      "Current password is incorrect.",
      401,
    );
    const newEmail = normalizeEmail(text(b.newEmail, "New email", 254));
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail), "Enter a valid email.");
    assert(newEmail !== user.email, "Enter a different email address.");
    const owner = await prisma.user.findUnique({ where: { email: newEmail } });
    assert(!owner, "This email address is unavailable.", 409);
    await rateLimit(`email-change-send:${user.id}`, 3);
    const recent = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        kind: "CHANGE_EMAIL",
        resendAt: { gt: new Date() },
      },
    });
    if (recent)
      return {
        message:
          "A confirmation email was sent recently. Check your inbox or wait 60 seconds to resend.",
      };
    const { token, id } = await createLinkChallenge(
      user.id,
      "CHANGE_EMAIL",
      newEmail,
    );
    await sendEmailChangeVerification(
      { id: user.id, email: user.email, name: accountName(user) },
      newEmail,
      token,
      id,
    );
    return {
      message:
        "Confirmation sent to the new address. The link expires in 30 minutes.",
    };
  }

  assert(action === "CONFIRM", "Unknown email-change action.", 404);
  const token = text(b.token, "Email change token", 100);
  const oldEmail = user.email;
  const changed = await prisma.$transaction(async (tx) => {
    const challenge = await tx.authToken.findUnique({
      where: { id: digest(token) },
    });
    assert(
      challenge &&
        challenge.userId === user.id &&
        challenge.kind === "CHANGE_EMAIL" &&
        challenge.payload &&
        challenge.expiresAt > new Date(),
      "This email change link is invalid, expired or already used.",
    );
    const existing = await tx.user.findUnique({
      where: { email: challenge.payload },
    });
    assert(!existing, "This email address is unavailable.", 409);
    const consumed = await tx.authToken.deleteMany({
      where: { id: challenge.id, userId: user.id, kind: "CHANGE_EMAIL" },
    });
    assert(consumed.count === 1, "This email change link was already used.");
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { email: challenge.payload, emailVerifiedAt: new Date() },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    return { updated, challenge };
  });
  await createSession(user.id);
  const person = {
    id: user.id,
    email: changed.updated.email,
    name: accountName(user),
  };
  await Promise.allSettled([
    sendEmailChanged(
      person,
      oldEmail,
      changed.updated.email,
      `old-${changed.challenge.id}`,
    ),
    sendEmailChanged(
      person,
      changed.updated.email,
      changed.updated.email,
      `new-${changed.challenge.id}`,
    ),
  ]);
  return {
    message: "Email address changed. Other sessions were signed out.",
    email: changed.updated.email,
  };
}, true);
