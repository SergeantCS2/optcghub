#!/usr/bin/env python3
"""What shipped, by component (take 101, A21/A14).

The owner read 56 MB on the phone for a 34.9 MB APK and a 23.8 MB bundle
and asked why. The answer is a table, not a paragraph: raw is what Android
installs (the archive extracted), packed is what is downloaded; a bundle
compresses the native libraries an APK must store, and Play serves each
phone its own ABI. The apk job prints this for every build so a size take
is measured against a log line (landmine 58's precedent: 51 MB became 29
by measuring, not guessing).

    python3 tools/shipped.py optcghub-take-100.apk optcghub-take-100.aab
"""
import collections, os, re, sys, zipfile

GROUPS = [
    (r'^(?:base/)?lib/([^/]+)/', lambda m: f'lib/{m.group(1)} (native .so)'),   # anchored (take 102): a lib/ segment inside assets is not native code
    (r'(?:^|/)classes\d*\.dex$|^base/dex/', lambda m: 'dex (compiled code)'),
    (r'^(?:base/)?assets/public/', lambda m: 'assets/public (the app, the catalogue, hunt, fonts)'),
    (r'^(?:base/)?assets/', lambda m: 'assets (other: the OCR models)'),
    (r'^(?:base/)?res/|resources\.(arsc|pb)$', lambda m: 'res (icons, layouts, the resource table)'),
    (r'^(?:base/)?META-INF/', lambda m: 'META-INF (signature)'),
    # take 104: the R8 map inside a bundle (52.7 MB on take 103) is what Play reads for a
    # crash report and is never installed; counted as "other" it doubled the raw total
    (r'^BUNDLE-METADATA/', lambda m: 'BUNDLE-METADATA (the R8 map Play reads; never installed)'),
]
METADATA = 'BUNDLE-METADATA (the R8 map Play reads; never installed)'


def installed_raw(groups, tr):
    """The raw total a phone can install: every entry but the bundle's metadata."""
    return tr - groups.get(METADATA, [0, 0, 0])[0]


def breakdown(path):
    """-> (groups {name: [raw, packed, files]}, biggest [(raw, packed, name)], raw_total, packed_total)."""
    groups, big, tr, tp = collections.OrderedDict(), [], 0, 0
    with zipfile.ZipFile(path) as z:
        for i in z.infolist():
            n, u, c = i.filename, i.file_size, i.compress_size
            tr += u; tp += c
            g = 'other'
            for pat, name in GROUPS:
                m = re.search(pat, n)
                if m:
                    g = name(m); break
            a = groups.setdefault(g, [0, 0, 0]); a[0] += u; a[1] += c; a[2] += 1
            big.append((u, c, n))
    return groups, sorted(big, reverse=True), tr, tp


def report(path, top=8):
    groups, big, tr, tp = breakdown(path)
    # the file is the download (entries plus the zip's own headers and directory); the
    # raw total is what a phone reports installed for an APK, and for a bundle it counts
    # every ABI although a phone installs one (take 102, the review's finding)
    raw_label = "raw, both ABIs — a phone installs one" if path.lower().endswith(".aab") else "raw (what the phone reports installed)"
    ir = installed_raw(groups, tr)
    meta = f"; the R8 map ({(tr - ir)/1e6:.1f} MB raw) left out of that" if tr != ir else ""
    lines = [f"{os.path.basename(path)}: {os.path.getsize(path)/1e6:.1f} MB file (the download); entries {tp/1e6:.1f} MB packed, {ir/1e6:.1f} MB {raw_label}{meta}"]
    for g, (u, c, k) in sorted(groups.items(), key=lambda x: -x[1][0]):
        lines.append(f"   {u/1e6:6.1f} MB raw  {c/1e6:6.1f} MB packed  {k:4d} files  {g}")
    lines.append("   biggest, raw / packed:")
    for u, c, n in big[:top]:
        lines.append(f"     {u/1e6:6.2f} / {c/1e6:5.2f} MB  {n}")
    return "\n".join(lines)


def selftest():
    """A control: an archive of known shape is grouped and summed exactly."""
    import tempfile
    tmp = tempfile.TemporaryDirectory(); d = tmp.name; p = os.path.join(d, "t.apk")
    with zipfile.ZipFile(p, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("classes.dex", b"d" * 1000)
        z.writestr("lib/arm64-v8a/libx.so", b"s" * 500, compress_type=zipfile.ZIP_STORED)
        z.writestr("assets/public/bundle/catalog.json", b"{}" * 300)
        z.writestr("assets/mlkit/model.fb", b"m" * 200)
        z.writestr("res/x.png", b"p" * 50)
        z.writestr("META-INF/CERT.RSA", b"c" * 10)
        z.writestr("base/dex/classes2.dex", b"e" * 100)
    g, big, tr, tp = breakdown(p)
    z3 = [0, 0, 0]                                        # a missing group prints FAIL instead of raising (take 102)
    checks = [
        ("dex groups both spellings", g.get("dex (compiled code)", z3)[0] == 1100 and g.get("dex (compiled code)", z3)[2] == 2),
        ("a stored .so is raw == packed", g.get("lib/arm64-v8a (native .so)", z3)[0] == g.get("lib/arm64-v8a (native .so)", z3)[1] == 500),
        ("the app's assets are apart from the OCR models", g.get("assets/public (the app, the catalogue, hunt, fonts)", z3)[0] == 600 and g.get("assets (other: the OCR models)", z3)[0] == 200),
        ("the totals are the sum of every entry", tr == 1100 + 500 + 600 + 200 + 50 + 10),
        ("control: a name in no group is 'other', not silently dropped", "other" not in g and breakdown(_with_other(p))[0].get("other", [0])[0] == 7),
        ("control: a lib/ segment inside the app's assets is the app's, not a native library (take 102)",
         breakdown(_with_asset_lib(p))[0].get("assets/public (the app, the catalogue, hunt, fonts)", [0])[0] == 600 + 9
         and not any(k.startswith("lib/foo") for k in breakdown(_with_asset_lib(p))[0])),
    ]
    # take 104: the bundle's R8 map (BUNDLE-METADATA/.../proguard.map, 52.7 MB on take 103)
    # is what Play reads for crash reports and is never installed -- its own group, and
    # the installed total leaves it out
    gm, bigm, trm, tpm = breakdown(_with_map(p))
    checks += [
        ("control: the bundle's R8 map lands in its own group, not 'other'",
         gm.get("BUNDLE-METADATA (the R8 map Play reads; never installed)", z3)[0] == 30 and gm.get("other", z3)[0] == 7),
        ("control: the installed total leaves the map out", installed_raw(gm, trm) == trm - 30),
    ]
    ok = True
    for name, good in checks:
        ok &= good; print(f"  {'ok  ' if good else 'FAIL'}  {name}")
    tmp.cleanup()
    return ok


def _with_asset_lib(p):
    with zipfile.ZipFile(p, "a") as z:
        z.writestr("assets/public/hunt/lib/foo/x.js", b"j" * 9)   # a directory under lib/ is what the unanchored pattern caught
    return p


def _with_map(p):
    with zipfile.ZipFile(p, "a") as z:
        z.writestr("BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map", b"r" * 30)
    return p


def _with_other(p):
    with zipfile.ZipFile(p, "a") as z:
        z.writestr("stray.txt", b"x" * 7)
    return p


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("shipped.py controls:")
        raise SystemExit(0 if selftest() else 1)
    files = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not files:
        print("usage: python3 tools/shipped.py <apk|aab> [more...]   (or --selftest)")
        raise SystemExit(2)
    for f in files:
        print(report(f))
