/* =====================================================================
 * THE DECK BUILDER — take 13, built against docs/RULES.md
 *
 * A deck is a list of {productId, n}. The rules count copies BY CARD NUMBER
 * (§5-1-2-3, §2-14-2) and this is the ONE place in this codebase where keying
 * on the number is correct -- everywhere else it is landmine 1. The model
 * stores productId so the collector can say which printing is sleeved and
 * value it; legality is computed on number.
 * ===================================================================== */
const RULES = {
  DECK_SIZE: 50, MAX_COPIES: 4, DON: 10,
  MAIN_TYPES: new Set(['Character', 'Event', 'Stage']),
};
const DECKS = {
  /* The player’s decks, then the stock ones. A stock deck is never saved,
     never edited in place, and never counted as owned (A29, take 61). */
  all() { return this.list.concat(CAT.stock || []); },
  isStock(d) { return !!(d && d.stock); },
  list: readJson('vault.decks', []),
  save() { saveJson('vault.decks', this.list); },
  blank() { return { id: 'd' + Date.now(), name: '', leader: null, cards: [],
                     created: new Date().toISOString() }; }
};
const hasKw = (p, k) => ('|' + (p.kw || '') + '|').includes('|' + k + '|');

/* §5-1-2-2 + §2-3-5: a card is legal if it shares ANY colour with the Leader. */
function colourLegal(p, leader) {
  if (!leader) return true;
  const L = colsOf(leader), C = colsOf(p);
  return C.some(c => L.includes(c));
}

/* Everything the rules say about a deck, at once. Never hides a card; it
   explains. */
function legality(deck) {
  const leader = deck.leader ? CAT.byId.get(deck.leader) : null;
  const rows = deck.cards.map(c => ({ ...c, p: CAT.byId.get(c.id) })).filter(r => r.p);
  const total = rows.reduce((a, r) => a + r.n, 0);
  const byNum = {};
  rows.forEach(r => { byNum[r.p.num] = (byNum[r.p.num] || 0) + r.n; });
  const problems = [];
  if (!leader) problems.push('No Leader chosen (§5-1-2)');
  else if (leader.type !== 'Leader') problems.push(`${leader.name} is not a Leader card`);
  if (total < RULES.DECK_SIZE) problems.push(`${RULES.DECK_SIZE - total} more card${RULES.DECK_SIZE - total === 1 ? '' : 's'} needed (§5-1-2)`);
  if (total > RULES.DECK_SIZE) problems.push(`${total - RULES.DECK_SIZE} over fifty (§5-1-2)`);
  for (const [num, n] of Object.entries(byNum))
    if (n > RULES.MAX_COPIES) problems.push(`${n} copies of ${num} — max ${RULES.MAX_COPIES} (§5-1-2-3)`);
  rows.forEach(r => {
    if (!RULES.MAIN_TYPES.has(r.p.type)) problems.push(`${r.p.name} is a ${r.p.type}, not a main-deck card (§5-1-2-1)`);
    if (leader && !colourLegal(r.p, leader)) problems.push(`${r.p.name} is ${colsOf(r.p).join('/')} — Leader is ${colsOf(leader).join('/')} (§5-1-2-2)`);
  });
  return { leader, rows, total, byNum, problems, legal: problems.length === 0 };
}

/* The advisor (RULES.md §2): analysis, never a rule. */
function analysis(deck) {
  const L = legality(deck);
  const curve = Array(11).fill(0);
  let counters = 0, counterEvents = 0, triggers = 0, blockers = 0, rush = 0,
      chars = 0, events = 0, stages = 0, cost = 0, costed = 0;
  for (const r of L.rows) {
    const p = r.p, n = r.n;
    const c = Math.min(10, Math.max(0, parseInt(p.cost, 10) || 0));
    if (p.cost != null && p.cost !== '') { curve[c] += n; cost += c * n; costed += n; }
    if (p.type === 'Character') chars += n; else if (p.type === 'Event') events += n; else if (p.type === 'Stage') stages += n;
    if (p.counter && Number(p.counter) >= 1000) counters += n;
    if (p.type === 'Event' && hasKw(p, 'Counter')) counterEvents += n;
    if (hasKw(p, 'Trigger')) triggers += n;
    if (hasKw(p, 'Blocker')) blockers += n;
    if (hasKw(p, 'Rush')) rush += n;
  }
  return { ...L, curve, avgCost: costed ? cost / costed : 0, counters, counterEvents,
           triggers, blockers, rush, chars, events, stages,
           life: L.leader ? L.leader.life : null,
           /* take 111: the Leader counted, as the deck's history counts it -- an empty deck read $0.00 beside a move of its Leader */
           value: L.rows.reduce((a, r) => a + (r.p.market || 0) * r.n, 0) + ((L.leader && L.leader.market) || 0) };
}

