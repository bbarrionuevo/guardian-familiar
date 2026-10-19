# Guardián familiar antiestafas

Bot que revisa mensajes sospechosos para personas mayores en Italia, España y Argentina. La persona reenvía el mensaje (texto, captura de pantalla o audio) y el bot contesta con un nivel de riesgo y una sola acción concreta. Si el riesgo es alto, avisa también al familiar vinculado.

- Niveles: **alto**, **medio** o **sin señales**. El bot nunca dice que algo es «seguro».
- Idiomas: italiano (con «tu») y español (con «usted», sirve en España y en Argentina).
- Canal de prueba: Telegram. WhatsApp necesita la aprobación de Meta y viene después de validar.

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
6. **Medir la IA.** En *Actions → Evaluar con IA → Run workflow*. Corrélo una vez con `claude-opus-5-5` y otra con `claude-haiku-5-5`, y compará los resultados en el resumen.

## Uso

- **Persona mayor:** abre el bot y reenvía cualquier mensaje raro.
- **Familiar:** escribe `/familia` al bot, recibe un enlace y se lo manda a su mamá o papá. Cuando el familiar toca el enlace, quedan vinculados. El enlace vale 7 días y sirve una sola vez.
- **Comandos:**
  - `/ayuda` o `/aiuto`: explica cómo usar el bot.
  - `/privacidad` o `/privacy`: dice qué se hace con los mensajes.
  - `/desvincular` o `/scollega`: borra los vínculos con la familia.
  - `/idioma` (español) o `/lingua` (italiano): cambia el idioma.
- **Métricas de validación:** abrí `https://<tu-worker>.workers.dev/api/metricas?clave=<METRICAS_CLAVE>`. Muestra, por día de las últimas dos semanas, cuántas revisiones hubo, cuántas por nivel, las alertas enviadas y los usuarios activos.

## Costos estimados

- **Cloudflare:** gratis. El plan gratis permite 1000 escrituras por día en KV, unas 450 revisiones diarias. Si se pasa, el plan pago cuesta US$ 5 por mes.
- **Claude Opus 5.5:** alrededor de US$ 0,01 a 0,02 por revisión que llega a la IA, y algo más con capturas de pantalla.
- **Claude Haiku 5.5:** unas 30 veces menos. La evaluación dirá si alcanza.
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
