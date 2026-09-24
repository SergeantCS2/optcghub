#!/usr/bin/env python3
"""The business card: our trading-card frame, front and back, and its print sheets.

The owner picked draft A (the portrait trading-card layout), then, on the Leader-card round, asked for it
"a bit more professional and clear that this is a card for a new app that's like Collectr but for One
Piece". Out went the parody:
- the keyword effects
- the power number
- the LEADER and rarity tabs
- the card number
The frame stays, because the style is what he liked. The card says what the app is in its own words,
not a competitor's name.

The front reads in this order:
1. the art (the icon's own scene, from its bleed layers)
2. the name plate: OP TCG HUB, a One Piece TCG collection tracker
3. three plain lines with line icons: scan, track, build
4. Google's own "Get it on Google Play" badge

The owner asked for "Available on" with the Play logo. Google allows the logo alone only in UI, so a
download promo carries the official badge, unaltered, and he chose it at the bottom.

The back is our own card back, as he approved it: the white field, the purple border and our compass
rose (inner ring off, as the icon's risk panel ruled). The QR is its hub. Below it sit the search
fallback and three facts. The disclaimer is gone at the owner's word: it matters to Google Play, not to
the card. The texture is manga screentone, knocked out behind the lettering. There are no radiating chart
lines: the v3 panel cut them for echoing the Rising Sun flag.

Print: 2 x 3.5 in trim, 1/16 in bleed, 1/8 in safe zone. A 10-up Letter sheet has 3.5 x 2 in cells, two
columns by five rows, 0.75 in side and 0.5 in top margins (assumed; measure them with the test page). The
card is turned into its cell by impose.py: fronts face the top east, backs face it west, so a long-edge flip
lands each back upright under its front. There is a short-edge variant, and per-side offsets for calibration.

  python3 design/business-card/leader.py [icon-layers] [--badge PNG] [--front-dx IN] [--front-dy IN] [--back-dx IN] [--back-dy IN]
      icon-layers: the base path of an icon's -bg.svg / -fg.svg (default: the public v4 own-purple)
      -> $CARD_OUT/leader/{front,back}.html (trim previews), {front,back}-print.html (trim + bleed, for impose.py)
         and test.html (the alignment sheet)
"""
import argparse, json, math, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from cards import (qr_svg, b64, LISTING, PRUSSIAN, BUFF, CREAM, INK, GREEN, PURPLE, PAPER)
# The card's QR carries a campaign tag, so Play Console can count the installs it brings: Grow users > Store
# performance > Conversion analysis, traffic source "ads and referrals", UTM source business_card, campaign
# card_qr. The format is Google's Play URL builder's (UTM values URL-encoded inside `referrer`), the one
# Play Console's help links to for "Tracked channels (UTM)".
CARD_URL = LISTING + "&referrer=utm_source%3Dbusiness_card%26utm_campaign%3Dcard_qr"
sys.path.insert(0, os.path.join(REPO, "design", "d7-icons", "v3"))
import parts as PT

BUILD = os.path.join(os.environ.get("CARD_OUT") or os.path.join(os.path.dirname(REPO), "business-card-build"), "leader")
TRIM_W, TRIM_H, BLEED, SAFE = 2.0, 3.5, 0.0625, 0.125
SHEET_W, SHEET_H, CELL_W, CELL_H, COLS, ROWS = 8.5, 11.0, 3.5, 2.0, 2, 5
FIELD = "#FFFCF5"                  # the card back's white (the icon's card is paper white, not pure)
PANEL_W, PANEL_H = 1.695, 3.195    # inside the panel's border: the trim, less the 0.14 in frame and the 1.2 px keyline
# Google's "Get it on Google Play" badge, fetched at build (never committed). Its rules, from the Partner
# Marketing Hub: the badge is at least 0.3 in tall in print, with a quarter of its height clear all round;
# never recolour or rearrange it; the Play icon alone is not for marketing ("Don't use the icon in
# marketing materials").
BADGE_URL = "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
GP_H, GP_TOP = 0.32, 2.79          # inches: the badge's height, and its top in the panel (features end ~2.70)

