import { requireUser } from "@/lib/auth";
import { sameOrigin, HttpError } from "@/lib/http";
import {
  Prisma,
  SessionLocationType,
  VerificationStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sessionModes = new Set<SessionLocationType>([
  "CLIENT_HOME",
  "TRAINER_GYM",
  "PUBLIC_PARK",
  "ONLINE",
]);

type ProfilePayload = {
  firstName?: unknown;
  lastName?: unknown;
  bio?: unknown;
  yearsExperience?: unknown;
  hourlyRate?: unknown;
  homeLocationName?: unknown;
  serviceRadiusKm?: unknown;
  specializations?: unknown;
  acceptedSessionModes?: unknown;
  certification?: {
    title?: unknown;
    issuingOrganization?: unknown;
    issuedDate?: unknown;
    credentialId?: unknown;
    documentUrl?: unknown;
  };
};

function response(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function trainerFromRequest(request: NextRequest) {
  if (request.method !== "GET") sameOrigin(request);
  return (await requireUser("TRAINER")).trainerProfile;
}

function asText(
  value: unknown,
  field: string,
  maxLength: number,
  required = false,
) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be text.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`${field} is required.`);
  if (trimmed.length > maxLength) throw new Error(`${field} is too long.`);
  return trimmed;
}

function asNumber(value: unknown, field: string, min: number, max: number) {
  if (value === undefined) return undefined;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${field} must be between ${min} and ${max}.`);
  }
  return numberValue;
}

function asStringList(
  value: unknown,
  field: string,
  maxItems: number,
  maxLength: number,
) {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.length > maxItems ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new Error(`${field} must be a list of up to ${maxItems} items.`);
  }
  const cleaned = [
    ...new Set(value.map((item) => item.trim()).filter(Boolean)),
  ];
  if (cleaned.some((item) => item.length > maxLength))
    throw new Error(`${field} contains an item that is too long.`);
  return cleaned;
}

function serializeProfile(profile: {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  yearsExperience: number;
  hourlyRate: Prisma.Decimal;
  homeLocationName: string;
  serviceRadiusKm: Prisma.Decimal;
  specializations: string[];
  acceptedSessionModes: SessionLocationType[];
  verificationStatus: VerificationStatus;
  certifications: Array<{
    id: string;
    title: string;
    issuingOrganization: string;
    credentialId: string | null;
    documentUrl: string;
    status: VerificationStatus;
    issuedDate: Date | null;
    adminReviewNote: string | null;
    createdAt: Date;
  }>;
}) {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio ?? "",
    yearsExperience: profile.yearsExperience,
    hourlyRate: Number(profile.hourlyRate),
    homeLocationName: profile.homeLocationName,
    serviceRadiusKm: Number(profile.serviceRadiusKm),
    specializations: profile.specializations,
    acceptedSessionModes: profile.acceptedSessionModes,
    verificationStatus: profile.verificationStatus,
    certifications: profile.certifications.map((certification) => ({
      ...certification,
      issuedDate: certification.issuedDate?.toISOString() ?? null,
      createdAt: certification.createdAt.toISOString(),
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const trainer = await trainerFromRequest(request);
    if (!trainer) return failure("Trainer authentication is required.", 401);

    const profile = await prisma.trainerProfile.findUnique({
      where: { id: trainer.id },
      include: { certifications: { orderBy: { createdAt: "desc" } } },
    });
    if (!profile) return failure("Trainer profile was not found.", 404);
    return response(serializeProfile(profile));
  } catch (error) {
    if (error instanceof HttpError) return failure(error.message, error.status);
    console.error("Trainer profile GET failed:", error);
    return failure("Unable to load your trainer profile.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const trainer = await trainerFromRequest(request);
    if (!trainer) return failure("Trainer authentication is required.", 401);

    const body = (await request.json()) as ProfilePayload;
    const firstName = asText(body.firstName, "First name", 80);
    const lastName = asText(body.lastName, "Last name", 80);
    if (firstName === "" || lastName === "")
      throw new Error("Names cannot be empty.");
    const bio = asText(body.bio, "Bio", 2_000);
    const homeLocationName = asText(
      body.homeLocationName,
      "Service location",
      160,
    );
    const yearsExperience = asNumber(
      body.yearsExperience,
      "Years of experience",
      0,
      80,
    );
    const hourlyRate = asNumber(body.hourlyRate, "Hourly rate", 100, 100_000);
    const serviceRadiusKm = asNumber(
      body.serviceRadiusKm,
      "Service radius",
      0,
      250,
    );
    const specializations = asStringList(
      body.specializations,
      "Specializations",
      12,
      80,
    );
    const modes = asStringList(
      body.acceptedSessionModes,
      "Training types",
      4,
      30,
    );
    const acceptedSessionModes = modes?.map((mode) => {
      if (!sessionModes.has(mode as SessionLocationType))
        throw new Error("Training types contains an unsupported mode.");
      return mode as SessionLocationType;
    });

    const profileUpdate: Prisma.TrainerProfileUpdateInput = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(homeLocationName !== undefined && { homeLocationName }),
      ...(yearsExperience !== undefined && {
        yearsExperience: Math.floor(yearsExperience),
      }),
      ...(hourlyRate !== undefined && {
        hourlyRate: new Prisma.Decimal(hourlyRate),
      }),
      ...(serviceRadiusKm !== undefined && {
        serviceRadiusKm: new Prisma.Decimal(serviceRadiusKm),
      }),
      ...(specializations !== undefined && { specializations }),
      ...(acceptedSessionModes !== undefined && { acceptedSessionModes }),
    };

    if (body.certification) {
      const title = asText(
        body.certification.title,
        "Certificate title",
        160,
        true,
      );
      const issuingOrganization = asText(
        body.certification.issuingOrganization,
        "Issuing organization",
        160,
        true,
      );
      const credentialId = asText(
        body.certification.credentialId,
        "Credential ID",
        120,
      );
      const documentUrl = asText(
        body.certification.documentUrl,
        "Certificate document",
        2_800_000,
        true,
      );
      const issuedDateText = asText(
        body.certification.issuedDate,
        "Issue date",
        30,
      );
      const issuedDate = issuedDateText
        ? new Date(`${issuedDateText}T00:00:00.000Z`)
        : null;
      if (issuedDate && Number.isNaN(issuedDate.getTime()))
        throw new Error("Issue date is invalid.");
      if (!documentUrl?.startsWith("/api/uploads/"))
        throw new Error("Upload your certificate first.");
      const upload = await prisma.upload.findFirst({
        where: { id: documentUrl.split("/").pop(), userId: trainer.userId },
      });
      if (!upload) throw new Error("Certificate upload not found.");
      profileUpdate.verificationStatus = "PENDING";
      profileUpdate.certifications = {
        create: {
          title: title!,
          issuingOrganization: issuingOrganization!,
          credentialId: credentialId || null,
          documentUrl: documentUrl!,
          issuedDate,
        },
      };
    }

    if (Object.keys(profileUpdate).length === 0)
      return failure("Provide at least one profile field to update.", 400);

    const updated = await prisma.trainerProfile.update({
      where: { id: trainer.id },
      data: profileUpdate,
      include: { certifications: { orderBy: { createdAt: "desc" } } },
    });
    if (body.certification) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          message: `Trainer ${updated.firstName} ${updated.lastName} submitted credentials for review.`,
        })),
      });
    }
    return response(serializeProfile(updated));
  } catch (error) {
    if (error instanceof HttpError) return failure(error.message, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Trainer profile PATCH failed:", error);
      return failure("Unable to save your trainer profile.", 500);
    }
    if (error instanceof SyntaxError || error instanceof Error) {
      return failure(
        error instanceof Error ? error.message : "Invalid request body.",
        400,
      );
    }
    console.error("Trainer profile PATCH failed:", error);
    return failure("Unable to save your trainer profile.", 500);
  }
}
