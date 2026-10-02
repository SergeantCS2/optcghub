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


def app_files():
    """Take 132 (A44 item 2): the script's files under src/app/, in the order they run -- the names' order."""
    d = os.path.join(ROOT, "src", "app")
    return sorted(f for f in os.listdir(d) if f.endswith(".js")) if os.path.isdir(d) else []


def app_parts():
    """The page and the script's files, each named: what a check reads where it read src/app.html alone."""
    return [("src/app.html", read("src", "app.html"))] + [("src/app/" + f, read("src", "app", f)) for f in app_files()]


def app_source():
    return "".join(t for _, t in app_parts())


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
        # take 102: V1-STATE's H1 carries the take too, and it sat a take behind a
        # current stamp for a take (the review's finding 10) -- the stamp is written by
        # tools/stamp.py, the heading by hand, so the heading needs its own tripwire
        h = re.search(r"^# V1-STATE — what exists, as of take (\d+)$", s, re.M)
        if fn == "V1-STATE.md" and h and int(h.group(1)) != n:
            fail("docs-current", f"docs/{fn} heading says take {h.group(1)}, BUILD says {n}")
    # take 110: the Release body is ci/RELEASE.md as committed, and its heading is typed by
    # hand -- Release take-109 went out under "# OP TCG Hub — take 108" (the title, from
    # BUILD, was right; the body a take behind). The same tripwire as V1-STATE's heading.
    r = re.search(r"^# OP TCG Hub — take (\d+)$", read("ci", "RELEASE.md"), re.M)
    if not r:
        fail("docs-current", "ci/RELEASE.md has no '# OP TCG Hub — take N' heading")
    elif int(r.group(1)) != n:
        fail("docs-current", f"ci/RELEASE.md heading says take {r.group(1)}, BUILD says {n}")


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
                "V1-STATE.md", "NEW-SESSION-PROMPT.md", "SIM-UI.md"]   # take 123: the Sim's contract with the UI pass
    for fn in REQUIRED:
        path = os.path.join(DOCS, fn)
        if not os.path.exists(path):
            fail("docs", f"docs/{fn} is missing from the tree")
        elif os.path.getsize(path) < 500:
            fail("docs", f"docs/{fn} is {os.path.getsize(path)} bytes — a stub is not a doc")
    for fn in ("AGENTS.md", "README.md", "BUILD", "ci/RELEASE.md", "ci/build.yml",
               "ci/bootstrap.yml", "ci/hunt.yml", "ci/check.yml", "ci/apk.sh",
               "ci/bundle.sh", "ci/check.sh", "ci/deps.sh", "ci/icon.py",
               "package-lock.json"):      # take 129: a lockfile that goes missing is a silent npm install, not a fallback
        if not os.path.exists(os.path.join(ROOT, fn)):
            fail("docs", f"{fn} is missing from the tree")


def check_workflow_copies():
    """Take 89. Every workflow lives in the tree twice: `.github/workflows/` is
    what runs; `ci/` is the copy the gate, the scrubber and the seed path read.
    They drifted by one line the day the branch flow began (landmine 122's fix
    landed in one and not the other). Byte-equal, or nothing ships. An unpacked
    seed has no `.github/` (the seed job excludes it): noted there, not silent."""
    live = os.path.join(ROOT, ".github", "workflows")
    if not os.path.isdir(live):
        return note("no .github/workflows here (an unpacked seed) -- workflow copies not compared")
    ci_ymls = {fn for fn in os.listdir(os.path.join(ROOT, "ci")) if fn.endswith(".yml")}
    live_ymls = {fn for fn in os.listdir(live) if fn.endswith((".yml", ".yaml"))}
    for fn in sorted(ci_ymls | live_ymls):
        a, b = read("ci", fn), read(".github", "workflows", fn)
        if not b:
            fail("workflows", f"ci/{fn} has no live copy at .github/workflows/{fn}")
        elif not a:
            fail("workflows", f".github/workflows/{fn} has no copy at ci/{fn} (the gate and the scrubber read ci/)")
        elif a != b:
            fail("workflows", f"ci/{fn} and .github/workflows/{fn} differ — they are one file; copy one over the other")


def check_app_split():
    """Take 132 (A44 item 2). The page's script block is a list of slots naming the files under src/app/ in
    the order they run; every slot has its file and every file its slot, each once, in the names' order, and
    each file ends in its newline (the join glues two lines otherwise). The build refuses the same drift at
    build time (build_app.app_script); this holds it before a build, and names what moved."""
    src = read("src", "app.html")
    m = re.search(r'<script id="app">\n(.*?)\n\s*</script>', src, re.S)
    if not m:
        return fail("app-split", "src/app.html has no <script id=\"app\"> block")
    slots, stray = [], []
    for line in m.group(1).split("\n"):
        mm = re.fullmatch(r"/\* __APP__ ([0-9]{2}-[a-z]+\.js) \*/", line.strip())
        (slots if mm else stray).append(mm.group(1) if mm else line.strip()[:60])
    if stray:
        fail("app-split", f"src/app.html's script block holds {len(stray)} line(s) that are not slots -- the script lives under src/app/: {stray[0]!r}")
    files = app_files()
    if len(set(slots)) != len(slots):
        fail("app-split", "a slot is named twice in src/app.html")
    elif slots != files:
        fail("app-split", "the slots in src/app.html and the files under src/app/ differ: "
             f"slots with no file {sorted(set(slots) - set(files))}, files with no slot {sorted(set(files) - set(slots))}"
             + ("" if sorted(slots) == slots else "; the slot order is not the names' order"))
    for f in files:
        if not read("src", "app", f).endswith("\n"):
            fail("app-split", f"src/app/{f} does not end in a newline: the join would glue its last line to the next file's first")
    if not stray and slots == files:
        note(f"app-split: {len(files)} files under src/app/, one slot each, in the names' order")


