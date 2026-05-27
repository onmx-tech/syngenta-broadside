import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { AdminCompany, AdminVariant } from "./types";
import { genId, slugify, uploadLogo, type UseAdminState } from "./storage";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = { admin: UseAdminState };

type EditingCompany = Omit<AdminCompany, "createdAt"> & {
  isNew: boolean;
  pendingLogoFile?: File | null;
};

const empty = (): EditingCompany => ({
  id: genId(),
  slug: "",
  name: "",
  logoUrl: null,
  variant: "seedcare",
  isNew: true,
});

export function AdminCompanies({ admin }: Props) {
  const { state, initialLoading, saveCompany, removeCompany } = admin;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | AdminVariant>("all");
  const [editing, setEditing] = useState<EditingCompany | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<AdminCompany | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.companies.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q);
      const matchesV = filter === "all" || c.variant === filter;
      return matchesQ && matchesV;
    });
  }, [state.companies, query, filter]);

  async function save(c: EditingCompany) {
    if (!c.name.trim() || !c.slug.trim()) return;

    // Detecta conflito de slug com OUTRA empresa (ignora a própria em modo edição).
    const conflict = state.companies.find(
      (other) => other.slug === c.slug && other.id !== c.id
    );
    if (conflict) {
      const ok = confirm(
        `Já existe uma empresa com slug "${c.slug}":\n\n` +
          `  ${conflict.name}\n\n` +
          `Salvar agora vai SOBRESCREVER ela com os dados que você está enviando.\n\n` +
          `Quer continuar?`
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      let logoUrl = c.logoUrl;
      if (c.pendingLogoFile) {
        toast.loading("Enviando logo…", { id: "upload-logo" });
        logoUrl = await uploadLogo(c.slug, c.pendingLogoFile);
        toast.dismiss("upload-logo");
      }
      await saveCompany({
        id: c.id,
        slug: c.slug,
        name: c.name,
        logoUrl,
        variant: c.variant,
      });
      setEditing(null);
    } catch {
      toast.dismiss("upload-logo");
      // toast de erro já foi disparado pelo hook
    } finally {
      setBusy(false);
    }
  }

  function onLogoChange(file: File | null) {
    if (!editing || !file) return;
    const previewUrl = URL.createObjectURL(file);
    setEditing({ ...editing, pendingLogoFile: file, logoUrl: previewUrl });
  }

  function openPreview(slug: string) {
    window.open(`/?broadside=${slug}`, "_blank", "noopener");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
            Empresas
          </h2>
          <p className="text-[#7c695d] text-[14px] mt-1">
            {initialLoading ? "Carregando…" : `${state.companies.length} cadastradas`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(empty())}
          className="px-4 py-2.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] text-[#0d0904] font-bold text-[14px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#7dbf44]/30"
        >
          + Nova empresa
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <input
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[#7c695d]/25 bg-white text-[#1a1208] placeholder:text-[#7c695d]/50 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
        />
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
          {(["all", "seedcare", "esg"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0 ${
                filter === f
                  ? "bg-[#7c695d] text-white"
                  : "bg-white text-[#7c695d] border border-[#7c695d]/25 hover:bg-[#7c695d]/5"
              }`}
            >
              {f === "all" ? "Todas" : f === "seedcare" ? "Seedcare" : "ESG"}
            </button>
          ))}
        </div>
      </div>

      {initialLoading ? (
        <CompaniesSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#7c695d]/15">
          <p className="text-[#7c695d]/70 text-[15px]">
            {query || filter !== "all" ? (
              "Nenhuma empresa encontrada com esse filtro."
            ) : (
              <>
                Nenhuma empresa.{" "}
                <button
                  type="button"
                  onClick={() => setEditing(empty())}
                  className="text-[#7dbf44] hover:underline font-medium"
                >
                  Adicionar a primeira
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <motion.ul layout className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <AnimatePresence initial={false}>
            {filtered.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="bg-white border border-[#7c695d]/15 rounded-xl p-3 flex items-center gap-3 hover:border-[#7c695d]/30 hover:shadow-sm transition-all"
              >
                <div className="w-14 h-14 rounded-lg bg-[#f8f8f2] border border-[#7c695d]/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt=""
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[#7c695d]/30 text-[10px]">sem logo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#1a1208] truncate">
                      {c.name}
                    </span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        c.variant === "esg"
                          ? "bg-[#7dbf44]/20 text-[#3a6a1c]"
                          : "bg-[#765827]/20 text-[#4a3818]"
                      }`}
                    >
                      {c.variant}
                    </span>
                  </div>
                  <p className="text-[#7c695d]/70 text-[12px] font-mono truncate">
                    /?broadside={c.slug}
                  </p>
                </div>
                <div className="flex gap-0.5 sm:gap-1 shrink-0">
                  <IconButton
                    label="Ver no site"
                    color="neutral"
                    onClick={() => openPreview(c.slug)}
                  >
                    <EyeIcon />
                  </IconButton>
                  <IconButton
                    label="Editar"
                    color="neutral"
                    onClick={() =>
                      setEditing({
                        id: c.id,
                        slug: c.slug,
                        name: c.name,
                        logoUrl: c.logoUrl,
                        variant: c.variant,
                        isNew: false,
                      })
                    }
                  >
                    <PencilIcon />
                  </IconButton>
                  <IconButton
                    label="Remover"
                    color="danger"
                    onClick={() => setConfirmingDelete(c)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 bg-[#0d0904]/55 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && setEditing(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={editing.isNew ? "Nova empresa" : "Editar empresa"}
              className="bg-white rounded-2xl max-w-[480px] w-full p-6 sm:p-8 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.35)] max-h-[calc(100vh-2rem)] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-[#1a1208] text-[20px] mb-5">
                {editing.isNew ? "Nova empresa" : "Editar empresa"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setEditing({
                        ...editing,
                        name,
                        slug:
                          editing.isNew && (!editing.slug || editing.slug === slugify(editing.name))
                            ? slugify(name)
                            : editing.slug,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#7c695d]/25 focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
                    Slug (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[#7c695d]/60 text-[13px] font-mono shrink-0">/?broadside=</span>
                    <input
                      type="text"
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-[#7c695d]/25 font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
                    Variante
                  </label>
                  <div className="flex gap-2">
                    {(["seedcare", "esg"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setEditing({ ...editing, variant: v })}
                        className={`flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          editing.variant === v
                            ? "bg-[#7c695d] text-white"
                            : "bg-white text-[#7c695d] border border-[#7c695d]/25"
                        }`}
                      >
                        {v === "seedcare" ? "Seedcare" : "ESG"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
                    Logo
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-20 h-20 rounded-lg bg-[#f8f8f2] border border-[#7c695d]/15 flex items-center justify-center overflow-hidden shrink-0">
                      {editing.logoUrl ? (
                        <img
                          src={editing.logoUrl}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-[#7c695d]/30 text-[10px]">vazio</span>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-3 py-2 rounded-lg bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[13px] font-medium"
                    >
                      {editing.logoUrl ? "Trocar" : "Enviar"}
                    </button>
                    {editing.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, logoUrl: null, pendingLogoFile: null })}
                        className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-[13px] font-medium"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#7c695d]/25 text-[#7c695d] font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => save(editing)}
                  disabled={busy || !editing.name.trim() || !editing.slug.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0904] font-bold transition-colors"
                >
                  {busy ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmingDelete}
        onOpenChange={(v) => !v && setConfirmingDelete(null)}
        title={`Remover “${confirmingDelete?.name ?? ""}”?`}
        description="A empresa vai pra lixeira e pode ser restaurada em até 30 dias."
        confirmLabel="Mover para lixeira"
        tone="danger"
        onConfirm={async () => {
          if (confirmingDelete) await removeCompany(confirmingDelete.id);
        }}
      />
    </div>
  );
}

function CompaniesSkeleton() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="bg-white border border-[#7c695d]/15 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-14 h-14 rounded-lg bg-[#7c695d]/8 shrink-0 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 bg-[#7c695d]/12 rounded animate-pulse" />
            <div className="h-2.5 w-3/5 bg-[#7c695d]/8 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function IconButton({
  label,
  color,
  onClick,
  children,
}: {
  label: string;
  color: "neutral" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const palette =
    color === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-[#7c695d] hover:bg-[#7c695d]/10";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${palette}`}
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
