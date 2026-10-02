/* =====================================================================
 * PLAY — the Life / DON!! counter (A20 #7, ROADMAP 8.1). Two players, one
 * phone, nothing saved. Life starts at the Leader’s value (§2-9); DON!! comes
 * two a turn to ten (§6-4). Tap the Leader slot to pick from the catalogue
 * so Life starts right; or leave it at 5.
 * ===================================================================== */
const PLAY = { p: [{ name: 'Player 1', leader: null, life: 5, don: 0, given: 0 },
                   { name: 'Player 2', leader: null, life: 5, don: 0, given: 0 }], turn: 1, first: 0,
  /* A23 step (1), take 44: the first hot-seat primitive. On the TABLE both
     panels face each other; in the HAND only the active player’s panel shows
     and ending the turn drops a curtain that names who takes the phone. */
  hotseat: localStorage.getItem('vault.hotseat') === '1',
  who() { return this.turn === 1 ? this.first : (this.first + this.turn - 1) % 2; },
  label(i) { const pl = this.p[i]; const L = pl.leader ? CAT.byId.get(pl.leader) : null; return L ? L.name : pl.name; } };
function paintPlay() {
  const active = PLAY.who();
  const shown = PLAY.hotseat ? PLAY.p.map((pl, i) => [pl, i]).filter(([, i]) => i === active) : PLAY.p.map((pl, i) => [pl, i]);
  const other = PLAY.p[1 - active];
  $('#plBoard').innerHTML = shown.map(([pl, i]) => {
    const L = pl.leader ? CAT.byId.get(pl.leader) : null;
    return `<div class="panel plpanel" style="${(!PLAY.hotseat && i === 0) ? 'transform:rotate(180deg)' : ''}">${L ? artBack(L) : ''}
      <div style="display:flex;gap:12px;align-items:center">
        <button class="lead pic" data-plleader="${i}" aria-label="Choose this player’s Leader" style="width:${THUMB.m}px;flex:0 0 ${THUMB.m}px;aspect-ratio:.716;border-radius:var(--r-sm);background:var(--card2);overflow:hidden;position:relative">${L ? refArt(L) : ''}</button>
        <div style="flex:1;min-width:0"><b style="font-family:var(--display);font-weight:400;font-size:var(--fs-title)">${L ? esc(L.name) : pl.name}</b>
          <div class="note" style="margin:2px 0 0">${L ? colsOf(L).join('/') + ' \u00b7 starts at ' + (L.life || 5) + ' life' : 'tap the card to choose a Leader'}</div></div>
      </div>
      <div class="plcols">
        <div style="flex:1;text-align:center">
          <div class="note">${G('life', 13)} Life</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.life}</div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:life:-1" aria-label="Life down">${G('minus', 20)}</button><button data-pl="${i}:life:1" aria-label="Life up">${G('plus', 20)}</button></div>
        </div>
        <div style="flex:1;text-align:center">
          <div class="note">${G('don', 13)} DON!! active</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.don - pl.given}<span style="font-size:var(--fs-row);color:var(--dim)">/${pl.don}</span></div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:don:-1" aria-label="DON!! down">${G('minus', 20)}</button><button data-pl="${i}:don:1" aria-label="DON!! up">${G('plus', 20)}</button></div>
        </div>
        <div style="flex:1;text-align:center">
          <div class="note">DON!! given</div>
          <div class="big" style="font-size:var(--fs-total);line-height:1;margin:4px 0">${pl.given}</div>
          <div class="stepper" style="justify-content:center"><button data-pl="${i}:given:-1" aria-label="Given DON!! down">${G('minus', 20)}</button><button data-pl="${i}:given:1" aria-label="Given DON!! up">${G('plus', 20)}</button></div>
        </div>
      </div>
    </div>`;
  }).join('') + (PLAY.hotseat ? `<div class="note" style="text-align:center;margin:8px 0">Opponent \u2014 ${esc(PLAY.label(1 - active))}: Life <b>${other.life}</b> \u00b7 DON!! <b>${other.don - other.given}</b>/${other.don}</div>` : '') +
  `<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
      <span class="note">Turn ${PLAY.turn} \u00b7 ${PLAY.turn === 1 ? 'first player: ' : ''}<button class="linkish" id="plFirst" style="display:inline-flex;align-items:center;gap:4px;padding:0 4px;width:auto;vertical-align:middle">${
        PLAY.turn === 1 ? (PLAY.p[PLAY.first].leader ? esc(CAT.byId.get(PLAY.p[PLAY.first].leader).name) : PLAY.p[PLAY.first].name) + ' ' + G('swap', 14) : ''}</button></span>
      <button class="ghost go" id="plNext" style="padding:8px 18px">${PLAY.turn === 1 ? 'Start' : (PLAY.hotseat ? 'End turn' : 'Next turn')}</button>
      <span class="note" style="flex-basis:100%;text-align:center">${PLAY.turn === 1 ? 'The first player draws no card and gets 1 DON!!' : (PLAY.hotseat ? 'Then pass the phone' : 'Everything refreshes; the next player draws and gets 2 DON!!')}</span></div>
    <label class="row" style="justify-content:center;gap:8px;margin-top:6px;cursor:pointer"><input type="checkbox" id="plHot" ${PLAY.hotseat ? 'checked' : ''}>
      <span class="note">Pass the phone \u2014 one player at a time, a curtain between turns</span></label>`;
}
/* The curtain: hides the board until the next player taps. In a full board
   this is what keeps a hand a hand; in the counter it is the habit. */
