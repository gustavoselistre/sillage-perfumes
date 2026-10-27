// Tudo em /api/admin/* exige a sessão do painel.
import { isLoggedIn } from "../../_lib/auth.js";
import { fail } from "../../_lib/http.js";

export async function onRequest({ request, env, next }) {
  if (!(await isLoggedIn(request, env))) return fail(401, "Faça login de novo.");
  return next();
}