def check_click_dispatcher():
    """Take 133 (A44 item 3). A bubbling click listener on the document is the dispatcher's alone
    (src/app/13-clicks.js); every other document-level click delegate is a row of CLICKS, registered with
    CLICKS.on where its code lives, in the files' order. A capture-phase listener (`, true)` on its line) is a
    one-shot of its sheet's (PICKER's, the Leader pick's) or the rising scrim's rule, and is allowed, counted."""
    own, stray, capture, rows = [], [], [], 0
    for name, text in app_parts():
        for i, ln in enumerate(text.split("\n"), 1):
            if ln.startswith("CLICKS.on("):
                rows += 1
            if "document.addEventListener('click'" not in ln:
                continue
            if re.search(r",\s*true\s*\)", ln):
                capture.append(f"{name}:{i}")
            elif name == "src/app/13-clicks.js":
                own.append(f"{name}:{i}")
            else:
                stray.append(f"{name}:{i}")
    if len(own) != 1:
        fail("clicks", f"src/app/13-clicks.js registers {len(own)} bubbling click listener(s) on the document; the dispatcher is one")
    if stray:
        fail("clicks", "a document-level click delegate outside the dispatcher's table (take 133, A44 item 3): "
             + ", ".join(stray) + " -- make it a CLICKS.on row where its code lives")
    if len(own) == 1 and not stray:
        note(f"clicks: one bubbling click listener on the document, {rows} rows, {len(capture)} capture-phase registrations (PICKER's two paths, the Leader pick, the scrim rule)")


def check_ads_home():
    """Take 134 (A44 item 4). The ads and consent flow lives in ADS (src/app/19-ads.js), beside CREDITS;
    PLATFORM keeps plugin() and the thin native calls and holds no ad or consent method. The plugin is
    reached through PLATFORM.plugin('AdMob') from ADS, which is the adapter's one part in it."""
    ads = read("src", "app", "19-ads.js")
    if "const ADS = {" not in ads:
        return fail("ads-home", "src/app/19-ads.js does not define ADS")
    for need in ("consentAsk(", "async show(", "async init(", "startWhenFree(", "PLATFORM.plugin('AdMob')"):
        if need not in ads:
            fail("ads-home", f"ADS has no {need!r}: the flow is not whole in src/app/19-ads.js")
    sc = read("src", "app", "56-scanner.js").split("\n")
    try:
        a = next(i for i, ln in enumerate(sc) if ln.startswith("const PLATFORM = {"))
        b = next(i for i in range(a, len(sc)) if sc[i] == "};")
    except StopIteration:
        return fail("ads-home", "src/app/56-scanner.js has no PLATFORM object")
    stray = [f"src/app/56-scanner.js:{i + 1} {sc[i].strip()[:50]}" for i in range(a, b)
             if re.match(r"\s+(async\s+)?(ad[A-Z]\w*|ads[A-Z]\w*|consent\w*|_ad\w*|_consent|_canRequestAds)\s*[:(]", sc[i])]
    if stray:
        fail("ads-home", "an ad or consent member inside PLATFORM (take 134, A44 item 4: the flow is ADS's): " + "; ".join(stray))
    else:
        note("ads-home: ADS holds the ads and consent flow; PLATFORM keeps the plugin and the thin calls")


def check_relay():
    """Take 131 (D18). The Sim's relay lives in relay/: its room module's suite and its negative
    controls run here (pure, a second); the exchange against the real Worker is the PR check's
    (ci/check.sh, --dev). The deploy workflow must exist in both copies and refuse to deploy
    without the owner's secrets; the check script must run the relay's suite; the app's source
    must carry the one __RELAY__ token the build fills from BUILD."""
    rd = os.path.join(ROOT, "relay")
    for fn in ("src/room.js", "src/worker.js", "src/memory.js", "test.mjs", "wrangler.toml", "package.json", "package-lock.json"):
        if not os.path.exists(os.path.join(rd, fn)):
            return fail("relay", f"relay/{fn} is missing")
    y = read("ci", "relay.yml")
    if "wrangler deploy" not in y or "CLOUDFLARE_API_TOKEN" not in y or "nothing deployed" not in y:
        fail("relay", "ci/relay.yml must deploy with wrangler from CLOUDFLARE_API_TOKEN and say so when the secrets are absent")
    if "node test.mjs --dev" not in read("ci", "check.sh"):
        fail("relay", "ci/check.sh must run the relay's suite against wrangler dev (node test.mjs --dev)")
    if app_source().count("'__RELAY__'") != 1:
        fail("relay", "the app's source must carry exactly one '__RELAY__' token (ONLINE.relay, src/app/66-online.js), filled by the build from BUILD")
    for args, what in ((["node", "test.mjs"], "the suite"), (["node", "test.mjs", "--selftest"], "its negative controls")):
        r = subprocess.run(args, cwd=rd, capture_output=True, text=True)
        if r.returncode != 0:
            fail("relay", f"relay/test.mjs: {what} failed -- {(r.stdout + r.stderr).strip().splitlines()[-1][:160] if (r.stdout + r.stderr).strip() else 'no output'}")
        elif what == "the suite":
            m = re.search(r"relay: (\d+) passed, (\d+) failed", r.stdout)
            if not m or int(m.group(2)) or int(m.group(1)) < 40:
                fail("relay", f"relay/test.mjs: expected 40+ passing checks and none failing, got {r.stdout.strip().splitlines()[-1][:120] if r.stdout.strip() else 'nothing'}")
            else:
                note(f"relay: {m.group(1)} checks pass; the Worker is proven on the PR check (wrangler dev)")


