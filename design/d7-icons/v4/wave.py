"""D7 v4 sea, "ukiyoe": the Great Wave idiom (Hokusai, 1831, public domain), drawn here.

The pick of a three-design panel (style 6.5/10), with the judges' fixes: a
Prussian ichimonji band over a warmer buff sky (the old buff melted into light
wallpapers), a Prussian backing under the claws (they smeared onto the card's
white at launcher sizes), striations in the barrel, the wave 10 px lower and the
left crest inward (the circle mask cut both), a lighter near swell with its own
claw crest, and no spray (it vanished below 72 px).

One towering crest rising up the right-hand side and rolling over the card's
top corner: a Prussian-blue hood banded in lighter blues, a cream foam cap whose
inner edge breaks into swept teeth, four claw fingers hooking off the lip, and a
barrel whose face runs pale down to the trough -- the card rides inside it.
In front, two swells lock together (the far one cresting at the left edge, the
near one under the barrel), foam on their crests only, tapered woodblock
striations below. A pale buff sky with a darker band at the top. Even ink on
the silhouettes, flat colour, no gradients in the water.

The wave rises on the right (Hokusai's is mirrored) for the word's sake: the
word's green offset print sits on its right, so the water meets green there,
while its left-hand keyline sits on the pale sky.

Layers: sea_back() is the barrel's far wall, behind the card; sea_front() is
the great wave (its hood over the card's corner), the spray and the swells.
Nothing here uses a filter, a mask, text, or clip-rule.
"""
import math, sys
import os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "v3"))
from parts import P, INK

# ------------------------------------------------------------------ palette (flat, woodblock)
PRUSSIAN = "#1f3d72"      # the wave's body
BAND = "#4d7ab3"          # the lighter band that follows the form
PALE = "#a6c3db"          # the palest band
FOAM = "#fbf6e9"          # cream foam (not the card's white)
HOLLOW = "#d3e2ec"        # the barrel's far wall, lit through the lip: the palest water
SKY_PALE, SKY_BAND = "#efd9a8", "#1f3d72"
SW = 5.5                  # the even ink outline
FSW = 4.6                 # the foam's outline

