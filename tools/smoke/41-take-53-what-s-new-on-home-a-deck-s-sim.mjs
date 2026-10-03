/* smoke section 41: take 53 — what\'s new on Home; a deck\'s sim-readiness; the board\'s pips
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 53 — what\'s new on Home; a deck\'s sim-readiness; the board\'s pips');
ok('the manifest carries this take\'s release note, lifted from ci/RELEASE.md', manifest.whatsNew && manifest.whatsNew.take === V.TAKE && manifest.whatsNew.text.length > 20, JSON.stringify(manifest.whatsNew));
const relTxt = fs.readFileSync(path.join(ROOT, 'ci', 'RELEASE.md'), 'utf8');
ok('...and it is the first "New at take" paragraph, word for word', relTxt.includes(manifest.whatsNew.text.split(' ').slice(0, 6).join(' ')));
ok('the release note is a closed drop-down under More, About, once per take; Home carries none (take 117, the owner\'s word)', /<details class="wn"><summary>New in this update<\/summary>/.test(js) && !/id="whatsNew"/.test(html) && !/wnOk/.test(js));
const PL9 = new Function('return ' + js.match(/function parseListLine\(raw\) \{[\s\S]*?\n\}/)[0])();
const mk = () => { const d = V.DECKS.blank(); for (const raw of fs.readFileSync(path.join(ROOT, 'showcase', 'deck.txt'), 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = PL9(line); const num = m[2].toUpperCase(); const p = (V.CAT.byNum.get(num) || []).filter(x => x.num === num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0]; if (p.type === 'Leader') d.leader = p.id; else d.cards.push({ id: p.id, n: +m[1] }); } return d; };
const sr = V.simReadiness(mk());
ok('sim-readiness counts every card of the deck into exactly one bucket', sr.total === 14 && sr.full + sr.part + sr.hand + sr.none === sr.total, JSON.stringify(sr));
ok('...and names the by-hand cards for the player', Array.isArray(sr.handNames) && sr.handNames.length <= 6);
ok('the deck screen has the panel and the Play in Sim button; the sim preselects that deck', /id="dkSim"/.test(html) && /id="dkPlaySim"/.test(js) && /SIMUI\.pre = dkCur\.id/.test(js) && /findIndex\(x => x\.d\.id === \(SIMUI\.d1 \|\| SIMUI\.pre\)\)/.test(js));   // take 124: the choice made on the setup screen first, then the deck the Deck screen sent
ok('the board draws DON!! as tokens -- active upright, rested turned; ドン!! since take 126 -- and a card whose picture fails in its own colours (take 124; pips and dots to take 123)', /`<i class="tk">\$\{G\('donjp', 14\)\}<\/i>`\.repeat\(d\.active\)/.test(js) && /`<i class="tk r">\$\{G\('donjp', 14\)\}<\/i>`\.repeat\(d\.rested\)/.test(js) && /var\(--c-\$\{CCLASS\[cs\[0\]\]\}\)/.test(js));   // the tokens and colours read the seat's view (X.don, c.colours)
}
}
