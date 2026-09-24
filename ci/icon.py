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

Until D7 was answered, ci/apk.sh shrank one square onto a colour: no real layers, and a foreground
rendered at two-thirds of its density. The reminders asked for `ic_launcher`, but
@capacitor/local-notifications 8.3.1 resolves smallIcon among drawables only
(LocalNotification.resolveSmallIcon), found nothing, and fell back to android.R.drawable.ic_dialog_info.
The glyph ships as drawable/ic_stat_don, and raw/keep.xml keeps it: shrinkResources is on
(ci/shrink.py), and a name that only the web layer spells is not a reference the shrinker can see
(landmine 141's shape). Every step asserts it landed (APEX landmine 99), and check() is the guard.
"""
import io, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
DENSITY = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
LEGACY_DP, ADAPTIVE_DP, STAT_DP = 48, 108, 24
SAFE_DP = 33.5           # the 66 dp safe circle's radius, plus half a dp of antialiasing (measured: fg 31.6)
RADIUS = 112 / 512       # the legacy icon's corner, as the take-12 placeholder drew it
SPLASH_BG = (11, 22, 34)
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


def write(res, play=None, assets=ASSETS, splash_bg=None):
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
    # The splash: the icon at 30% of the short side, on the app's background, for every splash the
    # template ships (until take 15 the first second of every launch was Capacitor's own art).
    # assets/user/splash-bg.jpg, if the owner supplied one (A18), goes under it: cover-fit, darkened.
    user = Image.open(splash_bg).convert("RGB") if splash_bg and os.path.exists(splash_bg) else None
    splashes = sorted(os.path.join(dp_, f) for dp_, _, fs in os.walk(res) for f in fs
                      if f == "splash.png" and os.path.basename(dp_).startswith("drawable"))
    for f in splashes:
        W, H = Image.open(f).size
        if user:
            r = max(W / user.width, H / user.height)
            fit = user.resize((int(user.width * r) + 1, int(user.height * r) + 1), Image.LANCZOS)
            x0, y0 = (fit.width - W) // 2, (fit.height - H) // 2
            canvas = Image.alpha_composite(fit.crop((x0, y0, x0 + W, y0 + H)).convert("RGBA"),
                                           Image.new("RGBA", (W, H), SPLASH_BG + (140,)))
        else:
            canvas = Image.new("RGBA", (W, H), SPLASH_BG + (255,))
        side = int(min(W, H) * 0.30)
        ic = square.resize((side, side), Image.LANCZOS)
        canvas.alpha_composite(ic, ((W - side) // 2, (H - side) // 2))
        canvas.convert("RGB").save(f)
    if play:
        os.makedirs(play, exist_ok=True)
        master.resize((512, 512), Image.LANCZOS).convert("RGB").save(os.path.join(play, "icon-512.png"))
    return {"splashes": len(splashes), "splash_over": bool(user)}


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
    import shutil, tempfile
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
            probs = check(r2, p2)
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
        # the owner's own splash picture (A18), when one exists, goes under the icon
        with tempfile.TemporaryDirectory() as d2:
            res2 = os.path.join(d2, "res"); fixture(res2)
            jpg = os.path.join(d2, "splash-bg.jpg"); Image.new("RGB", (900, 600), (200, 40, 40)).save(jpg)
            got = write(res2, splash_bg=jpg)
            corner = Image.open(os.path.join(res2, "drawable", "splash.png")).convert("RGB").getpixel((2, 2))
            verdict(f"a splash-bg.jpg goes under the icon, darkened (corner {corner})", got["splash_over"] and corner[0] > corner[2] + 40)
        app = open(os.path.join(ROOT, "src", "app.html"), encoding="utf8").read()
        verdict("src/app.html's reminders ask for the drawable this step writes (ic_stat_don)", asked(app) == [])
        verdict("control: a reminder asking for ic_launcher, a mipmap the plugin cannot see, is refused",
                asked(app.replace("smallIcon: 'ic_stat_don'", "smallIcon: 'ic_launcher'", 1)) == ["ic_launcher"])
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
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("icon.py controls:")
        raise SystemExit(0 if selftest() else 1)
    if len(sys.argv) not in (2, 3):
        print("usage: python3 ci/icon.py <android/app/src/main/res> [play-assets]   (or --selftest)"); raise SystemExit(2)
    res, play = sys.argv[1], (sys.argv[2] if len(sys.argv) == 3 else None)
    got = write(res, play, splash_bg=os.path.join(ASSETS, "user", "splash-bg.jpg"))
    probs = check(res, play)
    for p_ in probs:
        print("  " + p_)
    assert not probs, "the icon did not land (D7)"
    print(f"  launcher icon: legacy, round and adaptive (background, foreground; no themed layer) at {len(DENSITY)} densities, "
          f"from assets/icon*.svg; the reminders' glyph drawable/ic_stat_don, kept")
    print(f"  splash screens rendered ({got['splashes']})" + (" over assets/user/splash-bg.jpg" if got["splash_over"] else " on the app background"))
    if play:
        print(f"  {play}/icon-512.png: the full-bleed master")
