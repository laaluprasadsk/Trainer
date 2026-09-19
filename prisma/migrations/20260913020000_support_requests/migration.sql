CREATE TABLE "support_requests" (
  "id" TEXT NOT NULL,
  "request_key" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_requests_request_key_key"
ON "support_requests" ("request_key");

CREATE INDEX "support_requests_status_created_at_idx"
ON "support_requests" ("status", "created_at");
