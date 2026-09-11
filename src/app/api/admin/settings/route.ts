import { api, assert, body, number } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  await requireUser("ADMIN");
  const row = await prisma.platformSettings.findUnique({
    where: { id: "platform" },
  });
  return { commissionPercent: (row?.commissionBps ?? 1500) / 100 };
});
export const PATCH = api(async (req) => {
  const admin = await requireUser("ADMIN");
  const b = await body(req);
  const commissionBps = Math.round(
    number(b.commissionPercent, "Commission percentage", 0, 100) * 100,
  );
  assert(Number.isInteger(commissionBps), "Invalid commission.");
  await prisma.$transaction(async (tx) => {
    await tx.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", commissionBps },
      update: { commissionBps },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        targetId: "platform",
        action: "COMMISSION_CHANGED",
        note: `New bookings: ${commissionBps} basis points.`,
      },
    });
  });
  return {
    message:
      "Commission updated for new bookings. Existing financial records are unchanged.",
  };
}, true);
