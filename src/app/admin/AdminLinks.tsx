import type { AdminVariant } from "./types";
import type { UseAdminState } from "./storage";

type Props = { admin: UseAdminState };

const FIELDS: { variant: AdminVariant; label: string; placeholder: string }[] = [
  {
    variant: "seedcare",
    label: "Pacote Seedcare",
    placeholder: "https://drive.google.com/drive/folders/...",
  },
  {
    variant: "esg",
    label: "Pacote ESG",
    placeholder: "https://drive.google.com/drive/folders/...",
  },
];

export function AdminLinks({ admin }: Props) {
  const { state, setSiteContent } = admin;

  function update(variant: AdminVariant, url: string) {
    setSiteContent((s) => ({
      ...s,
      downloadLinks: { ...s.downloadLinks, [variant]: url },
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-[#1a1208] text-[22px] sm:text-[26px]">
          Links de download
        </h2>
        <p className="text-[#7c695d] text-[14px] mt-1">
          URL do Drive de cada pacote.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-[#7c695d]/15 divide-y divide-[#7c695d]/10">
        {FIELDS.map(({ variant, label, placeholder }) => {
          const value = state.downloadLinks[variant];
          const showHttpsHint =
            value.trim() !== "" && !value.startsWith("https://");
          return (
            <div
              key={variant}
              className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <div className="sm:w-48 shrink-0">
                <p className="font-medium text-[#1a1208] text-[14px]">
                  {label}
                </p>
                <p className="text-[#7c695d]/60 text-[11px] font-mono">
                  {variant}
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="url"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => update(variant, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#7c695d]/25 bg-[#f8f8f2] text-[#1a1208] placeholder:text-[#7c695d]/40 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#7dbf44] focus:bg-white"
                />
                {showHttpsHint ? (
                  <p className="text-[#a07a3a] text-[11px]">
                    Sugerimos URL começando com <code>https://</code>
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#7c695d]/5 border border-[#7c695d]/15 rounded-xl p-4 text-[13px] text-[#7c695d]">
        O link aparece no botão “Baixar tudo” na barra inferior do broadside de
        cada empresa.
      </div>
    </div>
  );
}