# ------------------------------------------------------------------ curve helpers
def cr(ps, per=14):
    """Catmull-Rom through the points, sampled."""
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
    s = [0.0]
    for a, b in zip(ps, ps[1:]): s.append(s[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return s

def normals(ps):
    """Unit right-hand normals (screen coordinates, y down): every outline here
    travels so that its right hand points into the water."""
    out = []
    for i in range(len(ps)):
        a = ps[max(i - 1, 0)]; b = ps[min(i + 1, len(ps) - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]; m = math.hypot(tx, ty) or 1
        out.append((-ty / m, tx / m))
    return out

def at(ps, u):
    """Point, inward normal and index at fraction u of the outline's length."""
    s = arclen(ps); L = s[-1]; i = min(range(len(ps)), key=lambda k: abs(s[k] - u * L))
    return ps[i], normals(ps)[i], i

def offset(ps, d):
    """Offset a polyline along its inward normal by d(u), u = 0..1 by arc length."""
    s = arclen(ps); L = s[-1] or 1; ns = normals(ps)
    return [(x + nx * d(q / L), y + ny * d(q / L)) for (x, y), (nx, ny), q in zip(ps, ns, s)]

def sub(ps, a, b):
    s = arclen(ps); L = s[-1]
    return [p for p, q in zip(ps, s) if a * L <= q <= b * L]

def band(ps, a, b, d0, d1):
    """A band inside the water between offsets d0(u) and d1(u) of the stretch a..b."""
    seg = sub(ps, a, b)
    return poly(offset(seg, d0)) + " " + poly(list(reversed(offset(seg, d1))), "L") + " Z"

def ease(u, a, b):
    """0 -> 1 -> 0: rises over the first a of u, falls over the last b (sine eased)."""
    k = 1.0
    if a: k = min(k, u / a)
    if b: k = min(k, (1 - u) / b)
    return math.sin(max(0, min(1, k)) * math.pi / 2)

def teeth(ps, a, b, tip, root, stops, skew=0.3):
    """The foam's inner edge along the stretch a..b of `ps`, as swept teeth: at
    each fraction in `stops` a sharp point at depth tip(f); between them the edge
    rises to depth root(f) a `skew` of the way along, so every tooth leans the
    same way, like foam streaming off a crest (uneven stops on purpose -- an even
    row reads as a doily). Returned travelling b -> a, as commands that continue a path."""
    seg = sub(ps, a, b); s = arclen(seg); L = s[-1]; ns = normals(seg)
    def pt(f, d):
        q = L * f; i = min(range(len(seg)), key=lambda j: abs(s[j] - q))
        (x, y), (nx, ny) = seg[i], ns[i]; return (x + nx * d, y + ny * d)
    st = sorted(stops, reverse=True); out = []
    for f0, f1 in zip(st, st[1:]):
        for k in range(12):
            t = k / 12; f = f0 + (f1 - f0) * t
            g = ((skew - t) / skew) ** 2 if t < skew else ((t - skew) / (1 - skew)) ** 1.8
            out.append(pt(f, root(f) + (tip(f) - root(f)) * g))
    out.append(pt(st[-1], tip(st[-1])))
    return " " + poly(out, "L")

def talon(bx, by, ang, length, width, bend):
    """One foam finger: rooted at (bx, by), setting out at angle `ang` (degrees,
    0 = up, clockwise) and bending by `bend` degrees, most of it near the tip --
    the Great Wave's claw, a hook, never a spiral. Returns a path."""
    n = 20; spine = [(bx, by)]
    for i in range(1, n + 1):
        u = i / n
        dx, dy = P(ang + bend * u * u, length / n, 0, 0); spine.append((spine[-1][0] + dx, spine[-1][1] + dy))
    ns = normals(spine)
    hw = [width / 2 * (1 - i / n) ** 0.75 for i in range(n + 1)]
    left = [(x - nx * w, y - ny * w) for (x, y), (nx, ny), w in zip(spine, ns, hw)]
    right = [(x + nx * w, y + ny * w) for (x, y), (nx, ny), w in zip(spine, ns, hw)]
    return poly(left) + " " + poly(list(reversed(right)), "L") + " Z"

def union(ds, fill, sw):
    """Shapes that overlap, outlined as one: every shape stroked twice as wide,
    then every shape filled over the strokes, so only the outer edge keeps ink."""
    return ("".join(f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw * 2:.1f}" stroke-linejoin="round"/>' for d in ds)
            + "".join(f'<path d="{d}" fill="{fill}"/>' for d in ds))

def inked(d, fill, sw=SW):
    return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>'

def flat(d, fill):
    return f'<path d="{d}" fill="{fill}"/>'

# ------------------------------------------------------------------ geometry (the 512 frame; bleeds to -128..640)
# The great wave's outline, from the lip's tip round the front of the hood, over
# the crest and down its back (off the right edge): right hand = into the water.
OUTER = [(378, 126), (356, 116), (343, 94), (343, 64), (356, 38), (382, 18), (418, 8), (456, 8), (490, 20),
         (520, 46), (542, 84), (558, 136), (572, 210), (584, 310), (592, 430), (598, 570), (602, 720)]
# from the tip back under the hood and down the barrel's face (a C round the card's
# right edge, never behind it) into the trough
UNDER = [(378, 126), (398, 112), (422, 106), (444, 112), (460, 130), (470, 160), (474, 200), (470, 250), (460, 300),
         (444, 345), (424, 380), (404, 410), (392, 450), (388, 700)]
CLAWS = [  # u on OUTER (0 = the lip's tip), length, width, lean (deg off the outward normal), bend
    (0.006, 30, 17, -38, -75),
    (0.034, 46, 21, -20, -90),
    (0.066, 44, 20, -4, -88),
    (0.098, 30, 16, 10, -75),
]
DROPS = [(438, 146, 4.6), (452, 172, 3.4), (444, 198, 2.6)]   # spray inside the barrel: white, no ink

def sky():
    return '<rect x="-128" y="-128" width="768" height="768" fill="url(#ukisky)"/>'

def _sky_defs():
    return (f'<linearGradient id="ukisky" gradientUnits="userSpaceOnUse" x1="0" y1="-128" x2="0" y2="260">'
            f'<stop offset="0" stop-color="{SKY_BAND}"/><stop offset="0.44" stop-color="{SKY_BAND}"/>'
            f'<stop offset="0.56" stop-color="#6f86a6"/><stop offset="0.66" stop-color="{SKY_PALE}"/>'
            f'<stop offset="1" stop-color="{SKY_PALE}"/></linearGradient>')

def claw_paths(ps, spec, by_x=False):
    out = []
    for (u, ln, w, lean, bend) in spec:
        if by_x:
            i = min(range(len(ps)), key=lambda k: abs(ps[k][0] - u)); (x, y) = ps[i]; nx, ny = normals(ps)[i]
        else:
            (x, y), (nx, ny), _ = at(ps, u)
        x += nx * w * 0.5; y += ny * w * 0.5            # rooted inside the foam
        ang = math.degrees(math.atan2(-nx, ny)) + lean  # the outward normal as a P() angle
        out.append(talon(x, y, ang, ln, w, bend))
    return out

def great_wave():
    out = cr(OUTER, 14); und = cr(UNDER, 12)
    body = poly(list(reversed(out))) + " " + poly(und[1:], "L") + " L700,700 Z"
    s = flat(body, PRUSSIAN)
    # the barrel's face, pale, with a band following it (und runs tip -> trough; its
    # right hand points out of the body, so offsets into the body are negative)
    face = sub(und, 0.10, 1.0)
    s += flat(band(face, 0.0, 1.0, lambda u: 0, lambda u: -26 * ease(u, 0.12, 0.1)), PALE)
    s += flat(band(face, 0.05, 0.92, lambda u: -34, lambda u: -34 - 9 * ease(u, 0.2, 0.3)), BAND)
    for d0, a0, b0 in ((-56, 0.12, 0.80), (-68, 0.18, 0.70), (-80, 0.26, 0.60)):
        s += flat(band(face, a0, b0, lambda u, d0=d0: d0, lambda u, d0=d0: d0 - 3.2 * ease(u, 0.3, 0.3)), PALE)
    # the lighter bands, sweeping up the back and over into the hood
    s += flat(band(out, 0.10, 0.92, lambda u: 30, lambda u: 30 + 24 * ease(u, 0.25, 0.35)), BAND)
    s += flat(band(out, 0.30, 0.86, lambda u: 66, lambda u: 66 + 11 * ease(u, 0.3, 0.3)), PALE)
    # the foam: a cap over the crest (its inner edge cusped into the blue) and the
    # claws breaking off the lip -- outlined as one
    a, b = 0.03, 0.42
    cap = (poly(sub(out, a, b)) + teeth(out, a, b, lambda f: 14 + 16 * ease(f, 0.3, 0.55), lambda f: 5 + 7 * ease(f, 0.2, 0.6),
                                        (0, .09, .19, .27, .37, .46, .57, .67, .79, .9, 1), skew=0.72) + " Z")
    # ink on the silhouette only: round the crest, and under the hood -- where the
    # hood's underside turns into the barrel's face the line thins out and stops,
    # so the face runs on into the pale far wall as one surface
    s += f'<path d="{poly(out)}" fill="none" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
    lip = sub(und, 0.0, 0.34)
    w = lambda u: SW / 2 * (1 if u < 0.45 else max(0.0, 1 - (u - 0.45) / 0.55) ** 1.3)
    s += flat(band(lip, 0.0, 1.0, lambda u: -w(u), w), INK)
    claws = claw_paths(out, CLAWS)
    s += "".join(f'<path d="{d}" fill="{PRUSSIAN}" stroke="{PRUSSIAN}" stroke-width="18" stroke-linejoin="round"/>' for d in claws)
    return s + union([cap] + claws, FOAM, FSW)

# the foreground: two swells, left to right (right hand = down into them). The far
# one hides the card's foot and rises to a crest at the left edge; the near one
# rises the other way, to a crest under the barrel -- the two lock together.
SWELL = [(-150, 450), (-80, 420), (-20, 390), (20, 374), (60, 378), (100, 392), (160, 404), (240, 404), (320, 400),
         (400, 404), (480, 410), (560, 406), (700, 410)]
NEAR = [(-150, 488), (-40, 482), (60, 474), (170, 470), (280, 462), (360, 454), (426, 444), (468, 436), (508, 440),
        (600, 456), (700, 470)]

def swell(pts_, crests, stripes, lit=(14, 18), body=None):
    """A foreground swell: the body, a lit band under the top (thick under each
    crest), tapered striations, and foam on the crests only -- a small copy of the
    great wave's cap (a cream crescent whose inner edge breaks into swept teeth)
    with a claw or two curling forward off it; the troughs keep just the ink line
    (foam across every trough reads as a doily)."""
    top = cr(pts_, 16)
    s = inked(poly(top) + " L700,700 L-150,700 Z", body or PRUSSIAN)
    hump = lambda u: max(math.exp(-((u - c) / w) ** 2) for c, w, *_ in crests)
    s += flat(band(top, 0.0, 1.0, lambda u: 5, lambda u: 5 + lit[0] + lit[1] * hump(u)), BAND)
    for (a, b, d, t) in stripes:
        s += flat(band(top, a, b, lambda u, d=d: d, lambda u, d=d, t=t: d + t * ease(u, 0.45, 0.45)), PALE)
    foams = []
    for (a, b, c, thick, amp, stops, claws_) in crests:
        # thickness: a sine hump over a..b peaking at c (a fraction of the stretch),
        # floored so the ends finish blunt under the ink rather than as hairs
        def th(f, c=c, thick=thick):
            k = f / c if f < c else (1 - f) / (1 - c)
            return 1.5 + thick * math.sin(max(0, min(1, k)) * math.pi / 2) ** 1.4
        foams.append(poly(sub(top, a, b)) + teeth(top, a, b, lambda f, th=th, amp=amp, c=c: th(f) + amp * ease(f, 0.3, 0.3) * (th(f) - 3) / (th(c) - 3),
                                                   th, stops, skew=0.7) + " Z")
        foams += claw_paths(top, claws_, by_x=True)
    return s + union(foams, FOAM, FSW)

def foreground():
    far = swell(SWELL, ((0.14, 0.40, 0.42, 12, 14, (0, .3, .5, .68, .84, 1), ((10, 22, 14, -44, -80), (30, 28, 15, -30, -90))),),
                ((0.26, 0.52, 36, 8), (0.44, 0.78, 56, 7), (0.66, 1.0, 34, 8)))
    near = swell(NEAR, ((0.64, 0.80, 0.34, 11, 12, (0, .3, .52, .74, 1), ((448, 20, 13, -40, -80), (474, 24, 14, -26, -88))),),
                 ((0.10, 0.44, 30, 7), (0.50, 0.80, 36, 7)), lit=(10, 14), body="#2c5591")
    return far + near

def sea_back():
    """Behind the card: the inside of the barrel. Seen through the curl it is the
    wave's own face, not sky (as sky it read as a tan leaf pinned beside the card)."""
    und = cr(UNDER, 12)
    return _sky_defs(), f'<g transform="translate(0 {DROP})">' + flat(poly(und) + f" L300,700 L300,{und[0][1]:.1f} Z", HOLLOW) + "</g>"

DROP = 10   # the great wave sits this much lower than v1, inside the circle mask

def sea_front():
    s = f'<g transform="translate(0 {DROP})">' + great_wave() + "</g>"
    s += foreground()
    return "", s
