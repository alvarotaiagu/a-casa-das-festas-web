/* Pega en index.html los fragmentos de los módulos, entre sus marcas:
     <!-- PLANO:inicio … --> … <!-- PLANO:fin -->   ← partes/plano.html (dentro de #espacios)
     <!-- DIA:inicio … -->   … <!-- DIA:fin -->     ← partes/dia.html (la sección entera)
   Uso: node scripts/montar.mjs   (se puede repetir: sustituye lo que haya entre las marcas) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(RAIZ, 'index.html');
let html = fs.readFileSync(f, 'utf8');
for (const [marca, parte, nota] of [['PLANO', 'plano', 'partes/plano.html'], ['DIA', 'dia', 'partes/dia.html; se quita con CASA_CONFIG.secciones.dia = false']]) {
  const re = new RegExp(`<!-- ${marca}:inicio[\\s\\S]*?<!-- ${marca}:fin -->`);
  if (!re.test(html)) throw new Error('Falta la marca ' + marca);
  const trozo = fs.readFileSync(path.join(RAIZ, 'partes', parte + '.html'), 'utf8').trim();
  html = html.replace(re, () => `<!-- ${marca}:inicio (${nota}) -->\n${trozo}\n<!-- ${marca}:fin -->`);
  console.log(marca, trozo.length, 'caracteres');
}
fs.writeFileSync(f, html);
