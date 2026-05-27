import { useEffect, useState, type ReactNode } from "react";
import imgSelo from "../../assets/blocks/logo_excelencia_seedcare.png";

// ⚠️ SEGURANÇA: este gate é uma BARREIRA SIMBÓLICA, não segurança real.
// O hash SHA-256 fica no bundle do cliente — qualquer pessoa que abrir o
// DevTools pode lê-lo e tentar dicionário/rainbow table em segundos.
// O propósito é só evitar que alguém aterrissando na URL pública dê de cara
// com a lista de empresas. Conteúdo realmente sensível (escrita no banco)
// já é protegido pelo Supabase Auth + RLS no admin.
//
// Pra trocar a senha: rode hashPassword(novaSenha) em qualquer console e
// substitua EXPECTED_HASH. Não exponha a senha em texto plano em nenhum lugar.
const STORAGE_KEY = "seedcare_index_auth";
const EXPECTED_HASH = "a0592e71d1ed04ff869432c1d8f4637dab7e07f70616aa2e2c1f7892f7397ff3";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.style.colorScheme = "light";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const hash = await hashPassword(pwd);
      if (hash === EXPECTED_HASH) {
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {}
        setAuthed(true);
      } else {
        setError("Senha incorreta.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, #2f2415 0%, #1a1208 60%, #0d0904 100%)",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[380px] relative"
        autoComplete="off"
        noValidate
      >
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <img
            src={imgSelo}
            alt=""
            width={160}
            height={160}
            decoding="async"
            fetchPriority="high"
            className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] object-contain drop-shadow-[0_8px_24px_rgba(125,191,68,0.25)]"
          />
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(228, 228, 208, 0.12)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
          }}
        >
          <label htmlFor="pwd" className="sr-only">
            Senha
          </label>
          <input
            id="pwd"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={pwd}
            placeholder="••••••••"
            onChange={(e) => {
              setPwd(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "pwd-error" : undefined}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-[#fffeeb] placeholder:text-white/30 font-['Inter',sans-serif] text-[15px] tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:border-[#7dbf44] transition-colors"
          />
          {error && (
            <p
              id="pwd-error"
              role="alert"
              className="mt-3 font-['Inter',sans-serif] text-[13px] text-[#ff8a8a] text-center"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || pwd.length === 0}
            className="mt-4 w-full px-4 py-3.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] active:bg-[#5a922f] disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0904] font-['Inter',sans-serif] font-bold text-[15px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fffeeb]/40"
          >
            {submitting ? "..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
