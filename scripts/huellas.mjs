/* Pone ?v=<huella> (8 primeros caracteres del SHA-1 del fichero) a los css/ y js/ que cita cada página,
   para que GitHub Pages no sirva una versión vieja de la caché.
   Uso: node scripts/huellas.mjs   (después de tocar CSS o JS, y siempre después de scripts/legales.mjs) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const huella = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(RAIZ, f))).digest('hex').slice(0, 8);

for (const p of fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html'))) {
  const ruta = path.join(RAIZ, p);
  const antes = fs.readFileSync(ruta, 'utf8');
  const despues = antes.replace(/((?:href|src)=")((?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g, (_, a, f) => `${a}${f}?v=${huella(f)}"`);
  if (despues !== antes) { fs.writeFileSync(ruta, despues); console.log(p); }
}
