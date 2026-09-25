#!/usr/bin/env bash
# Package. All logic lives HERE because the seed can update this file and cannot
# update .github/workflows (APEX landmines 46, 84).
set -euo pipefail

# Take 115: Gradle runs in a subshell. `cd android && ./gradlew ... && cd ..` let a failed build
# through -- errexit skips a command inside an && list -- so the script stayed in android/ and died
# a line later at cp, "cannot stat", before the upload key was shredded. It stops here, and says so.
gradle() { (cd android && ./gradlew --no-daemon "$@") || { echo "::error::gradle $* failed -- its own output is above; nothing was packaged"; return 1; }; }

if [ "${1:-}" = "--selftest" ]; then
  # every line below that runs Gradle, run as written against a stand-in gradlew: one that fails
  # must stop the script with gradle's own message, one that passes must leave it where it began
  echo "apk.sh controls:"
  ok=1; d=$(mktemp -d); trap 'rm -rf "$d"' EXIT; mkdir "$d/android"
  printf '#!/bin/sh\nexit "${STANDIN_RC:-0}"\n' > "$d/android/gradlew"; chmod +x "$d/android/gradlew"
  n=0
  while IFS= read -r line; do
    n=$((n + 1))
    run() { (cd "$d" && STANDIN_RC=$1 bash -c "set -euo pipefail
$(declare -f gradle)
shred() { :; }
$line
[ \"\$(pwd)\" = '$d' ] && echo PAST-GRADLE-AT-ROOT || echo PAST-GRADLE-ELSEWHERE" 2>&1); }
    out=$(run 1) && rc=0 || rc=$?
    case "$rc:$out" in
      0:*|*PAST-GRADLE*) echo "  FAIL  a failed build went on past: $line"; ok=0;;
      *"::error::gradle"*) echo "  ok    a failed build stops the script with gradle's message: $line";;
      *) echo "  FAIL  a failed build stopped without gradle's message: $line"; ok=0;;
    esac
    out=$(run 0) && rc=0 || rc=$?
    [ "$rc" = 0 ] && [ "${out##*$'\n'}" = PAST-GRADLE-AT-ROOT ] && echo "  ok    ...control: a build that passes goes on, from the tree's root" \
      || { echo "  FAIL  a passing build did not go on from the tree's root ($rc: ${out##*$'\n'}): $line"; ok=0; }
  done < <(grep -E '^[^#]*(gradlew|^[[:space:]]*gradle )' "$0" | grep -v '^gradle()')
  [ "$n" -ge 3 ] && echo "  ok    three Gradle runs found, as the build has (sideload APK, Play AAB, dev AAB): $n" || { echo "  FAIL  $n Gradle runs found, not the build's three"; ok=0; }
  [ "$ok" = 1 ] && exit 0 || exit 1
fi

TAKE=$(grep -oP 'VAULT_TAKE=\K[0-9]+' BUILD)
echo "take=$TAKE" >> "$GITHUB_OUTPUT"

# versionCode only ever goes up, and a code uploaded once is burned forever even
# from a deleted draft (landmine 33). Derived, never hand-edited.
VC=$TAKE

