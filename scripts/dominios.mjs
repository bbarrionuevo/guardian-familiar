// Consulta si unos dominios están registrados, con RDAP: el servidor de cada terminación sale de
// la lista oficial de IANA. 404 = libre; 200 = ocupado, con el registrador y los servidores DNS
// (sirve para ver si un dominio propio ya quedó en Cloudflare). Hay que confirmarlo igual al comprar.
//   node scripts/dominios.mjs faro.app pausa.help …
// .es no tiene RDAP público: esos se informan como «consultar a mano».

const bootstrap = await (await fetch('https://data.iana.org/rdap/dns.json')).json();
const servers = new Map();
for (const [tlds, urls] of bootstrap.services) for (const tld of tlds) servers.set(tld, urls[0]);

async function check(domain) {
  const tld = domain.split('.').pop();
  const base = servers.get(tld);
  if (!base) return 'consultar a mano';
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/domain/${domain}`, { headers: { accept: 'application/rdap+json' } });
    if (res.status === 404) return 'libre';
    if (res.ok) {
      const d = await res.json();
      const registrar = d.entities?.find((e) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3];
      const ns = (d.nameservers ?? []).map((n) => n.ldhName?.toLowerCase()).join(', ');
      return `ocupado · registrador: ${registrar ?? '?'} · DNS: ${ns || '?'}`;
    }
    return `sin respuesta (${res.status})`;
  } catch (err) {
    return `sin respuesta (${err.cause?.code ?? err.name})`;
  }
}

for (const d of process.argv.slice(2)) {
  console.log(`${d.padEnd(28)} ${await check(d.toLowerCase())}`);
  // Sin apuro: algunos registros limitan las consultas seguidas.
  await new Promise((r) => setTimeout(r, 300));
}
