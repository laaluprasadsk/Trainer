import { assert } from "./http";
import { GenericEmail } from "./email/templates";
import { sendTransactionalEmail } from "./email/send";

// Never log request bodies/URLs here: OTPs and reset tokens are sensitive.
export async function sendEmail(
  to: string,
  subject: string,
  message: string,
  key: string,
) {
  return sendTransactionalEmail({
    to,
    subject,
    template: "notification",
    content: <GenericEmail title={subject} message={message} />,
    idempotencyKey: key,
  });
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
