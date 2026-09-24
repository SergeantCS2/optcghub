#!/usr/bin/env python3
"""Two phone-width review sheets for the one direction: the mark itself, and the
mark wherever an Android icon lives. Neighbouring icons are neutral stand-ins,
never another app's."""
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
BUILD = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "build")

def font(name):
    return base64.b64encode(open(os.path.join(ROOT, "assets", "fonts", name + ".woff2"), "rb").read()).decode()

T = "tiles"; S = "don-panel"   # the sheets sit in BUILD and read BUILD/tiles
safe = json.load(open(os.path.join(BUILD, T, "safezone.json")))[S]

CSS = """
@font-face{font-family:D;src:url(data:font/woff2;base64,@@D@@)}
@font-face{font-family:B;src:url(data:font/woff2;base64,@@B@@)}
*{box-sizing:border-box;margin:0}
body{width:1080px;background:#0B1622;color:#EADFC8;font:24px/1.4 B,sans-serif;padding:56px 48px 64px}
.eyebrow{display:inline-block;font:22px D;letter-spacing:.06em;color:#C9A24A;border:3px solid #C9A24A;border-radius:999px;padding:6px 22px 2px}
h1{font:76px/1.0 D;margin:22px 0 16px}
h2{font:34px D;color:#C9A24A;margin:46px 0 16px;letter-spacing:.02em}
.lede{color:#CDBF9F;font-size:25px}
.dim{color:#A08E70;font-size:21px;margin-top:10px}
.hero{display:flex;justify-content:center;margin:34px 0 8px}
.hero img{width:560px;height:560px}
.row{display:flex;gap:18px;align-items:center;justify-content:center;border-radius:24px;padding:22px}
.dark{background:#050C14}.light{background:#EDE7DA}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.cmp{display:flex;flex-direction:column;align-items:center;gap:10px;font-size:20px;color:#A08E70}
.wall{border-radius:28px;padding:30px 20px 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px 6px;text-align:center}
.wall .ic{width:104px;height:104px;margin:0 auto;border-radius:32%;display:flex;align-items:center;justify-content:center}
.wall img{width:104px;height:104px;display:block;margin:0 auto}
.wall .lbl{font:17px B;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wall.dk{background:radial-gradient(120% 90% at 20% 0%,#3B4E78 0%,#1A2238 55%,#0E1322 100%)}
.wall.dk .lbl{color:#F2F2F2}
.wall.lt{background:radial-gradient(120% 90% at 80% 0%,#FFF4E0 0%,#F1D9C2 50%,#D9C7E6 100%)}
.wall.lt .lbl{color:#2A2A2A}
.glyph{width:44px;height:44px;border:6px solid rgba(255,255,255,.9)}
.lcard{border-radius:24px;padding:22px;display:flex;flex-direction:column;gap:16px}
.lcard.w{background:#fff;color:#1F1F1F}.lcard.k{background:#1F1F1F;color:#E8E8E8}
.lrow{display:flex;gap:18px;align-items:center}
.lrow img{width:112px;height:112px}
.lrow b{font:600 25px B;display:block}.lrow i{font-style:normal;font-size:18px;opacity:.7}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;background:linear-gradient(135deg,#71849F,#4B5A75);border-radius:22px;padding:18px 8px 12px}
.grid img{width:176px;height:176px}
.cap{font-size:18px;color:#EEF2F7;margin-top:4px}
.shade{background:#1B1F24;border-radius:26px;padding:18px 22px;display:flex;flex-direction:column;gap:14px}
.sbar{display:flex;align-items:center;gap:18px;color:#fff;font:24px B}
.note{background:#2A3038;border-radius:20px;padding:16px 20px;display:flex;gap:16px;align-items:center}
.note .t{font:600 21px B;color:#E8E8E8}.note .s{font-size:18px;color:#AEB6C0}
.tagx{font-size:16px;color:#9AA3AD;margin-left:auto}
"""

def page(title, body):
    css = CSS.replace("@@D@@", font("display")).replace("@@B@@", font("body"))
    return f"<!doctype html><html><head><meta charset=utf-8><title>{title}</title><style>{css}</style></head><body>{body}</body></html>"

# ------------------------------------------------------------ sheet 1: the mark
b = ('<span class="eyebrow">D7 &middot; ONE DIRECTION</span>'
     '<h1>THE DON!! PANEL</h1>'
     '<p class="lede">A manga panel: aged paper, focus lines, screentone at the edges. One card at the centre, the unit this app counts. '
     'Across it, <b>ドン!!</b>: the sound effect the game&rsquo;s DON!! is named after, drawn here by hand.</p>'
     f'<div class="hero"><img src="{T}/play-{S}.png"></div>'
     '<p class="dim" style="text-align:center">The Play master under Play&rsquo;s own 30&thinsp;% corner. No character, no publisher mark, no crew flag.</p>'
     '<h2>EVERY SIZE</h2><div class="pair">'
     f'<div class="row dark"><img src="{T}/small132-{S}.png" width=132><img src="{T}/small72-{S}.png" width=72><img src="{T}/small48-{S}.png" width=48><img src="{T}/small36-{S}.png" width=36></div>'
     f'<div class="row light"><img src="{T}/small132-{S}.png" width=132><img src="{T}/small72-{S}.png" width=72><img src="{T}/small48-{S}.png" width=48><img src="{T}/small36-{S}.png" width=36></div></div>'
     '<h2>TODAY, THEN THIS</h2><div class="pair">'
     f'<div class="row dark"><div class="cmp"><img src="{T}/small132-today.png" width=132>today</div><div class="cmp"><img src="{T}/small132-{S}.png" width=132>the DON!! panel</div></div>'
     f'<div class="row light"><div class="cmp"><img src="{T}/small132-today.png" width=132>today</div><div class="cmp"><img src="{T}/small132-{S}.png" width=132>the DON!! panel</div></div></div>'
     f'<p class="dim">Measured: the mark reaches {safe["fg"]} dp from the centre and its monochrome layer {safe["mono"]} dp; '
     'the safe zone every launcher keeps is 33 dp, so no mask clips it.</p>')
