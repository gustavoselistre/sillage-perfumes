/* Sillage — gera o site estático em dist/ para o Google (sem dependências: só Node 18+).
   Busca os produtos do painel em <siteUrl>/api/products (se falhar, usa a reserva de js/data.js),
   usa os modelos de HTML de js/catalog.js e cria:
   - /perfumes/<id>/            uma página por produto (título, notas, preços, JSON-LD Product)
   - /categorias/<id>/, /familias/<id>/, /marcas/<marca>/, /decantes/   páginas de listagem
   - /sitemap.xml e /404.html
   e pré-renderiza a vitrine e os links do rodapé na home.
   Uso: node scripts/build.mjs   (Cloudflare Pages: build command igual, output directory "dist").
   O painel (/admin) chama o deploy hook a cada alteração, e o build roda de novo (functions/_lib/rebuild.js).
   SILLAGE_API=<url> troca o endereço da API (ex.: http://localhost:8788/api/products com o wrangler). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

/* ---------- Catálogo ---------- */
// data.js e catalog.js declaram const globais; rodando os dois num só script, a última expressão devolve tudo.
const { CONFIG, PRODUCTS: FALLBACK_PRODUCTS, FAMILIES, CATEGORIES, SEO_TEXTS, createShop } = vm.runInNewContext(
  `${read("js/data.js")}\n${read("js/catalog.js")}\n;({ CONFIG, PRODUCTS, FAMILIES, CATEGORIES, SEO_TEXTS, createShop })`
);

// Produtos do painel (a mesma lista que a vitrine carrega). Sem resposta válida, usa a reserva do data.js.
async function loadProducts() {
  const url = process.env.SILLAGE_API || `${CONFIG.siteUrl.replace(/\/$/, "")}/api/products`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || !list.length || !list.every((p) => p && p.id && p.name && p.brand && Array.isArray(p.families))) {
      throw new Error("resposta sem produtos válidos");
    }
    console.log(`Produtos do painel: ${list.length} (${url})`);
    return list;
  } catch (e) {
    console.warn(`AVISO: não deu para ler ${url} (${e.message}). Usando a reserva de js/data.js (${FALLBACK_PRODUCTS.length} produtos).`);
    return FALLBACK_PRODUCTS;
  }
}
const PRODUCTS = await loadProducts();
const SHOP = createShop(PRODUCTS);
const {
  escapeHtml: esc, formatPrice, sizeOptions, familyLabel, fullName, categoryLabel, slug,
  productUrl, brandUrl, familyUrl, categoryUrl, productVisual, photoCls, bgStyle, purchaseHtml, productCard,
} = SHOP;

const SITE = CONFIG.siteUrl.replace(/\/$/, "");
const abs = (rel) => `${SITE}/${rel.replace(/^\.?\//, "")}`;
const STORE_ID = `${SITE}/#loja`;

const byAvailability = (list) => [...list].sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut));

// Data do último commit (no Cloudflare Pages o repositório vem com o histórico); senão, hoje.
const LASTMOD = (() => {
  try { return execSync("git log -1 --format=%cI", { cwd: ROOT }).toString().trim().slice(0, 10); }
  catch { return new Date().toISOString().slice(0, 10); }
})();

/* ---------- Textos ---------- */
const TYPE = {
  masculino: ["perfume masculino", "Perfume Masculino"],
  feminino: ["perfume feminino", "Perfume Feminino"],
  hidratantes: ["hidratante perfumado", "Hidratante"],
  "body-splash": ["body splash", "Body Splash"],
  infantil: ["perfume infantil", "Perfume Infantil"],
};
const typeOf = (p) => TYPE[p.category] || ["produto", "Produto"];

const CATEGORY_TITLES = {
  masculino: "Perfumes árabes masculinos",
  feminino: "Perfumes árabes femininos",
  hidratantes: "Hidratantes e cremes perfumados",
  "body-splash": "Body splash",
  infantil: "Perfumes infantis",
};
const FAMILY_PLURAL = {
  amadeirado: "amadeirados", citrico: "cítricos", floral: "florais", oriental: "orientais",
  gourmand: "gourmand", frutado: "frutados", aromatico: "aromáticos",
};

