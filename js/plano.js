/* =====================================================================
   A Casa das Festas · «Los espacios en el plano de la finca»
   Módulo cerrado. Depende de js/base.js (window.CDF) y de css/plano.css.

   API (window.Plano):
     Plano.iniciar(raiz)   monta el plano dentro de raiz (por defecto
                           #espacios). Necesita dentro: .pl-mapa (con la foto
                           cenital), .pl-lista y .pl-ficha (vacíos; los llena
                           este script). Quita la lista estática .pl-todas y
                           añade la clase pl-js a raiz. Si ya está montado o
                           falta algo, no hace nada.
     Plano.elegir(idZona)  elige una zona con su transición. Ids: casa,
                           terraza, merendero, entrada, salon, galeria,
                           comedor, vestuarios, campo, prado.
   Se inicia solo en DOMContentLoaded si existe #espacios.

   Coordenadas: los polígonos están escritos sobre la foto cenital reducida
   a 2000 x 1125 px y se escalan por 1,28 al viewBox 2560 x 1440 del SVG
   (el mismo de la foto, para que no se descoloquen al cambiar de tamaño).
   Zonas "dentro" (grupo 'dentro'): colocadas a ojo bajo el tejado.
   Zonas "fuera": sin polígono, solo flecha en el borde del plano.
   Nada de fetch: los datos están aquí, la web también se abre con file://.
   ===================================================================== */
