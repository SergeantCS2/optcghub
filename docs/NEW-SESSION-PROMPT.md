# NEW-SESSION-PROMPT — how the next session starts

*Current as of take 41.* Paste the block between the rules into a new session
whose project carries `AGENDA.md`, `LANDMINES.md` and `HANDOFF.md` (the three
project files) and has the newest seed attached.

---

You are picking up **OP TCG Hub** — a One Piece Card Game scanner, collection
tracker and deck builder for Android, built across 41 takes by previous
sessions. The repo lives at `github.com/SergeantCS2/optcghub`; the seed
`optcghub-seed-t41.zip` is the whole tree. CI builds on every seed drop and
has run green end to end; the APK the owner installs comes from the Release.

**Before anything else, in this order:**

1. Unzip the seed to `~/vault-seed`. Read `AGENTS.md` — it is
   short and it is the contract.
2. Read `docs/PROTOCOL.md` §0 (the start-of-session checklist) and do it.
3. Read `docs/V1-STATE.md` — what exists, PROVEN / BUILT / DEFERRED, with the
   measured numbers you must not re-derive.
4. Read `docs/HANDOFF.md`, newest entry first, back to take 28 at least. Every
   take ends with a DEFERRED list; the union of those lists is the work.
5. Read `docs/LANDMINES.md` §0 (the index) and skim §1. When you are about to
   do something, grep the index first. 112 of them; each is a real failure.
6. Read `docs/AGENDA.md` for what is open and whose it is.

**The discipline, which the gate enforces:**

- Open the HANDOFF entry for your take **before** writing code (PROTOCOL §6).
  Bump `BUILD` first. The gate fails a seal without it.
- A ledger write is its own command, never chained behind a build
  (landmine 104). Grep the file for what you wrote before you say you wrote it.
- Every guard gets a negative control the same take (landmine 55).
- Read a plugin's `definitions.d.ts` before calling it (landmine 73).
- Measure before designing; the ledger names what was ruled out and why.
- Seal with `bash tools/seal.sh`, bare, never piped (landmine 103). Present
  the seed, the APK, and the three project files loose.
- The repo is public. Never write the owner's first name, an AI vendor's
  name or the conversational word into a ledger: the gate's scrubber refuses
  the seal (A27). "The owner" and "session" are the words.
- End every reply with the agenda: closed, in flight, the owner's, yours.

**What is in flight when you arrive:**

- **A21 — the Play clock.** The app is in the console (`com.optcghub.app`,
  personal account); version code 35 is in internal testing; the
  advertising-ID and Data Safety forms are done; the listing copy is pasted;
  the closed track is at 4 of 5. Left: roll out, *Send for review*, the
  opt-in link to 16–18 testers, then 12 opted in for 14 days. RUNBOOK-play
  is the procedure and its first block is the state. **UNKNOWN and worth
  asking first:** which `.aab` was uploaded first — if the DEVKEY one, the
  upload key must be reset (RUNBOOK-play §2).
- **The listing screenshots** — the owner has a frames kit and the take-37
  showcase files (`showcase/`); graded copies, alerts and photos are set by
  hand before shooting.
- **Landmine 110's device half** — the first *Export CSV* on the Fold that
  opens a share sheet closes it.
- **app-ads.txt is live** at the root user site (take 40); AdMob verifies it
  once the listing's website is set. Nothing to build.
- **D16 (fonts), D11 (AdMob unit IDs, later), D7 (icon: the console shows
  the jolly roger, the tree ships the compass), D15 (colour).** Do not
  build ahead of them.

**What the owner has said he wants, in order:** the core (done) → scanner (proven)
→ collection with filtering (done) → deck builder (done) → the backlog in
ROADMAP Phase 8 order → other games (A19, after Play) → a simulator (A23).

**What you may change:** anything in the tree, with the ledger updated the
same take. `build.yml` and `bootstrap.yml` are hand-pasted by the owner and can
only be changed by giving him a new file and saying so in the runbook.

**What you may not do:** ship character art or publisher marks (landmines 26,
30, A16); gate scanning (A17); multiply condition into a price (PROTOCOL §10);
send the collection anywhere (PROTOCOL §9); seal with a red gate.

Say "take 42" and begin with PROTOCOL §0.

---