const joinPt = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}`);
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const clean = (s) => lowerFirst(String(s).trim().replace(/\.$/, ""));
// Corta no fim de uma palavra para caber em meta description (~160 caracteres).
const clip = (s, max = 160) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(" ", max - 1)).replace(/[,.;:]$/, "")}…`);

function priceSentence(p) {
  if (p.soldOut) return "No momento está esgotado: chame a gente no WhatsApp para ser avisado quando chegar.";
  const opts = sizeOptions(p).filter((o) => o.price != null);
  if (!opts.length) return "Preço sob consulta pelo WhatsApp.";
  const bottles = opts.filter((o) => !o.size.startsWith("Decante "));
  const decants = opts.filter((o) => o.size.startsWith("Decante "));
  const fmt = (o) => `${o.size.replace(/^Frasco /, "")} por ${formatPrice(o.price)}`;
  let s = bottles.length ? `${bottles.length > 1 ? "Frascos de" : "Frasco de"} ${joinPt(bottles.map(fmt))}` : "";
  if (decants.length) s += `${s ? ", e " : ""}decantes de ${joinPt(decants.map((o) => `${o.size.replace(/^Decante /, "")} (${formatPrice(o.price)})`))}`;
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

function productLead(p) {
  const fams = p.families.map((f) => lowerFirst(familyLabel(f)));
  const parts = [`O ${p.name}, da ${p.brand}, é um ${typeOf(p)[0]}${fams.length ? ` ${joinPt(fams)}` : ""}.`];
  if (p.notes) parts.push(`Abre com ${clean(p.notes.topo)}, tem coração de ${clean(p.notes.coracao)} e fundo de ${clean(p.notes.fundo)}.`);
  else if (p.desc) parts.push(p.desc.trim().replace(/([^.!?])$/, "$1."));
  return parts.join(" ");
}

/* ---------- Pedaços de HTML ---------- */
const INDEX = read("index.html");
const slice = (from, to) => {
  const a = INDEX.indexOf(from), b = INDEX.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`index.html: trecho não encontrado (${from} … ${to})`);
  return INDEX.slice(a, b);
};
// Script do tema + fontes + CSS; cabeçalho; rodapé, sacola e scripts.
const HEAD_ASSETS = slice("  <!-- Aplica o tema", '  <script type="application/ld+json">');
const HEADER = slice("  <!-- ============ HEADER", "  <main>");
const FOOTER = slice("  <!-- ============ FOOTER", "</body>");

const ldJson = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

function breadcrumb(items) {
  return {
    html: `<nav class="crumbs" aria-label="Você está em"><ol>${items.map(([label, href], i) =>
      i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${href}">${esc(label)}</a></li>`).join("")}</ol></nav>`,
    ld: {
      "@type": "BreadcrumbList",
      itemListElement: items.map(([label, href], i) => ({ "@type": "ListItem", position: i + 1, name: label, item: abs(href) })),
    },
  };
}

/* ---------- Links do rodapé (todas as páginas) ---------- */
const BRANDS = (() => {
  const count = new Map();
  PRODUCTS.forEach((p) => count.set(p.brand, (count.get(p.brand) || 0) + 1));
  // Só marcas com 2+ produtos ganham página (uma página com um só produto é fraca para o Google).
  return [...count].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([name]) => name);
})();
const CATEGORY_PAGES = CATEGORIES.filter((c) => c.id !== "todas" && PRODUCTS.some((p) => p.category === c.id));
const FAMILY_PAGES = FAMILIES.filter((f) => f.id !== "todos" && PRODUCTS.some((p) => p.families.includes(f.id)));

const EXPLORE = `<nav class="container footer__explore" aria-label="Explore o catálogo">
      <div><h3>Categorias</h3><p>${CATEGORY_PAGES.map((c) => `<a href="${categoryUrl(c.id)}">${esc(c.label)}</a>`).join("")}<a href="decantes/">Decantes</a></p></div>
      <div><h3>Famílias olfativas</h3><p>${FAMILY_PAGES.map((f) => `<a href="${familyUrl(f.id)}">${esc(f.label)}</a>`).join("")}</p></div>
      <div><h3>Marcas</h3><p>${BRANDS.map((b) => `<a href="${brandUrl(b)}">${esc(b)}</a>`).join("")}</p></div>
    </nav>`;
const withExplore = (html) => html.replace(/<!-- build:explore[^>]*-->/, EXPLORE);

/* ---------- Página interna (mesmo cabeçalho, rodapé e sacola da home) ---------- */
function page({ rel, title, description, image, ogType = "website", ld, main }) {
  const url = abs(rel);
  const img = image ? abs(image) : abs("img/og-cover.jpg");
  return `<!doctype html>
