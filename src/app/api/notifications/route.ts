import { api, body, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  const u = await requireUser();
  return {
    notifications: await prisma.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  };
});
export const PATCH = api(async (req) => {
  const u = await requireUser();
  const payload = await body(req);
  const id = payload.id ? text(payload.id, "Notification") : "";
  await prisma.notification.updateMany({
    where: { userId: u.id, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });
  return {};
}, true);
