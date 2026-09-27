#!/usr/bin/env python3
"""Style v2, "Pull": the production style for the ads and the Play listing (the owner's pick, 27 Sept).

The grammar (CLAUDE.md, "Style v2: Pull"): a sentence-case headline with one accent word; one real device
(ads) or a frameless screen (listing) showing the app's real screen; one real UI piece lifted out as the
callout; the hero card in an aura made from its own pixels; the ground from the hero's own art, blurred.
No rays, no sparkles, no invented tables, no hands. Every price and date comes from capture.mjs's report.

The aura (flame_aura): the card's own edge colours and a ramp of its accent, rising from it in a shape set by
one knob, `flicker` (AURA2): 0 a smooth glow, 1 flame tongues. The lead is `between` (AURA_LEVEL), the owner's
"in-between". `--tune` renders every preset on three heroes side by side. AURA_MODE = "original" draws the
first pixel aura (AURA, pixel_aura), kept for the record.

  python3 design/marketing/style_pull.py [concept ...]   -> $ADS_OUT/pull/*.html
  python3 design/marketing/style_pull.py --tune          -> $ADS_OUT/pull-tune/*.html (the aura presets)
  node design/marketing/render.mjs --dir pull
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import directions as D                               # b64, face, page, art, crop_img, day, icon
import directions2 as P2                             # device, STATUS_ICONS, P5_CSS, p3_fonts, accents, WORDS
ADS = D.ADS

# ---------------------------------------------------------------- the aura
# The owner's pick (27 Sept, "we wanted this one"): v5's pixel aura exactly as it rendered in pull5pixel --
# the card's own scan, blurred, saturated, pushed upward by vertical noise and masked, with a halo of the card
# itself and an accent rim light. Its streaks keep the art's own tones (grey where the art is black and white);
# a recoloured variant was tried and was not what the owner wanted. "original" reproduces pull5pixel's numbers
# exactly; the other presets only turn the same knobs, for the tuning the owner asked for.
AURA = {
    "original": dict(blur=16, sat=2.2, freq="0.018 0.004", disp=190, bright=1.5, body=.95, spread=.18, rise=.32,
                     halo=.9, halo_blur=28, rim=.65),
    "softer":   dict(blur=18, sat=2.0, freq="0.018 0.004", disp=150, bright=1.35, body=.8, spread=.15, rise=.26,
                     halo=.75, halo_blur=30, rim=.5),
    "stronger": dict(blur=14, sat=2.4, freq="0.018 0.004", disp=230, bright=1.65, body=1.0, spread=.21, rise=.40,
                     halo=1.0, halo_blur=26, rim=.8),
}
AURA_DEFAULT = "original"

def pixel_aura(pid, w, accent, level=AURA_DEFAULT, seed=21):
    """sits in the card's own box (card-local px), behind the card; accent is the art's own (accent.mjs)"""
    a = AURA[level]; h = round(w * 838 / 600); src = D.art(pid)
    fid = f"pa{pid}{level}{seed}"
    return (f'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="{fid}" x="-50%" y="-60%" width="200%" height="220%">'
            f'<feGaussianBlur stdDeviation="{a["blur"]}"/>'
            f'<feColorMatrix type="saturate" values="{a["sat"]}" result="b"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency="{a["freq"]}" numOctaves="3" seed="{seed}" result="n"/>'
            f'<feDisplacementMap in="b" in2="n" scale="{a["disp"]}" xChannelSelector="R" yChannelSelector="G"/></filter></svg>'
            # the rising body: flame-displaced, masked to fade down the sides and below
            f'<div class="pa" style="left:{-w * a["spread"]:.0f}px;top:{-h * a["rise"]:.0f}px;width:{w * (1 + 2 * a["spread"]):.0f}px;height:{h * 1.4:.0f}px;'
            f'-webkit-mask-image:radial-gradient(ellipse 58% 62% at 50% 44%,#000 38%,rgba(0,0,0,.55) 62%,transparent 86%);mix-blend-mode:screen;opacity:{a["body"]}">'
            f'<img src="{src}" style="width:100%;height:100%;filter:url(#{fid}) brightness({a["bright"]})"></div>'
            # the halo: the card, scaled a little and softly blurred, so its own colours ring its edge
            f'<div class="pa" style="left:{-w * .07:.0f}px;top:{-h * .09:.0f}px;width:{w * 1.14:.0f}px;height:{h * 1.12:.0f}px;mix-blend-mode:screen;opacity:{a["halo"]}">'
            f'<img src="{src}" style="width:100%;height:100%;filter:blur({a["halo_blur"]}px) saturate(2) brightness(1.35)"></div>'
            # the seam: an accent rim light on the card's own border
            f'<div class="pa" style="left:-3px;top:-3px;width:{w + 6}px;height:{h + 6}px;border-radius:4.5%;'
            f'box-shadow:0 0 18px 4px {accent["bright"]},0 0 60px 10px color-mix(in srgb,{accent["bright"]} 45%,transparent);opacity:{a["rim"]}"></div>')

# ---------------------------------------------------------------- the refined aura (27 Sept, polish pass)
# The owner on the pixel aura: "I like this aura, but it needs refinement ... it looks cheap and AI like,
# needs to be more specific to the card / color matched / blended better." What the close-ups showed:
# - the rising streaks took the art's greys (Zoro's black-and-white SP rose as smoke, not light)
# - the enlarged, blurred copy of the card lit a soft rectangle round it (Luffy: a haze box)
# - colours from every part of the art smeared side by side (Sanji: green, orange, yellow bands)
# - the glow was even on all four sides, the bottom too, and the rim a uniform neon box-shadow
# - the ground (the art, blurred) was bright enough to wash the aura out
# The refinement, one coherent pass:
# - shape: real flame tongues. A white field hugs the card and climbs above it; fractal noise with long
#   vertical streaks is added and the sum thresholded, so the edge breaks into tongues that are tallest over
#   the top and quiet at the foot. A second, tighter threshold is the hot core inside the outer tongues.
# - colour: the card's own pixels, stretched upward and blurred, mixed with a ramp of the card's dominant
#   colour (accent.mjs): deep -> accent -> hot. The hues are the card's; the greys become its accent.
# - seam: the card's own edge colours, a few px out and softly blurred, instead of a neon rim.
# - ground: darker (see frame()), so the light has something to read against.
# Pass 3 (27 Sept): "not there yet ... it needs to be more consistent -- the aura looks to just have jagged
# pillars of flame, rather than a gentle aura. We need to find an in-between." The pillars came from the shape,
# not the colour: fine, strongly vertical noise through a hard threshold, so every gap between tongues dropped
# to nothing. The shape is now one knob, `flicker`: 0 is a smooth glow hugging the card, 1 is pass 2's flame
# tongues exactly, and everything the shape depends on (the noise's weight and scale, the threshold's
# hardness, the softening after it, the inner wisps) moves together along it. The colour and the seam, which
# the owner liked, are untouched.
AURA2 = {
    # flicker: 0 a smooth glow .. 1 pass 2's flame; rise: how far the aura climbs above the card (x its height)
    "gentle":  dict(flicker=.20, rise=.40),
    "between": dict(flicker=.45, rise=.44),
    "flame":   dict(flicker=1.0, rise=.48),      # pass 2, the "jagged pillars"
}
AURA_LEVEL = "flame"        # the owner, after "between": "I like the third", on the Luffy comparisons (27 Sept)

def _lerp(a, b, t):
    return a + (b - a) * t

def aura_params(level):
    """everything the aura's shape depends on, from its preset's flicker. At flicker 1 these are pass 2's own
    numbers; toward 0 the noise weighs less and is broader and rounder, the threshold softens, the edge is
    blurred more, and faint vertical wisps move inside the body instead of at its edge."""
    p = AURA2[level]; f = p["flicker"]
    k2, k3 = _lerp(1.3, 1.5, f), _lerp(.40, 1.15, f)
    outline = _lerp(.40, .4767, f)                 # where the edge sits in the blurred field, noise at its mean
    return dict(rise=p["rise"], field=_lerp(.085, .06, f), spread=_lerp(.17, .20, f),
                freq=f"{_lerp(.008, .017, f):.4f} {_lerp(.0036, .0055, f):.4f}", octaves=3 if f < .7 else 4,
                k=(k2, k3, -(outline * k2 + k3 * .5)), core=-(.75 * k2 + k3 * .5), sharp=_lerp(1.5, 1.9, f),
                post=_lerp(8.0, 2.4, f), op=_lerp(.92, .95, f), core_op=_lerp(.3, .7, f), wisp=_lerp(.22, 0, f),
                # the dome's vertical fade: with less noise to lift the light, the dome itself holds it up
                dome=(_lerp(.18, .40, f), _lerp(.75, .85, f), _lerp(.44, 1.0, f)),
                low=_lerp(.55, .35, f),
                # the body's ramp tops out near the accent itself (white-hot is kept for the core, at the card),
                # and the body leans on the ramp rather than the art's own greys, so it stays the card's colour
                top=_lerp(.18, .55, f), keep=_lerp(.26, .42, f),
                # above the card the light turns from the edge's own colours into the card's accent, deepening
                # toward the top, as a flame does: (opacity at a third of the way up, at the top)
                tint=(_lerp(.5, .2, f), _lerp(.85, .45, f)),
                # the aura is screened onto the ground, which pales every colour toward pastel on a grey ground
                # (Zoro's black-and-white art blurs to grey): the body's colour is made more vivid to meet it
                vivid=_lerp(1.4, 1.0, f))

AURA_MODE = "shaped"       # "original" draws pixel_aura() as the owner first picked it

def _hex(c):
    c = c.lstrip("#"); return [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]

def _vivid(rgb, k):
    """the same hue, its saturation raised by k (1 leaves it as it is)"""
    import colorsys
    h_, s_, v_ = colorsys.rgb_to_hsv(*rgb)
    return list(colorsys.hsv_to_rgb(h_, min(1.0, s_ * k + (.06 if k > 1 else 0)), v_))

def _mix(a, b, t):
    return [a[i] * (1 - t) + b[i] * t for i in range(3)]

def flame_aura(pid, w, accent, level=AURA_LEVEL, seed=7):
    """in the card's own box (card-local px), behind the card. Pass 2 (the owner: "too tall ... the top is just
    flat and cut off ... like the card is giving off a seamless aura"):
    - the colour starts as the card's own edge: its top and side slices are stretched outward, so just past the
      border the flame is the border's colour, and further out it becomes the card's ramp
    - a tight emission at the edge (the card, 2 % larger, lightly blurred) joins card and light without a line
    - headroom above the field, so every tongue fades out instead of meeting the box's edge"""
    a = aura_params(level); h = round(w * 838 / 600); src = D.art(pid)
    # the side margin holds the field's blur (3 sigma past the widened card), so no glow meets the box's side
    px, pt, pb = w * max(a["spread"], 3 * a["field"] + .05), h * a["rise"], h * .10
    T = pt * 1.45                                   # the card's top inside the box: the rise plus headroom
    W, H = w + 2 * px, h + T + pb
    deep, bright = _hex(accent["deep"]), _hex(accent["bright"])
    hot = _mix(bright, [1, 1, 1], .55)              # the core's white-hot, at the card (from the accent as read)
    bright = _vivid(bright, a["vivid"])             # the body's colour: the accent, as vivid as the screen needs
    top = _mix(bright, [1, 1, 1], a["top"])         # the body's brightest: the accent, lifted a little
    low = _mix(deep, bright, a["low"])              # the art's blacks rise as a deep flame, never as smoke
    tables = ["{:.3f} {:.3f} {:.3f} {:.3f}".format(low[i], bright[i], bright[i], top[i]) for i in range(3)]
    hot_hex = "#" + "".join(f"{round(v * 255):02x}" for v in hot)
    k2, k3, k4 = a["k"]; F = w * a["field"]; e = w * .045
    u = f"{pid}{level}{seed}"
    def ramp(fid, blur, keep):
        return (f'<filter id="{fid}" filterUnits="userSpaceOnUse" x="0" y="0" width="{W:.0f}" height="{H:.0f}" color-interpolation-filters="sRGB">'
                f'<feGaussianBlur stdDeviation="{blur:.1f}" result="b"/>'
                f'<feColorMatrix in="b" type="saturate" values="1.6" result="s"/>'
                f'<feColorMatrix in="b" type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/>'
                f'<feComponentTransfer result="r"><feFuncR type="table" tableValues="{tables[0]}"/><feFuncG type="table" tableValues="{tables[1]}"/>'
                f'<feFuncB type="table" tableValues="{tables[2]}"/></feComponentTransfer>'
                f'<feComposite in="r" in2="s" operator="arithmetic" k2="{1 - keep:.2f}" k3="{keep + .04:.2f}"/></filter>')
    def flame(fid, k4v):
        # the outline: the field plus noise, thresholded and softened; then the wisps: the body's alpha times
        # (1 - wisp + wisp x a second, finer vertical noise), so light moves inside it without breaking its edge
        return (f'<filter id="{fid}" filterUnits="userSpaceOnUse" x="0" y="0" width="{W:.0f}" height="{H:.0f}" color-interpolation-filters="sRGB">'
                f'<feGaussianBlur in="SourceGraphic" stdDeviation="{F:.1f}" result="f"/>'
                f'<feTurbulence type="fractalNoise" baseFrequency="{a["freq"]}" numOctaves="{a["octaves"]}" seed="{seed}" result="n"/>'
                f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0" result="na"/>'
                f'<feComposite in="f" in2="na" operator="arithmetic" k2="{k2}" k3="{k3}" k4="{k4v}"/>'
                f'<feComponentTransfer result="t"><feFuncA type="linear" slope="{a["sharp"]}"/></feComponentTransfer>'
                f'<feTurbulence type="fractalNoise" baseFrequency="0.028 0.006" numOctaves="2" seed="{seed + 3}" result="n2"/>'
                f'<feColorMatrix in="n2" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0" result="w"/>'
                f'<feComposite in="t" in2="w" operator="arithmetic" k1="{a["wisp"]:.3f}" k2="{1 - a["wisp"]:.3f}"/>'
                f'<feGaussianBlur stdDeviation="{a["post"]:.1f}"/></filter>')
    # the field: the card, widened at the sides, and a dome over the top that fades to nothing before the box ends
    field = (f'<rect x="{px - e:.0f}" y="{T - e * .5:.0f}" width="{w + 2 * e:.0f}" height="{h * .9:.0f}" rx="{w * .06:.0f}" fill="#fff"/>'
             f'<ellipse cx="{px + w / 2:.0f}" cy="{T + h * .2:.0f}" rx="{w * .55:.0f}" ry="{pt * .92 + h * .2:.0f}" fill="url(#g{u})"/>')
    dm, dmo, de = a["dome"]
    tm, tt = a["tint"]
    tip = "#" + "".join(f"{round(v * 255):02x}" for v in _mix(deep, bright, .55))
    body = "#" + "".join(f"{round(v * 255):02x}" for v in bright)
    tint = (f'<linearGradient id="t{u}" gradientUnits="userSpaceOnUse" x1="0" y1="{T:.0f}" x2="0" y2="{T - pt * 1.1:.0f}">'
            f'<stop offset="0" stop-color="{body}" stop-opacity="0"/>'
            f'<stop offset=".33" stop-color="{body}" stop-opacity="{tm:.2f}"/>'
            f'<stop offset="1" stop-color="{tip}" stop-opacity="{tt:.2f}"/></linearGradient>')
    defs = (tint + f'<linearGradient id="g{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
            f'<stop offset="{dm:.2f}" stop-color="#fff" stop-opacity="{dmo:.2f}"/><stop offset="{de:.2f}" stop-color="#fff"/></linearGradient>'
            f'<linearGradient id="sf{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".75"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>'
            f'<mask id="ms{u}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="{W:.0f}" height="{H:.0f}">'
            f'<rect x="0" y="{T - h * .06:.0f}" width="{W:.0f}" height="{h * 1.14:.0f}" fill="url(#sf{u})"/></mask>'
            f'<mask id="mo{u}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="{W:.0f}" height="{H:.0f}"><g filter="url(#fo{u})">{field}</g></mask>'
            f'<mask id="mc{u}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="{W:.0f}" height="{H:.0f}"><g filter="url(#fc{u})">{field}</g></mask>'
            + ramp(f"c{u}", w * .035, a["keep"]) + ramp(f"e{u}", w * .012, .6) + flame(f"fo{u}", k4) + flame(f"fc{u}", a["core"]))
    full = f'<image href="{src}" width="600" height="838" preserveAspectRatio="none"/>'
    # the card's own edges, stretched outward: the top slice up into the flame, the side slices out to the sides
    colour = (f'<g filter="url(#c{u})">'
              f'<svg x="{px - w * .1:.0f}" y="{T - pt * 1.35:.0f}" width="{w * 1.2:.0f}" height="{pt * 1.35 + h * .08:.0f}" viewBox="0 0 600 110" preserveAspectRatio="none">{full}</svg>'
              f'<svg x="0" y="{T:.0f}" width="{px + w * .06:.0f}" height="{h:.0f}" viewBox="0 0 70 838" preserveAspectRatio="none">{full}</svg>'
              f'<svg x="{px + w * .94:.0f}" y="{T:.0f}" width="{px + w * .06:.0f}" height="{h:.0f}" viewBox="530 0 70 838" preserveAspectRatio="none">{full}</svg>'
              f'<image href="{src}" x="{px:.0f}" y="{T:.0f}" width="{w:.0f}" height="{h:.0f}" preserveAspectRatio="none"/></g>')
    emit = (f'<g mask="url(#ms{u})">'
            f'<image href="{src}" x="{px - w * .03:.0f}" y="{T - h * .025:.0f}" width="{w * 1.06:.0f}" height="{h * 1.05:.0f}" preserveAspectRatio="none" filter="url(#c{u})" opacity=".8"/>'
            f'<image href="{src}" x="{px - w * .01:.0f}" y="{T - h * .008:.0f}" width="{w * 1.02:.0f}" height="{h * 1.016:.0f}" preserveAspectRatio="none" filter="url(#e{u})" opacity=".95"/></g>')
    return (f'<svg class="abs" style="left:{-px:.0f}px;top:{-T:.0f}px;width:{W:.0f}px;height:{H:.0f}px;overflow:visible;pointer-events:none;mix-blend-mode:screen" '
            f'viewBox="0 0 {W:.0f} {H:.0f}" aria-hidden="true"><defs>{defs}</defs>'
            f'<g mask="url(#mo{u})" opacity="{a["op"]}">{colour}<rect width="{W:.0f}" height="{T:.0f}" fill="url(#t{u})"/></g>'
            f'<g mask="url(#mc{u})" opacity="{a["core_op"]}"><rect width="{W:.0f}" height="{H:.0f}" fill="{hot_hex}"/></g>'
            f'{emit}</svg>')

