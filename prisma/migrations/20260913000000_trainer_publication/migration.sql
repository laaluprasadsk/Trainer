ALTER TABLE "trainer_profiles"
ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;

UPDATE "trainer_profiles"
SET "is_published" = true
WHERE "verification_status" = 'APPROVED';

CREATE INDEX "trainer_profiles_public_discovery_idx"
ON "trainer_profiles" ("is_published", "verification_status", "rating_avg" DESC);
