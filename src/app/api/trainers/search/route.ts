import { Prisma, SessionLocationType } from "@prisma/client";
import { api, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { availableSlots } from "@/lib/bookings";
export const GET = api(async (req) => {
  const q = new URL(req.url).searchParams;
  const where: Prisma.TrainerProfileWhereInput = {
    verificationStatus: "APPROVED",
    user: { status: "ACTIVE" },
  };
  if (q.get("q"))
    where.OR = ["firstName", "lastName", "bio"].map((key) => ({
      [key]: { contains: q.get("q")!.slice(0, 100), mode: "insensitive" },
    }));
  if (q.get("location"))
    where.homeLocationName = {
      contains: q.get("location")!.slice(0, 100),
      mode: "insensitive",
    };
  if (q.get("specialization") && q.get("specialization") !== "All")
    where.specializations = { has: q.get("specialization")! };
  for (const [key, field] of [
    ["maxPrice", "hourlyRate"],
    ["rating", "ratingAvg"],
    ["experience", "yearsExperience"],
  ] as const)
    if (q.get(key)) {
      const n = Number(q.get(key));
      assert(Number.isFinite(n) && n >= 0, "Invalid numeric filter.");
      Object.assign(where, {
        [field]: key === "maxPrice" ? { lte: n } : { gte: n },
      });
    }
  const mode = q.get("mode");
  if (mode) {
    assert(
      Object.values(SessionLocationType).includes(mode as SessionLocationType),
      "Invalid training mode.",
    );
    where.acceptedSessionModes = { has: mode as SessionLocationType };
  }
  const trainers = await prisma.trainerProfile.findMany({
    where,
    select: {
      id: true,
      avatarUrl: true,
      firstName: true,
      lastName: true,
      slug: true,
      bio: true,
      yearsExperience: true,
      hourlyRate: true,
      currency: true,
      ratingAvg: true,
      ratingCount: true,
      specializations: true,
      homeLocationName: true,
      acceptedSessionModes: true,
      certifications: {
        where: { status: "APPROVED" },
        select: { title: true, issuingOrganization: true },
      },
    },
    orderBy: { ratingAvg: "desc" },
    take: 100,
  });
  const rows = await Promise.all(
    trainers.map(async (t) => {
      const slots = await availableSlots(t.id);
      const filtered = slots.filter(
        (s) =>
          (!q.get("date") ||
            s.slotDate.toISOString().slice(0, 10) === q.get("date")) &&
          (!q.get("time") ||
            (s.startTime <= q.get("time")! && s.endTime > q.get("time")!)),
      );
      return {
        ...t,
        hourlyRate: Number(t.hourlyRate),
        ratingAvg: Number(t.ratingAvg),
        availableSlotsCount: filtered.length,
      };
    }),
  );
  return {
    trainers: rows.filter(
      (t) => (!q.get("date") && !q.get("time")) || t.availableSlotsCount > 0,
    ),
  };
});
