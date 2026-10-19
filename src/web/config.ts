// Datos del sitio que cambian según dónde se publica. Al comprar un dominio, se cambia SITIO_URL.
export interface SiteConfig {
  url: string;
  botUsername: string;
}

export function siteConfig(env: Record<string, string | undefined> = {}): SiteConfig {
  return {
    url: (env.SITIO_URL || 'https://guardian-familiar.briaan-b.workers.dev').replace(/\/$/, ''),
    botUsername: (env.BOT_USERNAME || 'guardian_familiar_bot').replace(/^@/, ''),
  };
}
