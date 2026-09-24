#!/usr/bin/env bash
# ci/signer.sh -- who signed a Play bundle, read back off the artifact (take 102).
#
# APEX landmine 211's companion, extracted from ci/apk.sh so it has controls the
# gate runs. A file named for the upload key that is signed by anything else is
# a burned versionCode on a Play rejection (landmine 33); a signer that cannot
# be read is not a pass (take 101); a THIRD key -- a rotated or wrong keystore
# in the secrets -- passed the old guard, which only refused the sideload key.
#
#   source ci/signer.sh; read_signer bundle.aab      -> "Owner: ..." (or "unreadable")
#                        signer_sha256 bundle.aab    -> "SHA256: ..." (or "")
#                        classify_signer "$owner"    -> upload | sideload | unreadable | other
#   bash ci/signer.sh --selftest                     -> the controls, no network
set -euo pipefail

UPLOAD_DN='CN=OP TCG Hub upload, OU=play'          # what tools/play-key.sh writes
SIDELOAD_DN='CN=OP TCG Hub, OU=sideload'           # the committed signing/optcghub.keystore
# The upload key's certificate fingerprint, read off the take-102 build's own log
# (run 51's "AAB signer SHA256:" line) -- take 103. A bundle carrying the upload DN
# with another fingerprint is a REGENERATED key: Play refuses it and the versionCode
# is burned (landmine 33). Rotate the pin only from a printed line, never from memory.
UPLOAD_SHA256='32:8E:60:A5:CE:9C:A9:93:97:25:EE:61:D7:11:F9:2A:1C:D6:A0:C4:00:0C:71:09:E4:32:F9:DD:C6:F3:28:95'

_cert() {   # the signature block, whatever the key type; keytool reads the certificate out of it
  unzip -p "$1" 'META-INF/*.RSA' 'META-INF/*.DSA' 'META-INF/*.EC' 2>/dev/null | keytool -printcert 2>/dev/null || true
}
read_signer() { local o; o=$(_cert "$1" | grep -m1 'Owner:' || true); echo "${o:-unreadable}"; }
signer_sha256() { _cert "$1" | grep -m1 'SHA256:' | sed 's/^[[:space:]]*//' || true; }
classify_signer() {
  case "$1" in
    *"$UPLOAD_DN"*)   echo upload;;          # the only signer a Play bundle may ship with
    *"$SIDELOAD_DN"*) echo sideload;;
    unreadable|"")    echo unreadable;;
    *)                echo other;;
  esac
}

fingerprint_ok() {   # "SHA256: AA:BB:..." as signer_sha256 prints it -> "ok", else "no" with exit 1
  local got="${1#SHA256: }"
  if [ -n "$got" ] && [ "$got" = "$UPLOAD_SHA256" ] && [ "$UPLOAD_SHA256" != "PIN-PENDING" ]; then echo ok; else echo no; return 1; fi
}

selftest() {
  local d; d=$(mktemp -d); local ok=1
  check() { if [ "$2" = "$3" ]; then echo "  ok    $1"; else echo "  FAIL  $1: got '$2', want '$3'"; ok=0; fi; }
  # 1. a zip with no signature block reads as unreadable (a plain entry, so jarsigner can sign a copy of it below)
  mkdir -p "$d/nosig/base"; echo x > "$d/nosig/base/x.txt"
  (cd "$d/nosig" && zip -q "$d/nosig.aab" base/x.txt)
  check "no signature block reads as unreadable" "$(read_signer "$d/nosig.aab")" "unreadable"
  check "...and classifies as unreadable" "$(classify_signer "$(read_signer "$d/nosig.aab")")" "unreadable"
  # 2. a zip signed with the committed sideload keystore reads as the sideload key
  local ks; ks="$(dirname "${BASH_SOURCE[0]}")/../signing/optcghub.keystore"
  cp "$d/nosig.aab" "$d/side.aab"
  if jarsigner -keystore "$ks" -storepass optcghub-sideload -signedjar "$d/side-signed.aab" "$d/side.aab" optcghub >/dev/null 2>&1; then
    check "a bundle signed with the sideload keystore classifies as sideload" "$(classify_signer "$(read_signer "$d/side-signed.aab")")" "sideload"
    check "...and its SHA-256 is read" "$(signer_sha256 "$d/side-signed.aab" | cut -c1-7)" "SHA256:"
  else
    echo "  FAIL  jarsigner could not sign the control bundle"; ok=0
  fi
  # 4. the pinned fingerprint (take 103): the upload DN with another fingerprint is a
  #    regenerated key -- Play would refuse it and burn the versionCode (landmine 33)
  check "the pinned fingerprint passes" "$(fingerprint_ok "SHA256: $UPLOAD_SHA256" 2>/dev/null)" "ok"
  check "control: the upload DN with another fingerprint is refused" "$(fingerprint_ok "SHA256: 00:11:22" 2>/dev/null)" "no"
  check "control: an empty fingerprint line is refused" "$(fingerprint_ok "" 2>/dev/null)" "no"
  # 3. the classification on the strings a readback yields
  check "the upload key's DN classifies as upload" "$(classify_signer "Owner: $UPLOAD_DN, O=OP TCG Hub")" "upload"
  check "control: a third key (a debug or rotated keystore) classifies as other, never upload" "$(classify_signer "Owner: CN=Android Debug, O=Android, C=US")" "other"
  check "control: the sideload DN classifies as sideload" "$(classify_signer "Owner: $SIDELOAD_DN, O=optcghub")" "sideload"
  rm -rf "$d"
  [ "$ok" = 1 ]
}

if [ "${1:-}" = "--selftest" ]; then
  echo "signer.sh controls:"
  selftest
fi
