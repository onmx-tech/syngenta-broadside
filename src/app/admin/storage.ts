import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_INITIAL_STATE,
  type AdminCompany,
  type AdminSiteContent,
  type AdminState,
  type AdminVariant,
} from "./types";
import {
  deleteCompany as dbDeleteCompany,
  fetchCompanies,
  fetchSiteContent,
  upsertCompany as dbUpsertCompany,
  upsertSiteContent,
  restoreCompany as dbRestoreCompany,
} from "../../lib/db";
import {
  hasSupabase,
  uploadAsset,
  type DBCompany,
  type DBSiteContent,
} from "../../lib/supabase";

// ---------- mapeamento DB <-> Admin ----------

function dbToAdminCompany(c: DBCompany): AdminCompany {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    logoUrl: c.logo_url,
    variant: c.variant,
    createdAt: c.created_at,
  };
}

function dbToSiteContent(c: DBSiteContent): AdminSiteContent {
  return {
    links: c.links,
    downloadLinks: c.download_links,
    blockImages: c.block_images,
    seals: c.seals,
    settings: c.settings,
  };
}

function siteContentToDb(s: AdminSiteContent) {
  return {
    links: s.links,
    download_links: s.downloadLinks,
    block_images: s.blockImages,
    seals: s.seals,
    settings: s.settings,
  };
}

// ---------- util ----------

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- upload helpers (Storage) ----------

const allowedExt = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

function extOf(file: File): string {
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  const ext = (m?.[1] ?? "png").toLowerCase();
  return allowedExt.has(ext) ? ext : "png";
}

export async function uploadLogo(slug: string, file: File): Promise<string> {
  return uploadAsset(`logos/${slug}.${extOf(file)}`, file);
}

export async function uploadSeal(
  variant: AdminVariant,
  file: File
): Promise<string> {
  return uploadAsset(`seals/${variant}.${extOf(file)}`, file);
}

export async function uploadBlockImage(
  variant: AdminVariant,
  key: string,
  file: File
): Promise<string> {
  return uploadAsset(`blocks/${variant}/${key}.${extOf(file)}`, file);
}

// ---------- hook principal ----------

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export type UseAdminState = {
  state: AdminState;
  initialLoading: boolean;
  setSiteContent: (
    updater: AdminSiteContent | ((s: AdminSiteContent) => AdminSiteContent)
  ) => void;
  saveCompany: (input: Omit<AdminCompany, "createdAt">) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  restoreCompany: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  status: Status;
  error: string | null;
};

const SAVE_DEBOUNCE_MS = 700;

