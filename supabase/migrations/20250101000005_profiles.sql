-- Profiles table with unique slug (one map per profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link stories and access codes to profiles
ALTER TABLE stories ADD COLUMN profile_id UUID REFERENCES profiles(id);
ALTER TABLE access_codes ADD COLUMN profile_id UUID REFERENCES profiles(id);

-- Seed a default public profile and backfill existing rows
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE slug = 'public';

  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (slug) VALUES ('public') RETURNING id INTO v_profile_id;
  END IF;

  UPDATE stories SET profile_id = v_profile_id WHERE profile_id IS NULL;
  UPDATE access_codes SET profile_id = v_profile_id WHERE profile_id IS NULL;
END$$;

-- Enforce profile linkage
ALTER TABLE stories ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE access_codes ALTER COLUMN profile_id SET NOT NULL;

CREATE INDEX idx_stories_profile_id ON stories(profile_id);
CREATE INDEX idx_access_codes_profile_id ON access_codes(profile_id);
