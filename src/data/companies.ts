import { useSyncExternalStore } from "react";
import { fetchCompanies } from "../lib/db";
import { hasSupabase } from "../lib/supabase";

export type Variant = "seedcare" | "esg";

export type Company = {
  slug: string;
  name: string;
  logoUrl: string;
  variant: Variant;
};

// ---------- fallback estático (logos empacotadas) ----------

const logoModules = import.meta.glob<{ default: string }>(
  "../assets/logos/*.png",
  { eager: true }
);

const logoByFilename: Record<string, string> = Object.fromEntries(
  Object.entries(logoModules).map(([path, mod]) => {
    const filename = path.split("/").pop()!.replace(/\.png$/i, "");
    return [filename, mod.default];
  })
);

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prettyName(filename: string): string {
  const overrides: Record<string, string> = {
    JH: "J&H",
    Tradicao: "Tradição",
    Agricola_estrela: "Agrícola Estrela",
    Maua: "Mauá",
    Butia: "Butiá",
    sao_francisco: "São Francisco",
    the_Seedcare_institute: "The Seedcare Institute",
    SLC: "SLC",
    Van_ass: "Van Ass",
    Costa_beber: "Costa Beber",
    Bom_jesus: "Bom Jesus",
    Cereal_ouro: "Cereal Ouro",
    boa_safra: "Boa Safra",
    sementes_mana: "Sementes Maná",
    estrela: "Sementes Estrela",
  };
  if (overrides[filename]) return overrides[filename];
  return filename
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

const esgCompanies: ReadonlySet<string> = new Set([
  "jotabasso",
  "sementes-estrela",
  "sao-francisco",
  "agrosol",
  "conceito",
  "coamo",
]);

const staticCompanies: Company[] = Object.entries(logoByFilename)
  .map(([filename, logoUrl]): Company => {
    const name = prettyName(filename);
    const slug = slugify(name) || slugify(filename);
    const variant: Variant = esgCompanies.has(slug) ? "esg" : "seedcare";
    return { slug, name, logoUrl, variant };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

// ---------- store reativa ----------

let snapshot: Company[] = staticCompanies;
const listeners = new Set<() => void>();

function setCompanies(next: Company[]) {
  snapshot = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return snapshot;
}

// Bootstrap em background: substitui a snapshot quando o DB responde.
let bootstrapped = false;
export function bootstrapCompanies(): Promise<void> {
  if (bootstrapped || !hasSupabase) return Promise.resolve();
  bootstrapped = true;
  return fetchCompanies()
    .then((rows) => {
      if (rows.length === 0) return;
      const mapped: Company[] = rows
        .map((c) => ({
          slug: c.slug,
          name: c.name,
          logoUrl: c.logo_url ?? "",
          variant: c.variant,
        }))
        .filter((c) => c.logoUrl !== "")
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      if (mapped.length > 0) setCompanies(mapped);
    })
    .catch((e) => {
      console.warn("[companies] fallback estático — falha lendo Supabase:", e);
    });
}

// ---------- API pública ----------

/** Snapshot reativo (atualiza quando o DB responde). */
export function useCompanies(): Company[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Compatibilidade: acesso síncrono ao snapshot atual. */
export const companies = new Proxy([] as Company[], {
  get(_t, prop) {
    return Reflect.get(snapshot, prop);
  },
  has(_t, prop) {
    return Reflect.has(snapshot, prop);
  },
}) as Company[];

export function getDefaultCompany(list: Company[] = snapshot): Company | null {
  return list.find((c) => c.slug === "cotrijal") ?? list[0] ?? null;
}

export function getCompanyBySlugIn(
  list: Company[],
  slug: string | null | undefined
): Company | null {
  if (!slug) return getDefaultCompany(list);
  const target = slugify(slug);
  return list.find((c) => c.slug === target) ?? null;
}

/** Mantém a assinatura antiga, mas pode retornar null quando ainda não há nenhuma empresa carregada. */
export function getCompanyBySlug(slug: string | null | undefined): Company | null {
  return getCompanyBySlugIn(snapshot, slug);
}
