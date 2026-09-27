#!/usr/bin/env python3
"""The App campaign's images: four concepts at Google's three ratios (1200x628, 1200x1200, 1200x1500).

They wear the listing's scheme (design/play-listing/frames.py, the icon's D7 v4): the Prussian band and its
cream display caption, the buff sky, the icon's waves, the ink keyline and the green offset print. An ad
is smaller than a listing frame, so each one shows ONE tight crop of a real screen instead of the whole
phone (Google: "tightly framed shots ... of the UI").

The concepts, strongest first:
  printing  one number, three printings, three prices: the hero art (the owner, 27 Sept)
  value     Home's total and its month
  binder    the collection grid, each card at its printing's price
  offline   Home in airplane mode, its "Offline OK" pill beside the total

Every price and date comes from capture.mjs's report.json, never typed here: EB03-024's spread was 316x
in the README, 110x on the listing and 63x in the app on 27 Sept. Text and badges carry the class "ov"
(render.mjs holds them under 20 % of the image, Google's guidance); what must stay inside the frame carries
"safe". No Install button is drawn: the ad unit draws its own, and a fake one is misleading design.

  python3 design/marketing/style_listing.py   -> $ADS_OUT/images/*.html (render.mjs shoots them)
"""
import base64, datetime, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ADS = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")
SHOTS, ART, OUT = os.path.join(ADS, "shots"), os.path.join(ADS, "art"), os.path.join(ADS, "images")
sys.path.insert(0, os.path.join(REPO, "design", "play-listing"))
import frames as F                                  # the listing's palette, its sea and b64()
PRUSSIAN, BUFF, CREAM, INK, GREEN = F.PRUSSIAN, F.BUFF, F.CREAM, F.INK, F.GREEN
APP_BG, APP_CARD, GOLD, DIM = "#100D22", "#1A1633", "#FFDF8C", "#B3ACCF"   # Collect's tokens (src/app.html :root)

DPR = 2.625                                         # capture.mjs shoots at the Fold's density
SHOT_PX = {"cover": 1079, "open": 1966}             # 411 and 749 CSS px wide
RATIOS = {"landscape": (1200, 628), "square": (1200, 1200), "portrait": (1200, 1500)}

def font(name):
    return F.b64(os.path.join(REPO, "assets", "fonts", name + ".woff2"), "font/woff2")

CSS = """
@font-face{font-family:D;src:url(%FD%)} @font-face{font-family:B;src:url(%FB%)} @font-face{font-family:H;src:url(%FH%)}
*{box-sizing:border-box;margin:0}
html,body{width:%WW%px;height:%HH%px;overflow:hidden}
body{position:relative;font-family:B,sans-serif;background:%BG%}
.abs{position:absolute}
h1.cap{font-family:D;color:%CREAM%;text-transform:uppercase;letter-spacing:.01em;line-height:1.02;
  -webkit-text-stroke:var(--st,6px) %INK%;paint-order:stroke fill;text-shadow:var(--sh,8px 10px) 0 %GREEN%}
p.sub{color:#DCE4F0;font-weight:600;line-height:1.3;text-wrap:balance}
.keyed{position:absolute}
.keyed .print{position:absolute;inset:0;transform:translate(var(--off,12px),calc(var(--off,12px) * 1.2));background:%GREEN%;border-radius:var(--r,28px)}
.keyed .face{position:absolute;inset:0;border:var(--key,8px) solid %INK%;border-radius:var(--r,28px);overflow:hidden;background:%APP_BG%}
.keyed .face img{position:absolute;display:block}
.chip{position:absolute;text-align:center;background:%APP_CARD%;border:4px solid %INK%;border-radius:18px;box-shadow:6px 7px 0 %GREEN%}
.chip b{display:block;font-family:H;font-weight:900;color:%GOLD%;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.chip span{display:block;color:%DIM%;font-weight:700;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
.lock{position:absolute;display:flex;align-items:center;gap:.45em;background:%CREAM%;border:5px solid %INK%;border-radius:999px;
  padding:.18em .7em .18em .2em;box-shadow:6px 7px 0 %GREEN%}
.lock img{display:block;border-radius:22%;border:4px solid %INK%;background:%BUFF%}
.lock b{font-family:D;font-weight:400;color:%INK%;text-transform:uppercase;letter-spacing:.01em;white-space:nowrap;line-height:1}
.note{position:absolute;font-weight:600;letter-spacing:.01em;z-index:2}
.sea{position:absolute;left:0;right:0;bottom:0}
"""

