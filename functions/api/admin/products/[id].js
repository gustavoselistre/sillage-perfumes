// PUT /api/admin/products/:id: salva as alterações. DELETE: exclui o produto.
// Foto enviada pelo painel que deixa de ser usada sai do R2.
import { json, fail, readJson } from "../../../_lib/http.js";
import { clean } from "../../../_lib/products.js";

const removeUpload = (env, image) =>
  image && image.startsWith("/media/") ? env.MEDIA.delete(image.slice("/media/".length)) : null;

const currentImage = async (env, id) => {
  const row = await env.DB.prepare("SELECT data FROM products WHERE id = ?").bind(id).first();
  return row ? { image: JSON.parse(row.data).image } : null;
};

export async function onRequestPut({ request, env, params }) {
  const { data, error } = clean(await readJson(request));
  if (error) return fail(400, error);
  const before = await currentImage(env, params.id);
  if (!before) return fail(404, "Produto não encontrado.");
  await env.DB.prepare("UPDATE products SET data = ?1, updated_at = datetime('now') WHERE id = ?2")
    .bind(JSON.stringify(data), params.id).run();
  if (before.image !== data.image) await removeUpload(env, before.image);
  return json({ id: params.id, ...data });
}

export async function onRequestDelete({ env, params }) {
  const before = await currentImage(env, params.id);
  if (!before) return fail(404, "Produto não encontrado.");
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  await removeUpload(env, before.image);
  return json({ ok: true });
}
