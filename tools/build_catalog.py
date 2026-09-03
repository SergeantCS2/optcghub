#!/usr/bin/env python3
"""Build catalog.sqlite from the cached TCGCSV payload.

Two databases, always (landmine 22). This builds the DISPOSABLE one. It can be
deleted and replaced wholesale at any time and the collector's data is untouched,
because user.db references printings by TCGplayer productId string and nothing
else.

The unit here is a PRINTING (a TCGplayer productId), never a card number.
Landmine 1, and take 2 measured how bad it gets: OP01-016 is twelve printings
from $0.47 to $2,017.24.
"""
import json, os, re, sqlite3, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CATALOG_DB, MANIFEST, ROOT, SAFE_SPREAD_FACTOR
import tcgcsv, variants

SCHEMA = """
PRAGMA journal_mode=OFF;
CREATE TABLE card_set (
  group_id     INTEGER PRIMARY KEY,
  abbr         TEXT,
  name         TEXT NOT NULL,
  published_on TEXT,
  card_count   INTEGER NOT NULL DEFAULT 0
);

-- One row per PRINTING. This is the unit of identity, quantity and value.
CREATE TABLE printing (
  product_id   INTEGER PRIMARY KEY,      -- TCGplayer's, stable across rebuilds
  group_id     INTEGER NOT NULL REFERENCES card_set(group_id),
  number       TEXT NOT NULL,            -- printed on the card face: 'EB03-024'
  name         TEXT NOT NULL,            -- base name, suffixes stripped
  full_name    TEXT NOT NULL,            -- TCGplayer's, verbatim, for search
  treatment    TEXT NOT NULL,            -- base|alternate_art|sp|parallel|manga|...
  same_art     INTEGER NOT NULL,         -- 1 = hash cannot separate from base
  face_class   TEXT NOT NULL DEFAULT 'plain',  -- what the CARD FACE shows:
                                         -- 'plain' | 'star' | 'sp'
                                         -- MEASURED take 6 from real card scans
  provenance   TEXT,                     -- promo distribution, if any
  award        TEXT,                     -- winner|finalist|participant
  rarity       TEXT,
  card_type    TEXT,
  color        TEXT,
  cost         TEXT,
  power        TEXT,
  life         TEXT,                     -- Leader life total. Ingested at take 4
                                         -- because a deck builder cannot work
                                         -- without it and a re-ingest later is
                                         -- far dearer than a column now.
  counterplus  TEXT,
  attribute    TEXT,
  subtypes     TEXT,
  text         TEXT,                     -- cleaned: no HTML, newline between effect lines
  keywords     TEXT,                     -- '|'-joined keywords the card HAS (§10)
  image_url    TEXT,                     -- REFERENCE ONLY, never mirrored (landmine 26)
  tcg_url      TEXT,
  is_sealed    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ix_printing_number ON printing(number);
CREATE INDEX ix_printing_group  ON printing(group_id, number);

CREATE TABLE price (
  product_id   INTEGER NOT NULL REFERENCES printing(product_id),
  sub_type     TEXT NOT NULL,            -- 'Normal' | 'Foil'
  market       REAL, low REAL, mid REAL, high REAL,
  PRIMARY KEY (product_id, sub_type)
);

CREATE TABLE price_history (
  product_id INTEGER NOT NULL, day TEXT NOT NULL, market REAL NOT NULL,
  PRIMARY KEY (product_id, day)
);

-- 64-bit dHash of the art window. 8 bytes each; the whole game is ~55 KB.
CREATE TABLE printing_hash (
  product_id INTEGER PRIMARY KEY REFERENCES printing(product_id),
  dhash      INTEGER NOT NULL
);

-- Precomputed at build time so the scanner never does this arithmetic on the
-- hot path. `safe` = every printing of this number is within SAFE_SPREAD_FACTOR
-- of every other, i.e. being wrong is cheap and auto-accept is permitted.
CREATE TABLE number_group (
  number     TEXT PRIMARY KEY,
  n          INTEGER NOT NULL,
  lo         REAL, hi REAL,
  safe       INTEGER NOT NULL
);
CREATE TABLE number_group_in_set (
  group_id INTEGER NOT NULL, number TEXT NOT NULL,
  n INTEGER NOT NULL, lo REAL, hi REAL, safe INTEGER NOT NULL,
  PRIMARY KEY (group_id, number)
);

CREATE VIRTUAL TABLE search USING fts5(
  full_name, number, set_name, content=''
);
"""

