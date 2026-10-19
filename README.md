# Sillage Perfumes Importados — site

Site de página única da **Sillage Perfumes Importados**: catálogo de perfumaria árabe com filtro por categoria e família olfativa, busca, sacola e pedido fechado pelo WhatsApp. Tem tema claro e escuro.

- HTML, CSS e JS puros, sem build e sem dependências.
- **Produtos** (preços, promoções, esgotados, fotos): editados pelo dono no painel **`/admin`**, guardados no banco D1. O `PRODUCTS` de `js/data.js` é só uma cópia de reserva.
- **Resto do conteúdo** (slides, destaque, categorias, famílias, contatos): `js/data.js`. O `js/main.js` só renderiza.
- Fotos dos produtos: `img/products/`. Veja [`img/README.md`](img/README.md).

## Rodar localmente
Abra o `index.html` no navegador, ou sirva a pasta com `python3 -m http.server`. Assim o site usa a reserva de `js/data.js`.

Com o painel e a API (precisa de Node):
```sh
echo 'ADMIN_PASSWORD=uma-senha-local' > .dev.vars
npx wrangler d1 execute sillage --local --file=schema.sql
npx wrangler pages dev .
```
No primeiro login em `/admin`, o banco vazio recebe sozinho os produtos de `js/data.js`.

## Painel admin (`/admin`)
Para o dono da loja: entrar com a senha e cadastrar, editar, marcar como esgotado, reordenar ou excluir produtos, e trocar fotos. A mudança aparece no site no próximo carregamento da página.

- **Back-end:** Cloudflare Pages Functions em `functions/` (API em `/api/*`, fotos em `/media/*`).
- **Banco:** D1 `sillage` (tabela `products`, um JSON por produto, no mesmo formato de `PRODUCTS`). Estrutura em `schema.sql`. Com o banco vazio, o primeiro login no painel importa o `PRODUCTS` de `js/data.js`.
- **Fotos novas:** R2 `sillage-media`. As fotos antigas continuam em `img/products/`.
- **Senha:** secret `ADMIN_PASSWORD` no projeto do Pages (Settings → Variables and Secrets). Trocar a senha desconecta todas as sessões. Depois de 8 erros seguidos, o IP fica bloqueado por 15 minutos.
- **Backup do banco:** `npx wrangler d1 export sillage --remote --output=backup.sql`.
- Bindings (`DB`, `MEDIA`) declarados em `wrangler.toml`.

## Deploy
Automático pelo **Cloudflare Pages**: todo push na `main` publica o site, e cada pull request ganha uma URL de prévia. Não há comando de build; o diretório de saída é a raiz (`/`). Os cabeçalhos HTTP ficam em `_headers`.
