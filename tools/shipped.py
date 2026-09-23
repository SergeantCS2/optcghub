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
import collections, re, sys, zipfile

GROUPS = [
    (r'(?:base/)?lib/([^/]+)/', lambda m: f'lib/{m.group(1)} (native .so)'),
    (r'(?:^|/)classes\d*\.dex$|^base/dex/', lambda m: 'dex (compiled code)'),
    (r'^(?:base/)?assets/public/', lambda m: 'assets/public (the app, the catalogue, hunt, fonts)'),
    (r'^(?:base/)?assets/', lambda m: 'assets (other: the OCR models)'),
    (r'^(?:base/)?res/|resources\.(arsc|pb)$', lambda m: 'res (icons, layouts, the resource table)'),
    (r'^(?:base/)?META-INF/', lambda m: 'META-INF (signature)'),
]


def breakdown(path):
    """-> (groups {name: [raw, packed, files]}, biggest [(raw, packed, name)], raw_total, packed_total)."""
    z = zipfile.ZipFile(path)
    groups, big, tr, tp = collections.OrderedDict(), [], 0, 0
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
    lines = [f"{path}: {tp/1e6:.1f} MB packed (the download), {tr/1e6:.1f} MB raw (what the phone reports installed)"]
    for g, (u, c, k) in sorted(groups.items(), key=lambda x: -x[1][0]):
        lines.append(f"   {u/1e6:6.1f} MB raw  {c/1e6:6.1f} MB packed  {k:4d} files  {g}")
    lines.append("   biggest, raw / packed:")
    for u, c, n in big[:top]:
        lines.append(f"     {u/1e6:6.2f} / {c/1e6:5.2f} MB  {n}")
    return "\n".join(lines)


def selftest():
    """A control: an archive of known shape is grouped and summed exactly."""
    import io, os, tempfile
    d = tempfile.mkdtemp(); p = os.path.join(d, "t.apk")
    with zipfile.ZipFile(p, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("classes.dex", b"d" * 1000)
        z.writestr("lib/arm64-v8a/libx.so", b"s" * 500, compress_type=zipfile.ZIP_STORED)
        z.writestr("assets/public/bundle/catalog.json", b"{}" * 300)
        z.writestr("assets/mlkit/model.fb", b"m" * 200)
        z.writestr("res/x.png", b"p" * 50)
        z.writestr("META-INF/CERT.RSA", b"c" * 10)
        z.writestr("base/dex/classes2.dex", b"e" * 100)
    g, big, tr, tp = breakdown(p)
    checks = [
        ("dex groups both spellings", g["dex (compiled code)"][0] == 1100 and g["dex (compiled code)"][2] == 2),
        ("a stored .so is raw == packed", g["lib/arm64-v8a (native .so)"][0] == g["lib/arm64-v8a (native .so)"][1] == 500),
        ("the app's assets are apart from the OCR models", g["assets/public (the app, the catalogue, hunt, fonts)"][0] == 600 and g["assets (other: the OCR models)"][0] == 200),
        ("the totals are the sum of every entry", tr == 1100 + 500 + 600 + 200 + 50 + 10),
        ("control: a name in no group is 'other', not silently dropped", "other" not in g and breakdown(_with_other(p))[0].get("other", [0])[0] == 7),
    ]
    ok = True
    for name, good in checks:
        ok &= good; print(f"  {'ok  ' if good else 'FAIL'}  {name}")
    return ok


def _with_other(p):
    with zipfile.ZipFile(p, "a") as z:
        z.writestr("stray.txt", b"x" * 7)
    return p


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("shipped.py controls:")
        raise SystemExit(0 if selftest() else 1)
    for f in sys.argv[1:]:
        print(report(f))
