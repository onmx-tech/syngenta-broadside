import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAdminState } from "./storage";
import { AdminCompanies } from "./AdminCompanies";
import { AdminLinks } from "./AdminLinks";
import { AdminAssets } from "./AdminAssets";
import { AdminSettings } from "./AdminSettings";
import { hasSupabase, signIn, signOut, supabase } from "../../lib/supabase";
import imgSelo from "../../assets/blocks/logo_excelencia_seedcare.png";

type Tab = "companies" | "links" | "assets" | "settings";

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
];

function AdminGate() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
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
      // onAuthStateChange no AdminShell vai redirecionar.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
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
            className="w-[130px] h-[130px] object-contain drop-shadow-[0_8px_24px_rgba(125,191,68,0.25)]"
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
          <input
            id="apwd"
            type="password"
            autoComplete="current-password"
            value={pwd}
            placeholder="••••••••"
            onChange={(e) => {
              setPwd(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? "true" : undefined}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-[#fffeeb] placeholder:text-white/30 text-[15px] tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:border-[#7dbf44] transition-colors"
          />
          {error && (
            <p role="alert" className="text-[13px] text-[#ff8a8a] text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || pwd.length === 0 || email.length === 0}
            className="w-full px-4 py-3.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0904] font-bold text-[15px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fffeeb]/40"
          >
            {submitting ? "..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: "idle" | "loading" | "saving" | "saved" | "error";
  error: string | null;
}) {
  if (status === "loading")
    return <span className="text-[12px] text-[#7c695d]/70">Carregando…</span>;
  if (status === "saving")
    return <span className="text-[12px] text-[#7c695d]/70">Salvando…</span>;
  if (status === "saved")
    return <span className="text-[12px] text-[#3a6a1c]">Salvo ✓</span>;
  if (status === "error")
    return (
      <span className="text-[12px] text-red-600" title={error ?? ""}>
        Erro {error ? `· ${error.slice(0, 80)}` : ""}
      </span>
    );
  return null;
}

function AdminBody({ session, logout }: { session: Session; logout: () => void }) {
  const admin = useAdminState();
  const [tab, setTab] = useState<Tab>(() => {
    const stored = sessionStorage.getItem("seedcare_admin_tab");
    return (stored as Tab) ?? "companies";
  });

  useEffect(() => {
    sessionStorage.setItem("seedcare_admin_tab", tab);
  }, [tab]);

  return (
    <div className="min-h-screen w-full bg-[#f8f8f2] flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen bg-[#1a1208] text-[#e4e4d0] flex md:flex-col">
        <div className="hidden md:flex items-center gap-3 px-5 pt-6 pb-8">
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
        <nav className="flex md:flex-col gap-1 px-3 py-3 md:py-0 flex-1 overflow-x-auto md:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors shrink-0 md:w-full ${
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
        <div className="px-3 pb-4 mt-auto hidden md:block">
          <a
            href="/"
            className="block px-3 py-2 rounded-lg text-white/40 hover:text-white text-[13px]"
          >
            ← Voltar pro site
          </a>
          <button
            type="button"
            onClick={logout}
            className="block w-full text-left px-3 py-2 rounded-lg text-white/40 hover:text-white text-[13px]"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8 md:p-10 max-w-[1100px]">
        <div className="flex justify-end mb-3 min-h-[18px]">
          <StatusBadge status={admin.status} error={admin.error} />
        </div>
        {tab === "companies" && <AdminCompanies admin={admin} />}
        {tab === "links" && <AdminLinks admin={admin} />}
        {tab === "assets" && <AdminAssets admin={admin} />}
        {tab === "settings" && <AdminSettings admin={admin} />}
      </main>
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

  return <AdminBody session={session} logout={() => signOut()} />;
}
