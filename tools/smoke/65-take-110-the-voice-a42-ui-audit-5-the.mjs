/* smoke section 65: take 110 — the voice (A42, UI-AUDIT §5): the developer\'s wording out, sentence case, one word per thing, one money, percentage, day and moment, a name for every field
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 110 — the voice (A42, UI-AUDIT §5): the developer\'s wording out, sentence case, one word per thing, one money, percentage, day and moment, a name for every field');
{ const both = html + js, nof = () => '';
  const secOf = (src, id) => { const i = src.indexOf(`id="${id}"`); if (i < 0) return null; const s0 = src.lastIndexOf('<section id="', i); return s0 < 0 ? null : src.slice(s0 + 13, src.indexOf('"', s0 + 13)); };
  const signedMoney = V.signedMoney || nof, pctNum = V.pctNum || nof, dayText = V.dayText || nof, momentText = V.momentText || nof;
  /* the developer's voice: the shipped app carries no source comments, so these can only be words on a screen */
  const DEV = ['(R6)', 'PROTOCOL §', '(landmine ', 'MEASURED:', '(dev)', 'A17 —', 'on the roadmap', 'come to this mode next', 'come with the local view', 'offline by design', 'Sealed product is manual', 'take __TAKE__'];
  const devIn = t => DEV.filter(w => t.includes(w));
  ok('the developer\'s wording is out of the app: no ticket, protocol or landmine numbers, no "MEASURED:", no dev button, no roadmap promises', devIn(both).length === 0 && /<title>OP TCG Hub<\/title>/.test(html), devIn(both).join(' | '));
  ok('...control: each of the take-109 lines is caught', DEV.every(w => devIn('x ' + w + ' x').length === 1) && !/<title>OP TCG Hub<\/title>/.test('<title>OP TCG Hub — take 109</title>'));
  ok('...the test credits live in Diagnostics, the hidden screen, and More says what credits are in the collector\'s words', /<button class="ghost" id="devEarn">[^<]*<\/button>/.test(html) && secOf(html, 'devEarn') === 'diag' && /<h3>Save credits<\/h3>/.test(js) && !/id="devEarn"/.test(js));
  /* sentence case for every heading, button and chip */
  const CASE = ['Most Valuable', 'View All', 'Market Movers', 'Trade Analyzer', 'Bulk Actions', 'Add a Graded Card', 'Starter Decks', 'YOUR SCAN', 'Backup FAILED', '>FAILED<', 'REPLACES', 'offline ok', 'for this deck: off', '>given<', '>+cal<', 'Two faces'];
  const caseIn = t => CASE.filter(w => t.includes(w));
  ok('sentence case: the audit\'s capitalised and lower-case outliers are gone', caseIn(both).length === 0, caseIn(both).join(' | '));
  ok('...control: each take-109 outlier is caught', CASE.every(w => caseIn('x' + w + 'x').length === 1));
  /* one word per thing */
  const OLD = ['All portfolios', 'New portfolio', 'Rename portfolio', "'Portfolio'", 'A portfolio is', 'Only the portfolio', 'Portfolios keep', '<span class="cap">Portfolio', '<h3>Performance</h3>', '<h3>Events</h3>', '>Fetch<', 'hot-seat ·', 'Wanted: ', 'No active [Blocker]', '</svg></span>Export</button>', '</svg></span>Backup</button>'];
  const oldIn = t => OLD.filter(w => t.includes(w));
  ok('one word per thing: Collection for Portfolio (D17), Refresh for the feeds, Export CSV and Back up as in More, pass the phone for the Sim, the want list by name, Blocker as the game writes it; no panel repeats its screen\'s title', oldIn(both).length === 0 && /<span class="cap">Collection<\/span>/.test(html) && /All collections/.test(js) && /\+ New collection/.test(js), oldIn(both).join(' | '));
  ok('...control: each take-109 word is caught', OLD.every(w => oldIn('x' + w + 'x').length === 1));
  ok('...and the data keeps its names: the CSV column and the backup still say portfolio (an export from any take imports)', /'portfolio', 'product_id'/.test(js) && /portfolios: PF\.list/.test(js));
  /* money, percentages, days and moments */
  const cur0 = V.CUR.active();
  ok('a signed amount keeps its currency: +$12.50, −$3.00 (money(x).slice(1) dropped the "$")', signedMoney(12.5) === '+$12.50' && signedMoney(-3) === '−$3.00', `${signedMoney(12.5)} ${signedMoney(-3)}`);
  ok('...control: the take-109 expression is caught', '+' + (() => '$12.50')().slice(1) !== '+$12.50');
  const R = V.CUR.rates(), conv = R && R.rates && Object.keys(R.rates).find(c => c !== 'USD' && R.rates[c] > 0);
  if (conv) { V.CUR.set(conv); ok(`...in a converted currency (${conv}) the sign sits after the ≈, which is kept`, /^≈\+/.test(signedMoney(10)) && /^≈−/.test(signedMoney(-10)), signedMoney(10)); V.CUR.set(cur0); }
  ok('one rule for a percentage: one decimal, none from 100 % up', pctNum(0.344) === '0.3%' && pctNum(-12.46) === '12.5%' && pctNum(123.4) === '123%', `${pctNum(0.344)} ${pctNum(-12.46)} ${pctNum(123.4)}`);
  /* take 110's review: the rule on the rounded figure, and a sign only on a figure that is not zero */
  const signedPct = V.signedPct || nof;
  ok('...read on the figure as rounded: 99.96 is "100%", never "100.0%"', pctNum(99.96) === '100%' && pctNum(99.94) === '99.9%', `${pctNum(99.96)} ${pctNum(99.94)}`);
  ok('...a signed percentage carries no sign on a zero ("\u22120.0%" and "+0.0%" said a move the figure does not show)',
     signedPct(-0.04) === '0.0%' && signedPct(0.02, true) === '0.0%' && signedPct(-1.26) === '\u22121.3%' && signedPct(3, true) === '+3.0%' && signedPct(3) === '3.0%' && !js.includes("'\\u2212'}${pctNum("), `${signedPct(-0.04)} ${signedPct(-1.26)} ${signedPct(3, true)}`);
  ok('...control: the first push\'s forms are caught', ((p) => (p >= 0 ? '' : '\u2212') + Math.abs(p).toFixed(Math.abs(p) >= 100 ? 0 : 1) + '%')(-0.04) === '\u22120.0%' && (a => a.toFixed(a >= 100 ? 0 : 1) + '%')(99.96) === '100.0%');
  { const keepCode = V.CUR.code, keepRates = V.CAT.man.rates;
    V.CUR.code = 'EUR'; V.CAT.man.rates = null;   /* a euro chosen on an earlier build; this build carries no rates (the fetch failed and no sidecar) */
    const shown = V.money(10), sym = V.CUR.sym(), wrong = (V.CUR.list.find(c => c[0] === V.CUR.code) || [])[1];
    V.CUR.code = keepCode; V.CAT.man.rates = keepRates;
    ok('a saved currency this build has no rate for shows dollars, marked as dollars (the review: "\u20ac10.00" for $10, with no \u2248)', shown === '$10.00' && sym === '$', `${shown} ${sym}`);
    ok('...control: the symbol read from the saved code is caught', wrong === '\u20ac'); }
  ok('...no ".toFixed" percentage outside that rule, no "in the last all time"', !/toFixed\((?:0|2|tile \? 1 : 2)\)\}%/.test(js) && !/in the last all time|'all time' : range/.test(js) && /since the first day on file/.test(js));
  const yr = new Date().getFullYear();
  ok('one way to write a day: "Sep 23", the year only when it is not this one', dayText(`${yr}-09-23`) === 'Sep 23' && dayText(`${yr - 1}-11-20`) === `Nov 20, ${yr - 1}` && dayText('') === '?', `${dayText(yr + '-09-23')} | ${dayText((yr - 1) + '-11-20')}`);
  ok('...and a moment: no literal T, a 12-hour clock', /^[A-Z][a-z]{2} \d{1,2}(, \d{4})?, \d{1,2}:\d{2}\s?[AP]M$/.test(momentText(`${yr}-09-24T06:23:00Z`)) && !/T\d/.test(momentText(`${yr}-09-24T06:23:00Z`)), momentText(`${yr}-09-24T06:23:00Z`));
  ok('...control: the take-109 ISO forms are caught', !/^[A-Z][a-z]{2} \d/.test('2026-09-23') && /T\d/.test('2026-09-24T06:23'));
  /* take 110's review, from the look's pictures: Market movers' heading still read "2026-09-22 \u2192 2026-09-23" */
  const isoShown = t => ['${esc(prev)} \\u2192 ${esc(day)}', '(${g.from} \\u2192 ${g.to})', "' of ' + esc(R.date)", "market \\u00b7 ${(CAT.man.source_updated_at || '').slice(0, 10)}", '\\u00b7 ${esc(n.when)}', 'via TCGCSV, ${esc(asOf)}', 'Trade \\u2014 ${new Date().toISOString().slice(0, 10)}'].filter(w => t.includes(w));
  const appSrc = appSource();
  ok('...no day on a screen in ISO: the movers\' heading, the range label, the rate\'s date, where to buy, your own notes; a shared page and a trade\'s text carry the year', isoShown(appSrc).length === 0 && dayText(`${yr}-09-23`, { year: true }) === `Sep 23, ${yr}`, isoShown(appSrc).join(' | '));
  ok('...control: each take-109 form is caught', isoShown(`\${esc(prev)} \\u2192 \${esc(day)} (\${g.from} \\u2192 \${g.to}) ' of ' + esc(R.date) market \\u00b7 \${(CAT.man.source_updated_at || '').slice(0, 10)} \\u00b7 \${esc(n.when)} via TCGCSV, \${esc(asOf)} Trade \\u2014 \${new Date().toISOString().slice(0, 10)}`).length === 7);
  ok('...ISO stays only where a machine reads it: the diagnostics and self-test reports', (js.match(/slice\(0, 16\)/g) || []).length === 2 && /diagnostics \\u2014 take \$\{TAKE\} \\u2014 \$\{new Date\(\)\.toISOString\(\)\.slice\(0, 16\)\}Z/.test(appSource()));
  V.MODE.set('hunt', false); V.paintSealed();
  ok('...Sealed\'s line under its title says the prices\' day in words', /^prices [A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(ctx.document.getElementById('sealedAsOf').textContent), ctx.document.getElementById('sealedAsOf').textContent);
  V.MODE.set('collect', false); V.go('home');
  ok('the price filter speaks the currency on screen: its bounds typed and shown converted, kept in US dollars', /\$\('#fMin'\)\.placeholder = 'min ' \+ CUR\.sym\(\)\.trim\(\)/.test(js) && typeof V.fromShown === 'function' && V.fromShown('') === null && V.fromShown('10') === 10 / (V.CUR.rate(V.CUR.active()) || 1) && V.toShown(null) === '');
  /* a name for every field */
  const unnamed = t => [...t.matchAll(/<(input|select|textarea)\b([^>]*)>/g)].filter(m => !/type="(checkbox|file|hidden)"/.test(m[2]) && !/aria-label/.test(m[2]) && !(/id="([^"]+)"/.test(m[2]) && new RegExp('<label[^>]*for="' + /id="([^"]+)"/.exec(m[2])[1] + '"').test(t))).map(m => (/id="([^"]+)"/.exec(m[2]) || [, m[1]])[1]);
  ok('every field has a name a screen reader says: a label, not only a placeholder that vanishes when typing starts', unnamed(both).length === 0, unnamed(both).join(', '));
  ok('...control: a field with only a placeholder is caught', unnamed('<input id="x" placeholder="Name">').length === 1);
  const P110 = V.PLAY; const t0 = P110.turn; P110.turn = 1; V.paintPlay(); const pb = ctx.document.querySelector('#plBoard').innerHTML; P110.turn = t0; V.paintPlay();
  ok('the update note on Home starts with a capital -- the release paragraph is written to follow "New at take N:"', /note\.text\.charAt\(0\)\.toUpperCase\(\) \+ note\.text\.slice\(1\)/.test(js));
  ok('the Play counter\'s button is a word or two; what happens is said beside it', />Start<\/button>/.test(pb) && /The first player draws no card and gets 1 DON!!/.test(pb) && !/Start — first player/.test(js));
}
}