/* ---- screens ------------------------------------------------------------ */
let dkCur = null;
/* Take 109 (A42, C): Decks opens under the featured deck’s Leader -- the newest of
   the collector’s own decks that has one, else the first ready-made deck’s -- by
   printing id, never by number (AGENTS rule 3). */
function heroLeader() {
  /* take 115 (SPEC-109-40): a deck's date is the ISO string DECKS.blank() writes -- subtracted, it was NaN, the sort
     did nothing and the OLDEST deck was featured; a number (older data) still reads */
  const made = d => (typeof d.created === 'number' ? d.created : Date.parse(d.created) || 0);
  const own = DECKS.list.filter(d => d.leader && CAT.byId.get(d.leader)).sort((a, b) => made(b) - made(a))[0];
  if (own) return { L: CAT.byId.get(own.leader), why: 'your newest deck\u2019s Leader' };
  const st = (CAT.stock || []).find(d => d.leader && CAT.byId.get(d.leader));
  return st ? { L: CAT.byId.get(st.leader), why: 'a ready-made deck\u2019s Leader' } : null;
}
function paintDeckHero() {
  const h = $('#dkHero'); if (!h) return; const own = ownPic('hero-play.jpg'), f = own ? null : heroLeader();
  h.hidden = !own && !f; if (h.hidden) { h.innerHTML = ''; return; }
  /* take 110, the owner’s word: no card rising from behind the title and no line under the art */
  h.innerHTML = own ? ownBack('hero-play.jpg') : artBack(f.L);
}
function paintDecks() {
  const list = DECKS.list;
  paintStock(); paintDeckHero();
  const legal = list.filter(d => analysis(d).legal).length, st = (CAT.stock || []).length;
  $('#dkSub').textContent = list.length ? `${list.length} deck${list.length === 1 ? '' : 's'} \u00b7 ${legal} legal` : st ? `${st} ready-made to try` : '';
  $('#dkList').innerHTML = list.length ? list.map(d => {
    const A = analysis(d); const L = A.leader;
    return `<button class="panel" style="width:100%;text-align:left;display:flex;gap:12px;align-items:center" data-deck="${d.id}">
      <div class="lead pic" style="width:${THUMB.m}px;flex:0 0 ${THUMB.m}px;aspect-ratio:.716;border-radius:var(--r-sm);background:var(--card2);overflow:hidden;position:relative">${L ? refArt(L) : ''}</div>
      <div style="flex:1;min-width:0"><b>${esc(d.name || 'Untitled deck')}</b>
        <div class="note" style="margin:2px 0 0">${L ? esc(L.name) + ' · ' + colsOf(L).join('/') : 'No Leader'} ·
          ${A.total}/50 · ${A.legal ? '<span class="up">legal</span>' : `<span class="down">${A.problems.length} issue${A.problems.length === 1 ? '' : 's'}</span>`}</div></div>
      <div class="v mono">${money(A.value)}</div></button>`;
  }).join('') : emptyHtml('leader', 'No decks yet', 'Tap <b>+ New deck</b> and choose a Leader.');
}
CLICKS.on('[data-deck]', e => {
  const b = e.target.closest('[data-deck]'); if (b) openDeck(b.dataset.deck);
});
/* A deck’s cover, drawn by the app from data it already has: the Leader’s
   colour or colours as the field, the set code large in the display face. No
   file and no request. Since take 109 it is the fallback UNDER the Leader’s own
   picture (the owner’s ruling, A42) -- what shows offline or when the picture
   fails; the row itself names the Leader. */
