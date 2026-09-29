import type { ReactNode } from "react";

const colors = {
  ink: "#15372c",
  muted: "#56665f",
  surface: "#f4f7f4",
  accent: "#d7f350",
  white: "#ffffff",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL;

function Layout({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: colors.surface }}>
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
          }}
        >
          {preview}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ background: colors.surface, padding: "32px 12px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: 600,
                    background: colors.white,
                    borderRadius: 20,
                    overflow: "hidden",
                    fontFamily:
                      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    color: colors.ink,
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          background: colors.ink,
                          color: colors.white,
                          padding: "24px 32px",
                          fontSize: 26,
                          fontWeight: 800,
                          letterSpacing: -1,
                        }}
                      >
                        Trainrr<span style={{ color: colors.accent }}>.</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "36px 32px" }}>
                        <h1
                          style={{
                            margin: "0 0 18px",
                            fontSize: 28,
                            lineHeight: 1.2,
                          }}
                        >
                          {title}
                        </h1>
                        <div
                          style={{
                            color: colors.muted,
                            fontSize: 16,
                            lineHeight: 1.7,
                          }}
                        >
                          {children}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          borderTop: `1px solid ${colors.surface}`,
                          padding: "22px 32px",
                          color: colors.muted,
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        Your personal training, on your schedule.
                        <br />
                        This is an automated security email from Trainrr.
                        {supportEmail && (
                          <>
                            <br />
                            Need help?{" "}
                            <a
                              href={`mailto:${supportEmail}`}
                              style={{ color: colors.ink }}
                            >
                              {supportEmail}
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p style={{ margin: "28px 0" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          background: colors.ink,
          color: colors.white,
          borderRadius: 999,
          padding: "13px 22px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {children}
      </a>
    </p>
  );
}

function SecurityFooter({ minutes }: { minutes?: number }) {
  return (
    <p style={{ margin: "22px 0 0", fontSize: 14 }}>
      {minutes ? `This link or code expires in ${minutes} minutes. ` : ""}
      If you did not request this, you can safely ignore this message. Never
      share a verification code or password with anyone.
    </p>
  );
}

export function VerificationEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <Layout preview="Verify your Trainrr email" title="Verify your email">
      <p>
        Hi {name}, confirm this email address to secure your Trainrr account.
      </p>
      <Button href={url}>Verify email</Button>
      <p>
        If the button does not work, copy this address into your browser:
        <br />
        <a href={url} style={{ color: colors.ink, wordBreak: "break-all" }}>
          {url}
        </a>
      </p>
      <SecurityFooter minutes={30} />
    </Layout>
  );
}

export function OtpEmail({ name, code }: { name: string; code: string }) {
  return (
    <Layout preview="Your Trainrr sign-in code" title="Your sign-in code">
      <p>Hi {name}, enter this one-time code to sign in:</p>
      <p
        style={{
          margin: "24px 0",
          padding: 18,
          borderRadius: 14,
          background: colors.surface,
          color: colors.ink,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: 8,
          textAlign: "center",
        }}
      >
        {code}
      </p>
      <SecurityFooter minutes={10} />
    </Layout>
  );
}

export function PasswordResetEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <Layout preview="Reset your Trainrr password" title="Reset your password">
      <p>Hi {name}, use the secure link below to choose a new password.</p>
      <Button href={url}>Reset password</Button>
      <SecurityFooter minutes={30} />
    </Layout>
  );
}

export function PasswordChangedEmail({
  name,
  changedAt,
}: {
  name: string;
  changedAt: string;
}) {
  return (
    <Layout
      preview="Your Trainrr password was changed"
      title="Password changed"
    >
      <p>
        Hi {name}, the password for your Trainrr account was changed. Other
        sessions have been signed out.
      </p>
      <p>Change time: {changedAt}</p>
      <p>
        If this was not you, reset your password immediately and contact Trainrr
        support.
      </p>
    </Layout>
  );
}

export function WelcomeEmail({
  name,
  url,
  action,
}: {
  name: string;
  url: string;
  action: string;
}) {
  return (
    <Layout preview="Welcome to Trainrr" title="Welcome to Trainrr">
      <p>
        Hi {name}, your email is verified. You can now finish your profile and
        discover trainers who fit your schedule.
      </p>
      <Button href={url}>{action}</Button>
    </Layout>
  );
}

export function EmailChangeVerificationEmail({
  name,
  url,
  newEmail,
}: {
  name: string;
  url: string;
  newEmail: string;
}) {
  return (
    <Layout
      preview="Confirm your new Trainrr email"
      title="Confirm your new email"
    >
      <p>
        Hi {name}, confirm that you want to use <strong>{newEmail}</strong> for
        your Trainrr account.
      </p>
      <Button href={url}>Confirm new email</Button>
      <SecurityFooter minutes={30} />
    </Layout>
  );
}

export function EmailChangedEmail({
  name,
  newEmail,
  changedAt,
}: {
  name: string;
  newEmail: string;
  changedAt: string;
}) {
  return (
    <Layout
      preview="Your Trainrr email was changed"
      title="Email address changed"
    >
      <p>
        Hi {name}, the email address on your Trainrr account is now {newEmail}.
      </p>
      <p>Change time: {changedAt}</p>
      <p>
        If this was not you, contact Trainrr support immediately and secure your
        email account.
      </p>
    </Layout>
  );
}

export function LoginAlertEmail({ name }: { name: string }) {
  return (
    <Layout
      preview="A passwordless sign-in to Trainrr"
      title="New passwordless sign-in"
    >
      <p>Hi {name}, your one-time email code was used to sign in to Trainrr.</p>
      <p>If this was not you, change your password and contact support.</p>
    </Layout>
  );
}

export function GenericEmail({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Layout preview={title} title={title}>
      {message.split("\n").map((line, index) => (
        <p key={`${index}-${line.slice(0, 10)}`}>{line || <>&nbsp;</>}</p>
      ))}
    </Layout>
  );
}
