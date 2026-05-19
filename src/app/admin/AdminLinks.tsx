import { useState, type Dispatch, type SetStateAction } from "react";
import {
  ADMIN_BLOCK_KEYS,
  ADMIN_BLOCK_LABELS,
  type AdminBlockKey,
  type AdminState,
  type AdminVariant,
} from "./types";

type Props = {
  state: AdminState;
  setState: Dispatch<SetStateAction<AdminState>>;
};

export function AdminLinks({ state, setState }: Props) {
  const [active, setActive] = useState<AdminVariant>("seedcare");

  function update(key: AdminBlockKey, url: string) {
    setState((s) => ({
      ...s,
      links: {
        ...s.links,
        [active]: { ...s.links[active], [key]: url },
      },
    }));
  }

  function copyAll() {
    setState((s) => {
      const other: AdminVariant = active === "seedcare" ? "esg" : "seedcare";
      return {
        ...s,
        links: { ...s.links, [other]: { ...s.links[active] } },
      };
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Links dos blocos
        </h2>
        <p className="text-[#7c695d] text-[14px] mt-1">
          URL pra qual cada um dos 8 cards leva ao ser clicado.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex bg-[#7c695d]/10 rounded-xl p-1">
          {(["seedcare", "esg"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActive(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                active === v
                  ? "bg-white text-[#1a1208] shadow-sm"
                  : "text-[#7c695d]"
              }`}
            >
              {v === "seedcare" ? "Seedcare" : "ESG"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="text-[13px] text-[#7c695d] hover:text-[#1a1208] underline underline-offset-2"
        >
          Copiar pra variante {active === "seedcare" ? "ESG" : "Seedcare"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#7c695d]/15 divide-y divide-[#7c695d]/10">
        {ADMIN_BLOCK_KEYS.map((key) => (
          <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="sm:w-48 shrink-0">
              <p className="font-medium text-[#1a1208] text-[14px]">
                {ADMIN_BLOCK_LABELS[key]}
              </p>
              <p className="text-[#7c695d]/60 text-[11px] font-mono">{key}</p>
            </div>
            <input
              type="url"
              placeholder="https://..."
              value={state.links[active][key]}
              onChange={(e) => update(key, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#7c695d]/25 bg-[#f8f8f2] text-[#1a1208] placeholder:text-[#7c695d]/40 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:bg-white"
            />
          </div>
        ))}
      </div>

      <div className="bg-[#7dbf44]/10 border border-[#7dbf44]/30 rounded-xl p-4 text-[13px] text-[#3a6a1c]">
        <strong>Não conectado</strong> — esses links ainda não substituem os do código. Estão sendo salvos só no navegador (localStorage).
      </div>
    </div>
  );
}
