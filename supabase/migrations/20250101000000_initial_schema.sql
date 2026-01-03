-- Stories table (exact spec)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  author_name TEXT NOT NULL CHECK (char_length(author_name) <= 40),
  author_age INTEGER NOT NULL CHECK (author_age BETWEEN 13 AND 100),
  story TEXT NOT NULL CHECK (char_length(story) <= 500),
  photo_url TEXT,
  access_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stories_country_code ON stories(country_code);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_access_code ON stories(access_code);

-- Access codes table (exact spec)
CREATE TABLE access_codes (
  code TEXT PRIMARY KEY,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
