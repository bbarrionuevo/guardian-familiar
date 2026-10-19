// Lo que el bot necesita de cada canal (Telegram, WhatsApp): recibir un mensaje ya
// traducido a Incoming y poder responder, descargar archivos y armar el enlace de invitación.

export type Channel = 'telegram' | 'whatsapp';

export interface Address {
  channel: Channel;
  id: string;
}

export interface MediaRef {
  id: string;
  mimeType?: string;
  // Duración de los audios, cuando el canal la informa.
  seconds?: number;
}

export interface Incoming {
  from: Address;
  name?: string;
  langCode?: string;
  text: string;
  image?: MediaRef;
  // Llegó una imagen pero el canal ya avisa que pesa demasiado.
  imageTooBig?: boolean;
  audio?: MediaRef;
  forwarded: boolean;
  // Id del mensaje en el canal (WhatsApp lo usa para marcarlo como leído mientras se revisa).
  messageId?: string;
  // Número de Pausa por el que llegó (WhatsApp puede tener uno argentino y uno italiano).
  via?: string;
}

export interface FamilyAlert {
  who: string;
  label: string;
  action: string;
  text: string;
  lang: 'es' | 'it';
}

export interface Messenger {
  send(to: string, text: string): Promise<boolean>;
  // «Escribiendo…» mientras se revisa. messageId es el mensaje que se está revisando.
  typing(to: string, messageId?: string): Promise<void>;
  download(ref: MediaRef, maxBytes: number): Promise<Uint8Array | null>;
  // Enlace que abre el bot en este canal con el código de invitación, en el número del idioma.
  inviteLink(code: string, lang?: 'es' | 'it'): string;
  // Deja el menú del canal en el idioma de la persona. Telegram arma el menú según el idioma de la
  // app, que puede no ser el que la persona eligió con /lingua o /idioma.
  setLanguage?(to: string, lang: 'es' | 'it'): Promise<void>;
  // Aviso a la familia. WhatsApp lo manda con una plantilla aprobada; si falta, como texto.
  sendAlert?(to: string, alert: FamilyAlert): Promise<boolean>;
}
