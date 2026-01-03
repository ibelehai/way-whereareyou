-- Enable RLS on tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Stories: public read, RPC-only insert
CREATE POLICY "Public read stories"
ON stories FOR SELECT
TO public
USING (true);

-- Access codes: no direct access (RPC only)
CREATE POLICY "No direct access to codes"
ON access_codes FOR ALL
TO public
USING (false);
