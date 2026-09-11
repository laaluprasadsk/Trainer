import { api, assert, body, text, number } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainerLock } from "@/lib/bookings";
export const POST = api(async (req) => {
  const u = await requireUser("CLIENT");
  const b = await body(req);
  const rating = number(b.rating, "Rating", 1, 5);
  assert(Number.isInteger(rating), "Rating must be a whole number.");
  const comment = text(b.comment || "", "Review", 2000, false);
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: text(b.bookingId, "Booking") },
    });
    assert(
      booking && booking.clientId === u.clientProfile?.id,
      "Booking not found.",
      404,
    );
    assert(
      booking.status === "COMPLETED",
      "Only completed sessions can be reviewed.",
      409,
    );
    await trainerLock(tx, booking.trainerId);
    await tx.review.create({
      data: {
        bookingId: booking.id,
        clientId: booking.clientId,
        trainerId: booking.trainerId,
        rating,
        comment,
      },
    });
    const stats = await tx.review.aggregate({
      where: { trainerId: booking.trainerId },
      _avg: { rating: true },
      _count: true,
    });
    await tx.trainerProfile.update({
      where: { id: booking.trainerId },
      data: { ratingAvg: stats._avg.rating || 0, ratingCount: stats._count },
    });
  });
  return {};
}, true);
