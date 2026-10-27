// POST /api/admin/import { products: [...] }: carga inicial do banco com o PRODUCTS de js/data.js.
// O painel chama sozinho no primeiro login. Só funciona com o banco vazio, para nunca sobrescrever edições.
import { json, fail, readJson } from "../../_lib/http.js";
import { clean, SLUG } from "../../_lib/products.js";

export async function onRequestPost({ request, env }) {
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM products").first();
  if (n > 0) return fail(409, "O banco já tem produtos.");

  const body = await readJson(request);
  const list = body && Array.isArray(body.products) ? body.products : [];
  const rows = [];
  for (const p of list) {
    const { data, error } = clean(p);
    if (error || !SLUG.test(p.id)) return fail(400, `Produto inválido: ${p && p.id} (${error || "código"})`);
    rows.push([p.id, data]);
  }
  if (!rows.length) return fail(400, "Lista vazia.");

  const stmt = env.DB.prepare("INSERT INTO products (id, position, data) VALUES (?1, ?2, ?3)");
  await env.DB.batch(rows.map(([id, data], i) => stmt.bind(id, i, JSON.stringify(data))));
  return json({ imported: rows.length }, 201);
}
