#!/usr/bin/env python3
"""Turn a TCGplayer product NAME into a structured printing.

Landmine 2: TCGCSV extendedData carries Number, Rarity, Color, Cost, Power,
CardType, Counterplus, Attribute, Subtypes, Description — and NOTHING that
distinguishes a $1.48 base from a $467.33 SP. The only discriminator is the
parenthetical suffix on the name. Parse it once, at build time, into columns.
Never re-derive it at runtime.

MEASURED take 2 over all 6,860 card products, the parentheticals fall into four
classes and they are NOT interchangeable:

  number echo   "Nami (OP01-016) (SP)"      -> the card's own number, repeated
  treatment     "(Alternate Art)" "(SP)"    -> a different PRINTING of the card
  provenance    "(Judge Pack Vol. 2)"       -> where the promo came from
  award         "[Winner]" "[Finalist]"     -> tournament placement, in BRACKETS

Only `treatment` changes what the card looks like. `provenance` and `award`
change what it is worth without changing the face, which is why they are the
class the scanner can never resolve on its own (see docs/AGENDA.md A5).
"""
import re

# Treatments, longest-first so "Alternate Art" wins before "Art" ever could.
# Order within the tuple is the canonical key; the strings are what TCGplayer
# writes. Anything not in here is provenance, by definition.
TREATMENTS = [
    ("alternate_art",  ["Alternate Art"]),
    ("manga",          ["Manga"]),
    ("full_art",       ["Full Art"]),
    ("sp",             ["SP"]),
    ("parallel",       ["Parallel"]),
    ("textured_foil",  ["Textured Foil"]),
    ("pirate_foil",    ["Pirate Foil"]),
    ("jolly_roger",    ["Jolly Roger Foil"]),
    ("wanted_poster",  ["Wanted Poster"]),
    ("box_topper",     ["Box Topper"]),
    ("reprint",        ["Reprint"]),
]
_T_LOOKUP = {s.lower(): k for k, ss in TREATMENTS for s in ss}

# Treatments that are the SAME artwork with a different finish. The hash cannot
# separate these from the base card and must not be asked to try (landmine 13).
SAME_ART = {"parallel", "textured_foil", "pirate_foil", "jolly_roger", "reprint"}

PAREN = re.compile(r"\(([^()]*)\)")
BRACKET = re.compile(r"\[([^\[\]]*)\]")
# A parenthetical that is just the card's number, in any of the three styles
# TCGplayer uses: (024), (EB03-024), (OP01-016)
NUMBERISH = re.compile(r"^(?:[A-Z]{1,4}\d{0,2}-)?\d{2,3}$")
# "Nami - OP01-016 (Alternate Art)" — the number can also be inline with a dash
INLINE_NUM = re.compile(r"\s+-\s+[A-Z]{1,4}\d{0,2}-\d{2,3}(?=\s|$)")

AWARDS = {"winner", "finalist", "participant"}


def parse(name, number=None):
    """-> dict(base_name, treatment, same_art, provenance, award)

    `number` is extendedData['Number'] when known; it lets a number echo be
    recognised even in a style NUMBERISH would miss.
    """
    award = None
    for b in BRACKET.findall(name):
        if b.strip().lower() in AWARDS:
            award = b.strip().lower()
    stripped = BRACKET.sub("", name)

    treatment = None
    provenance = []
    for p in PAREN.findall(stripped):
        p = p.strip()
        if not p:
            continue
        if NUMBERISH.match(p) or (number and p.upper() == number.upper()):
            continue                                   # number echo — not a variant
        key = _T_LOOKUP.get(p.lower())
        if key and treatment is None:
            treatment = key
        elif key:
            provenance.append(p)                       # second treatment: keep, don't lose it
        else:
            provenance.append(p)

    base = PAREN.sub("", stripped)
    base = INLINE_NUM.sub("", base)
    base = re.sub(r"\s{2,}", " ", base).strip(" -\u2014")

    return {
        "base_name": base,
        "treatment": treatment or "base",
        "same_art": (treatment in SAME_ART) if treatment else False,
        "provenance": " / ".join(provenance) or None,
        "award": award,
    }


def label(v):
    """Short human suffix for the picker, e.g. 'Alternate Art · Judge Pack Vol. 2'."""
    bits = []
    if v["treatment"] != "base":
        bits.append(dict(TREATMENTS).get(v["treatment"], [v["treatment"]])[0]
                    if isinstance(dict(TREATMENTS).get(v["treatment"]), list)
                    else v["treatment"])
    if v["provenance"]:
        bits.append(v["provenance"])
    if v["award"]:
        bits.append(v["award"].title())
    return " \u00b7 ".join(bits) or "Base"


if __name__ == "__main__":
    # Negative controls first (PROTOCOL §7 / AGENTS rule 2): a parser that
    # cannot be shown to reject is not a parser.
    CASES = [
        ("Nefeltari Vivi (024)", "EB03-024", "base", None),
        ("Nefeltari Vivi (024) (Alternate Art)", "EB03-024", "alternate_art", None),
        ("Nefeltari Vivi (024) (SP)", "EB03-024", "sp", None),
        ("Nami (OP01-016) (Manga)", "OP01-016", "manga", None),
        ("Nami - OP01-016 (Luffy Deck)", "OP01-016", "base", "Luffy Deck"),
        ("Nami (English Version 1st Anniversary Set)", "OP01-016",
         "base", "English Version 1st Anniversary Set"),
        ("Monkey.D.Luffy (001) (Offline Regional 2024 Vol. 2) [Winner]", "P-001",
         "base", "Offline Regional 2024 Vol. 2"),
        ("Trafalgar Law - ST03-008 (CS 2024 Event Pack)", "ST03-008",
         "base", "CS 2024 Event Pack"),
        ('Eustass"Captain"Kid (Promotion Pack 2022)', "P-003",
         "base", "Promotion Pack 2022"),
    ]
    bad = 0
    for name, num, want_t, want_p in CASES:
        v = parse(name, num)
        ok = v["treatment"] == want_t and v["provenance"] == want_p
        bad += not ok
        print(f"{'ok ' if ok else 'FAIL'}  {name}\n        -> base={v['base_name']!r} "
              f"treatment={v['treatment']} prov={v['provenance']!r} award={v['award']}")
    # negative control: the parser MUST reject a wrong expectation
    v = parse("Nefeltari Vivi (024) (SP)", "EB03-024")
    assert v["treatment"] != "base", "negative control failed — parser cannot fail"
    print(f"\n{len(CASES)-bad}/{len(CASES)} cases pass; negative control fired correctly")
    raise SystemExit(1 if bad else 0)
