#!/usr/bin/env python3
"""The feature graphic's scene: a beach, drawn in the icon's woodblock palette.

The owner, 24 Sept, on the first feature graphic (the icon's claw-crested swells, scaled up across the
bottom): "make this a beach, the wave just looks weird." So the water here is calm and has no claws.

From the top down:
- the icon's ichimonji sky: Prussian, glowing into buff just above the horizon
- a calm sea under an ink horizon, with a lighter band along its top and tapered woodblock striations
- the water shallowing to the shore
- the surf: a cream wash running onto the sand in scalloped lobes, broken into three reaches (a
  continuous row reads as a doily), and two thin streaks of foam further out
- the sand: a wet band under the surf, a receding wash line, a few ripples

Nothing from the franchise: no ship, no hat, no flag (landmines 26, 30; AGENDA A16). The helpers and the
palette are v4's (design/d7-icons/v4/wave.py). Like wave.py it uses no filter, mask, text or clip-rule.

  python3 design/play-listing/beach.py out.svg      # the scene alone, for a look
"""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "d7-icons", "v4"))
import wave as W
from wave import cr, poly, band, teeth, union, inked, flat, ease, sub, PRUSSIAN, BAND, PALE, FOAM, INK, SW, FSW, SKY_PALE

WIDTH, HEIGHT = 1024, 500
HORIZON = 340                      # the focal content (icon, name, subline) must end above this
SAND, WET, RIPPLE = "#dcb877", "#c49d5e", "#c29a5c"

# The waterline, travelling right to left so that its right hand points up, into the water (wave.py's
# convention). It sits lower on the right and runs past both edges.
SHORE = [(1110, 436), (980, 428), (860, 418), (760, 420), (640, 410), (520, 404), (400, 406), (280, 398),
         (160, 402), (40, 396), (-90, 400)]

def _sky():
    g = (f'<linearGradient id="bsky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{HORIZON}">'
         f'<stop offset="0" stop-color="{PRUSSIAN}"/><stop offset="0.86" stop-color="{PRUSSIAN}"/>'
         f'<stop offset="0.94" stop-color="#6f86a6"/><stop offset="1" stop-color="{SKY_PALE}"/></linearGradient>')
    return g, f'<rect x="0" y="0" width="{WIDTH}" height="{HORIZON + 2}" fill="url(#bsky)"/>'

def _streak(x0, x1, y, t, fill=PALE):
    """A tapered woodblock striation: flat along its bottom, swelling to t in the middle."""
    ps = [(x0 + (x1 - x0) * k / 24, y) for k in range(25)]          # left to right: its right hand points down
    return flat(band(ps, 0, 1, lambda u: -t * ease(u, 0.45, 0.45), lambda u: 0), fill)

def _sea():
    s = flat(f"M-20,{HORIZON} L{WIDTH + 20},{HORIZON} L{WIDTH + 20},470 L-20,470 Z", PRUSSIAN)
    s += flat(f"M-20,{HORIZON + 3} L{WIDTH + 20},{HORIZON + 3} L{WIDTH + 20},{HORIZON + 9} L-20,{HORIZON + 9} Z", BAND)
    for x0, x1, y, t in ((40, 360, 360, 4), (470, 930, 356, 3.5), (150, 620, 376, 5), (700, 1010, 372, 4)):
        s += _streak(x0, x1, y, t)
    for x0, x1, y, t in ((90, 300, 386, 3), (560, 760, 392, 2.6)):       # an incoming ripple's foam
        s += _streak(x0, x1, y, t, FOAM)
    shore = cr(SHORE, 12)
    # the shallows: the water lightens toward the sand
    s += flat(band(shore, 0, 1, lambda u: 0, lambda u: 16 + 5 * math.sin(u * 9)), BAND)
    s += flat(band(shore, 0, 1, lambda u: 0, lambda u: 7 + 2 * math.sin(u * 13 + 1)), PALE)
    s += f'<path d="M-20,{HORIZON} L{WIDTH + 20},{HORIZON}" stroke="{INK}" stroke-width="3"/>'
    return s

def _sand():
    shore = cr(SHORE, 12)
    s = flat(poly(shore) + f" L-90,{HEIGHT + 40} L1110,{HEIGHT + 40} Z", SAND)
    # the wet band just under the waterline (negative offsets: into the sand)
    s += flat(band(shore, 0, 1, lambda u: 0, lambda u: -(12 + 7 * (0.5 + 0.5 * math.sin(u * 7 + 0.6)))), WET)
    # a receding wash line, in two reaches
    for a, b in ((0.08, 0.40), (0.52, 0.86)):
        seg = sub(W.offset(shore, lambda u: -30), a, b)
        s += f'<path d="{poly(seg)}" fill="none" stroke="{FOAM}" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>'
    # ripples in the dry sand, few and short
    for x, y, w in ((110, 468, 44), (250, 484, 36), (420, 462, 40), (600, 488, 46), (770, 470, 38), (920, 486, 42), (980, 458, 30)):
        s += (f'<path d="M{x - w / 2:.0f},{y} Q{x},{y - 6} {x + w / 2:.0f},{y}" fill="none" stroke="{RIPPLE}" '
              f'stroke-width="3" stroke-linecap="round"/>')
    s += f'<path d="{poly(shore)}" fill="none" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
    return s

def _wash(shore, a, b, lobes, depth, back):
    """One reach of surf: a cream band whose back lies a few px into the water and whose leading edge
    runs onto the sand in scalloped lobes (|sin| lobes, cusped between them), tapering at both ends."""
    seg = sub(shore, a, b)
    lead = W.offset(seg, lambda u: -(1.5 + depth * abs(math.sin(u * math.pi * lobes)) ** 0.7) * ease(u, 0.1, 0.1))
    rear = W.offset(seg, lambda u: 1.5 + back * ease(u, 0.18, 0.18))
    return poly(lead) + " " + poly(list(reversed(rear)), "L") + " Z"

def _surf():
    shore = cr(SHORE, 12)
    return union([_wash(shore, 0.00, 0.31, 5, 10, 7), _wash(shore, 0.36, 0.66, 4, 9, 6), _wash(shore, 0.71, 1.00, 5, 11, 7)],
                 FOAM, FSW)

def scene():
    """The whole 1024 x 500 scene as an SVG element, full-bleed."""
    sd, sky = _sky()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}" '
            f'style="position:absolute;left:0;top:0"><defs>{sd}</defs>{sky}{_sea()}{_sand()}{_surf()}</svg>')

if __name__ == "__main__":
    open(sys.argv[1] if len(sys.argv) > 1 else "beach.svg", "w").write(scene())
