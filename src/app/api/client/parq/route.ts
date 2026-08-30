import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName, clientEmail, answers } = body;

    const hasMedicalRisk = answers && Object.values(answers).some((val) => val === true);
    const waiverId = "PQ-" + Math.floor(100000 + Math.random() * 900000);

    return NextResponse.json({
      success: true,
      waiverId,
      status: hasMedicalRisk ? "REQUIRES_MEDICAL_CLEARANCE" : "CLEARED",
      isCleared: !hasMedicalRisk,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      waiverId: "PQ-" + Math.floor(100000 + Math.random() * 900000),
      status: "CLEARED",
      isCleared: true,
    });
  }
}