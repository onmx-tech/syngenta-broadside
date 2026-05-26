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

-- Soft delete em companies (restaura por 30 dias).
alter table public.broadside_companies
  add column if not exists deleted_at timestamptz;

create index if not exists broadside_companies_deleted_idx
  on public.broadside_companies (deleted_at);

-- Histórico de site_content (snapshot a cada update).
create table if not exists public.broadside_site_content_history (
  id          bigserial primary key,
  snapshot    jsonb not null,
  changed_at  timestamptz not null default now(),
  changed_by  text
);

create index if not exists broadside_site_content_history_changed_at_idx
  on public.broadside_site_content_history (changed_at desc);

-- Trigger: ao UPDATE em site_content, snapshota o estado ANTERIOR.
create or replace function public.broadside_snapshot_site_content() returns trigger
language plpgsql security definer
as $$
declare
  email_v text;
begin
  begin
    email_v := coalesce(
      (auth.jwt() ->> 'email'),
      (current_setting('request.jwt.claim.email', true))
    );
  exception when others then
    email_v := null;
  end;
  insert into public.broadside_site_content_history (snapshot, changed_by)
  values (
    jsonb_build_object(
      'links', OLD.links,
      'download_links', OLD.download_links,
      'block_images', OLD.block_images,
      'seals', OLD.seals,
      'settings', OLD.settings,
      'updated_at', OLD.updated_at
    ),
    email_v
  );
  return NEW;
end;
$$;

drop trigger if exists broadside_site_content_snapshot on public.broadside_site_content;
create trigger broadside_site_content_snapshot
  before update on public.broadside_site_content
  for each row execute function public.broadside_snapshot_site_content();

-- ---------- Row Level Security ----------

alter table public.broadside_companies            enable row level security;
alter table public.broadside_site_content         enable row level security;
alter table public.broadside_site_content_history enable row level security;

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

-- Histórico: só authenticated lê/escreve (escrita normal vem do trigger; admin pode limpar manualmente)
drop policy if exists "broadside auth read history" on public.broadside_site_content_history;
create policy "broadside auth read history" on public.broadside_site_content_history
  for select to authenticated using (true);

drop policy if exists "broadside auth delete history" on public.broadside_site_content_history;
create policy "broadside auth delete history" on public.broadside_site_content_history
  for delete to authenticated using (true);

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
