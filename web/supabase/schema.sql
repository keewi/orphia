-- ============================================================
-- Orphia — Canonical Schema
-- ============================================================

-- Enum for musical status
CREATE TYPE musical_status AS ENUM ('want_to_see', 'seen', 'skipped');

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Musicals catalog (public, read-only for users)
-- ============================================================
CREATE TABLE musicals (
  id              text        PRIMARY KEY,
  title           text        NOT NULL,
  year            integer     NOT NULL,
  description     text        NOT NULL,
  image_url       text,
  popularity_rank integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE musicals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Musicals are publicly readable" ON musicals FOR SELECT USING (true);

-- ============================================================
-- User musical status (want_to_see / seen / skipped)
-- ============================================================
CREATE TABLE user_musical_status (
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
-- User reviews (multiple per musical allowed)
-- ============================================================
CREATE TABLE user_reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  musical_id  text        NOT NULL REFERENCES musicals(id) ON DELETE CASCADE,
  rating_int  integer     NOT NULL CHECK (rating_int >= 1 AND rating_int <= 5),
  review_text text,
  watch_date  date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- No unique constraint on (user_id, musical_id) — multiple reviews per musical allowed.

CREATE INDEX idx_user_reviews_user_musical_created
  ON user_reviews (user_id, musical_id, created_at DESC);
CREATE INDEX idx_user_reviews_user_id
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
-- View: latest review per (user_id, musical_id)
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
-- User profiles with unique handles
-- ============================================================
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle       text UNIQUE NOT NULL CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- Follow relationships between users
-- ============================================================
CREATE TABLE follows (
  follower_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, following_user_id),
  CHECK (follower_user_id != following_user_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are publicly readable" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_user_id);
