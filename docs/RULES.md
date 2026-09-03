# RULES — the One Piece Card Game, as the deck builder must understand it

*Current as of take 56.*

Source: **Bandai, ONE PIECE CARD GAME Comprehensive Rules, Version 1.2.0,
last updated 16 January 2026** — fetched and read in full at take 12, not
paraphrased from a guide. Section numbers below are the official ones, so a
disagreement can be settled against the document rather than a memory. Where a
secondary source is used for community convention (typical deck shapes), it is
marked as such and is advice, not a rule.

Rule 1-3-1: **when card text contradicts these rules, the card text wins.** The
builder enforces the rules and shows the text; it does not try to be a judge.

---

## 1. What a deck IS (§5-1) — the builder ENFORCES these

| # | rule | §  | builder behaviour |
|---|---|---|---|
| R1 | Exactly **1 Leader** card | 5-1-2 | one slot; the deck is built *from* it |
| R2 | Exactly **50** cards in the main deck | 5-1-2 | live count; a deck is *legal* at 50, *incomplete* below, *illegal* above |
| R3 | Main deck is **Character, Event and Stage** cards only | 5-1-2-1 | Leaders cannot be added to the main deck |
| R4 | Every card must share a colour with the Leader | 5-1-2-2 | off-colour cards are shown greyed with the reason, never silently hidden |
| R5 | Multi-colour cards **are every colour they possess** | 2-3-5 | a Green;Red card is legal under a Red Leader *or* a Green Leader |
| R6 | **No more than 4 cards with the same card number** | 5-1-2-3, 2-14-2 | counted by `number`, **not** by name and **not** by printing — see below |
| R7 | The DON!! deck is exactly 10 identical DON!! cards | 5-1-2 | not part of deck building; the builder mentions it and moves on |
| R8 | Some card text overrides R2/R6 for that card | 5-1-2-4 | rare; the builder shows the card text and offers a per-deck "rules override" note rather than pretending to parse it |

**R6 is the one place in this codebase where keying on the card number is
correct.** Everywhere else (landmines 1, 41) a number is ambiguous across
printings and keying on it misprices a collection by up to 4,292x. But the
*rules* count copies by number: four Namis are four Namis whether they are the
$0.47 deck reprint or the $2,017 manga art. The deck model stores `product_id`
(so a collector can say *which* printing is sleeved in the deck, and value it)
and enforces R6 on `number`. A future session will be tempted to "fix" this into
landmine 1. Do not.

### Colour legality, precisely

A card is legal if `cardColours ∩ leaderColours ≠ ∅` (§5-1-2-2 + §2-3-5). The
catalogue stores colours `;`-delimited (`Green;Red`); the Leader's colours the
same way. Six colours exist: red, green, blue, purple, black, yellow (§2-3-3).

---

## 2. What the builder ADVISES on (not rules — analysis)

These come from the card fields and §2, and are shown as information. A deck
that ignores every one of them is still legal.

| lens | from | why it matters (§) |
|---|---|---|
| **Life** | Leader's Life value | starting Life cards = this many from the top of the deck (§2-9, §5-2-1-7). 4 or 5 on nearly every Leader |
| **Cost curve** | `cost` 0–10 | you get 2 DON!! per turn (1 on turn one going first) (§6-4); a deck of 7-drops does nothing until turn four |
| **Counter package** | `counterplus` 1000 / 2000 | Characters with a Counter value can be trashed from hand during the opponent's Counter Step to add that much power (§7-1-3-2-1). The community's rule of thumb is a *lot* of these |
| **[Counter] Events** | keyword | Events with [Counter] are played *during the opponent's attack* by paying cost (§7-1-3-2-2, §10-2-4) |
| **[Trigger]** | keyword | when this card is taken as damage from Life, you may activate its Trigger instead of adding it to hand (§2-11, §10-1-5) — free value the opponent hands you |
| **[Blocker]** | keyword, innate | rest this Character to take the hit for the attacked card (§10-1-4) |
| **[Rush]** | keyword, innate | can attack the turn it is played (§10-1-1); **conditional** Rush ("gains [Rush]" under `[DON!! x2]` or a cost) is a different thing and the catalogue tells them apart |
| **type breakdown** | `card_type` | Characters / Events / Stages. Only one Stage can be on the field (§3-8-5) and only five Characters (§3-7-6) |
| **types & attributes** | `subtypes`, `attribute` | Leaders and cards reference `{Straw Hat Crew}` and `<Slash>` in text (§2-4-3, §2-5-6) — the synergy filter |

