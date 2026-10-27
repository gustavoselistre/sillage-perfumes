# Sillage Perfumes Importados — site

Site de página única da **Sillage Perfumes Importados**: catálogo de perfumaria árabe com filtro por categoria e família olfativa, busca, sacola e pedido fechado pelo WhatsApp. Tem tema claro e escuro.

- HTML, CSS e JS puros, sem dependências.
- **Conteúdo editável** (produtos, preços, promoções, esgotados, slides, contatos e textos das páginas para o Google): `js/data.js`. O `js/main.js` só renderiza; os modelos de HTML compartilhados ficam em `js/catalog.js`.
- **SEO:** `scripts/build.mjs` gera em `dist/` uma página para cada perfume (`/perfumes/<id>/`) e páginas de categoria, família olfativa, marca e decantes, além do `sitemap.xml` e do `404.html`. Também coloca a vitrine pronta no HTML da home. Domínio oficial: `CONFIG.siteUrl`.
- Fotos dos produtos: `img/products/`. Veja [`img/README.md`](img/README.md).

## Rodar localmente
Para ver o site completo, com as páginas geradas: `node scripts/build.mjs && python3 -m http.server -d dist`. O build confere cada página (um `<h1>`, título único, canonical, JSON-LD válido e nenhum link interno quebrado) e falha se algo estiver errado.

Abrir só o `index.html` (ou `python3 -m http.server` na raiz) também funciona, mas sem as páginas de produto.

## Deploy
Automático pelo **Cloudflare Pages**: todo push na `main` publica o site, e cada pull request ganha uma URL de prévia.

- Build command: `node scripts/build.mjs`
- Build output directory: `dist`

Os cabeçalhos HTTP ficam em `_headers` (as prévias `*.pages.dev` recebem `noindex`). O `www` deve redirecionar (301) para `https://sillageperfumaria.com.br` por uma regra de redirecionamento no painel da Cloudflare.
