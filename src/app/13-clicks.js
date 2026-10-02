/* ---- one click dispatcher (take 133, A44 item 3) ---------------------------
   Every document-level click delegate in the app is a row of this table --
   (selectors, handler) -- registered where its code lives with CLICKS.on, in
   the order the files run: the order the 29 separate listeners were registered
   in, kept here where it can be read (VAULT.CLICKS.table). One bubbling
   listener on the document walks the table: a row whose selector the tap's
   target or an ancestor matches runs, every matching row in turn; a row none
   of whose selectors match is not called, as its listener returned at once.
   Each selector is tried on its own, never as a list, so a test's target that
   answers one selector reaches its row. A handler that throws does not stop
   the walk (the browser went on to the next listener); the first throw is
   rethrown after the walk, so it reaches window.onerror and ERRS as it did. An
   async handler's rejection is its own, as before. Not rows: PICKER's
   capture-phase one-shot (landmine 178), the Play counter's Leader pick (the
   same shape) and the rising scrim's rule (landmine 159) -- each lives while
   its sheet is open and is no delegate. The stub cannot see a document-level
   listener (landmine 136): the proof that a real tap reaches its row is
   Chrome's, in render.mjs. */
const CLICKS = {
  table: [], n: 0, last: [],
  on(sel, fn) {
    const sels = String(sel).split(',').map(s => s.trim()).filter(Boolean);
    if (!sels.length || typeof fn !== 'function') throw new Error('CLICKS.on: a selector and a handler');
    this.table.push({ sel: sels, fn }); return fn;
  },
  /* the element the row answers for: the target or its closest ancestor matching one of the row's selectors. A
     #id selector is also answered by the target's own id, as the listeners that tested e.target.id were: in a
     browser closest('#x') already includes the target, so this only reaches a test's fake whose closest answers
     nothing, or has none */
  hit(t, row) {
    if (!t) return null;
    const has = typeof t.closest === 'function';
    for (const s of row.sel) {
      const m = has && t.closest(s); if (m) return m;
      if (s[0] === '#' && t.id === s.slice(1)) return t;
    }
    return null;
  },
  fire(e) {
    const t = e && e.target; const ran = []; let first = null;
    for (const row of this.table) {
      const m = this.hit(t, row); if (!m) continue;
      ran.push(row.sel.join(','));
      try { row.fn(e, m); } catch (err) { if (!first) first = err; }
    }
    this.n++; this.last = ran;
    if (first) throw first;
    return ran.length;
  }
};
document.addEventListener('click', e => CLICKS.fire(e));