<html lang="pt-BR" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <base href="/">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#0b0b0d">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="Sillage Perfumes Importados">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${img}">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="img/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">

${HEAD_ASSETS}  ${ldJson({ "@context": "https://schema.org", "@graph": ld })}
</head>
<body>
  <a class="skip-link" href="${rel}#conteudo">Pular para o conteúdo</a>

${HEADER}  <main id="conteudo" class="page">
${main}
  </main>

${withExplore(FOOTER)}</body>
</html>
`;
}

/* ---------- Tamanho das fotos (width/height evitam o "pulo" do layout) ---------- */
function jpegSize(file) {
  try {
    const b = fs.readFileSync(path.join(ROOT, file));
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  } catch { /* sem foto */ }
  return null;
}

/* ---------- Página do produto ---------- */
function relatedTo(p) {
  const score = (q) => q.families.filter((f) => p.families.includes(f)).length * 2 + (q.brand === p.brand ? 1 : 0);
  return PRODUCTS
    .filter((q) => q.id !== p.id && q.category === p.category && !q.soldOut)
    .map((q, i) => ({ q, s: score(q), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 4)
    .map(({ q }) => q);
}

function productOffers(p, url) {
  const priced = sizeOptions(p).filter((o) => o.price != null);
  if (!priced.length) return null; // sem preço não há Offer válida para o Google
  const common = {
    priceCurrency: "BRL",
    availability: `https://schema.org/${p.soldOut ? "OutOfStock" : "InStock"}`,
    itemCondition: "https://schema.org/NewCondition",
    url,
    seller: { "@id": STORE_ID },
  };
  const prices = priced.map((o) => o.price);
  return priced.length === 1
    ? { "@type": "Offer", price: prices[0].toFixed(2), ...common }
    : { "@type": "AggregateOffer", lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), offerCount: priced.length, ...common };
}

