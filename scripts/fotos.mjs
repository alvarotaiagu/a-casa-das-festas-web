/* Prepara las fotos de la web desde fotos-seleccion/NN-*.jpg (las claves pNN de DATOS-CASA-DAS-FESTAS.md).
   Uso: node scripts/fotos.mjs            (las que falten)
        node scripts/fotos.mjs 01 03      (solo esas, aunque existan)
   Escribe img/fotos/pNN-<ancho>.{avif,webp,jpg} e img/fotos/fotos.json ({clave, nombre, anchos, ancho, alto}).
   NUNCA amplía. Anchos 480, 800, 1280 y 1920; 2560 solo para la portada (p01) y el plano (p03). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const sharp = require('sharp');

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = path.join(RAIZ, 'fotos-seleccion');
const SALIDA = path.join(RAIZ, 'img/fotos');
fs.mkdirSync(SALIDA, { recursive: true });

const GRANDES = new Set(['p01', 'p03']);
const solo = process.argv.slice(2);
const ficheros = fs.readdirSync(ENTRADA).filter((f) => /^\d\d-.*\.jpg$/.test(f)).sort();
const indice = [];

for (const f of ficheros) {
  const nn = f.slice(0, 2), clave = 'p' + nn;
  const src = path.join(ENTRADA, f);
  const meta = await sharp(src).rotate().metadata();
  const W = meta.autoOrient?.width ?? meta.width, H = meta.autoOrient?.height ?? meta.height;
  const anchos = [480, 800, 1280, 1920, ...(GRANDES.has(clave) ? [2560] : [])].filter((w) => w <= W);
  const hecho = anchos.every((w) => fs.existsSync(path.join(SALIDA, `${clave}-${w}.jpg`)));
  if (!(solo.includes(nn)) && hecho && !solo.length) { indice.push({ clave, nombre: f, anchos, ancho: W, alto: H }); continue; }
  if (solo.length && !solo.includes(nn)) { indice.push({ clave, nombre: f, anchos, ancho: W, alto: H }); continue; }
  for (const w of anchos) {
    const p = sharp(src).rotate().resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' }).sharpen({ sigma: 0.45, m1: 0.4, m2: 0.9 });
    const dst = path.join(SALIDA, `${clave}-${w}`);
    await Promise.all([
      p.clone().avif({ quality: 52, effort: 4 }).toFile(dst + '.avif'),
      p.clone().webp({ quality: 78 }).toFile(dst + '.webp'),
      p.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(dst + '.jpg'),
    ]);
  }
  indice.push({ clave, nombre: f, anchos, ancho: W, alto: H });
  console.log(clave, f, anchos.join(','));
}
fs.writeFileSync(path.join(SALIDA, 'fotos.json'), JSON.stringify(indice, null, 1));
console.log(indice.length + ' fotos');
