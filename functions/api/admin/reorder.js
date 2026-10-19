// POST /api/admin/reorder { ids: [...] }: grava a ordem da vitrine (posição = índice na lista).
import { json, fail, readJson } from "../../_lib/http.js";

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const ids = body && Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : null;
  if (!ids || !ids.length) return fail(400, "Lista vazia.");
  const stmt = env.DB.prepare("UPDATE products SET position = ?1 WHERE id = ?2");
  await env.DB.batch(ids.map((id, i) => stmt.bind(i, id)));
  return json({ ok: true });
}