# ---------------------------------------------------------------- the frame
sys.path.insert(0, HERE)
import copy_assets as CA                             # the ad text's rules, applied to the image captions too

def check_caption(html, footnote=False):
    """an image's words obey the ad text's rules (no price or multiple, no 'no ads', no affiliation, no
    superlative, no '!!', no capitals); the length limits are the ad text's own and do not apply. A card
    number (EB04-007) is not a word in capitals. A footnote may name the price source ("TCGplayer market
    prices, <day>"): crediting the data is the app's own honesty rule, not a claim of affiliation."""
    import re
    t = re.sub(r"<[^>]+>", " ", html).replace("&rsquo;", "'")
    t = re.sub(r"\b[A-Z]{1,3}\d{0,2}-\d{3}\b", " ", t)
    if footnote:
        t = re.sub(r"TCGplayer market prices", " ", t)
    out = [why for why, rx in CA.RULES if rx.search(t)]
    out += [f"capitals: {w}" for w in re.findall(r"[A-Za-z]{2,}", t) if w.isupper() and w not in CA.ACRONYMS]
    return out

def report():
    R = json.load(open(os.path.join(ADS, "report.json")))
    return R, {s["name"]: s for s in R["steps"]}

HEROES = json.load(open(os.path.join(HERE, "heroes.json")))
SIZES = {"portrait": (1200, 1500), "square": (1200, 1200), "landscape": (1200, 628)}
CALLOUT_H = {"portrait": 290, "square": 220, "landscape": 132}
SOLO = {"portrait": (560, 390, 500, 7), "square": (660, 270, 400, 7)}   # a phone concept with one hero card
OPEN_W = 1966                                        # the open Fold's shot, 749 CSS px at 2.625

