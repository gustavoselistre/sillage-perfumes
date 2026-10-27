# Sillage Perfumes Importados — site

Site de página única da **Sillage Perfumes Importados**: catálogo de perfumaria árabe com filtro por categoria e família olfativa, busca, sacola e pedido fechado pelo WhatsApp. Tem tema claro e escuro.

- HTML, CSS e JS puros, sem dependências.
- **Produtos** (preços, promoções, esgotados, fotos): editados pelo dono no painel **`/admin`**, guardados no banco D1. O `PRODUCTS` de `js/data.js` é só uma cópia de reserva.
- **Resto do conteúdo** (slides, destaque, categorias, famílias, contatos, perguntas frequentes em `FAQ` e textos das páginas para o Google em `SEO_TEXTS`): `js/data.js`. O `js/main.js` só renderiza; os modelos de HTML compartilhados com o build ficam em `js/catalog.js`.
- **SEO:** `scripts/build.mjs` busca os produtos em `/api/products` (reserva: `js/data.js`) e gera em `dist/` uma página para cada perfume (`/perfumes/<id>/`), páginas de categoria, família olfativa, marca e decantes, o `sitemap.xml` e o `404.html`, e coloca a vitrine e as perguntas frequentes (com JSON-LD `FAQPage`) prontas no HTML da home. Domínio oficial: `CONFIG.siteUrl`. Quando o dono salva algo no painel, o site é remontado sozinho (veja "Deploy").
- Fotos dos produtos: `img/products/`. Veja [`img/README.md`](img/README.md).

## Rodar localmente
Site completo, com as páginas geradas: `node scripts/build.mjs && python3 -m http.server -d dist`. O build confere cada página (um `<h1>`, título único, canonical, JSON-LD válido e nenhum link interno quebrado) e falha se algo estiver errado. Sem rede, ele usa a reserva de `js/data.js`.

Abrir só o `index.html` (ou `python3 -m http.server` na raiz) também funciona, com a reserva e sem as páginas de produto.

Com o painel e a API (precisa de Node):
```sh
echo 'ADMIN_PASSWORD=uma-senha-local' > .dev.vars
npx wrangler d1 execute sillage --local --file=schema.sql
node scripts/build.mjs && npx wrangler pages dev
```
No primeiro login em `/admin`, o banco vazio recebe sozinho os produtos de `js/data.js`.

## Painel admin (`/admin`)
Endereço: **https://sillageperfumaria.com.br/admin** (nas prévias de PR, `<url-da-prévia>/admin`).

Para o dono da loja: entrar com a senha e cadastrar, editar, marcar como esgotado, reordenar ou excluir produtos, e trocar fotos. A vitrine mostra a mudança no próximo carregamento da página; as páginas de cada perfume (as do Google) são atualizadas em 1 a 2 minutos, quando termina o novo deploy.

- **Back-end:** Cloudflare Pages Functions em `functions/` (API em `/api/*`, fotos em `/media/*`).
- **Banco:** D1 `sillage` (tabela `products`, um JSON por produto, no mesmo formato de `PRODUCTS`). Estrutura em `schema.sql`. Com o banco vazio, o primeiro login no painel importa o `PRODUCTS` de `js/data.js`.
- **Fotos novas:** R2 `sillage-media`. As fotos antigas continuam em `img/products/`.
- **Senha:** secret `ADMIN_PASSWORD` no projeto do Pages (Settings → Variables and Secrets). Trocar a senha desconecta todas as sessões. Depois de 8 erros seguidos, o IP fica bloqueado por 15 minutos.
- **Backup do banco:** `npx wrangler d1 export sillage --remote --output=backup.sql`.
- **Uso e limites (plano grátis):** visitas em Workers & Pages → sillage-perfumes → Metrics (Web Analytics); requisições das functions na mesma aba (limite de 100 mil por dia); espaço e operações do R2 em R2 → Overview (10 GB, 1 milhão de gravações e 10 milhões de leituras por mês); builds em Workers & Pages → sillage-perfumes → Deployments (500 por mês).
- Bindings (`DB`, `MEDIA`) declarados em `wrangler.toml`.

## Deploy
Automático pelo **Cloudflare Pages**: todo push na `main` publica o site, e cada pull request ganha uma URL de prévia.

- Build command: `node scripts/build.mjs`
- Build output directory: `dist` (também em `wrangler.toml`)
- **Remontagem ao salvar no painel:** em Settings → Builds → Deploy hooks, crie um hook para a branch `main` e guarde a URL no secret `DEPLOY_HOOK_URL` (Settings → Variables and Secrets). Cada criação, edição, exclusão, reordenação ou importação no painel chama o hook (`functions/_lib/rebuild.js`). Sem o secret, nada acontece e as páginas só mudam no próximo push.

Os cabeçalhos HTTP ficam em `_headers` (as prévias `*.pages.dev` recebem `noindex`). O `www` deve redirecionar (301) para `https://sillageperfumaria.com.br` por uma regra de redirecionamento no painel da Cloudflare.
