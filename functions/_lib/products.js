/* Produtos no D1. O formato de cada produto é o mesmo de PRODUCTS em js/data.js;
   clean() valida o que chega do painel e descarta campos desconhecidos. */

export async function listProducts(db) {
  const { results } = await db.prepare("SELECT id, data FROM products ORDER BY position, id").all();
  return results.map((r) => ({ id: r.id, ...JSON.parse(r.data) }));
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const IMAGE = /^(img\/products\/|\/media\/)[\w./-]+$/;

const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const money = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null);

// Devolve { data } (sem o id) ou { error } com a mensagem para o painel.
export function clean(input) {
  if (!input || typeof input !== "object") return { error: "Dados inválidos." };
  const data = {
    brand: str(input.brand, 80),
    name: str(input.name, 120),
    category: str(input.category, 40),
    families: Array.isArray(input.families) ? [...new Set(input.families.filter((f) => typeof f === "string" && SLUG.test(f)))] : [],
    price: money(input.price),
  };
  if (!data.brand) return { error: "Informe a marca." };
  if (!data.name) return { error: "Informe o nome." };
  if (!SLUG.test(data.category)) return { error: "Escolha a categoria." };

  const oldPrice = money(input.oldPrice);
  if (oldPrice && data.price != null && oldPrice > data.price) data.oldPrice = oldPrice;
  if (input.soldOut === true) data.soldOut = true;

  const notes = input.notes || {};
  const topo = str(notes.topo), coracao = str(notes.coracao), fundo = str(notes.fundo);
  if (topo || coracao || fundo) data.notes = { topo, coracao, fundo };
  const desc = str(input.desc, 600);
  if (desc) data.desc = desc;

  if (Array.isArray(input.bottles)) {
    const bottles = input.bottles
      .map((b) => ({ size: str(b && b.size, 40), price: money(b && b.price) }))
      .filter((b) => b.size);
    // Um frasco só não precisa da lista: vira "sizes" + "price", como no data.js.
    if (bottles.length > 1) {
      data.bottles = bottles;
      data.price = bottles[0].price;
    } else if (bottles.length === 1) {
      data.sizes = [bottles[0].size];
      if (bottles[0].price != null) data.price = bottles[0].price;
    }
  } else if (Array.isArray(input.sizes)) {
    const sizes = input.sizes.map((s) => str(s, 40)).filter(Boolean);
    if (sizes.length) data.sizes = sizes;
  }
  if (typeof input.volume === "number" && input.volume > 0) data.volume = Math.round(input.volume);
  if (input.decant === false) data.decant = false;

  const image = str(input.image, 200);
  if (image && IMAGE.test(image) && !image.includes("..")) data.image = image;
  const bg = input.bottle && Array.isArray(input.bottle.bg) ? input.bottle.bg.filter((c) => COLOR.test(c)) : [];
  data.bottle = { bg: bg.length === 2 ? bg : ["#c9a24a", "#2e1c08"] };

  return { data };
}
