import { api, body, text, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/auth";
export const POST = api(async (req) => {
  const b = await body(req);
  const email = text(b.email, "Email", 254);
  const message = text(b.message, "Message", 2000);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email.");
  await rateLimit(`contact:${email}`, 3);
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  assert(
    admins.length,
    "Support is not configured yet. Please try again later.",
    503,
  );
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      message: `Support request from ${email}: ${message}`,
    })),
  });
  return { message: "Your message has been sent to the platform team." };
}, true);
