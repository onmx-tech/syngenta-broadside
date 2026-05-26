// Client da Vercel Function /api/users (CRUD de usuários admin).

import { supabase } from "./supabase";

export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_self: boolean;
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada — faça login de novo.");
  return { Authorization: `Bearer ${token}` };
}

async function jsonOrThrow(res: Response): Promise<any> {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* not json */
  }
  if (!res.ok) {
    const msg = body?.error ?? res.statusText ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/users", { headers: await authHeader() });
  const { users } = (await jsonOrThrow(res)) as { users: AdminUser[] };
  return users;
}

export async function createUser(input: {
  email: string;
  password: string;
}): Promise<AdminUser> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { ...(await authHeader()), "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await jsonOrThrow(res);
  return data.user as AdminUser;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  await jsonOrThrow(res);
}