def badge_png(path=None):
    """The official badge as a data URI, its transparent margin cropped (the badge itself untouched)."""
    import io, urllib.request
    from PIL import Image
    if path:
        raw = open(path, "rb").read()
    else:
        cache = os.path.join(BUILD, "google-play-badge.png")
        if not os.path.exists(cache):
            with urllib.request.urlopen(BADGE_URL, timeout=30) as r:
                open(cache, "wb").write(r.read())
        raw = open(cache, "rb").read()
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    out = io.BytesIO(); im.save(out, "PNG")
    return "data:image/png;base64," + __import__("base64").b64encode(out.getvalue()).decode(), im.size

# ---------------------------------------------------------------- the art: the icon's scene
def art_svg(base, uid, box=(-30.7, -25, 573.4, 495)):
    """The icon's -bg and -fg layers (the 512 frame on the 768 bleed canvas) composed and cropped to the
    card's art window, with the whole of ドン!! above the name plate. Ids are prefixed per copy: a sheet
    carries ten."""
    bg, fg = (open(f"{base}-{k}.svg", encoding="utf8").read() for k in ("bg", "fg"))
    inner = lambda s: re.sub(r"<!--.*?-->", "", s[s.index(">", s.index("<svg")) + 1:s.rindex("</svg>")], flags=re.S)
    b, f = inner(bg), inner(fg)
    defs = "".join(re.findall(r"<defs>.*?</defs>", b, flags=re.S))
    body = re.sub(r"<defs>.*?</defs>", "", b, flags=re.S) + re.sub(r"<defs>.*?</defs>", "", f, flags=re.S)
    s = defs + body
    for i in sorted(set(re.findall(r'id="([^"]+)"', s)), key=len, reverse=True):
        s = s.replace(f'id="{i}"', f'id="{uid}{i}"').replace(f"url(#{i})", f"url(#{uid}{i})").replace(f'href="#{i}"', f'href="#{uid}{i}"')
    x, y, w, h = box
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" preserveAspectRatio="xMidYMid slice" '
            f'style="display:block;width:100%;height:100%">{s}</svg>')

# line icons, drawn here on a 12-unit grid: a scan frame round a card, a value line rising, a deck of two cards
ICONS = {
    "scan": '<path d="M1.2 4.2V1.2h3M7.8 1.2h3v3M10.8 7.8v3h-3M4.2 10.8h-3v-3"/><rect x="4" y="3.2" width="4" height="5.6" rx=".7"/>',
    "track": '<path d="M1.2 9.6l3.1-3.1 2.2 2.1 4.3-4.6"/><path d="M8 4h2.8v2.8"/>',
    "build": '<rect x="1.4" y="3.4" width="5.6" height="7.4" rx=".8"/><path d="M4.4 1.2h5.4a.8.8 0 0 1 .8.8v6.8"/>',
}
FEATURES = [   # every line true of the app, and short enough for two lines at 7 pt
    ("scan", "Scan", "a card: its exact printing and price."),
    ("track", "Track", "what your collection is worth."),
    ("build", "Build", "decks and hunt sealed product."),
]
FACTS = "ANDROID · NO ACCOUNT<br>WORKS OFFLINE"      # broken by hand: a balanced wrap started line 2 with the dot

def icon(k):
    return (f'<svg viewBox="0 0 12 12" fill="none" stroke="{PRUSSIAN}" stroke-width="1.25" stroke-linecap="round" '
            f'stroke-linejoin="round">{ICONS[k]}</svg>')

