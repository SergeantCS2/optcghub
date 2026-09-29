# SIM-UI — the contract the Sim's UI pass builds against

*Current as of take 123.*

For the owner's UI/UX pass of the Sim (Prep & Play → Sim): the playmat, the
pictures, the zoom. Takes 122 and 123 made the game underneath right, provable
and private; this page is what a new board may rely on, what it must not do,
and what will tell it when it has. The engine is `src/sim.js`; the board today
is the painters in `src/app.html` (`paintSim` and the `sim…Html` functions),
drawn from the same view a new board would use.

---

## 1. The one rule

**A board draws from `SIM.view(seat)` and moves only through
`SIM.act(seat, move)`.** It never reads `SIM.g` or a player's arrays, and never
writes the game. Two checks hold this: smoke fails if any painter reads the
engine's state (take 123), and fails if anything outside the engine calls one
of its writing functions (take 122). A board built this way cannot show a card
its seat may not see, because it is never handed one.

## 2. The API

| Call | What it does |
|---|---|
| `SIM.new(deckA, deckB, first, { seed, bot })` | Deals a game: two legal decks, who goes first (0 or 1), an optional seed (the shuffle is the game's own) and `bot: 1` to play against the app |
| `SIM.who()` | The seat whose decision the game waits on, or `null` when it is over |
| `SIM.view(seat)` | Everything that seat may see, and its legal moves (§3) — a read: calling it changes nothing |
| `SIM.act(seat, move)` | The only way a game moves. Returns `{ ok: true }` or `{ ok: false, why }` — `why` cites its rule section (`§x-y`), which the Rules sheet opens. A refused move changes nothing |
| `SIM.replay(spec, moves)` | Rebuilds a game from `g.spec` and `g.actions` — the Report and a two-phone game are this |
| `BOT.move(seat)` | The app's opponent makes one legal move for that seat |
| `openRules(section)` | Opens the Rules sheet at a section (`simCite(text)` turns every `§x-y` in a sentence into that link) |

## 3. The view

`SIM.view(seat)` returns one plain object (JSON: 21 KB at the median, 45 KB at
most, over 6,424 views of 20 games between the app's bots; the log and the
trashes are most of it late in a game):

- **Top level:** `seat`, `turn`, `phase` (`mulligan` / `main` / `battle` /
  `over`), `active` (whose turn), `first`, `over` (the winning seat, `-1` for a
  draw, else `null`), `who` (whose decision), `bot` (the app's seat or `null`),
  `rules` (`1.2.1`), `take`, `log` (newest first; public).
- **`me` and `them`** — the two sides, the same shape: `seat`, `name`,
  `leader`, `chars` (in order; a Character's index is its `ref`), `stage`
  (or `null`), `hand` (**`me` only**; `them.hand` is `null`), `handCount`,
  `lifeCount`, `deckCount` (never the cards), `trash` (public), `looking` (the
  cards being looked at — `me` only), `lookingCount`, `don: { active, rested,
  given, deck }`, `mulliganed`, `taken` (turns taken), `lost`.
- **A card on the field** (`leader`, each of `chars`, `stage`): `uid`,
  `seat`, `ref` (`'leader'`, the index, or `'stage'` — what a move names),
  `id`, `num`, `name`, `type`, `cost`, `power` (now, with DON!! and effects),
  `printedPower`, `counter`, `rested`, `don` (given), `turn` (played), `kw`
  (printed), `keywords` (now), `granted` (now and not printed), `colours`,
  `art: { thumb, large, ground }` (or `null`), `text`, `lines` (each effect
  line: `t` its timing, `raw` its words, `does` what the app will do, `proof`:
  `proven` / `unproven` / `hand` / `wrong`), `unapplied` (continuous lines the
  app does not compute — the board must say they are the player's to apply).
- **A card in hand** (`me.hand`): the same card fields, plus `h` (the index a
  move names) and `play: { ok, why, full }` (`full`: five Characters, so one
  must be trashed to play it, §3-7-6-1).
- **`battle`** (or `null`): `att`, `def` (seats), `step` (`block` /
  `counter`), `blocked`, `counter` (added so far), `powers: { a, d }`,
  `attacker`, `target` (cards as on the field), `unblockable`.
- **`offer`** — the effect the game waits on (or `null`): `seat` (who
  decides), `hidden`, `cardId`, `name`, `t`, `raw`, `hand` (by hand), `proof`,
  `wrong`, `does`, `step` / `steps`, `cost` (this step is a cost), `choices`
  (the targets — **the deciding seat only**, else `null`), `queued`. When
  `hidden` is true — the other seat's [Trigger] from Life, not yet used —
  only `seat`, `t` and `queued` are filled: its player may still add the card
  to hand without revealing it (§10-1-5).
- **`tray`** — a by-hand effect open (or `null`): `mine`, `cardId`, `raw`, and
  for its player `left`, the moves its words still allow.
- **`legal`** — every move the engine would accept from this seat now
  (**empty unless `who === seat`**). A board offers exactly these.

## 4. Moves

Always one of `view.legal`, sent back as it is. Their shapes:

| `t` | Other fields | When |
|---|---|---|
| `keep`, `mull` | — | the mulligan (§5-2-1-6) |
| `play` | `h`, `trash` when five are in play | Main Phase |
| `give` | `ref` | give an active DON!! (§6-5-5) |
| `activate` | `ref`, `n` | an [Activate: Main] |
| `attack` | `ref`, `target` (`'leader'` or an index) | Main Phase (§7) |
| `block` / `noblock` | `k` | the Block Step |
| `counter` / `cevent` | `h` | the Counter Step |
| `resolve` | — | the Damage Step; the result comes back as `res` |
| `fx` | `target` (or `null` for none / no target), `trash` | apply the offer's step |
| `fxskip` | — | decline (never offered once a cost is begun, §8-3) |
| `fxhand`, `hand`, `handdone` | `hand` carries `op` and its fields | the by-hand tray |
| `end`, `concede` | — | end the turn; concede (§1-2-3) |

## 5. What is private, and to whom

Kept out of a seat's view by the engine, checked by smoke (planted leak as
control) and by self-play after every move:

- the other seat's hand — a count (§3-4);
- both Lives and both decks — counts (nobody looks at a Life card, §3-10, or
  into a deck, §3-2);
- the cards a player is looking at — to that player only;
- a [Trigger] from Life not yet used — its card and text to its player only
  (§10-1-5); declined, the log says a Life card went to hand, not which;
- an effect's choices and the legal moves — to the deciding seat only;
- the log is public and in both views, so no sentence names a card that
  moved unrevealed (landmine 224).

**On one phone (hot seat)** the board shows the view of `simSeat()` — the seat
deciding, the defender reading a result, or the human against the app — and
the curtain covers the hand-over between two people. The owner's rule:
private things only show on that player's turn. **Two phones** (D18) will each
draw their own seat's view from the same seed and moves.

## 6. What the UI pass must keep

- Button labels of three words at most; keywords spelt one way ("no Rush",
  "an active Blocker"); curled apostrophes in the shipped script — the
  scrubber refuses the rest.
- The design tokens and the three mode palettes (A42); a 44 px target for
  every control; both Fold sizes (411×960 cover, 749×832 open).
- A Rules button on every Prep & Play screen; every `§x-y` in the Sim's words
  opening the Rules sheet.
- Each effect's mark — proven, unproven, by hand, proven wrong — and Report.
- "Yours to apply" beside a card with `unapplied` lines, and the power shown
  without them.
- The by-hand tray's own labels; its moves are only `view.legal`.
- Pictures hot-linked, never cached or bundled (landmines 26, 28), falling
  back to the card's colours (`art.ground`) when they fail.
- Back closes a sheet before it leaves a screen.
- One piece of copy is the pass's to fix: the log and some headings use the
  player's name as the subject, so against the app they read "You ends the
  turn" (`SIM.log` in `src/sim.js`, e.g. `endTurn`). The log is public and in
  the view; changing its words changes no rule.

## 7. What will tell the pass it broke something

- `node tools/smoke.mjs` — the painters read only the view; the view holds
  only what its seat may see; only `act()` moves a game; the board's markup
  checks (pips, battle lines, the Rules button, the three-word labels).
- `node tools/render.mjs` — the board draws in real Chrome.
- `node tools/look.mjs N` — a step list per take in `tools/look/steps.mjs`;
  take 122's and 123's click through the board at both Fold sizes.
- `node tools/selfplay.mjs` and `node tools/cardproof.mjs` — the engine and
  the cards, unchanged by a UI pass; if either moves, the pass touched the
  engine.
- `python3 tools/gate.py` — all of the above, and the scrubber.

## 8. Not in the engine yet (A23's tail)

Modal "Choose one", ordering cards (top or bottom in any order), protection
("cannot be K.O.'d"), a Life card face up, effect sentences with no tag at
their start (ST30-001's first), the opponent's hidden choices, "at the start
of the game / your turn". Each will arrive as a mechanism with its proofs; the
view will carry what it needs, and a board that draws from the view will show
it.
