#!/usr/bin/env python3
"""The contract. If this fails, the repo is wrong — do not work around it.

Every check corresponds to a mistake that is easy to make and hard to notice.
Every check has a negative control in `--selftest`; a guard nobody has watched
fail is not a guard (AGENTS rule 2, APEX landmine 54, which fired eight times
over there and three times here on day one).
"""
import json, os, re, subprocess, sqlite3, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import ROOT, CATALOG_DB, MANIFEST

DOCS = os.path.join(ROOT, "docs")
FAILS, NOTES = [], []


def fail(check, msg):
    FAILS.append(f"{check}: {msg}")


def note(msg):
    NOTES.append(msg)


def read(*p):
    fn = os.path.join(ROOT, *p)
    return open(fn).read() if os.path.exists(fn) else ""


def take():
    for line in read("BUILD").splitlines():
        if line.startswith("VAULT_TAKE="):
            return int(line.split("=", 1)[1])
    fail("build", "BUILD has no VAULT_TAKE")
    return 0


# --------------------------------------------------------------------------
def check_docs_current(n):
    """APEX landmine 98: a document kept apart from the thing it describes drifts.
    The stamp is the cheapest possible tripwire for that."""
    for fn in sorted(os.listdir(DOCS)):
        if not fn.endswith(".md") or fn in ("HANDOFF.md", "DECISIONS-OPEN.md"):
            continue
        s = read("docs", fn)
        m = re.search(r"\*Current as of take (\d+)\.\*", s)
        if not m:
            note(f"docs/{fn} has no stamp line")
        elif int(m.group(1)) != n:
            fail("docs-current", f"docs/{fn} stamped take {m.group(1)}, BUILD says {n}")


def check_handoff(n):
    """PROTOCOL §6: the record is written before the build, so it is never the
    thing that gets dropped when a response runs out of room."""
    s = read("docs", "HANDOFF.md")
    if f"## Take {n} " not in s:
        fail("handoff", f"no HANDOFF entry for take {n} — write it FIRST (PROTOCOL §6)")
    if f"# HANDOFF — through Take {n}" not in s:
        fail("handoff", f"HANDOFF header is not 'through Take {n}'")
    body = s.split(f"## Take {n} ", 1)[-1].split("\n## Take ", 1)[0]
    # A HEADING, not the word. Take 9's intro said "every DEFERRED list since
    # take 1" and this check passed on an entry with no deferred section at all
    # (landmine 69 in the gate). The section must exist and must have content.
    m = re.search(r"^### DEFERRED[^\n]*\n(.*?)(?=^### |\Z)", body, re.M | re.S)
    if not m:
        fail("handoff", f"take {n} entry has no '### DEFERRED' section (PROTOCOL §6)")
    elif len(m.group(1).strip()) < 40:
        fail("handoff", f"take {n} DEFERRED section is empty — say what was not done")


def check_agenda():
    """An agenda that does not say what was ruled out lets the next session
    re-derive a dead end. APEX spent 27 takes with a mislabelled blocker."""
    s = read("docs", "AGENDA.md")
    for m in re.finditer(r"^## (A\d+) — (.+)$", s, re.M):
        body = s[m.end():].split("\n## ", 1)[0]
        if "Ruled out" not in body and "CLOSED" not in m.group(2):
            fail("agenda", f"{m.group(1)} lists nothing RULED OUT")


def check_docs_complete():
    """Landmine 87. 'The docs are in the seed' was a habit for seventeen takes.
    A habit is something a session can forget under pressure; a gate check is
    not. Every ledger and runbook, by name, or nothing ships."""
    REQUIRED = ["AGENDA.md", "HANDOFF.md", "LANDMINES.md", "PROTOCOL.md",
                "PROVISION.md", "ROADMAP.md", "RULES.md", "RUNBOOK.md",
                "RUNBOOK-play.md", "DECISIONS-OPEN.md", "PLAY-LISTING.md",
                "V1-STATE.md", "NEW-SESSION-PROMPT.md"]
    for fn in REQUIRED:
        path = os.path.join(DOCS, fn)
        if not os.path.exists(path):
            fail("docs", f"docs/{fn} is missing from the seed")
        elif os.path.getsize(path) < 500:
            fail("docs", f"docs/{fn} is {os.path.getsize(path)} bytes — a stub is not a doc")
    for fn in ("AGENTS.md", "README.md", "BUILD", "ci/RELEASE.md", "ci/build.yml",
               "ci/bootstrap.yml", "ci/apk.sh", "ci/bundle.sh"):
        if not os.path.exists(os.path.join(ROOT, fn)):
            fail("docs", f"{fn} is missing from the seed")


