import { useEffect, useState } from "react";
import type { Variant } from "../../data/companies";

type Props = {
  variant: Variant;
  href: string;
};

const PALETTE: Record<Variant, { bg: string; cta: string }> = {
  seedcare: { bg: "#765827", cta: "#765827" },
  esg: { bg: "#3D5527", cta: "#3D5527" },
};

const COPY: Record<Variant, { title: string; cta: string; ariaName: string }> = {
  seedcare: {
    title: "Pacote Seedcare · Selo de Excelência",
    cta: "Baixar pacote Seedcare",
    ariaName: "Seedcare",
  },
  esg: {
    title: "Pacote ESG · Selo de Excelência",
    cta: "Baixar pacote ESG",
    ariaName: "ESG",
  },
};

const SUBLABEL =
  "Selo, post, modelo, e-mail, figurinhas, flyer, banner e outdoor";

export function DownloadBar({ variant, href }: Props) {
  const [visible, setVisible] = useState(false);
  const isEmpty = href.trim() === "";
  const palette = PALETTE[variant];
  const copy = COPY[variant];

  useEffect(() => {
    function update() {
      const y = window.scrollY;
      if (y > 150) {
        setVisible(true);
      } else if (y < 50) {
        setVisible(false);
      }
    }
    update();

    const fallbackTimer = window.setTimeout(() => {
      const doc = document.documentElement;
      if (doc.scrollHeight <= window.innerHeight + 10) {
        setVisible(true);
      }
    }, 400);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <aside
      role="complementary"
      aria-label={`Baixar materiais do pacote ${copy.ariaName}`}
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
      style={{
        backgroundColor: palette.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-10 py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 sm:min-h-[72px] min-h-[64px]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DownloadIcon className="w-5 h-5 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-['Inter',sans-serif] font-semibold text-white text-[14px] sm:text-[15px] leading-tight truncate">
              {copy.title}
            </p>
            <p className="hidden sm:block font-['Inter',sans-serif] text-white/70 text-[13px] leading-tight truncate mt-0.5">
              {SUBLABEL}
            </p>
          </div>
        </div>

        {isEmpty ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full sm:w-auto rounded-full bg-white px-5 py-2.5 font-['Inter',sans-serif] font-semibold text-[14px] cursor-not-allowed opacity-50"
            style={{ color: palette.cta }}
          >
            Materiais em breve
          </button>
        ) : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 font-['Inter',sans-serif] font-semibold text-[14px] hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-transparent transition-colors"
            style={{ color: palette.cta }}
          >
            {copy.cta}
            <DownloadIcon className="w-4 h-4" />
          </a>
        )}
      </div>
    </aside>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
