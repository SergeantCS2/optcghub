# The owner's icon, ready for take 113

The owner's D7 pick is live on Play: its icon, feature graphic and eight screenshots are uploaded and
approved. The pick is v4 with the bottom waves, Bandai's printed card-back emblem on the purple-bordered
card, the green accent, and the ink ドン!!. The app on phones still shows the take-16 compass
placeholder. His words: **"Out with the old, in with the new."**

The UI/UX session owns takes 112 and 113. So this branch opens no take, writes no ledger and opens no
PR. It carries the change, verified as far as this VM reaches, plus the ledger text below. The session
that owns take 113 vets it and folds it in.

## Taking it

This file rides the branch that carries the change; the owner hands its name to the session. Take 111
(`cc1f9ed`) is merged into it, and one commit on top carries everything below. Either:
- **Cherry-pick that commit** (its subject starts `d7: the owner's icon`) onto the take-113 branch.
- **Merge the branch.** That also brings `design/play-listing` and `design/business-card`, the design
  tooling behind the live listing and the printed card. Nothing in `design/` ships.

If takes 112 or 113 touch the same lines, the conflicts are small:
- the icon step in `ci/apk.sh`
- two `smallIcon` lines in `src/app.html`
- one assertion in `tools/smoke.mjs`
- one call in `tools/gate.py`

## What it changes

| File | Change |
|---|---|
| `assets/icon.svg` | The pick's 512 full-bleed master replaces the compass placeholder. The compass survives byte for byte as `assets/icon-placeholder.old.svg`; the jolly roger stays as the owner asked at take 33. Nothing is deleted. |
| `assets/icon-bg.svg`, `-fg`, `-mono`, `-stat` | New: the adaptive background and foreground (108 dp), the monochrome layer for themed icons, and the reminders' status-bar glyph. The header comments say plainly that the card carries Bandai's emblem, shipped at the owner's word. |
| `ci/icon.py` | New: the icon step, lifted out of `ci/apk.sh`'s heredoc so it can be run and tested. The full list of what it writes and checks follows this table. |
| `ci/apk.sh` | The icon step is one line: `python3 ci/icon.py android/app/src/main/res play-assets`. |
| `src/app.html` | Both reminders ask for `smallIcon: 'ic_stat_don'`. `iconColor` stays the app's gold `#C9A24A`, which is the UI session's call. |
| `tools/gate.py` | `check_selftests` runs `ci/icon.py --selftest`, and the docs check requires the file. |
| `ci/deps.sh` | Installs `cairosvg` for the gate's run. `apk.sh` already installed its own. |
| `tools/smoke.mjs` | The splash-bg assertion now reads `ci/icon.py`, and requires `apk.sh` to call it. |
| `assets/user/README.md` | `splash-bg.jpg` is drawn by `ci/icon.py`. |

**What `ci/icon.py` writes into the res tree:**
- The legacy launcher icons, `ic_launcher.png` (rounded square) and `ic_launcher_round.png` (circle),
  at 48 dp, for Android 7.
- The adaptive layers, `ic_launcher_{background,foreground,monochrome}.png`, at 108 dp and five
  densities.
- The launcher XMLs: `mipmap-anydpi-v26/ic_launcher{,_round}.xml`, with `<background>`, `<foreground>`
  and `<monochrome>`.
- The reminders' glyph, `drawable-*/ic_stat_don.png`, at 24 dp.
- `raw/keep.xml`, which keeps that glyph through `shrinkResources`.
- The splash, with the masked icon at 30%.
- `play-assets/icon-512.png`, the full-bleed master.

It then checks every file. **Retired:** the hand-drawn 1024×500 feature graphic.

**Why the reminders change:** `@capacitor/local-notifications` 8.3.1 resolves `smallIcon` among
drawables only (`LocalNotification.resolveSmallIcon`). `ic_launcher` is a mipmap, so every price alert
and release reminder fell back to `android.R.drawable.ic_dialog_info`. This is read from the plugin's source
(`LocalNotificationManager.getDefaultSmallIcon`), not yet seen on the Fold.

## The reversal, and its risk

**What the record says:**
- **Landmine 30:** "Publisher trademarks stay out of the name, icon and listing."
- **Landmine 31:** Play IP complaints suspend first; repeated strikes terminate the developer account.
- **A16:** "the Toei/Bandai/Shueisha marks — not in the icon, not in the splash, not in the store
  listing".