# What the printed strip at the bottom-right of a card shows, MEASURED at take 6
# from real card images, n=4 per treatment:
#
#   plain   OP13-014 [C] (4)          base, reprint, pirate foil, jolly roger,
#                                     box topper -- 16/16 samples had no star
#   star    OP04-030 *[R] (1)         alternate art, parallel, manga, full art,
#                                     textured foil -- a star above the rarity
#   sp      SP OP05-119 [SEC] (2)     SP and wanted poster -- a literal "SP"
#                                     badge before the number, plus the star
#
# The signal is ASYMMETRIC and the code that consumes it must treat it that way:
# a star means special (no plain sample had one), but ABSENCE of a star does not
# mean plain -- one alternate art, ST01-005, had none. See landmine 60.
FACE_STAR = {"alternate_art", "parallel", "manga", "full_art", "textured_foil"}
FACE_SP = {"sp", "wanted_poster"}


def face_class(treatment):
    if treatment in FACE_SP:
        return "sp"
    return "star" if treatment in FACE_STAR else "plain"


# ---------------------------------------------------------------------------
# Keyword extraction for the deck builder. Comprehensive Rules v1.2.0 §10.
#
# TCGCSV's Description is HTML with <span> colour markup, <br> and \r\n. The
# keywords sit in [brackets]. A keyword at the START of an effect line is one
# the card HAS; the same word mid-sentence is a REFERENCE ("your opponent cannot
# activate a [Blocker]"), which is how the naive LIKE count over-reported
# Blockers by ~20% at take 12. Split on line breaks first, then look at line
# starts only.
KEYWORD_EFFECTS = ["Rush", "Blocker", "Double Attack", "Banish", "Unblockable",
                   "Rush: Character"]                    # §10-1: keyword effects
TIMINGS = ["On Play", "When Attacking", "On K.O.", "On Block", "Activate: Main",
           "Main", "Counter", "Trigger", "End of Your Turn",
           "End of Your Opponent's Turn", "On Your Opponent's Attack"]  # §10-2

def clean_text(html):
    import html as _h
    t = re.sub(r"<br\s*/?>", "\n", html or "", flags=re.I)
    t = re.sub(r"<[^>]+>", "", t)
    t = _h.unescape(t).replace("\r", "")
    return re.sub(r"[ \t]+", " ", t).strip()

def keywords(text):
    """-> set of keywords the card HAS (line-start), plus counter_event flag."""
    have = set()
    for line in clean_text(text).split("\n"):
        line = line.strip()
        # strip leading condition/timing brackets in sequence: [DON!! x2] [When Attacking] ...
        while True:
            m = re.match(r"^\[([^\]]+)\]\s*", line)
            if not m:
                break
            kw = m.group(1).strip()
            base = re.sub(r"\s*x\d+$", " x", kw)          # [DON!! x2] -> "DON!! x"
            if kw in KEYWORD_EFFECTS or kw in TIMINGS:
                have.add(kw)
            elif base == "DON!! x":
                have.add("DON!! x")
            elif kw in ("Once Per Turn", "Your Turn", "Opponent's Turn"):
                have.add(kw)
            line = line[m.end():]
    return have


ED = {"Number": "number", "Rarity": "rarity", "CardType": "card_type",
      "Color": "color", "Cost": "cost", "Power": "power",
      "Counterplus": "counterplus", "Attribute": "attribute", "Life": "life",
      "Subtypes": "subtypes", "Description": "text"}


