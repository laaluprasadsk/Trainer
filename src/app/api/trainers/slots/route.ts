import { api, assert, body, text } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainerLock, activeWhere, expireHolds } from "@/lib/bookings";
import { validWindow, overlaps } from "@/lib/booking-domain";
export const GET = api(async () => {
  const u = await requireUser("TRAINER");
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      trainerId: u.trainerProfile!.id,
      slotDate: { gte: new Date(Date.now() - 86400000) },
    },
    include: {
      bookings: { where: activeWhere(), select: { id: true, status: true } },
    },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    take: 1000,
  });
  return {
    slots: slots.map((s) => ({
      ...s,
      status: s.bookings.length ? "BOOKED" : s.status,
    })),
  };
});
export const POST = api(async (req) => {
  const u = await requireUser("TRAINER");
  const b = await body(req);
  assert(
    Array.isArray(b.slots) && b.slots.length > 0 && b.slots.length <= 300,
    "Provide 1–300 slots.",
  );
  const slots = b.slots.map((s) => {
    assert(s && typeof s === "object", "Invalid slot.");
    const slotDate = text(s.slotDate, "Date", 10);
    const startTime = text(s.startTime, "Start time", 5);
    const endTime = text(s.endTime, "End time", 5);
    assert(
      validWindow(slotDate, startTime, endTime),
      "Slots must have a valid future date and an end after the start.",
    );
    assert(
      new Date(slotDate).getTime() - Date.now() <= 180 * 86400000,
      "Publish availability up to 180 days ahead.",
    );
    return {
      slotDate: new Date(slotDate),
      startTime,
      endTime,
      trainerId: u.trainerProfile!.id,
    };
  });
  await prisma.$transaction(async (tx) => {
    await trainerLock(tx, u.trainerProfile!.id);
    const existing = await tx.availabilitySlot.findMany({
      where: {
        trainerId: u.trainerProfile!.id,
        slotDate: { in: slots.map((s) => s.slotDate) },
      },
    });
    const accepted = [...existing];
    for (const s of slots) {
      assert(
        !accepted.some(
          (e) =>
            e.slotDate.getTime() === s.slotDate.getTime() && overlaps(e, s),
        ),
        "Availability overlaps an existing slot. Remove an unbooked slot first.",
        409,
      );
      accepted.push({
        ...s,
        id: "",
        status: "AVAILABLE",
        createdAt: new Date(),
      });
    }
    await tx.availabilitySlot.createMany({ data: slots });
  });
  return { count: slots.length };
}, true);
async function mutate(req: Request, remove: boolean) {
  const u = await requireUser("TRAINER");
  const b = remove
    ? { id: new URL(req.url).searchParams.get("id") }
    : await body(req);
  const id = text(b.id, "Slot");
  await prisma.$transaction(async (tx) => {
    await trainerLock(tx, u.trainerProfile!.id);
    await expireHolds(tx, u.trainerProfile!.id);
    const slot = await tx.availabilitySlot.findFirst({
      where: { id, trainerId: u.trainerProfile!.id },
      include: { bookings: { where: activeWhere() } },
    });
    assert(slot, "Slot not found.", 404);
    assert(
      slot.bookings.length === 0,
      "Reserved or booked slots cannot be changed.",
      409,
    );
    if (remove) {
      assert(
        (await tx.booking.count({ where: { slotId: id } })) === 0,
        "Slots with booking history cannot be removed. Block this slot instead.",
        409,
      );
      await tx.availabilitySlot.delete({ where: { id } });
      return;
    }
    await tx.availabilitySlot.update({
      where: { id },
      data: {
        status: remove || slot.status === "AVAILABLE" ? "BLOCKED" : "AVAILABLE",
      },
    });
  });
  return {};
}
export const DELETE = api((req) => mutate(req, true), true);
export const PATCH = api((req) => mutate(req, false), true);
