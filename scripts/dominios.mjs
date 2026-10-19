// Consulta si unos dominios están registrados, por RDAP (y whois para .es, que no tiene RDAP).
//   node scripts/dominios.mjs faro.app pausa.chat …
// «libre» = el registro no lo conoce; igual hay que confirmarlo al comprar.
import { execFileSync } from 'node:child_process';

const RDAP = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  app: 'https://pubapi.registry.google/rdap/domain/',
  dev: 'https://pubapi.registry.google/rdap/domain/',
  it: 'https://rdap.nic.it/domain/',
};

async function check(domain) {
  const tld = domain.split('.').pop();
  const base = RDAP[tld] ?? 'https://rdap.org/domain/';
  if (tld !== 'es') {
    try {
      const res = await fetch(base + domain, { headers: { accept: 'application/rdap+json' }, redirect: 'follow' });
      if (res.status === 404) return 'libre';
      if (res.ok) return 'ocupado';
    } catch {}
  }
  try {
    const out = execFileSync('whois', [domain], { encoding: 'utf8', timeout: 20000 });
    if (/no match|not found|no entries found|status:\s*available|libre|no data found/i.test(out)) return 'libre';
    return 'ocupado (whois)';
  } catch (err) {
    const out = String(err.stdout ?? '');
    if (/no match|not found|no entries found|status:\s*available|no data found/i.test(out)) return 'libre';
    return 'sin respuesta';
  }
}

for (const d of process.argv.slice(2)) console.log(`${d.padEnd(28)} ${await check(d.toLowerCase())}`);