function deckCover(d, { w = 56 } = {}) {
  const L = CAT.byId.get(d.leader) || {};
  const cs = gameColours(L);
  const a = cs[0] ? `var(--c-${CCLASS[cs[0]]})` : 'var(--brass)';
  const b = cs[1] ? `var(--c-${CCLASS[cs[1]]})` : a;
  const code = (d.set || (L.num || '').split('-')[0] || '').toUpperCase();
  const gid = 'cov' + (d.id || code).replace(/[^a-z0-9]/gi, '');
  return `<svg width="${w}" height="${Math.round(w * 1.4)}" viewBox="0 0 56 78" aria-label="${esc(code)} deck cover" role="img" style="flex:0 0 auto;border-radius:var(--r-sm);display:block">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="56" height="78" rx="6" fill="url(#${gid})"/>
    <rect x="3" y="3" width="50" height="72" rx="4" fill="none" stroke="rgba(0,0,0,.35)"/>
    <text x="28" y="40" text-anchor="middle" font-family="OPH Display, Impact, sans-serif" font-size="17" fill="rgba(0,0,0,.72)">${esc(code)}</text>
    <circle cx="28" cy="62" r="5" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>
  </svg>`;
}

/* take 109: a ready-made deck shows its Leader’s picture like the collector’s
   own decks do -- one treatment for one idea -- with the drawn cover under it */
function stockPic(d) {
  const L = CAT.byId.get(d.leader);
  return `<div class="pic" style="width:${THUMB.m}px;height:${Math.round(THUMB.m / 0.716)}px;flex:0 0 auto;position:relative;border-radius:var(--r-sm);overflow:hidden"><div class="ph" style="position:absolute;inset:0">${deckCover(d, { w: THUMB.m })}</div>${L ? refArt(L) : ''}</div>`;
}
/* Stock decks: browsable, playable in the sim, copyable into your own decks.
   Never owned cards: the heading and each row’s badge name them ready-made (take 110:
   the paragraph under the heading went at the owner’s word). */
function paintStock() {
  const box = $('#dkStock'); if (!box) return; const stock = CAT.stock || [];
  box.innerHTML = !stock.length ? '' : `<div class="fgrp">Ready-made decks</div>
    ${stock.map(d => `<button class="panel" style="width:100%;text-align:left;display:flex;gap:12px;align-items:center" data-stock="${esc(d.id)}">
      ${stockPic(d)}
      <div style="flex:1;min-width:0"><b>${esc(d.name)}</b><div class="note"><span class="badge">ready-made</span> ${d.cards.reduce((a, c) => a + c.n, 0)} cards</div></div></button>`).join('')}`;   /* take 111: the badge beside the name took its width, and the name already says the Leader and the set */
}
CLICKS.on('[data-stock]', e => {
  const b = e.target.closest('[data-stock]'); if (!b) return;
  const d = (CAT.stock || []).find(x => x.id === b.dataset.stock); if (!d) return;
  SIMUI.pre = d.id; MODE.set('play'); go('sim'); toast(`${d.name} \u2014 pick it as your deck`);
});
$('#dkNew').addEventListener('click', () => { const d = DECKS.blank(); DECKS.list.push(d); DECKS.save(); openDeck(d.id); });
function openDeck(id) { dkCur = DECKS.list.find(d => d.id === id); if (dkCur) go('deck'); }
/* Sim-readiness (take 53): of the cards in a deck, how many has the sim fully
   scripted, partly, or not at all -- so a player knows how much of a game
   the app will run and how much is theirs by hand. */
function simReadiness(d) {
  const ids = (d.leader ? [d.leader] : []).concat(d.cards.map(c => c.id));
  const counts = { full: 0, part: 0, hand: 0, none: 0 }; const byName = { hand: [] };
  for (const id of ids) { const p = CAT.byId.get(id); if (!p) continue;
    const lines = SIM.lines(p.text);   // take 122: the one split the parser uses (it left [Rush: Character] reminders in, and missed merged lines)
    const fx = ((CAT.effects || {})[String(id)] || []).filter(e => !e.hand);
    if (!lines.length) counts.none++; else if (fx.length >= lines.length) counts.full++; else if (fx.length) counts.part++; else { counts.hand++; if (byName.hand.length < 6 && !byName.hand.includes(p.name)) byName.hand.push(p.name); } }
  return { ...counts, total: ids.length, handNames: byName.hand };
}

