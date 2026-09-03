#!/usr/bin/env python3
"""Project constants. One place, so CI and a laptop cannot diverge.

Authority lives HERE, in the seed — never in the workflow file. APEX landmine
199: an environment override in CI outranked the seed and shipped the wrong
region at full green for 27 takes.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# TCGplayer category. 68 is the One Piece Card Game (English).
# PROVEN take 1 against the live service.
CATEGORY_ID = 68
CATEGORY_NAME = "One Piece Card Game"

TCGCSV = "https://tcgcsv.com/tcgplayer"
LAST_UPDATED = "https://tcgcsv.com/last-updated.txt"
IMAGE_CDN = "https://tcgplayer-cdn.tcgplayer.com/product/{pid}_200w.jpg"

# Landmine 5: a blocked fetch returns an empty list, not an error. Declare who
# we are, go sequentially, and assert non-empty per group.
USER_AGENT = "optcghub-catalog/1.0 (+https://github.com/optcghub; collection tracker)"

CACHE = os.path.join(ROOT, "tcgcsv_cache")
CATALOG_DB = os.path.join(ROOT, "catalog", "catalog.sqlite")
MANIFEST = os.path.join(ROOT, "catalog", "manifest.json")

# The printed code on a One Piece card face.
#   OP01-016  ST27-005  EB03-024  P-084
#
# NO ANCHORS AND NO \b. Landmine 63: OCR of the printed strip returns the code
# with the rarity badge and cost bubble concatenated onto it -- "EB04-024008" --
# so a trailing \b never matches and a $ anchor never matches. The take-4 rig
# carried the anchored form and MEASURED 3% read; the same crops with this form
# read 53%. It was the instrument that was broken, not the idea.
CODE_RE = r"(OP|ST|EB|PRB|LT|P)\d{0,2}-\d{3}"

# A read that is not a real card number is a NO read, never a wrong one. The
# catalogue knows all 2,825 valid numbers, so this check is free and it cut
# confidently-wrong reads from 8% to 2% (MEASURED take 7, n=150).
VALIDATE_AGAINST_CATALOGUE = True

# Landmine 7: an upstream decimal slip is likelier than a 10x market move.
MAX_DAILY_PRICE_FACTOR = 10.0
# Landmine 6: a cached payload must not masquerade as a fresh one.
MAX_MANIFEST_AGE_HOURS = 36
# MEASURED take 1: 6,860 card products. Landmine 8 — the catalogue is small.
EXPECTED_CARDS = 6860
COUNT_TOLERANCE = 0.02

# Landmine 1 + take 2 measurement. Auto-accept a scan ONLY when being wrong is
# cheap: every candidate within this factor of every other. MEASURED take 2 —
# on code alone this covers 9.1% of products; with set context, 62.3%.
SAFE_SPREAD_FACTOR = 1.25


# ---------------------------------------------------------------------------
# ADS — A17. Take 22 wires the SDK against GOOGLE'S PUBLISHED TEST IDS, which
# serve real test ads and never accrue invalid traffic. Jacob replaces these
# three values with his own from the AdMob console and nothing else changes.
#
# Rule (landmine 31 / A17 "ruled out"): real unit IDs NEVER go in a debug or
# sideload-testing build until the account is verified -- invalid-traffic bans
# are permanent. The test IDs below are safe in every build.
ADMOB_APP_ID          = "ca-app-pub-3940256099942544~3347511713"   # Google test app ID (Android)
ADMOB_REWARD_SCAN     = "ca-app-pub-3940256099942544/5224354917"   # Google test rewarded unit
ADMOB_REWARD_DECK     = "ca-app-pub-3940256099942544/5224354917"   # same unit until Jacob has two
ADMOB_IS_TEST         = ADMOB_APP_ID.startswith("ca-app-pub-3940256099942544")

# D10 -- Jacob's starting numbers, constants until he says otherwise.
CREDITS_FREE_ON_INSTALL = 20
CREDITS_PER_AD          = 20
DECKS_FREE              = 1
DECKS_PER_AD            = 1


# ---------------------------------------------------------------------------
# IN-APP CATALOGUE REFRESH -- take 27. The installed app fetches the nightly
# bundle from the Pages site and keeps it on disk; the bundled copy is the
# fallback and the first-run catalogue. Empty = disabled (the app says
# "update the app for new prices"). Jacob sets this when the repo exists:
#   UPDATE_URL = "https://<you>.github.io/optcghub/bundle/"
UPDATE_URL = ""
