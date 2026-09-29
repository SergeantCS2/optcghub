#!/usr/bin/env python3
"""Wording families: one effect, many phrasings (take 122; the owner: "cards use different wording for the
same thing so we need to ensure we catch everything").

Every effect line the parser does not run is reduced to its SKELETON -- tags read through canon_tag(),
numbers as N, a [name] as [X], a {type} or a quoted type as {T}, a trailing note dropped -- and lines with
one skeleton are one family. A family whose words are close to a wording the parser already runs is
flagged as a VARIANT of it: that is where a whole template is probably one phrasing away (take 122 found
"Give this Leader or 1 of your Characters up to 1 rested DON!! card." beside the scripted "Give up to 1
rested DON!! card to your Leader or 1 of your Characters."). Tags the parser does not know are listed
too -- the "[Activate:Main]" spelling hid 417 lines until take 122.

    python3 tools/wording.py              # the families, largest first; variants flagged; unknown tags
    python3 tools/wording.py --top 60     # more of them
    python3 tools/wording.py --selftest   # controls
Writes look/wording.md (generated, not committed).
"""
import collections, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import effects as fx  # noqa: E402

TAG = re.compile(r"^\[([^\]]+)\]\s*")


def split_tags(line):
    s, tags = line.strip(), []
    while True:
        m = TAG.match(s)
        if not m:
            return tags, s
        tags.append(fx.canon_tag(m.group(1))); s = s[m.end():].lstrip("/ ")


def skeleton(line):
    """What a line says with its particulars taken out: the family key."""
    tags, s = split_tags(fx.without_notes(line))
    s = re.sub(r"\[[^\]]+\]", "[X]", s)                      # a named card, or a keyword in the body
    s = re.sub(r"\{[^}]+\}|\"[^\"]+\"", "{T}", s)            # a type
    s = re.sub(r"[+\-\u2212]?\d+", "N", s)
    s = re.sub(r"\s+", " ", s).strip()
    head = " ".join(f"[{t}]" for t in tags if not re.fullmatch(r"DON!! x\d+", t)) + (" [DON!! xN]" if any(re.fullmatch(r"DON!! x\d+", t) for t in tags) else "")
    return (head.strip() + " " + s).strip()


def words(s):
    return set(re.findall(r"[a-z]+|\[x\]|\{t\}|n", s.lower()))


def similar(a, b):
    A, B = words(a), words(b)
    return len(A & B) / max(1, len(A | B))


def family_of(sk):
    body = re.sub(r"^(\[[^\]]+\]\s*)+", "", sk)
    for k, rx in (("When ...", r"^(When|Once per turn, when|If .*?, when)\b"), ("If ...", r"^If\b"), ("This ...", r"^This\b"),
                  ("All ...", r"^All\b"), ("Your opponent ...", r"^Your opponent\b"), ("Choose one", r"^Choose one\b")):
        if re.match(rx, body):
            return k
    return body.split(" ")[0] if body else "(tags only)"


def survey(cat):
    C = {n: i for i, n in enumerate(cat["cols"])}
    known = set(fx.HAND_TRIGGERS) | set(fx.CONDS) | set(fx.KEYWORD_TAGS)
    run_sk, fams, unknown = collections.Counter(), {}, collections.Counter()
    seen = set()
    for r in cat["rows"]:
        if r[C["sealed"]] or not r[C["num"]]:
            continue
        for line in fx.lines_of(r[C["text"]]):
            tags, body = split_tags(line)
            for t in tags:
                if t not in known and not re.fullmatch(r"DON!! x\d+", t):
                    unknown[t] += 1
            if any(t in fx.KEYWORD_TAGS for t in tags) and body.startswith("("):
                continue                                      # a keyword and its reminder: nothing to run
            sk = skeleton(line)
            if fx.parse_line(line):
                run_sk[sk] += 1; continue
            f = fams.setdefault(sk, {"lines": set(), "printings": 0, "timed": bool(fx.hand_lines(line)), "family": family_of(sk)})
            f["printings"] += 1
            if line not in seen:
                f["lines"].add(line); seen.add(line)
    runs = list(run_sk)
    for sk, f in fams.items():
        best = max(((similar(sk, r), r) for r in runs), default=(0, None))
        f["variant"] = best[1] if best[0] >= 0.72 else None
        f["score"] = round(best[0], 2)
    return fams, run_sk, unknown


