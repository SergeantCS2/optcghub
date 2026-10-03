/* smoke section 54: take 97 — Releases: starter decks fold into one row, the countdown carries its band, Remind me and Calendar on every upcoming release
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
  const { d, single } = harness.fx;   /* built by the foundation's sections, read here as before the split */
{
section('take 97 — Releases: starter decks fold into one row, the countdown carries its band, Remind me and Calendar on every upcoming release');
const count97 = (h, re) => (h.match(re) || []).length;
const today97 = new Date().toISOString().slice(0, 10); const days97 = d => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today97 + 'T00:00:00Z')) / 864e5);
ok('the band: within a week, a month, three months, further or past', V.relBand(0) === 'cd1' && V.relBand(7) === 'cd1' && V.relBand(8) === 'cd2' && V.relBand(30) === 'cd2' && V.relBand(31) === 'cd3' && V.relBand(90) === 'cd3' && V.relBand(91) === 'cd4' && V.relBand(-1) === 'cd4');
V.MODE.set('hunt', false); V.HUNT.feed = null; V.RELF.open = new Set(); V.RELALERTS.list = []; V.paintReleases();
const r97 = ctx.document.getElementById('relList').innerHTML;
/* take 124: a starter deck by its code, the words as the fallback -- TCGCSV renamed every one on 29 Sept ("Starter Deck 31:
   RED Monkey.D.Luffy" to "ST-31: Starter Deck 31 RED Monkey.D.Luffy") and the first word no longer said so (landmine 231) */
const deck97 = s => /^ST-?\d/i.test(s.abbr || '') || /\bStarter Deck\b/i.test(s.name || '');
const decks97 = [...V.CAT.sets.values()].filter(s => s.pub && deck97(s)); const byDay = {}; for (const s of decks97) (byDay[s.pub] ||= []).push(s);
const runDay = Object.keys(byDay).find(d => byDay[d].length >= 2); const run = byDay[runDay] || [];
ok('a run of starter decks on one release day is ONE row naming the range and the count, its decks folded away (the six ST31–ST36 rows the owner saw)', !!runDay && new RegExp('Starter decks [^<]*' + run[0].abbr + '[^<]*' + run[run.length - 1].abbr).test(r97) && new RegExp(run.length + ' starter decks, one release day').test(r97) && !new RegExp('data-browse-set="' + run[1].id + '"').test(r97) && new RegExp('data-relfold="' + runDay + '"').test(r97), `${runDay}: ${run.length} decks`);
/* take 124: the fold keys on the set's code, never its name -- the run under names with no "Starter Deck" in them is still one
   row; with neither the code nor the words it is not folded (the control: the check can see a run come apart) */
const folded97 = () => { V.RELF.open = new Set(); V.paintReleases(); const h = ctx.document.getElementById('relList').innerHTML; return !!runDay && new RegExp('data-relfold="' + runDay + '"').test(h) && !new RegExp('data-browse-set="' + run[1].id + '"').test(h); };
const renamed97 = (f) => { const was = run.map(s => [s.name, s.abbr]); run.forEach((s, i) => f(s, i)); try { return folded97(); } finally { run.forEach((s, i) => { s.name = was[i][0]; s.abbr = was[i][1]; }); V.paintReleases(); } };
ok('the run stays one row whatever TCGCSV names its sets: named as before 29 Sept, and named without the words (landmine 231)', renamed97((s, i) => { s.name = `Starter Deck ${31 + i}: Deck ${i}`; }) && renamed97((s, i) => { s.name = `Deck ${i} of the run`; }), `${run.length} decks on ${runDay}`);
ok('control: a run with neither an ST code nor the words is not folded', !!runDay && !renamed97((s, i) => { s.name = `Deck ${i} of the run`; s.abbr = `XX${i}`; }));
const single = Object.keys(byDay).find(d => byDay[d].length === 1); const one = single && byDay[single][0];
ok('control: a single starter deck on its day stays its own row', !one || new RegExp('data-browse-set="' + one.id + '"').test(r97), String(one && one.abbr));
V.RELF.open.add(runDay); V.paintReleases(); const r97b = ctx.document.getElementById('relList').innerHTML;
ok('opening the fold shows every deck of the run as its own row, and the fold says Hide', run.every(s => new RegExp('data-browse-set="' + s.id + '"').test(r97b)) && /Hide the decks/.test(r97b));
ok('the group\'s tap searches Sealed for every starter deck, not one set', /data-browse-q="Starter Deck"/.test(r97b) && (() => { V.SEALED.q = ''; V.browseSet(run[0].id, 'Starter Deck'); const q = V.SEALED.q; V.SEALED.q = ''; ctx.document.getElementById('sealedQ').value = ''; return q === 'Starter Deck'; })());
V.RELF.open = new Set(); V.paintReleases(); const r97c = ctx.document.getElementById('relList').innerHTML;
const upcoming97 = [...V.CAT.sets.values()].filter(s => s.pub && s.pub >= today97);
/* take 115 (self-review): rows, not sets -- starter decks that share a day are one row (its first deck's), and since take 115
   a group is listed as soon as it lists a product, so ST39-ST44 on one day would have turned these two red */
