#!/usr/bin/env python3
"""A showcase collection and deck, composed from the built catalogue (take 37).

    python3 tools/showcase.py            # writes showcase/collection.csv, showcase/deck.txt

For the listing screenshots: a collection with headline printings, a set
run with gaps (so the binder and checklist read), playsets, a trade pile, and
a legal fifty-card deck. Every row is a productId the app knows (landmine 1),
the deck obeys §5-1 by construction, and smoke.mjs imports both and asserts
it. Deterministic: the same catalogue gives the same files. Prices in the CSV
are the day's, informational; the app values by its own catalogue on import.
"""
import csv, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "showcase")
cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
C = {n: i for i, n in enumerate(cat["cols"])}
rows = [r for r in cat["rows"] if not r[C["sealed"]] and r[C["num"]]]
sets = {s["id"]: s for s in cat["sets"]} if isinstance(cat["sets"], list) else cat["sets"]
def g(r, k): return r[C[k]]
def abbr(r):
    s = sets.get(g(r, "set")) if isinstance(sets, dict) else None
    s = s or sets.get(str(g(r, "set")), {})
    return s.get("abbr") or ""
def set_of_number(num): return num.split("-")[0]

byid = {g(r, "id"): r for r in rows}
bynum = {}
for r in rows: bynum.setdefault(g(r, "num"), []).append(r)
def dearest(num): return max(bynum.get(num, []), key=lambda r: g(r, "market") or 0, default=None)
def base(num):
    sib = [r for r in bynum.get(num, []) if g(r, "treat") == "base"] or bynum.get(num, [])
    return min(sib, key=lambda r: g(r, "market") or 9e9, default=None)

lines = []  # (portfolio, row, qty, condition, paid)
def add(pf, r, qty=1, cond="NM", paid=None):
    if r is not None and g(r, "id") not in {g(x[1], "id") for x in lines}:
        lines.append((pf, r, qty, cond, paid))

# 1. headliners: the two the ledger keeps citing, then the dearest printing of
#    six iconic numbers, each from a different set, priced where a real
#    collector could plausibly own it
add("", dearest("OP01-016"), 1, "NM", None)                     # Nami, dearest printing
add("", dearest("EB03-024"), 1, "NM", None)                     # Vivi SP (landmine 1)
cands = sorted((r for r in rows if 40 <= (g(r, "market") or 0) <= 600 and g(r, "treat") != "base"),
               key=lambda r: -(g(r, "market") or 0))
seen_sets = {set_of_number("OP01-016"), set_of_number("EB03-024")}
for r in cands:
    st = set_of_number(g(r, "num"))
    if st in seen_sets: continue
    seen_sets.add(st); add("", r, 1, "NM", round((g(r, "market") or 0) * 0.62, 2))
    if len(lines) >= 8: break

# 2. a set run with gaps: OP01-001..036, base printings, six numbers missing
gaps = {"OP01-004", "OP01-009", "OP01-015", "OP01-022", "OP01-028", "OP01-033"}
for i in range(1, 37):
    num = f"OP01-{i:03d}"
    if num in gaps: continue
    r = base(num)
    if not r: continue
    qty = 4 if i % 7 == 0 else (2 if i % 5 == 0 else 1)
    cond = "LP" if i % 6 == 0 else ("MP" if i == 11 else "NM")
    paid = round((g(r, "market") or 0) * 0.8, 2) if i % 3 == 0 and (g(r, "market") or 0) > 1 else None
    add("", r, qty, cond, paid)

# 3. playsets from other sets: the cheapest printing of the four dearest
#    commons/uncommons in ST01, OP02, OP05, OP06 -- what a player actually holds
for st in ("ST01", "OP02", "OP05", "OP06"):
    pool = [r for r in rows if g(r, "num").startswith(st + "-") and g(r, "rarity") in ("C", "UC") and g(r, "treat") == "base"]
    for r in sorted(pool, key=lambda r: -(g(r, "market") or 0))[:2]:
        add("", r, 4, "NM", None)

# 4. a trade pile: five mid-value alternate arts from anywhere
pile = [r for r in rows if g(r, "treat") in ("alternate_art", "parallel") and 8 <= (g(r, "market") or 0) <= 40]
for r in sorted(pile, key=lambda r: -(g(r, "market") or 0))[:5]:
    add("Trade pile", r, 1, "NM", None)

