import { Prisma } from "@prisma/client";
import { api, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { resendClient } from "@/lib/email/client";

const statuses: Record<string, string> = {
  "email.sent": "SENT",
  "email.delivered": "DELIVERED",
  "email.delivery_delayed": "DELAYED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
  "email.failed": "FAILED",
  "email.suppressed": "SUPPRESSED",
};

export const POST = api(async (req) => {
  assert(
    process.env.RESEND_WEBHOOK_SECRET,
    "Email webhook is not configured.",
    503,
  );
  const payload = await req.text();
  assert(Buffer.byteLength(payload) <= 250_000, "Webhook is too large.", 413);
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  assert(id && timestamp && signature, "Missing webhook signature.");
  let event;
  try {
    event = resendClient().webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    assert(false, "Invalid webhook signature.", 400);
  }
  const status = statuses[event.type];
  if (!status) return { received: true };
  const eventData = event.data as { email_id?: unknown };
  assert(typeof eventData.email_id === "string", "Invalid email event.");
  const providerCreatedAt = new Date(event.created_at);
  assert(!Number.isNaN(providerCreatedAt.getTime()), "Invalid event time.");

  try {
    await prisma.$transaction(async (tx) => {
      const send = await tx.emailSend.findUnique({
        where: { providerEmailId: eventData.email_id as string },
      });
      await tx.emailEvent.create({
        data: {
          providerEventId: id,
          providerEmailId: eventData.email_id as string,
          emailSendId: send?.id,
          type: event.type,
          providerCreatedAt,
        },
      });
      if (!send) return;
      const terminal = ["BOUNCED", "COMPLAINED", "FAILED", "SUPPRESSED"];
      await tx.emailSend.updateMany({
        where: {
          id: send.id,
          ...(status === "SENT"
            ? { status: { in: ["PENDING", "SENDING", "SENT"] } }
            : terminal.includes(status)
              ? {}
              : { status: { notIn: terminal } }),
        },
        data: { status },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { received: true, duplicate: true };
    throw error;
  }
  return { received: true };
});
