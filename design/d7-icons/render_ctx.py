#!/usr/bin/env python3
"""Render every concept (and today's icon, the way ci/apk.sh builds it) into the
contexts a launcher icon actually lives in, as PNG tiles for the sheets:

  master-<slug>.png      the Play master, 512
  play-<slug>.png        the master under Play's own 20 % corner mask
  mask-<shape>-<slug>.png  the adaptive icon (bg + fg on 108 dp) under a launcher mask
  themed-<dark|light>-<slug>.png  the monochrome layer, tinted, as Android 13+ draws it
  stat-<slug>.png        the monochrome layer as a 24 dp status-bar glyph (white on alpha)

and measures the safe zone: the farthest opaque foreground pixel from the
centre, in dp (the 66 dp safe zone is r = 33 dp).
"""
import cairosvg, io, json, math, os
from PIL import Image, ImageDraw, ImageChops

import sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "svg")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "build", "tiles"); os.makedirs(OUT, exist_ok=True)
cs = json.load(open(f"{SRC}/concepts.json"))
SS = 4  # supersample for masks

def svg_png(path, w):
    return Image.open(io.BytesIO(cairosvg.svg2png(url=path, output_width=w, output_height=w))).convert("RGBA")

def mask(shape, s):
    S = s * SS; m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, S - 1, S - 1), fill=255)
    elif shape == "rounded":
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * .22), fill=255)
    elif shape == "play":
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * .30), fill=255)   # Google: "Radius will be equivalent to 30% of icon size."
    elif shape == "squircle":
        n = 4.2; pts = []
        for i in range(720):
            t = 2 * math.pi * i / 720; c, sn = math.cos(t), math.sin(t)
            x = abs(c) ** (2 / n) * (1 if c >= 0 else -1); y = abs(sn) ** (2 / n) * (1 if sn >= 0 else -1)
            pts.append(((x + 1) / 2 * (S - 1), (y + 1) / 2 * (S - 1)))
        d.polygon(pts, fill=255)
    elif shape == "teardrop":
        # round everywhere except the bottom-right quadrant, which keeps a small radius
        m2 = Image.new("L", (S, S), 0); d2 = ImageDraw.Draw(m2)
        d2.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * .16), fill=255)
        full = Image.new("L", (S, S), 0); df = ImageDraw.Draw(full)
        df.rounded_rectangle((0, 0, S - 1, S - 1), radius=S // 2, fill=255)
        q = Image.new("L", (S, S), 0); ImageDraw.Draw(q).rectangle((S // 2, S // 2, S - 1, S - 1), fill=255)
        m = ImageChops.lighter(ImageChops.multiply(full, ImageChops.invert(q)), ImageChops.multiply(m2, q))
    return m.resize((s, s), Image.LANCZOS)

def apply(img, shape, s):
    t = img.resize((s, s), Image.LANCZOS); t.putalpha(ImageChops.multiply(t.getchannel("A"), mask(shape, s))); return t

def viewport(adaptive768):
    """The launcher shows the central 72 dp of the 108 dp canvas."""
    return adaptive768.crop((128, 128, 640, 640))

# today's icon, as ci/apk.sh builds it: the whole rounded square at 66 % of a
# 1.5x canvas (so 0.99 of the viewport), on #05080A.
today = svg_png(os.path.join(ROOT, "assets", "icon.svg"), 1024)
today_ad = Image.new("RGBA", (768, 768), (5, 8, 10, 255))
inner = today.resize((int(768 * .66), int(768 * .66)), Image.LANCZOS)
today_ad.alpha_composite(inner, ((768 - inner.width) // 2, (768 - inner.height) // 2))
items = [dict(slug="today", master=today.resize((512, 512), Image.LANCZOS), adaptive=today_ad, mono=None)]
report = {}
for c in cs:
    s = c["slug"]
    bg = svg_png(f"{SRC}/{s}-bg.svg", 768); fg = svg_png(f"{SRC}/{s}-fg.svg", 768)
    ad = bg.copy(); ad.alpha_composite(fg)
    mono = svg_png(f"{SRC}/{s}-mono.svg", 768)
    items.append(dict(slug=s, master=svg_png(f"{SRC}/{s}.svg", 512), adaptive=ad, mono=mono))
    # safe zone: farthest foreground pixel with alpha > 40, glow excluded by threshold
    for layer, img in (("fg", fg), ("mono", mono)):
        a = img.getchannel("A").point(lambda v: 255 if v > 40 else 0)
        bbox_px = a.getbbox(); far = 0
        px = a.load()
        for y in range(0, 768, 2):
            for x in range(0, 768, 2):
                if px[x, y]:
                    far = max(far, math.hypot(x - 384, y - 384))
        report.setdefault(s, {})[layer] = round(far * 108 / 768, 1)

for it in items:
    s = it["slug"]; it["master"].save(f"{OUT}/master-{s}.png")
    apply(it["master"], "play", 192).save(f"{OUT}/play-{s}.png")
    vp = viewport(it["adaptive"])
    for shape in ("circle", "squircle", "rounded", "teardrop"):
        apply(vp, shape, 176).save(f"{OUT}/mask-{shape}-{s}.png")
    for size in (132, 72, 48, 36):
        apply(vp, "squircle", size).save(f"{OUT}/small{size}-{s}.png")
    apply(vp, "squircle", 176).convert("LA").save(f"{OUT}/grey-{s}.png")
    if it["mono"] is not None:
        alpha = viewport(it["mono"]).getchannel("A")
        for theme, (cont, tint) in {"dark": ((0x2A, 0x33, 0x40), (0xD3, 0xE3, 0xFD)),
                                    "light": ((0xD8, 0xE2, 0xF3), (0x1B, 0x2B, 0x44))}.items():
            base = Image.new("RGBA", (512, 512), cont + (255,))
            ink = Image.new("RGBA", (512, 512), tint + (255,)); ink.putalpha(alpha)
            base.alpha_composite(ink); apply(base, "circle", 176).save(f"{OUT}/themed-{theme}-{s}.png")
        # status bar: the silhouette, white, at 24 dp (72 px at xxhdpi, drawn at 48 here)
        stat_svg = f"{SRC}/{s}-stat.svg"
        if os.path.exists(stat_svg):   # a dedicated status-bar glyph wins over the monochrome layer
            svg_png(stat_svg, 96).resize((48, 48), Image.LANCZOS).save(f"{OUT}/stat-{s}.png")
        else:
            st = Image.new("RGBA", (512, 512), (255, 255, 255, 0)); w = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
            w.putalpha(alpha); st.alpha_composite(w); st.resize((48, 48), Image.LANCZOS).save(f"{OUT}/stat-{s}.png")

json.dump(report, open(f"{OUT}/safezone.json", "w"), indent=1)
print(json.dumps(report, indent=1))
