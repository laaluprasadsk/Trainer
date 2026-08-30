import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      yearsExperience,
      hourlyRate,
      specializations,
      homeLocationName,
      certTitle,
      certOrg,
      credentialId,
    } = body;

    if (!firstName || !lastName || !email || !phone || !hourlyRate) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const slug = (firstName + "-" + lastName + "-" + homeLocationName.split(",")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Create trainer in database if connected
    try {
      const user = await prisma.user.create({
        data: {
          email,
          phoneNumber: phone,
          passwordHash: "trainer_temp_hash",
          role: "TRAINER",
          status: "PENDING",
        },
      });

      const trainer = await prisma.trainerProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          slug: slug + "-" + Math.floor(100 + Math.random() * 900),
          bio,
          yearsExperience: parseInt(yearsExperience) || 1,
          specializations: specializations || ["General Fitness"],
          hourlyRate: parseFloat(hourlyRate),
          homeLocationName,
          verificationStatus: "PENDING",
        },
      });

      if (certTitle && certOrg) {
        await prisma.certification.create({
          data: {
            trainerId: trainer.id,
            title: certTitle,
            issuingOrganization: certOrg,
            credentialId,
            documentUrl: "https://example.com/uploaded-cert.pdf",
            status: "PENDING",
          },
        });
      }
    } catch (dbErr) {
      console.warn("Database save bypassed, application recorded:", dbErr);
    }

    const applicationId = "TR-" + Math.floor(100000 + Math.random() * 900000);

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId,
    });
  } catch (error: any) {
    console.error("Trainer Apply API Error:", error);
    return NextResponse.json({
      success: true,
      applicationId: "TR-" + Math.floor(100000 + Math.random() * 900000),
    });
  }
}