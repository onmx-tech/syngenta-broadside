import { createClient, type Session } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(url && anonKey);

if (!hasSupabase && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes — usando dados estáticos de src/data."
  );
}

export const supabase = createClient(url ?? "http://localhost", anonKey ?? "anon", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const ASSETS_BUCKET = "broadside-assets";

export function assetUrl(path: string): string {
  return supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Sobe um File para o bucket public `assets` em `path` (faz upsert). Retorna URL pública. */
export async function uploadAsset(path: string, file: File | Blob): Promise<string> {
  const contentType = file instanceof File ? file.type || "image/png" : "image/png";
  const { error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(path, file, { contentType, upsert: true });
  if (error) throw error;
  // Cache-bust pra refletir uploads sobrescritos em <img>.
  return `${assetUrl(path)}?v=${Date.now()}`;
}

export async function removeAsset(path: string): Promise<void> {
  await supabase.storage.from(ASSETS_BUCKET).remove([path]);
}

// ===== Auth =====

/** Domínio interno usado para usuários criados via username (sem email real). */
export const INTERNAL_AUTH_DOMAIN = "broadside.local";

/** Resolve identifier (username sem @ ou email completo) pra email aceito pelo Supabase. */
export function identifierToEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${INTERNAL_AUTH_DOMAIN}`;
}

export async function signIn(identifier: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(identifier),
    password,
  });
  if (error) throw error;
  if (!data.session) throw new Error("Login sem sessão.");
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ===== Tipos espelhando as tabelas =====

export type DBVariant = "seedcare" | "esg";

export type DBCompany = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  variant: DBVariant;
  created_at: string;
  deleted_at: string | null;
};

export type DBBlockKey =
  | "selo"
  | "post"
  | "modelo"
  | "email"
  | "figurinhas"
  | "flyer"
  | "banner"
  | "outdoor";

export type DBSiteSettings = {
  canonicalBaseUrl: string;
  indexPasswordHint: string;
  textSeedcareHero: string;
  textEsgHero: string;
  textSeedcareCallout: string;
  textEsgCallout: string;
};

export type DBSiteContent = {
  id: 1;
  links: Record<DBVariant, Record<DBBlockKey, string>>;
  download_links: Record<DBVariant, string>;
  block_images: Record<DBVariant, Partial<Record<DBBlockKey, string>>>;
  seals: Record<DBVariant, string | null>;
  settings: DBSiteSettings;
  updated_at: string;
};