function paintDeck() {
  if (!dkCur) return go('decks');
  const A = analysis(dkCur), L = A.leader;
  $('#dkName').value = dkCur.name || '';
  const lead = $('#dkLead'), [la1, la2] = L ? artColours(L) : [];
  lead.style.cssText = L ? `--a1:${la1};--a2:${la2}` : '';   /* take 115: the Leader's own colours under its picture -- offline, or a picture that failed, left an empty grey box (take 109's plan) */
  lead.innerHTML = L ? refArt(L, { size: 'large' }) : '<div class="ph" style="font-size:var(--fs-cap)">Leader</div>';
  $('#dkLeadLine').innerHTML = L   /* take 109 (A42): the Leader large, its name in the display face */
    ? `<b>${esc(L.name)}</b><span class="meta">${esc(L.num)} \u00b7 Leader \u00b7 ${G('life', 13)} ${L.life || '?'} Life</span>${colourDots(L)}`
    : '<span class="meta">Tap the card to choose a Leader</span>';
  const n = $('#dkN'); n.innerHTML = `${A.total}<span style="font-size:var(--fs-sm);color:var(--dim2)">/50</span>`;
  n.className = 'dkcount' + (A.total === 50 ? ' ok' : A.total > 50 ? ' over' : '');
  const sr = simReadiness(dkCur); const simBox = $('#dkSim');
  if (simBox) simBox.innerHTML = `<h3>In the Sim</h3><div class="note">Of ${sr.total} cards: <b>${sr.full}</b> run themselves, <b>${sr.part}</b> partly, <b>${sr.hand}</b> by hand, ${sr.none} have no effect text.${sr.handNames.length ? ' By hand: ' + esc(sr.handNames.join(', ')) + (sr.hand > sr.handNames.length ? '\u2026' : '') + '.' : ''}</div>
    <div class="row" style="margin-top:10px"><button class="ghost go" id="dkPlaySim" ${A.legal ? '' : 'disabled title="the deck must be legal first"'}>Play this deck in Sim</button></div>`;
  const ps = $('#dkPlaySim'); if (ps) ps.addEventListener('click', () => { SIMUI.pre = dkCur.id; MODE.set('play'); go('sim'); });
  const lg = $('#dkLegal');
  lg.className = 'legal ' + (A.legal ? 'ok' : 'bad');
  lg.innerHTML = A.legal ? 'Legal under Comprehensive Rules §5-1. Fifty cards, one Leader, in colour, no more than four of a number.'
                         : A.problems.slice(0, 4).map(esc).join('<br>') + (A.problems.length > 4 ? `<br>…and ${A.problems.length - 4} more` : '');
  const mx = Math.max(1, ...A.curve);
  $('#dkCurve').innerHTML = A.curve.map((c, i) =>
    `<div class="${c === mx && c ? 'hi' : ''}" style="height:${Math.max(3, 60 * c / mx)}px">${c ? `<b>${c}</b>` : ''}<span>${i}</span></div>`).join('');
  $('#dkAvg').textContent = A.total ? `avg cost ${A.avgCost.toFixed(1)} · 2 DON!! a turn (§6-4)` : '';
  const chip = (v, k) => `<span class="chip" style="padding:4px 9px;font-size:var(--fs-cap)">${v}<small>${k}</small></span>`;
  $('#dkStats').innerHTML = [
    [A.counters, 'Counter cards'], [A.counterEvents, '[Counter] Events'], [A.blockers, 'Blockers'],
    [A.triggers, 'Triggers'], [A.rush, 'Rush'], [money(A.value), 'value']].map(([v, k]) => chip(v, k)).join('');
  $('#dkTypes').textContent = `${A.chars} characters · ${A.events} events · ${A.stages} stages`;
  /* 8.7: what the deck is worth, and what it was worth on each day on file --
     the same estimate the portfolio draws, dashed, labelled. A deck is a list;
     the chart code is the chart code. */
  const hist = deckHistory(dkCur);
  const dv = $('#dkValue');
  if (dv) {
    const d1 = hist.length > 1 ? hist[hist.length - 1][1] - hist[hist.length - 2][1] : null;
    dv.innerHTML = `<div class="row"><div class="nm"><b>Deck value</b><span>${dkOwnedValue(A)}</span></div>
      <div class="v mono">${money(A.value)}${d1 != null ? `<span class="${d1 > 0.005 ? 'up' : d1 < -0.005 ? 'down' : 'flat'}">${signedMoney(d1)} ${esc(sinceLabel())}</span>` : ''}</div></div>
      <canvas id="dkSpark" height="56" style="width:100%;display:block;margin-top:6px"></canvas>
      <div class="note" style="margin-top:4px">${hist.length > 1 ? 'Dashed: estimated from each day\u2019s prices.' : 'One day of prices so far; the line appears as days add up.'}</div>`;
    if (hist.length > 1) sparkOn($('#dkSpark'), hist, 'estimate');
  }
  $('#dkRows').innerHTML = A.rows.length ? A.rows.slice().sort((a, b) =>
      (parseInt(a.p.cost, 10) || 0) - (parseInt(b.p.cost, 10) || 0) || a.p.name.localeCompare(b.p.name))
    .map(r => deckRow(r.p, r.n, L)).join('')
    : '<div class="note">Search above to add cards. Cards you own are marked.</div>';
  paintDeckAdd();
}
function deckRow(p, n, L, adding = false) {
  const ok = (!L || colourLegal(p, L)) && RULES.MAIN_TYPES.has(p.type);
  const own = OWN.items.filter(i => i.id === p.id).reduce((a, i) => a + i.qty, 0);
  const kws = ['Blocker', 'Rush', 'Trigger', 'Counter', 'Double Attack', 'Banish'].filter(k => hasKw(p, k));
  return `<div class="dkrow${ok ? '' : ' illegal'}" data-dk="${p.id}">
    <div class="cost">${p.cost != null && p.cost !== '' ? esc(p.cost) : '·'}</div>
    ${cardPic(p, THUMB.s)}
    <div class="n"><b>${esc(p.name)}${p.treat !== 'base' ? ` <span class="badge">${esc(TREAT[p.treat] || p.treat)}</span>` : ''}</b>
      <span>${esc(p.num)} · ${colsOf(p).join('/')}${p.power ? ' · ' + Number(p.power).toLocaleString() : ''}${
        p.counter ? ' · +' + Number(p.counter).toLocaleString() : ''}${kws.map(k => `<i class="kwtag">${KW_GLYPH[k] ? G(KW_GLYPH[k], 11) + ' ' : ''}${k}</i>`).join('')}${
        own ? ` · <span class="up">own ${own}</span>` : ''}${
        !ok ? ` · <span class="down">${!RULES.MAIN_TYPES.has(p.type) ? p.type + ' — not a main-deck card' : 'off-colour'}</span>` : ''}</span></div>
    <div class="cnt">${adding
      ? `<button data-dkadd="${p.id}" aria-label="Add one ${esc(p.name)}" ${ok ? '' : 'disabled'}>${G('plus', 18)}</button>`
      : `<button data-dkdec="${p.id}" aria-label="One fewer ${esc(p.name)}">${G('minus', 18)}</button><b>${n}</b><button data-dkinc="${p.id}" aria-label="One more ${esc(p.name)}">${G('plus', 18)}</button>`}</div>
  </div>`;
}
function paintDeckAdd() {
  const q = ($('#dkq').value || '').trim().toLowerCase();
  const L = dkCur.leader ? CAT.byId.get(dkCur.leader) : null;
  const ownOnly = $('#dkOwn').dataset.on === '1';
  const ownedIds = new Set(OWN.items.map(i => i.id));
  if (!q && !ownOnly) { $('#dkAddRes').innerHTML = ''; return; }
  /* One row per card NUMBER when adding: the deck cares about the card, the
     collector picks the printing later if they want to value it. Prefer a
     printing they own, else the cheapest. */
  const byNum = new Map();
  for (const p of CAT.rows) {
    if (!p.num || !RULES.MAIN_TYPES.has(p.type)) continue;
    if (q && !(p.full + ' ' + p.num + ' ' + (p.subtypes || '')).toLowerCase().includes(q)) continue;
    if (ownOnly && !ownedIds.has(p.id)) continue;
    const cur = byNum.get(p.num);
    const better = !cur || (ownedIds.has(p.id) && !ownedIds.has(cur.id)) ||
                   (ownedIds.has(p.id) === ownedIds.has(cur.id) && (p.market || 9e9) < (cur.market || 9e9));
    if (better) byNum.set(p.num, p);
  }
  const hits = [...byNum.values()].sort((a, b) => {
    const la = (!L || colourLegal(a, L)) ? 0 : 1, lb = (!L || colourLegal(b, L)) ? 0 : 1;
    return la - lb || a.name.localeCompare(b.name);
  }).slice(0, 30);
  $('#dkAddRes').innerHTML = hits.length ? `<div class="panel">${hits.map(p => deckRow(p, 0, L, true)).join('')}</div>` : '';
}
function deckAdd(id, delta) {
  const p = CAT.byId.get(id); if (!p) return;
  let row = dkCur.cards.find(c => c.id === id);
  if (!row && delta > 0) { row = { id, n: 0 }; dkCur.cards.push(row); }
  if (!row) return;
  const A = analysis(dkCur);
  const numCount = (A.byNum[p.num] || 0) - row.n;   // copies of this NUMBER on other printings
  if (delta > 0 && numCount + row.n + 1 > RULES.MAX_COPIES) {
    toast(`Already ${RULES.MAX_COPIES} of ${p.num} (§5-1-2-3)`); return;
  }
  row.n += delta;
  if (row.n <= 0) dkCur.cards = dkCur.cards.filter(c => c !== row);
  DECKS.save(); paintDeck();
}
CLICKS.on('[data-dkadd],[data-dkinc],[data-dkdec]', e => {
  const a = e.target.closest('[data-dkadd]'); if (a) return deckAdd(+a.dataset.dkadd, 1);
  const i = e.target.closest('[data-dkinc]'); if (i) return deckAdd(+i.dataset.dkinc, 1);
  const d = e.target.closest('[data-dkdec]'); if (d) return deckAdd(+d.dataset.dkdec, -1);
});
$('#dkq').addEventListener('input', paintDeckAdd);
$('#dkBrowse').addEventListener('click', () => { CD.forDeck = true; go('cards'); });
$('#dkOwn').addEventListener('click', () => {   // take 108: a pressed chip, not a drawn box
  const b = $('#dkOwn'), on = b.dataset.on !== '1'; b.dataset.on = on ? '1' : '0';
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); paintDeckAdd();
});
$('#dkName').addEventListener('input', e => { dkCur.name = e.target.value; DECKS.save(); });
/* ---- Leader picker: a sheet, art, colour filter, one row per NUMBER ------ */
let lpColour = null;
function leadersByNumber() {
  const ownedIds = new Set(OWN.items.map(i => i.id));
  const byNum = new Map();
  for (const p of CAT.rows) {
    if (p.type !== 'Leader' || !p.num) continue;
    const cur = byNum.get(p.num);
    const better = !cur || (ownedIds.has(p.id) && !ownedIds.has(cur.id)) ||
                   (ownedIds.has(p.id) === ownedIds.has(cur.id) && (p.market || 9e9) < (cur.market || 9e9));
    if (better) byNum.set(p.num, p);
  }
  return [...byNum.values()];
}
function paintLeaderPick() {
  const q = ($('#lpq').value || '').trim().toLowerCase();
  const ownedIds = new Set(OWN.items.map(i => i.id));
  $('#lpColours').innerHTML = COLORS.map(c =>
    `<button class="chip${lpColour === c ? ' on' : ''}" data-lpc="${c}" aria-label="${esc(c)}" aria-pressed="${lpColour === c}">
       <i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;
          vertical-align:-1px;background:var(--c-${CCLASS[c]})"></i>${c}</button>`).join('');
  let list = leadersByNumber();
  if (q) list = list.filter(p => (p.full + ' ' + p.num + ' ' + (p.subtypes || '')).toLowerCase().includes(q));
  if (lpColour) list = list.filter(p => colsOf(p).includes(lpColour));
  /* owned first, then by set recency, so a tester’s own Leader is at the top */
  list.sort((a, b) => (ownedIds.has(b.id) - ownedIds.has(a.id)) ||
    ((CAT.sets.get(b.set) || {}).pub || '').localeCompare((CAT.sets.get(a.set) || {}).pub || ''));
  $('#lpList').innerHTML = list.slice(0, 40).map(p => `
    <button class="opt" data-lp="${p.id}">
      <div class="oa">${refArt(p)}<div class="ph">${esc((p.num || '').split('-').pop() || '')}</div></div>
      <div class="oi"><b>${esc(p.name)}</b>
        <span>${esc(p.num)} · ${p.life || '?'} life · ${esc((CAT.sets.get(p.set) || {}).abbr || '')}${
          ownedIds.has(p.id) ? ' · <span class="up">you own this</span>' : ''}</span></div>
      <div class="op">${colourDots(p)}</div>
    </button>`).join('') || '<div class="note">No Leader matches.</div>';
}
$('#dkLead').addEventListener('click', () => { $('#lpq').value = ''; lpColour = null; paintLeaderPick(); $('#leaderPick').classList.add('on'); });
$('#lpq').addEventListener('input', paintLeaderPick);
$('#lpCancel').addEventListener('click', () => $('#leaderPick').classList.remove('on'));
CLICKS.on('[data-lpc],[data-lp]', e => {
  const c = e.target.closest('[data-lpc]'); if (c) { lpColour = lpColour === c.dataset.lpc ? null : c.dataset.lpc; paintLeaderPick(); return; }
  const l = e.target.closest('[data-lp]'); if (!l) return;
  dkCur.leader = +l.dataset.lp; DECKS.save();
  $('#leaderPick').classList.remove('on'); paintDeck();
});

