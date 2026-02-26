-- Fix: Add missing DELETE policy on legacy `reviews` table.
--
-- The original schema only had INSERT, UPDATE, and SELECT policies.
-- Without a DELETE policy, RLS silently blocks deletion (returns 0 rows,
-- no error), which breaks the Explore carousel's undo feature.
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).

CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);