GROUND_CSS = (".ground{filter:blur(90px) saturate(1.45) brightness(.44)}"
              ".shade{background:radial-gradient(ellipse 80% 65% at 62% 42%,rgba(6,7,7,.05) 0%,rgba(6,7,7,.5) 60%,rgba(6,7,7,.94) 100%)}")

def accent_of(pid):
    return P2.accents().get(str(pid), {"deep": "#4c1c23", "bright": "#ff6e83"})

def card(pid, x, y, w, tilt, extra=""):
    return f'<div class="card safe" style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;transform:rotate({tilt}deg);{extra}"><img src="{D.art(pid)}"></div>'

def aura_box(pid, x, y, w, tilt, accent, level):
    h = round(w * 838 / 600)
    inner = pixel_aura(pid, w, accent, level if level in AURA else AURA_DEFAULT) if AURA_MODE == "original" \
        else flame_aura(pid, w, accent, level if level in AURA2 else AURA_LEVEL)
    return (f'<div class="abs" style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h}px;transform:rotate({tilt}deg)">{inner}</div>')

# where each piece goes, per ratio. screen: the device's box (x, y, width), its height from its kind; hero: the
# hero card (x, y, width, tilt); callout: (x, y, width); the headline's size and the sub's box
LAYOUT = {
    "portrait":  dict(h1=88, head=(64, 64, 760), sub=(64, 262, 600, 28), phone=(64, 880, 440), fold=(64, 760, 640),
                      hero=(690, 440, 420, 7), hero_fold=(720, 380, 400, 8), callout=(576, 1200, 560), callout_fold=(600, 1230, 536)),
    "square":    dict(h1=80, head=(64, 64, 720), sub=(64, 250, 520, 26), phone=(64, 560, 380), fold=(64, 470, 600),
                      hero=(720, 300, 360, 7), hero_fold=(760, 300, 330, 8), callout=(520, 900, 616), callout_fold=(560, 930, 576)),
    "landscape": dict(h1=56, head=(56, 104, 580), sub=(56, 240, 520, 22), phone=(700, 64, 250), fold=(640, 96, 400),
                      hero=(935, 160, 210, 7), hero_fold=(965, 165, 175, 8), callout=(56, 352, 440), callout_fold=(56, 352, 440)),
}

