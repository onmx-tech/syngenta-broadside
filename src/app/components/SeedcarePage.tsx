import { BrownCard } from "./BrownCard";
import { blocks, blockLinks } from "../../data/blocks";
import type { Company, Variant } from "../../data/companies";
import imgHeader from "../../imports/SySeedcareBroadsidePreview/3a986b7adf9d5b37201789977d57a957178e3cf0.png";
import imgHero from "../../imports/SySeedcareBroadsidePreview/d935914b8bbc43fd0fc68c6209dd122bd62f2cf2.png";
import imgFooter from "../../imports/SySeedcareBroadsidePreview/f56fbc1eeaa2ab80af596323ab794f976d675e04.png";
import imgSeloSeedcare from "../../assets/blocks/logo_excelencia_seedcare.png";
import imgSeloEsg from "../../assets/blocks/logo_excelencia_seedcare_esg.png";
import { CasaLogo } from "./CasaLogo";

const seloByVariant: Record<Variant, string> = {
  seedcare: imgSeloSeedcare,
  esg: imgSeloEsg,
};

type Props = {
  company: Company;
  variant: Variant;
};

export function SeedcarePage({ company, variant }: Props) {
  return (
    <div className="min-h-screen w-full bg-[#f8f8f2] pb-8 sm:pb-10">
      <div className="mx-auto w-full max-w-[900px] bg-[#f8f8f2] rounded-b-[25px] overflow-hidden shadow-sm">
        <header className="bg-white">
          <img
            src={imgHeader}
            alt="Seedcare Syngenta"
            className="w-full h-auto block"
          />
        </header>

        <section className="relative w-full">
          <div className="relative aspect-[900/300] sm:aspect-[900/280] w-full overflow-hidden">
            <img
              src={imgHero}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
            <div className="relative h-full flex items-center px-6 sm:px-10 md:px-14">
              <div className="flex items-stretch gap-4 sm:gap-5">
                <div
                  className="w-1.5 sm:w-2 rounded-sm"
                  style={{
                    background:
                      "linear-gradient(180deg, #86BB55 0%, #3D5527 100%)",
                  }}
                />
                <h1 className="font-['Poppins',sans-serif] uppercase text-[#fffeeb] text-[20px] sm:text-[28px] md:text-[34px] leading-[1.05] tracking-tight">
                  {variant === "esg" ? (
                    <>
                      <span className="font-normal">Aqui tem</span>
                      <br />
                      <span className="font-bold text-[#7dbf44]">
                        excelência no
                      </span>
                      <br />
                      <span className="font-bold text-[#7dbf44]">
                        tratamento
                      </span>
                      <br />
                      <span className="font-normal">de sementes e</span>
                      <br />
                      <span className="font-bold text-[#7dbf44]">
                        reconhecimento
                      </span>
                      <br />
                      <span className="font-normal">em práticas </span>
                      <span className="font-bold text-[#7dbf44]">ESG.</span>
                    </>
                  ) : (
                    <span className="max-w-[340px] inline-block">
                      <span className="font-normal">Transformamos </span>
                      <span className="font-bold text-[#7dbf44]">
                        inovação em superação
                      </span>
                      <span className="font-normal"> ao longo de gerações.</span>
                    </span>
                  )}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-10 md:px-14 pt-8 sm:pt-10 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 sm:gap-8 items-center">
            <div className="text-[#7c695d] font-['Inter',sans-serif]">
              <h2 className="font-bold text-[22px] sm:text-[26px] mb-3">
                Sementeiro(a),
              </h2>
              <p className="text-[16px] sm:text-[18px] leading-[1.5]">
                {variant === "esg" ? (
                  <>
                    Gostaríamos de parabenizar você pela conquista da{" "}
                    <strong className="font-bold whitespace-nowrap">
                      Certificação Seedcare 2025
                    </strong>
                    , que comprova que você cumpre com os rigorosos seis
                    pilares que garantem máxima qualidade e produtividade das
                    suas sementes.
                  </>
                ) : (
                  <>
                    Gostaríamos de parabenizar você pela conquista do{" "}
                    <strong className="font-bold whitespace-nowrap">
                      Selo de Excelência Seedcare.
                    </strong>
                    , que comprova que você cumpre com os rigorosos seis
                    pilares que garantem máxima qualidade e produtividade das
                    suas sementes.
                  </>
                )}
              </p>
            </div>
            <div className="border border-black/20 rounded-[32px] w-[220px] sm:w-[260px] h-[160px] sm:h-[180px] flex items-center justify-center p-6 bg-white/40 mx-auto sm:mx-0">
              <img
                src={company.logoUrl}
                alt={company.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-10 md:px-14 mt-2">
          <a
            href={blockLinks[variant].selo}
            target={
              blockLinks[variant].selo.startsWith("http")
                ? "_blank"
                : undefined
            }
            rel={
              blockLinks[variant].selo.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="block transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#7dbf44] rounded-[30px]"
          >
            <BrownCard rounded="rounded-[30px]" className="w-full">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-6 sm:p-8 md:p-10">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <p className="text-[#e4e4d0] font-['Inter',sans-serif] font-medium text-[16px] sm:text-[18px]">
                  Selo Sacaria
                </p>
                <img
                  src={seloByVariant[variant]}
                  alt="Selo de Excelência Seedcare"
                  className="h-[180px] sm:h-[220px] md:h-[240px] w-auto object-contain"
                />
              </div>
              <p className="font-['Inter',sans-serif] font-bold text-[#f8f8f2] text-[16px] sm:text-[19px] leading-[1.45] text-center sm:text-left">
                Você provou, mais uma vez, que sua sementeira é sinônimo de
                excelência no tratamento de sementes, parabéns!
              </p>
              </div>
            </BrownCard>
          </a>
        </section>

        <p className="text-center text-[#7c695d] font-['Inter',sans-serif] font-medium text-[15px] sm:text-[17px] leading-[1.4] px-8 sm:px-16 py-8 sm:py-10 max-w-[640px] mx-auto">
          Abaixo estão todas as nossas exclusivas peças de comunicação para
          você impactar ainda mais os seus clientes.
        </p>

        <section className="px-4 sm:px-10 md:px-14 pb-8 sm:pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {blocks.map((block) => {
              const href = blockLinks[variant][block.key];
              const spanClass =
                block.span === 2 ? "md:col-span-2" : "";
              return (
                <a
                  key={block.key}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`block group transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#7dbf44] rounded-[18px] ${spanClass}`}
                >
                  <BrownCard
                    className={`w-full ${
                      block.span === 2
                        ? "aspect-[252/316] md:aspect-[520/316]"
                        : "aspect-[252/316]"
                    }`}
                  >
                    <div
                      className={`h-full w-full flex flex-col items-center pt-4 ${
                        block.imageAnchor === "bottom" ? "pb-0" : "pb-4"
                      } ${
                        block.imageAnchor === "right"
                          ? "pl-3 pr-0 sm:pl-4"
                          : "px-3 sm:px-4"
                      }`}
                    >
                      <p
                        className={`text-[#e4e4d0] font-['Inter',sans-serif] font-medium text-[14px] sm:text-[16px] md:text-[17px] text-center leading-[1.2] mt-2 mb-2 sm:mb-3 shrink-0 ${
                          block.imageAnchor === "right" ? "pr-3 sm:pr-4" : ""
                        }`}
                      >
                        {block.label}
                      </p>
                      <div
                        className={`flex-1 w-full flex min-h-0 ${
                          block.imageAnchor === "bottom"
                            ? "items-end"
                            : "items-center"
                        } ${
                          block.imageAnchor === "right"
                            ? "justify-end"
                            : "justify-center"
                        }`}
                      >
                        <img
                          src={block.images[variant]}
                          alt={block.label}
                          className={`block object-contain ${
                            block.imageAnchor === "bottom"
                              ? "w-full max-h-full"
                              : "max-w-full max-h-full"
                          }`}
                          style={{
                            objectPosition:
                              block.imageAnchor === "right"
                                ? "right center"
                                : block.imageAnchor === "bottom"
                                ? "center bottom"
                                : "center center",
                            transform: block.imageScale
                              ? `scale(${block.imageScale})`
                              : undefined,
                            transformOrigin: "center center",
                          }}
                        />
                      </div>
                    </div>
                  </BrownCard>
                </a>
              );
            })}
          </div>
        </section>

        <footer className="relative w-full">
          <div
            className="relative aspect-[900/165] w-full overflow-hidden rounded-b-[25px]"
            style={{
              backgroundImage: `url(${imgFooter})`,
              backgroundSize: "100% auto",
              backgroundPosition: "50% 25%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
            <div className="relative h-full flex items-center justify-between px-6 sm:px-10 md:px-14">
              <CasaLogo />
              <a
                href="https://www.portalsyngenta.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-[10px] sm:text-[12px] font-['Helvetica','Inter',sans-serif] tracking-tight hover:underline"
              >
                www.portalsyngenta.com.br
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
