import { useMemo, useState } from "react";
import { companies, type Variant } from "../../data/companies";
import imgHeader from "../../imports/SySeedcareBroadsidePreview/3a986b7adf9d5b37201789977d57a957178e3cf0.png";

const variantLabel: Record<Variant, string> = {
  seedcare: "Seedcare",
  esg: "ESG",
};

const variantBadge: Record<Variant, string> = {
  seedcare: "bg-[#765827] text-[#fffeeb]",
  esg: "bg-[#7dbf44] text-[#0b3318]",
};

export function CompanyIndex() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Variant>("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/?broadside=${slug}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedSlug(slug);
      setTimeout(() => {
        setCopiedSlug((cur) => (cur === slug ? null : cur));
      }, 1800);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q);
      const matchesV = filter === "all" || c.variant === filter;
      return matchesQ && matchesV;
    });
  }, [query, filter]);

  return (
    <div className="min-h-screen w-full bg-[#f8f8f2]">
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="bg-white">
          <img
            src={imgHeader}
            alt="Seedcare Syngenta"
            width={900}
            height={88}
            decoding="async"
            fetchPriority="high"
            className="w-full h-auto block"
          />
        </header>

        <div className="px-6 sm:px-10 md:px-14 py-8 sm:py-10">
          <h1 className="font-['Inter',sans-serif] font-bold text-[#7c695d] text-[26px] sm:text-[32px] mb-2">
            Broadsides Seedcare
          </h1>
          <p className="font-['Inter',sans-serif] text-[#7c695d] text-[15px] sm:text-[17px] mb-6 sm:mb-8">
            Selecione uma empresa para visualizar o broadside personalizado.
            {" "}
            <span className="text-[#7c695d]/70">
              ({companies.length} empresas)
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
            <input
              type="search"
              placeholder="Buscar empresa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#7c695d]/20 bg-white text-[#7c695d] placeholder:text-[#7c695d]/50 font-['Inter',sans-serif] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#7dbf44]"
            />
            <div className="flex gap-2">
              {(["all", "seedcare", "esg"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl font-['Inter',sans-serif] font-medium text-[14px] transition-colors ${
                    filter === f
                      ? "bg-[#7c695d] text-white"
                      : "bg-white text-[#7c695d] border border-[#7c695d]/20 hover:bg-[#7c695d]/5"
                  }`}
                >
                  {f === "all"
                    ? "Todas"
                    : f === "seedcare"
                    ? "Seedcare"
                    : "ESG"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-[#7c695d]/70 py-12 font-['Inter',sans-serif]">
              Nenhuma empresa encontrada.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((company) => {
                const isCopied = copiedSlug === company.slug;
                return (
                  <li key={company.slug} className="relative group">
                    <a
                      href={`/?broadside=${company.slug}`}
                      className="block bg-white rounded-2xl border border-[#7c695d]/15 hover:border-[#7dbf44] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#7dbf44] overflow-hidden"
                    >
                      <div className="aspect-[4/3] w-full flex items-center justify-center p-4 sm:p-5 bg-white">
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          loading="lazy"
                          decoding="async"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="px-3 py-3 border-t border-[#7c695d]/10 flex items-center justify-between gap-2">
                        <span className="font-['Inter',sans-serif] font-medium text-[13px] sm:text-[14px] text-[#7c695d] truncate">
                          {company.name}
                        </span>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            variantBadge[company.variant]
                          }`}
                        >
                          {variantLabel[company.variant]}
                        </span>
                      </div>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyLink(company.slug);
                      }}
                      aria-label={`Copiar link de ${company.name}`}
                      title={isCopied ? "Copiado!" : "Copiar link"}
                      className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#7dbf44] ${
                        isCopied
                          ? "bg-[#7dbf44] text-white"
                          : "bg-white/90 text-[#7c695d] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:bg-[#7dbf44] hover:text-white shadow-sm"
                      }`}
                    >
                      {isCopied ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
