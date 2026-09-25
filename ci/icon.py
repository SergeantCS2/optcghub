#!/usr/bin/env python3
"""The launcher icon, the reminders' status-bar glyph, the splash and the Play icon (D7), rendered from
assets/icon*.svg at build time. PNGs are never committed: the four SVGs are the one source.

    python3 ci/icon.py android/app/src/main/res [play-assets]   # every density into the res tree
    python3 ci/icon.py --selftest                               # the controls, on a template-shaped
                                                                # fixture and Capacitor's own template

  assets/icon.svg        the 512 full-bleed master: the Play icon (Play rounds the corners itself), and,
                         masked, the legacy launcher icons (Android 7) and the splash
  assets/icon-bg.svg     the adaptive background, 108 dp
  assets/icon-fg.svg     the adaptive foreground, 108 dp, inside the 66 dp safe circle
  assets/icon-stat.svg   the reminders' status-bar glyph, white on transparent

One standard icon, and no themed variant: the owner, at take 113, on the sheet that showed the hand-off's
monochrome layer tinted as a phone with themed icons draws it -- "I just want the one standard icon".
So the adaptive icon has no <monochrome>, and check() refuses one anywhere in the res tree.

The launch image (take 116) is the store listing's frame -- the scene src/app.html's #splash draws: a
Prussian band carrying the word-mark, a buff sky, the app's card on a calm sea. write() paints it from
the page's own colours and sea, the word-mark and its line traced from the app's faces (fontTools; a
woff2 needs brotli), so the system splash, the window's launch image and the page are one picture, and
check() refuses a launch image that is not the scene. The band's colour is the system splash's ground
(ci/apk.sh writes it into the launch theme). The A18 slot for a launch picture of the owner's ended with the scene.

Until D7 was answered, ci/apk.sh shrank one square onto a colour: no real layers, and a foreground
rendered at two-thirds of its density. The reminders asked for `ic_launcher`, but
@capacitor/local-notifications 8.3.1 resolves smallIcon among drawables only
(LocalNotification.resolveSmallIcon), found nothing, and fell back to android.R.drawable.ic_dialog_info.
The glyph ships as drawable/ic_stat_don, and raw/keep.xml keeps it: shrinkResources is on
(ci/shrink.py), and a name that only the web layer spells is not a reference the shrinker can see
(landmine 141's shape). Every step asserts it landed (APEX landmine 99), and check() is the guard.
"""
import io, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
DENSITY = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
LEGACY_DP, ADAPTIVE_DP, STAT_DP = 48, 108, 24
SAFE_DP = 33.5           # the 66 dp safe circle's radius, plus half a dp of antialiasing (measured: fg 31.6)
RADIUS = 112 / 512       # the legacy icon's corner, as the take-12 placeholder drew it
SPLASH_BG = (31, 61, 114)   # the band's Prussian, #1f3d72: the launch image's top and the system splash's ground
SCENE = {"prussian": "#1f3d72", "sky": "#5f7ba8", "haze": "#d9dfe6", "buff": "#efd9a8", "buff2": "#f2e4c2",
         "ink": "#1E1A14", "green": "#2e9e5b", "cream": "#F6EEDA", "text": "#DCE4F0"}   # = the page's #splash,#tour --t-* tokens
WORDMARK, TAGLINE = "OP TCG HUB", "COLLECT \u00b7 PREP & PLAY \u00b7 HUNT"
ADAPTIVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""
KEEP_XML = """<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@drawable/ic_stat_don" />
"""
LAYERS = ("background", "foreground")


def px(dp, d):
    return round(dp * DENSITY[d])


def render(svg, size):
    import cairosvg
    from PIL import Image
    return Image.open(io.BytesIO(cairosvg.svg2png(url=svg, output_width=size, output_height=size))).convert("RGBA")


def font_path(role, assets=ASSETS):
    """The face the app ships for a role: the owner's under assets/user/fonts/ (A26), else the bundled one."""
    for ext in ("woff2", "ttf", "otf"):
        p = os.path.join(assets, "user", "fonts", f"{role}.{ext}")
        if os.path.exists(p):
            return p
    return os.path.join(assets, "fonts", f"{role}.woff2")