def check_ledger_integrity():
    """Landmine 76. A `s.replace(heading, NEW + rest_of_doc)` edit appends the
    rest of the document INSIDE the replacement while the original rest remains,
    so the tail duplicates. It happened three times across takes 11-12 and the
    agenda grew to three copies of A4-A12 before anyone noticed, one copy
    carrying a stale heading. A ledger with two versions of a section is a ledger
    that will be read wrong."""
    for fn, pat, what in (("AGENDA.md", r"^## (A\d+[a-z]?) ", "agenda item"),
                          # `**NN. ` with the space: take 16 wrote "**49.8%** of them" at a
                          # line start and the bare pattern read it as a duplicate entry 49.
                          ("LANDMINES.md", r"^\*\*(\d+)\. ", "landmine"),
                          ("LANDMINES.md", r"^\*\*(A-\d+)\.\*\*", "inherited landmine"),
                          ("HANDOFF.md", r"^## Take (\d+) ", "take entry")):
        body = read("docs", fn)
        ids = re.findall(pat, body, re.M)
        dupes = sorted({x for x in ids if ids.count(x) > 1})
        if dupes:
            fail("ledger", f"docs/{fn} has duplicate {what}(s): {', '.join(dupes)} "
                           f"(landmine 76)")


def check_landmine_citations():
    """A citation pointing at the wrong entry is worse than none: it sends the
    next reader to a finding about something else. This fired in take 2."""
    s = read("docs", "LANDMINES.md")
    known = set(int(x) for x in re.findall(r"^\*\*(\d+)\. ", s, re.M))
    apex  = set(int(x) for x in re.findall(r"^\*\*A-(\d+)\.\*\*", s, re.M))
    if not known:
        fail("landmines", "no numbered entries found")
    for root, _, files in os.walk(os.path.join(ROOT, "tools")):
        for fn in files:
            if not fn.endswith((".py", ".mjs")):
                continue
            body = open(os.path.join(root, fn)).read()
            for prefix, cite in re.findall(
                    r"(APEX |A-)?landmine[s]? (\d+)", body, re.I):
                n = int(cite)
                inherited = bool(prefix)
                if inherited and n not in apex:
                    fail("landmines", f"tools/{fn} cites APEX landmine {n}, "
                                      f"which is not carried in §2")
                elif not inherited and n not in known:
                    fail("landmines",
                         f"tools/{fn} cites landmine {cite}, which does not exist")


def check_prompt_ratchet():
    """`prompt()` is the placeholder UI this repo keeps replacing (Leader picker
    take 14, set chip take 16, portfolios take 20). The count may only fall. The
    ceiling is recorded here and lowered when one is removed; a new prompt()
    fails the gate the same take it is written."""
    CEILING = 0
    n = read("src", "app.html").count("prompt('")
    if n > CEILING:
        fail("prompt-ratchet", f"src/app.html has {n} prompt() calls; the ceiling is {CEILING}. "
                               f"Build a sheet, not a prompt.")
    elif n < CEILING:
        note(f"prompt() count is {n}, below the ceiling of {CEILING} — lower CEILING")


