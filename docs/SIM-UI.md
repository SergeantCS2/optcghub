# SIM-UI — the contract the Sim's UI pass builds against

*Current as of take 125.*

For the Sim's board (Prep & Play → Sim). Takes 122 and 123 made the game
underneath right, provable and private; take 124 drew it as a table -- the
playmat, the pictures, the zoom -- on the owner's word that the session make
the UI pass. This page is what a board may rely on, what it must not do, and
what will tell it when it has. The engine is `src/sim.js`; the board is the
painters in `src/app.html` -- every function between `const SIM_PAINTERS` and
`const SIM_PAINTERS_END` -- and the controller after them (`paintSim`,
`simTap`, `simBotRun`, `simFit`, the motion).

---

## 1. The one rule

**A board draws from `SIM.view(seat)` and moves only through
`SIM.act(seat, move)`.** It never reads `SIM.g` or a player's arrays, never
writes the game, and **never paints what `act()` returns**: that return is
the mover's, and a battle's `res` names the defender's Life card (take 124's
audit found take 123's board painting it to the human against the app; the
view's `last` is the result as each seat may see it). Three checks hold this:
smoke fails if any painter reads the engine's state or a stored result (take
123; since take 124 every function between the painters' two markers, no list
to forget one on), fails if anything outside the engine calls one of its
writing functions (take 122), and the tap handler takes every move from the
view it painted (take 124). A board built this way cannot show a card its seat
may not see, because it is never handed one.

## 2. The API

