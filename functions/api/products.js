// GET /api/products: catálogo público, na ordem da vitrine. Lido pelo js/main.js.
// Sem cache: o que for salvo no painel aparece no próximo carregamento da página.
import { json } from "../_lib/http.js";
import { listProducts } from "../_lib/products.js";

export async function onRequestGet({ env }) {
  return json(await listProducts(env.DB), 200, { "Cache-Control": "no-cache" });
}
