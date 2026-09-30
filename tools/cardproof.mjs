/* Card proofs, run against the SHIPPED app (take 122).
 *
 * Each tools/cards/<number>.json is a card's proof: scenarios that set a board, make moves through the
 * engine's one entry point (SIM.act) and say what must follow -- and at least one saying what must NOT.
 * The build binds a proof to the printings whose effect text and parse it was written on (tools/cards.py);
 * this runner recomputes that binding itself, in the app's own line split, and refuses a disagreement --
 * two implementations of one fingerprint are a check on each other.
 *
 *   node tools/cardproof.mjs                     every proof, every printing it binds; exit 1 on a failure
 *   node tools/cardproof.mjs --app DIR           the same scenarios against another build (DIR/app.js,
 *                                                DIR/catalog.json) -- how a proof is watched failing on the
 *                                                previous take; binds by text alone. A build before SIM.act
 *                                                (take 121) is refused: its measurement is in HANDOFF take 122
 *   node tools/cardproof.mjs --sheet ST01        a review sheet for a ready-made deck: printed text, what the
 *                                                app will do, the verdict (written under look/, not committed)
 *   node tools/cardproof.mjs --worklist          what is unproven, the ready-made decks' cards first
 *   node tools/cardproof.mjs --from-report F     a Report from the app, replayed, as a draft proof scenario
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { boot, ROOT } from './lib/appvm.mjs';

const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] || true) : null; };
const APPDIR = opt('--app');
const { V } = await boot({ quiet: true, app: typeof APPDIR === 'string' ? path.resolve(APPDIR) : null });
const S = V.SIM, CAT = V.CAT;
if (typeof S.act !== 'function') { console.log('  that build has no SIM.act (take 121 or before); the proofs speak only the one entry point -- take 121 measured 123 of 200 failing (HANDOFF take 122)'); process.exit(2); }
const DIR = path.join(ROOT, 'tools', 'cards');
const proofs = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort().map(f => ({ _file: f, ...JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) })) : [];

/* ---- the fingerprints, as tools/cards.py computes them ------------------ */
const sha = t => crypto.createHash('sha1').update(t, 'utf8').digest('hex').slice(0, 16);
/* the app's own split (SIM.lines) */
const linesOf = text => S.lines(text);
const textFp = text => sha(linesOf(text).join('\n'));
/* json.dumps(x, sort_keys=True): ", " and ": ", keys sorted, non-ASCII as \uXXXX */
const pyjson = x => x === null || x === undefined ? 'null' : Array.isArray(x) ? '[' + x.map(pyjson).join(', ') + ']'
  : typeof x === 'object' ? '{' + Object.keys(x).sort().map(k => pyjson(k) + ': ' + pyjson(x[k])).join(', ') + '}'
  : typeof x === 'string' ? '"' + x.replace(/[\\"]/g, c => '\\' + c).replace(/[\u0000-\u001f\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) + '"'
  : typeof x === 'boolean' ? String(x) : String(x);
const fxFp = lines => sha(pyjson((lines || []).filter(e => !e.hand).map(e => Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'raw')))));
const printingsOf = num => CAT.rows.filter(p => p.num === num && !p.sealed);
/* which printings a proof runs on: bound by the build (and re-derived here); under --app, by text alone */
function bind(p) {
  const mine = printingsOf(p.num).filter(r => textFp(r.text) === p.text_fp && (APPDIR || fxFp(CAT.effects[String(r.id)]) === p.fx_fp)).map(r => r.id);
  const built = Object.entries(CAT.proof).filter(([, v]) => v.num === p.num).map(([k]) => +k);
  return { ids: mine, agree: APPDIR || JSON.stringify(mine.slice().sort()) === JSON.stringify(built.sort()), built };
}

