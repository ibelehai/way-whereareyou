WITH public_profile AS (
  SELECT id FROM profiles WHERE slug = 'public'
)
-- Test access codes
INSERT INTO access_codes (code, is_active, usage_limit, expires_at, profile_id)
SELECT 'TEST2025', true, 100, now() + interval '30 days', id FROM public_profile
ON CONFLICT (code) DO NOTHING;

INSERT INTO access_codes (code, is_active, usage_limit, expires_at, profile_id)
SELECT 'DEMO123', true, 50, now() + interval '7 days', id FROM public_profile
ON CONFLICT (code) DO NOTHING;

INSERT INTO access_codes (code, is_active, usage_limit, expires_at, profile_id)
SELECT 'UNLIMITED', true, NULL, NULL, id FROM public_profile
ON CONFLICT (code) DO NOTHING;

-- Sample stories
INSERT INTO stories (country_code, country_name, author_country_code, author_country_name, author_name, author_age, story, access_code, created_at, profile_id)
SELECT 'US', 'United States', 'US', 'United States', 'Alex Chen', 28, 'Amazing experience in New York City! The energy here is incredible.', 'TEST2025', now() - interval '1 day', id FROM public_profile;

INSERT INTO stories (country_code, country_name, author_country_code, author_country_name, author_name, author_age, story, access_code, created_at, profile_id)
SELECT 'FR', 'France', 'FR', 'France', 'Marie Dubois', 35, 'Beautiful sunset at the Eiffel Tower. A moment I will never forget.', 'TEST2025', now() - interval '2 days', id FROM public_profile;

INSERT INTO stories (country_code, country_name, author_country_code, author_country_name, author_name, author_age, story, access_code, created_at, profile_id)
SELECT 'JP', 'Japan', 'JP', 'Japan', 'Yuki Tanaka', 42, 'Cherry blossoms in Tokyo were absolutely breathtaking. Spring magic!', 'TEST2025', now() - interval '5 days', id FROM public_profile;

INSERT INTO stories (country_code, country_name, author_country_code, author_country_name, author_name, author_age, story, access_code, created_at, profile_id)
SELECT 'UA', 'Ukraine', 'UA', 'Ukraine', 'Olena Koval', 31, 'Kyiv in autumn is stunning. The golden leaves are everywhere.', 'DEMO123', now() - interval '10 days', id FROM public_profile;

INSERT INTO stories (country_code, country_name, author_country_code, author_country_name, author_name, author_age, story, access_code, created_at, profile_id)
SELECT 'AU', 'Australia', 'AU', 'Australia', 'James Wong', 26, 'Sydney Opera House at night - architectural masterpiece!', 'DEMO123', now() - interval '15 days', id FROM public_profile;
