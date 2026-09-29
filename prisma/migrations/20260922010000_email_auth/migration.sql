ALTER TABLE "auth_tokens"
  ADD COLUMN "payload" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "resend_at" TIMESTAMP(3),
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "auth_tokens_user_id_idx";
CREATE INDEX "auth_tokens_user_id_kind_idx" ON "auth_tokens"("user_id", "kind");
CREATE INDEX "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");

CREATE TABLE "email_sends" (
  "id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "user_id" TEXT,
  "recipient" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "provider_email_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_sends_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "email_sends_idempotency_key_key" ON "email_sends"("idempotency_key");
CREATE UNIQUE INDEX "email_sends_provider_email_id_key" ON "email_sends"("provider_email_id");
CREATE INDEX "email_sends_user_id_created_at_idx" ON "email_sends"("user_id", "created_at");
CREATE INDEX "email_sends_status_created_at_idx" ON "email_sends"("status", "created_at");

CREATE TABLE "email_events" (
  "id" TEXT NOT NULL,
  "provider_event_id" TEXT NOT NULL,
  "provider_email_id" TEXT NOT NULL,
  "email_send_id" TEXT,
  "type" TEXT NOT NULL,
  "provider_created_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_events_email_send_id_fkey" FOREIGN KEY ("email_send_id") REFERENCES "email_sends"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "email_events_provider_event_id_key" ON "email_events"("provider_event_id");
CREATE INDEX "email_events_provider_email_id_provider_created_at_idx" ON "email_events"("provider_email_id", "provider_created_at");

ALTER TABLE "email_sends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_events" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE client_role TEXT;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'email_sends', client_role);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'email_events', client_role);
    END IF;
  END LOOP;
END $$;
