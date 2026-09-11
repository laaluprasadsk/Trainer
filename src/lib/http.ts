import { Prisma } from "@prisma/client";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(ok: unknown, message: string, status = 400): asserts ok {
  if (!ok) throw new HttpError(status, message);
}
export function text(value: unknown, name: string, max = 200, required = true) {
  assert(typeof value === "string", `${name} must be text.`);
  const s = value.trim();
  assert(
    s.length <= max && (!required || s.length > 0),
    `${name} is required and must be at most ${max} characters.`,
  );
  return s;
}
export function number(value: unknown, name: string, min: number, max: number) {
  assert(
    typeof value === "number" || typeof value === "string",
    `${name} must be a number.`,
  );
  const n = Number(value);
  assert(
    Number.isFinite(n) && n >= min && n <= max,
    `${name} must be between ${min} and ${max}.`,
  );
  return n;
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  assert(
    Number(req.headers.get("content-length") || 0) < 3_000_000,
    "Request is too large.",
    413,
  );
  const raw = await req.text();
  assert(Buffer.byteLength(raw) < 3_000_000, "Request is too large.", 413);
  const data = JSON.parse(raw);
  assert(
    data && typeof data === "object" && !Array.isArray(data),
    "Invalid request body.",
  );
  return data;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  assert(
    !origin || origin === (process.env.APP_URL || new URL(req.url).origin),
    "Cross-origin request denied.",
    403,
  );
  assert(
    req.headers.get("sec-fetch-site") !== "cross-site",
    "Cross-site request denied.",
    403,
  );
}
export function api(fn: (req: Request) => Promise<unknown>, mutation = false) {
  return async (req: Request) => {
    try {
      if (mutation) sameOrigin(req);
      const data = await fn(req);
      return data instanceof Response
        ? data
        : Response.json({ success: true, ...(data as object) });
    } catch (e) {
      if (e instanceof HttpError)
        return Response.json(
          { success: false, error: e.message },
          { status: e.status },
        );
      if (e instanceof SyntaxError)
        return Response.json(
          { success: false, error: "Invalid JSON." },
          { status: 400 },
        );
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034", "P2003"].includes(e.code)
      )
        return Response.json(
          {
            success: false,
            error:
              "This record already exists or changed. Refresh and try again.",
          },
          { status: 409 },
        );
      console.error(
        "Request failed",
        e instanceof Error ? e.name : "Unknown error",
      );
      return Response.json(
        {
          success: false,
          error: "The service is temporarily unavailable. Please try again.",
        },
        { status: 503 },
      );
    }
  };
}
