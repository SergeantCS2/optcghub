#!/usr/bin/env python3
"""Card proofs: the record of which cards the Sim is PROVEN to run as their text reads (take 122).

A proof is `tools/cards/<card number>.json`: the card's effect text, the rule
sections it touches, scenarios that drive the shipped engine (run by
tools/cardproof.mjs), and a verdict -- `proven`, or `wrong` with the reason. It
is named by number so a person finds it; it BINDS to printings, never to the
number (AGENTS §3): the build marks a printing only when its effect lines and
the parser's reading of them are exactly the ones the proof was written
against. An errata'd reprint, or a parser change that reads the card
differently, reopens the proof by itself; it is reported stale, never counted.

    python3 tools/cards.py                  # the proofs and what they bind to
    python3 tools/cards.py --new ST01-007   # scaffold a proof from the current text and reading
    python3 tools/cards.py --selftest       # controls: a changed text or parse binds nothing
Called by build_app.py (`cat["proof"]`).
"""
import hashlib, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "tools", "cards")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import effects as fx  # noqa: E402

REMINDER = re.compile(r"^\[(Blocker|Rush|Double Attack|Banish|Unblockable|Rush: Character)\]\s*\(")


def effect_lines(text):
    """The lines a printing's effects are read from -- the same split effects.py builds on."""
    return [l for l in fx.lines_of(text) if not REMINDER.match(l)]


def text_fp(text):
    return hashlib.sha1("\n".join(effect_lines(text)).encode("utf-8")).hexdigest()[:16]


def fx_fp(lines):
    """The parser's reading of a printing, scripted lines only (a by-hand line runs nothing to prove)."""
    got = [{k: v for k, v in e.items() if k != "raw"} for e in (lines or []) if not e.get("hand")]
    return hashlib.sha1(json.dumps(got, sort_keys=True).encode("utf-8")).hexdigest()[:16]


def load(d=DIR):
    out = []
    if not os.path.isdir(d):
        return out
    for f in sorted(os.listdir(d)):
        if f.endswith(".json"):
            p = json.load(open(os.path.join(d, f), encoding="utf-8"))
            p["_file"] = f
            out.append(p)
    return out


def problems(p):
    out = []
    if p.get("verdict") not in ("proven", "wrong"):
        out.append(f"verdict {p.get('verdict')!r}")
    if p["verdict"] == "wrong" and not p.get("why"):
        out.append("a wrong verdict says why")
    if not p.get("scenarios"):
        out.append("no scenarios")
    elif not any(s.get("must_not") for s in p["scenarios"]):
        out.append("no scenario of what it must NOT do (AGENTS rule 2)")
    if p.get("_file") and p["_file"] != p.get("num", "") + ".json":
        out.append(f"file {p['_file']} does not match its number {p.get('num')}")
    for k in ("num", "text_fp", "fx_fp"):
        if not p.get(k):
            out.append(f"no {k}")
    return out


def bind(cat, effects, proofs=None):
    """{printing id: {v, why?}} for every printing whose text and reading match its proof; and a report."""
    proofs = load() if proofs is None else proofs
    C = {n: i for i, n in enumerate(cat["cols"])}
    by_num = {}
    for r in cat["rows"]:
        if not r[C["sealed"]] and r[C["num"]]:
            by_num.setdefault(r[C["num"]], []).append(r)
    proof, report = {}, {"files": len(proofs), "bound": 0, "stale": [], "bad": []}
    for p in proofs:
        bad = problems(p)
        if bad:
            report["bad"].append(f"{p.get('_file')}: " + "; ".join(bad)); continue
        hit = 0
        for r in by_num.get(p["num"], []):
            pid = str(r[C["id"]])
            if text_fp(r[C["text"]]) == p["text_fp"] and fx_fp(effects.get(pid)) == p["fx_fp"]:
                proof[pid] = {"v": p["verdict"], "num": p["num"]}
                if p.get("why"):
                    proof[pid]["why"] = p["why"]
                hit += 1
        report["bound"] += hit
        if not hit:
            report["stale"].append(p["num"])
    return proof, report