echo "::group::capacitor"
npm ci --silent || npm install --silent
# The newest build-tools present, not a pinned one: a runner image carries
# several and the pinned 36.0.0 may not be among them (landmine 105).
BT=$(ls -d "${ANDROID_HOME:-/usr/local/lib/android/sdk}"/build-tools/* 2>/dev/null | sort -V | tail -1)
[ -n "$BT" ] || { echo "::error::no Android build-tools under ANDROID_HOME"; exit 1; }
echo "  build-tools: $BT"
npx cap add android 2>/dev/null || true
npx cap sync android
echo "::endgroup::"

echo "::group::android config"
# Take 4 wrote this step blind; take 5 ran it for the first time. It patched
# android/app/build.gradle for compileSdk -- which lives in variables.gradle as
# a rootProject.ext reference -- and produced
#     compileSdk 36 rootProject.ext.compileSdkVersion
# i.e. broken Gradle, on what would have been the very first CI run.
# Landmine 56. SDK levels go in variables.gradle; only the version goes in app.
python3 - "$VC" "$TAKE" <<'PYCFG'
import re, sys
vc, take = sys.argv[1], sys.argv[2]
# An empty vc produced `versionCode ` and the assertion `"versionCode " in t`
# passed on it. Landmine 69: a guard is only as strict as its weakest input.
assert vc.isdigit() and int(vc) > 0, f"versionCode must be a positive integer, got {vc!r}"
assert take.isdigit() and int(take) > 0, f"take must be a positive integer, got {take!r}"

V = "android/variables.gradle"
s = open(V).read()
# Landmine 37: API 36 mandatory for new Play submissions since 31 Aug 2026.
# Capacitor 8 already defaults to 36; pinning it means a template bump cannot
# silently drop us below the floor.
for k in ("compileSdkVersion", "targetSdkVersion"):
    s = re.sub(rf"{k}\s*=\s*\d+", f"{k} = 36", s)
open(V, "w").write(s)
t = open(V).read()
for k in ("compileSdkVersion", "targetSdkVersion"):
    assert f"{k} = 36" in t, f"{k} patch did not land (APEX landmine 99)"

A = "android/app/build.gradle"
s = open(A).read()
# versionCode only ever goes up and is burned on upload, even from a deleted
# draft (landmine 33). Derived from the take, never hand-edited.
# Match the whole line, not just a well-formed one: a previous run that was
# interrupted (or the take-9 empty-input bug) can leave `versionCode ` with
# nothing after it, and a patch that only applies to a pristine file cannot
# repair the file it broke.
s = re.sub(r"^(\s*)versionCode\b[^\n]*$", rf"\1versionCode {vc}", s, flags=re.M)
s = re.sub(r'^(\s*)versionName\b[^\n]*$', rf'\1versionName "1.0.{take}"', s, flags=re.M)
open(A, "w").write(s)
t = open(A).read()
assert f"versionCode {vc}" in t, "versionCode patch did not land (APEX landmine 99)"
assert f'versionName "1.0.{take}"' in t, "versionName patch did not land"
# And prove we did NOT recreate the take-4 breakage.
assert "rootProject.ext.compileSdkVersion" in t, \
    "app/build.gradle lost its compileSdk reference -- landmine 56 again"
print(f"  variables.gradle: compileSdk/targetSdk 36")
print(f"  app/build.gradle: versionCode {vc}, versionName 1.0.{take}")
PYCFG

# Folding is a configuration change; without these the WebView reloads and a
# scan batch is lost mid-session (APEX landmine 7). Capacitor 8's template
# already carries all three -- VERIFIED at take 5, not assumed -- so this
# checks rather than patches, and fails loudly if a future template drops one.
MANIFEST=android/app/src/main/AndroidManifest.xml
CFG=$(grep -o 'android:configChanges="[^"]*"' "$MANIFEST" || true)
for tok in screenLayout smallestScreenSize screenSize; do
  case "$CFG" in
    *"$tok"*) ;;
    *) echo "::error::AndroidManifest configChanges is missing '$tok' (APEX landmine 7)"; exit 1 ;;
  esac
done
echo "  configChanges carries screenLayout|smallestScreenSize|screenSize"

# A17: the AdMob app ID, from config.py, into strings.xml and the manifest
# meta-data the plugin's README specifies (read at take 22). Generated every
# build so a unit-ID change is a config change. Assert after (APEX landmine 99).
python3 - <<'PYADS'
import re, sys, os
sys.path.insert(0, "tools")
from config import ADMOB_APP_ID, ADMOB_IS_TEST
S = "android/app/src/main/res/values/strings.xml"
t = open(S).read()
if "admob_app_id" not in t:
    t = t.replace("</resources>", f'    <string name="admob_app_id">{ADMOB_APP_ID}</string>\n</resources>')
else:
    t = re.sub(r'<string name="admob_app_id">[^<]*</string>', f'<string name="admob_app_id">{ADMOB_APP_ID}</string>', t)
open(S, "w").write(t)
M = "android/app/src/main/AndroidManifest.xml"
m = open(M).read()
if "com.google.android.gms.ads.APPLICATION_ID" not in m:
    m = m.replace("<application", "<application", 1)
    m = re.sub(r"(<application[^>]*>)", r'\1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>', m, count=1)
    open(M, "w").write(m)
assert f'<string name="admob_app_id">{ADMOB_APP_ID}</string>' in open(S).read(), "admob_app_id did not land"
assert 'com.google.android.gms.ads.APPLICATION_ID' in open(M).read(), "AdMob meta-data did not land"
print(f"  AdMob app id in strings.xml + manifest ({'TEST' if ADMOB_IS_TEST else 'REAL'} id)")
PYADS

# CAMERA. The scanner uses getUserMedia in the WebView; Capacitor's
# BridgeWebChromeClient (read at take 10) turns that into a runtime request for
# Manifest.permission.CAMERA and grants the WebView only if the app has it --
# and the app manifest declares nothing but INTERNET. Landmine 72. required=false
# so a camera-less tablet can still keep a collection by hand.
python3 - <<'PYCAM'
import re
M = "android/app/src/main/AndroidManifest.xml"
s = open(M).read()
if 'android.permission.CAMERA' not in s:
    s = s.replace('<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.INTERNET" />\n'
        '    <uses-permission android:name="android.permission.CAMERA" />\n'
        '    <uses-feature android:name="android.hardware.camera" android:required="false" />')
    open(M, "w").write(s)
t = open(M).read()
assert 'android.permission.CAMERA' in t, "CAMERA permission did not land (APEX landmine 99)"
assert 'android.hardware.camera' in t and 'required="false"' in t, "camera feature flag missing"
print("  CAMERA permission + camera feature (required=false)")
PYCAM
echo "::endgroup::"

echo "::group::launcher icon"
# The icon is the committed SVGs rendered at build time; PNGs are never
# committed (A16). ci/icon.py writes the legacy, round and adaptive launcher
# icons (background and foreground: one standard icon, no themed layer, the
# owner's word at take 113), the reminders' status-bar glyph with its keep
# rule, the splash and the Play icon, then checks every one; its controls run
# under the gate. Capacitor's default
# icon shipped in the take-14 test APK until this step existed -- landmine 78.
# The drawn 1024x500 feature graphic is retired: the listing's banner is built
# in design/play-listing and uploaded by hand (D7).
pip install --quiet --break-system-packages cairosvg pillow 2>/dev/null || true
python3 ci/icon.py android/app/src/main/res play-assets
echo "::endgroup::"

echo "::group::APK size — ABI filter"
# MEASURED at take 5 on the first real build: a 51 MB APK, of which 41 MB is
# libmlkit_google_ocr_pipeline.so shipped FOUR times -- arm64-v8a, armeabi-v7a,
# x86 and x86_64. The two x86 variants exist for emulators; no phone on earth
# runs this app on them. Landmine 58.
#
# The filter sits in defaultConfig, so it shapes the Play AAB too: the bundle
# carries the two ARM ABIs only and Play serves nothing to an x86 device (an
# emulator or a Chromebook) -- no phone is affected. Take 101 corrected this
# comment, which had said the sideload APK alone.
python3 - <<'PYABI'
import re
A = "android/app/build.gradle"
s = open(A).read()
if "abiFilters" not in s:
    s = re.sub(r"(defaultConfig\s*\{)",
               "\\1\n        ndk { abiFilters 'arm64-v8a', 'armeabi-v7a' }",
               s, count=1)
    open(A, "w").write(s)
assert "abiFilters" in open(A).read(), "abiFilters did not land (APEX landmine 99)"
print("  APK and AAB limited to arm64-v8a + armeabi-v7a (the filter sits in defaultConfig)")
PYABI
echo "::endgroup::"

echo "::group::shrink — R8 and the Latin-only OCR (take 103)"
# MEASURED from Release take-100's files (A14, HANDOFF take 103): dex 23.0 MB raw
# with R8 off; the four non-Latin OCR models 3.81 MB raw / 2.39 packed, never
# used -- the app asks the plugin for LATIN only (landmine 11) and the recogniser
# is charset-constrained. The plugin declares all five ML Kit artifacts; the
# exclude drops the four AARs and the models they carry. Its Java still names
# the four option classes inside a switch the LATIN path never reaches, so R8
# is told not to warn about them (AGP 8 fails the build on a missing class
# otherwise). The marker is VERSIONED and an older block is REPLACED (landmine
# A-211); any change to what this writes bumps the version.
python3 ci/shrink.py android/app     # the patch and its controls live there; the gate runs `ci/shrink.py --selftest`
echo "::endgroup::"

echo "::group::signing config"
# The sideload keystore is COMMITTED on purpose (signing/optcghub.keystore):
# a stable key is what lets take N install over take N-1 without losing the
# collection. Trade-off stated in AGENDA A8, mirroring APEX A21.
#
# APEX landmine 211: an idempotency marker the OLD patch also carries never
# upgrades. So the marker is VERSIONED and an older block is REPLACED, not
# skipped. Any change to what this writes must change the version string.
python3 - <<'PYSIGN'
import re
A = "android/app/build.gradle"
s = open(A).read()
MARK = "// OPTCGHUB-SIGNING v1"
# strip any older signing block we wrote (any version), so a stale android/
# from a previous take cannot keep an outdated config (landmine 211)
s = re.sub(r"\n\s*// OPTCGHUB-SIGNING v\d+.*?\n    signingConfigs \{.*?\n    \}\n",
           "\n", s, flags=re.S)
