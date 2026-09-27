#!/usr/bin/env python3
"""Four premium directions, one sample pair each, for the owner to choose between (27 Sept).

The owner: "more premium in some way, but currently I do not know how ... something fresh." The playbook
for a new identity says to show two or three substantially different directions built from the product,
not colour swaps of one template, and to get a choice before committing. So each direction renders the
same two pieces of real content:
  printing (4:5)  OP01-120's three printings and their prices: the product's sharpest truth
  value    (1:1)  Home's total and its month: how the app itself looks inside the style

  vault   a dark gallery. One card lit like an object in a case, auction-lot labels, a high-contrast serif,
          a great deal of black. Premium through restraint.
  wano    the brand's own woodblock roots, refined: indigo, gold leaf, a fine seigaiha, a vermilion seal,
          a mincho serif. Premium through craft and material.
  guide   an editorial price guide: paper, ink, a soft serif, figures set like a magazine's, a red pen's
          circle on the number that matters. Premium through trust.
  launch  a product launch: near-black studio light, the cards floating in depth with a foil sheen, a
          big tight sans, figures set like a spec sheet. Premium through polish (and the easiest to
          tip into the look every app uses, so it is kept spare).

The owner asked for rough drafts of all four, to answer by looking (27 Sept): drafts, not finished work.

Typefaces are OFL, from npm's @fontsource packages, into $ADS_OUT/fonts (fetch_fonts.sh); none is
committed until a direction is chosen. Prices come from capture.mjs's report.json, never typed here.

  bash design/marketing/fetch_fonts.sh && python3 design/marketing/directions.py
  node design/marketing/render.mjs --dir directions
"""
import base64, json, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ADS = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")
SHOTS, ART, FONTS, OUT = (os.path.join(ADS, d) for d in ("shots", "art", "fonts", "directions"))
DPR, SHOT_W = 2.625, 1079

def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

def face(family, file, weight=400, style="normal"):
    return f"@font-face{{font-family:'{family}';src:url({b64(os.path.join(FONTS, file), 'font/woff2')});font-weight:{weight};font-style:{style}}}"

def page(ratio, css, body, title):
    w, h = {"portrait": (1200, 1500), "square": (1200, 1200)}[ratio]
    return (f"<!doctype html><html><head><meta charset=utf-8><title>{title}</title><style>"
            f"*{{box-sizing:border-box;margin:0}}html,body{{width:{w}px;height:{h}px;overflow:hidden}}body{{position:relative}}"
            f".abs{{position:absolute}}{css}</style></head><body>{body}</body></html>")

GRAIN = ('<svg class="abs" style="inset:0;width:100%;height:100%;opacity:{o};mix-blend-mode:{m};pointer-events:none" aria-hidden="true">'
         '<filter id="g{k}"><feTurbulence type="fractalNoise" baseFrequency="{f}" numOctaves="2" stitchTiles="stitch"/>'
         '<feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g{k})"/></svg>')

def grain(o=.08, m="overlay", f=.85, k="0"):
    return GRAIN.format(o=o, m=m, f=f, k=k)

def art(pid):
    return b64(os.path.join(ART, f"{pid}.png"), "image/png")

def crop_img(shot, crop, w):
    """a real screen's crop (CSS px), w px wide: the img's style inside an overflow-hidden box"""
    cx, cy, cw, ch = crop
    k = w / (cw * DPR)
    return (f'<img src="{b64(os.path.join(SHOTS, shot + ".png"), "image/png")}" style="position:absolute;width:{SHOT_W * k:.1f}px;'
            f'left:{-cx * DPR * k:.1f}px;top:{-cy * DPR * k:.1f}px">'), round(ch * DPR * k)

def day(iso):
    import datetime
    d = datetime.date.fromisoformat(iso[:10])
    return f"{d.day} {d.strftime('%b')} {d.year}"

def data():
    R = json.load(open(os.path.join(ADS, "report.json")))
    S = {s["name"]: s for s in R["steps"]}
    ps = {p["id"]: p for p in R["hero"]["printings"]}
    labels = {}
    for o in S["picker"]["options"]:
        for p in ps.values():
            if o["price"] == p["shown"] and p["id"] not in labels:
                labels[p["id"]] = o["label"].split(" · ")[-1]
    # the picker's own line: "7 printings share OP01-120, $3.34 to $3,998.74 -- 1197x apart."
    why = S["picker"]["why"].split(". Guessing")[0]
    h = S["home"]["rects"]
    home_crop = (0, h["hero"]["y"] - 12, 411, h["ranges"]["y"] + h["ranges"]["h"] + 14 - (h["hero"]["y"] - 12))
    return R, ps, labels, why, home_crop, day(R["source"])

