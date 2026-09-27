#!/usr/bin/env python3
"""Style v2, "Pull": the production style for the ads and the Play listing (the owner's pick, 27 Sept).

The grammar (CLAUDE.md, "Style v2: Pull"): a sentence-case headline with one accent word; one real device
(ads) or a frameless screen (listing) showing the app's real screen; one real UI piece lifted out as the
callout; the hero card in an aura made from its own pixels; the ground from the hero's own art, blurred.
No rays, no sparkles, no invented tables, no hands. Every price and date comes from capture.mjs's report.

The aura: the owner's pick, v5's pixel aura exactly as it was (see AURA). Every knob is in AURA; `--tune`
renders the lead frame at each preset side by side.

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

def accent_of(pid):
    return P2.accents().get(str(pid), {"deep": "#4c1c23", "bright": "#ff6e83"})

def card(pid, x, y, w, tilt, extra=""):
    return f'<div class="card safe" style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;transform:rotate({tilt}deg);{extra}"><img src="{D.art(pid)}"></div>'

def aura_box(pid, x, y, w, tilt, accent, level):
    h = round(w * 838 / 600)
    return (f'<div class="abs" style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h}px;transform:rotate({tilt}deg)">'
            f'{pixel_aura(pid, w, accent, level)}</div>')

# where each piece goes, per ratio. screen: the device's box (x, y, width), its height from its kind; hero: the
# hero card (x, y, width, tilt); callout: (x, y, width); the headline's size and the sub's box
LAYOUT = {
    "portrait":  dict(h1=88, head=(64, 64, 760), sub=(64, 262, 600, 28), phone=(64, 880, 440), fold=(64, 760, 640),
                      hero=(690, 440, 420, 7), hero_fold=(720, 380, 400, 8), callout=(576, 1200, 560), callout_fold=(600, 1230, 536)),
    "square":    dict(h1=80, head=(64, 64, 720), sub=(64, 250, 520, 26), phone=(64, 560, 380), fold=(64, 470, 600),
                      hero=(720, 300, 360, 7), hero_fold=(760, 300, 330, 8), callout=(520, 900, 616), callout_fold=(560, 930, 576)),
    "landscape": dict(h1=56, head=(56, 104, 580), sub=(56, 240, 520, 22), phone=(700, 64, 250), fold=(640, 96, 400),
                      hero=(930, 104, 220, 7), hero_fold=(960, 70, 190, 8), callout=(56, 352, 440), callout_fold=(56, 352, 440)),
}

def frame(concept, ratio, level=AURA_DEFAULT):
    R, S = report()
    c = CONCEPTS[concept](R, S)
    L = LAYOUT[ratio]; W, H = SIZES[ratio]
    fold = c["screen"][0] == "fold"
    hero = c["hero"]; ac = accent_of(hero)
    css = P2.p3_fonts() + P2.P5_CSS.replace("var(--accent)", ac["bright"])
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
    body.append(card(hero, cx, cy, cw, ct))
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
        for level in AURA:
            open(os.path.join(out, f"printing-{level}-portrait.html"), "w").write(frame("printing", "portrait", level))
        print(f"style_pull: the aura presets ({', '.join(AURA)}) written to {out}")
        sys.exit(0)
    out = os.path.join(ADS, "pull"); os.makedirs(out, exist_ok=True)
    n = 0
    for name in CONCEPTS:
        if args and name not in args:
            continue
        for ratio in SIZES:
            open(os.path.join(out, f"{name}-{ratio}.html"), "w").write(frame(name, ratio)); n += 1
    print(f"style_pull: {n} compositions written to {out}")
