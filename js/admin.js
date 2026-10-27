/* Sillage — painel da loja (/admin). Fala com /api/admin/*; CATEGORIES e FAMILIES vêm de js/data.js. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const formatPrice = (v) => (v == null ? "Consulte" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  // Preço digitado: "279", "279,90", "1.299,90" ou "279.90". Vazio → null.
  function parseMoney(text) {
    let s = String(text || "").replace(/[R$\s]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
  }
  const moneyText = (v) => (v == null ? "" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  const slugify = (s) =>
    String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const imgSrc = (image) => (image ? (image.startsWith("/") ? image : `/${image}`) : "");
  const categoryLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;

  /* ---------- API ---------- */
  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.endsWith("/login")) { showLogin(); throw new Error(data.error || "Faça login de novo."); }
    if (!res.ok) throw new Error(data.error || "Não foi possível salvar. Tente de novo.");
    return data;
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(text, isError) {
    const el = $("[data-toast]");
    el.textContent = text;
    el.classList.toggle("is-error", !!isError);
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 3200);
  }

  /* ---------- Telas ---------- */
  function show(view) {
    $$("[data-view]").forEach((el) => { el.hidden = el.dataset.view !== view; });
    window.scrollTo(0, 0);
  }

  function showLogin() {
    show("login");
    $("[data-login-form] input").focus();
  }

  $("[data-login-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $("[data-login-msg]");
    msg.textContent = "";
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password: form.password.value }) });
      form.reset();
      await openList();
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  $("[data-logout]").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    showLogin();
  });

  /* ---------- Lista ---------- */
  let products = [];
  const filters = { query: "", category: "", stock: "" };
  const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtering = () => Boolean(filters.query || filters.category || filters.stock);

  const visible = () => products.filter((p) =>
    (!filters.category || p.category === filters.category) &&
    (!filters.stock || (filters.stock === "esgotado") === !!p.soldOut) &&
    (!filters.query || fold(`${p.brand} ${p.name}`).includes(fold(filters.query))));

  async function openList() {
    products = await api("/api/admin/products");
    // Primeiro acesso: o banco vem vazio e recebe o catálogo de js/data.js.
    if (!products.length && typeof PRODUCTS !== "undefined" && PRODUCTS.length) {
      await api("/api/admin/import", { method: "POST", body: JSON.stringify({ products: PRODUCTS }) });
      products = await api("/api/admin/products");
      toast(`${products.length} produtos importados do site.`);
    }
    show("list");
    renderList();
  }

  function renderList() {
    const list = visible();
    const canMove = !filtering();
    $("[data-count]").textContent =
      `${list.length} de ${products.length} produtos` + (canMove ? " · use as setas para mudar a ordem no site" : "");
    $("[data-list]").innerHTML = list.map((p) => {
      const i = products.indexOf(p);
      return `
      <li class="row${p.soldOut ? " is-soldout" : ""}" data-id="${escapeHtml(p.id)}">
        <div class="row__thumb">${p.image ? `<img src="${escapeHtml(imgSrc(p.image))}" alt="" loading="lazy">` : ""}</div>
        <button class="row__main" type="button" data-edit>
          <span class="row__brand">${escapeHtml(p.brand)} · ${escapeHtml(categoryLabel(p.category))}</span>
          <span class="row__name">${escapeHtml(p.name)}</span>
          <span class="row__price">${p.oldPrice ? `<s>${formatPrice(p.oldPrice)}</s> ` : ""}${formatPrice(p.price)}${p.bottles ? ` <small>+${p.bottles.length - 1} tamanho(s)</small>` : ""}</span>
        </button>
        <label class="switch switch--sm" title="Esgotado">
          <input type="checkbox" data-soldout ${p.soldOut ? "checked" : ""}><span>Esgotado</span>
        </label>
        ${canMove ? `
        <div class="row__move">
          <button class="icon-btn" type="button" data-move="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>▲</button>
          <button class="icon-btn" type="button" data-move="1" aria-label="Descer" ${i === products.length - 1 ? "disabled" : ""}>▼</button>
        </div>` : ""}
      </li>`;
    }).join("") || `<li class="empty">Nenhum produto encontrado.</li>`;
  }

  $("[data-search]").addEventListener("input", (e) => { filters.query = e.target.value.trim(); renderList(); });
  $("[data-filter-category]").innerHTML =
    `<option value="">Todas as categorias</option>` +
    CATEGORIES.filter((c) => c.id !== "todas").map((c) => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join("");
  $("[data-filter-category]").addEventListener("change", (e) => { filters.category = e.target.value; renderList(); });
  $("[data-filter-stock]").addEventListener("change", (e) => { filters.stock = e.target.value; renderList(); });

  $("[data-list]").addEventListener("click", async (e) => {
    const row = e.target.closest("[data-id]");
    if (!row) return;
    const p = products.find((x) => x.id === row.dataset.id);
    if (e.target.closest("[data-edit]")) { openForm(p); return; }

    const move = e.target.closest("[data-move]");
    if (move) {
      const i = products.indexOf(p);
      const j = i + Number(move.dataset.move);
      if (j < 0 || j >= products.length) return;
      [products[i], products[j]] = [products[j], products[i]];
      renderList();
      try {
        await api("/api/admin/reorder", { method: "POST", body: JSON.stringify({ ids: products.map((x) => x.id) }) });
      } catch (err) {
        toast(err.message, true);
        await openList();
      }
    }
  });

  // Esgotado: salva na hora, sem abrir o formulário.
  $("[data-list]").addEventListener("change", async (e) => {
    if (!e.target.matches("[data-soldout]")) return;
    const id = e.target.closest("[data-id]").dataset.id;
    const p = products.find((x) => x.id === id);
    const next = { ...p, soldOut: e.target.checked };
    try {
      const saved = await api(`/api/admin/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(next) });
      products[products.indexOf(p)] = saved;
      toast(saved.soldOut ? `${p.name}: marcado como esgotado` : `${p.name}: disponível de novo`);
    } catch (err) {
      e.target.checked = !e.target.checked;
      toast(err.message, true);
    }
    renderList();
  });

  /* ---------- Formulário ---------- */
  const form = $("[data-product-form]");
  let editing = null; // produto aberto (null = novo)
  let image = "";     // caminho da foto atual do formulário

  $("[data-category-select]").innerHTML =
    `<option value="">Escolha…</option>` +
    CATEGORIES.filter((c) => c.id !== "todas").map((c) => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join("");
  $("[data-families]").innerHTML = FAMILIES.filter((f) => f.id !== "todos").map((f) => `
    <label class="chip"><input type="checkbox" name="families" value="${f.id}"><span>${escapeHtml(f.label)}</span></label>`).join("");

  function sizeRow(size = "", price = null) {
    const el = document.createElement("div");
    el.className = "size-row";
    el.innerHTML = `
      <label class="field"><span>Tamanho</span><input data-size value="${escapeHtml(size)}" maxlength="40" placeholder="Ex.: 100 ml"></label>
      <label class="field"><span>Preço (R$)</span><input data-price inputmode="decimal" value="${escapeHtml(moneyText(price))}" placeholder="Ex.: 279,00"></label>
      <button class="icon-btn" type="button" data-remove-size aria-label="Remover tamanho">✕</button>`;
    return el;
  }
  function refreshSizeButtons() {
    const rows = $$(".size-row", form);
    rows.forEach((r) => { $("[data-remove-size]", r).hidden = rows.length === 1; });
  }
  $("[data-add-size]").addEventListener("click", () => {
    $("[data-sizes]").append(sizeRow());
    refreshSizeButtons();
    $$(".size-row [data-size]", form).pop().focus();
  });
  $("[data-sizes]").addEventListener("click", (e) => {
    if (!e.target.closest("[data-remove-size]")) return;
    e.target.closest(".size-row").remove();
    refreshSizeButtons();
  });

  function setPhoto(path) {
    image = path || "";
    $("[data-photo-preview]").innerHTML = image ? `<img src="${escapeHtml(imgSrc(image))}" alt="">` : "<span>Sem foto</span>";
    $("[data-photo-remove]").hidden = !image;
  }
  $("[data-photo-remove]").addEventListener("click", () => setPhoto(""));

  function openForm(p) {
    editing = p || null;
    form.reset();
    $("[data-form-msg]").textContent = "";
    $("[data-form-title]").textContent = p ? `${p.brand} ${p.name}` : "Novo produto";
    $("[data-delete]").hidden = !p;
    if (p) {
      form.brand.value = p.brand;
      form.name.value = p.name;
      form.category.value = p.category;
      $$("[name=families]", form).forEach((c) => { c.checked = p.families.includes(c.value); });
      form.oldPrice.value = moneyText(p.oldPrice);
      form.soldOut.checked = !!p.soldOut;
      form.noDecant.checked = p.decant === false;
      form.topo.value = (p.notes && p.notes.topo) || "";
      form.coracao.value = (p.notes && p.notes.coracao) || "";
      form.fundo.value = (p.notes && p.notes.fundo) || "";
      form.desc.value = p.desc || "";
    }
    const bottles = p && p.bottles ? p.bottles : [{ size: (p && p.sizes && p.sizes[0]) || "", price: p ? p.price : null }];
    $("[data-sizes]").replaceChildren(...bottles.map((b) => sizeRow(b.size, b.price)));
    refreshSizeButtons();
    setPhoto(p && p.image);
    show("form");
  }

  $("[data-new]").addEventListener("click", () => openForm(null));
  $("[data-back]").addEventListener("click", () => { show("list"); renderList(); });

  // Monta o produto a partir do formulário. Campos que o painel não edita (ex.: volume) são mantidos.
  function readForm() {
    const rows = $$(".size-row", form).map((r) => ({ size: $("[data-size]", r).value.trim(), price: parseMoney($("[data-price]", r).value) }));
    if (rows.some((r) => Number.isNaN(r.price))) throw new Error("Confira o preço: use só números, como 279,90.");
    if (rows.length > 1 && rows.some((r) => !r.size)) throw new Error("Com mais de um tamanho, preencha o nome de cada um (ex.: 100 ml).");
    const oldPrice = parseMoney(form.oldPrice.value);
    if (Number.isNaN(oldPrice)) throw new Error("Confira o preço antigo: use só números, como 429,00.");
    if (oldPrice != null && (rows[0].price == null || oldPrice <= rows[0].price)) {
      throw new Error("O preço antigo precisa ser maior que o preço atual.");
    }
    const families = $$("[name=families]:checked", form).map((c) => c.value);
    const fam = FAMILIES.find((f) => f.id === families[0]);
    const base = editing ? { ...editing } : {};
    ["oldPrice", "notes", "desc", "sizes", "bottles", "soldOut", "decant"].forEach((k) => delete base[k]);
    return {
      ...base,
      brand: form.brand.value.trim(),
      name: form.name.value.trim(),
      category: form.category.value,
      families,
      price: rows[0].price,
      bottles: rows,
      oldPrice,
      soldOut: form.soldOut.checked,
      decant: form.noDecant.checked ? false : undefined,
      notes: { topo: form.topo.value, coracao: form.coracao.value, fundo: form.fundo.value },
      desc: form.desc.value,
      image,
      bottle: editing && editing.bottle ? editing.bottle : { bg: fam ? fam.colors : ["#c9a24a", "#2e1c08"] },
    };
  }

  // Reduz a foto para no máximo 900 px (JPEG) antes de enviar: carrega rápido no site.
  async function shrinkPhoto(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // PNG transparente vira fundo branco, não preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  }

  $("[data-photo-input]").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const preview = $("[data-photo-preview]");
    preview.innerHTML = "<span>Enviando…</span>";
    try {
      const blob = await shrinkPhoto(file);
      const body = new FormData();
      body.append("file", blob, "foto.jpg");
      body.append("id", editing ? editing.id : slugify(`${form.brand.value} ${form.name.value}`) || "foto");
      const { image: path } = await api("/api/admin/upload", { method: "POST", body });
      setPhoto(path);
    } catch (err) {
      setPhoto(image);
      toast(err.message || "Não foi possível usar essa foto.", true);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("[data-form-msg]");
    msg.textContent = "";
    const save = $("[data-save]");
    try {
      const data = readForm();
      if (!data.brand || !data.name || !data.category) throw new Error("Preencha marca, nome e categoria.");
      save.disabled = true;
      if (editing) {
        const saved = await api(`/api/admin/products/${encodeURIComponent(editing.id)}`, { method: "PUT", body: JSON.stringify(data) });
        products[products.findIndex((x) => x.id === editing.id)] = saved;
        toast("Alterações salvas. Já estão no site.");
      } else {
        const id = slugify(`${data.brand} ${data.name}`);
        if (!id) throw new Error("Preencha marca e nome com letras ou números.");
        const saved = await api("/api/admin/products", { method: "POST", body: JSON.stringify({ ...data, id }) });
        products.unshift(saved);
        toast("Produto criado. Ele aparece no topo da vitrine.");
      }
      show("list");
      renderList();
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      save.disabled = false;
    }
  });

  $("[data-delete]").addEventListener("click", async () => {
    if (!editing || !confirm(`Excluir "${editing.brand} ${editing.name}" do site? Isso não pode ser desfeito.`)) return;
    try {
      await api(`/api/admin/products/${encodeURIComponent(editing.id)}`, { method: "DELETE" });
      products = products.filter((x) => x.id !== editing.id);
      toast("Produto excluído.");
      show("list");
      renderList();
    } catch (err) {
      $("[data-form-msg]").textContent = err.message;
    }
  });

  /* ---------- Início ---------- */
  api("/api/admin/session").then(openList, showLogin);
})();