def page(ratio, body, bg, title):
    w, h = RATIOS[ratio]
    css = CSS
    for k, v in {"%FD%": FONTS[0], "%FB%": FONTS[1], "%FH%": FONTS[2], "%WW%": str(w), "%HH%": str(h), "%BG%": bg,
                 "%CREAM%": CREAM, "%INK%": INK, "%GREEN%": GREEN, "%BUFF%": BUFF, "%APP_BG%": APP_BG,
                 "%APP_CARD%": APP_CARD, "%GOLD%": GOLD, "%DIM%": DIM}.items():
        css = css.replace(k, v)
    return (f'<!doctype html><html><head><meta charset=utf-8><title>{title}</title><style>{css}</style></head>'
            f'<body data-ratio="{ratio}">{body}</body></html>')

def sky(band, fade):
    """the listing's ground: the Prussian band over the buff sky"""
    return f"linear-gradient(180deg,{PRUSSIAN} 0,{PRUSSIAN} {band}px,#6f86a6 {band + (fade - band) * .55:.0f}px,{BUFF} {fade}px,{BUFF} 100%)"

def cap(html, x, y, w, size, align="center", stroke=6, shadow=(8, 10)):
    return (f'<h1 class="cap abs ov txt safe" style="left:{x}px;top:{y}px;width:{w}px;font-size:{size}px;text-align:{align};'
            f'--st:{stroke}px;--sh:{shadow[0]}px {shadow[1]}px">{html}</h1>')

def sub(text, x, y, w, size, align="center", color="#DCE4F0"):
    return f'<p class="sub abs ov txt safe" style="left:{x}px;top:{y}px;width:{w}px;font-size:{size}px;text-align:{align};color:{color}">{text}</p>'

def lock(x, y, size, center=False):
    """the icon and the name, as a sticker: a placement may show the image without the app's name"""
    pos = f"left:50%;transform:translateX(-50%);top:{y}px" if center else f"left:{x}px;top:{y}px"
    return (f'<div class="lock ov safe" style="{pos};font-size:{size}px"><img src="{ICON}" style="width:{size * 1.7:.0f}px;height:{size * 1.7:.0f}px">'
            f'<b>OP TCG Hub</b></div>')

def note(text, x, y, w, size, color, align="center", backed=False):
    """the footnote: where a price came from and that the collection is a sample. Over the sea it sits on a
    Prussian backing, or the waves eat it."""
    t = f'<span style="background:{PRUSSIAN};padding:.2em .7em;border-radius:999px;box-decoration-break:clone">{text}</span>' if backed else text
    return f'<div class="note ov txt safe" style="left:{x}px;top:{y}px;width:{w}px;font-size:{size}px;color:{color};text-align:{align}">{t}</div>'

def shot_slice(shot, crop, x, y, w, tilt=0.0, r=34, key=8, off=12, view="cover"):
    """a crop of a real screen (crop = x, y, w, h in CSS px), shown w px wide in the keyline and offset print"""
    cx, cy, cw, ch = crop
    k = w / (cw * DPR)
    h = round(ch * DPR * k)
    src = F.b64(os.path.join(SHOTS, shot + ".png"), "image/png")
    img = f'<img src="{src}" style="width:{SHOT_PX[view] * k:.1f}px;left:{-cx * DPR * k:.1f}px;top:{-cy * DPR * k:.1f}px">'
    return (f'<div class="keyed safe" style="left:{x}px;top:{y}px;width:{w + 2 * key}px;height:{h + 2 * key}px;transform:rotate({tilt}deg);'
            f'--r:{r}px;--key:{key}px;--off:{off}px"><div class="print"></div><div class="face">{img}</div></div>'), h + 2 * key

