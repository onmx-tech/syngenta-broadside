// Vercel Function (Node runtime) — gestão de usuários admin.
//
// GET    /api/users               → lista users
// POST   /api/users               → cria user { email, password }
// DELETE /api/users?id=<uuid>     → deleta user
//
// Autorização: exige header `Authorization: Bearer <jwt>` de qualquer usuário
// autenticado no Supabase (modelo flat — quem entra no admin pode gerenciar
// outros). Verificação via supabase.auth.getUser(token).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Isolamento: só usuários com app_metadata.app === APP_KEY são considerados
// admins do Broadside. Outros usuários do projeto Supabase compartilhado não
// aparecem na listagem, não podem ser deletados daqui e — via RLS — não
// conseguem escrever nas tabelas broadside_*.
const APP_KEY = "broadside";

// Usuários criados pelo username vivem em email <username>@<INTERNAL_DOMAIN>.
// Supabase exige email mas como email_confirm=true, nada é enviado.
const INTERNAL_DOMAIN = "broadside.local";

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,30}$/;

function isBroadsideUser(u: { app_metadata?: Record<string, unknown> | null }): boolean {
  return ((u.app_metadata as Record<string, unknown> | null)?.app as string | undefined) === APP_KEY;
}

/** Resolve identifier (username ou email) pra email aceitável no Supabase Auth. */
function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${INTERNAL_DOMAIN}`;
}

/** Extrai "display name" do user pra UI — username quando interno, email quando externo. */
function displayName(email: string | null | undefined): string {
  if (!email) return "—";
  return email.endsWith(`@${INTERNAL_DOMAIN}`) ? email.slice(0, -INTERNAL_DOMAIN.length - 1) : email;
}

async function authorize(req: VercelRequest, res: VercelResponse): Promise<
  | { ok: true; userId: string; email: string; admin: SupabaseClient }
  | { ok: false }
> {
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    res.status(500).json({ error: "Server missing Supabase env vars." });
    return { ok: false };
  }

  const authHeader = req.headers["authorization"];
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader ?? "";
  const token = headerValue.toLowerCase().startsWith("bearer ")
    ? headerValue.slice(7).trim()
    : "";
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return { ok: false };
  }

  const validator = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await validator.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid token." });
    return { ok: false };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    ok: true,
    userId: data.user.id,
    email: data.user.email ?? "",
    admin,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authorize(req, res);
  if (!auth.ok) return;
  const { admin, userId: callerId } = auth;

  try {
    if (req.method === "GET") {
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (error) throw error;
      const users = data.users
        .filter(isBroadsideUser)
        .map((u) => ({
          id: u.id,
          username: displayName(u.email),
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          is_self: u.id === callerId,
        }))
        .sort((a, b) =>
          a.username.localeCompare(b.username, "pt-BR")
        );
      return res.status(200).json({ users });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? (JSON.parse(req.body || "{}") as { username?: string; email?: string; password?: string })
          : ((req.body ?? {}) as { username?: string; email?: string; password?: string });

      const identifier = (body.username ?? body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";

      if (!identifier) {
        return res.status(400).json({ error: "Usuário obrigatório." });
      }
      const hasAtSign = identifier.includes("@");
      if (!hasAtSign && !USERNAME_RE.test(identifier)) {
        return res.status(400).json({
          error: "Usuário deve ter 2-31 caracteres: letras, números, ponto, traço ou underline.",
        });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Senha deve ter pelo menos 8 caracteres." });
      }

      const email = resolveLoginEmail(identifier);

      // Se já existe no projeto (qualquer app), só promove ao Broadside.
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = existing.users.find((u) => u.email?.toLowerCase() === email);
      if (found) {
        if (isBroadsideUser(found)) {
          return res.status(409).json({ error: "Esse usuário já tem acesso." });
        }
        const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(
          found.id,
          {
            password,
            app_metadata: { ...(found.app_metadata ?? {}), app: APP_KEY },
            email_confirm: true,
          }
        );
        if (updErr) return res.status(400).json({ error: updErr.message });
        return res.status(200).json({
          user: {
            id: updated.user.id,
            username: displayName(updated.user.email),
            email: updated.user.email,
            created_at: updated.user.created_at,
          },
        });
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { app: APP_KEY },
      });
      if (error) {
        const status = /already/i.test(error.message) ? 409 : 400;
        return res.status(status).json({ error: error.message });
      }
      return res.status(201).json({
        user: {
          id: data.user.id,
          username: displayName(data.user.email),
          email: data.user.email,
          created_at: data.user.created_at,
        },
      });
    }

    if (req.method === "DELETE") {
      const id =
        typeof req.query.id === "string"
          ? req.query.id
          : Array.isArray(req.query.id)
            ? req.query.id[0]
            : "";
      if (!id) return res.status(400).json({ error: "Missing id query param." });
      if (id === callerId) {
        return res.status(400).json({ error: "Você não pode excluir sua própria conta." });
      }

      // Safety: só "tira o acesso" — não apaga do projeto (poderia afetar
      // outras apps no mesmo Supabase). Remove a marca `broadside`.
      const { data: target, error: getErr } = await admin.auth.admin.getUserById(id);
      if (getErr || !target?.user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      if (!isBroadsideUser(target.user)) {
        return res.status(403).json({ error: "Usuário não pertence ao Broadside." });
      }
      const nextMeta = { ...(target.user.app_metadata ?? {}) };
      delete (nextMeta as Record<string, unknown>).app;
      const { error: updErr } = await admin.auth.admin.updateUserById(id, {
        app_metadata: nextMeta,
      });
      if (updErr) return res.status(400).json({ error: updErr.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: message });
  }
}
