# Production readiness — Trainrr

Updated: 2026-09-11. Existing Next.js 16 / React 19 / TypeScript / Prisma 6 / PostgreSQL architecture is retained. The empty Trainrr Supabase project now has the reviewed schema, constraints and indexes. No public deployment, real payment, SMS delivery or sender-domain email delivery is claimed as verified.

| Area | Initial assessment | Launch dependency |
|---|---|---|
| Authentication | PARTIALLY READY | Secure sessions/passwords exist; email/phone verification missing |
| Client dashboard | READY | Tested locally against isolated PostgreSQL; production DB required |
| Trainer dashboard | READY | Same; real bookings and earnings, no automatic payouts |
| Admin dashboard | PARTIALLY READY | RBAC exists; production admin bootstrap and strong second factor needed |
| Database | READY | Supabase PostgreSQL connected; six Prisma migrations applied; pooler connections tested |
| Availability | READY | Real slots, overlapping-window constraint, India time zone; materialized recurring schedule |
| Booking | READY | Server price, row locks, unique active reservation, ten-minute holds; production smoke test outstanding |
| Payments | PARTIALLY READY | Razorpay order/signature/webhook verified in isolated tests; gateway sandbox/KYC still required |
| Marketplace payouts | BLOCKED BY EXTERNAL ACCOUNT | Razorpay Route approval and linked-account KYC; no fabricated payouts |
| OTP | PARTIALLY READY | Secure MSG91 integration, expiry, cooldown and attempt limits exist; provider/DLT configuration required |
| SMS | BLOCKED BY EXTERNAL ACCOUNT | MSG91 account, DLT entity/header/template approval |
| Email | PARTIALLY READY | Resend delivery worker and branded messages exist; `EMAIL_FROM` and verified sender domain required |
| Maps | READY | Text location search needs no Maps key; no radius/geocoding claim |
| Profile/certificate uploads | PARTIALLY READY | Supabase buckets provisioned; private-route authorization exists; service-role secret and deployed upload test required |
| Notifications | PARTIALLY READY | Durable in-app/email/SMS queue and idempotent reminder job exist; provider credentials and scheduler acceptance test required |
| Security | PARTIALLY READY | Backend RBAC/CSRF/password hashing/rate limits; production configuration audit pending |
| Deployment | PARTIALLY READY | Vercel config and CI checks exist; account sign-in, project link, environment values and preview deployment remain |
| Domain / SSL | BLOCKED BY EXTERNAL ACCOUNT | No purchased domain or public deployment supplied |
| Monitoring | PARTIALLY READY | Server error logs only; uptime alerting and delivery failure visibility needed |
| Backups | BLOCKED BY EXTERNAL ACCOUNT | Managed DB backup plan and restore drill not verified |

This is a launch gate report, not final approval. See LAUNCH-CHECKLIST.md for manual provider steps and acceptance tests.
