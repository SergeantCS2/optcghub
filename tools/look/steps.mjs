/* tools/look/steps.mjs — the step lists for tools/look.mjs, one per take.

   A step is { name, run(page, ctx) } and returns what it measured, with
   `ok: false` when the expectation failed; the harness then screenshots the
   page, sizes the PNG, checks for sideways scroll and records the line.
   ctx.open() loads the app (catalogue ready, tour skipped); ctx.shot(label)
   takes an extra picture mid-step; ctx.url is the served index.html.
   Everything inside page.evaluate runs in the real app: window.VAULT is the
   same surface smoke.mjs drives, and clicks are real clicks. */

/* The Fold 7: the cover screen is the harness's phone -- MEASURED at take 105 from the
   owner's Diagnostics (`viewport: 411x960 @2.625`, the take-104 install); the inner screen is
   INFERRED until he pastes the same line from the open phone (More → About ×5 → ## device). */
export const VIEWPORTS = {
  cover: { width: 411, height: 960, dpr: 2.625 },
  inner: { width: 840, height: 757, dpr: 2, note: 'INFERRED until the owner pastes the viewport line' }
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const screens = `[...document.querySelectorAll('.screen.on')].map(e => e.id).join(',')`;

/* ---- take 98 — the take-97 look, reviewed --------------------------------- */
const take98 = [
  { name: 'splash-colour', run: async (page, ctx) => {
      /* the opening screen must be ONE colour in every mode: read it in the first moment, before it is removed */
      await page.goto(ctx.url, { waitUntil: 'commit' });
      const bg = await page.evaluate(() => { const s = document.querySelector('#splash'); return s ? getComputedStyle(s).backgroundColor : 'no splash yet'; });
      const shot = await ctx.shot('00-splash');
      await ctx.open();
      return { ok: bg === 'rgb(11, 22, 34)', bg, shot };
    } },
  { name: 'home-most-valuable-row-opens', run: async (page) => {
      /* seed a small collection through the app's own API, then a REAL click on a most-valuable row */
      return page.evaluate(async () => {
        const V = window.VAULT; V.OWN.items = [];
        const vivi = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0));
        V.OWN.add(vivi[0].id, { condition: 'NM' });
        const nami = V.candidates('OP01-016', null)[0]; if (nami) V.OWN.add(nami.id, { condition: 'LP' });
        V.MODE.set('collect', true); V.go('home'); V.paintHome();
        const rows = document.querySelectorAll('#topList button[data-open]').length;
        const b = document.querySelector('#topList button[data-open]'); if (b) b.click();
        await new Promise(r => setTimeout(r, 200));
        const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
        const name = (document.querySelector('#dName') || {}).textContent || '';
        return { ok: rows >= 2 && on === 'detail' && name.length > 0, rows, on, name };
      });
    } },
  { name: 'condition-tap-in-place', run: async (page) => {
      /* on the card's sheet: tap LP, then MP — the segment, the line and the quantity move without a repaint */
      await page.click('#dCondSeg [data-cond="LP"]'); await wait(120);
      const a = await page.evaluate(() => ({ line: document.querySelector('#dCond').textContent, on: (document.querySelector('#dCondSeg .on') || {}).dataset?.cond, qty: document.querySelector('#dQty').textContent }));
      await page.click('#dCondSeg [data-cond="MP"]'); await wait(120);
      const b = await page.evaluate(() => ({ line: document.querySelector('#dCond').textContent, on: (document.querySelector('#dCondSeg .on') || {}).dataset?.cond, note: document.querySelector('#dCondNote').textContent.slice(0, 60) }));
      return { ok: /Lightly Played/.test(a.line) && a.on === 'LP' && /Moderately Played/.test(b.line) && b.on === 'MP' && /Tap a condition/.test(b.note), a, b };
    } },
  { name: 'sealed-sheet-open', run: async (page, ctx) => {
      /* Hunt → Sealed → a real click on the first product row → its sheet */
      return page.evaluate(async () => {
        const V = window.VAULT; V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {}
        const row = document.querySelector('#sealedList [data-open]'); if (row) row.click();
        await new Promise(r => setTimeout(r, 200));
        const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
        return { ok: !!row && on === 'detail', on, stack: V.NAV.stack.slice(-3).join('>') };
      });
    } },
  { name: 'back-from-sheet-lands-on-sealed', run: async (page) => {
      /* the phone's Back: history Back runs the same handler (closeAnyOverlay → the stack → the watchdog); no blank record */
      return page.evaluate(async () => {
        const V = window.VAULT; const before = V.ERRS.list.length;
        history.back(); await new Promise(r => setTimeout(r, 400));
        const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
        const recs = V.ERRS.list.slice(0, V.ERRS.list.length - before).map(e => e.kind + ': ' + e.msg);
        return { ok: on === 'sealed' && recs.length === 0, on, recs, stack: V.NAV.stack.slice(-3).join('>') };
      });
    } },
  { name: 'starter-decks-folded', run: async (page) => {
      /* the section starts folded (the owner's word); the header is there, the deck rows are not */
      return page.evaluate(() => {
        const V = window.VAULT; V.SEALED.closed = new Set(['decks']); V.paintSealed();
        const h = document.querySelector('#sealedList').innerHTML;
        const header = /Starter decks/.test(h); const folded = V.SEALED.closed.has('decks');
        const firstSet = h.indexOf('<h3>'); const deckRowsAbove = /Starter Deck \d+/.test(firstSet > 0 ? h.slice(0, firstSet) : '');
        window.scrollTo(0, 0);
        return { ok: header && folded && !deckRowsAbove, header, folded, deckRowsAbove };
      });
    } },
  { name: 'starter-decks-tap-opens', run: async (page) => {
      const sel = '#sealedList [data-setfold="decks"]';
      const has = await page.$(sel);
      if (has) await page.click(sel); await wait(150);
      return page.evaluate((had) => {
        const V = window.VAULT; const open = !V.SEALED.closed.has('decks');
        const rows = (document.querySelector('#sealedList').innerHTML.match(/Starter Deck/g) || []).length;
        return { ok: had && open && rows >= 3, had, open, rows };
      }, !!has);
    } },
  { name: 'toast-wraps', run: async (page, ctx) => {
      /* a long message stays inside the screen on both sides and wraps */
      const r = await page.evaluate(() => {
        const V = window.VAULT;
        V.toast('Reminder set for the day before Premium Booster: The Best — One Piece Card Game Vol. 2 releases (2026-11-20), and once more on the day.');
        const t = document.querySelector('#toast').getBoundingClientRect(); const vw = document.documentElement.clientWidth;
        return { ok: t.left >= 0 && t.right <= vw && t.height > 40, left: Math.round(t.left), right: Math.round(t.right), h: Math.round(t.height), vw };
      });
      r.shot = await ctx.shot('toast');
      return r;
    } },
  { name: 'releases-screen', run: async (page) => {
      /* the screen the owner reads most: the countdown bands, Remind me and Calendar, a folded starter-deck row if one exists */
      return page.evaluate(() => {
        const V = window.VAULT; V.go('releases'); V.paintReleases(); window.scrollTo(0, 0);
        const h = document.querySelector('#relList').innerHTML;
        return { ok: /data-relalert=/.test(h) && /data-relcal=/.test(h), remind: (h.match(/data-relalert=/g) || []).length, cal: (h.match(/data-relcal=/g) || []).length, folds: (h.match(/data-relfold=/g) || []).length };
      });
    } },
  { name: 'guide-again-row-on-more', run: async (page) => {
      /* A39 item 4: the row exists and reopens the guide */
      return page.evaluate(async () => {
        const V = window.VAULT; V.MODE.set('collect', true); V.go('settings');
        const b = document.querySelector('#guideAgain'); if (b) b.click(); await new Promise(r => setTimeout(r, 150));
        const t = document.querySelector('#tour'); const shown = !!t && !t.hidden;
        return { ok: !!b && shown, row: !!b, shown, label: b ? b.textContent : '' };
      });
    } }
];