def check_pr_builds_apk():
    """Take 129 (A44 item 1). The PR check must build the APK the way the merge
    does: a job in ci/check.yml that needs the pipeline's job, takes its `www`
    artifact and runs `bash ci/apk.sh`. Takes 120, 121, 127 and 128 each changed
    a plugin, Gradle or R8 and were proven only by build.yml on main."""
    y = read("ci", "check.yml")
    if not y:
        return fail("pr-apk", "ci/check.yml is missing, so the PR check cannot be read")
    jobs = y.split("\njobs:", 1)[-1]
    m = re.search(r"^  apk:\n(.*?)(?=^  [A-Za-z_-]+:|\Z)", jobs, re.S | re.M)
    if not m:
        return fail("pr-apk", "ci/check.yml has no `apk` job: the PR check would not build the APK (A44 item 1)")
    body = m.group(1)
    if "bash ci/apk.sh" not in body:
        fail("pr-apk", "ci/check.yml's apk job does not run `bash ci/apk.sh`")
    if not re.search(r"needs:\s*check\b", body):
        fail("pr-apk", "ci/check.yml's apk job does not need the pipeline's `check` job")
    if "name: www" not in body:
        fail("pr-apk", "ci/check.yml's apk job does not take the pipeline's `www` artifact")
    if "name: www" not in jobs.split("\n  apk:", 1)[0]:
        fail("pr-apk", "ci/check.yml's check job does not upload `www` for the apk job")


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
    n = app_source().count("prompt('")
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


def check_icon_characters():
    """Take 108 (A42). An icon drawn as a character -- an emoji, a symbol from a
    font -- draws differently on every phone, cannot take the palette and has
    no name for a reader; the app's icons are the sprite's symbols
    (assets/glyphs.svg, drawn through G() or <use href="#g-...">). This refuses
    the emoji and the symbol blocks, and the arrows and shapes the app once
    used as icons, in src/app.html -- written literally, as &#NNNN; or as
    \\uXXXX. Typography stays: the minus of money, the times of a count,
    arrows inside a label, the price triangles, the DON!! pips, dots, dashes.
    Comments are the record's, not the app's, and are not read. Take 115: an
    emoji written as a JS escape is two code units or one \\u{...}, and each
    is decoded to its code point first (the check read a surrogate pair as two
    halves, neither an emoji: the take-108 icons it removed, as escapes, passed);
    and the times sign as a button's whole face -- a remove drawn as a character
    -- is refused, while the times of a count stays."""
    parts = app_parts() + [("src/sim.js", read("src", "sim.js")), ("src/scan.js", read("src", "scan.js"))]   # take 122: the Sim's engine is src/sim.js; take 125: the scanner's stages src/scan.js; both inlined at build; take 132: the script's files
    src = "".join(t for _, t in parts)
    def where(ln):   # a line of the joined text, as its file's line (take 132)
        for name, text in parts:
            n = text.count("\n")
            if ln <= n:
                return f"{name}:{ln}"
            ln -= n
        return f"line {ln}"
    if not src:
        return
    keep_lines = lambda m: "\n" * m.group(0).count("\n")   # noqa: E731   a comment goes, its lines stay: "near line N" is the source's N
    body = re.sub(r"<!--.*?-->", keep_lines, src, flags=re.S)
    body = re.sub(r"/\*.*?\*/", keep_lines, body, flags=re.S)
    ICONS = set("\u21b6\u21c4\u21bb\u2197\u22ef\u25be\u25b8")   # undo, swap, refresh, external, more, the carets
    found = {}
    def see(ch, at):
        cp = ord(ch)
        if ch in ICONS or 0x2600 <= cp <= 0x27BF or 0x1F000 <= cp <= 0x1FAFF:
            found.setdefault(ch, body.count("\n", 0, at) + 1)
    ESC = (r"&#(\d+);|&#x([0-9a-fA-F]+);"                                     # an entity, decimal or hex
           r"|\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})"   # a surrogate pair: one astral character
           r"|\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})")                 # a code point escape; one code unit
    for m in re.finditer(ESC, body):
        dec, hx, hi, lo, cp, unit = m.groups()
        c = (int(dec) if dec else int(hx, 16) if hx else 0x10000 + ((int(hi, 16) - 0xD800) << 10) + (int(lo, 16) - 0xDC00) if hi
             else int(cp or unit, 16))
        if c <= 0x10FFFF:
            see(chr(c), m.start())
    for m in re.finditer(r"<button\b[^>]*>\s*(?:\u00d7|&times;|&#215;|&#x[dD]7;|\\u00[dD]7)\s*</button>", body):
        found.setdefault("\u00d7", body.count("\n", 0, m.start()) + 1)
    for i, ch in enumerate(body):
        if ord(ch) > 0x2000:
            see(ch, i)
    if found:
        fail("icons", "src/app.html draws " + str(len(found)) + " icon(s) as characters: "
             + ", ".join(f"U+{ord(c):04X} near {where(ln)}" for c, ln in sorted(found.items(), key=lambda kv: kv[1])[:6])
             + " -- use a sprite symbol, G('name') or <use href=\"#g-name\">")


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
        # take 109 (A42): the owner's ruling -- card art is shown, hot-linked; these said otherwise
        ("the app shows none",                   "take 109: the app shows card art, hot-linked (A42; landmine 26's note)"),
        ("including official product box shots", "take 109: what may not ship is bundled art, and a character or mark in the name, icon, splash or listing (A42)"),
        ("carries no character art",             "take 109: the listing never said so, and the app shows card art (A29's correction)"),
        ("no character art, no publisher mark",  "take 109: card art is shown; marks stay out of the name, icon, splash and listing (V1-STATE)"),
    ]
    files = ["src/app.html", *("src/app/" + f for f in app_files()), "src/sim.js", "src/scan.js", "README.md", "ci/RELEASE.md", "docs/RUNBOOK.md", "docs/RUNBOOK-play.md",
             # take 109: the present-tense record that carried the old line; the append-only
             # history (HANDOFF, LANDMINES, AGENDA) keeps what it said and is not read here
             "docs/V1-STATE.md", "docs/NEW-SESSION-PROMPT.md", "docs/PROVISION.md", "docs/PLAY-LISTING.md",
             "src/privacy.html", "assets/user/README.md"]
    for f in files:
        body = read(*f.split("/"))
        # strip code comments so a landmine explanation does not trip its own guard
        stripped = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
        stripped = re.sub(r"<!--.*?-->", "", stripped, flags=re.S)
        # take 109: a sentence wrapped across two lines is still that sentence (the NSP's
        # "including / official product box shots" slipped a plain substring match)
        stripped = re.sub(r"\s+", " ", stripped)
        for phrase, why in BANNED:
            if phrase.lower() in stripped.lower():
                fail("stale-copy", f"{f} still says '{phrase}' — {why}")