s = s.replace("\n            signingConfig signingConfigs.release", "", 1)
block = MARK + """
    //   default        : the COMMITTED sideload keystore; takes install over each other
    //   -Pupload=1     : the private Play upload key from repository secrets
    signingConfigs {
        release {
            def up = project.hasProperty('upload')
            storeFile file(up ? System.getenv("PLAY_UPLOAD_KS") : "../../signing/optcghub.keystore")
            storePassword up ? System.getenv("PLAY_UPLOAD_STORE_PASS") : "optcghub-sideload"
            keyAlias up ? System.getenv("PLAY_UPLOAD_KEY_ALIAS") : "optcghub"
            keyPassword up ? System.getenv("PLAY_UPLOAD_KEY_PASS") : "optcghub-sideload"
        }
    }
"""
s = re.sub(r"(android \{\n)", r"\1    " + block.replace("\\", "\\\\") + "\n", s, count=1)
s = re.sub(r"(buildTypes \{\s*release \{)",
           r"\1\n            signingConfig signingConfigs.release", s, count=1)
open(A, "w").write(s)
t = open(A).read()
assert MARK in t, "signing block did not land (APEX landmine 99)"
assert "signingConfig signingConfigs.release" in t, "release buildType not wired"
assert t.count("OPTCGHUB-SIGNING") == 1, "more than one signing block — landmine 211"
print(f"  {MARK}: committed sideload key by default, -Pupload=1 for Play")
PYSIGN
echo "::endgroup::"

