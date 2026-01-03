-- Ensure baseline access codes exist (idempotent)
INSERT INTO access_codes (code, is_active, usage_limit, usage_count, expires_at)
VALUES
  ('TEST2025', true, 100, 0, now() + interval '30 days'),
  ('DEMO123', true, 50, 0, now() + interval '7 days'),
  ('UNLIMITED', true, NULL, 0, NULL)
ON CONFLICT (code) DO NOTHING;
