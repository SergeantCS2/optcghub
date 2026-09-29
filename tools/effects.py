#!/usr/bin/env python3
"""Card effects as DATA, parsed from the catalogue's own text (A23 step 2, take 47).

Nothing here is typed by hand (take 45, failure class 1). Each printing's text
is split into effect lines; a line becomes an effect only if EVERY bracket tag
is one the engine can evaluate and the WHOLE sentence matches one template
from the closed set below. Anything else is left to the honour system: the
board shows the text and the tray. A half-understood effect executed with
confidence is the sim's $1.48 printing.

    python3 tools/effects.py              # report coverage
    python3 tools/effects.py --selftest   # a garbled sentence must NOT parse; known ones must
Called by build_app.py to put `effects` in the bundle.
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Tags the ENGINE knows how to fire or evaluate. Anything else -> manual.
TRIGGERS = {"On Play": "onplay", "When Attacking": "attack", "Activate: Main": "main", "On K.O.": "onko",
            "Trigger": "trigger", "On Block": "onblock", "End of Your Turn": "endturn",
            "Main": "evmain", "Counter": "evcounter"}      # an Event's two timings (take 49): the play IS the effect
# Timings the engine offers only BY HAND (take 122): no template runs them yet, but the
# board still offers the line at its moment, under its Once Per Turn (landmine 212).
HAND_TRIGGERS = dict(TRIGGERS, **{"End of Your Opponent's Turn": "endoppturn", "On Your Opponent's Attack": "oppattack"})
# A cost before the colon: pay, then do. Declining the cost declines the effect.
COST = [
    (re.compile(r"^You may trash (\d) cards? from your hand:\s*"),                       lambda m: {"a": "cost_trashhand", "n": int(m[1])}),
    (re.compile(r"^DON!! -(\d) \([^)]*\):\s*"),                                          lambda m: {"a": "cost_returndon", "n": int(m[1])}),
    (re.compile(r"^You may rest this (?:Character|Leader):\s*"),                          lambda m: {"a": "cost_restself"}),
]
CONDS = {"Once Per Turn": ("opt", None), "Your Turn": ("yourturn", None), "Opponent's Turn": ("oppturn", None)}
# The catalogue spells one tag several ways (take 122, measured): "[Activate:Main]" on 417 lines, "[DON!!x1]", "[DON!! X1]",
# "[DON!!×1]", "[On play]", "[End of your Turn]", "[On your Opponent's Attack]", "[Rush Character]". Every reader of a tag reads
# it through canon_tag(); what is printed is shown as printed.
KEYWORD_TAGS = ["Blocker", "Rush", "Double Attack", "Banish", "Unblockable", "Rush: Character"]
CANON = {re.sub(r"[\s:.]", "", t).lower(): t for t in list(HAND_TRIGGERS) + list(CONDS) + KEYWORD_TAGS}   # dots too: "[On K.O]" is [On K.O.]


def canon_tag(tag):
    """One spelling per tag: spaces and colons ignored, case ignored, DON!! x/X/× and its number read as one."""
    t = tag.strip()
    m = re.fullmatch(r"DON!!\s*[xX\u00d7]\s*(\d+)", t)
    if m:
        return f"DON!! x{m.group(1)}"
    return CANON.get(re.sub(r"[\s:.]", "", t).lower(), t)
TAG = re.compile(r"^\[([^\]]+)\]\s*")
DONX = re.compile(r"^DON!! x(\d)$")

# Full-sentence templates. Each yields the STEPS the engine runs, in order.
def one(d): return [d]
T = [
    (re.compile(r"^Draw (\d) cards? and trash (\d) cards? from your hand\.$"),                          lambda m: [{"a": "draw", "n": int(m[1])}, {"a": "trashhand", "n": int(m[2])}]),
    (re.compile(r"^Play this card\.$"),                                                                    lambda m: one({"a": "playself"})),
    (re.compile(r"^Activate this card's \[(On Play|When Attacking|On K\.O\.|Main)\] effect\.$"),          lambda m: one({"a": "activate", "t": {"On Play": "onplay", "When Attacking": "attack", "On K.O.": "onko", "Main": "evmain"}[m[1]]})),
    (re.compile(r"^Play up to 1 (?:\[([^\]]+)\] type )?Character card with (?:a cost of (\d+) or less|(\d+) power or less) from your hand\.$"),
                                                                                                            lambda m: one({"a": "playfromhand", "type": m[1], "cost": int(m[2]) if m[2] else None, "power": int(m[3]) if m[3] else None})),
    (re.compile(r"^K\.O\. up to 1 of your opponent's (rested )?Characters with (\d+) power or less\.$"),  lambda m: one({"a": "ko", "who": "opp", "power": int(m[2]), "rested": bool(m[1])})),
    (re.compile(r"^K\.O\. up to 1 of your opponent's rested Characters with a cost of (\d+) or less\.$"),  lambda m: one({"a": "ko", "who": "opp", "cost": int(m[1]), "rested": True})),
    (re.compile(r"^Return up to 1 Character with a cost of (\d+) or less to the owner's hand\.$"),        lambda m: one({"a": "bounce", "who": "any", "cost": int(m[1])})),
    (re.compile(r"^Place up to 1 Character with a cost of (\d+) or less at the bottom of the owner's deck\.$"), lambda m: one({"a": "bottom", "who": "any", "cost": int(m[1])})),
    (re.compile(r"^Add up to 1 DON!! card from your DON!! deck and set it as active\.$"),                 lambda m: one({"a": "adddon", "n": 1})),
    (re.compile(r"^Give up to 1 of your opponent's Characters -(\d+) power during this turn\.$"),        lambda m: one({"a": "power", "who": "opp", "n": -int(m[1]), "dur": "turn"})),
    (re.compile(r"^Your Leader gains \+(\d+) power during this (battle|turn)\.$"),                        lambda m: one({"a": "leaderpower", "n": int(m[1]), "dur": m[2]})),
    (re.compile(r"^Look at (\d) cards? from the top of your deck; reveal up to 1 (.+?) and add it to your hand\.(?: Then, place the rest at the bottom of your deck in any order\.)?$"),
                                                                                                            lambda m: search_steps(int(m[1]), m[2], m[0].endswith("in any order."))),
    (re.compile(r"^Place the rest at the bottom of your deck in any order\.$"),                            lambda m: one({"a": "restcards", "to": "bottom"})),
    (re.compile(r"^Trash the rest\.$"),                                                                   lambda m: one({"a": "restcards", "to": "trash"})),
    (re.compile(r"^Add up to 1 DON!! card from your DON!! deck and rest it\.$"),                          lambda m: one({"a": "adddon", "n": 1, "rested": True})),
    (re.compile(r"^Give up to 1 of your opponent's Characters (\d+) power during this turn\.$"),         lambda m: one({"a": "power", "who": "opp", "n": -int(m[1]), "dur": "turn", "sign_inferred": True})),
    (re.compile(r"^Give up to 1 of your opponent's Characters -(\d+) cost during this turn\.$"),         lambda m: one({"a": "costmod", "who": "opp", "n": -int(m[1]), "dur": "turn"})),
    (re.compile(r"^This Character gains \+(\d+) power\.$"),                                             lambda m: one({"a": "selfpower", "n": int(m[1]), "dur": "permanent"})),
    (re.compile(r"^This (?:Leader|Character) gains \[(Rush|Double Attack|Blocker|Banish)\]( during this (?:turn|battle))?\.$"),
                                                                                                            lambda m: one({"a": "selfkw", "k": m[1], "dur": "turn" if m[2] else "permanent"})),
    (re.compile(r"^Trash (\d) cards? from the top of your deck\.$"),                                     lambda m: one({"a": "mill", "n": int(m[1])})),
    (re.compile(r"^Add (\d) cards? from the top of your Life cards to your hand\.$"),                    lambda m: one({"a": "lifetohand", "n": int(m[1])})),
    (re.compile(r"^Add up to 1 card from the top of your deck to the top of your Life cards\.$"),         lambda m: one({"a": "decktolife", "n": 1})),
    (re.compile(r"^Set this Character as active\.$"),                                                     lambda m: one({"a": "selfactive"})),
    (re.compile(r"^Draw (\d) cards?\.$"),                                                                   lambda m: one({"a": "draw", "n": int(m[1])})),
    (re.compile(r"^This (?:Leader|Character) gains \+(\d+) power (during this turn|until the start of your next turn|during this battle)\.$"),
                                                                                                            lambda m: one({"a": "selfpower", "n": int(m[1]), "dur": "nextturn" if m[2].startswith("until") else m[2].split()[-1]})),
    (re.compile(r"^That card gains an additional \+(\d+) power(?: during this (turn|battle))?\.$"),       lambda m: one({"a": "power", "n": int(m[1]), "who": "prev", "dur": m[2] or "turn"})),
    (re.compile(r"^Trash up to (\d) cards? from your hand\.$"),                                             lambda m: one({"a": "trashhand", "n": int(m[1]), "upto": True})),
    (re.compile(r"^Up to 1 of your (?:Leader or Character cards|Characters)( other than this card)? gains \+(\d+) power during this (turn|battle)\.$"),
                                                                                                            lambda m: one(dict({"a": "power", "n": int(m[2]), "who": "own", "dur": m[3]}, **({"notself": True} if m[1] else {})))),
    # take 122: "cannot activate [Blocker]" -- the attack (or the turn) the opponent may not block, whole-sentence forms only
    (re.compile(r"^Your opponent cannot activate (?:a )?\[Blocker\](?: Character that has (\d+) or (more|less) power)? during this (battle|turn)\.$"),
                                                                                                            lambda m: one(dict({"a": "noblocker", "dur": m[3]}, **({"power": int(m[1]), "cmp": m[2]} if m[1] else {})))),
    (re.compile(r"^K\.O\. up to 1 of your opponent's Characters with a cost of (\d+) or less\.$"),         lambda m: one({"a": "ko", "who": "opp", "cost": int(m[1])})),
    (re.compile(r"^K\.O\. up to 1 of your opponent's Characters with (\d+) base power or less\.$"),        lambda m: one({"a": "ko", "who": "opp", "power": int(m[1])})),
    (re.compile(r"^Rest up to 1 of your opponent's (?:Characters|Leader or Characters?) with a cost of (\d+) or less\.$"),
                                                                                                            lambda m: one({"a": "rest", "who": "opp", "cost": int(m[1])})),
    (re.compile(r"^Rest up to 1 of your opponent's Characters\.$"),                                        lambda m: one({"a": "rest", "who": "opp"})),
    (re.compile(r"^Give up to (\d) rested DON!! cards? to your Leader or 1 of your Characters\.$"),         lambda m: one({"a": "givedon", "n": int(m[1])})),
    (re.compile(r"^Give this Leader or 1 of your Characters up to (\d) rested DON!! cards?\.$"),         lambda m: one({"a": "givedon", "n": int(m[1])})),     # ST01-001 (take 122)
    (re.compile(r"^Give up to (\d) rested DON!! cards? to (?:your|this) Leader\.$"),                    lambda m: one({"a": "givedon", "n": int(m[1]), "who": "leader"})),   # "this Leader": ST08-001 (take 122)
    (re.compile(r"^Set up to (\d) of your DON!! cards as active\.$"),                                       lambda m: one({"a": "activedon", "n": int(m[1])})),
    (re.compile(r"^Add up to 1 card from the top of your Life cards to your hand\.$"),                     lambda m: one({"a": "lifetohand", "n": 1})),
    (re.compile(r"^Return up to 1 of your opponent's Characters with a cost of (\d+) or less to the owner's hand\.$"),
                                                                                                            lambda m: one({"a": "bounce", "who": "opp", "cost": int(m[1])})),
    (re.compile(r"^Trash 1 card from your hand\.$"),                                                       lambda m: one({"a": "trashhand", "n": 1})),
]
# Leading clauses the engine can evaluate; the rest of the sentence must still match a template.
IF = [
    (re.compile(r"^If your opponent has (\d) or less Life cards, "),                lambda m: {"c": "opplife", "max": int(m[1])}),
    (re.compile(r"^If you have (\d+) or more DON!! cards on your field, "),         lambda m: {"c": "donfield", "min": int(m[1])}),
    (re.compile(r"^If your Leader has the (?:\[([^\]]+)\]|\{([^}]+)\}) type, "),       lambda m: {"c": "leadertype", "t": m[1] or m[2]}),   # [type] and {type}: one clause, two brackets (take 122, wording.py: 187 lines)
    (re.compile(r"^If your Leader is \[([^\]]+)\], "),                                lambda m: {"c": "leadername", "name": m[1]}),
    (re.compile(r"^If the number of DON!! cards on your field is equal to or less than the number on your opponent's field, "), lambda m: {"c": "donle"}),
    (re.compile(r"^If you have (\d) or less Life cards, "),                             lambda m: {"c": "life", "max": int(m[1])}),
    (re.compile(r"^If you have (\d+) or more cards in your trash, "),                   lambda m: {"c": "trash", "min": int(m[1])}),
]
# A timing written as words, not as a tag (take 122): the line waits on that event. "When a Character is K.O.'d" is any
# Character, either side, by battle or by an effect -- never one trashed to make room (§3-7-6-1-1).
WHEN = [
    (re.compile(r"^When a Character is K\.O\.['\u2019]d, "), "whenko"),
]


def when_of(s):
    """(trigger, the rest) for a sentence that opens with a WHEN timing, else (None, s)."""
    for rx, t in WHEN:
        m = rx.match(s)
        if m:
            rest = s[m.end():]
            return t, (rest[0].upper() + rest[1:] if rest else rest)
    return None, s


def parse_line(line):
    """One effect line -> {trigger, conds, action} or None (manual)."""
    s = without_notes(line.strip())
    trig, conds = None, []
    while True:
        m = TAG.match(s)
        if not m:
            break
        tag = canon_tag(m.group(1)); s = s[m.end():]
        if tag in TRIGGERS:
            if trig:
                return None                         # two triggers on one line ("[On Play]/[When Attacking]") -> manual
            trig = TRIGGERS[tag]
        elif tag in CONDS:
            conds.append({"c": CONDS[tag][0]})
        else:
            d = DONX.match(tag)
            if d:
                conds.append({"c": "donx", "n": int(d.group(1))})
            else:
                return None                         # a keyword or a tag the engine cannot fire
    if not trig:
        trig, s = when_of(s)
    if not trig:
        for rx, mk in IF:                               # a continuous effect may open with its condition (ST09-001, take 122)
            m = rx.match(s)
            if m:
                conds.append(mk(m)); s = s[m.end():]; s = s[0].upper() + s[1:] if s else s
                break
        m = re.match(r"^This (?:Leader|Character) gains \+(\d+) power\.$", s)
        if m and conds:                                 # continuous: true while the condition holds (§10)
            return {"t": "static", "if": conds, "do": [{"a": "selfpower", "n": int(m[1]), "dur": "static"}], "raw": line.strip()}
        m = re.match(r"^This (?:Leader|Character) gains \[(Rush|Double Attack|Blocker|Banish)\]\.$", s)
        if m and conds:                                 # a continuous keyword: [DON!! x1] This Character gains [Rush].
            return {"t": "static", "if": conds, "do": [{"a": "selfkw", "k": m[1], "dur": "static"}], "raw": line.strip()}
        return None
    if s.startswith("/"):                           # "[On Play]/[When Attacking]" form
        return None
    cost = []
    for rx, mk in COST:
        m = rx.match(s)
        if m:
            cost.append(mk(m)); s = s[m.end():]
            s = s[0].upper() + s[1:] if s else s
            break
    for rx, mk in IF:
        m = rx.match(s)
        if m:
            conds.append(mk(m)); s = s[m.end():]
            s = s[0].upper() + s[1:] if s else s
            break
    if not cost:                                        # a cost may follow the condition: "If …, DON!! -1: …"
        for rx, mk in COST:
            m = rx.match(s)
            if m:
                cost.append(mk(m)); s = s[m.end():]
                s = s[0].upper() + s[1:] if s else s
                break
    steps = template_steps(s)
    if steps is None:
        # N sentences, each a template on its own, a leading "Then, if …" a condition on that sentence's steps (takes 50, 51)
        parts = re.split(r"(?<=[a-z0-9\)\]])\. (?=[A-Z])", s)
        if len(parts) >= 2:
            steps = []
            for k, pt in enumerate(parts):
                txt = pt if pt.endswith(".") else pt + "."
                if k:
                    txt = re.sub(r"^Then, ", "", txt); txt = txt[0].upper() + txt[1:] if txt else txt
                p_if = []
                if k:
                    for rx, mk in IF:
                        m = rx.match(txt)
                        if m:
                            p_if.append(mk(m)); txt = txt[m.end():]; txt = txt[0].upper() + txt[1:] if txt else txt
                            break
                st = template_steps(txt)
                if st is None:
                    steps = None; break
                for x in st:
                    if p_if:
                        x["if"] = p_if
                steps += st
    if steps is None:
        return None
    return {"t": trig, "if": conds, "do": cost + steps, "raw": line.strip()}


# Bracketed tokens are card NAMES or TYPES and the text does not say which:
# "[Sanji] or [Big Mom Pirates] type card" is a card named Sanji OR a Big Mom
# Pirates card. build() fills these from the catalogue; a token that is neither
# refuses the line (take 51, found by a fixture that looked for Sanji-type cards).
KNOWN = {"types": set(), "names": set()}


def classify(tok):
    if tok in KNOWN["types"]:
        return "types"
    if tok in KNOWN["names"]:
        return "names"
    return "types" if not KNOWN["types"] else None      # no catalogue loaded (the selftest): trust the sentence


def search_steps(n, what, bottomed):
    """The reveal filter of a search, in every phrasing measured at take 51."""
    f = {"a": "search", "n": n}
    m = re.match(r"^(?:\[|\{)([^\]\}]+)(?:\]|\})(?: or (?:\[|\{)([^\]\}]+)(?:\]|\}))? type card(?: other than \[([^\]]+)\])?$", what)
    if m:
        for tok in (m[1], m[2]):
            if tok:
                k = classify(tok)
                if k is None:
                    return None
                f.setdefault(k, []).append(tok)
        f["not"] = m[3]
    else:
        m = re.match(r'^"([^"]+)" type card(?: other than \[([^\]]+)\])?$', what)
        if m:
            f["types"] = [m[1]]; f["not"] = m[2]
        else:
            m = re.match(r"^\[([^\]]+)\]$", what)
            if m:
                f["name"] = m[1]
            else:
                m = re.match(r"^card with a cost of (\d+) or (less|more)$", what)
                if m:
                    f["cost_" + ("max" if m[2] == "less" else "min")] = int(m[1])
                else:
                    return None
    steps = [f]
    if bottomed:
        steps.append({"a": "restcards", "to": "bottom"})
    return steps


def template_steps(s):
    for rx, mk in T:
        m = rx.match(s)
        if m:
            st = mk(m)            # a template may return None when its inner grammar refuses
            if st and re.search(r"\bup to\b", s, re.I):     # "up to X": 0 to X may be chosen (§4-8, §8-4-4-1; take 122)
                for x in st:
                    if x["a"] != "restcards":
                        x["upto"] = True
            return st
    return None


def hand_lines(line):
    """A line no template runs, kept with its TIMING (take 122): the engine offers it by hand
    at that moment, under its [Once Per Turn] and its DON!! condition, and the tray it opens
    carries only the moves its words name. A timing written as words ("When a Character is
    K.O.'d, ...") is a timing too. No timing at all -- a continuous effect the app does not
    compute -- is kept as t 'static' so the board can say so; nothing offers it."""
    s = line.strip(); trigs, conds = [], []
    while True:
        s = s.lstrip("/ ")
        m = TAG.match(s)
        if not m:
            break
        tag = canon_tag(m.group(1)); s = s[m.end():]
        if tag in HAND_TRIGGERS:
            if HAND_TRIGGERS[tag] not in trigs:
                trigs.append(HAND_TRIGGERS[tag])
        elif tag in CONDS:
            conds.append({"c": CONDS[tag][0]})
        else:
            d = DONX.match(tag)
            if d:
                conds.append({"c": "donx", "n": int(d.group(1))})
    if not trigs:
        w, _ = when_of(s)
        trigs = [w or "static"]
    return [{"t": t, "if": [dict(c) for c in conds], "do": [], "hand": True, "raw": line.strip()} for t in trigs]


NEWLINE_TAG = re.compile(r"(?<=[.)])\s+(?=\[(?:Trigger|On Play|When Attacking|Activate\s*:\s*Main|On K\.O\.|Main|Counter|On Block|End of Your Turn|End of Your Opponent's Turn|On Your Opponent's Attack|DON!!\s*[xX\u00d7]\s*\d|Your Turn|Opponent's Turn)\])", re.I)


def lines_of(text):
    """Effect lines: the text's own lines, and a line split where a timing tag follows a sentence's end -- the catalogue
    often runs two effects together ("... during this battle. [Trigger] Play this card.", take 122)."""
    out = []
    for chunk in re.split(r"\n\s*\n|\n", text or ""):
        for c in NEWLINE_TAG.split(chunk.strip()):
            c = c.strip()
            if c and c.startswith("["):
                out.append(c)
    return out


def without_notes(s):
    """An explanatory note after a sentence changes nothing in play (§2-8-4-1): "... gains [Rush]. (This card can attack ...)"
    reads as "... gains [Rush]." -- a closing parenthesis the catalogue sometimes drops included. A note inside a cost
    ("DON!! -1 (You may return ...):") is not after a sentence's end and stays for the cost's own grammar."""
    return re.sub(r"(?<=\.)\s*\([^()]*\)?\s*$", "", s)


def build(cat):
    C = {n: i for i, n in enumerate(cat["cols"])}
    KNOWN["types"].clear(); KNOWN["names"].clear()
    for r in cat["rows"]:
        if r[C["sealed"]] or not r[C["num"]]:
            continue
        KNOWN["names"].add(r[C["name"]])
        for t in re.split(r"[;/]", r[C["subtypes"]] or ""):
            if t.strip():
                KNOWN["types"].add(t.strip())
    KNOWN["types"] -= KNOWN["names"] & KNOWN["types"] if False else set()
    effects, stats = {}, {"cards": 0, "with_lines": 0, "lines": 0, "parsed": 0, "cards_full": 0, "cards_partial": 0, "by_trigger": {}}
    for r in cat["rows"]:
        if r[C["sealed"]] or not r[C["num"]]:
            continue
        stats["cards"] += 1
        ls = [l for l in lines_of(r[C["text"]]) if not re.match(r"^\[(Blocker|Rush|Double Attack|Banish|Unblockable|Rush: Character)\]\s*\(", l)]
        if not ls:
            continue
        stats["with_lines"] += 1
        got = [parse_line(l) for l in ls]
        ok = [g for g in got if g]
        stats["lines"] += len(ls); stats["parsed"] += len(ok)
        hand = [h for l, g in zip(ls, got) if not g for h in hand_lines(l)]
        stats["hand"] = stats.get("hand", 0) + len(hand)
        if ok or hand:
            effects[str(r[C["id"]])] = ok + hand
            for g in ok:
                stats["by_trigger"][g["t"]] = stats["by_trigger"].get(g["t"], 0) + 1
        if len(ok) == len(ls):
            stats["cards_full"] += 1
        elif ok:
            stats["cards_partial"] += 1
    return effects, stats


def selftest():
    KNOWN["types"].update(["Navy", "Marine", "Straw Hat Crew"]); KNOWN["names"].update(["Nami", "Sanji"])
    good = ["[On Play] Draw 1 card.",
            "[DON!! x1] [When Attacking] This Character gains +2000 power during this turn.",
            "[On Play] Rest up to 1 of your opponent's Characters with a cost of 2 or less.",
            "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of your Characters.",
            "[When Attacking] If your opponent has 2 or less Life cards, this Character gains +2000 power during this turn.",
            "[On Play] Draw 2 cards and trash 1 card from your hand.",
            "[Trigger] Play this card.",
            "[Trigger] Activate this card's [On Play] effect.",
            "[DON!! x1] This Character gains +1000 power.",
            "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Straw Hat Crew] type card other than [Nami] and add it to your hand. Then, place the rest at the bottom of your deck in any order.",
            "[Main] Draw 1 card.",
            "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.",
            "[On Play] You may trash 1 card from your hand: K.O. up to 1 of your opponent's Characters with a cost of 3 or less.",
            "[Activate: Main] [Once Per Turn] DON!! -1 (You may return the specified number of DON!! cards from your field to your DON!! deck.): Draw 1 card.",
            "[Activate: Main] You may rest this Character: Rest up to 1 of your opponent's Characters with a cost of 4 or less.",
            "[On Play] Play up to 1 Character card with a cost of 3 or less from your hand.",
            "[Trigger] If your Leader is [Monkey.D.Luffy], play this card.",
            "[On Play] Draw 1 card. Then, trash 1 card from your hand.",
            "[When Attacking] Up to 1 of your Leader or Character cards gains +1000 power during this turn. Then, if you have 3 or less Life cards, that card gains an additional +1000 power during this turn.",
            "[On Play] This Character gains +2000 power until the start of your next turn.",
            "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Navy] or [Marine] type card other than [Koby] and add it to your hand. Then, place the rest at the bottom of your deck in any order.",
            "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 [Nami] and add it to your hand. Then, trash the rest.",
            "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 [Sanji] or [Straw Hat Crew] type card and add it to your hand. Then, place the rest at the bottom of your deck in any order.",
            "[Activate: Main] [Once Per Turn] If your Leader is [Kaido], DON!! -1 (You may return the specified number of DON!! cards from your field to your DON!! deck.): Draw 1 card.",
            "[On Play] Give up to 1 of your opponent's Characters -2 cost during this turn. Then, K.O. up to 1 of your opponent's Characters with a cost of 3 or less.",
            "[When Attacking] This Character gains [Double Attack] during this turn.",
            "[On Play] Give up to 1 of your opponent's Characters -3 cost during this turn.",
            "[DON!! x1] This Character gains [Rush].",
            "[On Play] Draw 1 card. Then, trash 1 card from your hand. Then, draw 1 card.",
            "[Activate: Main] [Once Per Turn] Give this Leader or 1 of your Characters up to 1 rested DON!! card.",   # ST01-001 (take 122)
            "[On Play] Give up to 1 rested DON!! card to your Leader.",
            "[DON!! x2] This Character gains [Rush]. (This card can attack on the turn in which it is played.)",      # ST01-004: the note is not the effect (§2-8-4-1)
            "[DON!! x2] [When Attacking] Your opponent cannot activate a [Blocker] Character that has 5000 or more power during this battle.",   # ST01-002
            "[DON!! x2] [When Attacking] Your opponent cannot activate [Blocker] during this battle.",                   # ST01-012
            "[DON!! x1] [When Attacking] Up to 1 of your Leader or Character cards other than this card gains +1000 power during this turn.",   # ST01-005
            "[Your Turn] When a Character is K.O.'d, give up to 1 rested DON!! card to this Leader.",                  # ST08-001: a timing in words (take 122)
            "[DON!! x1] [Opponent's Turn] If you have 2 or less Life cards, this Leader gains +1000 power.",           # ST09-001: a continuous effect with its condition
            "[Trigger] If your Leader has the {Straw Hat Crew} type, play this card."]                                  # the {type} spelling of a Leader condition
    bad = ["[On Play] Draw 1 card and K.O. up to 1 of your opponent's Characters.",          # two actions: not a template
           "[On Play]/[When Attacking] Draw 1 card.",                                          # two triggers
           "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new target of the attack.)",
           "This Character gains +1000 power.",                                                 # a static with NO condition: it is base power, the catalogue's job
           "[On Play] You may trash 1 card from your hand: Draw 1 card and then play a card.",  # a cost, then a sentence no template knows
           "[On Play] Draw 1 card. Then, play a card from your hand.",                          # two sentences, the second unknown: the WHOLE line is manual
           "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 card and add it to your hand.",   # a reveal filter the grammar does not know
           "[On Play] Choose one: Draw 1 card; or trash 1 card from your hand.",                 # modal: manual
           "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Zoro] type card and add it to your hand.",  # a token the catalogue knows as neither a name nor a type
           "[When Attacking] Your opponent cannot activate [Blocker] and draw 1 card.",                           # take 122: the new template is whole-sentence only
           "[DON!! x1] [When Attacking] Up to 1 of your Characters other than [Nami] gains +1000 power during this turn.",   # "other than this card" only
           "[DON!! x2] This Character gains [Rush]. (This card can attack on the turn in which it is played.) Then, draw 1 card.",   # a note is dropped only at the END
           "[Your Turn] When your Leader is K.O.'d, give up to 1 rested DON!! card to this Leader.",                # take 122: only "a Character is K.O.'d" is a timing
           "If you have 2 or less Life cards, this Leader gains +1000 power during this turn.",                     # ...and a condition alone is no timing: a "this turn" needs one
           "[Trigger] If your Leader has the {Straw Hat Crew] type, play this card."]                                  # mismatched brackets are no type
    ok = True
    for g in good:
        r = parse_line(g); print(f"  {'ok  ' if r else 'FAIL'}  parses: {g[:70]}"); ok &= bool(r)
    for b in bad:
        r = parse_line(b); print(f"  {'ok  ' if not r else 'FAIL'}  refused (manual): {b[:70]}"); ok &= not r
    # take 122: one tag, every spelling the catalogue uses
    for spelt, want in (("Activate:Main", "Activate: Main"), ("DON!!x1", "DON!! x1"), ("DON!! X2", "DON!! x2"), ("DON!!\u00d73", "DON!! x3"),
                        ("On play", "On Play"), ("End of your Turn", "End of Your Turn"), ("On your Opponent's Attack", "On Your Opponent's Attack"),
                        ("Rush Character", "Rush: Character"), ("Rush:Character", "Rush: Character"), ("On K.O", "On K.O.")):
        r = canon_tag(spelt) == want; print(f"  {'ok  ' if r else 'FAIL'}  [{spelt}] reads as [{want}]"); ok &= r
    r = parse_line("[Activate:Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of your Characters.") is not None
    print(f"  {'ok  ' if r else 'FAIL'}  a line spelt [Activate:Main] is the same line (417 were invisible before take 122)"); ok &= r
    r = canon_tag("Activate: Main Phase") == "Activate: Main Phase"; print(f"  {'ok  ' if r else 'FAIL'}  control: a tag that is not one of them is left as it is"); ok &= r
    # take 122: two effects run together on one line are two lines; a note in a cost is kept for the cost
    ls = lines_of("[DON!! x2] [When Attacking] Your opponent cannot activate [Blocker] during this battle. [Trigger] Play this card.")
    r = ls == ["[DON!! x2] [When Attacking] Your opponent cannot activate [Blocker] during this battle.", "[Trigger] Play this card."]
    print(f"  {'ok  ' if r else 'FAIL'}  a [Trigger] after a sentence's end starts its own line"); ok &= r
    r = lines_of("[Blocker] (After your opponent declares an attack, you may rest this card.) [On Play] Draw 1 card.")[-1] == "[On Play] Draw 1 card."
    print(f"  {'ok  ' if r else 'FAIL'}  ...after a note's closing parenthesis too"); ok &= r
    r = len(lines_of("[On Play] Up to 1 of your Characters gains [Rush] during this turn.")) == 1
    print(f"  {'ok  ' if r else 'FAIL'}  control: a keyword inside a sentence does not split it"); ok &= r
    r = parse_line("[Activate: Main] [Once Per Turn] DON!! -1 (You may return the specified number of DON!! cards from your field to your DON!! deck.): Draw 1 card.") is not None
    print(f"  {'ok  ' if r else 'FAIL'}  a cost's own parenthesis is not a note"); ok &= r
    d = parse_line("[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this battle.")["do"][0]["dur"]
    r = d == "battle"; print(f"  {'ok  ' if r else 'FAIL'}  'during this battle' lasts the battle, not the turn ({d})"); ok &= r
    # "up to" is choosable-none on its steps; a plain count is not (take 122)
    up = parse_line("[On Play] K.O. up to 1 of your opponent's Characters with a cost of 3 or less.")["do"][0].get("upto")
    plain = parse_line("[On Play] Trash 1 card from your hand.")["do"][0].get("upto")
    r = up is True and not plain; print(f"  {'ok  ' if r else 'FAIL'}  'up to' marks its step choosable-none, a plain count does not"); ok &= r
    # a line no template runs keeps its timing and its tags, by hand; no timing, nothing offered
    h = hand_lines("[Activate: Main] [Once Per Turn] Choose one: Draw 1 card; or trash 1 card from your hand.")
    r = len(h) == 1 and h[0]["t"] == "main" and h[0]["hand"] and h[0]["if"] == [{"c": "opt"}] and h[0]["do"] == []
    print(f"  {'ok  ' if r else 'FAIL'}  a by-hand line keeps [Activate: Main] and [Once Per Turn]"); ok &= r
    h = hand_lines("[On Play]/[When Attacking] Choose one: draw 1 card; or K.O. a Character.")
    r = [x["t"] for x in h] == ["onplay", "attack"]; print(f"  {'ok  ' if r else 'FAIL'}  a two-timing line is offered at both"); ok &= r
    h = hand_lines("[DON!! x2] [Opponent's Turn] This Character cannot be K.O.'d in battle.")
    r = len(h) == 1 and h[0]["t"] == "static" and h[0]["if"] == [{"c": "donx", "n": 2}, {"c": "oppturn"}]
    print(f"  {'ok  ' if r else 'FAIL'}  a line with no timing is kept as a continuous effect the app does not compute, never offered"); ok &= r
    h = hand_lines("[Your Turn] When a Character is K.O.'d, draw 1 card and trash 1 card from the top of your deck.")
    r = len(h) == 1 and h[0]["t"] == "whenko" and h[0]["if"] == [{"c": "yourturn"}]
    print(f"  {'ok  ' if r else 'FAIL'}  a timing in words is a timing by hand too"); ok &= r
    e = parse_line("[DON!! x1] [Opponent's Turn] If you have 2 or less Life cards, this Leader gains +1000 power.")
    r = e["t"] == "static" and e["if"] == [{"c": "donx", "n": 1}, {"c": "oppturn"}, {"c": "life", "max": 2}]
    print(f"  {'ok  ' if r else 'FAIL'}  ST09-001's continuous +1000 holds only with its DON!!, on the opponent's turn, at 2 Life or less"); ok &= r
    h = hand_lines("[End of Your Opponent's Turn] Set up to 1 of your Characters as active.")
    r = len(h) == 1 and h[0]["t"] == "endoppturn"; print(f"  {'ok  ' if r else 'FAIL'}  [End of Your Opponent's Turn] is a by-hand timing"); ok &= r
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("effects.py negative controls:"); raise SystemExit(0 if selftest() else 1)
    cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
    eff, st = build(cat)
    print(f"  {st['cards']} cards, {st['with_lines']} with effect lines, {st['lines']} lines; "
          f"{st['parsed']} parsed ({100*st['parsed']/max(1,st['lines']):.1f}%), {st.get('hand', 0)} offered by hand; "
          f"{st['cards_full']} cards fully scripted, {st['cards_partial']} partly, by trigger {st['by_trigger']}")
