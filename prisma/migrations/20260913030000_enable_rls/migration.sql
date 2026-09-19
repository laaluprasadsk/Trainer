-- Trainrr authorizes database access in server-side Prisma routes. Enabling RLS
-- without browser-role policies denies Supabase anon/authenticated PostgREST
-- access while the direct database owner used by Prisma continues to operate.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trainer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "availability_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parq_waivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "phone_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  app_table TEXT;
  client_role TEXT;
BEGIN
  FOREACH app_table IN ARRAY ARRAY[
    'users', 'client_profiles', 'trainer_profiles', 'certifications',
    'availability_slots', 'bookings', 'payments', 'reviews', 'parq_waivers',
    'client_notes', 'sessions', 'auth_tokens', 'rate_limits', 'notifications',
    'admin_actions', 'uploads', 'message_deliveries', 'support_requests',
    'phone_challenges', 'platform_settings', '_prisma_migrations'
  ] LOOP
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', app_table, client_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
