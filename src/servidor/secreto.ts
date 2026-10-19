// Telegram solo acepta letras, números, «_» y «-» en la cabecera secreta del webhook.
// Para que TELEGRAM_SECRET pueda ser cualquier contraseña, se manda su SHA-256 en hexadecimal.
export async function telegramHeaderSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
