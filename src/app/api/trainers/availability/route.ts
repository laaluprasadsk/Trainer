import { api, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { availableSlots } from "@/lib/bookings";

export const GET = api(async (req) => {
  const trainerId = new URL(req.url).searchParams.get("trainerId") || "";
  assert(trainerId, "Trainer is required.");
  const trainer = await prisma.trainerProfile.findFirst({
    where: {
      id: trainerId,
      isPublished: true,
      verificationStatus: "APPROVED",
      user: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  assert(trainer, "Trainer not found.", 404);
  const slots = await availableSlots(trainer.id);
  return {
    slots: slots.map((slot) => ({
      id: slot.id,
      date: slot.slotDate.toISOString().slice(0, 10),
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
  };
});