/* ---- a board from a scenario ------------------------------------------- */
const cheapest = num => printingsOf(num).sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
const FILL = CAT.rows.filter(p => p.type === 'Character' && !p.sealed && p.num && !linesOf(p.text).length && !(p.kw || '').length && S.cost(p) === 2).sort((a, b) => a.id - b.id)[0];
let subject = null;
const pick = ref => { if (ref === '@') return subject; if (typeof ref === 'number') return ref; if (/^#\d+$/.test(ref)) return +ref.slice(1);
  const p = cheapest(ref); if (!p) throw new Error(`no printing numbered ${ref}`); return p.id; };
function deal(board) {
  const b = board || {}, lead = s => pick((s && s.leader) || 'ST01-001');
  const deck = s => ({ name: s && s.name || 'P', leader: lead(s), cards: [{ id: FILL.id, n: 50 }] });
  S.new(deck(b.p0), deck(b.p1), b.first || 0, { seed: b.seed || 1 });
  S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' });
  const g = S.g; g.turn = b.turn ?? 3; g.active = b.active ?? 0; g.phase = 'main'; g.battle = null; g.over = null; g.queue = [];
  [b.p0 || {}, b.p1 || {}].forEach((s, k) => { const P = S.P(k);
    P.leader = Object.assign(S.inst(lead(s), 0), { don: s.leaderDon || 0, rested: !!s.leaderRested });
    P.chars = (s.chars || []).map(c => Object.assign(S.inst(pick(c.card), c.turn ?? 1), { don: c.don || 0, rested: !!c.rested }));
    P.hand = (s.hand || []).map(pick); P.trash = (s.trash || []).map(pick); P.stage = s.stage ? S.inst(pick(s.stage), 1) : null;
    P.deck = s.deckCards ? s.deckCards.map(pick) : Array(s.deck ?? 20).fill(FILL.id); P.life = s.lifeCards ? s.lifeCards.map(pick) : Array(s.life ?? 4).fill(FILL.id);
    P.don = { active: (s.don || {}).active || 0, rested: (s.don || {}).rested || 0 };
    P.donDeck = 10 - P.don.active - P.don.rested - P.leader.don - P.chars.reduce((a, c) => a + c.don, 0);
    P.taken = s.firstTurn ? 1 : 3; P.used = {}; P.modl = []; P.looking = []; P.lost = null; });
}

/* ---- what a scenario expects -------------------------------------------- */
function val(pathStr) {
  const [head, ...rest] = pathStr.split('.'), g = S.g;
  if (head === 'power') return S.power(+rest[0].slice(1), rest[1] === 'leader' ? 'leader' : +rest[1]);
  if (head === 'queue') return g.queue.length;
  if (head === 'blockers') return S.blockers().length;
  if (head === 'legal') return S.legal(S.who()).filter(x => x.t === rest[0]).length;
  if (['over', 'phase', 'turn', 'active'].includes(head)) return g[head];
  let x = S.P(+head.slice(1)); for (const k of rest) x = x == null ? undefined : x[/^\d+$/.test(k) ? +k : k];
  return Array.isArray(x) ? x.length : x; }
const sameVal = (got, want) => want !== null && typeof want === 'object' ? Object.entries(want).every(([op, v]) => ({ gte: got >= v, lte: got <= v, not: got !== v })[op]) : got === want;
function checkExpect(exp, where) { const bad = []; for (const [k, want] of Object.entries(exp || {})) { const got = val(k); if (!sameVal(got, want)) bad.push(`${where}: ${k} is ${JSON.stringify(got)}, not ${JSON.stringify(want)}`); } return bad; }
function runScenario(sc) {
  if (sc.replay) { const r = S.replay(sc.replay.spec, sc.replay.actions); if (!r.ok) return [`replay stopped at move ${r.at}: ${r.why}`]; return checkExpect(sc.expect, 'after the replay'); }
  deal(sc.board); const bad = [];
  (sc.do || []).forEach((step, k) => { const { s = S.g.active, refused, expect, ...a } = step; const r = S.act(s, a);
    if (refused != null) { if (r.ok || !String(r.why || '').includes(refused)) bad.push(`move ${k + 1} (${a.t}) should be refused with "${refused}"; got ${r.ok ? 'ok' : JSON.stringify(r.why)}`); }
    else if (!r.ok) bad.push(`move ${k + 1} (${a.t}) was refused: ${r.why}`);
    bad.push(...checkExpect(expect, `after move ${k + 1}`)); });
  return bad.concat(checkExpect(sc.expect, 'at the end')); }

/* ---- modes -------------------------------------------------------------- */
if (opt('--sheet')) {
  const set = String(opt('--sheet')).toUpperCase(), deck = (CAT.stock || []).find(d => d.id === 'stock-' + set.toLowerCase()) || { leader: null, cards: [] };
  const ids = [deck.leader].concat(deck.cards.map(c => c.id)).filter(Boolean);
  const verdict = id => { const pr = CAT.proof[String(id)]; return pr ? pr.v : 'unproven'; };
  const out = [`# ${set} -- what the Sim does with each card (take ${V.TAKE}, rules v${S.RULES})`, '', '| Card | Printed text | What the app does | Verdict |', '|---|---|---|---|'];
  for (const id of ids) { const p = CAT.byId.get(id), L = linesOf(p.text), E = CAT.effects[String(id)] || [];
    out.push(`| ${p.num} ${p.name} | ${L.join('<br>') || '(no effect text)'} | ${E.map(e => S.describe(e)).join('<br>') || '-'} | ${E.some(e => !e.hand) ? verdict(id) : (E.length ? 'by hand' : '-')} |`); }
  fs.mkdirSync(path.join(ROOT, 'look'), { recursive: true }); const f = path.join(ROOT, 'look', `cards-${set}.md`); fs.writeFileSync(f, out.join('\n') + '\n');
  console.log(`  wrote ${path.relative(ROOT, f)} (${ids.length} cards)`); process.exit(0);
}
if (opt('--worklist')) {
  const proven = new Set(proofs.map(p => p.num)); const seen = new Set();
  for (const d of CAT.stock || []) { const nums = [d.leader].concat(d.cards.map(c => c.id)).map(id => CAT.byId.get(id)).filter(p => p && !seen.has(p.num));
    nums.forEach(p => seen.add(p.num)); const todo = nums.filter(p => !proven.has(p.num) && (CAT.effects[String(p.id)] || []).length);
    console.log(`  ${d.name}: ${todo.length} to prove -- ${todo.map(p => `${p.num}${(CAT.effects[String(p.id)] || []).some(e => !e.hand) ? '' : ' (by hand)'}`).join(', ') || 'none'}`); }
  process.exit(0);
}
if (opt('--from-report')) {
  const rep = JSON.parse(fs.readFileSync(opt('--from-report'), 'utf8')); if (rep.kind !== 'optcghub-sim-report') { console.log('  not a Sim report'); process.exit(1); }
  const sc = { name: `reported at take ${rep.take}: ${rep.offer ? rep.offer.raw : 'the game'}`, replay: { spec: rep.spec, actions: rep.actions }, expect: {}, note: 'write what SHOULD have happened in expect, then add the card\'s must-not scenario' };
  console.log(JSON.stringify({ num: rep.offer && rep.offer.num, scenario: sc }, null, 1)); process.exit(0);
}

let failed = 0, ran = 0, printings = 0; const stale = [];
for (const p of proofs) {
  const { ids, agree, built } = bind(p);
  if (!agree) { failed++; console.log(`  FAIL  ${p.num}: this runner binds ${ids.join(',') || 'nothing'}, the build bound ${built.join(',') || 'nothing'} -- the two fingerprints disagree`); continue; }
  if (!ids.length) { stale.push(p.num); continue; }
  for (const id of ids) { subject = id; printings++;
    for (const sc of p.scenarios) { ran++; let bad; try { bad = runScenario(sc); } catch (e) { bad = [`threw: ${e.message}`]; }
      if (bad.length) { failed++; console.log(`  FAIL  ${p.num} (${id}) "${sc.name}"${sc.must_not ? ' [must not]' : ''}\n        ${bad.join('\n        ')}`); } } }
}
console.log(`  ${proofs.length} proofs, ${printings} printings, ${ran} scenarios run, ${failed} failed${stale.length ? `; stale (text or reading changed -- re-prove): ${stale.join(', ')}` : ''}${APPDIR ? ` -- against ${APPDIR}` : ''}`);
process.exit(failed ? 1 : 0);
