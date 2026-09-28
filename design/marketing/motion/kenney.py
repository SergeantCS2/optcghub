"""The video's sound effects from Kenney's audio packs (kenney.nl): public domain, no account, no key.

  python3 design/marketing/motion/kenney.py          every pack sounds.json names -> $ADS_OUT/sfx/kenney/<pack>/
  python3 design/marketing/motion/kenney.py --selftest   planted licence files: only CC0 may pass

Each pack is a zip linked from its page (kenney.nl/assets/<pack>) and carries its own License.txt. The pack is
kept only if that file says CC0 (Creative Commons Zero: personal and commercial use, credit optional); any other
licence, or none, and the pack is deleted and the run refused. Nothing is committed: the files stay in $ADS_OUT."""
import json, os, re, shutil, sys, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ADS = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")   # as paths.mjs
DIR = os.path.join(ADS, "sfx", "kenney")
SOUNDS = os.path.join(HERE, "sounds.json")

def licence_ok(text):
    """the pack's own License.txt names CC0 and names no other licence"""
    t = (text or "").lower()
    cc0 = "creative commons zero" in t or "publicdomain/zero/1.0" in t
    other = re.search(r"creativecommons\.org/licenses/|attribution|non-?commercial|\bcc[- ]by\b", t)
    return cc0 and not other

def palette():
    return {k: v for k, v in json.load(open(SOUNDS)).items() if not k.startswith("_")}

def packs():
    return sorted({l["kenney"].split("/")[0] for spec in palette().values() for l in spec["layers"] if "kenney" in l})

def fetch(pack):
    dest = os.path.join(DIR, pack)
    if os.path.exists(os.path.join(dest, "License.txt")):
        return dest
    page = urllib.request.urlopen(f"https://kenney.nl/assets/{pack}", timeout=30).read().decode("utf-8", "ignore")
    m = re.search(r'https://kenney\.nl/media/pages/assets/[^"\']+\.zip', page)
    if not m:
        sys.exit(f"kenney: no zip on the {pack} page")
    os.makedirs(DIR, exist_ok=True)
    z = os.path.join(DIR, f"{pack}.zip")
    urllib.request.urlretrieve(m.group(0), z)
    with zipfile.ZipFile(z) as f:
        f.extractall(dest)
    os.remove(z)
    lic = os.path.join(dest, "License.txt")
    if not (os.path.exists(lic) and licence_ok(open(lic, errors="ignore").read())):
        shutil.rmtree(dest)
        sys.exit(f"kenney: {pack} is not CC0 by its own License.txt -- deleted and refused")
    return dest

def path_of(layer):
    """a layer's file: kenney "<pack>/<file>", found under the pack's Audio folder"""
    pack, name = layer["kenney"].split("/", 1)
    for root, _, files in os.walk(os.path.join(DIR, pack)):
        if name in files:
            return os.path.join(root, name)
    sys.exit(f"kenney: {layer['kenney']} not found (run design/marketing/motion/kenney.py)")

def selftest():
    cases = [("License (Creative Commons Zero, CC0)\nhttp://creativecommons.org/publicdomain/zero/1.0/\n"
              "You may use these assets in personal and commercial projects.", True),
             ("License: CC BY 4.0 http://creativecommons.org/licenses/by/4.0/", False),
             ("Attribution-NonCommercial 4.0 International", False),
             ("Creative Commons Zero, but attribution required", False),
             ("", False)]
    bad = [(t[:40], want) for t, want in cases if licence_ok(t) != want]
    print(f"selftest: {len(cases)} planted licence files, {len(bad)} judged wrong")
    if bad:
        print("selftest: FAILED --", bad); sys.exit(1)
    print("selftest: Kenney's CC0 text passes; BY, BY-NC, a CC0 claim with a credit demand, and nothing are refused"); sys.exit(0)

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    for p in packs():
        print(f"kenney: {p} -> {fetch(p)} (CC0 by its License.txt)")