/* ---- the harness's own controls (--selftest): both must be reported NOT ok */
export const CONTROLS = [
  { name: 'control-wrong-expectation', run: async (page, ctx) => { await ctx.open(); const title = await page.title(); return { ok: title === 'not this title', title }; } },
  { name: 'control-blank-page', run: async (page) => { await page.goto('about:blank'); return { ok: true }; } }
];

/* ---- take 100 — the pictures, measured on the runner ------------------------ */
const take100 = [
  { name: 'diagnostics-pictures-line', run: async (page, ctx) => {
      /* More → About ×5 → Diagnostics: the report names how many products have no picture at either host */
      await ctx.open();
      return page.evaluate(async () => {
        const V = window.VAULT; V.MODE.set('collect', true); V.go('diag');
        const rep = await V.DIAG.report(); const out = document.querySelector('#diagOut'); if (out) out.textContent = rep;
        const m = /pictures\s*[:=]\s*(.*)/.exec(rep); window.scrollTo(0, 0);
        return { ok: !!m, line: m ? m[1].slice(0, 140) : '(no pictures line)' };
      });
    } },
  { name: 'sealed-newest-set-rows', run: async (page) => {
      /* the newest set's boxes and packs: a picture box per row. Here they are label boxes -- the VM has no CDN access; the phone is the proof */
      return page.evaluate(async () => {
        const V = window.VAULT; V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {}
        await new Promise(r => setTimeout(r, 400));   /* the mode knob animates; a picture mid-slide is not the screen */
        V.SEALED.q = 'Dominance'; V.paintSealed(); window.scrollTo(0, 0);
        const h = document.querySelector('#sealedList').innerHTML; const boxes = (h.match(/class="pic"/g) || []).length; const imgs = (h.match(/<img class="ref"/g) || []).length;
        V.SEALED.q = '';
        return { ok: boxes >= 3 && imgs >= 3, boxes, imgs, note: 'label boxes here: no CDN from the VM' };
      });
    } }
];

