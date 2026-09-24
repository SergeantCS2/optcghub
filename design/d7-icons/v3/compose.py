#!/usr/bin/env python3
"""D7 v3: ドン!! on a white card back, rising from a flat cartoon sea.

The composition a design panel (three designs, six judges) converged on:
- the sea design's sky and its card rising from the water, the only draft whose card read as a card
- that design's curl dropped (it read as a tentacle), along with its scallop strip and horizon line
- the full-icon design's tighter, bigger ドン!!, the most legible word at 36 px
- the judges' fixes:
  - heavier outlines, matched between card and word
  - the word breaking past both card edges
  - no chart lines and a single ring on the rose
  - a thinner status glyph

Our own card back only: the owner's comparison with the printed emblem is not
part of this repository (take 63; landmines 26, 30).

  python3 design/d7-icons/v3/compose.py            # writes v3/svg: own-ink, own-red
"""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from parts import *

SKY_TOP, SKY_LOW, SEA_DEEP, SEA_MID = "#1C9BE6", "#86D4FA", "#0B3A86", "#1760C4"
HZ = 292
CARD = dict(cx=250, cy=232, w=288, h=404, rot=8)
CREST = [(-140, 388), (-30, 404), (70, 390), (170, 410), (270, 394), (370, 414), (470, 398), (560, 410), (660, 402)]
WORD = dict(cx=258, cy=304, s=1.13, rot=-8, n_x=116, bang_x=238, bang_k=1.14)
KEY, INLINE, OFFSET = 30, 14, (10, 12)

# ---------------------------------------------------------------- curves (from the sea design)
def cr_sample(ps, per=16):
    """Catmull-Rom through the points, sampled as a polyline."""
    out = []; n = len(ps)
    for i in range(n - 1):
        p0 = ps[i - 1] if i > 0 else ps[i]; p1 = ps[i]; p2 = ps[i + 1]; p3 = ps[i + 2] if i + 2 < n else ps[i + 1]
        for k in range(per):
            t = k / per; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                   + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(ps[-1]); return out

def poly(ps, cmd="M"):
    return cmd + " L".join(f"{x:.1f},{y:.1f}" for x, y in ps)

