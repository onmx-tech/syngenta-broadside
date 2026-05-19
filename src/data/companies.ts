export type Variant = "seedcare" | "esg";

export type Company = {
  slug: string;
  name: string;
  logoUrl: string;
  variant: Variant;
};

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

export const companies: Company[] = Object.entries(logoByFilename)
  .map(([filename, logoUrl]): Company => {
    const name = prettyName(filename);
    const slug = slugify(name) || slugify(filename);
    const variant: Variant = esgCompanies.has(slug) ? "esg" : "seedcare";
    return { slug, name, logoUrl, variant };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export const defaultCompany: Company =
  companies.find((c) => c.slug === "cotrijal") ?? companies[0];

export function getCompanyBySlug(slug: string | null | undefined): Company {
  if (!slug) return defaultCompany;
  const target = slugify(slug);
  return companies.find((c) => c.slug === target) ?? defaultCompany;
}
