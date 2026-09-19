import { api, body, assert, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/auth";
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
  assert(Array.isArray(b.fitnessGoals), "Invalid fitness goals.");
  const fitnessGoals = b.fitnessGoals.map((value) =>
    text(value, "Fitness goal", 100),
  );
  assert(fitnessGoals.length <= 12, "Add no more than 12 fitness goals.");
  const phone = normalizePhone(text(b.phone, "Phone", 30));
  assert(
    /^\+[0-9]{8,15}$/.test(phone),
    "Enter a valid international phone number.",
  );
  const phoneOwner = await prisma.user.findUnique({
    where: { phoneNumber: phone },
  });
  assert(
    !phoneOwner || phoneOwner.id === u.id,
    "This phone number is already connected to another account.",
    409,
  );
  const [, profile] = await prisma.$transaction([
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
        fitnessGoals,
      },
    }),
  ]);
  return {
    profile: { ...profile, email: u.email, phone },
  };
}, true);
