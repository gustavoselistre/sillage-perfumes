// POST /api/admin/upload (multipart, campo "file", e "id" do produto): guarda a foto no R2.
// O painel já redimensiona para JPEG ~800 px antes de enviar. Devolve { image: "/media/..." }.
import { json, fail } from "../../_lib/http.js";
import { SLUG } from "../../_lib/products.js";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Envio inválido.");
  }
  const file = form.get("file");
  const id = String(form.get("id") || "foto");
  if (!file || typeof file === "string") return fail(400, "Escolha uma foto.");
  const ext = TYPES[file.type];
  if (!ext) return fail(400, "A foto precisa ser JPG, PNG ou WebP.");
  if (file.size > MAX_BYTES) return fail(400, "Foto muito grande (máximo 2 MB).");

  // O nome muda a cada envio, então a foto nova nunca fica presa no cache.
  const key = `products/${SLUG.test(id) ? id : "foto"}-${Date.now()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ image: `/media/${key}` }, 201);
}