function productPage(p) {
  const rel = productUrl(p);
  const url = abs(rel);
  const [type, Type] = typeOf(p);
  const lead = productLead(p);
  const priceText = priceSentence(p);
  const crumbs = breadcrumb([
    ["Início", "./"],
    [categoryLabel(p.category), categoryUrl(p.category)],
    ...(BRANDS.includes(p.brand) ? [[p.brand, brandUrl(p.brand)]] : []),
    [p.name, rel],
  ]);
  const size = p.image && jpegSize(p.image);
  const visual = p.image
    ? `<img class="photo" src="${esc(p.image)}" alt="${esc(`${fullName(p)}, ${type}`)}"${size ? ` width="${size.w}" height="${size.h}"` : ""} fetchpriority="high" decoding="async" draggable="false">`
    : productVisual(p);
  const tiers = p.notes ? [["Topo", p.notes.topo, "Primeiras impressões"], ["Coração", p.notes.coracao, "A alma do perfume"], ["Fundo", p.notes.fundo, "O rastro que fica"]] : [];
  const related = relatedTo(p);

  const product = {
    "@type": "Product",
    "@id": `${url}#produto`,
    name: fullName(p),
    sku: p.id,
    brand: { "@type": "Brand", name: p.brand },
    category: Type,
    description: [lead, p.seoText].filter(Boolean).join(" "),
    url,
    ...(p.image ? { image: [abs(p.image)] } : {}),
  };
  const offers = productOffers(p, url);
  if (offers) product.offers = offers;

  const main = `
    <div class="container">
      ${crumbs.html}
      <article class="pdp">
        <div class="pdp__media product__media${photoCls(p)}" style="${bgStyle(p.bottle && p.bottle.bg)}">
          ${visual}
          ${p.soldOut ? '<span class="product__soldout">Esgotado</span>' : ""}
        </div>
        <div class="pdp__info">
          <p class="product__brand">${BRANDS.includes(p.brand) ? `<a href="${brandUrl(p.brand)}">${esc(p.brand)}</a>` : esc(p.brand)}</p>
          <h1 class="display pdp__title">${esc(p.name)}<span class="visually-hidden"> ${esc(p.brand)}</span></h1>
          <p class="pdp__type">${esc(Type)}${p.sizes ? ` · ${esc(p.sizes.join(" · "))}` : ""}</p>
          ${p.families.length ? `<p class="pdp__families">${p.families.map((f) => `<a class="chip" href="${familyUrl(f)}">${esc(familyLabel(f))}</a>`).join("")}</p>` : ""}
          <p class="pdp__lead">${esc(lead)}${p.seoText ? ` ${esc(p.seoText)}` : ""}</p>
          ${tiers.length ? `
          <h2 class="pdp__subtitle">Pirâmide olfativa</h2>
          <ol class="pyramid">
            ${tiers.map(([label, notes, hint], i) => `
            <li class="pyramid__tier pyramid__tier--${i + 1}">
              <span class="pyramid__label">${label}<small>${hint}</small></span>
              <span class="pyramid__notes">${esc(notes)}</span>
            </li>`).join("")}
          </ol>` : ""}
          <div class="pdp__purchase" data-id="${p.id}">
            ${purchaseHtml(p)}
          </div>
          <p class="pdp__note">${esc(priceText)} Produto original. Pagamento por Pix, cartão de débito ou crédito em até ${CONFIG.maxInstallments}x sem juros. Entrega combinada pelo WhatsApp ou retirada em ${esc(CONFIG.pickup.city)}.</p>
        </div>
      </article>
      ${related.length ? `
      <section class="pdp__related" aria-labelledby="related-title">
        <h2 class="display pdp__related-title" id="related-title">Você também pode <em>gostar</em></h2>
        <div class="products products--grid">${related.map((q, i) => productCard(q, i)).join("")}</div>
      </section>` : ""}
    </div>`;

  return page({
    rel,
    title: `${fullName(p)} – ${Type} Original | Sillage`,
    description: clip(`${fullName(p)} original: ${type}${p.families.length ? ` ${joinPt(p.families.map((f) => lowerFirst(familyLabel(f))))}` : ""}. ${p.notes ? `Notas de ${clean(p.notes.topo)}. ` : ""}${p.soldOut ? "Esgotado no momento." : priceText}`),
    image: p.image,
    ogType: "product",
    ld: [product, crumbs.ld],
    main,
  });
}

/* ---------- Páginas de listagem ---------- */
function listingPage({ rel, title, h1, kicker, intro, products, siblings }) {
  const list = byAvailability(products);
  const crumbs = breadcrumb([["Início", "./"], [h1, rel]]);
  const itemList = {
    "@type": "ItemList",
    name: h1,
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(productUrl(p)), name: fullName(p) })),
  };
  const main = `
    <section class="section listing">
      <div class="container">
        ${crumbs.html}
        <header class="section-head">
          <p class="kicker">${esc(kicker)}</p>
          <h1 class="display">${esc(h1)}</h1>
          <p class="section-head__text">${esc(intro)}</p>
        </header>
        <p class="listing__count">${list.length} ${list.length === 1 ? "produto" : "produtos"}</p>
        <div class="products products--grid">${list.map((p, i) => productCard(p, i)).join("")}</div>
        ${siblings ? `<nav class="listing__more" aria-label="Veja também">${siblings}</nav>` : ""}
      </div>
    </section>`;
  return page({ rel, title, description: clip(intro), ld: [itemList, crumbs.ld], main });
}

