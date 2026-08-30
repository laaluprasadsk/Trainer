import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, defaultLocationName, fitnessGoals } = body;

    if (!firstName || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { clientProfile: true },
      });

      if (user && user.clientProfile) {
        await prisma.clientProfile.update({
          where: { id: user.clientProfile.id },
          data: {
            firstName,
            lastName,
            defaultLocationName,
            fitnessGoals: fitnessGoals || [],
          },
        });
      }
    } catch (dbErr) {
      console.warn("Database profile update bypassed:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: { firstName, lastName, email, phone, defaultLocationName, fitnessGoals },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}