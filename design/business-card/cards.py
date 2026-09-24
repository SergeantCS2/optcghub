#!/usr/bin/env python3
"""Business-card drafts for OP TCG Hub: 3.5 x 2 in, printed at home on a 10-up perforated sheet
(double-sided, heavyweight matte), handed to players and store owners.

Three directions, each with its back:
  A  Leader card         portrait, laid out like a trading card of our own design, for players
  B  One number          the app's own hook: EB03-024's three printings, $4.02 to $441.73, 110x apart
  C  DON!!               the icon's word, big, for the one people remember

Everything comes from the product's own system:
- the icon (the owner's pick is passed as an argument; it defaults to the public v4 own-purple)
- the icon's ドン!! word, drawn by design/d7-icons/v3
- the listing's Prussian, cream, ink and green offset print
- the app's brass for prices
Prices are the catalogue's, dated on the card.

Print rules the layouts hold (render.mjs and verify.py check them):
- Everything that matters sits at least 0.125 in inside the cut: the safe zone.
- No keyline runs near a cut edge. A frame at the edge shows every millimetre of a home printer's
  misalignment, so each edge is one ground colour.
- No type under 6.5 pt.
- The QR has its four-module quiet zone on a light tile, and it must decode to the listing URL.

  python3 design/business-card/cards.py [icon.svg]   -> $CARD_OUT/html/*.html
"""
import base64, importlib.util, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
BUILD = os.environ.get("CARD_OUT") or os.path.join(os.path.dirname(REPO), "business-card-build")
V3 = os.path.join(REPO, "design", "d7-icons", "v3")
sys.path.insert(0, V3)
import parts as PT                                          # sfx(), word_bbox(): the icon's word
_spec = importlib.util.spec_from_file_location("v3compose", os.path.join(V3, "compose.py"))
C3 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(C3)
import segno

LISTING = "https://play.google.com/store/apps/details?id=com.optcghub.app"   # live since 24 Sept 2026
PRUSSIAN, BUFF, CREAM, INK, GREEN, PURPLE = "#1f3d72", "#efd9a8", "#F6EEDA", "#1E1A14", "#2e9e5b", "#8552b8"
BRASS, PAPER = "#C9A24A", "#FBF7EC"
# EB03-024's three printings at TCGplayer's market price, from the catalogue of 23 Sep 2026
# (the same numbers the app's printing picker shows: "$4.02 to $441.73 -- 110x apart")
EB03 = (("Base", "$4.02"), ("Alt art", "$27.56"), ("SP", "$441.73"))
PRICED = "TCGplayer market price, 23 Sep 2026"

def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

def qr_svg(url=LISTING, dark=INK, light=PAPER):
    """The QR as one path on a light tile with its four-module quiet zone. Level Q: a quarter of it can
    smudge on matte paper and it still reads."""
    q = segno.make(url, error="q", micro=False)
    rows = list(q.matrix); n = len(rows); qz = 4
    d = "".join(f"M{x + qz},{y + qz}h1v1h-1z" for y, row in enumerate(rows) for x, v in enumerate(row) if v)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n + 2 * qz} {n + 2 * qz}" shape-rendering="crispEdges" '
            f'style="display:block;width:100%;height:100%"><rect width="{n + 2 * qz}" height="{n + 2 * qz}" fill="{light}"/>'
            f'<path d="{d}" fill="{dark}"/></svg>'), q.version

def word_svg(shadow=GREEN, light="#FFFFFF"):
    """ドン!!, drawn by the icon's own code at its own proportions (v3 WORD), with the ink keyline, the
    light inline and the offset print."""
    groups = C3.kana_fit(256, 256, 1.0, rot=C3.WORD["rot"], n_x=C3.WORD["n_x"], bang_x=C3.WORD["bang_x"], bang_k=C3.WORD["bang_k"])
    x0, y0, x1, y1 = PT.word_bbox(groups, sw=C3.KEY)
    dx, dy = C3.OFFSET
    x1, y1 = x1 + dx, y1 + dy
    body = PT.sfx(groups, key=C3.KEY, inline=C3.INLINE, offset=C3.OFFSET, shadow=shadow, light=light)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0 - 2} {y0 - 2} {x1 - x0 + 4} {y1 - y0 + 4}" '
            f'style="display:block;width:100%;height:auto">{body}</svg>')

