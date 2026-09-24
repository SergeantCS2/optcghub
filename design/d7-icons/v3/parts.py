#!/usr/bin/env python3
"""D7 v3 shared parts: the card back (our own emblem), the two letterings
(DON!! in the app's display face, ドン!! hand-drawn), the manga SFX stack, the
monochrome knockout, and the layer writer. Compositions import this.

Frame: the Play icon's 512 grid centred on (256,256). Adaptive layers live on
the 108 dp canvas: viewBox -128 -128 768 768. The mark (fg) must stay inside
r = 234.7 of (256,256) -- the 66 dp safe zone; bg may bleed to the canvas edge.
No filters, no <mask>, no fonts: cairosvg (the build's renderer) draws it all.
"""
import io, json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))   # the repo root
INK, WHITE = "#1E1A14", "#FFFFFF"
RED_FIELD, RED_EDGE, RED_LINE = "#B12329", "#671A1F", "#C73241"   # measured from the owner's reference back
SFX_RED = "#D8383A"                                                # the game's red, the SFX offset print

def P(a, r, cx, cy):
    """Point at angle a (degrees, 0 = up, clockwise) and radius r."""
    t = math.radians(a); return (cx + r * math.sin(t), cy - r * math.cos(t))

def pts(*ps):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in ps)

# =================================================================== lettering
# ドン!! -- the hand-drawn brush paths from v2, each glyph in a 100 x 120 box
KANA = {
    "do": ["M30 4 Q42 -2 56 2 L52 112 Q44 124 32 118 Z",
           "M50 40 Q72 46 94 62 Q96 76 86 82 Q68 70 48 62 Z",
           "M70 0 L82 -4 Q88 10 88 24 L78 28 Q76 14 70 0 Z",
           "M90 -8 L102 -12 Q108 2 108 16 L98 20 Q96 6 90 -8 Z"],
    "n": ["M4 22 Q16 10 26 12 Q40 24 48 40 Q42 52 32 52 Q20 36 4 22 Z",
          "M-2 100 Q56 90 94 10 Q102 8 104 14 Q84 112 10 126 Q-6 118 -2 100 Z"],
    "bang": ["M4 0 L32 0 L22 84 L12 84 Z", "M18 92 a11 11 0 1 1 -0.1 0 Z",
             "M44 0 L72 0 L62 84 L52 84 Z", "M58 92 a11 11 0 1 1 -0.1 0 Z"],
}

def kana(cx, cy, width, rot=-8):
    """ドン!! as (paths, transform) groups, centred on (cx, cy), about `width` px wide."""
    s = width / 400.0   # the three glyphs span ~400 units at scale 1
    return [(KANA["do"], f"translate({cx} {cy}) rotate({rot}) scale({s:.3f}) translate(-200 -60) translate(0 10) rotate(-4 50 60)"),
            (KANA["n"], f"translate({cx} {cy}) rotate({rot}) scale({s:.3f}) translate(-200 -60) translate(128 4)"),
            (KANA["bang"], f"translate({cx} {cy}) rotate({rot}) scale({s:.3f}) translate(-200 -60) translate(262 -8) rotate(6 36 50)")]

_FONT = None
def _font():
    global _FONT
    if _FONT is None:
        from fontTools.ttLib import TTFont
        _FONT = TTFont(os.path.join(ROOT, "assets", "fonts", "display.woff2"))   # Luckiest Guy, OFL; ships in the app
    return _FONT

