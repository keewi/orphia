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
create policy "Users can read own reviews" on reviews for select using (auth.uid() = user_id);
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
