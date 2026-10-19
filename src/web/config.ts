// Datos del sitio que cambian según dónde se publica. La dirección es el dominio propio; otra se
// puede probar con SITIO_URL.
export interface SiteConfig {
  url: string;
  botUsername: string;
  // Quién es responsable de los datos y un email de contacto, para la página de privacidad. Se
  // cargan como variables del repositorio (SITIO_RESPONSABLE y SITIO_CONTACTO); sin ellas, la
  // página no muestra ese párrafo.
  responsable?: string;
  contacto?: string;
  // Número de Pausa en WhatsApp, con código de país y sin «+» (SITIO_WHATSAPP). Sin él, la web no
  // muestra WhatsApp: se carga recién cuando el canal está probado.
  whatsapp?: string;
}

export function siteConfig(env: Record<string, string | undefined> = {}): SiteConfig {
  return {
    url: (env.SITIO_URL || 'https://pausa.family').replace(/\/$/, ''),
    botUsername: (env.BOT_USERNAME || 'PausaFamilyBot').replace(/^@/, ''),
    responsable: env.SITIO_RESPONSABLE?.trim() || undefined,
    contacto: env.SITIO_CONTACTO?.trim() || undefined,
    whatsapp: env.SITIO_WHATSAPP?.replace(/\D/g, '') || undefined,
  };
}