open(os.path.join(BUILD, "don-sheet-1.html"), "w").write(page("The DON!! panel", b))

# ------------------------------------------------------------ sheet 2: in context
STAND = [("#3E7CB1", "Photos"), ("#4C9A6A", "Maps"), ("#C0564B", "Music"), ("#8E6BB8", "Notes"),
         ("#D19A3A", "Weather"), ("#5F6B7A", "Settings"), ("#2E8C8C", "Files")]
def wall(kind):
    w = f'<div class="wall {kind}">'
    for i, (col, lbl) in enumerate(STAND[:3]):
        w += f'<div><div class="ic" style="background:{col}"><div class="glyph" style="border-radius:{["50%","8px","50% 50% 8px 50%"][i]}"></div></div><div class="lbl">{lbl}</div></div>'
    w += f'<div><img src="{T}/mask-squircle-{S}.png"><div class="lbl">OP TCG Hub</div></div>'
    for i, (col, lbl) in enumerate(STAND[3:]):
        w += f'<div><div class="ic" style="background:{col}"><div class="glyph" style="border-radius:{["8px","50%","8px 50%","50%"][i]}"></div></div><div class="lbl">{lbl}</div></div>'
    w += f'<div><img src="{T}/mask-squircle-today.png"><div class="lbl">today&rsquo;s icon</div></div>'
    return w + "</div>"
info = ('<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A24A" stroke-width="2">'
        '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5" stroke-linecap="round"/></svg>')
def tint(img_src):   # the status icon as Android draws it: the alpha, in the app's iconColor
    img_src = "data:image/png;base64," + base64.b64encode(open(os.path.join(BUILD, img_src), "rb").read()).decode()
    return (f'<div style="width:40px;height:40px;background:#C9A24A;-webkit-mask:url({img_src}) center/contain no-repeat;'
            f'mask:url({img_src}) center/contain no-repeat"></div>')
b = ('<span class="eyebrow">D7 &middot; IN CONTEXT</span><h1>ON THE PHONE</h1>'
     '<p class="lede">Among other icons (neutral stand-ins), under a Samsung-style squircle, on a dark and a light wallpaper.</p>'
     '<h2>HOME SCREEN</h2><div class="pair">' + wall("dk") + wall("lt") + '</div>'
     '<h2>PLAY LISTING</h2><div class="pair">')
for k in ("w", "k"):
    b += (f'<div class="lcard {k}"><div class="lrow"><img src="{T}/play-{S}.png"><div><b>OP TCG Hub</b><i>the DON!! panel</i></div></div>'
          f'<div class="lrow"><img src="{T}/play-today.png"><div><b>OP TCG Hub</b><i>today</i></div></div></div>')
b += ('</div><h2>EVERY LAUNCHER SHAPE, EVERY THEME</h2><div class="grid">'
      + "".join(f'<div><img src="{T}/mask-{m}-{S}.png"><div class="cap">{m}</div></div>' for m in ("circle", "squircle", "rounded", "teardrop"))
      + f'<div><img src="{T}/themed-dark-{S}.png"><div class="cap">themed, dark</div></div>'
      + f'<div><img src="{T}/themed-light-{S}.png"><div class="cap">themed, light</div></div>'
      + f'<div><img src="{T}/grey-{S}.png"><div class="cap">greyscale</div></div>'
      + f'<div><img src="{T}/grey-today.png"><div class="cap">greyscale, today</div></div></div>'
      '<h2>STATUS BAR AND SHADE</h2>'
      '<p class="lede" style="font-size:22px">A price alert or reminder shows the app&rsquo;s small icon, tinted brass. Today the app asks for '
      '<code>ic_launcher</code>, which the plugin only looks for among drawables, so it falls back to Android&rsquo;s info glyph '
      '(read from the plugin&rsquo;s source, not yet seen on the Fold). The monochrome layer is ready to be that icon.</p>'
      '<div class="pair" style="margin-top:16px">'
      f'<div class="shade"><div class="sbar">9:41 {info}<span class="tagx">today, as the code reads</span></div>'
      f'<div class="note">{info}<div><div class="t">OP TCG Hub &middot; Price alert</div><div class="s">A card you watch moved overnight</div></div></div></div>'
      f'<div class="shade"><div class="sbar">9:41 {tint(T + "/stat-" + S + ".png")}<span class="tagx">with the new layer</span></div>'
      f'<div class="note">{tint(T + "/stat-" + S + ".png")}<div><div class="t">OP TCG Hub &middot; Price alert</div><div class="s">A card you watch moved overnight</div></div></div></div></div>')
open(os.path.join(BUILD, "don-sheet-2.html"), "w").write(page("The DON!! panel in context", b))
print("sheets written")
