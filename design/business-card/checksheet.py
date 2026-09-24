#!/usr/bin/env python3
"""Checks the print PDFs the way the printer will read them: rasterised at 300 dpi from the PDF itself.

- Every PDF: two pages, each exactly Letter (612 x 792 pt), with the fonts embedded.
- The test page: the cut lines sit on the perforation positions (0.75 in sides, 0.5 in top, 3.5 x 2 in
  cells) to within a pixel, and the 1 in scale is 1 in.
- The fronts: each of the ten cells is the front preview turned a quarter clockwise (the card's top
  east). Its control: the same cell against the other quarter turn must differ by far more.
- The backs: each cell is the back preview turned the other way (long edge), or the same way (short
  edge), with the same control. Every one of the ten QRs decodes to the card's URL (build.json's qr_url:
  the listing, tagged for Play Console's campaign counts).
- The bleed reaches 1/16 in into the sheet's margins, and no further.
- The back preview's QR: it decodes at 300 and 90 dpi, and not with a finder pattern painted over.

  python3 design/business-card/checksheet.py     (after leader.py, render.mjs leader and sheet.mjs)
"""
import io, json, os, sys
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageStat
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from verify import decode, qr_box
from cards import LISTING
EXPECT = LISTING      # the URL every QR must decode to: build.json's qr_url (the campaign-tagged listing) once main reads it
from leader import SHEET_W, SHEET_H, CELL_W, CELL_H, COLS, ROWS, BLEED
D = os.path.join(os.environ.get("CARD_OUT") or os.path.join(os.path.dirname(REPO), "business-card-build"), "leader")
DPI = 300
LEFT, TOP = 0.75, 0.5          # the assumed sheet; the build's offsets are read from build.json

def pages(pdf):
    doc = pymupdf.open(os.path.join(D, pdf))
    info = {"pages": doc.page_count, "sizes": [(round(p.rect.width, 2), round(p.rect.height, 2)) for p in doc],
            # a font is carried when its file is embedded, or when it is Type3 (its glyphs drawn inside the PDF);
            # one named but not carried would be the printer's own substitute
            "fonts_embedded": all(f[1] != "n/a" or f[2] == "Type3" for p in doc for f in p.get_fonts(full=True)) and any(p.get_fonts() for p in doc)}
    ims = [Image.open(io.BytesIO(p.get_pixmap(dpi=DPI).tobytes("png"))).convert("RGB") for p in doc]
    return info, ims

