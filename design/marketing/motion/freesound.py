"""The video's sound effects from Freesound, CC0 only.

  python3 design/marketing/motion/freesound.py search    each kind in sounds.json: the top CC0 candidates' previews
                                                         -> $ADS_OUT/sfx/, and an audition per kind (the candidates
                                                         one after another, numbered by order) -> sfx/audition/
  python3 design/marketing/motion/freesound.py pick KIND N   pin candidate N (1-based) of KIND into sounds.json
  python3 design/marketing/motion/freesound.py fetch     every pinned pick: licence re-checked, preview saved,
                                                         credits.json written (who made it, where, its licence)
  python3 design/marketing/motion/freesound.py --selftest    planted licences: only CC0 may pass

The key is FREESOUND_API_KEY in the environment (the cloud environment's settings), never a file here and never
printed. Freesound's API terms leave commercial use "negotiated case by case", and every sound keeps its own
licence: so only CC0 (public domain: a paid ad may use it with no credit) is searched, and a sound whose licence
is anything else (CC BY needs a credit the ad cannot show; CC BY-NC forbids an ad outright) is refused at search
and again at fetch, whatever sounds.json says. The files used are Freesound's HQ MP3 previews (128 kbps), which
token authentication can reach; originals need OAuth2."""
import json, os, subprocess, sys, tempfile, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check                                          # ffmpeg()
API = "https://freesound.org/apiv2"
SOUNDS = os.path.join(HERE, "sounds.json")
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ADS = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")   # as paths.mjs
SFX = os.path.join(ADS, "sfx")
FIELDS = "id,name,username,license,duration,previews,avg_rating,num_downloads,url"

def licence_ok(meta):
    """CC0 and nothing else. Freesound gives the licence as a URL (http or https, with or without a slash)."""
    lic = (meta.get("license") or "").strip().lower().rstrip("/")
    return lic.endswith("creativecommons.org/publicdomain/zero/1.0") or lic == "creative commons 0"

def key():
    k = os.environ.get("FREESOUND_API_KEY")
    if not k:
        sys.exit("freesound: FREESOUND_API_KEY is not set (the cloud environment's settings; never a file here)")
    return k

def get(path, **params):
    url = f"{API}{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Token {key()}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def save_preview(meta):
    os.makedirs(SFX, exist_ok=True)
    f = os.path.join(SFX, f"{meta['id']}.mp3")
    if not os.path.exists(f):
        urllib.request.urlretrieve(meta["previews"]["preview-hq-mp3"], f)
    return f

def palette():
    return {k: v for k, v in json.load(open(SOUNDS)).items() if not k.startswith("_")}

def search(n=4):
    out, cands = os.path.join(SFX, "audition"), {}
    os.makedirs(out, exist_ok=True)
    for kind, spec in palette().items():
        a, b = spec["seconds"]
        res = get("/search/text/", query=spec["query"], filter=f'license:"Creative Commons 0" duration:[{a} TO {b}]',
                  sort="downloads_desc", fields=FIELDS, page_size=12)["results"]
        keep = [m for m in res if licence_ok(m)][:n]              # the filter asked for CC0; the guard checks anyway
        refused = len(res) - len([m for m in res if licence_ok(m)])
        cands[kind] = [{k: m[k] for k in ("id", "name", "username", "license", "duration", "url", "num_downloads")} for m in keep]
        files = [save_preview(m) for m in keep]
        if files:
            audition(files, spec["max"], os.path.join(out, f"{kind}.mp3"))
        print(f"freesound: {kind}: {len(keep)} CC0 candidates" + (f" ({refused} refused: not CC0)" if refused else "") +
              "".join(f"\n  {i + 1}. {m['id']} {m['name']!r} by {m['username']}, {m['duration']:.2f} s" for i, m in enumerate(keep)))
    json.dump(cands, open(os.path.join(SFX, "candidates.json"), "w"), indent=1)
    print(f"freesound: auditions in {out} (each kind's candidates in order, 0.7 s apart)")

def audition(files, cap, dest):
    """the candidates one after another, each trimmed to the kind's max and followed by 0.7 s of silence"""
    ins, parts = [], []
    for i, f in enumerate(files):
        ins += ["-i", f]
        parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{cap},apad=pad_dur=0.7[a{i}]")
    graph = ";".join(parts) + ";" + "".join(f"[a{i}]" for i in range(len(files))) + f"concat=n={len(files)}:v=0:a=1[o]"
    subprocess.run([check.ffmpeg(), "-y", "-loglevel", "error", *ins, "-filter_complex", graph, "-map", "[o]",
                    "-c:a", "libmp3lame", "-b:a", "160k", dest], check=True)

def pick(kind, n):
    cands = json.load(open(os.path.join(SFX, "candidates.json")))[kind]
    m = cands[int(n) - 1]
    assert licence_ok(m), (kind, m["id"], m["license"])
    raw = json.load(open(SOUNDS)); raw[kind]["pick"] = m["id"]
    json.dump(raw, open(SOUNDS, "w"), indent=1, ensure_ascii=False); open(SOUNDS, "a").write("\n")
    print(f"freesound: {kind} -> {m['id']} {m['name']!r} by {m['username']}")

def fetch():
    credits = []
    for kind, spec in palette().items():
        if not spec.get("pick"):
            print(f"freesound: {kind}: no pick yet"); continue
        m = get(f"/sounds/{spec['pick']}/", fields=FIELDS)
        if not licence_ok(m):
            sys.exit(f"freesound: {kind}: {m['id']} is licensed {m['license']}, not CC0 -- refused")
        save_preview(m)
        credits.append({"kind": kind, "id": m["id"], "name": m["name"], "by": m["username"], "licence": m["license"], "url": m["url"]})
    json.dump(credits, open(os.path.join(SFX, "credits.json"), "w"), indent=1)
    print(f"freesound: {len(credits)} picks fetched, all CC0; credits in {os.path.join(SFX, 'credits.json')}")

def selftest():
    cases = [({"license": "http://creativecommons.org/publicdomain/zero/1.0/"}, True),
             ({"license": "https://creativecommons.org/publicdomain/zero/1.0"}, True),
             ({"license": "Creative Commons 0"}, True),
             ({"license": "http://creativecommons.org/licenses/by/4.0/"}, False),
             ({"license": "http://creativecommons.org/licenses/by-nc/4.0/"}, False),
             ({"license": "https://creativecommons.org/licenses/by-nc/3.0/"}, False),
             ({"license": "http://creativecommons.org/licenses/sampling+/1.0/"}, False),
             ({}, False)]
    bad = [(m, want) for m, want in cases if licence_ok(m) != want]
    print(f"selftest: {len(cases)} planted licences, {len(bad)} judged wrong")
    if bad:
        print("selftest: FAILED --", bad); sys.exit(1)
    print("selftest: CC0 passes in every spelling; BY, BY-NC, Sampling+ and a missing licence are refused"); sys.exit(0)

if __name__ == "__main__":
    a = sys.argv[1:]
    if "--selftest" in a: selftest()
    elif a[:1] == ["search"]: search()
    elif a[:1] == ["pick"]: pick(a[1], a[2])
    elif a[:1] == ["fetch"]: fetch()
    else: print(__doc__); sys.exit(2)