def check_no_condition_multiplier():
    """PROTOCOL §10.3. TCGCSV publishes no per-condition pricing (landmine 4), so
    any arithmetic that scales value by condition is invented — a confident wrong
    answer about someone's money. Structural, not a resolution to be careful."""
    for p in ("src/app.html", *("src/app/" + f for f in app_files()), "www/app.js"):
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
    # Take 100: a host can ride in DATA -- the bundle's `img` column carries the
    # second image host for the products the runner saw it serve -- and until
    # then this check read only the code. Every host in the bundle is declared too.
    b = os.path.join(ROOT, "www", "bundle", "catalog.json")
    if os.path.exists(b):
        cat = json.load(open(b))
        ci = cat["cols"].index("img")
        for r in cat["rows"]:
            if r[ci]:
                found |= set(re.findall(r"https?://([a-z0-9.-]+)", r[ci], re.I))
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


def check_pictures():
    """Take 126 (landmines 226, 240): the host's "Image Coming Soon" is no card's picture -- checked against the BUILT
    bundle and the runner's sidecar. No picture hash ships on printings of two or more names (reprints of one card
    share art under one name; one hash on 22 names was the placeholder, the picture of 22 starter-deck printings for
    as long as they had been hashed); none ships within PH_NEAR bits of a placeholder hash on file; and a printing the
    runner last saw serve the placeholder ships no hash, and no URL but the second host's."""
    b = os.path.join(ROOT, "www", "bundle", "catalog.json")
    if not os.path.exists(b):
        return note("bundle not built — pictures check skipped")
    import hashes as H
    cat = json.load(open(b)); ci = cat["cols"].index
    sealed, pid, name, img, hsh = ci("sealed"), ci("id"), ci("name"), ci("img"), ci("hash")
    sp = os.path.join(ROOT, "catalog", "hashes.json")      # the probes' copies carry their own
    raw = json.load(open(sp)) if os.path.exists(sp) else {}
    ph, alt = H.ph_state(raw), set(str(x) for x in raw.get("alt", []))
    cards = [r for r in cat["rows"] if not r[sealed] and r[hsh] is not None]
    by = {}
    for r in cards:
        by.setdefault(r[hsh], set()).add(r[name])
    shared = [sorted(ns) for ns in by.values() if len(ns) > 1]
    if shared:
        fail("pictures", f"{len(shared)} picture hash(es) ship on printings of two or more names -- the host's "
                         f"placeholder, no card's picture (landmines 226, 240): {', '.join(shared[0][:4])}")
    near = [r[pid] for r in cards if H.near_placeholder(H.from_sqlite(r[hsh]), ph["hashes"])]
    if near:
        fail("pictures", f"{len(near)} printing(s) ship a hash within {H.PH_NEAR} bits of a placeholder hash on file "
                         f"(landmine 240): {near[:5]}")
    ids = ph["cards"] | ph["sealed"]
    bad = [r[pid] for r in cat["rows"] if str(r[pid]) in ids
           and (r[hsh] is not None or (r[img] and not (str(r[pid]) in alt and r[img] == H.alt_url(r[pid]))))]
    if bad:
        fail("pictures", f"{len(bad)} printing(s) the runner saw serve the host's placeholder ship its picture or its "
                         f"hash (landmine 240): {bad[:5]}")
    note(f"pictures: {len(ids)} printing(s) the host serves its placeholder for ship none; "
         f"{len(ph['hashes'])} placeholder hash(es) on file")


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


ADMOB_PUB = "ca-app-pub-6243777967151950"
ADMOB_TEST = "ca-app-pub-3940256099942544/"
ADMOB_RETIRED = {"ca-app-pub-6243777967151950~1538944343":
                 '"testing", added by name before the app was on Play and never linked (landmine 210)'}
# take 127 is the first build that asks for consent (A43); 121 to 126 name the linked app and ask none.
# The app holds the same line itself (PLATFORM._canRequestAds, set only by consentAsk).
ADMOB_LIVE_FLOOR = 127


def check_ads():
    """Take 121 (landmines 209, 210). The synced manifest's ads block reaches every
    install, old APKs included, which name the retired app and ask no consent. So
    ads.scan and ads.deck stay Google's test unit for good, the app ID is never the
    retired one, and real units ride ads.live: whole, the publisher's, three of them,
    from a take after 121, and only when the app has a consent flow to ask with."""
    mp = os.path.join(ROOT, "www", "bundle", "manifest.json")
    if not os.path.exists(mp):
        return note("no bundle manifest — ads checks skipped")
    a = (json.load(open(mp)) or {}).get("ads") or {}
    app = str(a.get("app") or "")
    if app in ADMOB_RETIRED:
        fail("ads", f"the app ID is {app}, {ADMOB_RETIRED[app]}")
    elif not app.startswith(ADMOB_PUB + "~"):
        fail("ads", f"the app ID {app!r} is not the publisher's")
    for k in ("scan", "deck"):
        if not str(a.get(k) or "").startswith(ADMOB_TEST):
            fail("ads", f"ads.{k} is {a.get(k)!r}: every install from take 120 and earlier loads it -- it stays "
                        "Google's test unit; real units ride ads.live (take 121)")
    if a.get("test") is not True:
        fail("ads", "ads.test is not true: the older installs' units are Google's test unit")
    live = a.get("live")
    if live is None:
        return
    units = [live.get(k) for k in ("scan", "deck", "max")]
    for k, u in zip(("scan", "deck", "max"), units):
        if not re.fullmatch(re.escape(ADMOB_PUB) + r"/\d+", str(u or "")):
            fail("ads", f"ads.live.{k} is {u!r}, not one of the publisher's units ({ADMOB_PUB}/N)")
    if len(set(map(str, units))) != 3:
        fail("ads", "ads.live's units are not three: one unit per placement (the owner, take 121)")
    f = live.get("from")
    if not isinstance(f, int) or f < ADMOB_LIVE_FLOOR:
        fail("ads", f"ads.live.from is {f!r}: take 121 names the linked app but asks no consent, so no build "
                    f"before take {ADMOB_LIVE_FLOOR} loads real units")
    if "requestConsentInfo" not in app_source():
        fail("ads", "ads.live is set and the app asks for no consent (no requestConsentInfo): the app is "
                    "worldwide (the owner, take 121; A43)")


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
    # optcghub-seed*.zip: a seed zip committed to the tree is unpacked over it
    # by the seed job (landmine 122) -- the zip is the recovery route and lives outside
    for pat in ("*upload*.jks", "tcgcsv_cache/", "catalog/", "optcghub-seed*.zip"):
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
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("scrub", r.stdout.strip())


