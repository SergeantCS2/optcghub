#!/usr/bin/env python3
"""The listing frames: eight 1080x1920 portrait screenshots and the 1024x500 feature graphic.

The frames use the icon's scheme (design/d7-icons/v4):
- a Prussian band carrying the caption, at most 20 % of the height (Google's rule)
- a buff sky
- the icon's own bottom waves (v4/wave.py foreground())
- the in-app screenshot riding the waves the way the card does in the icon, with an ink keyline and a
  green offset print

No device frame, no call to action, no "Free", no rankings: the caption text is checked here, and so is
the app's own text in each screenshot (capture.mjs records where every restricted word sits). A frame
that shows one above its sea is refused.

  python3 design/play-listing/frames.py [icon.svg]   -> $LISTING_OUT/frames/*.html (render.mjs shoots them)
  python3 design/play-listing/frames.py --selftest   -> the guard, watched to fail on the first draft's framing
"""
import base64, json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
BUILD = os.environ.get("LISTING_OUT") or os.path.join(os.path.dirname(REPO), "play-listing-build")
SHOTS, OUT = os.path.join(BUILD, "shots"), os.path.join(BUILD, "frames")
sys.path.insert(0, os.path.join(REPO, "design", "d7-icons", "v4"))
import wave as W                                    # the icon's sea

PRUSSIAN, BUFF, CREAM, INK, GREEN = "#1f3d72", "#efd9a8", "#F6EEDA", "#1E1A14", "#2e9e5b"

# ---- the frame's geometry, shared by the template and the guard ----
SHOT_W, DPR = 1079, 1079 / 411      # capture.mjs: the Fold's cover screen, 411 CSS px at 2.625
CARD_TOP, CARD_W, CARD_H, KEY = 452, 760, 1300, 12
S = (CARD_W - 2 * KEY) / SHOT_W     # the screenshot's scale inside the keyline
TILT = 1.5                          # degrees, alternating
SEA_H, SEA_VIEW = 330, (-20, 358, 552, 162)

def sea_top():
    """The lowest point of the far swell's top edge across the card's width, in frame px: text below it
    is under the sea. The sea is drawn 'xMidYMax slice' into a 1080 x SEA_H band."""
    x0, y0, w, h = SEA_VIEW
    k = max(1080 / w, SEA_H / h); ox = (1080 - w * k) / 2
    lo, hi = 540 - CARD_W / 2, 540 + CARD_W / 2
    return max(1920 - SEA_H + (y - y0) * k for x, y in W.cr(W.SWELL, 16) if lo <= ox + (x - x0) * k <= hi)

def frame_y(top_css, crop):
    """Where a line of the screenshot (CSS px from its top) lands in the frame."""
    return CARD_TOP + KEY + (top_css * DPR - crop) * S

BANNED = ("free", "download", "install", "#1", "best", "top rated", "try now", "play now")

def guard(steps, frames):
    """The restricted words a frame would show: above its sea and below its crop. Words under a sheet
    (capture.mjs marks them covered) are hidden and not counted."""
    by = {s["name"]: s for s in steps}
    limit = sea_top() + CARD_W / 2 * math.sin(math.radians(TILT))
    shown = []
    for key, head, sub, shot, crop in frames:
        step = by.get(shot)
        assert step and step.get("ok"), ("no capture for", shot)
        assert "banned" in step, ("the capture predates the word scan", shot)
        for b in step["banned"]:
            y = frame_y(b["top"], crop)
            if not b["covered"] and CARD_TOP + KEY - 20 < y < limit:
                shown.append((key, b["word"], round(y), b["text"]))
    return shown

def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