const chipLinks = (items, current) => items.filter(([href]) => href !== current)
  .map(([href, label]) => `<a class="chip" href="${href}">${esc(label)}</a>`).join("");

const pages = new Map(); // rel → html

PRODUCTS.forEach((p) => pages.set(productUrl(p), productPage(p)));

const categoryLinks = CATEGORY_PAGES.map((c) => [categoryUrl(c.id), CATEGORY_TITLES[c.id] || c.label]);
CATEGORY_PAGES.forEach((c) => {
  const rel = categoryUrl(c.id);
  const h1 = CATEGORY_TITLES[c.id] || c.label;
  pages.set(rel, listingPage({
    rel, h1, kicker: "Categoria",
    title: `${h1} Originais | Sillage Perfumes`,
    intro: SEO_TEXTS.categorias[c.id] || `${h1} originais na Sillage Perfumes Importados.`,
    products: PRODUCTS.filter((p) => p.category === c.id),
    siblings: chipLinks(categoryLinks, rel),
  }));
});

const familyLinks = FAMILY_PAGES.map((f) => [familyUrl(f.id), `Perfumes ${FAMILY_PLURAL[f.id] || lowerFirst(f.label)}`]);
FAMILY_PAGES.forEach((f) => {
  const rel = familyUrl(f.id);
  const h1 = `Perfumes ${FAMILY_PLURAL[f.id] || lowerFirst(f.label)}`;
  pages.set(rel, listingPage({
    rel, h1, kicker: "Família olfativa",
    title: `${h1}: perfumes árabes originais | Sillage`,
    intro: SEO_TEXTS.familias[f.id] || f.text,
    products: PRODUCTS.filter((p) => p.families.includes(f.id)),
    siblings: chipLinks(familyLinks, rel),
  }));
});

const brandLinks = BRANDS.map((b) => [brandUrl(b), b]);
BRANDS.forEach((b) => {
  const rel = brandUrl(b);
  const products = PRODUCTS.filter((p) => p.brand === b);
  pages.set(rel, listingPage({
    rel, h1: `Perfumes ${b}`, kicker: "Marca",
    title: `Perfumes ${b} Originais | Sillage Perfumes`,
    intro: SEO_TEXTS.marcas[b] || `Perfumes ${b} originais na Sillage Perfumes Importados: ${products.length} opções.`,
    products,
    siblings: chipLinks(brandLinks, rel),
  }));
});

pages.set("decantes/", listingPage({
  rel: "decantes/", h1: "Decantes de perfumes árabes", kicker: "5 ml e 10 ml",
  title: "Decantes de Perfumes Árabes 5 ml e 10 ml | Sillage",
  intro: SEO_TEXTS.decantes,
  products: PRODUCTS.filter(SHOP.hasDecant),
  siblings: chipLinks(categoryLinks, ""),
}));

/* ---------- Home: vitrine pré-renderizada + links do rodapé ---------- */
const PRODUCTS_SLOT = '<div class="products" data-products></div>';
if (!INDEX.includes(PRODUCTS_SLOT)) throw new Error("index.html: vitrine (data-products) não encontrada");
const home = withExplore(INDEX).replace(
  PRODUCTS_SLOT,
  `<div class="products" data-products>${byAvailability(PRODUCTS).slice(0, 12).map((p, i) => productCard(p, i)).join("")}</div>`
);

