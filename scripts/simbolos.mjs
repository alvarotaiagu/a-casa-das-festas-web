/* Rellena en index.html el bloque SIMBOLOS (entre <!-- SIMBOLOS:inicio --> y <!-- SIMBOLOS:fin -->)
   con los trazos del logo, para usarlos con <use href="#…">.
   Uso: node scripts/simbolos.mjs   (después de python -I scripts/marca.py <Sora.ttf>)
   - #marca-claro: la A-tejado para fondo oscuro (tejado en blanco roto, banderines teja)
   - #palabra-1:   «A Casa das Festas» en una línea, en currentColor, ya desplazada a x=142 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = JSON.parse(fs.readFileSync(path.join(RAIZ, 'assets/palabra.json'), 'utf8'));
const bloque = `<!-- SIMBOLOS:inicio (scripts/simbolos.mjs los rellena desde assets/palabra.json) -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <g id="marca-claro">
      <path fill="#F2EEE8" d="M2 60L60 6L118 60H100L60 23L20 60ZM26 48L40 35.5V96H26ZM80 35.5L94 48V96H80Z"/>
      <path fill="none" stroke="#F2EEE8" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" d="M33 62Q60 80 87 62"/>
      <path fill="#CF6A3F" d="M43 68.6L51 70.4L45.6 78.8ZM56 71.2L64 71.2L60 80.5ZM69 70.4L77 68.6L74.4 78.8Z"/>
    </g>
    <path id="palabra-1" fill="currentColor" d="${p.unaLinea.d}"/>
  </defs>
</svg>
<!-- SIMBOLOS:fin -->`;
const f = path.join(RAIZ, 'index.html');
const html = fs.readFileSync(f, 'utf8');
const re = /<!-- SIMBOLOS:inicio[\s\S]*?<!-- SIMBOLOS:fin -->/;
if (!re.test(html)) throw new Error('No encuentro el bloque SIMBOLOS en index.html');
fs.writeFileSync(f, html.replace(re, bloque));
console.log('SIMBOLOS:', bloque.length, 'caracteres');
