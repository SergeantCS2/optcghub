#!/usr/bin/env python3
"""The scrubber (take 35). Two jobs, both boring:

  --strip   remove comments from the SHIPPED app (www/) -- JS via acorn's
            exact ranges (strip_comments.mjs), HTML comments outside script and
            style, CSS comments inside <style>. build_app.py calls this.
  --check   refuse anything public that carries a marker: the owner's first
            name, an AI vendor's name, a chat/session reference, a credential-
            shaped string, a build-container path, a leftover TODO. Scans the
            shipped www/ and the public-facing text; --docs adds the ledgers.
            The gate calls this and fails on any hit.
  --docs --apply
            rewrite the ledgers once: first name -> "the owner", chat ->
            session, container home -> ~. Reported line by line; grep after.
  --selftest
            negative controls: a planted name and a planted key must fire.

Why the ledgers too: the repo is PUBLIC (Pages on a free plan needs it), so
the paper trail is public, and a paper trail that names its author on every
page and its tooling's vendor in its paths is a different thing from an app.
"""
import os, re, subprocess, sys, tempfile, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, "www")

FIRST_NAME = "Jacob"            # the one personal token this project ever used
MARKERS = [
    ("first name",   re.compile(r"\b" + FIRST_NAME + r"\b")),
    ("AI vendor",    re.compile(r"\b(Claude|Anthropic|OpenAI|ChatGPT|Copilot|Gemini|LLM|large language model)\b", re.I)),
    ("chat ref",     re.compile(r"\b(chat|chatbot|conversation with)\b", re.I)),
    ("container",    re.compile(r"/home/claude|/mnt/user-data|/mnt/skills|/mnt/transcripts")),
    # AdMob app and ad-unit IDs are NOT credentials: they ship in every APK's
    # manifest and are readable from any installed app. The take-35 version
    # flagged them and fired on the app's own ID at take 41.
    ("credential",   re.compile(r"AIza[0-9A-Za-z_\-]{20,}|ghp_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,}|sk-[0-9A-Za-z]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[bp]-[0-9A-Za-z\-]{10,}")),
    ("leftover",     re.compile(r"\b(TODO|FIXME|XXX|HACK)\b")),
]
# Names an ALLOWED public link may carry: the sibling repo is the owner's own.
ALLOW = {"README.md": ["APEX ORV", "apex-orv"],
         "tools/seal.sh": ["/mnt/user-data"],     # where this container hands files over; a tool, not a ship
         "tools/scrub.py": ["*"]}                  # the scrubber names what it scrubs for

SHIPPED = ["www/index.html", "www/app.js", "www/privacy.html", "www/bundle/manifest.json"]
PUBLIC_TEXT = ["README.md", "ci/RELEASE.md", "src/privacy.html", "docs/PLAY-LISTING.md", "AGENTS.md"]
# The source is public too. Comments are stripped from the ARTIFACT; the tree
# still has them, so the tree is scanned as well.
def files_code():
    out = ["src/app.html"]
    for d in ("tools", "ci"):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if f.endswith((".py", ".mjs", ".sh", ".yml", ".ps1", ".md")):
                out.append(f"{d}/{f}")
    return out


def files_docs():
    d = os.path.join(ROOT, "docs")
    return sorted("docs/" + f for f in os.listdir(d) if f.endswith(".md"))


def scan(paths, root=ROOT):
    hits = []
    for rel in paths:
        p = os.path.join(root, rel)
        if not os.path.exists(p):
            continue
        for ln, line in enumerate(open(p, encoding="utf8", errors="replace"), 1):
            for what, rx in MARKERS:
                for m in rx.finditer(line):
                    hits.append((rel, ln, what, m.group(0), line.strip()[:110]))
    return hits


def strip():
    """Comments out of the shipped artifact. JS by parser, HTML/CSS by pattern
    that cannot see inside a script (the script is already split into app.js)."""
    js = os.path.join(WWW, "app.js")
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "strip_comments.mjs"), js, js],
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("scrub --strip: acorn could not parse app.js\n" + r.stderr)
    print("  " + r.stdout.strip())
    p = os.path.join(WWW, "index.html")
    html = open(p, encoding="utf8").read()
    n0 = len(html)
    # keep the glyph sprite's <symbol>s and every element; drop only comments
    parts = re.split(r"(<script\b.*?</script>)", html, flags=re.S | re.I)
    for i, part in enumerate(parts):
        if part.lower().startswith("<script"):
            continue
        part = re.sub(r"<!--.*?-->", "", part, flags=re.S)
        part = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)",
                      lambda m: m.group(1) + re.sub(r"/\*.*?\*/", "", m.group(2), flags=re.S) + m.group(3),
                      part, flags=re.S | re.I)
        parts[i] = part
    html = "".join(parts)
    html = re.sub(r"\n{3,}", "\n\n", html)
    open(p, "w", encoding="utf8").write(html)
    print(f"  index.html: {n0} -> {len(html)} bytes, comments removed")


