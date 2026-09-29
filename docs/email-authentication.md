# Trainrr email authentication and Resend operations

## Architecture

Trainrr keeps its existing PostgreSQL-backed users and HTTP-only database sessions. Resend only delivers mail; it is not the identity provider. Verification and reset links contain a random 256-bit token, while the database stores only its SHA-256 digest. Six-digit email codes are HMAC-SHA-256 digests using `EMAIL_TOKEN_SECRET`; plaintext codes are never stored. Link challenges expire in 30 minutes, codes in 10 minutes, codes allow five attempts, and sends have a 60-second cooldown plus database-backed rate limits.

Every provider request is recorded in `email_sends` under a unique idempotency key. Resend's provider ID is then associated with signed webhook events in `email_events`. The webhook handler rejects invalid signatures and repeated `svix-id` values, so retries are safe.

## Required server settings

- `APP_URL`: exact canonical HTTPS origin, currently `https://yourtrainrr.com`.
- `RESEND_API_KEY`: restricted production sending key. Never expose this with a `NEXT_PUBLIC_` prefix.
- `EMAIL_FROM`: verified sender such as `Trainrr <notifications@yourtrainrr.com>`.
- `RESEND_WEBHOOK_SECRET`: signing secret shown after creating the webhook.
- `EMAIL_TOKEN_SECRET`: independently generated secret containing at least 32 random characters.
- `SUPPORT_EMAIL`: monitored destination for contact requests.
- `NEXT_PUBLIC_SUPPORT_EMAIL`: public support address displayed to customers; this is the only public email variable.

Store server secrets in Vercel's encrypted environment variables for Production and Preview as appropriate. Keep local development values in `.env.local`, which is ignored by Git.

Authentication email links return to these application routes:

- Email verification: `/verify-account?token=...`
- Password recovery: `/reset-password?token=...`
- Email change: `/verify-email-change?token=...`

`APP_URL` supplies the origin. Use `http://localhost:3000` only in local development and `https://yourtrainrr.com` in production; the email service will not silently substitute another origin.

## Resend and DNS setup

The `yourtrainrr.com` sender domain must remain Verified in Resend. In Cloudflare DNS, keep the Resend-provided DKIM TXT records and SPF/MX records exactly as Resend displays them. Keep DMARC at `_dmarc.yourtrainrr.com`; begin with monitoring (`p=none`) and review aggregate reports before moving to quarantine or reject. DNS names and values are account-specific, so copy them from Resend rather than from this repository.

Create a production API key with sending access only; domain-management access is not needed by the application. Use `Trainrr <notifications@yourtrainrr.com>` as the initial transactional identity. Additional `support@` or `security@` identities should be created only when those mailboxes or forwarding routes are monitored.

In Resend, create a webhook whose endpoint is:

`https://yourtrainrr.com/api/webhooks/resend`

Subscribe to `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`, and `email.suppressed`. Copy its signing secret to `RESEND_WEBHOOK_SECRET`. Do not subscribe to open or click tracking for authentication emails.

## Test safely

Automated tests stub Resend's HTTPS API and never send external messages. For staging, use Resend's documented test recipients or a controlled inbox, keep the site on test data, and confirm:

1. Registration records one verification send.
2. Verification links are single-use and expire after 30 minutes.
3. Verification and login codes accept six digits once, expire after 10 minutes, and lock after five failed attempts.
4. Forgot-password responses remain identical for existing and unknown accounts.
5. Reset links are single-use and password changes revoke other sessions.
6. Email changes require the current password, confirmation at the new address, and notify both addresses.
7. Resend webhook retries create one event and advance the matching send status.

Do not test production with customer accounts. Use a dedicated internal account and avoid placing passwords, tokens, codes, or full email contents in logs.

## Key rotation and incident response

Create a replacement Resend API key, update Vercel, redeploy, send a controlled test, then revoke the old key. To rotate the webhook secret, use Resend's signing-secret rotation, update Vercel immediately, and redeploy. Rotate `EMAIL_TOKEN_SECRET` only after current ten-minute OTPs expire; link tokens are not dependent on it.

For delivery issues, inspect `email_sends.status`, the corresponding `email_events`, Vercel runtime logs, Resend Logs, domain verification, suppression records, and the recipient's spam folder. A neutral forgot-password or login-code response intentionally does not reveal whether an account exists. Operational delivery truth comes from the send/event records and Resend dashboard.
