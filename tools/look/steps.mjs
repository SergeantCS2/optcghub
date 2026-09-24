/* tools/look/steps.mjs — the step lists for tools/look.mjs, one per take.

   A step is { name, run(page, ctx) } and returns what it measured, with
   `ok: false` when the expectation failed; the harness then screenshots the
   page, sizes the PNG, checks for sideways scroll and records the line.
   ctx.open() loads the app (catalogue ready, tour skipped); ctx.shot(label)
   takes an extra picture mid-step; ctx.url is the served index.html.
   Everything inside page.evaluate runs in the real app: window.VAULT is the
   same surface smoke.mjs drives, and clicks are real clicks. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

/* ---- take 108 — controls and icons (A42) ----------------------------------- */
/* Every control's 44 px square, read with elementFromPoint in the page (render.mjs does
   the same on every screen); here, on the screen each step shows. */
const SQUARES = `(sel) => { const out = []; const nav = [...document.querySelectorAll('nav')].find(n => !n.hidden), navTop = nav ? nav.getBoundingClientRect().top : innerHeight, barBottom = document.querySelector('.modebar').getBoundingClientRect().bottom;
  for (const e of document.querySelectorAll(sel)) { const r = e.getBoundingClientRect(); if (r.width < 1 || r.top - 5 < barBottom || r.bottom + 5 > navTop || r.left < 0 || r.right > innerWidth) continue;   /* what is on screen, clear of the fixed bars */
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const own = [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].every(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); });
  out.push({ own, w: Math.round(r.width), h: Math.round(r.height) }); } return { n: out.length, bad: out.filter(o => !o.own).length, sizes: [...new Set(out.map(o => o.w + 'x' + o.h))].slice(0, 4) }; }`;
