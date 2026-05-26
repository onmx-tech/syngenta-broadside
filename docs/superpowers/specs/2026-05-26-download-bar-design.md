# Download Bar — Spec de Design

**Data:** 2026-05-26
**Status:** Aprovado, pronto para plano de implementação
**Branch alvo:** `main` (ou feature branch a definir no plano)

## Contexto

Hoje, o broadside Syngenta Seedcare apresenta 8 cards (Selo, Post Carrossel,
Modelo de apresentação, E-mail mkt produtor, Figurinhas WhatsApp, Flyer,
Banner, Outdoor) em duas variantes (`seedcare` ou `esg`). Cada card é um
`<a>` que aponta para **uma pasta diferente do Drive** — portanto, 8 URLs por
variante (16 URLs no total), configuradas via aba "Links" do admin local
(`AdminLinks.tsx`).

A nova diretriz é colapsar para **dois pacotes únicos**:

- **1 link** para o Drive do pacote **Seedcare** (contém os 8 materiais)
- **1 link** para o Drive do pacote **ESG** (contém os 8 materiais)

Cada empresa, no broadside, vê apenas o pacote da sua variante.

## Objetivo

Trocar a UX de "clicar em cada card pra baixar" por **"vitrine visual de 8
cards + botão único de download em barra sticky inferior"**, e reduzir a
configuração do admin de 16 campos para 2.

## Decisões de produto

1. **Cards = vitrine.** Os 8 cards continuam visualmente idênticos mas
   deixam de ser clicáveis. Não têm mais hover de "clique pra baixar" nem
   cursor pointer.
2. **1 botão único de download** por página, atrelado à variante da empresa
   (Seedcare ou ESG).
3. **Sticky/flutuante: barra inferior largura total**, sempre visível
   enquanto a página estiver aberta.
4. **Admin de links simplificado para 2 campos** (URL Seedcare + URL ESG)
   — mantém a UX de "atualizar via painel" sem precisar editar código.

## Arquitetura

### Página (`SeedcarePage.tsx`)

- Grid de 8 cards **inalterado visualmente**.
- Remover o `<a>` wrapper de cada card, atributos `target/rel` e
  condicionais `blockLinks[variant][key].startsWith("http")`.
- Adicionar `padding-bottom: 96px` no container raiz pra a barra sticky
  não cobrir o último card.
- Renderizar `<DownloadBar variant={company.variant} href={downloadLinks[company.variant]} />`
  uma única vez no fim da página.
- Footer (Portal Syngenta) permanece intocado.

### Componente novo: `DownloadBar`

Arquivo: `src/app/components/DownloadBar.tsx`

Props:
```ts
type DownloadBarProps = {
  variant: "seedcare" | "esg";
  href: string; // string vazia = estado "em breve"
};
```

**Posicionamento e dimensões**
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 50`
- Altura: 72px desktop, 64px mobile
- Container interno `max-w-7xl` centralizado com padding lateral
  responsivo

**Visual por variante**
- `seedcare` → fundo `#765827` (marrom já presente no `theme-color`),
  texto branco
- `esg` → verde Syngenta. Token a reusar do que já existe no projeto: o
  plano de implementação deve buscar primeiro no `tailwind.config` /
  `globals.css` e nos arquivos de imagem ESG existentes (ex:
  `imgSeloEsg`, `imgBannerEsg`). Fallback se nada estiver definido:
  `#0A8C3E` (verde institucional Syngenta).
- Texto sempre branco em ambas
- `backdrop-filter: blur(12px)` + sombra superior sutil pra separar do
  conteúdo

**Copy fixo (textos exatos)**

| Elemento | Variante Seedcare | Variante ESG |
|---|---|---|
| Título da barra | *Pacote Seedcare · Selo de Excelência* | *Pacote ESG · Selo de Excelência* |
| Sublabel desktop | *Selo, post, modelo, e-mail, figurinhas, flyer, banner e outdoor* | *Selo, post, modelo, e-mail, figurinhas, flyer, banner e outdoor* |
| CTA (estado ativo) | *Baixar pacote Seedcare* | *Baixar pacote ESG* |
| CTA (estado vazio) | *Materiais em breve* | *Materiais em breve* |

**Layout do conteúdo — desktop**

Em linha única:
- Esquerda: ícone + título da variante + sublabel (texto menor, opacity
  reduzida)
- Direita: botão CTA pill branco, texto na cor da variante, ícone seta de
  download

**Layout do conteúdo — mobile**

Empilhado em duas linhas:
- Linha 1: ícone + título da variante (sublabel **omitido** em mobile pra
  economizar altura)
- Linha 2: botão CTA largura total da segunda linha

**Animação**
- `slide-up + fade-in` após `scrollY > 150px`
- Permanece visível enquanto o usuário rola; some com `slide-down` ao
  voltar ao topo absoluto (`scrollY < 50px`) — micro-detalhe pra preservar
  o hero limpo na primeira impressão
- **Fallback de página curta:** se o conteúdo da página couber inteiro no
  viewport (não há scroll possível), a barra aparece automaticamente após
  ~400ms do mount. Garantia: usuário nunca fica sem botão de download por
  estar numa tela alta.

**Estado vazio (`href === ""`)**
- Barra **ainda renderiza** (mantém presença visual)
- Botão fica desabilitado: `opacity: 0.5`, sem cursor pointer, sem href
- Label do botão muda pra *"Materiais em breve"*
- `aria-disabled="true"`

**Comportamento de link**
- `<a target="_blank" rel="noopener noreferrer">` apontando pra
  `downloadLinks[variant]`

**Acessibilidade**
- Container é `<aside role="complementary" aria-label="Baixar materiais
  do pacote {variante}">`
