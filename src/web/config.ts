// Datos del sitio que cambian según dónde se publica. Al comprar un dominio, se cambia SITIO_URL.
export interface SiteConfig {
  url: string;
  botUsername: string;
  // Quién es responsable de los datos y un email de contacto, para la página de privacidad. Se
  // cargan como variables del repositorio (SITIO_RESPONSABLE y SITIO_CONTACTO); sin ellas, la
  // página no muestra ese párrafo.
  responsable?: string;
  contacto?: string;
}

export function siteConfig(env: Record<string, string | undefined> = {}): SiteConfig {
  return {
    url: (env.SITIO_URL || 'https://pausa.briaan-b.workers.dev').replace(/\/$/, ''),
    botUsername: (env.BOT_USERNAME || 'guardian_familiar_bot').replace(/^@/, ''),
    responsable: env.SITIO_RESPONSABLE?.trim() || undefined,
    contacto: env.SITIO_CONTACTO?.trim() || undefined,
  };
}
