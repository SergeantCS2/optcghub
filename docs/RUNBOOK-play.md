# RUNBOOK — Google Play, from the repo to a running 14-day clock

*Current as of take 40.* The whole procedure, in the order it must happen,
with who does each step. Everything on the repo side is already built; what
follows is the owner's, and none of it is hard. The gate at the end is calendar
time: **12 testers opted in for 14 continuous days** (landmine 35; re-checked
against Google's current wording at take 33: unchanged since 11 Dec 2024, when
it dropped from 20).

**Where things stand at take 39 (PROVEN by the console and the repo, not
remembered):** personal account; the app exists as `com.optcghub.app`;
**version code 35 is in internal testing** (two optional warnings, ignored);
the advertising-ID declaration and the Data Safety form are done as §5 says;
the take-36 listing copy is pasted; the closed-test track is created and at
4 of 5 — **roll out** and **Publishing overview → Send for review** are what
is left, then the opt-in link to 16–18 testers. On the repo: public, CI green
end to end, Pages live, privacy policy returning 200. **Still open:** which
bundle was the first upload (the upload-key one, or the DEVKEY one — §2 has
the reset if it was the wrong one); the listing icon (the console shows the
jolly roger; `play-assets-t33/icon-512.png` is the compass); a seed newer than 31 at the repo root (drop t40). app-ads.txt is live (§9).

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
| Financial features | No — prices are displayed, nothing is bought or sold in the app |
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
| App icon 512×512 | `play-assets-t33/icon-512.png` in this take's outputs (the take-16 compass placeholder, as asked) |
| Feature graphic 1024×500 | `play-assets-t33/feature-1024x500.png` |
| Phone screenshots, at least 2 | the Fold, cover screen: Home, Collection, a card detail, Scan, a deck. No character art in the first one (landmine 30 — the app shows none) |
| Category | Tools (or Entertainment) — never Games |
| Contact email | yours |
| Website | `https://sergeantcs2.github.io/optcghub/` — this is the domain AdMob crawls for app-ads.txt (§9) |

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

## 8. Apply for production — day 15

**Dashboard → Apply for production access.** Three short sections: how you
recruited testers, what you learned, what changed. Google answers in about a
week. Then a production release from the same bundle.

## 9. Ads — AdMob, in parallel, none of it blocks the clock

The AdMob account exists (take 33): publisher `pub-6243777967151950`.

1. **app-ads.txt — DONE take 40, PROVEN:** `https://sergeantcs2.github.io/app-ads.txt`
   serves `google.com, pub-6243777967151950, DIRECT, f08c47fec0942fa0`.
   How it works, because it confused once: GitHub gives an account one
   *user site* at the root of `<user>.github.io`, published only by a repo
   named exactly `<user>.github.io` — the name is the switch. Every other
   repo publishes under a path (`optcghub` → `/optcghub/`). AdMob's crawler
   takes the website on the listing, drops the path, and fetches
   `/app-ads.txt` from the **root**, never from `/optcghub/`. So the file
   lives in the root repo, beside a README, and that is the whole repo. It
   is not required to serve ads or to start the clock; AdMob shows a warning
   until it is found. Once the listing's *Website* is
   `https://sergeantcs2.github.io/optcghub/`, AdMob → the app → *app-ads.txt
   → Check for updates*; verified within about a day.
2. **The three IDs** (D11): the AdMob **app ID** (`ca-app-pub-6243777967151950~…`)
   and **two rewarded ad units** (`…/…`) — *Apps → OP TCG Hub → App settings*
   and *Ad units → Rewarded*. Paste them into `tools/config.py` **when the
   closed test is real users**, not before: Google's test units are what a
   closed test runs on, because tapping a real unit repeatedly on your own
   phone is invalid traffic and the ban is permanent (A17).
3. **Link the AdMob app to the Play listing** once it is live in a track, so
   AdMob's store verification and app-ads.txt status can complete.
4. **Families:** this app is not directed at children. Never a Families
   category; `tagForChildDirectedTreatment` stays unset.

## 10. Developer verification — The owner, when Play asks

Play-distributed apps are covered by the Play account. The sideload APK is
the one Android Developer Verification will eventually gate (landmine 36);
the free hobbyist tier is worth ten minutes when the console offers it (A12).

---

## Every take after the first

Drop the seed at the repo root → the build runs → the Release carries
`optcghub-take-N.aab` signed with the upload key. Upload it to the closed
track. `versionCode` is the take number and never goes backwards (landmine
33).

## If something goes wrong

| symptom | look at |
|---|---|
| Play: "signed in debug mode" or "wrong key" | the bundle still has the DEVKEY suffix — §2, the secrets, then re-run the build |
| Play: "Version code N has already been used" | landmine 33 — a burned code; the next take's number is new, upload that |
| The Play build will not install on the Fold | landmine 34 — same id, different signer; export, uninstall the sideload build, install, restore |
| "Your app must have a privacy policy" | §5 — the URL must open; Pages source must be *GitHub Actions* (RUNBOOK §3) |
| Data safety rejection | §5 — device IDs collected **and** shared, advertising; landmine 94 |
| Rejected for misleading claims | the full description must **open** with the disclaimer; `docs/PLAY-LISTING.md` does |
| Tester count stuck below 12 | invited ≠ opted in: they must open the link **and** install; ask them for a screenshot of the app |
| The clock reset | a tester opted out; that is why 16–18 |
| AdMob app-ads.txt "not found" | the file must be at the **root** of `sergeantcs2.github.io`, and the listing's website must be set (§9) |
