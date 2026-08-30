import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, otp, role = "CLIENT" } = body;

    // Accept demo OTP '1234' or any 4-digit code in dev
    if (otp !== "1234" && otp.length !== 4) {
      return NextResponse.json({ success: false, error: "Invalid OTP. Use test code 1234." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: "usr-" + Math.floor(100000 + Math.random() * 900000),
        identifier,
        role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}