# ---------------------------------------------------------------- the faces
FACE_CSS = f"""
.face{{position:absolute;width:{TRIM_W}in;height:{TRIM_H}in;font-family:B,sans-serif;color:{INK};text-rendering:geometricPrecision}}
.face .ground{{position:absolute;inset:-{BLEED}in;background:{PURPLE}}}
.face .print{{position:absolute;left:0.165in;top:0.172in;right:0.108in;bottom:0.1in;background:{GREEN};border-radius:0.09in}}
.face .panel{{position:absolute;inset:0.14in;background:{CREAM};border:1.2px solid {INK};border-radius:0.09in;overflow:hidden}}
.disp{{font-family:D;text-transform:uppercase;letter-spacing:.01em}}
.pop{{color:var(--fill,{CREAM});-webkit-text-stroke:var(--k,1.3px) {INK};paint-order:stroke fill;text-shadow:var(--o,1.4px 1.8px) 0 var(--oc,{GREEN})}}
.fine{{font-size:6.5pt;line-height:1.25}}
/* front */
.front .art{{position:absolute;left:0.06in;right:0.06in;top:0.06in;height:1.36in;border:1.4px solid {INK};border-radius:0.06in;overflow:hidden;background:{PRUSSIAN}}}
.front .plate{{position:absolute;left:0.06in;right:0.06in;top:1.34in;height:0.46in;background:{PRUSSIAN};border:1.2px solid {INK};
  border-radius:0.05in;box-shadow:1.4px 1.8px 0 {GREEN};text-align:center;color:{CREAM}}}
.front .plate .nm{{position:absolute;left:0;right:0;top:0.075in;font-size:17px;line-height:1;--k:1.3px;--o:1.3px 1.6px}}
.front .plate .cat{{position:absolute;left:0;right:0;bottom:0.045in;font-size:6.5pt;color:#DCE4F0;letter-spacing:.02em}}
.front .feats{{position:absolute;left:0.1in;right:0.08in;top:1.89in;display:flex;flex-direction:column;gap:0.05in}}
.front .feat{{display:flex;gap:0.06in;align-items:flex-start;font-size:7pt;line-height:1.22}}
.front .feat svg{{flex:0 0 0.15in;width:0.15in;height:0.15in;margin-top:1px}}
.front .feat b{{color:{PRUSSIAN};font-weight:800}}
/* Google's badge, as Google ships it: at least 0.3 in tall in print, a quarter of its height clear all round */
.front .gp{{position:absolute;left:50%;top:{GP_TOP}in;height:{GP_H}in;transform:translateX(-50%);display:block}}
/* back */
.back .panel{{background:{FIELD}}}
.back .rule{{position:absolute;inset:0.05in;border:0.8px solid {PURPLE};border-radius:0.06in;opacity:.7}}
.back .motif{{position:absolute;inset:0;width:100%;height:100%}}
.back .title{{position:absolute;left:0;right:0;top:0.13in;text-align:center;font-size:17px;line-height:1;--fill:{PRUSSIAN};--k:1.3px;--o:1.3px 1.6px}}
.back .scan{{position:absolute;left:0;right:0;top:0.36in;text-align:center;font-size:7pt;font-weight:800;letter-spacing:.14em;color:{PURPLE}}}
.back .qr{{position:absolute;left:50%;top:0.76in;width:1.24in;height:1.24in;transform:translateX(-50%);border:1.2px solid {INK};border-radius:5px;overflow:hidden;
  box-shadow:1.4px 1.8px 0 {GREEN}}}
.back .search{{position:absolute;left:0;right:0;top:2.36in;text-align:center;font-size:7pt;color:{INK}}}
.back .facts{{position:absolute;left:0.12in;right:0.12in;top:2.62in;text-align:center;font-size:6.5pt;font-weight:800;letter-spacing:.1em;line-height:1.45;
  color:{PURPLE}}}
/* lettering knocks the screentone out, as in a manga panel: a paper pad that follows each line of text */
.ko{{background:{FIELD};padding:0 3px;border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
"""

def front(art, badge):
    feats = "".join(f'<div class="feat">{icon(k)}<p><b>{lead}</b> {rest}</p></div>' for k, lead, rest in FEATURES)
    return f"""<div class="face front"><div class="ground"></div><div class="print"></div><div class="panel">
<div class="art">{art}</div>
<div class="plate"><div class="nm disp pop">OP TCG Hub</div><div class="cat">One Piece TCG collection tracker</div></div>
<div class="feats">{feats}</div>
<img class="gp" src="{badge}" alt="Get it on Google Play">
</div></div>"""

