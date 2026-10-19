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
  // Números de Pausa en WhatsApp, con código de país y sin «+»: el de las páginas en español
  // (SITIO_WHATSAPP, argentino) y el de las páginas en italiano (SITIO_WHATSAPP_IT). Sin número, ese
  // idioma no muestra WhatsApp: se cargan recién cuando el canal está probado.
  whatsapp?: string;
  whatsappIt?: string;
}

export const waNumber = (lang: 'es' | 'it', site: SiteConfig) => (lang === 'it' ? site.whatsappIt : site.whatsapp);

export function siteConfig(env: Record<string, string | undefined> = {}): SiteConfig {
  return {
    url: (env.SITIO_URL || 'https://pausa.family').replace(/\/$/, ''),
    botUsername: (env.BOT_USERNAME || 'PausaFamilyBot').replace(/^@/, ''),
    responsable: env.SITIO_RESPONSABLE?.trim() || undefined,
    contacto: env.SITIO_CONTACTO?.trim() || undefined,
    whatsapp: env.SITIO_WHATSAPP?.replace(/\D/g, '') || undefined,
    whatsappIt: env.SITIO_WHATSAPP_IT?.replace(/\D/g, '') || undefined,
  };
}
