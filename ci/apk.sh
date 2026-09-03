#!/usr/bin/env bash
# Package. All logic lives HERE because the seed can update this file and cannot
# update .github/workflows (APEX landmines 46, 84).
set -euo pipefail

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
# The icon is the committed SVG rendered at build time. PNGs are never
# committed: one source of truth, and a placeholder that is easy to replace by
# swapping one file (A16). Capacitor's default icon shipped in the take-14 test
# APK until this existed -- landmine 78.
pip install --quiet --break-system-packages cairosvg pillow 2>/dev/null || true
python3 - <<'PYICON'
import cairosvg, os
from PIL import Image, ImageDraw
svg = open('assets/icon.svg', 'rb').read()
cairosvg.svg2png(bytestring=svg, write_to='/tmp/icon-1024.png', output_width=1024, output_height=1024)
png = Image.open('/tmp/icon-1024.png').convert('RGBA')
for d, sz in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    dd = f'android/app/src/main/res/mipmap-{d}'; os.makedirs(dd, exist_ok=True)
    png.resize((sz, sz), Image.LANCZOS).save(f'{dd}/ic_launcher.png')
    m = Image.new('L', (sz, sz), 0); ImageDraw.Draw(m).ellipse((0, 0, sz - 1, sz - 1), fill=255)
    r = png.resize((sz, sz), Image.LANCZOS).copy(); r.putalpha(m); r.save(f'{dd}/ic_launcher_round.png')
    fs = int(sz * 1.5); fg = Image.new('RGBA', (fs, fs), (0, 0, 0, 0))
    inner = png.resize((int(fs * .66), int(fs * .66)), Image.LANCZOS)
    fg.paste(inner, ((fs - inner.width) // 2, (fs - inner.height) // 2), inner)
    fg.save(f'{dd}/ic_launcher_foreground.png')
bg = 'android/app/src/main/res/values/ic_launcher_background.xml'
t = open(bg).read().replace('#FFFFFF', '#05080A'); open(bg, 'w').write(t)
assert os.path.getsize('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png') > 2000, "icon did not render"
print("  launcher icons rendered from assets/icon.svg")

# The splash: the icon at ~30% width, centred on the app's background, for
# every drawable density Capacitor's template ships. Until take 15 the first
# second of every launch was Capacitor's own artwork (landmine 78's twin).
import glob
# assets/user/splash-bg.jpg, if the owner supplied one (A18), becomes the splash:
# cover-fit, darkened, icon centred on top. Otherwise the icon on navy.
user_bg = 'assets/user/splash-bg.jpg'
bg_img = Image.open(user_bg).convert('RGB') if os.path.exists(user_bg) else None
for d in glob.glob('android/app/src/main/res/drawable*'):
    for f in glob.glob(f'{d}/splash.png'):
        base = Image.open(f); W, H = base.size
        if bg_img:
            r = max(W / bg_img.width, H / bg_img.height)
            fit = bg_img.resize((int(bg_img.width * r) + 1, int(bg_img.height * r) + 1), Image.LANCZOS)
            canvas = fit.crop(((fit.width - W) // 2, (fit.height - H) // 2,
                               (fit.width - W) // 2 + W, (fit.height - H) // 2 + H)).convert('RGBA')
            shade = Image.new('RGBA', (W, H), (11, 22, 34, 140)); canvas = Image.alpha_composite(canvas, shade)
        else:
            canvas = Image.new('RGBA', (W, H), (11, 22, 34, 255))
        side = int(min(W, H) * 0.30)
        ic = png.resize((side, side), Image.LANCZOS)
        canvas.paste(ic, ((W - side) // 2, (H - side) // 2), ic)
        canvas.convert('RGB').save(f)
print("  splash screens rendered" + (" over assets/user/splash-bg.jpg" if bg_img else " on the app background"))

# Play store graphics (A21 #5), from the same SVG: icon 512 and a 1024x500
# feature graphic -- icon left, wordmark right, on the night sea.
os.makedirs('play-assets', exist_ok=True)
png.resize((512, 512), Image.LANCZOS).save('play-assets/icon-512.png')
from PIL import ImageDraw, ImageFont
fg = Image.new('RGBA', (1024, 500), (11, 22, 34, 255))
d = ImageDraw.Draw(fg)
ic = png.resize((360, 360), Image.LANCZOS); fg.paste(ic, (70, 70), ic)
try:
    f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 74)
    f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
except Exception:
    f1 = f2 = ImageFont.load_default()
d.text((470, 150), "OP TCG Hub", font=f1, fill=(201, 162, 74))
d.text((472, 250), "Scan without a cap.", font=f2, fill=(234, 223, 200))
d.text((472, 292), "Value, build, trade. Offline.", font=f2, fill=(160, 142, 112))
fg.convert('RGB').save('play-assets/feature-1024x500.png')
assert os.path.getsize('play-assets/icon-512.png') > 5000 and os.path.getsize('play-assets/feature-1024x500.png') > 5000
print("  play-assets: icon-512.png, feature-1024x500.png")
PYICON
echo "::endgroup::"

echo "::group::APK size — ABI filter"
# MEASURED at take 5 on the first real build: a 51 MB APK, of which 41 MB is
# libmlkit_google_ocr_pipeline.so shipped FOUR times -- arm64-v8a, armeabi-v7a,
# x86 and x86_64. The two x86 variants exist for emulators; no phone on earth
# runs this app on them. Landmine 58.
#
# The Play AAB splits per-ABI automatically, so this only shapes the SIDELOAD
# APK -- which is the artifact the owner actually installs.
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
print("  sideload APK limited to arm64-v8a + armeabi-v7a")
PYABI
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
cd android && ./gradlew --no-daemon assembleRelease && cd ..
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
echo "::endgroup::"

echo "::group::Play AAB"
AAB="optcghub-take-$TAKE.aab"
if [ -n "${PLAY_UPLOAD_KEYSTORE_B64:-}" ]; then
  echo "$PLAY_UPLOAD_KEYSTORE_B64" | base64 -d > /tmp/upload.jks
  export PLAY_UPLOAD_KS=/tmp/upload.jks
  cd android && ./gradlew --no-daemon bundleRelease -Pupload=1 && cd ..
  cp android/app/build/outputs/bundle/release/*.aab "$AAB"
  shred -u /tmp/upload.jks
  # APEX landmine 211's companion: read the signer back off the artifact Play
  # actually receives. A file named for the upload key that is dev-signed is a
  # burned versionCode (landmine 33).
  SIGNER=$(unzip -p "$AAB" META-INF/*.RSA 2>/dev/null | keytool -printcert 2>/dev/null | grep -m1 'Owner:' || echo "unreadable")
  echo "  AAB signer: $SIGNER"
  case "$SIGNER" in *"OP TCG Hub, OU=sideload"*)
    echo "::error::AAB is signed with the SIDELOAD key, not the upload key"; exit 1;; esac
else
  # No secrets set: still build, but NAME it unfit so nobody uploads a
  # dev-signed bundle and burns a versionCode on a rejection (landmine 33).
  cd android && ./gradlew --no-daemon bundleRelease && cd ..
  AAB="optcghub-take-$TAKE-DEVKEY-DO-NOT-UPLOAD.aab"
  cp android/app/build/outputs/bundle/release/*.aab "$AAB"
  echo "::warning::No Play secrets set — AAB is dev-signed and named unfit to upload."
fi
echo "aab=$AAB" >> "$GITHUB_OUTPUT"
echo "::endgroup::"

echo "::group::what shipped"
ls -lh "$APK" "$AAB"
unzip -l "$APK" | grep -c 'assets/public' || true
# The catalogue must actually be inside the APK. An app that ships without it
# shows an empty binder and the only thing that catches that is a count.
unzip -l "$APK" | grep -q 'assets/public/bundle/catalog.json' \
  || { echo "::error::catalog.json is NOT in the APK"; exit 1; }
echo "::endgroup::"