def art_card(pid, x, y, w, tilt=0.0, key=7, off=10):
    """a printing's own scan (capture.mjs art/), keyed like the frames' screens; a card's corner is about 4.5 % of its width"""
    src = F.b64(os.path.join(ART, f"{pid}.png"), "image/png")
    h = round(w * 838 / 600)
    r = round(w * 0.045) + key
    return (f'<div class="keyed safe" style="left:{x}px;top:{y}px;width:{w + 2 * key}px;height:{h + 2 * key}px;transform:rotate({tilt}deg);'
            f'--r:{r}px;--key:{key}px;--off:{off}px"><div class="print"></div><div class="face">'
            f'<img src="{src}" style="width:{w}px;height:{h}px;left:0;top:0"></div></div>'), h + 2 * key

def chip(label, price, cx, y, w, size):
    return (f'<div class="chip ov safe" style="left:{cx - w / 2:.0f}px;top:{y}px;width:{w}px;padding:{size * .22:.0f}px 0 {size * .28:.0f}px">'
            f'<span style="font-size:{size * (.36 if len(label) <= 12 else .27):.0f}px">{label}</span><b style="font-size:{size}px">{price}</b></div>')

def sea(h):
    return f'<div class="sea" style="height:{h}px">{F.waves_svg()}</div>'

def day(iso):
    d = datetime.date.fromisoformat(iso[:10])
    return f"{d.day} {d.strftime('%b')} {d.year}"

# ---------------------------------------------------------------- the concepts
# Portrait and square ride the listing's sea, drawn first so everything sits on it, at its own proportions
# (552 x 162 in the icon's units). Landscape has no scenery: the feature graphic's flat Prussian, which the
# owner chose over two scenes, with the words on the left and the proof on the right.
SEA = round(1200 * 162 / 552)

def ground(ratio):
    return {"portrait": sky(290, 430), "square": sky(250, 380), "landscape": PRUSSIAN}[ratio]

def left_words(head, line, foot, foot_color="#AFC0DA"):
    """landscape's left column: the lockup, the caption, one line, a foot"""
    return [lock(48, 40, 32), cap(head, 48, 150, 540, 62, "left", 5, (6, 8)),
            sub(line, 48, 300, 540, 24, "left"), note(foot, 48, 562, 560, 17, foot_color, "left")]

def pieces(ratio, body):
    w, h = RATIOS[ratio]
    return ("" if ratio == "landscape" else sea(SEA)) + "".join(body)

