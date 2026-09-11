# Trainrr launch checklist

Recommended initial stack: domain + Vercel Pro + Supabase PostgreSQL + Razorpay + Resend. Reuse existing accounts and database services where appropriate rather than buying duplicate subscriptions. This is a launch plan, not a claim that live deployment or provider activation has been completed.

## Accounts and costs

Prices checked September 9, 2026; USD subscription figures exclude taxes, usage overages, additional seats/projects and foreign-exchange charges.

| Item | Recommended starting point | What to obtain |
|---|---|---|
| Domain | Register an available Trainrr domain with a registrar of your choice; check renewal pricing and name availability | Ownership and DNS access |
| Application hosting | Vercel Pro, starting at $20/month; Hobby is for non-commercial use | Project connected to your Git repository, production domain and environment variables |
| Database | Supabase Pro, starting at $25/month with baseline compute credits and daily backups | PostgreSQL pooled application URL and direct migration URL; verify btree_gist availability |
| Payments | Razorpay merchant account; standard pricing advertised as 2% + GST, subject to payment method and agreement | Merchant activation, approved business/settlement model, test/live API keys and webhook secret |
| Password-reset email | Resend free tier: 3,000 emails/month, maximum 100/day; upgrade when needed | Verified sending domain, API key and sender address |
| Customer support inbox | An inbox you regularly monitor; Resend sends transactional mail and does not by itself provide your support mailbox | Support address and named operator |

Baseline hosting/database subscriptions total approximately $45/month, before domain, tax, usage, mailbox, payment fees or additional staging resources. No separate Redis, SMS, maps, AI API, or second backend host is required by the current application. HTTPS is provided by the recommended hosting platform.

Sources: [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing), [Razorpay](https://razorpay.com/pricing/), [Resend](https://resend.com/pricing).

## Payment model: settle this before accepting customer money

- Tell Razorpay that Trainrr is a marketplace for independent personal trainers, collecting customer payments and paying trainers after sessions. Complete the onboarding/KYC requested for your business type and bank account: [account setup](https://razorpay.com/docs/payments/set-up/?preferred-country=IN).
- Ask whether Razorpay Route/Linked Accounts is appropriate and available for your business. Route supports splitting payments to recipients: [Linked Accounts documentation](https://razorpay.com/docs/payments/route/linked-account/?preferred-country=IN). Confirm approval, requirements, settlement timing, refunds and pricing directly with Razorpay.
- Current code integrates customer checkout and verified payment status, not Route transfers or automated trainer payouts. A Route subscription alone will not add that missing code. Either implement provider-approved marketplace transfers or agree a documented provider-approved operational settlement process before launch.
- The default 15% platform commission is admin-configurable and captured on each booking. Decide who absorbs gateway fees, taxes, refunds and disputes. Add reconciliation/accounting entries for those deductions; the app does not currently calculate them.
- Have your accountant/legal adviser review invoicing, tax treatment, trainer agreements, privacy, cancellation and refund terms for your actual business. Do not advertise regulated escrow or insurance unless you actually provide it.

## Current completed infrastructure work

- Supabase PostgreSQL pooler and migration connections were tested.
- Six Prisma migrations, including booking concurrency constraints and foreign-key indexes, were applied to the empty Trainrr database.
- `trainrr-avatars` (public JPEG, 2 MB) and `trainrr-certifications` (private PDF/PNG/JPEG, 2 MB) storage buckets were provisioned.
- Vercel configuration and GitHub build checks are present; account/project linkage and deployment environment configuration remain.

## Configure the application

Required production secrets/settings:

- DATABASE_URL: application PostgreSQL URL, with pooling suitable for the hosting environment.
- DIRECT_URL: direct migration connection.
- APP_URL: exact live origin, without trailing slash, such as https://your-registered-domain.example.
- RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET: test keys in staging, approved live keys only in production.
- RAZORPAY_WEBHOOK_SECRET: distinct signing secret for the configured payment webhook.
- RESEND_API_KEY and EMAIL_FROM: password reset email; verify the domain's SPF/DKIM records in Resend first.
- CRON_SECRET: generated random bearer secret for reminders/cleanup.

Store secrets in the hosting dashboard, never in Git or browser code. The one-time ADMIN_EMAIL/ADMIN_PHONE/ADMIN_PASSWORD variables are for administrator provisioning, not permanent public configuration.

## Launch sequence

1. Choose an available domain and secure DNS/account access with MFA.
2. Create a staging deployment and isolated staging database. Connect the repository and set test-mode environment variables.
3. Keep the existing migrated Supabase database as the selected Trainrr environment. Do not apply the reconstructed baseline to another populated database without reconciling its migration ledger.
4. Build with npm run build. Create the admin using npm run db:admin with private environment variables.
5. Configure Razorpay webhooks at /api/webhooks/payment for payment.captured, payment.failed and refund.processed. Confirm capture settings and exercise real Razorpay test-mode checkout/refunds; automated local tests use a provider stub.
6. Verify password-reset and booking email delivery from the verified sender domain. Complete MSG91/DLT setup, then test OTP and each approved booking SMS template.
7. Schedule the authenticated `/api/jobs/reminders` route. It accepts GET and POST and uses the Vercel Cron authorization convention.
8. Configure backups and test restoration, error/uptime monitoring, request-size limits, rate limits and spend alerts. Set the application/database regions close to your users.
9. Review uploaded trainer credentials and approve a small initial group. Check their prices, service areas, availability and support procedures.
10. Repeat the manual checklist on the deployed staging site, including double-booking, session expiry, payment failure and cancellation.
11. After provider approval and settlement workflow readiness, configure production keys/webhooks and run a controlled real payment/refund test. Launch to a small pilot group before advertising broadly.

## Work still needed for broader production operation

- Automated trainer payout integration and payout reconciliation; refunds are initiated in the provider dashboard today.
- Gateway-fee/tax/dispute accounting and business policy review.
- Add malware scanning as upload volume or compliance requirements grow.
- Pagination beyond current directory/table limits, broader monitoring, email verification and optional booking emails/SMS.

See README.md for local commands and ENGINEERING-REPORT.md for implementation details and test coverage.
