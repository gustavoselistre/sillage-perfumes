// GET /media/<chave>: fotos enviadas pelo painel, servidas do R2. Cada envio tem nome novo: cache de 1 ano.
export async function onRequestGet({ env, params }) {
  const key = [].concat(params.path || []).join("/");
  const obj = key && (await env.MEDIA.get(key));
  if (!obj) return new Response("Não encontrado", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
