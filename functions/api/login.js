// POST /api/login { password }: abre a sessão do painel. Trava o IP após MAX_FAILS erros em WINDOW.
import { checkPassword, sessionCookie } from "../_lib/auth.js";
import { json, fail, readJson } from "../_lib/http.js";

const MAX_FAILS = 8;
const WINDOW = 15 * 60; // segundos

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return fail(500, "Senha do painel não configurada no Cloudflare.");
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const now = Math.floor(Date.now() / 1000);

  const row = await env.DB.prepare("SELECT count, first_at FROM login_failures WHERE ip = ?").bind(ip).first();
  const recent = row && now - row.first_at < WINDOW;
  if (recent && row.count >= MAX_FAILS) return fail(429, "Muitas tentativas. Espere 15 minutos e tente de novo.");

  const body = await readJson(request);
  if (!checkPassword(env, body && body.password)) {
    await env.DB.prepare(
      "INSERT INTO login_failures (ip, count, first_at) VALUES (?1, 1, ?2) " +
      "ON CONFLICT(ip) DO UPDATE SET count = CASE WHEN ?2 - first_at < ?3 THEN count + 1 ELSE 1 END, " +
      "first_at = CASE WHEN ?2 - first_at < ?3 THEN first_at ELSE ?2 END"
    ).bind(ip, now, WINDOW).run();
    return fail(401, "Senha incorreta.");
  }

  if (row) await env.DB.prepare("DELETE FROM login_failures WHERE ip = ?").bind(ip).run();
  return json({ ok: true }, 200, { "Set-Cookie": await sessionCookie(env) });
}
