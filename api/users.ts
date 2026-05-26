// Vercel Function (Node runtime) — gestão de usuários admin.
//
// GET    /api/users               → lista users
// POST   /api/users               → cria user { email, password }
// DELETE /api/users?id=<uuid>     → deleta user
//
// Autorização: exige header `Authorization: Bearer <jwt>` de qualquer usuário
// autenticado no Supabase (modelo flat — quem entra no admin pode gerenciar
// outros usuários). Verificação feita via supabase.auth.getUser(token).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(body: unknown, init: number | ResponseInit = 200): Response {
  const status = typeof init === "number" ? init : init?.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function authorize(req: Request): Promise<
  | { ok: true; userId: string; email: string; admin: SupabaseClient }
  | { ok: false; res: Response }
> {
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    return {
      ok: false,
      res: json({ error: "Server missing Supabase env vars." }, 500),
    };
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (!token) {
    return { ok: false, res: json({ error: "Missing bearer token." }, 401) };
  }

  // Valida o token com a anon key (sem persistência).
  const validator = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await validator.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, res: json({ error: "Invalid token." }, 401) };
  }

  // Cliente admin com service_role (server-side apenas).
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

export default async function handler(req: Request): Promise<Response> {
  const auth = await authorize(req);
  if (!auth.ok) return auth.res;
  const { admin, userId: callerId } = auth;

  try {
    if (req.method === "GET") {
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error) throw error;
      const users = data.users
        .map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          is_self: u.id === callerId,
        }))
        .sort((a, b) =>
          (a.email ?? "").localeCompare(b.email ?? "", "pt-BR")
        );
      return json({ users });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({})) as {
        email?: string;
        password?: string;
      };
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";
      if (!email || !email.includes("@")) {
        return json({ error: "Email inválido." }, 400);
      }
      if (password.length < 8) {
        return json({ error: "Senha deve ter pelo menos 8 caracteres." }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        const status = /already/i.test(error.message) ? 409 : 400;
        return json({ error: error.message }, status);
      }
      return json({
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
      }, 201);
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "Missing id query param." }, 400);
      if (id === callerId) {
        return json({ error: "Você não pode excluir sua própria conta." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed." }, 405);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
}
