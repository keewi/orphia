-- Migration: Multi-Review Support + User Musical Status
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- IMPORTANT: Back up your database before running this migration.

-- ============================================================
-- 0. Create enum for musical status
-- ============================================================
DO $$ BEGIN
  CREATE TYPE musical_status AS ENUM ('want_to_see', 'seen', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 1. Add popularity_rank to musicals
-- ============================================================
ALTER TABLE musicals ADD COLUMN IF NOT EXISTS popularity_rank integer;

-- ============================================================
-- 2. Create updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Create user_musical_status table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_musical_status (
  user_id    uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  musical_id text           NOT NULL REFERENCES musicals(id) ON DELETE CASCADE,
  status     musical_status NOT NULL,
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, musical_id)
);

ALTER TABLE user_musical_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User musical status is publicly readable"
  ON user_musical_status FOR SELECT USING (true);
CREATE POLICY "Users can insert own musical status"
  ON user_musical_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own musical status"
  ON user_musical_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own musical status"
  ON user_musical_status FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER user_musical_status_updated_at
  BEFORE UPDATE ON user_musical_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. Create user_reviews table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  musical_id  text        NOT NULL REFERENCES musicals(id) ON DELETE CASCADE,
  rating_int  integer     NOT NULL CHECK (rating_int >= 1 AND rating_int <= 5),
  review_text text,
  watch_date  date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- No unique constraint on (user_id, musical_id) — multiple reviews allowed.

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_musical_created
  ON user_reviews (user_id, musical_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id
  ON user_reviews (user_id, created_at DESC);

ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reviews are publicly readable"
  ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews"
  ON user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews"
  ON user_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews"
  ON user_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER user_reviews_updated_at
  BEFORE UPDATE ON user_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. Create view: user_latest_reviews
--    Returns only the most recent review per (user_id, musical_id)
-- ============================================================
CREATE OR REPLACE VIEW user_latest_reviews AS
SELECT DISTINCT ON (user_id, musical_id)
  id,
  user_id,
  musical_id,
  rating_int,
  review_text,
  watch_date,
  created_at,
  updated_at
FROM user_reviews
ORDER BY user_id, musical_id, created_at DESC;

-- ============================================================
-- 6. Migrate data from old reviews → user_reviews
--    - Rounds half-star ratings UP (e.g. 2.5 → 3, 4.5 → 5)
--    - Converts empty review_text to NULL
--    - Renames date_seen → watch_date
--    - Filters to valid musical_ids to avoid FK violations
-- ============================================================
INSERT INTO user_reviews (id, user_id, musical_id, rating_int, review_text, watch_date, created_at, updated_at)
SELECT
  id,
  user_id,
  musical_id,
  LEAST(5, GREATEST(1, FLOOR(rating + 0.5)::integer)),
  NULLIF(review_text, ''),
  date_seen,
  created_at,
  created_at  -- no updated_at existed; use created_at
FROM reviews
WHERE musical_id IN (SELECT id FROM musicals)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Migrate saved_musicals → user_musical_status (want_to_see)
-- ============================================================
INSERT INTO user_musical_status (user_id, musical_id, status, created_at, updated_at)
SELECT
  user_id,
  musical_id,
  'want_to_see'::musical_status,
  created_at,
  created_at
FROM saved_musicals
WHERE musical_id IN (SELECT id FROM musicals)
ON CONFLICT (user_id, musical_id) DO NOTHING;

-- ============================================================
-- 8. Auto-set status = 'seen' for every user+musical with reviews
--    Upgrades want_to_see → seen if a review exists
-- ============================================================
INSERT INTO user_musical_status (user_id, musical_id, status, created_at, updated_at)
SELECT DISTINCT
  user_id,
  musical_id,
  'seen'::musical_status,
  MIN(created_at),
  MIN(created_at)
FROM user_reviews
GROUP BY user_id, musical_id
ON CONFLICT (user_id, musical_id)
  DO UPDATE SET status = 'seen', updated_at = now()
  WHERE user_musical_status.status = 'want_to_see';

-- ============================================================
-- 9. Rename old tables (keep as backup, do NOT drop)
-- ============================================================
ALTER TABLE IF EXISTS reviews RENAME TO reviews_legacy;
ALTER TABLE IF EXISTS saved_musicals RENAME TO saved_musicals_legacy;

-- ============================================================
-- Done. Old tables preserved as reviews_legacy and saved_musicals_legacy.
-- After verifying, you can drop them:
--   DROP TABLE IF EXISTS reviews_legacy;
--   DROP TABLE IF EXISTS saved_musicals_legacy;
-- ============================================================
