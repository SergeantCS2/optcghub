/* =====================================================================
 * CREDITS — A17, take 14. The mechanism, with the gate OFF by default.
 *
 * Identifying a card is free and unlimited, always. COMMITTING a card to the
 * collection spends a credit; saving a second deck spends a credit. Without
 * one, the work waits in a pending tray -- nothing scanned is ever lost.
 * Credits are earned online (a rewarded ad, when A17 lands) and spent
 * anywhere, so the airplane-mode invariant (PROTOCOL §8) holds: the field
 * session survives, the settlement happens later.
 *
 * ADS_ENABLED is false until the owner has AdMob IDs (D11). Off, nothing gates and
 * this block is inert. The numbers are D10's and are constants here.
 * ===================================================================== */
/* Derived at boot (take 22): unit IDs in the manifest AND a Capacitor
   runtime. A browser never shows ads; the rig never shows ads; an APK with
   test units shows Google’s test ads, which is the whole point of A17's
   "prove it end to end before real IDs exist". */
let ADS_ENABLED = false;
const CREDITS = {
  FREE_ON_INSTALL: 20, PER_AD: 20, FREE_DECKS: 1, DECKS_PER_AD: 1,
  state: readJson('vault.credits', { scan: 20, deck: 1, earned: 0, spent: 0, pending: [] }),
  save() { saveJson('vault.credits', this.state); },
  enabled() { return ADS_ENABLED; },
  get ready() { return PLATFORM._adReady; },
  /* How many of `n` commits can proceed now; the rest go to the tray. */
  canCommit(n) { return this.enabled() ? Math.min(n, this.state.scan) : n; },
  spendScan(n) { if (!this.enabled()) return; this.state.scan -= n; this.state.spent += n; this.save(); },
  canSaveDeck(isNew) { return !this.enabled() || !isNew || this.state.deck > 0; },
  spendDeck() { if (!this.enabled()) return; this.state.deck -= 1; this.save(); },
  /* Called by the ad plugin’s Rewarded event, or by the dev toggle. */
  earn(kind) {
    if (kind === 'deck') this.state.deck += this.DECKS_PER_AD;
    else { this.state.scan += this.PER_AD; this.state.earned += this.PER_AD; }
    this.save(); this.drain();
  },
  /* The pending tray: commits that were scanned offline or over the limit. */
  /* take 115: false when the tray could not be stored -- the rows are taken back out and stay where they were */
  defer(rows) {
    const at = this.state.pending.length; this.state.pending.push(...rows);
    if (saveJson('vault.credits', this.state)) return true;
    this.state.pending.length = at; return false;
  },
  drain() {
    if (!this.enabled()) return;
    const n = Math.min(this.state.pending.length, this.state.scan);
    if (!n) return;
    if (!OWN.moveIn(this.state.pending.slice(0, n))) return;   // the tray keeps them; STORE.warn has told the collector
    this.state.pending.splice(0, n);
    this.spendScan(n); this.save(); commitOwn('pending');
    toast(`${n} pending card${n === 1 ? '' : 's'} added`);
  },
  /* take 127, the owner's rule: a save no ad could pay for goes through free -- the waiting cards commit (credits
     for exactly them, spent at once by drain), a refused new deck gets its one save; counted for Diagnostics.
     False when nothing waits, so the caller says "try again" instead. */
  freeSave(kind) {
    if (!this.enabled()) return false;
    const n = this.state.pending.length;
    if (kind === 'deck') this.state.deck += 1;
    else if (!n) return false;
    else this.state.scan += n;
    this.state.free = (this.state.free || 0) + 1; this.save();
    if (kind === 'deck') { toast('No ad available \u2014 this deck save is free: tap Save again'); return true; }
    this.drain();
    toast(`No ad available \u2014 ${n} waiting card${n === 1 ? '' : 's'} saved free`);
    if (typeof paintScan === 'function' && $('#scan').classList.contains('on')) paintScan();
    return true;
  }
};