def check_sim():
    """Take 122 (A23). The Sim proves itself, on the SHIPPED app: every card proof passes on every printing it
    binds (tools/cardproof.mjs; the build's binding and the runner's must agree); self-play's sample finds no
    violation -- the app's opponent, chaos with refused moves that must change nothing, and two apps kept in step
    by moves alone -- and the auditor names every fault planted in it. Watched failing at take 122: the proofs on
    take 121's app (123 of 200 scenarios), the auditor's eight plants, and this check's own probe below; the review's
    self-play sweep (7,200 games) found three more faults in the engine, each now a check. Take 124 (the owner: "Test all
    starter decks and as many random/arbitrary decks (that are still legal), after every turn ends audit all moves against
    the rules"): the sample deals ready-made pairings and random legal decks in turn, and the rulebook
    (tools/lib/rulebook.mjs) holds every move to the rules' own model of the game, the card's words check every scripted
    step to its text; their plants run in the selftest, each named."""
    if not os.path.exists(os.path.join(ROOT, "www", "app.js")):
        return note("www/ not built -- the Sim's proofs and self-play were skipped")
    for args, what in ((["tools/cardproof.mjs"], "card proofs"),
                       (["tools/selfplay.mjs", "--games", "34", "--policy", "both"], "self-play"),
                       (["tools/selfplay.mjs", "--games", "8", "--policy", "both", "--two-apps"], "two-app self-play"),
                       (["tools/selfplay.mjs", "--selftest"], "the auditor's planted faults")):
        r = subprocess.run(["node"] + args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=900)
        last = (r.stdout.strip().splitlines() or ["(no output)"])
        if r.returncode:
            fail("sim", f"{what} failed:\n  " + "\n  ".join(l for l in last if "FAIL" in l or "VIOLATION" in l or "NOT caught" in l)[:1500] + "\n  " + last[-1])
        else:
            note(f"{what}: {next((l.strip() for l in last if ' games (' in l), last[-1].strip())}")   # self-play's summary line, not its card tally