ICON = None
def icon():
    global ICON
    if ICON is None:
        ICON = "data:image/svg+xml;base64," + base64.b64encode(open(os.path.join(REPO, "assets", "icon.svg"), "rb").read()).decode()
    return ICON

# the printings, dearest in the middle: the two parallels look almost alike, and one is 46 times the other
ORDER = (454665, 454666, 454664)

# ================================================================ vault
def vault(ratio):
    R, ps, labels, why, home_crop, when = data()
    css = "".join([face("Cormorant", "cormorant-garamond-latin-600-normal.woff2", 600), face("Cormorant", "cormorant-garamond-latin-500-italic.woff2", 500, "italic"),
                   face("Inter", "inter-latin-500-normal.woff2", 500), face("Inter", "inter-latin-600-normal.woff2", 600), face("Inter", "inter-latin-700-normal.woff2", 700)]) + """
body{background:radial-gradient(ellipse 70% 52% at 50% 44%,#2a2246 0%,#15112a 48%,#08070f 100%);font-family:Inter,sans-serif;color:#efe6d6}
.eyebrow{font:600 20px/1 Inter;letter-spacing:.34em;text-transform:uppercase;color:#cdb07a}
h1{font:600 88px/1.02 Cormorant;letter-spacing:-.005em;color:#f3ebdc}
h1 i{font-style:italic;font-weight:500;color:#d8bb82}
.rule{height:1px;background:linear-gradient(90deg,transparent,#cdb07a 20%,#cdb07a 80%,transparent);opacity:.55}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;
  box-shadow:0 2px 3px rgba(0,0,0,.5),0 22px 40px rgba(0,0,0,.55),0 60px 120px rgba(0,0,0,.45);
  -webkit-box-reflect:below 10px linear-gradient(transparent 76%,rgba(255,255,255,.16))}
.card img{display:block;width:100%}
.card::after{content:'';position:absolute;inset:0;background:linear-gradient(118deg,transparent 34%,rgba(255,255,255,.18) 46%,transparent 58%)}
.lot{position:absolute;text-align:center}
.lot span{display:block;font:600 15px/1 Inter;letter-spacing:.28em;text-transform:uppercase;color:#a99a86}
.lot b{display:block;margin-top:14px;font:600 54px/1 Cormorant;font-variant-numeric:lining-nums;color:#efe6d6}
.lot.hero b{font-size:76px;color:#e2c68d}
.foot{font:500 17px/1.4 Inter;color:rgba(239,230,214,.55);letter-spacing:.02em}
.brand{display:flex;align-items:center;gap:16px}
.brand img{width:52px;height:52px;border-radius:12px;box-shadow:0 0 0 1px rgba(205,176,122,.5)}
.brand b{font:700 17px/1 Inter;letter-spacing:.36em;text-transform:uppercase;color:#efe6d6}
.panel{position:absolute;border-radius:34px;overflow:hidden;background:#100d22;
  box-shadow:0 0 0 1.5px rgba(205,176,122,.55),0 50px 110px rgba(0,0,0,.7),0 0 140px rgba(120,92,200,.18);transform:perspective(1800px) rotateX(9deg)}
"""
    if ratio == "portrait":
        cards, lots = [], []
        spec = {454665: (136, 520, 290, "back"), 454666: (395, 430, 410, "hero"), 454664: (774, 520, 290, "back")}
        for pid in ORDER:
            x, y, w, kind = spec[pid]
            h = round(w * 838 / 600)
            dim = "filter:brightness(.72) saturate(.9);" if kind == "back" else ""
            cards.append(f'<div class="card" style="left:{x}px;top:{y}px;width:{w}px;{dim}z-index:{2 if kind == "hero" else 1}"><img src="{art(pid)}"></div>')
            ly = y + h + 150 if kind == "hero" else y + h + 150
            lots.append(f'<div class="lot ov txt safe{" hero" if kind == "hero" else ""}" style="left:{x - 20}px;top:{ly}px;width:{w + 40}px">'
                        f'<span>{labels[pid]}</span><b>{ps[pid]["shown"]}</b></div>')
        body = (f'{grain(.07, "overlay", .9, "v")}'
                f'<div class="abs eyebrow ov txt safe" style="left:60px;right:60px;top:78px;text-align:center">OP01-120 &middot; Shanks</div>'
                f'<h1 class="abs ov txt safe" style="left:60px;right:60px;top:122px;text-align:center">The same number.<br><i>Not the same card.</i></h1>'
                + "".join(cards) + "".join(lots) +
                f'<div class="abs rule" style="left:180px;right:180px;top:1336px"></div>'
                f'<div class="abs foot ov txt safe" style="left:60px;right:60px;top:1362px;text-align:center">TCGplayer market prices, {when}</div>'
                f'<div class="abs brand ov safe" style="left:50%;transform:translateX(-50%);top:1404px"><img src="{icon()}"><b>OP TCG Hub</b></div>')
        return page(ratio, css, body, "vault-portrait")
    img, h = crop_img("home", home_crop, 760)
    body = (f'{grain(.07, "overlay", .9, "v")}'
            f'<div class="abs eyebrow ov txt safe" style="left:60px;right:60px;top:70px;text-align:center">Home &middot; a sample collection</div>'
            f'<h1 class="abs ov txt safe" style="left:60px;right:60px;top:112px;text-align:center;font-size:80px">What it&rsquo;s worth,<br><i>tonight.</i></h1>'
            f'<div class="panel safe" style="left:220px;top:370px;width:760px;height:{h}px">{img}</div>'
            f'<div class="abs rule" style="left:220px;right:220px;top:1048px"></div>'
            f'<div class="abs foot ov txt safe" style="left:60px;right:60px;top:1066px;text-align:center">TCGplayer market prices, {when}</div>'
            f'<div class="abs brand ov safe" style="left:50%;transform:translateX(-50%);top:1106px"><img src="{icon()}" style="width:44px;height:44px"><b>OP TCG Hub</b></div>')
    return page(ratio, css, body, "vault-square")