def build(payload=None, verbose=True):
    payload = payload or tcgcsv.cached()
    os.makedirs(os.path.dirname(CATALOG_DB), exist_ok=True)
    if os.path.exists(CATALOG_DB):
        os.remove(CATALOG_DB)
    db = sqlite3.connect(CATALOG_DB)
    db.executescript(SCHEMA)

    gname = {}
    for g in payload["groups"]:
        gname[g["groupId"]] = g["name"]
        db.execute("INSERT INTO card_set VALUES (?,?,?,?,0)",
                   (g["groupId"], g.get("abbreviation"), g["name"],
                    (g.get("publishedOn") or "")[:10]))

    ncards = nsealed = 0
    for p in payload["products"]:
        ed = {e["name"]: e["value"] for e in p.get("extendedData", [])}
        number = ed.get("Number")
        sealed = number is None
        nsealed += sealed
        ncards += not sealed
        v = variants.parse(p["name"], number)
        db.execute(
            "INSERT INTO printing VALUES "
            "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (p["productId"], p["groupId"], number or "", v["base_name"], p["name"],
             v["treatment"], int(v["same_art"]), face_class(v["treatment"]),
             v["provenance"], v["award"],
             ed.get("Rarity"), ed.get("CardType"), ed.get("Color"), ed.get("Cost"),
             ed.get("Power"), ed.get("Life"), ed.get("Counterplus"), ed.get("Attribute"),
             ed.get("Subtypes"), clean_text(ed.get("Description")),
             "|".join(sorted(keywords(ed.get("Description")))) or None,
             p.get("imageUrl"), p.get("url"), int(sealed)))
        db.execute("INSERT INTO search VALUES (?,?,?)",
                   (p["name"], number or "", gname.get(p["groupId"], "")))

    for r in payload["prices"]:
        db.execute("INSERT OR REPLACE INTO price VALUES (?,?,?,?,?,?)",
                   (r["productId"], r.get("subTypeName") or "Normal",
                    r.get("marketPrice"), r.get("lowPrice"),
                    r.get("midPrice"), r.get("highPrice")))

    # Price history and per-printing deltas, from the committed sidecar
    # (tools/history.py). The catalogue is disposable; yesterday's prices are
    # not, so they never live only here.
    try:
        import history
        hist = history.load()
        for day, prices in hist.items():
            db.executemany("INSERT OR REPLACE INTO price_history VALUES (?,?,?)",
                           [(int(pid), day, m) for pid, m in prices.items()])
        d = history.deltas(hist)
        db.execute("CREATE TABLE IF NOT EXISTS price_delta ("
                   "product_id INTEGER PRIMARY KEY, d1_abs REAL, d1_pct REAL, "
                   "d7_abs REAL, d7_pct REAL, d30_abs REAL, d30_pct REAL, "
                   "max_abs REAL, max_pct REAL)")
        for pid, row in d.items():
            vals = [int(pid)]
            for k in ("d1", "d7", "d30", "max"):
                vals += list(row[k]) if row[k] else [None, None]
            db.execute("INSERT OR REPLACE INTO price_delta VALUES (?,?,?,?,?,?,?,?,?)", vals)
        if verbose:
            n1 = sum(1 for r in d.values() if r["d1"])
            print(f"   price history: {len(hist)} day(s), {n1} printings with a 1-day delta")
    except Exception as e:                                # noqa: BLE001
        print(f"   note: price history not loaded: {e}")

    # Set abbreviations. TCGCSV's are inconsistent -- "OP-PR", "EB-01", "OP14",
    # "PRB-01", "EB-03-04". The card numbers inside a set are not: every card in
    # a set shares its prefix ("EB03"), so the prefix IS the abbreviation. Fall
    # back to TCGCSV's for sets whose cards carry no number (promos).
    derived = {}
    for gid, in db.execute("SELECT group_id FROM card_set").fetchall():
        pref = db.execute("""SELECT SUBSTR(number, 1, INSTR(number, '-') - 1) AS p, COUNT(*) c
                               FROM printing WHERE group_id=? AND number<>'' AND INSTR(number,'-')>0
                              GROUP BY p ORDER BY c DESC LIMIT 1""", (gid,)).fetchone()
        if pref and pref[0] and pref[1] >= 3 and pref[0] != 'P':
            derived.setdefault(pref[0], []).append(gid)
    # Only where UNIQUE: "OP17" is the prefix of both The World's Strongest
    # Warriors and its Release Event Cards, and two filter chips reading OP17
    # is worse than one reading TCGCSV's "OP-17-RE".
    for abbr, gids in derived.items():
        if len(gids) == 1:
            db.execute("UPDATE card_set SET abbr=? WHERE group_id=?", (abbr, gids[0]))

    db.execute("""UPDATE card_set SET card_count =
                  (SELECT COUNT(*) FROM printing p
                    WHERE p.group_id = card_set.group_id AND p.is_sealed = 0)""")

    # --- the economic confidence tables (see AGENDA A5, landmine 12) ----------
    # MEASURED take 2: on the number alone only 9.1% of printings sit in a set
    # where every candidate costs about the same. With the set known, 62.3%.
    # That 7x is why the scanner has a set chip.
    for scope, table, key in (
            ("number", "number_group", "number"),
            ("group",  "number_group_in_set", "group_id, number")):
        sel = ("SELECT number, COUNT(*), MIN(m), MAX(m) FROM v GROUP BY number"
               if scope == "number" else
               "SELECT group_id, number, COUNT(*), MIN(m), MAX(m) FROM v "
               "GROUP BY group_id, number")
        db.execute("""CREATE TEMP VIEW IF NOT EXISTS v AS
            SELECT p.product_id, p.group_id, p.number,
                   (SELECT MAX(market) FROM price x WHERE x.product_id=p.product_id) AS m
              FROM printing p WHERE p.is_sealed=0 AND p.number<>''""")
        for row in db.execute(sel).fetchall():
            if scope == "number":
                num, n, lo, hi = row
                safe = int(bool(lo) and hi / lo <= SAFE_SPREAD_FACTOR)
                db.execute("INSERT OR REPLACE INTO number_group VALUES (?,?,?,?,?)",
                           (num, n, lo, hi, safe))
            else:
                gid, num, n, lo, hi = row
                safe = int(bool(lo) and hi / lo <= SAFE_SPREAD_FACTOR)
                db.execute("INSERT OR REPLACE INTO number_group_in_set "
                           "VALUES (?,?,?,?,?,?)", (gid, num, n, lo, hi, safe))

    # Restore artwork hashes computed by earlier builds. They key off TCGplayer's
    # productId, which is stable, so they survive a catalogue that does not
    # (landmine 46).
    try:
        import hashes
        n = hashes.load_sidecar(db)
        if verbose and n:
            print(f"   restored {n} artwork hashes from the sidecar")
    except Exception as e:                                # noqa: BLE001
        print(f"   note: hash sidecar not restored: {e}")

    # ------------------------------------------------------------------
    # same_art, MEASURED rather than guessed. Landmine 49.
    #
    # Take 2 derived this from the name: parallel, textured, pirate, jolly
    # roger and reprint were assumed to share artwork with the base. Measured
    # over the whole catalogue at take 3, 34.7% of pairs the keyword called
    # DIFFERENT art sit within Hamming 6 of each other -- because a plain base
    # card reprinted into a starter deck is `base` in both rows and no keyword
    # exists to catch it. The keyword was answering a different question.
    #
    # So cluster each number's printings by actual image distance, single
    # linkage. Anything sharing a cluster is visually indistinguishable and the
    # scanner must never be asked to choose between them.
    THRESH = 8
    groups = {}
    for pid, num, h in db.execute(
            "SELECT p.product_id, p.number, h.dhash FROM printing p "
            "JOIN printing_hash h USING(product_id) "
            "WHERE p.is_sealed=0 AND p.number<>''"):
        groups.setdefault(num, []).append((pid, hashes.from_sqlite(h)))
    indistinct = 0
    for num, items in groups.items():
        if len(items) < 2:
            continue
        parent = {pid: pid for pid, _ in items}
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]; x = parent[x]
            return x
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                if hashes.hamming(items[i][1], items[j][1]) <= THRESH:
                    parent[find(items[i][0])] = find(items[j][0])
        sizes = {}
        for pid, _ in items:
            sizes[find(pid)] = sizes.get(find(pid), 0) + 1
        for pid, _ in items:
            if sizes[find(pid)] > 1:
                db.execute("UPDATE printing SET same_art=1 WHERE product_id=?", (pid,))
                indistinct += 1
    if verbose:
        print(f"   {indistinct} printings are visually indistinguishable from a "
              f"sibling (measured, threshold {THRESH})")

    db.commit()
    db.execute("VACUUM")
    db.close()

    man = {
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "fetched_at": payload["fetched_at"],
        "source_updated_at": payload["source_updated_at"],
        "category_id": payload["category_id"],
        "sets": len(payload["groups"]),
        "cards": ncards,
        "sealed": nsealed,
        "prices": len(payload["prices"]),
        "empty_groups": payload.get("empty_groups", []),
        "bytes": os.path.getsize(CATALOG_DB),
    }
    json.dump(man, open(MANIFEST, "w"), indent=1)
    if verbose:
        print(f"   {ncards} cards + {nsealed} sealed across {man['sets']} sets")
        print(f"   catalog.sqlite {man['bytes']/1e6:.1f} MB")
    return man


if __name__ == "__main__":
    build()
