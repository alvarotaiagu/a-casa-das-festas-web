/* =====================================================================
   A Casa das Festas · la página
   - configuración (js/config.js): quita «Un día», activa «Verano», rellena contacto y lugar
   - cabecera y menú móvil
   - portada: el toldo que se despliega y la guirnalda con viento (CDF.soplo)
   - guirnaldas pequeñas de sección (versión Verbena)
   - Arma tu fiesta (le pasa la elección al calendario: CITA.rellenar)
   - Dormir (pestañas, solo con verano), mapa al pulsar, cookies, foco con banderín
   - pie: la guirnalda se cuelga en la A
   - MANDO DE MAQUETA (no viaja al cliente)
   ===================================================================== */
(function () {
  const { MOVIMIENTO, $, svgEl, anima, espera, alVer } = CDF;
  const CFG = window.CASA_CONFIG || { secciones: { dia: true }, contacto: {}, lugar: {} };
  const ROJO = '#A8323A', OSCURO = '#7E2029', BLANCO = '#F2EEE8', BAMBU = '#C9A26A', VERDE = '#2E5A33', EUCA = '#6E8A7A', TEJA = '#CF6A3F', TINTA = '#241517';
  const entre = (v, a, b) => Math.max(a, Math.min(b, v));
  const limpia = (s) => { while (s.firstChild) s.removeChild(s.firstChild); };
  const html = document.documentElement;

  /* ---------- configuración ---------- */
  if (CFG.secciones && CFG.secciones.dia === false) {
    const d = $('dia'); if (d) d.remove();
    document.querySelectorAll('[data-seccion="dia"]').forEach((a) => a.remove());
  }
  const pon = (sel, valor, enlace) => {
    if (!valor) return;
    document.querySelectorAll(sel).forEach((el) => {
      el.textContent = '';
      if (enlace) { const a = document.createElement('a'); a.href = enlace; a.textContent = valor; if (/^https?:/.test(enlace)) { a.target = '_blank'; a.rel = 'noopener'; } el.appendChild(a); }
      else el.textContent = valor;
    });
  };
  const C = CFG.contacto || {}, L = CFG.lugar || {};
  pon('[data-contacto="telefono"]', C.telefono, C.telefonoTel ? 'tel:' + C.telefonoTel : null);
  pon('[data-contacto="whatsapp"]', C.whatsapp ? 'Escribir por WhatsApp' : '', C.whatsapp);
  pon('[data-contacto="correo"]', C.correo, C.correo ? 'mailto:' + C.correo : null);
  pon('[data-lugar="municipio"]', L.municipio);
  pon('[data-lugar="ria"]', L.ria ? 'de ' + L.ria : '');
  if (CFG.registroTuristico) {
    document.querySelectorAll('[data-registro]').forEach((el) => { el.textContent = CFG.registroTuristico; });
    const rp = document.querySelector('[data-registro-pie]');
    if (rp) { rp.hidden = false; rp.querySelector('span').textContent = CFG.registroTuristico; }
  }
  const anno = $('anno'); if (anno) anno.textContent = new Date().getFullYear();

  /* ---------- menú móvil ---------- */
  const menu = $('menu'), abrir = $('abrir-menu');
  const cerrarMenu = () => { menu.classList.remove('abierto'); abrir.setAttribute('aria-expanded', 'false'); abrir.querySelector('.sr').textContent = 'Abrir el menú'; };
  abrir.addEventListener('click', () => {
    const va = !menu.classList.contains('abierto');
    menu.classList.toggle('abierto', va);
    abrir.setAttribute('aria-expanded', String(va));
    abrir.querySelector('.sr').textContent = va ? 'Cerrar el menú' : 'Abrir el menú';
    if (va) { const a = menu.querySelector('a'); if (a) a.focus(); }
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrarMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('abierto')) { cerrarMenu(); abrir.focus(); } });
  matchMedia('(min-width: 1181px)').addEventListener('change', (e) => { if (e.matches) cerrarMenu(); });

  /* ---------- portada: el toldo y la guirnalda ---------- */
  const portada = $('inicio'), svgT = $('toldo-svg'), svgG = $('guirnalda-svg');
  const COLORES = [ROJO, BLANCO, BAMBU, ROJO, BLANCO, VERDE, ROJO, BLANCO, BAMBU, EUCA, ROJO, BLANCO, TEJA];
  let tiras = [], banderas = [], ancho = 0, hT = 0, entrado = false;
  let gust = 0, T = 0, tPrev = 0, corriendo = false, visible = true;

  function construye() {
    const W = Math.round(portada.clientWidth);
    if (!W || W === ancho) return;
    ancho = W;
    limpia(svgT); limpia(svgG); tiras = []; banderas = [];
    // rayas finas, como las de la galería
    const sw0 = entre(W / 52, 15, 26);
    const N = Math.max(14, Math.round(W / sw0));
    const sw = W / N, r = sw / 2;
    const hb = entre(W * 0.03, 22, 44);
    hT = hb + r + 2;
    svgT.setAttribute('viewBox', '0 0 ' + W + ' ' + hT);
    const defs = svgEl(svgT, 'defs', {});
    const gr = svgEl(defs, 'linearGradient', { id: 'toldo-sombra', x1: 0, y1: 0, x2: 0, y2: 1 });
    svgEl(gr, 'stop', { offset: 0, 'stop-color': TINTA, 'stop-opacity': 0.3 });
    svgEl(gr, 'stop', { offset: 1, 'stop-color': TINTA, 'stop-opacity': 0 });
    for (let i = 0; i < N; i++) {
      const x0 = i * sw, x1 = x0 + sw + 0.6;
      const g = svgEl(svgT, 'g', {});
      const p = svgEl(g, 'path', { d: 'M' + x0.toFixed(1) + ' 0H' + x1.toFixed(1) + 'V' + hb.toFixed(1) + 'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 1 ' + x0.toFixed(1) + ' ' + hb.toFixed(1) + 'Z', fill: i % 2 ? BLANCO : ROJO });
      tiras.push({ g, p });
    }
    svgEl(svgT, 'rect', { x: 0, y: 4, width: W, height: 10, fill: 'url(#toldo-sombra)' });
    svgEl(svgT, 'rect', { x: 0, y: 0, width: W, height: 4, fill: OSCURO });

    // la guirnalda: festones colgados de las puntas del borde (uno en móvil estrecho)
    const ya = hb + r;
    const sag = entre(W * 0.042, 16, 60);
    const fw = entre(W * 0.022, 14, 30), fh = fw * 1.3;
    svgG.setAttribute('viewBox', '0 0 ' + W + ' ' + (ya + sag + fh + 16));
    const ax = (i) => (i + 0.5) * sw;
    const sobria = html.classList.contains('densidad-sobria');
    const anclas = W < 560 || sobria ? [ax(1), ax(N - 2)] : [ax(1), ax(Math.floor(N / 2)), ax(N - 2)];
    let k = 0, semilla = 7;
    const azar = () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return semilla / 4294967296; };
    for (let s = 0; s < anclas.length - 1; s++) {
      const xa = anclas[s], xb = anclas[s + 1], cx = (xa + xb) / 2, cy = ya + 2 * sag;
      svgEl(svgG, 'path', { d: 'M' + xa.toFixed(1) + ' ' + ya.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + xb.toFixed(1) + ' ' + ya.toFixed(1), fill: 'none', stroke: TINTA, 'stroke-opacity': 0.6, 'stroke-width': 1.3 });
      const n = Math.max(3, Math.floor((xb - xa) * (sobria ? 0.6 : 1.0) / (fw * 1.7)));
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n, u = 1 - t;
        const x = u * u * xa + 2 * u * t * cx + t * t * xb, y = u * u * ya + 2 * u * t * cy + t * t * ya;
        const pos = svgEl(svgG, 'g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' });
        const ent = svgEl(pos, 'g', {}); ent.style.transformOrigin = '0px 0px';
        const rot = svgEl(ent, 'g', {});
        svgEl(rot, 'path', { d: 'M' + (-fw / 2).toFixed(1) + ' 0H' + (fw / 2).toFixed(1) + 'L0 ' + fh.toFixed(1) + 'Z', fill: COLORES[k % COLORES.length], stroke: 'rgb(36 21 23 / .4)', 'stroke-width': 0.9, 'stroke-linejoin': 'round' });
        banderas.push({ ent, rot, x, y, fh, th: 0, w: 0, k: 34 + azar() * 12, c: 2 + azar() * 0.7 });
        k++;
      }
    }
    if (entrado) { tiras.forEach((t) => (t.g.style.transform = '')); }
  }

  function paso(ts) {
    if (!corriendo) return;
    const dt = entre((ts - tPrev) / 1000 || 0.016, 0.001, 0.033); tPrev = ts; T += dt;
    gust *= Math.exp(-dt * 1.3);
    const v = 1 + gust;
    for (let i = 0; i < tiras.length; i++) {
      const s = 1 + Math.sin(T * 1.1 + i * 0.36) * 0.022 * v;
      tiras[i].p.setAttribute('transform', 'scale(1 ' + s.toFixed(4) + ')');
    }
    for (const f of banderas) {
      const viento = (Math.sin(T * 0.8 + f.x * 0.006) * 56 + Math.sin(T * 1.9 + f.x * 0.013) * 22) * v;
      f.w += (viento - f.k * f.th - f.c * f.w) * dt;
      f.th = entre(f.th + f.w * dt, -42, 42);
      f.rot.setAttribute('transform', 'rotate(' + f.th.toFixed(2) + ')');
    }
    requestAnimationFrame(paso);
  }
  const arranca = () => { if (!MOVIMIENTO || corriendo || document.hidden || !visible) return; corriendo = true; tPrev = performance.now(); requestAnimationFrame(paso); };
  const para = () => { corriendo = false; };
  CDF.soplo = (n) => {
    if (!MOVIMIENTO) return;
    gust = Math.min(3, gust + n);
    for (const f of banderas) f.w += Math.sin(f.x * 0.012) * 55 * n;
  };

  // el dedo o el cursor empujan los banderines; un toque en la guirnalda da una racha desde ahí
  const empuja = (px, py, fuerza) => {
    for (const f of banderas) {
      const dx = Math.abs(px - f.x), dy = Math.abs(py - (f.y + f.fh / 2));
      if (dx < 80 && dy < f.fh + 30) f.w = entre(f.w + fuerza * (1 - dx / 80), -260, 260);
    }
  };
  const local = (e) => { const b = svgG.getBoundingClientRect(); const k = ancho / b.width; return [(e.clientX - b.left) * k, (e.clientY - b.top) * k, b]; };
  portada.addEventListener('pointermove', (e) => {
    if (!MOVIMIENTO || !corriendo) return;
    const [px, py] = local(e);
    if (py < -10 || py > svgG.viewBox.baseVal.height + 10) return;
    empuja(px, py, (e.movementX || 0) * 2.6);
  }, { passive: true });
  portada.addEventListener('pointerdown', (e) => {
    if (!MOVIMIENTO || !corriendo) return;
    const [px, py] = local(e);
    if (py < -10 || py > svgG.viewBox.baseVal.height + 30) return;
    empuja(px, py, (px < ancho / 2 ? 1 : -1) * 140);
    gust = Math.min(3, gust + 0.4);
  }, { passive: true });

  if (MOVIMIENTO && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? arranca() : para(); }).observe(portada);
    document.addEventListener('visibilitychange', () => { document.hidden ? para() : arranca(); });
  }

  // entrada: el toldo se despliega en ola y los banderines cuelgan (no tapa nada: no es una cortina)
  function entrada() {
    entrado = true;
    if (!MOVIMIENTO) return;
    const paso = entre(900 / tiras.length, 10, 22);
    tiras.forEach((t, i) => anima(t.g, [{ transform: 'translateY(' + (-hT - 6) + 'px)' }, { transform: 'translateY(0px)' }], { duration: 780, delay: 120 + i * paso, easing: 'cubic-bezier(.22,1.28,.36,1)', fill: 'backwards' }));
    const base = 120 + tiras.length * paso + 200;
    banderas.forEach((f, i) => {
      anima(f.ent, [{ transform: 'scale(1,0)', opacity: 0 }, { transform: 'scale(1,1)', opacity: 1 }], { duration: 460, delay: base + i * 30, easing: 'cubic-bezier(.22,1.28,.36,1)', fill: 'backwards' });
      espera(base + i * 30 + 280).then(() => { f.w += (i % 2 ? 1 : -1) * 70; });
    });
  }
  construye();
  entrada();
  arranca();
  // el cambio de alto de la barra del móvil no rehace nada: solo el ancho
  let anchoVista = innerWidth, tmR;
  addEventListener('resize', () => {
    if (innerWidth === anchoVista) return;
    anchoVista = innerWidth;
    clearTimeout(tmR); tmR = setTimeout(() => { construye(); guirnaldasSeccion(true); }, 140);
  });

  /* ---------- guirnaldas pequeñas de sección (Verbena) ---------- */
  const TRIOS = [[ROJO, BAMBU, VERDE], [TEJA, ROJO, EUCA], [VERDE, ROJO, BAMBU], [BAMBU, TEJA, ROJO]];
  function guirnaldasSeccion(rehacer) {
    document.querySelectorAll('.guir-sec').forEach((cont, n) => {
      if (cont.firstChild && !rehacer) return;
      limpia(cont);
      const s = svgEl(cont, 'svg', { viewBox: '0 0 150 34', 'aria-hidden': 'true', focusable: 'false' });
      svgEl(s, 'path', { d: 'M2 3Q75 22 148 3', fill: 'none', stroke: TINTA, 'stroke-opacity': 0.5, 'stroke-width': 1.2 });
      const cols = TRIOS[n % TRIOS.length];
      const bs = [0.24, 0.5, 0.76].map((t, i) => {
        const u = 1 - t, x = u * u * 2 + 2 * u * t * 75 + t * t * 148, y = u * u * 3 + 2 * u * t * 22 + t * t * 3;
        const g = svgEl(s, 'g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' });
        const r = svgEl(g, 'path', { d: 'M-9 0H9L0 21Z', fill: cols[i] });
        r.style.transformOrigin = '0px 0px';
        return r;
      });
      // al entrar en pantalla, los tres se mecen una vez
      alVer(cont, () => bs.forEach((r, i) => anima(r, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (i % 2 ? -12 : 12) + 'deg)' }, { transform: 'rotate(' + (i % 2 ? 6 : -6) + 'deg)' }, { transform: 'rotate(0deg)' }], { duration: 1100, delay: i * 90, easing: 'ease-out' })), 0.6);
    });
  }
  guirnaldasSeccion();

  /* ---------- Arma tu fiesta ---------- */
  const arma = $('arma');
  if (arma) {
    const ESP = {
      mer: { n: 'Merendero', f: 'p08', alt: 'Mesas de picnic de madera en el prado, con la casa detrás',
        u: { c: 'Mesas largas de madera al aire libre para la tarta y la sobremesa, y un círculo de fuego en el suelo.', d: 'Mesas largas para sentarse todos juntos antes de que empiece la fiesta.', p: 'Mesas de picnic de madera para comer juntos al aire libre.', f: 'Mesas de madera al aire libre para comer todos juntos, de los mayores a los críos.', o: 'Mesas de picnic de madera junto a la casa, con un círculo de fuego en el suelo.' } },
      bar: { n: 'Barra y salón', f: 'p20', alt: 'La barra de madera con la pared verde, focos colgantes y botellero',
        u: { c: 'La barra para brindar, con el salón de paredes rojas detrás por si cambia el tiempo.', d: 'Barra con botellero y focos colgantes: ahí se junta el grupo.', p: 'Barra para el café y la sobremesa, junto al comedor.', f: 'Barra y sofás en el salón rojo, para quien prefiere estar dentro.', o: 'Barra con pared verde, focos colgantes y botellero, en el salón rojo.' } },
      com: { n: 'Comedor y cocina', f: 'p26', alt: 'Comedor grande con muchas mesas y sillas de madera',
        u: { c: 'Comedor grande con muchas mesas y una cocina industrial para dejarlo todo preparado.', d: 'Comedor con muchas mesas y cocina industrial, por si el grupo come en la finca.', p: 'El comedor con muchas mesas y la cocina industrial: fogones, plancha y cámara.', f: 'Comedor con muchas mesas y cocina industrial para preparar la comida allí mismo.', o: 'Comedor grande con muchas mesas y cocina industrial con fogones, plancha y cámara.' } },
      ter: { n: 'Terraza', f: 'p15', alt: 'Terraza grande con sillas de madera y vistas al valle bajo el cielo azul',
        u: { c: 'Terraza con vistas al valle para el aperitivo y las fotos.', d: 'Terraza grande con sillas y vistas al valle, para la tarde antes de cenar.', p: 'Terraza con sillas y vistas al valle, para el café al sol.', f: 'Sillas de madera y vistas al valle, para quien prefiere sentarse tranquilo.', o: 'Terraza grande con barandilla, sillas de madera y vistas al valle.' } },
      cam: { n: 'Campo de fútbol', f: 'p11', alt: 'Campo con portería en un prado, con árboles al fondo',
        u: { c: 'Campo con porterías para los juegos y el partido.', d: 'Campo con porterías: partido o juegos antes de la cena.', p: 'Un partido entre compañeros o entre peñas en el campo con porterías.', f: 'Prado y campo con porterías para que los niños corran.', o: 'Campo con porterías en el prado, rodeado de árboles.' } },
      gal: { n: 'Galería de las rayas', f: 'p22', alt: 'Galería acristalada con la pared de rayas rojas y blancas, techo de madera y estores de bambú',
        u: { c: 'La galería de las rayas, con mesas y luz de tarde, para un grupo que quiere estar más recogido.', d: 'La pared de rayas rojas y blancas: un rincón para las fotos y para sentarse aparte.', p: 'Galería acristalada con mesas, para una mesa aparte o una reunión más pequeña.', f: 'Galería con vistas al prado y mesas, para comer en un sitio más recogido.', o: 'Galería acristalada con techo de madera, estores de bambú y la pared de rayas rojas y blancas.' } },
      dor: { n: 'Para dormir', f: 'p30', alt: 'Colchones en el suelo del salón de paredes rojas' }
    };
    const FRASE_DORMIR = 'Hoy se duerme en colchones en el suelo de los salones y de la galería. No hay dormitorios con camas.';
    const OCA = {
      c: { para: 'un cumpleaños', pes: { mer: 3, bar: 3, ter: 2, cam: 2, gal: 1, com: 1 } },
      d: { para: 'una despedida', pes: { bar: 3, ter: 3, mer: 2, gal: 2, com: 1, cam: 1 } },
      p: { para: 'una comida de peña o de empresa', pes: { com: 3, mer: 3, ter: 2, cam: 2, bar: 1, gal: 1 } },
      f: { para: 'una reunión de familia', pes: { mer: 3, com: 3, ter: 2, cam: 2, gal: 2, bar: 1 } },
      o: { para: 'una fiesta', pes: { mer: 2, bar: 2, com: 2, ter: 2, cam: 2, gal: 2 } }
    };
    const TAM = {
      1: { txt: 'menos de 20 personas', mod: { gal: 2, bar: 1, mer: -1, cam: -1 } },
      2: { txt: 'de 20 a 50 personas', mod: { mer: 1, com: 1 } },
      3: { txt: 'más de 50 personas', mod: { mer: 2, com: 2, cam: 1, gal: -1 } }
    };
    const ORDEN = ['mer', 'bar', 'com', 'ter', 'cam', 'gal'];
    const est = { oca: null, tam: null, dor: 'no' };
    const botones = [...arma.querySelectorAll('.op[data-g]')];
    const sum = $('arma-sum'), aviso = $('arma-aviso'), lista = $('arma-lista'), pie = $('arma-pie');
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // tres banderines con el contorno a puntos que se rellenan al responder
    const gP = $('arma-guir'), COL3 = { oca: ROJO, tam: BAMBU, dor: VERDE }, banP = {};
    gP.setAttribute('viewBox', '0 0 300 74');
    svgEl(gP, 'path', { d: 'M6 6Q150 40 294 6', fill: 'none', stroke: TINTA, 'stroke-opacity': 0.55, 'stroke-width': 1.3 });
    [['oca', 0.22], ['tam', 0.5], ['dor', 0.78]].forEach(([k, t]) => {
      const u = 1 - t, x = u * u * 6 + 2 * u * t * 150 + t * t * 294, y = u * u * 6 + 2 * u * t * 40 + t * t * 6;
      const pos = svgEl(gP, 'g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' });
      const ent = svgEl(pos, 'g', {}); ent.style.transformOrigin = '0px 0px';
      const p = svgEl(ent, 'path', { d: 'M-17 0H17L0 42Z', fill: 'none', stroke: TINTA, 'stroke-opacity': 0.45, 'stroke-width': 1.4, 'stroke-dasharray': '4 3', 'stroke-linejoin': 'round' });
      banP[k] = { ent, p };
    });
    const cuelga = (k) => {
      const b = banP[k]; if (!b) return;
      b.p.setAttribute('fill', COL3[k]); b.p.setAttribute('stroke-dasharray', 'none'); b.p.setAttribute('stroke-opacity', 0.5);
      anima(b.ent, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(15deg)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0deg)' }], { duration: 900, easing: 'ease-out' });
    };
    const pend = (t) => '<span class="pend">' + t + '</span>';

    function render() {
      lista.textContent = '';
      const listo = est.oca && est.tam;
      pie.hidden = !listo;
      if (!listo) { aviso.hidden = true; sum.textContent = 'Elige qué celebráis y cuántos sois, y te enseñamos qué espacios de la finca encajan.'; return; }
      const pes = OCA[est.oca].pes, mod = TAM[est.tam].mod;
      const pun = ORDEN.map((k, i) => ({ k, s: pes[k] + (mod[k] || 0), i })).sort((a, b) => b.s - a.s || a.i - b.i);
      let esc = pun.filter((x) => x.s >= 2).slice(0, 5);
      if (esc.length < 3) esc = pun.slice(0, 3);
      const ks = esc.map((x) => x.k);
      if (est.dor === 'si') ks.push('dor');
      const n = ks.length;
      // filas sin huecos en la rejilla de 6: 3 = 2+2+2, 4 = 3+3 / 3+3, 5 = 2+2+2 / 3+3, 6 = 2+2+2 / 2+2+2
      const spans = n === 5 ? [2, 2, 2, 3, 3] : n === 4 ? [3, 3, 3, 3] : null;
      ks.forEach((k, i) => {
        const e = ESP[k], li = document.createElement('li'), dor = k === 'dor';
        const span = spans ? spans[i] : 2;
        li.className = 'arma__esp' + (span === 3 ? ' s3' : '') + (dor ? ' dor' : '');
        const fig = document.createElement('div'); fig.className = 'foto';
        fig.appendChild(CDF.picture(e.f, e.alt, '(max-width: 640px) 100vw, (max-width: 900px) 50vw, 360px'));
        const et = document.createElement('div'); et.className = 'arma__et';
        const chip = dor ? 'Plazas: ' + pend('[plazas]') : est.tam === '1' ? '' : 'Aforo: ' + pend('[aforo]');
        et.innerHTML = '<h4>' + e.n + '</h4><p>' + (dor ? FRASE_DORMIR : e.u[est.oca]) + '</p>' + (chip ? '<p>' + chip + '</p>' : '');
        li.append(fig, et);
        lista.appendChild(li);
        anima(li, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0px)' }], { duration: 420, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
      sum.textContent = cap(OCA[est.oca].para) + ', ' + TAM[est.tam].txt + ', ' + (est.dor === 'si' ? 'con noche en la finca' : 'solo por el día') + '. Te encajan ' + n + (n === 1 ? ' espacio.' : ' espacios.');
      if (est.tam === '3') { aviso.innerHTML = 'Más de 50 es más de lo que se sabe hoy: ' + pend('[aforo por confirmar]') + '. El merendero y el comedor son los que más mesas tienen.'; aviso.hidden = false; }
      else aviso.hidden = true;
    }
    botones.forEach((b) => b.addEventListener('click', () => {
      const g = b.dataset.g;
      botones.filter((x) => x.dataset.g === g).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      est[g] = b.dataset.v;
      cuelga(g);
      CDF.soplo(0.55);
      render();
    }));
    // el botón lleva lo elegido al calendario
    $('arma-cta').addEventListener('click', () => { if (window.CITA) window.CITA.rellenar({ oca: est.oca, tam: est.tam, dormir: est.dor === 'si' }); });
    render();
  }

  /* ---------- Dormir: pestaña «Verano» solo con CASA_CONFIG.verano ---------- */
  if (CFG.verano) {
    const tabs = $('dormir-tabs'); tabs.hidden = false;
    const tN = $('tab-noche'), tV = $('tab-verano'), pN = $('panel-noche'), pV = $('panel-verano');
    const elige = (v) => {
      tN.setAttribute('aria-selected', String(!v)); tV.setAttribute('aria-selected', String(v));
      tN.tabIndex = v ? -1 : 0; tV.tabIndex = v ? 0 : -1;
      pN.hidden = v; pV.hidden = !v;
    };
    tN.addEventListener('click', () => elige(false));
    tV.addEventListener('click', () => elige(true));
    tabs.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const v = document.activeElement === tN; elige(v); (v ? tV : tN).focus(); e.preventDefault();
    });
    $('ver-noches').addEventListener('click', () => { if (window.CITA) window.CITA.modo('verano'); $('cita').scrollIntoView({ behavior: MOVIMIENTO ? 'smooth' : 'auto' }); });
  } else {
    // sin verano, el panel ni se pinta (no debe poder enfocarse nada de él)
    const pV = $('panel-verano'); if (pV) pV.remove();
  }

  /* ---------- mapa: solo se carga al pulsar ---------- */
  const verMapa = $('ver-mapa');
  if (verMapa) verMapa.addEventListener('click', () => {
    const q = (L.mapa || '').trim();
    const aviso = $('mapa-aviso');
    if (!q) { aviso.textContent = 'La dirección exacta está pendiente del dueño. En cuanto la tengamos, aquí saldrá el mapa.'; return; }
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
    f.title = 'Mapa de Google con la ubicación de A Casa das Festas';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    $('mapa').appendChild(f);
    verMapa.closest('.llegar__capa').remove();
  });

  /* ---------- cookies (técnica: solo recuerda que se vio el aviso) ---------- */
  const CLAVE = 'cdf-cookies';
  const ck = $('cookies');
  const leer = () => { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } };
  const guardar = (v) => { try { localStorage.setItem(CLAVE, v); } catch (e) {} };
  if (!leer()) ck.hidden = false;
  const cierraCk = (v) => { guardar(v); ck.hidden = true; };
  $('ck-si').addEventListener('click', () => cierraCk('si'));
  $('ck-no').addEventListener('click', () => cierraCk('necesario'));
  $('abrir-cookies').addEventListener('click', () => { ck.hidden = false; $('ck-si').focus(); });

  /* ---------- foco: un banderín cuelga bajo lo que tiene el foco ---------- */
  const fb = svgEl(null, 'svg', { id: 'foco-banderin', viewBox: '0 0 16 20', 'aria-hidden': 'true', focusable: 'false' });
  svgEl(fb, 'path', { d: 'M0 0H16L8 20Z', fill: ROJO, stroke: BLANCO, 'stroke-width': 1.2, 'stroke-linejoin': 'round' });
  document.body.appendChild(fb);
  let enfocado = null;
  const colocaFoco = () => {
    if (!enfocado) return;
    const r = enfocado.getBoundingClientRect();
    fb.style.left = (r.left + scrollX + r.width / 2 - 8) + 'px';
    fb.style.top = (r.bottom + scrollY + 4) + 'px';
  };
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    let fv = false; try { fv = el.matches(':focus-visible'); } catch (err) {}
    if (!fv || el === document.body || el.closest('.cab') || el.matches('input[type="range"], select, iframe')) { enfocado = null; fb.classList.remove('visto'); return; }
    enfocado = el; colocaFoco(); fb.classList.add('visto');
    anima(fb, [{ transform: 'rotate(18deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0deg)' }], { duration: 600, easing: 'ease-out' });
  });
  document.addEventListener('focusout', () => { enfocado = null; fb.classList.remove('visto'); });
  addEventListener('resize', colocaFoco, { passive: true });

  /* ---------- pie: los tres banderines se cuelgan en la A ---------- */
  const pieA = document.querySelector('.pie__a');
  if (pieA && MOVIMIENTO) {
    const cuerda = pieA.querySelector('.pie__cuerda'), bands = [...pieA.querySelectorAll('.pie__bands path')];
    const largo = cuerda.getTotalLength ? cuerda.getTotalLength() : 60;
    cuerda.style.strokeDasharray = largo; cuerda.style.strokeDashoffset = largo;
    bands.forEach((b) => { b.style.opacity = 0; });
    alVer(pieA, () => {
      anima(cuerda, [{ strokeDashoffset: largo }, { strokeDashoffset: 0 }], { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)' });
      bands.forEach((b, i) => anima(b, [{ opacity: 0, transform: 'translateY(-26px) rotate(' + (i - 1) * 25 + 'deg)' }, { opacity: 1, transform: 'translateY(0px) rotate(0deg)' }], { duration: 760, delay: 500 + i * 130, easing: 'cubic-bezier(.22,1.28,.36,1)' }));
    }, 0.6);
  }

  /* ---------- MANDO DE MAQUETA (no viaja al cliente): solo con ?revision ---------- */
  const mando = $('mando');
  if (mando && html.classList.contains('revision')) {
    mando.hidden = false;
    const bs = [...mando.querySelectorAll('button')];
    const marca = () => bs.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.densidad === 'sobria') === html.classList.contains('densidad-sobria'))));
    marca();
    bs.forEach((b) => b.addEventListener('click', () => {
      const sob = b.dataset.densidad === 'sobria';
      html.classList.toggle('densidad-sobria', sob);
      try { const u = new URL(location.href); sob ? u.searchParams.set('densidad', 'sobria') : u.searchParams.delete('densidad'); history.replaceState(null, '', u); } catch (e) {}
      marca();
      ancho = 0; construye(); if (entrado) banderas.forEach((f) => (f.w += 60));
    }));
  }
  /* fin del MANDO DE MAQUETA */

  // al recargar sin ancla, arriba del todo
  if (!location.hash) scrollTo(0, 0);
})();
