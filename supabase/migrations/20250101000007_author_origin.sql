-- Track where the author is from (origin) in addition to where the story happened
ALTER TABLE stories ADD COLUMN author_country_code TEXT;
ALTER TABLE stories ADD COLUMN author_country_name TEXT;

-- Backfill existing stories with story location values
UPDATE stories
SET author_country_code = COALESCE(author_country_code, country_code),
    author_country_name = COALESCE(author_country_name, country_name)
WHERE author_country_code IS NULL OR author_country_name IS NULL;

-- Enforce presence
ALTER TABLE stories ALTER COLUMN author_country_code SET NOT NULL;
ALTER TABLE stories ALTER COLUMN author_country_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_author_country ON stories(author_country_code);
