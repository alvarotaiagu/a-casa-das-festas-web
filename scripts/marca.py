"""Logo de A Casa das Festas: la A-tejado (logo 1 del tablero) + «A Casa das Festas» en Sora 700 pasada a trazos.
Uso: python -I scripts/marca.py <ruta a Sora[wght].ttf>
     (la variable de github.com/google/fonts/ofl/sora; no se guarda en el repo)
Escribe:
  assets/logo.svg             marca + palabra en dos líneas, centrado (granate, teja y tinta)
  assets/logo-horizontal.svg  marca + palabra en una línea (para cabeceras)
  assets/favicon.svg          solo la marca (pestaña)
  assets/palabra.json         los trazos de la palabra (una y dos líneas) para pegarlos en línea en el HTML
"""
import json, sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAL = RAIZ / 'assets'
SAL.mkdir(exist_ok=True)

f = TTFont(sys.argv[1])
f = instantiateVariableFont(f, {'wght': 700})
upm = f['head'].unitsPerEm
cmap = f.getBestCmap()
gs = f.getGlyphSet()
hmtx = f['hmtx']

TRACK = -0.025  # em, como en el tablero

def linea(texto, tam, x0, base):
    """Trazos de una línea de texto a tamaño tam (px), empezando en x0 con la línea base en base."""
    esc = tam / upm
    pen = SVGPathPen(gs, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    x = 0.0
    for ch in texto:
        g = cmap[ord(ch)]
        adv = hmtx[g][0]
        if ch != ' ':
            tp = TransformPen(pen, (esc, 0, 0, -esc, x0 + x * esc, base))
            gs[g].draw(tp)
        x += adv + TRACK * upm
    ancho = (x - TRACK * upm) * esc
    return pen.getCommands(), ancho

def medir(texto, tam):
    return linea(texto, tam, 0, 0)[1]

CAP = 0.7  # alto de las mayúsculas de Sora aprox. (em)

MARCA = '''<path fill="#8F2D25" d="M2 60L60 6L118 60H100L60 23L20 60ZM26 48L40 35.5V96H26ZM80 35.5L94 48V96H80Z"/>
<path fill="none" stroke="#241517" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" d="M33 62Q60 80 87 62"/>
<path fill="#CF6A3F" d="M43 68.6L51 70.4L45.6 78.8ZM56 71.2L64 71.2L60 80.5ZM69 70.4L77 68.6L74.4 78.8Z"/>'''

# --- dos líneas, centrado bajo la marca ---
T2 = 30
w1, w2 = medir('A Casa', T2), medir('das Festas', T2)
W = max(120, w1, w2) + 8
ox = (W - 120) / 2
y1 = 100 + 18 + CAP * T2
y2 = y1 + T2 * 1.02
d1, _ = linea('A Casa', T2, (W - w1) / 2, y1)
d2, _ = linea('das Festas', T2, (W - w2) / 2, y2)
H = y2 + 0.24 * T2 + 4
logo = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H:.1f}" role="img" aria-label="A Casa das Festas">
<g transform="translate({ox:.1f} 0)">
{MARCA}
</g>
<path fill="#241517" d="{d1} {d2}"/>
</svg>
'''
(SAL / 'logo.svg').write_text(logo, encoding='utf-8')

# --- una línea, marca a la izquierda ---
T1 = 46
wl = medir('A Casa das Festas', T1)
gap = 22
base1 = 60 + CAP * T1 / 2 + 8
dl, _ = linea('A Casa das Festas', T1, 120 + gap, base1)
WH = 120 + gap + wl + 2
hor = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WH:.1f} 100" role="img" aria-label="A Casa das Festas">
{MARCA}
<path fill="#241517" d="{dl}"/>
</svg>
'''
(SAL / 'logo-horizontal.svg').write_text(hor, encoding='utf-8')

# --- favicon: solo la marca, sin cuerda (a 16 px no se ve), un poco más gruesa de aire ---
fav = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -4 124 106">
<path fill="#8F2D25" d="M2 60L60 6L118 60H100L60 23L20 60ZM26 48L40 35.5V96H26ZM80 35.5L94 48V96H80Z"/>
<path fill="#CF6A3F" d="M43 68.6L51 70.4L45.6 78.8ZM56 71.2L64 71.2L60 80.5ZM69 70.4L77 68.6L74.4 78.8Z"/>
</svg>
'''
(SAL / 'favicon.svg').write_text(fav, encoding='utf-8')

json.dump({
    'unaLinea': {'d': dl, 'viewBox': f'0 0 {WH:.1f} 100', 'xPalabra': 120 + gap},
    'dosLineas': {'d': d1 + ' ' + d2, 'viewBox': f'0 0 {W:.1f} {H:.1f}', 'xMarca': round(ox, 1)},
}, open(SAL / 'palabra.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('logo.svg', f'{W:.0f}x{H:.0f}', '| logo-horizontal.svg', f'{WH:.0f}x100', '| favicon.svg')