| Call | What it does |
|---|---|
| `SIM.new(deckA, deckB, first, { seed, bot })` | Deals a game: two legal decks, who goes first (0 or 1), an optional seed (the shuffle is the game's own) and `bot: 1` to play against the app |
| `SIM.who()` | The seat whose decision the game waits on, or `null` when it is over |
| `SIM.view(seat)` | Everything that seat may see, and its legal moves (§3) — a read: calling it changes nothing |
| `SIM.act(seat, move)` | The only way a game moves. Returns `{ ok: true }` or `{ ok: false, why }` — `why` cites its rule section (`§x-y`), which the Rules sheet opens. A refused move changes nothing. What it returns is the mover's: a board shows results from `view.last`, never from here |
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
  `rules` (`1.2.1`), `take`, `log` (newest first; public; an effect's step in
  words and its target by name when public, since take 124), `last` (the last
  battle's result as this seat may see it, or `null`: `n` numbers it, `turn`,
  `att`, `def`, `a`, `d`, `win`, `gone`, `ko`, and `life` -- each Life card
  that left: its `name`, `id` and `trigger` for its owner only, or for both
  when [Banish] trashed it face up; to the other seat `{ id: null, name: null }`),
  `start` (this turn's start as the engine made it, or `null`: `turn`, `i`
  whose, `drew`, `don` added, `first` -- counts, public to both; take 124:
  Refresh, Draw and DON!! are the engine's, never a move, and the table says
  what they did).
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
  (the targets — **the deciding seat only**, else `null`; since take 124 a
  hand card's or a searched deck card's carries its `face`, the others are
  found on the table by their ref), `queued`. When
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
| `fxskip` | — | decline -- only a line that says "you may", begins with a cost (a by-hand line's read from its words, "X: Y"), a [Trigger], or an [Activate: Main] before it begins; an automatic effect resolves in full, its "up to" letting none be chosen, and a by-hand one is opened and done by its words (§8-1-3-1; take 124, the owner: nothing skipped that must happen). Offered alone when a cost begun can no longer be paid (§8-3-1-3) |
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
- The log speaks to the human in the second person against the app ("You
  end the turn"; the engine writes "You ends" -- `simSay` turns it, with each
  seat by its short name; take 124).

## 7. What will tell the pass it broke something

- `node tools/smoke.mjs` — the painters read only the view; the view holds
  only what its seat may see; only `act()` moves a game; the board's markup
  checks (pips, battle lines, the Rules button, the three-word labels).
- `node tools/render.mjs` — the board draws in real Chrome.
- `node tools/look.mjs N` — a step list per take in `tools/look/steps.mjs`;
  take 122's and 123's click through the board at both Fold sizes, take
  124's through a whole game against the app at four (the Fold's two, a
  phone, a tablet: a list's `viewports`).
- `node tools/selfplay.mjs` and `node tools/cardproof.mjs` — the engine and
  the cards; a UI pass leaves them as they are, and if either moves, the pass
  touched the engine. Since take 124 self-play carries **the rulebook**
  (`tools/lib/rulebook.mjs`): the auditor's own model of the game, written
  from the rules, which at every decision lists the moves the rules allow
  against `legal()` and after every move builds the game the rules say
  follows and names the first place the engine's differs. Its decks are every
  pairing of the ready-made decks in turn with random legal decks, and the
  card's words check reads every scripted step against its card's text.
- **The owner's rule for testing the Sim** (take 124): "Test all starter decks
  and as many random/arbitrary decks (that are still legal), after every turn
  ends audit all moves against the rules and all card they played and ensure
  the actions they did with the card is legal per the cards rules and game
  rules." A take that touches the Sim runs a sweep of thousands of games of
  both before it ships (`--games 2000`, both policies, and `--two-apps`), and
  fixes what the rulebook names, each fix with a check.
- `python3 tools/gate.py` — all of the above, and the scrubber.

## 8. The table (take 124)

- **The layout.** Once a game is dealt it fills the screen: the mode tabs, the
  Sim's header and the nav step aside (the owner), and the table's top bar
  carries **Leave** (forfeit and back to the app, asking first), whose turn it
  is, the Rules, the log and the menu. Two halves, the other seat's mirrored
  across the band: the five Character places in front; Life (sideways),
  Stage, the Leader in the middle, Trash, Deck behind; the cost area of DON!!.
  Under the table, the hand and the dock for the selected card's moves; from
  640 px the table takes the whole height and the hand and the dock share a
  column beside it, from 1000 px a side panel holds the zoom and the log.
- **Sizes** are fractions of `--cw`, one card's width, which `simFit()` solves
  from the space (two trial sizes give the table's height as a line in it);
  the hand then takes all the space left for it -- every card at once at the
  largest size that fits, held like a hand where whole cards side by side
  would be small, each card keeping a strip of its own (44 px, two fifths of
  the card) -- and past that scrolls.
- **Pictures:** each card's hot-linked picture over its own colours; a picture
  shared by cards of different names is the host's placeholder and is not
  drawn (`SIM.placeholderPic`). **Card backs** are the app icon's card back
  (`g-cardart` in the sprite) at the owner's word -- landmine 30's exception
  for the icon, extended; the own-rose fallback swaps it -- in the game's
  colours (the owner): a deck's blue, a Leader's red (each Leader turns over
  from it the first time it shows), a DON!! card's white in black.
- **Moves:** a tap selects a card and the dock lists exactly the view's legal
  moves that name it; what the table asks now -- a target, a Blocker, a
  counter, an effect's choice, one of five to trash -- is lit on the card it
  names, carrying that move's own word. The app's moves come one a beat where
  the browser can draw them (`simPaced()`), at once under reduced motion.
- **The next action, always** (the owner, take 124: "Ensure if there's an
  outstanding action, the player knows about it"): the band says what the
  turn's start did (`view.start`) until the seat's first move of it, and the
  turn's banner says it too, the drawn card and the new DON!! drawn arriving;
  the dock says what the seat can do next from its legal moves -- a card to
  play, who can attack, an ability -- or that only End turn is left (two lines
  at most on a phone's strip; in the hand's column from 640 px it takes that
  column's room), and
  an effect waiting on it; it is outlined while the game waits on this seat,
  and the top bar says "your move" in the other's turn; it never counts the
  cards to play -- one named, or "a card" (the owner: "you won't always play 5
  cards"). End turn stands alone against the app (the owner) and says "then
  pass the phone" between two people; it asks while an attack, a card to play
  or an ability is left, and names them (DON!! left
  active are not asked about: they pay for a [Counter] Event in the other
  turn). A decline is named for what it does: Add to hand ([Trigger]), Cancel
  ([Activate: Main]), Don't pay (a cost), Decline ("you may"), Go on (a cost
  that can no longer be paid).
- **Held by:** smoke's take-124 section (every legal move has its control on
  the table in the states a board meets, with a planted move as its control;
  the painted board against the app names no card the app alone may see; the
  felt is Prep & Play's dark palette value for value), render's table checks
  (44 px, fits the phone, the nav aside), and the look at four sizes.

## 9. Not in the engine yet (A23's tail)

Modal "Choose one", ordering cards (top or bottom in any order), protection
("cannot be K.O.'d"), a Life card face up, effect sentences with no tag at
their start (ST30-001's first), the opponent's hidden choices, "at the start
of the game / your turn". Each will arrive as a mechanism with its proofs; the
view will carry what it needs, and a board that draws from the view will show
it.