def selftest():
    ok = True
    def say(c, what):
        nonlocal ok
        print(f"  {'ok  ' if c else 'FAIL'}  {what}"); ok &= bool(c)
    say(skeleton("[On Play] K.O. up to 1 of your opponent's Characters with a cost of 3 or less.") == skeleton("[On Play] K.O. up to 1 of your opponent's Characters with a cost of 5 or less."),
        "two lines that differ only in a number are one family")
    say(skeleton("[Activate:Main] Draw 1 card.") == skeleton("[Activate: Main] Draw 2 cards.".replace("cards", "card")), "a tag's spellings are one family")
    say(skeleton('[On Play] Look at 5 cards; reveal up to 1 {Navy} type card.') == skeleton('[On Play] Look at 5 cards; reveal up to 1 "Straw Hat" type card.'), "a {type} and a quoted type are one family")
    a = skeleton("[Activate: Main] Give this Leader or 1 of your Characters up to 1 rested DON!! card.")
    b = skeleton("[Activate: Main] Give up to 1 rested DON!! card to your Leader or 1 of your Characters.")
    c = skeleton("[Activate: Main] Trash 1 card from your hand.")
    say(similar(a, b) >= 0.72 and similar(a, c) < 0.72, f"the Luffy wording is a variant of the scripted one ({similar(a, b):.2f}); control: an unrelated line is not ({similar(a, c):.2f})")
    say(family_of(skeleton("[Your Turn] When a Character is K.O.'d, give up to 1 rested DON!! card to this Leader.")) == "When ...", "an untimed 'When ...' line is named as that family")
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("wording.py controls:"); raise SystemExit(0 if selftest() else 1)
    top = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 25
    cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json"), encoding="utf-8"))
    fams, runs, unknown = survey(cat)
    order = sorted(fams.items(), key=lambda kv: -kv[1]["printings"])
    tot = sum(f["printings"] for f in fams.values()); var = [kv for kv in order if kv[1]["variant"]]
    by_fam = collections.Counter()
    for sk, f in fams.items():
        by_fam[("timed" if f["timed"] else "untimed") + " / " + f["family"]] += f["printings"]
    out = [f"# Wording families -- {len(fams)} families, {tot} unscripted printing-lines; {len(runs)} scripted skeletons", "",
           "## Unknown tags (a spelling canon_tag does not know)", ""] + [f"- `[{t}]` x{n}" for t, n in unknown.most_common()] + ["",
           "## By family", ""] + [f"- {k}: {n}" for k, n in by_fam.most_common(20)] + ["",
           "## Variants: close to a wording the parser runs", "", "| printings | family | skeleton | close to |", "|---|---|---|---|"] + \
          [f"| {f['printings']} | {f['family']} | {sk} | {f['variant']} ({f['score']}) |" for sk, f in var[:200]] + ["",
           f"## The {top} largest families", "", "| printings | timed | skeleton | e.g. |", "|---|---|---|---|"] + \
          [f"| {f['printings']} | {'yes' if f['timed'] else 'no'} | {sk} | {sorted(f['lines'])[0][:120] if f['lines'] else ''} |" for sk, f in order[:top]]
    os.makedirs(os.path.join(ROOT, "look"), exist_ok=True)
    open(os.path.join(ROOT, "look", "wording.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"  {len(fams)} families over {tot} unscripted printing-lines; {len(var)} families close to a scripted wording; "
          f"unknown tags: {', '.join(f'[{t}] x{n}' for t, n in unknown.most_common(6)) or 'none'}")
    for k, n in by_fam.most_common(8):
        print(f"    {n:5}  {k}")
    for sk, f in var[:10]:
        print(f"    variant ({f['printings']}): {sk[:90]}\n        ~ {f['variant'][:90]}")
    print("  wrote look/wording.md")
