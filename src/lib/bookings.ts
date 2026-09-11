import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { assert } from "./http";
import { slotInstant } from "./booking-domain";
export function activeWhere(): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
      { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
    ],
  };
}
export async function trainerLock(
  tx: Prisma.TransactionClient,
  trainerId: string,
) {
  await tx.$queryRaw`SELECT id FROM trainer_profiles WHERE id = ${trainerId} FOR UPDATE`;
}
export async function expireHolds(
  tx: Prisma.TransactionClient,
  trainerId: string,
) {
  await tx.booking.updateMany({
    where: {
      trainerId,
      status: "PENDING_PAYMENT",
      expiresAt: { lte: new Date() },
    },
    data: { status: "CANCELLED_BY_CLIENT" },
  });
}
export async function notifyBooking(
  tx: Prisma.TransactionClient,
  b: { id?: string; clientId: string; trainerId: string },
  message: string,
  smsTemplate?: "CONFIRMED" | "CANCELLED",
) {
  const [client, trainer] = await Promise.all([
    tx.clientProfile.findUniqueOrThrow({ where: { id: b.clientId } }),
    tx.trainerProfile.findUniqueOrThrow({ where: { id: b.trainerId } }),
  ]);
  const booking =
    b.id && smsTemplate
      ? await tx.booking.findUnique({
          where: { id: b.id },
          include: { slot: true },
        })
      : null;
  await tx.notification.createMany({
    data: [client.userId, trainer.userId].map((userId) => ({
      userId,
      message,
      ...(booking && smsTemplate
        ? {
            smsTemplate,
            smsVariables: {
              booking: booking.id.slice(0, 8),
              date: booking.slot.slotDate.toISOString().slice(0, 10),
              time: booking.slot.startTime,
            },
          }
        : {}),
    })),
  });
}
export async function availableSlots(trainerId: string, clientId?: string) {
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      trainerId,
      status: "AVAILABLE",
      slotDate: { gte: new Date(Date.now() - 86400000) },
      OR: [
        { bookings: { none: activeWhere() } },
        ...(clientId
          ? [
              {
                bookings: {
                  some: {
                    clientId,
                    status: "PENDING_PAYMENT" as const,
                    expiresAt: { gt: new Date() },
                  },
                },
              },
            ]
          : []),
      ],
    },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
  });
  return slots.filter((s) => slotInstant(s.slotDate, s.startTime) > new Date());
}
export async function changeBooking(
  user: {
    role: string;
    clientProfile: { id: string } | null;
    trainerProfile: { id: string } | null;
  },
  id: string,
  action: string,
) {
  return prisma.$transaction(async (tx) => {
    const found = await tx.booking.findUnique({ where: { id } });
    assert(found, "Booking not found.", 404);
    assert(
      user.role === "ADMIN" ||
        (user.role === "CLIENT" && found.clientId === user.clientProfile?.id) ||
        (user.role === "TRAINER" &&
          found.trainerId === user.trainerProfile?.id),
      "Booking not found.",
      404,
    );
    await trainerLock(tx, found.trainerId);
    const b = await tx.booking.findUniqueOrThrow({
      where: { id },
      include: { slot: true, payment: true },
    });
    if (action === "COMPLETE") {
      assert(
        user.role === "TRAINER",
        "Only the session trainer can complete it.",
        403,
      );
      assert(
        b.status === "CONFIRMED" &&
          slotInstant(b.slot.slotDate, b.slot.endTime) <= new Date(),
        "Only confirmed sessions that have ended can be completed.",
        409,
      );
      await tx.booking.update({ where: { id }, data: { status: "COMPLETED" } });
    } else {
      assert(action === "CANCEL", "Unknown action.");
      assert(
        ["PENDING_PAYMENT", "CONFIRMED"].includes(b.status),
        "This booking cannot be cancelled.",
        409,
      );
      if (user.role === "CLIENT" && b.status === "CONFIRMED")
        assert(
          slotInstant(b.slot.slotDate, b.slot.startTime).getTime() -
            Date.now() >=
            86400000,
          "Client cancellation requires at least 24 hours notice.",
          409,
        );
      await tx.booking.update({
        where: { id },
        data: {
          status:
            user.role === "TRAINER"
              ? "CANCELLED_BY_TRAINER"
              : "CANCELLED_BY_CLIENT",
        },
      });
      await tx.availabilitySlot.update({
        where: { id: b.slotId },
        data: { status: "AVAILABLE" },
      });
      if (b.payment && b.payment.status === "HELD_IN_ESCROW")
        await tx.payment.update({
          where: { id: b.payment.id },
          data: { status: "REFUND_PENDING" },
        });
    }
    await notifyBooking(
      tx,
      b,
      `Session ${id.slice(0, 8)} ${action === "COMPLETE" ? "completed. You can now leave a review." : "cancelled. Any captured payment is queued for refund review."}`,
      action === "CANCEL" ? "CANCELLED" : undefined,
    );
    return {};
  });
}