**Community shape (advice, from opdeckguide / shonentcg / cardboard2, all
secondary):** ~32–38 Characters, 6–10 Events mostly Counters, 0–4 Stages; a
smooth curve weighted to 2–5 cost; a deliberate counter package; finishers last.

---

## 3. How a game GOES (§5–§7) — for the collector, and for the builder's copy

**Setup (§5-2):** present a legal deck; shuffle; Leader face-up; rock-paper-
scissors, winner chooses first or second; draw 5; one mulligan each (return all
five, shuffle, redraw five), first player decides first; then place Life cards
face-down from the top of the deck equal to the Leader's Life.

**A turn (§6-1):** Refresh → Draw → DON!! → Main → End.

- **Refresh (§6-2):** effects "until the start of your next turn" end; DON!!
  given to Leader/Characters return to the cost area rested; everything rested
  becomes active.
- **Draw (§6-3):** draw 1. **The first player does not draw on turn one.**
- **DON!! (§6-4):** put 2 DON!! from the DON!! deck into the cost area. **The
  first player puts 1 on turn one.** Ten DON!! total, so you are at full
  resources from turn five.
- **Main (§6-5):** in any order, any number of times — play a card by resting
  that many active DON!! (§2-7); activate [Activate: Main] / [Main] effects;
  **give** DON!! to a Leader or Character for +1000 power each *during your
  turn* (§6-5-5); battle. **Nobody can battle on their first turn** (§6-5-6-1).
- **End (§6-6):** [End of Your Turn] effects, then durations expire.

**Battle (§7):** rest an active Leader or Character to attack the opponent's
Leader *or a rested Character* (§7-1). Then, in order:

1. **Attack step** — [When Attacking] effects.
2. **Block step** — the defender may activate **one** [Blocker] to take the hit.
3. **Counter step** — the defender may trash Characters with a Counter value
   from hand (+1000/+2000 to the defending card) and/or play [Counter] Events.
4. **Damage step** — attacker's power ≥ defender's power wins (§7-1-4-1; ties go
   to the attacker). A Leader that loses takes **1 damage**: top Life card to
   hand, or its [Trigger] instead. A Character that loses is **K.O.'d** (trashed).

**Defeat (§1-2-1-1):** your Leader takes damage with **0 Life cards**, or your
**deck reaches 0 cards**.

**The keyword effects (§10-1):** Rush (attack the turn played); Double Attack
(2 damage to Life instead of 1); Banish (the Life card is trashed instead of
going to hand — no Trigger); Blocker; Trigger; Rush: Character (can attack
Characters only, the turn played); Unblockable.

**The timing keywords (§10-2):** [On Play], [When Attacking], [On K.O.], [On
Block], [Activate: Main], [Main], [Counter], [End of Your Turn], [End of Your
Opponent's Turn], [On Your Opponent's Attack]; conditions [DON!! xX], [Your
Turn], [Opponent's Turn]; limiter [Once Per Turn].

---

## 4. What the catalogue can and cannot supply

MEASURED at take 12 against 6,862 printings:

| field | coverage | note |
|---|---|---|
| `card_type` | 100% | Leader / Character / Event / Stage |
| `color` | 99.8% | `;`-delimited; 6 colours; dual-colour present |
| `cost` | 94.3% | Leaders have no cost (§2-7-5) — that is the gap, not missing data |
| `power` | 84.2% | Events and Stages have no power (§2-6-2) |
| `life` | Leaders only | ingested take 4 for exactly this |
| `counterplus` | 60.9% | 1000 or 2000; a handful of `1`, `4000`, `9000` look like upstream typos and are shown as-is with the source named |
| `subtypes`, `attribute` | 99.5% / 85.6% | synergy filters |
| `keywords` | derived take 12 | line-start rule; **a keyword mid-sentence is a reference, not a possession** — naive matching over-counted Blocker by 94 cards and Rush by 72 |
| `text` | 91.7% | cleaned of HTML at build time |

**Not in the catalogue, and the builder must say so rather than guess:**
current tournament ban/restriction lists (Bandai publishes them separately and
they change); deck-construction override effects (§5-1-2-4) parsed from text;
which printing of a card is "the" one — that is the collector's to choose.

---

## 5. What this document is not

It is not a strategy guide, and the builder is not a coach. It enforces §5-1,
shows §2's numbers, names §10's keywords, and leaves the judgement — which
Leader, which forty-nine cards around it — to the person holding the cards.
