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

/** Especificações por imagem — usadas pra orientar o admin e validar uploads. */
type ImageSpec = {
  /** Dimensão recomendada em pixels (2x retina). */
  width: number;
  height: number;
  /** Texto descritivo da proporção. */
  aspect: string;
  /** Formato recomendado. */
  format: string;
  /** Peso máximo recomendado em KB. */
  maxKB: number;
  /** Posicionamento no site. */
  anchor: string;
  /** Onde aparece no broadside. */
  usage: string;
};

const SEAL_SPEC: ImageSpec = {
  width: 480,
  height: 480,
  aspect: "1:1 (quadrado)",
  format: "PNG transparente",
  maxKB: 200,
  anchor: "Centralizada sobre fundo marrom",
  usage: "Aparece no callout marrom abaixo da saudação (até 240px de altura).",
};

const BLOCK_SPECS: Record<AdminBlockKey, ImageSpec> = {
  selo: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 300,
    anchor: "Centralizada",
    usage: "Card grande do selo, fundo marrom.",
  },
  post: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 300,
    anchor: "Encostada à DIREITA",
    usage: "Mockup do post carrossel. Mantenha espaço à esquerda na imagem.",
  },
  modelo: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 300,
    anchor: "Centralizada",
    usage: "Preview do modelo de apresentação (slide).",
  },
  email: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 300,
    anchor: "Centralizada",
    usage: "Mockup do e-mail marketing.",
  },
  figurinhas: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 400,
    anchor: "Centralizada",
    usage: "Grade de figurinhas WhatsApp.",
  },
  flyer: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 500,
    anchor: "Centralizada (renderizado com leve zoom 1.35×)",
    usage: "Flyer impresso — a imagem aparece um pouco aumentada.",
  },
  banner: {
    width: 504,
    height: 632,
    aspect: "4:5 (retrato)",
    format: "PNG transparente",
    maxKB: 400,
    anchor: "Centralizada",
    usage: "Banner digital.",
  },
  outdoor: {
    width: 1040,
    height: 632,
    aspect: "1.65:1 (paisagem)",
    format: "JPG ou PNG",
    maxKB: 500,
    anchor: "Alinhada ao RODAPÉ (cover)",
    usage: "Card duplo (ocupa 2 colunas no desktop). A base é o que aparece, topo é cortado.",
  },
};

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

