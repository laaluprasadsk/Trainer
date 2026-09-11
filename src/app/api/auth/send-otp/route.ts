export function POST() {
  return Response.json(
    {
      success: false,
      error: "SMS sign-in is unavailable. Use email and password.",
    },
    { status: 410 },
  );
}
