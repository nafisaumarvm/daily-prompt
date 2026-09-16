-- Daily Prompt — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create type public.question_category as enum (
  'romantic',
  'funny',
  'reflection',
  'deep',
  'custom'
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  text varchar(120) not null check (char_length(text) between 1 and 120),
  category public.question_category not null default 'custom',
  is_active boolean not null default false,
  sort_order integer not null default 0,
  scheduled_for timestamptz,
  shown_at timestamptz,
  color_hex varchar(7) not null default '#FF6B8A',
  created_at timestamptz not null default now()
);

create table if not exists public.device_config (
  id uuid primary key default gen_random_uuid(),
  ip_or_url text not null default '',
  brightness integer not null default 128 check (brightness between 0 and 255),
  scroll_speed integer not null default 100,
  webhook_relay_url text,
  updated_at timestamptz not null default now()
);

-- Only one active question at a time
create unique index if not exists questions_one_active
  on public.questions (is_active)
  where is_active = true;

create index if not exists questions_sort_order_idx
  on public.questions (sort_order asc, created_at asc);

-- Seed a single device_config row
insert into public.device_config (ip_or_url, brightness, scroll_speed)
select '', 128, 100
where not exists (select 1 from public.device_config);

-- Row Level Security (open for couple-only private deploy; tighten with auth later)
alter table public.questions enable row level security;
alter table public.device_config enable row level security;

create policy "Allow all on questions"
  on public.questions for all
  using (true) with check (true);

create policy "Allow all on device_config"
  on public.device_config for all
  using (true) with check (true);

-- Optional: enable Realtime for live dashboard updates
-- alter publication supabase_realtime add table public.questions;
