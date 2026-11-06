/* =====================================================================
   A Casa das Festas · pedir fecha (SIMULADO: no envía ni guarda nada)
   Un calendario con dos modos:
     - Una fiesta: un día (+ la noche si os quedáis a dormir)
     - Verano, por noches: llegada y salida, mínimo dos noches. Solo con
       CASA_CONFIG.verano = true. La temporada (15 jun - 15 sep) es un SUPUESTO.
   Los días ocupados son de ejemplo y estables (pseudoazar por fecha).
   API: window.CITA = { modo('fiesta'|'verano'), rellenar({oca, tam, dormir}) }
   ===================================================================== */
(function () {
  const $ = CDF.$;
  const cal = $('ct-cal'); if (!cal) return;
  const CFG = window.CASA_CONFIG || {};
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const SEM = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const dia = (y, m, d) => new Date(y, m, d);
  const mas = (f, n) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
  const clave = (f) => f.getFullYear() * 10000 + (f.getMonth() + 1) * 100 + f.getDate();
  const igual = (a, b) => a && b && clave(a) === clave(b);
  const largo = (f) => `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`;
  const azar = (f) => { let x = clave(f) * 2654435761 % 4294967296; x ^= x >>> 13; x = x * 1274126177 % 4294967296; return (x >>> 0) / 4294967296; };
  const MIN_FIESTA = mas(HOY, 7);
  // verano: el próximo que quede por delante (supuesto: 15 jun - 15 sep)
  const aV = HOY > dia(HOY.getFullYear(), 7, 15) ? HOY.getFullYear() + 1 : HOY.getFullYear();
  const VER_INI = new Date(Math.max(dia(aV, 5, 15), mas(HOY, 2))), VER_FIN = dia(aV, 8, 15);
  const ocVerano = new Set();
  for (let f = VER_INI; f <= VER_FIN;) {
    if (azar(f) < 0.45) { const n = 3 + Math.floor(azar(mas(f, 1)) * 5); for (let i = 0; i < n; i++) ocVerano.add(clave(mas(f, i))); f = mas(f, n + 1 + Math.floor(azar(mas(f, 2)) * 4)); }
    else f = mas(f, 1);
  }
  let modo = 'fiesta', mes = dia(MIN_FIESTA.getFullYear(), MIN_FIESTA.getMonth(), 1);
  let fecha = null, ini = null, fin = null;
  const ocupado = (f) => {
    if (modo === 'verano') return ocVerano.has(clave(f));
    const finde = f.getDay() === 5 || f.getDay() === 6 || f.getDay() === 0;
    return azar(f) < (finde ? 0.32 : 0.06);
  };
  const limites = () => modo === 'fiesta'
    ? [dia(MIN_FIESTA.getFullYear(), MIN_FIESTA.getMonth(), 1), dia(HOY.getFullYear() + 1, HOY.getMonth(), 1)]
    : [dia(VER_INI.getFullYear(), VER_INI.getMonth(), 1), dia(VER_FIN.getFullYear(), VER_FIN.getMonth(), 1)];
  const valido = (f) => modo === 'fiesta' ? f >= MIN_FIESTA : f >= VER_INI && f <= VER_FIN;
  const dormir = () => $('ct-dormir').checked;
  const libreRango = (a, b) => { for (let f = a; f < b; f = mas(f, 1)) if (ocupado(f)) return false; return true; };
  const gente = () => document.querySelector('#ct-gente [aria-pressed="true"]');
  let foco = null; // la fecha que tenía el foco, para devolvérselo al repintar

  function pintar() {
    const [lo, hi] = limites();
    $('ct-mes').textContent = `${MESES[mes.getMonth()]} ${mes.getFullYear()}`;
    $('ct-ant').disabled = mes <= lo; $('ct-sig').disabled = mes >= hi;
    cal.textContent = '';
    SEM.forEach((s, i) => { const e = document.createElement('span'); e.className = 'dia-sem'; e.textContent = s; e.setAttribute('aria-hidden', 'true'); cal.appendChild(e); });
    const hueco = (mes.getDay() + 6) % 7;
    for (let i = 0; i < hueco; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'vacio'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); cal.appendChild(b); }
    const n = dia(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= n; d++) {
      const f = dia(mes.getFullYear(), mes.getMonth(), d), b = document.createElement('button');
      b.type = 'button'; b.textContent = d; b.dataset.k = clave(f);
      const oc = ocupado(f), ok = valido(f) && !oc;
      b.disabled = !ok;
      if (f.getDay() === 5 || f.getDay() === 6 || f.getDay() === 0) b.classList.add('finde');
      let estado = oc ? 'ocupado' : (valido(f) ? 'libre' : 'no disponible');
      if (modo === 'fiesta') {
        if (igual(f, fecha)) { b.classList.add('extremo'); estado = 'tu fecha'; b.setAttribute('aria-pressed', 'true'); }
        else if (fecha && dormir() && igual(f, mas(fecha, 1))) { b.classList.add('en-rango'); estado = 'noche reservada'; }
      } else {
        if (igual(f, ini) || igual(f, fin)) { b.classList.add('extremo'); estado = igual(f, ini) ? 'llegada' : 'salida'; b.setAttribute('aria-pressed', 'true'); }
        else if (ini && fin && f > ini && f < fin) { b.classList.add('en-rango'); estado = 'noche reservada'; }
        // la salida puede caer en un día ocupado desde esa noche
        if (ini && !fin && f > ini && libreRango(ini, f) && f <= mas(VER_FIN, 1)) b.disabled = false;
      }
      b.setAttribute('aria-label', `${largo(f)}: ${estado}`);
      if (!b.disabled) b.addEventListener('click', () => { foco = clave(f); elegir(f); });
      cal.appendChild(b);
    }
    if (foco) { const b = cal.querySelector('[data-k="' + foco + '"]'); if (b && !b.disabled) b.focus(); foco = null; }
    resumen();
  }
  function elegir(f) {
    msg('');
    if (modo === 'fiesta') {
      fecha = f;
      if (dormir() && ocupado(mas(f, 1))) { msg('El día siguiente está ocupado: esa fiesta tendría que acabar sin dormir.'); $('ct-dormir').checked = false; }
    } else if (!ini || fin || f <= ini) { ini = f; fin = null; }
    else if ((f - ini) / 864e5 < 2) msg('En verano, mínimo dos noches.');
    else if (!libreRango(ini, f)) msg('Hay noches ocupadas en medio: elige otra salida.');
    else fin = f;
    pintar();
  }
  function msg(t, ok) { const m = $('ct-msg'); m.textContent = t; m.classList.toggle('ok', !!ok); }
  function fila(dl, t, v, pend) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = t;
    if (pend) { const s = document.createElement('span'); s.className = 'pend'; s.textContent = v; dd.appendChild(s); } else dd.textContent = v;
    dl.append(dt, dd);
  }
  function resumen() {
    const dl = $('ct-dl'); dl.textContent = '';
    let listo = false;
    if (modo === 'fiesta') {
      const g = gente();
      fila(dl, 'Fecha', fecha ? largo(fecha) : 'Elige un día');
      fila(dl, 'Qué', $('ct-tipo').selectedOptions[0].textContent);
      fila(dl, 'Cuántos', g.textContent);
      fila(dl, 'Dormir', fecha && dormir() ? `sí, hasta el ${largo(mas(fecha, 1))}` : 'no');
      fila(dl, 'Aforo', g.dataset.v === '3' ? '[aforo por confirmar]' : '[aforo]', true);
      fila(dl, 'Precio', '[precio]', true);
      listo = !!fecha;
    } else {
      const noches = ini && fin ? Math.round((fin - ini) / 864e5) : 0;
      fila(dl, 'Llegada', ini ? largo(ini) : 'Elige un día');
      fila(dl, 'Salida', fin ? largo(fin) : (ini ? 'Elige la salida' : 'Elige un día'));
      fila(dl, 'Noches', noches ? String(noches) : 'Ninguna');
      fila(dl, 'Plazas', '[camas por confirmar]', true);
      fila(dl, 'Precio por noche', '[precio]', true);
      listo = noches >= 2;
    }
    $('ct-btn').disabled = !listo;
  }
  function cambiarModo(m) {
    if (m === 'verano' && !CFG.verano) return;
    if (m === modo) return;
    modo = m; fecha = ini = fin = null; msg('');
    $('ct-fiesta').setAttribute('aria-pressed', String(m === 'fiesta')); $('ct-verano').setAttribute('aria-pressed', String(m === 'verano'));
    $('ct-fiesta-op').hidden = m !== 'fiesta'; $('ct-verano-op').hidden = m !== 'verano';
    mes = m === 'fiesta' ? dia(MIN_FIESTA.getFullYear(), MIN_FIESTA.getMonth(), 1) : dia(VER_INI.getFullYear(), Math.max(VER_INI.getMonth(), 6), 1);
    pintar();
  }
  if (CFG.verano) {
    $('ct-modos').hidden = false;
    const s = document.querySelector('.cita__sim');
    s.textContent += ` Para el verano se supone la temporada del 15 de junio al 15 de septiembre.`;
  }
  $('ct-fiesta').addEventListener('click', () => cambiarModo('fiesta'));
  $('ct-verano').addEventListener('click', () => cambiarModo('verano'));
  $('ct-ant').addEventListener('click', () => { mes = dia(mes.getFullYear(), mes.getMonth() - 1, 1); pintar(); });
  $('ct-sig').addEventListener('click', () => { mes = dia(mes.getFullYear(), mes.getMonth() + 1, 1); pintar(); });
  $('ct-tipo').addEventListener('change', resumen);
  $('ct-dormir').addEventListener('change', () => {
    if (fecha && dormir() && ocupado(mas(fecha, 1))) { msg('El día siguiente está ocupado: ese día no se puede dormir.'); $('ct-dormir').checked = false; }
    pintar();
  });
  const botonesGente = [...document.querySelectorAll('#ct-gente button')];
  const ponGente = (v) => botonesGente.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === v)));
  botonesGente.forEach((b) => b.addEventListener('click', () => { ponGente(b.dataset.v); resumen(); }));
  $('ct-btn').addEventListener('click', () => {
    msg(modo === 'fiesta'
      ? `Petición lista para el ${largo(fecha)}. En la web de verdad le llega al dueño, que te confirma por teléfono o WhatsApp. Aquí no se envía nada.`
      : `Petición lista: del ${largo(ini)} al ${largo(fin)}. En la web de verdad se confirma y se paga la señal. Aquí no se envía nada.`, true);
  });
  window.CITA = {
    modo: cambiarModo,
    // lo que se eligió en «Arma tu fiesta»
    rellenar(o) {
      cambiarModo('fiesta');
      if (o.oca) $('ct-tipo').value = o.oca;
      if (o.tam) ponGente(o.tam);
      $('ct-dormir').checked = !!o.dormir;
      pintar();
    }
  };
  pintar();
})();
