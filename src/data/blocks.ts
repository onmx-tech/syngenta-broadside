import type { Variant } from "./companies";
import imgSelo from "../assets/blocks/logo_excelencia_seedcare.png";
import imgSeloEsg from "../assets/blocks/logo_excelencia_seedcare_esg.png";
import imgPost from "../assets/blocks/post.png";
import imgPostEsg from "../assets/blocks/post_esg.png";
import imgPpt from "../assets/blocks/ppt.png";
import imgPptEsg from "../assets/blocks/ppt_esg.png";
import imgEmail from "../assets/blocks/email.png";
import imgEmailEsg from "../assets/blocks/email_esg.png";
import imgFigurinhas from "../assets/blocks/figurinhas.png";
import imgFigurinhasEsg from "../assets/blocks/figurinhas_esg.png";
import imgFlyer from "../assets/blocks/flyer.png";
import imgFlyerEsg from "../assets/blocks/flyer_esg.png";
import imgBanner from "../assets/blocks/banner.png";
import imgBannerEsg from "../assets/blocks/banner_esg.png";
import imgOutdoor from "../assets/blocks/outdoor.png";
import imgOutdoorEsg from "../assets/blocks/outdoor-esg.png";

export type BlockKey =
  | "selo"
  | "post"
  | "modelo"
  | "email"
  | "figurinhas"
  | "flyer"
  | "banner"
  | "outdoor";

export type Block = {
  key: BlockKey;
  label: string;
  span?: 1 | 2;
  images: Record<Variant, string>;
  imageFit: "contain" | "cover";
  imageAnchor?: "left" | "right" | "center" | "bottom";
  imageScale?: number;
};

export const blocks: Block[] = [
  {
    key: "selo",
    label: "Selo de Excelência",
    images: { seedcare: imgSelo, esg: imgSeloEsg },
    imageFit: "contain",
  },
  {
    key: "post",
    label: "Post Carrossel",
    images: { seedcare: imgPost, esg: imgPostEsg },
    imageFit: "contain",
    imageAnchor: "right",
  },
  {
    key: "modelo",
    label: "Modelo de apresentação",
    images: { seedcare: imgPpt, esg: imgPptEsg },
    imageFit: "contain",
  },
  {
    key: "email",
    label: "E-mail mkt produtor",
    images: { seedcare: imgEmail, esg: imgEmailEsg },
    imageFit: "contain",
  },
  {
    key: "figurinhas",
    label: "Figurinhas WhatsApp",
    images: { seedcare: imgFigurinhas, esg: imgFigurinhasEsg },
    imageFit: "contain",
  },
  {
    key: "flyer",
    label: "Flyer",
    images: { seedcare: imgFlyer, esg: imgFlyerEsg },
    imageFit: "contain",
    imageScale: 1.35,
  },
  {
    key: "banner",
    label: "Banner",
    images: { seedcare: imgBanner, esg: imgBannerEsg },
    imageFit: "contain",
  },
  {
    key: "outdoor",
    label: "Mini Outdoor",
    span: 2,
    images: { seedcare: imgOutdoor, esg: imgOutdoorEsg },
    imageFit: "cover",
    imageAnchor: "bottom",
  },
];


// [legado] Link por card — preservado durante a migração pra download bar.
// Não é mais lido pelo site público (cards viraram vitrine, sem clique).
// "#" = ainda sem link.
export const blockLinks: Record<Variant, Record<BlockKey, string>> = {
  seedcare: {
    selo: "#", // 01 - Selo de Excelência   (arquivo a enviar)
    post: "#", // 02 - Post Carrossel
    modelo: "#", // 03 - Modelo de Apresentação
    email: "#", // 04 - E-mail mkt produtor
    figurinhas: "#", // 05 - Figurinhas WhatsApp  (arquivo a enviar)
    flyer: "#", // 06 - Flyer
    banner: "#", // 07 - Banner
    outdoor: "#", // 08 - Mini Outdoor
  },
  esg: {
    selo: "#", // 01 - Selo de Excelência
    post: "#", // 02 - Post Carrossel
    modelo: "#", // 03 - Modelo de Apresentação
    email: "#", // 04 - E-mail mkt produtor
    figurinhas: "#", // 05 - Figurinhas WhatsApp
    flyer: "#", // 06 - Flyer
    banner: "#", // 07 - Banner
    outdoor: "#", // 08 - Mini Outdoor
  },
};