def waves_svg(view=SEA_VIEW):
    """The icon's two foreground swells with their claw crests, as a band."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(map(str, view))}" preserveAspectRatio="xMidYMax slice" '
            f'style="position:absolute;left:0;bottom:0;width:100%;height:100%">{W.foreground()}</svg>')

FRAMES = [   # key, headline, subline, capture step, crop (shot px scrolled off the top)
    ("01-binder", "Your binder,<br>priced.", "Each card at the market price of the printing you own.", "01-collection-grid", 480),
    ("02-scan", "One number.<br>Every printing.", "The scanner shows every printing a number shares, and asks when it can't be sure.", "02-scan-printing-picker", 716),
    ("03-value", "Know what<br>it's worth.", "Your collection at market price, night by night.", "03-home-value", 330),
    ("04-card", "Every card,<br>up close.", "Its market price with the day and the marketplace, and every printing of its number.", "04-card-detail", 0),
    ("05-deck", "Built to<br>the rules.", "Fifty cards, one Leader, colours checked against the Comprehensive Rules.", "05-deck-builder", 0),
    ("06-hunt", "Hunt sealed<br>product.", "Boxes, packs and cases with market prices and stock alerts.", "06-hunt-sealed", 120),
    ("07-play", "Game day on<br>one phone.", "Life and DON!! for both players, and the refresh done for you.", "07-game-day", 0),
    ("08-offline", "No account.<br>Works offline.", "Your collection stays on your phone. Only the nightly prices need a signal.", "08-offline", 0),
]

def check_captions():
    for key, head, sub, *_ in FRAMES:
        text = (head + " " + sub).lower().replace("<br>", " ")
        bad = [w for w in BANNED if w in text]
        assert not bad, (key, bad)

def selftest():
    """The guard must refuse the first draft's framing of Settings, whose web-build copy says "free"
    (capture.mjs x-settings-first-draft, framed as the first draft framed it: crop 330), and must pass
    the frames as they stand."""
    part = json.load(open(os.path.join(SHOTS, "report-partial.json")))
    first = [("08-first-draft", "", "", "x-settings-first-draft", 330)]
    refused = guard(part["steps"], first)
    assert refused, "the guard passed the first draft's Settings frame: it is not looking"
    print("negative control: refused", refused)
    shown = guard(json.load(open(os.path.join(SHOTS, "report.json")))["steps"], FRAMES)
    assert not shown, shown
    print(f"frames: none shown above the sea (its top at {sea_top():.0f} px)")

CSS = f"""
@font-face{{font-family:D;src:url(%DISPLAY%)}} @font-face{{font-family:B;src:url(%BODY%)}}
*{{box-sizing:border-box;margin:0}}
html,body{{width:1080px;height:1920px;overflow:hidden}}
body{{background:linear-gradient(180deg,{PRUSSIAN} 0,{PRUSSIAN} 384px,#6f86a6 470px,{BUFF} 600px,{BUFF} 100%);font-family:B,sans-serif;position:relative}}
#cap{{position:absolute;left:0;top:0;width:1080px;height:384px;padding:58px 64px 0;text-align:center}}
#cap h1{{font:94px/1.02 D;color:{CREAM};letter-spacing:.01em;text-transform:uppercase;
  text-shadow:8px 10px 0 {GREEN};-webkit-text-stroke:6px {INK};paint-order:stroke fill}}
#cap p{{margin-top:22px;font-size:34px;line-height:1.3;color:#DCE4F0;text-wrap:balance}}
#shot{{position:absolute;left:50%;width:{CARD_W}px;transform:translateX(-50%) rotate(var(--tilt,0deg));top:{CARD_TOP}px;height:{CARD_H}px}}
#shot .print{{position:absolute;inset:0;transform:translate(16px,20px);background:{GREEN};border-radius:52px}}
#shot .card{{position:absolute;inset:0;border:{KEY}px solid {INK};border-radius:52px;overflow:hidden;background:#0B1622}}
#shot .card img{{position:absolute;left:0;width:100%;top:calc(var(--crop) * -1)}}
#sea{{position:absolute;left:0;right:0;bottom:0;height:{SEA_H}px}}
"""

def frame(key, head, sub, shot, crop, tilt, fonts):
    img = b64(os.path.join(SHOTS, shot + ".png"), "image/png")
    css = CSS.replace("%DISPLAY%", fonts[0]).replace("%BODY%", fonts[1])
    return f"""<!doctype html><html><head><meta charset=utf-8><title>{key}</title><style>{css}</style></head><body>
<div id="cap"><h1>{head}</h1><p>{sub}</p></div>
<div id="shot" style="--tilt:{tilt}deg;--crop:{crop * S:.1f}px"><div class="print"></div><div class="card"><img src="{img}"></div></div>
<div id="sea">{waves_svg()}</div>
</body></html>"""

# ---- the feature graphic, 1024 x 500 ----
# The owner turned down two scenes (the icon's swells scaled up, then a beach) as looking generated. So
# this one has no scenery. It is built from the product in the frames' own language, reading left to right:
# - the icon
# - the name and what the app does
# - the proof: a real slice of the app, the showcase binder's value and its most valuable cards, wearing
#   the frames' ink keyline and green offset print
# The ground is the frames' caption Prussian, flat.
FG_PROOF = ("03-home-value", 420, 292, 3.0)   # capture step, crop (shot px off the top), width, tilt (deg)
FG_CSS = f"""
@font-face{{font-family:D;src:url(%DISPLAY%)}} @font-face{{font-family:B;src:url(%BODY%)}}
*{{box-sizing:border-box;margin:0}} html,body{{width:1024px;height:500px;overflow:hidden}}
body{{background:{PRUSSIAN};position:relative;font-family:B,sans-serif}}
#icon{{position:absolute;left:64px;top:118px;width:264px;height:264px}}
#icon .print{{position:absolute;inset:0;transform:translate(12px,14px);background:{GREEN};border-radius:60px}}
#icon .tile{{position:absolute;inset:0;border:9px solid {INK};border-radius:60px;overflow:hidden;background:{BUFF}}}
#icon img{{width:100%;height:100%;display:block}}
#name{{position:absolute;left:364px;top:124px}}
#name h1{{font:80px/0.98 D;color:{CREAM};text-transform:uppercase;white-space:nowrap;
  text-shadow:6px 8px 0 {GREEN};-webkit-text-stroke:5px {INK};paint-order:stroke fill}}
