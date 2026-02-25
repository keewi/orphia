-- Musicals catalog (public, read-only)
create table musicals (
  id text primary key,
  title text not null,
  year integer not null,
  description text not null,
  image_url text,
  created_at timestamptz default now()
);

alter table musicals enable row level security;
create policy "Musicals are publicly readable" on musicals for select using (true);

-- Reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  musical_id text not null,
  musical_title text not null,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  review_text text not null,
  date_seen date,
  created_at timestamptz default now()
);

alter table reviews enable row level security;
create policy "Reviews are publicly readable" on reviews for select using (true);
create policy "Users can insert own reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on reviews for update using (auth.uid() = user_id);

-- Note: seen_entries table was removed — reviews table now serves as the single source of truth.
-- If seen_entries still exists in your Supabase instance, it can be safely dropped.

-- Saved-for-later table
create table saved_musicals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  musical_id text not null,
  created_at timestamptz default now(),
  unique(user_id, musical_id)
);

alter table saved_musicals enable row level security;
create policy "Users can read own saved" on saved_musicals for select using (auth.uid() = user_id);
create policy "Users can insert own saved" on saved_musicals for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved" on saved_musicals for delete using (auth.uid() = user_id);
create policy "Saved musicals are publicly readable" on saved_musicals for select using (true);

-- User profiles with unique handles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Profiles are publicly readable" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Follow relationships between users
create table follows (
  follower_user_id uuid references auth.users(id) on delete cascade not null,
  following_user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_user_id, following_user_id),
  check (follower_user_id != following_user_id)
);

alter table follows enable row level security;
create policy "Follows are publicly readable" on follows for select using (true);
create policy "Users can insert own follows" on follows for insert with check (auth.uid() = follower_user_id);
create policy "Users can delete own follows" on follows for delete using (auth.uid() = follower_user_id);
