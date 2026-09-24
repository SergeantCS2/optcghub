#!/usr/bin/env python3
"""D7 v4: the owner's round on v3.
- The card takes the ink way with its border purple and its accent green: two of the game's six colours.
- The sea becomes the Great Wave in the ukiyo-e idiom (wave.py).
- The composition, the word and the framing are v3's, kept fixed (ui-taste polish: change only what was asked).

The owner picked the printed card back's emblem for this card. That version is
not in this repository (take 63; landmines 26, 30). This one carries our own rose,
so it is a version that could ship as it stands.

  python3 design/d7-icons/v4/compose.py            # writes v4/svg: own-purple
"""
import importlib.util, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); V3 = os.path.join(os.path.dirname(HERE), "v3")
sys.path.insert(0, V3)
from parts import *

def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m); return m
C = _load("v3compose", os.path.join(V3, "compose.py"))      # CARD, WORD, KEY, INLINE, OFFSET, word_groups, mono_layer
W = _load("wave", os.path.join(HERE, "wave.py"))            # sky, sea_back, sea_front

def build(out):
    groups = C.word_groups()
    bd, back = W.sea_back(); fd, front = W.sea_front()
    cd, card = back_white(**C.CARD, way="purple", border=14, emblem_y=0.30, emblem_r=0.27, uid="cp")
    fg = sfx(groups, key=C.KEY, inline=C.INLINE, offset=C.OFFSET, shadow=GAME_GREEN)
    mdefs, mono = C.mono_layer(groups)
    write_set(out, "own-purple", "Our card back, purple border, green accent, on the Great Wave",
              "The white card back riding a ukiyo-e wave; ドン!! slammed across it.",
              bd + fd + cd, W.sky() + back + card + front, fg, mdefs, mono, groups)
    return "own-purple"

if __name__ == "__main__":
    print("built", build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "svg")))