const squares = (page, sel) => page.evaluate(`(${SQUARES})(${JSON.stringify(sel)})`);
const navIcons = `(id) => [...document.querySelectorAll('#' + id + ' button')].map(b => (b.querySelector('use') || {}).getAttribute ? b.querySelector('use').getAttribute('href') : '')`;
const take108 = [
  { name: 'play-steppers-44-and-drawn', run: async (page, ctx) => {
      /* Prep & Play first. Play's Life and DON!! steppers: 44 px, the minus and plus from the sprite, a name each way */
      await ctx.open();
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('play', true); V.go('play'); await ${pause}; window.scrollTo(0, 0); })()`);
      const sq = await squares(page, '#plBoard .stepper button');
      const named = await page.evaluate(() => [...document.querySelectorAll('#plBoard .stepper button')].every(b => b.getAttribute('aria-label') && b.querySelector('use')));
      return { ok: sq.n >= 6 && sq.bad === 0 && sq.sizes.every(z => z === '44x44') && named, ...sq, named };
    } },
  { name: 'play-cards-chips-own-their-square', run: async (page) => {
      /* the keyword, colour and cost chips: drawn at 34 px, rows 44 px apart, each 44 px square its own; the deck toggle says if it is on */
      await page.evaluate(`(async () => { window.VAULT.go('cards'); await ${pause}; window.scrollTo(0, 0); })()`);
      const sq = await squares(page, '#cdKw .chip, #cdCol .chip, #cdCost .chip');
      const toggle = await page.evaluate(() => document.querySelector('#cdForDeck').getAttribute('aria-pressed'));
      return { ok: sq.n >= 15 && sq.bad === 0 && (toggle === 'false' || toggle === 'true'), ...sq, forThisDeck: toggle };
    } },
  { name: 'hunt-new-nav-icons-bells-and-links', run: async (page) => {
      /* Hunt's nav draws its own four (box, calendar, pin, trophy); a row's stock alert is a bell; every where-to-buy chip ends in the external glyph */
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('hunt', true); V.go('sealed'); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); })()`);
      const nav = await page.evaluate(`(${navIcons})('navHunt')`);
      const rows = await page.evaluate(() => ({ bells: document.querySelectorAll('#sealedList [data-stock] use[href="#g-bell"]').length, stock: document.querySelectorAll('#sealedList [data-stock]').length,
        ext: document.querySelectorAll('#sealedList a.chip.buy[target] use[href="#g-external"]').length, links: document.querySelectorAll('#sealedList a.chip.buy[target]').length,
        chev: document.querySelectorAll('#sealedList [data-setfold] use[href="#g-chevron"]').length }));
      await page.evaluate(() => { const f = document.querySelector('#sealedList [data-stock]'); if (f) f.scrollIntoView({ block: 'center' }); });   // a row on screen at any size
      const sq = await squares(page, '#sealedList a.chip.buy, #sealedList [data-stock]');
      return { ok: nav.join() === '#g-box,#g-calendar,#g-pin,#g-trophy' && rows.bells === rows.stock && rows.stock > 0 && rows.ext === rows.links && rows.chev > 0 && sq.n > 0 && sq.bad === 0, nav, ...rows, squares: sq };
    } },
  { name: 'hunt-releases-reminder-tick', run: async (page, ctx) => {
      /* a reminder set says so with the sprite's tick; Show and Hide fold with its chevron */
      await page.evaluate(`(async () => { const V = window.VAULT; V.go('releases'); V.paintReleases(); await ${pause}; window.scrollTo(0, 0); })()`);
      const r = await page.evaluate(async () => { const b = document.querySelector('#relList [data-relalert]'); if (!b) return { none: true };
        b.scrollIntoView({ block: 'center' }); b.click(); await new Promise(res => setTimeout(res, 300));
        const on = document.querySelector('#relList [data-relalert][aria-pressed="true"]'); if (on) on.scrollIntoView({ block: 'center' });
        return { pressed: !!on, tick: !!(on && on.querySelector('use[href="#g-check"]')), text: on ? on.textContent.trim() : '' }; });
      const shot = await ctx.shot('04a-reminder-set');
      await page.evaluate(() => { const on = document.querySelector('#relList [data-relalert][aria-pressed="true"]'); if (on) on.click(); });   // leave it as it was
      return { ok: r.pressed && r.tick, ...r, shot };
    } },
  { name: 'collect-nav-actions-and-search-bar', run: async (page) => {
      /* Collect's nav draws Scan and Collection their own; the collection's actions each their own; the search bar's star and filter are 44 px buttons */
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); V.go('collection'); await ${pause}; window.scrollTo(0, 0); })()`);
      const nav = await page.evaluate(`(${navIcons})('navCollect')`);
      const acts = await page.evaluate(() => [...document.querySelectorAll('#collection .actions button')].map(b => b.querySelector('use').getAttribute('href').slice(3)));
      const sq = await squares(page, '#collection .search .icb');
      return { ok: nav.join() === '#g-compass,#g-spyglass,#g-scan,#g-collection,#g-cardback' && new Set(acts).size === acts.length && acts.length === 8 && sq.n === 2 && sq.bad === 0, nav, acts, squares: sq };
    } },
  { name: 'collect-favourites-star-fills', run: async (page, ctx) => {
      /* the star is a toggle: tapped, it fills and says it is pressed */
      await page.click('#favOnly'); await page.waitForTimeout(250);
      /* the fill reaches the drawing only if the symbol leaves its own fill open: the first run of this step read the outer svg's fill, passed, and the picture showed a hollow star */
      const st = await page.evaluate(() => { const b = document.querySelector('#favOnly'), u = b.querySelector('svg'), sym = document.querySelector('symbol#g-star'); return { pressed: b.getAttribute('aria-pressed'), fill: getComputedStyle(u).fill, symbolFill: sym ? sym.getAttribute('fill') : 'no symbol' }; });
      const shot = await ctx.shot('06a-favourites-on');
      await page.click('#favOnly'); await page.waitForTimeout(200);
      return { ok: st.pressed === 'true' && st.fill !== 'none' && st.symbolFill === null, ...st, shot };
    } },
  { name: 'collect-scanner-row-above-the-nav', run: async (page) => {
      /* the scanner's shutter row sat 52 px under the nav since the mode slider arrived; now it ends above it */
      await page.evaluate(`(async () => { window.VAULT.go('scan'); await ${pause}; })()`);
      const m = await page.evaluate(() => { const sb = document.querySelector('.shutterbar').getBoundingClientRect(), nav = document.querySelector('#navCollect').getBoundingClientRect();
        return { shutterRowBottom: Math.round(sb.bottom), navTop: Math.round(nav.top), glyphs: ['#btnUndo', '#btnGallery', '#btnTorch'].map(id => { const u = document.querySelector(id + ' use'); return u ? u.getAttribute('href') : ''; }) }; });
      return { ok: m.shutterRowBottom <= m.navTop && m.glyphs.join() === '#g-undo,#g-photo,#g-torch', ...m };
    } },
  { name: 'collect-card-steppers-and-conditions', run: async (page) => {
      /* a card's page: the steppers at 44 px with the sprite's minus and plus, the condition buttons at 44 */
      await page.evaluate(`(async () => { const V = window.VAULT; V.go('home'); await ${pause}; const p = V.CAT.rows.find(r => /OP01-016/.test(r.num || '')); V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); })()`);
      const sq = await squares(page, '#detail .stepper button, #dCondSeg button');
      return { ok: sq.n >= 7 && sq.bad === 0, ...sq };
    } },
  { name: 'collect-pressed-and-disabled', run: async (page, ctx) => {
      /* a press lightens and gives a little (held here for the picture); a disabled button is switched off */
      await page.evaluate(`(async () => { window.VAULT.go('diag'); await ${pause}; window.scrollTo(0, 0); })()`);
      const b = await page.evaluate(() => { const r = document.querySelector('#diagRun').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.waitForTimeout(220);
      const pressed = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#diagRun')); return { filter: cs.filter, transform: cs.transform }; });
      const shot = await ctx.shot('09a-run-held-down');
      await page.mouse.move(2, 2); await page.mouse.up();   // released off the button: nothing runs
      const off = await page.evaluate(() => { const c = document.querySelector('#diagCopy'); return { disabled: c.disabled, opacity: getComputedStyle(c).opacity }; });
      return { ok: /brightness\(1\.25\)/.test(pressed.filter) && /matrix\(0\.96/.test(pressed.transform) && off.disabled && off.opacity === '0.45', pressed, copy: off, shot };
    } },
  { name: 'collect-more-credits-the-icons', run: async (page) => {
      /* More's About names where the interface icons come from */
      await page.evaluate(`(async () => { window.VAULT.go('settings'); await ${pause}; const a = document.querySelector('#aboutIcons'); if (a) a.scrollIntoView({ block: 'center' }); })()`);
      const t = await page.evaluate(() => (document.querySelector('#aboutIcons') || {}).textContent || '');
      return { ok: /Lucide/.test(t) && /ISC/.test(t) && /MIT/.test(t), credit: t };
    } }
];

/* ---- take 109 — the art layer, part 1 (A42): Prep & Play first, with real pictures ------------
   Behind the session VM's proxy the harness fetches the pictures in Node (landmine 152), so these
   are TCGplayer's own. A picture's state is measured, not assumed: loaded, its natural size, and
   the cut above the SAMPLE stamp (object-view-box, landmine 151). */
const waitArt = (page, sel, ms = 9000) => page.waitForFunction(s => { const im = [...document.querySelectorAll(s)]; return im.length > 0 && im.every(i => i.complete); }, sel, { timeout: ms }).catch(() => {});
const heroState = () => { const h = document.querySelector('#dkHero'), peek = h.querySelector('.peek img'), bg = h.querySelector('.artbg img');
  const pic = i => i ? { ok: i.classList.contains('ok') && i.naturalWidth > 0, natural: `${i.naturalWidth}x${i.naturalHeight}`, cut: getComputedStyle(i).objectViewBox } : null;
  return { shown: !h.hidden, credit: ((h.querySelector('.credit') || {}).textContent || '').trim(), card: pic(peek), blur: pic(bg),
    slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage.slice(0, 30), sub: document.querySelector('#dkSub').textContent }; };
const newDeck = (num, name) => `(async () => { const V = window.VAULT; const L = V.CAT.rows.find(p => p.num === '${num}' && !p.sealed && p.treat === 'base') || V.CAT.rows.find(p => p.type === 'Leader' && p.img);
  const d = V.DECKS.blank(); d.name = '${name}'; d.leader = L.id; d.created = Date.now(); V.DECKS.list.push(d); V.DECKS.save(); V.go('decks'); await new Promise(r => setTimeout(r, 450)); window.scrollTo(0, 0); return \`\${L.num} \${L.name}\`; })()`;
const take109 = [
  { name: 'play-decks-under-a-ready-made-leader', run: async (page, ctx) => {
      /* a fresh phone has no deck of its own: Decks opens under the first ready-made deck's Leader */
      await ctx.open();
      /* both viewports share one browser's storage: the decks the cover run made are cleared first */
      await page.evaluate(`(async () => { const V = window.VAULT; V.DECKS.list.length = 0; V.DECKS.save(); V.MODE.set('play', true); V.go('decks'); await ${pause}; window.scrollTo(0, 0); })()`);
      await waitArt(page, '#dkHero img');
      const m = await page.evaluate(heroState);
      return { ok: m.shown && /ready-made/.test(m.credit) && m.slider === 'none' && /58%/.test(m.card ? m.card.cut : ''), ...m };
    } },
  { name: 'play-decks-under-your-newest-deck-a-stamped-card', run: async (page) => {
      /* a deck of your own whose Leader's picture carries the SAMPLE stamp (ST05-001 Shanks, looked at in step 1 of the take): the card rises cut above it */
      const leader = await page.evaluate(newDeck('ST05-001', 'Red-Haired Shanks'));
      await waitArt(page, '#dkHero img');
      const m = await page.evaluate(heroState);
      return { ok: m.shown && /your newest deck/.test(m.credit) && /^1 deck/.test(m.sub), leader, ...m };
    } },
  { name: 'play-ready-made-decks-back-on-decks', run: async (page) => {
      /* take 61 put them here; the markup had them in the deck editor from take 66 at the latest (landmine 149) */
      await page.evaluate(() => { const s = document.querySelector('#dkStock'); s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -64); });
      await waitArt(page, '#dkStock img', 6000); await wait(300);
      const m = await page.evaluate(() => { const rows = [...document.querySelectorAll('#decks #dkStock [data-stock]')];
        return { onDecks: !!document.querySelector('#decks #dkStock'), rows: rows.length, pictures: rows.filter(r => { const i = r.querySelector('img.ref'); return i && i.classList.contains('ok'); }).length,
          covers: rows.filter(r => r.querySelector('.ph svg')).length, first: ((rows[0] || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70) }; });
      return { ok: m.onDecks && m.rows >= 10 && m.covers === m.rows, ...m };
    } },
  { name: 'play-deck-leader-large', run: async (page) => {
      /* one level down (A): take 107's compact bar, the Leader card at 96 px from the large picture */
      await page.evaluate(async () => { const V = window.VAULT; const d = V.DECKS.list[V.DECKS.list.length - 1]; V.openDeck(d.id); await new Promise(r => setTimeout(r, 450)); window.scrollTo(0, 0); });
      await waitArt(page, '#dkLead img');
      const m = await page.evaluate(() => { const b = document.querySelector('#dkLead').getBoundingClientRect(), i = document.querySelector('#dkLead img');
        return { boxW: Math.round(b.width), card: i ? { ok: i.classList.contains('ok'), natural: `${i.naturalWidth}x${i.naturalHeight}` } : null, line: document.querySelector('#dkLeadLine').textContent.replace(/\s+/g, ' ').trim() }; });
      return { ok: m.boxW === 96 && /Leader/.test(m.line), ...m };
    } },
  ...[['a two-colour card', p => /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || '')], ['a one-colour card', p => /^(Red|Green|Blue|Purple|Black|Yellow)$/.test(p.color || '')]].map(([label, test], k) => ({
    name: `collect-card-page-${k ? 'one' : 'two'}-colour${k ? '' : 's'}-under-its-own-art`, run: async (page) => {
      /* a card's own page (C's backdrop): its art blurred behind the top, on its own colours; the card large and centred */
      const card = await page.evaluate(`(async () => { const V = window.VAULT; const t = ${test.toString()};
        const p = V.CAT.rows.filter(p => !p.sealed && t(p) && p.hash && p.market && /_200w\\.jpg$/.test(p.img || '')).sort((a, b) => b.market - a.market)[0];
        V.MODE.set('collect', true); await ${pause}; V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); return \`\${p.num} \${p.name} (\${p.color})\`; })()`);
      await waitArt(page, '#dArt img, #dBack img');
      const m = await page.evaluate(() => { const a = document.querySelector('#dArt').getBoundingClientRect(), i = document.querySelector('#dArt img'), b = document.querySelector('#dBack img');
        return { artW: Math.round(a.width), centred: Math.abs(a.left + a.width / 2 - innerWidth / 2) <= 1, card: i ? `${i.naturalWidth}x${i.naturalHeight}` : 'no picture', blur: b ? (b.classList.contains('ok') ? 'loaded' : 'waiting') : 'no picture',
          ground: getComputedStyle(document.querySelector('#dBack')).backgroundImage.slice(0, 70) }; });
      return { ok: m.centred && m.artW > 150 && /gradient/.test(m.ground), label, card, ...m };
    } })),
  { name: 'collect-card-page-a-sealed-product', run: async (page) => {
      /* a product has no game colour: its ground is the mode's, its own photo blurred over it */
      const product = await page.evaluate(`(async () => { const V = window.VAULT; const p = V.CAT.rows.filter(p => p.sealed && /booster box/i.test(p.name) && p.hash !== undefined && p.market).sort((a, b) => b.market - a.market)[0] || V.CAT.rows.find(p => p.sealed && p.img);
        V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); return p.name; })()`);
      await waitArt(page, '#dArt img, #dBack img');
      const m = await page.evaluate(() => ({ ground: getComputedStyle(document.querySelector('#dBack')).backgroundImage.slice(0, 80), artW: Math.round(document.querySelector('#dArt').getBoundingClientRect().width) }));
      return { ok: /gradient/.test(m.ground) && m.artW > 150, product, ...m };
    } },
  { name: 'collect-home-no-banner', run: async (page) => {
      /* the owner: "I don't really like A in collect" -- Home keeps its plain header */
      await page.evaluate(`(async () => { window.VAULT.go('home'); await ${pause}; window.scrollTo(0, 0); })()`);
      const m = await page.evaluate(() => ({ hero: !!document.querySelector('#home .arthero'), title: document.querySelector('#home .ab-title').textContent, slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage.slice(0, 30) }));
      return { ok: !m.hero && m.slider !== 'none', ...m };
    } },
  { name: 'play-decks-offline-the-cards-own-colours', run: async (page) => {
      /* no pictures: a Leader never shown before (so nothing is cached), with the picture hosts refused -- the ground is the card's colours */
      await page.route(/tcgplayer\.com\//, r => r.abort());
      const leader = await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('play', true); await ${pause}; return await ${newDeck('OP10-001', 'Offline test').replace(/^\(async \(\) => \{ /, '(async () => { ')}; })()`);
      await wait(800);
      const m = await page.evaluate(heroState);
      await page.unroute(/tcgplayer\.com\//);
      const ground = await page.evaluate(() => getComputedStyle(document.querySelector('#dkHero .artbg')).backgroundImage.slice(0, 80));
      return { ok: m.shown && !(m.card && m.card.ok) && /gradient/.test(ground), leader, ground, card: m.card, blur: m.blur };
    } },
  { name: 'play-decks-scrolled-the-fade-returns', run: async (page) => {
      /* scrolled, the slider's fade is back over whatever passes under it */
      await page.evaluate(async () => { const V = window.VAULT; V.DECKS.list.splice(V.DECKS.list.findIndex(d => d.name === 'Offline test'), 1); V.DECKS.save(); V.go('decks'); await new Promise(r => setTimeout(r, 450)); window.scrollTo(0, 260); await new Promise(r => setTimeout(r, 300)); });
      const m = await page.evaluate(() => ({ atTop: document.documentElement.classList.contains('at-top'), slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage.slice(0, 40) }));
      return { ok: !m.atTop && /gradient/.test(m.slider), ...m };
    } }
];


/* ---- take 110 — the art layer, part 2 (A42), and the owner's word on take 109's look ------------------- */
const artState = sel => `(() => { const h = document.querySelector('${sel}'); if (!h) return { shown: false }; const i = h.querySelector('.artbg img'), cs = i ? getComputedStyle(i) : null;
  return { shown: !h.hidden, img: i ? { ok: i.classList.contains('ok') && i.naturalWidth > 0, natural: i.naturalWidth + 'x' + i.naturalHeight, fit: cs.objectFit, pos: cs.objectPosition, cut: cs.objectViewBox, filter: cs.filter.slice(0, 24), large: /_in_1000x1000/.test(i.currentSrc || i.src) } : null,
    text: (h.textContent || '').trim(), rises: !!h.querySelector('.peek, img.ref'), slider: getComputedStyle(document.querySelector('.modebar')).backgroundImage.slice(0, 30) }; })()`;
const take110 = [
  { name: 'play-decks-the-leader-zoomed-out-nothing-over-it', run: async (page, ctx) => {
      /* the owner on take 109's look: "I don't like the little peak we have - the blurred background should also be
         zoomed out a bit where it's used so it's more focused on the center of the art" -- and the credit line went */
      await ctx.open();
      await page.evaluate(`(async () => { const V = window.VAULT; V.DECKS.list.length = 0; V.DECKS.save(); V.MODE.set('play', true); await ${pause}; })()`);
      const leader = await page.evaluate(newDeck('ST05-001', 'Red-Haired Shanks'));
      await waitArt(page, '#dkHero img'); await wait(300);
      const m = await page.evaluate(artState('#dkHero'));
      return { ok: m.shown && !m.rises && m.text === '' && !!m.img && m.img.fit === 'contain' && /58%/.test(m.img.cut) && m.slider === 'none', leader, ...m };
    } },
  { name: 'play-ready-made-decks-heading-and-badges-only', run: async (page) => {
      /* the owner: "remove this text ... all of it" -- the paragraph under the heading; the heading and each row's badge say ready-made */
      await page.evaluate(() => { const s = document.querySelector('#dkStock'); s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -64); });
      await waitArt(page, '#dkStock img', 6000); await wait(300);
      const m = await page.evaluate(() => ({ heading: (document.querySelector('#dkStock .fgrp') || {}).textContent, paragraph: !!document.querySelector('#dkStock .fgrp + .note'),
        rows: document.querySelectorAll('#dkStock [data-stock]').length, badges: document.querySelectorAll('#dkStock [data-stock] .badge').length }));
      return { ok: m.heading === 'Ready-made decks' && !m.paragraph && m.rows >= 10 && m.badges === m.rows, ...m };
    } },
  { name: 'play-counter-each-leader-behind-its-side', run: async (page) => {
      /* at the table (not passing the phone), each player's Leader faint behind their side of the counter */
      const who = await page.evaluate(`(async () => { const V = window.VAULT; const a = V.CAT.byId.get(V.CAT.stock[0].leader), b = V.CAT.byId.get(V.CAT.stock[2].leader);
        V.PLAY.hotseat = false; V.PLAY.p[0].leader = a.id; V.PLAY.p[1].leader = b.id; V.go('play'); V.paintPlay(); await ${pause}; window.scrollTo(0, 0); return a.name + ' / ' + b.name; })()`);
      await waitArt(page, '#plBoard .artbg img'); await wait(300);
      const m = await page.evaluate(() => [...document.querySelectorAll('#plBoard .plpanel')].map(pn => { const i = pn.querySelector('.artbg img'), P = pn.getBoundingClientRect();
        return { art: !!i && i.classList.contains('ok'), clipped: [...pn.querySelectorAll('button')].some(e => { const b = e.getBoundingClientRect(); return b.left < P.left - 0.5 || b.right > P.right + 0.5; }) }; }));
      return { ok: m.length === 2 && m.every(p => p.art && !p.clipped), who, panels: m };
    } },
  { name: 'hunt-sealed-under-the-newest-sets-top-card', run: async (page) => {
      /* A, the owner's pick for Hunt: the newest booster set's top card, sharp, cut above the stamp; the title under it */
      const card = await page.evaluate(`(async () => { const V = window.VAULT; V.PLAY.p.forEach(p => { p.leader = null; }); V.paintPlay(); V.MODE.set('hunt', true); await ${pause}; V.go('sealed'); await ${pause};
        while (V.closeAnyOverlay()) {} window.scrollTo(0, 0);   /* Hunt asks for a zip on its first visit; the sheet is not this step's subject */
        const t = V.newestTop(); return t ? t.p.num + ' ' + t.p.name + ' · ' + (t.set.abbr || t.set.name) + ' · $' + t.p.market : 'none'; })()`);
      await waitArt(page, '#sealedHero img'); await wait(300);
      const m = await page.evaluate(artState('#sealedHero'));
      const title = await page.evaluate(() => { const h = document.querySelector('#sealedHero').getBoundingClientRect(), a = document.querySelector('#sealed header.appbar').getBoundingClientRect(); return { under: Math.abs(a.top - h.bottom) < 0.6, text: document.querySelector('#sealed .ab-title').textContent }; });
      return { ok: m.shown && !!m.img && m.img.ok && m.img.large && m.img.filter === 'none' && /58%/.test(m.img.cut) && m.text === '' && title.under && m.slider === 'none', card, title, ...m };
    } },
  { name: 'hunt-sealed-set-strips', run: async (page) => {
      /* each heading in the list a strip under its own set's top card; the starter decks' under the newest deck's */
      await page.evaluate(() => { const s = [...document.querySelectorAll('#sealedList .setstrip')][1]; s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -80); });
      await waitArt(page, '#sealedList .setstrip img', 8000); await wait(400);
      const m = await page.evaluate(() => { const st = [...document.querySelectorAll('#sealedList .setstrip')];
        return { strips: st.length, withArt: st.filter(x => x.querySelector('.artbg img')).length, loaded: st.filter(x => { const i = x.querySelector('.artbg img'); return i && i.classList.contains('ok'); }).length,
          plain: st.filter(x => !x.querySelector('.artbg')).map(x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)).slice(0, 4), first: st.slice(0, 3).map(x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)) }; });
      return { ok: m.strips >= 10 && m.withArt >= 5 && m.loaded >= 1, ...m };
    } },
  { name: 'hunt-sealed-offline-the-cards-own-colours', run: async (page, ctx) => {
      /* no pictures (the hosts refused): the banner and the strips keep the card's colours and the plain ground */
      await page.route(/tcgplayer\.com\//, r => r.abort());
      await ctx.open();
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('hunt', true); await ${pause}; V.go('sealed'); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); })()`);
      await wait(1200);
      const m = await page.evaluate(() => ({ shown: !document.querySelector('#sealedHero').hidden, pictures: document.querySelectorAll('#sealedHero img').length,
        ground: getComputedStyle(document.querySelector('#sealedHero .artbg')).backgroundImage.slice(0, 80) }));
      await page.unroute(/tcgplayer\.com\//);
      return { ok: m.shown && m.pictures === 0 && /gradient/.test(m.ground), ...m };
    } },
  { name: 'collect-card-page-zoomed-out-no-note', run: async (page, ctx) => {
      /* a card's own page: the band above the stamp whole, at the top behind the title; the card itself whole (the
         owner: "It should show the whole card"); the condition line, and no note under the segment */
      await ctx.open();
      const card = await page.evaluate(`(async () => { const V = window.VAULT; const p = V.CAT.rows.filter(p => !p.sealed && p.type === 'Leader' && p.hash && p.market && /_200w\\.jpg$/.test(p.img || '')).sort((a, b) => b.market - a.market)[0];
        V.MODE.set('collect', true); await ${pause}; while (V.closeAnyOverlay()) {} V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); return p.num + ' ' + p.name; })()`);
      await waitArt(page, '#dArt img, #dBack img'); await wait(300);
      const m = await page.evaluate(() => { const b = document.querySelector('#dBack img'), cs = b ? getComputedStyle(b) : null, a = document.querySelector('#dArt img');
        return { back: cs ? { fit: cs.objectFit, pos: cs.objectPosition, cut: cs.objectViewBox } : null, whole: a ? getComputedStyle(a).objectViewBox === 'none' : false,
          line: document.querySelector('#dCond').textContent, note: !!document.querySelector('#dCondNote'), seg: document.querySelectorAll('#dCondSeg button').length }; });
      return { ok: !!m.back && m.back.fit === 'contain' && /58%/.test(m.back.cut) && m.whole && /^Condition · /.test(m.line) && !m.note && m.seg === 5, card, ...m };
    } },
  { name: 'collect-card-page-the-condition-segment-scrolled', run: async (page) => {
      /* the same page further down: the segment under its line, where the note used to be */
      await page.evaluate(() => { document.querySelector('#dCondSeg').scrollIntoView({ block: 'center', behavior: 'instant' }); });
      await wait(300);
      const m = await page.evaluate(() => ({ line: document.querySelector('#dCond').textContent, next: (document.querySelector('#dCondSeg').nextElementSibling || {}).id || '' }));
      return { ok: m.next === 'dSpread', ...m };
    } },
  /* ---- the voice (A42 layer 5): the words on the screens the collector reads most ---- */
  { name: 'voice-home-collection-and-its-delta', run: async (page, ctx) => {
      /* D17: Collection for Portfolio; a signed amount keeps its "$"; the range said in words */
      await ctx.open();
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); await ${pause}; while (V.closeAnyOverlay()) {}
        if (!V.OWN.items.length) { const top = V.CAT.rows.filter(p => !p.sealed && p.market > 20 && p.d1p != null).slice(0, 6); top.forEach(p => V.OWN.add(p.id, { qty: 1 })); }
        V.go('home'); await ${pause}; window.scrollTo(0, 0); })()`);
      await wait(400);
      const m = await page.evaluate(() => ({ cap: document.querySelector('#pfSwitch .cap').textContent, total: document.querySelector('#pfTotal').textContent, delta: document.querySelector('#pfDelta').textContent.trim().slice(0, 80),
        most: [...document.querySelectorAll('#home h3')].map(h => h.textContent).slice(0, 4) }));
      return { ok: m.cap === 'Collection' && !/in the last all time/.test(m.delta) && !/^[+−]\d/.test(m.delta), ...m };
    } },
  { name: 'voice-more-save-credits-and-what-it-does-not-know', run: async (page) => {
      /* More: the credits in the collector's words, no dev button, the gap still said */
      await page.evaluate(`(async () => { const V = window.VAULT; V.go('settings'); await ${pause}; const h = [...document.querySelectorAll('#setBody h3')].find(x => /Save credits/.test(x.textContent)); if (h) h.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -80); })()`);
      await wait(300);
      const m = await page.evaluate(() => ({ titles: [...document.querySelectorAll('#setBody h3')].map(h => h.textContent), dev: !!document.querySelector('#setBody #devEarn'),
        text: (document.querySelector('#setBody').textContent.match(/(Saving is free here[^.]*|Scanning never costs anything[^.]*)/) || [''])[0] }));
      return { ok: m.titles.includes('Save credits') && !m.dev && !!m.text, ...m };
    } },
  { name: 'voice-filter-in-the-currency-on-screen', run: async (page) => {
      /* the price filter's bounds say the currency the prices are shown in */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; V.go('search'); await ${pause}; document.querySelector('#sortBtnAll').click(); await ${pause};
        return { min: document.querySelector('#fMin').placeholder, max: document.querySelector('#fMax').placeholder, label: document.querySelector('#fMin').getAttribute('aria-label') }; })()`);
      return { ok: /^min \S+$/.test(m.min) && /^max \S+$/.test(m.max) && m.label === 'Lowest price', ...m };
    } },
  { name: 'voice-play-counter-start-and-what-happens', run: async (page) => {
      /* two words on the button; what happens beside it */
      await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); await ${pause}; V.PLAY.turn = 1; V.go('play'); V.paintPlay(); await ${pause};
        document.querySelector('#plNext').scrollIntoView({ block: 'center', behavior: 'instant' }); })()`);
      await wait(300);
      const m = await page.evaluate(() => ({ button: document.querySelector('#plNext').textContent, note: document.querySelector('#plNext').nextElementSibling.textContent }));
      return { ok: m.button === 'Start' && /first player draws no card/.test(m.note), ...m };
    } },
  { name: 'voice-releases-days-in-words', run: async (page) => {
      /* a release's day in words, the countdown beside it */
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('hunt', true); await ${pause}; V.go('releases'); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0); })()`);
      await wait(400);
      const m = await page.evaluate(() => ({ days: [...document.querySelectorAll('#relList .v b')].map(b => b.textContent).slice(0, 5) }));
      return { ok: m.days.length > 0 && m.days.every(d => /^[A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(d)), ...m };
    } },
  /* ---- polish (A42 layer 6): the empty states, the three thumbnail sizes, a condition on one line ---- */
  { name: 'polish-sealed-nothing-matches', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('hunt', true); await ${pause}; V.go('sealed'); await ${pause}; while (V.closeAnyOverlay()) {}
        const q = document.querySelector('#sealedQ'); q.value = 'zzzz'; q.dispatchEvent(new Event('input', { bubbles: true })); await ${pause};
        const e = document.querySelector('#sealedList .empty'); if (e) e.scrollIntoView({ block: 'center', behavior: 'instant' }); })()`);
      await wait(300);
      const m = await page.evaluate(() => ({ empty: (document.querySelector('#sealedList .empty') || {}).textContent || '' }));
      return { ok: /Nothing matches/.test(m.empty), ...m };   /* the picture is taken after the step: the next step clears the search */
    } },
  { name: 'polish-sealed-rows-at-the-large-thumbnail', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; const q = document.querySelector('#sealedQ'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); V.paintSealed(); await ${pause}; const r = document.querySelector('#sealedList [data-open]'); r.scrollIntoView({ block: 'center', behavior: 'instant' }); })()`);
      await wait(600);
      const m = await page.evaluate(() => { const b = document.querySelector('#sealedList [data-open] .pic').getBoundingClientRect(); return { pic: `${Math.round(b.width)}x${Math.round(b.height)}` }; });
      return { ok: m.pic === '56x70', ...m };
    } },
  { name: 'polish-search-rows-and-nothing-matches', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); await ${pause}; V.go('search'); await ${pause}; while (V.closeAnyOverlay()) {}
        const q = document.querySelector('#allq'); q.value = 'nami'; q.dispatchEvent(new Event('input', { bubbles: true })); await ${pause}; window.scrollTo(0, 0); })()`);
      await wait(700);
      const m = await page.evaluate(() => { const b = document.querySelector('#allRes .pic'); const r = b && b.getBoundingClientRect(); return { pic: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : 'none', rows: document.querySelectorAll('#allRes [data-open]').length }; });
      return { ok: m.pic === '44x61' && m.rows > 0, ...m };
    } },
  { name: 'polish-card-page-condition-on-one-line', run: async (page) => {
      const card = await page.evaluate(`(async () => { const V = window.VAULT; const p = V.CAT.rows.filter(p => !p.sealed && p.market > 50 && p.hash).sort((a, b) => b.market - a.market)[0];
        V.openDetail(p.id); await ${pause}; document.querySelector('#dCondSeg').scrollIntoView({ block: 'center', behavior: 'instant' }); return p.num + ' ' + p.name; })()`);
      await wait(400);
      const m = await page.evaluate(() => { const n = document.querySelector('#dCond'), cs = getComputedStyle(n), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.45, st = document.querySelector('.dqrow .stepper').getBoundingClientRect(), nm = document.querySelector('.dqrow .nm').getBoundingClientRect();
        return { line: n.textContent, lines: Math.round(n.getBoundingClientRect().height / lh), stepperUnder: st.top >= nm.bottom - 1 }; });   /* lines by height: getClientRects counts inline fragments */
      return { ok: m.lines === 1 && m.stepperUnder, card, ...m };   /* take 110: the condition on one line, the quantity under it */
    } },
  /* take 110's review, before the merge: what two reviewers found on the first push, as the owner will see it */
  { name: 'review-play-counter-labels-over-a-yellow-leader', run: async (page) => {
      const leader = await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('play', true); await ${pause}; while (V.closeAnyOverlay()) {} V.go('play');
        const L = V.CAT.rows.find(x => x.type === 'Leader' && x.color === 'Yellow' && x.img && !x.sealed); V.PLAY.hotseat = false; V.PLAY.p.forEach(p => { p.leader = L.id; }); V.paintPlay(); window.scrollTo(0, 0); return L.num + ' ' + L.name; })()`);
      await waitArt(page, '#plBoard .plpanel img'); await wait(400);
      const m = await page.evaluate(() => { const pn = document.querySelector('#plBoard .plpanel'), a = pn && pn.querySelector(':scope > .artbg');
        return { label: getComputedStyle(pn.querySelector('.plcols .note')).color, shade: a ? getComputedStyle(a, '::after').backgroundColor : '' }; });
      return { ok: m.shade === 'rgba(0, 0, 0, 0.45)', leader, ...m };
    } },
  { name: 'review-card-page-a-yellow-card-its-line-on-the-page', run: async (page) => {
      const card = await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); await ${pause}; while (V.closeAnyOverlay()) {}
        const p = V.CAT.rows.find(x => x.type === 'Leader' && x.color === 'Yellow' && x.img && !x.sealed); V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); return p.num + ' ' + p.name; })()`);
      await waitArt(page, '#dBack img'); await wait(300);
      const m = await page.evaluate(() => { const bk = document.getElementById('dBack').getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(document.getElementById('dSub'));
        const t = rg.getClientRects()[0]; return { w: innerWidth, artRight: Math.round(bk.right), lineLeft: t ? Math.round(t.left) : -1, lineTop: t ? Math.round(t.top) : -1, buy: getComputedStyle(document.getElementById('dBuy')).display }; });
      /* the open Fold: the art behind the card's column and the line beside it; a phone: the line under the card, as it was */
      return { ok: m.buy === 'none' && (m.w < 700 || m.artRight <= m.lineLeft), card, ...m };
    } },
  { name: 'review-home-performance-set-completion-hidden', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('collect', true); await ${pause}; while (V.closeAnyOverlay()) {} V.go('home'); V.setHomeTab(true); await ${pause}; window.scrollTo(0, 0); })()`);
      await wait(300);
      /* the tab stays on Performance for the picture; the next step turns it back */
      const m = await page.evaluate(() => { const mv = document.getElementById('topList').closest('.panel').getBoundingClientRect(); return { w: innerWidth, mv: Math.round(mv.width), comp: getComputedStyle(document.getElementById('setComp')).display }; });
      return { ok: m.comp === 'none' && (m.w < 700 || m.mv > 0.8 * m.w), ...m };
    } },
  { name: 'review-market-movers-heading-across', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; V.setHomeTab(false); V.MODE.set('collect', true); await ${pause}; while (V.closeAnyOverlay()) {} document.querySelector('#allq').value = '';
        document.querySelector('[data-act="movers"]').click(); await ${pause}; window.scrollTo(0, 0); })()`);
      await wait(300);
      const m = await page.evaluate(() => { const p = document.querySelector('#allRes > .panel'), h = p && p.querySelector(':scope > h3'); return { h3: h ? Math.round(h.getBoundingClientRect().width) : 0, panel: p ? p.clientWidth : 0 }; });
      return { ok: m.h3 > 0.8 * m.panel, ...m };
    } }
];

/* ---- take 111 — the last look: every screen and the sheets, both sizes, over a seeded phone ----
   The answer given overnight to "how many takes ... until we can hit our end goal for this redesign":
   about four more -- the voice, polish, the Fold's inner layout, and one for what the last look turns
   up. This is that look: the twenty screens and the sheets in the three modes, over a collection (a
   booster box and a DON!! card among it -- the printings with no number), a deck, a want, an alert and a
   trade, every picture read. */
const view = (name, js, { art = null, y = 0 } = {}) => ({ name, run: async (page) => {
  /* y < 0: the step placed the page itself (scrollIntoView) -- keep it */
  await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} ${js}; await ${pause}; ${y >= 0 ? `window.scrollTo(0, ${y});` : ''} })()`);
  if (art) await waitArt(page, art);
  await wait(400);
  const m = await page.evaluate(() => { const on = [...document.querySelectorAll('.screen.on')].map(e => e.id).join(','), sh = [...document.querySelectorAll('.sheet.on')].map(e => e.id).join(','), t = document.querySelector('.screen.on .ab-title');
    return { on, sheet: sh, title: t ? t.textContent.trim() : '' }; });
  return { ok: !!m.on, ...m };
} });
const take111 = [
  { name: 'collect-home-seeded', run: async (page, ctx) => {
      await ctx.open();
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
        V.OWN.items = []; V.DECKS.list.length = 0; V.DECKS.save();
        const cards = V.CAT.rows.filter(p => !p.sealed && p.market > 20 && p.hash).sort((a, b) => b.market - a.market).slice(0, 9);
        cards.forEach((p, i) => V.OWN.add(p.id, { qty: 1 + (i % 3), condition: ['NM', 'LP', 'NM', 'MP'][i % 4] }));
        const box = V.CAT.rows.find(p => V.SEALED.isProduct(p) && p.market > 50 && p.img); if (box) V.OWN.add(box.id, { qty: 1 });
        /* a printing with no number that is not a product: every one is a DON!! card filed as sealed (the first
           seed asked for !p.sealed and found none) */
        const bare = V.CAT.rows.find(p => p.sealed && !p.num && /don!! card/i.test(p.name) && p.market > 1 && p.img); if (bare) V.OWN.add(bare.id, { qty: 1 });
        V.OWN.save(); V.OWN.snapshot();   /* the app's own paths take the day's reading; the seed does it by hand */
        const w = V.CAT.rows.find(p => !p.sealed && p.num && p.market > 5 && !V.OWN.items.some(i => i.id === p.id)); if (w && !V.WANT.has(w.num)) V.WANT.toggle(w.num, w.id);
        if (!V.ALERTS.list.length) V.ALERTS.add(cards[0].id, 'below', Math.round(cards[0].market * 0.9));
        if (!V.TRADE.give.length) { V.TRADE.add('give', cards[1].id, 1); V.TRADE.add('get', cards[2].id, 1); }
        V.MODE.set('collect', true); await ${pause}; V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0);
        return { lines: V.OWN.items.length, bare: bare ? bare.name : null }; })()`);
      await waitArt(page, '#topList img'); await wait(300);
      return { ok: m.lines >= 9, ...m };
    } },
  view('collect-home-lists', `V.go('home'); V.setHomeTab(false); await ${pause}; document.getElementById('topList').scrollIntoView({ block: 'start' }); window.scrollBy(0, -60)`, { art: '#topList img', y: -1 }),
  view('collect-home-performance', `V.go('home'); V.setHomeTab(true)`),
  view('collect-search-sets', `V.setHomeTab(false); document.querySelector('#allq').value = ''; V.go('search'); V.paintSearch()`, { art: '#setList img' }),
  view('collect-search-results', `V.go('search'); const q = document.querySelector('#allq'); q.value = 'zoro'; V.paintSearch()`, { art: '#allRes img' }),
  view('collect-market-movers', `document.querySelector('#allq').value = ''; document.querySelector('[data-act="movers"]').click()`, { art: '#allRes img' }),
  view('collect-filter-sheet', `V.go('search'); document.querySelector('#sortBtnAll').click()`),
  view('collect-collection-grid', `document.querySelector('#allq').value = ''; V.go('collection')`, { art: '#colGrid img' }),
  view('collect-collection-no-number', `V.go('collection'); await ${pause}; const b = V.OWN.items.map(i => V.CAT.byId.get(i.id)).find(p => V.SEALED.isProduct(p)); const t = b && document.querySelector('#colGrid [data-open="' + b.id + '"]'); if (t) t.scrollIntoView({ block: 'center' })`, { art: '#colGrid img', y: -1 }),
  view('collect-collection-bulk', `V.go('collection'); document.querySelector('[data-act="bulk"]').click(); await ${pause}; const t = document.querySelector('#colGrid [data-open]'); if (t) t.click()`, { art: '#colGrid img' }),
  view('collect-card-page', `document.querySelector('#bulkX') && document.querySelector('#bulkX').click(); V.openDetail(V.OWN.items[0].id)`, { art: '#dArt img' }),
  view('collect-card-page-lower', `V.openDetail(V.OWN.items[0].id); await ${pause}; document.querySelector('#dCondSeg').scrollIntoView({ block: 'start' })`, { y: -1 }),
  view('collect-sealed-page', `V.openDetail(V.CAT.rows.find(p => V.SEALED.isProduct(p) && p.market > 50 && p.img).id)`, { art: '#dArt img' }),
  view('collect-don-card-page', `V.openDetail(V.OWN.items.map(i => V.CAT.byId.get(i.id)).find(p => p.sealed && !V.SEALED.isProduct(p)).id)`, { art: '#dArt img' }),
  view('collect-don-card-page-lower', `V.openDetail(V.OWN.items.map(i => V.CAT.byId.get(i.id)).find(p => p.sealed && !V.SEALED.isProduct(p)).id); await ${pause}; document.querySelector('#dCondSeg').scrollIntoView({ block: 'start' })`, { y: -1 }),
  view('collect-set-checklist', `V.openChecklist(V.CAT.byId.get(V.OWN.items[0].id).set)`, { art: '#checklist img' }),
  view('collect-binder', `V.go('binder')`, { art: '#binder img' }),
  view('collect-wants-and-alerts', `V.go('wants')`, { art: '#wants img' }),
  view('collect-trade', `V.go('trade')`, { art: '#trade img' }),
  view('collect-more', `V.go('settings')`),
  view('collect-more-lower', `V.go('settings'); await ${pause}; window.scrollTo(0, document.body.scrollHeight)`, { y: -1 }),
  view('collect-currency-picker', `V.go('home'); document.querySelector('[data-act="currency"]').click()`),
  view('collect-diagnostics', `V.go('diag')`),
  view('collect-scan', `V.go('scan')`),
  view('play-decks', `V.MODE.set('play', true); await ${pause}; if (!V.DECKS.list.length) { const L = V.CAT.byId.get(V.CAT.stock[0].leader); const d = V.DECKS.blank(); d.name = 'My first deck'; d.leader = L.id; d.created = Date.now(); V.DECKS.list.push(d); V.DECKS.save(); } V.go('decks')`, { art: '#dkHero img' }),
  view('play-deck', `V.MODE.set('play', true); await ${pause}; V.openDeck(V.DECKS.list[0].id)`, { art: '#deck img' }),
  view('play-cards', `V.MODE.set('play', true); await ${pause}; V.go('cards')`, { art: '#cdRes img' }),
  view('play-counter', `V.MODE.set('play', true); await ${pause}; V.go('play')`),
  view('play-sim', `V.MODE.set('play', true); await ${pause}; V.go('sim')`),
  view('hunt-sealed', `V.NAV.zipAsked = true; V.MODE.set('hunt', true); await ${pause}; V.go('sealed')`, { art: '#sealedHero img' }),   /* the zip is asked once; the look has seen that sheet */
  view('hunt-sealed-strips', `V.MODE.set('hunt', true); await ${pause}; V.go('sealed'); await ${pause}; const st = document.querySelectorAll('#sealedList .setstrip')[2]; if (st) st.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70)`, { art: '#sealedList .setstrip img', y: -1 }),
  view('hunt-releases', `V.MODE.set('hunt', true); await ${pause}; V.go('releases')`),
  view('hunt-local', `V.MODE.set('hunt', true); await ${pause}; V.go('local')`),
  view('hunt-events', `V.MODE.set('hunt', true); await ${pause}; V.go('events')`)
];

/* ---- take 112 — A32's second distributor: Southern Hobby beside GTS, read off its real pages ----
   The feed is the fixture smoke and render build (hunt.py --from-fixtures: the saved listing and three
   product pages); the served feed carries no Southern Hobby until this take is merged, so the page's own
   sync is stubbed on this throwaway page, or it would replace the fixture mid-step. */
let F112 = null;
const feed112 = () => {
  if (!F112) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-look-112-')), f = path.join(d, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${f}`, { cwd: ROOT, stdio: 'pipe' }); F112 = JSON.parse(fs.readFileSync(f, 'utf8')); fs.rmSync(d, { recursive: true, force: true }); }
  return F112;
};
const HUNT112 = `V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.HUNT.feed = window.__F112; V.NAV.zipAsked = true;
  for (const id of Object.keys(V.HUNT.distByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
  V.MODE.set('hunt', true); await ${pause}; V.HUNT.feed = window.__F112`;
