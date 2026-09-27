#!/usr/bin/env python3
"""The Play listing in Style v2 "Pull": eight 1080x1920 screenshots and the 1024x500 feature graphic.

The same style as the ads (style_pull.py: the hero in its aura, the ground from its art, a sentence-case
headline with one accent word, one lifted real-UI callout), with Play's own rules (Play Console Help, read
27 Sept):
- the app's screen is shown frameless: Play asks listings to avoid device imagery, which dates and alienates;
- the tagline (class "tl") takes at most 20 % of the image (render.mjs refuses more);
- no "Free", "Best", "#1", "Top", "New", sale or discount wording, and no call to action -- in the words laid
  over the frame, and in the app's own words on the screens shown: capture.mjs records every restricted word
  visible on each screen with its position, and a crop that would show one is refused here;
- the feature graphic keeps its focal point central, carries no alpha (render.mjs writes it as a JPEG) and
  no big icon-like branding.

  python3 design/marketing/listing_pull.py             -> $ADS_OUT/listing/*.html
  python3 design/marketing/listing_pull.py --selftest  -> the word guard, watched to refuse a planted crop first
  node design/marketing/render.mjs --dir listing
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import style_pull as SP                              # the locked style: aura, cards, ground, captions, concepts
D, P2 = SP.D, SP.P2
ADS = D.ADS
W, H = 1080, 1920

# Play's restricted wording for listing images, beyond the ad text's rules
PLAY_WORDS = re.compile(r"\b(free|best|top|new|discount|sale|download|install|million)\b|#\s?1\b|\b(play|try) now\b", re.I)

def words_in(step, crop):
    """the restricted words a crop of a screen would show (words under a sheet are hidden and not counted)"""
    cx, cy, cw, ch = crop
    return [(b["word"], b["top"]) for b in step.get("banned", [])
            if not b["covered"] and cy - 4 <= b["top"] <= cy + ch and cx - 4 <= b.get("left", 0) <= cx + cw]

def text_words(html):
    t = re.sub(r"<[^>]+>", " ", html)
    return [m.group(0) for m in PLAY_WORDS.finditer(t)]

CSS = """
.tl{}
.panel{position:absolute;overflow:hidden;border-radius:46px;background:#100d22;
  box-shadow:0 0 0 1.5px rgba(255,255,255,.14),0 2px 4px rgba(0,0,0,.5),0 50px 110px rgba(0,0,0,.6)}
