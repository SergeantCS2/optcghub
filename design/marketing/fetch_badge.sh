#!/usr/bin/env bash
# Google's official "Get it on Google Play" badge (English), into $ADS_OUT/badge (outside the tree): it is
# Google's mark, used as Google ships it and never committed. Google's rules (Partner Marketing Hub, Google
# Play badge guidelines, read 28 Sept 2026): the badge unaltered (no recolour, no effects, no rearranged or
# changed text; "Get it on" and "Pre-register" are the only wordings), at least 28 px tall on screen, clear
# space of a quarter of its height, and never the Play icon on its own in marketing.
#   bash design/marketing/fetch_badge.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
OUT="${ADS_OUT:-$(dirname "$REPO")/ads-build}/badge"; mkdir -p "$OUT"
URL="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
curl -sfL --max-time 30 -o "$OUT/google-play-badge.png" "$URL"
python3 - "$OUT/google-play-badge.png" <<'PY'
import struct, sys
d = open(sys.argv[1], "rb").read()
assert d[:8] == b"\x89PNG\r\n\x1a\n", "fetch_badge: not a PNG"
w, h = struct.unpack(">II", d[16:24])
assert (w, h) == (646, 250), f"fetch_badge: {w}x{h}, expected Google's 646x250 (the file changed: look at it)"
print(f"fetch_badge: {sys.argv[1]} {w}x{h}")
PY
