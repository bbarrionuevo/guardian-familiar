# Guardián familiar antiestafas

Bot que revisa mensajes sospechosos para personas mayores en Italia, España y Argentina. La persona reenvía el mensaje (texto, captura de pantalla o audio) y el bot contesta con un nivel de riesgo y una sola acción concreta. Si el riesgo es alto, avisa también al familiar vinculado.

- Niveles: **alto**, **medio** o **sin señales**. El bot nunca dice que algo es «seguro».
- Idiomas: italiano (con «tu») y español (con «usted», sirve en España y en Argentina).
- Canal de prueba: Telegram. WhatsApp necesita la aprobación de Meta y viene después de validar.

## La web

El mismo Worker sirve una web en español (`/es/`) y en italiano (`/it/`), generada con `npm run build:web` en `public/`:

- **Verificador:** se pega el mensaje o se sube una captura, y responde igual que el bot.
- **App instalable:** en Android, con Chrome, se instala desde el menú. Después, en WhatsApp se mantiene apretado un mensaje y se elige «Compartir → Guardián», sin copiar ni pegar.
- **Avisar a la familia:** cada resultado de riesgo y cada guía tienen un botón para mandar el aviso a un grupo de WhatsApp. Es la forma de que el sitio se difunda solo.
- **Guías:** 12 estafas comunes por idioma, con ejemplos reales y sus fuentes, para que lleguen visitas desde Google.

Para cambiar la dirección del sitio (al comprar un dominio), se cambia `SITIO_URL` en `src/web/config.ts`.

## Cómo decide

1. **Reglas fijas** (`src/motor/reglas.ts`): detectan señales sueltas (pide plata, número nuevo, urgencia, código, enlace…) y las combinan. Ejemplo: «número nuevo» más «pide plata» da riesgo alto.
2. **Enlaces** (`src/motor/enlaces.ts`): sin visitar la página, miran si el dominio es oficial, si imita una marca (`poste-it-verifica.top`), si es un acortador o una terminación barata.
3. **IA** (`src/motor/ia.ts`): Claude lee el mensaje o la captura cuando las reglas no alcanzaron «alto». El mensaje reenviado se le pasa como dato, nunca como instrucción. **La IA puede subir el nivel, pero nunca bajar lo que marcaron las reglas.**

Los audios se pasan a texto con Whisper de Cloudflare. No se guarda el texto, las fotos ni los audios: solo el idioma, el nombre de Telegram, los vínculos familiares y contadores por día.

## Qué tiene que hacer Brian (una sola vez)

