# Trainrr engineering report

## Original application and audit

The repository uses Next.js 16.3.1 App Router, React 19.2.8, TypeScript, Tailwind 4, Prisma 6.19.3/PostgreSQL, Lucide, ioredis and the Razorpay Node SDK. Existing uncommitted profile/client-hub work was present and preserved where functional. The landing design, trainer profile form, questionnaire, database domain models and trainer/client notes were reusable.

Most original dashboards and scheduling were local mock arrays. Login accepted arbitrary four-digit OTPs, browser localStorage supplied identity, trainer APIs trusted request headers, trainer registration stored a temporary password hash, and several catch blocks reported fictitious success. Public discovery returned fabricated trainers and slots. Checkout/webhook endpoints were placeholders, earnings were fabricated, and a trainer could confirm an unpaid booking. The initial migration was empty. Lint originally reported 23 errors and 45 warnings; TypeScript passed, but the build configuration explicitly ignored errors. No automated tests existed.

## Implemented flows

- Client/trainer password registration, login/logout, seven-day revocable opaque sessions, password changes and single-use password reset tokens. Password reset delivery uses optional Resend configuration. Legacy demo OTP endpoints return 410.
- Server-side role protection and session-derived ownership on all private APIs and dashboard layouts. Suspension revokes sessions.
- Trainer onboarding through the existing profile form, private credential uploads, admin approval/rejection/suspension/reactivation, durable review notes and audit actions. Pending and suspended trainers are excluded from discovery and checkout.
- Database trainer search by name, location, specialty, method, price, rating, experience, date and time; real public slots and completed-session reviews.
- Future availability publication, adjacent slots, weekly repetition for a selected horizon, custom dates, blocked slots and split windows. Asia/Kolkata is the explicit marketplace timezone.
- Atomic checkout reservations, server-derived duration pricing and admin-configurable inclusive commission, ten-minute holds, provider orders, signature verification, captured-payment confirmation, idempotent webhook handling, cancellation, completion, late-payment refund review and one review per completed session.
- Real client/trainer booking dashboards, payment history, trainer earnings, coaching notes, admin account/booking/transaction inspection, profile photos and client profile editing.
- In-app notifications, contact requests, and an authenticated idempotent upcoming-session reminder/cleanup job.
- Public About, How It Works, Contact and trainer application pages; loading/error/empty states and responsive form/dashboard layouts. Removed fabricated social proof and unsupported escrow/insurance claims.

## Database and concurrency

Preserved original User, ClientProfile, TrainerProfile, Certification, AvailabilitySlot, Booking, Payment, Review, ParqWaiver and ClientNote models. Added Session, AuthToken, RateLimit, Notification, AdminAction and Upload; booking expiry, REFUND_PENDING payment state, trainer avatar and public-photo storage flag.

Booking-to-slot is now many-to-one to retain cancelled history. A partial unique index permits only one active booking per slot. PostgreSQL GiST exclusion constraints prohibit overlapping trainer windows, and checks enforce valid times, rating bounds and balanced money. A trainer row lock serializes slot changes, checkout, cancellation and captured-payment confirmation. Expired holds are cancelled under this lock before replacement. A late capture enters refund review and cannot displace a newer reservation. Money is rounded in integer paise before persistence.

**Existing databases:** the supplied `0_init` migration was empty and has been reconstructed. Do not blindly apply this baseline to a populated database or erase migration history. Back up and compare the deployed schema/migration ledger, baseline already-existing tables as appropriate, and apply only missing extensions. Resolve historical overlaps, malformed time strings and unbalanced financial records before new constraints. The connected empty Trainrr Supabase database received all six migrations on 2026-09-11.

## API surface

Authentication: `/api/auth/register`, `/login`, `/logout`, `/me`, `/forgot`, `/reset`, `/password` under `/api/auth`.

Marketplace: `/api/trainers/search`, `/api/trainers/slots`, `/api/trainer/profile`, `/api/trainer/requests`, `/api/trainers/payouts`, `/api/client/profile`, `/api/client/parq`.

Transactions: `/api/bookings`, `/api/bookings/checkout`, `/api/bookings/verify`, `/api/webhooks/payment`, `/api/reviews`. The old lock-slot route delegates to checkout; the old apply route delegates to authenticated profile submission.

Operations: `/api/admin`, `/api/notifications`, `/api/contact`, `/api/uploads`, `/api/uploads/[id]`, `/api/avatars/[id]`, `/api/jobs/reminders`.

## Security and payments

Passwords use salted scrypt; session/reset tokens are stored as SHA-256 digests. Cookies are HttpOnly, SameSite=Lax and Secure in production. Mutations check origin, roles and ownership; database-backed limits protect authentication and uploads. ORM queries are parameterized. Sensitive user hashes never enter API responses. Secrets remain server-side. Credential files have type, magic-byte and size checks and download only to owners/admins. Photos are decoded and re-encoded to JPEG with pixel limits and metadata removal.

Razorpay is preserved as the provider. Browser success cannot confirm a booking by itself: the callback signature is checked, then payment status/order/amount/currency are verified server-side; raw-body webhook HMACs are checked independently. Duplicate captures do not duplicate notifications. Existing HELD_IN_ESCROW is retained as an internal captured-funds status; it is not a claim that a regulated escrow account exists. No actual trainer transfer is inferred from completion.

Implementation references: [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) and [Resend email API](https://resend.com/docs/api-reference/emails/send-email).

## Validation and limits

Final validation: 118 end-to-end checks and 4 domain unit tests passed; ESLint, TypeScript checking, production build and git diff whitespace checks passed. The dependency audit reported zero vulnerabilities after the transitive dependency fix. The checkout session-loading race discovered during browser testing was fixed. See `docs/test-results.json` for the isolated integration result. Tests apply migrations to a new embedded PostgreSQL instance and run the actual Next.js server. Razorpay transport is replaced only by a test-process preload; production code has no test-payment bypass. Tests cover auth/RBAC, uploads, verification, overlap rejection, concurrent checkout, tampered pricing, forged/replayed webhooks, late capture, dashboard persistence, reviews, earnings, and browser layouts at 375/768/1024/1440px. Unit tests cover dates, overlap boundaries, timezone conversion and paise conservation. Run commands and provider setup are in README.

External go-live work: configure and exercise Razorpay test/live checkout and webhook delivery, verify a Resend sender domain, provision an admin, complete MSG91/DLT setup and deploy a preview. Trainer payouts and refund initiation remain provider-dashboard/manual operations; full processed-refund webhooks update local status. Partial refunds require manual reconciliation. No bank account/payout credentials are collected. Phone OTP and booking SMS are implemented but remain unverified against a live MSG91 account. Dynamic category administration is not implemented; categories remain the existing specialization arrays. Recurrence materializes up to 12 weeks from the UI (API maximum 180 days), rather than an indefinitely recurring rule engine. Public discovery returns up to 100 trainers, operational tables up to 500 recent records, and availability up to 1000 slots; cursor pagination is the next scaling step. Supabase Storage buckets are provisioned, but the service-role secret and production upload test remain. Configure and verify the reminder scheduler. Profile email changes require an email-verification workflow and are intentionally not exposed.
