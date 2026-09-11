import { api } from "@/lib/http";
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
export const PATCH = api(async () => {
  const u = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: u.id, read: false },
    data: { read: true },
  });
  return {};
}, true);