# ================================================================ wano
def seigaiha(w, h, r, stroke, bg, opacity):
    """the traditional wave of overlapping scales, drawn row by row so each row overlaps the one above"""
    parts = []
    rows = int(h / (r / 2)) + 3
    for row in range(-1, rows):
        y = row * r / 2
        off = r if row % 2 else 0
        for i in range(-1, int(w / (2 * r)) + 2):
            x = i * 2 * r + off
            parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{bg}"/>')
            for k in (0.82, 0.62, 0.42, 0.22):
                parts.append(f'<circle cx="{x}" cy="{y}" r="{r * k:.1f}"/>')
    return (f'<svg class="abs" style="inset:0;width:{w}px;height:{h}px;opacity:{opacity}" viewBox="0 0 {w} {h}" aria-hidden="true">'
            f'<g fill="none" stroke="{stroke}" stroke-width="1.3">{"".join(parts)}</g></svg>')

def leaf(w, h, seed=7):
    """gold leaf: squares laid by hand, each a slightly different gold, over a warm ground"""
    rnd = random.Random(seed); s = 96; cells = []
    for y in range(0, h + s, s):
        for x in range(0, w + s, s):
            a = rnd.uniform(-.06, .06)
            cells.append(f'<rect x="{x + rnd.uniform(-3, 3):.0f}" y="{y + rnd.uniform(-3, 3):.0f}" width="{s + 2}" height="{s + 2}" '
                         f'fill="{"#fff" if a > 0 else "#5a3d0c"}" opacity="{abs(a):.3f}"/>')
    return (f'<svg class="abs" style="inset:0;width:100%;height:100%" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a97f33"/><stop offset=".32" stop-color="#e6c979"/>'
            f'<stop offset=".55" stop-color="#b8913f"/><stop offset=".78" stop-color="#efd690"/><stop offset="1" stop-color="#9a7230"/></linearGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#lg)"/>{"".join(cells)}</svg>')

def seal(size, x, y, text="OP<br>TCG"):
    return (f'<div class="seal safe" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px"><svg class="abs" style="inset:0" viewBox="0 0 100 100" aria-hidden="true">'
            f'<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>'
            f'<rect x="6" y="6" width="88" height="88" rx="7" fill="#b8322a" filter="url(#rough)"/></svg><b>{text}</b></div>')

