#!/usr/bin/env python3
"""D7, one direction: the DON!! panel. A manga panel on aged paper -- focus
lines, screentone at the edges -- with one card at the centre and the sound
effect the game's DON!! is named after, ドン!!, hand-drawn across it.

Same layer contract as round 1, on the Play icon's 512 frame centred on
(256,256): <slug>.svg (Play master, full bleed, no corners), -bg / -fg / -mono
on the 108 dp canvas (the 512 frame at offset 128). No filters and no fonts:
the build renders with cairosvg. The glyphs are paths drawn here.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "svg")
os.makedirs(OUT, exist_ok=True)

INK, PAPER, RED = "#1E1A14", "#EFE4C8", "#D8383A"
NAVY, BRASS = "#12202E", "#C9A24A"

def P(a, r, cx, cy):
    t = math.radians(a); return cx + r * math.sin(t), cy - r * math.cos(t)

# ---------------------------------------------------------------- the lettering
# Each glyph in its own 100 x 120 box, brush strokes as filled paths: heavy
# where the brush lands, thinner where it lifts.
DO = [  # ド: ト plus the dakuten
    "M30 4 Q42 -2 56 2 L52 112 Q44 124 32 118 Z",                      # the upright
    "M50 40 Q72 46 94 62 Q96 76 86 82 Q68 70 48 62 Z",                 # the arm
    "M70 0 L82 -4 Q88 10 88 24 L78 28 Q76 14 70 0 Z",                  # dakuten 1
    "M90 -8 L102 -12 Q108 2 108 16 L98 20 Q96 6 90 -8 Z",              # dakuten 2
]
N = [  # ン: the tick and the sweep
    "M4 22 Q16 10 26 12 Q40 24 48 40 Q42 52 32 52 Q20 36 4 22 Z",
    "M-2 100 Q56 90 94 10 Q102 8 104 14 Q84 112 10 126 Q-6 118 -2 100 Z",
]
BANG = [  # !!
    "M4 0 L32 0 L22 84 L12 84 Z", "M18 92 a11 11 0 1 1 -0.1 0 Z",
    "M44 0 L72 0 L62 84 L52 84 Z", "M58 92 a11 11 0 1 1 -0.1 0 Z",
]
# placement: rising to the right, growing toward the reader
WORD = [(DO, "translate(92 272) rotate(-10) scale(1.02)"),
        (N, "translate(214 262) rotate(-8) scale(0.98)"),
        (BANG, "translate(344 236) rotate(6) scale(0.92)")]

def word(fill="none", stroke="none", sw=0, dx=0, dy=0):
    s = f'<g transform="translate({dx} {dy})" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round">'
    for paths, tf in WORD:
        s += f'<g transform="{tf}">' + "".join(f'<path d="{d}"/>' for d in paths) + "</g>"
    return s + "</g>"

def sfx():
    """Manga SFX stack: red offset print, outer ink keyline, white inline, ink fill."""
    return (word(RED, RED, 30, 9, 11) + word(INK, INK, 30) + word("none", "#FFFFFF", 15) + word(INK))

# ---------------------------------------------------------------- the card
CARD_T = "rotate(-8 256 206)"
def card():
    return (f'<g transform="{CARD_T}">'
            f'<rect x="156" y="70" width="200" height="272" rx="18" fill="url(#brass)" stroke="{INK}" stroke-width="12"/>'
            f'<rect x="174" y="88" width="164" height="170" rx="8" fill="{NAVY}" stroke="{INK}" stroke-width="5"/>'
            # a small compass star in the art window: Collect's own motif
            + "".join(f'<polygon points="{256:.1f},{173 - 44:.1f} {256 + 9:.1f},{173 - 9:.1f} 256,173 {256 - 9:.1f},{173 - 9:.1f}" '
                      f'fill="{c}" transform="rotate({a} 256 173)"/>' for a, c in ((0, "#F3DA92"), (90, "#C9A24A"), (180, "#C9A24A"), (270, "#C9A24A")))
            # the cost bubble, top-left, where the game prints it
            + f'<circle cx="170" cy="84" r="25" fill="{INK}"/><circle cx="170" cy="84" r="17" fill="none" stroke="#F3DA92" stroke-width="5"/>'
            '</g>')

# ---------------------------------------------------------------- the ground
def rng(seed):
    x = seed
    while True:
        x = (1103515245 * x + 12345) & 0x7FFFFFFF; yield x / 0x7FFFFFFF

def ground():
    s = ('<rect x="-128" y="-128" width="768" height="768" fill="url(#paper)"/>')
    # focus lines: thin ink wedges from beyond the edge toward the card, outer ring only
    r = rng(7); cx, cy = 256, 236
    s += f'<g fill="{INK}" fill-opacity=".30">'
    a = 0.0
    while a < 360:
        inner = 214 + next(r) * 60; w = 1.2 + next(r) * 3.2
        x0, y0 = P(a - w / 2, 560, cx, cy); x1, y1 = P(a + w / 2, 560, cx, cy); xi, yi = P(a, inner, cx, cy)
        s += f'<polygon points="{x0:.1f},{y0:.1f} {x1:.1f},{y1:.1f} {xi:.1f},{yi:.1f}"/>'
        a += 3.1 + next(r) * 3.4
    s += "</g>"
    # screentone: a dot grid that grows toward the corners and the bleed
    s += f'<g fill="{INK}" fill-opacity=".42">'
    step = 15
    for gy in range(-128, 641, step):
        for gx in range(-128 + (step // 2 if (gy // step) % 2 else 0), 641, step):
            d = math.hypot(gx - 256, gy - 256)
            rad = min(4.6, max(0.0, (d - 262) / 80 * 4.6))
            if rad > 0.35:
                s += f'<circle cx="{gx}" cy="{gy}" r="{rad:.2f}"/>'
    return s + "</g>"

DEFS = ('<linearGradient id="brass" gradientUnits="userSpaceOnUse" x1="150" y1="70" x2="360" y2="350">'
        '<stop offset="0" stop-color="#F3DA92"/><stop offset=".45" stop-color="#C9A24A"/><stop offset="1" stop-color="#8C6F2E"/></linearGradient>'
        '<radialGradient id="paper" gradientUnits="userSpaceOnUse" cx="256" cy="230" r="420">'
        '<stop offset="0" stop-color="#F8F1DF"/><stop offset=".45" stop-color="#EFE4C8"/><stop offset=".85" stop-color="#D9C497"/><stop offset="1" stop-color="#CDB582"/></radialGradient>')

# the monochrome layer: the card outline stops short of the lettering, so the
# word stays legible in one colour. cairosvg ignores <mask>, so the cut is a
# clip path: everything above the word's haloed outline, traced from a render.
def halo_clip(halo=36):
    import cairosvg, io
    from PIL import Image
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-128 -128 768 768" width="768" height="768">'
           + word("#000", "#000", halo) + '</svg>')
    a = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).getchannel("A")
    px = a.load(); pts = []
    for x in range(767, -1, -4):
        top = next((y for y in range(768) if px[x, y] > 0), 768)
        pts.append((x - 128, top - 128))
    return ('<clipPath id="above"><polygon points="-128,-128 640,-128 '
            + " ".join(f"{x},{y}" for x, y in pts) + '"/></clipPath>')
MONO_DEFS = halo_clip()
MONO = (f'<g clip-path="url(#above)"><g transform="{CARD_T}"><rect x="156" y="70" width="200" height="272" rx="18" fill="none" stroke="#000" stroke-width="18"/>'
        '<circle cx="170" cy="84" r="24" fill="#000"/></g></g>' + word("#000", "#000", 5))

slug, name = "don-panel", "The DON!! Panel"
HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{w}">'
NOTE = ('<!-- OP TCG Hub, icon direction "{name}" (D7, open). Original work: a manga panel, one card, '
        'and the sound effect the game names its DON!! after, drawn here as paths. No character, no '
        'publisher mark, no crew flag (landmines 26, 30; AGENDA A16). {layer} -->')
def write(path, vb, w, layer, defs, body):
    with open(path, "w") as f:
        f.write(HEAD.format(vb=vb, w=w) + "\n" + NOTE.format(name=name, layer=layer) + "\n")
        f.write(f"<defs>{defs}</defs>\n{body}\n</svg>\n")
AD = "-128 -128 768 768"
write(f"{OUT}/{slug}.svg", "0 0 512 512", 512, "Play master: full-bleed square; Play rounds the corners itself.", DEFS, ground() + card() + sfx())
write(f"{OUT}/{slug}-bg.svg", AD, 432, "Adaptive background layer, 108 dp.", DEFS, ground())
write(f"{OUT}/{slug}-fg.svg", AD, 432, "Adaptive foreground layer, 108 dp; inside the 66 dp safe zone.", DEFS, card() + sfx())
write(f"{OUT}/{slug}-mono.svg", AD, 432, "Monochrome layer for themed icons and the status bar; the system tints it.", MONO_DEFS, MONO)
# the status-bar glyph (a future drawable/ic_stat_*): the word alone, filling a
# 24 dp square -- at that size the card outline crowds the lettering out.
def word_bbox(sw):
    import cairosvg, io
    from PIL import Image
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-128 -128 768 768" width="768" height="768">'
           + word("#000", "#000", sw) + '</svg>')
    x0, y0, x1, y1 = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).getchannel("A").getbbox()
    return x0 - 128, y0 - 128, x1 - 128, y1 - 128
x0, y0, x1, y1 = word_bbox(8)
side = max(x1 - x0, y1 - y0) * 1.06; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
write(f"{OUT}/{slug}-stat.svg", f"{cx - side / 2:.1f} {cy - side / 2:.1f} {side:.1f} {side:.1f}", 96,
      "Status-bar glyph: white on transparent, the system tints it.", "", word("#FFF", "#FFF", 8))
json.dump([{"slug": slug, "name": name,
            "line": "A manga panel: one card, and ドン!!, the sound effect the game's DON!! is named after, slammed across it."}],
          open(f"{OUT}/concepts.json", "w"), indent=1)
print("wrote", OUT)
