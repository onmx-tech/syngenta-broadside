import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  fetchDeletedCompanies,
  fetchSiteContentHistory,
  hardDeleteCompany,
  restoreSiteContentSnapshot,
  type SiteContentSnapshot,
} from "../../lib/db";
import type { DBCompany } from "../../lib/supabase";
import { errorMessage } from "../../lib/errors";
import { ConfirmDialog } from "./ConfirmDialog";
import type { UseAdminState } from "./storage";

type Props = { admin: UseAdminState };
type Tab = "companies" | "snapshots";

const tabs: { id: Tab; label: string }[] = [
  { id: "companies", label: "Empresas" },
  { id: "snapshots", label: "Conteúdo" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function AdminTrash({ admin }: Props) {
  const [tab, setTab] = useState<Tab>("companies");
  const [deleted, setDeleted] = useState<DBCompany[] | null>(null);
  const [history, setHistory] = useState<SiteContentSnapshot[] | null>(null);
  const [confirmHardDelete, setConfirmHardDelete] = useState<DBCompany | null>(null);
  const [confirmRestoreSnapshot, setConfirmRestoreSnapshot] = useState<SiteContentSnapshot | null>(null);

  async function loadDeleted() {
    try {
      const rows = await fetchDeletedCompanies();
      setDeleted(rows);
    } catch (e) {
      toast.error("Falha carregando lixeira de empresas", {
        description: errorMessage(e),
      });
    }
  }

  async function loadHistory() {
    try {
      const rows = await fetchSiteContentHistory(50);
      setHistory(rows);
    } catch (e) {
      toast.error("Falha carregando histórico", {
        description: errorMessage(e),
      });
    }
  }

  useEffect(() => {
    loadDeleted();
    loadHistory();
  }, []);

  async function restore(company: DBCompany) {
    try {
      await admin.restoreCompany(company.id);
      setDeleted((prev) => (prev ?? []).filter((c) => c.id !== company.id));
    } catch {
      /* toast já disparado */
    }
  }

  async function purge(company: DBCompany) {
    try {
      await hardDeleteCompany(company.id);
      setDeleted((prev) => (prev ?? []).filter((c) => c.id !== company.id));
      toast.success(`“${company.name}” apagada definitivamente`);
    } catch (e) {
      toast.error("Falha ao apagar", {
        description: errorMessage(e),
      });
      throw e;
    }
  }

  async function applySnapshot(snap: SiteContentSnapshot) {
    try {
      await restoreSiteContentSnapshot(snap.id);
      toast.success("Conteúdo restaurado", {
        description: `Snapshot de ${formatDate(snap.changed_at)} aplicado.`,
      });
      // Reload do estado global pra refletir
      await admin.reload();
      await loadHistory();
    } catch (e) {
      toast.error("Falha ao restaurar", {
        description: errorMessage(e),
      });
      throw e;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Lixeira
        </h2>
        <p className="text-[#7c695d] text-[14px] mt-1">
          Empresas apagadas e snapshots de conteúdo dos últimos 30 dias.
        </p>
      </header>

      <div className="inline-flex bg-[#7c695d]/10 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === t.id ? "bg-white text-[#1a1208] shadow-sm" : "text-[#7c695d]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "companies" && (
        <CompaniesTrash
          rows={deleted}
          onRestore={restore}
          onHardDelete={(c) => setConfirmHardDelete(c)}
        />
      )}
      {tab === "snapshots" && (
        <SnapshotsList
          rows={history}
          onRestore={(s) => setConfirmRestoreSnapshot(s)}
        />
      )}

      <ConfirmDialog
        open={!!confirmHardDelete}
        onOpenChange={(v) => !v && setConfirmHardDelete(null)}
        title={`Apagar “${confirmHardDelete?.name ?? ""}” definitivamente?`}
        description="Essa ação não tem volta — a empresa e referências serão removidas para sempre."
        confirmLabel="Apagar para sempre"
        tone="danger"
        onConfirm={async () => {
          if (confirmHardDelete) await purge(confirmHardDelete);
        }}
      />

      <ConfirmDialog
        open={!!confirmRestoreSnapshot}
        onOpenChange={(v) => !v && setConfirmRestoreSnapshot(null)}
        title="Restaurar este snapshot?"
        description={
          confirmRestoreSnapshot
            ? `Vai sobrescrever links, textos, imagens e selos com o estado de ${formatDate(
                confirmRestoreSnapshot.changed_at
              )}. O estado atual também será salvo no histórico antes da troca.`
            : ""
        }
        confirmLabel="Restaurar"
        tone="warning"
        onConfirm={async () => {
          if (confirmRestoreSnapshot) await applySnapshot(confirmRestoreSnapshot);
        }}
      />
    </div>
  );
}

function CompaniesTrash({
  rows,
  onRestore,
  onHardDelete,
}: {
  rows: DBCompany[] | null;
  onRestore: (c: DBCompany) => void;
  onHardDelete: (c: DBCompany) => void;
}) {
  if (rows === null) return <SkeletonList />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Lixeira vazia"
        description="Empresas apagadas aparecem aqui por até 30 dias."
      />
    );
  }
  return (
    <motion.ul layout className="space-y-2">
      <AnimatePresence initial={false}>
        {rows.map((c) => {
          const daysLeft = 30 - daysSince(c.deleted_at ?? new Date().toISOString());
          return (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-[#7c695d]/15 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-[#f8f8f2] border border-[#7c695d]/10 flex items-center justify-center shrink-0 overflow-hidden grayscale opacity-70">
                {c.logo_url ? (
                  <img
                    src={c.logo_url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-[#7c695d]/30 text-[10px]">sem logo</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1a1208] truncate text-[14px]">
                  {c.name}
                </p>
                <p className="text-[#7c695d]/70 text-[11.5px] mt-0.5">
                  apagada em {formatDate(c.deleted_at ?? "")} ·{" "}
                  <span className={daysLeft <= 5 ? "text-[#a07a3a] font-medium" : ""}>
                    {daysLeft} dia{daysLeft === 1 ? "" : "s"} pra apagar definitivo
                  </span>
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onRestore(c)}
                  className="px-3 py-1.5 rounded-lg bg-[#7dbf44]/15 hover:bg-[#7dbf44]/25 text-[#3a6a1c] text-[12.5px] font-bold"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => onHardDelete(c)}
                  aria-label="Apagar definitivamente"
                  title="Apagar para sempre"
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}

function SnapshotsList({
  rows,
  onRestore,
}: {
  rows: SiteContentSnapshot[] | null;
  onRestore: (s: SiteContentSnapshot) => void;
}) {
  if (rows === null) return <SkeletonList />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sem histórico"
        description="Cada vez que algo é salvo (links, textos, imagens), um snapshot é guardado aqui."
      />
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((s) => (
        <li
          key={s.id}
          className="bg-white border border-[#7c695d]/15 rounded-xl p-3 sm:p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#7c695d]/10 flex items-center justify-center shrink-0 text-[#7c695d]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1a1208] text-[14px]">
              {formatDate(s.changed_at)}
            </p>
            <p className="text-[#7c695d]/70 text-[11.5px] mt-0.5 truncate">
              por {s.changed_by ?? "(desconhecido)"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRestore(s)}
            className="px-3 py-1.5 rounded-lg bg-[#7dbf44]/15 hover:bg-[#7dbf44]/25 text-[#3a6a1c] text-[12.5px] font-bold shrink-0"
          >
            Restaurar
          </button>
        </li>
      ))}
    </ul>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="bg-white border border-[#7c695d]/15 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#7c695d]/10 shrink-0 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 bg-[#7c695d]/12 rounded animate-pulse" />
            <div className="h-2.5 w-3/5 bg-[#7c695d]/8 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-[#7c695d]/15 px-6">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#7c695d]/10 flex items-center justify-center text-[#7c695d]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
        </svg>
      </div>
      <p className="font-bold text-[#1a1208] text-[15px]">{title}</p>
      <p className="text-[#7c695d] text-[13px] mt-1">{description}</p>
    </div>
  );
}