"""

# ---------------------------------------------------------------- the eight screens, as data
# screen: (shot, crop in CSS px of the 411-wide cover screen); callout: (shot, crop) or None
def concepts(R, S):
    base = {k: SP.CONCEPTS[k](R, S) for k in ("printing", "value", "binder", "offline", "deck", "trade")}
    ty = S["picker"]["rects"]["title"]["y"]
    out = {
        "01-printing": dict(base["printing"], screen=("picker", (0, ty - 48, 411, 960 - (ty - 48)))),   # from the sheet's top edge (at ty - 60 the dimmed page behind showed as a sliver) to the screen's foot
        "02-value":    dict(base["value"], screen=("home", (0, 40, 411, 890)),
                            callout=("home",) + (base["value"]["callout"][1],)),
        "03-binder":   dict(base["binder"], screen=("collection", (0, 40, 411, 890)), callout=None),
        "04-detail":   dict(hero=SP.HEROES["detail"]["ids"][0],
                            head="Every card,<br><em>up close</em>.",
                            sub="Its market price with the day it was read, the low-to-high spread, and every printing of its number.",
                            screen=("detail", (0, 40, 411, 760)),       # the page's honest note ("not a sale") sits at 814
                            callout=("detail", (16, 545, 379, 128)),
                            foot=f"TCGplayer market prices, {D.day(R['source'])}."),
        "05-deck":     dict(base["deck"], screen=("deck", (0, 40, 411, 890))),
        "06-trade":    dict(base["trade"], screen=("trade", (0, 40, 411, 890))),
        "07-sealed":   dict(hero=None,
                            head="Hunt sealed<br><em>product</em>.",
                            sub="Boxes and packs at market price, with stock alerts at US stores.",
                            screen=("sealed", (0, 44, 411, 890)),
                            callout=None,                               # the list is its own proof; a lifted row only repeated it
                            foot=f"TCGplayer market prices, {D.day(R['source'])}."),
        "08-offline":  dict(base["offline"], screen=("offline", (0, 40, 411, 890))),
    }
    # the ads' callouts are cover-screen crops already, except value's (the cover Home is used here)
    for k in ("01-printing", "05-deck", "06-trade", "08-offline"):
        shot, crop, _w = out[k]["callout"]; out[k]["callout"] = (shot, crop)
    return out

# ---------------------------------------------------------------- a screenshot
def shot_frame(name, c, R, S, level=None):
    level = level or SP.AURA_LEVEL
    hero = c.get("hero")
    ac = SP.accent_of(hero) if hero else {"deep": "#5a4516", "bright": "#F2C14E"}   # no hero: the app's own brass
    css = P2.p3_fonts() + P2.P5_CSS.replace("var(--accent)", ac["bright"]) + SP.GROUND_CSS + CSS
    words = SP.check_caption(c["head"] + " " + c["sub"]) + SP.check_caption(c["foot"], footnote=True)
    words += text_words(c["head"] + " " + c["sub"] + " " + c["foot"])
    assert not words, (name, "restricted words in the frame's text", words)
    shot, crop = c["screen"]
    shown = words_in(S[shot], crop)
    assert not shown, (name, "the screen crop would show restricted words", shown)
    if c.get("callout"):
        shown = words_in(S[c["callout"][0]], c["callout"][1])
        assert not shown, (name, "the callout would show restricted words", shown)
    ground_src = D.art(hero) if hero else D.b64(os.path.join(ADS, "shots", shot + ".png"), "image/png")
    body = [f'<img class="ground" src="{ground_src}" style="left:-160px;top:-220px;width:1600px">', '<div class="shade"></div>',
            f'<div class="abs brand ov safe" style="right:64px;top:74px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>',
            f'<h1 class="abs ov txt tl safe" style="left:64px;top:64px;width:720px;font-size:84px">{c["head"]}</h1>',
            f'<div class="abs sub ov txt tl safe" style="left:64px;top:262px;width:{600 if hero else 900}px;font-size:30px">{c["sub"]}</div>']
    # the screen, frameless: its height follows the crop
    pw = 640 if hero else 760
    px = 64 if hero else (W - pw) // 2
    img, ph = D.crop_img(shot, crop, pw)
    ph = min(ph, H - 150 - 470)                     # the panel ends above the footnote
    body.append(f'<div class="panel safe" style="left:{px}px;top:470px;width:{pw}px;height:{ph}px">{img}</div>')
    if hero:
        cx, cy, cw, ct = 620, 640, 380, 7
        body.append(SP.aura_box(hero, cx, cy, cw, ct, ac, level))
        for pid, ox, oy, k, t in c.get("behind", []):
            body.append(SP.card(pid, cx + ox * cw, cy + oy * cw, cw * k, t))
        body.append(SP.card(hero, cx, cy, cw, ct, "box-shadow:0 34px 44px -20px rgba(0,0,0,.7)"))
    if c.get("callout"):
        cshot, ccrop = c["callout"]
        kw = 520
        cimg, ch = D.crop_img(cshot, ccrop, kw)
        if ch > 290:
            kw = round(kw * 290 / ch); cimg, ch = D.crop_img(cshot, ccrop, kw)
        kx, ky = W - 64 - kw, H - 170 - ch
        body.append(f'<div class="callout ov safe" style="left:{kx}px;top:{ky}px;width:{kw}px;height:{ch}px">{cimg}</div>')
    body.append(f'<div class="abs foot ov txt safe" style="left:{W - 64 - 560}px;top:{H - 88}px;width:560px">{c["foot"]}</div>')
    return page(css, "".join(body), f"{name}-listing", W, H)

def page(css, body, title, w, h):
    return (f"<!doctype html><html><head><meta charset=utf-8><title>{title}</title><style>"
            f"*{{box-sizing:border-box;margin:0}}html,body{{width:{w}px;height:{h}px;overflow:hidden}}body{{position:relative}}"
            f".abs{{position:absolute}}{css}</style></head><body>{body}</body></html>")

# ---------------------------------------------------------------- the feature graphic
def feature(R, S, level=None):
    """1024x500: the three printings of the lead number fanned at the centre, the dear one in its aura; one small
    line and the name at the left. The focal point stays central, clear of the edges Play may crop."""
    level = level or SP.AURA_LEVEL
    ps = {p["id"]: p for p in R["hero"]["printings"]}
    dear, mid, low = sorted(ps, key=lambda i: -(ps[i]["market"] or 0))
    ac = SP.accent_of(dear)
    css = P2.p3_fonts() + P2.P5_CSS.replace("var(--accent)", ac["bright"]) + SP.GROUND_CSS + """
