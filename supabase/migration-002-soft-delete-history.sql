-- ============================================================
-- Migration 002 — Soft delete em empresas + histórico de site_content
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

-- 1) Soft delete em companies (restaurável por 30 dias)
alter table public.broadside_companies
  add column if not exists deleted_at timestamptz;

create index if not exists broadside_companies_deleted_idx
  on public.broadside_companies (deleted_at);

-- 2) Tabela de histórico do site_content
create table if not exists public.broadside_site_content_history (
  id          bigserial primary key,
  snapshot    jsonb not null,
  changed_at  timestamptz not null default now(),
  changed_by  text
);

create index if not exists broadside_site_content_history_changed_at_idx
  on public.broadside_site_content_history (changed_at desc);

-- 3) Função + trigger: snapshota o estado ANTERIOR a cada update
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

-- 4) RLS na tabela de histórico
alter table public.broadside_site_content_history enable row level security;

drop policy if exists "broadside auth read history" on public.broadside_site_content_history;
create policy "broadside auth read history" on public.broadside_site_content_history
  for select to authenticated using (true);

drop policy if exists "broadside auth delete history" on public.broadside_site_content_history;
create policy "broadside auth delete history" on public.broadside_site_content_history
  for delete to authenticated using (true);
