import { api, body, assert, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gateway, validSignature, capturePayment } from "@/lib/payments";
export const POST = api(async (req) => {
  const u = await requireUser("CLIENT");
  const b = await body(req);
  const order = text(b.razorpay_order_id, "Order");
  const id = text(b.razorpay_payment_id, "Payment");
  const signature = text(b.razorpay_signature, "Signature");
  const payment = await prisma.payment.findUnique({
    where: { gatewayOrderId: order },
    include: { booking: true },
  });
  assert(
    payment && payment.booking.clientId === u.clientProfile?.id,
    "Order not found.",
    404,
  );
  const provider = gateway();
  assert(
    validSignature(
      `${order}|${id}`,
      signature,
      process.env.RAZORPAY_KEY_SECRET!,
    ),
    "Invalid payment signature.",
    400,
  );
  const p = await provider.payments.fetch(id);
  assert(p.order_id === order, "Payment order mismatch.");
  await capturePayment({
    id: p.id,
    order_id: order,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
  });
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: payment.bookingId },
  });
  return { booking };
}, true);
