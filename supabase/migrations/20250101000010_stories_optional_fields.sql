-- Make story text optional and author age optional
ALTER TABLE stories
  ALTER COLUMN author_age DROP NOT NULL,
  ALTER COLUMN story DROP NOT NULL;

-- Relax age and length checks (allow NULL)
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_author_age_check,
  DROP CONSTRAINT IF EXISTS stories_story_check;

-- Optional: keep length check when story present
ALTER TABLE stories
  ADD CONSTRAINT stories_story_check CHECK (story IS NULL OR char_length(story) <= 500);

-- Optional: keep age range when provided
ALTER TABLE stories
  ADD CONSTRAINT stories_author_age_check CHECK (author_age IS NULL OR (author_age BETWEEN 13 AND 100));

-- Update helper function to allow optional story/age
CREATE OR REPLACE FUNCTION submit_story_with_code(
  p_code TEXT,
  p_country_code TEXT,
  p_country_name TEXT,
  p_author_name TEXT,
  p_author_age INTEGER DEFAULT NULL,
  p_story TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_code_record access_codes;
  v_story_id UUID;
BEGIN
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid access code');
  END IF;

  IF NOT v_code_record.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Access code is disabled');
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Access code has expired');
  END IF;

  IF v_code_record.usage_limit IS NOT NULL AND v_code_record.usage_count >= v_code_record.usage_limit THEN
    RETURN json_build_object('success', false, 'error', 'Access code usage limit reached');
  END IF;

  INSERT INTO stories (country_code, country_name, author_name, author_age, story, photo_url, access_code)
  VALUES (p_country_code, p_country_name, p_author_name, p_author_age, p_story, p_photo_url, p_code)
  RETURNING id INTO v_story_id;

  UPDATE access_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code;

  RETURN json_build_object('success', true, 'story_id', v_story_id);
END;
$$ LANGUAGE plpgsql;
