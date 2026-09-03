# RUNBOOK — Google Play

*Current as of take 30.* Adapted from APEX ORV, with the ordering reversed —
see landmine 36 and agenda A12.

**The difference from APEX ORV:** that project shipped a sideloaded APK first and
added Play later. That ordering is no longer available. Android Developer
Verification enforcement began 30 Sep 2026 in Brazil, Indonesia, Singapore and
Thailand and goes global from 2027, covering direct APK installs on certified
devices. Plan Play as primary from day one.

## A. Before the first commit — the permanent decisions

These are registered once and cannot be changed afterwards.

1. **applicationId.** Proposed `com.optcghub.app`. Fixed from first Play upload
   and registered permanently under developer verification. No franchise mark in
   it (landmine 30).
2. **Sideload keystore**, generated on the Fold in Termux or on the PC:
   ```
   keytool -genkeypair -v -keystore vault.keystore -storetype PKCS12 \
     -alias apexvault -keyalg RSA -keysize 2048 -validity 10000
   ```
   Committed to `signing/`, deliberately, so take N installs over take N-1.
3. **Play upload key**, generated separately. **Never committed, never pasted
   into a chat, never in a seed zip.**
   ```
   base64 -w0 vault-upload.jks > vault-upload.b64
   ```
   Back both up somewhere off the phone before writing any code.

## B. One-time setup on Google's side

1. **Four repository secrets** (Settings -> Secrets -> Actions):
   `PLAY_UPLOAD_KEYSTORE_B64`, `PLAY_UPLOAD_STORE_PASS`, `PLAY_UPLOAD_KEY_ALIAS`,
   `PLAY_UPLOAD_KEY_PASS`. Until they exist CI still succeeds but names the
   bundle `...-DEVKEY-DO-NOT-UPLOAD.aab`, which Play will not accept. Sideload
   testing is never blocked by their absence.
2. **Paste `ci/build.yml`** into `.github/workflows/build.yml` by hand, once.
   The seed cannot write workflows (A-46). Diff it job by job against what is
   there: the `seed` job and `optcghub-seed*.zip` in `push.paths` are load-bearing
   and have been dropped by a paste before (A-202).
3. **Play Console**: create the app, accept Play App Signing, keep the
   applicationId permanent.
4. **Enable GitHub Pages** (Settings -> Pages -> Source: GitHub Actions) so the
   privacy policy is live at `https://<user>.github.io/<repo>/privacy.html`.
   Play requires a working URL.
5. **Confirm the account type and creation date.** Personal accounts created
   after 13 Nov 2023 face the 12-tester gate (landmine 35). This single answer
   decides whether Phase 6 costs two weeks or zero.
6. **Check the hobbyist developer-verification tier.** A lighter-touch free path
   exists for students and hobbyists; worth ten minutes early (A12).

## C. The listing — get this right the first time

APEX ORV build 166 was **REJECTED** under Play's Misleading Claims policy for
missing source attribution, and take 167 was spent entirely on fixing it. That
lesson is free here.

- The full description **opens** with the affiliation disclaimer. Not a footnote —
  "easy-to-see" was the actual requirement.
- A **WHERE THE DATA COMES FROM** section names TCGplayer and TCGCSV with working
  links, and the app carries the same disclaimer and the same links under About.
- **Every URL is checked with a request before it is written down.** Play requires
  them to be valid and functional; a dead link is another rejection.
- No franchise name in the title, the short description, or the first screenshot.
- The citation links trip the gate's remote-origin check by design. Allowlist them
  as DISPLAY-ONLY with the reasoning recorded, exactly as APEX did — PROTOCOL §8
  exists to stop the app *depending* on the network, not to stop it citing sources.

## D. Every build after that

The `apk` job publishes to Releases:

| Artifact | What it is |
|---|---|
| `optcghub-take-N.apk` | sideload, committed key, installs over the last take |
| `optcghub-take-N.aab` | the Play upload, private upload key |
| `play-assets-N.zip` | icon, feature graphic, privacy.html, listing copy, data safety answers, release notes |

Upload the **.aab**. Screenshots are the only thing not generated.

`versionCode` derives from the take number and never goes backwards — a code
uploaded once is burned forever, even from a deleted draft (landmine 33).

**The Play build and a sideloaded take cannot coexist under one applicationId**
(landmine 34). APEX ORV ships them under different ids so both sit on the phone;
decide this before there is a collection worth keeping. WebView storage is scoped
per app, so a collection does not carry across.

## E. The track sequence

Internal testing (instant, any number of testers) -> complete the app setup ->
closed testing -> **12 testers opted in for 14 continuous days** -> apply for
production.

A tester who opts out restarts their clock, so recruit 16-18 (landmine 35).
Start at Phase 0. It is pure calendar time and it is the longest lead item in the
whole plan.

Read the pre-launch report after the first upload as a field report and file
items from it.


## F. Ads (A17) — what changes on the Play side, once real IDs exist

Take 22 wired the SDK against Google's test units. When Jacob's AdMob account
is live:

1. Replace the three values in `tools/config.py` (`ADMOB_APP_ID`,
   `ADMOB_REWARD_SCAN`, `ADMOB_REWARD_DECK`). `ADMOB_IS_TEST` flips to false
   on its own. **Never put the real IDs in a build that testers will tap on
   repeatedly** — invalid-traffic bans are permanent; keep the test units
   until the closed-testing track is real users.
2. **Data Safety form** — the near-empty form (landmine 39) is gone. AdMob
   collects the advertising ID and device identifiers for ads. Declare:
   *Device or other IDs — collected, shared, for advertising*. APEX ORV was
   rejected at its take 166 over the advertising-ID declaration; get it right
   the first time.
3. **Privacy policy** — name AdMob, link Google's ads policy, state that the
   app itself collects nothing.
4. **Families** — this app is not directed at children. Do not select a
   families category; `tagForChildDirectedTreatment` stays unset.
5. **AdMob app-ads.txt** — AdMob will ask; the Pages site can host it at
   `/app-ads.txt` once the Play listing exists.