function plCurtain(nextIdx) {
  const c = $('#plCurtain');
  c.innerHTML = `<div class="big" style="font-size:var(--fs-head);margin-bottom:8px">Hand the phone to</div>
    <h2 style="font-size:var(--fs-hero);margin:0 0 18px">${esc(PLAY.label(nextIdx))}</h2>
    <div class="note">Turn ${PLAY.turn} \u00b7 tap when you have it</div>`;
  c.classList.add('on');
}
CLICKS.on('[data-pl],#plFirst,#plHot,#plCurtain,#plNext,#plReset,[data-plleader]', e => {
  const b = e.target.closest('[data-pl]');
  if (b) { const [i, k, d] = b.dataset.pl.split(':'); const pl = PLAY.p[+i];
    if (k === 'life') pl.life = Math.max(0, pl.life + +d);
    if (k === 'don') { pl.don = Math.max(0, Math.min(10, pl.don + +d)); pl.given = Math.min(pl.given, pl.don); }
    if (k === 'given') pl.given = Math.max(0, Math.min(pl.don, pl.given + +d));
    PLATFORM.haptic(); paintPlay(); return; }
  if (e.target.id === 'plFirst') { PLAY.first = 1 - PLAY.first; paintPlay(); return; }
  if (e.target.id === 'plHot') { PLAY.hotseat = e.target.checked; saveJson('vault.hotseat', PLAY.hotseat ? '1' : '0'); paintPlay(); return; }
  if (e.target.closest('#plCurtain')) { $('#plCurtain').classList.remove('on'); paintPlay(); return; }
  if (e.target.id === 'plNext') {
    /* §6-2 refresh: given DON!! return. §6-4: +2 to ten -- except the first
       player’s first turn, which is +1 (§6-4-1), modelled here (take 25). */
    const who = PLAY.turn === 1 ? PLAY.first : (PLAY.first + PLAY.turn - 1) % 2;
    const pl = PLAY.p[who]; pl.given = 0;
    pl.don = Math.min(10, pl.don + (PLAY.turn === 1 ? 1 : 2));
    PLAY.turn++;
    if (PLAY.hotseat) { plCurtain(PLAY.who()); return; }   // the board repaints when the next player taps
    paintPlay(); return; }
  if (e.target.id === 'plReset') { PLAY.p.forEach(p => { p.life = p.leader ? (CAT.byId.get(p.leader).life || 5) : 5; p.don = 0; p.given = 0; }); PLAY.turn = 1; PLAY.first = 0; paintPlay(); return; }
  const l = e.target.closest('[data-plleader]');
  if (l) {
    const i = +l.dataset.plleader;
    $('#lpq').value = ''; lpColour = null; paintLeaderPick();
    const h = ev => { const x = ev.target.closest('[data-lp]'); if (!x) return;
      document.removeEventListener('click', h, true); ev.stopPropagation();
      PLAY.p[i].leader = +x.dataset.lp; PLAY.p[i].life = (CAT.byId.get(+x.dataset.lp) || {}).life || 5;
      $('#leaderPick').classList.remove('on'); paintPlay(); };
    document.addEventListener('click', h, true);
    $('#leaderPick').classList.add('on');
  }
});

