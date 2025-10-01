create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  age_range text check (age_range in ('6-8','9-12','12-24','1-2','3-4','5+')),
  ingredients jsonb not null,
  steps text[] not null,
  allergens text[],
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.fridge_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_path text not null,
  detected_items jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table recipes enable row level security;
alter table fridge_photos enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Users can insert own profile" on profiles for insert with check (id = auth.uid());
create policy "Users can update own profile" on profiles for update using (id = auth.uid());

-- Recipes policies  
create policy "Users can view own recipes" on recipes for select using (user_id = auth.uid());
create policy "Users can insert own recipes" on recipes for insert with check (user_id = auth.uid());
create policy "Users can update own recipes" on recipes for update using (user_id = auth.uid());
create policy "Users can delete own recipes" on recipes for delete using (user_id = auth.uid());

-- Fridge photos policies
create policy "Users can view own photos" on fridge_photos for select using (user_id = auth.uid());
create policy "Users can insert own photos" on fridge_photos for insert with check (user_id = auth.uid());
create policy "Users can delete own photos" on fridge_photos for delete using (user_id = auth.uid());
