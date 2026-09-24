#!/usr/bin/env python3
"""Imposes the card on the sheet: front.pdf and back.pdf (one face each, trim plus bleed, from sheet.mjs)
placed ten to a Letter page as vectors, each turned a quarter into its 3.5 x 2 in cell.

  optcghub-cards.pdf             page 1 fronts (card top east), page 2 backs (card top west): long-edge flip
  optcghub-cards-short-edge.pdf  the same, backs turned like the fronts: short-edge flip

Each face is clipped to its trim, except on the sides that face the sheet's margins, where it keeps its
1/16 in bleed. Between neighbours the cut is shared, so a bleed there would eat the neighbour's edge. The
offsets (in inches, from leader.py's --front-dx and the rest, in build.json) move a whole side, which is
what the test page measures.

  python3 design/business-card/impose.py      (after sheet.mjs; checksheet.py checks the result)
"""
import json, os, sys
import pymupdf
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from leader import TRIM_W, TRIM_H, BLEED, SHEET_W, SHEET_H, CELL_W, CELL_H, COLS, ROWS
D = os.path.join(os.environ.get("CARD_OUT") or os.path.join(os.path.dirname(REPO), "business-card-build"), "leader")
PT = 72
LEFT, TOP = 0.75, 0.5

# Which side of the face lands on which side of the cell, per quarter turn. A face turned clockwise has its
# top on the cell's right (east), its right on the cell's bottom, its bottom on the left, its left on the top.
SIDES = {"cw": {"left": "bottom", "right": "top", "top": "left", "bottom": "right"},
         "ccw": {"left": "top", "right": "bottom", "top": "right", "bottom": "left"}}
ROTATE = {"cw": -90, "ccw": 90}       # PyMuPDF's show_pdf_page turns counter-clockwise for a positive angle

def rect(x0, y0, x1, y1):
    return pymupdf.Rect(x0 * PT, y0 * PT, x1 * PT, y1 * PT)

def place(page, src, turn, dx, dy):
    for r in range(ROWS):
        for c in range(COLS):
            outer = {"left": c == 0, "right": c == COLS - 1, "top": r == 0, "bottom": r == ROWS - 1}
            # the clip on the face: its trim, grown by the bleed on the sides that land on the sheet's margins
            grow = {SIDES[turn][side]: BLEED if outer[side] else 0.0 for side in outer}
            clip = rect(BLEED - grow["left"], BLEED - grow["top"], BLEED + TRIM_W + grow["right"], BLEED + TRIM_H + grow["bottom"])
            # the target on the sheet: the cell, grown the same way on its outer sides
            x0, y0 = LEFT + dx + c * CELL_W, TOP + dy + r * CELL_H
            target = rect(x0 - (BLEED if outer["left"] else 0), y0 - (BLEED if outer["top"] else 0),
                          x0 + CELL_W + (BLEED if outer["right"] else 0), y0 + CELL_H + (BLEED if outer["bottom"] else 0))
            page.show_pdf_page(target, src, 0, clip=clip, rotate=ROTATE[turn], keep_proportion=False)

def impose(name, back_turn, off):
    out = pymupdf.open()
    fr, bk = pymupdf.open(os.path.join(D, "front.pdf")), pymupdf.open(os.path.join(D, "back.pdf"))
    for src, turn, (dx, dy) in ((fr, "cw", (off["front-dx"], off["front-dy"])), (bk, back_turn, (off["back-dx"], off["back-dy"]))):
        page = out.new_page(width=SHEET_W * PT, height=SHEET_H * PT)
        place(page, src, turn, dx, dy)
    out.set_metadata({"title": "OP TCG Hub cards", "subject": "10-up, 3.5 x 2 in, Letter; print at 100 %",
                      "creator": "design/business-card/impose.py"})
    out.save(os.path.join(D, name), garbage=3, deflate=True)
    return out.page_count

if __name__ == "__main__":
    off = json.load(open(os.path.join(D, "build.json")))["offsets"]
    for name, back_turn in (("optcghub-cards.pdf", "ccw"), ("optcghub-cards-short-edge.pdf", "cw")):
        n = impose(name, back_turn, off)
        print(f"impose: {name}, {n} pages ({os.path.getsize(os.path.join(D, name)) // 1024} KB)")