def wano(ratio):
    R, ps, labels, why, home_crop, when = data()
    css = "".join([face("Mincho", "shippori-mincho-latin-600-normal.woff2", 600), face("Mincho", "shippori-mincho-latin-800-normal.woff2", 800),
                   face("Inter", "inter-latin-500-normal.woff2", 500), face("Inter", "inter-latin-600-normal.woff2", 600)]) + """
body{background:#13163a;font-family:Inter,sans-serif;color:#f4ecd8}
h1{font:800 84px/1.08 Mincho;color:#f6eedc;letter-spacing:.01em}
h1 em{font-style:normal;color:#e3c56f}
.sub{font:500 26px/1.4 Inter;color:#c9cce6}
.mount{position:absolute;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.25)}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 0 0 5px #111,0 14px 30px rgba(40,20,0,.55)}
.card img{display:block;width:100%}
.plate{position:absolute;text-align:center;background:#111;border-radius:6px;box-shadow:0 10px 24px rgba(0,0,0,.4),inset 0 0 0 1px rgba(227,197,111,.45)}
.plate span{display:block;font:600 14px/1 Inter;letter-spacing:.24em;text-transform:uppercase;color:#bda968}
.plate b{display:block;margin-top:8px;font:800 42px/1 Mincho;color:#e8cc7c;font-variant-numeric:lining-nums}
.seal{position:absolute;transform:rotate(-4deg)}
.seal b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font:800 22px/1 Mincho;color:#f6e6d8;letter-spacing:.06em}
.brand{display:flex;align-items:center;gap:16px}
.brand img{width:54px;height:54px;border-radius:12px;box-shadow:0 0 0 2px #e3c56f}
.brand b{font:800 26px/1 Mincho;letter-spacing:.18em;text-transform:uppercase;color:#e3c56f}
.foot{font:500 17px/1.4 Inter;color:rgba(244,236,216,.6)}
.frame{position:absolute;padding:20px;box-shadow:0 34px 80px rgba(0,0,0,.6)}
.frame .inner{position:relative;overflow:hidden;box-shadow:0 0 0 3px #111}
"""
    if ratio == "portrait":
        W, H = 1200, 1500
        cards, plates = [], []
        spec = {454665: (150, 660, 262), 454666: (469, 640, 262), 454664: (788, 660, 262)}
        for pid in ORDER:
            x, y, w = spec[pid]; h = round(w * 838 / 600)
            cards.append(f'<div class="card safe" style="left:{x}px;top:{y}px;width:{w}px"><img src="{art(pid)}"></div>')
            plates.append(f'<div class="plate ov safe" style="left:{x - 6}px;top:{y + h + 34}px;width:{w + 12}px;padding:14px 0 16px">'
                          f'<span>{labels[pid]}</span><b>{ps[pid]["shown"]}</b></div>')
        body = (seigaiha(W, H, 46, "#d9b865", "#13163a", .16) +
                f'<div class="mount" style="left:96px;top:600px;width:1008px;height:640px">{leaf(1008, 640)}{grain(.18, "multiply", .7, "w")}</div>'
                f'<h1 class="abs ov txt safe" style="left:96px;top:120px;width:900px">One number.<br><em>Every printing.</em></h1>'
                f'<div class="abs sub ov txt safe" style="left:96px;top:330px;width:760px">The scanner shows each printing of a number, and asks which one you hold.</div>'
                + seal(116, 988, 116)
                + "".join(cards) + "".join(plates) +
                f'<div class="abs foot ov txt safe" style="left:96px;top:1290px">TCGplayer market prices, {when}</div>'
                f'<div class="abs brand ov safe" style="left:96px;top:1380px"><img src="{icon()}"><b>OP TCG Hub</b></div>')
        return page(ratio, css, body, "wano-portrait")
    W = H = 1200
    img, h = crop_img("home", home_crop, 700)
    body = (seigaiha(W, H, 46, "#d9b865", "#13163a", .16) +
            f'<h1 class="abs ov txt safe" style="left:90px;top:96px;width:1000px;font-size:74px">Your binder,<br><em>valued every night.</em></h1>'
            f'<div class="frame safe" style="left:230px;top:340px;width:740px;height:{h + 40}px">{leaf(740, h + 40, 3)}'
            f'<div class="inner" style="width:700px;height:{h}px">{img}</div></div>'
            f'<div class="abs foot ov txt safe" style="left:90px;top:1080px">A sample collection. TCGplayer market prices, {when}</div>'
            f'<div class="abs brand ov safe" style="right:90px;top:1062px"><img src="{icon()}" style="width:46px;height:46px"><b style="font-size:22px">OP TCG Hub</b></div>')
    return page(ratio, css, body, "wano-square")

