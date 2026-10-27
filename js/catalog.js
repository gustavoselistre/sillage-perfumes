/* Sillage — funções e modelos de HTML usados pelo site (main.js) e pelo gerador de páginas
   (scripts/build.mjs). Não mexe no DOM. Recebe a lista de produtos (a do painel, via /api/products,
   ou a reserva do js/data.js); CONFIG, CATEGORIES e FAMILIES vêm do js/data.js. */
function createShop(PRODUCTS) {
  "use strict";

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // api.whatsapp.com em vez de wa.me: o redirecionamento do wa.me corrompe emojis (vira "�").
  const waUrl = (message) =>
    `https://api.whatsapp.com/send?phone=${CONFIG.whatsapp}${message ? `&text=${encodeURIComponent(message)}` : ""}`;

  const instaUrl = `https://www.instagram.com/${CONFIG.instagram}/`;

  const formatPrice = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const productById = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------- Tamanhos: frascos e decantes ----------
     Cada produto vira uma lista de opções { size, price }. "size" é o texto do botão, da sacola e do
     WhatsApp. Decante: o ml do 5 ml custa o dobro do ml do frasco; o 10 ml sai 15% mais barato por ml
     que o 5 ml. Preço sempre arredondado pra cima até o próximo final 9,90. */
  const DECANT = CONFIG.decant;
  const hasDecant = (p) => DECANT.categories.includes(p.category) && !p.soldOut && p.decant !== false;
  // 34,90 → 39,90 · 35,00 → 39,90 · 40,00 → 49,90 · 59,90 → 59,90 (conta em centavos, sem erro de float).
  const upTo990 = (value) => (Math.ceil((Math.ceil(Math.round(value * 1e6) / 1e4) + 10) / 1000) * 1000 - 10) / 100;
  const mlOf = (size) => { const m = /(\d+)\s*ml/i.exec(size || ""); return m ? Number(m[1]) : null; };

  const optionCache = new Map();
  function sizeOptions(p) {
    if (optionCache.has(p.id)) return optionCache.get(p.id);
    const decant = hasDecant(p);
    const baseSize = (p.sizes && p.sizes[0]) || (decant ? `${p.volume || 100} ml` : "");
    const bottles = p.bottles || [{ size: baseSize, price: p.price }];
    const opts = bottles.map((b) => ({ size: decant ? `Frasco ${b.size}` : b.size, price: b.price }));
    if (decant) {
      // Base do decante: o frasco de 100 ml, se houver; senão o primeiro.
      const base = bottles.find((b) => mlOf(b.size) === 100) || bottles[0];
      const perMl = base.price == null ? null : base.price / (p.volume || mlOf(base.size) || 100);
      const five = perMl == null ? null : perMl * 2 * 5;
      DECANT.sizes.forEach((ml) => {
        const raw = five == null ? null : ml === 5 ? five : five / 5 * 0.85 * ml;
        opts.push({ size: `Decante ${ml} ml`, price: raw == null ? null : upTo990(raw) });
      });
    }
    optionCache.set(p.id, opts);
    return opts;
  }
  const priceFor = (p, size) => {
    const o = sizeOptions(p).find((x) => x.size === size);
    return o ? o.price : p.price;
  };
  const familyLabel = (id) => (FAMILIES.find((f) => f.id === id) || {}).label || id;
  const fullName = (p) => `${p.brand} ${p.name}`;
  const categoryLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;

  /* ---------- Endereços das páginas geradas (scripts/build.mjs) ----------
     Relativos à raiz: na home resolvem a partir de "/", nas páginas internas há <base href="/">. */
  const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const productUrl = (p) => `perfumes/${p.id}/`;
  const brandUrl = (brand) => `marcas/${slug(brand)}/`;
  const familyUrl = (id) => `familias/${id}/`;
  const categoryUrl = (id) => `categorias/${id}/`;

  /* ---------- Ícones ---------- */
  const ICONS = {
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="fill"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 4.6L19 5l-1.6 4.4L22 12l-4.6 2.6L19 19l-4.4-1.6L12 22l-2.6-4.6L5 19l1.6-4.4L2 12l4.6-2.6L5 5l4.4 1.6z"/></svg>',
  };

  // Ícones das famílias olfativas (chave = FAMILIES[].id).
  const FAMILY_ICONS = {
    todos: '<path d="M12 2l2.6 4.6L19 5l-1.6 4.4L22 12l-4.6 2.6L19 19l-4.4-1.6L12 22l-2.6-4.6L5 19l1.6-4.4L2 12l4.6-2.6L5 5l4.4 1.6z"/>',
    amadeirado: '<circle cx="12" cy="12" r="9.5"/><path d="M12 5.5a6.5 6.5 0 1 1-6.4 7.6"/><path d="M12 8.6a3.4 3.4 0 1 1-3.3 4.1"/><path d="M12 12l7 7"/>',
    citrico: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7 7l10 10M17 7L7 17"/>',
    floral: '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6C10 6 10.5 2.8 12 2.8s2 3.2 0 6.8M14.3 11.3c3.6-2 6.6-1.3 6.6.3s-3 2.3-6.6.6M13.4 14.2c2.2 3.4 2 6.6.4 6.9s-2.6-2.7-1.8-6.6M10.6 14.2c-2.2 3.4-2 6.6-.4 6.9s2.6-2.7 1.8-6.6M9.7 11.3c-3.6-2-6.6-1.3-6.6.3s3 2.3 6.6.6"/>',
    oriental: '<rect x="5" y="5" width="14" height="14"/><rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)"/><circle cx="12" cy="12" r="2.6"/>',
    gourmand: '<path d="M12 2.8c3.2 4.6 6.2 7.8 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-3.4 3-6.6 6.2-11.2z"/><path d="M8.8 14.4a3.2 3.2 0 0 0 3.2 3.2"/>',
    frutado: '<path d="M12 7.2c-4.6-1.6-8.2 1.6-8.2 6.1S7.5 21.2 12 21.2s8.2-3.4 8.2-7.9-3.6-7.7-8.2-6.1z"/><path d="M12 7.2c-.6 4 0 8.2 1.1 12.3"/><path d="M12 7.2c1-2.6 3.1-4.2 6.3-4.2-.5 3.1-3.1 4.6-6.3 4.2z"/>',
    aromatico: '<path d="M12 21.5V4"/><path d="M12 9c-3-.5-5-2.6-5-5.2 3 0 5 2.1 5 5.2zM12 9c3-.5 5-2.6 5-5.2-3 0-5 2.1-5 5.2zM12 15.5c-3.6-.5-6.2-3-6.2-6.2 3.6 0 6.2 2.6 6.2 6.2zM12 15.5c3.6-.5 6.2-3 6.2-6.2-3.6 0-6.2 2.6-6.2 6.2z"/>',
  };
  const familyIcon = (id, cls = "") =>
    FAMILY_ICONS[id] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${FAMILY_ICONS[id]}</svg>` : "";

  /* ---------- Frasco ilustrado (enquanto não há fotos) ---------- */
  // Clareia (amt > 0) ou escurece (amt < 0) uma cor #rrggbb.
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
    const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  let svgUid = 0;
  function bottleSvg(p) {
    const { shape = "square", glass = "#c9a24a", cap = "#c9a24a" } = p.bottle || {};
    const id = `b${++svgUid}`;
    const gold = "#c9a24a";
    const words = p.name.split(" ");
    const lines = p.name.length > 11 && words.length > 1
      ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")]
      : [p.name];

    const label = (cx, cy, size = 13) => `
      <text x="${cx}" y="${cy - (lines.length > 1 ? 14 : 8)}" text-anchor="middle" font-size="7" letter-spacing="2" fill="#9a7a2e" font-family="Jost, sans-serif">${escapeHtml(p.brand.toUpperCase())}</text>
      ${lines.map((l, i) => `<text x="${cx}" y="${cy + 8 + i * (size + 2)}" text-anchor="middle" font-size="${l.length > 10 ? size - 2 : size}" fill="#3a2618" font-family="'Cormorant Garamond', serif" font-weight="700">${escapeHtml(l)}</text>`).join("")}`;

    const defs = `<defs>
      <linearGradient id="${id}g" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(glass, -0.25)}" stop-opacity=".92"/>
        <stop offset=".35" stop-color="${shade(glass, 0.25)}" stop-opacity=".85"/>
        <stop offset=".7" stop-color="${glass}" stop-opacity=".9"/>
        <stop offset="1" stop-color="${shade(glass, -0.35)}" stop-opacity=".95"/>
      </linearGradient>
      <linearGradient id="${id}c" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(cap, -0.3)}"/>
        <stop offset=".45" stop-color="${shade(cap, 0.35)}"/>
        <stop offset="1" stop-color="${shade(cap, -0.4)}"/>
      </linearGradient>
      <linearGradient id="${id}m" x1="0" x2="1">
        <stop offset="0" stop-color="#8a6a24"/><stop offset=".5" stop-color="#f1d98c"/><stop offset="1" stop-color="#7a5a1c"/>
      </linearGradient>
    </defs>`;
    const G = `url(#${id}g)`, C = `url(#${id}c)`, M = `url(#${id}m)`;
    const shine = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="5" stroke-linecap="round"/>`;

    const SHAPES = {
      square: `
        <rect x="66" y="20" width="68" height="52" rx="5" fill="${C}"/>
        <rect x="66" y="20" width="68" height="6" rx="3" fill="#fff" opacity=".18"/>
        <rect x="80" y="72" width="40" height="14" fill="${M}"/>
        <rect x="42" y="86" width="116" height="152" rx="10" fill="${G}" stroke="#fff" stroke-opacity=".35"/>
        <rect x="52" y="98" width="96" height="128" rx="6" fill="none" stroke="#fff" stroke-opacity=".18"/>
        <rect x="60" y="132" width="80" height="64" rx="3" fill="#fbf7ef" stroke="${gold}" stroke-width="1.5"/>
        <rect x="64" y="136" width="72" height="56" rx="2" fill="none" stroke="${gold}" stroke-width=".6"/>
        ${label(100, 164)}
        ${shine("M54 104 Q52 160 56 222")}`,
      round: `
        <rect x="78" y="16" width="44" height="54" rx="10" fill="${C}"/>
        <rect x="84" y="70" width="32" height="18" fill="${M}"/>
        <circle cx="100" cy="166" r="74" fill="${G}" stroke="#fff" stroke-opacity=".35"/>
        <circle cx="100" cy="166" r="62" fill="none" stroke="${gold}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="2 4"/>
        <circle cx="100" cy="166" r="42" fill="#fbf7ef" stroke="${gold}" stroke-width="1.5"/>
        ${label(100, 166, 12)}
        ${shine("M44 140 Q40 170 52 200")}`,
      tall: `
        <rect x="62" y="16" width="76" height="72" rx="16" fill="${C}"/>
        <rect x="62" y="56" width="76" height="6" fill="${M}"/>
        <rect x="62" y="70" width="76" height="4" fill="${M}"/>
        <rect x="56" y="88" width="88" height="152" rx="20" fill="${G}" stroke="#fff" stroke-opacity=".35"/>
        <path d="M56 112 Q100 96 144 120 M56 124 Q100 140 144 108" fill="none" stroke="${M}" stroke-width="7" stroke-linecap="round"/>
        <rect x="68" y="150" width="64" height="50" rx="4" fill="#fbf7ef" stroke="${gold}" stroke-width="1.5"/>
        ${label(100, 176, 12)}
        ${shine("M66 132 Q64 180 68 228")}`,
      ornate: `
        <circle cx="100" cy="42" r="26" fill="${C}"/>
        <circle cx="100" cy="42" r="17" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
        <circle cx="100" cy="42" r="6" fill="#b3263a"/>
        <rect x="88" y="66" width="24" height="20" fill="${M}"/>
        <path d="M62 88 Q100 78 138 88 L152 234 Q100 246 48 234 Z" fill="${G}" stroke="#fff" stroke-opacity=".35"/>
        ${[70, 82, 94, 106, 118, 130].map((x) => `<path d="M${x} 94 L${x + (x - 100) * 0.18} 232" stroke="#fff" stroke-opacity=".14" stroke-width="3"/>`).join("")}
        <circle cx="100" cy="166" r="34" fill="#fbf7ef" stroke="${gold}" stroke-width="2"/>
        ${label(100, 166, 11)}
        ${shine("M66 100 Q60 170 60 226")}`,
    };

    return `<svg class="bottle" viewBox="0 0 200 260" aria-hidden="true">${defs}
      <ellipse cx="100" cy="246" rx="74" ry="8" fill="#000" opacity=".28"/>
      ${SHAPES[shape] || SHAPES.square}</svg>`;
  }

  // Foto real (fundo branco some com mix-blend-mode no CSS) ou, sem foto, o frasco ilustrado.
  // Se a foto não carregar, o <template> ao lado vira o frasco ilustrado.
  const productVisual = (p, { eager = false } = {}) =>
    p.image
      ? `<img class="photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(fullName(p))}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false" data-fallback><template>${bottleSvg(p)}</template>`
      : bottleSvg(p);
  const photoCls = (p) => (p && p.image ? " has-photo" : "");

  // Fundo em gradiente na cor da fragrância (como nas artes do Instagram).
  const bgStyle = (colors) => (colors ? `--c1:${colors[0]};--c2:${colors[1]}` : "");

  const discount = (p) => (p.oldPrice && p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  // size: opção escolhida no card (sem ela, o primeiro frasco). O preço antigo riscado vale só para ele.
  function priceHtml(p, size) {
    const first = sizeOptions(p)[0].size;
    const price = size ? priceFor(p, size) : p.price;
    if (price == null) return `<p class="product__price">Consulte<small>preço confirmado no WhatsApp</small></p>`;
    const old = p.oldPrice && (!size || size === first) ? `<s class="price-old">${formatPrice(p.oldPrice)}</s>` : "";
    return `<p class="product__price">${old}${formatPrice(price)}<small>${p.soldOut ? "último preço praticado" : "valor confirmado no WhatsApp"}</small></p>`;
  }

  // Botões de volume agrupados em "Frasco" e "Decante"; o botão mostra só o ml.
  function sizePicker(opts, current, decant) {
    const btn = (o) => `<button class="size" type="button" data-size="${escapeHtml(o.size)}" aria-pressed="${o.size === current}">${escapeHtml(o.size.replace(/^(Frasco|Decante) /, ""))}</button>`;
    if (!decant) return `<div class="product__options" role="group" aria-label="Tamanho">${opts.map(btn).join("")}</div>`;
    const groups = [["Frasco", opts.filter((o) => o.size.startsWith("Frasco "))], ["Decante", opts.filter((o) => o.size.startsWith("Decante "))]];
    return `
        <p class="product__purchase-title">Escolha o volume</p>
        ${groups.map(([label, list]) => `
        <div class="size-group" role="group" aria-label="${label}">
          <span class="size-group__label">${label}</span>
          <div class="product__options">${list.map(btn).join("")}</div>
        </div>`).join("")}
        <p class="product__decant-note">${escapeHtml(DECANT.note)}</p>`;
  }

  // st: volume e quantidade escolhidos no card (main.js guarda um por produto).
  // Volume, preço, quantidade e "Adicionar" (ou "Avise-me" se esgotado) + link de dúvida no WhatsApp.
  // Usado no card e na página do produto; main.js liga os botões pelo [data-id] mais próximo.
  function purchaseHtml(p, st = { size: sizeOptions(p)[0].size, qty: 1 }) {
    const opts = sizeOptions(p);
    const ask = p.soldOut
      ? `Olá, Sillage! Pode me avisar quando o ${fullName(p)} chegar? ✨`
      : `Olá, Sillage! Tenho uma dúvida sobre o ${fullName(p)} ✨`;
    return `
        <div class="product__purchase">
        ${opts.length > 1 ? sizePicker(opts, st.size, hasDecant(p)) : opts[0].size ? `<p class="product__size">${escapeHtml(opts[0].size)}</p>` : ""}
        ${priceHtml(p, st.size)}
        ${p.soldOut ? `
        <a class="btn btn--ghost product__notify" href="${escapeHtml(waUrl(ask))}" target="_blank" rel="noopener">${ICONS.chat}Avise-me quando chegar</a>
        </div>` : `
        <div class="product__buy">
          <div class="qty" role="group" aria-label="Quantidade">
            <button type="button" data-qty="-1" aria-label="Diminuir quantidade">−</button>
            <output aria-live="polite">${st.qty}</output>
            <button type="button" data-qty="1" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="btn btn--gold" type="button" data-add>${ICONS.bag}Adicionar</button>
        </div>
        </div>
        <a class="product__ask" href="${escapeHtml(waUrl(ask))}" target="_blank" rel="noopener">${ICONS.chat}Tirar dúvida no WhatsApp</a>`}`;
  }

  const notesHtml = (p) => (p.notes ? `
        <dl class="notes">
          <div><dt>Topo</dt><dd>${escapeHtml(p.notes.topo)}</dd></div>
          <div><dt>Coração</dt><dd>${escapeHtml(p.notes.coracao)}</dd></div>
          <div><dt>Fundo</dt><dd>${escapeHtml(p.notes.fundo)}</dd></div>
        </dl>` : "");

  // st: volume e quantidade escolhidos no card (main.js guarda um por produto).
  function productCard(p, index = 0, st = { size: sizeOptions(p)[0].size, qty: 1 }) {
    const off = discount(p);
    return `
    <article class="product${p.soldOut ? " is-soldout" : ""}" data-id="${p.id}" style="animation-delay:${Math.min(index % 12, 8) * 50}ms">
      <div class="product__media${photoCls(p)}" style="${bgStyle(p.bottle && p.bottle.bg)}">
        ${productVisual(p)}
        <span class="product__gender">${escapeHtml(categoryLabel(p.category))}</span>
        ${p.soldOut ? '<span class="product__soldout">Esgotado</span>' : off ? `<span class="product__star">−${off}%</span>` : ""}
      </div>
      <div class="product__body">
        <p class="product__brand">${escapeHtml(p.brand)}</p>
        <h3 class="product__name"><a href="${productUrl(p)}">${escapeHtml(p.name)}</a></h3>
        ${p.families.length ? `<p class="product__families">${p.families.map((f) => `<span>${escapeHtml(familyLabel(f))}</span>`).join("")}</p>` : ""}
        ${notesHtml(p)}
        ${p.desc ? `<p class="product__desc">${escapeHtml(p.desc)}</p>` : ""}
        ${purchaseHtml(p, st)}
      </div>
    </article>`;
  }

  /* ---------- Perguntas frequentes (FAQ do data.js) ----------
     <details> abre e fecha sem JavaScript; a home já sai do build com a lista pronta. */
  const faqHtml = (items) => items.map((f) => `
          <details class="faq__item">
            <summary class="faq__q">${escapeHtml(f.q)}</summary>
            <p class="faq__a">${escapeHtml(f.a)}</p>
          </details>`).join("");

  return {
    faqHtml, escapeHtml, waUrl, instaUrl, formatPrice, productById, DECANT, hasDecant, sizeOptions, priceFor,
    familyLabel, fullName, categoryLabel, slug, productUrl, brandUrl, familyUrl, categoryUrl,
    ICONS, familyIcon, bottleSvg, productVisual, photoCls, bgStyle, discount, priceHtml, purchaseHtml, productCard,
  };
}