def frame(concept, ratio, level=AURA_DEFAULT):
    R, S = report()
    c = CONCEPTS[concept](R, S)
    L = LAYOUT[ratio]; W, H = SIZES[ratio]
    fold = c["screen"][0] == "fold"
    hero = c["hero"]; ac = accent_of(hero)
    css = P2.p3_fonts() + P2.P5_CSS.replace("var(--accent)", ac["bright"]) + GROUND_CSS
    bad = check_caption(c["head"] + " " + c["sub"]) + check_caption(c["foot"], footnote=True)
    assert not bad, (concept, bad)
    brand_pos = (f'left:{L["head"][0]}px;top:34px' if ratio == "landscape" else f'right:{L["head"][0]}px;top:{L["head"][1] + 10}px')
    body = [f'<img class="ground" src="{D.art(hero)}" style="left:-160px;top:-220px;width:1600px">', '<div class="shade"></div>',
            f'<div class="abs brand ov safe" style="{brand_pos}"><img src="{D.icon()}"><b>OP TCG Hub</b></div>']
    hx, hy, hw = L["head"]
    body.append(f'<h1 class="abs ov txt safe" style="left:{hx}px;top:{hy}px;width:{hw}px;font-size:{L["h1"]}px">{c["head"]}</h1>')
    sx, sy, sw, sf = L["sub"]
    body.append(f'<div class="abs sub ov txt safe" style="left:{sx}px;top:{sy}px;width:{sw}px;font-size:{sf}px">{c["sub"]}</div>')
    # the device and the app's real screen
    kind, shot, crop, shot_w = c["screen"]
    dx, dy, dw = L["fold" if fold else "phone"]
    dh = round((dw - 18) * (1.08 if fold else 19.5 / 9)) + 18
    body.append(P2.device(dx, dy, dw, dh, shot, crop, None, shot_w, tilt=-2))
    # the hero, its aura, and any cards behind it (offsets and widths relative to the hero's width)
    cx, cy, cw, ct = L["hero_fold" if fold else "hero"]
    if not fold and not c.get("behind") and ratio in SOLO:
        cx, cy, cw, ct = SOLO[ratio]
    body.append(aura_box(hero, cx, cy, cw, ct, ac, level))
    for pid, ox, oy, k, t in c.get("behind", []):
        body.append(card(pid, cx + ox * cw, cy + oy * cw, cw * k, t))
    body.append(card(hero, cx, cy, cw, ct, "box-shadow:0 34px 44px -20px rgba(0,0,0,.7)"))
    # the callout: one real piece of the app, lifted out -- no taller than CALLOUT_H, its width shrunk to fit;
    # portrait and square pin it bottom right with the footnote under it, landscape puts it under the subline
    kx, ky, kw = L["callout_fold" if fold else "callout"]
    cshot, ccrop, cshot_w = c["callout"]
    cimg, ch = D.crop_img(cshot, ccrop, kw, cshot_w)
    if ch > CALLOUT_H[ratio]:
        kw = round(kw * CALLOUT_H[ratio] / ch); cimg, ch = D.crop_img(cshot, ccrop, kw, cshot_w)
    if ratio != "landscape":
        kx, ky = W - 64 - kw, H - 110 - ch
    body.append(f'<div class="callout ov safe" style="left:{kx}px;top:{ky}px;width:{kw}px;height:{ch}px">{cimg}</div>')
    if ratio == "landscape":
        fx, fy, fwid = 56, H - 50, 600
    else:
        fx, fy, fwid = kx, H - 90, max(kw, 460)
        fx = min(fx, W - 64 - fwid)
    body.append(f'<div class="abs foot ov txt safe" style="left:{fx}px;top:{fy}px;width:{fwid}px">{c["foot"]}</div>')
    return (f"<!doctype html><html><head><meta charset=utf-8><title>{concept}-{ratio}</title><style>"
            f"*{{box-sizing:border-box;margin:0}}html,body{{width:{W}px;height:{H}px;overflow:hidden}}body{{position:relative}}"
            f".abs{{position:absolute}}{css}</style></head><body>{''.join(body)}</body></html>")