def check_escapes_in_markup():
    """Landmine 99. A JS escape like \\u2699 written inside HTML text renders as
    the six literal characters. Twice now (takes 19 and 24), both from Python
    heredocs that treat backslash-u the same whether the target is a <script>
    or a <button>. Strip the script blocks and refuse the pattern elsewhere."""
    html = read("www", "index.html")
    if not html:
        return
    stripped = re.sub(r"<script\b.*?</script>", "", html, flags=re.S | re.I)
    stripped = re.sub(r"<!--.*?-->", "", stripped, flags=re.S)
    hits = re.findall(r"\\u[0-9a-fA-F]{4}", stripped)
    if hits:
        fail("markup", f"www/index.html has JS escapes in HTML text: {', '.join(sorted(set(hits))[:5])} "
                       f"(landmine 99) — use &#NNNN; entities in markup")


def check_duplicate_ids():
    """Landmine 90. Two elements with id="guide": the scanner's viewfinder (take
    2) and the first-run tour (take 19). $('#guide') returned the first, the
    tour's CSS hit both, and the tour reported itself shown while painting a
    0x0 box. Duplicate ids fail silently in every browser; the gate does not."""
    html = read("www", "index.html")
    if not html:
        return note("www/ not built — id check skipped")
    ids = re.findall(r'\sid="([^"]+)"', html)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        fail("dup-id", f"www/index.html has duplicate id(s): {', '.join(dupes)} (landmine 90)")


def check_play_readiness():
    """A21. The privacy page must exist, be served with the app, and name the
    one thing that leaves the phone (AdMob). Landmine 94: the Data Safety
    declaration and the privacy page must agree with what the APK requests."""
    pv = read("src", "privacy.html")
    if not pv:
        fail("play", "src/privacy.html missing (A21 #6)")
    elif "AdMob" not in pv or "advertising ID" not in pv:
        fail("play", "privacy.html does not name AdMob and the advertising ID (landmine 94)")
    if os.path.exists(os.path.join(ROOT, "www", "index.html")) and not os.path.exists(os.path.join(ROOT, "www", "privacy.html")):
        fail("play", "www/ lacks privacy.html — Pages will not serve it")
    lst = read("docs", "PLAY-LISTING.md")
    if lst and "Not affiliated with Bandai" not in lst.split("## Category")[0]:
        fail("play", "PLAY-LISTING.md full description does not open with the disclaimer (A8)")


def check_stale_copy():
    """Landmine 88. Copy outlives the design that made it true. 'No counter,
    no cap' was written at take 2 and was still on the scan screen at take 18,
    six takes after A17 designed a credit gate on saving. A phrase that is
    false under the CURRENT design goes here the moment the design changes,
    and the gate refuses it in any user-facing file."""
    BANNED = [
        ("No counter, no cap",  "A17 gates saves; scanning is unlimited, saving is not"),
        ("no ads",              "A17 — rewarded ads are designed in"),
        ("APEX VAULT",          "renamed at take 4"),
        ("apex-vault",          "renamed at take 4"),
        ("Unlimited scans. No", "take-2 phrasing; see A17"),
    ]
    files = ["src/app.html", "README.md", "ci/RELEASE.md", "docs/RUNBOOK.md", "docs/RUNBOOK-play.md"]
    for f in files:
        body = read(*f.split("/"))
        # strip code comments so a landmine explanation does not trip its own guard
        stripped = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
        stripped = re.sub(r"<!--.*?-->", "", stripped, flags=re.S)
        for phrase, why in BANNED:
            if phrase.lower() in stripped.lower():
                fail("stale-copy", f"{f} still says '{phrase}' — {why}")


def check_no_condition_multiplier():
    """PROTOCOL §10.3. TCGCSV publishes no per-condition pricing (landmine 4), so
    any arithmetic that scales value by condition is invented — a confident wrong
    answer about someone's money. Structural, not a resolution to be careful."""
    for p in ("src/app.html", "www/app.js"):
        s = read(p)
        if re.search(r"(0\.8[05]|0\.9[05]|0\.7[05])\s*(?://.*)?$", s, re.M) and \
           re.search(r"cond", s, re.I):
            fail("honesty", f"{p} may apply a condition multiplier (PROTOCOL §10.3)")