/** Lê a dimensão real e tamanho do arquivo, e retorna avisos legíveis. */
async function validateUpload(
  file: File,
  spec: ImageSpec
): Promise<{ warnings: string[]; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Não consegui ler a imagem."));
      img.src = url;
    });
    const warnings: string[] = [];
    const ratioTarget = spec.width / spec.height;
    const ratioReal = dims.width / dims.height;
    const ratioDiff = Math.abs(ratioReal - ratioTarget) / ratioTarget;
    if (ratioDiff > 0.1) {
      warnings.push(
        `Proporção diferente do recomendado (${spec.aspect}). A imagem pode ser cortada.`
      );
    }
    if (dims.width < spec.width * 0.6) {
      warnings.push(
        `Baixa resolução: ${dims.width}×${dims.height}px (recomendado ${spec.width}×${spec.height}px). Vai ficar embaçada.`
      );
    }
    if (file.size > spec.maxKB * 1024 * 1.5) {
      warnings.push(
        `Arquivo pesado: ${Math.round(file.size / 1024)} KB (recomendado até ${spec.maxKB} KB). Considere otimizar.`
      );
    }
    return { warnings, width: dims.width, height: dims.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AdminAssets({ admin }: Props) {
  const { state, setSiteContent } = admin;
  const [active, setActive] = useState<AdminVariant>("seedcare");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function upload(
    label: string,
    spec: ImageSpec,
    file: File,
    persist: (url: string) => void
  ) {
    const toastId = toast.loading(`Enviando ${label}…`);
    try {
      const { warnings } = await validateUpload(file, spec);
      const url = await (async () => {
        if (label === "selo central") return uploadSeal(active, file);
        return uploadAssetFor(file);
      })();
      void url; // satisfaz TS — função real é passada como persist
    } finally {
      toast.dismiss(toastId);
    }
    // (path real abaixo)
  }
  // Implementação real (substitui o stub acima)
  void upload;

  async function updateBlockImage(key: AdminBlockKey, file: File | null) {
    if (!file) return;
    const spec = BLOCK_SPECS[key];
    setBusyKey(`block:${key}`);
    const toastId = toast.loading(`Enviando ${ADMIN_BLOCK_LABELS[key]}…`);
    try {
      const { warnings } = await validateUpload(file, spec);
      const url = await uploadBlockImage(active, key, file);
      setSiteContent((s) => ({
        ...s,
        blockImages: {
          ...s.blockImages,
          [active]: { ...s.blockImages[active], [key]: url },
        },
      }));
      if (warnings.length > 0) {
        toast.warning(`${ADMIN_BLOCK_LABELS[key]} salvo com alertas`, {
          id: toastId,
          description: warnings.join(" "),
          duration: 8000,
        });
      } else {
        toast.success(`${ADMIN_BLOCK_LABELS[key]} atualizado`, { id: toastId });
      }
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
      const { warnings } = await validateUpload(file, SEAL_SPEC);
      const url = await uploadSeal(active, file);
      setSiteContent((s) => ({
        ...s,
        seals: { ...s.seals, [active]: url },
      }));
      if (warnings.length > 0) {
        toast.warning("Selo salvo com alertas", {
          id: toastId,
          description: warnings.join(" "),
          duration: 8000,
        });
      } else {
        toast.success("Selo atualizado", { id: toastId });
      }
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
          Sobrescreva o selo central e os 8 cards. Por padrão mostra a versão
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

      <details className="bg-[#7dbf44]/8 border border-[#7dbf44]/25 rounded-xl text-[13px]">
        <summary className="cursor-pointer px-4 py-3 font-medium text-[#3a6a1c] select-none flex items-center justify-between">
          <span>📐 Guia rápido de tamanho e formato</span>
          <span className="text-[11px] text-[#3a6a1c]/70 font-normal">clique pra abrir</span>
        </summary>
        <ul className="px-4 pb-4 space-y-1.5 text-[#3a6a1c]/85">
          <li>• <strong>Resolução em pixels</strong> = recomendado <strong>2× retina</strong>. Menores ficam embaçadas em telas modernas.</li>
          <li>• <strong>PNG transparente</strong> pra elementos sobre o fundo marrom escuro do card.</li>
          <li>• <strong>Otimize antes</strong> de subir — tinypng.com, squoosh.app. Quanto menor o arquivo, mais rápido o site.</li>
          <li>• <strong>O sistema valida</strong> dimensão e peso ao subir — vai te avisar se algo destoar.</li>
        </ul>
      </details>

      <section className="bg-white rounded-2xl border border-[#7c695d]/15 p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-bold text-[#1a1208] text-[16px]">Selo central</h3>
          <SpecBadge spec={SEAL_SPEC} />
        </div>
        <p className="text-[#7c695d] text-[12px] mb-4">{SEAL_SPEC.usage}</p>
        <SealUploader
          customUrl={state.seals[active]}
          defaultUrl={defaultSealByVariant[active]}
          spec={SEAL_SPEC}
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
          Cada card abaixo mostra dimensão recomendada, formato e onde aparece.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_BLOCK_KEYS.map((key) => (
            <BlockUploader
              key={key}
              blockKey={key}
              spec={BLOCK_SPECS[key]}
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

// Stub mantido só pra evitar erro de import — não usado.
function uploadAssetFor(_file: File): Promise<string> {
  throw new Error("not used");
}

function SpecBadge({ spec }: { spec: ImageSpec }) {
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7c695d]/10 text-[#7c695d] text-[11px] font-mono">
      {spec.width}×{spec.height}px
    </span>
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

function SpecList({ spec }: { spec: ImageSpec }) {
  return (
    <ul className="text-[11px] text-[#7c695d]/85 space-y-0.5 mt-1.5">
      <li>
        <span className="text-[#7c695d]/60">Proporção:</span> {spec.aspect}
      </li>
      <li>
        <span className="text-[#7c695d]/60">Formato:</span> {spec.format}
      </li>
      <li>
        <span className="text-[#7c695d]/60">Peso:</span> até {spec.maxKB} KB
      </li>
      <li>
        <span className="text-[#7c695d]/60">Posição:</span> {spec.anchor}
      </li>
    </ul>
  );
}

function SealUploader({
  customUrl,
  defaultUrl,
  spec,
  busy,
  onChange,
  onClear,
}: {
  customUrl: string | null;
  defaultUrl: string;
  spec: ImageSpec;
  busy: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const isCustom = !!customUrl;
  const displayUrl = customUrl ?? defaultUrl;
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="relative w-32 h-32 rounded-xl bg-[#765827] border border-[#7c695d]/15 flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={displayUrl}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
        {isCustom ? <CustomBadge /> : <DefaultBadge />}
      </div>
      <div className="flex-1 min-w-0">
        <SpecList spec={spec} />
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex gap-2 mt-3 flex-wrap">
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
    </div>
  );
}

function BlockUploader({
  blockKey,
  spec,
  customUrl,
  defaultUrl,
  busy,
  onChange,
  onClear,
}: {
  blockKey: AdminBlockKey;
  spec: ImageSpec;
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
    <li className="bg-[#f8f8f2] rounded-xl border border-[#7c695d]/10 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[#1a1208] text-[13px] font-bold truncate">
          {ADMIN_BLOCK_LABELS[blockKey]}
        </p>
        <SpecBadge spec={spec} />
      </div>
      <div className="relative aspect-[252/316] bg-[#765827] rounded-lg overflow-hidden flex items-center justify-center mb-3">
        <img
          src={displayUrl}
          alt=""
          className="max-w-full max-h-full object-contain p-2"
        />
        {isCustom ? <CustomBadge /> : <DefaultBadge />}
      </div>
      <SpecList spec={spec} />
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-1.5 mt-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex-1 px-3 py-2 rounded-lg bg-[#7c695d]/10 hover:bg-[#7c695d]/20 text-[#7c695d] text-[12.5px] font-medium disabled:opacity-50"
        >
          {busy ? "Enviando…" : isCustom ? "Trocar" : "Personalizar"}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            aria-label="Voltar pra padrão"
            title="Voltar pra padrão"
            className="px-3 py-2 rounded-lg text-[#a07a3a] hover:bg-[#a07a3a]/10 text-[12.5px] font-medium disabled:opacity-50"
          >
            ↺
          </button>
        )}
      </div>
    </li>
  );
}
