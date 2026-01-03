-- Add link_url to store generated share links per access code
ALTER TABLE access_codes
  ADD COLUMN IF NOT EXISTS link_url TEXT;