/* ---- take 104 — the owner's PC Diagnostics run, answered --------------------- */
const take104 = [
  { name: 'selftest-camera-line-in-a-browser', run: async (page, ctx) => {
      /* the owner's route: More → About ×5 → Diagnostics; the report runs the self-test and prints it. In a browser a
         missing camera is a SKIP with its reason, never "FAIL 0 camera(s)"; a browser that lists a camera reads PASS
         with the count -- the invariant is that 0 cameras is never a FAIL here */
      await ctx.open();
      return page.evaluate(async () => {
        const V = window.VAULT; V.MODE.set('collect', true); V.go('diag');
        const rep = await V.DIAG.report(); const out = document.querySelector('#diagOut'); if (out) out.textContent = rep;
        const lines = rep.split('\n'); const i = lines.findIndex(l => /Camera reachable/.test(l)); const line = lines[i] || '';
        const skipWithReason = /SKIP/.test(line) && /no camera listed on this device/.test(line);
        const passWithCount = /PASS/.test(line) && /[1-9]\d* camera/.test(line);
        const failZero = /FAIL/.test(line) && /0 camera/.test(line);
        if (out && i >= 0) { const lh = parseFloat(getComputedStyle(out).lineHeight) || 17; window.scrollTo(0, Math.max(0, out.getBoundingClientRect().top + window.scrollY + i * lh - 160)); }
        return { ok: (skipWithReason || passWithCount) && !failZero, line: line.trim().slice(0, 120) };
      });
    } },
  { name: 'diagnostics-effects-line-says-its-unit', run: async (page) => {
      /* the ## catalogue block: "effects scripted" counts effect lines and says so, with the cards beside */
      return page.evaluate(async () => {
        const V = window.VAULT; V.go('diag');
        const rep = await V.DIAG.report(); const out = document.querySelector('#diagOut'); if (out) out.textContent = rep;
        const m = /effects scripted\s*[:=]\s*(\d+) of (\d+) effect lines \((\d+) cards\)/.exec(rep);
        const lines = rep.split('\n'); const i = lines.findIndex(l => /effects scripted/.test(l));
        if (out && i >= 0) { const lh = parseFloat(getComputedStyle(out).lineHeight) || 17; window.scrollTo(0, Math.max(0, out.getBoundingClientRect().top + window.scrollY + i * lh - 160)); }
        return { ok: !!m && +m[1] <= +m[2] && +m[3] > 0, line: (lines[i] || '(no effects line)').trim().slice(0, 120) };
      });
    } }
];

