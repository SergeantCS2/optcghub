#!/usr/bin/env python3
"""Train the star-glyph template and commit it as a sidecar.

Landmine 60: a star above the rarity badge marks a special printing, and the
signal is asymmetric — a star means special, no star means nothing. Take 7
measured a fixed-point template detector at threshold 0.61 with 64.6% recall
and ZERO false positives on 133 held-out plain cards, margin +0.36. This tool
produces that template as data the app can ship.

The sidecar is committed (landmines 46, 66): it is derived from ~600 card
downloads and a rebuild should never need to repeat them. It is regenerated
only when this file changes, and the gate asserts the recorded threshold and
held-out numbers are present so nobody ships a template without its evidence.

Run from a labelled sample directory built the way take 7 built one:
  a set of {product_id}.jpg at 600x838 plus index.json of
  [product_id, number, face_class, treatment, rarity, name].
"""
import json, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CATALOG_DB
import numpy as np
from PIL import Image

# MEASURED take 7 by differencing the mean of 200 star cards against 254 plain.
STAR_BOX = (0.8800, 0.9315, 0.0190, 0.0140)     # x, y, w, h as card fractions
PW, PH = 20, 14
THRESHOLD = 0.61
SIDECAR = os.path.join(os.path.dirname(CATALOG_DB), "star_template.json")


def patch(path):
    im = Image.open(path).convert("L")
    W, H = im.size
    c = im.crop((int(W * STAR_BOX[0]), int(H * STAR_BOX[1]),
                 int(W * (STAR_BOX[0] + STAR_BOX[2])), int(H * (STAR_BOX[1] + STAR_BOX[3]))))
    a = np.asarray(c.resize((PW, PH), Image.LANCZOS), dtype=np.float32)
    return (a - a.mean()) / max(1e-6, a.std())


def train(sample_dir, seed=7):
    idx = json.load(open(os.path.join(sample_dir, "index.json")))
    random.seed(seed)
    random.shuffle(idx)
    half = len(idx) // 2
    train, test = idx[:half], idx[half:]
    tpl = np.mean([patch(os.path.join(sample_dir, f"{r[0]}.jpg"))
                   for r in train if r[2] == "star"], axis=0)
    tpl = (tpl - tpl.mean()) / tpl.std()

    scores = {"plain": [], "star": [], "sp": []}
    for pid, num, fc, *_ in test:
        p = patch(os.path.join(sample_dir, f"{pid}.jpg"))
        scores[fc].append(float((p * tpl).mean()))
    pos, neg = np.array(scores["star"]), np.array(scores["plain"])
    fp = int((neg >= THRESHOLD).sum())
    rec = float((pos >= THRESHOLD).mean())
    margin = float(THRESHOLD - np.percentile(neg, 95))

    # AGENTS rule 2: a template shipped without its held-out numbers is a guess
    # wearing a number. Refuse to write one that regressed.
    assert fp == 0, f"{fp} false positives on held-out plain cards — do not ship"
    assert rec > 0.55, f"recall {rec:.2f} regressed below the take-7 measurement"
    assert margin > 0.25, f"margin {margin:.2f} too thin to survive a photograph"

    out = {
        "box": STAR_BOX, "w": PW, "h": PH, "threshold": THRESHOLD,
        "template": [round(float(v), 4) for v in tpl.flatten()],
        "held_out": {"n_star": len(pos), "n_plain": len(neg),
                     "recall": round(rec, 3), "false_positives": fp,
                     "margin_over_plain_p95": round(margin, 3)},
        "trained_on": {"n_star": sum(1 for r in train if r[2] == "star"),
                       "seed": seed},
    }
    json.dump(out, open(SIDECAR, "w"))
    print(f"   star template: recall {100*rec:.1f}%  false positives {fp}/{len(neg)}  "
          f"margin +{margin:.2f}  -> {os.path.basename(SIDECAR)}")
    return out


if __name__ == "__main__":
    train(sys.argv[1] if len(sys.argv) > 1 else "/tmp/cards")
