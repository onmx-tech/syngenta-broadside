import { lazy, Suspense, useEffect, useState } from "react";
import {
  bootstrapCompanies,
  getCompanyBySlugIn,
  useCompanies,
  type Variant,
} from "../data/companies";
import { bootstrapSiteContent } from "../data/siteContent";
import { hasSupabase } from "../lib/supabase";

const SeedcarePage = lazy(() =>
  import("./components/SeedcarePage").then((m) => ({ default: m.SeedcarePage }))
);
const CompanyIndex = lazy(() =>
  import("./components/CompanyIndex").then((m) => ({ default: m.CompanyIndex }))
);
const PasswordGate = lazy(() =>
  import("./components/PasswordGate").then((m) => ({ default: m.PasswordGate }))
);
const AdminShell = lazy(() =>
  import("./admin/AdminShell").then((m) => ({ default: m.AdminShell }))
);

function readQueryParams() {
  if (typeof window === "undefined")
    return { broadside: null, variant: null, admin: false };
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, "");
  return {
    broadside: params.get("broadside") ?? params.get("empresa"),
    variant: params.get("variant") as Variant | null,
    admin: params.has("admin") || pathname === "/admin",
  };
}

const BASE_TITLE = "Broadside Seedcare | Syngenta";

function setMeta(
  name: string,
  content: string,
  attr: "name" | "property" = "name"
) {
  let el = document.querySelector(
    `meta[${attr}="${name}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function Fallback() {
  return (
    <div
      className="min-h-screen w-full bg-[#f8f8f2] flex items-center justify-center"
      aria-busy="true"
    >
      <div className="w-10 h-10 border-4 border-[#7c695d]/20 border-t-[#7c695d] rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [{ broadside, variant, admin }, setParams] = useState(readQueryParams);
  const [bootstrapping, setBootstrapping] = useState(hasSupabase);
  const companies = useCompanies();

  useEffect(() => {
    const onChange = () => setParams(readQueryParams());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  useEffect(() => {
    if (!hasSupabase) return;
    Promise.all([bootstrapCompanies(), bootstrapSiteContent()]).finally(() =>
      setBootstrapping(false)
    );
  }, []);

  if (admin) {
    return (
      <Suspense fallback={<Fallback />}>
        <AdminShell />
      </Suspense>
    );
  }

  const company = broadside ? getCompanyBySlugIn(companies, broadside) : null;
  const activeVariant: Variant = company
    ? variant === "esg" || variant === "seedcare"
      ? variant
      : company.variant
    : "seedcare";

  useEffect(() => {
    const title = company
      ? `${company.name} • ${
          activeVariant === "esg" ? "ESG" : "Seedcare"
        } | Syngenta`
      : `Empresas Reconhecidas • ${BASE_TITLE}`;
    const description = company
      ? `Reconhecimento ${
          activeVariant === "esg"
            ? "ESG da certificação Seedcare 2025"
            : "do Selo de Excelência Seedcare"
        } para ${company.name}.`
      : "Diretório das sementeiras reconhecidas pelo Selo de Excelência Seedcare e pela Certificação ESG Seedcare 2025 da Syngenta. Selecione uma empresa e acesse o broadside personalizado.";
    const canonical = company
      ? `https://broadside.seedcare.syngenta.com.br/?broadside=${company.slug}${
          variant ? `&variant=${activeVariant}` : ""
        }`
      : "https://broadside.seedcare.syngenta.com.br/";

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("robots", "noindex, nofollow");

    let canonicalEl = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonical);
  }, [company, activeVariant, variant]);

  // Broadside solicitado mas ainda carregando o banco — aguarda antes de mostrar
  // o index (que poderia "esconder" uma empresa que existe no Supabase).
  if (broadside && !company && bootstrapping) {
    return <Fallback />;
  }

  if (!company) {
    return (
      <Suspense fallback={<Fallback />}>
        <PasswordGate>
          <Suspense fallback={<Fallback />}>
            <CompanyIndex />
          </Suspense>
        </PasswordGate>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Fallback />}>
      <SeedcarePage company={company} variant={activeVariant} />
    </Suspense>
  );
}
