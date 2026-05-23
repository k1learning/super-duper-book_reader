-- ───────────────────────────────────────────────────────────────────────────
-- Bookos-Library schema. Safe to re-run: every statement is idempotent.
-- Apply via Supabase → SQL Editor → New query → paste → Run.
-- ───────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  file_url text,
  total_pages integer default 0,
  current_page integer default 1,
  status text default 'To Read',
  genres text[],
  rating integer default 0,
  review text,
  format text default 'Digital',
  saved boolean default false,
  added_at timestamptz default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references public.books(id) on delete cascade not null,
  page integer,
  content text,
  timestamp timestamptz default now()
);

create table if not exists public.canvas_notes (
  book_id uuid primary key references public.books(id) on delete cascade,
  text text,
  strokes jsonb,
  updated_at timestamptz default now()
);

-- Helpful index: most reads filter notes by book_id.
create index if not exists notes_book_id_idx on public.notes(book_id);

-- ── Row-level security (open access for personal/MVP use) ─────────────────

alter table public.books        enable row level security;
alter table public.notes        enable row level security;
alter table public.canvas_notes enable row level security;

drop policy if exists "Public read books"   on public.books;
drop policy if exists "Public write books"  on public.books;
drop policy if exists "Public read notes"   on public.notes;
drop policy if exists "Public write notes"  on public.notes;
drop policy if exists "Public read cnotes"  on public.canvas_notes;
drop policy if exists "Public write cnotes" on public.canvas_notes;

create policy "Public read books"   on public.books        for select using (true);
create policy "Public write books"  on public.books        for all    using (true) with check (true);
create policy "Public read notes"   on public.notes        for select using (true);
create policy "Public write notes"  on public.notes        for all    using (true) with check (true);
create policy "Public read cnotes"  on public.canvas_notes for select using (true);
create policy "Public write cnotes" on public.canvas_notes for all    using (true) with check (true);

-- ── Storage buckets ───────────────────────────────────────────────────────
-- The app will also try to auto-create these if SUPABASE_SERVICE_ROLE_KEY is
-- set, but doing it here guarantees they exist regardless.

insert into storage.buckets (id, name, public)
values ('book-files', 'book-files', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

-- ── Storage policies (must include WITH CHECK for INSERT to work) ─────────

drop policy if exists "Public read book-files"   on storage.objects;
drop policy if exists "Public write book-files"  on storage.objects;
drop policy if exists "Public read book-covers"  on storage.objects;
drop policy if exists "Public write book-covers" on storage.objects;

create policy "Public read book-files"
  on storage.objects for select
  using (bucket_id = 'book-files');

create policy "Public write book-files"
  on storage.objects for all
  using       (bucket_id = 'book-files')
  with check  (bucket_id = 'book-files');

create policy "Public read book-covers"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "Public write book-covers"
  on storage.objects for all
  using       (bucket_id = 'book-covers')
  with check  (bucket_id = 'book-covers');