/* ---- take 105 — the Fold's first run of the shrunk build, answered --------- */
const take105 = [
  { name: 'fresh-open-home-is-on-the-stack', run: async (page, ctx) => {
      /* landmine 140: the app's OWN boot, nothing seeded -- Home must already be on the stack */
      await ctx.open();
      return page.evaluate(() => { const V = window.VAULT; return { ok: Array.isArray(V.NAV.bootStack) && V.NAV.bootStack[0] === 'home' && V.NAV.stack[0] === 'home', boot: (V.NAV.bootStack || []).join('>'), stack: V.NAV.stack.join('>') }; });
    } },
  { name: 'first-card-then-back-lands-on-home', run: async (page) => {
      /* the owner's path: a card from Home's top-value row, then the phone's Back (history Back runs the same handler) -- Home, never out of the app */
      return page.evaluate(async () => {
        const V = window.VAULT; V.OWN.items = [];
        const vivi = V.candidates('EB03-024', null).slice().sort((a, b) => (b.market || 0) - (a.market || 0)); V.OWN.add(vivi[0].id, { condition: 'NM' });
        V.paintHome();   /* no V.go('home') here on purpose: the boot's own push is what is under test */
        const b = document.querySelector('#topList button[data-open]'); if (b) b.click();
        await new Promise(r => setTimeout(r, 200));
        const onDetail = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
        const before = V.ERRS.list.length;
        history.back(); await new Promise(r => setTimeout(r, 400));
        const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(',');
        window.scrollTo(0, 0);
        return { ok: onDetail === 'detail' && on === 'home' && V.ERRS.list.length === before, onDetail, on, stack: V.NAV.stack.join('>') };
      });
    } }
];

