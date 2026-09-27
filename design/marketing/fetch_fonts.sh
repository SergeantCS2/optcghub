#!/usr/bin/env bash
# The drafts' typefaces, all SIL OFL 1.1, from npm's @fontsource packages into $ADS_OUT/fonts (outside the
# tree). Only the Latin weights the drafts use. None is committed until the owner picks a direction; the
# chosen style's then go under design/marketing/fonts/ with their licences.
#   bash design/marketing/fetch_fonts.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
OUT="${ADS_OUT:-$(dirname "$REPO")/ads-build}/fonts"; mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
get() {   # package, then the files wanted from its files/ directory
  local pkg="$1"; shift
  (cd "$TMP" && npm pack "$pkg" --silent >/dev/null)
  local tgz; tgz="$(ls -t "$TMP"/*.tgz | head -1)"; mkdir -p "$TMP/x" && tar -xzf "$tgz" -C "$TMP/x"
  grep -q '"license": *"OFL-1.1"' "$TMP/x/package/package.json" || { echo "fetch_fonts: $pkg is not OFL-1.1" >&2; exit 1; }
  for f in "$@"; do cp "$TMP/x/package/files/$f" "$OUT/"; done
  rm -rf "$TMP/x" "$tgz"
}
get @fontsource/cormorant-garamond cormorant-garamond-latin-{500,600,700}-normal.woff2 cormorant-garamond-latin-{500,600}-italic.woff2
get @fontsource/inter inter-latin-{400,500,600,700,800}-normal.woff2
get @fontsource/ibm-plex-mono ibm-plex-mono-latin-{400,500,600}-normal.woff2
get @fontsource-variable/fraunces fraunces-latin-full-{normal,italic}.woff2
get @fontsource/shippori-mincho shippori-mincho-latin-{500,600,700,800}-normal.woff2
echo "fetch_fonts: $(ls "$OUT" | wc -l) files in $OUT, every package OFL-1.1"
