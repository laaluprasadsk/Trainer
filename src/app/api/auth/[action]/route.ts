import { randomBytes } from "node:crypto";
import { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { api, assert, body, HttpError, text } from "@/lib/http";
import {
  createSession,
  currentUser,
  digest,
  hashPassword,
  logout,
  normalizeEmail,
  normalizePhone,
  publicUser,
  rateLimit,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { sendEmail } from "@/lib/messaging";
export const GET = api(async () => {
  const user = await currentUser();
  return { user: user ? publicUser(user) : null };
});
export const POST = api(async (req) => {
  const action = new URL(req.url).pathname.split("/").pop();
  if (action === "logout") {
    await logout();
    return {};
  }
  await rateLimit("auth:global", 500);
  const b = await body(req);
  if (action === "reset") {
    assert(
      typeof b.token === "string" && b.token.length > 0,
      "This password reset link is missing or invalid.",
    );
    const token = text(b.token, "Reset token", 100);
    const password = text(b.password, "Password", 128);
    assert(password === b.confirmPassword, "Passwords do not match.");
    const hash = hashPassword(password);
    await prisma.$transaction(async (tx) => {
      const row = await tx.authToken.findUnique({
        where: { id: digest(token) },
      });
      assert(
        row && row.kind === "RESET" && row.expiresAt > new Date(),
        "Reset link is invalid or expired.",
      );
      const consumed = await tx.authToken.deleteMany({ where: { id: row.id } });
      assert(consumed.count === 1, "Reset link already used.");
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash: hash },
      });
      await tx.session.deleteMany({ where: { userId: row.userId } });
    });
    return { message: "Password reset. Sign in with your new password." };
  }
  if (action === "password") {
    const u = await requireUser();
    assert(
      verifyPassword(
        text(b.currentPassword, "Current password", 128),
        u.passwordHash,
      ),
      "Current password is incorrect.",
    );
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hashPassword(text(b.password, "Password", 128)) },
    });
    await prisma.session.deleteMany({ where: { userId: u.id } });
    await createSession(u.id);
    return { message: "Password changed. Other sessions were signed out." };
  }
  const email = normalizeEmail(text(b.email, "Email", 254));
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email.");
  await rateLimit(`auth:${email}`);
  if (action === "forgot") {
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      user &&
      process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.APP_URL
    ) {
      const token = randomBytes(32).toString("hex");
      const tokenId = digest(token);
      await prisma.$transaction(async (tx) => {
        await tx.authToken.deleteMany({
          where: { userId: user.id, kind: "RESET" },
        });
        await tx.authToken.create({
          data: {
            id: tokenId,
            userId: user.id,
            kind: "RESET",
            expiresAt: new Date(Date.now() + 1800000),
          },
        });
      });
      await sendEmail(
        email,
        "Reset your Trainrr password",
        `Use this secure link within 30 minutes to choose a new password:\n${process.env.APP_URL}/reset-password?token=${token}\n\nIf you did not request this, you can ignore this email.`,
        `reset-${tokenId}`,
      );
    }
    return { message: "If this account exists, a reset link has been sent." };
  }
  const password = text(b.password, "Password", 128);
  if (action === "register") {
    const role = b.role || "CLIENT";
    assert(role === "CLIENT" || role === "TRAINER", "Invalid account role.");
    const firstName = text(b.firstName, "First name", 80);
    const lastName = text(b.lastName, "Last name", 80);
    assert(password === b.confirmPassword, "Passwords do not match.");
    const phoneNumber = normalizePhone(text(b.phone, "Phone", 30));
    assert(
      /^\+?[0-9]{8,15}$/.test(phoneNumber),
      "Enter a valid phone number including country code.",
    );
    let user: User;
    try {
      user = await prisma.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash: hashPassword(password),
          role,
          status: "ACTIVE",
          ...(role === "CLIENT"
            ? {
                clientProfile: {
                  create: { firstName, lastName, fitnessGoals: [] },
                },
              }
            : {
                trainerProfile: {
                  create: {
                    firstName,
                    lastName,
                    slug: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomBytes(6).toString("hex")}`,
                    hourlyRate: 1000,
                    homeLocationName: "",
                    specializations: [],
                    verificationStatus: "PENDING",
                  },
                },
              }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = String(error.meta?.target || "");
        assert(
          !target.includes("email"),
          "An account already exists with this email. Sign in or reset your password.",
          409,
        );
        throw new HttpError(
          409,
          "An account already exists with this phone number. Sign in or use another number.",
        );
      }
      throw error;
    }
    await prisma.notification.create({
      data: {
        userId: user.id,
        message:
          "Welcome to Trainrr. Verify your email and phone at /verify-account before your first booking.",
        href: "/verify-account",
      },
    });
    if (role === "TRAINER") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          message: `New trainer registration: ${firstName} ${lastName}. Awaiting onboarding documents.`,
          href: "/admin",
        })),
      });
    }
    await createSession(user.id);
  } else if (action === "login") {
    const user = await prisma.user.findUnique({ where: { email } });
    assert(
      user && verifyPassword(password, user.passwordHash),
      "Email or password is incorrect.",
      401,
    );
    assert(
      user.status === "ACTIVE",
      "This account is not active. Contact support.",
      403,
    );
    await createSession(user.id);
  } else assert(false, "Unknown authentication action.", 404);
  const user = await currentUser();
  assert(user, "Unable to create session.", 503);
  return { user: publicUser(user) };
}, true);