/* ---------- 404 (sem ele o Cloudflare Pages devolve a home com status 200) ---------- */
const notFound = page({
  rel: "404.html",
  title: "Página não encontrada | Sillage Perfumes",
  description: "Essa página não existe. Veja nossos perfumes árabes originais.",
  ld: [],
  main: `
    <section class="section">
      <div class="container section-head">
        <p class="kicker">Erro 404</p>
        <h1 class="display">Página não <em>encontrada</em></h1>
        <p class="section-head__text">O perfume ou a página que você procura não está mais aqui.</p>
        <p class="listing__more"><a class="btn btn--gold btn--lg" href="./#perfumes">Ver os perfumes</a></p>
      </div>
    </section>`,
}).replace(/\s*<link rel="canonical"[^>]*>/, "\n  <meta name=\"robots\" content=\"noindex\">");

/* ---------- Sitemap ---------- */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[["./", null], ...[...pages.keys()].map((rel) => [rel, PRODUCTS.find((p) => productUrl(p) === rel)])].map(([rel, p]) => `  <url>
    <loc>${abs(rel)}</loc>
    <lastmod>${LASTMOD}</lastmod>${p && p.image ? `
    <image:image><image:loc>${abs(p.image)}</image:loc></image:image>` : ""}
  </url>`).join("\n")}
</urlset>
`;

/* ---------- Grava dist/ ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
["css", "js", "img", "admin"].forEach((dir) => fs.cpSync(path.join(ROOT, dir), path.join(DIST, dir), { recursive: true }));
["_headers", "robots.txt", "site.webmanifest"].forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)));
fs.rmSync(path.join(DIST, "img", "README.md"), { force: true });

const write = (rel, html) => {
  const file = path.join(DIST, rel.endsWith("/") ? `${rel}index.html` : rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
write("index.html", home);
write("404.html", notFound);
write("sitemap.xml", sitemap);
pages.forEach((html, rel) => write(rel, html));

/* ---------- Conferência ---------- */
const problems = [];
const files = new Set();
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const f = path.join(dir, d.name);
    if (d.isDirectory()) walk(f); else files.add(path.relative(DIST, f).split(path.sep).join("/"));
  });
})(DIST);
const titles = new Map();
// O painel (admin/) não é página para o Google: fica fora da conferência.
[...files].filter((f) => f.endsWith(".html") && !f.startsWith("admin/")).forEach((f) => {
  const html = fs.readFileSync(path.join(DIST, f), "utf8");
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problems.push(`${f}: ${h1} <h1>`);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) problems.push(`${f}: sem <title>`);
  else if (titles.has(title)) problems.push(`${f}: <title> repetido (${titles.get(title)})`);
  else titles.set(title, f);
  if (f !== "404.html" && !/<link rel="canonical" href="https:\/\//.test(html)) problems.push(`${f}: sem canonical absoluto`);
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].forEach((m) => {
    try { JSON.parse(m[1]); } catch (e) { problems.push(`${f}: JSON-LD inválido (${e.message})`); }
  });
  // Links internos: as páginas internas usam <base href="/">; a home fica na raiz. Os dois resolvem a partir de "/".
  [...html.matchAll(/(?:href|src)="([^"#:?]+)(?:[#?][^"]*)?"/g)].forEach(([, link]) => {
    if (/^(https?:|mailto:|tel:|\/\/)/.test(link)) return;
    if (/^\/(api|media)\//.test(link)) return; // servidos pelas functions, não pelo dist/
    let target = link.replace(/^\.?\//, "");
    if (target === "" || target.endsWith("/")) target += "index.html";
    if (!files.has(target)) problems.push(`${f}: link quebrado → ${link}`);
  });
});

if (problems.length) {
  console.error(`Build com ${problems.length} problema(s):\n- ${[...new Set(problems)].join("\n- ")}`);
  process.exit(1);
}
console.log(`dist/ pronto: ${pages.size + 1} páginas (${PRODUCTS.length} produtos), sitemap com ${pages.size + 1} URLs.`);
