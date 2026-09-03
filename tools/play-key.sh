#!/usr/bin/env bash
# The Play UPLOAD key, made once and put where CI reads it -- the four repository
# secrets -- without the key ever entering the tree, a seed, a session or a log
# (landmine 23, RUNBOOK-play §2).
#
# Run ONCE, on the PC (Git Bash, WSL, or any Linux/macOS shell) or on the Fold
# in Termux (`pkg install openjdk-21 gh`). Needs `keytool` from any JDK -- a
# Temurin JDK or Android Studio both carry one -- and, to set the secrets for
# you, the GitHub CLI logged in (`gh auth login`). Without gh it prints the
# four values to paste into the browser instead.
#
#   bash tools/play-key.sh                  # key in ~/optcghub-play-key/
#   bash tools/play-key.sh /some/other/dir
#
# It refuses to overwrite an existing key: a second upload key is a second
# registration with Play, and the first is the one Play knows.
set -euo pipefail
REPO="SergeantCS2/optcghub"
DIR="${1:-$HOME/optcghub-play-key}"
ALIAS="optcghub-upload"

# keytool: on PATH, or where Android Studio / a JDK keep it on Windows and macOS
KT=
for k in keytool "${JAVA_HOME:-/nonexistent}/bin/keytool" \
         "/c/Program Files/Android/Android Studio/jbr/bin/keytool.exe" \
         "/c/Program Files/Eclipse Adoptium/"*/bin/keytool.exe \
         "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool"; do
  if command -v "$k" >/dev/null 2>&1; then KT="$k"; break; fi
done
[ -n "$KT" ] || { echo "keytool not found. Install a JDK (adoptium.net, Temurin 21) or Android Studio, reopen the shell, run again."; exit 1; }

mkdir -p "$DIR"; chmod 700 "$DIR" 2>/dev/null || true
if [ -f "$DIR/upload.jks" ]; then
  echo "an upload key already exists at $DIR/upload.jks -- keeping it (see the header)"
else
  PASS=$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))' 2>/dev/null \
         || openssl rand -base64 30 | tr -d '/+=\n')
  "$KT" -genkeypair -keystore "$DIR/upload.jks" -storetype PKCS12 -alias "$ALIAS" \
        -keyalg RSA -keysize 2048 -validity 9125 \
        -storepass "$PASS" -keypass "$PASS" \
        -dname "CN=OP TCG Hub upload, OU=play, O=OP TCG Hub" >/dev/null 2>&1
  printf '%s' "$PASS" > "$DIR/password.txt"; chmod 600 "$DIR/password.txt" 2>/dev/null || true
  echo "made $DIR/upload.jks (alias $ALIAS, 25 years)"
fi
PASS=$(cat "$DIR/password.txt")

# Read it back before trusting it (AGENTS rule 2): the alias must be listed.
"$KT" -list -keystore "$DIR/upload.jks" -storepass "$PASS" 2>/dev/null | grep -qi "$ALIAS" \
  || { echo "the keystore does not list alias $ALIAS -- wrong password.txt or a damaged file"; exit 1; }
FP=$("$KT" -list -v -keystore "$DIR/upload.jks" -storepass "$PASS" -alias "$ALIAS" 2>/dev/null | grep -m1 'SHA256:' | sed 's/^[[:space:]]*//')
echo "upload key fingerprint  $FP"

# One line of base64: what the secret holds and what ci/apk.sh decodes.
if base64 --help 2>&1 | grep -q -- '-w'; then base64 -w0 "$DIR/upload.jks" > "$DIR/upload.b64"
else base64 "$DIR/upload.jks" | tr -d '\n' > "$DIR/upload.b64"; fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh secret set PLAY_UPLOAD_KEYSTORE_B64 --repo "$REPO" < "$DIR/upload.b64"
  gh secret set PLAY_UPLOAD_STORE_PASS   --repo "$REPO" --body "$PASS"
  gh secret set PLAY_UPLOAD_KEY_ALIAS    --repo "$REPO" --body "$ALIAS"
  gh secret set PLAY_UPLOAD_KEY_PASS     --repo "$REPO" --body "$PASS"
  echo "four secrets set on $REPO:"; gh secret list --repo "$REPO"
  echo "next: Actions -> build -> Run workflow. The release's .aab loses its DEVKEY-DO-NOT-UPLOAD suffix."
else
  cat <<TXT

GitHub CLI is not logged in (gh auth login), so set the four secrets by hand:
  github.com/$REPO -> Settings -> Secrets and variables -> Actions -> New repository secret

  PLAY_UPLOAD_KEYSTORE_B64   the ONE line in  $DIR/upload.b64   (open it, select all, copy)
  PLAY_UPLOAD_STORE_PASS     $PASS
  PLAY_UPLOAD_KEY_ALIAS      $ALIAS
  PLAY_UPLOAD_KEY_PASS       $PASS

then Actions -> build -> Run workflow; the release's .aab loses its DEVKEY-DO-NOT-UPLOAD suffix.
TXT
fi
echo
echo "Back up the folder $DIR somewhere that is not this machine. Never commit it -- .gitignore refuses *upload*.jks and *upload*.b64, and the gate refuses a tree that carries one."
