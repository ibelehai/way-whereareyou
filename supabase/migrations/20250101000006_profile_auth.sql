-- Add name and user mapping to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Backfill default public profile name
UPDATE profiles SET name = COALESCE(name, 'Public') WHERE slug = 'public';

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