# ================================================================ guide
def pen_circle(w, h, stroke="#c8372d", width=5):
    """a red pen's loop: not an ellipse, a hand's overshooting stroke"""
    return (f'<svg class="abs" style="left:0;top:0;width:{w}px;height:{h}px;overflow:visible" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">'
            f'<path d="M 12 38 C 4 20, 30 4, 58 6 C 86 8, 99 24, 94 40 C 88 56, 50 60, 26 54 C 10 50, 4 40, 16 26 C 24 18, 40 12, 52 13" '
            f'fill="none" stroke="{stroke}" stroke-width="{width / 3:.2f}" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:{width}px"/></svg>')

def guide(ratio):
    R, ps, labels, why, home_crop, when = data()
    css = "".join([face("Fraunces", "fraunces-latin-full-normal.woff2", "100 900"), face("Fraunces", "fraunces-latin-full-italic.woff2", "100 900", "italic"),
                   face("Inter", "inter-latin-500-normal.woff2", 500), face("Inter", "inter-latin-600-normal.woff2", 600),
                   face("Mono", "ibm-plex-mono-latin-500-normal.woff2", 500), face("Mono", "ibm-plex-mono-latin-600-normal.woff2", 600)]) + """
body{background:#f2ece0;font-family:Inter,sans-serif;color:#17140f}
.mast{display:flex;justify-content:space-between;font:600 17px/1 Mono;letter-spacing:.16em;text-transform:uppercase;color:#17140f}
.hair{height:2px;background:#17140f}.hair.thin{height:1px;opacity:.5}
h1{font-family:Fraunces;font-weight:640;font-size:96px;line-height:.98;letter-spacing:-.02em;font-variation-settings:'opsz' 144,'SOFT' 50}
h1 i{font-weight:420;font-style:italic;font-variation-settings:'opsz' 144,'SOFT' 100}
.dek{font:500 24px/1.42 Inter;color:#3c362c}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 1px 2px rgba(40,30,10,.3),0 10px 18px rgba(40,30,10,.18),0 30px 60px rgba(40,30,10,.16)}
.card img{display:block;width:100%}
.fig{position:absolute;font:500 19px/1.3 Mono;color:#17140f}
.fig b{display:block;font:600 34px/1.1 Mono;letter-spacing:-.01em;margin-top:6px}
.fig .k{letter-spacing:.14em;text-transform:uppercase;color:#6b6252;font-size:16px}
.tick{position:absolute;width:2px;background:#17140f}
.foot{font:500 16px/1.45 Inter;color:#5b5446}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:48px;height:48px;border-radius:11px;box-shadow:0 0 0 1.5px #17140f}
.brand b{font-family:Fraunces;font-weight:640;font-size:30px;letter-spacing:-.01em}
.shot{position:absolute;overflow:hidden;border-radius:18px;box-shadow:0 0 0 2px #17140f,0 22px 44px rgba(40,30,10,.22)}
.cap{font:500 18px/1.4 Mono;color:#3c362c}
"""
    if ratio == "portrait":
        spec = {454665: (80, 520, 300, -3), 454666: (450, 500, 300, 1.5), 454664: (820, 520, 300, 3.5)}
        cards, figs = [], []
        for pid in ORDER:
            x, y, w, t = spec[pid]; h = round(w * 838 / 600)
            cards.append(f'<div class="card safe" style="left:{x}px;top:{y}px;width:{w}px;transform:rotate({t}deg)"><img src="{art(pid)}"></div>')
            figs.append(f'<div class="tick" style="left:{x + w / 2}px;top:{y + h + 26}px;height:44px"></div>'
                        f'<div class="fig ov txt safe" style="left:{x}px;top:{y + h + 84}px;width:{w}px;text-align:center"><span class="k">{labels[pid]}</span>'
                        f'<b>{ps[pid]["shown"]}</b></div>')
        hx, hy, hw, _ = spec[454666]; hh = round(hw * 838 / 600)
        ring = f'<div class="abs" style="left:{hx + 6}px;top:{hy + hh + 104}px;width:{hw - 12}px;height:92px">{pen_circle(hw - 12, 92)}</div>'
        body = (grain(.10, "multiply", .75, "p") +
                f'<div class="abs mast ov txt safe" style="left:72px;right:72px;top:60px"><span>OP TCG Hub &mdash; Price Guide</span><span>{when}</span></div>'
                f'<div class="abs hair" style="left:72px;right:72px;top:92px"></div>'
                f'<h1 class="abs ov txt safe" style="left:72px;top:140px;width:1060px">Same number.<br><i>Different card.</i></h1>'
                f'<div class="abs dek ov txt safe" style="left:72px;top:380px;width:820px">{why}. The scanner shows every printing and asks which one you hold.</div>'
                + "".join(cards) + "".join(figs) + ring +
                f'<div class="abs hair thin" style="left:72px;right:72px;top:1340px"></div>'
                f'<div class="abs foot ov txt safe" style="left:72px;top:1362px;width:700px">Market prices from TCGplayer, read through TCGCSV on {when}. A price is an estimate, not an offer.</div>'
                f'<div class="abs brand ov safe" style="right:72px;top:1370px"><img src="{icon()}"><b>OP TCG Hub</b></div>')
        return page(ratio, css, body, "guide-portrait")
    img, h = crop_img("home", home_crop, 640)
    S = {s["name"]: s for s in R["steps"]}
    hr = S["home"]["rects"]; k = 640 / (411 * DPR)
    # the red pen goes round the month's change, where it sits in the crop
    dy = (hr["hero"]["y"] + hr["hero"]["h"] - 40 - home_crop[1]) * DPR * k
    body = (grain(.10, "multiply", .75, "p") +
            f'<div class="abs mast ov txt safe" style="left:72px;right:72px;top:60px"><span>OP TCG Hub &mdash; Price Guide</span><span>{when}</span></div>'
            f'<div class="abs hair" style="left:72px;right:72px;top:92px"></div>'
            f'<h1 class="abs ov txt safe" style="left:72px;top:130px;width:430px;font-size:74px">What your binder is worth <i>tonight.</i></h1>'
            f'<div class="abs dek ov txt safe" style="left:72px;top:560px;width:430px;font-size:24px">Every card at the market price of the printing you own, totalled, and how it moved this month.</div>'
            f'<div class="shot safe" style="left:540px;top:150px;width:590px;height:{h * 590 / 640:.0f}px"><div style="position:absolute;inset:0;transform:scale({590 / 640:.4f});transform-origin:0 0;width:640px;height:{h}px">{img}</div></div>'
            f'<div class="abs" style="left:560px;top:{150 + dy * 590 / 640 - 30:.0f}px;width:330px;height:84px">{pen_circle(330, 84)}</div>'
            f'<div class="abs cap ov txt safe" style="left:540px;top:{150 + h * 590 / 640 + 22:.0f}px;width:590px">Fig. 1 &mdash; Home, a sample collection.</div>'
            f'<div class="abs hair thin" style="left:72px;right:72px;top:1060px"></div>'
            f'<div class="abs foot ov txt safe" style="left:72px;top:1080px;width:660px">Market prices from TCGplayer, read through TCGCSV on {when}. A price is an estimate, not an offer.</div>'
            f'<div class="abs brand ov safe" style="right:72px;top:1086px"><img src="{icon()}"><b>OP TCG Hub</b></div>')
    return page(ratio, css, body, "guide-square")

