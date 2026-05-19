import type { Dispatch, SetStateAction } from "react";
import type { AdminState, AdminSettings as AdminSettingsType } from "./types";

type Props = {
  state: AdminState;
  setState: Dispatch<SetStateAction<AdminState>>;
};

export function AdminSettings({ state, setState }: Props) {
  function update<K extends keyof AdminSettingsType>(key: K, value: AdminSettingsType[K]) {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, [key]: value },
    }));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seedcare-admin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!confirm("Substituir todo o estado atual?")) return;
        setState(parsed);
      } catch (e) {
        alert("JSON inválido.");
      }
    };
    input.click();
  }

  function resetAll() {
    if (!confirm("Apagar TODOS os dados do admin? Essa ação não tem volta.")) return;
    localStorage.removeItem("seedcare_admin_state_v1");
    location.reload();
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Configurações
        </h2>
      </header>

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5 space-y-4">
        <h3 className="font-bold text-[#1a1208] text-[16px]">Geral</h3>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            URL canônica base
          </label>
          <input
            type="url"
            value={state.settings.canonicalBaseUrl}
            onChange={(e) => update("canonicalBaseUrl", e.target.value)}
            placeholder="https://broadside.seedcare.syngenta.com.br"
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
          />
          <p className="text-[#7c695d]/60 text-[11px] mt-1">
            Usada nas meta tags <code>canonical</code> e <code>og:url</code>.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            Senha do gate (índice)
          </label>
          <input
            type="text"
            disabled
            value={state.settings.indexPasswordHint}
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/15 bg-[#f8f8f2] text-[#7c695d]/60 text-[13px]"
          />
          <p className="text-[#7c695d]/60 text-[11px] mt-1">
            Quando conectarmos o backend, a senha vira editável aqui.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5 space-y-4">
        <h3 className="font-bold text-[#1a1208] text-[16px]">Textos da página</h3>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            Hero — Seedcare
          </label>
          <textarea
            rows={2}
            value={state.settings.textSeedcareHero}
            onChange={(e) => update("textSeedcareHero", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            Hero — ESG
          </label>
          <textarea
            rows={2}
            value={state.settings.textEsgHero}
            onChange={(e) => update("textEsgHero", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            Callout — Seedcare
          </label>
          <textarea
            rows={3}
            value={state.settings.textSeedcareCallout}
            onChange={(e) => update("textSeedcareCallout", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#7c695d] mb-1.5">
            Callout — ESG
          </label>
          <textarea
            rows={3}
            value={state.settings.textEsgCallout}
            onChange={(e) => update("textEsgCallout", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5 space-y-4">
        <h3 className="font-bold text-[#1a1208] text-[16px]">Backup</h3>
        <p className="text-[#7c695d] text-[12px]">
          Exporte o estado pra um JSON pra você editar à mão e mandar pra mim,
          ou importe um JSON pra restaurar.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="px-4 py-2 rounded-lg bg-[#7c695d] hover:bg-[#5a4b3f] text-white text-[13px] font-medium"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={importJson}
            className="px-4 py-2 rounded-lg bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[13px] font-medium"
          >
            Importar JSON
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 text-[13px] font-medium ml-auto"
          >
            Apagar tudo
          </button>
        </div>
      </section>

      <div className="bg-[#7dbf44]/10 border border-[#7dbf44]/30 rounded-xl p-4 text-[13px] text-[#3a6a1c]">
        <strong>Desconectado</strong> — nada aqui mexe no site público ainda.
        Quando você liberar a Fase 2, ligamos o admin no backend.
      </div>
    </div>
  );
}