def trace(text, path, size, spacing=0.0, wght=None):
    """`text` set in the face at `path`, as one SVG path with the pen at (0, 0) on the baseline: fontTools'
    outlines, advanced by the font's widths plus `spacing` em; a variable face is instanced at `wght` first.
    No kerning (the build has no shaper), which on a caps word-mark is a hair. -> (d, width, ascent, descent)
    in px, the ascent and descent a line box is set from (hhea)."""
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = TTFont(path)
    if wght is not None and "fvar" in f:
        from fontTools.varLib import instancer
        f = instancer.instantiateVariableFont(f, {"wght": wght})
    gs, cmap, k = f.getGlyphSet(), f.getBestCmap(), size / f["head"].unitsPerEm
    d, x = [], 0.0
    for ch in text:
        name = cmap.get(ord(ch)); assert name, f"{os.path.basename(path)} has no glyph for {ch!r}"
        pen = SVGPathPen(gs); gs[name].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        if pen.getCommands():
            d.append(pen.getCommands())
        x += gs[name].width * k + spacing * size
    return " ".join(d), x - spacing * size, f["hhea"].ascent * k, -f["hhea"].descent * k


def sea(app_src):
    """The calm sea's waves, read off the page's own opening screen (one source): -> [(d, fill, opacity)] in
    the 411 x 100 box the page stretches over the foot of the screen."""
    m = re.search(r'<div id="splash".*?<div class="gsea"><svg[^>]*viewBox="0 0 411 100"[^>]*>(.*?)</svg>', app_src, re.S)
    assert m, "src/app.html: no sea (.gsea) on the opening screen"
    waves = re.findall(r'<path d="([^"]+)" fill="([^"]+)"(?: opacity="([^"]+)")?', m.group(1))
    assert len(waves) >= 4, "src/app.html: the sea has fewer waves than the page draws"
    return waves


def scene(W, H, icon_png_b64, app_src, assets=ASSETS):
    """The launch image as two SVG layers, the page's #splash at W x H: the ground (the gradient, the word-mark and
    its line) and, over the grain, the top (the tile and the sea). `u` is one of the page's CSS px on a 411-wide
    phone; a landscape image scales by its height instead, so the band, the tile and the sea keep their shares."""
    S = SCENE; u = min(W / 411, H / 616); f = lambda v: f"{v:.2f}"
    fs = 44 * u; d_wm, w_wm, asc, desc = trace(WORDMARK, font_path("display", assets), fs, 0.01)
    top = 0.13 * H; base = top + (1.02 * fs - (asc + desc)) / 2 + asc; x_wm = (W - w_wm) / 2
    ts = 13 * u; d_tg, w_tg, asc2, desc2 = trace(TAGLINE, font_path("heavy", assets), ts, 0.24, wght=800)
    base2 = top + 1.02 * fs + 14 * u + (1.45 * ts - (asc2 + desc2)) / 2 + asc2; x_tg = (W - w_tg) / 2
    side = min(200 * u, 0.48 * W); tx, ty, r, b = (W - side) / 2, 0.42 * H, 46 * u, 6 * u
    sea_h = 0.125 * H; sea_top = H - sea_h
    xy = lambda d: re.sub(r"(-?\d+\.?\d*) (-?\d+\.?\d*)", lambda m: f"{float(m[1]) * W / 411:.1f} {sea_top + float(m[2]) * sea_h / 100:.1f}", d)
    waves = "".join(f'<path d="{xy(d)}" fill="{fill}"' + (f' opacity="{op}"' if op else "") + "/>" for d, fill, op in sea(app_src))
    head = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
    ground = f'''{head}
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{S['prussian']}"/><stop offset=".31" stop-color="{S['prussian']}"/><stop offset=".37" stop-color="{S['sky']}"/><stop offset=".45" stop-color="{S['haze']}"/><stop offset=".56" stop-color="{S['buff']}"/><stop offset="1" stop-color="{S['buff2']}"/></linearGradient></defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<g transform="translate({f(x_wm + 5 * u)},{f(base + 6 * u)})"><path d="{d_wm}" fill="{S['green']}" stroke="{S['green']}" stroke-width="{f(3 * u)}" stroke-linejoin="round"/></g>
<g transform="translate({f(x_wm)},{f(base)})"><path d="{d_wm}" fill="{S['ink']}" stroke="{S['ink']}" stroke-width="{f(3 * u)}" stroke-linejoin="round"/><path d="{d_wm}" fill="{S['cream']}"/></g>
<g transform="translate({f(x_tg)},{f(base2)})"><path d="{d_tg}" fill="{S['text']}"/></g>
</svg>'''
    top = f'''{head}
<defs><clipPath id="tile"><rect x="{f(tx + b)}" y="{f(ty + b)}" width="{f(side - 2 * b)}" height="{f(side - 2 * b)}" rx="{f(r - b)}"/></clipPath></defs>
<rect x="{f(tx + 9 * u)}" y="{f(ty + 11 * u)}" width="{f(side)}" height="{f(side)}" rx="{f(r)}" fill="{S['green']}"/>
<rect x="{f(tx)}" y="{f(ty)}" width="{f(side)}" height="{f(side)}" rx="{f(r)}" fill="{S['buff']}"/>
<image x="{f(tx + b)}" y="{f(ty + b)}" width="{f(side - 2 * b)}" height="{f(side - 2 * b)}" clip-path="url(#tile)" xlink:href="data:image/png;base64,{icon_png_b64}"/>
<rect x="{f(tx + b / 2)}" y="{f(ty + b / 2)}" width="{f(side - b)}" height="{f(side - b)}" rx="{f(r - b / 2)}" fill="none" stroke="{S['ink']}" stroke-width="{f(b)}"/>
{waves}
</svg>'''
    return ground, top