# ================================================================ launch
def launch(ratio):
    R, ps, labels, why, home_crop, when = data()
    css = "".join([face("Inter", f"inter-latin-{w}-normal.woff2", w) for w in (500, 600, 700, 800)]) + """
body{background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(255,255,255,.10),transparent 70%),
  radial-gradient(ellipse 50% 40% at 20% 75%,rgba(110,90,255,.10),transparent 70%),
  radial-gradient(ellipse 45% 35% at 85% 70%,rgba(255,196,90,.08),transparent 70%),#050507;font-family:Inter,sans-serif;color:#f5f5f7}
h1{font:800 100px/.98 Inter;letter-spacing:-.045em}
h1 span{color:#86868b}
.sub{font:500 27px/1.38 Inter;color:#a1a1a6;letter-spacing:-.01em}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:50px;height:50px;border-radius:12px}
.brand b{font:600 24px/1 Inter;letter-spacing:-.01em;color:#f5f5f7}
.stage{position:absolute;perspective:1700px}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08)}
.card img{display:block;width:100%}
.card::after{content:'';position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:.28;
  background:linear-gradient(125deg,transparent 25%,#ff7ac6 38%,#7af0ff 46%,#fff27a 54%,transparent 66%)}
.spec{position:absolute;display:grid;grid-template-columns:1fr 1fr 1fr}
.spec div{padding:0 26px;border-left:1px solid rgba(255,255,255,.16)}
.spec div:first-child{border-left:0}
.spec span{display:block;font:500 19px/1.2 Inter;color:#86868b}
.spec b{display:block;margin-top:10px;font:700 48px/1 Inter;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.spec .hero b{background:linear-gradient(90deg,#ffe2a0,#f4b860);-webkit-background-clip:text;color:transparent}
.foot{font:500 16px/1.4 Inter;color:#6e6e73}
.screen{position:absolute;border-radius:40px;overflow:hidden;background:#100d22;
  box-shadow:0 0 0 1px rgba(255,255,255,.18),0 40px 100px rgba(0,0,0,.8),0 0 120px rgba(242,193,78,.12)}
"""
    if ratio == "portrait":
        # the dear one in front and sharp, the two others turned away behind it, softly out of focus
        spec = {454665: (150, 590, 290, 26, -140, "blur(2px) brightness(.72)"), 454664: (760, 590, 290, -26, -140, "blur(2px) brightness(.72)"),
                454666: (420, 540, 360, -6, 0, "none")}
        cards = []
        for pid in (454665, 454664, 454666):
            x, y, w, ry, z, f = spec[pid]
            cards.append(f'<div class="card safe" style="left:{x}px;top:{y}px;width:{w}px;transform:rotateY({ry}deg) rotateX(4deg) translateZ({z}px);filter:{f}"><img src="{art(pid)}"></div>')
        cols = "".join(f'<div class="{"hero" if pid == 454666 else ""}"><span>{labels[pid]}</span><b>{ps[pid]["shown"]}</b></div>' for pid in (454664, 454665, 454666))
        body = (f'<div class="abs brand ov safe" style="left:80px;top:70px"><img src="{icon()}"><b>OP TCG Hub</b></div>'
                f'<h1 class="abs ov txt safe" style="left:80px;top:170px;width:1040px">Every printing.<br><span>Priced.</span></h1>'
                f'<div class="abs sub ov txt safe" style="left:80px;top:392px;width:820px">{R["hero"]["num"]} has {why.split()[0]} printings. The scanner shows each one, and asks which you hold.</div>'
                f'<div class="stage" style="left:0;top:0;width:1200px;height:1500px">{"".join(cards)}</div>'
                f'<div class="spec ov safe" style="left:80px;right:80px;top:1210px">{cols}</div>'
                f'<div class="abs foot ov txt safe" style="left:80px;top:1400px">TCGplayer market prices, {when}</div>')
        return page(ratio, css, body, "launch-portrait")
    img, h = crop_img("home", home_crop, 540)
    body = (f'<div class="abs brand ov safe" style="left:72px;top:72px"><img src="{icon()}"><b>OP TCG Hub</b></div>'
            f'<h1 class="abs ov txt safe" style="left:72px;top:160px;width:1060px;font-size:88px">Your binder.<br><span>Valued nightly.</span></h1>'
            f'<div class="abs sub ov txt safe" style="left:72px;top:420px;width:420px;font-size:25px">Every card at the market price of the printing you own, totalled.</div>'
            f'<div class="stage" style="left:0;top:0;width:1200px;height:1200px"><div class="screen safe" style="left:580px;top:400px;width:540px;height:{h}px;'
            f'transform:rotateY(-16deg) rotateX(6deg)">{img}</div></div>'
            f'<div class="abs foot ov txt safe" style="left:72px;top:1110px">A sample collection. TCGplayer market prices, {when}</div>')
    return page(ratio, css, body, "launch-square")

DIRECTIONS = {"vault": vault, "wano": wano, "guide": guide, "launch": launch}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for name, make in DIRECTIONS.items():
        if only and name not in only:
            continue
        for ratio in ("portrait", "square"):
            open(os.path.join(OUT, f"{name}-{ratio}.html"), "w").write(make(ratio))
    print(f"directions: written to {OUT}")
