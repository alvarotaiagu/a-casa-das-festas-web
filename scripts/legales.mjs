/* Genera aviso-legal.html, privacidad.html, cookies.html, accesibilidad.html y 404.html con una plantilla común.
   Uso: node scripts/legales.mjs
   Titular, NIF, dirección, contacto y registro turístico NO constan: van como PENDIENTE visible. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (t = 'PENDIENTE') => `<span class="pend">${t}</span>`;

const TITULAR = `<dl class="legal__dl">
  <dt>Titular</dt><dd>${P()}</dd>
  <dt>NIF</dt><dd>${P()}</dd>
  <dt>Nombre comercial</dt><dd>A Casa das Festas</dd>
  <dt>Dirección</dt><dd>${P('[dirección]')} · ${P('[municipio]')}</dd>
  <dt>Teléfono</dt><dd>${P('[teléfono]')}</dd>
  <dt>Correo</dt><dd>${P('[correo]')}</dd>
  <dt>Actividad</dt><dd>Alquiler de finca para celebraciones${''}</dd>
  <dt>Registro turístico</dt><dd>${P('Solo si se alquila para dormir en verano')}</dd>
</dl>`;

const paginas = {
  'aviso-legal': {
    titulo: 'Aviso legal',
    cuerpo: `
<p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), estos son los datos del titular de esta web:</p>
${TITULAR}
<h2>Uso de la web</h2>
<p>Esta web informa sobre A Casa das Festas, una finca que se alquila entera para celebraciones. Los precios, el aforo y las condiciones son los que se confirman al reservar.</p>
<p>Por ahora, el calendario de esta web es una demostración: los días ocupados son de ejemplo y no se envía, se guarda ni se cobra nada.</p>
<h2>Propiedad intelectual</h2>
<p>Los textos y las fotografías son de la finca o se usan con su permiso. Las letras Unbounded, Schibsted Grotesk y Sora se usan con su licencia libre (SIL Open Font License).</p>
<h2>Responsabilidad</h2>
<p>Los enlaces a otros servicios (Google Maps, WhatsApp) llevan a terceros con sus propias condiciones.</p>
<h2>Ley aplicable</h2>
<p>Estas condiciones se rigen por la ley española.</p>`,
  },
  privacidad: {
    titulo: 'Política de privacidad',
    cuerpo: `
<h2>Responsable</h2>
${TITULAR}
<h2>Qué datos tratamos y para qué</h2>
<p>Los que nos das al pedir fecha, al escribirnos o al llamarnos: nombre, teléfono, correo, la fecha y lo que quieras contarnos. Los usamos para responderte y gestionar el alquiler.</p>
<p>Si os quedáis a dormir, la ley obliga a registrar los datos de quienes pernoctan y comunicarlos a las autoridades (Real Decreto 933/2021).</p>
<p>El calendario de esta web es, por ahora, una demostración: lo que elijas en él no sale de tu navegador ni se guarda.</p>
<h2>Base legal y plazos</h2>
<p>La base es tu consentimiento al escribirnos, la gestión del alquiler que pides y, para el registro de viajeros, una obligación legal. Los datos se conservan mientras dura la relación y, después, el tiempo que exige la ley.</p>
<h2>Con quién se comparten</h2>
<p>Con nadie, salvo obligación legal y siempre con lo imprescindible.</p>
<h2>Tus derechos</h2>
<p>Puedes pedir el acceso, la rectificación, la supresión, la oposición, la limitación o la portabilidad de tus datos escribiendo a ${P('[correo]')}. Si crees que no se han respetado, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">aepd.es</a>).</p>
<h2>Lo que guarda esta web en tu navegador</h2>
<p>Una sola cosa: <code>cdf-cookies</code> en el almacenamiento local, para recordar que ya has visto el aviso de cookies. Más detalles en <a href="cookies.html">cookies</a>.</p>`,
  },
  cookies: {
    titulo: 'Política de cookies',
    cuerpo: `
<p>Esta web no usa cookies propias de análisis ni de publicidad.</p>
<h2>Lo que se guarda en tu navegador</h2>
<ul>
  <li><b>cdf-cookies</b> (almacenamiento local): recuerda que has visto el aviso, para no enseñártelo en cada visita. Es técnica y no caduca sola; puedes borrarla desde tu navegador.</li>
</ul>
<h2>Servicios de terceros</h2>
<ul>
  <li><b>Google Fonts</b>: las letras de la web (Unbounded y Schibsted Grotesk) se cargan desde los servidores de Google, que reciben tu dirección IP.</li>
  <li><b>Google Maps</b>: el mapa de «Cómo llegar» solo se carga si pulsas «Ver el mapa». A partir de ese momento, Google puede instalar sus cookies.</li>
</ul>
<p>Las fotos y el resto de la web se sirven desde esta misma web.</p>
<p>Puedes volver a ver el aviso desde «Preferencias de cookies», en el pie de la página.</p>`,
  },
  accesibilidad: {
    titulo: 'Declaración de accesibilidad',
    cuerpo: `
<p>El titular se compromete a que esta web sea accesible conforme a la norma UNE-EN 301 549 (nivel AA de las WCAG 2.1).</p>
<h2>Situación de cumplimiento</h2>
<p>${P('PENDIENTE: completar tras la revisión de accesibilidad previa a la publicación.')}</p>
<p>La web se puede usar entera con el teclado y con lector de pantalla: contrastes suficientes, foco visible (un contorno y un banderín que cuelga bajo el elemento), textos alternativos en las fotos, y animaciones que se paran si tu sistema pide reducir el movimiento. El toldo, los banderines y el plano de la finca son adorno o ayuda visual: la información está también en el texto.</p>
<h2>La finca</h2>
<p>${P('PENDIENTE: cómo es el acceso a la casa, la terraza y los aseos para personas con movilidad reducida.')}</p>
<h2>Contacto</h2>
<p>Si encuentras una barrera, escribe a ${P('[correo]')}. Te responderemos y te daremos la información en un formato accesible.</p>`,
  },
};

const cabeza = (titulo) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · A Casa das Festas</title>
<meta name="theme-color" content="#241517">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..700&family=Unbounded:wght@500..800&display=swap">
<link rel="stylesheet" href="css/sistema.css">
<link rel="stylesheet" href="css/legal.css">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
</head>`;

const CAB = `<header class="legal-cab">
  <div class="env">
    <a class="legal-cab__logo" href="./" aria-label="A Casa das Festas, a la portada"><img src="assets/logo-horizontal.svg" alt="" width="546" height="100"></a>
    <a href="./">Volver a la portada</a>
  </div>
</header>`;

for (const [nombre, p] of Object.entries(paginas)) {
  const html = `${cabeza(p.titulo)}
<body>
${CAB}
<main class="legal">
  <div class="env">
    <h1>${p.titulo}</h1>
${p.cuerpo}
  </div>
</main>
<footer class="legal-pie">
  <div class="env">
    <a href="aviso-legal.html">Aviso legal</a>
    <a href="privacidad.html">Privacidad</a>
    <a href="cookies.html">Cookies</a>
    <a href="accesibilidad.html">Accesibilidad</a>
  </div>
</footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(RAIZ, `${nombre}.html`), html);
  console.log(`${nombre}.html`);
}

fs.writeFileSync(path.join(RAIZ, '404.html'), `${cabeza('Página no encontrada')}
<body>
${CAB}
<main class="legal legal--404">
  <div class="env">
    <img src="assets/favicon.svg" alt="" width="96" height="82">
    <h1>Esta página no está en la finca</h1>
    <p>No la encontramos. La casa sigue donde estaba, con la guirnalda puesta.</p>
    <p><a class="btn" href="./">Volver a la portada</a></p>
  </div>
</main>
</body>
</html>
`);
console.log('404.html');
