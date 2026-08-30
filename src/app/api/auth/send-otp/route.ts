import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = body; // Phone or Email

    if (!identifier) {
      return NextResponse.json({ success: false, error: "Phone number or email is required" }, { status: 400 });
    }

    // In development, default test OTP is 1234
    const otp = "1234";

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to " + identifier,
      devOtp: otp,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}