import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_BLOCK_KEYS,
  ADMIN_BLOCK_LABELS,
  type AdminBlockKey,
  type AdminVariant,
} from "./types";
import { uploadBlockImage, uploadSeal, type UseAdminState } from "./storage";
import { errorMessage } from "../../lib/errors";
import { blocks as defaultBlocks } from "../../data/blocks";
import imgSeloSeedcare from "../../assets/blocks/logo_excelencia_seedcare.png";
import imgSeloEsg from "../../assets/blocks/logo_excelencia_seedcare_esg.png";

type Props = { admin: UseAdminState };

const defaultSealByVariant: Record<AdminVariant, string> = {
  seedcare: imgSeloSeedcare,
  esg: imgSeloEsg,
};

const defaultBlockImageByVariant: Record<AdminVariant, Record<AdminBlockKey, string>> = {
  seedcare: defaultBlocks.reduce((acc, b) => {
    acc[b.key as AdminBlockKey] = b.images.seedcare;
    return acc;
  }, {} as Record<AdminBlockKey, string>),
  esg: defaultBlocks.reduce((acc, b) => {
    acc[b.key as AdminBlockKey] = b.images.esg;
    return acc;
  }, {} as Record<AdminBlockKey, string>),
};

export function AdminAssets({ admin }: Props) {
  const { state, setSiteContent } = admin;
  const [active, setActive] = useState<AdminVariant>("seedcare");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function updateBlockImage(key: AdminBlockKey, file: File | null) {
    if (!file) return;
    setBusyKey(`block:${key}`);
    const toastId = toast.loading(`Enviando ${ADMIN_BLOCK_LABELS[key]}…`);
    try {
      const url = await uploadBlockImage(active, key, file);
      setSiteContent((s) => ({
        ...s,
        blockImages: {
          ...s.blockImages,
          [active]: { ...s.blockImages[active], [key]: url },
        },
      }));
      toast.success(`${ADMIN_BLOCK_LABELS[key]} atualizado`, { id: toastId });
    } catch (e) {
      toast.error("Falha no upload", {
        id: toastId,
        description: errorMessage(e),
      });
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
    toast.success("Voltou pra imagem padrão");
  }

  async function updateSeal(file: File | null) {
    if (!file) return;
    setBusyKey("seal");
    const toastId = toast.loading("Enviando selo…");
    try {
      const url = await uploadSeal(active, file);
      setSiteContent((s) => ({
        ...s,
        seals: { ...s.seals, [active]: url },
      }));
      toast.success("Selo atualizado", { id: toastId });
    } catch (e) {
      toast.error("Falha no upload", {
        id: toastId,
        description: errorMessage(e),
      });
    } finally {
      setBusyKey(null);
    }
  }

  function clearSeal() {
    setSiteContent((s) => ({
      ...s,
      seals: { ...s.seals, [active]: null },
    }));
    toast.success("Voltou pro selo padrão");
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Imagens
        </h2>
        <p className="text-[#7c695d] text-[14px] mt-1">
          Sobrescreva o selo central e os 8 cards. Por padrão, mostra a versão
          empacotada no site.
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
          customUrl={state.seals[active]}
          defaultUrl={defaultSealByVariant[active]}
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
              customUrl={state.blockImages[active][key] ?? null}
              defaultUrl={defaultBlockImageByVariant[active][key]}
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

function DefaultBadge() {
  return (
    <span
      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-white/85 text-[#7c695d] backdrop-blur"
      title="Imagem padrão do site (vinda do bundle). Envie pra sobrescrever."
    >
      padrão
    </span>
  );
}

function CustomBadge() {
  return (
    <span
      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#7dbf44]/95 text-[#0d0904] backdrop-blur"
      title="Imagem customizada — sobrescreve o padrão."
    >
      custom
    </span>
  );
}

function SealUploader({
  customUrl,
  defaultUrl,
  busy,
  onChange,
  onClear,
}: {
  customUrl: string | null;
  defaultUrl: string;
  busy: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const isCustom = !!customUrl;
  const displayUrl = customUrl ?? defaultUrl;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="relative w-24 h-24 rounded-xl bg-[#765827] border border-[#7c695d]/15 flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={displayUrl}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
        {isCustom ? <CustomBadge /> : <DefaultBadge />}
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
          {busy ? "Enviando…" : isCustom ? "Trocar" : "Personalizar"}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-[#a07a3a] hover:bg-[#a07a3a]/10 text-[13px] font-medium disabled:opacity-50"
          >
            Voltar padrão
          </button>
        )}
      </div>
    </div>
  );
}

function BlockUploader({
  blockKey,
  customUrl,
  defaultUrl,
  busy,
  onChange,
  onClear,
}: {
  blockKey: AdminBlockKey;
  customUrl: string | null;
  defaultUrl: string;
  busy: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const isCustom = !!customUrl;
  const displayUrl = customUrl ?? defaultUrl;
  return (
    <li className="bg-[#f8f8f2] rounded-xl border border-[#7c695d]/10 p-3">
      <p className="text-[#1a1208] text-[12px] font-medium mb-2 truncate">
        {ADMIN_BLOCK_LABELS[blockKey]}
      </p>
      <div className="relative aspect-[252/316] bg-[#765827] rounded-lg overflow-hidden flex items-center justify-center mb-2">
        <img
          src={displayUrl}
          alt=""
          className="max-w-full max-h-full object-contain p-2"
        />
        {isCustom ? <CustomBadge /> : <DefaultBadge />}
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
          {busy ? "…" : isCustom ? "Trocar" : "Personalizar"}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            aria-label="Voltar pra padrão"
            title="Voltar pra padrão"
            className="px-2 py-1.5 rounded-md text-[#a07a3a] hover:bg-[#a07a3a]/10 disabled:opacity-50"
          >
            ↺
          </button>
        )}
      </div>
    </li>
  );
}