#name p{{margin-top:16px;font-size:30px;line-height:1.32;color:#DCE4F0;font-weight:600}}
#proof{{position:absolute;left:684px;top:34px;width:%PW%px;height:560px;transform:rotate(%TILT%deg)}}
#proof .print{{position:absolute;inset:0;transform:translate(12px,14px);background:{GREEN};border-radius:34px}}
#proof .card{{position:absolute;inset:0;border:9px solid {INK};border-radius:34px;overflow:hidden;background:#0B1622}}
#proof .card img{{position:absolute;left:0;width:100%;top:%CROP%px}}
"""

def feature(icon_png, fonts):
    step, crop, width, tilt = FG_PROOF
    shot = b64(os.path.join(SHOTS, step + ".png"), "image/png")
    css = (FG_CSS.replace("%DISPLAY%", fonts[0]).replace("%BODY%", fonts[1]).replace("%PW%", str(width))
           .replace("%TILT%", str(tilt)).replace("%CROP%", f"{-crop * (width - 18) / SHOT_W:.1f}"))
    return f"""<!doctype html><html><head><meta charset=utf-8><title>feature</title><style>{css}</style></head><body>
<div id="icon"><div class="print"></div><div class="tile"><img src="{icon_png}"></div></div>
<div id="name"><h1>OP TCG<br>Hub</h1><p>Scan it. Value it.<br>Build it. Offline.</p></div>
<div id="proof"><div class="print"></div><div class="card"><img src="{shot}"></div></div></body></html>"""

if __name__ == "__main__":
    check_captions()
    if "--selftest" in sys.argv:
        selftest(); sys.exit(0)
    report = json.load(open(os.path.join(SHOTS, "report.json")))
    shown = guard(report["steps"], FRAMES)
    assert not shown, ("restricted words above the sea", shown)
    fonts = (b64(os.path.join(REPO, "assets", "fonts", "display.woff2"), "font/woff2"),
             b64(os.path.join(REPO, "assets", "fonts", "body.woff2"), "font/woff2"))
    os.makedirs(OUT, exist_ok=True)
    for i, (key, head, sub, shot, crop) in enumerate(FRAMES):
        open(os.path.join(OUT, key + ".html"), "w").write(frame(key, head, sub, shot, crop, -TILT if i % 2 else TILT, fonts))
    # the icon master: a given SVG (the owner's pick), else the public v4 in this repository
    icon = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "design", "d7-icons", "v4", "svg", "own-purple.svg")
    import cairosvg
    png = "data:image/png;base64," + base64.b64encode(cairosvg.svg2png(url=icon, output_width=600, output_height=600)).decode()
    open(os.path.join(OUT, "feature.html"), "w").write(feature(png, fonts))
    print(f"frames written: {len(FRAMES)} + feature; sea top {sea_top():.0f} px; no restricted word above it")
