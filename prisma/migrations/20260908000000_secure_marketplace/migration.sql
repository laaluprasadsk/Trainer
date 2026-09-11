-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUND_PENDING';

-- DropIndex
DROP INDEX "bookings_slot_id_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Reject malformed windows and enforce overlap safety even for direct SQL writes.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE availability_slots ADD CONSTRAINT valid_slot_window CHECK (
 start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND
 end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND start_time < end_time
);
ALTER TABLE availability_slots ADD CONSTRAINT no_overlapping_trainer_slots EXCLUDE USING gist (
 trainer_id WITH =, slot_date WITH =,
 int4range(substring(start_time,1,2)::int * 60 + substring(start_time,4,2)::int,
 substring(end_time,1,2)::int * 60 + substring(end_time,4,2)::int, '[)') WITH &&
);
CREATE UNIQUE INDEX one_active_booking_per_slot ON bookings(slot_id)
 WHERE status IN ('PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','COMPLETED');
CREATE INDEX bookings_client_created_idx ON bookings(client_id, created_at);
CREATE INDEX bookings_trainer_created_idx ON bookings(trainer_id, created_at);
ALTER TABLE reviews ADD CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE bookings ADD CONSTRAINT booking_money CHECK (total_amount > 0 AND platform_fee >= 0 AND trainer_payout >= 0 AND platform_fee + trainer_payout = total_amount);
ALTER TABLE payments ADD CONSTRAINT payment_money CHECK (gross_amount > 0 AND platform_fee >= 0 AND trainer_amount >= 0 AND platform_fee + trainer_amount = gross_amount);