def check_offline(prov_hosts):
    """PROTOCOL §8. A CDN reference passes every bench test and dies in a card
    shop basement. Every remote origin in the shipped app must be declared."""
    js, html = read("www", "app.js"), read("www", "index.html")
    if not js:
        return note("www/ not built — offline check skipped")
    found = set(re.findall(r"https?://([a-z0-9.-]+)", js + html, re.I))
    # XML namespace URIs are identifiers, never fetched: the inline SVG compass
    # carries xmlns="http://www.w3.org/2000/svg". Named here, not in PROVISION,
    # because PROVISION lists hosts the app TALKS to and this is not one.
    NAMESPACES = {"www.w3.org"}
    for h in found:
        if h in NAMESPACES:
            continue
        if h not in prov_hosts and not h.endswith("localhost"):
            fail("offline", f"undeclared remote host '{h}' in www/ "
                            f"— declare it in docs/PROVISION.md (PROTOCOL §8)")
    if "window.fetch =" not in js:
        fail("offline", "the app does not wrap fetch — the NET badge would be a promise")


def provision_hosts():
    s = read("docs", "PROVISION.md")
    return set(re.findall(r"`([a-z0-9.-]+\.[a-z]{2,})`", s))


def check_variant_keying():
    """AGENTS rule 3, enforced against the BUILT bundle rather than a list.
    Landmine 1 and 41: identity, quantity and value key off productId or they are
    wrong by up to 4,292x."""
    b = os.path.join(ROOT, "www", "bundle", "catalog.json")
    if not os.path.exists(b):
        return note("bundle not built — variant keying check skipped")
    cat = json.load(open(b))
    # By column NAME. Take 15 put `sealed` at column 0 and this check, which
    # had read r[0] as the id since take 2, reported 7,518 duplicates on a
    # correct bundle. A guard with a magic index is a guard that fires on the
    # next reorder (landmine 81).
    ci_id = cat["cols"].index("id")
    ids = [r[ci_id] for r in cat["rows"]]
    if len(set(ids)) != len(ids):
        fail("variant-keying", f"{len(ids)-len(set(ids))} duplicate printings "
                               f"in the bundle (landmine 44)")
    ci = cat["cols"].index
    num, treat = ci("num"), ci("treat")
    collide = {}
    for r in cat["rows"]:
        if not r[num]:
            continue                                   # sealed: no number, not a printing collision
        collide.setdefault(r[num], []).append(r)
    multi = sum(1 for v in collide.values() if len(v) > 1)
    if multi < len(collide) * 0.5:
        fail("variant-keying",
             f"only {multi}/{len(collide)} numbers have multiple printings; "
             f"MEASURED take 2 says ~79%. The variant parse is probably collapsing them.")
    js = read("www", "app.js")
    if "byNum" in js and "byId" not in js:
        fail("variant-keying", "the app indexes by number but not by productId")


def check_confidence_gate():
    """Landmine 41. If auto-accept coverage ever looks generous, the spread
    calculation has broken and the scanner has started guessing with money."""
    if not os.path.exists(CATALOG_DB):
        return note("catalogue not built — confidence check skipped")
    db = sqlite3.connect(CATALOG_DB)
    tot, safe = db.execute("SELECT SUM(n), SUM(CASE WHEN safe THEN n ELSE 0 END) "
                           "FROM number_group").fetchone()
    if not tot:
        return fail("confidence", "number_group is empty — the gate has no data")
    pct = 100 * safe / tot
    if pct > 15:
        fail("confidence", f"auto-accept {pct:.1f}% (MEASURED take 2: 8.9%). "
                           f"Being generous here misprices collections.")
    tot2, safe2 = db.execute("SELECT SUM(n), SUM(CASE WHEN safe THEN n ELSE 0 END) "
                             "FROM number_group_in_set").fetchone()
    note(f"auto-accept: {pct:.1f}% code alone, {100*safe2/tot2:.1f}% with set context")


def check_catalogue():
    if not os.path.exists(MANIFEST):
        return note("no manifest — catalogue checks skipped")
    import validate
    db = sqlite3.connect(CATALOG_DB)
    bad, stats = validate.check(db, json.load(open(MANIFEST)),
                                strict_hashes="--strict" in sys.argv)
    for b in bad:
        fail("catalogue", b)
    note(f"hash coverage {100*stats['hash_coverage']:.1f}%")


