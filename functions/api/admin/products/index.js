// GET /api/admin/products: lista sem cache. POST: cria um produto no topo da vitrine.
import { json, fail, readJson } from "../../../_lib/http.js";
import { listProducts, clean, SLUG } from "../../../_lib/products.js";

export const onRequestGet = async ({ env }) => json(await listProducts(env.DB));

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!SLUG.test(id) || id.length > 80) return fail(400, "Código do produto inválido.");
  const { data, error } = clean(body);
  if (error) return fail(400, error);

  const exists = await env.DB.prepare("SELECT 1 FROM products WHERE id = ?").bind(id).first();
  if (exists) return fail(409, "Já existe um produto com esse código. Mude o nome ou o código.");

  await env.DB.prepare(
    "INSERT INTO products (id, position, data) VALUES (?1, (SELECT COALESCE(MIN(position), 0) - 1 FROM products), ?2)"
  ).bind(id, JSON.stringify(data)).run();
  return json({ id, ...data }, 201);
}
