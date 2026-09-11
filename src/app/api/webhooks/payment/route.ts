import { api, assert } from "@/lib/http";
import { validSignature, capturePayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { trainerLock, notifyBooking } from "@/lib/bookings";
export const POST = api(async (req) => {
  const raw = await req.text();
  assert(raw.length < 1000000, "Payload too large.", 413);
  assert(
    process.env.RAZORPAY_WEBHOOK_SECRET,
    "Webhook is not configured.",
    503,
  );
  assert(
    validSignature(
      raw,
      req.headers.get("x-razorpay-signature") || "",
      process.env.RAZORPAY_WEBHOOK_SECRET,
    ),
    "Invalid webhook signature.",
    400,
  );
  const event = JSON.parse(raw);
  const p = event.payload?.payment?.entity;
  if (event.event === "payment.captured" && p) await capturePayment(p);
  if (event.event === "payment.failed" && p?.order_id) {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { gatewayOrderId: p.order_id },
        include: { booking: true },
      });
      if (!payment) return;
      const changed = await tx.payment.updateMany({
        where: { id: payment.id, status: "REQUIRES_ACTION" },
        data: { status: "FAILED" },
      });
      if (changed.count)
        await notifyBooking(
          tx,
          payment.booking,
          "Payment attempt failed. Retry checkout before your reservation expires.",
        );
    });
  }
  if (event.event === "refund.processed") {
    const r = event.payload?.refund?.entity;
    if (r?.payment_id)
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { gatewayPaymentId: r.payment_id },
          include: { booking: true },
        });
        if (!payment) return;
        await trainerLock(tx, payment.booking.trainerId);
        const fresh = await tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          include: { booking: true },
        });
        if (fresh.status === "REFUNDED") return;
        assert(
          Number(r.amount) === Math.round(Number(payment.grossAmount) * 100),
          "Partial refunds require manual reconciliation.",
          409,
        );
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
        await notifyBooking(
          tx,
          fresh.booking,
          "Your session payment has been refunded.",
        );
        if (["PENDING_PAYMENT", "CONFIRMED"].includes(fresh.booking.status)) {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CANCELLED_BY_CLIENT" },
          });
          await tx.availabilitySlot.update({
            where: { id: payment.booking.slotId },
            data: { status: "AVAILABLE" },
          });
        }
      });
  }
  return { received: true };
});