echo "::group::sideload APK"
gradle assembleRelease
APK="optcghub-take-$TAKE.apk"
cp android/app/build/outputs/apk/release/*.apk "$APK"
# Read the signer BACK off the artifact (APEX landmine 211). Every take must be
# signed by the committed sideload key, or the next one will not install over
# it and the collection is gone. This was checked by hand for eleven takes;
# now it is a gate.
SIGNER=$("$BT/apksigner" verify --print-certs "$APK" | grep -m1 'certificate DN' || echo none)
echo "  APK signer: $SIGNER"
case "$SIGNER" in *"CN=OP TCG Hub, OU=sideload"*) ;;
  *) echo "::error::APK is not signed by the committed sideload key — takes would not install over each other (A8)"; exit 1;; esac
"$BT/aapt2" dump badging "$APK" | grep -oE "versionCode='[0-9]+'|application-label:'[^']+'" | tr '\n' ' '; echo
echo "apk=$APK" >> "$GITHUB_OUTPUT"
# take 103: what the shrink promised, read back off the artifact (landmine A-211's
# rule applies to every patch, not just the signer)
NONLATIN=$(unzip -l "$APK" | grep -cE "Beng_ctc|Deva_ctc|Hani_ctc|Jpan_ctc|Kore_ctc" || true)
LATIN=$(unzip -l "$APK" | grep -c "Latn_ctc" || true)
echo "  OCR models in the APK: Latin entries $LATIN, non-Latin entries $NONLATIN"
[ "$NONLATIN" = 0 ] || { echo "::error::the APK still carries $NONLATIN non-Latin OCR model entries — the exclude did not take (A14)"; exit 1; }
[ "$LATIN" -gt 0 ] || { echo "::error::the APK carries no Latin OCR model — the scanner would read nothing (landmine 11)"; exit 1; }
MAPPING=android/app/build/outputs/mapping/release/mapping.txt
[ -s "$MAPPING" ] || { echo "::error::R8 left no mapping.txt — the release was not shrunk (A14)"; exit 1; }
# take 105 (landmine 141): the mapping must show Capacitor's annotation classes kept by name, else a
# plugin's checkPermissions resolves undefined on the phone -- read off the artifact, never assumed
python3 ci/shrink.py --check-mapping "$MAPPING" || { echo "::error::the release mapping renamed or dropped Capacitor's annotation classes — reminders would report notifications as off (landmine 141)"; exit 1; }
MAP="optcghub-take-$TAKE-mapping.txt"; cp "$MAPPING" "$MAP"
echo "mapping=$MAP" >> "$GITHUB_OUTPUT"
USAGE=android/app/build/outputs/mapping/release/usage.txt
echo "  R8: mapping $(wc -l < "$MAP") lines; usage.txt (what was removed) $( [ -f "$USAGE" ] && wc -l < "$USAGE" || echo 0) lines"
echo "::endgroup::"

echo "::group::Play AAB"
AAB="optcghub-take-$TAKE.aab"
if [ -n "${PLAY_UPLOAD_KEYSTORE_B64:-}" ]; then
  echo "$PLAY_UPLOAD_KEYSTORE_B64" | base64 -d > /tmp/upload.jks
  export PLAY_UPLOAD_KS=/tmp/upload.jks
  gradle bundleRelease -Pupload=1 || { shred -u /tmp/upload.jks; exit 1; }   # the key never outlives a failed build
  cp android/app/build/outputs/bundle/release/*.aab "$AAB"
  shred -u /tmp/upload.jks
  # APEX landmine 211's companion: read the signer back off the artifact Play
  # actually receives. A file named for the upload key that is dev-signed is a
  # burned versionCode (landmine 33).
  # ci/signer.sh (take 102): the readback and its classification live there with
  # the controls the gate runs. Only the upload key passes -- the old guard refused
  # the sideload key and (take 101) an unreadable signer, and let a third key
  # through. The certificate's SHA-256 is printed so a later take can pin it.
  . ci/signer.sh
  SIGNER=$(read_signer "$AAB")
  echo "  AAB signer: $SIGNER"
  echo "  AAB signer $(signer_sha256 "$AAB")"
  case "$(classify_signer "$SIGNER")" in
    upload)     fingerprint_ok "$(signer_sha256 "$AAB")" >/dev/null \
                  || { echo "::error::AAB signer has the upload DN but NOT the pinned fingerprint ($(signer_sha256 "$AAB")) — a regenerated key; Play would refuse it and burn versionCode $TAKE (landmine 33). Pin a new key only from a printed line (ci/signer.sh)"; exit 1; };;
    sideload)   echo "::error::AAB is signed with the SIDELOAD key, not the upload key"; exit 1;;
    unreadable) echo "::error::AAB signer could not be read off the bundle (no signature block, or keytool failed)"; exit 1;;
    *)          echo "::error::AAB is signed with a key that is NOT the Play upload key ($SIGNER) — the secrets hold the wrong keystore; Play would refuse it and burn versionCode $TAKE (landmine 33)"; exit 1;;
  esac
else
  # No secrets set: still build, but NAME it unfit so nobody uploads a
  # dev-signed bundle and burns a versionCode on a rejection (landmine 33).
  gradle bundleRelease
  AAB="optcghub-take-$TAKE-DEVKEY-DO-NOT-UPLOAD.aab"
  cp android/app/build/outputs/bundle/release/*.aab "$AAB"
  echo "::warning::No Play secrets set — AAB is dev-signed and named unfit to upload."
fi
echo "aab=$AAB" >> "$GITHUB_OUTPUT"
echo "::endgroup::"

echo "::group::what shipped"
ls -lh "$APK" "$AAB"
# Take 101: the breakdown by component, raw (installed) and packed (downloaded),
# for both artifacts -- the owner read 56 MB on the phone for a 34.9 MB file and
# the answer is this table. A size take is measured against it, never guessed.
python3 tools/shipped.py "$APK" "$AAB" || echo "::warning::the size table failed — a report, never a reason to hold a release"
echo "  assets/public entries in the APK: $(unzip -l "$APK" | grep -c 'assets/public' || true)"   # take 103: labelled; it printed a bare count
# The catalogue must actually be inside the APK. An app that ships without it
# shows an empty binder and the only thing that catches that is a count.
unzip -l "$APK" | grep -q 'assets/public/bundle/catalog.json' \
  || { echo "::error::catalog.json is NOT in the APK"; exit 1; }
echo "::endgroup::"
