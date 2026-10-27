// Respostas JSON das functions. Nada da API passa por cache, salvo quando a rota diz o contrário,
// e nada dela entra no Google (o _headers não vale para respostas de functions).
export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      ...headers,
    },
  });

export const fail = (status, message) => json({ error: message }, status);

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
