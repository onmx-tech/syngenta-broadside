export type AdminVariant = "seedcare" | "esg";

export type AdminCompany = {
  id: string;
  slug: string;
  name: string;
  logoDataUrl: string | null;
  variant: AdminVariant;
  createdAt: string;
};

export type AdminBlockKey =
  | "selo"
  | "post"
  | "modelo"
  | "email"
  | "figurinhas"
  | "flyer"
  | "banner"
  | "outdoor";

export const ADMIN_BLOCK_LABELS: Record<AdminBlockKey, string> = {
  selo: "Selo de Excelência",
  post: "Post Carrossel",
  modelo: "Modelo de apresentação",
  email: "E-mail mkt produtor",
  figurinhas: "Figurinhas WhatsApp",
  flyer: "Flyer",
  banner: "Banner",
  outdoor: "Mini Outdoor",
};

export const ADMIN_BLOCK_KEYS: AdminBlockKey[] = [
  "selo",
  "post",
  "modelo",
  "email",
  "figurinhas",
  "flyer",
  "banner",
  "outdoor",
];

export type AdminLinks = Record<AdminVariant, Record<AdminBlockKey, string>>;

export type AdminBlockImages = Record<AdminVariant, Partial<Record<AdminBlockKey, string>>>;

export type AdminSeals = Record<AdminVariant, string | null>;

export type AdminSettings = {
  canonicalBaseUrl: string;
  indexPasswordHint: string;
  textSeedcareHero: string;
  textEsgHero: string;
  textSeedcareCallout: string;
  textEsgCallout: string;
};

export type AdminState = {
  companies: AdminCompany[];
  links: AdminLinks;
  blockImages: AdminBlockImages;
  seals: AdminSeals;
  settings: AdminSettings;
};

export const ADMIN_INITIAL_STATE: AdminState = {
  companies: [],
  links: {
    seedcare: {
      selo: "",
      post: "",
      modelo: "",
      email: "",
      figurinhas: "",
      flyer: "",
      banner: "",
      outdoor: "",
    },
    esg: {
      selo: "",
      post: "",
      modelo: "",
      email: "",
      figurinhas: "",
      flyer: "",
      banner: "",
      outdoor: "",
    },
  },
  blockImages: { seedcare: {}, esg: {} },
  seals: { seedcare: null, esg: null },
  settings: {
    canonicalBaseUrl: "https://syngenta-broadside.vercel.app",
    indexPasswordHint: "(definida no código por enquanto)",
    textSeedcareHero:
      "Transformamos inovação em superação ao longo de gerações.",
    textEsgHero:
      "Aqui tem excelência no tratamento de sementes e reconhecimento em práticas ESG.",
    textSeedcareCallout:
      "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
    textEsgCallout:
      "Você provou, mais uma vez, que sua sementeira é sinônimo de excelência no tratamento de sementes, parabéns!",
  },
};
