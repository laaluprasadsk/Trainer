ALTER TABLE "trainer_profiles"
  ADD COLUMN "accepted_session_modes" "SessionLocationType"[] NOT NULL DEFAULT ARRAY[]::"SessionLocationType"[];

ALTER TABLE "certifications"
  ADD COLUMN "admin_review_note" TEXT;

ALTER TABLE "bookings"
  ADD COLUMN "proposed_date" DATE,
  ADD COLUMN "proposed_start_time" TEXT,
  ADD COLUMN "proposed_end_time" TEXT,
  ADD COLUMN "trainer_response_note" TEXT;

CREATE TABLE "client_notes" (
  "id" TEXT NOT NULL,
  "trainer_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "target_weights" TEXT,
  "injury_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_notes_trainer_id_client_id_key" ON "client_notes"("trainer_id", "client_id");
CREATE INDEX "client_notes_trainer_id_updated_at_idx" ON "client_notes"("trainer_id", "updated_at");

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "client_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