/* ---- Printing swap: tap a deck row’s name to choose which printing --------- */
let ppRow = null;
CLICKS.on('.dkrow .n', e => {
  const n = e.target.closest('.dkrow .n'); if (!n) return;
  const row = n.closest('[data-dk]'); if (!row || !dkCur) return;
  const cur = CAT.byId.get(+row.dataset.dk); if (!cur) return;
  const entry = dkCur.cards.find(c => c.id === cur.id); if (!entry) return;
  const sibs = CAT.byNum.get(cur.num) || [];
  if (sibs.length < 2) return toast('Only one printing of ' + cur.num);
  ppRow = entry;
  const ownedQ = id => OWN.items.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0);
  $('#ppTitle').textContent = `Which ${cur.num} is in the deck?`;
  $('#ppList').innerHTML = sibs.slice().sort((a, b) => (b.market || 0) - (a.market || 0)).map(p => `
    <button class="opt${p.id === cur.id ? ' best' : ''}" data-pp="${p.id}">
      <div class="oa">${refArt(p)}<div class="ph">${esc((p.num || '').split('-').pop() || '')}</div></div>
      <div class="oi"><b>${esc(TREAT[p.treat] || p.treat)}${p.prov ? ' · ' + esc(p.prov) : ''}</b>
        <span>${esc((CAT.sets.get(p.set) || {}).abbr || '')}${ownedQ(p.id) ? ` · <span class="up">you own ${ownedQ(p.id)}</span>` : ''}${
          p.id === cur.id ? ' · in the deck now' : ''}</span></div>
      <div class="op mono">${money(p.market)}</div>
    </button>`).join('');
  $('#printPick').classList.add('on');
});
$('#ppCancel').addEventListener('click', () => $('#printPick').classList.remove('on'));
CLICKS.on('[data-pp]', e => {
  const b = e.target.closest('[data-pp]'); if (!b || !ppRow) return;
  const to = +b.dataset.pp;
  const existing = dkCur.cards.find(c => c.id === to && c !== ppRow);
  if (existing) { existing.n += ppRow.n; dkCur.cards = dkCur.cards.filter(c => c !== ppRow); }
  else ppRow.id = to;
  DECKS.save(); $('#printPick').classList.remove('on'); paintDeck();
});
$('#dkSave').addEventListener('click', () => {
  const isNew = !dkCur.saved;
  if (!CREDITS.canSaveDeck(isNew)) {
    toast('A deck save needs a credit \u2014 watch a short ad');
    ADS.show('deck'); return;
  }
  if (isNew) { CREDITS.spendDeck(); dkCur.saved = true; }
  DECKS.save(); scheduleBackup('deck');
  toast(analysis(dkCur).legal ? 'Saved — legal deck' : 'Saved (not yet legal)'); go('decks');
});
$('#dkDelete').addEventListener('click', () => {
  if (!confirm(`Delete "${dkCur.name || 'this deck'}"?`)) return;
  DECKS.list = DECKS.list.filter(d => d !== dkCur); DECKS.save(); go('decks');
});
/* One parser for every deck-list shape in the wild (8.8, take 29):
     "4 OP01-016 Nami"     this app’s export, and Limitless copy-as-text
     "4x OP01-016"         Limitless with the x
     "4xOP01-016"          OPTCG Sim export, no space
     "OP01-016 x4"         the other way round, seen on forums
     "OP01-016"            a bare number means one
   Returns [_, count, number] like a match, or null. */
