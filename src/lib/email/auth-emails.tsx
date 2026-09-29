import "server-only";
import { applicationUrl } from "./client";
import { sendTransactionalEmail } from "./send";
import {
  EmailChangedEmail,
  EmailChangeVerificationEmail,
  LoginAlertEmail,
  OtpEmail,
  PasswordChangedEmail,
  PasswordResetEmail,
  VerificationEmail,
  WelcomeEmail,
} from "./templates";

type Person = {
  id: string;
  email: string;
  name: string;
  role?: "CLIENT" | "TRAINER" | "ADMIN";
};

function securityTimestamp() {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export const sendVerificationEmail = (
  person: Person,
  token: string,
  key: string,
) =>
  sendTransactionalEmail({
    to: person.email,
    subject: "Verify your Trainrr email",
    template: "email-verification",
    content: (
      <VerificationEmail
        name={person.name}
        url={applicationUrl(
          `/verify-account?token=${encodeURIComponent(token)}`,
        )}
      />
    ),
    idempotencyKey: `verify-${key}`,
    userId: person.id,
  });

export const sendEmailOtp = (
  person: Person,
  code: string,
  key: string,
  purpose: "sign-in" | "verification" = "sign-in",
) =>
  sendTransactionalEmail({
    to: person.email,
    subject:
      purpose === "verification"
        ? "Your Trainrr verification code"
        : "Your Trainrr sign-in code",
    template:
      purpose === "verification" ? "email-verification-otp" : "login-otp",
    content: <OtpEmail name={person.name} code={code} />,
    idempotencyKey: `login-otp-${key}`,
    userId: person.id,
  });

export const sendPasswordResetEmail = (
  person: Person,
  token: string,
  key: string,
) =>
  sendTransactionalEmail({
    to: person.email,
    subject: "Reset your Trainrr password",
    template: "password-reset",
    content: (
      <PasswordResetEmail
        name={person.name}
        url={applicationUrl(
          `/reset-password?token=${encodeURIComponent(token)}`,
        )}
      />
    ),
    idempotencyKey: `reset-${key}`,
    userId: person.id,
  });

export const sendPasswordChangedEmail = (person: Person, key: string) =>
  sendTransactionalEmail({
    to: person.email,
    subject: "Your Trainrr password was changed",
    template: "password-changed",
    content: (
      <PasswordChangedEmail
        name={person.name}
        changedAt={securityTimestamp()}
      />
    ),
    idempotencyKey: `password-changed-${key}`,
    userId: person.id,
  });

export const sendWelcomeEmail = (person: Person) =>
  sendTransactionalEmail({
    to: person.email,
    subject: "Welcome to Trainrr",
    template: "welcome",
    content: (
      <WelcomeEmail
        name={person.name}
        url={applicationUrl(
          person.role === "TRAINER"
            ? "/onboarding"
            : person.role === "ADMIN"
              ? "/admin"
              : "/trainers",
        )}
        action={
          person.role === "TRAINER"
            ? "Complete your trainer profile"
            : person.role === "ADMIN"
              ? "Open admin operations"
              : "Find a trainer"
        }
      />
    ),
    idempotencyKey: `welcome-${person.id}`,
    userId: person.id,
  });

export const sendEmailChangeVerification = (
  person: Person,
  newEmail: string,
  token: string,
  key: string,
) =>
  sendTransactionalEmail({
    to: newEmail,
    subject: "Confirm your new Trainrr email",
    template: "email-change-verification",
    content: (
      <EmailChangeVerificationEmail
        name={person.name}
        newEmail={newEmail}
        url={applicationUrl(
          `/verify-email-change?token=${encodeURIComponent(token)}`,
        )}
      />
    ),
    idempotencyKey: `email-change-${key}`,
    userId: person.id,
  });

export const sendEmailChanged = (
  person: Person,
  recipient: string,
  newEmail: string,
  key: string,
) =>
  sendTransactionalEmail({
    to: recipient,
    subject: "Your Trainrr email was changed",
    template: "email-changed",
    content: (
      <EmailChangedEmail
        name={person.name}
        newEmail={newEmail}
        changedAt={securityTimestamp()}
      />
    ),
    idempotencyKey: `email-changed-${key}`,
    userId: person.id,
  });

export const sendLoginAlert = (person: Person, key: string) =>
  sendTransactionalEmail({
    to: person.email,
    subject: "A passwordless sign-in to your Trainrr account",
    template: "login-alert",
    content: <LoginAlertEmail name={person.name} />,
    idempotencyKey: `login-alert-${key}`,
    userId: person.id,
  });
