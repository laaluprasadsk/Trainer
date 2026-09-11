# Trainrr

A personal-trainer marketplace built on the existing Next.js 16 / React 19 / Tailwind 4 / Prisma 6 / PostgreSQL project. See [the engineering report](docs/ENGINEERING-REPORT.md) for the original audit, implementation, security model and remaining limits.

## Run locally

Requirements: Node.js 22+ (tested on Node 24), npm, Docker Compose, and a PostgreSQL instance supporting `btree_gist`.

```sh
npm ci
cp .env.example .env
```

Set `POSTGRES_PASSWORD`, `DATABASE_URL` and `DIRECT_URL` in `.env` to matching local credentials. Set `APP_URL=http://localhost:3000`. Existing `.env.local` values take precedence in Next.js: update that file too if present, so the app and Prisma point to the same intended database. Never replace remote database settings without keeping a secure copy.

```sh
docker compose up -d
npm run db:migrate
npm run dev
```

Visit http://localhost:3000. Register client/trainer accounts through `/register`. Trainers complete `/dashboard/profile`, upload credentials, and publish availability at `/schedule`. New trainers are pending until an admin approves them.

To create an administrator, set `ADMIN_EMAIL`, `ADMIN_PHONE`, and a strong `ADMIN_PASSWORD` (12+ characters) in your private environment, then run:

```sh
npm run db:admin
```

Remove those three bootstrap variables afterwards. Existing accounts are never silently promoted or overwritten. Sign in at `/login` and open `/admin` to review trainers.

**Existing database upgrade:** the original baseline migration was empty. Read the engineering report's migration warning before deploying against an existing populated database. The configured empty Trainrr Supabase project has received all reviewed migrations; do not run this baseline against another populated database without reconciling its migration history first.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Application PostgreSQL connection; pooler supported |
| `DIRECT_URL` | Direct PostgreSQL connection for migration commands |
| `POSTGRES_PASSWORD` | Local Docker database password |
| `APP_URL` | Exact site origin for CSRF checks/reset links, without trailing slash |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side provider order/payment access |
| `RAZORPAY_WEBHOOK_SECRET` | Independent raw-body webhook signing secret |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional password-reset email delivery; use a verified sender |
| `CRON_SECRET` | Bearer secret for the reminder/cleanup endpoint |
| `STORAGE_PROVIDER` | Set to `supabase` in production |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server-only object-storage access |
| `MSG91_*` | Server-only OTP, sender and approved booking-template configuration |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional public project metadata; Prisma does not use these for authorization |
| `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD` | One-time administrator creation only |

Redis and JWT secrets are no longer required. Sessions and booking locks use PostgreSQL. The Razorpay key ID is returned to checkout as required by the provider; secret keys never reach the browser.

## Payments and reminders

Configure Razorpay test keys first, automatic capture, and webhooks at `/api/webhooks/payment` for `payment.captured`, `payment.failed`, and `refund.processed`. Use the configured webhook secret. Test checkout with Razorpay test instruments before switching to live keys. Without credentials checkout returns a configuration error; no free or pretend payment is created.

Session prices include the admin-configured commission (15% by default for new installations). The rate is captured on each booking, so later changes do not rewrite financial history. Holds last ten minutes. Confirmed clients can cancel at least 24 hours before their session. Trainer completion is allowed only after the scheduled end. Refund requests are queued as `REFUND_PENDING`; an operator issues a full refund in the Razorpay dashboard, and its signed processed event updates the record. Payout transfers require a separate provider integration. `HELD_IN_ESCROW` is the retained schema status for captured funds, not a regulated escrow guarantee.

Schedule an HTTP POST to `/api/jobs/reminders` every 15 minutes with `Authorization: Bearer <CRON_SECRET>`. It sends each 24-hour in-app reminder once and prunes expired sessions/reset tokens/rate-limit buckets. Do not put the bearer value in source control.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The E2E runner creates its own PostgreSQL database in the OS temporary directory (port 55437), applies migrations, starts Next.js (port 3107), and launches installed Google Chrome headlessly. It never uses your configured remote database. Database passwords and test signing secrets are generated per run. The Razorpay SDK is replaced by `tests/provider-stub.cjs` only inside this test process. Real HMAC verification, domain services, Prisma and browser pages are exercised. Temp logs/screenshots remain for inspection; all processes stop on completion. On npm configurations that block install scripts, approve the `@embedded-postgres/<platform>` installation script before running E2E. On a machine without Chrome, install Chrome or adapt the runner to a Playwright-managed browser.

The `deepmerge-ts` override fixes the advisory in Prisma's transitive config dependency; Prisma generation, migrations and build are tested with the override.

## Production

Run `npm run build` and `npm start` behind HTTPS, or deploy the Next.js app to a compatible managed Node platform. Use managed PostgreSQL with connection pooling, direct migration credentials, backups and `btree_gist`. Run migrations as a separate release job after resolving baseline/history compatibility. Store secrets in the platform secret manager. The production design uses the private `trainrr-certifications` and public `trainrr-avatars` Supabase Storage buckets; application routes still enforce file ownership and admin authorization. Configure request size/rate limits at the reverse proxy, monitoring, Razorpay webhooks, a verified email sender and the reminder scheduler. Add malware scanning when upload volume or compliance requirements justify it. Never deploy the test SDK preload or E2E environment to production.