const DLINES = `(box) => [...box.querySelectorAll('.nm > span')].filter(s => /^(GTS Distribution|Southern Hobby) · /.test(s.textContent))`;
const take112 = [
  /* the owner's word, after the first pictures: "I don't want them flooding the screen" -- a row carries each
     distributor as one short line under its chips, which opens the product's page at Distributor info; the long
     text sits under closed "Distributor info" drop-downs. Every tap below is a real click. */
  { name: 'hunt-sealed-distributor-lines', run: async (page, ctx) => {
      await ctx.open(); await page.evaluate(F => { window.__F112 = F; }, feed112());
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} ${HUNT112}; V.DISTF.open.clear(); V.go('sealed'); V.paintSealed(); await ${pause};
        const lines = [...document.querySelectorAll('#sealedList .dline')]; const row = lines.map(l => l.closest('.row')).find(r => r.querySelectorAll('.dline').length > 1) || (lines[0] && lines[0].closest('.row'));
        if (row) row.scrollIntoView({ block: 'center' });
        return { lines: lines.length, row: row ? row.querySelector('.nm b').textContent : null, its: row ? [...row.querySelectorAll('.dline')].map(l => l.textContent.trim()) : [] }; })()`);
      await waitArt(page, '#sealedList img'); await wait(300);
      return { ok: m.lines > 0 && m.its.length > 1, ...m };
    } },
  { name: 'hunt-sealed-distributor-info-closed', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112; V.DISTF.open.clear(); V.go('sealed'); V.paintSealed(); await ${pause};
        const f = document.querySelector('#sealedList [data-distfold="sealed"]'); if (f) { f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); }
        return { fold: f ? f.textContent.trim() : null, open: f ? f.getAttribute('aria-expanded') : null }; })()`);
      await wait(300);
      return { ok: m.open === 'false' && /^Distributor info/.test(m.fold || ''), ...m };
    } },
  { name: 'hunt-sealed-distributor-info-open', run: async (page) => {
      await page.evaluate(() => document.querySelector('#sealedList [data-distfold="sealed"]').scrollIntoView({ block: 'center' }));
      await page.click('#sealedList [data-distfold="sealed"]'); await wait(300);
      const m = await page.evaluate(() => { const f = document.querySelector('#sealedList [data-distfold="sealed"]'); f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140);
        return { open: f.getAttribute('aria-expanded'), secs: [...f.closest('.panel').querySelectorAll('.dsec > b')].map(b => b.textContent) }; });
      await wait(300);
      return { ok: m.open === 'true' && m.secs.join() === 'GTS Distribution,Southern Hobby', ...m };
    } },
  { name: 'hunt-sheet-from-a-distributor-line', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112; V.DISTF.open.clear(); V.go('sealed'); V.paintSealed(); await ${pause};
        const l = [...document.querySelectorAll('#sealedList .dline')].find(x => /^Southern Hobby/.test(x.textContent.trim()) && x.closest('.row').querySelectorAll('.dline').length > 1);
        l.setAttribute('data-look', 'tap'); l.scrollIntoView({ block: 'center' }); })()`);
      await page.click('#sealedList .dline[data-look="tap"]'); await wait(700);
      const m = await page.evaluate(() => { const d = document.getElementById('dDist'), f = d.querySelector('[data-distfold="detail"]');
        return { on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join(), open: f.getAttribute('aria-expanded'), top: Math.round(d.getBoundingClientRect().top), names: [...d.querySelectorAll('.dsec .nm b')].map(b => b.textContent) }; });
      return { ok: m.on === 'detail' && m.open === 'true' && m.top > 0 && m.top < 500 && m.names.length > 1, ...m };
    } },
  { name: 'hunt-releases-short-lines', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112; V.DISTF.open.clear(); V.go('releases'); V.paintReleases(); await ${pause};
        const row = [...document.querySelectorAll('#relList [data-browse-set]')].find(r => r.querySelectorAll('.nm > span[style*="display:block"]').length > 1);
        if (row) row.scrollIntoView({ block: 'center' });
        return { set: row ? row.querySelector('.nm b').textContent : null, lines: row ? [...row.querySelectorAll('.nm > span[style*="display:block"]')].map(s => s.textContent) : [] }; })()`);
      await waitArt(page, '#relList img'); await wait(300);
      return { ok: m.lines.length === 2 && m.lines.every(l => !/MSRP|release /.test(l)), ...m };
    } },
  { name: 'hunt-releases-distributor-info-closed', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112; V.DISTF.open.clear(); V.go('releases'); V.paintReleases(); await ${pause};
        const f = document.querySelector('#relList [data-distfold="releases"]'); if (f) { f.scrollIntoView({ block: 'center' }); }
        return { fold: f ? f.textContent.trim() : null, open: f ? f.getAttribute('aria-expanded') : null }; })()`);
      await wait(300);
      return { ok: m.open === 'false' && /products not in the catalogue yet/.test(m.fold || ''), ...m };
    } },
  { name: 'hunt-releases-distributor-info-open', run: async (page) => {
      await page.click('#relList [data-distfold="releases"]'); await wait(300);
      const m = await page.evaluate(() => { const f = document.querySelector('#relList [data-distfold="releases"]'); f.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140);
        return { open: f.getAttribute('aria-expanded'), rows: f.closest('.panel').querySelectorAll('.dbody .row').length }; });
      await wait(300);
      return { ok: m.open === 'true' && m.rows > 3, ...m };
    } },
  { name: 'hunt-releases-distributor-info-lower', run: async (page) => {
      const m = await page.evaluate(() => { const f = document.querySelector('#relList [data-distfold="releases"]'); const notes = [...f.closest('.panel').querySelectorAll('.note')]; const last = notes[notes.length - 1];
        last.scrollIntoView({ block: 'end' }); window.scrollBy(0, 110); return { checked: last.textContent.slice(0, 160) }; });
      await wait(300);
      return { ok: /Checked GTS Distribution .* Southern Hobby/.test(m.checked || ''), ...m };
    } },
  { name: 'hunt-sealed-sheet-no-photo-yet', run: async (page) => {
      /* the DP-13 display: the host refuses its photo (403), as it does every product too new to have one */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112;
        const it = V.HUNT.distItems().find(i => i._d === 'southern' && i.catalog_id && /Display/.test((V.CAT.byId.get(i.catalog_id) || {}).name || ''));
        const p = it && V.CAT.byId.get(it.catalog_id); if (p) V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0); return { product: p ? p.name : null }; })()`);
      await page.waitForFunction(() => { const a = document.querySelector('#dArt'), i = a && a.querySelector('img.ref'); return !i || i.classList.contains('ok'); }, null, { timeout: 12000 }).catch(() => {});
      await wait(300);
      const a = await page.evaluate(() => { const e = document.querySelector('#dArt'); return { photo: !!e.querySelector('img.ref.ok'), label: (e.querySelector('.phl') || {}).textContent || '', bg: getComputedStyle(e).backgroundColor, ground: getComputedStyle(e).backgroundImage.slice(0, 16) }; });
      return { ok: !!m.product && (a.photo ? a.bg === 'rgb(255, 255, 255)' : !!a.label && /gradient/.test(a.ground)), ...m, ...a };
    } },
  { name: 'hunt-sheet-from-its-row', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112;
        const it = V.HUNT.distItems().find(i => i._d === 'southern' && i.catalog_id && /Display/.test((V.CAT.byId.get(i.catalog_id) || {}).name || ''));
        const p = it && V.CAT.byId.get(it.catalog_id); if (p) V.openDetail(p.id); await ${pause}; const b = document.getElementById('dBuy'); if (b && !b.hidden) { b.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }
        const f = document.querySelector('#dDist [data-distfold="detail"]');
        return { product: p ? p.name : null, buy: [...document.querySelectorAll('#dBuyList .nm b')].map(x => x.textContent.trim()), dist: f ? f.getAttribute('aria-expanded') : null }; })()`);
      await waitArt(page, '#dArt img'); await wait(300);
      return { ok: !!m.product && !m.buy.some(c => /Southern Hobby|GTS/.test(c)) && m.dist === 'false', ...m };
    } },
  { name: 'diagnostics-feed-line', run: async (page) => {
      /* the report is written when Run is tapped; its network probes are stubbed here (the look's Chromium
         has no route to Pages) so the step waits on the report, not on a timeout */
      await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.feed = window.__F112; V.DIAG.probe = async () => 'not probed in the look';
        V.go('diag'); await ${pause}; document.getElementById('diagRun').click(); })()`);
      await page.waitForFunction(() => /feed on phone/.test(document.getElementById('diagOut').textContent), null, { timeout: 30000 }).catch(() => {});
      const m = await page.evaluate(() => { const pre = document.getElementById('diagOut'), w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf('feed on phone'); if (i < 0) continue;
          const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 13); window.scrollBy(0, r.getBoundingClientRect().top - innerHeight / 2);
          const e = n.data.indexOf('\n', i); return { line: n.data.slice(i, e < 0 ? undefined : e) }; }
        return { line: null }; });
      await wait(300);
      return { ok: /southern 20 products/.test(m.line || ''), ...m };
    } }
];

