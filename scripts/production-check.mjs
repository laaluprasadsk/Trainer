import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const required = ['DATABASE_URL','DIRECT_URL','APP_URL','CRON_SECRET','STORAGE_PROVIDER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','RESEND_API_KEY','EMAIL_FROM','MSG91_AUTH_KEY','MSG91_OTP_TEMPLATE_ID','MSG91_SENDER_ID','MSG91_BOOKING_CONFIRMED_FLOW_ID','MSG91_BOOKING_CANCELLED_FLOW_ID','MSG91_BOOKING_REMINDER_FLOW_ID'];
let failures = 0;
for (const key of required) if (!process.env[key]) { console.log(`MISSING ${key}`); failures++; }
if (process.env.APP_URL && !/^https:\/\//.test(process.env.APP_URL)) { console.log('APP_URL must use HTTPS.'); failures++; }
if (process.env.STORAGE_PROVIDER && process.env.STORAGE_PROVIDER !== 'supabase') { console.log('Production storage must be supabase.'); failures++; }
if (process.env.CRON_SECRET && process.env.CRON_SECRET.length < 32) { console.log('CRON_SECRET must have at least 32 characters.'); failures++; }
if (process.env.NODE_OPTIONS?.includes('provider-stub')) { console.log('Test payment preload is forbidden in production.'); failures++; }
const packageJson = JSON.parse(readFileSync('package.json','utf8'));
console.log(`Runtime target: ${packageJson.engines?.node}; payment mode: ${process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'LIVE — requires completed acceptance tests' : 'TEST/unconfigured'}`);
console.log(failures ? `${failures} configuration blockers. No credentials printed.` : 'Configuration present. This is not proof of provider activation or delivery.');
process.exitCode = failures ? 1 : 0;
