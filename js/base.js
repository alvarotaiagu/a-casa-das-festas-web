/* =====================================================================
   A Casa das Festas · ayudantes comunes (se carga antes que los módulos)
   API estable (window.CDF), la usan main.js, plano.js y dia.js:
     CDF.MOVIMIENTO            true si NO hay prefers-reduced-motion
     CDF.$(id)                 document.getElementById
     CDF.svgEl(padre, tag, attrs, texto)   crea un elemento SVG y lo cuelga
     CDF.anima(el, keyframes, opciones)    Web Animations con promesa; sin
                               movimiento salta al último fotograma
     CDF.espera(ms)            promesa; 0 ms sin movimiento
     CDF.alVer(el, fn, umbral) llama fn una vez cuando el se ve (def. .35)
     CDF.foto(clave, ancho)    'img/fotos/p08-800.jpg'
     CDF.picture(clave, alt, sizes, extra)  <picture> con avif, webp y jpg
                               (extra: {cargar:'eager'|'lazy', clase, prioridad})
     CDF.soplo(n)              racha de viento a la guirnalda de la portada (0..3)
   ===================================================================== */
(function () {
  const MOVIMIENTO = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const svgEl = (padre, t, a, txt) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    if (padre) padre.appendChild(e);
    return e;
  };
  const anima = (el, kf, op) => {
    if (!el) return Promise.resolve();
    if (!MOVIMIENTO) {
      const f = kf[kf.length - 1];
      for (const k in f) if (k !== 'offset' && k !== 'easing') el.style[k] = f[k];
      return Promise.resolve();
    }
    const a = el.animate(kf, Object.assign({ fill: 'forwards', easing: 'cubic-bezier(.65,0,.35,1)' }, op));
    return a.finished.catch(() => {});
  };
  const espera = (ms) => new Promise((r) => setTimeout(r, MOVIMIENTO ? ms : 0));
  const alVer = (el, fn, umbral) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold: umbral ?? 0.35 });
    io.observe(el);
  };

  // anchos que existen en img/fotos (scripts/fotos.mjs): p34 es vertical y no llega a 1920
  const ANCHOS = { p01: [480, 800, 1280, 1920, 2560], p03: [480, 800, 1280, 1920, 2560], p34: [480, 800, 1280] };
  const anchos = (c) => ANCHOS[c] || [480, 800, 1280, 1920];
  const foto = (c, w) => {
    const a = anchos(c);
    const ok = a.includes(w) ? w : a.reduce((m, x) => (Math.abs(x - w) < Math.abs(m - w) ? x : m), a[0]);
    return 'img/fotos/' + c + '-' + ok + '.jpg';
  };
  const srcset = (c, ext) => anchos(c).map((w) => 'img/fotos/' + c + '-' + w + '.' + ext + ' ' + w + 'w').join(', ');
  const picture = (c, alt, sizes, extra) => {
    extra = extra || {};
    const p = document.createElement('picture');
    if (extra.clase) p.className = extra.clase;
    ['avif', 'webp'].forEach((ext) => {
      const s = document.createElement('source');
      s.type = 'image/' + ext; s.srcset = srcset(c, ext); s.sizes = sizes || '100vw';
      p.appendChild(s);
    });
    const i = document.createElement('img');
    i.src = foto(c, 800); i.srcset = srcset(c, 'jpg'); i.sizes = sizes || '100vw';
    i.alt = alt || ''; i.decoding = 'async';
    i.loading = extra.cargar || 'lazy';
    if (extra.prioridad) i.fetchPriority = extra.prioridad;
    p.appendChild(i);
    return p;
  };

  const CDF = window.CDF = window.CDF || {};
  Object.assign(CDF, { MOVIMIENTO, $, svgEl, anima, espera, alVer, foto, srcset, picture });
  if (!CDF.soplo) CDF.soplo = function () {};   // main.js lo sustituye por el de la guirnalda
})();
