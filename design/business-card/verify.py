#!/usr/bin/env python3
"""Checks the rendered faces the way the printed card will be used, and draws the preview sheet.

1. Every QR decodes to the listing URL, at print resolution (300 dpi) and again at a camera's-eye
   resolution (the card at 90 dpi, about a phone held at arm's length). A QR that scans to something
   else is worse than no QR.
   Negative control: the same face with one finder pattern painted over must NOT decode, or the decoder
   is not looking. The edge check has its own: a keyline drawn 0.05 in inside the cut must be refused.
2. No keyline runs along a cut edge. A line parallel to an edge within 0.1 in of it shows every
   millimetre of a home printer's misalignment. The check: for each line of pixels parallel to each
   edge inside that band, the share of ink pixels; a keyline reads near 1, a line crossing the edge near 0.
3. preview.png: each draft's front and back side by side.

  python3 design/business-card/verify.py            (after cards.py and render.mjs)
"""
import json, os, sys
from PIL import Image, ImageDraw
import zxingcpp
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
BUILD = os.environ.get("CARD_OUT") or os.path.join(os.path.dirname(REPO), "business-card-build")
PNG = os.path.join(BUILD, "png")
sys.path.insert(0, HERE)
from cards import LISTING, INK

BACKS = ("A-back", "back-light", "back-dark")
PAIRS = (("A", "A-front", "A-back"), ("B", "B-front", "back-light"), ("C", "C-front", "back-dark"))
DPI = 300

def decode(im):
    return [r.text for r in zxingcpp.read_barcodes(im)]

def qr_box(im):
    r = zxingcpp.read_barcodes(im)[0].position
    xs = [r.top_left.x, r.top_right.x, r.bottom_left.x, r.bottom_right.x]
    ys = [r.top_left.y, r.top_right.y, r.bottom_left.y, r.bottom_right.y]
    return min(xs), min(ys), max(xs), max(ys)

def check_qr(face):
    im = Image.open(os.path.join(PNG, face + ".png")).convert("RGB")
    full = decode(im)
    small = decode(im.resize((im.width * 90 // DPI, im.height * 90 // DPI), Image.LANCZOS))
    # the negative control: paint over the top-left finder pattern (7 x 7 modules of 41 + quiet zone)
    x0, y0, x1, y1 = qr_box(im)
    m = (x1 - x0) / 41
    hurt = im.copy(); ImageDraw.Draw(hurt).rectangle([x0 - m, y0 - m, x0 + 8 * m, y0 + 8 * m], fill="#FBF7EC")
    broken = decode(hurt)
    return {"face": face, "full": full == [LISTING], "at90dpi": small == [LISTING], "control_refused": LISTING not in broken,
            "qr_in": round((x1 - x0) / DPI, 2)}

def ink(p):
    ir, ig, ib = (int(INK[i:i + 2], 16) for i in (1, 3, 5))
    return abs(p[0] - ir) + abs(p[1] - ig) + abs(p[2] - ib) < 90

def edge_keylines(face, band=0.1, im=None):
    im = im or Image.open(os.path.join(PNG, face + ".png")).convert("RGB"); W, H = im.size; px = im.load()
    n = int(band * DPI); worst = 0.0
    for k in range(n):
        for line in ([(x, k) for x in range(W)], [(x, H - 1 - k) for x in range(W)],
                     [(k, y) for y in range(H)], [(W - 1 - k, y) for y in range(H)]):
            worst = max(worst, sum(ink(px[x, y]) for x, y in line) / len(line))
    return {"face": face, "edgeInk": round(worst, 3), "ok": worst < 0.5}

def preview():
    rows = []
    for key, f, b in PAIRS:
        A = Image.open(os.path.join(PNG, f + ".png")).convert("RGB"); B = Image.open(os.path.join(PNG, b + ".png")).convert("RGB")
        h = max(A.height, B.height); row = Image.new("RGB", (A.width + B.width + 150, h + 110), "#8d8d8d")
        d = ImageDraw.Draw(row)
        for im, x in ((A, 50), (B, A.width + 100)):
            d.rectangle([x + 10, 60, x + 10 + im.width, 50 + im.height + 10], fill="#6f6f6f")   # a flat shadow
            row.paste(im, (x, 50))
        d.text((50, 12), f"{key}   front  /  back", fill="#ffffff")
        rows.append(row)
    W = max(r.width for r in rows); sheet = Image.new("RGB", (W, sum(r.height for r in rows)), "#8d8d8d"); y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(os.path.join(BUILD, "preview.png"))
    return sheet.size

if __name__ == "__main__":
    qrs = [check_qr(f) for f in BACKS]
    edges = [edge_keylines(os.path.splitext(f)[0]) for f in sorted(os.listdir(PNG)) if f.endswith(".png")]
    # the edge check's negative control: a face with a keyline drawn 0.05 in inside the cut must fail
    framed = Image.open(os.path.join(PNG, "B-front.png")).convert("RGB"); k = int(0.05 * DPI)
    ImageDraw.Draw(framed).rectangle([k, k, framed.width - 1 - k, framed.height - 1 - k], outline=INK, width=4)
    control = edge_keylines("B-front+keyline", im=framed)
    edges_control_refused = not control["ok"]
    for r in qrs + edges + [dict(control, control_refused=edges_control_refused)]:
        print(json.dumps(r))
    bad = ([r["face"] for r in qrs if not (r["full"] and r["at90dpi"] and r["control_refused"])] + [r["face"] for r in edges if not r["ok"]]
           + ([] if edges_control_refused else ["the edge check passed a keyline: it is not looking"]))
    print("preview", preview())
    if bad:
        print("verify: refused", ", ".join(bad)); sys.exit(1)
    print(f"verify: {len(qrs)} QRs decode to the listing at 300 and 90 dpi (and a damaged one does not); no keyline on a cut edge")