const rows97 = upcoming97.filter(s => new RegExp('data-browse-set="' + s.id + '"').test(r97c) || !(deck97(s) && new RegExp('data-relfold="' + s.pub + '"').test(r97c)));
ok('every upcoming row\'s countdown carries the band of its distance, and a recent row carries the past band', rows97.every(s => new RegExp('data-browse-set="' + s.id + '"[\\s\\S]*?<span class="note ' + V.relBand(days97(s.pub)) + '">').test(r97c)) && /<span class="note cd4">\d+ days ago<\/span>/.test(r97c), `${rows97.length} upcoming rows of ${upcoming97.length} sets`);
ok('every upcoming row and group has Remind me and Calendar beside Details; a recent one has Details only', count97(r97c, /data-relalert="/g) >= rows97.length && count97(r97c, /data-relcal="/g) === count97(r97c, /data-relalert="/g) && (() => { const rec = r97c.slice(r97c.indexOf('<h3>Recent</h3>')); return !/data-relalert=/.test(rec) && /Details <svg[^>]*><use href="#g-external"/.test(rec); })());
/* the reminder: on, the day before, once; off */
const s97 = upcoming97.sort((a, b) => a.pub.localeCompare(b.pub))[0];
if (s97) {
  const on = V.RELALERTS.toggle(s97.id, s97.name, s97.pub); V.paintReleases();
  ok('Remind me stores the set and its date and the row says Reminder set', on && V.RELALERTS.has(s97.id) && V.RELALERTS.list[0].pub === s97.pub && /Reminder set <svg[^>]*><use href="#g-check"/.test(ctx.document.getElementById('relList').innerHTML) && new RegExp('data-relalert="' + s97.id + '" [^>]*aria-pressed="true"').test(ctx.document.getElementById('relList').innerHTML));
  const early = await V.RELALERTS.check(V.RELALERTS.dayBefore(V.RELALERTS.dayBefore(s97.pub)));
  const eve = await V.RELALERTS.check(V.RELALERTS.dayBefore(s97.pub));
  const again = await V.RELALERTS.check(s97.pub);
  ok('the on-open check fires once on the day before the release and not before, not again on the day', early.length === 0 && eve.length === 1 && eve[0].id === s97.id && again.length === 0, `${early.length} ${eve.length} ${again.length}`);
  ok('the same button removes it', !V.RELALERTS.toggle(s97.id, s97.name, s97.pub) && !V.RELALERTS.has(s97.id));
  const ics = V.icsFor(V.releaseEvent(s97));
  ok('Calendar hands the release to the phone as an all-day event on its date, named, with the listing as its link and no store location', new RegExp('DTSTART;VALUE=DATE:' + s97.pub.replace(/-/g, '')).test(ics) && ics.includes('SUMMARY:' + s97.name.replace(/,/g, '\\,') + ' — release day') && !/LOCATION:/.test(ics) && /URL:https:\/\/www\.tcgplayer\.com\//.test(ics) && new RegExp('UID:optcghub-event-release-' + s97.id + '@optcghub').test(ics));
} else { ok('no upcoming set in the catalogue today (the reminder path is exercised when one exists)', true); }
ok('the reminder rides two paths: a scheduled notification the day before and the on-open check at startup', /notifyAt\(/.test(js) && /schedule: \{ at/.test(js) && /RELALERTS\.check\(\)/.test(js) && /cancelNotify\(/.test(js));
/* the distributor's unlisted starter-deck displays fold the same way */
const fxDir97 = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-rel-')); const feed97 = path.join(fxDir97, 'feed-fixture.json');
execSync(`python3 tools/hunt.py --from-fixtures --out ${feed97}`, { cwd: ROOT, stdio: 'pipe' });
const F97 = JSON.parse(fs.readFileSync(feed97, 'utf8')); const st44 = F97.sources.gts.items.find(i => i.sku === 'BJP2904577');
F97.sources.gts.items.push({ ...st44, sku: 'BJP2904574', name: 'ONE PIECE TCG: TITLE TBA STARTER DECK [ST43] (6CT)', codes: ['ST43'] });   // a second display on the same day, from the saved page's shape
V.HUNT.feed = F97; V.RELF.open = new Set(); V.DISTF.open.add('releases'); V.paintReleases(); const r97d = ctx.document.getElementById('relList').innerHTML;   /* take 112: the list sits under Distributor info */
ok('two unlisted starter-deck displays on one release day fold into one distributor row naming the range', /Starter decks ST43–ST44/.test(r97d) && /2 starter deck displays, one release day/.test(r97d) && !/STARTER DECK \[ST44\]/.test(r97d) && /data-relfold="d:gts:2027-04-23"/.test(r97d));   /* take 112: the fold key names its distributor -- two can share a day */
V.RELF.open.add('d:gts:2027-04-23'); V.paintReleases();
ok('...and open, both displays are listed', /STARTER DECK \[ST44\]/.test(ctx.document.getElementById('relList').innerHTML) && /STARTER DECK \[ST43\]/.test(ctx.document.getElementById('relList').innerHTML));
V.RELF.open = new Set(); V.DISTF.open.clear(); V.HUNT.feed = null; V.RELALERTS.list = []; V.MODE.set('collect', false); V.go('home');
}
}