function parseListLine(raw) {
  const line = raw.trim(); if (!line || line.startsWith('#')) return null;
  const NUM = '((?:OP|ST|EB|PRB|LT|P)-?\\d{0,2}-\\d{3})';
  let m = line.match(new RegExp('^(\\d+)\\s*x?\\s*' + NUM, 'i'));          // 4 NUM · 4x NUM · 4xNUM
  if (m) return [m[0], m[1], m[2]];
  m = line.match(new RegExp('^' + NUM + '\\s*x\\s*(\\d+)', 'i'));          // NUM x4
  if (m) return [m[0], m[2], m[1]];
  m = line.match(new RegExp('^' + NUM + '(?:\\s|$)', 'i'));                     // NUM alone
  if (m) return [m[0], '1', m[1]];
  return null;
}
/* Import the same shape back: lines like "4 OP01-016 Nami" or "4x OP01-016".
   A line that names a number the catalogue does not have is REPORTED, not
   dropped silently; a Leader line sets the Leader. */
$('#dkImport').addEventListener('click', async () => {
  const txt = await ask({ title: 'Import a deck list', kind: 'multiline', ok: 'Import',
    why: 'One card per line, like <b>4 OP01-016 Nami</b>; a Leader line sets the Leader. Unknown lines are listed, not dropped.',
    placeholder: '1 ST01-001 Monkey.D.Luffy\n4 OP01-016 Nami\n4 OP01-025 Roronoa Zoro' });
  if (!txt) return;
  const ownedIds = new Set(OWN.items.map(i => i.id));
  const pickPrinting = num => {
    const sibs = (CAT.byNum.get(num) || []).filter(p => p.num === num);
    if (!sibs.length) return null;
    return sibs.find(p => ownedIds.has(p.id)) ||
           sibs.slice().sort((a, b) => (a.market || 9e9) - (b.market || 9e9))[0];
  };
  let added = 0, unknown = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const m = parseListLine(line);
    if (!m) { unknown.push(line.slice(0, 30)); continue; }
    const n = +m[1], num = m[2].toUpperCase();
    const p = pickPrinting(num);
    if (!p) { unknown.push(num); continue; }
    if (p.type === 'Leader') { dkCur.leader = p.id; continue; }
    let row = dkCur.cards.find(c => c.id === p.id);
    if (!row) { row = { id: p.id, n: 0 }; dkCur.cards.push(row); }
    row.n += n; added += n;
  }
  DECKS.save(); paintDeck();
  toast(`Imported ${added} card${added === 1 ? '' : 's'}` + (unknown.length ? ` · ${unknown.length} unrecognised` : ''));
  if (unknown.length) alert('Not recognised:\n' + unknown.slice(0, 12).join('\n'));
});

/* Export in the community’s plain-text list shape: "4 OP01-016 Nami". */
$('#dkExport').addEventListener('click', () => {
  const A = analysis(dkCur);
  const lines = [`# ${dkCur.name || 'Untitled'}`, A.leader ? `1 ${A.leader.num} ${A.leader.name} (Leader)` : '# no leader', ''];
  A.rows.forEach(r => lines.push(`${r.n} ${r.p.num} ${r.p.name}`));
  lines.push('', `# ${A.total}/50 · ${A.legal ? 'legal' : A.problems.length + ' issues'} · OP TCG Hub`);
  const txt = lines.join('\n');
  if (navigator.share) navigator.share({ title: dkCur.name || 'Deck', text: txt }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(txt); toast('Deck list copied'); }
});

