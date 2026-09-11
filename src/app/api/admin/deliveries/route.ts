import { requireUser } from "@/lib/auth";
import { api } from "@/lib/http";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  await requireUser("ADMIN");
  return {
    deliveries: await prisma.messageDelivery.findMany({
      select: {
        id: true,
        channel: true,
        status: true,
        attempts: true,
        providerId: true,
        lastError: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  };
});
