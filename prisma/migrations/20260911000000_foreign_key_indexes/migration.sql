-- Keep cascading deletes and relationship lookups efficient as production data grows.
CREATE INDEX "certifications_trainer_id_idx" ON "certifications"("trainer_id");
CREATE INDEX "reviews_client_id_idx" ON "reviews"("client_id");
CREATE INDEX "reviews_trainer_id_idx" ON "reviews"("trainer_id");
CREATE INDEX "client_notes_client_id_idx" ON "client_notes"("client_id");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens"("user_id");
CREATE INDEX "uploads_user_id_idx" ON "uploads"("user_id");