/* ---- take 106 — the UI series' foundation (A42): Prep & Play first, then Hunt, then Collect ---- */
const take106 = [
  { name: 'play-decks-red-readable-knob-centred', run: async (page, ctx) => {
      /* Prep & Play's red as text is --accent-ink #E5705C (5.22:1 on the card; #E0553D was 4.25); the knob's label
         is #1A1408 on the red (4.82; #F1EFE6 was 3.29); the knob sits centred under Prep & Play (equal thirds) */
      await ctx.open();
      return page.evaluate(async () => {
        const V = window.VAULT; V.MODE.set('play', true); V.go('decks'); await new Promise(r => setTimeout(r, 450)); window.scrollTo(0, 0);
        const h3 = document.querySelector('#decks .panel h3'); const title = h3 ? getComputedStyle(h3).color : '';
        const k = document.querySelector('#modeSlider .knob').getBoundingClientRect(), b = document.querySelector('#modeSlider [data-mode="play"]').getBoundingClientRect();
        const label = getComputedStyle(document.querySelector('#modeSlider [data-mode="play"]')).color; const off = Math.round((k.left + k.width / 2) - (b.left + b.width / 2));
        return { ok: title === 'rgb(229, 112, 92)' && label === 'rgb(26, 20, 8)' && Math.abs(off) <= 2, title, label, knobOffset: off };
      });
    } },
  { name: 'play-deck-curve-visible-in-red', run: async (page) => {
      /* a copy of a ready-made deck, opened: the cost curve's bars are a tint of the red, not #1d2a2e (1.1:1 on the card) */
      return page.evaluate(async () => {
        const V = window.VAULT; const d = JSON.parse(JSON.stringify(V.CAT.stock[0])); d.id = 'look106'; d.name = 'Look 106'; delete d.stock;
        V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look106'); V.DECKS.list.push(d); V.openDeck('look106'); await new Promise(r => setTimeout(r, 300));
        const bars = [...document.querySelectorAll('#dkCurve div')]; const bar = bars.find(x => !x.classList.contains('hi')) || bars[0];
        const colour = bar ? getComputedStyle(bar).backgroundColor : ''; const c = document.querySelector('#dkCurve'); if (c) window.scrollTo(0, Math.max(0, c.getBoundingClientRect().top + window.scrollY - 220));
        return { ok: bars.length >= 8 && colour !== 'rgb(29, 42, 46)' && colour !== '', bars: bars.length, barColour: colour };
      });
    } },
  { name: 'hunt-sealed-selected-chip-and-knob', run: async (page) => {
      /* the selected chip's text is the gold on a tint of Hunt's own palette; the knob sits centred under Hunt */
      return page.evaluate(async () => {
        const V = window.VAULT; V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look106'); V.NAV.zipAsked = true;
        const k = document.querySelector('#modeSlider .knob');
        await new Promise(res => { let done = false; const fin = () => { if (!done) { done = true; setTimeout(res, 40); } }; k.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 1500); V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {} });
        window.scrollTo(0, 0);
        const chip = document.querySelector('#sealedKinds .chip.on'); const st = chip ? getComputedStyle(chip) : null;
        const kr = k.getBoundingClientRect(), b = document.querySelector('#modeSlider [data-mode="hunt"]').getBoundingClientRect(); const off = Math.round((kr.left + kr.width / 2) - (b.left + b.width / 2));
        return { ok: !!st && st.color === 'rgb(214, 176, 76)' && Math.abs(off) <= 2, chipText: st && st.color, chipBg: st && st.backgroundColor, knobOffset: off };
      });
    } },
  { name: 'collect-empty-collection-has-its-picture', run: async (page) => {
      /* landmine 142: the empty collection named the skull (removed take 63) and drew nothing; it draws the scan card */
      return page.evaluate(async () => {
        const V = window.VAULT; const k = document.querySelector('#modeSlider .knob');
        await new Promise(res => { let done = false; const fin = () => { if (!done) { done = true; setTimeout(res, 40); } }; k.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 1500); V.MODE.set('collect', true); });
        V.go('collection'); window.scrollTo(0, 0);   /* a picture mid-slide is not the screen (landmine 143) */
        const u = document.querySelector('#colEmpty svg use'); const href = u ? u.getAttribute('href') : null; const sym = href ? document.querySelector(href) : null;
        const shown = getComputedStyle(document.querySelector('#colEmpty')).display !== 'none';
        return { ok: shown && href === '#g-scancard' && !!sym, href, symbol: !!sym, owned: V.OWN.items.length };
      });
    } },
  { name: 'collect-filter-price-boxes-16px', run: async (page) => {
      /* the filter's price row: 16px inputs, so a tap no longer zooms the page (landmine 119) */
      await page.click('#sortBtn'); await wait(300);
      return page.evaluate(async () => {
        const inp = document.querySelector('.frange input'); const fs = inp ? getComputedStyle(inp).fontSize : '';
        if (inp) inp.scrollIntoView({ block: 'center' });
        return { ok: fs === '16px', fontSize: fs };
      });
    } },
  { name: 'collect-checklist-cells-12px', run: async (page) => {
      /* the smallest text in the app is now 12px: a set checklist's cells, the densest grid */
      return page.evaluate(async () => {
        const V = window.VAULT; while (V.closeAnyOverlay()) {} const f = document.querySelector('#filters'); if (f) f.classList.remove('on');
        const set = [...V.CAT.sets.values()].find(s => s.abbr === 'OP01') || [...V.CAT.sets.values()][0]; V.openChecklist(set.id); await new Promise(r => setTimeout(r, 300)); window.scrollTo(0, 0);
        const cells = [...document.querySelectorAll('#ckGrid .ck')].slice(0, 40);
        const sizes = cells.flatMap(c => [c, ...c.querySelectorAll('*')]).filter(e => (e.textContent || '').trim()).map(e => parseFloat(getComputedStyle(e).fontSize));
        return { ok: cells.length >= 20 && Math.min(...sizes) >= 12, cells: cells.length, smallest: Math.min(...sizes) };
      });
    } },
  { name: 'collect-home-nav-and-caption-12px', run: async (page) => {
      /* the bottom bar's labels were 10.5px; the Portfolio caption was 11px in --brass2 (2.68-4.40:1) and is 12px in --dim */
      return page.evaluate(async () => {
        const V = window.VAULT; V.go('home'); await new Promise(r => setTimeout(r, 250)); window.scrollTo(0, 0);
        const nav = [...document.querySelectorAll('#navCollect button')].map(b => getComputedStyle(b).fontSize);
        const cap = document.querySelector('.hero .who .cap'); const cs = cap ? getComputedStyle(cap) : null;
        return { ok: nav.length === 5 && nav.every(f => f === '12px') && !!cs && cs.fontSize === '12px' && cs.color === 'rgb(160, 142, 112)', nav: nav[0], caption: cs && `${cs.fontSize} ${cs.color}` };
      });
    } }
];

