import { api, body, text, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { digest, normalizeEmail, rateLimit } from "@/lib/auth";
import { sendEmail } from "@/lib/messaging";
export const POST = api(async (req) => {
  const b = await body(req);
  const email = normalizeEmail(text(b.email, "Email", 254));
  const message = text(b.message, "Message", 2000);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email.");
  await rateLimit(`contact:${email}`, 3);
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  const emailConfigured = Boolean(
    process.env.SUPPORT_EMAIL &&
    process.env.RESEND_API_KEY &&
    process.env.EMAIL_FROM,
  );
  assert(
    admins.length || emailConfigured,
    "Customer support is temporarily unavailable. Please try again later.",
    503,
  );
  const requestKey = digest(`${email}\n${message}`);
  const existing = await prisma.supportRequest.findUnique({
    where: { requestKey },
  });
  if (existing)
    return {
      message:
        "We already received this request and will respond as soon as possible.",
    };
  const support = await prisma.supportRequest.create({
    data: { requestKey, email, message },
  });
  if (admins.length)
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        message: `New support request ${support.id.slice(0, 8)} from ${email}.`,
        href: "/admin",
      })),
    });
  if (emailConfigured) {
    await sendEmail(
      process.env.SUPPORT_EMAIL!,
      `Trainrr support request ${support.id.slice(0, 8)}`,
      `Reply to: ${email}\n\n${message}`,
      `support-team-${support.id}`,
    );
    await sendEmail(
      email,
      "We received your Trainrr support request",
      `Your request reference is ${support.id.slice(0, 8)}. Our support team will reply within the response time published on the contact page.`,
      `support-customer-${support.id}`,
    );
  }
  return {
    message: `Your request was received. Reference: ${support.id.slice(0, 8)}.`,
  };
}, true);
