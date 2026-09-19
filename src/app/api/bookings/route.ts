import { slotInstant } from "@/lib/booking-domain";
import { api, body, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeBooking } from "@/lib/bookings";
export const GET = api(async () => {
  const u = await requireUser();
  const bookings = await prisma.booking.findMany({
    where:
      u.role === "ADMIN"
        ? {}
        : u.role === "CLIENT"
          ? { clientId: u.clientProfile!.id }
          : { trainerId: u.trainerProfile!.id },
    include: {
      slot: true,
      payment: true,
      review: true,
      trainer: {
        select: { id: true, firstName: true, lastName: true, slug: true },
      },
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const scope =
    u.role === "ADMIN"
      ? {}
      : u.role === "CLIENT"
        ? { clientId: u.clientProfile!.id }
        : { trainerId: u.trainerProfile!.id };
  const all = await prisma.booking.findMany({
    where: scope,
    select: {
      status: true,
      trainerId: true,
      expiresAt: true,
      slot: { select: { slotDate: true, startTime: true } },
    },
  });
  const cancelled = (b: (typeof all)[number]) =>
    b.status.startsWith("CANCELLED") ||
    (b.status === "PENDING_PAYMENT" &&
      !!b.expiresAt &&
      b.expiresAt < new Date());
  const overview: Record<string, string | number> = {
    "Total sessions": all.length,
    Upcoming: all.filter(
      (b) =>
        b.status === "CONFIRMED" &&
        slotInstant(b.slot.slotDate, b.slot.startTime) > new Date(),
    ).length,
    Completed: all.filter((b) => b.status === "COMPLETED").length,
    Cancelled: all.filter(cancelled).length,
  };
  if (u.role === "TRAINER") {
    overview["Verification"] = u.trainerProfile!.verificationStatus;
    overview["Average rating"] = Number(u.trainerProfile!.ratingAvg);
    overview["Today's sessions"] = all.filter(
      (b) =>
        b.status === "CONFIRMED" &&
        b.slot.slotDate.toISOString().slice(0, 10) ===
          new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
            new Date(),
          ),
    ).length;
    const earnings = await prisma.payment.aggregate({
      where: {
        booking: scope,
        status: { in: ["HELD_IN_ESCROW", "TRANSFERRED"] },
      },
      _sum: { trainerAmount: true },
    });
    overview["Trainer earnings (INR)"] = Number(
      earnings._sum.trainerAmount || 0,
    );
  } else
    overview["Trainers worked with"] = new Set(
      all.filter((b) => b.status === "COMPLETED").map((b) => b.trainerId),
    ).size;
  return { bookings, overview };
});
export const PATCH = api(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const action = text(b.action, "Action");
  return changeBooking(
    u,
    text(b.id, "Booking"),
    action,
    action === "RESCHEDULE" ? text(b.slotId, "Replacement slot") : undefined,
  );
}, true);
