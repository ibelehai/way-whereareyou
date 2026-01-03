-- Add country to profiles if not present (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
