#!/usr/bin/env python3
"""Stock decks: a legal deck on a fresh install, for the sim and the browse (A29, take 61).

NOT reproductions of Bandai's starter decks. Their per-card quantities are
not published (take 61 checked the catalogue, Bandai's product page and the
fan sites), and inventing them would be a confident wrong answer about a
product people buy. Each deck here is assembled from ONE ST set's own
printings by a fixed rule, named for what it is -- "Red Luffy - built from
ST01" -- and validated against the app's own legality check at build time.

If real lists ever arrive -- the owner's own decks, a licensed source -- they
replace the generated ones in this same slot and the names lose "built from".

    python3 tools/stockdecks.py            # report
    python3 tools/stockdecks.py --selftest # the guards, with their controls
Called by build_app.py; the result rides in the bundle as `stock`.
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MAIN = ("Character", "Event", "Stage")


def build(cat, verbose=False):
    C = {n: i for i, n in enumerate(cat["cols"])}
    g = lambda r, k: r[C[k]]
    rows = [r for r in cat["rows"] if not g(r, "sealed") and g(r, "num") and g(r, "treat") == "base"]
    by_set = {}
    for r in rows:
        m = re.match(r"^(ST\d+)-", g(r, "num") or "")
        if m:
            by_set.setdefault(m.group(1), []).append(r)

    out, skipped = [], []
    for st in sorted(by_set):
        pool = by_set[st]
        leaders = [r for r in pool if g(r, "type") == "Leader"]
        if not leaders:
            skipped.append((st, "no Leader")); continue
        # one deck per set: its lowest-numbered Leader
        leader = min(leaders, key=lambda r: g(r, "num"))
        colours = {c.strip() for c in re.split(r"[;/,]", g(leader, "color") or "") if c.strip()}
        # §5-1: every card shares a colour with the Leader. One entry per NUMBER.
        cand = {}
        for r in pool:
            if g(r, "type") not in MAIN:
                continue
            if not ({c.strip() for c in re.split(r"[;/,]", g(r, "color") or "") if c.strip()} & colours):
                continue
            n = g(r, "num")
            # cheapest printing of a number, so a stock deck is never a $400 SP
            if n not in cand or (g(r, "market") or 9e9) < (g(cand[n], "market") or 9e9):
                cand[n] = r
        # four of each, cheapest numbers last, until fifty; a deterministic order
        order = sorted(cand.values(), key=lambda r: (0 if g(r, "type") == "Character" else 1,
                                                     int(g(r, "cost") or 99), g(r, "num")))
        cards, total = [], 0
        for r in order:
            if total >= 50:
                break
            n = min(4, 50 - total)
            cards.append({"num": g(r, "num"), "id": g(r, "id"), "n": n}); total += n
        if total != 50:
            skipped.append((st, f"only {total} legal cards in the set")); continue
        out.append({"id": f"stock-{st.lower()}", "set": st, "name": f"{'/'.join(sorted(colours))} {g(leader, 'name')} \u2014 built from {st}",
                    "leader": g(leader, "id"), "leaderNum": g(leader, "num"), "cards": cards})
    if verbose:
        print(f"   stock decks: {len(out)} built from {len(by_set)} ST sets"
              + (f"; skipped {len(skipped)} ({', '.join(f'{a} {b}' for a, b in skipped[:3])}…)" if skipped else ""))
    return out


def selftest(cat=None):
    if cat is None:
        cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
    C = {n: i for i, n in enumerate(cat["cols"])}
    byid = {r[C["id"]]: r for r in cat["rows"]}
    decks = build(cat)
    ok = True

    def check(name, cond, note=""):
        nonlocal ok
        print(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}")
        ok &= bool(cond)

    check("at least one deck was built", len(decks) >= 1, f"{len(decks)} decks")
    check("every deck is exactly fifty cards plus one Leader",
          all(sum(c["n"] for c in d["cards"]) == 50 and d["leader"] for d in decks))
    check("no number appears more than four times",
          all(all(c["n"] <= 4 for c in d["cards"]) for d in decks))
    check("every card shares a colour with its Leader (§5-1)",
          all(all(set(re.split(r"[;/,]", byid[c["id"]][C["color"]] or ""))
                  & set(re.split(r"[;/,]", byid[d["leader"]][C["color"]] or "")) for c in d["cards"]) for d in decks))
    check("no Leader is in a main deck (§5-1)",
          all(all(byid[c["id"]][C["type"]] != "Leader" for c in d["cards"]) for d in decks))
    check("the name says it was built from the set, never that it IS the product",
          all("built from" in d["name"] and "Starter Deck" not in d["name"] for d in decks))
    check("ids are stable and unique", len({d["id"] for d in decks}) == len(decks))
    # controls: a mutated deck must fail the same checks
    bad = json.loads(json.dumps(decks[0])); bad["cards"][0]["n"] = 5
    check("control: five copies of a number is caught", not all(c["n"] <= 4 for c in bad["cards"]))
    bad2 = json.loads(json.dumps(decks[0])); bad2["cards"].pop()
    check("control: a deck short of fifty is caught", sum(c["n"] for c in bad2["cards"]) != 50)
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("stockdecks.py guards:"); raise SystemExit(0 if selftest() else 1)
    cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
    d = build(cat, verbose=True)
    for x in d[:4]:
        print("   ", x["id"], x["name"], "|", len(x["cards"]), "numbers")
