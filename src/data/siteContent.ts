import { useSyncExternalStore } from "react";
import { DEFAULT_SITE_CONTENT, fetchSiteContent } from "../lib/db";
import { hasSupabase, type DBSiteContent } from "../lib/supabase";
import imgSeloSeedcare from "../assets/blocks/logo_excelencia_seedcare.png";
import imgSeloEsg from "../assets/blocks/logo_excelencia_seedcare_esg.png";
import { blocks as staticBlocks, type Block, type BlockKey } from "./blocks";
import type { Variant } from "./companies";

export type SiteContent = {
  links: DBSiteContent["links"];
  downloadLinks: DBSiteContent["download_links"];
  blockImages: DBSiteContent["block_images"];
  seals: DBSiteContent["seals"];
  settings: DBSiteContent["settings"];
};

// Fallback estático: imagens vindas dos bundles + textos padrão.
const FALLBACK: SiteContent = {
  links: DEFAULT_SITE_CONTENT.links,
  downloadLinks: DEFAULT_SITE_CONTENT.download_links,
  blockImages: { seedcare: {}, esg: {} },
  seals: { seedcare: imgSeloSeedcare, esg: imgSeloEsg },
  settings: DEFAULT_SITE_CONTENT.settings,
};

let snapshot: SiteContent = FALLBACK;
const listeners = new Set<() => void>();

function emit() {
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

let bootstrapped = false;
export function bootstrapSiteContent(): Promise<void> {
  if (bootstrapped || !hasSupabase) return Promise.resolve();
  bootstrapped = true;
  return fetchSiteContent()
    .then((row) => {
      snapshot = {
        links: row.links,
        downloadLinks: row.download_links,
        blockImages: row.block_images,
        seals: {
          seedcare: row.seals.seedcare ?? imgSeloSeedcare,
          esg: row.seals.esg ?? imgSeloEsg,
        },
        settings: row.settings,
      };
      emit();
    })
    .catch((e) => {
      console.warn("[siteContent] fallback estático — falha lendo Supabase:", e);
    });
}

export function useSiteContent(): SiteContent {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Resolve a imagem de um bloco para uma variante, com fallback no asset empacotado. */
export function resolveBlockImage(
  content: SiteContent,
  block: Block,
  variant: Variant
): string {
  const dynamic = content.blockImages[variant]?.[block.key as BlockKey];
  return dynamic && dynamic.length > 0 ? dynamic : block.images[variant];
}

/** Resolve o selo central (callout) por variante. */
export function resolveSeal(content: SiteContent, variant: Variant): string {
  return content.seals[variant] ?? (variant === "esg" ? imgSeloEsg : imgSeloSeedcare);
}

/** URL do pacote de download para a variante (vazia = "Materiais em breve"). */
export function resolveDownloadHref(content: SiteContent, variant: Variant): string {
  return content.downloadLinks[variant] ?? "";
}

// Re-export pra conveniência
export { staticBlocks };
