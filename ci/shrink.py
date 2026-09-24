#!/usr/bin/env python3
"""The shrink patch (take 103, A14): R8 on the release build and only the Latin
OCR model in the artifact.

    python3 ci/shrink.py android/app      # patch build.gradle + proguard-rules.pro in place
    python3 ci/shrink.py --selftest       # the controls, against Capacitor's own template

MEASURED from Release take-100's files: dex 23.0 MB raw with R8 off; the four
non-Latin OCR models 3.81 MB raw / 2.39 packed, never used -- the app asks the
plugin for LATIN only (landmine 11). The plugin declares all five ML Kit
artifacts; excluding the four drops their AARs and the models they carry. Its
Java still names the four option classes inside a switch the LATIN path never
reaches, so R8 is told not to warn about them (AGP 8 fails a build on a
missing class otherwise). The marker is VERSIONED and an older block is
REPLACED, never skipped (landmine A-211); any change to what this writes bumps
the version. Every step asserts it landed (APEX landmine 99).
"""
import os, re, sys

MARK = "// OPTCGHUB-SHRINK v1"
EXCLUDES = ("chinese", "devanagari", "japanese", "korean")
BLOCK = MARK + "\n" + "configurations.all {\n" + "".join(
    f"    exclude group: 'com.google.mlkit', module: 'text-recognition-{m}'\n" for m in EXCLUDES) + "}\n// OPTCGHUB-SHRINK end\n"
RULES = "# OPTCGHUB-SHRINK v1 -- the plugin names four recognisers this build does not carry\n" + "".join(
    f"-dontwarn com.google.mlkit.vision.text.{m}.**\n" for m in EXCLUDES) + "# OPTCGHUB-SHRINK end\n"


def patch(app_dir):
    """Patch build.gradle and proguard-rules.pro under app_dir; assert every step landed."""
    A = os.path.join(app_dir, "build.gradle")
    s = open(A).read()
    # an older block of ours, wherever a previous version put it, goes first
    s = re.sub(r"\n?[ \t]*// OPTCGHUB-SHRINK v\d+.*?// OPTCGHUB-SHRINK end\n\n?", "\n", s, flags=re.S)   # the blank line after it too, or a re-run grows one
    # the release build type: the template ships minifyEnabled false and the plain defaults;
    # on a re-run the block already carries the three lines and the pattern is a no-op
    s = re.sub(r"(buildTypes \{\s*release \{)[^}]*?minifyEnabled\s+\w+[^\n]*\n(?:[^\n]*shrinkResources[^\n]*\n)?[^\n]*proguardFiles[^\n]*\n",
               r"\1\n            minifyEnabled true\n            shrinkResources true\n"
               r"            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n",
               s, count=1, flags=re.S)
    # the excludes at the top level, before `android {` -- a project-level block, not the extension's
    s = re.sub(r"(\nandroid \{\n)", "\n" + BLOCK.replace("\\", "\\\\") + r"\1", s, count=1)
    open(A, "w").write(s)
    t = open(A).read()
    assert t.count("OPTCGHUB-SHRINK v") == 1, "shrink block did not land exactly once (landmine A-211)"
    assert "minifyEnabled true" in t and "minifyEnabled false" not in t, "minifyEnabled did not flip"
    assert "shrinkResources true" in t, "shrinkResources did not land"
    assert "proguard-android-optimize.txt" in t, "the optimize defaults did not land"
    assert t.count("exclude group: 'com.google.mlkit'") == 4, "the four excludes did not land"
    P = os.path.join(app_dir, "proguard-rules.pro")
    rules = open(P).read() if os.path.exists(P) else ""
    rules = re.sub(r"\n?# OPTCGHUB-SHRINK v\d+.*?# OPTCGHUB-SHRINK end\n", "", rules, flags=re.S)
    rules = rules.rstrip("\n") + "\n\n" + RULES
    open(P, "w").write(rules)
    r = open(P).read()
    assert r.count("-dontwarn com.google.mlkit.vision.text.") == 4 and r.count("OPTCGHUB-SHRINK v") == 1, "rules did not land once"
    return f"  {MARK}: R8 + shrinkResources on the release build; the four non-Latin ML Kit modules excluded; 4 -dontwarn rules"


# The release block as Capacitor 8's template ships it (assets/android-template.tar.gz,
# app/build.gradle); the real template is used as well whenever node_modules has it.
FIXTURE = """apply plugin: 'com.android.application'

android {
    namespace "com.optcghub.app"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.optcghub.app"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation project(':capacitor-android')
}
"""


def selftest(patch_fn=patch):
    import tempfile, tarfile
    ok = True
    def check(name, good):
        nonlocal ok
        ok &= bool(good); print(f"  {'ok  ' if good else 'FAIL'}  {name}")
    sources = [("the fixture", None)]
    tgz = os.path.join(os.path.dirname(__file__), "..", "node_modules", "@capacitor", "cli", "assets", "android-template.tar.gz")
    if os.path.exists(tgz):
        sources.append(("Capacitor's own template", tgz))
    for label, src in sources:
        with tempfile.TemporaryDirectory() as d:
            app = os.path.join(d, "app"); os.makedirs(app)
            if src:
                with tarfile.open(src) as tf:
                    for m in tf.getmembers():
                        if m.name in ("app/build.gradle", "app/proguard-rules.pro"):
                            open(os.path.join(app, os.path.basename(m.name)), "wb").write(tf.extractfile(m).read())
            else:
                open(os.path.join(app, "build.gradle"), "w").write(FIXTURE)
            before = open(os.path.join(app, "build.gradle")).read()
            check(f"{label}: the template ships minifyEnabled false", "minifyEnabled false" in before)
            patch_fn(app); once = open(os.path.join(app, "build.gradle")).read()
            patch_fn(app); twice = open(os.path.join(app, "build.gradle")).read()
            rel = re.search(r"release \{(.*?)\n        \}", once, re.S).group(1)
            check(f"{label}: the release block carries minifyEnabled true, shrinkResources true, the optimize defaults",
                  "minifyEnabled true" in rel and "shrinkResources true" in rel and "proguard-android-optimize.txt" in rel and "minifyEnabled false" not in once)
            check(f"{label}: the excludes sit at the top level, before android {{", MARK in once and once.index(MARK) < once.index("\nandroid {"))
            check(f"{label}: a second run changes nothing (one block, one rules block)", once == twice and twice.count("OPTCGHUB-SHRINK v") == 1)
            rp = os.path.join(app, "proguard-rules.pro"); rules = open(rp).read() if os.path.exists(rp) else ""
            check(f"{label}: four -dontwarn rules, once", rules.count("-dontwarn com.google.mlkit.vision.text.") == 4 and rules.count("OPTCGHUB-SHRINK v") == 1)
    # control: a build.gradle with no release block must be REFUSED, never patched in silence
    with tempfile.TemporaryDirectory() as d:
        app = os.path.join(d, "app"); os.makedirs(app)
        open(os.path.join(app, "build.gradle"), "w").write("apply plugin: 'com.android.application'\n\nandroid {\n    namespace 'x'\n}\n")
        try:
            patch_fn(app); refused = False
        except AssertionError:
            refused = True
        check("control: a build.gradle without a release block is refused (landmine 99)", refused)
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("shrink.py controls:")
        raise SystemExit(0 if selftest() else 1)
    if len(sys.argv) != 2:
        print("usage: python3 ci/shrink.py <android/app>   (or --selftest)"); raise SystemExit(2)
    print(patch(sys.argv[1]))