BASE_CSS = """
@font-face{font-family:D;src:url(%DISPLAY%)} @font-face{font-family:B;src:url(%BODY%)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:%W%;height:%H%;overflow:hidden}
body{position:relative;font-family:B,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.disp{font-family:D;text-transform:uppercase;letter-spacing:.01em}
.pop{color:var(--fill,%CREAM%);-webkit-text-stroke:var(--k,1.4px) %INK%;paint-order:stroke fill;text-shadow:var(--o,1.6px 2px) 0 %GREEN%}
.qr{position:absolute;border-radius:6px;overflow:hidden}
.fine{font-size:6.5pt;line-height:1.25;text-wrap:balance}
p{text-wrap:pretty}
"""

def page(title, w, h, css, body, fonts):
    base = (BASE_CSS.replace("%W%", w).replace("%H%", h).replace("%CREAM%", CREAM).replace("%INK%", INK)
            .replace("%GREEN%", GREEN).replace("%DISPLAY%", fonts[0]).replace("%BODY%", fonts[1]))
    return (f'<!doctype html><html><head><meta charset=utf-8><title>{title}</title><style>{base}{css}</style></head>'
            f'<body data-w="{w}" data-h="{h}">{body}</body></html>')

FEATURES = [          # short enough for one line each on the portrait back
    ("Scan", "the exact printing, priced"),
    ("Price", "every printing, nightly"),
    ("Build", "decks checked by the rules"),
    ("Hunt", "sealed, with stock alerts"),
    ("Offline", "no account, nothing sent"),
]
NOT_OFFICIAL = "Independent app. Not affiliated with Bandai."

# ---------------------------------------------------------------- A: the Leader card (portrait)
A_CSS = f"""
body{{background:{PURPLE}}}
.panel{{position:absolute;inset:0.14in;background:{CREAM};border-radius:0.09in;border:1.2px solid {INK}}}
.name{{position:absolute;left:0.08in;right:0.08in;top:0.07in;font-size:17px;line-height:1;--k:1.3px;--o:1.4px 1.8px;text-align:center;--fill:{PRUSSIAN}}}
.art{{position:absolute;left:0.1in;right:0.1in;top:0.33in;aspect-ratio:1;border:1.6px solid {INK};border-radius:0.07in;overflow:hidden;background:{BUFF}}}
.art img{{width:100%;height:100%;display:block}}
.type{{position:absolute;left:0;right:0;top:1.95in;text-align:center;font-size:6.5pt;letter-spacing:.14em;color:{PURPLE};font-weight:700}}
.fx{{position:absolute;left:0.1in;right:0.1in;top:2.1in;bottom:0.1in;border:1px solid {INK};border-radius:0.05in;background:{PAPER};padding:0.06in 0.07in;
  font-size:7.4pt;line-height:1.28;color:{INK}}}
.fx p+p{{margin-top:0.04in}}
.kw{{display:inline-block;background:{INK};color:{CREAM};border-radius:3px;padding:0 3px;font-size:6.5pt;font-weight:700;line-height:1.35;margin-right:2px}}
.qrwrap{{position:absolute;left:50%;transform:translateX(-50%);top:0.42in;width:1.14in;height:1.14in;border:1.2px solid {INK};border-radius:6px;overflow:hidden}}
.cta{{position:absolute;left:0;right:0;top:1.64in;text-align:center;font-size:9pt;font-weight:700;color:{INK}}}
.cta2{{position:absolute;left:0;right:0;top:1.81in;text-align:center;font-size:7pt;color:{INK}}}
.feats{{position:absolute;left:0.12in;right:0.08in;top:2.03in;font-size:7pt;line-height:1.3;color:{INK};white-space:nowrap}}
.feats b{{color:{PURPLE}}}
.nb{{position:absolute;left:0.1in;right:0.1in;bottom:0.08in;text-align:center;color:#5b5140}}
"""