def printing(ratio):
    hero = REPORT["hero"]; ps = hero["printings"]
    picker = STEP["picker"]
    # the picker's own label for each printing ("Base", "Parallel", "Parallel · Manga / Alternate Art"): its last part
    labels = {}
    for o in picker["options"]:
        for p in ps:
            if o["price"] == p["shown"] and p["id"] not in labels:
                labels[p["id"]] = o["label"].split(" · ")[-1]
    assert len(labels) == len(ps), ("a hero printing is not in the picker", labels)
    src = f"TCGplayer market prices, {day(REPORT['source'])}"
    if ratio == "landscape":
        body = left_words("One number.<br>Every printing.", f"{hero['num']}: the scanner shows every printing<br>and asks which one you hold.", src)
        cw, xs, tilts, top = 158, (640, 812, 984), (-5, 0, 5), 132
        for p, x, t in zip(ps, xs, tilts):
            html, ch = art_card(p["id"], x, top + (10 if t else 0), cw, t, key=6, off=8)
            body += [html, chip(labels[p["id"]], p["shown"], x + cw / 2 + 6, top + ch + 30, 166, 30)]
        return page(ratio, pieces(ratio, body), ground(ratio), "printing-landscape")
    if ratio == "square":
        body = [cap("One number.<br>Every printing.", 60, 44, 1080, 84)]
        cw, xs, tilts, top = 272, (150, 457, 764), (-6, 0, 6), 282
        for p, x, t in zip(ps, xs, tilts):
            html, ch = art_card(p["id"], x, top + (20 if t else 0), cw, t)
            body += [html, chip(labels[p["id"]], p["shown"], x + cw / 2 + 7, top + ch + 36, 284, 42)]
        body += [note(src, 60, 836, 1080, 21, INK), lock(0, 1068, 36, center=True)]
        return page(ratio, pieces(ratio, body), ground(ratio), "printing-square")
    body = [cap("One number.<br>Every printing.", 60, 52, 1080, 92)]
    cw, xs, tilts, top = 300, (118, 450, 782), (-6, 0, 6), 318
    for p, x, t in zip(ps, xs, tilts):
        html, ch = art_card(p["id"], x, top + (22 if t else 0), cw, t)
        body += [html, chip(labels[p["id"]], p["shown"], x + cw / 2 + 7, top + ch + 40, 300, 46)]
    why = picker["rects"]["why"]
    sl, sh = shot_slice("picker", (why["x"] - 8, why["y"] - 8, why["w"] + 16, why["h"] + 16), 190, 936, 820, r=26, key=7, off=10)
    body += [sl, note(src, 60, 936 + sh + 26, 1080, 21, INK), lock(0, 1362, 38, center=True)]
    return page(ratio, pieces(ratio, body), ground(ratio), "printing-portrait")

def value(ratio):
    r = STEP["home"]["rects"]; top = r["hero"]["y"] - 12
    src = f"A sample collection. TCGplayer market prices, {day(REPORT['source'])}"
    if ratio == "landscape":
        sl, _ = shot_slice("home", (0, top, 411, r["spark"]["y"] + r["spark"]["h"] + 10 - top), 650, 86, 470, tilt=1.5, r=26, key=7, off=10)
        body = left_words("Know what<br>it's worth.", "Your collection at today's market price,<br>and how it moved this month.", src) + [sl]
        return page(ratio, pieces(ratio, body), ground(ratio), "value-landscape")
    bottom = r["ranges"]["y"] + r["ranges"]["h"] + 14
    if ratio == "square":
        sl, _ = shot_slice("home", (0, top, 411, bottom - top), 210, 262, 780, tilt=1.5)
        body = [cap("Know what<br>it's worth.", 60, 44, 1080, 84), sl, lock(0, 1068, 36, center=True),
                note(src, 60, 1144, 1080, 18, CREAM, backed=True)]
        return page(ratio, pieces(ratio, body), ground(ratio), "value-square")
    sl, _ = shot_slice("home", (0, top, 411, bottom - top), 180, 400, 840, tilt=1.5)
    body = [cap("Know what<br>it's worth.", 60, 52, 1080, 92),
            sub("Your collection at today's market price.", 60, 270, 1080, 32), sl,
            lock(0, 1362, 38, center=True), note(src, 60, 1436, 1080, 19, CREAM, backed=True)]
    return page(ratio, pieces(ratio, body), ground(ratio), "value-portrait")

