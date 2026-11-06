/* Quita el MANDO DE MAQUETA (las dos versiones, Verbena y Sobria) antes de entregar la web al cliente.
   Uso: node scripts/quitar-mando.mjs            → prueba en una copia temporal (no toca nada)
        node scripts/quitar-mando.mjs --de-verdad → lo quita de index.html, css/web.css y js/main.js
   Borra lo que hay entre las marcas «MANDO DE MAQUETA» y «fin del MANDO DE MAQUETA» en los tres ficheros.
   Las reglas .densidad-sobria que quedan en el CSS no hacen nada sin el mando. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const deVerdad = process.argv.includes('--de-verdad');
const destino = deVerdad ? RAIZ : fs.mkdtempSync(path.join(os.tmpdir(), 'cdf-mando-'));
const PATRONES = {
  'index.html': [/[ \t]*\/\/ MANDO DE MAQUETA[\s\S]*?\/\/ fin del MANDO DE MAQUETA\n/, /<!-- MANDO DE MAQUETA[\s\S]*?<!-- fin del MANDO DE MAQUETA -->\n?/],
  'css/web.css': [/\/\* -+ MANDO DE MAQUETA[\s\S]*?\/\* fin del MANDO DE MAQUETA \*\/\n?/],
  'js/main.js': [/[ \t]*\/\* -+ MANDO DE MAQUETA[\s\S]*?\/\* fin del MANDO DE MAQUETA \*\/\n?/],
};
let mal = 0;
for (const [f, res] of Object.entries(PATRONES)) {
  let t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  for (const re of res) {
    if (!re.test(t)) { console.log('MAL  no encuentro el bloque en ' + f); mal++; continue; }
    t = t.replace(re, '');
  }
  if (/mando|revision/i.test(t.replace(/MANDO DE MAQUETA \(no viaja al cliente\)[^\n]*\n/g, ''))) { console.log('MAL  queda rastro del mando en ' + f); mal++; }
  const sal = path.join(destino, f);
  fs.mkdirSync(path.dirname(sal), { recursive: true });
  fs.writeFileSync(sal, t);
  if (f.endsWith('.js')) { try { execFileSync(process.execPath, ['--check', sal]); } catch (e) { console.log('MAL  ' + f + ' no compila sin el mando'); mal++; } }
  console.log((mal ? '     ' : 'ok   ') + f);
}
console.log(mal ? `\n${mal} problemas` : deVerdad ? '\nMando quitado.' : `\nPrueba bien (copia en ${destino}). Para quitarlo: node scripts/quitar-mando.mjs --de-verdad`);
process.exit(mal ? 1 : 0);