def draft_a(icon, qr, fonts):
    front = f"""<div class="panel">
<div class="name disp pop">OP TCG Hub</div>
<div class="art"><img src="{icon}"></div>
<div class="type">SCANNER · BINDER · DECKS</div>
<div class="fx"><p><span class="kw">Scan</span> Tells you which printing you hold, and what it's worth.</p>
<p><span class="kw">Offline</span> No account. Your collection stays on your phone.</p></div>
</div>"""
    back = f"""<div class="panel">
<div class="name disp pop">OP TCG Hub</div>
<div class="qrwrap">{qr}</div>
<div class="cta">Scan for Google Play</div>
<div class="cta2">or search “OP TCG Hub”</div>
<div class="feats">{"".join(f"<div><b>{k}</b> {v}</div>" for k, v in FEATURES)}</div>
<div class="nb fine">{NOT_OFFICIAL}</div>
</div>"""
    return (page("A-front", "2in", "3.5in", A_CSS, front, fonts), page("A-back", "2in", "3.5in", A_CSS, back, fonts))

# ---------------------------------------------------------------- B: one number, 110x apart
B_CSS = f"""
body{{background:{PRUSSIAN}}}
.head{{position:absolute;left:0.17in;top:0.15in;font-size:19px;line-height:1.02;--k:1.5px;--o:1.6px 2px}}
.num{{position:absolute;left:0.17in;top:0.72in;font-size:7pt;letter-spacing:.12em;color:#C9D4E6;font-weight:700}}
.tags{{position:absolute;left:0.17in;right:0.17in;top:0.87in;display:flex;gap:0.07in}}
.tag{{flex:1;background:{PAPER};border:1.2px solid {INK};border-radius:5px;padding:3px 5px 4px;box-shadow:1.6px 2px 0 {GREEN};color:{INK}}}
.tag .l{{font-size:6.5pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5b5140}}
.tag .p{{font-family:D;font-size:15px;line-height:1.05}}
.tag.top{{background:{BRASS}}}
.tag.top .l{{color:{INK}}}
.src{{position:absolute;right:0.17in;top:1.36in;color:#AFC0DA}}
.brand{{position:absolute;left:0.17in;bottom:0.15in;display:flex;align-items:center;gap:0.07in}}
.brand img{{width:0.36in;height:0.36in;border-radius:6px;border:1.2px solid {INK};display:block}}
.brand .n{{font-size:13px;line-height:1;--k:1.1px;--o:1.2px 1.5px}}
.brand .t{{font-size:7pt;color:#DCE4F0;margin-top:2px}}
"""

def draft_b(icon, fonts):
    tags = "".join(f'<div class="tag{" top" if i == 2 else ""}"><div class="l">{l}</div><div class="p">{p}</div></div>'
                   for i, (l, p) in enumerate(EB03))
    front = f"""<div class="head disp pop">One number.<br>110× apart.</div>
<div class="num">EB03-024 · THREE PRINTINGS</div>
<div class="tags">{tags}</div>
<div class="src fine">{PRICED}</div>
<div class="brand"><img src="{icon}"><div><div class="n disp pop">OP TCG Hub</div><div class="t">Know which one you're holding.</div></div></div>"""
    return page("B-front", "3.5in", "2in", B_CSS, front, fonts)

