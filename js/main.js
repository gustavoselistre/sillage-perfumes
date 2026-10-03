/* Sillage — comportamento da página (sem dependências). Conteúdo vem de js/data.js. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // api.whatsapp.com em vez de wa.me: o redirecionamento do wa.me corrompe emojis (vira "�").
  const waUrl = (message) =>
    `https://api.whatsapp.com/send?phone=${CONFIG.whatsapp}${message ? `&text=${encodeURIComponent(message)}` : ""}`;

  const instaUrl = `https://www.instagram.com/${CONFIG.instagram}/`;

  const formatPrice = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const productById = (id) => PRODUCTS.find((p) => p.id === id);
  const familyLabel = (id) => (FAMILIES.find((f) => f.id === id) || {}).label || id;
  const fullName = (p) => `${p.brand} ${p.name}`;

  // Abre o WhatsApp em nova aba. window.open com "noopener" sempre retorna null,
  // então o opener é zerado à mão; se o pop-up for bloqueado, navega na própria aba.
  function openExternal(url) {
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
  }

  /* ---------- Storage seguro (modo privado / bloqueado) ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem persistência */ }
    },
  };

  /* ---------- Toast ---------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }

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

  // Foto quebrada → troca pelo frasco ilustrado (o evento error não borbulha, por isso a captura).
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute("data-fallback")) return;
    const tpl = img.nextElementSibling;
    const box = img.parentElement;
    if (tpl && tpl.tagName === "TEMPLATE") img.replaceWith(tpl.content.cloneNode(true));
    if (box) box.classList.remove("has-photo");
    const slide = box && box.closest(".slide");
    if (slide) slide.classList.remove("has-photo");
  }, true);

  // Fundo em gradiente na cor da fragrância (como nas artes do Instagram).
  const bgStyle = (colors) => (colors ? `--c1:${colors[0]};--c2:${colors[1]}` : "");

  const pickupText = () => {
    const pk = CONFIG.pickup;
    return `${pk.street} – ${pk.district}, ${pk.city} – CEP ${pk.cep}`;
  };

  /* ---------- Config na página ---------- */
  function bindConfig() {
    $$("[data-config]").forEach((el) => {
      const value = CONFIG[el.dataset.config];
      el.textContent = Array.isArray(value) ? value.join(" · ") : value;
    });
    $$("[data-wa]").forEach((el) => {
      el.href = waUrl(el.dataset.wa);
      el.target = "_blank";
      el.rel = "noopener";
    });
    $$("[data-insta-link]").forEach((el) => (el.href = instaUrl));
    const pk = CONFIG.pickup;
    $$("[data-pickup-address]").forEach((el) => (el.textContent = pickupText()));
    $$("[data-pickup-map]").forEach((el) =>
      (el.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pk.coords || `${pk.street}, ${pk.district}, ${pk.city}, ${pk.cep}`)}`));
    $("[data-year]").textContent = new Date().getFullYear();
    $("[data-payment-select]").innerHTML = CONFIG.payments
      .map((p) => `<option>${escapeHtml(p)}</option>`)
      .join("");
  }

  /* ---------- Tema claro / escuro ---------- */
  // O tema inicial é aplicado por um script inline no <head> (evita piscar).
  function initTheme() {
    const THEME_KEY = "sillage:theme";
    const btn = $("[data-theme-toggle]");
    const meta = $('meta[name="theme-color"]');
    const apply = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      btn.setAttribute("aria-label", theme === "dark" ? "Mudar para o tema claro" : "Mudar para o tema escuro");
      btn.setAttribute("aria-pressed", String(theme === "light"));
      meta.setAttribute("content", theme === "dark" ? "#0b0b0d" : "#f7f3ee");
    };
    apply(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      store.set(THEME_KEY, next);
    });
  }

  /* ---------- Header ---------- */
  function initHeader() {
    const header = $(".header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const nav = $("#nav");
    const btn = $(".menu-btn");
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("is-open") && !e.target.closest("#nav, .menu-btn")) setOpen(false);
    });
  }

  /* ---------- Carrossel ---------- */
  function initHero() {
    const hero = $(".hero");
    const track = $("[data-hero-track]");
    const dotsEl = $("[data-hero-dots]");
    const progress = $("[data-hero-progress]");
    const DURATION = 6000;

    track.innerHTML = SLIDES.map((s, i) => {
      const p = productById(s.product);
      const isWa = s.action === "whatsapp";
      const href = isWa ? waUrl(s.message) : s.action;
      const Tag = i === 0 ? "h1" : "h2";
      return `
      <article class="slide${photoCls(p)}" style="${bgStyle(p && p.bottle && p.bottle.bg)}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ""}>
        ${p ? `<span class="slide__watermark" aria-hidden="true">${escapeHtml(p.name)}</span>` : ""}
        <div class="container slide__inner">
          <div class="slide__content">
            <p class="slide__eyebrow">${escapeHtml(s.eyebrow)}</p>
            <${Tag} class="slide__title">${s.title.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</${Tag}>
            <p class="slide__text">${escapeHtml(s.text)}</p>
            <a class="btn btn--gold btn--lg slide__cta" href="${escapeHtml(href)}" ${isWa ? 'target="_blank" rel="noopener"' : ""} ${s.filter ? `data-set-filter="${escapeHtml(s.filter)}"` : ""} ${i ? 'tabindex="-1"' : ""}>${escapeHtml(s.cta)}${ICONS.arrow}</a>
          </div>
          <div class="slide__media">
            <span class="slide__ring" aria-hidden="true"></span>
            <span class="slide__arch slide__arch--outer" aria-hidden="true"></span>
            <span class="slide__arch" aria-hidden="true"></span>
            ${p ? productVisual(p, { eager: i === 0 }) : ""}
            ${p ? `<p class="slide__caption">${escapeHtml(fullName(p))}</p>` : ""}
          </div>
        </div>
      </article>`;
    }).join("");

    dotsEl.innerHTML = SLIDES.map(
      (s, i) => `<button class="hero__dot" type="button" role="tab" aria-label="Slide ${i + 1}: ${escapeHtml(s.title.join(" "))}" aria-selected="${i === 0}"></button>`
    ).join("");

    const pad = (n) => String(n).padStart(2, "0");
    hero.insertAdjacentHTML("beforeend",
      `<p class="hero__count" aria-hidden="true"><span data-hero-current>01</span><span class="hero__count-line"></span>${pad(SLIDES.length)}</p>`);
    const countEl = $("[data-hero-current]", hero);

    const slides = $$(".slide", track);
    const dots = $$(".hero__dot", dotsEl);
    let current = 0;
    let timer = null;
    let paused = false;

    function restartProgress() {
      progress.classList.remove("run");
      void progress.offsetWidth; // reinicia a animação
      if (!reducedMotion && !paused) {
        progress.style.setProperty("--dur", `${DURATION}ms`);
        progress.classList.add("run");
      }
    }

    function go(index) {
      const next = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === next;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        $$("a, button", slide).forEach((el) => (el.tabIndex = active ? 0 : -1));
      });
      dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === next)));
      countEl.textContent = pad(next + 1);
      current = next;
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      restartProgress();
      if (paused) return;
      timer = setTimeout(() => go(current + 1), DURATION);
    }

    function setPaused(value) {
      paused = value;
      if (value) clearTimeout(timer);
      schedule();
    }

    $("[data-hero-prev]").addEventListener("click", () => go(current - 1));
    $("[data-hero-next]").addEventListener("click", () => go(current + 1));
    dots.forEach((d, i) => d.addEventListener("click", () => go(i)));

    // O carrossel ocupa a tela inteira, então não pausa com o mouse em cima nem com foco:
    // anda sempre sozinho e só para enquanto a aba está em segundo plano.
    document.addEventListener("visibilitychange", () => setPaused(document.hidden));

    hero.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(current - 1);
      if (e.key === "ArrowRight") go(current + 1);
    });

    // Swipe (toque e mouse)
    let startX = 0, startY = 0, tracking = false;
    hero.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      tracking = true; startX = e.clientX; startY = e.clientY;
    });
    hero.addEventListener("pointerup", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
    });
    hero.addEventListener("pointercancel", () => (tracking = false));

    go(0);
  }

  /* ---------- Fragrâncias ---------- */
  function renderFamilies() {
    $("[data-families]").innerHTML = FAMILIES.filter((f) => f.id !== "todos").map((f) => {
      const count = PRODUCTS.filter((p) => !p.soldOut && p.families.includes(f.id)).length;
      if (!count) return "";
      return `
      <a class="family reveal" href="#perfumes" data-set-filter="${f.id}" style="${bgStyle(f.colors)}">
        ${familyIcon(f.id, "family__art")}
        <span class="family__badge">${familyIcon(f.id)}</span>
        <span class="family__count">${count} ${count === 1 ? "opção" : "opções"}</span>
        <strong class="family__name">${escapeHtml(f.label)}</strong>
        <span class="family__text">${escapeHtml(f.text)}</span>
        <span class="family__go">Ver opções ${ICONS.arrow}</span>
      </a>`;
    }).join("");
  }

  /* ---------- Produtos ---------- */
  const PAGE_SIZE = 12;
  const productState = new Map(PRODUCTS.map((p) => [p.id, { size: (p.sizes && p.sizes[0]) || "", qty: 1 }]));
  const view = { category: "todas", family: "todos", query: "", limit: PAGE_SIZE };

  // Busca sem acento e sem diferenciar maiúsculas.
  const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const searchText = new Map(PRODUCTS.map((p) => [p.id, fold([p.brand, p.name, p.notes ? Object.values(p.notes).join(" ") : ""].join(" "))]));

  const inCategory = (p) => view.category === "todas" || p.category === view.category;
  const matches = (p) =>
    inCategory(p) &&
    (view.family === "todos" || p.families.includes(view.family)) &&
    (!view.query || view.query.split(/\s+/).every((w) => searchText.get(p.id).includes(w)));

  // Disponíveis primeiro, esgotados no fim; dentro de cada grupo, a ordem do catálogo.
  const visibleProducts = () =>
    PRODUCTS.filter(matches).sort((x, y) => Number(!!x.soldOut) - Number(!!y.soldOut));

  const discount = (p) => (p.oldPrice && p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  function priceHtml(p) {
    if (p.price == null) return `<p class="product__price">Consulte<small>preço confirmado no WhatsApp</small></p>`;
    return `<p class="product__price">${p.oldPrice ? `<s class="price-old">${formatPrice(p.oldPrice)}</s>` : ""}${formatPrice(p.price)}<small>${p.soldOut ? "último preço praticado" : "valor confirmado no WhatsApp"}</small></p>`;
  }

  function renderCategories() {
    const el = $("[data-categories]");
    el.innerHTML = CATEGORIES.map((c) => {
      const n = PRODUCTS.filter((p) => c.id === "todas" || p.category === c.id).length;
      return `<button class="tab" type="button" role="tab" data-category="${c.id}" aria-selected="${c.id === view.category}">${escapeHtml(c.label)}<span>${n}</span></button>`;
    }).join("");
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-category]");
      if (btn) setCategory(btn.dataset.category);
    });
  }

  // Chips de família: só as famílias que existem na categoria ativa (some quando nenhuma existe).
  function renderFilters() {
    const el = $("[data-filters]");
    const present = new Set(PRODUCTS.filter(inCategory).flatMap((p) => p.families));
    if (view.family !== "todos" && !present.has(view.family)) view.family = "todos";
    const chips = FAMILIES.filter((f) => f.id === "todos" || present.has(f.id));
    el.hidden = chips.length < 2;
    el.innerHTML = chips.map(
      (c) => `<button class="chip" type="button" data-filter="${c.id}" aria-pressed="${c.id === view.family}">${familyIcon(c.id)}${escapeHtml(c.label)}</button>`
    ).join("");
  }

  function setCategory(id) {
    view.category = CATEGORIES.some((c) => c.id === id) ? id : "todas";
    view.limit = PAGE_SIZE;
    $$("[data-category]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.category === view.category)));
    renderFilters();
    renderProducts();
  }

  function setFilter(id) {
    view.family = FAMILIES.some((c) => c.id === id) ? id : "todos";
    view.limit = PAGE_SIZE;
    // Vindo de um slide ou card de família, a categoria ativa pode não ter essa família.
    if (view.family !== "todos" && !PRODUCTS.some((p) => inCategory(p) && p.families.includes(view.family))) {
      view.category = "todas";
      $$("[data-category]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.category === "todas")));
    }
    renderFilters();
    renderProducts();
  }

  function productCard(p, index) {
    const st = productState.get(p.id);
    const ask = p.soldOut
      ? `Olá, Sillage! Pode me avisar quando o ${fullName(p)} chegar? ✨`
      : `Olá, Sillage! Tenho uma dúvida sobre o ${fullName(p)} ✨`;
    const cat = CATEGORIES.find((c) => c.id === p.category);
    const off = discount(p);
    return `
    <article class="product${p.soldOut ? " is-soldout" : ""}" data-id="${p.id}" style="animation-delay:${Math.min(index % PAGE_SIZE, 8) * 50}ms">
      <div class="product__media${photoCls(p)}" style="${bgStyle(p.bottle && p.bottle.bg)}">
        ${productVisual(p)}
        <span class="product__gender">${escapeHtml(cat ? cat.label : "")}</span>
        ${p.soldOut ? '<span class="product__soldout">Esgotado</span>' : off ? `<span class="product__star">−${off}%</span>` : ""}
      </div>
      <div class="product__body">
        <p class="product__brand">${escapeHtml(p.brand)}</p>
        <h3 class="product__name">${escapeHtml(p.name)}</h3>
        ${p.families.length ? `<p class="product__families">${p.families.map((f) => `<span>${escapeHtml(familyLabel(f))}</span>`).join("")}</p>` : ""}
        ${p.notes ? `
        <dl class="notes">
          <div><dt>Topo</dt><dd>${escapeHtml(p.notes.topo)}</dd></div>
          <div><dt>Coração</dt><dd>${escapeHtml(p.notes.coracao)}</dd></div>
          <div><dt>Fundo</dt><dd>${escapeHtml(p.notes.fundo)}</dd></div>
        </dl>` : ""}
        ${p.desc ? `<p class="product__desc">${escapeHtml(p.desc)}</p>` : ""}
        ${p.sizes && p.sizes.length > 1 ? `
        <div class="product__options" role="group" aria-label="Tamanho">
          ${p.sizes.map((s) => `<button class="size" type="button" data-size="${escapeHtml(s)}" aria-pressed="${s === st.size}">${escapeHtml(s)}</button>`).join("")}
        </div>` : p.sizes && p.sizes.length ? `<p class="product__size">${escapeHtml(p.sizes[0])}</p>` : ""}
        ${priceHtml(p)}
        ${p.soldOut ? `
        <a class="btn btn--ghost product__notify" href="${escapeHtml(waUrl(ask))}" target="_blank" rel="noopener">${ICONS.chat}Avise-me quando chegar</a>` : `
        <div class="product__buy">
          <div class="qty" role="group" aria-label="Quantidade">
            <button type="button" data-qty="-1" aria-label="Diminuir quantidade">−</button>
            <output aria-live="polite">${st.qty}</output>
            <button type="button" data-qty="1" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="btn btn--gold" type="button" data-add>${ICONS.bag}Adicionar</button>
        </div>
        <a class="product__ask" href="${escapeHtml(waUrl(ask))}" target="_blank" rel="noopener">${ICONS.chat}Tirar dúvida no WhatsApp</a>`}
      </div>
    </article>`;
  }

  function renderProducts() {
    const list = visibleProducts();
    const shown = list.slice(0, view.limit);
    const el = $("[data-products]");
    el.scrollLeft = 0;
    el.innerHTML = shown.length
      ? shown.map(productCard).join("")
      : '<p class="products__empty">Nada encontrado por aqui. Chama a gente no WhatsApp que a gente procura para você!</p>';
    const more = $("[data-more]");
    const rest = list.length - shown.length;
    more.hidden = rest <= 0;
    more.textContent = `Ver mais ${Math.min(rest, PAGE_SIZE)} de ${rest}`;
    $("[data-results]").textContent = `${list.length} ${list.length === 1 ? "produto" : "produtos"}`;
  }

  function initProducts() {
    renderCategories();
    renderFilters();
    renderProducts();

    $("[data-filters]").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (btn) setFilter(btn.dataset.filter);
    });

    let searchTimer;
    $("[data-search]").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        view.query = fold(e.target.value.trim());
        view.limit = PAGE_SIZE;
        renderProducts();
      }, 150);
    });

    $("[data-more]").addEventListener("click", () => {
      const before = view.limit;
      view.limit += PAGE_SIZE;
      renderProducts();
      // Leva o foco ao primeiro card novo (teclado/leitor de tela não se perdem).
      const first = $$("[data-products] .product")[before];
      if (first) first.querySelector("button, a")?.focus({ preventScroll: true });
    });

    $("[data-products]").addEventListener("click", (e) => {
      const card = e.target.closest(".product");
      if (!card) return;
      const id = card.dataset.id;
      const st = productState.get(id);

      const sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) {
        st.size = sizeBtn.dataset.size;
        $$("[data-size]", card).forEach((b) => b.setAttribute("aria-pressed", String(b === sizeBtn)));
        return;
      }
      const qtyBtn = e.target.closest("[data-qty]");
      if (qtyBtn) {
        st.qty = Math.min(99, Math.max(1, st.qty + Number(qtyBtn.dataset.qty)));
        $("output", card).textContent = st.qty;
        return;
      }
      if (e.target.closest("[data-add]")) {
        if (!cart.add(id, st.size, st.qty)) return;
        toast(`<strong>${st.qty}×</strong> ${escapeHtml(fullName(productById(id)))} na sacola`);
        st.qty = 1;
        $("output", card).textContent = 1;
      }
    });

    // Slides e cards de fragrância com data-set-filter filtram e rolam até #perfumes (pelo href).
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-set-filter]");
      if (link) setFilter(link.dataset.setFilter);
    });
  }

  /* ---------- Faixa animada ---------- */
  function renderMarquee() {
    // Conteúdo repetido duas vezes: a animação anda -50% e recomeça sem emenda.
    const row = MARQUEE.map((w) => `<span>${escapeHtml(w)}</span>${ICONS.star}`).join("");
    $("[data-marquee]").innerHTML = `<div class="marquee__group">${row}</div><div class="marquee__group">${row}</div>`;
  }

  /* ---------- Destaque da casa ---------- */
  function renderSpotlight() {
    const el = $("[data-spotlight]");
    const p = productById(SPOTLIGHT.product);
    if (!p) { el.hidden = true; return; }
    const tiers = p.notes ? [["Topo", p.notes.topo, "Primeiras impressões"], ["Coração", p.notes.coracao, "A alma do perfume"], ["Fundo", p.notes.fundo, "O rastro que fica"]] : [];
    el.innerHTML = `
      <div class="container spotlight__grid">
        <div class="spotlight__media reveal${photoCls(p)}" style="${bgStyle(p.bottle && p.bottle.bg)}">
          <span class="spotlight__frame" aria-hidden="true"></span>
          ${productVisual(p)}
          <span class="spotlight__seal" aria-hidden="true">${ICONS.star}<span>Destaque<br>da casa</span></span>
        </div>
        <div class="spotlight__content reveal">
          <p class="kicker">Destaque da casa</p>
          <h2 class="display" id="spot-title">${escapeHtml(p.brand)} <em>${escapeHtml(p.name)}</em></h2>
          <p class="spotlight__sub">${escapeHtml(SPOTLIGHT.title)}</p>
          <p class="spotlight__text">${escapeHtml(SPOTLIGHT.text)}</p>
          <ol class="pyramid" aria-label="Pirâmide olfativa">
            ${tiers.map(([label, notes, hint], i) => `
            <li class="pyramid__tier pyramid__tier--${i + 1}">
              <span class="pyramid__label">${label}<small>${hint}</small></span>
              <span class="pyramid__notes">${escapeHtml(notes)}</span>
            </li>`).join("")}
          </ol>
          ${p.price != null ? `<div class="spotlight__price">${priceHtml(p)}</div>` : ""}
          <ul class="spotlight__facts">${SPOTLIGHT.facts.map((f) => `<li>${ICONS.star}${escapeHtml(f)}</li>`).join("")}</ul>
          <div class="spotlight__cta">
            <button class="btn btn--gold btn--lg" type="button" data-spot-add>${ICONS.bag}Adicionar à sacola</button>
            <a class="btn btn--ghost btn--lg" href="${escapeHtml(waUrl(`Olá, Sillage! Quero saber mais sobre o ${fullName(p)} ✨`))}" target="_blank" rel="noopener">${ICONS.chat}Saber mais</a>
          </div>
        </div>
      </div>`;
    $("[data-spot-add]", el).addEventListener("click", () => {
      if (!cart.add(p.id, (p.sizes && p.sizes[0]) || "", 1)) return;
      toast(`<strong>1×</strong> ${escapeHtml(fullName(p))} na sacola`);
    });
  }

  /* ---------- Instagram ---------- */
  function renderInstagram() {
    $("[data-insta]").innerHTML = INSTAGRAM_TILES.map(productById).filter(Boolean).map(
      (p) => `
      <a class="insta-post reveal${photoCls(p)}" href="${escapeHtml(instaUrl)}" target="_blank" rel="noopener" aria-label="Ver ${escapeHtml(fullName(p))} no Instagram" style="${bgStyle(p.bottle && p.bottle.bg)}">
        ${productVisual(p)}
        <span class="insta-post__overlay">${ICONS.insta}</span>
      </a>`
    ).join("");
  }

  /* ---------- Sacola ---------- */
  const CART_KEY = "sillage:cart:v1";
  const CUSTOMER_KEY = "sillage:customer:v1";

  const cart = {
    // Descarta itens de versões antigas do catálogo e os que esgotaram.
    items: store.get(CART_KEY, []).filter((it) => it && productById(it.id) && !productById(it.id).soldOut && it.qty > 0),

    key: (id, size) => `${id}::${size}`,

    // Retorna false (e não adiciona) se o produto estiver esgotado.
    add(id, size, qty) {
      const p = productById(id);
      if (!p || p.soldOut) { toast("Esse perfume está esgotado no momento."); return false; }
      const found = this.items.find((it) => this.key(it.id, it.size) === this.key(id, size));
      if (found) found.qty = Math.min(99, found.qty + qty);
      else this.items.push({ id, size, qty });
      this.save(true);
      return true;
    },
    setQty(index, qty) {
      if (qty <= 0) this.items.splice(index, 1);
      else this.items[index].qty = Math.min(99, qty);
      this.save();
    },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((n, it) => n + it.qty, 0); },
    save(bump = false) {
      store.set(CART_KEY, this.items);
      renderCart();
      if (bump) {
        const btn = $(".cart-btn");
        btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
      }
    },
  };

  let onCartChange = null; // definido pelo checkout (recalcula as parcelas)

  function renderCart() {
    if (onCartChange) onCartChange();
    const count = cart.count();
    $$("[data-cart-count]").forEach((el) => (el.textContent = count));
    const cartBtn = $(".cart-btn");
    cartBtn.setAttribute("aria-label", `Abrir sacola (${count} ${count === 1 ? "item" : "itens"})`);
    cartBtn.classList.toggle("has-items", count > 0);

    const empty = cart.items.length === 0;
    $("[data-cart-empty]").hidden = !empty;
    $("[data-checkout]").hidden = empty;
    $("[data-cart-foot]").hidden = empty;

    $("[data-cart-list]").innerHTML = cart.items.map((it, i) => {
      const p = productById(it.id);
      const unit = p.price != null ? formatPrice(p.price * it.qty) : "Consultar preço";
      return `
      <li class="cart-item" data-index="${i}">
        <div class="cart-item__thumb${photoCls(p)}" style="${bgStyle(p.bottle && p.bottle.bg)}">${productVisual(p)}</div>
        <div class="cart-item__info">
          <p class="cart-item__name">${escapeHtml(fullName(p))}</p>
          <p class="cart-item__meta">${it.size ? `${escapeHtml(it.size)} · ` : ""}${unit}</p>
          <button class="cart-item__remove" type="button" data-remove>Remover</button>
        </div>
        <div class="qty qty--sm" role="group" aria-label="Quantidade de ${escapeHtml(fullName(p))}">
          <button type="button" data-cart-qty="-1" aria-label="Diminuir">−</button>
          <output>${it.qty}</output>
          <button type="button" data-cart-qty="1" aria-label="Aumentar">+</button>
        </div>
      </li>`;
    }).join("");
  }

  /* ---------- Gaveta ---------- */
  function initDrawer() {
    const drawer = $("#sacola");
    const backdrop = $(".drawer-backdrop");
    let lastFocus = null;

    const focusables = () =>
      $$('a[href], button:not([disabled]), input, select, textarea', drawer).filter((el) => el.offsetParent !== null);

    function open() {
      lastFocus = document.activeElement;
      backdrop.hidden = false;
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      setTimeout(() => $(".drawer__head .icon-btn").focus(), 50);
    }
    function close() {
      if (!drawer.classList.contains("is-open")) return;
      backdrop.hidden = true;
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    $$("[data-open-cart]").forEach((b) => b.addEventListener("click", open));
    $$("[data-close-cart]").forEach((b) => b.addEventListener("click", close));

    document.addEventListener("keydown", (e) => {
      if (!drawer.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $("[data-cart-list]").addEventListener("click", (e) => {
      const li = e.target.closest(".cart-item");
      if (!li) return;
      const index = Number(li.dataset.index);
      if (e.target.closest("[data-remove]")) cart.setQty(index, 0);
      const q = e.target.closest("[data-cart-qty]");
      if (q) cart.setQty(index, cart.items[index].qty + Number(q.dataset.cartQty));
    });

    initCheckout(close);
  }

  // Subtotal da sacola (itens sem preço ficam "a consultar").
  function cartTotal() {
    let total = 0, allPriced = true;
    cart.items.forEach((it) => {
      const p = productById(it.id);
      if (p.price != null) total += p.price * it.qty; else allPriced = false;
    });
    return { total, allPriced };
  }

  /* ---------- Select personalizado ----------
     A lista nativa do <select> não aceita estilo. O <select> continua no formulário (guarda o valor
     e funciona sem JS); por cima dele vai um botão + listbox acessível com as cores do site.
     Depois de trocar as opções ou o valor por código, chame refreshSelect(select). */
  const selectUi = new WeakMap();
  let selectUid = 0;

  function enhanceSelect(select) {
    const id = `cs${++selectUid}`;
    const wrap = document.createElement("div");
    wrap.className = "cselect";
    select.classList.add("cselect__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.insertAdjacentHTML("beforeend", `
      <button type="button" class="cselect__btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">
        <span class="cselect__value"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <ul class="cselect__list" id="${id}" role="listbox" tabindex="-1" hidden></ul>`);
    const btn = $(".cselect__btn", wrap);
    const list = $(".cselect__list", wrap);
    const label = select.closest("label")?.querySelector("span");
    if (label) { label.id ||= `${id}-label`; btn.setAttribute("aria-labelledby", `${label.id} ${id}-value`); list.setAttribute("aria-labelledby", label.id); }
    $(".cselect__value", wrap).id = `${id}-value`;
    let active = 0;

    const options = () => [...select.options];
    function refresh() {
      const opts = options();
      list.innerHTML = opts.map((o, i) =>
        `<li class="cselect__opt" role="option" id="${id}-o${i}" data-i="${i}" aria-selected="${o.selected}">${escapeHtml(o.text)}</li>`).join("");
      $(".cselect__value", wrap).textContent = select.selectedOptions[0]?.text || "";
    }
    function setActive(i) {
      const items = $$(".cselect__opt", list);
      if (!items.length) return;
      active = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((li, k) => li.classList.toggle("is-active", k === active));
      list.setAttribute("aria-activedescendant", items[active].id);
      items[active].scrollIntoView({ block: "nearest" });
    }
    function open() {
      refresh();
      list.hidden = false;
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      setActive(select.selectedIndex);
      list.focus({ preventScroll: true });
      // Dentro da gaveta a lista pode abrir abaixo da área visível: rola só o necessário.
      list.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    }
    function close(focusBtn = true) {
      if (list.hidden) return;
      list.hidden = true;
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (focusBtn) btn.focus({ preventScroll: true });
    }
    function choose(i) {
      if (select.selectedIndex !== i) {
        select.selectedIndex = i;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      refresh();
      close();
    }

    btn.addEventListener("click", () => (list.hidden ? open() : close()));
    btn.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); open(); }
    });
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".cselect__opt");
      if (li) choose(Number(li.dataset.i));
    });
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".cselect__opt");
      if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i));
    });
    list.addEventListener("keydown", (e) => {
      const n = select.options.length;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Home") { e.preventDefault(); setActive(0); }
      else if (e.key === "End") { e.preventDefault(); setActive(n - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === "Tab") close(false);
    });
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(false); });
    select.addEventListener("change", refresh);

    selectUi.set(select, refresh);
    refresh();
  }
  const refreshSelect = (select) => { const fn = selectUi.get(select); if (fn) fn(); };

  /* ---------- Checkout → WhatsApp ---------- */
  function initCheckout(closeDrawer) {
    const form = $("[data-checkout]");
    const errorEl = $("[data-form-error]");
    const addressField = $("[data-address-field]");
    const installmentsField = $("[data-installments-field]");
    const installmentsSelect = $("[data-installments-select]");
    const saved = store.get(CUSTOMER_KEY, {}) || {};

    ["name", "address", "cep", "number"].forEach((k) => { if (saved[k]) form.elements[k].value = saved[k]; });
    if (CONFIG.payments.includes(saved.payment)) form.elements.payment.value = saved.payment;
    if (saved.mode === "entrega" || saved.mode === "retirada") form.elements.mode.value = saved.mode;

    // Parcelas: só aparecem no cartão de crédito. Com subtotal conhecido, mostra o valor de cada parcela.
    const isCredit = () => form.elements.payment.value === CONFIG.creditCard;
    function renderInstallments() {
      const keep = Number(installmentsSelect.value) || Number(saved.installments) || 1;
      const { total } = cartTotal();
      installmentsSelect.innerHTML = Array.from({ length: CONFIG.maxInstallments }, (_, i) => {
        const n = i + 1;
        const label = total > 0
          ? `${n}x de ${formatPrice(total / n)}${n === 1 ? " (à vista)" : " sem juros"}`
          : `${n}x${n === 1 ? " (à vista)" : " sem juros"}`;
        return `<option value="${n}">${label}</option>`;
      }).join("");
      installmentsSelect.value = String(Math.min(keep, CONFIG.maxInstallments));
      refreshSelect(installmentsSelect);
    }
    onCartChange = renderInstallments;

    const syncMode = () => {
      addressField.hidden = form.elements.mode.value !== "entrega";
      $("[data-pickup]").hidden = form.elements.mode.value !== "retirada";
      installmentsField.hidden = !isCredit();
    };
    enhanceSelect(form.elements.payment);
    enhanceSelect(installmentsSelect);
    renderInstallments();
    syncMode();
    form.addEventListener("change", syncMode);
    form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
    form.addEventListener("submit", (e) => { e.preventDefault(); send(); });

    /* CEP → endereço (ViaCEP: gratuito, sem chave, aceita chamada direto do navegador). */
    const cepInput = form.elements.cep;
    const cepStatus = $("[data-cep-status]");
    const cepHint = cepStatus.innerHTML;
    const cepDigits = () => cepInput.value.replace(/\D/g, "");
    let cepRequest = 0;
    async function lookupCep() {
      const cep = cepDigits();
      if (cep.length !== 8) return;
      const req = ++cepRequest;
      cepStatus.textContent = "Buscando endereço…";
      cepStatus.dataset.state = "loading";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (req !== cepRequest) return; // o cliente já digitou outro CEP
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (d.erro) {
          cepInput.classList.add("is-invalid");
          cepStatus.textContent = "CEP não encontrado. Confira o número ou preencha o endereço abaixo.";
          cepStatus.dataset.state = "error";
          return;
        }
        // Complemento do CEP às vezes vem entre parênteses, ex.: "(Bom Sucesso)".
        const street = [d.logradouro, d.complemento && (d.complemento.startsWith("(") ? d.complemento : `(${d.complemento})`)].filter(Boolean).join(" ");
        const place = [street, d.bairro, d.localidade && `${d.localidade}/${d.uf}`].filter(Boolean).join(", ");
        form.elements.address.value = place;
        form.elements.address.classList.remove("is-invalid");
        cepStatus.textContent = `Endereço encontrado: ${d.localidade}/${d.uf}. Confira e informe o número.`;
        cepStatus.dataset.state = "ok";
        if (!form.elements.number.value.trim()) form.elements.number.focus();
      } catch {
        if (req !== cepRequest) return;
        cepStatus.textContent = "Não foi possível buscar o CEP agora. Preencha o endereço abaixo.";
        cepStatus.dataset.state = "error";
      }
    }
    cepInput.addEventListener("input", () => {
      const d = cepDigits().slice(0, 8);
      cepInput.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
      if (d.length === 8) lookupCep();
      else { cepRequest++; cepStatus.innerHTML = cepHint; delete cepStatus.dataset.state; }
    });

    function buildMessage(data) {
      const lines = ["*Novo pedido pelo site – Sillage Perfumes* ✨", ""];
      const { total, allPriced } = cartTotal();
      cart.items.forEach((it) => {
        const p = productById(it.id);
        let line = `• ${it.qty}x ${fullName(p)}${it.size ? ` (${it.size})` : ""}`;
        if (p.price != null) line += ` – ${formatPrice(p.price * it.qty)}`;
        lines.push(line);
      });
      if (total > 0) lines.push("", `*Subtotal:* ${formatPrice(total)}${allPriced ? "" : " + itens a consultar"}`);
      lines.push(
        "",
        `*Nome:* ${data.name}`,
        `*Recebimento:* ${data.mode === "entrega" ? "Entrega" : `Retirada em ${pickupText()}`}`
      );
      if (data.mode === "entrega") {
        const addr = [data.address, data.number && `nº ${data.number}`].filter(Boolean).join(", ");
        lines.push(`*Endereço:* ${addr}${data.cep ? ` – CEP ${data.cep}` : ""}`);
      }
      if (data.installments) {
        const each = total > 0 ? ` de ${formatPrice(total / data.installments)}` : "";
        lines.push(`*Pagamento:* ${data.payment} em ${data.installments}x${each}${data.installments === 1 ? " (à vista)" : " sem juros"}`);
      } else {
        lines.push(`*Pagamento:* ${data.payment}`);
      }
      if (data.notes) lines.push(`*Obs.:* ${data.notes}`);
      lines.push("", "Pode confirmar os valores e a disponibilidade? Obrigado!");
      return lines.join("\n");
    }

    function send() {
      const data = {
        name: form.elements.name.value.trim(),
        mode: form.elements.mode.value,
        address: form.elements.address.value.trim(),
        cep: form.elements.cep.value.trim(),
        number: form.elements.number.value.trim(),
        payment: form.elements.payment.value,
        installments: isCredit() ? Number(installmentsSelect.value) || 1 : null,
        notes: form.elements.notes.value.trim(),
      };
      if (!cart.items.length) { errorEl.textContent = "Sua sacola está vazia."; return; }
      const missing = [];
      if (!data.name) missing.push(form.elements.name);
      if (data.mode === "entrega" && data.cep && data.cep.replace(/\D/g, "").length !== 8) missing.push(form.elements.cep);
      if (data.mode === "entrega" && data.address.length < 6) missing.push(form.elements.address);
      if (data.mode === "entrega" && !data.number) missing.push(form.elements.number);
      missing.forEach((el) => el.classList.add("is-invalid"));
      if (missing.length) {
        const noName = missing.includes(form.elements.name);
        const noAddress = missing.some((el) => el !== form.elements.name);
        errorEl.textContent = noName && noAddress
          ? "Preencha seu nome e o endereço completo para a entrega."
          : noAddress ? "Preencha o endereço completo para a entrega (CEP válido, rua e número)." : "Preencha seu nome para continuar.";
        missing[0].focus();
        return;
      }
      errorEl.textContent = "";
      store.set(CUSTOMER_KEY, { name: data.name, mode: data.mode, address: data.address, cep: data.cep, number: data.number, payment: data.payment, installments: data.installments });

      openExternal(waUrl(buildMessage(data)));

      form.elements.notes.value = "";
      cart.clear();
      closeDrawer();
      toast("Pedido enviado! <strong>Finalize a conversa no WhatsApp.</strong>");
    }

    $("[data-send-order]").addEventListener("click", send);
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    $$(".section-head, .step").forEach((el) => el.classList.add("reveal"));
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Init ---------- */
  bindConfig();
  initTheme();
  initHeader();
  initHero();
  renderMarquee();
  initProducts();
  renderSpotlight();
  renderFamilies();
  renderInstagram();
  renderCart();
  initDrawer();
  initReveal();
})();
