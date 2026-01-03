-- Allow profile owners to manage their access codes
CREATE POLICY "Access codes select for owner"
ON access_codes FOR SELECT
TO authenticated
USING (
  profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Access codes insert for owner"
ON access_codes FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
