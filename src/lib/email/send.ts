import "server-only";
import type { ReactNode } from "react";
import { render, toPlainText } from "@react-email/render";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http";
import { resendClient } from "./client";

export type TransactionalEmail = {
  to: string;
  subject: string;
  template: string;
  content: ReactNode;
  idempotencyKey: string;
  userId?: string;
  replyTo?: string;
};

const accepted = new Set(["SENT", "DELIVERED"]);

export async function sendTransactionalEmail(input: TransactionalEmail) {
  let record;
  try {
    record = await prisma.emailSend.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        recipient: input.to,
        template: input.template,
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    )
      throw error;
    record = await prisma.emailSend.findUniqueOrThrow({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (accepted.has(record.status)) return record.providerEmailId!;
  }

  const claim = await prisma.emailSend.updateMany({
    where: { id: record.id, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "SENDING", lastError: null },
  });
  if (!claim.count) return record.providerEmailId || "in-progress";

  try {
    const html = await render(input.content);
    const { data, error } = await resendClient().emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to: input.to,
        subject: input.subject,
        html,
        text: toPlainText(html),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        tags: [{ name: "template", value: input.template }],
      },
      { idempotencyKey: input.idempotencyKey },
    );
    if (error || !data?.id) throw new Error(error?.message || "No provider ID");
    await prisma.emailSend.update({
      where: { id: record.id },
      data: { status: "SENT", providerEmailId: data.id, lastError: null },
    });
    console.info(
      JSON.stringify({
        event: "transactional_email_accepted",
        template: input.template,
        emailSendId: record.id,
        providerEmailId: data.id,
        timestamp: new Date().toISOString(),
      }),
    );
    return data.id;
  } catch (error) {
    await prisma.emailSend.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        lastError: error instanceof Error ? error.name : "UnknownError",
      },
    });
    console.error(
      JSON.stringify({
        event: "transactional_email_failed",
        template: input.template,
        emailSendId: record.id,
      }),
    );
    throw new HttpError(
      503,
      "We could not send this email. Please try again shortly.",
    );
  }
}
