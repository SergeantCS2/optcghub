# RUNBOOK — Google Play, from the repo to a running 14-day clock

*Current as of take 132.* The whole procedure, in the order it must happen,
with who does each step. Everything on the repo side is already built; what
follows is the owner's, and none of it is hard. The gate at the end is calendar
time: **12 testers opted in for 14 continuous days** (landmine 35; re-checked
against Google's current wording at take 33: unchanged since 11 Dec 2024, when
it dropped from 20).

**Where things stand at take 52 (PROVEN by the owner's console and report):**
personal account; the app exists as `com.optcghub.app`; the internal test ran;
the advertising-ID declaration and Data Safety are done; the listing is in;
**the closed-testing release is APPROVED by Play review.** Now: the opt-in
link to 16–18 testers (§7), and the 14-day clock starts when the twelfth is
opted in. `ci/RELEASE.md` is what the testers read. On the repo: public, CI
green end to end, Pages live, privacy policy returning 200, app-ads.txt
served from the root. **Still open:** which bundle was the first upload (§2
has the reset if it was the DEVKEY one); the listing icon; a seed newer than
the one on the track at the repo root.

**Read first — the one thing that costs a collection (landmine 34):** the Play
build and the sideloaded take carry the same id, `com.optcghub.app`, but
different signers, so the Play build **cannot install over** the APK on the
Fold. Before installing from Play: **More → Export CSV** — from take 34 this
opens the share sheet; send it to Drive or Files — and keep that file. Then
uninstall the sideload build (do **not** tick *keep app data* if offered),
install from Play, **More → Import** the CSV. *Restore from backup* may also
work — since take 34 it lets you pick the file in `Documents/OPTCGHub` — but
a reinstalled app cannot read its old backups by itself on Android 11+, so
the CSV is the copy to trust. After that, install only from Play on that
phone; the sideload APK stays for testers who are not on the track.

---

## 1. The account (once) — The owner

- play.google.com/console → **personal** developer account, $25 once. Your
  legal name is shown on the listing. Write down the **creation date**: a
  personal account made after 13 Nov 2023 is the one the 12/14 rule applies
  to (D2 — yours is, so the rule applies).
- Identity verification happens here; it can take a day. Start it now.

## 2. The upload key (once) — The owner, one command

**Windows** — in the PowerShell that VS Code opens, from the unzipped seed
folder (`…\optcghub-seed-tNN>`, where you already were):

```
powershell -ExecutionPolicy Bypass -File tools\play-key.ps1
```

`./play-key.sh` is the same script for Git Bash, WSL and Termux; PowerShell
cannot run a `.sh`, which is what *not recognized as the name of a cmdlet*
meant. If the script says *keytool not found*: adoptium.net → Temurin 21 →
the `.msi` → tick **Set JAVA_HOME** → close and reopen PowerShell → run it
again. (Android Studio's own JDK is found without any of that.)

It makes `C:\Users\<you>\optcghub-play-key\upload.jks` with a generated
password, reads the key back to be sure, and — if the GitHub CLI is logged in
(`winget install GitHub.cli`, then `gh auth login`, once) — **sets the four
repository secrets itself**. Without gh it prints the four values and where
to paste them; the long one is a single line in `upload.b64` (Notepad,
Ctrl+A, Ctrl+C). Both scripts were run end to end at take 33/34 — the
`.ps1` under PowerShell 7 here, with a damaged-keystore control. Then:

**Actions → build → Run workflow.** The release's bundle is now
`optcghub-take-N.aab` — the `DEVKEY-DO-NOT-UPLOAD` suffix is gone, and the
log line *AAB signer:* names the upload key. (Until the secrets exist the
suffix stays, and Play refuses the file; landmine 33 says why that is the
right failure.)

**Back the folder up** somewhere that is not the PC. It never enters the
tree, a seed, or a session (landmine 23). Losing it is recoverable through Play
App Signing's upload-key reset, but it is a support ticket and days.

**The reset (take 101, corrected take 102).** Two different situations end
at Play's *Request upload key reset*, and they need different first steps:

- **(a) The key folder is lost** (`~/optcghub-play-key/`). The key survives
  only as the four repository secrets, which cannot be read back. Run
  `bash tools/play-key.sh` afresh: it makes a *new* keystore and password
  and **sets the four secrets** to the new key. Then export the new
  certificate and request the reset (below). The next build after the
  reset is confirmed signs with the new key; the `AAB signer:` line must
  still read `CN=OP TCG Hub upload`.
  **Then the pin (take 103).** `ci/signer.sh` carries the upload key's
  certificate fingerprint (`UPLOAD_SHA256`, from the take-102 build's
  printed line) and the build refuses a bundle whose signer has the
  upload DN with any other fingerprint — a regenerated key is exactly
  that. So the first build after a new key fails on purpose, *after*
  printing the new key's `AAB signer SHA256:` line; paste that line's
  value into `UPLOAD_SHA256`, bump the take, and the next build passes.
  Never type a fingerprint from anywhere but a printed line.
- **(b) Play registered a different key than the secrets hold** — the
  symptom is "wrong key" on an upload whose build log says `CN=OP TCG Hub
  upload`. The keystore is fine; only Play's record is wrong. Export the
  certificate from the *existing* keystore and request the reset; the
  secrets do not change. (Take 102 closed this case for this app: Play
  accepted the upload-key-signed take 101, so the registered key is the
  one the secrets hold.)

The export, in full, from the values `tools/play-key.sh` uses:

```
keytool -exportcert -rfc \
  -keystore ~/optcghub-play-key/upload.jks -alias optcghub-upload \
  -storepass "$(cat ~/optcghub-play-key/password.txt)" \
  -file ~/optcghub-play-key/upload_cert.pem
```

Then **Play Console → Test and release → Setup → App signing → Request
upload key reset**, attach `upload_cert.pem`, and wait for Google's email
(a few days; the old key stops working then). Tell them apart from the
console: the *Upload key certificate* on that page shows a SHA-1; the
committed sideload key's is
`8A:17:C1:B9:8C:44:4F:AE:36:12:54:0E:1A:E5:95:92:45:5C:65:68` and must
never be the one shown.

## 3. Create the app — The owner, Play Console

**All apps → Create app.** Name `OP TCG Hub`, English (US), *App*, *Free*.
Accept the declarations. The applicationId is fixed from the first upload
(A8): `com.optcghub.app`.

**Play App Signing** is on by default for a new app: Google holds the app
signing key; the key from step 2 is registered as the **upload key** by the
first bundle you upload. Nothing to configure.

## 4. Internal testing first — five minutes, and it proves the bundle

**Testing → Internal testing → Create new release → upload
`optcghub-take-N.aab`** from the latest Release on GitHub. Name it `take N`.
Save, review, roll out. Add your own Google account under *Testers*, open
the opt-in link on the Fold, install.

Internal testing is instant and does not count toward the clock. It is where
the first *real* Play-signed build meets the Fold; do the landmine-34
export/uninstall/import dance here, once.

## 5. App content — the questions Play asks before a closed test can roll out

**Policy → App content**, every card, in this order:

| card | answer |
|---|---|
| Privacy policy | `https://sergeantcs2.github.io/optcghub/privacy.html` — open it in a browser first; Play checks it |
| Ads | **Yes, contains ads** (A17) |
| App access | All functionality available without special access |
| Content rating | questionnaire → *Utility, productivity, communication, or other*; no violence, no user content, no gambling, no real-money |
| Target audience | **18 and over** (or 13+); **not** designed for children — never a Families category (§9) |
| News app | No |
| COVID-19 | No |
| Data safety | see below — landmine 94 |
| Government app | No |
| Financial features | **My app doesn't provide any financial features** — prices are displayed, nothing is bought, sold, traded or invested. Anything else here, on a personal account, makes the app *organisation only* (take 43). The app's own word *Portfolio* is what invites the wrong box — D17 |
| Health | No |

**Data safety** (landmine 94 — APEX was rejected here): the app itself
collects nothing, but AdMob does. Declare exactly this:

- *Does your app collect or share any of the required user data types?* **Yes**
- *Device or other IDs* → **Collected** and **Shared**, purpose **Advertising or
  marketing**, not optional, not processed ephemerally
- Data is **encrypted in transit**; users **cannot request deletion** (nothing
  is stored on a server to delete — the collection never leaves the phone,
  PROTOCOL §9)
- Everything else: **not collected**. Photos stay on the device; the camera
  feed is processed on-device and never sent.

## 6. The listing — copy is written, pictures are yours

**Grow → Store presence → Main store listing.** Paste from
`docs/PLAY-LISTING.md` (title, short description, the full description that
**opens** with the affiliation disclaimer — the APEX rejection at its take
166 was for burying it).

| asset | where from |
|---|---|
| App icon 512×512 | `play-assets-t33/icon-512.png` in this take's outputs (the take-16 compass placeholder, as asked). *Take 113: `play-assets/icon-512.png` from the build -- the owner's pick, the full-bleed master Play masks. Since take 115 every Release carries it as `icon-512.png` ("Play icon, 512x512")* |
| Feature graphic 1024×500 | `play-assets-t33/feature-1024x500.png`. *Take 113: no longer built; the listing's feature graphic and screenshots come from `design/play-listing`, uploaded by hand* |
| Phone screenshots, at least 2 | the Fold, cover screen: Home, Collection, a card detail, Scan, a deck. The first one leads with the collection, not a character: the listing does not foreground a franchise (landmine 30). The app itself shows card art from take 109 (A42) |
| Category | **App → Tools** (or Entertainment) — never **Game**; it is a collection tracker |
| Contact email | yours |
| Website | `https://sergeantcs2.github.io/optcghub/` -- *take 121: it had become `https://sergeantcs2.dev/`, the owner's own site, where app-ads.txt was 404; the owner set it back the same day (PROVEN live 28 Sept).* Whatever it is, AdMob fetches `/app-ads.txt` from its root, so the file lives there (§9, landmine 209). Take 40 set `https://sergeantcs2.github.io/optcghub/`, where the file already is |

## 7. Closed testing — the clock

**Testing → Closed testing → Create track** (call it `closed`). **Create new
release → add from library** the internal-testing bundle (same take), or
upload the next take. Roll out.

**Testers:** *Create email list* → paste addresses (Gmail accounts), or a
Google Group. Copy the **opt-in link** and send it with `ci/RELEASE.md`'s
five-minute script. Recruit **16–18**: an opt-out restarts *that* tester's
clock, and Google reads engagement when you apply, so people who will
actually open it (landmine 35).

**The clock starts when the release is approved by Play review AND the 12th
tester is opted in** — not when the track is created. It is 14 continuous
days from there. Watch *Testing → Closed testing → Testers* for the count.

Each new take: upload the new `.aab` to the same track. Testers update from
Play; nothing resets.

## 8. Apply for production — day 15 — DONE (approved, 24 Sept 2026, take 102)

**Dashboard → Apply for production access.** Three short sections: how you
recruited testers, what you learned, what changed. Google answers in about a
week. **Approved.** Then the production release, below.

## 8b. The production release — The owner, Play Console — DONE (live 24 Sept 2026, take 101's bundle)

**LIVE:** `play.google.com/store/apps/details?id=com.optcghub.app`
(the owner's report at take 105: "finally approved on Google play and
it's listed"). The steps below are the record of how; from here "Every
take after the first" is the section that applies, and the owner's own
phone runs the Play build — the sideload APK no longer installs over it
(landmine 34), so a take is proven on the Fold through the production
track.

**Production → Create new release → upload the current take's
`optcghub-take-N.aab`** (take 101's is the first; it is already on the
closed track, which is fine — a bundle can go to both) → release notes: the
"New at take N" paragraphs from `ci/RELEASE.md` → *Next → Save → Review
release* → **Start rollout**. Play's release notes take at most 500
characters per language (take 115: take 114's paragraph was 692), so paste
the newest paragraph, or trim it, not the list. A staged rollout (10% → 50% → 100%) costs
nothing and can be halted; a full rollout is also fine for an app this
size. Google reviews a production release too (hours to a day).

After go-live: every take is one upload to the **production** track (§
"Every take after the first"); the closed track can stay for early testers
or be retired. The real AdMob rewarded unit IDs (D11) go into
`tools/config.py` in the take after the owner sends them — production is
real users, which is when §9's rule says they belong. *Take 121: three of
them, in `ADMOB_LIVE_*`, with the consent flow first (§9 items 3 and 4).*

## 9. Ads — AdMob, in parallel, none of it blocks the clock

The AdMob account exists (take 33): publisher `pub-6243777967151950`. *Rewritten
at take 121, when AdMob could not verify the app.* **Approved, 30 Sept: the app is "Ready", ad
serving limits lifted.** *30 Sept: the Fold a test device, the three units
made and live from take 127 with the consent flow; left, the consent message
published before take 127 merges.*

**Two AdMob apps (the owner's screenshot, 28 Sept):** "OP TCG Hub: Collect,
Hunt, SIM", `ca-app-pub-6243777967151950~9519036366`, linked to Google Play
`com.optcghub.app` -- **the one the app uses from take 121**; and "testing",
`~1538944343`, the take-41 app added by name before the app was on Play, never
linked, renamed by the owner. Builds 41 to 120 name "testing" in their APK
(landmine 210); only an AAB from take 121 on names the linked app. Make nothing
under "testing".

1. **app-ads.txt, at the root of the listing's website.** It is the IAB
   standard by which a buyer checks that this publisher ID may sell ads in the
   app; only the app's owner can edit the listing, so AdMob trusts the website
   the listing names, drops the path, and fetches `/app-ads.txt` from that
   domain's root -- nowhere else. The one line:

   `google.com, pub-6243777967151950, DIRECT, f08c47fec0942fa0`

   *Take 121, PROVEN 28 Sept:* the listing's website is
   `https://sergeantcs2.dev/` (its Website link and `appstore:developer_url`),
   and `https://sergeantcs2.dev/app-ads.txt` is 404; the line is served, right,
   at `https://sergeantcs2.github.io/app-ads.txt` (take 40's user site, the repo
   `SergeantCS2.github.io`), which the listing no longer names (landmine 209).
   **Either** put the file at the root of `sergeantcs2.dev` (the owner's server;
   keeps the listing on the owner's site, and one file covers every app under
   this account), **or** set the listing's Website back to
   `https://sergeantcs2.github.io/optcghub/` (*Store presence → Store settings*).
   One of the two. *The owner took the second, the same day: PROVEN 28 Sept,
   20:43Z, the listing reads `https://sergeantcs2.github.io/optcghub/` and the
   check below prints the line.* Check, from anywhere:

   `curl -s "$(curl -s 'https://play.google.com/store/apps/details?id=com.optcghub.app&hl=en' | grep -o 'appstore:developer_url" content="[^"]*' | cut -d'"' -f3 | sed -E 's#^(https?://[^/]+).*#\1#')/app-ads.txt"`

   prints the line when the listing's website serves it. Then AdMob → the app →
   *app-ads.txt* → **Check for updates**; verified within about a day, and the
   AdMob tab is the proof, not a 200 (take 40 called it DONE on the 200). Every
   time the listing's website changes, the file moves with it.
   *Take 121: after a change to the listing's website, Google allows up to 24
   hours for AdMob to see it and asks for at least 24 hours before the
   status updates (support.google.com/admob/answer/9363762); a Check for
   updates inside that window reads the old site ("details don't match",
   28 Sept). Change nothing in the window, then check again.*
2. **Test devices first:** AdMob → *Settings → Test devices → Add*, the Fold's
   advertising ID (the phone's *Settings → Google → Ads*), and every phone the
   owner taps ads on. Tapping a real unit on your own phone is invalid traffic
   and the ban is permanent (A17).
3. **The units (D11): three rewarded units under the linked app** (the owner,
   take 121: one per placement) -- *Scan credits*, *Deck save*, *MAX unlock*.
   The app reads neither the reward amount nor its type; the defaults do. They
   go in `ADMOB_LIVE_SCAN`, `_DECK`, `_MAX` in `tools/config.py`, with
   `ADMOB_LIVE_FROM` the first take that asks for consent; they ride the synced
   manifest's `ads.live`, which a build loads only at or after that take and
   once the consent SDK allows ads (`PLATFORM._canRequestAds`), so
   every older install keeps Google's test units (take 121). `ads.scan` and
   `ads.deck` stay the test unit for good; the gate's `check_ads` refuses
   anything else.
4. **Consent (A43):** the app is on Play worldwide (the owner, take 121), so
   EEA and UK users need Google's consent message before real ads. AdMob →
   *Privacy & messaging → European regulations* → a message for this app,
   **published**; the US states message is optional. The app's side (the UMP
   calls, a *Privacy choices* row under More) is the take after 121, and the
   gate refuses `ads.live` without it.
   *Take 127, how the app behaves:* it asks UMP at launch, after the
   first-open guide; where consent is required Google's message shows once;
   More gains *Privacy choices for ads* where UMP requires the entry point.
   No ad is requested until UMP allows ads. When none can be had -- consent
   allows none, or a load fails while online with anything but a network
   error -- the save goes through free (the owner's rule); offline, the
   pending tray waits. Diagnostics' `consent:` line says the answer and the
   free saves.
5. **Payments -- needed to SERVE, not only to be paid** (corrected after
   take 121's merge; the take had it as "to be paid rather than to serve").
   Google's *About app readiness* (support.google.com/admob/answer/10564477):
   "When you first sign up for AdMob, your account must be verified before
   it's approved to serve ads. To have your account verified, you must enter
   your payment details" -- up to 24 hours, rarely two weeks. AdMob →
   *Payments*: the payment profile and tax information; the PIN letter when
   earnings reach the threshold.
6. **What to expect, from Google's pages:** the *app-ads.txt* tab (Apps →
   View all apps) stays empty until the app sends ad requests with this
   account's own units and is verified ("Your app-ads.txt status won't show
   ... if your app hasn't generated an ad request in the last 7 days or if
   your app hasn't been verified", answer 9776740) -- Google's test units
   are not this account's, so it is empty until the consent take's real
   units. After a website change, verification can take up to a week
   ("Wait one week before seeking additional help", answer 9675354). Once
   verified, the app readiness review starts by itself, "typically 2-3
   days", with limited serving until approved (answer 10564477).
7. **Families:** this app is not directed at children. Never a Families
   category; `tagForChildDirectedTreatment` stays unset.

## 10. Developer verification — The owner, when Play asks

Play-distributed apps are covered by the Play account. The sideload APK is
the one Android Developer Verification will eventually gate (landmine 36);
the free hobbyist tier is worth ten minutes when the console offers it (A12).

---

## Every take after the first

Merge the take's PR → the build runs → the Release carries
`optcghub-take-N.aab` signed with the upload key (the `apk` job's log line
`AAB signer: Owner: CN=OP TCG Hub upload` is the proof; since take 102 any
other signer, readable or not, fails the build and the certificate's
SHA-256 is printed beside it). Upload it to the **production** track once
the app is live (§8b), to the closed track before.
`versionCode` is the take number and never goes backwards (landmine 33).
Two things per take:

- **Upload each take once.** The nightly rebuilds the same take and
  replaces the Release's files with the same `versionCode`; a second upload
  of take N is refused as "already used" (landmine 33). The next upload is
  take N+1.
- **Your own phone (landmine 34):** the Play build and the sideloaded take
  share `com.optcghub.app` but not a signer, so the Play build cannot
  install over the sideload. Before installing from Play: More → Export
  CSV, uninstall, install from Play, More → Import.

## If something goes wrong

| symptom | look at |
|---|---|
| Play: "signed in debug mode" or "wrong key" | two causes: the bundle still has the DEVKEY suffix (§2, the secrets, then re-run the build) — or the file is upload-key-signed (the log's `AAB signer:` line says `CN=OP TCG Hub upload`) and Play registered the *sideload* key from a DEVKEY first upload: check the upload key certificate's SHA-1 against `8A:17:C1:B9:…` and reset (§2, "The reset") |
| Play: "Version code N has already been used" | landmine 33 — a burned code; the next take's number is new, upload that |
| The Play build will not install on the Fold | landmine 34 — same id, different signer; export, uninstall the sideload build, install, restore |
| "Your app must have a privacy policy" | §5 — the URL must open; Pages source must be *GitHub Actions* (RUNBOOK §3) |
| Data safety rejection | §5 — device IDs collected **and** shared, advertising; landmine 94 |
| Rejected for misleading claims | the full description must **open** with the disclaimer; `docs/PLAY-LISTING.md` does |
| Tester count stuck below 12 | invited ≠ opted in: they must open the link **and** install; ask them for a screenshot of the app |
| The clock reset | a tester opted out; that is why 16–18 |
| "Violation of Play Console Requirements — some types of apps can only be distributed by organisations" | the policy's four triggers are financial, health, VPN, government. Set *Financial features* to **none**, *Health* to **none**, *Government* **No**; category **App → Tools**; save every card; resubmit. Category alone is not on the list (take 43) |
| AdMob "couldn't verify", app-ads.txt "not found" or "details don't match" | the file must be at the **root of the website the live listing names** -- `sergeantcs2.dev` since take 121 -- not wherever it was put once (§9 item 1, landmine 209) |
