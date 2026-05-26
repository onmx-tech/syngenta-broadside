import {
  supabase,
  type DBCompany,
  type DBSiteContent,
  type DBVariant,
} from "./supabase";

// ===== companies =====

export async function fetchCompanies(): Promise<DBCompany[]> {
  const { data, error } = await supabase
    .from("broadside_companies")
    .select("*")
    .order("name", { ascending: true });
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
  const row = payload.id ? payload : { ...payload, id: undefined };
  const { data, error } = await supabase
    .from("broadside_companies")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw error;
  return data as DBCompany;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("broadside_companies").delete().eq("id", id);
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
