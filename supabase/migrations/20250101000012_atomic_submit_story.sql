-- Atomic story submission scoped to profile and access code
CREATE OR REPLACE FUNCTION submit_story_atomic(
  p_slug TEXT,
  p_code TEXT,
  p_country_code TEXT,
  p_country_name TEXT,
  p_author_country_code TEXT,
  p_author_country_name TEXT,
  p_author_name TEXT,
  p_author_age INTEGER DEFAULT NULL,
  p_story TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_code access_codes%ROWTYPE;
  v_story_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE slug = p_slug
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  SELECT * INTO v_code
  FROM access_codes
  WHERE code = p_code
    AND profile_id = v_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid access code');
  END IF;

  IF NOT v_code.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Access code is disabled');
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Access code has expired');
  END IF;

  IF v_code.usage_limit IS NOT NULL AND v_code.usage_count >= v_code.usage_limit THEN
    RETURN json_build_object('success', false, 'error', 'Access code usage limit reached');
  END IF;

  INSERT INTO stories (
    country_code,
    country_name,
    author_country_code,
    author_country_name,
    author_name,
    author_age,
    story,
    photo_url,
    access_code,
    profile_id
  )
  VALUES (
    p_country_code,
    p_country_name,
    p_author_country_code,
    p_author_country_name,
    p_author_name,
    p_author_age,
    p_story,
    p_photo_url,
    p_code,
    v_profile_id
  )
  RETURNING id INTO v_story_id;

  UPDATE access_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code
    AND profile_id = v_profile_id;

  RETURN json_build_object('success', true, 'story_id', v_story_id);
END;
$$ LANGUAGE plpgsql;