def check_selftests():
    """Run the guards' own negative controls. A gate that trusts other guards
    without watching them fail is a gate with a hole in it."""
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "validate.py"),
                        "--selftest"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "validate.py negative controls did not all fire:\n"
                         + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "variants.py")],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "variants.py cases failed:\n" + r.stdout)
    # Landmine 114/115 lint (take 80): a smoke assertion that pins a number to
    # something the nightly moves -- the day count, the source date, a price --
    # is a test that expires, and one that expired in bundle.sh cost five nights.
    smoke_src = open(os.path.join(ROOT, "tools", "smoke.mjs"), encoding="utf8").read()
    pinned = []
    for m in re.finditer(r"(history_days|\.days\.length|source_updated_at|\.market|\.low|\.high)[^\n;]{0,40}?===\s*(\d+(?:\.\d+)?)\b", smoke_src):
        line = smoke_src[:m.start()].count("\n") + 1
        ctx = smoke_src[max(0, m.start() - 160):m.end()]
        if "lint-ok" in ctx or "V.CAT.days.length" in ctx:            # a comparison between two live values is fine
            continue
        pinned.append(f"line {line}: {m.group(0).strip()[:70]}")
    if pinned:
        fail("smoke-lint", "an assertion pins a number to something the nightly moves (landmine 115):\n  " + "\n  ".join(pinned))
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "hunt.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "hunt.py parsers did not all pass against the saved responses:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "stockdecks.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "stockdecks.py guards did not all pass:\n" + r.stdout)
    for tool in ("rules.py", "cards.py"):                    # take 122: the rules digest and the card proofs' binding
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", tool), "--selftest"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if r.returncode:
            fail("selftest", f"{tool} negative controls did not all fire:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "effects.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "effects.py negative controls did not all fire:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "scrub.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "scrub.py negative controls did not all fire:\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "hashes.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "hashes.py guard controls did not all fire (landmine 124):\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "shipped.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode:
        fail("selftest", "shipped.py controls did not all pass (take 101):\n" + r.stdout)
    r = subprocess.run(["bash", os.path.join(ROOT, "ci", "signer.sh"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("selftest", "signer.sh controls did not all pass (take 102):\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "ci", "shrink.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("selftest", "shrink.py controls did not all pass (take 103):\n" + r.stdout)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "ci", "icon.py"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("selftest", "icon.py controls did not all pass (D7; the icon step's first real run is the Release build):\n" + r.stdout)
    r = subprocess.run(["bash", os.path.join(ROOT, "ci", "check.sh"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("selftest", "check.sh runner-owned-files guard controls did not all fire (landmine 116):\n" + r.stdout)
    r = subprocess.run(["bash", os.path.join(ROOT, "ci", "apk.sh"), "--selftest"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=ROOT)
    if r.returncode:
        fail("selftest", "apk.sh controls did not all pass (take 115: a failed Gradle build stops the script with its own message):\n" + r.stdout)


# --------------------------------------------------------------------------
def selftest():
    """Negative controls for the GATE itself. Each is shown to fire on purpose."""
    import tempfile, shutil
    results = []

    def probe(name, mutate, cat=None, expect=True):
        """cat: the failure category the mutation must produce (None: any). expect=False
        is the clean control: the copy itself must fire nothing."""
        global FAILS, NOTES, ROOT
        tmp = tempfile.mkdtemp()
        # the copy carries everything the probed checks read -- the sideload keystore and
        # the star template included, else check_secrets fails EVERY copy and every probe
        # "fires" for that reason alone (take 102, landmine 139: eleven probes had, since
        # take 35, proved nothing; the clean-tree control above catches the next such hole)
        for item in ("docs", "BUILD", "src", "tools", ".gitignore", "www", "ci", ".github",
                     "signing/optcghub.keystore", "catalog/star_template.json",
                     "README.md", "assets/user/README.md"):             # take 109: check_stale_copy reads them
            src = os.path.join(ROOT, item)
            if os.path.exists(src):
                os.makedirs(os.path.dirname(os.path.join(tmp, item)), exist_ok=True)
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
            check_workflow_copies(); check_pr_builds_apk(); check_offline(provision_hosts()); check_icon_characters(); check_stale_copy()
            check_ads(); check_pictures()
            if cat == "relay":
                check_relay()
            if cat == "app-split":
                check_app_split()
            if cat == "clicks":
                check_click_dispatcher()
            if cat == "ads-home":
                check_ads_home()
            if cat == "sim":
                check_sim()
            fired = any(f.startswith(cat + ":") for f in FAILS) if cat else bool(FAILS)
            stray = [f for f in FAILS if cat and not f.startswith(cat + ":")]
        finally:
            globals()["ROOT"] = old
            FAILS, NOTES = saved
        shutil.rmtree(tmp, ignore_errors=True)
        results.append((name, fired == expect and not stray, fired))
        if stray:
            print(f"  FAIL  {name}: the copy fails outside '{cat}' -- the probe cannot be trusted:\n        " + "\n        ".join(stray))

    # take 102 (landmine 139): the control of the controls. An unmutated copy must fire
    # NOTHING, else every "guard fires" below is the copy's own defect, not the guard.
    probe("control: an unmutated tree fires nothing", lambda t: None, expect=False)
    # take 122: the Sim's proofs and self-play -- clean on the copy, and a proof that no longer holds is caught
    probe("control: the Sim's proofs and self-play pass on the copy (take 122)", lambda t: None, "sim", expect=False)
    def wrong_proof(t):
        f = os.path.join(t, "tools", "cards", "ST01-007.json"); d = json.load(open(f, encoding="utf-8"))
        d["scenarios"][0]["expect"]["p0.leader.don"] = 2          # Nami gives ONE rested DON!!
        json.dump(d, open(f, "w", encoding="utf-8"))
    probe("a card proof whose card does something else (take 122)", wrong_proof, "sim")
    # the mutation is a pattern, not the literal "take 2.*" it was from take 2 to 101: that
    # literal matched nothing after take 2, and the probe "fired" on the copy's own
    # failure instead (take 102, landmine 139)
    probe("stale doc stamp", lambda t: open(os.path.join(t, "docs/PROTOCOL.md"), "w")
          .write(re.sub(r"\*Current as of take \d+\.\*", "*Current as of take 1.*", read("docs", "PROTOCOL.md"), count=1)), "docs-current")
    probe("stale Release heading (take 110: Release take-109 went out headed take 108)", lambda t: open(os.path.join(t, "ci", "RELEASE.md"), "w")
          .write(re.sub(r"^# OP TCG Hub — take \d+$", "# OP TCG Hub — take 1", read("ci", "RELEASE.md"), count=1, flags=re.M)), "docs-current")
    # take 102: the H1 of V1-STATE drifted a take behind its stamp line unnoticed
    probe("stale V1-STATE heading under a current stamp", lambda t: open(os.path.join(t, "docs/V1-STATE.md"), "w")
          .write(re.sub(r"^# V1-STATE — what exists, as of take \d+$", "# V1-STATE — what exists, as of take 1", read("docs", "V1-STATE.md"), count=1, flags=re.M)), "docs-current")
    probe("missing HANDOFF entry", lambda t: open(os.path.join(t, "docs/HANDOFF.md"), "w")
          .write("# HANDOFF — through Take 2\n\nnothing here\n"), "handoff")
    probe("HANDOFF with no DEFERRED", lambda t: open(os.path.join(t, "docs/HANDOFF.md"), "w")
          .write("# HANDOFF — through Take 2\n\n## Take 2 — x\n\nall done\n"), "handoff")
    probe("agenda item with no ruled-out", lambda t: open(os.path.join(t, "docs/AGENDA.md"), "w")
          .write("# AGENDA\n\n## A99 — something\n\nno evidence here\n"), "agenda")
    # The token is assembled at runtime on purpose: written as a literal, this
    # file would cite a landmine that does not exist and the guard would flag
    # its own test data. A probe is code and gets the same suspicion (PROTOCOL §0).
    probe("bogus landmine citation",
          lambda t: open(os.path.join(t, "tools/config.py"), "a")
          .write("\n# see land" + "mine 9999\n"), "landmines")
    # take 131: the relay's deploy must refuse to run without the owner's secrets, and the check must prove the Worker
    # take 131: in both copies, like the apk probe above (else the drift guard fires instead)
    def relay_unguarded(t):
        y = read("ci", "relay.yml").replace("nothing deployed", "deployed anyway")
        for fn in ("ci/relay.yml", ".github/workflows/relay.yml"):
            open(os.path.join(t, fn), "w").write(y)
    probe("a relay deploy that runs without the secrets guard", relay_unguarded, "relay")
    probe("a PR check that skips the relay's exchange against wrangler dev", lambda t: open(os.path.join(t, "ci", "check.sh"), "w")
          .write(read("ci", "check.sh").replace("node test.mjs --dev", "node test.mjs")), "relay")
    # take 132: the script's files and the page's slots are one list; a file renamed under its slot, and a line
    # of script left in the page, are each named
    probe("a script file renamed under its slot (take 132)", lambda t: os.rename(os.path.join(t, "src", "app", "12-net.js"), os.path.join(t, "src", "app", "12-network.js")), "app-split")
    probe("a line of script left in the page beside the slots (take 132)", lambda t: open(os.path.join(t, "src", "app.html"), "w")
          .write(read("src", "app.html").replace("/* __APP__ 70-boot.js */", "/* __APP__ 70-boot.js */\nconst stray = 1;")), "app-split")
    # take 133: a document-level click delegate of the old shape, outside the dispatcher's table
    probe("a click delegate registered outside the dispatcher's table (take 133)", lambda t: open(os.path.join(t, "src", "app", "24-decks.js"), "a")
          .write("document.addEventListener('click', e => {});\n"), "clicks")
    # take 134: an ad method planted back inside PLATFORM
    probe("an ad method inside PLATFORM, outside ADS (take 134)", lambda t: open(os.path.join(t, "src", "app", "56-scanner.js"), "w")
          .write(read("src", "app", "56-scanner.js").replace("const PLATFORM = {\n", "const PLATFORM = {\n  adShow() { return false; },\n", 1)), "ads-home")
    probe("render receipt missing (DOM-mode seal)",
          lambda t: os.path.exists(os.path.join(t, "www", "render.png")) and os.remove(os.path.join(t, "www", "render.png")), "render")
    # take 108: an icon drawn as a character in the app, literally and as an escape
    probe("an icon drawn as a character (take 108)", lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<span>\U0001F50D</span>\n"), "icons")
    probe("an icon drawn as a JS escape (take 108)", lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<script>const x = '\\u2699';</script>\n"), "icons")
    # take 115: an emoji as a JS escape is a surrogate pair or a code point escape -- take 108's check read the pair as two halves
    probe("an emoji drawn as a JS surrogate pair (take 115)", lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<script>const x = '\\uD83D\\uDD0D';</script>\n"), "icons")
    probe("an emoji drawn as a \\u{...} escape (take 115)", lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<script>const x = '\\u{1F4F7}';</script>\n"), "icons")
    probe("a remove button drawn as the times sign (take 115)", lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<script>const r = `<button class=\"ghost\" aria-label=\"Remove\">\\u00d7</button>`;</script>\n"), "icons")
    probe("control: the times of a count, the DON!! pips and an astral escape outside the emoji blocks pass (take 115)",
          lambda t: open(os.path.join(t, "src", "app.html"), "a")
          .write("\n<script>const c = `<span>\\u00d73</span><b>7\u00d7 apart</b><button>Qty \u00d72</button>` + '\u25cf\u25cb' + '\\u{2014}\\uD835\\uDC00';</script>\n"),
          expect=False)
    # take 109 (landmine 88): a sentence the design made false, back in the record -- the
    # check's first negative control since take 8, and one in a file the list grew to
    probe("a sentence the design made false, back in V1-STATE (take 109)", lambda t: open(os.path.join(t, "docs", "V1-STATE.md"), "a")
          .write("\nNo account, no character art, no publisher marks.\n"), "stale-copy")
    probe("...and in the owner's folder README (take 109)", lambda t: open(os.path.join(t, "assets", "user", "README.md"), "a")
          .write("\nBox shots were declined, and the app shows none.\n"), "stale-copy")
    probe("upload key in the tree",
          lambda t: open(os.path.join(t, "apex-upload.jks"), "w").write("x"), "secrets")

    def bad_host(t):
        # take 100: an undeclared host carried in the bundle's img column, not in the code
        d = os.path.join(t, "www", "bundle"); os.makedirs(d, exist_ok=True)
        b = os.path.join(d, "catalog.json")
        cat = json.load(open(b)) if os.path.exists(b) else {"cols": ["sealed", "id", "img"], "rows": [[0, 1, ""]]}
        ci = cat["cols"].index("img")
        cat["rows"][0][ci] = "https://evil.example.com/product/1.jpg"
        json.dump(cat, open(b, "w"))
    probe("undeclared host in the bundle's img column (take 100)", bad_host, "offline")

    # take 126 (landmines 226, 240): the host's placeholder, planted in the bundle and the sidecar a copy carries
    def pics(t, same=False, near=None, served=False, blank=False):
        b = os.path.join(t, "www", "bundle", "catalog.json"); cat = json.load(open(b)); ci = cat["cols"].index
        import hashes as H
        rows = [r for r in cat["rows"] if not r[ci("sealed")] and r[ci("hash")] is not None and r[ci("img")]]
        hs = [H.from_sqlite(r[ci("hash")]) for r in rows]
        # a card far from every other (15 bits and more), so the control's 7 bits cannot land near a reprint of it
        a = next(r for k, r in enumerate(rows) if all(H.hamming(hs[k], x) >= 15 for j, x in enumerate(hs) if j != k))
        o = next(r for r in rows if r[ci("name")] != a[ci("name")])
        side = {"placeholder": {"hashes": [], "cards": [], "sealed": []}}
        if same:
            o[ci("hash")] = a[ci("hash")]                                   # one hash on two names
        if near is not None:
            side["placeholder"]["hashes"] = [H.to_sqlite(H.from_sqlite(a[ci("hash")]) ^ near)]
        if served or blank:
            side["placeholder"]["cards"] = [str(a[ci("id")])]
            if blank:
                a[ci("img")] = a[ci("hash")] = None                        # shipped as the build ships it
        json.dump(cat, open(b, "w"))
        os.makedirs(os.path.join(t, "catalog"), exist_ok=True)
        json.dump(side, open(os.path.join(t, "catalog", "hashes.json"), "w"))
    probe("pictures: one hash shipped on two names -- take 124's catalogue, 22 printings (take 126)", lambda t: pics(t, same=True), "pictures")
    probe("pictures: a shipped hash 3 bits from a placeholder hash on file (take 126)", lambda t: pics(t, near=0b111), "pictures")
    probe("pictures: a printing the runner saw serve the placeholder ships its URL and hash (take 126)", lambda t: pics(t, served=True), "pictures")
    probe("control: a hash 7 bits from the placeholder's, and its printing shipped with no picture, pass (take 126)",
          lambda t: pics(t, near=0x7F, blank=True), expect=False)

    # take 121 (landmines 209, 210): the synced ads block reaches every install
    def ads(t, live=None, consent=False, **top):
        d = os.path.join(t, "www", "bundle"); os.makedirs(d, exist_ok=True)
        b = os.path.join(d, "manifest.json")
        m = json.load(open(b)) if os.path.exists(b) else {}
        a = m.setdefault("ads", {})
        a.update({"app": ADMOB_PUB + "~9519036366", "scan": ADMOB_TEST + "5224354917",
                  "deck": ADMOB_TEST + "5224354917", "test": True, "live": live})
        a.update(top)
        json.dump(m, open(b, "w"))
        if consent:
            open(os.path.join(t, "src", "app.html"), "a").write("\n<script>/* requestConsentInfo */</script>\n")
    good = {"scan": ADMOB_PUB + "/1111111111", "deck": ADMOB_PUB + "/2222222222", "max": ADMOB_PUB + "/3333333333",
            "from": ADMOB_LIVE_FLOOR}
    probe("ads: the retired \"testing\" app ID (take 121, landmine 210)",
          lambda t: ads(t, app=next(iter(ADMOB_RETIRED))), "ads")
    probe("ads: a real unit in ads.scan, which every older install loads (take 121)",
          lambda t: ads(t, scan=ADMOB_PUB + "/1111111111"), "ads")
    probe("ads: a live block carrying Google's test unit (take 121)",
          lambda t: ads(t, live={**good, "max": ADMOB_TEST + "5224354917"}, consent=True), "ads")
    probe("ads: a live block from the take before the floor, which asks no consent (take 121; 127)",
          lambda t: ads(t, live={**good, "from": ADMOB_LIVE_FLOOR - 1}, consent=True), "ads")
    probe("ads: two placements sharing one live unit (take 121: three)",
          lambda t: ads(t, live={**good, "max": good["deck"]}, consent=True), "ads")
    def no_consent(t):
        # take 127: the app asks for consent now, so the probe takes it out of the copy first
        ads(t, live=good)
        for rel in ["src/app.html"] + ["src/app/" + x for x in sorted(os.listdir(os.path.join(t, "src", "app"))) if x.endswith(".js")]:   # take 132: the flow is in a script file
            f = os.path.join(t, rel)
            open(f, "w").write(open(f).read().replace("requestConsentInfo", "requestNothing"))
    probe("ads: a live block and no consent flow in the app (take 121; the flow removed, 127)",
          no_consent, "ads")
    probe("control: a whole live block from the floor, with a consent flow, passes (take 121; 127)",
          lambda t: ads(t, live=good, consent=True), expect=False)

    def drift(t):
        # the live copy and the ci/ copy of one workflow, one byte apart (take 89)
        os.makedirs(os.path.join(t, ".github", "workflows"), exist_ok=True)
        open(os.path.join(t, ".github", "workflows", "probe.yml"), "w").write("name: probe\n")
        open(os.path.join(t, "ci", "probe.yml"), "w").write("name: probe # drifted\n")
    probe("workflow copies drift (ci/ vs .github/workflows)", drift, "workflows")
    def no_apk_job(t):
        # take 129: the PR check without its apk job, in both copies (else the drift guard fires instead)
        for parts in (("ci", "check.yml"), (".github", "workflows", "check.yml")):
            f = os.path.join(t, *parts); y = open(f).read()
            open(f, "w").write(re.sub(r"\n  apk:\n.*", "\n", y, flags=re.S))
    probe("the PR check without its apk job (take 129, A44 item 1)", no_apk_job, "pr-apk")
    def apk_job_without_script(t):
        for parts in (("ci", "check.yml"), (".github", "workflows", "check.yml")):
            f = os.path.join(t, *parts); y = open(f).read()
            open(f, "w").write(y.replace("run: bash ci/apk.sh", "run: echo built"))
    probe("the PR check's apk job that does not run ci/apk.sh (take 129)", apk_job_without_script, "pr-apk")
    probe("seed zip not ignored",
          lambda t: open(os.path.join(t, ".gitignore"), "w")
          .write(read(".gitignore").replace("optcghub-seed*.zip", "")), "secrets")

    w = max(len(n) for n, _, _ in results)
    for name, good, fired in results:
        print(f"  {'ok  ' if good else 'FAIL'}  {name:<{w}}  "
              f"{'guard fires' if fired else 'guard silent' if good else 'GUARD DID NOT FIRE'}")
    return all(g for _, g, _ in results)


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
    check_workflow_copies()
    check_pr_builds_apk()
    check_relay()
    check_app_split()
    check_click_dispatcher()
    check_ads_home()
    check_stale_copy()
    check_play_readiness()
    check_ads()
    check_escapes_in_markup()
    check_icon_characters()
    check_duplicate_ids()
    check_prompt_ratchet()
    check_no_condition_multiplier()
    check_offline(provision_hosts())
    check_variant_keying()
    check_pictures()
    check_confidence_gate()
    check_catalogue()
    check_harness()
    check_secrets()
    check_render_receipt()
    check_sim()
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
