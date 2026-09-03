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
# A cost before the colon: pay, then do. Declining the cost declines the effect.
COST = [
    (re.compile(r"^You may trash (\d) cards? from your hand:\s*"),                       lambda m: {"a": "cost_trashhand", "n": int(m[1])}),
    (re.compile(r"^DON!! -(\d) \([^)]*\):\s*"),                                          lambda m: {"a": "cost_returndon", "n": int(m[1])}),
    (re.compile(r"^You may rest this (?:Character|Leader):\s*"),                          lambda m: {"a": "cost_restself"}),
]
CONDS = {"Once Per Turn": ("opt", None), "Your Turn": ("yourturn", None), "Opponent's Turn": ("oppturn", None)}
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
    (re.compile(r"^Your Leader gains \+(\d+) power during this (?:battle|turn)\.$"),                      lambda m: one({"a": "leaderpower", "n": int(m[1]), "dur": "turn"})),
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
                                                                                                            lambda m: one({"a": "selfpower", "n": int(m[1]), "dur": "nextturn" if m[2].startswith("until") else "turn"})),
    (re.compile(r"^That card gains an additional \+(\d+) power(?: during this (?:turn|battle))?\.$"),     lambda m: one({"a": "power", "n": int(m[1]), "who": "prev", "dur": "turn"})),
    (re.compile(r"^Trash up to (\d) cards? from your hand\.$"),                                             lambda m: one({"a": "trashhand", "n": int(m[1]), "upto": True})),
    (re.compile(r"^Up to 1 of your (?:Leader or Character cards|Characters) gains \+(\d+) power during this (?:turn|battle)\.$"),
                                                                                                            lambda m: one({"a": "power", "n": int(m[1]), "who": "own", "dur": "turn"})),
    (re.compile(r"^K\.O\. up to 1 of your opponent's Characters with a cost of (\d+) or less\.$"),         lambda m: one({"a": "ko", "who": "opp", "cost": int(m[1])})),
    (re.compile(r"^K\.O\. up to 1 of your opponent's Characters with (\d+) base power or less\.$"),        lambda m: one({"a": "ko", "who": "opp", "power": int(m[1])})),
    (re.compile(r"^Rest up to 1 of your opponent's (?:Characters|Leader or Characters?) with a cost of (\d+) or less\.$"),
                                                                                                            lambda m: one({"a": "rest", "who": "opp", "cost": int(m[1])})),
    (re.compile(r"^Rest up to 1 of your opponent's Characters\.$"),                                        lambda m: one({"a": "rest", "who": "opp"})),
    (re.compile(r"^Give up to (\d) rested DON!! cards? to your Leader or 1 of your Characters\.$"),         lambda m: one({"a": "givedon", "n": int(m[1])})),
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
    (re.compile(r"^If your Leader has the \[([^\]]+)\] type, "),                    lambda m: {"c": "leadertype", "t": m[1]}),
    (re.compile(r"^If your Leader is \[([^\]]+)\], "),                                lambda m: {"c": "leadername", "name": m[1]}),
    (re.compile(r"^If the number of DON!! cards on your field is equal to or less than the number on your opponent's field, "), lambda m: {"c": "donle"}),
    (re.compile(r"^If you have (\d) or less Life cards, "),                             lambda m: {"c": "life", "max": int(m[1])}),
    (re.compile(r"^If you have (\d+) or more cards in your trash, "),                   lambda m: {"c": "trash", "min": int(m[1])}),
]


def parse_line(line):
    """One effect line -> {trigger, conds, action} or None (manual)."""
    s = line.strip()
    trig, conds = None, []
    while True:
        m = TAG.match(s)
        if not m:
            break
        tag = m.group(1); s = s[m.end():]
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
            return mk(m)          # a template may return None when its inner grammar refuses
    return None


def lines_of(text):
    out = []
    for chunk in re.split(r"\n\s*\n|\n", text or ""):
        c = chunk.strip()
        if c and c.startswith("["):
            out.append(c)
    return out


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
        if ok:
            effects[str(r[C["id"]])] = ok
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
            "[On Play] Draw 1 card. Then, trash 1 card from your hand. Then, draw 1 card."]
    bad = ["[On Play] Draw 1 card and K.O. up to 1 of your opponent's Characters.",          # two actions: not a template
           "[On Play]/[When Attacking] Draw 1 card.",                                          # two triggers
           "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new target of the attack.)",
           "This Character gains +1000 power.",                                                 # a static with NO condition: it is base power, the catalogue's job
           "[On Play] You may trash 1 card from your hand: Draw 1 card and then play a card.",  # a cost, then a sentence no template knows
           "[On Play] Draw 1 card. Then, play a card from your hand.",                          # two sentences, the second unknown: the WHOLE line is manual
           "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 card and add it to your hand.",   # a reveal filter the grammar does not know
           "[On Play] Choose one: Draw 1 card; or trash 1 card from your hand.",                 # modal: manual
           "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Zoro] type card and add it to your hand."]  # a token the catalogue knows as neither a name nor a type
    ok = True
    for g in good:
        r = parse_line(g); print(f"  {'ok  ' if r else 'FAIL'}  parses: {g[:70]}"); ok &= bool(r)
    for b in bad:
        r = parse_line(b); print(f"  {'ok  ' if not r else 'FAIL'}  refused (manual): {b[:70]}"); ok &= not r
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("effects.py negative controls:"); raise SystemExit(0 if selftest() else 1)
    cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
    eff, st = build(cat)
    print(f"  {st['cards']} cards, {st['with_lines']} with effect lines, {st['lines']} lines; "
          f"{st['parsed']} parsed ({100*st['parsed']/max(1,st['lines']):.1f}%); "
          f"{st['cards_full']} cards fully scripted, {st['cards_partial']} partly, by trigger {st['by_trigger']}")