/* ---- take 107 — one header on every screen (A42) --------------------------- */
/* The header's measure, run in the page: where the title sits and how it is set, whether
   anything in the header is clipped, overlaps or leaves the screen, and where the gear is.
   Every title is compared with the first one measured (Decks), so a title that moves fails. */
const HEADER = `(id) => { const sec = document.getElementById(id), s = sec.getBoundingClientRect();
  const h = sec.querySelector('header.appbar'), t = h && h.querySelector('.ab-title'); if (!t) return { id, missing: true };
  const r = t.getBoundingClientRect(), cs = getComputedStyle(t), txt = h.querySelector('.ab-text').getBoundingClientRect();
  const act = h.querySelector('.ab-act'), a = act ? act.getBoundingClientRect() : null, g = h.querySelector('[data-go="settings"]'), gr = g && g.getBoundingClientRect();
  const inside = [...h.querySelectorAll('*')].every(e => { const b = e.getBoundingClientRect(); return b.width === 0 || (b.left >= -0.5 && b.right <= innerWidth + 0.5); });
  return { id, title: (t.textContent || (t.querySelector('input') || {}).value || '').trim().slice(0, 24), top: +(r.top - s.top).toFixed(1), left: +(r.left - s.left).toFixed(1),
    size: cs.fontSize, face: cs.fontFamily.split(',')[0].replace(/"/g, ''), colour: cs.color, back: !!h.querySelector('[data-back]'),
    gear: gr ? [Math.round(gr.left - s.left), Math.round(gr.top - s.top)] : null, clipped: t.scrollWidth > t.clientWidth + 1, overlap: a ? txt.right > a.left + 0.5 : false, inside }; }`;
