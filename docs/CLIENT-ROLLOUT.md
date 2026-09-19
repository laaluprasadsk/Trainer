# Client-flow rollout plan

This branch is local-only until the owner approves a production release. The
isolated E2E test uses a temporary PostgreSQL database and intercepts Razorpay,
Resend, and MSG91; it never creates public production trainers, charges a card,
or sends a real message.

## Configuration to complete before preview testing

- Set `APP_URL` to the exact HTTPS origin for the target environment.
- Set `RESEND_API_KEY` and `EMAIL_FROM` to a verified sending domain. Configure
  `SUPPORT_EMAIL` as a monitored internal destination and
  `NEXT_PUBLIC_SUPPORT_EMAIL` only when the mailbox actually accepts mail.
- Set `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, and `MSG91_SENDER_ID` only after
  DLT/entity/sender/template approval. Test six-digit OTP delivery and expiration
  against a controlled test account.
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and an independent
  `RAZORPAY_WEBHOOK_SECRET` in the deployment secret manager. Start with test
  credentials, enable automatic capture, and configure signed webhook events
  `payment.captured`, `payment.failed`, and `refund.processed` at
  `/api/webhooks/payment`. Never put secret values in source control.
- Set `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, and
  `SUPABASE_SERVICE_ROLE_KEY` for avatar/certification uploads. Keep the service
  role key server-only and verify the private certification bucket.
- Obtain legal/business review of the draft Terms, Privacy, PAR-Q, and
  Cancellation/Refund pages, including retention, health data, payment, and
  support commitments. Replace draft wording only after approval.

## External dashboard actions

- In the [Resend Domains dashboard](https://resend.com/domains), add
  `yourtrainrr.com` or a sending subdomain. Copy its SPF/DKIM records into the
  authoritative DNS zone and wait for Verified status. Set `EMAIL_FROM` to an
  address on that verified domain. `SUPPORT_EMAIL` must be a real, monitored
  inbox; a sender address alone does not receive support mail.
- In the [Razorpay dashboard](https://dashboard.razorpay.com/), keep Test Mode
  selected. Under Accounts & Settings → Website and app settings → Webhooks,
  add the preview HTTPS URL ending `/api/webhooks/payment`, select
  `payment.captured`, `payment.failed`, and `refund.processed`, and set a new
  webhook secret separate from the API-key secret. Match that value in
  `RAZORPAY_WEBHOOK_SECRET`; test a signed delivery before promotion.
- In the [MSG91 dashboard](https://control.msg91.com/), register/approve the
  India DLT principal entity, sender ID, and OTP content template; in OTP →
  Templates, create the corresponding MSG91 template and copy its ID into
  `MSG91_OTP_TEMPLATE_ID`. A successful mocked test does not prove real Indian
  SMS delivery.
- In Supabase Storage, create the `trainrr-avatars` bucket and the **private**
  `trainrr-certifications` bucket as expected by the existing storage adapter;
  verify an
  admin can fetch a credential while another trainer cannot. Configure the
  service-role credential only in server-side deployment variables.

## Release sequence

1. Back up the production PostgreSQL database and record the current Vercel
   deployment ID. Review existing approved trainers before running the
   publication migration: it marks every approved trainer published. If any
   previously approved profile should remain private, change its status or
   explicitly unpublish it in a reviewed data migration first.
2. Deploy the code to a preview environment using a separate test database and
   test payment credentials. Apply the four new Prisma migrations with
   `npm run db:migrate`. Confirm all application tables have RLS enabled and
   that `anon`/`authenticated` grants are revoked where those roles exist.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
   `npm run test:e2e`. The E2E runner must point only at its own temporary
   database. Perform controlled browser tests for registration, email/phone
   verification, contact, directory filters, booking, webhook confirmation,
   dashboard, reschedule, cancellation, and refund state.
4. With owner approval, apply the reviewed migrations to production separately
   from the application deploy. Confirm public trainer discovery and API health,
   then promote the tested deployment. Monitor server logs, payment webhook
   failures, support deliveries, and booking conflicts.

## Rollback

- If application behavior regresses, use Vercel's previous deployment rollback
  immediately. Pause new checkout traffic if the booking/payment path is
  affected; reconcile captured payments against Razorpay before resuming.
- Database migrations add columns/tables and enable RLS without deleting
  customer records. Prefer a forward repair migration. Restore from the
  pre-release backup only after payment/booking reconciliation and operator
  review; restoring older data without reconciliation can lose real bookings.
- If public trainer visibility is incorrect, disable publication for affected
  rows through a reviewed admin/data operation. Do not publish test fixtures in
  production.
