import { assert } from "./http";

// Never log request bodies/URLs here: OTPs and reset tokens are sensitive.
export async function sendEmail(
  to: string,
  subject: string,
  message: string,
  key: string,
) {
  assert(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
    "Email service is temporarily unavailable. Please try again later.",
    503,
  );
  const escape = (v: string) =>
    v.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:28px;color:#15372c"><h1>Trainrr</h1><h2>${escape(subject)}</h2><p style="white-space:pre-line;line-height:1.7">${escape(message)}</p><hr><p>Your personal training, on your schedule.</p></div>`,
    }),
  });
  assert(
    response.ok,
    "We could not send this email. Please try again shortly.",
    503,
  );
  const result = await response.json();
  assert(
    typeof result.id === "string",
    "Email provider returned an invalid response.",
    503,
  );
  return result.id as string;
}

export function smsConfigured() {
  assert(
    process.env.MSG91_AUTH_KEY,
    "Phone verification is temporarily unavailable. Please try again later.",
    503,
  );
  return process.env.MSG91_AUTH_KEY;
}
export async function msg91(
  path: string,
  method: "GET" | "POST",
  payload?: unknown,
) {
  const response = await fetch(`https://control.msg91.com/api/v5/${path}`, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: { authkey: smsConfigured(), "Content-Type": "application/json" },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const result = await response.json();
  assert(
    response.ok && result.type === "success",
    "SMS provider could not complete this request. Check the code or try again later.",
    400,
  );
  return typeof result.message === "string" ? result.message : "accepted";
}
export async function sendSms(
  phone: string,
  template: string,
  variables: Record<string, string>,
) {
  const allowed: Record<string, string | undefined> = {
    CONFIRMED: process.env.MSG91_BOOKING_CONFIRMED_FLOW_ID,
    CANCELLED: process.env.MSG91_BOOKING_CANCELLED_FLOW_ID,
    REMINDER: process.env.MSG91_BOOKING_REMINDER_FLOW_ID,
  };
  assert(
    allowed[template] && process.env.MSG91_SENDER_ID,
    "SMS template is not configured.",
    503,
  );
  return msg91("flow/", "POST", {
    flow_id: allowed[template],
    sender: process.env.MSG91_SENDER_ID,
    recipients: [{ mobiles: phone.replace(/^\+/, ""), ...variables }],
  });
}