- **NSP's "may not do":** a publisher mark in the app's name, icon, splash or listing.
- **Take 63:** a redraw of the printed emblem was not for shipping.

**What the owner decided:**
- He picked the printed back's emblem over our own rose.
- He uploaded it to Play himself, where it is live and approved.
- He asked for it in the app.

This is a reversal at his word, and the record should say so in those terms.

**Its scope is the emblem on the icon's card, and nothing else:**
- The name stays OP TCG Hub.
- No character, no ONE PIECE wordmark, no Bandai logotype.
- Landmines 26 and 28 (card art) are unchanged.
- The splash shows the same icon, so it carries the emblem too.

**The risk, stated once:** Play's approval is not the rights holder's consent. A complaint suspends
first (landmine 31).

**The swap is ready.** Our own rose is the same design with the same geometry. The mark reaches 31.3 dp
and the monochrome 32.2 dp of the 33 dp safe zone.

```bash
for s in "" -bg -fg -mono -stat; do cp design/d7-icons/v4/svg/own-purple$s.svg assets/icon$s.svg; done
python3 ci/icon.py --selftest     # the same checks hold
```

Then upload the new `play-assets/icon-512.png` to Play. Nothing else changes.

## Verified here

**`python3 ci/icon.py --selftest`** passes all 23 checks. It runs against a template-shaped fixture and
against Capacitor 8.5.2's own `android-template.tar.gz`. `ci/deps.sh` puts that template under
`node_modules/@capacitor/cli`, so the PR check runs it too. What the checks cover:
- **The control:** the template's own icons are refused before the step runs.
- **After the step:** every icon passes, all 11 splashes are redrawn, and a second run writes identical
  bytes.
- **The owner's `splash-bg.jpg`,** when present, goes under the icon.
- **`src/app.html`** asks for the drawable the step writes, and `'ic_launcher'` is refused.
- **Twelve negative controls,** each refused:
  - the compass as the foreground
  - the master as the monochrome layer
  - a two-colour monochrome layer
  - a coloured status glyph, and a filled-square status glyph
  - the template's XML
  - no `keep.xml`
  - a background with a hole
  - a wrong size
  - a missing density
  - an unmasked legacy icon
  - a Play icon with its corners pre-rounded

**Each guard was sabotaged in turn,** and the selftest went red every time:
- the safe circle widened to 99 dp
- the one-colour rule loosened
- the white-glyph rule removed
- the keep-rule check removed

The gate, with the safe circle sabotaged, refused at `selftest`.

**The previous build, refused.** `origin/main`'s own icon heredoc, run on the real template, is refused
with 26 problems:
- no background or monochrome layer
- no status glyph
- no keep rule
- an adaptive foreground rendered at 72 px at mdpi, not 108: two thirds of its density at every size,
  since the step was written (landmine 78)

**Looked at.** Everything the step writes was composed as a launcher shows it and read:
- four launcher masks
- a tinted themed icon
- the legacy and round icons
- a dark and a light status bar
- a portrait and a landscape splash
- the Play icon

The sheet went to the owner and is not committed.

**The pipeline from a fresh ingest.** TCGCSV answered from this VM on the day, 87 groups and 7,661
products.
- smoke: **956 passed, 0 failed**
- render: **176 passed, 0 failed (mode: chrome)**, using the VM's Chromium
- `python3 tools/gate.py` at take 111: **GATE PASSED**
- `tools/scrub.py --check --docs`: clean

The runner-owned `catalog/*.json` files were restored before commit.

## Not verified here, for the runner and the Fold