os.makedirs(OUT, exist_ok=True)
head = ["portfolio", "product_id", "number", "name", "printing", "set", "rarity", "finish", "condition",
        "qty", "paid_usd", "market_usd", "low_usd", "high_usd", "price_source", "price_as_of", "added"]
with open(os.path.join(OUT, "collection.csv"), "w", newline="") as f:
    w = csv.writer(f, quoting=csv.QUOTE_ALL); w.writerow(head)
    for pf, r, qty, cond, paid in lines:
        w.writerow([pf, g(r, "id"), g(r, "num"), g(r, "name"), g(r, "treat"), abbr(r) or set_of_number(g(r, "num")),
                    g(r, "rarity") or "", g(r, "sub") or "", cond, qty, paid if paid is not None else "",
                    g(r, "market") or "", g(r, "low") or "", g(r, "high") or "", "TCGplayer via TCGCSV", "", ""])
total = sum((g(r, "market") or 0) * q for _, r, q, _, _ in lines)
print(f"  collection.csv: {len(lines)} lines, {sum(q for *_, q, _, _ in [(0,0,x[2],0,0) for x in lines])} cards, ${total:,.2f} at today's market")

# 5. the deck: a mono-Red list built to §5-1 -- one Leader, fifty cards,
#    four per number, every card sharing the Leader's colour
leader = next((r for r in bynum.get("OP01-001", []) if g(r, "type") == "Leader"), None) \
      or next((r for r in rows if g(r, "type") == "Leader" and g(r, "color") == "Red"), None)
colour = g(leader, "color")
#    Main sets and starters of the Leader's era only -- no promos, no
#    pre-release stamps -- so the list reads like a deck someone owns. The
#    number is what the rules count; the app picks the printing on import.
ERA = ("OP01-", "ST01-", "OP02-", "OP03-", "OP04-", "OP05-", "EB01-")
pool = {}
for r in rows:
    n = g(r, "num")
    if (g(r, "type") in ("Character", "Event", "Stage") and g(r, "color") == colour
            and (g(r, "cost") or "").isdigit() and n.startswith(ERA) and g(r, "treat") == "base"):
        if n not in pool or (g(r, "market") or 0) > (g(pool[n], "market") or 0): pool[n] = r
# dearest base printing first within a cost: the cards people play are the ones people pay for
chars = sorted((r for r in pool.values() if g(r, "type") == "Character"), key=lambda r: (int(g(r, "cost")), -(g(r, "market") or 0), g(r, "num")))
curve = {1: 2, 2: 3, 3: 3, 4: 2, 5: 1, 6: 1}      # numbers per cost, x4 copies = 48
deck, used = [], set()
for cost, n_nums in curve.items():
    picks = [r for r in chars if int(g(r, "cost")) == cost and (g(r, "kw") or "" ) != ""][:n_nums]
    picks += [r for r in chars if int(g(r, "cost")) == cost and r not in picks][:n_nums - len(picks)]
    for r in picks: deck.append((4, r)); used.add(g(r, "num"))
events = [r for r in pool.values() if g(r, "type") == "Event" and g(r, "num") not in used]
events.sort(key=lambda r: (int(g(r, "cost")), g(r, "num")))
if events: deck.append((2, events[0]))
have = sum(n for n, _ in deck)
while have < 50:                                    # top up to exactly fifty
    extra = next(r for r in chars if g(r, "num") not in used)
    k = min(4, 50 - have); deck.append((k, extra)); used.add(g(extra, "num")); have += k
assert sum(n for n, _ in deck) == 50 and all(n <= 4 for n, _ in deck)
with open(os.path.join(OUT, "deck.txt"), "w") as f:
    f.write(f"# Showcase {colour} {g(leader, 'name')}\n1 {g(leader, 'num')} {g(leader, 'name')} (Leader)\n\n")
    for n, r in deck: f.write(f"{n} {g(r, 'num')} {g(r, 'name')}\n")
print(f"  deck.txt: Leader {g(leader, 'num')} {g(leader, 'name')} ({colour}), {len(deck)} numbers, 50 cards")
