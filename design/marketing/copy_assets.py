#!/usr/bin/env python3
"""The App campaign's text assets: five headlines (30 characters) and five descriptions (90).

Google's limits and editorial rules, and this app's own:
- no price and no "N× apart" in text. EB03-024's spread was 316× in the README, 110× on the listing and
  63× in the app on 27 Sept; a number in an ad would be wrong within a week. Numbers live in the
  pictures, read off the day's capture.
- never "no ads" or "ad-free" (landmine 88): rewarded ads unlock saves.
- the game is named only for what the app does with it ("One Piece TCG card scanner"), never as the
  app's name, and never with "official", "licensed" or a publisher's name (the owner, 27 Sept).
- Google's editorial rules: no "!" in a headline, no "!!" anywhere (so "DON!!" never appears), no word
  in capitals that is not an acronym, no "#1" or "best", no emoji.

  python3 design/marketing/copy_assets.py              -> the assets, checked, and $ADS_OUT/copy.txt to paste
  python3 design/marketing/copy_assets.py --selftest   -> the guard, watched to refuse a bad sample of each kind first
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.environ.get("ADS_OUT") or os.path.join(os.path.dirname(REPO), "ads-build")

HEADLINES = [
    "One Piece TCG card scanner",
    "Know which printing you own",
    "Unlimited One Piece TCG scans",
    "Works offline. No account.",
    "Price your One Piece cards",
]
DESCRIPTIONS = [
    "Scan One Piece Card Game cards with no cap. See which printing you own and its price.",
    "Base, alt art or SP? The scanner shows every printing of a number and asks if unsure.",
    "A One Piece TCG collection tracker that works offline. No account, no subscription.",
    "Build One Piece TCG decks checked against the Comprehensive Rules as you go.",
    "Free to use. Value a trade, hunt sealed product and find One Piece TCG events near you.",
]
# spares, checked the same way, for rotating in once Google reports which assets are "Low"
SPARE_HEADLINES = [
    "Base, alt art or SP?",
    "One Piece TCG deck builder",
    "Scan One Piece TCG cards",
    "OP TCG Hub: scan & value",
    "Hunt One Piece TCG sealed",
]
SPARE_DESCRIPTIONS = [
    "Free, with short rewarded ads that unlock saves. Scanning is never gated.",
    "Every price shows the day it was fetched. CSV export and a backup on every save.",
]

ACRONYMS = {"OP", "TCG", "OPTCG", "SP", "CSV", "US", "DON"}
LIMIT = {"headline": 30, "description": 90}
RULES = [   # (why, pattern) -- any match refuses the line
    ("a price or a multiple", re.compile(r"\$\s?\d|\d\s?[x×](?![a-z])|\d+\s?times\b", re.I)),
    ("says there are no ads (landmine 88)", re.compile(r"\bno ads\b|\bad[- ]free\b|\bwithout ads\b", re.I)),
    ("implies affiliation", re.compile(r"\b(official|licensed|endorsed|bandai|shueisha|toei|tcgplayer)\b", re.I)),
    ("a superlative or ranking", re.compile(r"#\s?1\b|\bbest\b|\btop[- ]rated\b|\bnumber one\b", re.I)),
    ("repeated punctuation", re.compile(r"([!?.])\1")),
    ("an emoji or symbol", re.compile(r"[←-⯿\U0001F000-\U0001FAFF]")),
]

def problems(kind, text):
    """Why a line is refused, or an empty list."""
    out = []
    if len(text) > LIMIT[kind]:
        out.append(f"{len(text)} characters, over {LIMIT[kind]}")
    if kind == "headline" and "!" in text:
        out.append("an exclamation mark in a headline")
    for why, rx in RULES:
        if rx.search(text):
            out.append(why)
    for w in re.findall(r"[A-Za-z]{2,}", text):
        if w.isupper() and w not in ACRONYMS:
            out.append(f"a word in capitals: {w}")
    # the game names what the app does with its cards, never the app itself
    for m in re.finditer(r"One Piece(?!\s+(TCG|Card Game|cards))", text):
        out.append("'One Piece' not followed by TCG, Card Game or cards")
    return out

def check(headlines, descriptions, spares=((), ())):
    """Every refusal across a set, as (kind, text, why)."""
    bad = []
    for kind, lines in (("headline", list(headlines) + list(spares[0])), ("description", list(descriptions) + list(spares[1]))):
        for t in lines:
            bad += [(kind, t, why) for why in problems(kind, t)]
        seen = set()
        for t in lines:
            if t.lower() in seen:
                bad.append((kind, t, "a duplicate"))
            seen.add(t.lower())
    if len(headlines) != 5 or len(descriptions) != 5:
        bad.append(("set", f"{len(headlines)} headlines, {len(descriptions)} descriptions", "Google takes five of each"))
    return bad

def selftest():
    """Each planted line must be refused for the reason named beside it, before the real set passes."""
    planted = [
        ("headline", "The #1 One Piece TCG scanner app", "characters, over 30"),
        ("headline", "Scan cards now!", "an exclamation mark in a headline"),
        ("headline", "Life and DON!! counter", "an exclamation mark in a headline"),
        ("description", "Track DON!! for both players at the table, and the refresh done for you.", "repeated punctuation"),
        ("description", "Same number, 316× apart. Know which one you own.", "a price or a multiple"),
        ("description", "The SP is $441.73 today and the base is $7.00.", "a price or a multiple"),
        ("description", "No ads while you scan. Your collection stays on your phone.", "says there are no ads"),
        ("description", "The official One Piece TCG collection tracker.", "implies affiliation"),
        ("description", "The best collection tracker on Google Play.", "a superlative or ranking"),
        ("headline", "FREE card scanner", "a word in capitals: FREE"),
        ("headline", "The One Piece scanner", "'One Piece' not followed by"),
        ("description", "Scan your cards 🔥 with no cap.", "an emoji or symbol"),
    ]
    missed = [(k, t, want) for k, t, want in planted if not any(want in why for why in problems(k, t))]
    assert not missed, ("the guard let a planted line through", missed)
    print(f"selftest: all {len(planted)} planted lines refused for the reason named")
    dup = check(HEADLINES[:4] + HEADLINES[:1], DESCRIPTIONS)
    assert any(why == "a duplicate" for _, _, why in dup), "a duplicate headline was not refused"
    print("selftest: a duplicate headline refused")
    bad = check(HEADLINES, DESCRIPTIONS, (SPARE_HEADLINES, SPARE_DESCRIPTIONS))
    assert not bad, bad
    print("selftest: the real set passes")

def paste_block():
    rows = ["HEADLINES (30)"] + [f"{t}\t{len(t)}" for t in HEADLINES]
    rows += ["", "DESCRIPTIONS (90)"] + [f"{t}\t{len(t)}" for t in DESCRIPTIONS]
    rows += ["", "SPARE HEADLINES"] + [f"{t}\t{len(t)}" for t in SPARE_HEADLINES]
    rows += ["", "SPARE DESCRIPTIONS"] + [f"{t}\t{len(t)}" for t in SPARE_DESCRIPTIONS]
    return "\n".join(rows) + "\n"

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(); sys.exit(0)
    bad = check(HEADLINES, DESCRIPTIONS, (SPARE_HEADLINES, SPARE_DESCRIPTIONS))
    for b in bad:
        print("refused:", b)
    if bad:
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, "copy.txt"), "w").write(paste_block())
    print(paste_block(), end="")
    print(f"copy: {len(HEADLINES)} headlines and {len(DESCRIPTIONS)} descriptions pass, with "
          f"{len(SPARE_HEADLINES) + len(SPARE_DESCRIPTIONS)} spares; written to {os.path.join(OUT, 'copy.txt')}")
