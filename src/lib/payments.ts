import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { assert } from "./http";
import { trainerLock, notifyBooking } from "./bookings";
import { slotInstant } from "./booking-domain";
export function gateway() {
  assert(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
    "Online payments are not configured yet. Please try again later.",
    503,
  );
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}
export function validSignature(
  payload: string,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(
    createHmac("sha256", secret).update(payload).digest(),
    Buffer.from(signature, "hex"),
  );
}
export async function capturePayment(p: {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}) {
  assert(p.status === "captured", "Payment has not been captured.", 409);
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { gatewayOrderId: p.order_id },
      include: { booking: true },
    });
    assert(payment, "Payment order not found.", 404);
    await trainerLock(tx, payment.booking.trainerId);
    const fresh = await tx.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    if (
      fresh.gatewayPaymentId === p.id &&
      ["HELD_IN_ESCROW", "TRANSFERRED", "REFUND_PENDING", "REFUNDED"].includes(
        fresh.status,
      )
    )
      return {};
    assert(
      !fresh.gatewayPaymentId || fresh.gatewayPaymentId === p.id,
      "Order already has a different payment.",
      409,
    );
    assert(
      Math.round(Number(payment.grossAmount) * 100) === p.amount &&
        payment.booking.currency === p.currency,
      "Payment amount or currency does not match.",
      400,
    );
    const b = await tx.booking.findUniqueOrThrow({
      where: { id: payment.bookingId },
      include: { slot: true, trainer: { include: { user: true } } },
    });
    const valid =
      b.status === "PENDING_PAYMENT" &&
      b.expiresAt &&
      b.expiresAt > new Date() &&
      slotInstant(b.slot.slotDate, b.slot.startTime) > new Date() &&
      b.trainer.verificationStatus === "APPROVED" &&
      b.trainer.user.status === "ACTIVE";
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: p.id,
        status: valid ? "HELD_IN_ESCROW" : "REFUND_PENDING",
      },
    });
    if (valid) {
      await tx.booking.update({
        where: { id: b.id },
        data: { status: "CONFIRMED" },
      });
      await tx.availabilitySlot.update({
        where: { id: b.slotId },
        data: { status: "BOOKED" },
      });
      await notifyBooking(
        tx,
        b,
        `Payment received. Session ${b.id.slice(0, 8)} is confirmed.`,
        "CONFIRMED",
      );
    } else {
      if (b.status === "PENDING_PAYMENT")
        await tx.booking.update({
          where: { id: b.id },
          data: { status: "CANCELLED_BY_CLIENT" },
        });
      await notifyBooking(
        tx,
        b,
        "Payment arrived after the reservation was unavailable. A refund review is required.",
      );
      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await tx.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          message: `Refund required for booking ${b.id}.`,
        })),
      });
    }
    return {};
  });
}