# ---------------------------------------------------------------- the concepts, as data
def _when(R):
    return D.day(R["source"])

def c_printing(R, S):
    ps = {p["id"]: p for p in R["hero"]["printings"]}
    dear, mid, low = sorted(ps, key=lambda i: -(ps[i]["market"] or 0))
    hero = ps[dear]; count = S["picker"]["why"].split()[0]
    o = next(o for o in S["picker"]["options"] if o["price"] == hero["shown"])
    ty = S["picker"]["rects"]["title"]["y"]
    return dict(hero=dear, behind=[(low, -.45, .19, .71, -13), (mid, -.24, .10, .76, -3)],
                head=f'Same {hero["name"].split()[-1]}.<br><em>{P2.WORDS.get(len(ps), len(ps))}</em> prices.',
                sub=f'{hero["num"]} has {count} printings. The scanner shows each one, and asks which you hold.',
                screen=("phone", "picker", (0, ty - 40, 411, 900), 1079),
                callout=("picker", (12, o["top"] - 4, 387, o["bottom"] - o["top"] + 8), 1079),
                foot=f"TCGplayer market prices, {_when(R)}.")

def c_value(R, S):
    t = S["open-home-tall"]["rects"]; hr = S["home"]["rects"]["hero"]
    return dict(hero=HEROES["value"]["ids"][0],
                head="Your binder,<br>valued <em>nightly</em>.",
                sub="Every card at the market price of the printing you own, totalled.",
                screen=("fold", "open-home-tall", (0, t["hero"]["y"] - 70, 749, 1100), OPEN_W),
                callout=("home", (hr["x"] - 4, hr["y"] - 4, hr["w"] + 8, hr["h"] + 8), 1079),
                foot=f"A sample collection. TCGplayer market prices, {_when(R)}.")

