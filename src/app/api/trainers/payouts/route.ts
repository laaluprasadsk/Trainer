import { api } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  const u = await requireUser("TRAINER");
  const payments = await prisma.payment.findMany({
    where: { booking: { trainerId: u.trainerProfile!.id } },
    include: {
      booking: {
        include: {
          slot: true,
          client: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const captured = payments.filter((p) =>
    ["HELD_IN_ESCROW", "TRANSFERRED"].includes(p.status),
  );
  return {
    payments,
    summary: {
      gross: captured.reduce((s, p) => s + Number(p.grossAmount), 0),
      commission: captured.reduce((s, p) => s + Number(p.platformFee), 0),
      net: captured.reduce((s, p) => s + Number(p.trainerAmount), 0),
      pending: captured
        .filter((p) => p.status === "HELD_IN_ESCROW")
        .reduce((s, p) => s + Number(p.trainerAmount), 0),
      paid: captured
        .filter((p) => p.status === "TRANSFERRED")
        .reduce((s, p) => s + Number(p.trainerAmount), 0),
    },
  };
});