def check_harness():
    """APEX landmine 39: a verifier that passes while the product fails. Smoke
    must execute the SHIPPED artifact, not a copy of it."""
    s = read("tools", "smoke.mjs")
    if not s:
        return fail("harness", "tools/smoke.mjs missing")
    if "www/app.js" not in s and "'app.js'" not in s:
        fail("harness", "smoke.mjs does not load www/app.js — it is testing a copy")
    if "negative control" not in s.lower():
        fail("harness", "smoke.mjs has no negative controls (AGENTS rule 2)")
    if not os.path.exists(os.path.join(ROOT, "tools", "render.mjs")):
        note("tools/render.mjs missing — nothing proves the app DREW (APEX landmine 69)")


def check_secrets():
    """Landmine 23 / RUNBOOK-play A.3. The Play upload key never enters the tree."""
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in
                   (".git", "node_modules", "tcgcsv_cache", "catalog", "www")]
        for fn in files:
            if re.search(r"upload.*\.(jks|b64|keystore)$", fn, re.I):
                fail("secrets", f"{fn} looks like the Play upload key — it must "
                                f"live in repository secrets only")
    st = os.path.join(ROOT, "catalog", "star_template.json")
    if not os.path.exists(st):
        fail("scanner", "catalog/star_template.json missing — the scanner ships "
                        "without its star detector (A15)")
    else:
        t = json.load(open(st))
        if t.get("held_out", {}).get("false_positives", 1) != 0:
            fail("scanner", "star template has held-out false positives — landmine 60 "
                            "says it must never invent a star")
    if not os.path.exists(os.path.join(ROOT, "signing", "optcghub.keystore")):
        fail("secrets", "signing/optcghub.keystore missing — every take must sign "
                        "with the same key or it will not install over the last (A8)")
    gi = read(".gitignore")
    for pat in ("*upload*.jks", "tcgcsv_cache/", "catalog/"):
        if pat not in gi:
            fail("secrets", f".gitignore is missing '{pat}'")


def check_render_receipt():
    """Landmine 112. render.mjs falls back to a DOM check when Chrome is absent
    and says so -- but a seal read off the last line does not hear it, and
    take 37 sealed on "10 passed (mode: dom)". Chrome writes www/render.png
    and DOM mode does not, so the receipt must exist and be newer than the
    built app.js: this build was DRAWN, not merely parsed."""
    js, png = os.path.join(ROOT, "www", "app.js"), os.path.join(ROOT, "www", "render.png")
    if not os.path.exists(js):
        return note("www/ not built -- render receipt skipped")
    if not os.path.exists(png):
        return fail("render", "www/render.png missing -- render.mjs did not run in Chrome on this build "
                              "(npm install --no-save puppeteer acorn, then python3 tools/pipeline.py render)")
    if os.path.getmtime(png) < os.path.getmtime(js):
        fail("render", "www/render.png is older than www/app.js -- rebuild, then render in Chrome (landmine 112)")


def check_scrub():
    """Take 35. Nothing public carries the owner's first name, an AI vendor's
    name, a session reference, a credential-shaped string, a build-container path
    or a leftover marker: the shipped www/, the public-facing text, and the
    ledgers (the repo is public). tools/scrub.py --check --docs; its own
    negative controls run under check_selftests."""
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "scrub.py"), "--docs"],
                       capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        fail("scrub", r.stdout.strip())


def check_selftests():
    """Run the guards' own negative controls. A gate that trusts other guards
    without watching them fail is a gate with a hole in it."""
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "validate.py"),
                        "--selftest"], capture_output=True, text=True)
    if r.returncode:
        fail("selftest", "validate.py negative controls did not all fire:\n"
                         + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "variants.py")],
                       capture_output=True, text=True)
    if r.returncode:
        fail("selftest", "variants.py cases failed:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "effects.py"), "--selftest"],
                       capture_output=True, text=True)
    if r.returncode:
        fail("selftest", "effects.py negative controls did not all fire:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "scrub.py"), "--selftest"],
                       capture_output=True, text=True)
    if r.returncode:
        fail("selftest", "scrub.py negative controls did not all fire:\n" + r.stdout)


