/* Remonta o site depois de uma alteração no painel: as páginas de cada perfume (as do Google) são geradas
   no build (scripts/build.mjs), então um produto salvo só aparece nelas depois de um deploy novo.
   DEPLOY_HOOK_URL: secret com a URL do deploy hook do Pages (Settings → Builds → Deploy hooks).
   Sem o secret, não faz nada. Uma falha aqui nunca derruba o salvamento no painel. */
export function rebuildSite(env, waitUntil) {
  const url = env.DEPLOY_HOOK_URL;
  if (!url) return;
  waitUntil(
    fetch(url, { method: "POST" })
      .then((res) => { if (!res.ok) console.error(`Deploy hook respondeu ${res.status}`); })
      .catch((e) => console.error(`Deploy hook falhou: ${e.message}`))
  );
}
