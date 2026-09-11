ALTER TABLE trainer_profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE uploads ADD COLUMN public BOOLEAN NOT NULL DEFAULT false;
