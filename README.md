# Sillage Perfumes Importados — site

Site de página única da **Sillage Perfumes Importados**: catálogo de perfumaria árabe com filtro por categoria e família olfativa, busca, sacola e pedido fechado pelo WhatsApp. Tem tema claro e escuro.

- HTML, CSS e JS puros, sem build e sem dependências.
- **Conteúdo editável** (produtos, preços, promoções, esgotados, slides, contatos): `js/data.js`. O `js/main.js` só renderiza.
- Fotos dos produtos: `img/products/`. Veja [`img/README.md`](img/README.md).

## Rodar localmente
Abra o `index.html` no navegador, ou sirva a pasta com `python3 -m http.server`.

## Deploy
Automático pelo **Cloudflare Pages**: todo push na `main` publica o site, e cada pull request ganha uma URL de prévia. Não há comando de build; o diretório de saída é a raiz (`/`). Os cabeçalhos HTTP ficam em `_headers`.