**The Android build itself.** The VM has no Android SDK, so three things are proved first by
`build.yml` on the merge:
- aapt2 linking the new XMLs (`<monochrome>` needs compileSdk 33 or later; the template's is 36)
- `shrinkResources` honouring `raw/keep.xml`
- the release APK's contents

**On the Release APK: decode, don't name (landmine 78).**
- `aapt2 dump resources` must list `drawable/ic_stat_don` and `mipmap/ic_launcher_monochrome`.
- Pull the files they point to and read the pixels. The glyph must be white on transparent, and the
  monochrome layer one colour.

**On the Fold:**
- the launcher, on both screens
- themed icons switched on
- the splash
- a release reminder's status-bar glyph, which should be ドン!!, not the system's ⓘ

A launcher can cache the old icon until the update installs over it, or until a restart.

**No look step.** Nothing in `www/` changes visibly; the app's pages carry no favicon. The Fold is the
look for this one. A favicon and manifest icon from `assets/icon.svg` are the UI session's call.

## Draft ledger text for take 113

These are drafts for the owning session to adjust, write one command each, and grep-check (landmine 104).

**HANDOFF**, in the take's entry:
> **The owner's icon (D7).** The pick is live on Play (icon, banner, screenshots, uploaded and approved
> by the owner), and he asked for it in the app: "Out with the old, in with the new."
>
> - **What ships:** `assets/icon*.svg`, five layers. `ci/icon.py` renders them into:
>   - the adaptive icon (background, foreground, a monochrome layer for themed icons)
>   - the legacy and round icons, and the splash
>   - the reminders' status-bar glyph `ic_stat_don`, kept through `shrinkResources`
>   - the Play icon
>
>   Its controls run in the gate.
> - **Measured:** the previous step's adaptive foreground was two-thirds of its density at every size
>   since the step was written. The reminders asked the plugin for a mipmap it cannot see and fell back to the
>   system's info icon.
> - **Ruled out:**
>   - the compass placeholder and the jolly roger as the icon (both kept in `assets/`)
>   - our own rose, while the owner's pick stands (it is the ready swap)
> - **Reversed at the owner's word:** landmines 30 and 31 and A16 on the icon's emblem. See
>   `design/d7-icons/SHIP.md`.

**ci/RELEASE.md**, "New at take 113":
> The app wears the icon the Play listing shows. It is an adaptive icon with a themed variant, on the
> launcher, the splash and reminder notifications, which now show ドン!! in the status bar instead of
> the system's info icon.

**DECISIONS-OPEN D7**, prepended:
> *Take 113: answered. The owner's pick ships: v4, bottom waves, the printed back's emblem on the
> purple-bordered card, ink ドン!!. It is `assets/icon*.svg`, and the rose version is the ready swap
> (`design/d7-icons/SHIP.md`).*

**AGENDA A16:**
- **Heading:** append `· ICON SHIPPED take 113 (the owner's pick)`.
- **The marks line:** after "the Toei/Bandai/Shueisha marks — not in the icon…", add *"(take 113: the
  one exception is the icon card's printed card-back emblem, the owner's pick, at his word;
  `design/d7-icons/SHIP.md`)"*.
- **Its Ruled out line:** as in HANDOFF.

**LANDMINES** (annotated, never renumbered):
- **30 and 31:** *"(Take 113: the icon carries Bandai's printed card-back emblem at the owner's word
  (D7). The name and the listing text are unchanged. 31's risk is accepted, and our own rose is the
  ready swap: `design/d7-icons/SHIP.md`.)"*
- **78:** *"(Take 113: `ci/icon.py` renders five layers: adaptive, monochrome, legacy, the reminders'
  drawable. Replacing the icon is replacing five files, and its checks refuse a layer Android would
  cut or tint wrong.)"*
- **New, 165**, if the session agrees it bit:
  > **The reminders asked for an icon the plugin could not see.** `smallIcon: 'ic_launcher'` names a
  > mipmap, and `@capacitor/local-notifications` resolves drawables only, so every price alert and
  > release reminder wore the system's info icon. A name spelled only in the web layer is invisible both to the
  > plugin's lookup type and to the resource shrinker. Ship it as a drawable, keep it
  > (`tools:keep`), and test the name the app asks for against the name the build writes
  > (`ci/icon.py --selftest`).

**NEW-SESSION-PROMPT, "may not do":** after "put a character or a publisher mark in the app's name,
icon, splash or store listing (landmines 30, 31; A16)", add *"(the one exception: the icon card's
printed emblem, the owner's pick at take 113)"*.

**V1-STATE, the Packaging row:** "icon + splash from SVG, play-assets" becomes *"the adaptive icon
(background, foreground, monochrome), legacy and round icons, the reminders' glyph, splash and Play icon
from five SVGs (`ci/icon.py`, checked; its controls in the gate)"*.

**RUNBOOK-play and PLAY-LISTING (Graphics):**
- The app icon is `play-assets/icon-512.png` from the build: the full-bleed master, which Play masks.
- The feature graphic and screenshots come from `design/play-listing`, uploaded by hand.
- `feature-1024x500.png` is no longer built.

**AGENDA A21, row 5:** the console shows the owner's pick (icon, feature graphic, eight screenshots),
uploaded by the owner.
