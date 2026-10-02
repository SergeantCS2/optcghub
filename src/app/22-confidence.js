/* ===================================================================== *
 * THE CONFIDENCE GATE
 *
 * Take 2 measured what reading the printed code is actually worth:
 *   code alone .............. 8.9% of printings resolve unambiguously
 *   code + which set ....... 60.2%
 * and 99.6% of catalogue VALUE sits in numbers that need disambiguation.
 *
 * So the rule is economic, not visual: auto-accept only when being WRONG IS
 * CHEAP -- when every candidate costs within 25% of every other. Otherwise
 * ask. A picker costs one tap; a wrong auto-accept on OP01-016 costs $2,016.
 * ===================================================================== */
/* What the printed strip at the bottom-right of a One Piece card shows.
   MEASURED take 6 on real card images:
     plain   OP13-014 [C] (4)
     star    OP04-030 *[R] (1)      a star above the rarity badge
     sp      SP OP05-119 [SEC] (2)  a literal SP badge before the number

   THE SIGNAL IS ASYMMETRIC AND THIS IS THE WHOLE POINT (landmine 60).
   16/16 plain-treatment samples had no star, so a star means special.
   But one alternate art -- ST01-005 -- had no star either, so ABSENCE proves
   nothing. Narrowing on absence would quietly enter a $78 alternate art as a
   $5 base card.

   MEASURED consequence, number + set:
     narrow both ways   83.7% of printings, 47.5% of value   <- unsafe
     narrow on sighting 73.0% of printings, 47.0% of value   <- what ships
   Almost all the value, none of the silent error. */
function candidates(number, setId, face) {
  let c = (CAT.byNum.get(number) || []);
  if (setId) { const inSet = c.filter(p => p.set === setId); if (inSet.length) c = inSet; }
  if (face && face !== 'plain') {
    const narrowed = c.filter(p => p.face === face);
    if (narrowed.length) c = narrowed;
  }
  return c.slice().sort((a, b) => {
    /* No star seen? Still show everything, but put the printings whose face
       matches what we DID see at the top, so the right answer is one tap away. */
    if (face && (a.face === face) !== (b.face === face)) return a.face === face ? -1 : 1;
    /* Then by LIKELIHOOD, not price. Take 16, first field test: the picker
       put a release-event promo above the main-set base every time, because
       it sorted dearest-first, and dearest is a promo for 49.8% of ambiguous
       numbers (MEASURED). Print runs are the prior: main set >> starter deck
       >> event promo; and base before special when no star was seen. */
    const l = likelihood(b, face) - likelihood(a, face);
    if (l) return l;
    return (b.market || 0) - (a.market || 0);
  });
}
function likelihood(p, face) {
  const k = (CAT.sets.get(p.set) || {}).kind || 'main';
  let s = k === 'main' ? 30 : k === 'deck' ? 20 : 10;
  if (!face && p.treat === 'base') s += 5;        // nothing seen -> plain is likelier
  if (p.prov) s -= 3;                              // a provenance suffix is a promo
  return s;
}
function resolve(number, { setId = null, hash = null, face = null } = {}) {
  const c = candidates(number, setId, face);
  if (!c.length) return { verdict: 'unknown', candidates: [] };
  if (c.length === 1) {
    return { verdict: 'auto', pick: c[0], candidates: c,
             why: face && face !== 'plain'
               ? `only one ${face === 'sp' ? 'SP' : 'starred'} printing of ${number}`
               : 'only one printing' };
  }

  const vals = c.map(p => p.market).filter(v => v > 0);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const spread = lo > 0 ? hi / lo : Infinity;

  if (hash != null) {
    const scored = c.filter(p => p.hash != null)
      .map(p => ({ p, d: hamming(hash, p.hash) })).sort((a, b) => a.d - b.d);
    /* Landmines 13 and 49. `sameart` is now MEASURED at build time by clustering
       each number’s printings on actual image distance, not guessed from a name
       keyword. Take 3 measured the result over the whole catalogue:
         separable siblings ......... p5 13, median 29
         indistinguishable siblings . median 3
       zero overlap below 6. So 8 is a defensible match threshold and 13 is a
       defensible gap. Both numbers come from that distribution, not from taste. */
    const anySameArt = c.some(p => p.sameart);
    if (scored.length >= 2 && !anySameArt &&
        scored[0].d <= 8 && scored[1].d - scored[0].d >= 13) {
      return { verdict: 'auto', pick: scored[0].p, candidates: c,
               why: `artwork matched (distance ${scored[0].d})` };
    }
    if (scored.length) c.sort((a, b) =>
      (scored.find(s => s.p === a)?.d ?? 99) - (scored.find(s => s.p === b)?.d ?? 99));
  }
  if (spread <= 1.25) {
    return { verdict: 'auto', pick: c[0], candidates: c,
             why: `all ${c.length} printings within ${money(hi - lo)} of each other` };
  }
  return { verdict: 'ask', candidates: c, spread,
           why: `${c.length} printings share ${number}, ${money(lo)} to ${money(hi)} — `
              + `<b>${Math.round(spread)}\u00d7 apart</b>. Guessing here would misprice `
              + `your collection, so pick the one you’re holding.` };
}
const U64 = (1n << 64n) - 1n;
/* Landmine 43, second face. SQLite INTEGER is SIGNED, so roughly half of every
   stored dHash arrives here NEGATIVE. BigInt shifts are arithmetic: -1n >> 1n
   is -1n, so the unmasked loop below never terminates and the app HANGS on the
   first artwork comparison. Mask to unsigned 64 on the way in and on the XOR.
   Found at take 3 by smoke.mjs refusing to finish. */
function hamming(a, b) {
  let x = ((BigInt(a) & U64) ^ (BigInt(b) & U64)) & U64, n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}