# --------------------------------------------------------------------------
def selftest():
    """Negative controls for the GATE itself. Each is shown to fire on purpose."""
    import tempfile, shutil
    results = []

    def probe(name, mutate):
        global FAILS, NOTES, ROOT
        tmp = tempfile.mkdtemp()
        for item in ("docs", "BUILD", "src", "tools", ".gitignore", "www"):
            src = os.path.join(ROOT, item)
            if os.path.exists(src):
                (shutil.copytree if os.path.isdir(src) else shutil.copy2)(
                    src, os.path.join(tmp, item))
        mutate(tmp)
        saved, FAILS, NOTES = (FAILS, NOTES), [], []
        old = ROOT
        try:
            globals()["ROOT"] = tmp
            n = take()
            check_docs_current(n); check_handoff(n); check_agenda()
            check_landmine_citations(); check_secrets(); check_render_receipt()
            fired = bool(FAILS)
        finally:
            globals()["ROOT"] = old
            FAILS, NOTES = saved
        shutil.rmtree(tmp, ignore_errors=True)
        results.append((name, fired))

    probe("stale doc stamp", lambda t: open(os.path.join(t, "docs/PROTOCOL.md"), "w")
          .write(read("docs", "PROTOCOL.md").replace("take 2.*", "take 1.*")))
    probe("missing HANDOFF entry", lambda t: open(os.path.join(t, "docs/HANDOFF.md"), "w")
          .write("# HANDOFF — through Take 2\n\nnothing here\n"))
    probe("HANDOFF with no DEFERRED", lambda t: open(os.path.join(t, "docs/HANDOFF.md"), "w")
          .write("# HANDOFF — through Take 2\n\n## Take 2 — x\n\nall done\n"))
    probe("agenda item with no ruled-out", lambda t: open(os.path.join(t, "docs/AGENDA.md"), "w")
          .write("# AGENDA\n\n## A99 — something\n\nno evidence here\n"))
    # The token is assembled at runtime on purpose: written as a literal, this
    # file would cite a landmine that does not exist and the guard would flag
    # its own test data. A probe is code and gets the same suspicion (PROTOCOL §0).
    probe("bogus landmine citation",
          lambda t: open(os.path.join(t, "tools/config.py"), "a")
          .write("\n# see land" + "mine 9999\n"))
    probe("render receipt missing (DOM-mode seal)",
          lambda t: os.path.exists(os.path.join(t, "www", "render.png")) and os.remove(os.path.join(t, "www", "render.png")))
    probe("upload key in the tree",
          lambda t: open(os.path.join(t, "apex-upload.jks"), "w").write("x"))

    w = max(len(n) for n, _ in results)
    for name, fired in results:
        print(f"  {'ok  ' if fired else 'FAIL'}  {name:<{w}}  "
              f"{'guard fires' if fired else 'GUARD DID NOT FIRE'}")
    return all(f for _, f in results)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("gate.py negative controls:")
        raise SystemExit(0 if selftest() else 1)

    n = take()
    print(f"gate — take {n}")
    check_docs_current(n)
    check_handoff(n)
    check_agenda()
    check_landmine_citations()
    check_ledger_integrity()
    check_docs_complete()
    check_stale_copy()
    check_play_readiness()
    check_escapes_in_markup()
    check_duplicate_ids()
    check_prompt_ratchet()
    check_no_condition_multiplier()
    check_offline(provision_hosts())
    check_variant_keying()
    check_confidence_gate()
    check_catalogue()
    check_harness()
    check_secrets()
    check_render_receipt()
    check_scrub()
    check_selftests()

    for m in NOTES:
        print(f"   note: {m}")
    if FAILS:
        print(f"\n   {len(FAILS)} FAILURE(S) — nothing ships:")
        for f in FAILS:
            print(f"     \u2717 {f}")
        raise SystemExit(1)
    print("\n   GATE PASSED")
