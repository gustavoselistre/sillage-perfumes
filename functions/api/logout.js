// POST /api/logout: encerra a sessão do painel.
import { clearCookie } from "../_lib/auth.js";
import { json } from "../_lib/http.js";

export const onRequestPost = () => json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
