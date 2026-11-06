/* Comprobación final de A Casa das Festas. Una sola vez al terminar cada tanda.
   Uso: node verificar.mjs
   - Un solo Chrome, que se cierra siempre; ventanas pequeñas, escala 1, sin capturas.
   - Movimiento reducido salvo en la última prueba (la del toldo y la guirnalda).
   - Sirve la carpeta con un servidor propio en un puerto libre. */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const { chromium } = require('playwright');
const RAIZ = path.dirname(fileURLToPath(import.meta.url));

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.json': 'application/json' };
let configDiaFalse = false;
const servidor = http.createServer((req, res) => {
  let u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u.endsWith('/')) u += 'index.html';
  const f = path.join(RAIZ, u);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  let cuerpo = fs.readFileSync(f);
  if (configDiaFalse && u === '/js/config.js') cuerpo = Buffer.from(cuerpo.toString().replace('dia: true', 'dia: false'));
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(cuerpo);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

let fallos = 0, oks = 0;
const comprobar = (cond, txt, extra) => {
  if (cond) { oks++; console.log('  ok  ' + txt); }
  else { fallos++; console.log('  MAL ' + txt + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

/* ---------- estáticas, sin navegador ---------- */
console.log('\n· Ficheros');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const paginas = ['index.html', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'accesibilidad.html', '404.html'];
for (const p of paginas) {
  const t = fs.readFileSync(path.join(RAIZ, p), 'utf8');
  comprobar(/<meta name="robots" content="noindex, nofollow">/.test(t), `${p}: noindex`);
  comprobar(!/[—–]/.test(t.replace(/<!--[\s\S]*?-->/g, '')), `${p}: sin rayas largas ni medias`);
}
for (const f of ['js/main.js', 'js/cita.js', 'js/plano.js', 'js/dia.js', 'css/web.css', 'css/plano.css', 'css/dia.css', 'partes/plano.html', 'partes/dia.html']) {
  const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  comprobar(!/[—–]/.test(t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')), `${f}: sin rayas largas ni medias`);
  if (f.endsWith('.js')) comprobar(!/addEventListener\(\s*['"]scroll['"]/.test(t), `${f}: sin escuchar scroll`);
}
comprobar(html.includes('<!-- MANDO DE MAQUETA') && html.includes('<!-- fin del MANDO DE MAQUETA -->'), 'el mando está marcado para borrarlo (ver README)');
comprobar(/<!-- DIA:inicio[\s\S]*id="dia"[\s\S]*<!-- DIA:fin -->/.test(html), '«Un día» es un único bloque entre marcas');
// todas las fotos que cita el HTML y los JS existen
const refs = new Set();
for (const f of ['index.html', 'js/main.js', 'js/plano.js', 'js/dia.js']) {
  const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  for (const m of t.matchAll(/img\/fotos\/p\d\d-\d+\.(?:avif|webp|jpg)/g)) refs.add(m[0]);
}
const faltan = [...refs].filter((r) => !fs.existsSync(path.join(RAIZ, r)));
comprobar(faltan.length === 0, `las ${refs.size} fotos citadas existen`, faltan.slice(0, 5));

/* ---------- navegador ---------- */
const browser = await chromium.launch({ headless: true });
try {
  const nuevo = async (w, h, extra = {}) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...extra });
    const page = await ctx.newPage();
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errores.push(m.text()); });
    page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)|google\.com\/maps/.test(r.url())) errores.push('falla ' + r.url()); });
    return { ctx, page, errores };
  };
  const ir = async (page, q = '') => { await page.goto(BASE + 'index.html' + q, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.CITA && document.querySelector('#espacios.pl-js') && document.querySelector('#diaRango')); };

  /* escritorio */
  console.log('\n· Escritorio 1280×800');
  {
    const { ctx, page, errores } = await nuevo(1280, 800);
    await ir(page);
    const r = await page.evaluate(() => {
      const h1 = document.querySelector('.portada h1').getBoundingClientRect();
      const cta = document.querySelector('.portada__btns .btn').getBoundingClientRect();
      const g = document.getElementById('guirnalda-svg');
      const gb = [...g.querySelectorAll('g g path')].reduce((m, p) => Math.max(m, p.getBoundingClientRect().bottom), 0);
      const nav = document.querySelector('.cab__menu').getBoundingClientRect();
      return {
        tiras: document.querySelectorAll('#toldo-svg g path').length, banderas: g.querySelectorAll('g g path').length,
        h1top: h1.top, h1bottom: h1.bottom, ctaBottom: cta.bottom, guirBottom: gb, ancho: document.documentElement.scrollWidth, vista: innerWidth,
        navAlto: nav.height, navVisible: getComputedStyle(document.querySelector('.cab__menu')).visibility, abrir: getComputedStyle(document.getElementById('abrir-menu')).display,
      };
    });
    comprobar(r.tiras >= 30 && r.banderas >= 10, `toldo (${r.tiras} tiras) y guirnalda (${r.banderas} banderines) montados`);
    comprobar(r.ctaBottom <= 800, 'el botón de la portada se ve sin bajar', r.ctaBottom);
    comprobar(r.guirBottom < r.h1top, 'la guirnalda no pisa el titular', r);
    comprobar(r.ancho <= r.vista, 'sin scroll horizontal');
    comprobar(r.navVisible === 'visible' && r.navAlto < 60 && r.abrir === 'none', 'menú en una línea, sin botón de menú');
    // Arma tu fiesta → calendario
    await page.click('#arma .op[data-v="c"]'); await page.click('#arma .op[data-v="2"]'); await page.click('#arma .op[data-v="si"]');
    const a = await page.evaluate(() => ({ n: document.querySelectorAll('#arma-lista li').length, dor: !!document.querySelector('#arma-lista li.dor'), pie: !document.getElementById('arma-pie').hidden, rell: [...document.querySelectorAll('#arma-guir path[fill]')].filter((p) => p.getAttribute('fill') !== 'none').length }));
    comprobar(a.n >= 4 && a.dor && a.pie && a.rell === 3, 'Arma tu fiesta: espacios, «para dormir», botón y tres banderines', a);
    const huecos = await page.evaluate(() => { const l = document.getElementById('arma-lista'); const filas = {}; [...l.children].forEach((li) => { const t = Math.round(li.getBoundingClientRect().top); filas[t] = (filas[t] || 0) + li.getBoundingClientRect().width; }); return Object.values(filas).map((w) => Math.round(w)); });
    comprobar(new Set(huecos.map((w) => Math.round(w / 20))).size === 1, 'Arma tu fiesta: todas las filas llenas', huecos);
    await page.click('#arma-cta');
    const c = await page.evaluate(() => ({ tipo: document.getElementById('ct-tipo').value, gente: document.querySelector('#ct-gente [aria-pressed="true"]').dataset.v, dormir: document.getElementById('ct-dormir').checked }));
    comprobar(c.tipo === 'c' && c.gente === '2' && c.dormir, 'el calendario recibe lo elegido', c);
    // calendario
    await page.click('#ct-cal button:not([disabled]):not(.vacio)');
    const cal = await page.evaluate(() => ({ ext: document.querySelectorAll('#ct-cal .extremo').length, btn: !document.getElementById('ct-btn').disabled, modos: document.getElementById('ct-modos').hidden }));
    comprobar(cal.ext === 1 && cal.btn, 'calendario: se elige un día libre y se activa «Pedir esta fecha»', cal);
    comprobar(cal.modos, 'sin verano: el modo «Verano, por noches» no sale');
    await page.click('#ct-btn');
    comprobar(/no se envía nada/.test(await page.textContent('#ct-msg')), 'petición simulada y avisada');
    comprobar(await page.evaluate(() => document.getElementById('dormir-tabs').hidden && !document.getElementById('panel-verano')), 'sin verano: ni pestañas ni panel de verano');
    // plano
    const pl = await page.evaluate(() => document.querySelectorAll('#plLista button').length);
    comprobar(pl === 10, 'plano: 10 zonas en la lista', pl);
    await page.click('#plLista button[data-z="galeria"]');
    const fi = await page.evaluate(() => ({ p: document.querySelector('#plLista button[data-z="galeria"]').getAttribute('aria-pressed'), t: document.querySelector('.pl-nom').textContent, aforo: !!document.querySelector('.pl-aforo .pend') }));
    comprobar(fi.p === 'true' && /galer/i.test(fi.t) && fi.aforo, 'plano: elegir una zona cambia la ficha, con [aforo]', fi);
    // un día
    await page.focus('#diaRango'); await page.keyboard.press('End');
    const d = await page.evaluate(() => document.getElementById('diaRango').getAttribute('aria-valuetext'));
    comprobar(/dormir/i.test(d || ''), 'un día: el deslizador llega a la noche', d);
    // mapa
    await page.click('#ver-mapa');
    comprobar(!(await page.$('#mapa iframe')) && /pendiente/.test(await page.textContent('#mapa-aviso')), 'mapa: sin dirección no carga nada y lo dice');
    // foco con banderín
    await page.focus('#ct-ant'); await page.keyboard.press('Tab');
    comprobar(await page.evaluate(() => document.getElementById('foco-banderin').classList.contains('visto')), 'foco con teclado: cuelga el banderín');
    // textos visibles sin rayas
    comprobar(!/[—–]/.test(await page.evaluate(() => document.body.innerText)), 'texto visible sin rayas largas ni medias');
    // pendientes marcados
    comprobar(await page.evaluate(() => document.querySelectorAll('.pend').length) > 15, 'lo que falta va marcado entre corchetes');
    comprobar(errores.length === 0, 'sin errores en consola', errores.slice(0, 5));
    await ctx.close();
  }

  /* cookies y mando */
  console.log('\n· Cookies y mando');
  {
    const { ctx, page, errores } = await nuevo(1280, 800);
    await ir(page);
    comprobar(await page.isVisible('#cookies'), 'el aviso de cookies sale la primera vez');
    await page.click('#ck-si');
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display === 'none'), 'al aceptar se oculta (display:none)');
    await ir(page);
    comprobar(!(await page.isVisible('#cookies')), 'no vuelve a salir al recargar');
    await page.click('#abrir-cookies');
    comprobar(await page.isVisible('#cookies'), '«Preferencias de cookies» lo vuelve a abrir');
    comprobar(await page.evaluate(() => document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).display === 'none'), 'sin ?revision el mando no se ve');
    await ir(page, '?revision');
    comprobar(await page.isVisible('#mando'), 'con ?revision sale el mando');
    await page.click('#mando [data-densidad="sobria"]');
    const s = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('densidad-sobria'), dato: getComputedStyle(document.querySelector('#arma .dato-sec')).display, guir: getComputedStyle(document.querySelector('#arma .guir-sec')).display }));
    comprobar(s.cls && s.dato === 'block' && s.guir === 'none', 'Sobria: datos en vez de guirnaldas de sección', s);
    await page.click('#mando [data-densidad="verbena"]');
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('densidad-sobria') && getComputedStyle(document.querySelector('#arma .guir-sec')).display !== 'none'), 'Verbena: vuelven las guirnaldas');
    comprobar(errores.length === 0, 'sin errores', errores.slice(0, 5));
    await ctx.close();
  }

  /* móvil: portada, menú, anchos */
  console.log('\n· Móvil');
  for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024]]) {
    const { ctx, page, errores } = await nuevo(w, h, { isMobile: true, hasTouch: true });
    await ir(page);
    const r = await page.evaluate(() => {
      const g = document.getElementById('guirnalda-svg');
      const gb = [...g.querySelectorAll('g g path')].reduce((m, p) => Math.max(m, p.getBoundingClientRect().bottom), 0);
      const h1 = document.querySelector('.portada h1').getBoundingClientRect();
      const foto = document.querySelector('.portada__foto').getBoundingClientRect();
      const anchos = [...document.querySelectorAll('main *, footer *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.pl-lista, .dia-horas, [class*="scroll"]'); }).slice(0, 3).map((e) => e.className || e.tagName);
      return { gb, h1top: h1.top, fotoBottom: foto.bottom, scroll: document.documentElement.scrollWidth, vista: innerWidth, anchos };
    });
    comprobar(r.gb < r.h1top, `${w}×${h}: la guirnalda no pisa el titular`, r);
    comprobar(r.scroll <= r.vista, `${w}×${h}: sin scroll horizontal`, r.anchos);
    if (w < 1181) {
      await page.click('#abrir-menu');
      await page.waitForFunction(() => { const e = document.getElementById('menu'); return e.getAnimations().length === 0 && Math.abs(e.getBoundingClientRect().top - 64) < 2; }, null, { timeout: 2000 }).catch(() => {});
      const m = await page.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return { top: r.top, alto: r.height, vis: getComputedStyle(document.getElementById('menu')).visibility, vista: innerHeight }; });
      comprobar(m.vis === 'visible' && Math.abs(m.top - 64) < 2 && Math.abs(m.top + m.alto - m.vista) < 2, `${w}×${h}: el menú móvil ocupa de la cabecera abajo`, m);
      await page.keyboard.press('Escape');
      const cerrado = await page.waitForFunction(() => getComputedStyle(document.getElementById('menu')).visibility === 'hidden' && document.getElementById('abrir-menu').getAttribute('aria-expanded') === 'false', null, { timeout: 2000 }).then(() => true, () => false);
      comprobar(cerrado, `${w}×${h}: Escape cierra el menú`);
    }
    comprobar(errores.length === 0, `${w}×${h}: sin errores`, errores.slice(0, 5));
    await ctx.close();
  }

  /* «Un día» apagado desde la configuración */
  console.log('\n· CASA_CONFIG.secciones.dia = false');
  {
    configDiaFalse = true;
    const { ctx, page, errores } = await nuevo(1280, 800);
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    const r = await page.evaluate(() => ({ dia: !!document.getElementById('dia'), enlaces: document.querySelectorAll('[data-seccion="dia"]').length, plano: !!document.querySelector('#espacios.pl-js') }));
    comprobar(!r.dia && r.enlaces === 0 && r.plano, 'la sección y sus enlaces desaparecen y lo demás sigue', r);
    comprobar(errores.length === 0, 'sin errores', errores.slice(0, 5));
    configDiaFalse = false;
    await ctx.close();
  }

  /* páginas legales */
  console.log('\n· Legales y 404');
  {
    const { ctx, page, errores } = await nuevo(390, 844);
    for (const p of paginas.slice(1)) {
      await page.goto(BASE + p, { waitUntil: 'load' });
      comprobar((await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) && (await page.$('h1')), `${p}: carga, con h1 y sin scroll horizontal`);
    }
    comprobar(errores.length === 0, 'sin errores', errores.slice(0, 5));
    await ctx.close();
  }

  /* movimiento: al final, una sola prueba */
  console.log('\n· Movimiento (toldo y guirnalda)');
  {
    const { ctx, page, errores } = await nuevo(390, 844, { reducedMotion: 'no-preference', isMobile: true, hasTouch: true });
    await page.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#toldo-svg g').length > 10);
    // a mitad de la entrada hay tiras arriba; al terminar, todas en su sitio
    const medio = await page.evaluate(() => [...document.querySelectorAll('#toldo-svg > g')].filter((g) => g.getAnimations().length).length);
    await page.waitForFunction(() => [...document.querySelectorAll('#toldo-svg > g, #guirnalda-svg g g')].every((g) => g.getAnimations().every((a) => a.playState === 'finished')), null, { timeout: 6000 });
    comprobar(medio > 0, 'el toldo se despliega (hay tiras animándose al cargar)', medio);
    const giro = () => page.evaluate(() => [...document.querySelectorAll('#guirnalda-svg g g g')].slice(0, 4).map((g) => g.getAttribute('transform')).join('|'));
    const g1 = await giro(); await page.waitForTimeout(250); const g2 = await giro();
    comprobar(g1 !== g2, 'los banderines se mecen');
    await page.evaluate(() => document.getElementById('cocina').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => document.getElementById('inicio').getBoundingClientRect().bottom < 0);
    await page.waitForTimeout(150);
    const g3 = await giro(); await page.waitForTimeout(250); const g4 = await giro();
    comprobar(g3 === g4, 'fuera de pantalla, la guirnalda se para');
    comprobar(errores.length === 0, 'sin errores', errores.slice(0, 5));
    await ctx.close();
  }
} finally {
  await browser.close();
  servidor.close();
}
console.log(`\n${oks} bien, ${fallos} mal`);
process.exit(fallos ? 1 : 0);
