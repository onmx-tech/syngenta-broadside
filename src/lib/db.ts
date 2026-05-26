import {
  supabase,
  type DBCompany,
  type DBSiteContent,
  type DBVariant,
} from "./supabase";

// ===== companies =====

/** Lista todas as empresas ativas (não deletadas). */
export async function fetchCompanies(): Promise<DBCompany[]> {
  const { data, error } = await supabase
    .from("broadside_companies")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DBCompany[];
}

/** Lixeira: empresas deletadas nos últimos 30 dias. */
export async function fetchDeletedCompanies(): Promise<DBCompany[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("broadside_companies")
    .select("*")
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DBCompany[];
}

export type CompanyUpsert = {
  id?: string;
  slug: string;
  name: string;
  logo_url: string | null;
  variant: DBVariant;
};

export async function upsertCompany(payload: CompanyUpsert): Promise<DBCompany> {
  const row = payload.id
    ? { ...payload, deleted_at: null }
    : { ...payload, id: undefined };
  const { data, error } = await supabase
    .from("broadside_companies")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw error;
  return data as DBCompany;
}

/** Soft delete: marca deleted_at. Restaurável por 30 dias. */
export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from("broadside_companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Restaura uma empresa soft-deleted (limpa deleted_at). */
export async function restoreCompany(id: string): Promise<DBCompany> {
  const { data, error } = await supabase
    .from("broadside_companies")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DBCompany;
}

/** Apaga definitivamente (sem volta). */
export async function hardDeleteCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from("broadside_companies")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ===== site_content =====

const DEFAULT_SITE_CONTENT: Omit<DBSiteContent, "updated_at"> = {
  id: 1,
  links: {
    seedcare: { selo: "", post: "", modelo: "", email: "", figurinhas: "", flyer: "", banner: "", outdoor: "" },
    esg: { selo: "", post: "", modelo: "", email: "", figurinhas: "", flyer: "", banner: "", outdoor: "" },
  },
  download_links: { seedcare: "", esg: "" },
  block_images: { seedcare: {}, esg: {} },
  seals: { seedcare: null, esg: null },
  settings: {
    canonicalBaseUrl: "https://syngenta-broadside.vercel.app",
    indexPasswordHint: "(definida no código)",
    textSeedcareHero: "Transformamos inovação em superação ao longo de gerações.",
    textEsgHero:
      "Aqui tem excelência no tratamento de sementes e reconhecimento em práticas ESG.",
    textSeedcareCallout:
      "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
    textEsgCallout:
      "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
  },
};

/** Linha singleton. Se vazia, retorna defaults (não cria — `insert` do schema cuida disso). */
export async function fetchSiteContent(): Promise<DBSiteContent> {
  const { data, error } = await supabase
    .from("broadside_site_content")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { ...DEFAULT_SITE_CONTENT, updated_at: new Date(0).toISOString() };
  }
  // Normaliza: garante shape mesmo se algum jsonb estiver vazio.
  return {
    ...DEFAULT_SITE_CONTENT,
    ...data,
    links: data.links?.seedcare ? data.links : DEFAULT_SITE_CONTENT.links,
    download_links: data.download_links ?? DEFAULT_SITE_CONTENT.download_links,
    block_images: data.block_images ?? DEFAULT_SITE_CONTENT.block_images,
    seals: data.seals ?? DEFAULT_SITE_CONTENT.seals,
    settings: { ...DEFAULT_SITE_CONTENT.settings, ...(data.settings ?? {}) },
  } as DBSiteContent;
}

export type SiteContentPatch = Partial<Omit<DBSiteContent, "id" | "updated_at">>;

export async function upsertSiteContent(patch: SiteContentPatch): Promise<DBSiteContent> {
  const { data, error } = await supabase
    .from("broadside_site_content")
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as DBSiteContent;
}

export { DEFAULT_SITE_CONTENT };

// ===== histórico de site_content =====

export type SiteContentSnapshot = {
  id: number;
  snapshot: {
    links: DBSiteContent["links"];
    download_links: DBSiteContent["download_links"];
    block_images: DBSiteContent["block_images"];
    seals: DBSiteContent["seals"];
    settings: DBSiteContent["settings"];
    updated_at?: string;
  };
  changed_at: string;
  changed_by: string | null;
};

/** Snapshots do site_content (mais recente primeiro, últimos 30 dias). */
export async function fetchSiteContentHistory(limit = 50): Promise<SiteContentSnapshot[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("broadside_site_content_history")
    .select("id, snapshot, changed_at, changed_by")
    .gte("changed_at", cutoff)
    .order("changed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SiteContentSnapshot[];
}

/** Restaura o site_content a partir de um snapshot do histórico. */
export async function restoreSiteContentSnapshot(snapshotId: number): Promise<DBSiteContent> {
  const { data: row, error: fetchErr } = await supabase
    .from("broadside_site_content_history")
    .select("snapshot")
    .eq("id", snapshotId)
    .single();
  if (fetchErr) throw fetchErr;
  const s = (row as { snapshot: SiteContentSnapshot["snapshot"] }).snapshot;
  return upsertSiteContent({
    links: s.links,
    download_links: s.download_links,
    block_images: s.block_images,
    seals: s.seals,
    settings: s.settings,
  });
}
