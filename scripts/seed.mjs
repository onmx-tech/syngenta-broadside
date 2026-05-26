// Seed do Supabase — migra o conteúdo atual (empresas + logos) para o banco.
// Rode UMA vez após criar o projeto e rodar supabase/schema.sql:
//
//   node --env-file=.env.local scripts/seed.mjs
//
// Usa a service_role key (bypassa RLS). Idempotente: pode rodar de novo.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGOS_DIR = join(ROOT, "src/assets/logos");
const BUCKET = "broadside-assets";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// ---- Lógica copiada de src/data/companies.ts (mantém slugs idênticos) ----

const overrides = {
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

const esgCompanies = new Set([
  "jotabasso",
  "sementes-estrela",
  "sao-francisco",
  "agrosol",
  "conceito",
  "coamo",
]);

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prettyName(filename) {
  if (overrides[filename]) return overrides[filename];
  return filename
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

// Settings padrão (de ADMIN_INITIAL_STATE)
const defaultSettings = {
  canonicalBaseUrl: "https://syngenta-broadside.vercel.app",
  indexPasswordHint: "(definida no código por enquanto)",
  textSeedcareHero: "Transformamos inovação em superação ao longo de gerações.",
  textEsgHero:
    "Aqui tem excelência no tratamento de sementes e reconhecimento em práticas ESG.",
  textSeedcareCallout:
    "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
  textEsgCallout:
    "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
};

const emptyLinks = {
  seedcare: { selo: "", post: "", modelo: "", email: "", figurinhas: "", flyer: "", banner: "", outdoor: "" },
  esg: { selo: "", post: "", modelo: "", email: "", figurinhas: "", flyer: "", banner: "", outdoor: "" },
};

async function main() {
  const files = readdirSync(LOGOS_DIR).filter((f) => /\.png$/i.test(f));
  console.log(`Encontradas ${files.length} logos em src/assets/logos.`);

  const companies = [];
  for (const file of files) {
    const filename = file.replace(/\.png$/i, "");
    const name = prettyName(filename);
    const slug = slugify(name) || slugify(filename);
    const variant = esgCompanies.has(slug) ? "esg" : "seedcare";

    const storagePath = `logos/${file}`;
    const buf = readFileSync(join(LOGOS_DIR, file));
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buf, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error(`  ✗ upload ${file}:`, upErr.message);
      continue;
    }
    const logo_url = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      .data.publicUrl;
    companies.push({ slug, name, logo_url, variant });
    process.stdout.write(`  ✓ ${name} (${variant})\n`);
  }

  const { error: cErr } = await supabase
    .from("broadside_companies")
    .upsert(companies, { onConflict: "slug" });
  if (cErr) throw cErr;
  console.log(`\n${companies.length} empresas gravadas.`);

  const { error: sErr } = await supabase.from("broadside_site_content").upsert({
    id: 1,
    links: emptyLinks,
    download_links: { seedcare: "", esg: "" },
    settings: defaultSettings,
    block_images: { seedcare: {}, esg: {} },
    seals: { seedcare: null, esg: null },
    updated_at: new Date().toISOString(),
  });
  if (sErr) throw sErr;
  console.log("broadside_site_content (links vazios + textos padrão) gravado.");

  console.log("\n✅ Seed concluído.");
}

main().catch((e) => {
  console.error("\n❌ Seed falhou:", e.message ?? e);
  process.exit(1);
});