def mad(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3

def cell(im, c, r, dx=0.0, dy=0.0):
    x, y = round((LEFT + dx + c * CELL_W) * DPI), round((TOP + dy + r * CELL_H) * DPI)
    return im.crop((x, y, x + round(CELL_W * DPI), y + round(CELL_H * DPI)))

def dark(px):
    return sum(px) < 200

def check_test(im, off):
    """The lines: every expected position has ink within a pixel, and the scale bar is one inch."""
    px = im.load(); bad = []
    for side in ("front",):
        dx, dy = off["front-dx"], off["front-dy"]
        for c in range(COLS + 1):
            x = (LEFT + dx + c * CELL_W) * DPI
            for r in range(ROWS):
                y = round((TOP + dy + (r + 0.3) * CELL_H) * DPI)
                if not any(dark(px[round(x) + k, y]) for k in (-1, 0, 1)):
                    bad.append(f"no vertical cut line at x={x / DPI:.3f} in")
        for r in range(ROWS + 1):
            y = (TOP + dy + r * CELL_H) * DPI
            for c in range(COLS):
                x = round((LEFT + dx + (c + 0.3) * CELL_W) * DPI)
                if not any(dark(px[x, round(y) + k]) for k in (-1, 0, 1)):
                    bad.append(f"no horizontal cut line at y={y / DPI:.3f} in")
    # the 1 in scale: its two end ticks, 300 px apart at 300 dpi (probed below its label, above its base line)
    row = round(10.72 * DPI)
    ticks = [x for x in range(round(0.6 * DPI), round(2.0 * DPI)) if dark(px[x, row])]
    groups = []
    for x in ticks:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    span = (sum(groups[1]) / len(groups[1]) - sum(groups[0]) / len(groups[0])) / DPI if len(groups) >= 2 else None
    return {"lines_ok": not bad, "misses": bad[:4], "scale_1in": round(span, 3) if span else None}

def check_cells(im, face, turn, wrong, off, qr=False):
    """Each cell against the preview turned `turn`; the control is the preview turned `wrong`."""
    right_im = face.transpose(turn).resize((round(CELL_W * DPI), round(CELL_H * DPI)), Image.LANCZOS)
    wrong_im = face.transpose(wrong).resize(right_im.size, Image.LANCZOS)
    out = []
    for r in range(ROWS):
        for c in range(COLS):
            got = cell(im, c, r, off[0], off[1])
            row = {"cell": r * COLS + c + 1, "mad": round(mad(got, right_im), 2), "mad_wrong_turn": round(mad(got, wrong_im), 2)}
            if qr:
                row["qr"] = decode(got) == [EXPECT]
            out.append(row)
    return out

def check_bleed(im, off):
    """At each outer edge of the grid: ground 0.03 in past the edge (inside the 1/16 in bleed), paper
    0.10 in past it (beyond the bleed)."""
    px = im.load(); dx, dy = off
    gx0, gy0 = LEFT + dx, TOP + dy
    gx1, gy1 = gx0 + COLS * CELL_W, gy0 + ROWS * CELL_H
    white = lambda x, y: min(px[round(x * DPI), round(y * DPI)]) > 245
    mids_y = [gy0 + (r + .5) * CELL_H for r in range(ROWS)]
    mids_x = [gx0 + (c + .5) * CELL_W for c in range(COLS)]
    res = {}
    for side, pts, step in (("left", [(gx0, y) for y in mids_y], (-1, 0)), ("right", [(gx1, y) for y in mids_y], (1, 0)),
                            ("top", [(x, gy0) for x in mids_x], (0, -1)), ("bottom", [(x, gy1) for x in mids_x], (0, 1))):
        res[side] = all(not white(x + step[0] * 0.03, y + step[1] * 0.03) and white(x + step[0] * 0.10, y + step[1] * 0.10) for x, y in pts)
    return res

def check_preview_qr():
    im = Image.open(os.path.join(D, "png", "back.png")).convert("RGB")
    full = decode(im) == [EXPECT]
    small = decode(im.resize((im.width * 90 // DPI, im.height * 90 // DPI), Image.LANCZOS)) == [EXPECT]
    x0, y0, x1, y1 = qr_box(im); m = (x1 - x0) / 41
    hurt = im.copy(); ImageDraw.Draw(hurt).rectangle([x0 - m, y0 - m, x0 + 8 * m, y0 + 8 * m], fill="#FBF7EC")
    return {"full": full, "at90dpi": small, "control_refused": EXPECT not in decode(hurt), "qr_in": round((x1 - x0) / DPI, 2)}

if __name__ == "__main__":
    build = json.load(open(os.path.join(D, "build.json")))
    EXPECT = build.get("qr_url", LISTING)
    off = build["offsets"]
    front = Image.open(os.path.join(D, "png", "front.png")).convert("RGB")
    back = Image.open(os.path.join(D, "png", "back.png")).convert("RGB")
    CW, CCW = Image.Transpose.ROTATE_270, Image.Transpose.ROTATE_90          # PIL turns counter-clockwise
    report, bad = {"build": build}, []
    info, ims = pages("optcghub-cards-test.pdf"); report["test"] = dict(info, **check_test(ims[0], off))
    for name, back_turn in (("optcghub-cards.pdf", CCW), ("optcghub-cards-short-edge.pdf", CW)):
        info, ims = pages(name)
        fr = check_cells(ims[0], front, CW, CCW, (off["front-dx"], off["front-dy"]))
        bk = check_cells(ims[1], back, back_turn, CW if back_turn == CCW else CCW, (off["back-dx"], off["back-dy"]), qr=True)
        report[name] = dict(info, fronts=fr, backs=bk,
                            bleed_front=check_bleed(ims[0], (off["front-dx"], off["front-dy"])),
                            bleed_back=check_bleed(ims[1], (off["back-dx"], off["back-dy"])))
        for i, pg in enumerate(ims):
            pg.resize((pg.width // 3, pg.height // 3), Image.LANCZOS).save(os.path.join(D, f"{name[:-4]}-p{i + 1}.png"))
    info, ims = pages("optcghub-cards-test.pdf")
    for i, pg in enumerate(ims):
        pg.resize((pg.width // 3, pg.height // 3), Image.LANCZOS).save(os.path.join(D, f"optcghub-cards-test-p{i + 1}.png"))
    report["preview_qr"] = check_preview_qr()
    # the verdicts
    for name in ("optcghub-cards-test.pdf", "optcghub-cards.pdf", "optcghub-cards-short-edge.pdf"):
        r = report["test"] if name.endswith("test.pdf") else report[name]
        if r["pages"] != 2 or any(s != (612.0, 792.0) for s in r["sizes"]) or not r["fonts_embedded"]:
            bad.append(f"{name}: pages/size/fonts {r['pages']} {r['sizes']} {r['fonts_embedded']}")
    t = report["test"]
    if not t["lines_ok"] or not t["scale_1in"] or abs(t["scale_1in"] - 1) > 0.01:
        bad.append(f"test page: {t['misses']} scale {t['scale_1in']}")
    for name in ("optcghub-cards.pdf", "optcghub-cards-short-edge.pdf"):
        r = report[name]
        for side in ("fronts", "backs"):
            for row in r[side]:
                if not (row["mad"] < 12 and row["mad_wrong_turn"] > 3 * row["mad"] + 10):
                    bad.append(f"{name} {side} cell {row['cell']}: mad {row['mad']} vs wrong turn {row['mad_wrong_turn']}")
                if side == "backs" and not row["qr"]:
                    bad.append(f"{name} back cell {row['cell']}: the QR does not decode to the listing")
        for k in ("bleed_front", "bleed_back"):
            if not all(r[k].values()):
                bad.append(f"{name} {k}: {r[k]}")
    q = report["preview_qr"]
    if not (q["full"] and q["at90dpi"] and q["control_refused"]):
        bad.append(f"back preview QR: {q}")
    json.dump(report, open(os.path.join(D, "checksheet.json"), "w"), indent=1)
    worst = max(row["mad"] for n in ("optcghub-cards.pdf", "optcghub-cards-short-edge.pdf") for s in ("fronts", "backs") for row in report[n][s])
    ctrl = min(row["mad_wrong_turn"] for n in ("optcghub-cards.pdf", "optcghub-cards-short-edge.pdf") for s in ("fronts", "backs") for row in report[n][s])
    print(json.dumps({"test": {k: t[k] for k in ("pages", "sizes", "fonts_embedded", "lines_ok", "scale_1in")},
                      "cells": {"worst_mad": worst, "best_wrong_turn_mad": ctrl},
                      "qr_cells": sum(row["qr"] for n in ("optcghub-cards.pdf", "optcghub-cards-short-edge.pdf") for row in report[n]["backs"]),
                      "bleed": {n: {k: all(report[n][k].values()) for k in ("bleed_front", "bleed_back")} for n in ("optcghub-cards.pdf", "optcghub-cards-short-edge.pdf")},
                      "preview_qr": q}, indent=1))
    if bad:
        print("checksheet: refused\n  " + "\n  ".join(bad[:12])); sys.exit(1)
    print("checksheet: 3 PDFs, Letter at 100 %, fonts embedded; the cut lines on the perforations; 40 cells the right way up "
          "(and not the wrong way); 20 QRs to the card's tagged URL; bleed 1/16 in into the margins only")
