import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { assert, HttpError } from "./http";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export function normalizePhone(value: string) {
  const trimmed = value.trim();
  assert(
    /^(?:\+|00)?[0-9][0-9\s().-]*$/.test(trimmed),
    "Enter a valid international phone number.",
  );
  const international = trimmed.startsWith("00")
    ? `+${trimmed.slice(2)}`
    : trimmed;
  const digits = international.replace(/\D/g, "");
  return `+${digits}`;
}
export function hashPassword(password: string) {
  assert(
    password.length >= 12 && password.length <= 128,
    "Use a password between 12 and 128 characters.",
  );
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key || key.length !== 128 || password.length > 128)
    return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(key, "hex"),
  );
}
export async function currentUser() {
  const token = (await cookies()).get("trainer_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: digest(token) },
    include: {
      user: { include: { clientProfile: true, trainerProfile: true } },
    },
  });
  return session &&
    session.expiresAt > new Date() &&
    session.user.status === "ACTIVE"
    ? session.user
    : null;
}
export async function requireUser(role?: UserRole) {
  const user = await currentUser();
  assert(user, "Sign in to continue.", 401);
  assert(
    !role || user.role === role,
    "You do not have permission to access this resource.",
    403,
  );
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 86400000);
  await prisma.session.create({
    data: { id: digest(token), userId, expiresAt: expires },
  });
  (await cookies()).set("trainer_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("trainer_session")?.value;
  if (token) await prisma.session.deleteMany({ where: { id: digest(token) } });
  jar.delete("trainer_session");
}
export async function rateLimit(key: string, max = 10) {
  const id = `${digest(key)}:${Math.floor(Date.now() / 900000)}`;
  const row = await prisma.rateLimit.upsert({
    where: { id },
    create: { id, expiresAt: new Date(Date.now() + 900000) },
    update: { count: { increment: 1 } },
  });
  if (row.count > max)
    throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");
}
export function publicUser(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  const p = user.clientProfile || user.trainerProfile;
  return {
    id: user.id,
    avatarUrl: p?.avatarUrl || null,
    role: user.role,
    email: user.email,
    phone: user.phoneNumber,
    name: p ? `${p.firstName} ${p.lastName}` : "Administrator",
  };
}