def glyph_path(ch, px, x0, baseline):
    """One glyph of the display face as an SVG path, `px` tall per em, baked
    into icon pixels (so stroke widths stay in pixels)."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = _font(); gs = f.getGlyphSet(); g = f.getBestCmap()[ord(ch)]
    k = px / f["head"].unitsPerEm
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x0, baseline)))
    return pen.getCommands(), gs[g].width * k

def latin(cx, cy, cap, rot=-8, text="DON!!", bounce=(-3, 2, -2, 5, 7), rise=(0, -4, 2, -6, -8), track=-0.02):
    """DON!! in the app's display face, letters bounced like a manga SFX,
    centred on (cx, cy) with cap height about `cap` px."""
    px = cap / (1424 / 2048)             # Luckiest Guy's cap height is ~1424 of 2048 units
    x = 0.0; glyphs = []
    for i, ch in enumerate(text):
        d, adv = glyph_path(ch, px, x, 0)
        glyphs.append((d, x, adv, i)); x += adv * (1 + track) if ch != "!" else adv * 0.86
    total = x; out = []
    for d, gx, adv, i in glyphs:
        mid = gx + adv / 2 - total / 2
        out.append(([d], f"translate({cx} {cy}) rotate({rot}) translate({-total / 2:.1f} {cap / 2 + rise[i]:.1f}) "
                         f"rotate({bounce[i]} {gx + adv / 2:.1f} {-cap / 2:.1f})"))
    return out

def paths_svg(groups, fill="none", stroke="none", sw=0, dx=0, dy=0):
    s = (f'<g transform="translate({dx} {dy})" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" '
         'stroke-linejoin="round" stroke-linecap="round">')
    for paths, tf in groups:
        s += f'<g transform="{tf}">' + "".join(f'<path d="{d}"/>' for d in paths) + "</g>"
    return s + "</g>"

def sfx(groups, key=26, inline=13, offset=(9, 11), shadow=SFX_RED, ink=INK, light=WHITE):
    """Manga SFX stack: offset print, outer keyline, white inline, ink fill.
    Stroke widths are in the groups' own units (px for latin(); kana() is scaled,
    so its strokes shrink with it -- pass larger values for small kana)."""
    return (paths_svg(groups, shadow, shadow, key, *offset) + paths_svg(groups, ink, ink, key)
            + paths_svg(groups, "none", light, inline) + paths_svg(groups, ink))

# =================================================================== the card back (ours)
def rhumb_lines(x, y, w, h, clip_id, colour=RED_LINE, opacity=0.75, width=1.6):
    """The app's own chart motif: straight rhumb lines radiating from two
    compass points off the card -- a portolan chart, not the printed back's arcs."""
    s = f'<g clip-path="url(#{clip_id})" stroke="{colour}" stroke-opacity="{opacity}" stroke-width="{width}">'
    for (ox, oy) in ((x - w * 0.35, y + h * 0.18), (x + w * 1.3, y + h * 0.78)):
        for k in range(16):
            ex, ey = P(k * 22.5 + 5, (w + h) * 2, ox, oy)
            s += f'<line x1="{ox:.1f}" y1="{oy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}"/>'
    return s + "</g>"

def rose(cx, cy, R, colour=WHITE, field=RED_FIELD, inner_ring=True):
    """Our emblem: an 8-point compass rose in a plain double ring. Deliberately
    NOT the printed back's instrument dial -- no ring of tick marks, no single
    long needle, no hub donut."""
    s = f'<circle cx="{cx}" cy="{cy}" r="{R:.1f}" fill="none" stroke="{colour}" stroke-width="{R * .045:.1f}"/>'
    if inner_ring:
        s += f'<circle cx="{cx}" cy="{cy}" r="{R * .86:.1f}" fill="none" stroke="{colour}" stroke-width="{R * .018:.1f}"/>'
    # four short points first (under), then four long; each split filled / outlined
    for long_, (tip, half, ang0) in ((False, (R * .56, R * .13, 45)), (True, (R * .94, R * .16, 0))):
        for k in range(4):
            a = ang0 + 90 * k
            t = P(a, tip, cx, cy); l = P(a - 90, half, cx, cy); r = P(a + 90, half, cx, cy)
            s += f'<polygon points="{pts(t, l, (cx, cy))}" fill="{colour}"/>'
            s += (f'<polygon points="{pts(t, r, (cx, cy))}" fill="{field}" stroke="{colour}" '
                  f'stroke-width="{R * .03:.1f}" stroke-linejoin="round"/>')
    s += f'<circle cx="{cx}" cy="{cy}" r="{R * .07:.1f}" fill="{colour}"/>'
    return s

