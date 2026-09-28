"""Backing music from OpenGameArt (opengameart.org), CC0 only: no account, no key.

  python3 design/marketing/motion/oga.py fetch SLUG [SLUG ...]   each page's audio files -> $ADS_OUT/music/oga/<slug>/
                                                                  with meta.json (title, author, licence, page)
  python3 design/marketing/motion/oga.py --selftest              planted licence blocks: only CC0 may pass

A page is kept only if its own "License(s)" field lists CC0 and nothing else, linked to the CC0 deed; any
other licence (CC-BY, OGA-BY, GPL ...), or several, and nothing is downloaded. A recording's CC0 does not
clear a song someone else wrote, so covers and "inspired by" pieces of known songs are left out by hand
(record why in CLAUDE.md). Nothing is committed: the files stay in $ADS_OUT."""
import html, json, os, re, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ADS = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")   # as paths.mjs
DIR = os.path.join(ADS, "music", "oga")

def licences(page):
    """the licence names in the page's own License(s) field, with the deeds they link to"""
    i = page.find("field-name-field-art-licenses")
    if i < 0:
        return []
    j = page.find('<div class="field field-name', i + 10)
    block = page[i:j if j > 0 else i + 4000]
    names = re.findall(r"class=['\"]license-name['\"]>([^<]+)<", block)
    deeds = re.findall(r"href=['\"](https?://creativecommons\.org/[^'\"]+)['\"]", block)
    return [(n.strip(), deeds[k] if k < len(deeds) else "") for k, n in enumerate(names)]

def cc0_only(page):
    lic = licences(page)
    return bool(lic) and all(n == "CC0" and "publicdomain/zero/1.0" in d for n, d in lic)

def get(url, dest=None, tries=4):
    """opengameart is slow at times: a few tries, a minute each"""
    for k in range(tries):
        try:
            if dest:
                return urllib.request.urlretrieve(url, dest)
            return urllib.request.urlopen(url, timeout=60).read().decode("utf-8", "ignore")
        except OSError as e:
            if k == tries - 1:
                raise
            print(f"oga: {url}: {e.__class__.__name__}, retrying")

def fetch(slug):
    url = f"https://opengameart.org/content/{slug}"
    page = get(url)
    if not cc0_only(page):
        print(f"oga: {slug}: licence {licences(page)} -- not CC0 only, refused"); return None
    title = html.unescape((re.findall(r"<title>([^<|]+)", page) or [slug])[0]).strip()
    author = (re.findall(r'field-name-author-submitter.*?<a href="/users/[^"]+">([^<]+)</a>', page, re.S) or ["?"])[0]
    files = sorted(set(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:mp3|ogg|wav|flac|zip))"', page)))
    dest = os.path.join(DIR, slug); os.makedirs(dest, exist_ok=True)
    got = []
    for f in files:
        name = urllib.parse.unquote(f.rsplit("/", 1)[1]); out = os.path.join(dest, name)
        if not os.path.exists(out):
            get(f, out)
        if name.endswith(".zip"):                              # a collection: its audio files, flattened
            import zipfile
            with zipfile.ZipFile(out) as z:
                for m in z.namelist():
                    if re.search(r"\.(mp3|ogg|wav|flac)$", m, re.I) and not m.startswith("__MACOSX"):
                        t = os.path.join(dest, os.path.basename(m))
                        if not os.path.exists(t):
                            open(t, "wb").write(z.read(m))
                        got.append(os.path.basename(m))
            os.remove(out); continue
        got.append(name)
    json.dump({"title": title, "author": author, "licence": "CC0", "page": url, "files": got}, open(os.path.join(dest, "meta.json"), "w"), indent=1)
    print(f"oga: {slug}: {title!r} by {author}, CC0, {len(got)} files")
    return dest

def selftest():
    blk = lambda *pairs: ('<div class="field field-name-field-art-licenses"><div class="field-items">' +
                          "".join(f"<a href='{d}'><div class='license-name'>{n}</div></a>" for n, d in pairs) +
                          '</div></div><div class="field field-name-collect">')
    cc0 = ("CC0", "http://creativecommons.org/publicdomain/zero/1.0/")
    cases = [(blk(cc0), True),
             (blk(("CC-BY 4.0", "http://creativecommons.org/licenses/by/4.0/")), False),
             (blk(cc0, ("CC-BY 3.0", "http://creativecommons.org/licenses/by/3.0/")), False),   # dual: the stricter binds
             (blk(("CC0", "http://creativecommons.org/licenses/by/4.0/")), False),               # a CC0 label on a BY deed
             ("<p>This is CC0, promise</p>", False)]                                               # no licence field at all
    bad = [k for k, (page, want) in enumerate(cases) if cc0_only(page) != want]
    print(f"selftest: {len(cases)} planted licence blocks, {len(bad)} judged wrong {bad}")
    if bad:
        print("selftest: FAILED"); sys.exit(1)
    print("selftest: CC0 alone passes; BY, CC0 with BY, a CC0 label on a BY deed, and a page with no licence field are refused"); sys.exit(0)

if __name__ == "__main__":
    a = sys.argv[1:]
    if "--selftest" in a: selftest()
    if a[:1] == ["fetch"]:
        for s in a[1:]:
            try:
                fetch(s)
            except OSError as e:
                print(f"oga: {s}: gave up ({e.__class__.__name__})")
    else:
        print(__doc__); sys.exit(2)
