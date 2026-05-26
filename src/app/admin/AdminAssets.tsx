import { useRef, useState } from "react";
import {
  ADMIN_BLOCK_KEYS,
  ADMIN_BLOCK_LABELS,
  type AdminBlockKey,
  type AdminVariant,
} from "./types";
import { uploadBlockImage, uploadSeal, type UseAdminState } from "./storage";

type Props = { admin: UseAdminState };

export function AdminAssets({ admin }: Props) {
  const { state, setSiteContent } = admin;
  const [active, setActive] = useState<AdminVariant>("seedcare");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function updateBlockImage(key: AdminBlockKey, file: File | null) {
    if (!file) return;
    setBusyKey(`block:${key}`);
    try {
      const url = await uploadBlockImage(active, key, file);
      setSiteContent((s) => ({
        ...s,
        blockImages: {
          ...s.blockImages,
          [active]: { ...s.blockImages[active], [key]: url },
        },
      }));
    } catch (e) {
      alert(`Falha no upload: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyKey(null);
    }
  }

  function clearBlockImage(key: AdminBlockKey) {
    setSiteContent((s) => {
      const next = { ...s.blockImages[active] };
      delete next[key];
      return {
        ...s,
        blockImages: { ...s.blockImages, [active]: next },
      };
    });
  }

  async function updateSeal(file: File | null) {
    if (!file) return;
    setBusyKey("seal");
    try {
      const url = await uploadSeal(active, file);
      setSiteContent((s) => ({
        ...s,
        seals: { ...s.seals, [active]: url },
      }));
    } catch (e) {
      alert(`Falha no upload: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyKey(null);
    }
  }

  function clearSeal() {
    setSiteContent((s) => ({
      ...s,
      seals: { ...s.seals, [active]: null },
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Imagens
        </h2>
        <p className="text-[#7c695d] text-[14px] mt-1">
          Imagens dos cards e do selo central, por variante.
        </p>
      </header>

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

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5">
        <h3 className="font-bold text-[#1a1208] text-[16px] mb-1">
          Selo central
        </h3>
        <p className="text-[#7c695d] text-[12px] mb-4">
          Aparece no callout marrom logo abaixo da saudação.
        </p>
        <SealUploader
          url={state.seals[active]}
          busy={busyKey === "seal"}
          onChange={updateSeal}
          onClear={clearSeal}
        />
      </section>

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5">
        <h3 className="font-bold text-[#1a1208] text-[16px] mb-1">
          Cards (8 imagens)
        </h3>
        <p className="text-[#7c695d] text-[12px] mb-4">
          Cada um dos cards da grade. Recomendado PNG transparente.
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ADMIN_BLOCK_KEYS.map((key) => (
            <BlockUploader
              key={key}
              blockKey={key}
              url={state.blockImages[active][key] ?? null}
              busy={busyKey === `block:${key}`}
              onChange={(file) => updateBlockImage(key, file)}
              onClear={() => clearBlockImage(key)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function SealUploader({
  url,
  busy,
  onChange,
  onClear,
}: {
  url: string | null;
  busy: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-xl bg-[#765827] border border-[#7c695d]/15 flex items-center justify-center overflow-hidden shrink-0">
        {url ? (
          <img
            src={url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-white/40 text-[10px]">vazio</span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="px-3 py-2 rounded-lg bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[13px] font-medium disabled:opacity-50"
        >
          {busy ? "Enviando…" : url ? "Trocar" : "Enviar"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-[13px] font-medium disabled:opacity-50"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

function BlockUploader({
  blockKey,
  url,
  busy,
  onChange,
  onClear,
}: {
  blockKey: AdminBlockKey;
  url: string | null;
  busy: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <li className="bg-[#f8f8f2] rounded-xl border border-[#7c695d]/10 p-3">
      <p className="text-[#1a1208] text-[12px] font-medium mb-2 truncate">
        {ADMIN_BLOCK_LABELS[blockKey]}
      </p>
      <div className="aspect-[252/316] bg-[#765827] rounded-lg overflow-hidden flex items-center justify-center mb-2">
        {url ? (
          <img
            src={url}
            alt=""
            className="max-w-full max-h-full object-contain p-2"
          />
        ) : (
          <span className="text-white/40 text-[10px]">vazio</span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex-1 px-2 py-1.5 rounded-md bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[11px] font-medium disabled:opacity-50"
        >
          {busy ? "…" : url ? "Trocar" : "Enviar"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="px-2 py-1.5 rounded-md text-red-600 hover:bg-red-50 text-[11px] font-medium disabled:opacity-50"
          >
            ×
          </button>
        )}
      </div>
    </li>
  );
}
