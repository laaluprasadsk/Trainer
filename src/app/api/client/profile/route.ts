import { api, body, assert, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  const u = await requireUser("CLIENT");
  return {
    profile: { ...u.clientProfile, email: u.email, phone: u.phoneNumber },
  };
});
export const POST = api(async (req) => {
  const u = await requireUser("CLIENT");
  const b = await body(req);
  const firstName = text(b.firstName, "First name", 80);
  const lastName = text(b.lastName, "Last name", 80);
  const defaultLocationName = text(
    b.defaultLocationName || "",
    "Location",
    160,
    false,
  );
  assert(
    Array.isArray(b.fitnessGoals) &&
      b.fitnessGoals.length <= 12 &&
      b.fitnessGoals.every((v) => typeof v === "string" && v.length <= 100),
    "Invalid fitness goals.",
  );
  const phone = text(b.phone, "Phone", 20);
  assert(/^\+?[0-9]{8,15}$/.test(phone), "Invalid phone number.");
  await prisma.$transaction([
    prisma.user.update({
      where: { id: u.id },
      data: {
        phoneNumber: phone,
        ...(phone !== u.phoneNumber ? { phoneVerifiedAt: null } : {}),
      },
    }),
    prisma.clientProfile.update({
      where: { userId: u.id },
      data: {
        firstName,
        lastName,
        defaultLocationName,
        fitnessGoals: b.fitnessGoals as string[],
      },
    }),
  ]);
  return {};
}, true);
