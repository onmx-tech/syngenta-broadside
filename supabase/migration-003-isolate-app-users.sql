-- ============================================================
-- Migration 003 — Isolar admins/usuários do Broadside
--
-- Auth do Supabase é compartilhado por projeto (não dá pra isolar nativo).
-- Solução: cada user do Broadside carrega app_metadata.app = 'broadside'.
-- Policies de escrita passam a exigir essa marca, então users de outros
-- apps no mesmo projeto não conseguem mexer nas tabelas broadside_*.
--
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

-- 1) Promove o admin original pra não ficar bloqueado pelas novas policies
--    (adapte o email se mudar o user inicial).
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"app":"broadside"}'::jsonb
where email in ('thalyson@merinno.com')
  and (raw_app_meta_data ->> 'app') is distinct from 'broadside';

-- 2) Helper: bate se o JWT do caller tem app_metadata.app = 'broadside'
create or replace function public.broadside_is_admin() returns boolean
language sql stable security invoker
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'app') = 'broadside', false);
$$;

-- 3) Atualiza as policies de escrita pra exigir a marca
drop policy if exists "broadside auth write companies" on public.broadside_companies;
create policy "broadside auth write companies" on public.broadside_companies
  for all to authenticated
  using (public.broadside_is_admin())
  with check (public.broadside_is_admin());

drop policy if exists "broadside auth write content" on public.broadside_site_content;
create policy "broadside auth write content" on public.broadside_site_content
  for all to authenticated
  using (public.broadside_is_admin())
  with check (public.broadside_is_admin());

drop policy if exists "broadside auth read history" on public.broadside_site_content_history;
create policy "broadside auth read history" on public.broadside_site_content_history
  for select to authenticated
  using (public.broadside_is_admin());

drop policy if exists "broadside auth delete history" on public.broadside_site_content_history;
create policy "broadside auth delete history" on public.broadside_site_content_history
  for delete to authenticated
  using (public.broadside_is_admin());

-- 4) Storage: upload/update/delete no bucket também só pra admins do app
drop policy if exists "broadside auth upload assets" on storage.objects;
create policy "broadside auth upload assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'broadside-assets' and public.broadside_is_admin());

drop policy if exists "broadside auth update assets" on storage.objects;
create policy "broadside auth update assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'broadside-assets' and public.broadside_is_admin());

drop policy if exists "broadside auth delete assets" on storage.objects;
create policy "broadside auth delete assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'broadside-assets' and public.broadside_is_admin());
