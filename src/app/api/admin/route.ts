import { api, assert, body, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async () => {
  await requireUser("ADMIN");
  const [users, bookings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        clientProfile: true,
        trainerProfile: { include: { certifications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.booking.findMany({
      include: {
        payment: true,
        slot: true,
        trainer: { select: { firstName: true, lastName: true } },
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  const [clients, trainers, pending, verified, total, completed, funds] =
    await Promise.all([
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.trainerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.trainerProfile.count({
        where: { verificationStatus: "APPROVED", user: { status: "ACTIVE" } },
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        where: { status: { in: ["HELD_IN_ESCROW", "TRANSFERRED"] } },
        _sum: { grossAmount: true, platformFee: true },
      }),
    ]);
  return {
    users,
    bookings,
    overview: {
      Clients: clients,
      Trainers: trainers,
      "Awaiting review": pending,
      "Verified trainers": verified,
      "Total bookings": total,
      Completed: completed,
      "Captured volume (INR)": Number(funds._sum.grossAmount || 0),
      "Commission (INR)": Number(funds._sum.platformFee || 0),
    },
  };
});
export const POST = api(async (req) => {
  const u = await requireUser("ADMIN");
  const b = await body(req);
  const id = text(b.id, "Account");
  const action = text(b.action, "Action");
  const note = text(b.note || "", "Review note", 2000, false);
  assert(
    ["APPROVE", "REJECT", "SUSPEND", "REACTIVATE"].includes(action),
    "Invalid action.",
  );
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id },
      include: { trainerProfile: { include: { certifications: true } } },
    });
    assert(target && target.role !== "ADMIN", "Account not found.", 404);
    if (action === "APPROVE" || action === "REJECT") {
      assert(target.trainerProfile, "Trainer profile required.");
      if (action === "APPROVE")
        assert(
          target.trainerProfile.certifications.some(
            (c) =>
              c.documentUrl.startsWith("/api/uploads/") &&
              ["PENDING", "APPROVED"].includes(c.status) &&
              (!c.expiryDate || c.expiryDate > new Date()),
          ) &&
            target.trainerProfile.acceptedSessionModes.length > 0 &&
            target.trainerProfile.homeLocationName,
          "Review at least one uploaded credential, location and training mode before approval.",
        );
      await tx.trainerProfile.update({
        where: { id: target.trainerProfile.id },
        data: {
          verificationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
        },
      });
      await tx.certification.updateMany({
        where: { trainerId: target.trainerProfile.id, status: "PENDING" },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          verifiedAt: action === "APPROVE" ? new Date() : null,
          adminReviewNote: note,
        },
      });
    } else {
      await tx.user.update({
        where: { id },
        data: { status: action === "SUSPEND" ? "SUSPENDED" : "ACTIVE" },
      });
      if (action === "SUSPEND")
        await tx.session.deleteMany({ where: { userId: id } });
    }
    await tx.adminAction.create({
      data: { adminId: u.id, targetId: id, action, note },
    });
    await tx.notification.create({
      data: {
        userId: id,
        message: `Account review: ${action.toLowerCase()}. ${note}`,
      },
    });
  });
  return {};
}, true);
