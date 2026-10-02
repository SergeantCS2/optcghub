/* ---- sim: the table (take 124) ------------------------------------------------------------------------------------
   Take 122 made every move one SIM.act, take 123 gave each seat its view; take 124 draws that view as a table: both
   halves as the play sheet lays them out (the Characters in front; Life, Stage, the Leader, Trash and Deck behind; the
   cost area of DON!!), the cards' hot-linked pictures, the hand as a strip, a dock for the selected card's moves, the
   effect panel, the zoom. The painters below draw from the view alone -- smoke reads every function between their two
   markers -- and the controller after them holds the view it painted, so a tap sends back one of that view's legal
   moves (docs/SIM-UI.md). */
const SIMUI = { sel: null, focus: null, post: null, seen: 0, pre: null, room: null, fxt: null, v: null, sheet: null,
  busy: false, timer: null, hurry: false, pace: 650, press: null, pressed: false, d1: null, d2: null, opp: 'human', first: 0, acted: null,
  wire: { relay: false, on: false },   // take 131: the board's mirror of the wire (ONLINE.mirror), what the painters read of an online match
  legalDecks() { return DECKS.all().filter(d => d.leader && legality(d).problems.length === 0); } };
/* ==== the table's painters (take 124): each draws from the view it is handed and the board's own choices -- what is
   selected, what is aimed -- never from the engine; smoke reads every function from here to SIM_PAINTERS_END, markers
   that survive the build's comment strip ==== */
const SIM_PAINTERS = 'begin';
const SIMKW_GLYPH = { Blocker: 'blocker', Rush: 'rush' };
const SIM_YOU = { activates: 'activate', gives: 'give', plays: 'play', ends: 'end', mulligans: 'mulligan', trashes: 'trash', concedes: 'concede', has: 'have', adds: 'add', counters: 'counter', takes: 'take' };
function simCan(L, pred) { return L.some(pred); }
function simSide(v, seat) { return v.me.seat === seat ? v.me : v.them; }
/* a player's short name: the seat's own word before its deck's name */
function simShort(X) { return String(X.name || '').split(' \u2014 ')[0]; }
/* a turn's start in a few words (take 124): what the engine did at it -- the card drawn, none on the first player's first
   turn (§6-3-1), the DON!! added -- never a move, so never skipped */
function simStartText(s) { return `${s.first ? 'no draw on the first turn' : s.drew ? 'drew\u00a0' + s.drew : 'nothing to draw'} \u00b7 ${s.don ? '+' + s.don + '\u00a0DON!!' : 'no DON!! left to add'}`; }   // a count and its word never broken apart
/* what this seat may still do in its Main Phase, from its legal moves (take 124, the owner: "Ensure if there's an outstanding
   action, the player knows about it"): who can attack, the cards it can play, the abilities ready */
function simOpen(v) { const L = v.legal, uniq = a => [...new Set(a)];
  return { atk: uniq(L.filter(x => x.t === 'attack').map(x => x.ref)), plays: uniq(L.filter(x => x.t === 'play').map(x => x.h)), abil: uniq(L.filter(x => x.t === 'activate').map(x => x.ref)) }; }
function simUnitName(v, ref, own) { const c = ref === 'stage' ? v.me.stage : v.me.chars[ref];
  return ref === 'leader' ? 'your Leader' + (own ? '\u2019s' : '') : esc((c || {}).name || '?') + (own ? '\u2019s' : ''); }
/* a log line as the table says it: against the app the human's own lines in the second person -- the engine writes
   "You ends the turn" (docs/SIM-UI.md, what the pass keeps; the audit's row 2) -- and on the ticker without its turn */
function simSay(line, bare, v) { let t = String(line || '');
  if (v) [v.me, v.them].forEach(X => { const sh = simShort(X); if (X.name && X.name !== sh) t = t.split(X.name).join(sh); });   // a seat by its short name: the deck is named once, on the setup
  const s = t.replace(/^(T\d+ )?You (activates|gives|plays|ends|mulligans|trashes|concedes|has|adds|counters|takes)\b/, (m, t, w) => (t || '') + 'You ' + SIM_YOU[w]);
  return bare ? s.replace(/^T\d+ /, '') : s; }
/* a section number in the Sim's words opens it in the Rules sheet */
function simCite(text) { return esc(text).replace(/§(\d+(?:-\d+)*)/g, (m, id) => `<button class="linkish" data-rules="${id}" style="display:inline;width:auto;padding:0;min-height:0;font:inherit;font-weight:650">§${id}</button>`); }
/* the card a key names in this view: L, S and mK are this seat's Leader, Stage and Characters; oL, oS and oK the other
   seat's; hK a card in this seat's hand; tS.K the K-th card of seat S's trash; xK a card being looked at; cK an effect's
   K-th choice */
function simAt(v, key) { const k = String(key || ''), n = +((k.match(/\d+$/) || ['-1'])[0]);
  if (k === 'L') return v.me.leader; if (k === 'S') return v.me.stage; if (k === 'oL') return v.them.leader; if (k === 'oS') return v.them.stage;
  if (/^m\d+$/.test(k)) return v.me.chars[n] || null; if (/^o\d+$/.test(k)) return v.them.chars[n] || null;
  if (/^h\d+$/.test(k)) return (v.me.hand || [])[n] || null; if (/^x\d+$/.test(k)) return (v.me.looking || [])[n] || null;
  if (/^c\d+$/.test(k)) { const c = v.offer && v.offer.choices && v.offer.choices[n]; return c ? (c.face || simAt(v, c.ref)) : null; }
  const t = k.match(/^t([01])\.(\d+)$/); if (t) return (simSide(v, +t[1]).trash || [])[+t[2]] || null;
  return null; }
/* this seat's move reference for a key: its Leader 'leader', its Stage 'stage', a Character its index */
function simRef(key) { return key === 'L' ? 'leader' : key === 'S' ? 'stage' : /^m\d+$/.test(key) ? +key.slice(1) : null; }
/* a card's face: its hot-linked picture over its own colours, and beneath the picture its name and printed numbers --
   what shows while the picture loads or when it fails; nothing drawn from scratch (landmines 26, 28) */
function simFace(c, big) {
  const a = c.art, cs = c.colours || [], g = a && a.ground ? a.ground : (cs.length ? [`var(--c-${CCLASS[cs[0]]})`, `var(--c-${CCLASS[cs[1] || cs[0]]})`] : ['var(--card2)', 'var(--card)']);
  const src = a ? (big ? a.large : a.thumb) : '', nums = [c.cost, c.printedPower].filter(x => x != null).join(' \u00b7 ');
  return `<span class="sf" style="--a1:${g[0]};--a2:${g[1]}"><span class="sft"><b>${esc(c.name)}</b>${nums ? `<i>${nums}</i>` : ''}</span>${src ? `<img class="${artOk(src).trim()}" src="${esc(src)}" alt="" draggable="false" decoding="async"${big && a.thumb && a.thumb !== src ? ` data-thumb="${esc(a.thumb)}"` : ''} onload="${ART_ONLOAD}" onerror="var t=this.dataset.thumb;if(t){delete this.dataset.thumb;this.src=t}else{this.remove()}">` : ''}</span>`; }
/* upright on a card: its power now (lit above its printed power, red below), its DON!!, its Blocker, Rush and Double
   Attack, and a gold corner when its continuous text is the player's to apply (docs/SIM-UI.md, what the pass keeps) */
function simBadges(c, extra) { const pw = c.power != null ? c.power : null, pp = c.printedPower, kw = c.keywords || [];
  const dir = pw != null && pp != null && pw !== pp ? (pw > pp ? ' up' : ' down') : '';
  const marks = kw.filter(k => SIMKW_GLYPH[k]).map(k => `<i title="${esc(k)}">${G(SIMKW_GLYPH[k], 12)}</i>`).join('') + (kw.includes('Double Attack') ? '<i title="Double Attack">2\u00d7</i>' : '');
  return `${pw != null ? `<span class="pw${dir}">${pw}</span>` : ''}${c.don ? `<span class="dn">+${c.don}</span>` : ''}${marks ? `<span class="kws">${marks}</span>` : ''}${c.unapplied && c.unapplied.length ? '<span class="ya"><span class="vh">its continuous text is yours to apply</span></span>' : ''}${extra || ''}`; }
/* a card on the table, in the hand, a pick or a trash: a button that selects it, or -- when the table asks for a choice
   -- makes that choice (its data-sim is the move's own word) */
