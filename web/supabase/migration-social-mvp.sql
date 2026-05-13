-- Social MVP v1: Handles, Public Profiles, Follow
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. User profiles with unique handles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Profiles are publicly readable" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Follow relationships between users
create table if not exists follows (
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

-- 3. Make reviews publicly readable (needed for public profile gallery)
-- Drop the old restrictive policy and replace with public read
drop policy if exists "Users can read own reviews" on reviews;
create policy "Reviews are publicly readable" on reviews for select using (true);
