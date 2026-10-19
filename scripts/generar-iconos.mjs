// Dibuja el ícono de Pausa (⏸ sobre fondo verde azulado) y genera los PNG de la app instalable.
// Usa sharp, que ya viene con wrangler.
//   node scripts/generar-iconos.mjs [carpeta para la foto del bot de Telegram]

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');
const bars = '<rect x="19" y="17" width="10" height="30" rx="3.5" fill="#fff"/><rect x="35" y="17" width="10" height="30" rx="3.5" fill="#fff"/>';
// Esquinas redondeadas para el ícono común; el «maskable» llena el cuadrado porque Android lo recorta.
const svg = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${rx}" fill="#0f6a7a"/>${bars}</svg>`;

writeFileSync(join(WEB, 'icono.svg'), svg(14));
const png = (source, size, file) => sharp(Buffer.from(source), { density: (72 * size) / 64 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
await png(svg(14), 192, join(WEB, 'icono-192.png'));
await png(svg(14), 512, join(WEB, 'icono-512.png'));
await png(svg(0), 512, join(WEB, 'icono-maskable-512.png'));
// Foto del bot: Telegram la recorta en círculo, así que va sin esquinas.
if (process.argv[2]) await png(svg(0), 640, join(process.argv[2], 'pausa-telegram.png'));
console.log('Íconos generados en web/');