.name{font:700 22px/1 Inter;letter-spacing:.02em;color:#d4d7d2}
h1.fg{font:800 40px/1.05 Inter;white-space:nowrap;letter-spacing:-.03em;color:#f4f5f3}
h1.fg em{font-style:normal;color:""" + ac["bright"] + """}
.fsub{font:500 21px/1.35 Inter;color:#c9ccc7}
"""
    head = "Every printing, <em>priced</em>."
    assert not text_words(head + " Scan it. Value it. Build it.")
    cx, cy, cw, ct = 660, 166, 200, 6
    body = [f'<img class="ground" src="{D.art(dear)}" style="left:-200px;top:-500px;width:1400px">', '<div class="shade"></div>',
            f'<div class="abs name ov txt tl safe" style="left:64px;top:188px">OP TCG Hub</div>',
            f'<h1 class="abs fg ov txt tl safe" style="left:64px;top:222px">{head}</h1>',
            f'<div class="abs fsub ov txt safe" style="left:64px;top:282px;width:360px">Scan it. Value it. Build it.</div>',
            SP.aura_box(dear, cx, cy, cw, ct, ac, level),
            SP.card(low, cx - .62 * cw, cy + .16 * cw, cw * .84, -12),
            SP.card(mid, cx - .32 * cw, cy + .07 * cw, cw * .9, -4),
            SP.card(dear, cx, cy, cw, ct, "box-shadow:0 26px 34px -16px rgba(0,0,0,.7)")]
    return page(css, "".join(body), "feature-feature", 1024, 500)

def selftest(S):
    """each planted case must be refused, and each real crop must pass"""
    bad = []
    if not words_in(S["detail"], (0, 40, 411, 890)):
        bad.append("a detail crop reaching the page's 'sale' (814 px) was not refused")
    if words_in(S["detail"], (0, 40, 411, 760)):
        bad.append("the real detail crop (to 800 px) was refused")
    if not text_words("New: the best scanner, free"):
        bad.append("planted restricted words in a frame's text were not refused")
    if text_words("Every card, up close. Its market price with the day it was read."):
        bad.append("a clean line was refused")
    if not words_in({"banned": [{"word": "free", "top": 300, "left": 40, "covered": False}]}, (0, 40, 411, 890)):
        bad.append("an uncovered word inside a crop was not refused")
    if words_in({"banned": [{"word": "free", "top": 300, "left": 40, "covered": True}]}, (0, 40, 411, 890)):
        bad.append("a word hidden under a sheet was counted")
    for b in bad:
        print("selftest: FAILED --", b)
    if bad:
        sys.exit(1)
    print("selftest: restricted words refused in a crop and in text; the real crops and a covered word pass")

if __name__ == "__main__":
    R, S = SP.report()
    if "--selftest" in sys.argv:
        selftest(S); sys.exit(0)
    out = os.path.join(ADS, "listing"); os.makedirs(out, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    n = 0
    for name, c in concepts(R, S).items():
        if only and not any(name.endswith(o) or name == o for o in only):
            continue
        open(os.path.join(out, f"{name}-listing.html"), "w").write(shot_frame(name, c, R, S)); n += 1
    if not only or "feature" in only:
        open(os.path.join(out, "feature-feature.html"), "w").write(feature(R, S)); n += 1
    print(f"listing_pull: {n} frames written to {out}")