def grain(img, u, from_y, fade):
    """The paper's screentone, as the page's ::after draws it: a faint ink dot every 7 px from the band's foot,
    fading in over the sky (`fade` px) -- under everything the top layer paints."""
    from PIL import Image, ImageDraw
    W, H = img.size; step = max(3, round(7 * u)); rad = max(0.6, u)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(layer)
    for y in range(int(from_y), H, step):
        a = round(33 * min(1.0, max(0.0, (y - from_y) / fade)))
        if a <= 0:
            continue
        for x in range(0, W, step):
            dr.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(30, 26, 20, a))
    return Image.alpha_composite(img, layer)


def splash(W, H, master, app_src, assets=ASSETS):
    """One launch image, W x H: the ground rendered by cairosvg, the grain fading in from the band's foot, then the
    top layer -- the icon (the full-bleed master, cut by the tile's corners) in the tile, and the sea."""
    import base64, cairosvg
    from PIL import Image
    u = min(W / 411, H / 616); side = max(8, round(min(200 * u, 0.48 * W) - 12 * u))
    buf = io.BytesIO(); master.resize((side, side), Image.LANCZOS).save(buf, "PNG")
    ground, top = scene(W, H, base64.b64encode(buf.getvalue()).decode("ascii"), app_src, assets)
    draw = lambda svg: Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode("utf8"), output_width=W, output_height=H))).convert("RGBA")
    img = grain(draw(ground), u, 0.31 * H, 160 * u)
    return Image.alpha_composite(img, draw(top)).convert("RGB")


def masked(img, shape):
    """The master cut to a rounded square or a circle, drawn at 4x and brought down for a clean edge."""
    from PIL import Image, ImageDraw
    big = img.size[0] * 4
    m = Image.new("L", (big, big), 0)
    if shape == "circle":
        ImageDraw.Draw(m).ellipse((0, 0, big - 1, big - 1), fill=255)
    else:
        ImageDraw.Draw(m).rounded_rectangle((0, 0, big - 1, big - 1), radius=round(big * RADIUS), fill=255)
    out = img.copy()
    out.putalpha(Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), m.resize(img.size, Image.LANCZOS)))
    return out


