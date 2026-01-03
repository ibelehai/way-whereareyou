-- Allow authenticated profile owners to delete their own stories
CREATE POLICY "Owners can delete their stories"
ON stories FOR DELETE
TO authenticated
USING (
  profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
