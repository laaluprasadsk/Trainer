import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { sendEmail, sendSms } from "./messaging";

// Notifications are the durable event log, inserted within the booking transaction.
// A unique event/channel row prevents concurrent cron invocations from enqueueing twice.
export async function deliverNotifications() {
  const events = await prisma.notification.findMany({
    where: { deliveries: { none: {} } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  for (const event of events) {
    await prisma.messageDelivery.createMany({
      data: ["EMAIL", ...(event.smsTemplate ? ["SMS"] : [])].map((channel) => ({
        id: `${event.id}-${channel}`,
        notificationId: event.id,
        channel,
      })),
      skipDuplicates: true,
    });
  }
  // A crash/timeout after an SMS request is ambiguous. MSG91 Flow does not promise
  // idempotency, so never resend automatically: an operator must inspect its report.
  await prisma.messageDelivery.updateMany({
    where: {
      channel: "SMS",
      status: "PROCESSING",
      leaseUntil: { lt: new Date() },
    },
    data: {
      status: "UNKNOWN",
      lastError:
        "Worker interrupted; inspect MSG91 delivery reports before resending.",
    },
  });
  const due = await prisma.messageDelivery.findMany({
    where: {
      nextAttemptAt: { lte: new Date() },
      OR: [
        { status: "PENDING" },
        {
          channel: "EMAIL",
          status: "PROCESSING",
          leaseUntil: { lt: new Date() },
        },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: 20,
    include: { notification: { include: { user: true } } },
  });
  let accepted = 0;
  const started = Date.now();
  for (const item of due) {
    if (Date.now() - started > 30000) break;
    if (
      item.channel === "EMAIL" &&
      (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    )
      continue;
    if (item.channel === "SMS" && !process.env.MSG91_AUTH_KEY) continue;
    if (item.attempts && Date.now() - item.createdAt.getTime() > 23 * 3600000) {
      await prisma.messageDelivery.updateMany({
        where: { id: item.id, status: item.status },
        data: {
          status: "FAILED",
          lastError:
            "Automatic retry window expired; provider reconciliation required.",
        },
      });
      continue;
    }
    const leaseToken = randomUUID();
    const claim = await prisma.messageDelivery.updateMany({
      where: { id: item.id, status: item.status, leaseToken: item.leaseToken },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        leaseToken,
        leaseUntil: new Date(Date.now() + 300000),
      },
    });
    if (!claim.count) continue;
    try {
      const { notification: n } = item;
      if (item.channel === "SMS" && !n.user.phoneVerifiedAt) {
        await prisma.messageDelivery.updateMany({
          where: { id: item.id, leaseToken },
          data: {
            status: "FAILED",
            lastError: "Recipient phone has not been verified.",
          },
        });
        continue;
      }
      const providerId =
        item.channel === "EMAIL"
          ? await sendEmail(
              n.user.email,
              "Your Trainrr update",
              `${n.message}\n\nView your account: ${process.env.APP_URL}`,
              item.id,
            )
          : await sendSms(
              n.user.phoneNumber,
              n.smsTemplate!,
              (n.smsVariables || {}) as Record<string, string>,
            );
      await prisma.messageDelivery.updateMany({
        where: { id: item.id, leaseToken },
        data: { status: "SENT", providerId, leaseUntil: null, lastError: null },
      });
      accepted++;
    } catch {
      await prisma.messageDelivery.updateMany({
        where: { id: item.id, leaseToken },
        data: {
          status:
            item.channel === "SMS"
              ? "UNKNOWN"
              : item.attempts >= 5
                ? "FAILED"
                : "PENDING",
          nextAttemptAt: new Date(
            Date.now() + Math.min(3600000, 60000 * 2 ** item.attempts),
          ),
          leaseUntil: null,
          lastError:
            item.channel === "SMS"
              ? "Provider outcome uncertain; inspect MSG91 reports."
              : "Email request failed; retry scheduled within provider idempotency window.",
        },
      });
      console.error(
        JSON.stringify({
          event: "notification_delivery_failed",
          deliveryId: item.id,
          channel: item.channel,
        }),
      );
    }
  }
  return { queued: events.length, accepted };
}
