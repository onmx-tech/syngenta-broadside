import type { AdminSettings as AdminSettingsType } from "./types";
import type { UseAdminState } from "./storage";

type Props = { admin: UseAdminState };

export function AdminSettings({ admin }: Props) {
  const { state, setSiteContent, reload } = admin;

  function update<K extends keyof AdminSettingsType>(key: K, value: AdminSettingsType[K]) {
    setSiteContent((s) => ({
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
            A senha do gate público continua no código (componente PasswordGate).
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
          Exporta o estado atual em JSON pra arquivo.
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
            onClick={reload}
            className="px-4 py-2 rounded-lg bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[13px] font-medium"
          >
            Recarregar do banco
          </button>
        </div>
      </section>
    </div>
  );
}
