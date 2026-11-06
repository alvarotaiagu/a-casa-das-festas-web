/* =====================================================================
   A Casa das Festas · «Un día en la finca» (recorrido por horas)
   Depende solo de js/base.js (window.CDF) y de #dia. Si no hay #dia, no hace nada.

   API (window.Dia):
     Dia.iniciar(raiz?)   monta la pieza sobre la sección (por defecto #dia).
                          Se llama sola en DOMContentLoaded. Es idempotente:
                          si ya está montada devuelve la misma instancia.
                          Devuelve { ir(i), parada() } o null si no hay sección.
     Dia.ir(i)            va a la parada i (0 a 5), con fundido si hay movimiento.

   Qué hace:
     - El HTML ya trae la primera foto y la lista de paradas (sin JS se ve así).
       Aquí se monta el deslizador, los botones de hora, el panel y el reloj del sol.
     - Una sola variable continua t (0 a 5) manda: foto, tinte, brillo, viñeta,
       bombillas y reloj se interpolan a partir de ella.
     - No hay fotos de noche: la noche son fotos de día con filtros, una capa de
       color (mix-blend-mode) y luces dibujadas (CSS y SVG).
     - Con CDF.MOVIMIENTO === false todo salta de parada en parada, sin fundidos
       ni bombillas que titilen.
     - Las bombillas solo titilan si la pieza está cerca de la pantalla y es de
       noche (IntersectionObserver). Ritmo lento, muy por debajo de 3 destellos/s.
     - Las fotos de las paradas vecinas se cargan con antelación; las demás, no.
     - Sin fetch, sin scroll listeners, sin canvas: vale también como file://.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.CDF;
  var SIZES = '(min-width:1240px) 700px, (min-width:900px) 56vw, 100vw';

  // ---------- Datos: las seis paradas de una fiesta de ejemplo ----------
  // h: hora (25.5 = 01:30) · clave: foto pNN · pos: object-position de la foto
  var PARADAS = [
    { h: 12, corto: 'Llegada', nombre: 'Llegada', esp: 'La casa y la escalera de entrada',
      clave: 'p05', pos: '50% 50%',
      alt: 'Fachada granate de la casa vista desde abajo, con la escalera de entrada, la terraza a la izquierda y el cielo azul',
      t: 'Subís por la escalera de la fachada granate y ya estáis. La finca se alquila entera, así que no hay más grupos que el vuestro.' },
    { h: 14.5, corto: 'Comida', nombre: 'Comida', esp: 'El merendero',
      clave: 'p08', pos: '50% 50%',
      alt: 'Mesas de picnic de madera sobre el prado del merendero, con la casa granate detrás',
      t: 'Mesas de picnic de madera junto a la casa y, en el suelo, un círculo de fuego. Se come fuera, en el prado.' },
    { h: 17.5, corto: 'Partido', nombre: 'Partido', esp: 'El campo de fútbol',
      clave: 'p11', pos: '50% 50%',
      alt: 'Portería de fútbol con red sobre un prado, con frutales y monte al fondo y otra portería más lejos',
      t: 'Un campo con porterías en el prado, rodeado de frutales y árboles grandes. Para el partido de después de comer, el que sea.' },
    { h: 20.5, corto: 'Terraza', nombre: 'Tarde en la terraza', esp: 'La terraza grande',
      clave: 'p15', pos: '50% 62%',
      alt: 'Terraza con sillas de madera y barandilla, frente a un valle de prados y árboles',
      t: 'Barandilla, sillas de madera y el valle delante. Aquí se queda la gente cuando baja el sol.' },
    { h: 23, corto: 'Cena', nombre: 'Cena', esp: 'La barra y el salón',
      clave: 'p20', pos: '50% 50%',
      alt: 'La barra de madera con la pared verde a un lado, la roja al otro y lámparas colgadas del techo',
      t: 'La barra con la pared verde y los focos colgando. Se cena dentro, en el salón o en el comedor grande. Hasta qué hora hay música: <span class="pend">[normas de ruido]</span>.' },
    { h: 25.5, corto: 'A dormir', nombre: 'A dormir', esp: 'El salón rojo',
      clave: 'p30', pos: '50% 20%',
      alt: 'Salón de paredes rojas con colchones en el suelo, cortinas blancas y la barra verde al fondo',
      t: 'Se duerme en colchones en el suelo, no hay dormitorios con camas. Cuántos caben: <span class="pend">[plazas]</span>.' }
  ];
  var N = PARADAS.length - 1;   // índice de la última

  // Cómo se tiñe cada parada.
  // br/sa/se: filtro de la foto · tono/ta: capa multiplicada · glow/ga: brillo del sol o la luna
  // vig: viñeta · noche: bombillas · cielo: color de la ventana del reloj
  var E = [
    { br: 1.03, sa: 1.04, se: 0,   tono: [255, 255, 255], ta: 0,   glow: [255, 248, 230], ga: .18, vig: .10, noche: 0,  cielo: [230, 238, 241] },
    { br: 1,    sa: 1.05, se: .05, tono: [255, 236, 200], ta: .12, glow: [255, 240, 205], ga: .20, vig: .12, noche: 0,  cielo: [233, 236, 228] },
    { br: .97,  sa: 1.15, se: .25, tono: [255, 205, 130], ta: .50, glow: [255, 176, 70],  ga: .45, vig: .26, noche: 0,  cielo: [240, 203, 135] },
    { br: .72,  sa: 1.12, se: .10, tono: [170, 110, 185], ta: .62, glow: [255, 125, 55],  ga: .60, vig: .42, noche: .3, cielo: [75, 53, 102] },
    { br: .52,  sa: .85,  se: 0,   tono: [35, 55, 130],   ta: .70, glow: [110, 140, 255], ga: .22, vig: .50, noche: 1,  cielo: [16, 27, 49] },
    { br: .42,  sa: .72,  se: 0,   tono: [20, 30, 95],    ta: .78, glow: [100, 130, 240], ga: .20, vig: .58, noche: 1,  cielo: [10, 18, 36] }
  ];
  var OSCURA = [36, 21, 23], CLARA = [246, 244, 241];   // tinta granate y papel del sistema

  // Focos de la barra (parada 4, sobre p20) y del salón (parada 5, sobre p30): [x%, y%, radio%, peso]
  var FOCOS = {
    4: [[24, 33, 6, .95], [45, 31, 7, .95], [18, 37, 5, .8], [57, 37, 5, .85], [61, 38, 4.5, .8]],
    5: [[36, 9.5, 5, .8], [51.4, 9.1, 5, .8], [69.5, 8.2, 5, .75]]
  };

  // ---------- Utilidades ----------
  var clamp = function (x, a, b) { return Math.min(b == null ? 1 : b, Math.max(a == null ? 0 : a, x)); };
  var sm = function (x) { return x * x * (3 - 2 * x); };
  var lerp = function (a, b, s) { return a + (b - a) * s; };
  var mez = function (a, b, s) { return Array.isArray(a) ? a.map(function (v, k) { return lerp(v, b[k], s); }) : lerp(a, b, s); };
  var rgb = function (v) { return v.map(Math.round).join(' '); };
  function fmt(h) {
    var m = Math.round(((h % 1) * 60) / 5) * 5, hh = Math.floor(h);
    if (m === 60) { m = 0; hh++; }
    return String(hh % 24).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  function fase(h) {
    return h < 14 ? 'Mediodía' : h < 16.5 ? 'Sobremesa' : h < 19 ? 'Tarde dorada' : h < 21.5 ? 'Anochecer' : h < 25 ? 'Noche' : 'Madrugada';
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Sol de las 12:00 (arriba) a la puesta (20:50, borde derecho); luna que sale por la izquierda y sube
  function astro(h) {
    if (h <= 20.8) return { luna: false, th: 90 * (1 - (h - 12) / 8.5) };
    return { luna: true, th: 183 - 103 * (h - 20.8) / 5.2 };
  }

  var inst = null;

  function iniciar(raiz) {
    raiz = raiz || document.getElementById('dia');
    if (!raiz) return null;
    if (inst && inst.raiz === raiz) return inst;
    if (!C || !C.picture || !C.svgEl) return null;   // sin base.js se queda el HTML estático
    var MOV = C.MOVIMIENTO !== false;
    var pz = raiz.querySelector('#diaPieza'), escena = raiz.querySelector('#diaEscena'), vista = raiz.querySelector('#diaVista');
    var capasEl = raiz.querySelector('#diaCapas'), lucesEl = raiz.querySelector('#diaLuces'), gl = raiz.querySelector('#diaGl');
    if (!pz || !escena || !vista || !capasEl || !lucesEl || !gl) return null;

    // ---------- Montaje: mando (deslizador y horas) y panel ----------
    var mando = el('div', 'dia-mando',
      '<label class="dia-lab" for="diaRango">La hora del día</label>' +
      '<p class="dia-ayuda" id="diaAyuda">Mueve el deslizador, arrastra la foto hacia los lados o pulsa una hora.</p>' +
      '<input class="dia-rango" id="diaRango" type="range" min="0" max="500" step="1" value="0" aria-describedby="diaAyuda">' +
      '<div class="dia-hitos" id="diaHitos" role="group" aria-label="Ir a una hora del día"></div>');
    escena.appendChild(mando);
    var panel = el('div', 'dia-panel',
      '<div class="dia-dial" id="diaDial" aria-hidden="true"></div>' +
      '<p class="dia-hora"><b id="diaHora"></b><span id="diaFase"></span></p>' +
      '<div class="dia-info" id="diaInfo">' +
        '<h3 class="dia-nombre" id="diaNombre"></h3>' +
        '<p class="dia-esp" id="diaEsp"></p>' +
        '<p class="dia-txt" id="diaTxt"></p>' +
      '</div>' +
      '<p class="sr" id="diaVoz" role="status" aria-live="polite"></p>');
    pz.insertBefore(panel, escena.nextSibling);
    raiz.classList.add('dia-js');

    var rango = mando.querySelector('#diaRango'), hitosEl = mando.querySelector('#diaHitos');
    var info = panel.querySelector('#diaInfo'), voz = panel.querySelector('#diaVoz');
    var horaEl = panel.querySelector('#diaHora'), faseEl = panel.querySelector('#diaFase');
    var nombreEl = panel.querySelector('#diaNombre'), espEl = panel.querySelector('#diaEsp'), txtEl = panel.querySelector('#diaTxt');

    // ---------- Capas de foto: la primera ya viene en el HTML; el resto se carga al acercarse ----------
    var capas = [capasEl.firstElementChild], cargada = [true];
    capas[0].style.setProperty('--pos', PARADAS[0].pos);
    for (var k = 1; k <= N; k++) {
      var c = el('div', 'dia-capa');
      c.style.setProperty('--pos', PARADAS[k].pos);
      c.style.opacity = '0';
      capasEl.appendChild(c); capas.push(c); cargada.push(false);
    }
    function carga(k) {
      if (k < 0 || k > N || cargada[k]) return;
      cargada[k] = true;
      var p = C.picture(PARADAS[k].clave, PARADAS[k].alt, SIZES, { cargar: 'eager' });
      var im = p.querySelector('img'); if (im) im.draggable = false;
      capas[k].appendChild(p);
    }
    function cargaVecinas(t) {
      var n = Math.round(t);
      carga(n); carga(n - 1); carga(n + 1); carga(Math.ceil(t));
    }

    // ---------- Luces de focos (CSS) ----------
    var luzK = {};
    Object.keys(FOCOS).forEach(function (k) {
      var g = el('div', 'dia-luz');
      FOCOS[k].forEach(function (l) {
        var s = el('i', 'dia-spot');
        s.style.cssText = 'left:' + l[0] + '%;top:' + l[1] + '%;width:' + (l[2] * 2) + '%;opacity:' + l[3];
        g.appendChild(s);
      });
      lucesEl.appendChild(g); luzK[k] = g;
    });

    // ---------- Guirnalda de bombillas de verbena (SVG 300x200, se recorta con slice) ----------
    var bombillas = [];
    (function () {
      gl.setAttribute('viewBox', '0 0 300 200');
      var defs = C.svgEl(gl, 'defs'), rg = C.svgEl(defs, 'radialGradient', { id: 'diaGlGr' });
      [['0', '#FFEFC4', .95], ['.3', '#FFC566', .55], ['1', '#FFB347', 0]].forEach(function (s) {
        C.svgEl(rg, 'stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] });
      });
      [{ p: [[-6, 16], [150, 74], [306, 12]], n: 15 }, { p: [[-6, 48], [150, 102], [306, 40]], n: 12 }].forEach(function (h) {
        C.svgEl(gl, 'path', { 'class': 'dia-hilo', d: 'M' + h.p[0] + 'Q' + h.p[1] + ' ' + h.p[2] });
        for (var j = 0; j < h.n; j++) {
          var u = (j + .5) / h.n, v = 1 - u;
          var x = v * v * h.p[0][0] + 2 * v * u * h.p[1][0] + u * u * h.p[2][0];
          var y = v * v * h.p[0][1] + 2 * v * u * h.p[1][1] + u * u * h.p[2][1];
          var g = C.svgEl(gl, 'g', { transform: 'translate(' + x.toFixed(1) + ' ' + (y + 4).toFixed(1) + ')' });
          var glow = C.svgEl(g, 'circle', { 'class': 'dia-brillob', r: 10, fill: 'url(#diaGlGr)' });
          glow.style.setProperty('--d', (((j * 7 + h.n) % 5) * .43) + 's');
          C.svgEl(g, 'line', { 'class': 'dia-tapa', x1: 0, y1: -4.6, x2: 0, y2: -2 });
          C.svgEl(g, 'circle', { 'class': 'dia-nucleo', r: 2.1 });
          bombillas.push({ g: g, x: x });
        }
      });
      bombillas.sort(function (a, b) { return a.x - b.x; }).forEach(function (b, k) { b.r = k / (bombillas.length - 1); });
    })();
    function pintaGl(noche) {
      gl.style.opacity = clamp(noche * 4).toFixed(3);
      bombillas.forEach(function (b) { b.g.style.opacity = clamp((noche - .08 - b.r * .5) / .22).toFixed(3); });
    }

    // ---------- Reloj del sol (ventana de cielo) ----------
    var dial = (function () {
      var svg = C.svgEl(panel.querySelector('#diaDial'), 'svg', { viewBox: '0 0 220 120', role: 'presentation', focusable: 'false' });
      var defs = C.svgEl(svg, 'defs'), cp = C.svgEl(defs, 'clipPath', { id: 'diaDialCl' });
      C.svgEl(cp, 'rect', { x: 0, y: 0, width: 220, height: 111 });
      C.svgEl(svg, 'path', { 'class': 'dia-arco', d: 'M14 110A96 96 0 0 1 206 110Z' });
      C.svgEl(svg, 'line', { 'class': 'dia-hor', x1: 0, x2: 220, y1: 110, y2: 110 });
      var astros = C.svgEl(svg, 'g', { 'clip-path': 'url(#diaDialCl)' });
      var sol = C.svgEl(astros, 'g');
      C.svgEl(sol, 'circle', { r: 17, fill: '#FFC24A', 'fill-opacity': .28 });
      C.svgEl(sol, 'circle', { r: 7.5, fill: '#FFC24A' });
      var luna = C.svgEl(astros, 'g');
      C.svgEl(luna, 'path', { d: 'M0 -8A8 8 0 1 0 0 8A5.6 5.6 0 1 1 0 -8Z', fill: '#DDE6FF' });
      return function (P) {
        var r = P.th * Math.PI / 180, x = 110 + 96 * Math.cos(r), y = 110 - 96 * Math.sin(r);
        var tr = 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')';
        sol.setAttribute('transform', tr); luna.setAttribute('transform', tr);
        sol.style.display = P.luna ? 'none' : ''; luna.style.display = P.luna ? '' : 'none';
      };
    })();

    // ---------- Luz: de una posición t (0 a 5) a todos los valores ----------
    function luz(t) {
      t = clamp(t, 0, N);
      if (!MOV) t = Math.round(t);
      var i = Math.min(N - 1, Math.floor(t)), f = t - i, s = sm(f), a = E[i], b = E[i + 1];
      var P = { t: t, i: i, f: f, g: MOV ? sm(clamp((f - .28) / .44)) : (f >= .5 ? 1 : 0) };
      P.h = lerp(PARADAS[i].h, PARADAS[i + 1].h, s);
      for (var key in a) P[key] = mez(a[key], b[key], s);
      var A = astro(P.h), r = A.th * Math.PI / 180;
      P.luna = A.luna; P.th = A.th;
      P.gx = 50 + 50 * Math.cos(r);
      P.gy = clamp(100 - 90 * Math.sin(r), -10, 110);
      P.ga *= clamp(Math.abs(P.h - 20.8) / .35);   // el brillo se apaga un instante al cambiar sol por luna
      var L = .2126 * P.cielo[0] + .7152 * P.cielo[1] + .0722 * P.cielo[2];
      P.ti = mez(CLARA, OSCURA, clamp((L - 105) / 45));
      return P;
    }
    function aplica(P) {
      var st = pz.style;
      st.setProperty('--br', P.br.toFixed(3)); st.setProperty('--sa', P.sa.toFixed(3)); st.setProperty('--se', P.se.toFixed(3));
      st.setProperty('--tono', rgb(P.tono)); st.setProperty('--ta', P.ta.toFixed(3));
      st.setProperty('--glow', rgb(P.glow)); st.setProperty('--ga', P.ga.toFixed(3));
      st.setProperty('--gx', P.gx.toFixed(1) + '%'); st.setProperty('--gy', P.gy.toFixed(1) + '%');
      st.setProperty('--vig', P.vig.toFixed(3));
      st.setProperty('--cielo', rgb(P.cielo)); st.setProperty('--ti', rgb(P.ti));
    }

    // ---------- Horas (botones para saltar) ----------
    var textoParada = function (k) { return fmt(PARADAS[k].h) + ', ' + PARADAS[k].nombre; };
    var hitos = PARADAS.map(function (p, k) {
      var b = el('button', 'dia-hito', '<b>' + fmt(p.h) + '</b><span>' + p.corto + '</span>');
      b.type = 'button';
      b.style.setProperty('--k', k);
      b.setAttribute('aria-label', textoParada(k));
      b.addEventListener('click', function () { ir(k); });
      hitosEl.appendChild(b);
      return b;
    });

    // ---------- Estado y pintado ----------
    var cur = 0, obj = 0, raf = 0, ultTs = 0, arr = false, enRango = false;
    var nMuestra = -1, nVoz = -1, horaTxt = '', faseTxt = '', cerca = false, noche = 0;

    function muestra(n, anim) {
      nMuestra = n;
      var p = PARADAS[n];
      nombreEl.textContent = p.nombre; espEl.textContent = p.esp; txtEl.innerHTML = p.t;
      hitos.forEach(function (b, k) { b.setAttribute('aria-current', k === n ? 'true' : 'false'); });
      rango.setAttribute('aria-valuetext', textoParada(n));
      if (anim) C.anima(info, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    function bucle() {
      escena.classList.toggle('dia-titila', MOV && cerca && noche > .5);
    }
    function pinta(t) {
      var P = luz(t), i = P.i, g = P.g;
      aplica(P);
      if (cerca) cargaVecinas(P.t);
      capas.forEach(function (c, k) { c.style.opacity = k === i ? 1 : k === i + 1 ? g : 0; });
      var nl = clamp(P.noche * 1.15);
      for (var k in luzK) luzK[k].style.opacity = (((+k === i ? 1 - g : +k === i + 1 ? g : 0)) * nl).toFixed(3);
      pintaGl(P.noche);
      noche = P.noche; bucle();
      dial(P);
      var ht = fmt(P.h), ft = fase(P.h);
      if (ht !== horaTxt) { horaTxt = ht; horaEl.textContent = ht; }
      if (ft !== faseTxt) { faseTxt = ft; faseEl.textContent = ft; }
      var n = Math.round(P.t);
      if (n !== nMuestra) muestra(n, nMuestra >= 0);
      if (!enRango) rango.value = (P.t * 100).toFixed(0);
    }
    function alReposo() {
      var n = Math.round(cur);
      capas.forEach(function (c, k) { c.setAttribute('aria-hidden', k === n ? 'false' : 'true'); });
      if (nVoz !== n && !arr) {
        var primera = nVoz === -1;
        nVoz = n;
        if (!primera) voz.textContent = textoParada(n) + '. ' + PARADAS[n].esp + '.';
      }
    }
    function paso(ts) {
      var dt = ultTs ? Math.min(64, ts - ultTs) : 16; ultTs = ts;
      var tau = arr ? 55 : 190;
      cur += (obj - cur) * (1 - Math.exp(-dt / tau));
      if (Math.abs(obj - cur) < .002) cur = obj;
      pinta(cur);
      if (cur !== obj) raf = requestAnimationFrame(paso); else { raf = 0; ultTs = 0; alReposo(); }
    }
    function arranca() { if (!raf) { ultTs = 0; raf = requestAnimationFrame(paso); } }
    function iraT(t) {
      obj = clamp(t, 0, N);
      if (!MOV) { cur = obj; pinta(cur); alReposo(); return; }
      arranca();
    }
    function ir(k) { iraT(Math.round(clamp(+k || 0, 0, N))); }
    function suelta() { arr = false; iraT(Math.round(obj)); }

    // ---------- Deslizador ----------
    rango.addEventListener('pointerdown', function () { enRango = true; arr = true; });
    function finRango() { if (!enRango && !arr) return; enRango = false; suelta(); }
    rango.addEventListener('pointerup', finRango);
    rango.addEventListener('pointercancel', finRango);
    rango.addEventListener('change', finRango);
    rango.addEventListener('input', function () {
      var v = clamp(rango.value / 100, 0, N);
      if (!MOV) { v = Math.round(v); rango.value = v * 100; }
      obj = v;
      if (MOV) arranca(); else { cur = obj; pinta(cur); }
    });
    rango.addEventListener('keydown', function (e) {
      var n = Math.round(obj), d = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') d = Math.min(N, n + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') d = Math.max(0, n - 1);
      else if (e.key === 'Home') d = 0;
      else if (e.key === 'End') d = N;
      if (d == null) return;
      e.preventDefault(); ir(d);
    });

    // ---------- Arrastrar o deslizar sobre la foto (el scroll vertical sigue libre: touch-action: pan-y) ----------
    var d = null;
    vista.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      d = { x: e.clientX, t: cur, w: vista.clientWidth || 600, id: e.pointerId, mov: false };
    });
    vista.addEventListener('pointermove', function (e) {
      if (!d) return;
      var dx = e.clientX - d.x;
      if (!d.mov) {
        if (Math.abs(dx) < 6) return;
        d.mov = true; arr = true; vista.classList.add('dia-arrastra');
        try { vista.setPointerCapture(d.id); } catch (_) { /* sin captura también funciona */ }
      }
      obj = clamp(d.t - dx / d.w * 2.6, 0, N);
      if (MOV) arranca(); else { cur = obj; pinta(cur); }
    });
    function finDrag() {
      if (d && d.mov) { vista.classList.remove('dia-arrastra'); suelta(); }
      d = null;
    }
    vista.addEventListener('pointerup', finDrag);
    vista.addEventListener('pointercancel', finDrag);

    // ---------- Cerca de la pantalla: precarga de la parada vecina y bombillas ----------
    function estaCerca(si) {
      cerca = si;
      if (si) cargaVecinas(cur);
      bucle();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { estaCerca(e.isIntersecting); });
      }, { rootMargin: '300px 0px' }).observe(pz);
    } else {
      estaCerca(true);
    }

    pinta(0); alReposo();

    inst = {
      raiz: raiz,
      ir: ir,
      parada: function () { return Math.round(cur); }
    };
    return inst;
  }

  window.Dia = {
    iniciar: iniciar,
    ir: function (i) { if (inst) inst.ir(i); }
  };

  function arranque() { if (document.getElementById('dia')) iniciar(document.getElementById('dia')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranque);
  else arranque();
})();