function simCardHtml(c, key, o = {}) {
  const lbl = [c.name, c.type === 'Leader' ? 'Leader' : '', c.power != null ? c.power + ' power' : (c.printedPower != null ? c.printedPower + ' power' : ''), c.rested ? 'rested' : '', c.don ? c.don + ' DON!! given' : ''].concat(c.keywords || []).filter(Boolean).join(', ');
  const cls = ['sc', o.cls || '', c.rested ? 'rest' : '', SIMUI.focus === key && !o.nouid ? 'sel' : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-sim="${o.act || 'card:' + key}" data-key="${key}"${c.uid != null && !o.nouid ? ` data-uid="${c.uid}"` : ''} aria-label="${esc(lbl + (o.say ? ' \u2014 ' + o.say : ''))}">${simFace(c) + simBadges(c, o.badge)}</button>`; }
function simSlot(label) { return `<span class="slot" aria-hidden="true">${esc(label || '')}</span>`; }
/* a card back in the game's colours (take 124, the owner's word; landmine 30's exception for the icon, extended): the deck's
   blue, 'ld' a Leader's red, 'dn' a DON!! card's white in black -- the compass over the sea chart, `g-cardart` in the sprite */
function simBack(cls, style) { return `<span class="sb${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}><svg class="cb" aria-hidden="true">${cls === 'dn' ? '<use href="#g-donjp"/>' : '<use href="#g-cardart"/>'}</svg></span>`; }   /* take 126: a DON!! card's back is ドン!! */
/* Life: its card backs lying sideways down the column, with the count; nobody sees a Life card (§3-10) */
function simLifeHtml(X) { const n = X.lifeCount, m = Math.min(n, 6);
  return `<span class="stk life z-life" role="img" aria-label="${n} Life">${m ? Array.from({ length: m }, (_, k) => simBack('lf', `--k:${k};--m:${m}`)).join('') : simSlot('Life')}<span class="cnt">${G('life', 12)}${n}</span></span>`; }
/* the Deck: a stack and its count; nobody looks into a deck (§3-2) */
function simDeckHtml(X) { const n = X.deckCount, m = Math.min(n, 3);
  return `<span class="stk deck" role="img" aria-label="Deck, ${n} cards">${m ? Array.from({ length: m }, (_, k) => simBack('', `top:${(m - 1 - k) * 2}px;height:calc(100% - ${(m - 1) * 2}px);left:${k * 2}px;right:${(m - 1 - k) * 2}px`)).join('') : simSlot('Deck')}<span class="cnt">${n}</span></span>`; }
/* the Trash: its newest card face up, the count, and a tap opens the whole of it (it is public) */
function simTrashPile(X) { const n = X.trash.length, top = n ? X.trash[n - 1] : null;
  return `<button class="stk trash z-trash" data-sim="trash:${X.seat}" aria-label="Trash, ${n} card${n === 1 ? '' : 's'}">${top ? simFace(top) : simSlot('Trash')}<span class="cnt">${n}</span></button>`; }
/* the cost area: a DON!! card each, face up -- active upright, rested turned -- and the DON!! deck, its backs stacked, with
   its count (§3-3, §6-4); a given DON!! is on its card */
function simDonHtml(X) { const d = X.don, m = Math.min(d.deck, 3);
  const deck = m ? `<span class="dkst">${Array.from({ length: m }, (_, k) => simBack('dn', `left:${k * 2}px;top:${(m - 1 - k) * 2}px`)).join('')}</span>` : '';
  return `<span class="tb-don" role="img" aria-label="DON!!: ${d.active} active, ${d.rested} rested, ${d.given} given, ${d.deck} in the DON!! deck">${`<i class="tk">${G('donjp', 14)}</i>`.repeat(d.active)}${`<i class="tk r">${G('donjp', 14)}</i>`.repeat(d.rested)}<span class="dk">${deck}${d.deck}</span></span>`; }
/* what the table asks of each card now, from the view's legal moves: a target to attack, a Blocker, a counter, an
   effect's choice, one of five to trash -- each drawn on the card it names, as that move's own word; in a free Main
   Phase what may act is lit and a tap selects it */
function simTargets(v) { const L = v.legal, t = {}, lit = (key, act, badge, say) => { t[key] = { act, cls: 'aim', badge, say }; };
  if (SIMUI.room) { v.me.chars.forEach((c, k) => { if (L.some(x => x.t === 'play' && x.h === SIMUI.room.h && x.trash === k)) lit('m' + k, 'room:' + k, '<span class="tg">Trash</span>', 'trash it to make room'); }); return t; }
  if (SIMUI.fxt) { v.me.chars.forEach((c, k) => { if (L.some(x => x.t === 'fx' && x.target === SIMUI.fxt.target && x.trash === k)) lit('m' + k, 'fxroom:' + k, '<span class="tg">Trash</span>', 'trash it to make room'); }); return t; }
  if (SIMUI.sel) { L.filter(x => x.t === 'attack' && x.ref === SIMUI.sel.ref).forEach(x => lit(x.target === 'leader' ? 'oL' : 'o' + x.target, 'target:' + x.target, '', 'attack it')); t[SIMUI.sel.ref === 'leader' ? 'L' : 'm' + SIMUI.sel.ref] = { cls: 'sel' }; return t; }
  if (v.offer && !v.offer.hidden && !v.tray && v.offer.choices) v.offer.choices.forEach(c => { if (/^(L|[mo]\d+)$/.test(c.ref) && L.some(x => x.t === 'fx' && x.target === c.ref)) lit(c.ref, 'fx:' + c.ref, '', 'choose it'); });
  L.forEach(x => { if (x.t === 'block') lit('m' + x.k, 'block:' + x.k, '<span class="tg">Block</span>', 'block with it');
    if (x.t === 'counter') lit('h' + x.h, 'counter:' + x.h, `<span class="tg">+${(v.me.hand[x.h] || {}).counter}</span>`, 'counter with it');
    if (x.t === 'cevent') lit('h' + x.h, 'cev:' + x.h, '<span class="tg">Event</span>', 'play it'); });
  if (v.phase === 'main' && !v.offer && !v.battle) L.forEach(x => { const key = x.t === 'play' ? 'h' + x.h : (x.t === 'attack' || x.t === 'activate') ? (x.ref === 'leader' ? 'L' : x.ref === 'stage' ? 'S' : 'm' + x.ref) : null;
    if (key && !t[key]) t[key] = { cls: 'can' }; });
  return t; }
/* a half of the table: this seat's nearest, its Characters towards the middle; the other seat's across it, mirrored --
   the Leader in the middle of each back row, Life on each player's left */
function simHalfHtml(v, X, mine, t) {
  const card = (c, key) => simCardHtml(c, key, t[key] || {});
  const chars = Array.from({ length: 5 }, (_, k) => X.chars[k] ? card(X.chars[k], (mine ? 'm' : 'o') + k) : simSlot(''));
  const L = card(X.leader, mine ? 'L' : 'oL'), S = X.stage ? card(X.stage, mine ? 'S' : 'oS') : simSlot('Stage');
  const back = mine ? [simLifeHtml(X), S, L, simTrashPile(X), simDeckHtml(X)] : [simDeckHtml(X), simTrashPile(X), L, S, simLifeHtml(X)];
  const art = X.leader.art, ground = art ? `<span class="tb-ground" style="--a1:${art.ground[0]};--a2:${art.ground[1]}"><img src="${esc(art.thumb)}" alt="" draggable="false" decoding="async" onerror="this.remove()"></span>` : '';
  const front = `<div class="tb-row front">${chars.join('')}</div>`, rear = `<div class="tb-row back">${back.join('')}</div>`;
  if (mine) return `<div class="tb-half me">${ground}${front}${rear}<div class="tb-foot">${simDonHtml(X)}</div></div>`;
  return `<div class="tb-half them">${ground}<div class="tb-strip"><b>${esc(simShort(X))}</b><span class="tb-hb" role="img" aria-label="${X.handCount} cards in hand">${'<i></i>'.repeat(Math.min(X.handCount, 10))}</span><span>${X.handCount} in hand</span>${simDonHtml(X)}</div>${rear}${front}</div>`; }
/* the table's top bar, while the game fills the screen (the owner, take 124: the header and the mode tabs step aside): Leave
   -- forfeit and back to the app --, whose turn it is, the Rules (on every Prep & Play screen, take 122), the log, the menu */
function simTopHtml(v) { const turn = v.over !== null ? 'The game is over' : v.phase === 'mulligan' ? 'Keep or mulligan' : `Turn ${v.turn}`;
  const W = SIMUI.wire, you = v.bot != null || W.on;   // take 131: online this phone is one seat -- your turn, their turn
  const who = v.over !== null || v.phase === 'mulligan' ? '' : v.active === v.seat ? (you ? 'your turn' : simShort(v.me) + '\u2019s turn')
    : v.who === v.seat ? (you ? 'your move' : simShort(v.me) + ' decides') : W.on ? 'their turn' : simShort(v.them) + (v.bot != null ? ' is playing' : '\u2019s turn');   // take 124: asked in the other's turn
  const wire = !W.on || v.over !== null ? '' : W.lost ? esc(W.lost) : W.pending ? 'sending\u2026' : !W.live ? 'reconnecting\u2026' : W.peer ? '' : 'friend away';   // a finished game owes the wire nothing
  return `<div class="tb-top"><button class="tb-leave" data-sim="leave" aria-label="Leave the table">${G('back', 20)}<span>Leave</span></button><span class="tb-stat"><b>${turn}</b>${who ? ` \u00b7 ${esc(who)}` : ''}${wire ? ` \u00b7 <span class="tb-wire">${wire}</span>` : ''}</span><button class="icb" data-rules="" aria-label="Rules">${G('rules', 22)}</button><button class="icb" data-sim="log" aria-label="The log">${G('log', 22)}</button>${v.over === null ? `<button class="icb" data-sim="menu" aria-label="Game menu">${G('more', 22)}</button>` : ''}</div>`; }
/* the middle of the table: the latest line of the log, a battle's two powers, and End turn with what happens after it; at this
   seat's turn start, until its first move, what the start did (take 124: it was a log line cut short on a phone) */
function simBandHtml(v) { const b = v.battle, endOk = v.legal.some(x => x.t === 'end'), st = v.start, fresh = !b && st && st.i === v.seat && v.active === v.seat && SIMUI.acted !== v.turn;
  const mid = fresh ? `<span class="tb-tick tb-start"><b>${v.bot != null ? 'Your turn' : esc(simShort(v.me)) + '\u2019s turn'} ${v.turn}</b> \u00b7 ${simStartText(st)}</span>` : b ? `<span class="tb-clash" aria-label="${b.powers.a} against ${b.powers.d}"><b>${b.powers.a}</b>${G('sword', 18)}<b>${b.powers.d}</b>${b.counter ? `<span>+${b.counter}</span>` : ''}</span>` : `<span class="tb-tick">${esc(simSay(v.log[0], true, v))}</span>`;
  return `<div class="tb-band">${mid}${endOk ? `<span class="tb-go tb-end"><button class="ghost go" data-sim="end">End turn</button>${v.bot != null ? '' : SIMUI.wire.on ? '<span class="note">then their turn</span>' : '<span class="note">then pass the phone</span>'}</span>` : ''}</div>`; }   // take 124, the owner: against the app End turn needs no "then the app plays"
/* this seat's hand: whole cards in a strip -- lit when it may be played, dimmed when not; the other hand is a count (§3-4) */
function simHandHtml(v, t) { const H = v.me.hand || [];
  return `<div class="tb-hand" role="group" aria-label="Your hand, ${H.length} cards">${H.map((c, h) => { const o = t['h' + h] || {}; return simCardHtml(c, 'h' + h, Object.assign({}, o, { cls: ['hand', o.cls || (c.play && c.play.ok ? '' : 'no')].filter(Boolean).join(' ') })); }).join('') || '<span class="note">No cards in hand</span>'}</div>`; }
/* a card's moves as buttons: exactly those of the view's legal moves that name it (the dock and the zoom both use this) */
function simActsHtml(v, key) { const L = v.legal, ref = simRef(key), out = [];
  if (/^h\d+$/.test(key)) { const h = +key.slice(1); if (L.some(x => x.t === 'play' && x.h === h)) out.push(`<button class="ghost go" data-sim="play:${h}">Play</button>`); }
  if (ref != null) {
    if (L.some(x => x.t === 'attack' && x.ref === ref)) out.push(`<button class="ghost go" data-sim="attack:${ref}">Attack</button>`);
    L.filter(x => x.t === 'activate' && x.ref === ref).forEach((x, k) => out.push(`<button class="ghost" data-sim="fxmain:${ref}${k ? '.' + x.n : ''}">Main${k ? ' ' + (k + 1) : ''}</button>`));
    if (L.some(x => x.t === 'give' && x.ref === ref)) out.push(`<button class="ghost" data-sim="give:${ref}" title="+1000 on your turn">+DON!!</button>`); }
  return out.join(''); }
/* the dock in this seat's Main Phase with nothing selected (take 124): what it can do next -- a card to play, who can attack, an
   ability -- or that only End turn is left; two lines at most on a 360 px phone (the look: three pushed the cards smaller), so giving
   DON!! is left to the card's own moves (+DON!!) and several playable cards are "a card", the lit ones */
function simNextHtml(v) { const o = simOpen(v), me = v.me, parts = [];
  if (o.plays.length) parts.push(`play ${o.plays.length === 1 ? esc(me.hand[o.plays[0]].name) : 'a card'}`);   // each can be played now, not all of them (the look: "play 5 cards" with 5 DON!!)
  if (o.atk.length) { const ch = o.atk.filter(r => r !== 'leader'), who = [o.atk.includes('leader') ? 'your Leader' : '', ch.length === 1 ? simUnitName(v, ch[0]) : ch.length ? ch.length + ' Characters' : ''].filter(Boolean).join(' and ');
    parts.push(`attack with ${who}`); }
  if (o.abil.length) parts.push(o.abil.length === 1 ? `use ${simUnitName(v, o.abil[0], true)} ability` : `use ${o.abil.length} abilities`);
  const first = me.taken <= 1 ? ' \u2014 no attacks on your first turn' : '';
  return `<div class="tb-say tb-next">${parts.length ? `<b>Next:</b> ${parts.join(', ')}, or End turn${first}.` : `<b>Nothing left to play or attack with</b> \u2014 End turn${first}.`}</div>`; }
/* what End turn would leave behind (take 124): an attack, a card to play, an ability -- DON!! left active are not asked
   about: they pay for a [Counter] Event in the other player's turn */
function simLeft(v) { const o = simOpen(v), cap = t => t[0].toUpperCase() + t.slice(1), out = [];
  o.atk.forEach(r => out.push(`${cap(simUnitName(v, r))} can attack`));
  if (o.plays.length) out.push(o.plays.length === 1 ? `You can play ${esc(v.me.hand[o.plays[0]].name)}` : `You can play ${o.plays.length} cards`);
  o.abil.forEach(r => out.push(`${cap(simUnitName(v, r, true))} [Activate: Main] is ready`));
  return out; }
function simEndHtml(v) { return `<div class="tb-menu"><div class="note" style="margin:0">Still possible this turn:</div><ul class="tb-left">${simLeft(v).map(x => `<li>${x}</li>`).join('')}</ul><div class="tb-go"><button class="ghost go" data-sim="end:now">End turn</button><button class="ghost" data-close="simSheet">Keep playing</button></div></div>`; }
/* a decline named for what it does (take 124): a [Trigger]'s card goes to hand instead, an [Activate: Main] is not activated,
   a cost is not paid and its effect does not happen, a "you may" is left -- and a cost that can no longer be paid ends it */
function simSkipHtml(cur, only) { const [w, n] = only ? ['Go on', `its cost cannot be paid now, so the rest does not happen (${simCite('§8-3-1-3')})`] : cur.t === 'trigger' ? ['Add to hand', `instead of its [Trigger] (${simCite('§10-1-5')})`]
    : cur.t === 'main' ? ['Cancel', 'not activated'] : cur.cost && cur.step === 0 ? ['Don\u2019t pay', `then the effect does not happen (${simCite('§8-3')})`] : ['Decline', 'its words let you'];
  return `<button class="ghost" data-sim="fxskip">${w}</button><span class="note">${n}</span>`; }
/* the dock under the hand: the selected card and its moves; the defender's block and counter; the app's defence waiting
   on Resolve; or what the table is waiting for */
function simDockHtml(v) { const L = v.legal, b = v.battle, go = (btn, note) => `<span class="tb-go">${btn}${note != null ? `<span class="note">${note}</span>` : ''}</span>`;
  const hitSay = p => `${p.a} vs ${p.d}${p.a >= p.d ? ': hit' : ': held'}`;
  if (b && v.bot != null && b.def === v.bot && v.who === v.bot) return `<div class="tb-say"><b>The app defends</b> \u2014 ${b.blocked ? 'it blocked' : 'no block'}${b.counter ? `, countered +${b.counter}` : ''}.</div>${go('<button class="ghost go" data-sim="resolve">Resolve</button>', hitSay(b.powers))}`;
  if (v.who !== v.seat) return v.bot != null && v.who === v.bot ? `<div class="tb-say">The app is playing\u2026${v.offer && !v.offer.hidden && v.offer.name ? ` <b>${esc(v.offer.name)}</b>` : ''}</div>${go('<button class="ghost" data-sim="hurry">Hurry</button>', 'its moves at once')}` : `<div class="tb-say">${esc(simShort(simSide(v, v.who)))} decides</div>`;
  if (b && b.def === v.seat && !v.offer) { const D = v.me, tgt = b.target || D.leader;
    const head = `<div class="tb-say"><b>${esc(tgt.name)}</b> is attacked by <b>${esc((b.attacker || v.them.leader).name)}</b>`;
    if (b.step === 'block') return `${head} \u2014 Block step (${simCite('§7-1-2')}): ${L.some(x => x.t === 'block') ? 'tap a lit Blocker, or' : (b.unblockable ? 'the attacker is Unblockable' : 'no active Blocker')}</div>${go('<button class="ghost" data-sim="noblock">No block</button>', 'then the counter step')}`;
    return `${head} \u2014 Counter step (${simCite('§7-1-3')}): ${L.some(x => x.t === 'counter' || x.t === 'cevent') ? 'tap a lit card in your hand, or' : 'No Counter cards in hand'}</div>${go('<button class="ghost go" data-sim="resolve">Resolve</button>', hitSay(b.powers))}`; }
  /* take 124: an effect waiting on this seat is said in the dock as well as the panel */
  if (v.offer && !v.offer.hidden && v.offer.seat === v.seat) { const o = v.offer, n = esc(o.name);
    return `<div class="tb-say tb-next">${v.tray ? `<b>By hand:</b> do what ${n}\u2019s words say with its moves, then <b>Done</b>.` : o.t === 'trigger' ? `<b>A [Trigger] from your Life:</b> use it, or add ${n} to your hand.` : `<b>Next:</b> resolve ${n}\u2019s effect${o.hand ? ' by hand' : ''}.`}</div>`; }
  if (SIMUI.sel) { const a = simAt(v, SIMUI.sel.ref === 'leader' ? 'L' : 'm' + SIMUI.sel.ref); return `<div class="tb-say"><b>${esc(a ? a.name : '')}</b> attacks \u00b7 <span style="color:var(--accent-ink)">choose a target</span></div>${go('<button class="ghost" data-sim="aimx">Cancel</button>')}`; }
  const f = SIMUI.focus && simAt(v, SIMUI.focus);
  if (f) { const acts = simActsHtml(v, SIMUI.focus), why = /^h\d+$/.test(SIMUI.focus) && f.play && !f.play.ok ? simCite(f.play.why) : (f.play && f.play.full ? `five in play: trash one to play it (${simCite('§3-7-6-1')})` : '');
    return `<div class="tb-say"><b>${esc(f.name)}</b>${f.power != null ? ` \u00b7 ${f.power}` : ''}${f.unapplied && f.unapplied.length ? ' \u00b7 its continuous text is yours to apply; the power shown is without it' : ''}${why ? `<span class="tb-why">${why}</span>` : ''}</div>${acts}<button class="ghost" data-sim="zoom:${SIMUI.focus}">Zoom</button>`; }
  return v.phase === 'main' && v.active === v.seat && !v.battle && !v.offer ? simNextHtml(v) : `<div class="tb-say">Tap a card for its moves; hold it to read it.</div>`; }
/* the move a by-hand tray button makes, in a few words */
function simHandLabel(v, a) { const P = v.me, X = a.side === 1 ? v.them : v.me, nm = c => esc((c || {}).name || '?'), at = ref => nm(ref === 'leader' ? X.leader : X.chars[ref]), who = a.side === 1 ? ' (theirs)' : '';
  switch (a.op) {
    case 'draw': return 'Draw 1'; case 'trashhand': return `Trash ${nm(P.hand[a.h])} from hand`; case 'ko': return `K.O. ${nm(X.chars[a.k])}${who}`;
    case 'rest': return `Rest ${at(a.ref)}${who}`; case 'active': return `Set ${at(a.ref)} active`; case 'activedon': return 'Set a DON!! active';
    case 'power': return `${a.v > 0 ? '+' : ''}${a.v} to ${at(a.ref)}${who}`; case 'tohand': return `${nm(X.chars[a.k])}${who} to hand`; case 'bottom': return `${nm(X.chars[a.k])}${who} to deck bottom`;
    case 'givedon': return `Give ${a.from} DON!! to ${nm(a.ref === 'leader' ? P.leader : P.chars[a.ref])}`; case 'adddon': return `Add a DON!!${a.rested ? ', rested' : ''}`; case 'returndon': return 'Return a DON!!';
    case 'lifetohand': return a.end === 'bottom' ? 'Bottom Life to hand' : 'Top Life to hand'; case 'handtolife': return `${nm(P.hand[a.h])} to Life`;
    case 'chartolife': return `${nm(P.chars[a.k])} to Life`; case 'opplifetrash': return 'Trash their Life'; case 'handtotop': return `${nm(P.hand[a.h])} to deck top`; case 'decktolife': return 'Deck top to Life'; case 'mill': return 'Trash deck top';
    case 'play': return `Play ${nm((a.zone === 'trash' ? P.trash : P.hand)[a.k])} from ${a.zone}${a.trash != null ? ', trash ' + nm(P.chars[a.trash]) : ''}`;
    case 'look': return `Look at the top ${v.tray.left.look}`; case 'lookto': return `${nm(P.looking[a.k])} to ${a.to}`;
    default: return a.op; } }
/* a choice drawn as the card it names, its name under it */
function simPick(v, key, act, caption) { const c = simAt(v, key);
  return `<span class="tb-pick">${c ? simCardHtml(c, key, { act, cls: 'aim', nouid: true, say: 'choose it' }) : `<button class="ghost" data-sim="${act}">${esc(caption)}</button>`}<span>${esc(caption)}</span></span>`; }
/* a line's mark says who plays it, not what the tests know (take 126, the owner: "change the proven by test wording or remove
   it/hide it, make it more human if you keep it. Right now it's clear that that's soley AI and for AI/the tests"): nothing when
   the app plays it and a card proof has shown it right; a word asking for a Report when the app plays it with no proof yet;
   "yours" when the app does not play it -- by hand, or proven wrong. The engine's own words (SIM.proofOf) are unchanged */
const SIM_MARK = { proven: '', unproven: 'Not checked yet \u2014 if the app gets it wrong, tap Report', hand: 'Yours to play \u2014 the app can\u2019t do this one', wrong: 'Yours to play \u2014 the app got this one wrong' };
/* the effect the game waits on, for the seat deciding: its words, its mark (SIM_MARK), what the app will do, its choices
   drawn as cards (the field's are lit on the table too), and Report */
function simOfferPanel(v, lead) {
  const cur = v.offer, L = v.legal; if (!cur) return '';
  const badge = SIM_MARK[cur.proof] || '';
  const report = '<button class="linkish" data-sim="report">Report</button>';
  let body;
  if (v.tray) { const moves = L.map((a, k) => ({ a, k })).filter(x => x.a.t === 'hand');
    body = `<div class="note">Only the moves its words name, each logged.</div>${(v.me.looking || []).length ? `<div class="tb-picks">${v.me.looking.map((c, k) => simPick(v, 'x' + k, 'zoom:x' + k, c.name)).join('')}</div>` : ''}<div class="tb-moves">${moves.map(x => `<button class="linkish" data-sim="hop:${x.k}">${simHandLabel(v, x.a)}</button>`).join('') || '<div class="note">No move to make \u2014 its effect is yours to apply as the text says.</div>'}</div>
      <div class="tb-go"><button class="ghost go" data-sim="hdone">Done</button>${report}</div>`; }
  else if (cur.hand) body = `<div class="tb-go"><button class="ghost go" data-sim="fxhand">Resolve by hand</button>${L.some(x => x.t === 'fxskip') ? simSkipHtml(cur) : '<span class="note">it happens in full (' + simCite('§8-1-3-1') + ')</span>'}${report}</div>`;
  else { const fx = L.filter(x => x.t === 'fx'), T = cur.choices, tg = T || [], none = fx.some(x => x.target == null);
    const room = SIMUI.fxt != null ? fx.filter(x => x.target === SIMUI.fxt.target && x.trash != null) : [];
    body = `<div class="note">The app will: ${esc(cur.does)}</div>${cur.steps > 1 ? `<div class="note">step ${cur.step + 1} of ${cur.steps}${cur.cost ? (cur.step === 0 ? ' \u2014 the cost; skipping declines the effect' : ' \u2014 the cost, paid in full once begun') : ''}</div>` : ''}
      ${room.length ? `<div class="fgrp">Five Characters: trash one to make room (${simCite('§3-7-6-1')})</div><div class="note">Tap a lit Character on the table.</div>`
      : (tg.length ? `<div class="fgrp">Choose</div><div class="tb-picks">${tg.map((t, k) => simPick(v, t.face ? 'c' + k : t.ref, 'fx:' + t.ref, t.name)).join('')}</div>` : (T ? '<div class="note">No legal target for this step.</div>' : ''))}
      <div class="tb-go">${none && !room.length ? `<button class="ghost go" data-sim="fxapply">${tg.length ? 'Choose none' : 'Apply'}</button>` : ''}${L.some(x => x.t === 'fxskip') ? simSkipHtml(cur, !fx.length) : cur.step > 0 && cur.cost ? '<span class="note">a cost begun is paid in full (' + simCite('§8-3') + ')</span>' : '<span class="note">it resolves in full (' + simCite('§8-1-3-1') + ')</span>'}${report}</div>`; }
  return `<div class="tb-panel" role="region" aria-label="${esc(cur.name)} effect">${lead || ''}<h3>${esc(cur.name)} \u2014 effect</h3><div class="note">${esc(cur.raw)}</div>${badge ? `<div class="note tb-mark">${badge}</div>` : ''}${body}</div>`; }
/* a battle's result, as the seat reading it may see it (view.last): a Life card named only to its owner (the audit's
   row 1 -- take 123 painted what act() returned) */
function simResultHtml(r) { if (!r) return '';
  return `<h3>${r.gone ? 'Ended' : (r.win ? 'Hit' : 'Held')} \u2014 ${r.a} vs ${r.d}</h3>${r.ko ? `<div class="note">${esc(r.ko)} K.O.\u2019d</div>` : ''}${r.life.map(l => l.name ? `<div class="note">Life card ${l.banished ? 'banished' : 'to hand'}: <b>${esc(l.name)}</b></div>` : '<div class="note">A Life card went to its hand</div>').join('')}`; }
/* the panel over the hand: the result the defender reads before handing back, a sixth Character's choice, the effect
   waiting, or who is deciding it */
function simPanelHtml(v) { const lead = SIMUI.post ? simResultHtml(v.last) : '';
  if (v.offer && v.legal.length) return simOfferPanel(v, lead);
  if (SIMUI.post) return `<div class="tb-panel">${lead}<div class="tb-go"><button class="ghost go" data-sim="post">Hand back</button><span class="note">to ${esc(simShort(v.them))}</span></div></div>`;
  if (SIMUI.room) return `<div class="tb-panel slim"><h3>Five Characters</h3><div class="note">Choose one to trash to make room (${simCite('§3-7-6-1')}) \u2014 a rule, not a K.O. Tap a lit Character.</div><div class="tb-go"><button class="ghost" data-sim="roomx">Cancel</button></div></div>`;
  if (v.offer && v.offer.hidden) return `<div class="tb-panel slim"><div class="note">${esc(simShort(simSide(v, v.offer.seat)))} decides on a Life card\u2019s [Trigger].</div></div>`;
  return ''; }
/* the zoom: the card at its largest, what it is now, its words line by line with what the app does and each line's mark,
   the continuous text that is the player's to apply, and its moves */
function simZoomHtml(v, key) { const c = simAt(v, key); if (!c) return '<div class="note">That card is no longer there.</div>';
  const kw = c.keywords || c.kw || [], gained = c.granted || [], acts = /^(L|S|m\d+|h\d+)$/.test(key) ? simActsHtml(v, key) : '';
  const pw = c.power != null ? `${c.power} power${c.printedPower != null && c.power !== c.printedPower ? ' (printed ' + c.printedPower + ')' : ''}` : (c.printedPower != null ? c.printedPower + ' power' : '');
  return `<div class="zm"><div class="zm-art">${simFace(c, true)}</div><div class="zm-info"><h3 class="zm-name">${esc(c.name)}</h3>
    <div class="zm-stats">${[c.num, c.type, c.cost != null ? 'cost ' + c.cost : '', pw, c.counter ? 'counter +' + c.counter : '', c.don ? c.don + ' DON!! given' : '', c.rested ? 'rested' : ''].filter(Boolean).map(esc).join(' \u00b7 ')}</div>
    ${kw.length ? `<div class="zm-kw">${kw.map(k => `<span class="kwtag">${esc(k)}${gained.includes(k) ? ' \u00b7 gained' : ''}</span>`).join('')}</div>` : ''}
    ${c.text ? `<div class="zm-text">${esc(c.text)}</div>` : ''}
    ${(c.lines || []).map(l => { const mk = l.proof === 'unproven' ? 'Not checked yet' : SIM_MARK[l.proof];   /* Report is the effect panel's, not the zoom's */
      return `<div class="zm-line">${mk ? `<div class="note">${esc(mk)}</div>` : ''}${l.proof === 'hand' || l.proof === 'wrong' ? '' : `<div class="note">The app will: ${esc(l.does)}</div>`}</div>`; }).join('')}
    ${c.unapplied && c.unapplied.length ? `<div class="why">Yours to apply: ${c.unapplied.map(esc).join(' ')} The power shown is without it.</div>` : ''}
    ${c.play && !c.play.ok ? `<div class="note">${simCite(c.play.why)}</div>` : ''}
    ${acts ? `<div class="tb-go">${acts}</div>` : ''}</div></div>`; }
/* the log, newest first, each line as the table says it */
function simLogHtml(v, n) { const lines = v.log.slice(0, n || v.log.length);
  return `<div class="tb-log">${lines.map(l => `<div class="ll">${esc(simSay(l, false, v))}</div>`).join('') || '<div class="note">\u2014</div>'}</div><button class="linkish" data-sim="sharelog">Share the log</button>`; }
/* a trash, newest first; each card opens its zoom */
function simTrashSheetHtml(v, seat) { const X = simSide(v, seat), n = X.trash.length;
  return `<div class="tb-grid">${X.trash.map((c, i) => simCardHtml(c, `t${seat}.${i}`, { act: `zoom:t${seat}.${i}`, nouid: true })).reverse().join('') || '<div class="note">Nothing in this trash yet.</div>'}</div>${n ? `<div class="note">${n} card${n === 1 ? '' : 's'}, public to both players.</div>` : ''}`; }
/* the game's menu: concede, a new game, the log to share */
function simMenuHtml(v) { return `<div class="tb-menu"><div class="tb-go"><button class="ghost" data-sim="concede">Forfeit</button><span class="note">${esc(simShort(simSide(v, v.seat)))} loses (${simCite('§1-2-3')}); the table stays</span></div><div class="tb-go"><button class="ghost" data-sim="sharelog">Share the log</button></div></div>`; }
/* leaving the table: a game still on is forfeited first, and said so; a game over just closes */
function simLeaveHtml(v) { return `<div class="tb-menu"><div class="note" style="margin:0">${v.over !== null ? 'The game is over. Leave the table and go back to the app?' : `Leaving forfeits this game: ${esc(simShort(simSide(v, v.seat)))} loses (${simCite('§1-2-3')}). The table closes and the app comes back.`}</div><div class="tb-go"><button class="ghost go" data-sim="leavenow">${v.over !== null ? 'Leave' : 'Forfeit & leave'}</button><button class="ghost" data-close="simSheet">Keep playing</button></div></div>`; }
/* beside the table on a wide screen: the selected card read in full, and the log */
function simSideHtml(v) { return `<aside class="tb-side" aria-label="The card and the log">${SIMUI.focus && simAt(v, SIMUI.focus) ? simZoomHtml(v, SIMUI.focus) : '<div class="note">Tap a card to read it here.</div>'}<h3 class="tb-sh">Log</h3>${simLogHtml(v, 40)}</aside>`; }
/* the table in play */
function simTableHtml(v) { const t = simTargets(v);
  return `${simTopHtml(v)}<div class="tb-mat">${simHalfHtml(v, v.them, false, t)}${simBandHtml(v)}${simHalfHtml(v, v.me, true, t)}<svg class="tb-lines" aria-hidden="true"></svg></div>${simHandHtml(v, t)}<div class="tb-dock${v.who === v.seat || (v.bot != null && v.battle && v.battle.def === v.bot && v.who === v.bot && v.battle.step === 'counter' && !SIMUI.busy) ? ' you' : ''}">${simDockHtml(v)}</div>${simPanelHtml(v)}${simSideHtml(v)}`; }
/* the mulligan: this seat's Leader and five cards large, keep or redraw once */
function simMulliganHtml(v) { const M = v.me;
  return `${simTopHtml(v)}<div class="tb-mull"><h3>${esc(simShort(M))} \u2014 keep or mulligan?</h3><div class="note">Redraw once, the first player deciding first (${simCite('§5-2-1-6')}). Hold a card to read it.</div>
    <div class="tb-mrow">${simCardHtml(M.leader, 'L', { act: 'zoom:L', nouid: true })}<div class="tb-mhand">${M.hand.map((c, h) => simCardHtml(c, 'h' + h, { act: 'zoom:h' + h })).join('')}</div></div>
    <div class="tb-go"><button class="ghost go" data-sim="keep:${v.seat}">Keep</button><button class="ghost" data-sim="mull:${v.seat}">Mulligan (once)</button></div></div>`; }
/* the end: the winner's Leader, the line that ended it, a new game and the log */
function simOverHtml(v) { const W = v.over === -1 ? null : simSide(v, v.over);
  return `${simTopHtml(v)}<div class="tb-over">${W ? `<div class="tb-win">${simFace(W.leader, true)}</div>` : ''}<h3>${v.over === -1 ? 'A draw \u2014 both lose at once (§9-2-1)' : esc(simShort(W)) + ' wins'}</h3>${W && W.name !== simShort(W) ? `<div class="note tb-deck">${esc(W.name.split(' \u2014 ').slice(1).join(' \u2014 '))}</div>` : ''}<div class="note">${esc(simSay(v.log[0] || '', false, v))}</div><div class="tb-go"><button class="ghost go" data-sim="new">New game</button><button class="ghost" data-sim="sharelog">Share the log</button></div>${simLogHtml(v, 12)}</div>`; }
/* a new game: the two Leaders face to face over the decks chosen, then the choices */
function simSetupHtml(decks) { const ds = decks, i1 = Math.max(0, ds.findIndex(x => x.d.id === (SIMUI.d1 || SIMUI.pre))), i2 = SIMUI.d2 != null && ds.findIndex(x => x.d.id === SIMUI.d2) >= 0 ? ds.findIndex(x => x.d.id === SIMUI.d2) : Math.min(1, ds.length - 1);
  const bot = SIMUI.opp === 'bot', face = (x, who) => `<div class="vsl">${x && x.face ? simFace(x.face, true) : simBack('ld')}<b>${esc(who)}</b><span>${esc(x ? x.d.name || 'Untitled' : '')}</span></div>`;
  if (SIMUI.wire.on) return simOnlineHtml(ds);   // take 131: a room is on -- the lobby is the whole setup
  return `${ds.length ? `<div class="tb-vs">${face(ds[i1], 'Player 1')}<span class="vsx">VS</span>${face(ds[i2], bot ? 'The app' : 'Player 2')}</div>` : ''}<div class="panel"><h3>New game</h3>
      <div class="note">Two players, one phone, or you against the app. The app keeps the rules of the Comprehensive Rules v${SIM.RULES} \u2014 phases, DON!!, cost, the Character and Stage limits, who may attack whom, block, counter, damage, Life, defeat. Card effects the app understands run from their text; every other effect is offered at its moment for you to resolve <b>by hand</b>, with only the moves its words name.</div>
      ${ds.length ? `<div class="fgrp">Player 1 deck</div><select id="simD1" aria-label="Player 1 deck">${ds.map((x, i) => `<option value="${i}" ${i === i1 ? 'selected' : ''}>${esc(x.d.name || 'Untitled')}</option>`).join('')}</select>
      <div class="fgrp">${bot ? 'The app\u2019s deck' : 'Player 2 deck'}</div><select id="simD2" aria-label="Player 2 deck">${ds.map((x, i) => `<option value="${i}" ${i === i2 ? 'selected' : ''}>${esc(x.d.name || 'Untitled')}</option>`).join('')}</select>
      <div class="fgrp">Opponent</div><select id="simOpp" aria-label="Opponent"><option value="human"${bot ? '' : ' selected'}>A friend \u2014 pass the phone</option><option value="bot"${bot ? ' selected' : ''}>The app \u2014 legal and not clever; it never sees your hand</option></select>
      <div class="fgrp">Goes first (rock-paper-scissors is yours, §5-2-1-4)</div><select id="simFirst" aria-label="Who goes first"><option value="0"${SIMUI.first ? '' : ' selected'}>Player 1</option><option value="1"${SIMUI.first ? ' selected' : ''}>${bot ? 'The app' : 'Player 2'}</option></select>
      <div class="row" style="margin-top:14px"><button class="ghost go" data-sim="start" style="padding:10px 18px">Deal</button></div>`
      : `<div class="note" style="margin-top:10px">No legal deck yet \u2014 build one in <b>Decks</b> (a Leader and exactly fifty cards) and it appears here.</div>`}</div>${simOnlineHtml(ds)}`; }
/* Play online (take 131, D18): the setup's second panel -- host a match or join one -- and, while a room is on, the
   lobby: the code to read out, who is here, the decks, the host's Deal. Painted from SIMUI.wire, the board's mirror of
   the wire; nothing here is painted when the build carries no relay (never a dead button). */
function simOnlineHtml(ds) { const w = SIMUI.wire; if (!w.relay) return '';
  const deckSel = ds.length ? `<div class="fgrp">Your deck</div><select id="simDO" aria-label="Your deck for the online match">${ds.map((x, i) => `<option value="${i}"${x.d.id === w.deckId ? ' selected' : ''}>${esc(x.d.name || 'Untitled')}</option>`).join('')}</select>` : '<div class="note">No legal deck yet.</div>';
  if (!w.on) return `<div class="panel" id="simOnline"><h3>Play online</h3><div class="note">Host a match and read your friend the code, or type theirs. Who goes first is the deal\u2019s coin (${simCite('§5-2-1-4')}). Both phones hold the whole deal, so this is for friends, not strangers: a changed app could read your hand, never break the rules. Only the code, the two deck lists and the moves leave the phone.</div>${deckSel}
    <div class="row" style="margin-top:12px;gap:10px"><button class="ghost go" data-sim="host" style="padding:10px 18px"${ds.length ? '' : ' disabled'}>Host a match</button>${w.kept ? `<button class="ghost" data-sim="resume" style="padding:10px 18px">Back to ${esc(w.kept)}</button>` : ''}</div>
    <div class="fgrp">Or join with a code</div><div class="row" style="gap:8px"><input id="simCode" aria-label="The match code" placeholder="ABC234" maxlength="7" autocapitalize="characters" autocomplete="off" spellcheck="false" style="flex:1;min-width:0;text-transform:uppercase;letter-spacing:.12em"><button class="ghost" data-sim="join" style="padding:10px 18px"${ds.length ? '' : ' disabled'}>Join</button></div></div>`;
  const me = w.seat === 0 ? 'Player 1, the host' : 'Player 2', theirs = w.deckTheirs ? esc(w.deckTheirs.name || 'a deck') : null;
  const status = w.lost ? `<b>The match ended:</b> ${esc(w.lost)}` : !w.live ? 'connecting to the relay\u2026' : w.seat === 0 ? (w.peer ? 'your friend is here' : 'waiting for your friend to join\u2026') : (w.peer ? 'the host is here' : 'waiting for the host\u2026');
  return `<div class="panel" id="simOnline"><h3>Play online</h3>${w.seat === 0 && w.code ? `<div class="tb-code" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0"><span class="note" style="margin:0">Read this code to your friend</span><b class="mono" style="font-size:var(--fs-hero);letter-spacing:.18em">${esc(w.code)}</b><button class="ghost" data-sim="sharecode" style="padding:8px 14px">Share the code</button></div>` : `<div class="note" style="margin:0 0 8px">${w.code ? `Joined <b class="mono">${esc(w.code)}</b>` : 'asking the relay for a code\u2026'}</div>`}
    <div class="note" style="margin:0 0 8px">You are ${me} \u00b7 ${status}</div>${deckSel}<div class="note" style="margin:8px 0 0">${theirs ? `Their deck: ${theirs}` : 'Their deck: not chosen yet'}</div>
    <div class="row" style="margin-top:12px;gap:10px">${w.seat === 0 && !w.lost ? `<button class="ghost go" data-sim="deal" style="padding:10px 18px"${w.peer && w.deckTheirs && w.deckId != null ? '' : ' disabled'}>Deal</button>` : ''}<button class="ghost" data-sim="leaveonline" style="padding:10px 18px">${w.lost ? 'Close' : 'Cancel'}</button></div></div>`; }
const SIM_PAINTERS_END = 'end';   /* ==== the painters' end ==== */

/* ==== the table's controller (take 124): it paints the view of the seat whose screen it is, keeps that view, and sends
   back only its legal moves; the app's moves come one at a time; what moved is drawn moving ==== */
/* whose screen: the defender reading a result, the human against the app, else whoever the game waits on */
function simSeat() { const g = SIM.g; if (ONLINE.playing()) return ONLINE.sess.seat; if (SIMUI.post) return SIMUI.post.i; if (g.bot != null) return 1 - g.bot; const w = SIM.who(); return w == null ? g.active : w; }
function simWhy() { const g = SIM.g; if (g.phase === 'mulligan') return 'keep or mulligan'; if (g.queue.length) return 'an effect to resolve';
  if (g.phase === 'battle') return 'an attack is coming \u2014 block or counter'; return `turn ${g.turn}`; }
/* the header's line under the title: the setup's words, or whose turn it is */
function simSubText(v) { if (!v) return 'rules by the app \u00b7 effects from the text, or by hand';
  if (v.over !== null) return 'the game is over'; if (v.phase === 'mulligan') return 'keep or mulligan';
  const mine = v.active === v.seat; return `turn ${v.turn} \u00b7 ${mine ? (v.bot != null ? 'your turn' : simShort(v.me) + '\u2019s turn') : simShort(v.them) + (v.bot != null ? ' is playing' : '\u2019s turn')}`; }
/* the app's moves one at a time, each painted, while the browser can draw them: not under reduced motion, not in a
   harness without a frame clock, not once Hurry is tapped */
function simPaced() { return !SIMUI.hurry && typeof requestAnimationFrame === 'function' && !reducedMotion(); }
/* Against the app there is nothing to hide: no curtain, the app just moves -- one move a beat (take 124; take 123 ran
   them all inside the tap). The human's attack stops before the damage, so its block and counter are on the table when
   the human taps Resolve. */
function simBotRun() { const g = SIM.g; if (!g || g.bot == null) return; clearTimeout(SIMUI.timer); SIMUI.timer = null;
  const hold = () => SIM.g.phase === 'battle' && SIM.g.battle && SIM.g.battle.att !== SIM.g.bot ? ['resolve'] : [];
  if (!simPaced()) { for (let guard = 0; SIM.who() === g.bot && guard < 400; guard++) if (!BOT.move(g.bot, hold())) break; SIMUI.busy = false; SIMUI.hurry = false; return; }
  if (SIM.who() !== g.bot) { SIMUI.busy = false; return; }
  SIMUI.busy = true;
  const step = () => { SIMUI.timer = null;
    if (SIM.g !== g || SIM.who() !== g.bot || !BOT.move(g.bot, hold())) { SIMUI.busy = false; SIMUI.hurry = false; paintSim(); return; }
    paintSim(); if (!simPaced()) { simBotRun(); paintSim(); return; } SIMUI.timer = setTimeout(step, SIMUI.pace); };
  SIMUI.timer = setTimeout(step, Math.round(SIMUI.pace * 0.6)); }
/* the hand-over between two people: the next player's name over their own Leader (public), nothing of either hand */
function simCurtain(text, sub, L) { if (SIM.g && SIM.g.bot != null) return; const c = $('#simCurtain'), [who, ...deck] = String(text || '').split(' \u2014 ');
  c.innerHTML = `${L && L.art ? `<div class="cur-art" aria-hidden="true"><img src="${esc(L.art.thumb)}" alt="" onerror="this.remove()"></div><div class="cur-card" aria-hidden="true"><img src="${esc(L.art.large || L.art.thumb)}" alt="" onerror="this.remove()"></div>` : ''}<div class="big" style="font-size:var(--fs-head);margin-bottom:8px">Hand the phone to</div><h2 style="font-size:var(--fs-hero);margin:0 0 6px">${esc(who)}</h2>${deck.length ? `<div class="note" style="margin:0 0 10px">${esc(deck.join(' \u2014 '))}</div>` : ''}<div class="note">${esc(sub || 'tap when you have it')}</div>`; c.classList.add('on'); }
/* one tap, one act; then the hand-over the rules imply: a new decider means the curtain (or the app's move) */
function simAct(i, a) { if (ONLINE.playing()) return ONLINE.move(i, a);   // take 131: over the wire, applied on the relay's echo
  const g = SIM.g, before = SIM.who(), turn = g && g.turn; const r = SIM.act(i, a);
  if (!r.ok) { if (r.why) toast(r.why); return r; }
  SIMUI.acted = turn;   // take 124: the band says the turn's start until its first move
  SIMUI.sel = null; SIMUI.room = null; SIMUI.fxt = null; SIMUI.focus = null;
  if (a.t === 'resolve' && g.bot == null) SIMUI.post = { i };   // two on one phone: the defender reads the result before the phone goes back
  simAfter(before); return r; }
function simAfter(before) { const g = SIM.g; if (!g || g.over !== null || SIMUI.post) return; if (ONLINE.playing()) return; if (g.bot != null) return simBotRun();
  const w = SIM.who(); if (w != null && w !== before) simCurtain(SIM.P(w).name, simWhy(), SIM.view(w).me.leader); }
/* The board is drawn from the view its seat is handed (take 123) and kept (take 124): SIM.view(seat) holds what that seat
   may see, and its legal moves. No painter reads the engine's state, so the table cannot show what the seat was never
   given (smoke holds that line; docs/SIM-UI.md). */
function paintSim() { const box = $('#simBoard'); if (!box) return;
  const before = simSnap(box), v = SIM.g ? SIM.view(simSeat()) : null; SIMUI.v = v;
  box.classList.toggle('table', !!v); const sub = $('#simSub'); if (sub) sub.textContent = simSubText(v);
  if (!v) box.innerHTML = simSetupHtml(SIMUI.legalDecks().map(d => ({ d, face: d.leader ? SIM.face(d.leader) : null })));
  else if (v.over !== null) box.innerHTML = simOverHtml(v);
  else if (v.phase === 'mulligan') box.innerHTML = simMulliganHtml(v);
  else box.innerHTML = simTableHtml(v);
  simFit(); simMotion(before, v); simReveal(v); simDecor(v); if (SIMUI.sheet && $('#simSheet').classList.contains('on')) simSheetPaint(); }
/* the card size from the space: the table's height is a straight line in --cw, so two trial sizes give it and the largest
   card that fits is solved for; its width is the five columns (and, from 640 px, the hand's column beside them, from 1000
   px the side panel too). Then the hand: the space left for it, all of it used (the owner, take 124: "using the screen
   space as optimally as possible") */
function simFit() { const b = $('#simBoard');
  if (!b || !b.classList.contains('table') || typeof b.getBoundingClientRect !== 'function' || typeof getComputedStyle !== 'function' || typeof innerHeight !== 'number') return;
  try { const W = document.documentElement.clientWidth, sec = $('#sim'), padB = parseFloat(getComputedStyle(sec).paddingBottom) || 0, wide = W >= 640;
    const H = innerHeight - (b.getBoundingClientRect().top + (window.scrollY || 0)) - padB, hand = b.querySelector('.tb-hand');
    const side = W >= 1000 ? Math.round(Math.max(280, Math.min(400, W * 0.24))) : 0; b.style.setProperty('--side', side + 'px');
    b.style.removeProperty('--hw'); if (hand) { hand.classList.remove('fit'); hand.style.removeProperty('padding-left'); hand.style.removeProperty('padding-right'); }
    const tall = cw => { b.style.setProperty('--cw', cw + 'px'); return b.getBoundingClientRect().height; };
    const h60 = tall(60), h80 = tall(80), k = (h80 - h60) / 20, o = h60 - 60 * k;
    const byW = wide ? (W - 66 - side) / 6.2 : (W - 48) / 5, byH = k > 0 ? (H - o) / k : byW;
    /* the mulligan and the end are not the table: their cards wrap, so the table's line does not hold; the size take 124 first had */
    if (!b.querySelector('.tb-mat')) { b.style.setProperty('--cw', Math.max(44, Math.min(92, Math.floor(wide ? (W - 88 - side) / 7.24 : byW))) + 'px'); return; }
    const cw = Math.max(44, Math.min(140, Math.floor(Math.min(byW, byH)))); b.style.setProperty('--cw', cw + 'px');
    const n = hand ? hand.querySelectorAll('.sc').length : 0; if (!n) return;
    /* the hand's space: on a phone the strip under the table and the height the table leaves; from 640 px its column */
    const cs = getComputedStyle(hand), px = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0), py = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const hr = hand.getBoundingClientRect(), slack = wide ? 0 : Math.max(0, H - b.getBoundingClientRect().height - 4), Wh = hr.width - px, Hh = hr.height - py + slack;
    /* all of it at once, at the largest card the space holds: in rows twelve apart (room for a lifted card), a row's cards
       six apart or, held like a hand, each over the last with a strip of its own -- 44 px at least and two fifths of the
       card, its cost and counter in it (take 108's measure: every control a 44 px square of its own) */
    const cap = cw * (wide ? 2 : 2.2), floor = Math.max(56, cw * (wide ? 0.7 : 0.85));
    let best = null; for (let rows = 1; rows <= (wide ? n : 2); rows++) { const per = Math.ceil(n / rows), a = Wh / (1 + 0.4 * (per - 1));
      const w = Math.floor(Math.min((Hh - (rows - 1) * 12 - 6) / rows / 1.397, per === 1 ? Wh : a >= 110 ? a : Wh - 44 * (per - 1), cap));
      if (!best || w > best.w) best = { rows, per, w }; }
    if (best.w >= floor) { const { per, w } = best, step = per > 1 ? Math.floor(Math.min(w + 6, (Wh - w) / (per - 1))) : w + 6, row = w + (per - 1) * step;
      hand.classList.add('fit'); b.style.setProperty('--hw', w + 'px'); hand.style.setProperty('--hx', Math.min(w, step - 6 * (step >= w + 6)) + 'px');
      /* a row is exactly its cards and two pixels to spare, so a line breaks after `per` of them and never a fraction early */
      hand.style.paddingLeft = hand.style.paddingRight = Math.max(0, Math.floor((hr.width - row) / 2) - 1) + 'px';
      /* a shorter last row spreads its cards over the width a full row takes, overlapping only as much as it must */
      const last = n - per * (Math.ceil(n / per) - 1), lastStep = last > 1 ? Math.floor(Math.min(w + 6, (row - w) / (last - 1))) : step;
      hand.querySelectorAll('.sc').forEach((e, i) => { const s = i >= n - last ? lastStep : step, top = i === n - 1 || i % per === per - 1;   // the last of a row lies on top, whole
        e.style.marginLeft = i % per ? (s - w - 6) + 'px' : '0'; e.style.setProperty('--hx', (top ? w : Math.min(w, s - 6 * (s >= w + 6))) + 'px'); }); return; }
    /* too many to show at once at a card worth reading: a phone's strip scrolls sideways, as tall as the height left allows; a
       column fills its width and scrolls down */
    if (!wide) { if (slack > 4) b.style.setProperty('--hw', Math.floor(Math.min(cw * 1.45, cw * 1.12 + slack / 1.397)) + 'px'); return; }
    const per = Math.max(1, Math.floor((Wh + 6) / (floor + 6))); b.style.setProperty('--hw', Math.floor(Math.min(cap, (Wh - (per - 1) * 6) / per)) + 'px'); } catch (e) {} }
/* before a repaint: where each card on the table stood, and the view it showed */
function simSnap(box) { const v = SIMUI.v; if (!v || !box || typeof box.querySelectorAll !== 'function' || typeof box.getBoundingClientRect !== 'function') return null;
  try { const at = new Map(), rect = sel => { const e = box.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
    box.querySelectorAll('.tb-mat [data-uid]').forEach(e => at.set(e.dataset.uid, { r: e.getBoundingClientRect(), html: e.outerHTML, mine: !!e.closest('.me') }));
    return { v, at, trash: { me: rect('.me .z-trash'), them: rect('.them .z-trash') }, life: { me: rect('.me .z-life'), them: rect('.them .z-life') }, hand: { me: rect('.tb-hand'), them: rect('.tb-hb') }, deck: { me: rect('.me .deck'), them: rect('.them .deck') } }; }
  catch (e) { return null; } }
/* after it, what changed is drawn moving: a card dealt in, a card sliding to its new place, a card turning to rest or back,
   a card that left the table going to its trash, a Life card leaving its stack, a DON!! landing, a power changing, a new
   turn's banner, an attacker's lunge. Reduced motion, a hand-over (the table turned to the other seat), or a harness
   without the browser's animations draws none of it. */
function simMotion(b, v) { const box = $('#simBoard');
  if (!b || !v || !box || b.v.seat !== v.seat || b.v.over !== null || reducedMotion() || typeof Element === 'undefined' || !Element.prototype.animate) return;
  try { const E = [...box.querySelectorAll('.tb-mat [data-uid]')], now = new Map(E.map(e => [e.dataset.uid, e]));
    const cards = x => { const m = new Map(); [x.me, x.them].forEach(X => [X.leader, X.stage, ...X.chars].forEach(c => { if (c) m.set(String(c.uid), c); })); return m; };
    const old = cards(b.v), cur = cards(v), ease = 'cubic-bezier(.4,0,.2,1)';
    for (const e of E) { const uid = e.dataset.uid, o = b.at.get(uid), was = old.get(uid), c = cur.get(uid);
      if (!o) { e.animate([{ transform: 'translateY(-16px) scale(1.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' }); continue; }
      const r = e.getBoundingClientRect(), dx = o.r.left - r.left, dy = o.r.top - r.top;
      if (Math.abs(dx) + Math.abs(dy) > 2) e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 280, easing: ease });
      if (!was || !c) continue; const f = e.querySelector('.sf'), p = e.querySelector('.pw'), d = e.querySelector('.dn');
      if (f && was.rested !== c.rested) f.animate(c.rested ? [{ transform: 'none' }, { transform: 'rotate(90deg) scale(.715)' }] : [{ transform: 'rotate(90deg) scale(.715)' }, { transform: 'none' }], { duration: 280, easing: ease });
      if (p && was.power !== c.power) p.animate([{ transform: 'translateX(-50%) scale(1.6)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 380, easing: 'ease-out' });
      if (d && c.don > was.don) d.animate([{ transform: 'translateY(-18px) scale(1.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    for (const [uid, o] of b.at) if (!now.has(uid)) simGhost(o.html, o.r, (o.mine ? b.trash.me : b.trash.them) || o.r, 0);
    ['me', 'them'].forEach(s => { const lost = b.v[s].lifeCount - v[s].lifeCount; for (let k = 0; k < lost && b.life[s]; k++) simGhost(simBack(), b.life[s], b.hand[s] || b.life[s], k * 140); });
    if (v.turn !== b.v.turn) { simBanner(v);
      /* the turn's start (take 124): its card goes from the deck to the hand, its new DON!! land in the cost area one by one */
      const st = v.start, s = st && (st.i === v.seat ? 'me' : 'them');
      if (st && st.drew && b.deck && b.deck[s]) simGhost(simBack(), b.deck[s], b.hand[s] || b.deck[s], 180);
      if (st && st.don) [...box.querySelectorAll(`.tb-half.${s} .tb-don .tk`)].filter(e => !e.classList.contains('r')).slice(-st.don)
        .forEach((e, k) => e.animate([{ transform: 'translateY(-14px) scale(1.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 300 + k * 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })); }
    if (v.battle && !b.v.battle && v.battle.attacker) { const e = now.get(String(v.battle.attacker.uid)); if (e) e.animate([{ transform: 'none' }, { transform: `translateY(${v.battle.att === v.seat ? -16 : 16}px) scale(1.08)` }, { transform: 'none' }], { duration: 440, easing: 'ease-out' }); }
  } catch (e) {} }
/* a Leader the first time it shows this game turns over from its red back, as players reveal their Leaders to start (the owner,
   take 124: "red for leaders") -- once for each; under reduced motion, or turned to rest already, it is simply face up */
function simReveal(v) { const box = $('#simBoard'); if (!v || !box || v.over !== null) return;
  const shown = SIMUI.shown || (SIMUI.shown = new Set());
  (v.phase === 'mulligan' ? [['L', v.me.seat]] : [['L', v.me.seat], ['oL', v.them.seat]]).forEach(([key, seat]) => { if (shown.has(seat)) return; shown.add(seat);   // the mulligan shows the deciding seat's Leader, the table both
    const e = typeof box.querySelector === 'function' && box.querySelector(`[data-key="${key}"]`);
    if (!e || reducedMotion() || typeof Element === 'undefined' || !Element.prototype.animate || e.classList.contains('rest')) return;
    try { const f = e.querySelector('.sf'), t = document.createElement('span'); if (!f) return; t.innerHTML = simBack('ld rv'); const bk = t.firstChild; e.appendChild(bk);
      const wait = 180 + 140 * (key === 'oL'), turn = 260, p = 'perspective(700px) ';
      bk.animate([{ transform: p + 'rotateY(0deg)' }, { transform: p + 'rotateY(0deg)', offset: wait / (wait + turn) }, { transform: p + 'rotateY(90deg)' }], { duration: wait + turn, easing: 'ease-in', fill: 'forwards' }).onfinish = () => bk.remove();
      f.animate([{ transform: p + 'rotateY(-90deg)' }, { transform: p + 'rotateY(-90deg)', offset: (wait + turn) / (wait + 2 * turn) }, { transform: p + 'rotateY(0deg)' }], { duration: wait + 2 * turn, easing: 'ease-out' });
      setTimeout(() => bk.remove(), wait + turn + 400); } catch (err) {} }); }
/* a card on its way somewhere: a copy of how it looked, from where it was to where it goes, fading */
function simGhost(html, from, to, delay) { if (!from || !document.body || !document.body.appendChild) return;
  const d = document.createElement('div'); d.className = 'tb-ghost'; d.innerHTML = html;
  Object.assign(d.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' }); document.body.appendChild(d);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const a = d.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0 }], { duration: 560, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  a.onfinish = () => d.remove(); setTimeout(() => d.remove(), 1600 + delay); }
/* a new turn, across the middle of the table */
function simBanner(v) { const mat = document.querySelector('#simBoard .tb-mat'); if (!mat) return; const b = document.createElement('div'); b.className = 'tb-banner';
  const mine = v.active === v.seat, st = v.start ? simStartText(v.start) : ''; b.innerHTML = `<b>Turn ${v.turn}</b><span>${mine ? (v.bot != null ? 'Your turn' : esc(simShort(v.me)) + '\u2019s turn') : esc(simShort(v.them)) + (v.bot != null ? ' plays' : '\u2019s turn')}</span>${st ? `<span class="st">${st[0].toUpperCase() + st.slice(1)}</span>` : ''}`;
  mat.appendChild(b); setTimeout(() => b.remove(), 1600); }
/* over the table after the paint: the attack's line from attacker to target, and a battle's result not yet shown -- hit
   or held, a K.O., the defender's own Life card -- once, where the two met; a hit is felt as well as seen */
function simDecor(v) { const box = $('#simBoard'); if (!v || !box || typeof box.querySelector !== 'function') return;
  try { const mat = box.querySelector('.tb-mat'), svg = box.querySelector('.tb-lines'); if (!mat || !svg || typeof mat.getBoundingClientRect !== 'function') return;
    const m = mat.getBoundingClientRect(), mid = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left - m.left + r.width / 2), Math.round(r.top - m.top + r.height / 2)]; };
    const b = v.battle, from = b && b.attacker && mat.querySelector(`[data-uid="${b.attacker.uid}"]`), to = b && b.target && mat.querySelector(`[data-uid="${b.target.uid}"]`);
    if (from && to) { const [x1, y1] = mid(from), [x2, y2] = mid(to); svg.innerHTML = `<defs><marker id="tbArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#E0553D"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E0553D" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 8" marker-end="url(#tbArrow)"/>`; }
    const r = v.last; if (!r || r.n === SIMUI.seen || r.turn !== v.turn || v.over !== null) return; SIMUI.seen = r.n;
    const own = r.life.filter(l => l.name).map(l => `${l.banished ? 'Banished' : 'To hand'}: ${esc(l.name)}`).join(' \u00b7 ');
    const d = document.createElement('div'); d.className = 'tb-burst ' + (r.gone ? 'held' : r.win ? 'hit' : 'held'); d.setAttribute('role', 'status');
    d.innerHTML = `<b>${r.gone ? 'Ended' : r.ko ? 'K.O.' : r.win ? 'Hit' : 'Held'}</b><span>${r.a} vs ${r.d}${own ? ' \u00b7 ' + own : ''}</span>`;
    mat.appendChild(d); setTimeout(() => d.remove(), 1700); if (r.win && !r.gone) PLATFORM.haptic(); } catch (e) {} }
/* the sheet over the table: a card's zoom, the log, a trash, the game's menu -- painted from the kept view */
function simSheetOpen(kind, arg) { SIMUI.sheet = { kind, arg }; simSheetPaint(); $('#simSheet').classList.add('on'); }
function simSheetPaint() { const s = SIMUI.sheet, v = SIMUI.v; if (!s || !v) return;
  $('#simSheetTitle').textContent = s.kind === 'trash' ? `${simShort(simSide(v, +s.arg))}\u2019s trash` : ({ zoom: 'The card', log: 'The log', menu: 'The game', leave: 'Leave the table', endq: 'End your turn?' }[s.kind] || '');
  $('#simSheetBody').innerHTML = s.kind === 'zoom' ? simZoomHtml(v, s.arg) : s.kind === 'log' ? simLogHtml(v) : s.kind === 'trash' ? simTrashSheetHtml(v, +s.arg) : s.kind === 'leave' ? simLeaveHtml(v) : s.kind === 'endq' ? simEndHtml(v) : simMenuHtml(v); }
function simLogText() { const g = SIM.g; if (!g) return ''; const P = i => g.players[i]; return [`OP TCG Hub sim \u2014 take ${TAKE} \u2014 rules v${SIM.RULES}`, `${P(0).name} (${CAT.byId.get(P(0).leader.id)?.name}) vs ${P(1).name} (${CAT.byId.get(P(1).leader.id)?.name}), turn ${g.turn}`, '', ...g.log.slice().reverse().map(l => simSay(l, false, SIMUI.v))].join('\n'); }
/* Report (take 122): the effect on screen, what the app made of it, and the whole game as its seed and moves --
   enough to replay it exactly and turn it into a proof (tools/cardproof.mjs --from-report). Shared by the
   player's own hand, never sent anywhere else (PROTOCOL §9). */
function simReport() { const g = SIM.g, o = g.queue[0]; const p = o && SIM.card(o.cardId);
  return JSON.stringify({ kind: 'optcghub-sim-report', v: 1, take: TAKE, rules: SIM.RULES, spec: g.spec, actions: g.actions,
    offer: o ? { cardId: o.cardId, num: p && p.num, name: p && p.name, t: o.e.t, raw: o.e.raw, parsed: o.e.do, proof: SIM.proofOf(o.cardId, o.e), step: o.step } : null,
    log: g.log.slice(0, 30) }, null, 1); }
function simShare(title, text) { if (navigator.share) navigator.share({ title, text }).catch(() => {}); else { try { navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Copy failed'); } } }
/* a tap: the board's own choices (select, aim, zoom, the sheets) change what is drawn; a move is found in the view the
   board painted and sent back as it is (docs/SIM-UI.md, Moves) -- nothing here asks the engine what is legal. The one move not in the
   human's view is the app's own Resolve, which the app holds so the human sees the block and counter first. */
function simTap(code) { const s = String(code), c = s.indexOf(':'), act = c < 0 ? s : s.slice(0, c), arg = c < 0 ? null : s.slice(c + 1);
  const ref = arg === 'leader' || arg === 'stage' ? arg : (arg == null || arg === '' || isNaN(+arg) ? arg : +arg);
  if (act === 'start') { const ds = SIMUI.legalDecks(); if (!ds.length) return; const d1 = ds[+$('#simD1').value] || ds[0], d2 = ds[+$('#simD2').value] || ds[Math.min(1, ds.length - 1)], first = +$('#simFirst').value || 0;
    const bot = $('#simOpp') && $('#simOpp').value === 'bot';
    SIM.new({ ...d1, name: (bot ? 'You' : 'Player 1') + (d1.name ? ' \u2014 ' + d1.name : '') },   // two on one phone: each seat by its number (take 123: Player 2 read its opponent as "You")
      { ...d2, name: (bot ? 'The app' : 'Player 2') + (d2.name ? ' \u2014 ' + d2.name : '') }, first, bot ? { bot: 1 } : {});
    Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, seen: 0, hurry: false, shown: new Set(), acted: null });
    if (bot) simBotRun(); else simCurtain(SIM.P(SIM.who()).name, 'keep or mulligan first', SIM.view(SIM.who()).me.leader); paintSim(); window.scrollTo(0, 0); return; }
  if (act === 'new') { clearTimeout(SIMUI.timer); SIM.g = null; if (ONLINE.on()) ONLINE.leave(false); Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null }); paintSim(); return; }
  if (act === 'sharelog') { simShare('OP TCG Hub game log', simLogText()); return; }
  if (act === 'report') { simShare('OP TCG Hub \u2014 a Sim effect report', simReport()); return; }
  /* take 131: the online match -- before any game exists */
  if (act === 'host' || act === 'join') { const ds = SIMUI.legalDecks(), sel = $('#simDO'), d = ds[+(sel && sel.value)] || ds[0]; if (act === 'host') ONLINE.host(d); else ONLINE.join(($('#simCode') || {}).value, d); return; }
  if (act === 'deal') { ONLINE.deal(); return; }
  if (act === 'resume') { ONLINE.resume(); paintSim(); return; }
  if (act === 'sharecode') { const c = ONLINE.sess && ONLINE.sess.code; if (c) simShare('OP TCG Hub \u2014 play me', `Play me in OP TCG Hub: Prep & Play \u2192 Sim \u2192 Play online \u2192 Join, and type ${c}`); return; }
  if (act === 'leaveonline') { ONLINE.leave(false); paintSim(); return; }
  const v = SIMUI.v; if (!v) return;
  if (act === 'log' || act === 'menu' || act === 'leave') return simSheetOpen(act);
  /* leave the table (the owner, take 124): a game still on is forfeited for the seat on screen (§1-2-3), then the table closes and
     the app's header, tabs and nav come back */
  if (act === 'leavenow') { const was = SIM.g && SIM.g.over === null; if (ONLINE.on()) ONLINE.leave(was); else if (was) SIM.act(simSeat(), { t: 'concede' }); clearTimeout(SIMUI.timer); SIM.g = null;
    Object.assign(SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null, seen: 0 }); $('#simCurtain').classList.remove('on'); paintSim(); window.scrollTo(0, 0); if (was) toast('Forfeited \u2014 the table is closed'); return; }
  if (act === 'trash' || act === 'zoom') return simSheetOpen(act, arg);
  if (act === 'card') { SIMUI.focus = SIMUI.focus === arg ? null : arg; SIMUI.sel = null; paintSim(); return; }
  if (act === 'aimx') { SIMUI.sel = null; paintSim(); return; }
  if (act === 'roomx') { SIMUI.room = null; paintSim(); return; }
  if (act === 'hurry') { SIMUI.hurry = true; simBotRun(); paintSim(); return; }
  if (act === 'post') { const before = SIMUI.post.i; SIMUI.post = null; simAfter(before); paintSim(); return; }
  if (SIMUI.busy && act !== 'concede') return;   // the app is moving
  const L = v.legal, pick = f => L.find(f), send = (a, seat = v.seat) => { if (a) simAct(seat, a); else toast('Not now'); };
  switch (act) {
    case 'keep': case 'mull': send(pick(x => x.t === act)); break;
    case 'play': { const h = +arg, one = pick(x => x.t === 'play' && x.h === h && x.trash == null);
      if (one) send(one); else if (L.some(x => x.t === 'play' && x.h === h)) { SIMUI.room = { h }; SIMUI.focus = null; } else { const hc = (v.me.hand || [])[h]; toast(hc && hc.play && hc.play.why ? hc.play.why : 'Not now'); } break; }
    case 'room': { const h = SIMUI.room && SIMUI.room.h; SIMUI.room = null; send(pick(x => x.t === 'play' && x.h === h && x.trash === +arg)); break; }
    case 'give': send(pick(x => x.t === 'give' && x.ref === ref)); break;
    case 'fxmain': { const [r0, n] = String(arg).split('.'), r = r0 === 'leader' || r0 === 'stage' ? r0 : +r0; send(pick(x => x.t === 'activate' && x.ref === r && (n == null || x.n === +n))); break; }
    case 'attack': if (L.some(x => x.t === 'attack' && x.ref === ref)) { SIMUI.sel = SIMUI.sel && SIMUI.sel.ref === ref ? null : { ref }; SIMUI.focus = null; } else toast('It cannot attack now'); break;
    case 'target': { const a = SIMUI.sel && pick(x => x.t === 'attack' && x.ref === SIMUI.sel.ref && x.target === ref); SIMUI.sel = null; send(a); break; }
    case 'block': send(pick(x => x.t === 'block' && x.k === +arg)); break;
    case 'noblock': send(pick(x => x.t === 'noblock')); break;
    case 'counter': send(pick(x => x.t === 'counter' && x.h === +arg)); break;
    case 'cev': send(pick(x => x.t === 'cevent' && x.h === +arg)); break;
    case 'resolve': { const mine = pick(x => x.t === 'resolve'); if (mine) send(mine); else if (v.bot != null && v.battle && v.battle.def === v.bot && v.who === v.bot) send({ t: 'resolve' }, v.bot); break; }
    case 'fx': { const all = L.filter(x => x.t === 'fx' && x.target === arg); if (all.some(x => x.trash != null)) SIMUI.fxt = { target: arg }; else send(all[0]); break; }
    case 'fxroom': { const tg = SIMUI.fxt && SIMUI.fxt.target; SIMUI.fxt = null; send(pick(x => x.t === 'fx' && x.target === tg && x.trash === +arg)); break; }
    case 'fxapply': { const all = L.filter(x => x.t === 'fx' && x.target == null); if (all.length && all.every(x => x.trash != null)) SIMUI.fxt = { target: null }; else send(all.find(x => x.trash == null)); break; }   // a card played by its own effect onto five: one to trash first
    case 'fxskip': send(pick(x => x.t === 'fxskip')); break;
    case 'fxhand': send(pick(x => x.t === 'fxhand')); break;
    case 'hop': { const a = L[+arg]; if (a && a.t === 'hand') send(a); break; }
    case 'hdone': send(pick(x => x.t === 'handdone')); break;
    case 'end': if (arg !== 'now' && simLeft(v).length) return simSheetOpen('endq'); send(pick(x => x.t === 'end')); break;   // take 124: it asks while an attack, a play or an ability is left
    case 'concede': simAct(simSeat(), { t: 'concede' }); break;
  }
  paintSim(); }
$('#sim').addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (!b) return; if (SIMUI.pressed) { SIMUI.pressed = false; return; } simTap(b.dataset.sim); });
/* the sheet's buttons: a move closes it first; a card, a trash or the log opens in it */
$('#simSheet').addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (!b) return; const code = b.dataset.sim;
  if (!/^(zoom|trash|log|menu|leave|sharelog|report)(:|$)/.test(code)) $('#simSheet').classList.remove('on'); simTap(code); });
/* a new game's choices are kept as they change, and the two Leaders face each other at once */
$('#sim').addEventListener('change', e => { const t = e.target, ds = SIMUI.legalDecks(); if (!t || !/^sim(D1|D2|Opp|First|DO)$/.test(t.id)) return;
  if (t.id === 'simDO') { ONLINE.setDeck(ds[+t.value] || null); return; }   // take 131
  if (t.id === 'simD1') SIMUI.d1 = (ds[+t.value] || {}).id || null; if (t.id === 'simD2') SIMUI.d2 = (ds[+t.value] || {}).id || null;
  if (t.id === 'simOpp') SIMUI.opp = t.value; if (t.id === 'simFirst') SIMUI.first = +t.value || 0; paintSim(); });
/* hold a card to read it: the zoom opens, and the tap that ends the hold does nothing more */
$('#simBoard').addEventListener('pointerdown', e => { const c = e.target.closest && e.target.closest('.sc[data-key]'); clearTimeout(SIMUI.press); SIMUI.pressed = false; if (!c) return;
  SIMUI.press = setTimeout(() => { SIMUI.pressed = true; simSheetOpen('zoom', c.dataset.key); }, 450); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => $('#simBoard').addEventListener(t, () => clearTimeout(SIMUI.press)));
$('#simBoard').addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.sc')) e.preventDefault(); });
addEventListener('resize', () => { if (SIMUI.v && $('#sim').classList.contains('on')) { simFit(); simDecor(SIMUI.v); } });
$('#simCurtain').addEventListener('click', () => { $('#simCurtain').classList.remove('on'); paintSim(); });