# ---------------------------------------------------------------- C: ドン!!
C_CSS = f"""
body{{background:{BUFF}}}
.sky{{position:absolute;left:0;right:0;top:0;height:1.08in;background:{PRUSSIAN}}}
.sand{{position:absolute;left:0;right:0;top:1.08in;bottom:0;background:{BUFF};border-top:1.4px solid {INK}}}
.word{{position:absolute;left:0.13in;top:0.14in;width:2.1in}}
.n{{position:absolute;right:0.17in;top:1.16in;font-size:16px;line-height:1;text-align:right;--k:1.3px;--o:1.4px 1.8px;--fill:{PRUSSIAN}}}
.t{{position:absolute;right:0.17in;top:1.52in;font-size:7.4pt;line-height:1.25;color:{INK};font-weight:600;text-align:right}}
.for{{position:absolute;right:0.17in;top:0.17in;color:#C9D4E6;text-align:right}}
"""

def draft_c(fonts):
    front = f"""<div class="sky"></div><div class="sand"></div>
<div class="word">{word_svg()}</div>
<div class="n disp pop">OP TCG<br>Hub</div>
<div class="t">Scan it. Value it.<br>Build it. Offline.</div>
<div class="for fine">for the One Piece<br>Card Game</div>"""
    return page("C-front", "3.5in", "2in", C_CSS, front, fonts)

# ---------------------------------------------------------------- the landscape backs, dark and light
BACK_CSS = """
body{background:%BG%}
.qr{left:0.17in;top:50%;transform:translateY(-50%);width:1.16in;height:1.16in;border:1.2px solid %INK%}
.col{position:absolute;left:1.5in;right:0.17in;top:0.17in;bottom:0.15in;color:%FG%}
.col .n{font-size:14px;line-height:1;--k:1.2px;--o:1.3px 1.6px;--fill:%NAME%}
.col .cta{margin-top:0.06in;font-size:8.2pt;font-weight:700;color:%ACCENT%}
.col .s{font-size:6.8pt;opacity:.85}
.col ul{list-style:none;margin-top:0.07in;font-size:7pt;line-height:1.32}
.col li b{color:%ACCENT%}
.col .nb{position:absolute;left:0;right:0;bottom:0;opacity:.8}
"""

def back(title, qr, fonts, bg, fg, accent):
    # on the light back the name takes the Prussian: cream letters on cream paper wash out
    css = (BACK_CSS.replace("%BG%", bg).replace("%FG%", fg).replace("%ACCENT%", accent).replace("%INK%", INK)
           .replace("%NAME%", PRUSSIAN if bg == PAPER else CREAM))
    body = f"""<div class="qr">{qr}</div>
<div class="col"><div class="n disp pop">OP TCG Hub</div>
<div class="cta">Scan for Google Play</div><div class="s">or search “OP TCG Hub”</div>
<ul>{"".join(f"<li><b>{k}</b> {v}</li>" for k, v in FEATURES)}</ul>
<div class="nb fine">{NOT_OFFICIAL}</div></div>"""
    return page(title, "3.5in", "2in", css, body, fonts)

if __name__ == "__main__":
    icon_svg = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "design", "d7-icons", "v4", "svg", "own-purple.svg")
    import cairosvg
    icon = "data:image/png;base64," + base64.b64encode(cairosvg.svg2png(url=icon_svg, output_width=700, output_height=700)).decode()
    fonts = (b64(os.path.join(REPO, "assets", "fonts", "display.woff2"), "font/woff2"),
             b64(os.path.join(REPO, "assets", "fonts", "body.woff2"), "font/woff2"))
    qr, version = qr_svg()
    out = os.path.join(BUILD, "html"); os.makedirs(out, exist_ok=True)
    a_front, a_back = draft_a(icon, qr, fonts)
    faces = {"A-front": a_front, "A-back": a_back, "B-front": draft_b(icon, fonts), "C-front": draft_c(fonts),
             "back-light": back("back-light", qr, fonts, PAPER, INK, PURPLE),
             "back-dark": back("back-dark", qr, fonts, PRUSSIAN, CREAM, BRASS)}
    for k, v in faces.items():
        open(os.path.join(out, k + ".html"), "w").write(v)
    print(f"faces written: {len(faces)}; QR version {version} for {LISTING}")
