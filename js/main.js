/* Sillage — comportamento da página (sem dependências). Conteúdo vem de js/data.js;
   os produtos vêm do painel (/api/products), com o PRODUCTS do data.js como reserva. Funções e modelos
   de HTML compartilhados com o gerador de páginas (scripts/build.mjs) ficam em js/catalog.js.
   Roda na home e nas páginas geradas (produto, marca, família…): cada seção só é montada se existir. */
(async (FALLBACK_PRODUCTS) => {
  "use strict";

  // Se a API não responder (site aberto como arquivo, sem rede, API fora), usa a cópia do data.js.
  async function loadProducts() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch("/api/products", { signal: ctrl.signal });
      clearTimeout(timer);
      const list = res.ok ? await res.json() : null;
      if (Array.isArray(list) && list.length) return list;
    } catch (e) { /* cai na reserva */ }
    return FALLBACK_PRODUCTS;
  }
  const PRODUCTS = await loadProducts();

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const {
    escapeHtml, waUrl, instaUrl, formatPrice, productById, sizeOptions, priceFor,
    fullName, ICONS, familyIcon, productVisual, photoCls, bgStyle, priceHtml, productCard,
  } = createShop(PRODUCTS);

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
    $("[data-seller-select]").innerHTML = CONFIG.sellers
      .map((s) => `<option>${escapeHtml(s)}</option>`)
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
      return `
      <article class="slide${photoCls(p)}" style="${bgStyle(p && p.bottle && p.bottle.bg)}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ""}>
        ${p ? `<span class="slide__watermark" aria-hidden="true">${escapeHtml(p.name)}</span>` : ""}
        <div class="container slide__inner">
          <div class="slide__content">
            <p class="slide__eyebrow">${escapeHtml(s.eyebrow)}</p>
            <h2 class="slide__title">${s.title.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</h2>
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
  const productState = new Map(PRODUCTS.map((p) => [p.id, { size: sizeOptions(p)[0].size, qty: 1 }]));
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

  function renderProducts() {
    const list = visibleProducts();
    const shown = list.slice(0, view.limit);
    const el = $("[data-products]");
    el.scrollLeft = 0;
    el.innerHTML = shown.length
      ? shown.map((p, i) => productCard(p, i, productState.get(p.id))).join("")
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

    // Slides e cards de fragrância com data-set-filter filtram e rolam até #perfumes (pelo href).
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-set-filter]");
      if (link) setFilter(link.dataset.setFilter);
    });
  }

  // Volume, quantidade e "Adicionar" de qualquer card ou bloco de compra (home e páginas geradas).
  function initProductActions() {
    document.addEventListener("click", (e) => {
      const card = e.target.closest("[data-id]");
      if (!card) return;
      const id = card.dataset.id;
      const st = productState.get(id);

      const sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) {
        st.size = sizeBtn.dataset.size;
        $$("[data-size]", card).forEach((b) => b.setAttribute("aria-pressed", String(b === sizeBtn)));
        $(".product__price", card).outerHTML = priceHtml(productById(id), st.size);
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
        toast(`<strong>${st.qty}×</strong> ${escapeHtml(fullName(productById(id)))}${st.size ? ` (${escapeHtml(st.size)})` : ""} na sacola`);
        st.qty = 1;
        $("output", card).textContent = 1;
      }
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
      if (!cart.add(p.id, sizeOptions(p)[0].size, 1)) return;
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
    // Tamanho que não existe mais (versão antiga do site) volta para o primeiro frasco.
    items: store.get(CART_KEY, [])
      .filter((it) => it && productById(it.id) && !productById(it.id).soldOut && it.qty > 0)
      .map((it) => {
        const opts = sizeOptions(productById(it.id));
        return opts.some((o) => o.size === it.size) ? it : { ...it, size: opts[0].size };
      }),

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
      const price = priceFor(p, it.size);
      const unit = price != null ? formatPrice(price * it.qty) : "Consultar preço";
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
      const price = priceFor(p, it.size);
      if (price != null) total += price * it.qty; else allPriced = false;
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
    enhanceSelect(form.elements.seller);
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
        const price = priceFor(p, it.size);
        if (price != null) line += ` – ${formatPrice(price * it.qty)}`;
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
      lines.push(`*Vendedor:* ${data.seller}`);
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
        seller: form.elements.seller.value || CONFIG.sellers[0],
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
  const has = (sel) => !!$(sel);
  bindConfig();
  initTheme();
  initHeader();
  if (has(".hero")) initHero();
  if (has("[data-marquee]")) renderMarquee();
  if (has("[data-products]")) initProducts();
  initProductActions();
  if (has("[data-spotlight]")) renderSpotlight();
  if (has("[data-families]")) renderFamilies();
  if (has("[data-insta]")) renderInstagram();
  renderCart();
  initDrawer();
  initReveal();
})(PRODUCTS);