def write(res, play=None, assets=ASSETS):
    """Render every icon into the Android res tree (and the Play icon into `play`); -> what it wrote."""
    from PIL import Image
    svg = {k: os.path.join(assets, f"icon{k}.svg") for k in ("", "-bg", "-fg", "-stat")}
    for p in svg.values():
        assert os.path.exists(p), f"{p} is missing: the icon has four files"
    master = render(svg[""], 1024)
    square, circle = masked(master, "square"), masked(master, "circle")
    for d in DENSITY:
        mm = os.path.join(res, f"mipmap-{d}"); os.makedirs(mm, exist_ok=True)
        dr = os.path.join(res, f"drawable-{d}"); os.makedirs(dr, exist_ok=True)
        s = px(LEGACY_DP, d)
        square.resize((s, s), Image.LANCZOS).save(os.path.join(mm, "ic_launcher.png"))
        circle.resize((s, s), Image.LANCZOS).save(os.path.join(mm, "ic_launcher_round.png"))
        for layer, k in zip(LAYERS, ("-bg", "-fg")):
            render(svg[k], px(ADAPTIVE_DP, d)).save(os.path.join(mm, f"ic_launcher_{layer}.png"))
        render(svg["-stat"], px(STAT_DP, d)).save(os.path.join(dr, "ic_stat_don.png"))
    v26 = os.path.join(res, "mipmap-anydpi-v26"); os.makedirs(v26, exist_ok=True)
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        open(os.path.join(v26, name), "w").write(ADAPTIVE_XML)
    os.makedirs(os.path.join(res, "raw"), exist_ok=True)
    open(os.path.join(res, "raw", "keep.xml"), "w").write(KEEP_XML)
    # The launch image (take 116): the listing's frame, the scene the page's own #splash draws, at every size
    # the template ships (until take 15 the first second of every launch was Capacitor's own art).
    app_src = open(os.path.join(ROOT, "src", "app.html"), encoding="utf8").read()
    splashes = sorted(os.path.join(dp_, f) for dp_, _, fs in os.walk(res) for f in fs
                      if f == "splash.png" and os.path.basename(dp_).startswith("drawable"))
    for f in splashes:
        W, H = Image.open(f).size
        splash(W, H, master, app_src, assets).save(f)
    if play:
        os.makedirs(play, exist_ok=True)
        master.resize((512, 512), Image.LANCZOS).convert("RGB").save(os.path.join(play, "icon-512.png"))
    return {"splashes": len(splashes)}


def pixels(img):
    """(r, g, b, a) per pixel, from the bytes (Pillow 12 deprecates getdata)."""
    b = img.convert("RGBA").tobytes()
    return zip(b[0::4], b[1::4], b[2::4], b[3::4])


def reach_dp(img):
    """How far from the centre, in dp, the layer's visible pixels reach."""
    a = img.getchannel("A"); w = img.size[0]; c = (w - 1) / 2; pix = a.load(); far = 0.0
    for y in range(w):
        for x in range(w):
            if pix[x, y] > 8:
                far = max(far, math.hypot(x - c, y - c))
    return far * ADAPTIVE_DP / w


