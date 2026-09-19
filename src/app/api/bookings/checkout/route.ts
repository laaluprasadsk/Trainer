import { SessionLocationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, rateLimit } from "@/lib/auth";
import { api, assert, body, HttpError, text } from "@/lib/http";
import { activeWhere, expireHolds, trainerLock } from "@/lib/bookings";
import { pricing, slotInstant } from "@/lib/booking-domain";
import { gateway } from "@/lib/payments";

function getProviderStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as { statusCode?: unknown; status?: unknown };
  const status = Number(candidate.statusCode ?? candidate.status);
  return Number.isInteger(status) ? status : undefined;
}

export const POST = api(async (req) => {
  const u = await requireUser("CLIENT");
  assert(
    process.env.NODE_ENV !== "production" ||
      (u.emailVerifiedAt && u.phoneVerifiedAt),
    "Verify your email and phone at /verify-account before booking.",
    403,
  );
  assert(u.clientProfile, "Client profile missing.");
  await rateLimit(`checkout:${u.id}`, 30);
  const provider = gateway();
  const b = await body(req);
  const slotId = text(b.slotId, "Slot");
  const mode = text(b.locationType, "Session type") as SessionLocationType;
  assert(
    Object.values(SessionLocationType).includes(mode),
    "Invalid session type.",
  );
  const addressText = text(
    b.addressText || "",
    "Session address or meeting details",
    500,
    false,
  );
  const booking = await prisma.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId },
    });
    assert(slot, "Slot not found.", 404);
    await trainerLock(tx, slot.trainerId);
    await expireHolds(tx, slot.trainerId);
    const trainer = await tx.trainerProfile.findUniqueOrThrow({
      where: { id: slot.trainerId },
      include: { user: true },
    });
    assert(
      trainer.verificationStatus === "APPROVED" &&
        trainer.user.status === "ACTIVE",
      "This trainer is not accepting bookings.",
      409,
    );
    assert(
      trainer.acceptedSessionModes.includes(mode),
      "Trainer does not offer that session type.",
    );
    assert(
      mode === "ONLINE" || addressText.length > 0,
      "Provide a session address.",
    );
    const fresh = await tx.availabilitySlot.findUniqueOrThrow({
      where: { id: slotId },
    });
    assert(
      fresh.status === "AVAILABLE" &&
        slotInstant(slot.slotDate, slot.startTime) > new Date(),
      "The selected time slot is no longer available.",
      409,
    );
    const existing = await tx.booking.findFirst({
      where: { slotId, ...activeWhere() },
      include: { payment: true },
    });
    if (existing) {
      assert(
        existing.clientId === u.clientProfile!.id &&
          existing.status === "PENDING_PAYMENT",
        "The selected time slot is no longer available.",
        409,
      );
      assert(
        existing.payment,
        "Your checkout is being prepared. Try again shortly.",
        409,
      );
      return existing;
    }
    const settings = await tx.platformSettings.findUnique({
      where: { id: "platform" },
    });
    return tx.booking.create({
      data: {
        slotId,
        trainerId: slot.trainerId,
        clientId: u.clientProfile!.id,
        locationType: mode,
        addressText,
        ...pricing(
          Number(trainer.hourlyRate),
          slot.startTime,
          slot.endTime,
          settings?.commissionBps ?? 1500,
        ),
        currency: trainer.currency,
        expiresAt: new Date(Date.now() + 600000),
      },
      include: { payment: true },
    });
  });
  const amount = Math.round(Number(booking.totalAmount) * 100);
  assert(
    Number.isSafeInteger(amount) && amount >= 100,
    "The booking total must be at least ₹1.00.",
  );
  if (booking.payment)
    return {
      bookingId: booking.id,
      orderId: booking.payment.gatewayOrderId,
      amount,
      currency: booking.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  let order;
  try {
    order = await provider.orders.create({
      amount,
      currency: booking.currency,
      receipt: booking.id,
    });
  } catch (error) {
    if (getProviderStatus(error) === 401) {
      throw new HttpError(401, "Payment service authentication failed.");
    }

    throw new HttpError(
      500,
      "Unable to create the payment order. Please try again.",
    );
  }
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      gatewayOrderId: order.id,
      grossAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      trainerAmount: booking.trainerPayout,
    },
  });
  return {
    bookingId: booking.id,
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
}, true);