def scaffold(num, cat, effects):
    """A new proof's frame: the text and reading of the number's cheapest printing, and empty scenarios to write."""
    C = {n: i for i, n in enumerate(cat["cols"])}
    rows = sorted((r for r in cat["rows"] if r[C["num"]] == num and not r[C["sealed"]]), key=lambda r: (r[C["market"]] or 9e9))
    if not rows:
        raise SystemExit(f"no printing numbered {num}")
    r = rows[0]; pid = str(r[C["id"]])
    return {"num": num, "name": r[C["name"]], "text": "\n".join(effect_lines(r[C["text"]])), "text_fp": text_fp(r[C["text"]]),
            "fx_fp": fx_fp(effects.get(pid)), "reading": [e for e in effects.get(pid, [])], "rules": [], "verdict": "proven",
            "scenarios": [{"name": "what it does", "board": {}, "do": [], "expect": {}},
                          {"name": "what it must not do", "must_not": True, "board": {}, "do": [], "expect": {}}]}


def selftest():
    ok = True
    def say(c, what):
        nonlocal ok
        print(f"  {'ok  ' if c else 'FAIL'}  {what}"); ok &= bool(c)
    cat = {"cols": ["sealed", "id", "num", "name", "text", "market"], "rows": [
        [0, 1, "ZZ01-001", "Probe", "[On Play] Draw 1 card.", 1.0],
        [0, 2, "ZZ01-001", "Probe", "[On Play] Draw 2 cards.", 2.0]]}          # an errata'd reprint: another text
    eff = {"1": [fx.parse_line("[On Play] Draw 1 card.")], "2": [fx.parse_line("[On Play] Draw 2 cards.")]}
    good = {"num": "ZZ01-001", "verdict": "proven", "text_fp": text_fp("[On Play] Draw 1 card."), "fx_fp": fx_fp(eff["1"]), "_file": "ZZ01-001.json",
            "scenarios": [{"name": "draws one"}, {"name": "not twice", "must_not": True}]}
    proof, rep = bind(cat, eff, [good])
    say(list(proof) == ["1"], "a proof binds the printing whose text and reading it was written on, and not the errata'd one")
    changed = {"1": [dict(eff["1"][0], do=[{"a": "draw", "n": 3}])], "2": eff["2"]}
    proof, rep = bind(cat, changed, [good])
    say(proof == {} and rep["stale"] == ["ZZ01-001"], "control: a parser that reads the card differently reopens it (stale, bound to nothing)")
    proof, rep = bind(cat, eff, [dict(good, scenarios=[{"name": "draws one"}])])
    say(proof == {} and rep["bad"], "control: a proof with no must-not scenario is refused")
    proof, rep = bind(cat, eff, [dict(good, verdict="wrong")])
    say(proof == {} and rep["bad"], "control: a wrong verdict with no reason is refused")
    say(fx_fp(eff["1"] + [{"t": "main", "if": [], "do": [], "hand": True, "raw": "x"}]) == fx_fp(eff["1"]), "a by-hand line does not change what is proven")
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("cards.py controls:"); raise SystemExit(0 if selftest() else 1)
    cat = json.load(open(os.path.join(ROOT, "www", "bundle", "catalog.json")))
    eff = cat.get("effects") or fx.build(cat)[0]
    if "--new" in sys.argv:
        num = sys.argv[sys.argv.index("--new") + 1].upper()
        out = os.path.join(DIR, num + ".json")
        if os.path.exists(out):
            raise SystemExit(f"{out} exists")
        os.makedirs(DIR, exist_ok=True)
        json.dump(scaffold(num, cat, eff), open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        print(f"  wrote {os.path.relpath(out, ROOT)} -- write its scenarios, then run node tools/cardproof.mjs"); raise SystemExit(0)
    proof, rep = bind(cat, eff)
    print(f"  {rep['files']} proofs, {rep['bound']} printings bound; stale: {rep['stale'] or 'none'}; refused: {rep['bad'] or 'none'}")
