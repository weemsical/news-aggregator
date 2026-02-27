ALTER TABLE propaganda_flags ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE propaganda_flags SET user_id = 'legacy' WHERE user_id IS NULL;
ALTER TABLE propaganda_flags ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_user_id ON propaganda_flags (user_id);