def binder(ratio):
    """the open Fold's four-across row (749 CSS px): more of the binder per inch and the art near its own
    size, where the cover screen's two-across row blew the grid's thumbnails up past their pixels"""
    src = f"A sample collection. TCGplayer market prices, {day(REPORT['source'])}"
    row = (8, 250, 733, 398)                        # the first row of four, MEASURED on open-collection.png
    if ratio == "landscape":
        sl, _ = shot_slice("open-collection", row, 626, 150, 520, tilt=-1.5, r=22, key=6, off=9, view="open")
        body = left_words("Your binder,<br>priced.", "Scan with no cap. Every card at the price<br>of the printing you own.", src) + [sl]
        return page(ratio, pieces(ratio, body), ground(ratio), "binder-landscape")
    if ratio == "square":
        sl, _ = shot_slice("open-collection", row, 140, 300, 900, tilt=-1.5, r=28, view="open")
        body = [cap("Your binder,<br>priced.", 60, 44, 1080, 84), sl, lock(0, 1068, 36, center=True),
                note(src, 60, 1144, 1080, 18, CREAM, backed=True)]
        return page(ratio, pieces(ratio, body), ground(ratio), "binder-square")
    # portrait adds the row of tools above the grid: movers, the trade analyzer, CSV export, backup, want list
    sl, _ = shot_slice("open-collection", (8, 104, 733, 544), 140, 400, 900, tilt=-1.5, r=28, view="open")
    body = [cap("Your binder,<br>priced.", 60, 52, 1080, 92),
            sub("Scan with no cap. Every card at the price of the printing you own.", 120, 262, 960, 32), sl,
            lock(0, 1362, 38, center=True), note(src, 60, 1436, 1080, 19, CREAM, backed=True)]
    return page(ratio, pieces(ratio, body), ground(ratio), "binder-portrait")

def offline(ratio):
    r = STEP["offline"]["rects"]
    top = r["pill"]["y"] - 30
    crop = (0, top, 411, r["hero"]["y"] + r["hero"]["h"] + 16 - top)
    foot = "A sample collection. The pill as the phone shows it offline."
    if ratio == "landscape":
        sl, _ = shot_slice("offline", crop, 650, 70, 470, tilt=1.5, r=26, key=7, off=10)
        body = left_words("Works with<br>no signal.", "Scan and value cards at the card show,<br>even in airplane mode. No account.", foot) + [sl]
        return page(ratio, pieces(ratio, body), ground(ratio), "offline-landscape")
    if ratio == "square":
        sl, _ = shot_slice("offline", crop, 190, 290, 820, tilt=-1.5)
        body = [cap("Works with<br>no signal.", 60, 44, 1080, 84), sl, lock(0, 1068, 36, center=True),
                note(foot, 60, 1144, 1080, 18, CREAM, backed=True)]
        return page(ratio, pieces(ratio, body), ground(ratio), "offline-square")
    sl, sh = shot_slice("offline", crop, 210, 380, 780, tilt=-1.5)
    body = [cap("Works with<br>no signal.", 60, 52, 1080, 92),
            sub("Scan and value cards at the card show, even in airplane mode.", 120, 262, 960, 32), sl,
            sub("No account. No subscription.", 60, 380 + sh + 26, 1080, 36, color=INK), lock(0, 1362, 38, center=True),
            note(foot, 60, 1436, 1080, 19, CREAM, backed=True)]
    return page(ratio, pieces(ratio, body), ground(ratio), "offline-portrait")

CONCEPTS = {"printing": printing, "value": value, "binder": binder, "offline": offline}

if __name__ == "__main__":
    REPORT = json.load(open(os.path.join(ADS, "report.json")))
    STEP = {s["name"]: s for s in REPORT["steps"]}
    bad = [s["name"] for s in REPORT["steps"] if not s.get("ok")]
    assert not bad, ("capture steps failed", bad)
    assert REPORT.get("hero") and all(p.get("file") for p in REPORT["hero"]["printings"]), "no hero art (NO_ART run?)"
    FONTS = (font("display"), font("body"), font("heavy"))
    ICON = "data:image/svg+xml;base64," + base64.b64encode(open(os.path.join(REPO, "assets", "icon.svg"), "rb").read()).decode()
    only = sys.argv[1:]
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for name, make in CONCEPTS.items():
        if only and name not in only:
            continue
        for ratio in RATIOS:
            open(os.path.join(OUT, f"{name}-{ratio}.html"), "w").write(make(ratio)); n += 1
    print(f"images: {n} compositions written to {OUT} (prices from the capture of {REPORT['captured'][:16]}, source {REPORT['source'][:10]})")