1. **Bot de Telegram.** En Telegram, abrí [@BotFather](https://t.me/BotFather), mandá `/newbot`, poné de nombre «Guardián» y elegí un usuario terminado en `bot` (por ejemplo `GuardianFamiliarBot`). Guardá el token que te da.
2. **Cloudflare** (gratis). Creá una cuenta en cloudflare.com y después:
   - En *Storage & Databases → KV*, creá un espacio llamado `guardian` y copiá su **ID**.
   - En *My Profile → API Tokens*, creá un token con la plantilla «Edit Cloudflare Workers» y sumale el permiso «Workers AI: Read».
   - Copiá tu **Account ID** (aparece en la página principal de Workers).
3. **Anthropic.** En console.anthropic.com creá una clave de API y poné un **límite de gasto mensual** (por ejemplo, US$ 20).
4. **Secretos en GitHub.** En el repositorio, entrá a *Settings → Secrets and variables → Actions* y cargá:

   | Secreto | Qué es |
   |---|---|
   | `BOT_TOKEN` | El token de BotFather |
   | `BOT_USERNAME` | El usuario del bot, sin @ |
   | `TELEGRAM_SECRET` | Una contraseña larga inventada |
   | `CLOUDFLARE_API_TOKEN` | El token de Cloudflare |
   | `CLOUDFLARE_ACCOUNT_ID` | El Account ID |
   | `KV_ID` | El ID del espacio KV |
   | `ANTHROPIC_API_KEY` | La clave de Anthropic, creada dentro de un workspace |
   | `ANTHROPIC_WORKSPACE_ID` | Opcional: el ID del workspace (`wrkspc_…`), solo si la clave no pertenece a uno |
   | `METRICAS_CLAVE` | Otra contraseña inventada, para ver las métricas |

5. **Publicar.** En *Actions → Desplegar → Run workflow*. Al terminar, el bot ya responde en Telegram.
6. **Medir la IA.** En *Actions → Evaluar con IA → Run workflow*. El bot usa `claude-haiku-5-5` (se cambia en `GUARDIAN_MODELO` de `wrangler.toml`); se puede comparar con otro modelo eligiéndolo en la lista.

## WhatsApp (cuando quieras activarlo)

El código ya está listo. Mientras falten estas claves, el canal queda apagado y el resto funciona igual.

1. **App de Meta.** En developers.facebook.com, creá una app de tipo «Business» y sumale el producto «WhatsApp».
2. **Número de prueba.** En *WhatsApp → API Setup*, Meta da un número de prueba gratis que puede escribir hasta a 5 teléfonos que agregues. Alcanza para probar con la familia. Para un número propio hace falta un teléfono que no esté usando WhatsApp y, para pasar de los límites iniciales, verificar el negocio.
3. **Datos que hay que copiar:**
   - el *Phone number ID*, de la misma página;
   - el *App Secret*, en *App settings → Basic*;
   - un token permanente: en la configuración del negocio, *System users*, creá un usuario y generá un token con el permiso `whatsapp_business_messaging`. El token de la página de prueba vence a las 24 horas.
4. **Webhook.** En *WhatsApp → Configuration*:
   - poné como URL `https://guardian-familiar.briaan-b.workers.dev/whatsapp/webhook`;
   - como «Verify token», una contraseña inventada (la misma que va en `WHATSAPP_VERIFY_TOKEN`);
   - suscribite al campo `messages`.
5. **Plantilla del aviso a la familia (opcional pero recomendable).** WhatsApp solo deja escribirle a alguien que no habló con el bot en las últimas 24 horas con una plantilla aprobada. Creá una de categoría «Utility» llamada `alerta_familia`, en español y en italiano:
   - es: `⚠️ {{1}} recibió un mensaje con riesgo alto ({{2}}). Le respondí: «{{3}}». Si puede, llame ahora a su familiar.`
   - it: `⚠️ {{1}} ha ricevuto un messaggio a rischio alto ({{2}}). Ho risposto: «{{3}}». Se puoi, chiama subito il tuo familiare.`
6. **Secretos en GitHub**, y después *Desplegar*:

   | Secreto | Qué es |
   |---|---|
   | `WHATSAPP_TOKEN` | El token permanente |
   | `WHATSAPP_PHONE_ID` | El Phone number ID |
   | `WHATSAPP_NUMBER` | El número del bot con código de país, sin «+» (por ejemplo `393331234567`) |
   | `WHATSAPP_APP_SECRET` | El App Secret |
   | `WHATSAPP_VERIFY_TOKEN` | La contraseña inventada del webhook |
   | `WHATSAPP_TEMPLATE_ALERTA` | `alerta_familia`, cuando Meta apruebe la plantilla |

Las respuestas a quien le escribe al bot no tienen costo en la tarifa actual de Meta; los avisos con plantilla cuestan centavos según el país. El bot es de un servicio concreto (revisar mensajes), que es lo que Meta permite desde 2026.

## Uso

- **Persona mayor:** abre el bot y reenvía cualquier mensaje raro.
- **Familiar:** escribe `/familia` al bot, recibe un enlace y se lo manda a su mamá o papá. Cuando el familiar toca el enlace, quedan vinculados. El enlace vale 7 días y sirve una sola vez.
- **Comandos:**
  - `/ayuda` o `/aiuto`: explica cómo usar el bot.
  - `/privacidad` o `/privacy`: dice qué se hace con los mensajes.
  - `/desvincular` o `/scollega`: borra los vínculos con la familia.
  - `/idioma` (español) o `/lingua` (italiano): cambia el idioma.
- **Métricas de validación:** abrí `https://<tu-worker>.workers.dev/api/metricas?clave=<METRICAS_CLAVE>`. Muestra, por día de las últimas dos semanas:
  - En Telegram: revisiones, cuántas por nivel, alertas enviadas y usuarios activos.
  - En la web: revisiones, cuántas llegaron por «Compartir», avisos a la familia e instalaciones.

## Costos estimados

- **Cloudflare:** gratis. El plan gratis permite 1000 escrituras por día en KV, unas 450 revisiones diarias. Si se pasa, el plan pago cuesta US$ 5 por mes.
- **Claude Haiku 5.5** (el que usa el bot): menos de US$ 0,001 por revisión que llega a la IA, algo más con capturas de pantalla.
- **Claude Opus 5.5:** alrededor de US$ 0,01 a 0,02 por revisión. En la evaluación del 19/10/2026 acertó igual que Haiku.
- La página web tiene un límite de 20 revisiones con IA por día y por IP. Pasado ese límite, responde solo con las reglas.

## Desarrollo

```
npm ci
npm run typecheck
npm test
npm run evaluar -- --solo-reglas           # banco visible, con detalle
npm run evaluar -- --solo-reglas --ciego   # banco ciego, solo totales
```

Los resultados y los límites de los datos están en [informes/evaluacion.md](informes/evaluacion.md).

**Dependencias:** quedan avisos de seguridad en `vitest` (3.x) y en `sharp` (lo trae `wrangler`). Son herramientas de desarrollo y no se publican con el bot. `vitest` 4 rompe el instalador de npm 10, así que la actualización queda pendiente.
