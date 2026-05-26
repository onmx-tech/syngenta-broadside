-- ============================================================
-- Broadside Seedcare — Schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode (Run).
-- Idempotente: pode rodar de novo sem quebrar.
--
-- Convenção: TODAS as tabelas e o bucket usam prefixo `broadside_`
-- (`broadside-assets` no Storage) para isolar deste projeto Supabase
-- compartilhado com outras aplicações.
-- ============================================================

-- ---------- Tabelas ----------

-- Empresas reconhecidas (lista que cresce)
create table if not exists public.broadside_companies (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  logo_url   text,
  variant    text not null default 'seedcare' check (variant in ('seedcare', 'esg')),
  created_at timestamptz not null default now()
);

-- Conteúdo único do site (links dos cards, imagens dos blocos, selos, textos)
-- Linha única (id = 1). Espelha o AdminState (sem companies).
create table if not exists public.broadside_site_content (
  id             int primary key default 1,
  links          jsonb not null default '{}'::jsonb,
  download_links jsonb not null default '{"seedcare":"","esg":""}'::jsonb,
  block_images   jsonb not null default '{}'::jsonb,
  seals          jsonb not null default '{}'::jsonb,
  settings       jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now(),
  constraint broadside_site_content_singleton check (id = 1)
);

insert into public.broadside_site_content (id) values (1) on conflict (id) do nothing;

-- ---------- Row Level Security ----------

alter table public.broadside_companies    enable row level security;
alter table public.broadside_site_content enable row level security;

-- Leitura pública (site público usa a anon key)
drop policy if exists "broadside public read companies" on public.broadside_companies;
create policy "broadside public read companies" on public.broadside_companies
  for select using (true);

drop policy if exists "broadside public read content" on public.broadside_site_content;
create policy "broadside public read content" on public.broadside_site_content
  for select using (true);

-- Escrita apenas para usuários autenticados (admin via Supabase Auth)
drop policy if exists "broadside auth write companies" on public.broadside_companies;
create policy "broadside auth write companies" on public.broadside_companies
  for all to authenticated using (true) with check (true);

drop policy if exists "broadside auth write content" on public.broadside_site_content;
create policy "broadside auth write content" on public.broadside_site_content
  for all to authenticated using (true) with check (true);

-- ---------- Storage (imagens: logos, blocos, selos) ----------

insert into storage.buckets (id, name, public)
values ('broadside-assets', 'broadside-assets', true)
on conflict (id) do nothing;

drop policy if exists "broadside public read assets" on storage.objects;
create policy "broadside public read assets" on storage.objects
  for select using (bucket_id = 'broadside-assets');

drop policy if exists "broadside auth upload assets" on storage.objects;
create policy "broadside auth upload assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'broadside-assets');

drop policy if exists "broadside auth update assets" on storage.objects;
create policy "broadside auth update assets" on storage.objects
  for update to authenticated using (bucket_id = 'broadside-assets');

drop policy if exists "broadside auth delete assets" on storage.objects;
create policy "broadside auth delete assets" on storage.objects
  for delete to authenticated using (bucket_id = 'broadside-assets');