def back_own(cx, cy, w, h, rot=0, rx=None, border=None, emblem_y=0.40, emblem_r=0.36, uid="b"):
    """The card back, drawn our way: the printed back's red, maroon edge and a
    white round emblem centred high -- with our own rose and our own chart lines.
    (cx, cy) is the card centre; returns (defs, body)."""
    rx = rx if rx is not None else w * 0.055; border = border if border is not None else w * 0.035
    x, y = cx - w / 2, cy - h / 2
    ix, iy, iw, ih = x + border, y + border, w - 2 * border, h - 2 * border
    defs = f'<clipPath id="{uid}f"><rect x="{ix:.1f}" y="{iy:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="{max(rx - border, 2):.1f}"/></clipPath>'
    body = (f'<g transform="rotate({rot} {cx} {cy})">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="{RED_EDGE}"/>'
            f'<rect x="{ix:.1f}" y="{iy:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="{max(rx - border, 2):.1f}" fill="{RED_FIELD}"/>'
            + rhumb_lines(ix, iy, iw, ih, f"{uid}f")
            + rose(cx, y + h * emblem_y, w * emblem_r) + "</g>")
    return defs, body

# =================================================================== monochrome helpers
def _alpha(svg_body, defs=""):
    import cairosvg
    from PIL import Image
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-128 -128 768 768" width="768" height="768">'
           f'<defs>{defs}</defs>{svg_body}</svg>')
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).getchannel("A")

def knockout_clip(groups, halo=34, cid="ko"):
    """A clip path that removes a band around the lettering, so a one-colour
    layer keeps the word legible. cairosvg ignores <mask>, so this traces the
    haloed word's per-column top and bottom and cuts that band out as a hole
    wound against the frame."""
    a = _alpha(paths_svg(groups, "#000", "#000", halo)); px = a.load()
    top, bot = [], []
    for X in range(0, 768, 3):
        ys = [Y for Y in range(0, 768, 2) if px[X, Y] > 0]
        if ys:
            top.append((X - 128, min(ys) - 128)); bot.append((X - 128, max(ys) - 128))
    # the hole runs counter-clockwise against the clockwise frame, so the default
    # non-zero winding rule cuts it (cairosvg does not honour clip-rule)
    band = "M" + " L".join(f"{x},{y}" for x, y in bot) + " L" + " L".join(f"{x},{y}" for x, y in reversed(top)) + " Z"
    return (f'<clipPath id="{cid}"><path d="M-128 -128 H640 V640 H-128 Z {band}"/></clipPath>')

def word_bbox(groups, sw=8):
    x0, y0, x1, y1 = _alpha(paths_svg(groups, "#000", "#000", sw)).getbbox()
    return x0 - 128, y0 - 128, x1 - 128, y1 - 128

# =================================================================== the layer writer
HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{w}">'
NOTE = ('<!-- OP TCG Hub, icon draft "{name}" (D7, open). Original work: our own card back (compass rose, '
        'chart lines), and the word DON!! as a manga sound effect. No character, no publisher mark, no '
        'wordmark (landmines 26, 30; AGENDA A16). {layer} -->')