def c_binder(R, S):
    t = S["open-home-tall"]["rects"]["top"]
    return dict(hero=HEROES["binder"]["ids"][0],
                head="Every card,<br><em>priced</em>.",
                sub="Scan with no cap. Each card at the price of the printing you own.",
                screen=("fold", "open-collection", (0, 40, 749, 790), OPEN_W),
                callout=("open-home-tall", (t["x"] - 4, t["y"] - 4, t["w"] + 8, t["h"] + 8), OPEN_W),
                foot=f"A sample collection. TCGplayer market prices, {_when(R)}.")

def c_offline(R, S):
    p = S["offline"]["rects"]["pill"]; hr = S["offline"]["rects"]["hero"]
    top = p["y"] - 12
    return dict(hero=HEROES["offline"]["ids"][0],
                head="Works with<br><em>no signal</em>.",
                sub="Scan, value and save at the card show, even in airplane mode. No account.",
                screen=("phone", "offline", (0, 40, 411, 900), 1079),
                callout=("offline", (hr["x"], p["y"] - 14, hr["w"], p["h"] + 28), 1079),
                foot="A sample collection, shown as the phone shows it offline.")

def c_deck(R, S):
    r = S["deck"]["rects"]["legal"]
    return dict(hero=HEROES["deck"]["ids"][0],
                head="Built to<br><em>the rules</em>.",
                sub="Leader colour, fifty cards, four of a number: checked as you build.",
                screen=("phone", "deck", (0, 40, 411, 900), 1079),
                callout=("deck", (r["x"] - 6, r["y"] - 6, r["w"] + 12, r["h"] + 12), 1079),
                foot=f"A sample deck. TCGplayer market prices, {_when(R)}.")

