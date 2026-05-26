// Cria o usuário admin do Supabase. Rode uma vez:
//
//   node --env-file=.env.local scripts/create-admin.mjs
//
// Usa a service_role key pra criar via API admin. Idempotente: se já existir,
// só atualiza a senha pra bater com o que está no script abaixo.

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "thalyson@merinno.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "seedcare2026";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  // Tenta listar pra ver se já existe (admin.listUsers retorna paginado).
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log(`Usuário ${ADMIN_EMAIL} já existe — atualizando senha + marcando como admin…`);
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { ...(existing.app_metadata ?? {}), app: "broadside" },
    });
    if (error) throw error;
    console.log("✅ Senha atualizada e marca app:broadside aplicada.");
    return;
  }

  console.log(`Criando ${ADMIN_EMAIL}…`);
  const { error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { app: "broadside" },
  });
  if (error) throw error;
  console.log(`✅ Admin criado.\n   email: ${ADMIN_EMAIL}\n   senha: ${ADMIN_PASSWORD}`);
}

main().catch((e) => {
  console.error("❌ Falhou:", e.message ?? e);
  process.exit(1);
});