export function useAdminState(): UseAdminState {
  const [state, setState] = useState<AdminState>(ADMIN_INITIAL_STATE);
  const [initialLoading, setInitialLoading] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const pendingSite = useRef<AdminSiteContent | null>(null);
  const saveTimer = useRef<number | null>(null);
  const mounted = useRef(true);
  const firstLoad = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const reload = useCallback(async () => {
    if (!hasSupabase) {
      setStatus("idle");
      setInitialLoading(false);
      return;
    }
    if (!firstLoad.current) setStatus("loading");
    setError(null);
    try {
      const [companies, site] = await Promise.all([
        fetchCompanies(),
        fetchSiteContent(),
      ]);
      if (!mounted.current) return;
      setState({
        companies: companies.map(dbToAdminCompany),
        ...dbToSiteContent(site),
      });
      setStatus("idle");
    } catch (e) {
      if (!mounted.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      toast.error("Falha ao carregar dados", { description: msg });
    } finally {
      if (mounted.current) {
        setInitialLoading(false);
        firstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const flushSite = useCallback(async () => {
    const pending = pendingSite.current;
    if (!pending) return;
    pendingSite.current = null;
    if (!hasSupabase) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    try {
      await upsertSiteContent(siteContentToDb(pending));
      if (!mounted.current) return;
      setStatus("saved");
      window.setTimeout(() => {
        if (mounted.current && pendingSite.current === null) setStatus("idle");
      }, 1200);
    } catch (e) {
      if (!mounted.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      toast.error("Falha ao salvar", { description: msg });
    }
  }, []);

  const scheduleSave = useCallback(
    (next: AdminSiteContent) => {
      pendingSite.current = next;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(flushSite, SAVE_DEBOUNCE_MS);
    },
    [flushSite]
  );

  const setSiteContent: UseAdminState["setSiteContent"] = useCallback(
    (updater) => {
      setState((prev) => {
        const current: AdminSiteContent = {
          links: prev.links,
          downloadLinks: prev.downloadLinks,
          blockImages: prev.blockImages,
          seals: prev.seals,
          settings: prev.settings,
        };
        const next =
          typeof updater === "function"
            ? (updater as (s: AdminSiteContent) => AdminSiteContent)(current)
            : updater;
        scheduleSave(next);
        return { ...prev, ...next };
      });
    },
    [scheduleSave]
  );

  const saveCompany: UseAdminState["saveCompany"] = useCallback(async (input) => {
    if (!hasSupabase) {
      const msg = "Supabase não configurado.";
      setError(msg);
      setStatus("error");
      toast.error(msg);
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const existing = state.companies.find((c) => c.id === input.id);
      const saved = await dbUpsertCompany({
        id: existing ? input.id : undefined,
        slug: input.slug,
        name: input.name,
        logo_url: input.logoUrl,
        variant: input.variant,
      });
      if (!mounted.current) return;
      setState((prev) => {
        const others = prev.companies.filter((c) => c.id !== saved.id);
        return {
          ...prev,
          companies: [...others, dbToAdminCompany(saved)].sort((a, b) =>
            a.name.localeCompare(b.name, "pt-BR")
          ),
        };
      });
      setStatus("saved");
      toast.success(
        existing ? `“${saved.name}” atualizada` : `“${saved.name}” criada`
      );
      window.setTimeout(() => {
        if (mounted.current) setStatus("idle");
      }, 1200);
    } catch (e) {
      if (!mounted.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      toast.error("Não consegui salvar a empresa", { description: msg });
      throw e;
    }
  }, [state.companies]);

  const removeCompany: UseAdminState["removeCompany"] = useCallback(async (id) => {
    if (!hasSupabase) return;
    const victim = state.companies.find((c) => c.id === id);
    if (!victim) return;
    // Optimistic: remove imediatamente da lista.
    setState((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c.id !== id),
    }));
    try {
      await dbDeleteCompany(id);
      toast.success(`“${victim.name}” movida para a lixeira`, {
        description: "Pode restaurar dentro de 30 dias.",
        action: {
          label: "Desfazer",
          onClick: () => {
            // Restaura em background; o estado vai voltar quando confirmar.
            void (async () => {
              try {
                const restored = await dbRestoreCompany(id);
                if (!mounted.current) return;
                setState((prev) => ({
                  ...prev,
                  companies: [...prev.companies, dbToAdminCompany(restored)].sort(
                    (a, b) => a.name.localeCompare(b.name, "pt-BR")
                  ),
                }));
                toast.success(`“${victim.name}” restaurada`);
              } catch (e) {
                toast.error("Não consegui restaurar", {
                  description: e instanceof Error ? e.message : String(e),
                });
              }
            })();
          },
        },
      });
    } catch (e) {
      // Rollback: empresa volta pra lista
      if (mounted.current) {
        setState((prev) => ({
          ...prev,
          companies: [...prev.companies, victim].sort((a, b) =>
            a.name.localeCompare(b.name, "pt-BR")
          ),
        }));
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Não consegui remover", { description: msg });
    }
  }, [state.companies]);

  const restoreCompany: UseAdminState["restoreCompany"] = useCallback(async (id) => {
    if (!hasSupabase) return;
    try {
      const restored = await dbRestoreCompany(id);
      if (!mounted.current) return;
      setState((prev) => ({
        ...prev,
        companies: [
          ...prev.companies.filter((c) => c.id !== restored.id),
          dbToAdminCompany(restored),
        ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      }));
      toast.success(`“${restored.name}” restaurada`);
    } catch (e) {
      toast.error("Não consegui restaurar", {
        description: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }, []);

  return useMemo(
    () => ({
      state,
      initialLoading,
      setSiteContent,
      saveCompany,
      removeCompany,
      restoreCompany,
      reload,
      status,
      error,
    }),
    [
      state,
      initialLoading,
      setSiteContent,
      saveCompany,
      removeCompany,
      restoreCompany,
      reload,
      status,
      error,
    ]
  );
}
