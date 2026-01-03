-- Add primary color per profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#45803b';

-- Allow profile owners to update their profile fields
CREATE POLICY "Profile owner update"
ON profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