def back_motif(uid):
    """Our card back's field, in 1/100 in across the panel: screentone at the corners (manga, not rays) and
    our compass rose round the QR, its centre on the QR's (inner ring off: the icon's ruling)."""
    W, H = PANEL_W * 100, PANEL_H * 100
    cx, cy, R = W / 2, 138, 82        # the QR's centre: its tile is 1.24 in, top 0.76 in (the tagged URL is version 9)
    dots = []
    for yi in range(0, int(H) + 1, 5):
        for xi in range(0, int(W) + 1, 5):
            x, y = xi + (2.5 if (yi // 5) % 2 else 0), yi
            # the tone fades from the four corners toward the middle
            t = max(0.0, 1 - min(math.hypot(x, y), math.hypot(W - x, y), math.hypot(x, H - y), math.hypot(W - x, H - y)) / 70)
            if t > 0.05:
                dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{0.35 + 1.25 * t:.2f}"/>')
    return (f'<svg class="motif" viewBox="0 0 {W:.1f} {H:.1f}"><g fill="{PURPLE}" opacity=".22">{"".join(dots)}</g>'
            f'{PT.rose(cx, cy, R, colour=PURPLE, field=FIELD, inner_ring=False)}</svg>')

def back(qr, uid):
    return f"""<div class="face back"><div class="ground"></div><div class="print"></div><div class="panel">
{back_motif(uid)}<div class="rule"></div>
<div class="title disp pop"><span class="ko">OP TCG Hub</span></div>
<div class="scan"><span class="ko">SCAN FOR GOOGLE PLAY</span></div>
<div class="qr">{qr}</div>
<div class="search"><span class="ko">or search “OP TCG Hub”</span></div>
<div class="facts"><span class="ko">{FACTS}</span></div>
</div></div>"""

# ---------------------------------------------------------------- pages
def head(fonts, extra=""):
    return (f'<!doctype html><html><head><meta charset=utf-8><style>'
            f'@font-face{{font-family:D;src:url({fonts[0]})}} @font-face{{font-family:B;src:url({fonts[1]})}}'
            f'*{{box-sizing:border-box;margin:0;padding:0}}{FACE_CSS}{extra}</style></head>')

def preview(face_html, fonts, title):
    """One face at trim, for the 300 dpi render and its checks (the bleed is clipped away)."""
    return (head(fonts, f"html,body{{width:{TRIM_W}in;height:{TRIM_H}in;overflow:hidden;position:relative}} .face{{left:0;top:0}}")
            + f'<body data-w="{TRIM_W}in" data-h="{TRIM_H}in"><title>{title}</title>{face_html}</body></html>')

def print_page(face_html, fonts, title):
    """One face on a page of trim plus bleed (2.125 x 3.625 in): what impose.py places on the sheet."""
    W, H = TRIM_W + 2 * BLEED, TRIM_H + 2 * BLEED
    return (head(fonts, f"@page{{size:{W}in {H}in;margin:0}} html,body{{width:{W}in;height:{H}in;overflow:hidden;position:relative}}"
                        f" .face{{left:{BLEED}in;top:{BLEED}in}}")
            + f'<body><title>{title}</title>{face_html}</body></html>')

SHEET_CSS = f"""
@page{{size:{SHEET_W}in {SHEET_H}in;margin:0}}
html,body{{width:{SHEET_W}in}}
.sheet{{position:relative;width:{SHEET_W}in;height:{SHEET_H}in;overflow:hidden;break-after:page;background:#fff}}
.sheet:last-child{{break-after:auto}}
.note{{position:absolute;left:0.75in;right:0.75in;font-size:7.5pt;line-height:1.3;color:#333;font-family:B,sans-serif}}
"""

def test_sheet(side, dx, dy, arrow):
    """Plain paper, printed first. It carries:
    - the cut lines, drawn on the perforation positions
    - a centre cross per cell
    - a 1 in and a 50 mm scale, to prove the print was 100 %
    - an arrow per cell toward the card's top
    Printed duplex, each back arrow lies over its front arrow."""
    u = lambda v: f"{v * 100:.2f}"
    x0, y0 = 0.75 + dx, 0.5 + dy
    ln = []
    for c in range(COLS + 1):
        ln.append(f'<line x1="{u(x0 + c * CELL_W)}" y1="{u(y0)}" x2="{u(x0 + c * CELL_W)}" y2="{u(y0 + ROWS * CELL_H)}"/>')
    for r in range(ROWS + 1):
        ln.append(f'<line x1="{u(x0)}" y1="{u(y0 + r * CELL_H)}" x2="{u(x0 + COLS * CELL_W)}" y2="{u(y0 + r * CELL_H)}"/>')
    labels = []
    for r in range(ROWS):
        for c in range(COLS):
            cx, cy = x0 + (c + 0.5) * CELL_W, y0 + (r + 0.5) * CELL_H
            ln.append(f'<line x1="{u(cx - 0.08)}" y1="{u(cy)}" x2="{u(cx + 0.08)}" y2="{u(cy)}"/><line x1="{u(cx)}" y1="{u(cy - 0.08)}" x2="{u(cx)}" y2="{u(cy + 0.08)}"/>')
            labels.append(f'<div style="position:absolute;left:{cx - 1:.4f}in;top:{cy + 0.14:.4f}in;width:2in;text-align:center;'
                          f'font:600 9pt B,sans-serif;color:#333">{r * COLS + c + 1} &nbsp; {arrow} TOP</div>')
    for x, w in ((0.75, 1.0), (2.25, 50 / 25.4)):        # scales, in the bottom margin
        ln.append(f'<path d="M{u(x)},{u(10.62)} v12 h{u(w)} v-12" fill="none"/>')
        labels.append(f'<div style="position:absolute;left:{x + 0.04:.4f}in;top:10.6in;font:6.5pt B,sans-serif">{"1 in" if w == 1.0 else "50 mm"}</div>')
    note = (f'<div class="note" style="top:0.22in">OP TCG Hub cards · alignment test · <b>{side}</b>. Print at 100 % (Actual size), on plain paper. '
            + ("Hold it over a card sheet: every line should sit on a perforation. Then print page 2 on the back." if side == "FRONT" else
               "Printed on the back of page 1: hold it to the light. Each arrow should lie over the front's, both pointing at the card's top.")
            + '</div>')
    svg = (f'<svg style="position:absolute;inset:0" width="{SHEET_W}in" height="{SHEET_H}in" viewBox="0 0 {u(SHEET_W)} {u(SHEET_H)}">'
           f'<g stroke="#000" stroke-width="0.6">{"".join(ln)}</g></svg>')
    return '<div class="sheet">' + note + svg + "".join(labels) + "</div>"

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("icon", nargs="?", default=os.path.join(REPO, "design", "d7-icons", "v4", "svg", "own-purple"))
    for k in ("front-dx", "front-dy", "back-dx", "back-dy"):
        ap.add_argument("--" + k, type=float, default=0.0, help="inches: the calibration the test page measures")
    ap.add_argument("--badge", help="a Google Play badge PNG to use instead of the hosted one (e.g. the Partner Marketing Hub's download)")
    a = ap.parse_args()
    fonts = (b64(os.path.join(REPO, "assets", "fonts", "display.woff2"), "font/woff2"),
             b64(os.path.join(REPO, "assets", "fonts", "body.woff2"), "font/woff2"))
    qr, version = qr_svg(CARD_URL)
    os.makedirs(BUILD, exist_ok=True)
    badge, badge_px = badge_png(a.badge)
    F = lambda i: front(art_svg(a.icon, f"a{i}"), badge)
    B = lambda i: back(qr, f"b{i}")
    open(os.path.join(BUILD, "front.html"), "w").write(preview(F(0), fonts, "front"))
    open(os.path.join(BUILD, "back.html"), "w").write(preview(B(0), fonts, "back"))
    open(os.path.join(BUILD, "front-print.html"), "w").write(print_page(F(0), fonts, "front"))
    open(os.path.join(BUILD, "back-print.html"), "w").write(print_page(B(0), fonts, "back"))
    sheet = lambda body: head(fonts, SHEET_CSS) + f"<body>{body}</body></html>"
    open(os.path.join(BUILD, "test.html"), "w").write(sheet(test_sheet("FRONT", a.front_dx, a.front_dy, "&rarr;")
                                                            + test_sheet("BACK", a.back_dx, a.back_dy, "&larr;")))
    json.dump({"qr_version": version, "listing": LISTING, "qr_url": CARD_URL, "icon": os.path.basename(a.icon),
               "badge": {"source": a.badge and os.path.basename(a.badge) or BADGE_URL, "px": badge_px,
                         "printed_in": [round(GP_H * badge_px[0] / badge_px[1], 3), GP_H], "dpi": round(badge_px[1] / GP_H)},
               "offsets": {k: getattr(a, k.replace("-", "_")) for k in ("front-dx", "front-dy", "back-dx", "back-dy")}},
              open(os.path.join(BUILD, "build.json"), "w"), indent=1)
    print(f"leader: front, back, their print pages and the test sheet written; QR version {version}")
