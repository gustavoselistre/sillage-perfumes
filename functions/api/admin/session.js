// GET /api/admin/session: 200 se a sessão vale (o middleware já barrou quem não está logado).
import { json } from "../../_lib/http.js";

export const onRequestGet = () => json({ ok: true });
