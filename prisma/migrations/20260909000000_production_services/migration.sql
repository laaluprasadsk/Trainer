ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP(3), ADD COLUMN phone_verified_at TIMESTAMP(3);
ALTER TABLE uploads ALTER COLUMN data DROP NOT NULL;
ALTER TABLE uploads ADD COLUMN storage_path TEXT;
ALTER TABLE uploads ADD CONSTRAINT upload_content_present CHECK (data IS NOT NULL OR storage_path IS NOT NULL);
ALTER TABLE notifications ADD COLUMN sms_template TEXT, ADD COLUMN sms_variables JSONB;
CREATE TABLE message_deliveries (
 id TEXT PRIMARY KEY, notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('EMAIL','SMS')),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','SENT','FAILED','UNKNOWN')),
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_until TIMESTAMP(3), lease_token TEXT, provider_id TEXT, last_error TEXT,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) NOT NULL,
 UNIQUE(notification_id, channel)
);
CREATE INDEX message_deliveries_due_idx ON message_deliveries(status, next_attempt_at);
CREATE TABLE phone_challenges (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, phone TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, expires_at TIMESTAMP(3) NOT NULL, resend_at TIMESTAMP(3) NOT NULL
);
CREATE TABLE platform_settings (
 id TEXT PRIMARY KEY DEFAULT 'platform', commission_bps INTEGER NOT NULL DEFAULT 1500 CHECK(commission_bps BETWEEN 0 AND 10000), updated_at TIMESTAMP(3) NOT NULL
);

-- Defense in depth: browser Supabase keys must never read application sessions,
-- password hashes, certification metadata or private marketplace records.
DO $$ DECLARE table_name text; role_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','client_profiles','trainer_profiles','certifications','availability_slots','bookings','payments','reviews','parq_waivers','client_notes','sessions','auth_tokens','rate_limits','notifications','admin_actions','uploads','message_deliveries','phone_challenges','platform_settings'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
