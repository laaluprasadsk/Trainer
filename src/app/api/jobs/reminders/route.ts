import { deliverNotifications } from "@/lib/delivery";
import { trainerLock, expireHolds } from "@/lib/bookings";
import { api, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { slotInstant } from "@/lib/booking-domain";
export const maxDuration = 60;
export const GET = api(async (req) => {
  assert(
    process.env.CRON_SECRET &&
      req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`,
    "Unauthorized.",
    401,
  );
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      slot: {
        slotDate: {
          gte: new Date(Date.now() - 86400000),
          lte: new Date(Date.now() + 2 * 86400000),
        },
      },
    },
    include: { slot: true, client: true, trainer: true },
  });
  let count = 0;
  for (const b of bookings) {
    const remaining =
      slotInstant(b.slot.slotDate, b.slot.startTime).getTime() - Date.now();
    if (remaining > 0 && remaining <= 86400000) {
      const rows = await prisma.notification.createMany({
        data: [b.client.userId, b.trainer.userId].map((userId) => ({
          id: `reminder-${b.id}-${userId}`,
          userId,
          smsTemplate: "REMINDER",
          smsVariables: {
            booking: b.id.slice(0, 8),
            date: b.slot.slotDate.toISOString().slice(0, 10),
            time: b.slot.startTime,
          },
          message: `Reminder: session ${b.id.slice(0, 8)} starts ${b.slot.slotDate.toISOString().slice(0, 10)} at ${b.slot.startTime} Asia/Kolkata.`,
        })),
        skipDuplicates: true,
      });
      count += rows.count;
    }
  }
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.authToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  const expired = await prisma.booking.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lte: new Date() } },
    select: { trainerId: true },
    distinct: ["trainerId"],
    take: 100,
  });
  for (const b of expired)
    await prisma.$transaction(async (tx) => {
      await trainerLock(tx, b.trainerId);
      await expireHolds(tx, b.trainerId);
    });
  await prisma.phoneChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return { created: count, delivery: await deliverNotifications() };
});

export const POST = GET;