def check(with_docs):
    paths = SHIPPED + PUBLIC_TEXT + (files_docs() + files_code() if with_docs else [])
    hits = [h for h in scan(paths) if not any(a == "*" or a.lower() in h[4].lower() for a in ALLOW.get(h[0], []))]
    if hits:
        print(f"scrub: {len(hits)} marker(s) in public or shipped files:")
        for rel, ln, what, tok, line in hits[:40]:
            print(f"  {rel}:{ln}  [{what}] {tok!r}  {line}")
        if len(hits) > 40:
            print(f"  ... and {len(hits) - 40} more")
        print("  fix the source (src/, docs/), or for the ledgers: python3 tools/scrub.py --docs --apply")
        return 1
    print(f"scrub: clean -- {len(paths)} files, no first name, vendor, chat, credential, container path or leftover")
    return 0


def apply_docs():
    """One deliberate pass over the ledgers. Reported per line, never silent."""
    total = 0
    for rel in files_docs() + ["AGENTS.md", "README.md", "ci/RELEASE.md"] + [f for f in files_code() if f != "tools/scrub.py"]:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            continue
        s = open(p, encoding="utf8").read()
        t = s
        t = re.sub(r"\b" + FIRST_NAME + r"'s\b", "the owner's", t)
        t = re.sub(r"\b" + FIRST_NAME + r"\b", "the owner", t)
        # capitalise where the alias now opens a sentence, a heading, a cell or a line
        t = re.sub(r"(^|[.!?:]\s+|#+\s+|\|\s+|\*\*|\(|—\s+)the owner", lambda m: m.group(1) + "The owner", t, flags=re.M)
        t = re.sub(r"\bnew chat\b", "new session", t)
        t = re.sub(r"\bNEW-CHAT-PROMPT\b", "NEW-SESSION-PROMPT", t)
        t = re.sub(r"\bin chat\b", "in the session", t)
        t = re.sub(r"\ba chat\b", "a session", t)
        t = re.sub(r"\bthe chat\b", "the session", t)
        t = re.sub(r"\bthis chat\b", "this session", t)
        t = re.sub(r"\bchats\b", "sessions", t)
        t = re.sub(r"\bchat\b", "session", t)
        t = t.replace("/home/claude/", "~/").replace("/home/claude", "~")
        if t != s:
            n = sum(1 for a, b in zip(s.splitlines(), t.splitlines()) if a != b)
            total += n
            open(p, "w", encoding="utf8").write(t)
            print(f"  {rel}: {n} line(s) rewritten")
    print(f"  {total} lines changed; grep the files before believing it (landmine 104)")


def selftest():
    tmp = tempfile.mkdtemp()
    ok = True
    try:
        os.makedirs(os.path.join(tmp, "www", "bundle"))
        for rel, body in (("www/app.js", "const x = 1;\n"), ("README.md", "# clean\n")):
            open(os.path.join(tmp, rel), "w").write(body)
        clean = scan(SHIPPED + PUBLIC_TEXT, root=tmp)
        print(f"  {'ok  ' if not clean else 'FAIL'}  a clean tree passes")
        ok &= not clean
        probes = [("first name", f"// {FIRST_NAME} said so\n"),
                  ("AI vendor", "// written by Cl" + "aude\n"),
                  ("credential", "const k = 'AIza' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123';\n".replace("' + '", "")),
                  ("container", "// see /home/" + "claude/x\n"),
                  ("leftover", "// TO" + "DO later\n")]
        for what, body in probes:
            open(os.path.join(tmp, "www", "app.js"), "w").write("const x = 1;\n" + body)
            hits = scan(SHIPPED, root=tmp)
            fired = any(h[2] == what for h in hits)
            print(f"  {'ok  ' if fired else 'FAIL'}  planted {what}: {'guard fires' if fired else 'GUARD DID NOT FIRE'}")
            ok &= fired
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return ok


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--selftest" in a:
        print("scrub.py negative controls:"); raise SystemExit(0 if selftest() else 1)
    if "--strip" in a:
        strip(); raise SystemExit(0)
    if "--docs" in a and "--apply" in a:
        apply_docs(); raise SystemExit(0)
    raise SystemExit(check(with_docs="--docs" in a))
