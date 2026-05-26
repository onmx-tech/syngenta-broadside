import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createUser, deleteUser, listUsers, type AdminUser } from "../../lib/usersApi";
import { errorMessage } from "../../lib/errors";
import { ConfirmDialog } from "./ConfirmDialog";

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return "hoje";
  if (diff < 2 * day) return "ontem";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days} dias atrás`;
  return d.toLocaleDateString("pt-BR");
}

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,30}$/;

function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]+/g, "")
    .slice(0, 31);
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const list = await listUsers();
      setUsers(list);
      setError(null);
    } catch (e) {
      const msg = errorMessage(e);
      setError(msg);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await createUser({
        username: form.username.trim(),
        password: form.password,
      });
      setUsers((prev) =>
        [...(prev ?? []).filter((u) => u.id !== created.id), { ...created, last_sign_in_at: null, is_self: false }].sort(
          (a, b) => a.username.localeCompare(b.username, "pt-BR")
        )
      );
      toast.success(`Usuário ${created.username} criado`, {
        description: `Senha: ${form.password} — envie pra pessoa por canal seguro.`,
        duration: 12_000,
      });
      setForm({ username: "", password: "" });
      setCreating(false);
    } catch (e) {
      const msg = errorMessage(e);
      toast.error("Falha ao criar usuário", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(user: AdminUser) {
    try {
      await deleteUser(user.id);
      setUsers((prev) => (prev ?? []).filter((u) => u.id !== user.id));
      toast.success(`${user.email} removido`);
    } catch (e) {
      const msg = errorMessage(e);
      toast.error("Falha ao remover", { description: msg });
      throw e;
    }
  }

  function generatePassword() {
    const chars =
      "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
    let out = "";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
    setForm((f) => ({ ...f, password: out }));
    setShowPwd(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
            Usuários
          </h2>
          <p className="text-[#7c695d] text-[14px] mt-1">
            {users === null
              ? "Carregando…"
              : `${users.length} ${users.length === 1 ? "pessoa" : "pessoas"} com acesso ao admin do Broadside`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] text-[#0d0904] font-bold text-[14px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#7dbf44]/30"
        >
          + Novo usuário
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-[13px]">
          <strong>Erro carregando usuários:</strong> {error}
        </div>
      )}

      {users === null ? (
        <UsersSkeleton />
      ) : (
        <motion.ul layout className="space-y-2">
          <AnimatePresence initial={false}>
            {users.map((u) => (
              <motion.li
                key={u.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="bg-white border border-[#7c695d]/15 rounded-xl p-3 sm:p-4 flex items-center gap-3 hover:border-[#7c695d]/30 hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-bold"
                  style={{ backgroundColor: stringToColor(u.username) }}
                  aria-hidden
                >
                  {u.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#1a1208] truncate text-[14px]">
                      {u.username}
                    </span>
                    {u.is_self && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#7dbf44]/20 text-[#3a6a1c]">
                        você
                      </span>
                    )}
                    {u.email?.includes("@") && !u.email.endsWith("@broadside.local") && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#7c695d]/10 text-[#7c695d]">
                        email
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-[11.5px] text-[#7c695d]/70 mt-0.5">
                    <span>criado {relativeDate(u.created_at)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      último login{" "}
                      {u.last_sign_in_at ? relativeDate(u.last_sign_in_at) : "nunca"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(u)}
                  disabled={u.is_self}
                  aria-label="Revogar acesso"
                  title={u.is_self ? "Você não pode revogar seu próprio acesso" : "Revogar acesso"}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <AnimatePresence>
        {creating && (
          <motion.div
            className="fixed inset-0 bg-[#0d0904]/55 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && setCreating(false)}
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Novo usuário"
              className="bg-white rounded-2xl max-w-[440px] w-full p-6 sm:p-8 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.35)] max-h-[calc(100vh-2rem)] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <h3 className="font-bold text-[#1a1208] text-[20px] mb-1">
                Novo usuário
              </h3>
              <p className="text-[#7c695d] text-[13px] mb-5">
                A pessoa entra com este nome de usuário + a senha que você definir.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="newUsername" className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
                    Nome de usuário
                  </label>
                  <input
                    id="newUsername"
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="off"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: normalizeUsername(e.target.value) })}
                    placeholder="ex: maria, joao.silva, equipe-2026"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#7c695d]/25 font-mono text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
                    autoFocus
                  />
                  <p className="text-[#7c695d]/60 text-[11px] mt-1">
                    Só letras, números, ponto, traço ou underline. 2 a 31 caracteres.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="newPwd" className="block text-[13px] font-medium text-[#7c695d]">
                      Senha (mínimo 8 caracteres)
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[12px] text-[#7dbf44] hover:underline font-medium"
                    >
                      Gerar senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="newPwd"
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[#7c695d]/25 font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#7c695d] hover:bg-[#7c695d]/10"
                    >
                      {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  disabled={busy}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#7c695d]/25 text-[#7c695d] font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy || !USERNAME_RE.test(form.username) || form.password.length < 8}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#7dbf44] hover:bg-[#6ba838] disabled:opacity-40 disabled:cursor-not-allowed text-[#0d0904] font-bold transition-colors"
                >
                  {busy ? "Criando…" : "Criar usuário"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title={`Revogar acesso de ${confirmDelete?.email ?? ""}?`}
        description="A pessoa perde acesso ao admin do Broadside imediatamente. A conta dela no Supabase continua existindo (pode ser usada em outros apps do mesmo projeto). Você pode dar acesso de novo recriando aqui."
        confirmLabel="Revogar acesso"
        tone="danger"
        onConfirm={async () => {
          if (confirmDelete) await doDelete(confirmDelete);
        }}
      />
    </div>
  );
}

function UsersSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="bg-white border border-[#7c695d]/15 rounded-xl p-4 flex items-center gap-3"
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

function stringToColor(s: string): string {
  // Paleta natural (mesma vibe do projeto)
  const palette = ["#765827", "#7dbf44", "#3a6a1c", "#a07a3a", "#7c695d", "#3D5527"];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.93 10.93 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
