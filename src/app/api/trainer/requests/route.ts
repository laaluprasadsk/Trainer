import { requireUser } from "@/lib/auth";
import { sameOrigin, HttpError } from "@/lib/http";
import { BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestAction = "ACCEPT" | "DECLINE" | "RESCHEDULE" | "SAVE_NOTE";
type RequestBody = {
  action?: RequestAction;
  bookingId?: string;
  proposedDate?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  responseNote?: string;
  clientId?: string;
  content?: string;
  targetWeights?: string;
  injuryNotes?: string;
};

const activeStatuses: BookingStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
];

function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function trainerFromRequest(request: NextRequest) {
  if (request.method !== "GET") sameOrigin(request);
  return (await requireUser("TRAINER")).trainerProfile;
}

function clientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

function serializeBooking(booking: {
  id: string;
  status: BookingStatus;
  locationType: string;
  addressText: string | null;
  createdAt: Date;
  proposedDate: Date | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
  trainerResponseNote: string | null;
  slot: { slotDate: Date; startTime: string; endTime: string };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    parqWaiver: { isCleared: boolean; requiresMedClearance: boolean } | null;
  };
}) {
  const parq = booking.client.parqWaiver;
  return {
    id: booking.id,
    status: booking.status,
    requestedDate: booking.slot.slotDate.toISOString(),
    requestedStartTime: booking.slot.startTime,
    requestedEndTime: booking.slot.endTime,
    locationType: booking.locationType,
    addressText: booking.addressText,
    createdAt: booking.createdAt.toISOString(),
    proposedDate: booking.proposedDate?.toISOString() ?? null,
    proposedStartTime: booking.proposedStartTime,
    proposedEndTime: booking.proposedEndTime,
    trainerResponseNote: booking.trainerResponseNote,
    client: {
      id: booking.client.id,
      name: clientName(booking.client),
      avatarUrl: booking.client.avatarUrl,
      parqStatus:
        parq && parq.isCleared && !parq.requiresMedClearance
          ? "CLEARED"
          : "MEDICAL_ATTENTION_REQUIRED",
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const trainer = await trainerFromRequest(request);
    if (!trainer) return failure("Trainer authentication is required.", 401);

    const bookingInclude = {
      slot: { select: { slotDate: true, startTime: true, endTime: true } },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          parqWaiver: {
            select: { isCleared: true, requiresMedClearance: true },
          },
        },
      },
    } as const;
    const [requests, activeBookings, notes] = await Promise.all([
      prisma.booking.findMany({
        where: { trainerId: trainer.id, status: "PENDING_PAYMENT" },
        include: bookingInclude,
        orderBy: { createdAt: "asc" },
      }),
      prisma.booking.findMany({
        where: { trainerId: trainer.id, status: { in: activeStatuses } },
        include: bookingInclude,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.clientNote.findMany({ where: { trainerId: trainer.id } }),
    ]);

    const noteByClient = new Map(notes.map((note) => [note.clientId, note]));
    const roster = [
      ...new Map(
        activeBookings.map((booking) => [booking.client.id, booking.client]),
      ).values(),
    ].map((client) => {
      const clientBookings = activeBookings.filter(
        (booking) => booking.client.id === client.id,
      );
      const upcoming = clientBookings.filter(
        (booking) =>
          booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS",
      ).length;
      const completed = clientBookings.filter(
        (booking) => booking.status === "COMPLETED",
      ).length;
      const note = noteByClient.get(client.id);
      return {
        client: {
          id: client.id,
          name: clientName(client),
          avatarUrl: client.avatarUrl,
        },
        pastSessionCount: completed,
        upcomingSessionCount: upcoming,
        note: note
          ? {
              content: note.content,
              targetWeights: note.targetWeights,
              injuryNotes: note.injuryNotes,
              updatedAt: note.updatedAt.toISOString(),
            }
          : null,
      };
    });

    return success({ requests: requests.map(serializeBooking), roster });
  } catch (error) {
    if (error instanceof HttpError) return failure(error.message, error.status);
    console.error("Trainer requests GET failed:", error);
    return failure("Unable to load booking requests.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const trainer = await trainerFromRequest(request);
    if (!trainer) return failure("Trainer authentication is required.", 401);
    const body = (await request.json()) as RequestBody;

    if (body.action === "SAVE_NOTE") {
      if (!body.clientId) return failure("Client is required.", 400);
      const content = (body.content ?? "").trim();
      const targetWeights = (body.targetWeights ?? "").trim();
      const injuryNotes = (body.injuryNotes ?? "").trim();
      if (
        [content, targetWeights, injuryNotes].some(
          (item) => item.length > 2_000,
        )
      )
        return failure("Notes must be 2,000 characters or fewer.", 400);
      const isClientOfTrainer = await prisma.booking.findFirst({
        where: {
          trainerId: trainer.id,
          clientId: body.clientId,
          status: { in: activeStatuses },
        },
      });
      if (!isClientOfTrainer)
        return failure("This client is not in your roster.", 404);
      const note = await prisma.clientNote.upsert({
        where: {
          trainerId_clientId: {
            trainerId: trainer.id,
            clientId: body.clientId,
          },
        },
        create: {
          trainerId: trainer.id,
          clientId: body.clientId,
          content,
          targetWeights: targetWeights || null,
          injuryNotes: injuryNotes || null,
        },
        update: {
          content,
          targetWeights: targetWeights || null,
          injuryNotes: injuryNotes || null,
        },
      });
      return success({ note });
    }

    return failure(
      "Payment confirmation is automatic. Manage confirmed sessions in your bookings dashboard.",
      409,
    );
  } catch (error) {
    if (error instanceof HttpError) return failure(error.message, error.status);
    console.error("Trainer requests POST failed:", error);
    return failure("Unable to update the booking request.", 500);
  }
}