def check(res, play=None):
    """-> [] when every icon the build needs is in the res tree and each layer is what Android expects."""
    from PIL import Image
    bad = []
    def load(path, size):
        if not os.path.exists(path):
            bad.append(f"{os.path.relpath(path, res)}: missing"); return None
        im = Image.open(path).convert("RGBA")
        if im.size != (size, size):
            bad.append(f"{os.path.relpath(path, res)}: {im.size[0]}x{im.size[1]}, not {size}x{size}"); return None
        return im
    for d in DENSITY:
        mm, dr = os.path.join(res, f"mipmap-{d}"), os.path.join(res, f"drawable-{d}")
        for name in ("ic_launcher", "ic_launcher_round"):
            im = load(os.path.join(mm, name + ".png"), px(LEGACY_DP, d))
            if im is not None and not (im.getpixel((0, 0))[3] == 0 and im.getpixel((im.size[0] // 2,) * 2)[3] == 255):
                bad.append(f"mipmap-{d}/{name}.png: not masked (its corner is not clear, or its centre is not solid)")
        bg = load(os.path.join(mm, "ic_launcher_background.png"), px(ADAPTIVE_DP, d))
        if bg is not None and bg.getchannel("A").getextrema()[0] < 255:
            bad.append(f"mipmap-{d}/ic_launcher_background.png: has holes (the wallpaper would show through)")
        fg = load(os.path.join(mm, "ic_launcher_foreground.png"), px(ADAPTIVE_DP, d))
        if fg is not None:
            if fg.getchannel("A").getextrema()[1] == 0:
                bad.append(f"mipmap-{d}/ic_launcher_foreground.png: empty")
            elif (r := reach_dp(fg)) > SAFE_DP:
                bad.append(f"mipmap-{d}/ic_launcher_foreground.png: reaches {r:.1f} dp from the centre, past the 66 dp safe circle (the mask cuts it)")
        st = load(os.path.join(dr, "ic_stat_don.png"), px(STAT_DP, d))
        if st is not None:
            ink = [p for p in pixels(st) if p[3] > 32]
            if not ink or len(ink) > 0.8 * st.size[0] ** 2:
                bad.append(f"drawable-{d}/ic_stat_don.png: {'empty' if not ink else 'a filled square'}, not a glyph")
            elif min(min(p[:3]) for p in ink) < 240:
                bad.append(f"drawable-{d}/ic_stat_don.png: not white on transparent (a status-bar icon is its alpha only)")
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        p = os.path.join(res, "mipmap-anydpi-v26", name)
        x = open(p).read() if os.path.exists(p) else ""
        for layer in LAYERS:
            if f'<{layer} android:drawable="@mipmap/ic_launcher_{layer}"/>' not in x:
                bad.append(f"mipmap-anydpi-v26/{name}: no <{layer}> on @mipmap/ic_launcher_{layer}")
    # the owner's word (take 113): one standard icon, so no themed layer for a phone to recolour --
    # not as a picture in any density, not as a line in any launcher XML, wherever it is put
    for dp_, dirs, fs in os.walk(res):
        dirs.sort()
        for f in sorted(fs):
            p = os.path.join(dp_, f)
            if f.startswith("ic_launcher_monochrome"):
                bad.append(f"{os.path.relpath(p, res)}: a themed (monochrome) layer; the owner wants the one standard icon (take 113)")
            elif f.endswith(".xml") and "<monochrome" in open(p, encoding="utf8", errors="replace").read():
                bad.append(f"{os.path.relpath(p, res)}: carries <monochrome>, a themed variant; the owner wants the one standard icon (take 113)")
    # the launch image is the listing's frame (take 116): the band's colour at the top, the word-mark's ink in
    # the band, the sea's blue at the foot -- whatever the picture's size or orientation
    for f in sorted(os.path.join(dp_, f) for dp_, _, fs in os.walk(res) for f in fs if f == "splash.png" and os.path.basename(dp_).startswith("drawable")):
        im = Image.open(f).convert("RGB"); W, H = im.size; rel = os.path.relpath(f, res); corner = im.getpixel((2, 2))
        if max(abs(a - b) for a, b in zip(corner, SPLASH_BG)) > 12:
            bad.append(f"{rel}: the top corner is {corner}, not the band's {SPLASH_BG} (the launch image is the listing's frame, take 116)")
        band = im.crop((0, int(H * 0.10), W, int(H * 0.30)))
        if sum(1 for p_ in pixels(band) if max(p_[:3]) < 70) < 0.002 * band.size[0] * band.size[1]:
            bad.append(f"{rel}: no word-mark in the band (no ink between 10 % and 30 % of the height)")
        foot = im.crop((0, int(H * 0.92), W, H))
        if sum(1 for p_ in pixels(foot) if p_[2] > p_[0] + 40 and p_[2] > 70) < 0.05 * foot.size[0] * foot.size[1]:
            bad.append(f"{rel}: no sea at the foot (no blue in the last 8 % of the height)")
    p = os.path.join(res, "raw", "keep.xml")
    if not (os.path.exists(p) and "@drawable/ic_stat_don" in open(p).read()):
        bad.append("raw/keep.xml: does not keep @drawable/ic_stat_don (shrinkResources would drop it)")
    if play:
        im = load(os.path.join(play, "icon-512.png"), 512)
        if im is not None and im.getchannel("A").getextrema()[0] < 255:
            bad.append("play icon-512.png: not full-bleed (Play rounds the corners itself)")
    return bad


def asked(app_src):
    """The drawables the app's reminders ask the notification plugin for (smallIcon), against what
    write() puts in drawable-*: -> the names it asks for that the build does not write."""
    import re
    names = set(re.findall(r"smallIcon:\s*'([^']+)'", app_src))
    return sorted(names - {"ic_stat_don"}) if names else ["(no smallIcon at all: the plugin's default is the system's info icon)"]


# --------------------------------------------------------------------------
# The template's icon resources, as Capacitor 8's android-template.tar.gz ships them (the adaptive
# XMLs on a colour, no monochrome), for when node_modules does not carry the real template.
TEMPLATE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>"""


def fixture(res):
    from PIL import Image
    os.makedirs(os.path.join(res, "mipmap-anydpi-v26"))
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        open(os.path.join(res, "mipmap-anydpi-v26", name), "w").write(TEMPLATE_XML)
    for sub, size in (("drawable", (480, 320)), ("drawable-port-mdpi", (320, 480)), ("drawable-land-xhdpi", (1280, 720))):
        os.makedirs(os.path.join(res, sub)); Image.new("RGB", size, (255, 255, 255)).save(os.path.join(res, sub, "splash.png"))


def template(res):
    """Capacitor's own template's res tree, when node_modules has it (or $OPTCGHUB_CAP_TEMPLATE names it)."""
    import tarfile
    tgz = os.environ.get("OPTCGHUB_CAP_TEMPLATE") or os.path.join(ROOT, "node_modules", "@capacitor", "cli", "assets", "android-template.tar.gz")
    if not os.path.exists(tgz):
        return False
    with tarfile.open(tgz) as tf:
        for m in tf.getmembers():
            if m.isfile() and m.name.startswith("app/src/main/res/"):
                out = os.path.join(res, m.name[len("app/src/main/res/"):])
                os.makedirs(os.path.dirname(out), exist_ok=True)
                open(out, "wb").write(tf.extractfile(m).read())
    return True


def selftest():
    import re, shutil, tempfile
    from PIL import Image
    ok = True
    def verdict(name, good):
        nonlocal ok
        ok &= bool(good); print(f"  {'ok  ' if good else 'FAIL'}  {name}")
    def refused(label, res, play, mutate, expect):
        with tempfile.TemporaryDirectory() as d:
            r2, p2 = os.path.join(d, "res"), os.path.join(d, "play")
            shutil.copytree(res, r2); shutil.copytree(play, p2)
            mutate(r2, p2)
            try:
                probs = check(r2, p2)
            except Exception as e:                        # noqa: BLE001   a check that crashes on the fault has not refused it
                probs = [f"check() raised {type(e).__name__}: {e}"]
            verdict(f"control: {label} is refused", any(expect in p for p in probs))
    with tempfile.TemporaryDirectory() as d:
        sources = [("the fixture", "fixture", fixture)]
        if template(os.path.join(d, "probe")):
            sources.append(("Capacitor's own template", "template", template))
        for label, sub, make in sources:
            res, play = os.path.join(d, sub, "res"), os.path.join(d, sub, "play")
            make(res)
            before = check(res, play)
            verdict(f"{label}: control: the template's own icons, before this step, are refused ({len(before)} problems)",
                    any("no <background>" in p for p in before) and any("keep.xml" in p for p in before))
            got = write(res, play)
            probs = check(res, play)
            verdict(f"{label}: after the step, every icon passes" + (f" -- {probs[:3]}" if probs else ""), not probs)
            verdict(f"{label}: every splash the template ships was redrawn ({got['splashes']})", got["splashes"] >= 3)
            snap = {os.path.join(dp_, f): open(os.path.join(dp_, f), "rb").read() for dp_, _, fs in os.walk(res) for f in fs if not f.startswith("splash")}
            write(res, play)
            again = {os.path.join(dp_, f): open(os.path.join(dp_, f), "rb").read() for dp_, _, fs in os.walk(res) for f in fs if not f.startswith("splash")}
            verdict(f"{label}: a second run writes the same icons", snap == again)
        # the launch image (take 116): the listing's frame at every size the template ships, portrait and landscape
        for sub, (W, H) in (("drawable", (480, 320)), ("drawable-port-mdpi", (320, 480)), ("drawable-land-xhdpi", (1280, 720))):
            im = Image.open(os.path.join(d, "fixture", "res", sub, "splash.png")).convert("RGB")
            buff = im.getpixel((int(W * 0.08), int(H * 0.80)))
            verdict(f"{sub}, {W}x{H}: the scene -- the band's Prussian at the top, the buff at four-fifths {buff}",
                    max(abs(a - b) for a, b in zip(im.getpixel((2, 2)), SPLASH_BG)) <= 12 and buff[0] > 225 and buff[2] < 205 and buff[0] > buff[2] + 30)
        app = open(os.path.join(ROOT, "src", "app.html"), encoding="utf8").read()
        verdict("src/app.html's reminders ask for the drawable this step writes (ic_stat_don)", asked(app) == [])
        verdict("control: a reminder asking for ic_launcher, a mipmap the plugin cannot see, is refused",
                asked(app.replace("smallIcon: 'ic_stat_don'", "smallIcon: 'ic_launcher'", 1)) == ["ic_launcher"])
        # take 115: reminders that name no smallIcon at all get the plugin's default -- the sabotage proved to land (landmine 55)
        named = re.compile(r"smallIcon:\s*'[^']*',?\s*")
        bare = named.sub("", app)
        verdict(f"control: reminders that name no smallIcon at all (the plugin's default, the system's info icon) are refused ({len(named.findall(app))} stripped)",
                named.findall(app) and not named.findall(bare) and asked(bare)[:1] != [] and asked(bare)[0].startswith("(no smallIcon"))
        # the controls, each on a copy of the fixture's passing output
        res, play = os.path.join(d, "fixture", "res"), os.path.join(d, "fixture", "play")
        old = os.path.join(ASSETS, "icon-placeholder.old.svg")
        def with_layer(src, layer, dp):
            def m(r2, p2):
                for dd in DENSITY:
                    render(src, px(dp, dd)).save(os.path.join(r2, f"{'drawable' if layer == 'ic_stat_don' else 'mipmap'}-{dd}", layer + ".png"))
            return m
        refused("the take-16 compass placeholder as the foreground (the whole square)", res, play,
                with_layer(old, "ic_launcher_foreground", ADAPTIVE_DP), "past the 66 dp safe circle")
        # the launch image, three ways it is not the scene (take 116)
        def old_splash(r2, p2):
            Image.new("RGB", (480, 320), (11, 22, 34)).save(os.path.join(r2, "drawable", "splash.png"))
        def blank_band(r2, p2):
            from PIL import ImageDraw
            p_ = os.path.join(r2, "drawable", "splash.png"); im = Image.open(p_).convert("RGB")
            ImageDraw.Draw(im).rectangle((0, 0, 480, 100), fill=SPLASH_BG); im.save(p_)
        def no_sea(r2, p2):
            from PIL import ImageDraw
            p_ = os.path.join(r2, "drawable", "splash.png"); im = Image.open(p_).convert("RGB")
            ImageDraw.Draw(im).rectangle((0, 280, 480, 320), fill=(242, 228, 194)); im.save(p_)
        refused("the take-114 launch image (one dark colour under the icon)", res, play, old_splash, "not the band's")
        refused("a launch image with the band but no word-mark in it", res, play, blank_band, "no word-mark")
        refused("a launch image whose foot is buff, not the sea", res, play, no_sea, "no sea")
        # the owner's word (take 113): one standard icon -- the hand-off's themed layer, put back three ways
        themed = ADAPTIVE_XML.replace("</adaptive-icon>", '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>')
        def xml_at(sub):
            def m(r2, p2):
                os.makedirs(os.path.join(r2, sub), exist_ok=True)
                open(os.path.join(r2, sub, "ic_launcher.xml"), "w").write(themed)
            return m
        refused("a monochrome layer back in the res tree (a themed variant)", res, play,
                with_layer(os.path.join(ASSETS, "icon-fg.svg"), "ic_launcher_monochrome", ADAPTIVE_DP), "a themed (monochrome) layer")
        refused("the hand-off's launcher XML, with its <monochrome> line", res, play, xml_at("mipmap-anydpi-v26"), "carries <monochrome>")
        refused("a <monochrome> line in a launcher XML check() never names (mipmap-anydpi-v33)", res, play, xml_at("mipmap-anydpi-v33"), "carries <monochrome>")
        refused("the coloured foreground as the status-bar glyph", res, play,
                with_layer(os.path.join(ASSETS, "icon-fg.svg"), "ic_stat_don", STAT_DP), "not white on transparent")
        refused("a filled square as the status-bar glyph", res, play,
                lambda r2, p2: Image.new("RGBA", (24, 24), (255, 255, 255, 255)).save(os.path.join(r2, "drawable-mdpi", "ic_stat_don.png")), "a filled square")
        refused("the template's adaptive XML (the background a colour)", res, play,
                lambda r2, p2: open(os.path.join(r2, "mipmap-anydpi-v26", "ic_launcher_round.xml"), "w").write(TEMPLATE_XML), "no <background>")
        refused("a build without raw/keep.xml", res, play,
                lambda r2, p2: os.remove(os.path.join(r2, "raw", "keep.xml")), "keep.xml")
        refused("a background layer with a hole", res, play,
                lambda r2, p2: masked(Image.open(os.path.join(r2, "mipmap-hdpi", "ic_launcher_background.png")).convert("RGBA"), "circle").save(os.path.join(r2, "mipmap-hdpi", "ic_launcher_background.png")), "has holes")
        refused("a density rendered at the wrong size (the old foreground: 1.5 x 48 px at mdpi)", res, play,
                lambda r2, p2: Image.new("RGBA", (72, 72)).save(os.path.join(r2, "mipmap-mdpi", "ic_launcher_foreground.png")), "not 108x108")
        refused("a missing density", res, play,
                lambda r2, p2: os.remove(os.path.join(r2, "drawable-xxxhdpi", "ic_stat_don.png")), "missing")
        refused("an unmasked legacy icon (the square as the round icon)", res, play,
                lambda r2, p2: Image.open(os.path.join(r2, "mipmap-xhdpi", "ic_launcher_background.png")).resize((96, 96)).save(os.path.join(r2, "mipmap-xhdpi", "ic_launcher_round.png")), "not masked")
        refused("a Play icon with rounded corners baked in", res, play,
                lambda r2, p2: masked(Image.open(os.path.join(p2, "icon-512.png")).convert("RGBA"), "square").save(os.path.join(p2, "icon-512.png")), "not full-bleed")
        # take 115: the two empty-layer refusals, each fed the fault itself (the right size, nothing drawn)
        refused("an empty foreground (an SVG that rendered to nothing: a clear 108 px layer)", res, play,
                lambda r2, p2: Image.new("RGBA", (px(ADAPTIVE_DP, "mdpi"),) * 2, (0, 0, 0, 0)).save(os.path.join(r2, "mipmap-mdpi", "ic_launcher_foreground.png")), "ic_launcher_foreground.png: empty")
        refused("an empty status-bar glyph (a clear 24 px square)", res, play,
                lambda r2, p2: Image.new("RGBA", (px(STAT_DP, "mdpi"),) * 2, (0, 0, 0, 0)).save(os.path.join(r2, "drawable-mdpi", "ic_stat_don.png")), "ic_stat_don.png: empty")
        # ...and write() refuses an assets dir short of one of the four files, before it renders anything
        with tempfile.TemporaryDirectory() as d3:
            short, res3 = os.path.join(d3, "assets"), os.path.join(d3, "res")
            os.makedirs(short); fixture(res3)
            for k in ("", "-bg", "-stat"):
                shutil.copy(os.path.join(ASSETS, f"icon{k}.svg"), short)
            try:
                write(res3, assets=short); why = ""
            except Exception as e:                        # noqa: BLE001   the refusal is the assert; anything else is the render failing on the gap
                why = f"{type(e).__name__}: {e}"
            drew = sorted(f for _, _, fs in os.walk(res3) for f in fs if f.startswith("ic_") and f.endswith(".png"))   # the fixture's own XMLs are not drawn
            verdict(f"control: an assets dir without icon-fg.svg is refused before anything is drawn ({drew or 'nothing drawn'})",
                    "icon-fg.svg is missing: the icon has four files" in why and not drew)
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("icon.py controls:")
        raise SystemExit(0 if selftest() else 1)
    if len(sys.argv) not in (2, 3):
        print("usage: python3 ci/icon.py <android/app/src/main/res> [play-assets]   (or --selftest)"); raise SystemExit(2)
    res, play = sys.argv[1], (sys.argv[2] if len(sys.argv) == 3 else None)
    got = write(res, play)
    probs = check(res, play)
    for p_ in probs:
        print("  " + p_)
    assert not probs, "the icon did not land (D7)"
    print(f"  launcher icon: legacy, round and adaptive (background, foreground; no themed layer) at {len(DENSITY)} densities, "
          f"from assets/icon*.svg; the reminders' glyph drawable/ic_stat_don, kept")
    print(f"  launch image: the listing's frame, {got['splashes']} sizes (take 116)")
    if play:
        print(f"  {play}/icon-512.png: the full-bleed master")
