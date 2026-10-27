/* Sessão do painel: cookie "sillage_admin" = "<expira>.<assinatura>", assinado com HMAC-SHA256.
   A chave vem de ADMIN_PASSWORD (secret do Cloudflare): trocar a senha derruba todas as sessões. */
const COOKIE = "sillage_admin";
const TTL = 30 * 24 * 60 * 60; // 30 dias, em segundos

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(`sillage-session:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
}

// Compara sem atalho, para o tempo da resposta não revelar quantos caracteres batem.
function sameText(a, b) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export const checkPassword = (env, password) =>
  Boolean(env.ADMIN_PASSWORD) && typeof password === "string" && sameText(password, env.ADMIN_PASSWORD);

export async function sessionCookie(env) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const token = `${exp}.${await hmac(env.ADMIN_PASSWORD, String(exp))}`;
  return `${COOKIE}=${token}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function isLoggedIn(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get("Cookie") || "";
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]{64})`).exec(cookie);
  if (!m || Number(m[1]) < Date.now() / 1000) return false;
  return sameText(m[2], await hmac(env.ADMIN_PASSWORD, m[1]));
}