def write_set(out, slug, name, line, defs, bg, fg, mono_defs, mono, stat_groups, stat_sw=3):
    """Writes <slug>.svg (Play master), -bg, -fg, -mono, -stat and concepts.json."""
    os.makedirs(out, exist_ok=True)
    def w(path, vb, size, layer, d, body):
        with open(path, "w") as f:
            f.write(HEAD.format(vb=vb, w=size) + "\n" + NOTE.format(name=name, layer=layer) + "\n")
            f.write(f"<defs>{d}</defs>\n{body}\n</svg>\n")
    AD = "-128 -128 768 768"
    w(f"{out}/{slug}.svg", "0 0 512 512", 512, "Play master: full-bleed square; Play rounds the corners itself.", defs, bg + fg)
    w(f"{out}/{slug}-bg.svg", AD, 432, "Adaptive background layer, 108 dp.", defs, bg)
    w(f"{out}/{slug}-fg.svg", AD, 432, "Adaptive foreground layer, 108 dp; inside the 66 dp safe zone.", defs, fg)
    w(f"{out}/{slug}-mono.svg", AD, 432, "Monochrome layer for themed icons; the system tints it.", mono_defs, mono)
    x0, y0, x1, y1 = word_bbox(stat_groups, stat_sw)
    side = max(x1 - x0, y1 - y0) * 24 / 22; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w(f"{out}/{slug}-stat.svg", f"{cx - side / 2:.1f} {cy - side / 2:.1f} {side:.1f} {side:.1f}", 96,
      "Status-bar glyph: white on transparent; the system tints it.", "", paths_svg(stat_groups, WHITE, WHITE, stat_sw))
    path = f"{out}/concepts.json"
    cs = json.load(open(path)) if os.path.exists(path) else []
    cs = [c for c in cs if c["slug"] != slug] + [{"slug": slug, "name": name, "line": line}]
    json.dump(cs, open(path, "w"), indent=1)

# =================================================================== the white card back (the owner, v3 round 2)
# The owner: the white back, not red; not green either -- "the outline should match
# the outline of the don, but not the inside". Two readings, both drawn:
#   "ink": the card wears the word's own stack -- an ink border, the red offset print
#          behind it, an ink emblem, a white inside.
#   "red": a red border and a red emblem (the word's red), a thin ink keyline, a white inside.
PAPER_WHITE, CHART_GREY = "#FFFFFF", "#D8D2C6"
COLOURWAYS = {
    "ink": dict(edge=INK, emblem=INK, keyline=None, offset=(9, 11), offset_colour=SFX_RED),
    "red": dict(edge=SFX_RED, emblem=SFX_RED, keyline=INK, offset=None, offset_colour=None),
}

def back_white(cx, cy, w, h, rot=0, way="ink", rx=None, border=None, emblem_y=0.40, emblem_r=0.36,
               field=PAPER_WHITE, lines=None, inner_ring=False, uid="w"):
    """The card back in white, drawn our way (our rose, our rhumb lines), its
    outline taken from the word's outline. Returns (defs, body)."""
    cw = COLOURWAYS[way]
    rx = rx if rx is not None else w * 0.055; border = border if border is not None else w * 0.04
    x, y = cx - w / 2, cy - h / 2
    ix, iy, iw, ih = x + border, y + border, w - 2 * border, h - 2 * border
    irx = max(rx - border, 2)
    defs = f'<clipPath id="{uid}f"><rect x="{ix:.1f}" y="{iy:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="{irx:.1f}"/></clipPath>'
    body = f'<g transform="rotate({rot} {cx} {cy})">'
    if cw["offset"]:
        dx, dy = cw["offset"]
        body += f'<rect x="{x + dx:.1f}" y="{y + dy:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="{cw["offset_colour"]}"/>'
    if cw["keyline"]:
        k = w * 0.018
        body += f'<rect x="{x - k:.1f}" y="{y - k:.1f}" width="{w + 2 * k:.1f}" height="{h + 2 * k:.1f}" rx="{rx + k:.1f}" fill="{cw["keyline"]}"/>'
    body += (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="{cw["edge"]}"/>'
             f'<rect x="{ix:.1f}" y="{iy:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="{irx:.1f}" fill="{field}"/>'
             + (rhumb_lines(ix, iy, iw, ih, f"{uid}f", colour=lines, opacity=0.9, width=1.4) if lines else "")
             + rose(cx, y + h * emblem_y, w * emblem_r, colour=cw["emblem"], field=field, inner_ring=inner_ring) + "</g>")
    return defs, body