def c_trade(R, S):
    get, give = HEROES["trade"]["ids"]; v = S["trade"]["rects"]["verdict"]
    return dict(hero=get, behind=[(give, -.42, .14, .82, -10)],
                head="Trade at<br><em>the table</em>.",
                sub="Both sides valued the same way, at today&rsquo;s market.",
                screen=("phone", "trade", (0, 40, 411, 900), 1079),
                callout=("trade", (v["x"] - 4, v["y"] - 4, v["w"] + 8, 222), 1079),
                foot=f"A sample trade. TCGplayer market prices, {_when(R)}.")

CONCEPTS = {"printing": c_printing, "value": c_value, "binder": c_binder, "offline": c_offline, "deck": c_deck, "trade": c_trade}

if __name__ == "__main__":
    args = sys.argv[1:]
    if "--tune" in args:
        out = os.path.join(ADS, "pull-tune"); os.makedirs(out, exist_ok=True)
        presets = AURA if AURA_MODE == "original" else AURA2
        for level in presets:
            for concept in ("printing", "value", "deck"):
                open(os.path.join(out, f"{concept}-{level}-portrait.html"), "w").write(frame(concept, "portrait", level))
        print(f"style_pull: the aura presets ({', '.join(presets)}) on three heroes written to {out}")
        sys.exit(0)
    out = os.path.join(ADS, "pull"); os.makedirs(out, exist_ok=True)
    n = 0
    for name in CONCEPTS:
        if args and name not in args:
            continue
        for ratio in SIZES:
            open(os.path.join(out, f"{name}-{ratio}.html"), "w").write(frame(name, ratio)); n += 1
    print(f"style_pull: {n} compositions written to {out}")