def arclen(ps):
    s = [0]
    for a, b in zip(ps, ps[1:]): s.append(s[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return s

def at(ps, s, L):
    for i in range(len(ps) - 1):
        if s[i + 1] >= L:
            t = (L - s[i]) / ((s[i + 1] - s[i]) or 1); a, b = ps[i], ps[i + 1]
            tx, ty = b[0] - a[0], b[1] - a[1]; m = math.hypot(tx, ty) or 1
            return (a[0] + tx * t, a[1] + ty * t), (-ty / m, tx / m)
    a, b = ps[-2], ps[-1]; tx, ty = b[0] - a[0], b[1] - a[1]; m = math.hypot(tx, ty) or 1
    return b, (-ty / m, tx / m)

def foam(top, n, th, sweep=1, rk=0.56):
    """White foam riding the crest polyline `top`: the outer edge is the crest, the
    inner edge round scallops with sharp cusps, thickening from th[0] to th[1]."""
    s = arclen(top); L = s[-1]
    d = poly(top)
    cusps = []
    for k in range(n + 1):
        Lk = L - L * k / n
        (x, y), (nx, ny) = at(top, s, Lk)
        u = Lk / L
        t = (th[0] + (th[1] - th[0]) * min(1, u / 0.6)) if 0 < k < n else 0
        cusps.append((x + nx * t, y + ny * t))
    d += f" L{cusps[0][0]:.1f},{cusps[0][1]:.1f}"
    for (x0, y0), (x1, y1) in zip(cusps, cusps[1:]):
        r = math.hypot(x1 - x0, y1 - y0) * rk
        d += f" A{r:.1f},{r:.1f} 0 0 {sweep} {x1:.1f},{y1:.1f}"
    return d + " Z"

# ---------------------------------------------------------------- the word (from the full-icon design)
def kana_fit(cx, cy, s, rot=-8, n_x=128, bang_x=262, bang_k=1.0, bang_rot=6):
    """ドン!! at scale s, the glyphs spaced tighter, the !! scaled, the ink centred on (cx, cy)."""
    x0, x1 = 30, bang_x + 4 + 72 * bang_k
    y0, y1 = -2, 128
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    base = f"translate({cx} {cy}) rotate({rot}) scale({s:.3f}) translate({-mx:.1f} {-my:.1f})"
    return [(KANA["do"], base + " translate(0 10) rotate(-4 50 60)"),
            (KANA["n"], base + f" translate({n_x} 4)"),
            (KANA["bang"], base + f" translate({bang_x} {-8 - (bang_k - 1) * 84:.1f}) rotate({bang_rot} 36 50) scale({bang_k})")]

def word_groups():
    return kana_fit(WORD["cx"], WORD["cy"], WORD["s"], rot=WORD["rot"], n_x=WORD["n_x"],
                    bang_x=WORD["bang_x"], bang_k=WORD["bang_k"])

# ---------------------------------------------------------------- the scene
def sea_front():
    top = cr_sample(CREST, per=20)
    s = f'<path d="{poly(top) + " L660,700 L-140,700 Z"}" fill="{SEA_MID}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
    s += f'<path d="{foam(top, 10, (12, 20))}" fill="{WHITE}" stroke="{INK}" stroke-width="5.5" stroke-linejoin="round"/>'
    return s

def compose(way):
    defs = (f'<linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="-128" x2="0" y2="{HZ}">'
            f'<stop offset="0" stop-color="{SKY_TOP}"/><stop offset="1" stop-color="{SKY_LOW}"/></linearGradient>')
    bg = ('<rect x="-128" y="-128" width="768" height="768" fill="url(#sky)"/>'
          f'<g transform="rotate(-3 256 {HZ})"><rect x="-300" y="{HZ}" width="1100" height="900" fill="{SEA_DEEP}"/></g>')
    cd, card = back_white(**CARD, way=way, border=14, emblem_y=0.30, emblem_r=0.27, uid="c" + way[0])
    groups = word_groups()
    return defs + cd, bg + card + sea_front(), sfx(groups, key=KEY, inline=INLINE, offset=OFFSET), groups

def mono_layer(groups, mk=0.83):
    """One colour: the card outline and its rose, cut flat just under the word, then
    the word, the card cut clear of it; scaled to sit inside the safe zone. (A
    crest line or a cut along the crest left loose fragments in the themed icon.)"""
    ko = knockout_clip(groups, halo=KEY + 16)
    x, y = CARD["cx"] - CARD["w"] / 2, CARD["cy"] - CARD["h"] / 2
    emb = rose(CARD["cx"], y + CARD["h"] * 0.30, CARD["w"] * 0.27, colour="#000", field="none", inner_ring=False)
    card = (f'<g transform="rotate({CARD["rot"]} {CARD["cx"]} {CARD["cy"]})">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{CARD["w"]}" height="{CARD["h"]}" rx="{CARD["w"] * .055:.1f}" '
            f'fill="none" stroke="#000" stroke-width="18"/>{emb}</g>')
    tf = f"translate(256 256) scale({mk}) translate(-256 -256)"
    defs = ko + '<clipPath id="sea"><path d="M-128,-128 L640,-128 L640,356 L-128,356 Z"/></clipPath>'
    return defs, (f'<g transform="{tf}"><g clip-path="url(#ko)"><g clip-path="url(#sea)">{card}</g></g>'
                  + paths_svg(groups, "#000", "#000", 5) + "</g>")

def build(out, way):
    slug = f"own-{way}"
    defs, bg, fg, groups = compose(way)
    mdefs, mono = mono_layer(groups)
    write_set(out, slug, f"Our card back, {way} outline",
              "The white card back rising from a flat cartoon sea; ドン!! slammed across it.",
              defs, bg, fg, mdefs, mono, groups)
    return slug

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "svg")
    for way in ("ink", "red"):
        print("built", build(out, way))
