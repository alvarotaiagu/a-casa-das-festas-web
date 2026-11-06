# A Casa das Festas · «El toldo»

Web de A Casa das Festas (acasadasfestas.com): una finca, antiguo bar-restaurante, que se alquila entera para fiestas y, en verano, quizá para dormir. Es una web estática (HTML, CSS y JS sin framework, sin WebGL), con `noindex` en todas las páginas mientras no se publique. Está solo en local.

Parte del tablero de bocetos (`../a-casa-das-festas-bocetos/`, publicado en https://claude.ai/artifact/Mhu4a1sB92aatoZtJNoLNX), con la recomendación elegida:
- el sistema de B, «El toldo»;
- el logo 1, «La A es el tejado»;
- el plano de A para los espacios;
- el recorrido de C como sección que se puede quitar;
- D, el verano, en pequeño y oculto.

## El concepto
La galería de la casa tiene una pared de rayas rojas y blancas que parece un toldo de verbena, y en el salón cuelga una guirnalda de banderines. La web los toma como sistema:
- **Un solo toldo en toda la página**, el de la portada. Se despliega en ola al cargar, no tapa nada (no es una cortina) y luego se mece apenas.
- **De él cuelga la guirnalda.** Cada banderín es un péndulo con muelle: lo mueve el viento, lo empuja el dedo o el cursor, y cada respuesta de «Arma tu fiesta» manda una racha.
- **La guirnalda se completa en el pie:** sus tres banderines se cuelgan en la A del logo.

Colores, en `css/sistema.css`:
- Rayas `#A8323A` y `#F2EEE8`.
- Tinta granate `#241517` y fondo blanco roto frío `#F6F4F1`.
- El verde de la barra, el eucalipto, el bambú y la teja, solo en banderines y detalles.

Letras: Unbounded para los titulares, Schibsted Grotesk para el texto y Sora solo en el logo (pasada a trazos). Todo en ángulo recto.

## Orden de la página
1. **Portada.** El toldo y la guirnalda sobre la foto del dron con la ría (p01), con «La finca para tu fiesta» y «Pedir fecha». En vertical, la foto va arriba y el texto sobre la tinta, para que la casa no quede debajo del titular.
2. **Los espacios en el plano de la finca** (módulo `plano`). La foto cenital p03 con 10 zonas. Las de dentro llevan contorno discontinuo y aviso de que están colocadas a ojo.
3. **Arma tu fiesta.** Qué celebráis, cuántos sois y si os quedáis a dormir. Devuelve los espacios que encajan, y su botón le pasa la elección al calendario (`CITA.rellenar`).
4. **Un día en la finca** (módulo `dia`, opcional). El recorrido por horas, con el aviso de que las noches son fotos de día teñidas.
5. **Cocina, comedor y vestuarios.** Rejilla con las fotos y «Qué incluye el alquiler», con lo que se ve y lo pendiente separados.
6. **Dormir.** Hoy son colchones en el suelo. La pestaña «Verano» está hecha y oculta.
7. **Pedir fecha.** Calendario simulado y marcado como simulación, con modo fiesta (más la noche) y modo verano por noches (oculto).
8. **Cómo llegar.** El mapa de Google solo se carga al pulsar y, sin dirección, avisa de que está pendiente. Después, el contacto y el pie.

## Ficheros
| Fichero | Qué es |
|---|---|
| `index.html` | La página. Los bloques entre marcas (`SIMBOLOS`, `PLANO`, `DIA`) los rellenan scripts |
| `js/config.js` | **Lo único que se toca sin programar**: quitar «Un día», encender el verano, contacto, lugar y registro |
| `css/sistema.css` | Variables, base, letra, botones, foco y `.pend` (lo pendiente) |
| `css/web.css`, `js/main.js` | Portada, Arma tu fiesta, cocina, dormir, llegar, pie, cookies y mando |
| `js/cita.js` | El calendario simulado. API `window.CITA = { modo(), rellenar() }` |
| `js/base.js` | Ayudantes comunes en `window.CDF` (API en su cabecera) |
| `js/plano.js`, `css/plano.css`, `partes/plano.html` | Módulo del plano. API `window.Plano = { iniciar(raiz), elegir(id) }` |
| `js/dia.js`, `css/dia.css`, `partes/dia.html` | Módulo del recorrido. API `window.Dia = { iniciar(raiz), ir(i) }` |
| `assets/` | Logo (`logo.svg`, `logo-horizontal.svg`), `favicon.svg` y `apple-touch-icon.png` |
| `img/fotos/` | Fotos en 480, 800, 1280 y 1920 (2560 en p01 y p03), en avif, webp y jpg |
| `aviso-legal.html` y demás legales, `404.html` | Generadas por `scripts/legales.mjs` |

## Scripts
- `node scripts/fotos.mjs [NN …]`: fotos web desde `fotos-seleccion/NN-*.jpg`. Nunca amplía.
- `python -I scripts/marca.py <Sora[wght].ttf>`: logo, favicon y `assets/palabra.json`. La fuente se baja de github.com/google/fonts (`ofl/sora`) y no se guarda.
- `node scripts/simbolos.mjs`: mete en `index.html` los trazos del logo que usa la cabecera.
- `node scripts/montar.mjs`: mete `partes/plano.html` y `partes/dia.html` en `index.html`. Se puede repetir.
- `node scripts/legales.mjs`: páginas legales y 404.
- `node verificar.mjs`: la comprobación final, una sola vez al terminar cada tanda. Usa un Chrome, sin capturas, y deja el 3D fuera (no hay).
- `node scripts/quitar-mando.mjs [--de-verdad]`: quita el mando de maqueta. Ver abajo.

## Quitar «Un día en la finca»
Basta con `CASA_CONFIG.secciones.dia = false` en `js/config.js`: `main.js` borra la sección y sus enlaces antes de que cargue `dia.js`, y `verificar.mjs` lo comprueba. Para borrarla del todo, quita el bloque entre `<!-- DIA:inicio -->` y `<!-- DIA:fin -->` y las dos líneas de `dia.css` y `dia.js`.

## Mando de maqueta (no viaja al cliente)
Solo sale con `?revision` en la URL: `index.html?revision`. Tiene dos versiones:
- **Verbena:** guirnalda de dos festones en la portada y una guirnalda pequeña de tres banderines bajo cada título de sección.
- **Sobria:** un solo festón con menos banderines. Las guirnaldas de sección se cambian por un dato útil de cada sección («Hoy no hay dormitorios con camas», «Cocina industrial con fogones, plancha y cámara»…).

No guarda nada en el navegador (va en la URL, `&densidad=sobria`).

**Para entregar:** `node scripts/quitar-mando.mjs` lo prueba en una copia, y `node scripts/quitar-mando.mjs --de-verdad` lo quita de `index.html`, `css/web.css` y `js/main.js`.

## Nivel §5 bis (webs reales)
- **Romper la fórmula:** sin cortina, sin titulares letra a letra, sin serif, sin cursor propio, sin pila fija y sin desplazamiento suave por librería. Lo propio del concepto es el toldo con la guirnalda física.
- **Gesto táctil propio de la portada:** tocar o arrastrar el dedo sobre la guirnalda empuja los banderines (`touch-action: pan-y`, para no romper el scroll).
- **El objeto se completa en el pie:** la cuerda se dibuja y los tres banderines se cuelgan en la A del logo.
- **Foco del teclado con la forma del motivo:** contorno de 2 px y un banderín rojo que cuelga bajo el elemento enfocado (`#foco-banderin`).
- **Rendimiento:**
  - Sin WebGL ni canvas.
  - El bucle de la guirnalda se para fuera de pantalla y con la pestaña oculta, y no corre con movimiento reducido.
  - La portada se precarga en avif con `srcset`. Las demás fotos van en diferido.
  - El `resize` de la barra del móvil no rehace nada (solo cuenta el ancho).
- **Menú opcional:** no se ha usado.

## Prohibido y comprobado
Según PLIEGO §3 bis, el script «no repetir» da este resultado (2026-11-06):

```
node ../plantillas-negocios-web/scripts/repeticion.mjs .
a-casa-das-festas-web usa: ninguna del kit
  (crema + acento chillón: fondo #F6F4F1)
✓ Repite 0 de las dominantes (tope 2).
```

El fondo `#F6F4F1` lo anota como dato, pero no lo cuenta como «crema + acento chillón»: es el blanco de las rayas, frío y sin acento chillón.

`verificar.mjs` (2026-11-06): **89 bien, 0 mal**. Comprueba:
- noindex y que no haya rayas largas ni medias;
- todas las fotos, la portada a 6 tamaños, el menú móvil y que no haya scroll horizontal;
- Arma tu fiesta, el calendario, el plano, el recorrido y el mapa;
- el foco, las cookies y las dos versiones del mando;
- quitar «Un día», las legales y el movimiento del toldo, que se para fuera de pantalla.

## Lo que falta
Está en `PENDIENTES.md` (solo en local). Todo lo que no se sabe va en la web entre corchetes.