- Botão tem label clara (ex: *"Baixar pacote Seedcare"* — não apenas
  *"Baixar tudo"*, pra leitores de tela)
- Foco visível seguindo padrão dos outros botões do app
- Contraste mínimo AA garantido nas duas variantes

## Dados

### Mudança no `AdminState` (`src/app/admin/types.ts`)

**Adicionar:**
```ts
type DownloadLinks = { seedcare: string; esg: string };

type AdminState = {
  // ...campos existentes
  downloadLinks: DownloadLinks;
};
```

**O campo `links` antigo permanece no tipo temporariamente** (não
removido neste spec), pra evitar quebra do estado salvo no localStorage de
usuários atuais. Será removido num spec futuro quando a migração estiver
estável.

### Migração de localStorage (`src/app/admin/storage.ts`)

Ao carregar `AdminState`:
1. Se `downloadLinks` já existe → usa direto.
2. Se não existe → cria `{ seedcare: "", esg: "" }`.
3. **Best-effort:** se o campo antigo `links` existe e tem alguma URL
   preenchida, pega a **primeira URL não-vazia** de cada variante (em
   ordem dos `BlockKey`s: selo, post, modelo, …) e usa como valor inicial
   de `downloadLinks[variant]`. Isso só é feito quando `downloadLinks`
   está sendo criado pela primeira vez.

Esse comportamento é não-destrutivo: `links` antigo permanece no
localStorage até o usuário salvar o estado de novo.

### Acesso aos dados na página

`App.tsx` continua sendo a raiz que injeta o `AdminState` na
`SeedcarePage`. Passamos `downloadLinks` como prop adicional. A página
lê `downloadLinks[company.variant]` uma única vez e passa pra
`DownloadBar`.

## Admin — aba "Links" (`AdminLinks.tsx`)

Reconstruída do zero:

- Header: *"Links de download"* + subtítulo *"URL do Drive de cada
  pacote."*
- Dois inputs simples, empilhados:
  - *"Pacote Seedcare"* — placeholder com URL de exemplo
  - *"Pacote ESG"* — placeholder com URL de exemplo
- Hint informativo no rodapé: *"O link aparece no botão 'Baixar tudo' na
  barra inferior do broadside de cada empresa."*
- Sem toggle de variante (mostra os 2 simultâneamente)
- Sem botão "copiar pra outra variante"
- Validação leve via UI: se o input não está vazio e não começa com
  `https://`, mostrar hint *"Sugerimos URL começando com `https://`"*
  (não bloqueia o salvamento)

## Limpeza

Arquivos a ajustar:

| Arquivo | Mudança |
|---|---|
| `src/app/components/SeedcarePage.tsx` | Remove `<a>` wrapper, atributos `target/rel`, condicionais `startsWith("http")` por card. Adiciona padding inferior. Renderiza `<DownloadBar />`. |
| `src/app/components/DownloadBar.tsx` | **Novo arquivo.** |
| `src/app/admin/types.ts` | Adiciona `downloadLinks: DownloadLinks` em `AdminState`. |
| `src/app/admin/storage.ts` | Migração no load (cria `downloadLinks` com best-effort do `links` antigo). |
| `src/app/admin/AdminLinks.tsx` | Reescrito: 2 inputs, sem toggle, sem copiar. |
| `src/app/App.tsx` | Passa `downloadLinks` da raiz pra `SeedcarePage`. |

Fora de escopo (intocado):
- `AdminCompanies`, `AdminAssets`, `AdminSettings`
- `src/data/companies.ts`, `src/data/blocks.ts`
- `PasswordGate`, `CompanyIndex`

## Estados e edge cases

| Estado | Comportamento |
|---|---|
| Empresa com variante `seedcare` e `downloadLinks.seedcare = ""` | Barra renderiza, botão *"Materiais em breve"* desabilitado. |
| Empresa com variante `esg` e `downloadLinks.esg = "https://..."` | Barra verde, botão ativo, abre Drive em nova aba. |
| Usuário rola até o topo (`scrollY < 50px`) | Barra esconde via slide-down. |
| Usuário rola pra baixo (`scrollY > 150px`) | Barra aparece via slide-up. |
| LocalStorage antigo (sem `downloadLinks`) | Storage cria com best-effort do `links` antigo. |
| LocalStorage novo (com `downloadLinks`) | Usa direto. |
| Tela mobile estreita (<640px) | Layout de 2 linhas com botão largura total. |

## Testabilidade

Não há suite de testes automatizados no projeto hoje. Validação será
manual:

1. Empresa Seedcare → ver barra marrom, botão *"Baixar pacote Seedcare"*,
   clicar abre Drive correto em nova aba.
2. Empresa ESG → ver barra verde, botão *"Baixar pacote ESG"*, mesmo
   fluxo.
3. Sem link configurado → botão desabilitado com label *"Materiais em
   breve"*.
4. Mobile → barra empilha em 2 linhas, botão largura total funcional.
5. Admin → 2 campos visíveis, salvar persiste no localStorage,
   recarregar mantém valor.
6. Scroll → barra aparece após 150px, esconde ao voltar pro topo.
7. Acessibilidade → navegar por teclado chega no botão; leitor de tela
   anuncia label da variante.

## Trade-offs aceitos

- **Manter campo `links` antigo no tipo** durante a transição evita
  quebrar storage existente, mas adiciona ruído. Aceitável dado que admin
  é local-only e o custo de remover depois é baixo.
- **Barra sempre presente** (mesmo sem link configurado) ocupa espaço
  vertical permanentemente. Aceitável porque comunica claramente que o
  download faz parte da página, mesmo quando ainda não está pronto.
- **Sem animação de polish** nos cards após remover o `<a>` — eles
  continuam estáticos. Não vale gastar nessa primeira iteração.
