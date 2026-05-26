import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAdminState } from "./storage";
import { AdminCompanies } from "./AdminCompanies";
import { AdminLinks } from "./AdminLinks";
import { AdminAssets } from "./AdminAssets";
import { AdminSettings } from "./AdminSettings";
import { AdminUsers } from "./AdminUsers";
import { AdminTrash } from "./AdminTrash";
import { hasSupabase, signIn, signOut, supabase } from "../../lib/supabase";
import imgSelo from "../../assets/blocks/logo_excelencia_seedcare.png";

type Tab = "companies" | "links" | "assets" | "settings" | "users" | "trash";

const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "companies",
    label: "Empresas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>
    ),
  },
  {
    id: "links",
    label: "Links",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
    ),
  },
  {
    id: "assets",
    label: "Imagens",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
    ),
  },
  {
    id: "settings",
    label: "Configurações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    ),
  },
  {
    id: "users",
    label: "Usuários",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    id: "trash",
    label: "Lixeira",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
    ),
  },
];

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.93 10.93 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function AdminGate() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase) {
      setError("Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), pwd);
      toast.success("Bem-vindo de volta");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, #2f2415 0%, #1a1208 60%, #0d0904 100%)",
      }}
    >
      <form onSubmit={submit} className="w-full max-w-[380px]" autoComplete="on" noValidate>
        <div className="flex flex-col items-center mb-8">
          <img
            src={imgSelo}
            alt=""
            width={140}
            height={140}
            decoding="async"
            className="w-[120px] sm:w-[130px] h-[120px] sm:h-[130px] object-contain drop-shadow-[0_8px_24px_rgba(125,191,68,0.25)]"
          />
          <p className="mt-4 text-white/40 text-[11px] uppercase tracking-[0.3em] font-medium">
            Admin
          </p>
        </div>
        <div
          className="rounded-2xl p-6 sm:p-8 space-y-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(228,228,208,0.12)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          }}
        >
          <label htmlFor="aemail" className="sr-only">
            Email
          </label>
          <input
            id="aemail"
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            placeholder="email@exemplo.com"
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-[#fffeeb] placeholder:text-white/30 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:border-[#7dbf44] transition-colors"
          />
          <label htmlFor="apwd" className="sr-only">
            Senha
          </label>
          <div className="relative">
            <input
              id="apwd"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={pwd}
              placeholder="••••••••"
              onChange={(e) => {
                setPwd(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? "true" : undefined}
              className={`w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border border-white/15 text-[#fffeeb] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:border-[#7dbf44] transition-colors ${
                showPwd
                  ? "text-[15px]"
                  : "text-[15px] tracking-[0.4em] text-center"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[13px] text-[#ff8a8a] text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || pwd.length === 0 || email.length === 0}
            className="w-full px-4 py-3.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0904] font-bold text-[15px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#fffeeb]/20"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "idle" | "loading" | "saving" | "saved" | "error";
}) {
  return (
    <AnimatePresence mode="wait">
      {status === "loading" && (
        <motion.span
          key="loading"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#7c695d]/70"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7c695d]/50 animate-pulse" />
          Carregando…
        </motion.span>
      )}
      {status === "saving" && (
        <motion.span
          key="saving"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#a07a3a]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#a07a3a] animate-pulse" />
          Salvando…
        </motion.span>
      )}
      {status === "saved" && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, y: -4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#3a6a1c] font-medium"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Salvo
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function AdminBody({ session, logout }: { session: Session; logout: () => void }) {
  const admin = useAdminState();
  const [tab, setTab] = useState<Tab>(() => {
    const stored = sessionStorage.getItem("seedcare_admin_tab");
    return (stored as Tab) ?? "companies";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("seedcare_admin_tab", tab);
  }, [tab]);

  // Fecha drawer ao trocar de tab
  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  // Body scroll lock no drawer aberto
  useEffect(() => {
    if (mobileNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileNavOpen]);

  const currentTab = tabs.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen w-full bg-[#f8f8f2]">
      {/* Topbar mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-[#1a1208] text-[#e4e4d0] flex items-center justify-between px-4 h-14 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {currentTab.icon}
          <span className="font-bold text-[15px] truncate">{currentTab.label}</span>
        </div>
        <StatusBadge status={admin.status} />
      </header>

      <div className="flex flex-col md:flex-row md:min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen md:fixed md:inset-y-0 bg-[#1a1208] text-[#e4e4d0]">
          <div className="flex items-center gap-3 px-5 pt-6 pb-7">
            <img src={imgSelo} alt="" className="w-9 h-9 object-contain" />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white">Seedcare</p>
              <p
                className="text-[10px] uppercase tracking-[0.2em] text-white/40 truncate"
                title={session.user.email ?? "Admin"}
              >
                {session.user.email ?? "Admin"}
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors text-left ${
                  tab === t.id
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="px-3 pb-4 border-t border-white/5 pt-3 mt-3">
            <a
              href="/"
              className="block px-3 py-2 rounded-lg text-white/40 hover:text-white text-[13px] transition-colors"
            >
              ← Voltar pro site
            </a>
            <button
              type="button"
              onClick={logout}
              className="block w-full text-left px-3 py-2 rounded-lg text-white/40 hover:text-white text-[13px] transition-colors"
            >
              Sair
            </button>
          </div>
        </aside>

        {/* Drawer mobile */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                className="md:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.aside
                className="md:hidden fixed inset-y-0 left-0 z-40 w-[280px] max-w-[80vw] bg-[#1a1208] text-[#e4e4d0] flex flex-col shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={imgSelo} alt="" className="w-9 h-9 object-contain" />
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white">Seedcare</p>
                      <p
                        className="text-[10px] uppercase tracking-[0.2em] text-white/40 truncate"
                        title={session.user.email ?? "Admin"}
                      >
                        {session.user.email ?? "Admin"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Fechar menu"
                    className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-lg text-[14px] font-medium transition-colors text-left ${
                        tab === t.id
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="px-3 pb-5 border-t border-white/5 pt-3">
                  <a
                    href="/"
                    className="block px-3 py-2.5 rounded-lg text-white/50 hover:text-white text-[13px] transition-colors"
                  >
                    ← Voltar pro site
                  </a>
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-white/50 hover:text-white text-[13px] transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 md:ml-64 px-4 sm:px-6 md:px-10 py-5 sm:py-8 md:py-10 max-w-full md:max-w-[1100px]">
          <div className="hidden md:flex justify-end mb-3 min-h-[18px]">
            <StatusBadge status={admin.status} />
          </div>
          {tab === "companies" && <AdminCompanies admin={admin} />}
          {tab === "links" && <AdminLinks admin={admin} />}
          {tab === "assets" && <AdminAssets admin={admin} />}
          {tab === "settings" && <AdminSettings admin={admin} />}
          {tab === "users" && <AdminUsers />}
          {tab === "trash" && <AdminTrash admin={admin} />}
        </main>
      </div>
    </div>
  );
}

export function AdminShell() {
  const [session, setSession] = useState<Session | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    document.title = "Admin • Broadside Seedcare";
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) meta.setAttribute("content", "noindex, nofollow");
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setBootstrapped(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!bootstrapped) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, #2f2415 0%, #1a1208 60%, #0d0904 100%)",
        }}
      >
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#7dbf44] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AdminGate />;

  return (
    <AdminBody
      session={session}
      logout={async () => {
        await signOut();
        toast.success("Até logo!");
      }}
    />
  );
}