(function () {
  'use strict';
  var CDF = window.CDF;
  if (!CDF) return;
  var MOVIMIENTO = CDF.MOVIMIENTO, svgEl = CDF.svgEl, anima = CDF.anima,
      alVer = CDF.alVer, foto = CDF.foto, picture = CDF.picture;

  var K = 1.28;
  function esc(s) {
    return s.trim().split(/\s+/).map(function (p) {
      return p.split(',').map(function (n) { return Math.round(n * K); }).join(',');
    }).join(' ');
  }

  var AOJO = 'Esta zona está colocada a ojo en el plano, por confirmar con el dueño.';
  var FLECHA = 'La flecha del borde es orientativa: dónde queda exactamente, [por confirmar].';
  var SIZES = '(min-width:1240px) 360px, (min-width:900px) 30vw, (min-width:600px) 45vw, 100vw';

  var GRUPOS = [
    ['arriba', 'Lo que se ve desde arriba'],
    ['dentro', 'Dentro, bajo el tejado'],
    ['fuera', 'Fuera del encuadre']
  ];

  var ZONAS = [
    { id: 'casa', grupo: 'arriba', nom: 'Casa y tejado', tit: 'La casa y el tejado',
      formas: ['380,122 1118,360 1090,570 1225,540 1200,665 1160,805 322,590 215,525'],
      ancla: [590, 245],
      hace: 'La casa es granate, con tejado de teja naranja y zócalo de piedra, en una ladera de prado y frutales. Desde arriba solo se ve el tejado; lo que hay debajo está en las zonas de dentro.',
      fotos: [
        ['p07', 'La casa vista desde el prado, con el tejado de teja, los ventanales y árboles alrededor', 'Desde el prado'],
        ['p06', 'La casa a lo lejos, con su tejado naranja, entre frutales y pinos', 'Entre frutales']
      ] },
    { id: 'terraza', grupo: 'arriba', nom: 'Terraza', tit: 'La terraza',
      formas: ['1100,262 1440,335 1420,480 1385,590 1330,700 1318,880 1278,985 1085,918 1160,808 1200,665 1225,540 1085,505 1112,375'],
      ancla: [1265, 420],
      hace: 'Una terraza elevada, de baldosa, con barandilla por todo el borde y vistas al valle. Hay sillas de madera, bancos y mesas, y da al lado del merendero.',
      fotos: [
        ['p15', 'La terraza con barandilla, sillas de madera y mesas, frente a un valle verde con eucaliptos bajo un cielo azul', 'Con sol'],
        ['p16', 'Una mesa redonda con sillas de madera en la terraza, con el valle detrás', 'La mesa'],
        ['p17', 'La terraza con bancos y sillas de madera, y la casa granate detrás', 'Con la casa']
      ] },
    { id: 'merendero', grupo: 'arriba', nom: 'Merendero', tit: 'El merendero y el círculo de fuego',
      formas: ['1480,105 1755,105 1760,735 1480,735'], fuego: [1712, 470, 46],
      ancla: [1620, 330],
      hace: 'Mesas de picnic de madera sobre la hierba, junto a la casa, con un círculo de fuego en el suelo. Al lado hay un salón de cristal que se abre a este prado.',
      fotos: [
        ['p08', 'Mesas de picnic de madera sobre la hierba, con la casa y su salón acristalado detrás', 'Las mesas'],
        ['p09', 'Mesas de picnic de madera junto al salón de cristal, bajo la terraza con barandilla, con el cielo azul', 'Con el salón de cristal']
      ] },
    { id: 'entrada', grupo: 'arriba', nom: 'Entrada y patio', tit: 'La entrada y el patio',
      formas: ['400,652 690,690 1000,782 1158,812 1085,920 1100,940 1275,1000 1275,1118 1105,1118 1010,1020 880,935 700,860 690,800 430,770'],
      ancla: [790, 905],
      hace: 'Delante de la casa hay un suelo de hormigón y, al pie de la escalera que sube al porche, un patio pequeño de losa con un seto al lado.',
      nota: 'Por dónde se entra y dónde se aparca: [por confirmar].',
      fotos: [
        ['p05', 'La fachada granate de la casa vista desde abajo, con la escalera que sube al porche, un patio de losa al pie y un seto', 'La fachada']
      ] },
    { id: 'salon', grupo: 'dentro', nom: 'Salón y barra', tit: 'El salón y la barra',
      formas: ['425,172 1072,380 1050,540 350,372 325,330'],
      ancla: [690, 300], aviso: AOJO,
      hace: 'El salón principal, de paredes rojas, con ventilador de techo, sofá y vitrinas, y la barra, con pared verde, focos colgantes y botellero. Era la cafetería.',
      nota: 'Las fotos amuebladas son de septiembre de 2021. Hoy el salón está vacío.',
      fotos: [
        ['p18', 'El salón de paredes rojas con ventilador de techo, sofá, mesa baja y vitrinas, y las mesas al fondo', 'El salón'],
        ['p19', 'El salón con la barra a un lado y grandes ventanales con estores de bambú al otro', 'La barra y los ventanales'],
        ['p20', 'La barra de madera con la pared verde, focos colgantes y botellero, con sillas negras delante', 'La pared verde']
      ] },
    { id: 'galeria', grupo: 'dentro', nom: 'Galería de las rayas', tit: 'La galería de las rayas',
      formas: ['800,524 1052,590 1205,558 1180,665 1145,788 765,684'],
      ancla: [960, 640], aviso: AOJO,
      hace: 'Una galería acristalada con techo de madera, estores de bambú y una pared de rayas rojas y blancas. Tiene mesas con vistas a la finca.',
      nota: 'Las fotos son de septiembre de 2021.',
      fotos: [
        ['p22', 'La galería acristalada con techo de madera, estores de bambú, mesas con sillas y la pared de rayas rojas y blancas', 'Las rayas'],
        ['p23', 'La galería con mesas y sillas bajo el techo de madera, con estores de bambú y el valle al fondo', 'Con vistas']
      ] },
    { id: 'comedor', grupo: 'dentro', nom: 'Comedor y cocina', tit: 'El comedor y la cocina',
      formas: ['350,392 770,514 728,672 335,568 255,520 305,430'],
      ancla: [520, 520], aviso: AOJO,
      hace: 'Un comedor grande con muchas mesas, para sentarse todos juntos, y una cocina industrial con fogones, plancha, mesas de acero y cámara.',
      nota: 'Qué incluye el alquiler de la cocina y del menaje: [por confirmar].',
      fotos: [
        ['p26', 'El comedor grande, con mesas redondas y largas con manteles y sillas de madera', 'El comedor'],
        ['p28', 'La cocina industrial, con campana, fogones, plancha y una mesa grande de acero', 'La cocina']
      ] },
    { id: 'vestuarios', grupo: 'dentro', nom: 'Vestuarios', tit: 'Los vestuarios',
      formas: ['1170,815 1300,808 1305,880 1272,962 1105,912'],
      ancla: [1215, 880], aviso: AOJO,
      hace: 'Vestuarios con duchas y aseos, de paredes amarillas, con bancos de madera y dos lavabos con flores.',
      fotos: [
        ['p33', 'Un vestuario de paredes amarillas con un banco de madera y una puerta oscura abierta', 'El vestuario'],
        ['p32', 'Dos lavabos blancos sobre un mueble oscuro, con espejos y flores blancas, bajo paredes amarillas', 'Los lavabos']
      ] },
    { id: 'campo', grupo: 'fuera', nom: 'Campo de fútbol', tit: 'El campo de fútbol',
      borde: 'campo', aviso: FLECHA,
      hace: 'Un campo de fútbol de hierba, con porterías y árboles alrededor, aparte de la casa.',
      nota: 'No sale en la foto del dron: está fuera del encuadre.',
      fotos: [
        ['p11', 'Un campo de fútbol de hierba con una portería, rodeado de árboles y monte', 'El campo']
      ] },
    { id: 'prado', grupo: 'fuera', nom: 'Prado de frutales', tit: 'El prado de frutales',
      borde: 'prado', aviso: FLECHA,
      hace: 'La ladera de prado con frutales en la que está la casa, entre eucaliptos y pinos, con una mesa de picnic de madera bajo un árbol grande.',
      nota: 'Queda fuera del encuadre de esta foto.',
      fotos: [
        ['p13', 'Un prado verde con frutales bajo un cielo azul', 'Frutales'],
        ['p04', 'Vista desde el dron de la finca, con prado y árboles sueltos en la ladera', 'Desde el dron'],
        ['p10', 'Una mesa de picnic de madera bajo un árbol grande, sobre la hierba', 'Bajo el árbol']
      ] }
  ];

  var POR_ID = {};
  ZONAS.forEach(function (z) { POR_ID[z.id] = z; });

  var elegirInterno = null;
  function elegir(id) { if (elegirInterno) elegirInterno(id, true); }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // Texto con huecos entre corchetes: cada [hueco] sale como .pend
  function conPend(padre, texto) {
    padre.replaceChildren();
    String(texto || '').split(/(\[[^\]]+\])/).forEach(function (t) {
      if (!t) return;
      if (/^\[[^\]]+\]$/.test(t)) padre.appendChild(el('span', 'pend', t));
      else padre.appendChild(document.createTextNode(t));
    });
  }

  function flecha() {
    var s = svgEl(null, 'svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    svgEl(s, 'path', { d: 'M20 12H5M11 5l-7 7 7 7', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'square' });
    return s;
  }

  function iniciar(raiz) {
    raiz = raiz || document.getElementById('espacios');
    if (!raiz || raiz.dataset.plListo) return;
    var mapa = raiz.querySelector('.pl-mapa');
    var lista = raiz.querySelector('.pl-lista');
    var ficha = raiz.querySelector('.pl-ficha');
    if (!mapa || !lista || !ficha) return;
    raiz.dataset.plListo = '1';
    raiz.classList.add('pl-js');
    var estatica = raiz.querySelector('.pl-todas');
    if (estatica) estatica.remove();

    var actual = null;
    var gs = {};        // id -> <g> del SVG
    var bordes = {};    // id -> chip del borde
    var botones = {};   // id -> botón de la lista
    var cacheFotos = {};

    function dameFoto(clave, alt, cargar) {
      var k = clave + '|' + alt;
      if (!cacheFotos[k]) cacheFotos[k] = picture(clave, alt, SIZES, { cargar: cargar || 'lazy' });
      return cacheFotos[k];
    }
    function precarga(id) {
      var z = POR_ID[id];
      if (z && z.fotos.length) dameFoto(z.fotos[0][0], z.fotos[0][1], 'eager');
    }

    /* ---------- dibujo: zonas en SVG ---------- */
    var svg = svgEl(null, 'svg', { class: 'pl-zonas', viewBox: '0 0 2560 1440', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' });
    ZONAS.forEach(function (z) {
      if (!z.formas) return;
      var g = svgEl(svg, 'g', { class: 'pl-z' + (z.grupo === 'dentro' ? ' pl-z--dentro' : ''), 'data-z': z.id });
      var figs = z.formas.map(function (f) { return ['polygon', { points: esc(f) }]; });
      if (z.fuego) figs.push(['circle', { cx: Math.round(z.fuego[0] * K), cy: Math.round(z.fuego[1] * K), r: Math.round(z.fuego[2] * K), class: 'pl-fuego' }]);
      ['pl-hit', 'pl-halo', 'pl-fig'].forEach(function (c) {
        figs.forEach(function (f) {
          var a = Object.assign({}, f[1]);
          a.class = (a.class ? a.class + ' ' : '') + c;
          svgEl(g, f[0], a);
        });
      });
      gs[z.id] = g;
    });
    mapa.appendChild(svg);

    // flechas del borde (fuera del encuadre)
    ZONAS.forEach(function (z) {
      if (!z.borde) return;
      var c = el('div', 'pl-borde pl-borde--' + z.borde);
      c.setAttribute('aria-hidden', 'true');
      c.dataset.z = z.id;
      c.appendChild(flecha());
      c.appendChild(el('span', '', z.nom));
      mapa.appendChild(c);
      bordes[z.id] = c;
    });

    var rotulo = el('div', 'pl-rotulo');
    rotulo.setAttribute('aria-hidden', 'true');
    rotulo.hidden = true;
    mapa.appendChild(rotulo);

    function colocaRotulo() {
      var z = actual;
      if (!z || !z.ancla) { rotulo.hidden = true; return; }
      rotulo.hidden = false;
      var W = mapa.clientWidth, H = mapa.clientHeight;
      var w = rotulo.offsetWidth, h = rotulo.offsetHeight;
      var x = z.ancla[0] / 2000 * W, y = z.ancla[1] / 1125 * H;
      x = Math.min(Math.max(x, w / 2 + 6), Math.max(w / 2 + 6, W - w / 2 - 6));
      y = Math.min(Math.max(y, h / 2 + 6), Math.max(h / 2 + 6, H - h / 2 - 6));
      rotulo.style.left = x + 'px';
      rotulo.style.top = y + 'px';
    }
    if ('ResizeObserver' in window) new ResizeObserver(colocaRotulo).observe(mapa);
    else window.addEventListener('resize', colocaRotulo);

    /* ---------- lista de botones (teclado y lector de pantalla) ---------- */
    lista.replaceChildren();
    GRUPOS.forEach(function (gr) {
      var caja = el('div', 'pl-grupo');
      caja.setAttribute('role', 'group');
      caja.setAttribute('aria-label', gr[1]);
      var t = el('p', 'pl-grupo-t', gr[1]);
      t.setAttribute('aria-hidden', 'true');
      caja.appendChild(t);
      ZONAS.filter(function (z) { return z.grupo === gr[0]; }).forEach(function (z) {
        var b = el('button', 'op pl-bt' + (z.grupo === 'dentro' ? ' pl-bt--dentro' : ''), z.nom);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.dataset.z = z.id;
        caja.appendChild(b);
        botones[z.id] = b;
      });
      lista.appendChild(caja);
    });

    /* ---------- ficha ---------- */
    ficha.replaceChildren();
    var fFoto = el('div', 'pl-foto');
    var fMinis = el('div', 'pl-minis');
    fMinis.setAttribute('role', 'group');
    fMinis.setAttribute('aria-label', 'Más fotos de esta zona');
    var fTxt = el('div', 'pl-fi-txt');
    fTxt.setAttribute('aria-live', 'polite');
    fTxt.setAttribute('aria-atomic', 'true');
    var fNom = el('h3', 'pl-nom');
    var fHace = el('p', 'pl-hace');
    var fAforo = el('p', 'pl-aforo');
    fAforo.appendChild(document.createTextNode('Aforo: '));
    fAforo.appendChild(el('span', 'pend', '[aforo]'));
    var fNota = el('p', 'nota pl-nota');
    var fAviso = el('p', 'nota pl-aviso');
    [fNom, fHace, fAforo, fNota, fAviso].forEach(function (e) { fTxt.appendChild(e); });
    [fFoto, fMinis, fTxt].forEach(function (e) { ficha.appendChild(e); });

    function pintaFoto(z, i, anim) {
      var f = z.fotos[i];
      var pic = dameFoto(f[0], f[1]);
      var im = pic.querySelector('img');
      if (im) im.loading = 'lazy';
      fFoto.replaceChildren(pic);
      Array.prototype.forEach.call(fMinis.children, function (b, k) {
        b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      if (anim) anima(pic, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out', fill: 'none' });
    }

    function respira(id) {
      if (!MOVIMIENTO) return;
      var e = gs[id] || bordes[id];
      if (e) anima(e, [{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 760, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'none' });
    }

    function poner(id, anim) {
      var z = POR_ID[id];
      if (!z || z === actual) return;
      actual = z;
      ZONAS.forEach(function (o) {
        var on = o === z;
        botones[o.id].setAttribute('aria-pressed', on ? 'true' : 'false');
        if (gs[o.id]) gs[o.id].classList.toggle('on', on);
        if (bordes[o.id]) bordes[o.id].classList.toggle('on', on);
      });
      // el carril de botones (móvil) se centra sin mover la página
      var bt = botones[id];
      if (lista.scrollWidth > lista.clientWidth + 2) {
        lista.scrollTo({ left: bt.offsetLeft - (lista.clientWidth - bt.offsetWidth) / 2, behavior: anim && MOVIMIENTO ? 'smooth' : 'auto' });
      }
      rotulo.textContent = z.nom;
      colocaRotulo();
      fNom.textContent = z.tit;
      fHace.textContent = z.hace;
      conPend(fNota, z.nota);
      conPend(fAviso, z.aviso);
      fNota.hidden = !z.nota;
      fAviso.hidden = !z.aviso;
      fMinis.replaceChildren();
      if (z.fotos.length > 1) z.fotos.forEach(function (f, i) {
        var b = el('button', 'pl-mini');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ver foto: ' + f[2]);
        b.setAttribute('aria-pressed', 'false');
        var im = document.createElement('img');
        im.src = foto(f[0], 480); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
        b.appendChild(im);
        b.addEventListener('click', function () { pintaFoto(z, i, true); });
        fMinis.appendChild(b);
      });
      pintaFoto(z, 0, anim);
      if (anim) {
        anima(fTxt, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none' });
        if (!rotulo.hidden) anima(rotulo, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out', fill: 'none' });
        respira(id);
      }
    }
    elegirInterno = poner;

    /* ---------- eventos ---------- */
    svg.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('.pl-z');
      if (g) poner(g.dataset.z, true);
    });
    svg.addEventListener('pointerover', function (e) {
      var g = e.target.closest && e.target.closest('.pl-z');
      if (g) precarga(g.dataset.z);
    });
    mapa.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.pl-borde');
      if (c) poner(c.dataset.z, true);
    });
    mapa.addEventListener('pointerover', function (e) {
      var c = e.target.closest && e.target.closest('.pl-borde');
      if (c) precarga(c.dataset.z);
    });
    lista.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.pl-bt');
      if (b) poner(b.dataset.z, true);
    });
    ['pointerover', 'focusin'].forEach(function (ev) {
      lista.addEventListener(ev, function (e) {
        var b = e.target.closest && e.target.closest('.pl-bt');
        if (b) precarga(b.dataset.z);
      });
    });

    poner('merendero', false);
    // al verse el plano, la zona elegida respira una vez
    alVer(mapa, function () { respira(actual.id); }, 0.4);
  }

  window.Plano = { iniciar: iniciar, elegir: elegir };

  function auto() { if (document.getElementById('espacios')) iniciar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
