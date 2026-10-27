// Tudo em /api/admin/* exige a sessão do painel.
// Alteração de produto que deu certo (criar, editar, excluir, reordenar, importar) remonta o site.
import { isLoggedIn } from "../../_lib/auth.js";
import { fail } from "../../_lib/http.js";
import { rebuildSite } from "../../_lib/rebuild.js";

const CHANGES = /^\/api\/admin\/(products(\/|$)|reorder$|import$)/;

export async function onRequest({ request, env, next, waitUntil }) {
  if (!(await isLoggedIn(request, env))) return fail(401, "Faça login de novo.");
  const res = await next();
  if (request.method !== "GET" && res.ok && CHANGES.test(new URL(request.url).pathname)) rebuildSite(env, waitUntil);
  return res;
}