const hdr = (page, id) => page.evaluate(`(${HEADER})(${JSON.stringify(id)})`);
const clean = m => !m.missing && !m.clipped && !m.overlap && m.inside;
const likeRef = (ctx, m) => !!ctx.ref && m.top === ctx.ref.top && m.size === ctx.ref.size && m.face === ctx.ref.face;
const gearAtRef = (ctx, m) => !!m.gear && !!ctx.ref && m.gear[0] === ctx.ref.gear[0] && m.gear[1] === ctx.ref.gear[1];
const pause = `new Promise(r => setTimeout(r, 450))`;
const take107 = [
  { name: 'play-decks-title-and-gear', run: async (page, ctx) => {
      /* Prep & Play first. Decks: the title in the display face at 26px in the mode's red, "+ New deck", then the gear */
      await ctx.open();
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('play', true); V.go('decks'); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'decks'); ctx.ref = m;
      return { ok: clean(m) && m.size === '26px' && m.face === 'OPH Display' && m.colour === 'rgb(229, 112, 92)' && !m.back && !!m.gear, ...m };
    } },
  { name: 'play-deck-name-is-the-title-back-returns', run: async (page, ctx) => {
      /* one level down: the back arrow, the deck's name as the title and still a field; the arrow returns to Decks */
      await page.click('#dkNew'); await page.waitForTimeout(350);
      await page.fill('#dkName', 'Red Shanks'); await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
      const m = await hdr(page, 'deck'); const shot = await ctx.shot('02a-deck-with-its-name');
      await page.click('#deck .ab-back'); await page.waitForTimeout(350);
      const on = await page.evaluate(() => (document.querySelector('.screen.on') || {}).id);
      return { ok: clean(m) && likeRef(ctx, m) && m.back && !m.gear && m.title === 'Red Shanks' && on === 'decks', afterBack: on, shot, ...m };
    } },
  { name: 'play-cards-and-sim-titles-hold-their-place', run: async (page, ctx) => {
      /* Cards carries a text action, Sim a line under its title: neither moves the title or the gear */
      await page.evaluate(`(async () => { window.VAULT.go('cards'); await ${pause}; window.scrollTo(0, 0); })()`);
      const c = await hdr(page, 'cards'); const shot = await ctx.shot('03a-cards');
      await page.evaluate(`(async () => { window.VAULT.go('sim'); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'sim');
      return { ok: clean(c) && clean(m) && likeRef(ctx, c) && likeRef(ctx, m) && gearAtRef(ctx, c) && gearAtRef(ctx, m), cards: c.top, sim: m.top, gear: m.gear, shot };
    } },
  { name: 'hunt-sealed-prices-line-no-swords', run: async (page, ctx) => {
      /* Hunt: the prices' date is the line under the title, the currency and the gear at the right; no swords in the title */
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('hunt', true); V.go('sealed'); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'sealed');
      const extra = await page.evaluate(() => ({ swords: !!document.querySelector('#sealed header .swords'), sub: (document.querySelector('#sealedAsOf') || {}).textContent || '' }));
      return { ok: clean(m) && likeRef(ctx, m) && gearAtRef(ctx, m) && m.colour === 'rgb(214, 176, 76)' && !extra.swords && /prices/.test(extra.sub), ...extra, ...m };
    } },
  { name: 'hunt-local-distance-and-gear', run: async (page, ctx) => {
      await page.evaluate(`(async () => { const V = window.VAULT; V.go('local'); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'local');
      return { ok: clean(m) && likeRef(ctx, m) && gearAtRef(ctx, m), ...m };
    } },
  { name: 'collect-home-title-and-two-tabs', run: async (page, ctx) => {
      /* Collect: Home's title with the network badge, the currency and the gear; Overview and Performance a tab row under it */
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); V.go('home'); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'home');
      await page.click('#tabPerf'); await page.waitForTimeout(200);
      const perf = await page.evaluate(() => ({ sel: document.querySelector('#tabPerf').getAttribute('aria-selected'), panel: getComputedStyle(document.querySelector('#perfPanel')).display }));
      const shot = await ctx.shot('06a-home-performance');
      await page.click('#tabOver'); await page.waitForTimeout(200);
      const tabs = await page.evaluate(() => { const o = document.querySelector('#tabOver').getBoundingClientRect(); const wn = document.querySelector('#whatsNew'), ok = document.querySelector('#wnOk');
        return { h: Math.round(o.height), over: document.querySelector('#tabOver').getAttribute('aria-selected'),
                 note: wn && !wn.hidden ? { rule: getComputedStyle(wn).borderTopWidth, gotIt: Math.round(ok.getBoundingClientRect().height) } : null }; });
      /* with the release note showing: no second rule under the tabs, and "Got it" on one line (it wrapped at take 106) */
      const noteOk = !tabs.note || (tabs.note.rule === '0px' && tabs.note.gotIt <= 48);
      return { ok: clean(m) && likeRef(ctx, m) && gearAtRef(ctx, m) && m.colour === 'rgb(201, 162, 74)' && perf.sel === 'true' && perf.panel === 'block' && tabs.over === 'true' && tabs.h >= 44 && noteOk, perf, tabs, shot, ...m };
    } },
  { name: 'collect-search-and-scan-open-with-a-title', run: async (page, ctx) => {
      /* the two screens that opened with a search box and a set chip now open with their titles, in the same place */
      await page.evaluate(`(async () => { window.VAULT.go('search'); await ${pause}; window.scrollTo(0, 0); })()`);
      const a = await hdr(page, 'search'); const shot = await ctx.shot('07a-search');
      await page.evaluate(`(async () => { window.VAULT.go('scan'); await ${pause}; window.scrollTo(0, 0); })()`);
      const b = await hdr(page, 'scan');
      return { ok: clean(a) && clean(b) && likeRef(ctx, a) && likeRef(ctx, b) && gearAtRef(ctx, a) && gearAtRef(ctx, b), search: [a.top, a.left], scan: [b.top, b.left], shot };
    } },
  { name: 'collect-card-name-title-back-returns', run: async (page, ctx) => {
      /* a card's own page: the arrow, its name as the title, the collection it is added to under it; the arrow returns */
      await page.evaluate(`(async () => { const V = window.VAULT; V.go('home'); await ${pause}; const p = V.CAT.rows.find(r => /OP01-016/.test(r.num || '')); V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'detail'); const shot = await ctx.shot('08a-card');
      await page.click('#detail .ab-back'); await page.waitForTimeout(350);
      const on = await page.evaluate(() => (document.querySelector('.screen.on') || {}).id);
      return { ok: clean(m) && likeRef(ctx, m) && m.back && m.title.length > 0 && on === 'home', afterBack: on, shot, ...m };
    } },
  { name: 'collect-gear-opens-more-back-returns', run: async (page, ctx) => {
      /* the gear on Home opens More; More's arrow comes back */
      await page.click('#home header [data-go="settings"]'); await page.waitForTimeout(350);
      const m = await hdr(page, 'settings'); const shot = await ctx.shot('09a-more');
      await page.click('#settings .ab-back'); await page.waitForTimeout(350);
      const on = await page.evaluate(() => (document.querySelector('.screen.on') || {}).id);
      return { ok: clean(m) && likeRef(ctx, m) && m.back && m.title === 'More' && on === 'home', afterBack: on, shot, ...m };
    } },
  { name: 'collect-filter-sheet-closes-on-back-and-on-its-cross', run: async (page, ctx) => {
      /* the filter sheet: a title in the header's face and a cross. Back closed nothing before this take -- the sheet stayed over the next screen */
      await page.evaluate(`(async () => { window.VAULT.go('collection'); await ${pause}; window.scrollTo(0, 0); })()`);
      await page.click('#sortBtn'); await page.waitForTimeout(300);
      const open = await page.evaluate(() => { const h = document.querySelector('#filters .sheethead h2'), x = document.querySelector('#filters [data-close]'); const cs = h && getComputedStyle(h); const xr = x && x.getBoundingClientRect();
        return { on: document.querySelector('#filters').classList.contains('on'), face: cs && cs.fontFamily.split(',')[0].replace(/"/g, ''), size: cs && cs.fontSize, cross: xr ? [Math.round(xr.width), Math.round(xr.height)] : null }; });
      const shot = await ctx.shot('10a-filter-sheet');
      await page.evaluate(() => history.back()); await page.waitForTimeout(400);
      const afterBack = await page.evaluate(() => ({ on: document.querySelector('#filters').classList.contains('on'), screen: (document.querySelector('.screen.on') || {}).id }));
      await page.click('#sortBtn'); await page.waitForTimeout(300); await page.click('#filters [data-close]'); await page.waitForTimeout(250);
      const afterCross = await page.evaluate(() => ({ on: document.querySelector('#filters').classList.contains('on'), screen: (document.querySelector('.screen.on') || {}).id }));
      return { ok: open.on && open.face === 'OPH Display' && open.cross && open.cross[0] >= 44 && !afterBack.on && afterBack.screen === 'collection' && !afterCross.on && afterCross.screen === 'collection', open, afterBack, afterCross, shot };
    } },
  { name: 'collect-checklist-title-and-action', run: async (page, ctx) => {
      /* a set's checklist: the arrow, the set as the title, "Want the rest" at the right, nothing overlapping */
      await page.evaluate(`(async () => { const V = window.VAULT; const set = [...V.CAT.sets.values()].find(s => s.abbr === 'OP01') || [...V.CAT.sets.values()][0]; V.openChecklist(set.id); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await hdr(page, 'checklist');
      return { ok: clean(m) && likeRef(ctx, m) && m.back, ...m };
    } }
];

export const STEPS = { 98: take98, 100: take100, 104: take104, 105: take105, 106: take106, 107: take107 };