/* ---- take 114 — A32's distributor state timeline, from the history rows; GTS's date is its Order Due Date ----
   The feed is the fixture smoke and render build. The histories: the smoke's synthetic one ending on the feed's own
   run (4-hourly, GTS from run 6, the OP-18 box coming until the first UTC day turn at or after run 20, preorder until
   run 40, then sold out; the run before that could not reach GTS; Southern Hobby in the last two), and the saved real
   one of 24 Sept with a feed of its own last run (what the owner's phone shows today). F2 moves the box's order due
   date to the UTC day before the calendar change, so its dates explain it. The zone is the owner's (America/Detroit,
   INFERRED from 48329), set through CDP: Playwright has no emulateTimezone on a page. The syncs are stubbed, and a
   fixture is set in the same tick as its paint (landmine 166). */
let X114 = null;
const fixture114 = () => {
  if (!X114) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-look-114-')), f = path.join(d, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${f}`, { cwd: ROOT, stdio: 'pipe' });
    const F = JSON.parse(fs.readFileSync(f, 'utf8')), R0 = JSON.parse(fs.readFileSync(path.join(d, 'history-fixture.json'), 'utf8')).runs[0];   // read before the directory goes
    fs.rmSync(d, { recursive: true, force: true });
    const LIVE = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'fixtures', 'hunt_history_2026-09-24.json'), 'utf8'));
    const utcDay = (iso, add = 0) => new Date(Date.parse(iso) + add * 864e5).toISOString().slice(0, 10);
    const END = Date.parse(F.fetched_at), N = 60, G0 = 6, I2 = 40, runs = [];
    for (let k = N - 1; k >= 0; k--) runs.push({ t: new Date(END - k * 4 * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z'), online: {}, shelf: {} });
    let I1 = 20; while (utcDay(runs[I1].t) === utcDay(runs[I1 - 1].t)) I1++;
    runs.forEach((r, i) => { if (i >= G0) r.gts = { ...R0.gts, BJP2873812: i < I1 ? 'coming' : i < I2 ? 'preorder' : 'sold_out' }; if (i >= N - 2) r.southern = { ...R0.southern }; });
    delete runs[I2 - 1].gts;
    const F2 = JSON.parse(JSON.stringify(F)); F2.sources.gts.items.find(i => i.sku === 'BJP2873812').preorder = utcDay(runs[I1].t, -1);
    X114 = { F, F2, FL: { ...F, fetched_at: LIVE.runs[LIVE.runs.length - 1].t }, H: { runs, since: runs[0].t, stores: {}, titles: {} }, LIVE,
      PID: F.sources.gts.items.find(i => i.sku === 'BJP2873812').catalog_id };
  }
  return X114;
};
const HUNT114 = `V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.NAV.zipAsked = true; V.MODE.set('hunt', true); await ${pause}`;
/* TL_* stays out of window.VAULT: the words are stated here */
const TL_NOTE114 = 'Where a change worked out from its dates gives two checks, not a day, the dates it lists now do not explain it: the history keeps the state, not the date, so a moved date and a passing one look the same.';
const DTL114 = `(() => { const d = document.getElementById('dDist'), f = d && d.querySelector('[data-distfold="detail"]'), tl = k => d ? [...d.querySelectorAll('.dtl[data-tl="' + k + '"] > span')].map(s => s.textContent) : [];
  return { on: ${screens}, open: f ? f.getAttribute('aria-expanded') : null, n: d ? d.querySelectorAll('.dtl').length : 0, gts: tl('gts'), southern: tl('southern'),
    note: !!d && [...d.querySelectorAll('.note')].some(e => e.textContent.trim() === ${JSON.stringify(TL_NOTE114)}) }; })()`;
const lines114 = m => [...m.gts, ...m.southern];
/* the OP-18 box's page at Distributor info, open, over a feed and a history (expressions over X = window.__X114) */
const sheet114 = (feed, hist) => `(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} const mock = document.getElementById('look114-mock'); if (mock) mock.remove();
  V.HUNT.feed = ${feed}; V.HUNT.hist = ${hist}; V.openDetail(X.PID, { dist: true }); await ${pause};
  V.HUNT.feed = ${feed}; V.HUNT.hist = ${hist}; V.DISTF.open.add('detail'); V.paintDetailDist(V.CAT.byId.get(X.PID));
  const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return ${DTL114}; })()`;
/* every day in a span on one line: a Range over each, its client rects' distinct tops (render's take-112 probe) */
const DAYS114 = `(sel) => { const RE = /[A-Z][a-z]{2}[ \\u00a0\\u202f]\\d{1,2}(,[ \\u00a0\\u202f]\\d{4})?/g; let n = 0, worst = 0; const split = [];
  for (const el of document.querySelectorAll(sel)) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) for (const m of t.data.matchAll(RE)) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
      const tops = new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; n++; worst = Math.max(worst, tops); if (tops > 1) split.push(m[0]); } }
  return { days: n, worst, split }; }`;
const take114 = [
  /* the owner's take-112 word stands: nothing new on a row; the history is under the closed Distributor info */
  { name: 'hunt-sheet-history-closed', run: async (page, ctx) => {
      ctx.cdp114 = await page.context().newCDPSession(page); await ctx.cdp114.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Detroit' });
      await ctx.open(); await page.evaluate(X => { window.__X114 = X; }, fixture114());
      await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} ${HUNT114}; V.HUNT.feed = X.F2; V.HUNT.hist = X.H; V.DISTF.open.clear();
        const p = V.CAT.byId.get(X.PID); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); V.go('sealed'); await ${pause};
        V.HUNT.feed = X.F2; V.HUNT.hist = X.H; V.paintSealed(); const r = document.querySelector('#sealedList button.row[data-open="' + p.id + '"]'); if (r) { r.setAttribute('data-look', 'row114'); r.scrollIntoView({ block: 'center' }); } })()`);
      await page.click('#sealedList button.row[data-look="row114"]'); await wait(700);
      const m = await page.evaluate(`(() => { const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return { ...${DTL114}, zone: Intl.DateTimeFormat().resolvedOptions().timeZone }; })()`);
      await wait(300);
      return { ok: m.on === 'detail' && m.open === 'false' && m.n === 0 && m.zone === 'America/Detroit', ...m };
    } },
  /* C: a real tap opens it over F2 -- the calendar change on its own day, the site change between its two checks */
  { name: 'hunt-sheet-history-two-changes', run: async (page) => {
      await page.evaluate(() => document.querySelector('#dDist [data-distfold="detail"]').scrollIntoView({ block: 'center' }));
      await page.click('#dDist [data-distfold="detail"]'); await wait(400);
      const m = await page.evaluate(`(() => { const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return ${DTL114}; })()`);
      await wait(300); const l = lines114(m);
      return { ok: m.open === 'true' && m.n === 2 && l.some(x => /→ orders were due [A-Z][a-z]{2}\u00a0\d+ · worked out from its dates$/.test(x))
        && l.some(x => / · between .+ · read off its page$/.test(x)) && !m.note, ...m };
    } },
  /* C2: the fixture's own date (May 27) does not explain the change: its two checks stand, and the fold says why */
  { name: 'hunt-sheet-history-date-moved', run: async (page) => {
      const m = await page.evaluate(sheet114('X.F', 'X.H'));
      await wait(300);
      return { ok: m.open === 'true' && m.n === 2 && lines114(m).some(x => / · between .+ · worked out from its dates$/.test(x)) && m.note, ...m };
    } },
  /* B: today, the saved real history and a feed of its own last run -- no change yet */
  { name: 'hunt-sheet-history-today', run: async (page) => {
      const m = await page.evaluate(sheet114('X.FL', 'X.LIVE'));
      await wait(300); const l = lines114(m);
      return { ok: m.open === 'true' && m.n === 2 && l.some(x => / · no change seen$/.test(x)) && l.some(x => / — a change needs two$/.test(x)) && !m.note && !l.some(x => /copy ends/.test(x)), ...m };
    } },
  /* E, a mock-up for the owner's question 2: the history behind its one header line, tapped open -- CSS only, removed
     at the start of the next step */
  { name: 'question-history-behind-a-tap-mockup', run: async (page) => {
      await page.evaluate(sheet114('X.FL', 'X.LIVE'));
      const m = await page.evaluate(() => { const st = document.createElement('style'); st.id = 'look114-mock';
        st.textContent = '#dDist .dtl > span:not(.dtl-h){display:none!important} #dDist .dtl-h::after{content:"";display:inline-block;width:6px;height:6px;margin:0 2px 3px 8px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg)}';
        document.head.appendChild(st); const body = [...document.querySelectorAll('#dDist .dtl > span:not(.dtl-h)')], h = [...document.querySelectorAll('#dDist .dtl-h')];
        return { mockup: true, heads: h.map(s => s.textContent), hidden: body.length, landed: body.length > 0 && body.every(s => s.getBoundingClientRect().height === 0) && h.length > 0 && h.every(s => getComputedStyle(s, '::after').borderRightStyle === 'solid') }; });
      await wait(300);
      return { ok: m.landed, ...m };
    } },
  { name: 'hunt-sheet-no-history', run: async (page) => {
      const m = await page.evaluate(sheet114('X.F', 'null')), mock = await page.evaluate(() => !!document.getElementById('look114-mock'));
      await wait(300);
      return { ok: m.open === 'true' && m.n === 0 && !m.note && !mock, mock, ...m };
    } },
  /* D: a row is its name and one short line per distributor, as at take 112 -- no history on Sealed */
  { name: 'hunt-sealed-row-unchanged', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.DISTF.open.clear();
        const p = V.CAT.byId.get(X.PID); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); V.go('sealed'); V.paintSealed(); await ${pause};
        V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.paintSealed(); const l = document.querySelector('#sealedList .dline[data-open="' + p.id + '"]'), row = l && l.closest('.row'); if (row) row.scrollIntoView({ block: 'center' });
        return { row: row ? row.querySelector('.nm b').textContent : null, its: row ? [...row.querySelectorAll('.dline')].map(x => x.textContent.trim()) : [], history: /History ·/.test(document.getElementById('sealedList').textContent) }; })()`);
      await waitArt(page, '#sealedList img'); await wait(300);
      return { ok: m.its.length === 2 && !m.history, ...m };
    } },
  /* A1: PEB-01 on Releases' not-in-the-catalogue list -- GTS's date in Southern Hobby's words for the same fact */
  { name: 'releases-peb01-words', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.DISTF.open.clear(); V.DISTF.open.add('releases');
        V.go('releases'); await ${pause}; V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.paintReleases();
        const f = document.querySelector('#relList [data-distfold="releases"]'), rows = f ? [...f.closest('.panel').querySelectorAll('.dbody .row')].filter(r => /PEB-?01/.test(r.textContent)) : [];
        const line = k => { for (const r of rows) for (const s of r.querySelectorAll('.nm > span')) if (s.textContent.startsWith(k + ' · ')) return s.textContent; return null; };
        if (rows[0]) { rows[0].scrollIntoView({ block: 'start' }); window.scrollBy(0, -100); }
        return { open: f ? f.getAttribute('aria-expanded') : null, rows: rows.length, gts: line('GTS Distribution'), southern: line('Southern Hobby'), wrong: /preorders? open/i.test(document.getElementById('relList').textContent) }; })()`);
      await wait(300);
      return { ok: m.open === 'true' && [m.gts, m.southern].every(l => (l || '').includes('stores order by Oct\u00a014')) && !m.wrong, ...m };
    } },
  /* A2: Sealed's GTS counts, derived from the feed's own states */
  { name: 'sealed-gts-counts', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.DISTF.open.clear(); V.DISTF.open.add('sealed');
        V.go('sealed'); await ${pause}; V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.paintSealed();
        const sec = [...document.querySelectorAll('#sealedList .dsec')].find(s => (s.querySelector('b') || {}).textContent === 'GTS Distribution'), note = sec ? sec.querySelector('.note').textContent : '';
        if (sec) { sec.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); }
        const gi = X.F.sources.gts.items, n = s => gi.filter(i => i.status === s).length;
        return { note, want: n('coming') + ' with an order due date ahead, ' + n('preorder') + ' unreleased without one', wrong: /preorders? open/i.test(document.getElementById('sealedList').textContent) }; })()`);
      await wait(300);
      return { ok: m.note.includes(m.want) && !m.wrong, ...m };
    } },
  /* F, fixed because it was broken: a day in the distributor's long words split across lines ("release Nov" / "20" at
     411 px); no history here, so the two pictures differ by that alone */
  { name: 'hunt-sheet-long-words-day', run: async (page) => {
      const s = await page.evaluate(sheet114('X.F', 'null'));
      const m = await page.evaluate(`(${DAYS114})('#dDist .dsec .nm > span')`);
      await wait(300);
      return { ok: s.open === 'true' && m.days > 0 && m.worst === 1, open: s.open, ...m };
    } },
  { name: 'diagnostics-history-line', run: async (page, ctx) => {
      await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.FL; V.HUNT.hist = X.LIVE; V.DIAG.probe = async () => 'not probed in the look';
        V.go('diag'); await ${pause}; V.HUNT.feed = X.FL; V.HUNT.hist = X.LIVE; document.getElementById('diagRun').click(); })()`);
      await page.waitForFunction(() => /history on phone/.test(document.getElementById('diagOut').textContent), null, { timeout: 30000 }).catch(() => {});
      const m = await page.evaluate(() => { const V = window.VAULT, r = window.__X114.LIVE.runs, read = k => r.filter(x => x[k] && typeof x[k] === 'object' && !Array.isArray(x[k])).length;
        const want = `history on phone: ${r.length} runs, gts in ${read('gts')}, southern in ${read('southern')}, ends ${V.momentText(r[r.length - 1].t)}`;   // counts off the saved rows
        const pre = document.getElementById('diagOut'), w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf('history on phone'); if (i < 0) continue;
          const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 16); window.scrollBy(0, g.getBoundingClientRect().top - innerHeight / 2);
          const e = n.data.indexOf('\n', i); return { line: n.data.slice(i, e < 0 ? undefined : e), want }; }
        return { line: null, want }; });
      await wait(300);
      if (ctx.cdp114) { await ctx.cdp114.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await ctx.cdp114.detach().catch(() => {}); ctx.cdp114 = null; }   /* the zone back to the host's */
      return { ok: /\d+ runs, gts in \d+, southern in \d+, ends /.test(m.line || '') && m.line === m.want, ...m, zone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone) };
    } }
];

export const STEPS = { 98: take98, 100: take100, 104: take104, 105: take105, 106: take106, 107: take107, 108: take108, 109: take109, 110: take110, 111: take111, 112: take112, 114: take114 };
