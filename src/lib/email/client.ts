import "server-only";
import { Resend } from "resend";
import { assert } from "@/lib/http";

let client: Resend | undefined;

export function resendClient() {
  assert(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
    "Email service is temporarily unavailable. Please try again later.",
    503,
  );
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function applicationUrl(path: string) {
  assert(
    process.env.APP_URL,
    "Email service is temporarily unavailable. Please try again later.",
    503,
  );
  return new URL(path, `${process.env.APP_URL.replace(/\/$/, "")}/`).toString();
}
