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

/* The Fold 7, both screens MEASURED on the owner's Diagnostics from the take-114 install (More → About ×5 →
   ## device), portrait, its natural orientation: the cover screen `viewport: 411x960 @2.625` (first measured at
   take 105) and the open screen `viewport: 749x832 @2.625`. The open screen was INFERRED at 840 x 757 @2 from
   take 110 to take 114, and every inner picture of those takes was taken there (landmine 186). */
export const VIEWPORTS = {
  cover: { width: 411, height: 960, dpr: 2.625, note: 'MEASURED, the owner\'s Diagnostics' },
  inner: { width: 749, height: 832, dpr: 2.625, note: 'MEASURED, the owner\'s Diagnostics' }
};
/* take 124: the table is for normal phones and tablets too (the owner) -- two more sizes a step list may ask for, INFERRED:
   common sizes, not the owner's devices. The Fold's two stay the default for every take. */
export const SIZES = { ...VIEWPORTS,
  phone: { width: 360, height: 780, dpr: 3, note: 'INFERRED: a common Android phone' },
  tablet: { width: 1280, height: 800, dpr: 2, note: 'INFERRED: a common tablet, held landscape' } };
/* The owner's zone, MEASURED on the same Diagnostics (`tz: America/New_York`); take 114's look ran America/Detroit,
   INFERRED from the zip 48329 -- the same offsets and the same daylight-saving days in 2026. look.mjs opens every
   page in it. */
export const OWNER_TZ = 'America/New_York';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/* Landmine 143 (STAN-106-1): the mode knob is read at rest, never after a sleep sized to its slide. The listener
   is on before the switch that moves it; a switch to the mode already on moves nothing and waits for nothing; the
   cap answers a slide whose end never comes; then the knob's place is read each frame until two frames agree.
   `act` is the switch: JS run in the page (V is window.VAULT), or a function run here (a real tap). */
const knobAtRest = async (page, act) => {
  await page.evaluate(() => { const s = document.querySelector('#modeSlider'), k = s.querySelector('.knob');
    window.__knob = { from: s.className, end: new Promise(res => { k.addEventListener('transitionend', () => res(), { once: true }); setTimeout(res, 2000); }) }; });
  if (typeof act === 'function') await act(); else await page.evaluate(`(async () => { const V = window.VAULT; ${act}; })()`);
  await page.evaluate(async () => { const s = document.querySelector('#modeSlider'), k = s.querySelector('.knob'), w = window.__knob; delete window.__knob;
    if (w && s.className !== w.from) await w.end;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    for (let i = 0, x = NaN; i < 90; i++) { await frame(); const now = k.getBoundingClientRect().left; if (now === x) break; x = now; } });
};
/* the knob's centre from the centre of a mode's label, in CSS px */
const knobOffset = (page, mode) => page.evaluate(m => { const k = document.querySelector('#modeSlider .knob').getBoundingClientRect(), b = document.querySelector(`#modeSlider [data-mode="${m}"]`).getBoundingClientRect();
  return Math.round((k.left + k.width / 2) - (b.left + b.width / 2)); }, mode);
/* the slide slowed to 1.5 s, as a busy machine draws it late (the UI/UX session's VM failed take 70's knob check on
   untouched take-104 code at 350 ms) -- the selftest's control and probe */
const slowKnob = (page, on) => page.evaluate(on => { let st = document.getElementById('look-slow-knob');
  if (on && !st) { st = document.createElement('style'); st.id = 'look-slow-knob'; st.textContent = '#modeSlider .knob{transition-duration:1500ms!important}'; document.head.appendChild(st); }
  if (!on && st) st.remove(); }, on);
const screens = `[...document.querySelectorAll('.screen.on')].map(e => e.id).join(',')`;

/* ---- take 98 — the take-97 look, reviewed --------------------------------- */
const take98 = [
  { name: 'splash-colour', run: async (page, ctx) => {
      /* the opening screen must be ONE colour in every mode: read it in the first moment, before it is removed */
      await page.goto(ctx.url, { waitUntil: 'commit' });
      const bg = await page.evaluate(() => { const s = document.querySelector('#splash'); return s ? getComputedStyle(s).backgroundImage.slice(0, 48) : 'no splash yet'; });
      const shot = await ctx.shot('00-splash');
      await ctx.open();
      return { ok: /^linear-gradient\((180deg, )?rgb\(31, 61, 114\)/.test(bg), bg, shot };   /* take 116: one scene, the listing's frame, in every mode */
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

/* ---- the harness's own controls (--selftest): each must be reported NOT ok */
export const CONTROLS = [
  { name: 'control-wrong-expectation', run: async (page, ctx) => { await ctx.open(); const title = await page.title(); return { ok: title === 'not this title', title }; } },
  { name: 'control-blank-page', run: async (page) => { await page.goto('about:blank'); return { ok: true }; } },
  /* take 115 (STAN-106-1): take 106's first step read the knob 450 ms after the switch -- under the slow slide, the
     middle of it, which the knob's measure must report as off centre */
  { name: 'control-knob-read-450-ms-after-the-switch', run: async (page, ctx) => {
      await ctx.open(); await slowKnob(page, true);
      const to = await page.evaluate(async () => { const V = window.VAULT, to = V.MODE.cur === 'play' ? 'hunt' : 'play'; V.MODE.set(to, false); await new Promise(r => setTimeout(r, 450)); return to; });
      const off = await knobOffset(page, to); await slowKnob(page, false);
      return { ok: Math.abs(off) <= 2, to, knobOffset: off };
    } }
];
/* ---- and what must hold (--selftest): each must be reported ok */
export const PROBES = [
  /* the same slow slide, read through knobAtRest: it waits the slide out, and the knob sits centred */
  { name: 'probe-knob-at-rest-under-the-slow-slide', run: async (page, ctx) => {
      await ctx.open(); await slowKnob(page, true);
      const to = await page.evaluate(() => window.VAULT.MODE.cur === 'play' ? 'hunt' : 'play'), t0 = Date.now();
      await knobAtRest(page, `V.MODE.set('${to}', false)`);
      const waited = Date.now() - t0, off = await knobOffset(page, to); await slowKnob(page, false);
      return { ok: Math.abs(off) <= 2 && waited >= 1400, to, knobOffset: off, waited };
    } }
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
      await knobAtRest(page, `V.MODE.set('play', true); V.go('decks')`);   /* STAN-106-1: it slept 450 ms here, the one knob step take 106 left on a sleep */
      return page.evaluate(async () => {
        window.scrollTo(0, 0);
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
      await page.evaluate(() => { const V = window.VAULT; V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look106'); V.NAV.zipAsked = true; });
      await knobAtRest(page, `V.MODE.set('hunt', true); V.go('sealed'); while (V.closeAnyOverlay()) {}`);
      return page.evaluate(async () => {
        const k = document.querySelector('#modeSlider .knob');
        window.scrollTo(0, 0);
        const chip = document.querySelector('#sealedKinds .chip.on'); const st = chip ? getComputedStyle(chip) : null;
        const kr = k.getBoundingClientRect(), b = document.querySelector('#modeSlider [data-mode="hunt"]').getBoundingClientRect(); const off = Math.round((kr.left + kr.width / 2) - (b.left + b.width / 2));
        return { ok: !!st && st.color === 'rgb(226, 182, 90)' && Math.abs(off) <= 2, chipText: st && st.color, chipBg: st && st.backgroundColor, knobOffset: off };
      });
    } },
  { name: 'collect-empty-collection-has-its-picture', run: async (page) => {
      /* landmine 142: the empty collection named the skull (removed take 63) and drew nothing; it draws the scan card */
      await knobAtRest(page, `V.MODE.set('collect', true)`);   /* a picture mid-slide is not the screen (landmine 143) */
      return page.evaluate(async () => {
        const V = window.VAULT;
        V.go('collection'); window.scrollTo(0, 0);
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
        return { ok: nav.length === 5 && nav.every(f => f === '12px') && !!cs && cs.fontSize === '12px' && cs.color === 'rgb(179, 172, 207)', nav: nav[0], caption: cs && `${cs.fontSize} ${cs.color}` };
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
      return { ok: clean(m) && likeRef(ctx, m) && gearAtRef(ctx, m) && m.colour === 'rgb(226, 182, 90)' && !extra.swords && /prices/.test(extra.sub), ...extra, ...m };
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
      return { ok: clean(m) && likeRef(ctx, m) && gearAtRef(ctx, m) && m.colour === 'rgb(245, 203, 92)' && perf.sel === 'true' && perf.panel === 'block' && tabs.over === 'true' && tabs.h >= 44 && noteOk, perf, tabs, shot, ...m };
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
   date to the UTC day before the calendar change, so its dates explain it. The zone is the owner's: OWNER_TZ, which
   look.mjs sets on every page (take 115: America/New_York, MEASURED; this take ran America/Detroit, INFERRED from
   48329, through CDP). The syncs are stubbed, and a fixture is set in the same tick as its paint (landmine 166). */
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
  const heads = d ? [...d.querySelectorAll('.dtl-h')].map(h => ({ t: h.textContent, btn: h.tagName === 'BUTTON', exp: h.getAttribute('aria-expanded'), h: Math.round(h.getBoundingClientRect().height) })) : [];
  return { on: ${screens}, open: f ? f.getAttribute('aria-expanded') : null, n: d ? d.querySelectorAll('.dtl').length : 0, heads, gts: tl('gts'), southern: tl('southern'),
    note: !!d && [...d.querySelectorAll('.note')].some(e => e.textContent.trim() === ${JSON.stringify(TL_NOTE114)}) }; })()`;
const lines114 = m => [...m.gts, ...m.southern];
/* the OP-18 box's page at Distributor info, open, over a feed and a history (expressions over X = window.__X114) */
const sheet114 = (feed, hist) => `(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {}
  V.HUNT.feed = ${feed}; V.HUNT.hist = ${hist}; V.openDetail(X.PID, { dist: true }); await ${pause};
  V.HUNT.feed = ${feed}; V.HUNT.hist = ${hist}; V.DISTF.open.add('detail'); V.paintDetailDist(V.CAT.byId.get(X.PID)); V.distHistTap('gts'); V.distHistTap('southern');
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
      await ctx.open(); await page.evaluate(X => { window.__X114 = X; }, fixture114());
      await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} ${HUNT114}; V.HUNT.feed = X.F2; V.HUNT.hist = X.H; V.DISTF.open.clear();
        const p = V.CAT.byId.get(X.PID); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); V.go('sealed'); await ${pause};
        V.HUNT.feed = X.F2; V.HUNT.hist = X.H; V.paintSealed(); const r = document.querySelector('#sealedList button.row[data-open="' + p.id + '"]'); if (r) { r.setAttribute('data-look', 'row114'); r.scrollIntoView({ block: 'center' }); } })()`);
      await page.click('#sealedList button.row[data-look="row114"]'); await wait(700);
      const m = await page.evaluate(`(() => { const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return { ...${DTL114}, zone: Intl.DateTimeFormat().resolvedOptions().timeZone }; })()`);
      await wait(300);
      return { ok: m.on === 'detail' && m.open === 'false' && m.n === 0 && m.zone === OWNER_TZ, ...m };
    } },
  /* the owner's answer: "it should be tucked away" -- a real tap opens Distributor info, and each history is one header
     line, a closed button, until it is tapped */
  { name: 'hunt-sheet-history-tucked', run: async (page) => {
      await page.evaluate(() => document.querySelector('#dDist [data-distfold="detail"]').scrollIntoView({ block: 'center' }));
      await page.click('#dDist [data-distfold="detail"]'); await wait(400);
      const m = await page.evaluate(`(() => { const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return ${DTL114}; })()`);
      await wait(300);
      return { ok: m.open === 'true' && m.n === 2 && m.heads.length === 2 && m.heads.every(h => h.btn && h.exp === 'false' && h.h >= 44 && /^History · /.test(h.t)) && !lines114(m).length && !m.note, ...m };
    } },
  /* C: real taps on both headers, over F2 -- the calendar change on its own day, the site change between its two checks.
     The day is F2's own due date in the app's words (V.dayText, no-break spaces), so it carries its year whenever that
     is not the page's: the pattern it replaces had no year and failed each New Year's first week (the review) */
  { name: 'hunt-sheet-history-two-changes', run: async (page) => {
      for (const k of ['gts', 'southern']) { const sel = '#dDist .dtl[data-tl="' + k + '"] .dtl-h';
        await page.evaluate(q => document.querySelector(q).scrollIntoView({ block: 'center' }), sel); await page.click(sel); await wait(300); }
      const m = await page.evaluate(`(() => { const d = document.getElementById('dDist'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80);
        const it = window.__X114.F2.sources.gts.items.find(i => i.sku === 'BJP2873812');
        return { ...${DTL114}, due: window.VAULT.dayText(it.preorder).replace(/[ \\u202f]/g, '\\u00a0') }; })()`);
      await wait(300); const l = lines114(m);
      return { ok: m.open === 'true' && m.n === 2 && l.some(x => x.endsWith(`→ orders were due ${m.due} · worked out from its dates`))
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
  { name: 'hunt-sheet-no-history', run: async (page) => {
      const m = await page.evaluate(sheet114('X.F', 'null'));
      await wait(300);
      return { ok: m.open === 'true' && m.n === 0 && !m.note, ...m };
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
  /* A1: PEB-01 on Releases' not-in-the-catalogue list -- GTS's date in Southern Hobby's words for the same fact. Each
     line's day is its own source's date in the app's words (GTS's order due date, Southern Hobby's due), with its year
     whenever that is not the page's: the literal day it replaces stopped matching on New Year's Day (the review) */
  { name: 'releases-peb01-words', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.DISTF.open.clear(); V.DISTF.open.add('releases');
        V.go('releases'); await ${pause}; V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.paintReleases();
        const f = document.querySelector('#relList [data-distfold="releases"]'), rows = f ? [...f.closest('.panel').querySelectorAll('.dbody .row')].filter(r => /PEB-?01/.test(r.textContent)) : [];
        const line = k => { for (const r of rows) for (const s of r.querySelectorAll('.nm > span')) if (s.textContent.startsWith(k + ' · ')) return s.textContent; return null; };
        if (rows[0]) { rows[0].scrollIntoView({ block: 'start' }); window.scrollBy(0, -100); }
        const peb = k => X.F.sources[k].items.find(i => (i.codes || []).includes('PEB01')) || {}, by = at => at ? 'stores order by ' + V.dayText(at).replace(/[ \\u202f]/g, '\\u00a0') : null;
        return { open: f ? f.getAttribute('aria-expanded') : null, rows: rows.length, gts: line('GTS Distribution'), southern: line('Southern Hobby'), want: { gts: by(peb('gts').preorder), southern: by(peb('southern').due) },
          wrong: /preorders? open/i.test(document.getElementById('relList').textContent) }; })()`);
      await wait(300);
      return { ok: m.open === 'true' && ['gts', 'southern'].every(k => m.want[k] && (m[k] || '').includes(m.want[k])) && !m.wrong, ...m };
    } },
  /* A2: Sealed's GTS counts, derived from the feed's own dates as gtsDue says, not from its states: of the products whose
     release is after the UTC day GTS was read, those with an order due date on or after that day, and the rest -- sold
     out or not. `byState` is this take's first reading (coming / preorder), kept in the record: on the fixture it said
     "0 unreleased without one" over three unreleased products past their due date (the review) */
  { name: 'sealed-gts-counts', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT, X = window.__X114; while (V.closeAnyOverlay()) {} V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.DISTF.open.clear(); V.DISTF.open.add('sealed');
        V.go('sealed'); await ${pause}; V.HUNT.feed = X.F; V.HUNT.hist = X.H; V.paintSealed();
        const sec = [...document.querySelectorAll('#sealedList .dsec')].find(s => (s.querySelector('b') || {}).textContent === 'GTS Distribution'), note = sec ? sec.querySelector('.note').textContent : '';
        if (sec) { sec.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); }
        const G = X.F.sources.gts, gi = G.items, n = s => gi.filter(i => i.status === s).length, iso = v => typeof v === 'string' && /^\\d{4}-\\d\\d-\\d\\d$/.test(v);
        const day = new Date(Date.parse(G.fetched_at)).toISOString().slice(0, 10), un = gi.filter(i => iso(i.release) && i.release > day), ahead = un.filter(i => iso(i.preorder) && i.preorder >= day).length;
        return { note, day, unreleased: un.length, want: ahead + ' with an order due date ahead, ' + (un.length - ahead) + ' unreleased without one, ' + n('in_stock') + ' in stock for stores',
          byState: n('coming') + ' with an order due date ahead, ' + n('preorder') + ' unreleased without one', wrong: /preorders? open/i.test(document.getElementById('sealedList').textContent) }; })()`);
      await wait(300);
      return { ok: m.unreleased > 0 && m.note.includes(m.want) && !m.wrong, ...m };
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
      return { ok: /\d+ runs, gts in \d+, southern in \d+, ends /.test(m.line || '') && m.line === m.want, ...m, zone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone) };
    } }
];

/* ---- take 115 — the production baseline: the sheets take 111's tour never opened, and what this take changed ----
   The review (SPEC-111-51) found take 111's last look opened two of the sheets: the Leader sheet, a deck's printing
   sheet, the ask sheet and the scanner's picker are here, each asserted by its id. Then what the app lane changed
   that a picture shows, over take 111's seed: Home's set completion beside Most valuable at the open Fold, the
   binder's page turns, the Restore from sheet, a badged name in a deck row, a Leader whose picture is refused, the
   Sim's buttons, the sealed-only set under its own name, and a distributor the hourly run could not reach. Each
   step's ok is what it read off the page; the harness adds the sideways scroll and a picture that is not blank. */
const P115 = `const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)), words = e => e ? e.textContent.replace(/\\s+/g, ' ').trim() : null,
  sheets = () => [...document.querySelectorAll('.sheet.on')].map(e => e.id).join(','), on = () => [...document.querySelectorAll('.screen.on')].map(e => e.id).join(','),
  inside = e => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -0.5 && r.right <= innerWidth + 0.5 && e.scrollWidth <= e.clientWidth + 1; };`;
const tap = (page, sel) => page.click(sel, { timeout: 5000 });   // a real tap; a control that is not there fails in 5 s, not 30
/* the Sim's buttons as drawn: each one's words, the note beside it, whether it sits inside its panel, and on how many lines its label is set */
const SIM115 = `(() => { const q = s => document.querySelector(s), g = window.VAULT.SIM.g;
  const b = s => { const e = q(s); if (!e) return null; const n = e.nextElementSibling, r = e.getBoundingClientRect(), p = (e.closest('.panel') || q('#simBoard')).getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(e);
    return { says: e.textContent.trim(), note: n && n.matches('.note') ? n.textContent.trim() : null, inside: r.left >= p.left - 0.5 && r.right <= p.right + 0.5, lines: new Set([...g.getClientRects()].map(x => Math.round(x.top))).size }; };
  return { phase: g && g.phase, turn: g && g.turn, end: b('[data-sim="end"]'), noblock: b('[data-sim="noblock"]'), resolve: b('[data-sim="resolve"]'), post: b('[data-sim="post"]'), skip: b('[data-sim="fxskip"]'), log: b('[data-sim="sharelog"]') }; })()`;
const curtain = async page => { if (await page.evaluate(() => document.getElementById('simCurtain').classList.contains('on'))) { await tap(page, '#simCurtain'); await wait(150); } };
const into = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, sel);
/* a distributor the hourly run could not reach: tools/hunt.py's own build(), GTS answering as it did live on 25 Sept,
   over the fixture feed as the run before -- ok still true, the last good read kept, with kept and stale_since */
let K115 = null;
const kept115 = () => {
  if (!K115) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-look-115-')), f = path.join(d, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${f}`, { cwd: ROOT, stdio: 'pipe' });
    K115 = JSON.parse(execSync('python3 -', { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], input: `
import copy, importlib.util, json, sys
spec = importlib.util.spec_from_file_location("hunt_file", "tools/hunt.py"); H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
F = json.load(open(${JSON.stringify(f)}))
def answer(k):
    return (lambda *a, **kw: {"ok": False, "error": "TimeoutError: The read operation timed out"}) if k == "gts" else (lambda *a, **kw: copy.deepcopy(F["sources"][k]))
H.target.fetch, H.gts.fetch, H.southern.fetch = answer("target"), answer("gts"), answer("southern")
json.dump(H.build(F["zips"], F["radius"], previous=copy.deepcopy(F)), sys.stdout)
` }).toString());
    fs.rmSync(d, { recursive: true, force: true }); }
  return K115;
};
const take115 = [
  /* ---- Collect ---- */
  { name: 'collect-home-set-completion', run: async (page, ctx) => {
      /* take 111's seed, and one card of the promotions, the set with the most numbers (592). Set completion goes
         through pctNum (SPEC-110-48): that line reads 0.2%, where take 114 rounded it to 0%. At the open Fold it sits
         beside Most valuable -- the two panes are 700 to 899 px, and an open screen outside that fails (landmine 186) */
      await ctx.open();
      const seed = await page.evaluate(`(async () => { ${P115} while (V.closeAnyOverlay()) {}
        V.OWN.items = []; V.DECKS.list.length = 0; V.DECKS.save();
        const cards = V.CAT.rows.filter(p => !p.sealed && p.market > 20 && p.hash).sort((a, b) => b.market - a.market).slice(0, 9);
        cards.forEach((p, i) => V.OWN.add(p.id, { qty: 1 + (i % 3), condition: ['NM', 'LP', 'NM', 'MP'][i % 4] }));
        const size = new Map(); for (const p of V.CAT.rows) if (p.num) { const s = size.get(p.set) || new Set(); s.add(p.num); size.set(p.set, s); }
        const big = [...size.entries()].sort((a, b) => b[1].size - a[1].size)[0][0];
        const promo = V.CAT.rows.filter(p => p.set === big && p.num && p.market > 0).sort((a, b) => b.market - a.market)[0]; V.OWN.add(promo.id, { qty: 1 });
        V.OWN.save(); V.OWN.snapshot();
        return { lines: V.OWN.items.length, big: (V.CAT.sets.get(big) || {}).abbr + ' (' + size.get(big).size + ' numbers)', promo: promo.num + ' ' + promo.name }; })()`);
      await knobAtRest(page, `V.MODE.set('collect', true)`);
      const m = await page.evaluate(`(async () => { ${P115} V.go('home'); V.setHomeTab(false); V.paintHome(); await wait(300);
        const comp = document.getElementById('setComp'), top = document.getElementById('topList').closest('.panel'), c = comp.getBoundingClientRect(), t = top.getBoundingClientRect();
        window.scrollTo(0, Math.max(0, c.top + scrollY - 110));
        const pct = (have, all) => { const a = 100 * have / all, r = Math.round(a * 10) / 10; return (r >= 100 ? Math.round(a) : r.toFixed(1)) + '%'; };
        const lines = [...document.querySelectorAll('#setDone .row')].map(r => { const s = words(r.querySelector('.nm span')), x = /^(\\d+) of (\\d+) numbers \\u00b7 (.+)$/.exec(s || '');
          return { set: words(r.querySelector('.nm b')), says: x ? x[3] : s, want: x ? pct(+x[1], +x[2]) : '?' }; });
        return { w: innerWidth, side: c.left >= t.right - 1 && Math.abs(c.top - t.top) <= 2, under: c.top >= t.bottom - 1, cols: Math.round(t.width) + ' + ' + Math.round(c.width), lines }; })()`);
      await waitArt(page, '#topList img, #setDone img'); await wait(300);
      const layout = ctx.viewport === 'inner' ? m.w >= 700 && m.w <= 899 && m.side : m.w < 700 && m.under;
      return { ok: layout && m.lines.length > 0 && m.lines.every(l => l.says === l.want) && m.lines.some(l => /^0\.\d%$/.test(l.says)), ...seed, ...m, lines: m.lines.map(l => `${l.set}: ${l.says}${l.says === l.want ? '' : ' (want ' + l.want + ')'}`) };
    } },
  { name: 'collect-binder-turns-from-its-opening-page', run: async (page) => {
      /* SPEC-111-49: a set not paged yet opens at its first held card's page, and a turn counts from the page on
         screen -- take 114's Next went from page 3 back to page 2. One card, the 21st number of the largest set
         nothing else is in, then real taps: the set's chip, Next, Prev, Prev, Next */
      const s = await page.evaluate(`(async () => { ${P115} while (V.closeAnyOverlay()) {}
        const held = new Set(V.OWN.items.map(i => (V.CAT.byId.get(i.id) || {}).set)), size = new Map();
        for (const p of V.CAT.rows) if (p.num && !held.has(p.set)) { const s = size.get(p.set) || new Set(); s.add(p.num); size.set(p.set, s); }
        const [set, nums] = [...size.entries()].sort((a, b) => b[1].size - a[1].size)[0];
        const key = n => { const m = n.match(/(\\d+)$/); return m ? parseInt(m[1], 10) : 9999; }, order = [...nums].sort((a, b) => key(a) - key(b) || a.localeCompare(b));
        const p = V.CAT.rows.filter(x => x.set === set && x.num === order[20]).sort((a, b) => (a.treat === 'base' ? 0 : 1) - (b.treat === 'base' ? 0 : 1))[0];
        V.OWN.add(p.id, { qty: 1 }); V.OWN.save(); delete V.BN.pageOf[set]; V.go('binder'); await wait(300); window.scrollTo(0, 0);
        return { set, card: p.num + ' ' + p.name, pages: Math.ceil(order.length / 9) }; })()`);
      const pageNo = () => page.evaluate(() => { const m = /page (\d+) of (\d+)/.exec(document.getElementById('bnPage').textContent); return m ? +m[1] : null; });
      await tap(page, `#bnSets [data-bnset="${s.set}"]`); await wait(250);
      const seen = [await pageNo()];
      for (const b of ['#bnNext', '#bnPrev', '#bnPrev', '#bnNext']) {
        if (await page.$eval(b, e => e.disabled)) { seen.push('no turn'); continue; }   /* take 114 was back on page 1 by the second Prev */
        await tap(page, b); await wait(200); seen.push(await pageNo()); }
      await page.evaluate(() => window.scrollTo(0, 0)); await waitArt(page, '#bnGrid img'); await wait(300);
      const m = await page.evaluate(() => ({ sub: document.getElementById('bnPage').textContent, filled: document.getElementById('bnOf').textContent, pockets: document.querySelectorAll('#bnGrid .pocket').length }));
      return { ok: seen.join() === '3,4,3,2,3' && m.pockets === 9, seen: seen.join(' > '), ...s, ...m };
    } },
  { name: 'collect-restore-from-sheet', run: async (page) => {
      /* A2 (loose-production 4): a restore keeps what it replaces, and Restore then offers it. The app's own path in a
         browser, every tap real: Back up now; a card added; Restore from backup (with no kept copy it asks at once --
         accepted); Restore from backup again, which opens the sheet: the latest backup, what the last restore replaced
         (one line more: the card the restore took away), a file */
      await page.evaluate(`(async () => { ${P115} while (V.closeAnyOverlay()) {} localStorage.removeItem('vault.beforeRestore'); V.go('settings'); await wait(300); })()`);
      await into(page, '#setBody [data-act="backup"]'); await tap(page, '#setBody [data-act="backup"]');
      await page.waitForFunction(() => !!localStorage.getItem('vault.backup'), null, { timeout: 5000 }).catch(() => {});
      const added = await page.evaluate(() => { const V = window.VAULT, held = new Set(V.OWN.items.map(i => i.id));
        const p = V.CAT.rows.filter(x => !x.sealed && x.num && x.market > 20 && !held.has(x.id)).sort((a, b) => b.market - a.market)[0]; V.OWN.add(p.id, { qty: 1 }); return p.num + ' ' + p.name; });
      const asked = []; page.once('dialog', d => { asked.push(d.message().replace(/\s+/g, ' ').slice(0, 150)); d.accept().catch(() => {}); });
      await into(page, '#setBody [data-act="restore"]'); await tap(page, '#setBody [data-act="restore"]'); await wait(1200);   /* the restore, and the backup it schedules 400 ms after */
      await page.waitForFunction(() => !document.getElementById('toast').classList.contains('on'), null, { timeout: 8000 }).catch(() => {});   /* "Restored ..." gone, or it lies over the sheet in the picture */
      await page.evaluate(`(async () => { ${P115} V.go('settings'); await wait(300); })()`);
      await into(page, '#setBody [data-act="restore"]'); await tap(page, '#setBody [data-act="restore"]'); await wait(400);
      const s = await page.evaluate(`(async () => { ${P115} const opts = [...document.querySelectorAll('#pkOpts .opt')], n = k => { const o = opts.find(x => x.dataset.rsrc === k), m = o && /(\\d+) lines?/.exec(words(o)); return m ? +m[1] : null; };
        return { sheet: sheets(), title: words(document.getElementById('pkTitle')), opts: opts.map(o => o.dataset.rsrc + ': ' + words(o)), latest: n('latest'), kept: n('kept'),
          fits: inside(document.querySelector('#picker .sheetbody')) && opts.length > 0 && opts.every(inside) }; })()`);
      return { ok: asked.length === 1 && s.sheet === 'picker' && s.title === 'Restore from' && s.opts.map(o => o.split(':')[0]).join() === 'latest,kept,file' && s.kept === s.latest + 1 && s.fits, added, asked, ...s };
    } },
  { name: 'collect-restore-from-cross-restores-nothing', run: async (page) => {
      /* the sheet's cross settles the choice with no (SPEC-107-33): nothing restored, no confirm asked, no prompt left
         pending */
      if (!(await page.evaluate(() => document.getElementById('picker').classList.contains('on')))) return { ok: false, sheet: 'none open, nothing to close' };
      const before = await page.evaluate(() => window.VAULT.OWN.items.length), asked = [], h = d => { asked.push(d.message().slice(0, 60)); d.dismiss().catch(() => {}); }; page.on('dialog', h);
      await tap(page, '#picker [data-close="picker"]'); await wait(400); page.off('dialog', h);
      const m = await page.evaluate(`(async () => { ${P115} window.scrollTo(0, 0); return { sheet: sheets(), on: on(), pending: V.PICKER ? !!V.PICKER.settle : 'no PICKER', lines: V.OWN.items.length,
        last: words(document.querySelector('#setBody [data-act="backup"]') && document.querySelector('#setBody [data-act="backup"]').closest('.row')) }; })()`);
      return { ok: m.sheet === '' && m.on === 'settings' && m.pending === false && m.lines === before && asked.length === 0, before, asked, ...m };
    } },
  { name: 'collect-scan-which-eb03-024', run: async (page) => {
      /* SPEC-111-51: the scanner's picker, for the number the rules were written for -- EB03-024's three printings.
         In a browser the shutter scans a printing at random through the real gate (simulateScan); the draw is held
         on EB03-024's base printing for one real tap, then given back */
      const i = await page.evaluate(`(async () => { ${P115} while (V.closeAnyOverlay()) {} if (V.BATCH) V.BATCH.setId = null; V.go('scan'); await wait(300);
        const withNum = V.CAT.rows.filter(p => p.num), i = withNum.findIndex(p => p.num === 'EB03-024' && p.face === 'plain');
        window.__rnd = Math.random; const r = (i + 0.5) / withNum.length; Math.random = () => r; return i; })()`);
      await tap(page, '#btnShutter'); await page.waitForFunction(() => document.getElementById('picker').classList.contains('on'), null, { timeout: 3000 }).catch(() => {});
      const m = await page.evaluate(`(async () => { ${P115} if (window.__rnd) { Math.random = window.__rnd; delete window.__rnd; }
        const opts = [...document.querySelectorAll('#pkOpts .opt[data-pick]')], want = V.candidates('EB03-024', null).map(p => p.id).sort().join();
        return { sheet: sheets(), title: words(document.getElementById('pkTitle')), why: words(document.getElementById('pkWhy')), opts: opts.map(words), same: opts.map(o => +o.dataset.pick).sort().join() === want,
          best: !!opts[0] && opts[0].classList.contains('best'), fits: inside(document.querySelector('#picker .sheetbody')) && opts.length > 0 && opts.every(inside) }; })()`);
      await waitArt(page, '#pkOpts img'); await wait(300);
      return { ok: i >= 0 && m.sheet === 'picker' && m.title === 'Which EB03-024?' && m.opts.length === 3 && m.same && m.best && /^3 printings share EB03-024/.test(m.why || '') && m.fits, ...m };
    } },
  /* ---- Prep & Play ---- */
  { name: 'play-leader-sheet', run: async (page) => {
      /* SPEC-111-51: a deck's Leader sheet, from a real tap on its Leader */
      await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} });
      await knobAtRest(page, `V.MODE.set('play', true)`);
      const d = await page.evaluate(`(async () => { ${P115} const L = V.CAT.byId.get(V.CAT.stock[0].leader), d = V.DECKS.blank(); d.name = 'Look 115'; d.leader = L.id; d.created = Date.now();
        V.DECKS.list.push(d); V.DECKS.save(); V.openDeck(d.id); await wait(300); window.scrollTo(0, 0); return L.num + ' ' + L.name; })()`);
      await tap(page, '#dkLead'); await wait(400); await waitArt(page, '#lpList img'); await wait(300);
      const m = await page.evaluate(`(async () => { ${P115} const rows = [...document.querySelectorAll('#lpList [data-lp]')];
        return { sheet: sheets(), title: words(document.querySelector('#leaderPick .sheethead h2')), rows: rows.length, first: rows.slice(0, 2).map(words), colours: document.querySelectorAll('#lpColours [data-lpc]').length,
          fits: inside(document.querySelector('#leaderPick .sheetbody')) && rows.length > 0 && rows.every(inside) }; })()`);
      return { ok: m.sheet === 'leaderPick' && m.title === 'Choose a Leader' && m.rows > 10 && m.colours >= 6 && m.fits, deckLeader: d, ...m };
    } },
  { name: 'play-printing-sheet', run: async (page, ctx) => {
      /* SPEC-111-51: a deck row's printing sheet, from a real tap on the row's name. The card: of the Leader's colours,
         the number whose printings are furthest apart in price */
      await tap(page, '#leaderPick [data-close="leaderPick"]'); await wait(300);
      const c = await page.evaluate(`(async () => { ${P115} const d = V.DECKS.list.find(x => x.name === 'Look 115'), L = V.CAT.byId.get(d.leader); let best = null;
        for (const [, ps] of V.CAT.byNum) { if (ps.length < 2) continue; const p = ps.find(x => x.treat === 'base') || ps[0];
          if (p.type !== 'Character' || !V.colourLegal(p, L)) continue; const v = ps.map(x => x.market || 0).filter(Boolean); if (v.length < 2) continue;
          const spread = Math.max(...v) / Math.min(...v); if (!best || spread > best.spread) best = { p, spread }; }
        d.cards.push({ id: best.p.id, n: 2 }); V.DECKS.save(); V.openDeck(d.id); await wait(300);
        const n = document.querySelector('#dkRows .dkrow[data-dk="' + best.p.id + '"] .n'); if (n) { n.setAttribute('data-look', 'pp'); n.scrollIntoView({ block: 'center' }); }
        return { card: best.p.num + ' ' + best.p.name, num: best.p.num, id: best.p.id, printings: V.CAT.byNum.get(best.p.num).length }; })()`);
      await tap(page, '[data-look="pp"]'); await wait(400); await waitArt(page, '#ppList img'); await wait(300);
      const shot = await ctx.shot('07a-printing-sheet-its-title');   /* the step's own picture is scrolled to the printing in the deck now */
      const m = await page.evaluate(`(async () => { ${P115} const opts = [...document.querySelectorAll('#ppList [data-pp]')], cur = opts.find(o => +o.dataset.pp === ${c.id}); if (cur) cur.scrollIntoView({ block: 'center' });
        return { sheet: sheets(), title: words(document.getElementById('ppTitle')), opts: opts.length, now: cur ? words(cur) : null, best: !!cur && cur.classList.contains('best'),
          fits: inside(document.querySelector('#printPick .sheetbody')) && opts.length > 0 && opts.every(inside) }; })()`);
      return { ok: m.sheet === 'printPick' && m.title === `Which ${c.num} is in the deck?` && m.opts === c.printings && m.best && /in the deck now/.test(m.now || '') && m.fits, ...c, ...m, shot };
    } },
  { name: 'play-deck-badged-names-wrap', run: async (page) => {
      /* SPEC-111-50: a badged name wraps in a deck row as in a search row (landmine 164) -- the badge is the word that
         tells two printings apart, and take 114 cut it with the ellipsis. The six badged printings of the Leader's
         colours with the longest names */
      await tap(page, '#printPick [data-close="printPick"]'); await wait(300);
      const m = await page.evaluate(`(async () => { ${P115} const d = V.DECKS.list.find(x => x.name === 'Look 115'), L = V.CAT.byId.get(d.leader);
        const P = V.CAT.rows.filter(p => !p.sealed && p.num && p.treat && p.treat !== 'base' && p.market > 0 && p.type === 'Character' && V.colourLegal(p, L)).sort((a, b) => b.name.length - a.name.length || a.id - b.id).slice(0, 6);
        P.forEach(p => d.cards.push({ id: p.id, n: 1 })); V.DECKS.save(); V.openDeck(d.id); await wait(300);
        const bs = [...document.querySelectorAll('#dkRows .dkrow .n > b')].filter(b => b.querySelector(':scope > .badge'));
        const whole = bs.filter(b => { const r = b.getBoundingClientRect(), g = b.querySelector(':scope > .badge').getBoundingClientRect(); return g.right <= r.right + 0.5 && g.bottom <= r.bottom + 0.5 && b.scrollWidth <= b.clientWidth + 1; });
        const first = bs.find(b => P.some(p => b.closest('[data-dk="' + p.id + '"]'))); if (first) { first.closest('.dkrow').scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }
        return { badged: bs.length, whole: whole.length, twoLines: bs.filter(b => b.getBoundingClientRect().height > 1.5 * parseFloat(getComputedStyle(b).lineHeight)).length, longest: P[0] ? P[0].name : null }; })()`);
      await waitArt(page, '#dkRows img'); await wait(300);
      return { ok: m.badged >= 6 && m.whole === m.badged, ...m };
    } },
  { name: 'play-deck-leader-picture-refused-its-colours', run: async (page) => {
      /* SPEC-109-41: the picture hosts refused, a deck's Leader box keeps the card's own colours, where take 114 left an
         empty grey box. The oldest two-colour Leader: a picture nothing earlier asked for (the Leader sheet lists the
         newest forty) */
      await page.route(/tcgplayer\.com\//, r => r.abort());
      const m = await page.evaluate(`(async () => { ${P115} const two = V.CAT.rows.filter(p => p.type === 'Leader' && p.img && !p.sealed && /^[A-Z][a-z]+;[A-Z][a-z]+$/.test(p.color || ''))
          .sort((a, b) => ((V.CAT.sets.get(a.set) || {}).pub || '').localeCompare((V.CAT.sets.get(b.set) || {}).pub || '') || a.id - b.id), L = two[0];
        const d = V.DECKS.blank(); d.name = 'Look 115 offline'; d.leader = L.id; d.created = Date.now(); V.DECKS.list.push(d); V.DECKS.save(); V.openDeck(d.id); await wait(1500); window.scrollTo(0, 0);
        const rgb = v => { const e = document.createElement('i'); e.style.color = v; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
        const box = document.getElementById('dkLead'), bg = getComputedStyle(box).backgroundImage, want = V.artColours(L).map(rgb);
        return { leader: L.num + ' ' + L.name + ' (' + L.color + ')', picture: !!box.querySelector('img.ok'), want, ground: bg.slice(0, 110), both: want.length === 2 && want[0] !== want[1] && want.every(c => bg.includes(c)) }; })()`);
      await page.unroute(/tcgplayer\.com\//);
      return { ok: !m.picture && m.both, ...m };
    } },
  /* the Sim, a hot-seat game (a friend, pass the phone) dealt and played with real taps: SPEC-110-46, each button
     the act and what follows said beside it -- take 114's read "End turn — pass the phone", "No block → counter
     step", "Resolve — 5000 vs 5000: hit", "Done — hand back to …", "Skip (play it by hand)", "Share the game log" */
  { name: 'play-sim-end-turn', run: async (page) => {
      await page.evaluate(`(async () => { ${P115} while (V.closeAnyOverlay()) {} V.SIM.g = null; Object.assign(V.SIMUI, { sel: null, result: null, menu: null, offer: null, post: null, afterOffer: null, pre: null });
        V.go('sim'); await wait(300); window.scrollTo(0, 0); })()`);
      await tap(page, '[data-sim="start"]'); await wait(200); await curtain(page);
      for (let k = 0; k < 2; k++) { await tap(page, '[data-sim^="keep:"]'); await wait(150); await curtain(page); }
      for (let k = 0; k < 2; k++) { await tap(page, '[data-sim="end"]'); await wait(150); await curtain(page); }   /* to the first player's second turn, when a Leader may attack */
      await into(page, '[data-sim="end"]'); await wait(300);
      const m = await page.evaluate(SIM115);
      return { ok: m.phase === 'main' && m.turn === 3 && !!m.end && m.end.says === 'End turn' && m.end.note === 'then pass the phone' && m.end.inside && m.end.lines === 1 && !!m.log && m.log.says === 'Share the log', ...m };
    } },
  { name: 'play-sim-no-block', run: async (page, ctx) => {
      await tap(page, '[data-sim="attack:leader"]'); await wait(150); await tap(page, '[data-sim="target:leader"]'); await wait(200);
      let first = null; if (await page.$('[data-sim="fxskip"]')) { first = (await page.evaluate(SIM115)).skip; await ctx.shot('11a-sim-when-attacking'); await tap(page, '[data-sim="fxskip"]'); await wait(200); }   /* a [When Attacking] the app scripts comes first */
      await curtain(page); await into(page, '[data-sim="noblock"]'); await wait(300);
      const m = await page.evaluate(SIM115);
      return { ok: m.phase === 'battle' && !!m.noblock && m.noblock.says === 'No block' && m.noblock.note === 'then the counter step' && m.noblock.inside && m.noblock.lines === 1, whenAttacking: first, ...m };
    } },
  { name: 'play-sim-resolve', run: async (page) => {
      await tap(page, '[data-sim="noblock"]'); await wait(200); await into(page, '[data-sim="resolve"]'); await wait(300);
      const m = await page.evaluate(SIM115);
      return { ok: m.phase === 'battle' && !!m.resolve && m.resolve.says === 'Resolve' && /^\d+ vs \d+: (hit|held)$/.test(m.resolve.note || '') && m.resolve.inside && m.resolve.lines === 1, ...m };
    } },
  { name: 'play-sim-hand-back', run: async (page, ctx) => {
      await tap(page, '[data-sim="resolve"]'); await wait(200);
      let skips = 0; while (skips < 4 && await page.$('[data-sim="fxskip"]')) { if (!skips) await ctx.shot('13a-sim-trigger'); await tap(page, '[data-sim="fxskip"]'); await wait(200); skips++; }   /* a Life card's [Trigger] the app scripts */
      await into(page, '[data-sim="post"]'); await wait(300);
      const m = await page.evaluate(SIM115);
      return { ok: !!m.post && m.post.says === 'Hand back' && /^to You \u2014 /.test(m.post.note || '') && m.post.inside && m.post.lines === 1, skips, ...m };
    } },
  { name: 'play-sim-effect-skip', run: async (page) => {
      /* an effect's own panel: "Skip", then "play it by hand". The [On Play] of the first card in either deck the app
         scripts, offered as playing the card offers it (SIM.offers) -- nothing on the board changes */
      const c = await page.evaluate(`(async () => { ${P115} const g = V.SIM.g, i = g.active; let list = null, card = null;
        for (const id of [...new Set(g.players.flatMap(P => [...P.hand, ...P.deck]))]) { const l = V.SIM.offers(i, 'onplay', null, id); if (l && l.length) { list = l; card = V.CAT.byId.get(id); break; } }
        if (!list) return null; V.SIMUI.post = null; V.SIMUI.result = null; V.SIMUI.offer = { i, list }; V.paintSim(); await wait(200); return card.num + ' ' + card.name; })()`);
      await into(page, '[data-sim="fxskip"]'); await wait(300);
      const m = await page.evaluate(SIM115);
      return { ok: !!c && !!m.skip && m.skip.says === 'Skip' && m.skip.note === 'play it by hand' && m.skip.inside && m.skip.lines === 1, card: c, skip: m.skip };
    } },
  /* ---- Hunt ---- */
  { name: 'hunt-ask-sheet-your-zip', run: async (page) => {
      /* SPEC-111-51: the ask sheet as the collector first meets it -- Hunt's first visit asks for a zip, from a real
         tap on the knob's Hunt. The page's own syncs are stubbed: the look's Chromium has no route to Pages */
      await page.evaluate(() => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.NAV.zipAsked = false; if (V.HUNT.zip) V.HUNT.setZip(''); });
      await knobAtRest(page, () => tap(page, '#modeSlider [data-mode="hunt"]')); await wait(300);
      const m = await page.evaluate(`(async () => { ${P115} const i = document.getElementById('askIn');
        return { sheet: sheets(), on: on(), title: words(document.getElementById('askTitle')), button: words(document.getElementById('askOk')), field: i ? i.inputMode + ' ' + i.placeholder : null, focused: document.activeElement === i,
          fits: inside(document.querySelector('#askSheet .sheetbody')) }; })()`);
      return { ok: m.sheet === 'askSheet' && m.on === 'sealed' && m.title === 'Your zip code' && m.button === 'Use this zip' && m.field === 'decimal 37203' && m.fits, ...m };
    } },
  { name: 'hunt-sealed-collection-sets-under-its-name', run: async (page) => {
      /* loose-diagnostics (1): One Piece Collection Sets sells sealed product only; take 114 dropped the set while its
         products shipped, and ten priced products sat under "Other". A real tap on Cancel answers the zip; a real
         tap opens the set's strip */
      await tap(page, '#askCancel'); await wait(300);
      const g = await page.evaluate(`(async () => { ${P115} V.SEALED.kind = 'all'; V.SEALED.q = ''; V.paintSealed(); await wait(100);
        const ps = V.CAT.rows.filter(p => V.SEALED.isProduct(p) && /Devil Fruits Collection|Anniversary Set|Heroines Special Set/.test(p.name)), n = new Map();
        ps.forEach(p => n.set(p.set, (n.get(p.set) || 0) + 1)); const set = [...n.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const st = document.querySelector('#sealedList [data-setfold="' + set + '"]'); if (st) st.scrollIntoView({ block: 'center' });
        return { set, name: (V.CAT.sets.get(set) || {}).name || null, products: ps.filter(p => p.set === set).length, was: st ? st.getAttribute('aria-expanded') : null }; })()`);
      if (g.was === 'false') { await tap(page, `#sealedList [data-setfold="${g.set}"]`); await wait(300); }
      const m = await page.evaluate(`(async () => { ${P115} const st = document.querySelector('#sealedList [data-setfold="${g.set}"]'); if (!st) return { strip: null };
        st.scrollIntoView({ block: 'start' }); window.scrollBy(0, -100);
        const rows = []; for (let e = st.nextElementSibling; e && !e.matches('.setstrip'); e = e.nextElementSibling) if (e.matches('.row')) rows.push(words(e.querySelector('.nm b')));
        const other = [...document.querySelectorAll('#sealedList .setstrip')].filter(s => /^Other\\b/.test(words(s.querySelector(':scope > span')) || '')).length;
        return { strip: words(st.querySelector(':scope > span')), open: st.getAttribute('aria-expanded'), rows: rows.length, first: rows.slice(0, 2), other }; })()`);
      await waitArt(page, '#sealedList img'); await wait(300);
      return { ok: !!g.name && (m.strip || '').startsWith(g.name) && m.open === 'true' && m.rows === g.products && m.other === 0, ...g, ...m };
    } },
  { name: 'hunt-sealed-distributor-not-reached', run: async (page) => {
      /* SPEC-112-54: a distributor the hourly run could not reach keeps its last good read, ok still true. Its times
         moved here so the kept read is four hours old and has failed for three; Southern Hobby answered ten minutes
         ago. The closed Distributor info's line, then a real tap opens it at GTS's own words */
      await page.evaluate(X => { window.__K115 = X; }, kept115());
      const m = await page.evaluate(`(async () => { ${P115} const K = JSON.parse(JSON.stringify(window.__K115)), at = n => new Date(Date.now() - n * 60e3).toISOString().replace(/\\.\\d{3}Z$/, 'Z');
        K.fetched_at = at(10); K.sources.target.fetched_at = at(10); K.sources.southern.fetched_at = at(10); K.sources.gts.fetched_at = at(250); K.sources.gts.stale_since = at(190); window.__K115 = K;
        V.DISTF.open.clear(); V.go('sealed'); V.HUNT.feed = K; V.paintSealed(); await wait(100);
        const f = document.querySelector('#sealedList [data-distfold="sealed"]'); if (f) { f.setAttribute('data-look', 'dist'); f.scrollIntoView({ block: 'center' }); }
        return { kept: K.sources.gts.ok === true && K.sources.gts.kept === true, closed: f ? words(f.querySelector('.note')) : null }; })()`);
      await tap(page, '[data-look="dist"]'); await wait(300);
      const o = await page.evaluate(`(async () => { ${P115} const f = document.querySelector('#sealedList [data-distfold="sealed"]'), sec = [...document.querySelectorAll('#sealedList .dsec')].find(s => words(s.querySelector('b')) === 'GTS Distribution'), n = sec && sec.querySelector('.note');
        if (sec) { sec.scrollIntoView({ block: 'start' }); window.scrollBy(0, -150); } return { open: f ? f.getAttribute('aria-expanded') : null, gts: n ? words(n).slice(0, 170) : null, inside: inside(n) }; })()`);
      await wait(300);
      return { ok: m.kept && /\u00b7 checked \d+ min ago \u00b7 1 not reached since /.test(m.closed || '') && o.open === 'true' && /^Could not reach GTS Distribution since .+; its last check, 4 h ago, is shown/.test(o.gts || '') && o.inside, ...m, ...o };
    } },
  { name: 'hunt-product-distributor-not-reached', run: async (page) => {
      /* the same kept read on the product's own page, at its Distributor info, opened as a row's distributor line
         opens it: the OP-18 box, which both distributors list */
      const m = await page.evaluate(`(async () => { ${P115} const K = window.__K115, S = K.sources.southern.items;
        const it = K.sources.gts.items.find(i => i.catalog_id && S.some(s => s.catalog_id === i.catalog_id)) || K.sources.gts.items.find(i => i.catalog_id);
        V.HUNT.feed = K; V.openDetail(it.catalog_id, { dist: true }); await wait(300); V.HUNT.feed = K;
        const d = document.getElementById('dDist'), fb = d && d.querySelector('[data-distfold="detail"]'), sec = d ? [...d.querySelectorAll('.dsec')].find(s => words(s.querySelector('.nm b')) === 'GTS Distribution') : null;
        if (d) { d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        return { product: (V.CAT.byId.get(it.catalog_id) || {}).name || null, open: fb ? fb.getAttribute('aria-expanded') : null, fold: fb ? words(fb.querySelector('.note')) : null, gts: sec ? words(sec).slice(0, 170) : null, inside: inside(sec) }; })()`);
      await waitArt(page, '#dArt img'); await wait(300);
      return { ok: m.open === 'true' && /not reached|Could not reach/.test(`${m.fold} ${m.gts}`) && m.inside, ...m };
    } }
];

/* ---- take 116 — the first-open experience: the opening screen and the guide in the listing's frame ----------- */
const take116 = [
  { name: 'splash-scene', run: async (page, ctx) => {
      await page.goto(ctx.url, { waitUntil: 'commit' });
      const m = await page.evaluate(() => { const s = document.querySelector('#splash'); return s ? { bg: getComputedStyle(s).backgroundImage.slice(0, 48), tile: !!s.querySelector('.stile img'), sea: !!s.querySelector('.gsea svg') } : { bg: 'no splash yet' }; });
      const shot = await ctx.shot('00-splash'); await ctx.open();
      return { ok: /^linear-gradient\((180deg, )?rgb\(31, 61, 114\)/.test(m.bg) && m.tile && m.sea, ...m, shot };
    } },
  { name: 'guide-page-1-collect', run: async page => {
      await page.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith('optcghub.guide.')).forEach(k => localStorage.removeItem(k)); window.VAULT.guideOpen(); });
      await waitArt(page, '#tour .gpic img.ref'); await wait(400);
      return page.evaluate(() => ({ ok: document.querySelector('#tour').classList.contains('on') && window.VAULT.guidePage === 0, page: window.VAULT.guidePage, pics: document.querySelectorAll('#tour .gpic img.ref.ok').length }));
    } },
  { name: 'guide-next-to-page-2', run: async page => { await page.click('#tourNext'); await wait(900); return page.evaluate(() => ({ ok: window.VAULT.guidePage === 1, page: window.VAULT.guidePage, left: Math.round(document.querySelector('#tourCards').scrollLeft) })); } },
  { name: 'guide-page-3-hunt', run: async page => { await page.click('#tourNext'); await wait(900); return page.evaluate(() => ({ ok: window.VAULT.guidePage === 2, page: window.VAULT.guidePage })); } },
  { name: 'guide-page-4-yours-offline', run: async page => { await page.click('#tourNext'); await wait(900); return page.evaluate(() => ({ ok: window.VAULT.guidePage === 3 && !document.querySelector('#tourStart').hidden, page: window.VAULT.guidePage })); } },
  { name: 'guide-back-leaves-it-unseen', run: async page => {
      await page.evaluate(() => history.back()); await wait(600);
      return page.evaluate(() => ({ ok: document.querySelector('#tour').hidden && !Object.keys(localStorage).some(k => k.startsWith('optcghub.guide.') && localStorage.getItem(k) === '1'), hidden: document.querySelector('#tour').hidden, on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join() }));
    } },
  { name: 'guide-scan-a-card-from-hunt', run: async page => {
      await page.evaluate(() => { window.VAULT.MODE.set('hunt', true); }); await wait(300);
      await page.evaluate(() => { window.VAULT.guideOpen(); window.VAULT.guideGo(3); }); await wait(800);
      await page.click('#tourStart'); await wait(700);
      return page.evaluate(() => ({ ok: window.VAULT.MODE.cur === 'collect' && [...document.querySelectorAll('.screen.on')].map(e => e.id).join() === 'scan' && document.querySelector('#tour').hidden, mode: window.VAULT.MODE.cur, on: [...document.querySelectorAll('.screen.on')].map(e => e.id).join() }));
    } },
  { name: 'guide-offline-face', run: async page => {
      await page.evaluate(() => { window.VAULT.guideOpen(); document.querySelectorAll('#tour .gpic img.ref').forEach(i => i.remove()); document.querySelectorAll('#tour .gpic .ph').forEach(q => { q.style.display = ''; }); }); await wait(400);
      await page.waitForFunction(() => window.VAULT.guidePage === 0 && document.querySelector('#tourCards').scrollLeft < 2, { timeout: 3000 }).catch(() => {}); await wait(150);   /* the strip's slide back to page 1 settles first: at 749 px the picture was taken mid-slide (the take-116 port) */
      return page.evaluate(() => ({ ok: document.querySelectorAll('#tour .gpic .phl').length === 3, pills: document.querySelectorAll('#tour .gpic .phl').length }));
    } },
  { name: 'guide-again-from-more', run: async page => {
      await page.evaluate(() => { const V = window.VAULT; V.guideClose(true); V.MODE.set('collect', true); }); await wait(300);
      await page.evaluate(() => window.VAULT.go('settings')); await wait(300); await page.click('#guideAgain'); await wait(500);
      return page.evaluate(() => ({ ok: !document.querySelector('#tour').hidden && window.VAULT.guidePage === 0, page: window.VAULT.guidePage }));
    } }
];

/* ---- take 117 — the owner's polish list: what each fix looks like ------------------------------------------ */
const take117 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  view('sealed-set-strips-b3', `V.NAV.zipAsked = true; V.MODE.set('hunt', true); await ${pause}; V.SEALED.q = ''; V.SEALED.kind = 'all'; V.SEALED.closed.clear(); V.SEALED.closed.add('decks'); V.go('sealed'); V.paintSealed(); await ${pause}; const s = [...document.querySelectorAll('#sealedList .setstrip[data-setfold]:not([data-setfold="decks"])')].find(x => x.querySelector('.artbg img')); if (s) { s.scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }`, { art: '#sealedList .setstrip img', y: -1 }),
  view('sealed-starter-decks-open', `V.SEALED.closed.delete('decks'); V.paintSealed(); await ${pause}; const s = document.querySelector('[data-setfold="decks"]'); if (s) { s.scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }`, { art: '#sealedList img', y: -1 }),
  view('card-page-three-cells', `V.SEALED.closed.add('decks'); V.MODE.set('collect', true); await ${pause}; const p = V.CAT.rows.find(p => p.type === 'Character' && p.cost != null && p.cost !== '' && p.power && p.counter && p.img && p.treat !== 'base'); V.openDetail((p || V.CAT.rows.find(p => p.type === 'Character' && p.counter && p.img)).id)`, { art: '#dArt img' }),
  view('card-page-leader', `const p = V.CAT.rows.find(p => p.type === 'Leader' && p.life && p.img); V.openDetail(p.id)`, { art: '#dArt img' }),
  view('scan-shutter-row-with-torch', `V.go('scan'); await ${pause}; document.querySelector('#btnTorch').style.display = ''`),
  view('top-bar-scrolled-inset-40', `document.documentElement.style.setProperty('--safe-area-inset-top', '40px'); const p = V.CAT.rows.find(p => !p.sealed && p.img && p.market > 1); V.openDetail(p.id); await ${pause}; window.scrollTo(0, 230)`, { art: '#dArt img', y: -1 }),
  view('more-about-release-note-open', `document.documentElement.style.setProperty('--safe-area-inset-top', ''); V.go('settings'); await ${pause}; const d = document.querySelector('.wn'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }`, { y: -1 }),
  view('collection-tile-without-a-picture', `if (!V.OWN.items.length) { const c = V.CAT.rows.find(p => !p.sealed && p.img && p.market > 20); V.OWN.add(c.id, { qty: 1 }); } V.go('collection'); await ${pause}; const t = document.querySelector('#colGrid .art'); if (t) { const i = t.querySelector('img'); if (i) i.remove(); const q = t.querySelector('.ph'); if (q) q.style.display = ''; }`)
];

/* ---- take 118 — Collect on indigo and gold, Hunt in kraft, Home's premium pass ------------------------------------ */
const take118 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'collect-home-premium', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
        V.OWN.items = []; const cards = V.CAT.rows.filter(p => !p.sealed && p.market > 20 && p.hash && p.img).sort((a, b) => b.market - a.market).slice(0, 9);
        cards.forEach((p, i) => V.OWN.add(p.id, { qty: 1 + (i % 3), condition: ['NM', 'LP', 'NM', 'MP'][i % 4] })); V.OWN.save(); V.OWN.snapshot();
        const tot = V.OWN.total(); const snaps = []; for (let d = 30; d >= 0; d--) { const t = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); const k = 1 - d / 30; snaps.push([t, Math.round(tot * (0.86 + 0.14 * k + 0.02 * Math.sin(d * 1.3)) * 100) / 100]); }
        snaps[snaps.length - 1][1] = tot; V.OWN.snaps = snaps; V.OWN.save();
        V.MODE.set('collect', true); await ${pause}; V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0);
        return { shelf: document.querySelectorAll('#topList .st').length }; })()`);
      await waitArt(page, '#topList img'); await wait(500);
      return { ok: m.shelf >= 6, ...m };
    } },
  view('collect-home-shelf-and-sets', `V.go('home'); V.setHomeTab(false); await ${pause}; document.getElementById('topList').scrollIntoView({ block: 'start' }); window.scrollBy(0, -140)`, { art: '#topList img', y: -1 }),
  view('collect-home-performance', `V.go('home'); V.setHomeTab(true)`),
  view('collect-collection-grid', `V.setHomeTab(false); document.querySelector('#allq').value = ''; V.go('collection')`, { art: '#colGrid img' }),
  view('collect-card-page', `V.openDetail(V.OWN.items[0].id)`, { art: '#dArt img' }),
  view('collect-search', `document.querySelector('#allq').value = ''; V.go('search'); V.paintSearch()`, { art: '#setList img' }),
  view('hunt-sealed-kraft', `V.NAV.zipAsked = true; V.MODE.set('hunt', true); await ${pause}; V.SEALED.q = ''; V.SEALED.kind = 'all'; V.go('sealed'); V.paintSealed()`, { art: '#sealed img' }),
  view('hunt-releases-kraft', `V.go('releases')`),
  view('play-decks-unchanged', `V.MODE.set('play', true); await ${pause}; V.go('decks')`, { art: '#dkHero img' })
];

/* ---- take 119 — the surface beyond Home, the mode swipe, the tokens (the owner's picks: S1 T1 P1 swipe on) ---- */
const take119 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'collect-seed', run: async (page) => {
      /* take 118's seed (nine dear cards, a box, a month of readings) plus a want, an alert and a trade, so Wants and Trade have panels to surface; the zip for Hunt */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
        V.OWN.items = []; const cards = V.CAT.rows.filter(p => !p.sealed && p.market > 20 && p.hash && p.img).sort((a, b) => b.market - a.market).slice(0, 9);
        cards.forEach((p, i) => V.OWN.add(p.id, { qty: 1 + (i % 3), condition: ['NM', 'LP', 'NM', 'MP'][i % 4] }));
        const box = V.CAT.rows.find(p => V.SEALED.isProduct(p) && p.market > 50 && p.img); if (box) V.OWN.add(box.id, { qty: 1 });
        V.OWN.save(); V.OWN.snapshot();
        const tot = V.OWN.total(); const snaps = []; for (let d = 30; d >= 0; d--) { const t = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); const k = 1 - d / 30; snaps.push([t, Math.round(tot * (0.86 + 0.14 * k + 0.02 * Math.sin(d * 1.3)) * 100) / 100]); }
        snaps[snaps.length - 1][1] = tot; V.OWN.snaps = snaps; V.OWN.save();
        const w = V.CAT.rows.find(p => !p.sealed && p.num && p.market > 5 && !V.OWN.items.some(i => i.id === p.id)); if (w && !V.WANT.has(w.num)) V.WANT.toggle(w.num, w.id);
        if (!V.ALERTS.list.length) V.ALERTS.add(cards[0].id, 'below', Math.round(cards[0].market * 0.9));
        if (!V.TRADE.give.length) { V.TRADE.add('give', cards[1].id, 1); V.TRADE.add('get', cards[2].id, 1); }
        V.NAV.zipAsked = true; V.HUNT.setZip('48329');
        V.MODE.set('collect', true); await ${pause}; V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0);
        return { lines: V.OWN.items.length, wants: V.WANT.list.length, alerts: V.ALERTS.list.length }; })()`);
      await waitArt(page, '#topList img'); await wait(400);
      return { ok: m.lines >= 9 && m.wants >= 1 && m.alerts >= 1, ...m };
    } },
  view('collect-wants-surface', `V.go('wants')`),
  view('collect-trade-surface', `V.go('trade')`),
  view('collect-collection-tiles', `document.querySelector('#allq').value = ''; V.go('collection')`, { art: '#colGrid img' }),
  { name: 'collect-tile-bulk-selected', run: async (page) => {
      /* a bulk-selected tile keeps its inline tint and brass edge on the picked tile shape (T1: the tint replaces the gradient) */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} document.querySelector('#allq').value = ''; V.go('collection'); await ${pause};
        document.querySelector('[data-act="bulk"]').click(); await new Promise(r => setTimeout(r, 200)); document.querySelector('#colGrid [data-open]').click(); await new Promise(r => setTimeout(r, 200)); window.scrollTo(0, 0);
        const t = [...document.querySelectorAll('#colGrid .tile')].find(t => /accent-bg/.test(t.getAttribute('style') || '')), c = t && getComputedStyle(t);
        return { selected: !!t, bg: t ? c.backgroundImage.slice(0, 15) : null, edge: t ? c.borderTopColor : null, bar: !!document.getElementById('bulkX') }; })()`);
      await waitArt(page, '#colGrid img'); await wait(400);
      return { ok: m.selected && m.bar, ...m };
    } },
  { name: 'collect-tile-bulk-off', run: async (page) => { const m = await page.evaluate(() => { const x = document.getElementById('bulkX'); if (x) x.click(); return { off: !!x }; }); await wait(300); return { ok: m.off, ...m }; } },
  view('collect-card-page-surface', `V.openDetail(V.OWN.items[0].id)`, { art: '#dArt img' }),
  view('collect-search-surface', `document.querySelector('#allq').value = ''; V.go('search'); V.paintSearch()`, { art: '#setList img' }),
  view('hunt-sealed-surface', `V.MODE.set('hunt', true); await ${pause}; V.SEALED.q = ''; V.SEALED.kind = 'all'; V.go('sealed'); V.paintSealed()`, { art: '#sealed img' }),
  view('hunt-releases-surface', `V.go('releases')`),
  { name: 'hunt-local-surface-one-line-titles', run: async (page) => {
      /* the feed synced for the zip (Pages, when the VM reaches it); every panel title on Local and Events one line tall at this size --
         the long caps label wrapped inside itself in the take-119 drafts */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
        await V.HUNT.sync({ quiet: true }).catch(() => false); await V.LOCAL.syncStores().catch(() => false); await V.LOCAL.syncShops().catch(() => false); await V.LOCAL.syncZcta().catch(() => false); await V.EVENTS.sync().catch(() => false);
        V.go('local'); V.paintLocal(); await ${pause}; window.scrollTo(0, 0);
        const heads = [...document.querySelectorAll('#local .panel h3')].filter(h => h.getBoundingClientRect().height > 0).map(h => ({ text: h.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), height: Math.round(h.getBoundingClientRect().height), lineHeight: parseFloat(getComputedStyle(h).lineHeight) || 0 }));
        return { on: document.querySelector('.screen.on').id, heads, shops: document.querySelectorAll('#local .row').length }; })()`);
      await wait(400);
      return { ok: m.on === 'local' && m.heads.length >= 1 && m.heads.every(h => h.height < 2 * Math.max(14, h.lineHeight)), ...m };
    } },
  view('hunt-events-surface', `V.go('events')`),
  view('play-decks-panels', `V.MODE.set('play', true); await ${pause}; V.go('decks')`, { art: '#dkHero img' }),
  { name: 'play-deck-editor-panels', run: async (page) => {
      /* P1: the surface on the deck editor's panels -- a deck built here when the list is empty (render's take-115 badge seed is the pattern) */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {}
        if (!V.DECKS.list.length) { const d = V.DECKS.blank(); d.name = 'look 119'; d.leader = V.CAT.rows.find(p => p.type === 'Leader' && p.img).id; V.CAT.rows.filter(p => !p.sealed && p.type === 'Character' && p.market > 0 && p.img).slice(0, 12).forEach(p => d.cards.push({ id: p.id, n: 4 })); V.DECKS.list.push(d); V.DECKS.save(); }
        V.openDeck(V.DECKS.list[0].id); await ${pause}; window.scrollTo(0, 0); return { on: document.querySelector('.screen.on').id, panels: document.querySelectorAll('#deck .panel').length }; })()`);
      await waitArt(page, '#deck img'); await wait(400);
      return { ok: m.on === 'deck' && m.panels >= 2, ...m };
    } },
  view('play-counter-panels', `V.go('play')`),
  view('play-sim-panels', `V.go('sim')`),
  { name: 'mode-slide-paused-half-way', run: async (page) => {
      /* a real tap, the animations paused at 110 ms of 220 and the 400 ms timer cleared, so the picture holds the middle of the slide:
         Home leaving to the left in its indigo, Decks part-way in from the right, the knob between the two labels */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); await ${pause}; V.go('home'); V.setHomeTab(false); V.paintHome(); window.scrollTo(0, 0); await ${pause};
        document.querySelector('#modeSlider [data-mode="play"]').click();
        const anims = document.getAnimations(); anims.forEach(a => { a.pause(); a.currentTime = 110; }); clearTimeout(V.MODE._swap);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const out = document.querySelector('.screen.out'), on = document.querySelector('.screen.on');
        return { anims: anims.length, out: out ? out.id : null, on: on.id, outBg: out ? getComputedStyle(out).getPropertyValue('--bg').trim() : null, rootBg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() }; })()`);
      await wait(200);
      return { ok: m.out === 'home' && m.on === 'decks' && m.anims >= 2 && m.outBg !== m.rootBg, ...m };
    } },
  { name: 'mode-slide-finished', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; document.getAnimations().forEach(a => a.finish()); await new Promise(r => setTimeout(r, 80)); document.documentElement.classList.remove('mode-swap', 'swap-l');
        await ${pause}; return { out: !!document.querySelector('.screen.out'), on: document.querySelector('.screen.on').id, mode: V.MODE.cur, swap: document.documentElement.classList.contains('mode-swap') }; })()`);
      await waitArt(page, '#dkHero img'); await wait(300);
      return { ok: !m.out && m.on === 'decks' && m.mode === 'play' && !m.swap, ...m };
    } },
  { name: 'mode-swipe-right-to-collect', run: async (page) => {
      /* a real drag on the bar (Playwright's mouse sends pointer events): the finger goes right, Collect comes back, the knob read at rest */
      const y = await page.evaluate(() => { const b = document.querySelector('#modeSlider').getBoundingClientRect(); return b.top + b.height / 2; });
      await knobAtRest(page, async () => { await page.mouse.move(150, y); await page.mouse.down(); await page.mouse.move(300, y, { steps: 10 }); await page.mouse.up(); });
      await waitArt(page, '#topList img'); await wait(400);
      const off = await knobOffset(page, 'collect');
      const m = await page.evaluate(() => ({ mode: window.VAULT.MODE.cur, on: document.querySelector('.screen.on').id, out: !!document.querySelector('.screen.out'), knobInline: document.querySelector('#modeSlider .knob').getAttribute('style') || '' }));
      return { ok: m.mode === 'collect' && m.on === 'home' && !m.out && Math.abs(off) <= 2 && m.knobInline === '', knobOffset: off, ...m };
    } },
];
const binderStep = name => ({ name, run: async (page) => {
  /* take 120: the open Fold shows a spread of two pages, eighteen pockets, the grid above the nav with nothing to scroll for it; the cover one page of nine */
  const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); await ${pause}; V.go('binder'); await ${pause}; window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
    const g = document.getElementById('bnGrid'), r = g.getBoundingClientRect(), nav = document.querySelector('nav:not([hidden])').getBoundingClientRect(), pk = document.querySelector('.pocket'), pr = pk ? pk.getBoundingClientRect() : null;
    return { wide: innerWidth >= 700, spread: g.classList.contains('spread'), pages: g.querySelectorAll('.bnpage').length, pockets: g.querySelectorAll('.pocket').length, pocket: pr ? Math.round(pr.width) + 'x' + Math.round(pr.height) : null, gridBottom: Math.round(r.bottom), navTop: Math.round(nav.top), label: document.getElementById('bnPage').textContent, theme: document.documentElement.dataset.theme }; })()`);
  await waitArt(page, '#bnGrid img'); await wait(400);
  return { ok: m.spread === m.wide && m.pages === (m.wide ? 2 : 1) && m.pockets === (m.wide ? 18 : 9) && (!m.wide || m.gridBottom <= m.navTop), ...m };
} });
const take120 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  take119.find(st => st.name === 'collect-seed'),
  { name: 'more-appearance-dark', run: async (page) => {
      /* More > Appearance as the app opens: Dark on; the panel scrolled into view */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('settings'); await ${pause};
        const seg = document.querySelector('#themeSeg'); seg.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 200));
        const bs = [...seg.querySelectorAll('button')]; return { on: bs.filter(b => b.classList.contains('on')).map(b => b.dataset.theme).join(), words: bs.map(b => b.textContent.trim()).join('|'), tall: Math.max(...bs.map(b => Math.round(b.getBoundingClientRect().height))), theme: document.documentElement.dataset.theme, stored: localStorage.getItem('vault.theme') }; })()`);
      await wait(300);
      return { ok: m.on === 'dark' && m.theme === 'dark' && m.stored === null && m.words === 'Dark|Light|Auto' && m.tall <= 46, ...m };
    } },
  { name: 'light-switch-tap', run: async (page) => {
      /* a real tap on Light: the whole page turns, the panel stays where it is */
      await page.click('#themeSeg [data-theme="light"]'); await wait(500);
      const m = await page.evaluate(() => { const bs = [...document.querySelectorAll('#themeSeg button')]; return { on: bs.filter(b => b.classList.contains('on')).map(b => b.dataset.theme).join(), theme: document.documentElement.dataset.theme, stored: localStorage.getItem('vault.theme'), bg: getComputedStyle(document.body).backgroundColor, scheme: getComputedStyle(document.documentElement).colorScheme }; });
      return { ok: m.on === 'light' && m.theme === 'light' && m.stored === 'light' && m.bg === 'rgb(239, 233, 220)' && m.scheme === 'light', ...m };
    } },
  view('light-collect-home', `V.go('home'); V.setHomeTab(false); V.paintHome()`, { art: '#topList img' }),
  view('light-collect-card-page', `V.openDetail(V.OWN.items[0].id)`, { art: '#dArt img' }),
  view('light-collect-collection', `document.querySelector('#allq').value = ''; V.go('collection')`, { art: '#colGrid img' }),
  view('light-collect-wants', `V.go('wants')`),
  binderStep('light-binder-on-the-fold'),
  { name: 'light-sheet-on-the-scrim', run: async (page) => {
      /* the currency picker's sheet over the light page: the scrim is the light one */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('settings'); await ${pause}; V.pickCurrency(); await new Promise(r => setTimeout(r, 600));
        const sh = document.querySelector('.sheet.on'); return { sheet: sh ? sh.id : null, scrim: sh ? getComputedStyle(sh).backgroundColor : null }; })()`);
      await wait(300);
      return { ok: !!m.sheet && /^rgba\(20, 16, 10/.test(m.scrim || ''), ...m };
    } },
  view('light-play-decks', `V.MODE.set('play', true); await ${pause}; V.go('decks')`, { art: '#dkHero img' }),
  view('light-play-counter', `V.go('play')`),
  take119.find(st => st.name === 'play-deck-editor-panels'),
  { name: 'light-deck-rows-second-line-wraps', run: async (page) => {
      /* take 120: a deck row's second line wraps instead of cutting its end (the keyword tags) -- no span wider than its box, at either size */
      const m = await page.evaluate(() => { const r0 = document.querySelector('#deck .dkrow'); if (r0) r0.scrollIntoView({ block: 'start' }); const spans = [...document.querySelectorAll('#deck .dkrow .n > span')]; return { on: document.querySelector('.screen.on').id, rows: spans.length, tags: spans.filter(s => s.querySelector('.kwtag')).length, clipped: spans.filter(s => s.scrollWidth > s.clientWidth + 1).length, twoLines: spans.filter(s => s.getBoundingClientRect().height > 20).length }; });
      await wait(200);
      return { ok: m.on === 'deck' && m.rows >= 3 && m.clipped === 0, ...m };
    } },
  view('light-hunt-sealed', `V.MODE.set('hunt', true); await ${pause}; V.SEALED.q = ''; V.SEALED.kind = 'all'; V.go('sealed'); V.paintSealed()`, { art: '#sealed img' }),
  view('light-hunt-releases', `V.go('releases')`),
  { name: 'light-slide-paused-half-way', run: async (page) => {
      /* the slide in light, paused at 110 ms: Sealed leaving to the right in its cream, Home part-way in from the left in the parchment */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('sealed'); await ${pause}; window.scrollTo(0, 0); await ${pause};
        document.querySelector('#modeSlider [data-mode="collect"]').click();
        const anims = document.getAnimations(); anims.forEach(a => { a.pause(); a.currentTime = 110; }); clearTimeout(V.MODE._swap);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const out = document.querySelector('.screen.out'), on = document.querySelector('.screen.on');
        return { anims: anims.length, out: out ? out.id : null, on: on.id, outBg: out ? getComputedStyle(out).getPropertyValue('--bg').trim() : null, rootBg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() }; })()`);
      await wait(200);
      return { ok: m.out === 'sealed' && m.on === 'home' && m.anims >= 2 && m.outBg !== m.rootBg && m.rootBg.toUpperCase() === '#EFE9DC', ...m };
    } },
  { name: 'light-slide-finished', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; document.getAnimations().forEach(a => a.finish()); await new Promise(r => setTimeout(r, 80)); document.documentElement.classList.remove('mode-swap', 'swap-l');
        await ${pause}; return { out: !!document.querySelector('.screen.out'), on: document.querySelector('.screen.on').id, mode: V.MODE.cur, swap: document.documentElement.classList.contains('mode-swap') }; })()`);
      await waitArt(page, '#topList img'); await wait(300);
      return { ok: !m.out && m.on === 'home' && m.mode === 'collect' && !m.swap, ...m };
    } },
  { name: 'auto-follows-a-dark-phone', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.THEME.set('system'); })()`);
      await page.emulateMedia({ colorScheme: 'dark' }); await wait(500);
      const m = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('vault.theme'), bg: getComputedStyle(document.body).backgroundColor }));
      return { ok: m.theme === 'dark' && m.stored === 'system' && m.bg === 'rgb(16, 13, 34)', ...m };
    } },
  { name: 'auto-follows-a-light-phone', run: async (page) => {
      await page.emulateMedia({ colorScheme: 'light' }); await wait(500);
      const m = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('vault.theme'), bg: getComputedStyle(document.body).backgroundColor }));
      return { ok: m.theme === 'light' && m.stored === 'system' && m.bg === 'rgb(239, 233, 220)', ...m };
    } },
  { name: 'more-appearance-back-to-dark', run: async (page) => {
      await page.emulateMedia({ colorScheme: null });
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('settings'); await ${pause}; V.THEME.set('dark'); await new Promise(r => setTimeout(r, 300));
        const seg = document.querySelector('#themeSeg'); seg.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 200));
        const m = { on: [...seg.querySelectorAll('button.on')].map(b => b.dataset.theme).join(), theme: document.documentElement.dataset.theme, stored: localStorage.getItem('vault.theme'), bg: getComputedStyle(document.body).backgroundColor };
        localStorage.removeItem('vault.theme'); return m; })()`);
      await wait(300);
      return { ok: m.on === 'dark' && m.theme === 'dark' && m.stored === 'dark' && m.bg === 'rgb(16, 13, 34)', ...m };
    } },
  binderStep('dark-binder-on-the-fold'),
];
/* ---- take 122 \u2014 the Sim's engine: Luffy once, by hand bounded, the sixth Character, the proof marks, the Rules sheet ----
   A board is set through the engine (SIM.act) with a planted hand or field where a picture needs one; the taps the
   owner would make are real clicks. The curtain between seats is lifted so the board itself is in the picture. */
const simBoard = (js) => `(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); await ${pause}; V.go('sim'); await ${pause};
  const S = V.SIM, stock = id => V.CAT.stock.find(d => d.id === id), num = n => V.CAT.rows.find(p => p.num === n && !p.sealed);
  const deal = (a, b, seed) => { S.new({ ...a, name: 'Player 1' }, { ...b, name: 'Player 2' }, 0, { seed }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' });
    Object.assign(V.SIMUI, { sel: null, post: null, room: null, fxt: null, result: null }); };
  ${js}
  document.querySelector('#simCurtain').classList.remove('on'); V.paintSim(); window.scrollTo(0, 0); await ${pause};
  const b = document.querySelector('#simBoard'); return { text: b.textContent, buttons: [...b.querySelectorAll('[data-sim]')].map(x => x.dataset.sim) }; })()`;
const simRead = () => { const b = document.querySelector('#simBoard'); window.scrollTo(0, 0); return { text: b.textContent, buttons: [...b.querySelectorAll('[data-sim]')].map(x => x.dataset.sim) }; };
const take122 = [
  { name: 'sim-setup-with-the-rules-button', run: async (page, ctx) => {
      await ctx.open();
      const m = await page.evaluate(`(async () => { const V = window.VAULT; V.MODE.set('play', true); await ${pause}; V.SIM.g = null; V.go('sim'); await ${pause}; window.scrollTo(0, 0);
        const sec = document.querySelector('#sim'); return { on: ${screens}, rules: !!sec.querySelector('header [data-rules]'), setup: /New game/.test(document.querySelector('#simBoard').textContent) }; })()`);
      await wait(300);
      return { ok: m.on === 'sim' && m.rules && m.setup, ...m };
    } },
  { name: 'sim-st01-luffy-main-on-the-leader', run: async (page) => {
      /* ST01 against ST02, seat 1's turn passed: Luffy's Main is on the Leader's line, with two rested DON!! to give */
      const m = await page.evaluate(simBoard(`deal(stock('stock-st01'), stock('stock-st02'), 12); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); const P = S.P(0); P.don.rested += 2; P.don.active -= 2;`));
      await wait(300);
      return { ok: m.buttons.includes('fxmain:leader'), buttons: m.buttons.join(' ') };
    } },
  { name: 'sim-luffy-offer-marked-proven', run: async (page) => {
      /* a real tap on Main: the offer says what the app will do and carries Report; take 126 leaves a proven line unmarked
         (the owner: "make it more human") -- no test's words on it */
      await page.click('#simBoard [data-sim="fxmain:leader"]'); await wait(500);
      const m = await page.evaluate(simRead);
      return { ok: !/proven by a test|no test has proven|Not checked yet/.test(m.text) && /The app will: \[Activate: Main\] once per turn/.test(m.text) && m.buttons.includes('fx:L') && m.buttons.includes('report'), buttons: m.buttons.filter(b => /^fx|report/.test(b)).join(' ') };
    } },
  { name: 'sim-luffy-once-then-refused-with-the-reason', run: async (page) => {
      /* the DON!! lands on the Leader; the Main button is gone, and a second activation is refused with its section */
      await page.click('#simBoard [data-sim="fx:L"]'); await wait(400);
      const m = await page.evaluate(() => { const V = window.VAULT; const r = V.simAct(0, { t: 'activate', ref: 'leader' }); V.paintSim(); window.scrollTo(0, 0);
        return { don: V.SIM.P(0).leader.don, why: r.why || '', main: !!document.querySelector('#simBoard [data-sim="fxmain:leader"]'), toast: document.querySelector('#toast').textContent }; });
      await wait(200);
      return { ok: m.don === 1 && !m.main && /once per turn/.test(m.why), ...m };
    } },
  { name: 'sim-sixth-character-choose-one-to-trash', run: async (page) => {
      /* five Characters in play and a sixth played: the rules' choice (§3-7-6-1), not a refusal */
      await page.evaluate(simBoard(`deal(stock('stock-st01'), stock('stock-st02'), 13); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); const P = S.P(0), k = num('ST01-003');
        P.chars = [0, 1, 2, 3, 4].map(() => S.inst(k.id, 1)); P.hand = [k.id].concat(P.hand.slice(0, 3));`));
      await page.click('#simBoard [data-sim="play:0"]'); await wait(500);
      const m = await page.evaluate(simRead);
      return { ok: /Five Characters/.test(m.text) && m.buttons.filter(b => /^room:/.test(b)).length === 5, room: m.buttons.filter(b => /^room:/.test(b)).join(' ') };
    } },
  { name: 'sim-by-hand-offered-at-its-timing', run: async (page) => {
      /* a Character whose [On Play] no template runs: played, its line is offered by hand, marked so */
      const m0 = await page.evaluate(simBoard(`deal(stock('stock-st01'), stock('stock-st02'), 14); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
        const E = V.CAT.effects, id = +Object.keys(E).find(k => { const p = V.CAT.byId.get(+k); return p && p.type === 'Character' && !p.sealed && S.cost(p) <= 3 && E[k].length === 1 && E[k][0].hand && E[k][0].t === 'onplay' && Object.keys(S.handOps(E[k][0].raw)).length >= 1; });
        S.P(0).hand[0] = id; window.__handCard = V.CAT.byId.get(id).num + ' ' + V.CAT.byId.get(id).name;`));
      await page.click('#simBoard [data-sim="play:0"]'); await wait(500);
      const m = await page.evaluate(simRead), card = await page.evaluate(() => window.__handCard);
      return { ok: m.buttons.includes('fxhand') && m.buttons.includes('fxskip') && /by hand/.test(m.text), card, start: m0.buttons.length };
    } },
  { name: 'sim-by-hand-tray-names-only-its-moves', run: async (page) => {
      await page.click('#simBoard [data-sim="fxhand"]'); await wait(500);
      const m = await page.evaluate(simRead);
      return { ok: m.buttons.includes('hdone') && /Only the moves its words name/.test(m.text), moves: m.buttons.filter(b => /^hop:/.test(b)).length };
    } },
  { name: 'sim-st08-when-a-character-is-ko', run: async (page) => {
      /* ST08's Leader: its Leader K.O.s a rested Character, and "give up to 1 rested DON!! to this Leader" is offered, scripted */
      const m = await page.evaluate(simBoard(`const d8 = stock('stock-st08'); if (d8) { deal(d8, stock('stock-st01'), 15); S.act(0, { t: 'end' }); S.act(1, { t: 'end' }); const P = S.P(0); P.don.rested += 1; P.don.active -= 1;
        S.P(1).chars = [Object.assign(S.inst(num('ST01-003').id, 1), { rested: true })]; S.act(0, { t: 'attack', ref: 'leader', target: 0 });
        for (let k = 0; k < 9 && S.g.queue.length; k++) S.act(S.who(), { t: 'fxskip' }); S.act(1, { t: 'noblock' }); S.act(1, { t: 'resolve' }); }`));
      await wait(300);
      return { ok: /When a Character is K\.O\./.test(m.text) && /The app will/.test(m.text) && m.buttons.includes('fx:L'), buttons: m.buttons.filter(b => /^fx/.test(b)).join(' ') };
    } },
  { name: 'sim-continuous-text-is-the-players', run: async (page) => {
      /* a Character with a continuous line no template reads: the board says so beside its power */
      const m = await page.evaluate(simBoard(`deal(stock('stock-st01'), stock('stock-st02'), 16); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });
        const E = V.CAT.effects, id = +Object.keys(E).find(k => { const p = V.CAT.byId.get(+k); return p && p.type === 'Character' && !p.sealed && E[k].some(e => e.hand && e.t === 'static'); });
        S.P(0).chars = [S.inst(id, 1)];`));
      await wait(300);
      return { ok: /its continuous text is yours to apply/.test(m.text) };
    } },
  { name: 'rules-sheet-opened-at-a-section', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; V.openRules('7-1-4'); await ${pause}; const l = document.querySelector('#rulesList');
        return { on: document.querySelector('#rulesSheet').classList.contains('on'), q: document.querySelector('#rulesQ').value, first: l.innerText.slice(0, 160) }; })()`);
      await wait(300);
      return { ok: m.on && m.q === '7-1-4' && /§7-1-4/.test(m.first), ...m };
    } },
  { name: 'rules-sheet-search-in-words', run: async (page) => {
      await page.click('#rulesQ', { clickCount: 3 }); await page.keyboard.type('blocker'); await wait(500);
      const m = await page.evaluate(() => ({ q: document.querySelector('#rulesQ').value, text: document.querySelector('#rulesList').innerText.slice(0, 200), sync: !!document.querySelector('#rulesSync') }));
      return { ok: m.q === 'blocker' && /Blocker/.test(m.text) && m.sync, ...m };
    } },
];
/* ---- take 123 — one view per seat: the board draws only what the seat deciding may see ----
   A hot-seat game ST01 against ST02, turn 3: the page is read for the other player's hand, before and after a real
   hand-over through the curtain -- a hidden card must not be in the page at all, not merely out of sight. */
const handNames = seat => `(() => { const S = window.VAULT.SIM; return S.P(${seat}).hand.map(id => S.card(id).name); })()`;
/* the names on the table and in the trashes are public: a hand card that shares one (a Kid in hand, Kid the Leader) is no leak */
const publicNames = `(() => { const S = window.VAULT.SIM; return S.g.players.flatMap(X => [X.leader, ...X.chars].concat(X.stage ? [X.stage] : []).map(o => S.card(o.id).name).concat(X.trash.map(id => S.card(id).name))); })()`;
const boardHolds = names => `(() => { const t = document.querySelector('#simBoard').textContent; return ${JSON.stringify(names)}.filter(n => t.includes(n)); })()`;
const take123 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'sim-seat-one-sees-its-own-hand-only', run: async (page) => {
      await page.evaluate(simBoard(`deal(stock('stock-st01'), stock('stock-st02'), 21); S.act(0, { t: 'end' }); S.act(1, { t: 'end' });`));
      const mine = await page.evaluate(handNames(0)), theirs = await page.evaluate(handNames(1));
      const pub = await page.evaluate(publicNames), theirsOnly = theirs.filter(n => !mine.includes(n) && !pub.includes(n)), shown = await page.evaluate(boardHolds(mine)), leaked = await page.evaluate(boardHolds(theirsOnly));
      return { ok: shown.length === mine.length && leaked.length === 0, mine: mine.length, shownOfMine: shown.length, leakedOfTheirs: leaked.join(', ') };
    } },
  { name: 'sim-end-turn-the-curtain', run: async (page) => {
      /* a real tap on End turn: the curtain names the next player; nothing of either hand is on it */
      await page.click('#simBoard [data-sim="end"]'); await wait(500);
      const m = await page.evaluate(() => { const c = document.querySelector('#simCurtain'); return { on: c.classList.contains('on'), text: c.textContent.trim().slice(0, 80) }; });
      return { ok: m.on && /Player 2/.test(m.text), ...m };
    } },
  { name: 'sim-seat-two-after-the-hand-over', run: async (page) => {
      /* the tap that takes the phone: the board is now seat 2's view -- its hand, and seat 1's as a count */
      await page.click('#simCurtain'); await wait(500);
      const mine = await page.evaluate(handNames(1)), theirs = await page.evaluate(handNames(0));
      const pub = await page.evaluate(publicNames), theirsOnly = theirs.filter(n => !mine.includes(n) && !pub.includes(n)), shown = await page.evaluate(boardHolds(mine)), leaked = await page.evaluate(boardHolds(theirsOnly));
      await page.evaluate(() => window.scrollTo(0, 0));
      return { ok: shown.length === mine.length && leaked.length === 0, mine: mine.length, shownOfMine: shown.length, leakedOfTheirs: leaked.join(', ') };
    } },
  { name: 'sim-the-defender-sees-the-battle-not-the-attackers-hand', run: async (page) => {
      /* seat 2 attacks seat 1's Leader; the phone goes to the defender, whose board shows the battle and its own hand */
      await page.evaluate(`(async () => { const V = window.VAULT, S = V.SIM; S.act(1, { t: 'attack', ref: 'leader', target: 'leader' }); for (let k = 0; k < 9 && S.g.queue.length; k++) S.act(S.who(), { t: 'fxskip' });
        document.querySelector('#simCurtain').classList.remove('on'); V.paintSim(); window.scrollTo(0, 0); await ${pause}; })()`);
      const mine = await page.evaluate(handNames(0)), theirs = await page.evaluate(handNames(1));
      const pub = await page.evaluate(publicNames), theirsOnly = theirs.filter(n => !mine.includes(n) && !pub.includes(n)), leaked = await page.evaluate(boardHolds(theirsOnly));
      const m = await page.evaluate(() => ({ text: document.querySelector('#simBoard').textContent.slice(0, 160), block: !!document.querySelector('#simBoard [data-sim="noblock"]') }));
      return { ok: m.block && leaked.length === 0 && /is attacked/.test(m.text), leakedOfTheirs: leaked.join(', '), block: m.block };
    } },
];
/* ---- take 124 -- the table: a game against the app through the table's own taps (real clicks), then an effect and its choices,
   the zoom by a real long press, the log, two people on one phone, the end. The app's moves come a beat at a time in this browser,
   so a step waits for them (SIMUI.busy). Every step reads the card size the table solved, that its foot is on the screen, that the
   nav is aside, and how many card pictures drew. */
const tb = js => `(async () => { const V = window.VAULT, S = V.SIM, U = V.SIMUI, wait = ms => new Promise(r => setTimeout(r, ms)), stock = id => V.CAT.stock.find(d => d.id === id), num = n => V.CAT.rows.find(p => p.num === n && !p.sealed);
  const settle = async () => { for (let k = 0; k < 300 && U.busy; k++) await wait(50); await wait(450); };
  const fresh = () => Object.assign(U, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null });   /* seen kept: a result already shown is not shown again */
  let out = {}; ${js}
  await wait(300); const b = document.querySelector('#simBoard'), r = b.getBoundingClientRect(), nav = document.querySelector('#navPlay');
  return Object.assign({ cw: getComputedStyle(b).getPropertyValue('--cw').trim(), foot: Math.round(r.bottom), vh: innerHeight, navAside: !nav || getComputedStyle(nav).display === 'none',
    pictures: [...b.querySelectorAll('.tb-mat img, .tb-hand img')].filter(i => i.complete && i.naturalWidth > 0).length, sideways: document.documentElement.scrollWidth > innerWidth + 0.5 }, out); })()`;
const fits = m => m.foot <= m.vh + 1 && m.navAside && !m.sideways && parseInt(m.cw, 10) >= 44;
const tap124 = async (page, sel) => { await page.click(sel); await wait(450); };
const settled = page => page.evaluate(`(async () => { const U = window.VAULT.SIMUI; for (let k = 0; k < 300 && U.busy; k++) await new Promise(r => setTimeout(r, 50)); await new Promise(r => setTimeout(r, 500)); })()`);
const take124 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'sim-setup-the-leaders-face-to-face', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); await ${pause}; V.SIM.g = null; V.go('sim'); await ${pause};
        Object.assign(V.SIMUI, { opp: 'bot', d1: 'stock-st01', d2: 'stock-st02' }); V.paintSim(); window.scrollTo(0, 0); await ${pause};
        return { vs: !!document.querySelector('#simBoard .tb-vs'), leaders: document.querySelectorAll('#simBoard .vsl img').length, deal: !!document.querySelector('#simBoard [data-sim="start"]') }; })()`);
      return { ok: m.vs && m.deal, ...m };
    } },
  { name: 'sim-mulligan-the-five-large', run: async (page, ctx) => {
      /* the deal: the Leader turns over from its red back (the owner, mid-take: "red for leaders"), caught as it turns */
      await page.evaluate(`(() => { const V = window.VAULT, S = V.SIM, stock = id => V.CAT.stock.find(d => d.id === id); S.new({ ...stock('stock-st01'), name: 'You — ST01' }, { ...stock('stock-st02'), name: 'The app — ST02' }, 0, { seed: 7, bot: 1 });
        Object.assign(V.SIMUI, { sel: null, focus: null, post: null, room: null, fxt: null, busy: false, hurry: false, sheet: null, shown: new Set() }); V.paintSim(); window.scrollTo(0, 0); })()`);
      await wait(260); const shot = await ctx.shot('03a-the-leader-turns-over-from-its-red-back');
      const m = await page.evaluate(tb(`out = { cards: document.querySelectorAll('#simBoard .tb-mhand .sc').length, keep: !!document.querySelector('#simBoard [data-sim="keep:0"]'), shown: [...U.shown] };`));
      return { ok: m.cards === 5 && m.keep && m.shown.join() === '0', shot, ...m };
    } },
  { name: 'sim-the-table-turn-one', run: async (page, ctx) => {
      /* the app's Leader turns over as the table first shows it, once the app has kept */
      await page.click('#simBoard [data-sim="keep:0"]'); await page.waitForFunction(() => window.VAULT.SIM.g && window.VAULT.SIM.g.phase !== 'mulligan', null, { timeout: 8000 });
      await wait(260); const shot = await ctx.shot('04a-the-apps-leader-turns-over'); await settled(page);
      const m = await page.evaluate(tb(`const shown = sel => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none'; };
        const hand = document.querySelector('#simBoard .tb-hand'), hr = hand.getBoundingClientRect(), hc = [...hand.querySelectorAll('.sc')], sec = document.querySelector('#sim');
        out = { turn: S.g.turn, halves: document.querySelectorAll('#simBoard .tb-half').length, lit: document.querySelectorAll('#simBoard .tb-hand .sc.can').length, tabs: shown('.modebar'), header: shown('#sim > .appbar'), top: Math.round(document.querySelector('#simBoard').getBoundingClientRect().top),
          shown: [...U.shown].sort().join(), hand: hc.length, handShown: hc.filter(e => { const q = e.getBoundingClientRect(); return q.left >= hr.left - 1 && q.right <= hr.right + 1 && q.bottom <= innerHeight + 0.5; }).length, hw: Math.round(hc[0].getBoundingClientRect().width),
          unused: Math.round(innerHeight - document.querySelector('#simBoard').getBoundingClientRect().bottom - (parseFloat(getComputedStyle(sec).paddingBottom) || 0)),
          start: (document.querySelector('#simBoard .tb-start') || {}).textContent || '', next: (document.querySelector('#simBoard .tb-next') || {}).textContent || '' };`));
      /* the owner's fourth word: the band says what the turn's start did, the dock what can be done next */
      return { ok: m.turn === 1 && m.halves === 2 && !m.tabs && !m.header && m.top <= 8 && fits(m) && m.shown === '0,1' && m.handShown === m.hand && m.unused <= 24
        && /^Your turn 1 \u00b7 no draw on the first turn \u00b7 \+1\u00a0DON!!$/.test(m.start) && /^(Next: |Nothing left)[^]*no attacks on your first turn\.$/.test(m.next), shot, ...m };
    } },
  { name: 'sim-a-card-selected-and-its-moves', run: async (page) => {
      /* a hand with nothing to play on turn one is lent two DON!! from its deck (the ten stay ten) so a card can be chosen */
      await page.evaluate(tb(`if (!document.querySelector('#simBoard .tb-hand .sc.can')) { const P = S.P(0); P.don.active += 2; P.donDeck -= 2; V.paintSim(); }`));
      const key = await page.evaluate(() => { const e = document.querySelector('#simBoard .tb-hand .sc.can'); return e ? e.dataset.key : null; });
      /* a card held under the next one is tapped on its own strip, as a person would -- its middle may be under the next card */
      if (key) { await page.click(`#simBoard [data-key="${key}"]`, { position: { x: 16, y: 40 } }); await wait(450); }
      const m = await page.evaluate(tb(`out = { key: U.focus, play: !!document.querySelector('#simBoard .tb-dock [data-sim^="play:"]'), zoom: !!document.querySelector('#simBoard .tb-dock [data-sim^="zoom:"]') };`));
      return { ok: !!key && m.play && m.zoom, ...m };
    } },
  { name: 'sim-played-onto-the-table', run: async (page) => {
      await tap124(page, '#simBoard .tb-dock [data-sim^="play:"]');
      /* a card played with an [On Play] waits on it: the effect is declined (or applied, when it cannot be declined) as the player would */
      const m = await page.evaluate(tb(`for (let k = 0; k < 8 && S.who() === 0 && S.g.queue.length; k++) { const L = U.v.legal; V.simTap(U.v.tray ? 'hdone' : L.some(x => x.t === 'fxskip') ? 'fxskip' : L.some(x => x.t === 'fxhand') ? 'fxhand' : 'fxapply'); }
        out = { mine: S.P(0).chars.length, onTable: document.querySelectorAll('#simBoard .tb-half.me .tb-row.front .sc').length, waiting: S.g.queue.length };`));
      return { ok: m.mine >= 1 && m.onTable === m.mine && fits(m), ...m };
    } },
  { name: 'sim-the-app-plays-its-turn-a-move-a-beat', run: async (page, ctx) => {
      /* the owner's fourth word: End turn asks while a card can still be played or an ability used, naming them -- shot -- and the
         question's End turn ends it */
      await page.click('#simBoard [data-sim="end"]'); await wait(450);
      const q = await page.evaluate(() => ({ asked: document.querySelector('#simSheet').classList.contains('on') && (window.VAULT.SIMUI.sheet || {}).kind === 'endq', left: [...document.querySelectorAll('#simSheet .tb-left li')].map(e => e.textContent) }));
      if (q.asked) { await ctx.shot('06a-end-turn-asks-what-is-left'); await page.click('#simSheet [data-sim="end:now"]'); }
      await wait(1300);
      const mid = await page.evaluate(() => ({ busy: window.VAULT.SIMUI.busy, dock: (document.querySelector('#simBoard .tb-dock') || {}).textContent || '' })); const shot = await ctx.shot('06b-the-app-mid-turn');
      await page.waitForFunction(() => !window.VAULT.SIMUI.busy, null, { timeout: 30000 }); const shot3 = await ctx.shot('06c-your-turn-drew-one-and-two-don');
      await settled(page);
      const m = await page.evaluate(tb(`const nx = document.querySelector('#simBoard .tb-next'); out = { turn: S.g.turn, theirs: S.P(1).chars.length, who: S.who(), start: (document.querySelector('#simBoard .tb-start') || {}).textContent || '', next: nx ? nx.textContent : '',
        lines: nx ? Math.round(nx.getBoundingClientRect().height / parseFloat(getComputedStyle(nx).lineHeight)) : 0, wide: innerWidth >= 640 };`));
      /* the look, 360 px: "play 5 cards, give DON!! and attack with your Leader and Brook, ..." took three lines and the cards gave way;
         from 640 px the dock is in the hand's column and takes that column's room (four lines on the open Fold, the cards whole above it) */
      return { ok: mid.busy && /The app is playing/.test(mid.dock) && m.turn === 3 && m.who === 0 && fits(m) && /^Your turn 3 \u00b7 drew\u00a01 \u00b7 \+2\u00a0DON!!$/.test(m.start) && /^Next: [^]*attack with your Leader/.test(m.next) && (m.wide || m.lines <= 2),
        midBusy: mid.busy, asked: q.asked, left: q.left, shot, shot3, ...m };
    } },
  { name: 'sim-attack-the-targets-lit', run: async (page) => {
      await tap124(page, '#simBoard [data-key="L"]'); await tap124(page, '#simBoard .tb-dock [data-sim="attack:leader"]');
      const m = await page.evaluate(tb(`out = { aim: !!U.sel, lit: [...document.querySelectorAll('#simBoard .tb-half.them .sc.aim')].map(e => e.dataset.sim) };`));
      return { ok: m.aim && m.lit.includes('target:leader'), ...m };
    } },
  { name: 'sim-the-line-and-the-app-defends', run: async (page) => {
      await page.click('#simBoard .tb-half.them [data-sim="target:leader"]'); await settled(page);
      const m = await page.evaluate(tb(`out = { battle: !!S.g.battle, step: S.g.battle && S.g.battle.step, line: !!document.querySelector('#simBoard .tb-lines line'), clash: (document.querySelector('#simBoard .tb-clash') || {}).textContent || '', resolve: !!document.querySelector('#simBoard .tb-dock [data-sim="resolve"]') };`));
      return { ok: m.battle && m.line && m.resolve && fits(m), ...m };
    } },
  { name: 'sim-resolve-the-hit', run: async (page, ctx) => {
      await page.click('#simBoard .tb-dock [data-sim="resolve"]'); await wait(260); const shot = await ctx.shot('09b-the-burst');
      const m = await page.evaluate(tb(`out = { burst: (document.querySelector('#simBoard .tb-burst') || {}).textContent || '', last: S.view(0).last, life: S.P(1).life.length };`));
      return { ok: !!m.last && m.last.life.every(l => l.name === null), shot, burst: m.burst, life: m.life, cw: m.cw };
    } },
  { name: 'sim-hold-a-card-to-zoom', run: async (page) => {
      const el = await page.$('#simBoard [data-key="oL"]'); const bx = await el.boundingBox();
      await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down(); await wait(700); await page.mouse.up(); await wait(500);
      const m = await page.evaluate(() => ({ on: document.querySelector('#simSheet').classList.contains('on'), title: document.querySelector('#simSheetTitle').textContent, big: !!document.querySelector('#simSheetBody .zm-art img'), words: /The app will|by hand/.test(document.querySelector('#simSheetBody').textContent) }));
      return { ok: m.on && m.title === 'The card' && m.words, ...m };
    } },
  { name: 'sim-the-log', run: async (page) => {
      await page.evaluate(() => window.VAULT.closeAnyOverlay()); await wait(300); await tap124(page, '#simBoard [data-sim="log"]');
      const m = await page.evaluate(() => ({ on: document.querySelector('#simSheet').classList.contains('on'), lines: document.querySelectorAll('#simSheetBody .ll').length, you: /\bYou (?:activates|gives|plays|ends)\b/.test(document.querySelector('#simSheetBody').textContent) }));
      return { ok: m.on && m.lines > 5 && !m.you, ...m };
    } },
  { name: 'sim-an-effect-its-choices-on-the-table', run: async (page) => {
      await page.evaluate(() => window.VAULT.closeAnyOverlay()); await wait(250);
      const m = await page.evaluate(tb(`const FX = V.CAT.effects, gid = +Object.keys(FX).find(id => { const p = V.CAT.byId.get(+id); return p && p.type === 'Character' && !p.sealed && FX[id].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0 && e.do[0].a === 'power' && e.do[0].who !== 'opp' && e.do[0].who !== 'prev'); });
        S.P(0).chars.push(S.inst(gid, S.g.turn)); S.g.queue = S.offers(0, 'onplay', S.P(0).chars.length - 1).slice(0, 1); fresh(); V.paintSim();
        out = { panel: !!document.querySelector('#simBoard .tb-panel'), picks: document.querySelectorAll('#simBoard .tb-panel .tb-pick').length, lit: document.querySelectorAll('#simBoard .tb-mat .sc.aim').length, card: V.CAT.byId.get(gid).name };`));
      return { ok: m.panel && m.picks >= 1 && m.lit >= 1, ...m };
    } },
  { name: 'sim-a-by-hand-line-resolved-never-skipped', run: async (page, ctx) => {
      /* the owner's fourth word: a by-hand [On Play] that says neither "you may" nor a cost is opened and done by its words -- the panel
         offers Resolve by hand alone and says it happens in full, the dock says to resolve it; opened, then Done */
      await page.evaluate(() => window.VAULT.closeAnyOverlay()); await wait(250);
      const m = await page.evaluate(tb(`const FX = V.CAT.effects, body = r => String(r).replace(/^(\\s*\\[[^\\]]+\\]\\s*)+/, '').replace(/\\([^)]*\\)/g, '');
        const hid = +Object.keys(FX).find(id => { const p = V.CAT.byId.get(+id); return p && p.type === 'Character' && !p.sealed && FX[id].some(e => e.hand && e.t === 'onplay' && !/^\\s*you may\\b/i.test(body(e.raw)) && !/^[^.:]*:/.test(body(e.raw)) && !e.if.some(c => c.c === 'opt')); });
        S.g.queue = []; S.P(0).chars = S.P(0).chars.slice(0, 4); S.P(0).chars.push(S.inst(hid, S.g.turn)); S.g.queue = S.offers(0, 'onplay', S.P(0).chars.length - 1).filter(o => o.hand).slice(0, 1); fresh(); V.paintSim(); await wait(300);
        const panel = (document.querySelector('#simBoard .tb-panel') || {}).textContent || '';
        out = { card: V.CAT.byId.get(hid).name, resolve: !!document.querySelector('#simBoard .tb-panel [data-sim="fxhand"]'), skip: !!document.querySelector('#simBoard .tb-panel [data-sim="fxskip"]'), full: /it happens in full/.test(panel), next: (document.querySelector('#simBoard .tb-next') || {}).textContent || '' };`));
      const shot = await ctx.shot('14a-a-by-hand-line-no-skip'); await page.click('#simBoard .tb-panel [data-sim="fxhand"]'); await wait(400);
      const done = !!(await page.$('#simBoard .tb-panel [data-sim="hdone"]')); if (done) { await page.click('#simBoard .tb-panel [data-sim="hdone"]'); await wait(400); }
      const after = await page.evaluate(() => ({ queue: window.VAULT.SIM.g.queue.length, log: window.VAULT.SIM.g.log[0] }));
      return { ok: m.resolve && !m.skip && m.full && /^Next: resolve .+ effect by hand\.$/.test(m.next) && done && after.queue === 0 && /done by hand/.test(after.log), shot, ...m, done, log: after.log };
    } },
  { name: 'sim-two-on-one-phone-the-curtain', run: async (page) => {
      const m = await page.evaluate(tb(`S.g.queue = []; Object.assign(U, { opp: 'human', d1: 'stock-st08', d2: 'stock-st03', first: 0 }); S.g = null; V.paintSim(); await wait(200); V.simTap('start');
        const c = document.querySelector('#simCurtain'); out = { curtain: c.classList.contains('on'), text: c.textContent.trim().slice(0, 60), art: !!c.querySelector('.cur-art img') };`));
      return { ok: m.curtain && /Player 1/.test(m.text), curtain: m.curtain, text: m.text, art: m.art };
    } },
  { name: 'sim-leave-asks-first', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT, S = V.SIM; document.querySelector('#simCurtain').classList.remove('on'); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); V.paintSim(); window.scrollTo(0, 0); })()`); await wait(400);
      await tap124(page, '#simBoard [data-sim="leave"]');
      const m = await page.evaluate(() => ({ on: document.querySelector('#simSheet').classList.contains('on'), title: document.querySelector('#simSheetTitle').textContent, text: document.querySelector('#simSheetBody').textContent.slice(0, 120) }));
      return { ok: m.on && /Leaving forfeits this game/.test(m.text), ...m };
    } },
  { name: 'sim-forfeit-and-back-to-the-app', run: async (page) => {
      await page.click('#simSheet [data-sim="leavenow"]'); await wait(700);
      const m = await page.evaluate(() => { const shown = sel => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none'; }; return { game: !!window.VAULT.SIM.g, tabs: shown('.modebar'), header: shown('#sim > .appbar'), nav: shown('#navPlay'), setup: /New game/.test(document.querySelector('#simBoard').textContent), toast: document.querySelector('#toast').textContent }; });
      return { ok: !m.game && m.tabs && m.header && m.nav && m.setup, ...m };
    } },
  { name: 'sim-the-end', run: async (page) => {
      const m = await page.evaluate(tb(`S.new({ ...stock('stock-st08'), name: 'Player 1 \u2014 ST08' }, { ...stock('stock-st03'), name: 'Player 2 \u2014 ST03' }, 0, { seed: 9 }); fresh(); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' }); S.act(1, { t: 'concede' }); V.paintSim(); window.scrollTo(0, 0);
        out = { over: S.g.over, text: (document.querySelector('#simBoard .tb-over h3') || {}).textContent || '', win: !!document.querySelector('#simBoard .tb-win img') };`));
      return { ok: m.over === 0 && /wins/.test(m.text), over: m.over, text: m.text, win: m.win };
    } },
  { name: 'releases-a-day-of-starter-decks-one-row-again', run: async (page, ctx) => {
      /* TCGCSV renamed every starter deck on 29 Sept ("ST-31: Starter Deck 31 RED Monkey.D.Luffy") and take 97's fold came
         apart; a starter deck is known by its code now (landmine 231). The day's run is one row, shot folded; a real click opens it */
      const before = await page.evaluate(async () => { const V = window.VAULT; V.NAV.zipAsked = true; V.MODE.set('hunt', true); V.RELF.open = new Set(); V.go('releases'); V.paintReleases(); await new Promise(r => setTimeout(r, 300));
        while (V.closeAnyOverlay()) {}   /* Hunt asks for a zip on its first visit; the sheet is not this step's subject (as take 110's steps) */
        const f = document.querySelector('#relList [data-relfold]:not([data-relfold^="d:"])'); if (f) { f.closest('.rel').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }
        const day = f ? f.dataset.relfold : ''; const run = [...V.CAT.sets.values()].filter(s => s.pub === day && /^ST-?\d/i.test(s.abbr || ''));
        const h = document.querySelector('#relList').innerHTML;
        return { fold: !!f, day, decks: run.length, rows: run.filter(s => h.includes('data-browse-set="' + s.id + '"')).length, names: run.slice(0, 2).map(s => s.name), label: f ? f.textContent.trim() : '' }; });
      const shot = await ctx.shot('18a-releases-the-starter-decks-one-row');
      if (before.fold) await page.click(`#relList [data-relfold="${before.day}"]`); await wait(300);
      const after = await page.evaluate((day) => { const V = window.VAULT; const h = document.querySelector('#relList').innerHTML;
        const run = [...V.CAT.sets.values()].filter(s => s.pub === day && /^ST-?\d/i.test(s.abbr || ''));
        return { rows: run.filter(s => h.includes('data-browse-set="' + s.id + '"')).length, hide: /Hide the decks/.test(h) }; }, before.day);
      return { ok: before.fold && before.decks >= 2 && before.rows === 1 && after.rows === before.decks && after.hide, shot, ...before, after };
    } },
];
take124.viewports = ['cover', 'inner', 'phone', 'tablet'];
/* ---- take 125 — the scanner reads the number where the recogniser finds it ----
   No camera here, so the app is handed one: getUserMedia answers with a canvas's stream (captureStream) -- a drawn
   card, no card art, on a light textured ground where take 123's outline boxed the whole frame -- and the recogniser
   is injected, answering with the number where the canvas printed it, as the plugin does. From there it is the app's
   own path: startCamera, the live loop, the vote, the hold, accept. */
const scanRig = `const V = window.VAULT, SC = V.scan, wait = ms => new Promise(r => setTimeout(r, ms));
  const rig = window.__rig || (window.__rig = (() => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d');
    const one = [...V.CAT.byNum.entries()].find(([n, l]) => l.length === 1 && /^OP\\d{2}-\\d{3}$/.test(n));
    const other = [...V.CAT.byNum.keys()].find(n => /^EB\\d{2}-\\d{3}$/.test(n));
    const card = (x, y, w, num, name) => { const h = w * 88 / 63; g.fillStyle = '#7a1f2b'; g.fillRect(x, y, w, h); g.fillStyle = '#2b3a67'; g.fillRect(x + w * .06, y + w * .08, w * .88, h * .5);
      g.fillStyle = '#f3ead8'; g.fillRect(x + w * .06, y + h * .64, w * .88, h * .24); g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(w * .07) + 'px sans-serif'; g.fillText(name, x + w * .3, y + h * .6);
      g.font = Math.round(w * .035) + 'px sans-serif'; g.fillText(num, x + w * .77, y + h * .96); return { num, x: x + w * SC.CODE_AT.x, y: y + h * SC.CODE_AT.y, w: w * .14, h: w * .035 }; };
    const ground = () => { g.fillStyle = '#d8cbb3'; g.fillRect(0, 0, 1080, 1920); for (let i = 0; i < 4000; i++) { g.fillStyle = i % 2 ? '#e9dfcc' : '#c4b79d'; g.fillRect((i * 97) % 1080, (i * 131) % 1920, 6, 3); } };
    let printed = [];
    const r = { c, one, other, stream: c.captureStream(10), draw(which) { ground(); printed = which === 'two' ? [card(40, 560, 480, one[0], 'One'), card(560, 560, 480, other, 'Two')] : [card(140, 380, 800, one[0], V.CAT.byId.get(one[1][0].id).name)]; },
      lines(h) { const b = document.querySelector('#cam').getBoundingClientRect(), view = SC.viewRect(1080, 1920, b.width, b.height), k = h.width / view.w;
        return printed.map(p => ({ text: p.num, box: { x: (p.x - p.w / 2 - view.x) * k, y: (p.y - p.h / 2 - view.y) * k, w: p.w * k, h: p.h * k } })); } };
    r.draw('one');
    navigator.mediaDevices.getUserMedia = async () => r.stream;
    SC.PLATFORM.hasOcr = () => true;
    SC.PLATFORM.ocr = async h => { const lines = r.lines(h); return { text: lines.map(l => l.text).join('\\n'), lines }; };
    return r;
  })());`;
const scanState = `({ count: V.BATCH.rows.length, tally: document.querySelector('#scCount').textContent, last: document.querySelector('#lastScan').textContent.trim(),
  hint: document.querySelector('#camHint').textContent, seen: document.querySelector('#guide').classList.contains('seen'), video: document.querySelector('#cam').videoWidth + 'x' + document.querySelector('#cam').videoHeight })`;
const take125 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'scan-a-card-on-a-light-ground-is-read-at-once', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V0 = window.VAULT; while (V0.closeAnyOverlay()) {} V0.BATCH.setId = null; V0.BATCH.rows.length = 0; V0.BATCH.save();
        ${scanRig} V.go('scan'); await wait(1500); return ${scanState}; })()`);
      return { ok: m.count === 1 && m.video === '1080x1920' && m.last.length > 0, ...m };
    } },
  { name: 'scan-the-card-left-in-view-is-counted-once', run: async (page) => {
      const m = await page.evaluate(`(async () => { ${scanRig} await wait(2500); return ${scanState}; })()`);
      return { ok: m.count === 1 && m.tally === '1', ...m };
    } },
  { name: 'scan-two-cards-in-view-one-at-a-time', run: async (page) => {
      const m = await page.evaluate(`(async () => { ${scanRig} rig.draw('two'); await wait(1500); const out = ${scanState}; return out; })()`);
      return { ok: /One card at a time/.test(m.hint) && m.count === 1 && !m.seen, ...m };
    } },
  { name: 'more-last-backup-after-the-switch-to-play', run: async (page) => {
      /* the owner's phone after the sideload-to-Play switch: Documents/OPTCGHub/backup-latest.json is the uninstalled
         install's, and Android refuses this one a write of it (landmine 239). A stubbed Filesystem says so in Android's
         words; the app's own scheduleBackup runs, and More shows what it did. */
      const m = await page.evaluate(`(async () => { const V = window.VAULT, wait = ms => new Promise(r => setTimeout(r, ms)); while (V.closeAnyOverlay()) {}
        const disk = {}; window.__cap0 = window.Capacitor;
        window.Capacitor = { Plugins: { Filesystem: { writeFile: async ({ path }) => { if (path === 'OPTCGHub/backup-latest.json') throw new Error('open failed: EACCES (Permission denied)'); disk[path] = 1; return { uri: 'x' }; },
                                                      readFile: async () => { throw new Error('open failed: EACCES (Permission denied)'); } } } };
        localStorage.removeItem('vault.docNames'); V.scheduleBackup('look'); await wait(700);
        V.go('settings'); await wait(450);
        const row = [...document.querySelectorAll('#setBody .row')].find(r => /Last backup/.test(r.textContent));
        if (row) row.scrollIntoView({ block: 'center' }); await wait(300);
        const out = { line: row ? row.textContent.replace(/\\s+/g, ' ').trim() : null, files: Object.keys(disk) };
        if (window.__cap0 === undefined) delete window.Capacitor; else window.Capacitor = window.__cap0;
        return out; })()`);
      return { ok: !!m.line && !/Failed/.test(m.line) && /backup-latest-\d{8}-\d{6}\.json/.test(m.line), ...m };
    } },
];
/* ---- take 126 -- the owner, on take 124's table: "I'm noticing alot of cards in the sim without pictures ... For don, replace the
   image/icon with the DON japanese, not the !!. Give them a black border. Also change the proven by test wording". His three
   pictureless cards (Jinbe, Nami, Jewelry Bonney: the host's "Image Coming Soon", landmine 240) on the table with another printing's
   picture; the DON!! cards close; an effect and the zoom in a player's words; then the same printings where the picture stands for
   the printing -- a card's page and a sealed product's -- drawn without the placeholder. */
const take126 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'sim-the-owners-three-cards-with-pictures', run: async (page) => {
      await page.evaluate(tb(`while (V.closeAnyOverlay()) {} V.MODE.set('play', true); await wait(450); V.go('sim'); await wait(450);
        S.new({ ...stock('stock-st01'), name: 'You — ST01' }, { ...stock('stock-st02'), name: 'The app — ST02' }, 0, { seed: 7, bot: 1 }); S.act(S.who(), { t: 'keep' }); S.act(S.who(), { t: 'keep' });
        S.act(0, { t: 'end' }); await settle(); S.act(1, { t: 'end' }); await settle();
        window.__owners = ['ST01-005', 'ST01-007', 'ST02-007'].map(n => V.CAT.rows.filter(p => p.num === n && !p.sealed).sort((a, b) => a.id - b.id)[0]);
        const [jinbe, nami, bonney] = window.__owners; S.P(0).chars = [S.inst(jinbe.id, 1), S.inst(nami.id, 1)]; S.P(1).chars = [S.inst(bonney.id, 1)];
        const P = S.P(0); P.don.rested = Math.min(2, P.don.active); P.don.active -= P.don.rested; fresh(); V.paintSim(); window.scrollTo(0, 0);`));
      await waitArt(page, '#simBoard .tb-mat img'); await wait(600);
      const m = await page.evaluate(() => { const V = window.VAULT, S = V.SIM, b = document.querySelector('#simBoard');
        const drawn = new Set([...b.querySelectorAll('.tb-mat img')].filter(i => i.complete && i.naturalWidth > 0).map(i => i.getAttribute('src')));
        return window.__owners.map(p => { const q = S.picOf(p); return { card: p.num + ' ' + p.name, id: p.id, own: p.hash != null, lent: q ? q.id : null, drawn: !!q && drawn.has(V.artUrl(q)) }; }); });
      return { ok: m.length === 3 && m.every(c => !c.own && c.lent && c.lent !== c.id && c.drawn), cards: m };
    } },
  { name: 'sim-the-don-cards-close', run: async (page, ctx) => {
      /* the cost area and the DON!! deck, shot close: ドン!! on white in a black frame */
      const m = await page.evaluate(() => { const b = document.querySelector('#simBoard'), tks = [...b.querySelectorAll('.tb-half.me .tk')], dk = [...b.querySelectorAll('.tb-half.me .dkst .sb use')];
        const box = (b.querySelector('.tb-half.me .tb-don') || b).getBoundingClientRect();
        return { cards: tks.length, rested: tks.filter(t => t.classList.contains('r')).length, glyph: tks.every(t => (t.querySelector('use') || {}).getAttribute && t.querySelector('use').getAttribute('href') === '#g-donjp'),
          frame: tks.map(t => getComputedStyle(t).borderTopWidth + ' ' + getComputedStyle(t).borderTopColor)[0], deck: dk.length && dk.every(u => u.getAttribute('href') === '#g-donjp'),
          clip: { x: Math.max(0, box.left - 8), y: Math.max(0, box.top - 8), width: Math.min(innerWidth, box.width + 16), height: box.height + 16 } }; });
      const p = path.join(ctx.dir, '03a-the-don-cards-close.png'); await page.screenshot({ path: p, clip: m.clip }); ctx.shots += 1;
      return { ok: m.cards >= 2 && m.rested >= 1 && m.glyph && m.deck && /^[2-9](\.\d+)?px rgb\(10, 10, 10\)$/.test(m.frame), shot: path.relative(ROOT, p), cards: m.cards, rested: m.rested, frame: m.frame };
    } },
  { name: 'sim-an-effect-not-checked-yet', run: async (page) => {
      /* an [On Play] the app plays with no card proof yet: the panel asks for a Report, in a player's words */
      const m = await page.evaluate(tb(`const FX = V.CAT.effects, id = +Object.keys(FX).find(k => { const p = V.CAT.byId.get(+k); return p && p.type === 'Character' && !p.sealed && !V.CAT.proof[k] && FX[k].some(e => !e.hand && e.t === 'onplay' && e.if.length === 0); });
        S.P(0).chars.push(S.inst(id, S.g.turn)); S.g.queue = S.offers(0, 'onplay', S.P(0).chars.length - 1).filter(o => !o.hand).slice(0, 1); fresh(); V.paintSim(); await wait(300);
        const panel = document.querySelector('#simBoard .tb-panel'); if (panel) panel.scrollIntoView({ block: 'nearest' });
        out = { card: V.CAT.byId.get(id).name, mark: ((panel && panel.querySelector('.tb-mark')) || {}).textContent || '', report: !!(panel && panel.querySelector('[data-sim="report"]')), words: panel ? panel.textContent : '' };`));
      return { ok: m.mark === 'Not checked yet — if the app gets it wrong, tap Report' && m.report && !/proven by a test|no test has proven/.test(m.words), card: m.card, mark: m.mark };
    } },
  { name: 'sim-the-zoom-says-who-plays-each-line', run: async (page) => {
      /* a Character whose lines the app does not play: held to zoom (a real long press), "Yours to play" */
      await page.evaluate(tb(`S.g.queue = []; const FX = V.CAT.effects, id = +Object.keys(FX).find(k => { const p = V.CAT.byId.get(+k); return p && p.type === 'Character' && !p.sealed && FX[k].length && FX[k].every(e => e.hand) && FX[k].some(e => e.t === 'onplay'); });
        S.P(0).chars = S.P(0).chars.slice(0, 3); S.P(0).chars.push(S.inst(id, 1)); fresh(); V.paintSim(); window.scrollTo(0, 0);`));
      const key = await page.evaluate(() => 'm' + (window.VAULT.SIM.P(0).chars.length - 1));
      const el = await page.$(`#simBoard [data-key="${key}"]`); const bx = el && await el.boundingBox();
      if (bx) { await page.mouse.move(bx.x + bx.width / 2, bx.y + Math.min(30, bx.height / 2)); await page.mouse.down(); await wait(700); await page.mouse.up(); await wait(500); }
      const m = await page.evaluate(() => { const z = document.querySelector('#simSheetBody'); return { on: document.querySelector('#simSheet').classList.contains('on'), name: (z.querySelector('.zm-name') || {}).textContent || '', marks: [...z.querySelectorAll('.zm-line .note')].map(n => n.textContent).slice(0, 3), words: z.textContent }; });
      return { ok: m.on && m.marks.includes('Yours to play — the app can’t do this one') && !/proven by a test|does not run this line/.test(m.words), name: m.name, marks: m.marks };
    } },
  { name: 'collect-nami-no-placeholder-on-her-page', run: async (page) => {
      /* the ST01 printing of Nami on its own page, where the picture stands for the printing (landmine 241): its number on its colours,
         no "Image Coming Soon" -- and no other printing's picture */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.SIM.g = null; V.MODE.set('collect', true); await ${pause};
        const p = V.CAT.rows.filter(q => q.num === 'ST01-007' && !q.sealed).sort((a, b) => a.id - b.id)[0]; V.openDetail(p.id); await ${pause}; window.scrollTo(0, 0);
        const art = document.querySelector('#dArt'); return { id: p.id, img: p.img, hash: p.hash, pics: art.querySelectorAll('img').length, label: (art.querySelector('.ph') || {}).textContent || '', on: ${screens} }; })()`);
      await wait(400);
      return { ok: m.img == null && m.hash == null && m.pics === 0 && m.label === 'ST01-007', ...m };
    } },
  { name: 'hunt-a-sealed-product-no-placeholder', run: async (page) => {
      /* the one sealed product the host serves its placeholder for, on its own page: its set code on its colours */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.NAV.zipAsked = true; V.MODE.set('hunt', true); await ${pause};
        const ids = ((V.CAT.man.images || {}).placeholder_ids || []).map(Number), p = V.CAT.rows.find(q => q.sealed && ids.includes(q.id));
        if (!p) return { none: true }; V.openDetail(p.id); await ${pause}; while (V.closeAnyOverlay()) {} window.scrollTo(0, 0);
        const art = document.querySelector('#dArt'); return { name: p.name, img: p.img, pics: art.querySelectorAll('img').length, product: art.classList.contains('product') }; })()`);
      await wait(400);
      return { ok: !m.none && m.img == null && m.pics === 0 && m.product, ...m };
    } },
];
take126.viewports = ['cover', 'inner', 'phone', 'tablet'];
/* ---- take 127 — real ads: consent first, and More's Privacy choices where the consent SDK requires it ---- */
const take127 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'more-privacy-choices-where-consent-is-required', run: async (page) => {
      /* an EEA or UK answer planted (a browser has no consent SDK): the row sits under How it works, after the
         two share rows; the owner's Fold, in the US, never draws it */
      return page.evaluate(async () => {
        const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true);
        V.ADS._consent = { status: 'OBTAINED', privacy: 'REQUIRED', can: true }; V.go('settings');
        await new Promise(r => setTimeout(r, 300));
        const b = document.querySelector('#setBody [data-act="adprivacy"]');
        if (b) window.scrollTo(0, Math.max(0, b.getBoundingClientRect().top + window.scrollY - 220));
        return { ok: !!b && b.textContent === 'Privacy choices for ads', label: b ? b.textContent : null, after: b && b.previousElementSibling ? b.previousElementSibling.textContent : null };
      });
    } },
  { name: 'more-without-the-row-where-it-is-not-required', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; V.ADS._consent = { status: 'NOT_REQUIRED', privacy: 'NOT_REQUIRED', can: true }; V.go('settings');
        await new Promise(r => setTimeout(r, 300));
        const share = document.querySelector('#setBody [data-act="shareapp"]');
        if (share) window.scrollTo(0, Math.max(0, share.getBoundingClientRect().top + window.scrollY - 220));
        const ok = !document.querySelector('#setBody [data-act="adprivacy"]');
        V.ADS._consent = null; return { ok, rowAbsent: ok };
      });
    } },
  { name: 'diagnostics-ads-and-consent-lines', run: async (page) => {
      /* in a browser: Google's test units (the live ones wait for consent) and a consent not asked yet */
      return page.evaluate(async () => {
        const V = window.VAULT; V.go('diag');
        const rep = await V.DIAG.report(); const out = document.querySelector('#diagOut'); if (out) out.textContent = rep;
        const lines = rep.split('\n'); const i = lines.findIndex(l => /^ads: /.test(l));
        if (out && i >= 0) { const lh = parseFloat(getComputedStyle(out).lineHeight) || 17; window.scrollTo(0, Math.max(0, out.getBoundingClientRect().top + window.scrollY + i * lh - 160)); }
        const ads = lines[i] || '', consent = lines.find(l => /^consent: /.test(l)) || '';
        return { ok: /live units wait for consent/.test(ads) && /not asked yet/.test(consent) && /free saves \d+/.test(consent), ads, consent };
      });
    } }
];

/* ---- take 128 — the owner's two testing notes: a scanned line's picture by choice (the arrow on the tile, a tap, a swipe), and
   the update notice from Google Play (the sheet, More's About row). The photo is drawn here (a browser has no camera) and Play's
   answer is planted (a browser has no plugin); the real Play build answers on the Fold. ---- */
const take128 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'collection-a-scanned-line-with-the-arrow', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); await new Promise(r => setTimeout(r, 300));
        const c = document.createElement('canvas'); c.width = 400; c.height = 560; const g = c.getContext('2d');
        g.fillStyle = '#3b2f2f'; g.fillRect(0, 0, 400, 560); g.fillStyle = '#d9c7a0'; g.fillRect(24, 24, 352, 512); g.fillStyle = '#3b2f2f'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText('YOUR', 200, 260); g.fillText('SCAN', 200, 320);
        const photo = c.toDataURL('image/jpeg', 0.85);
        const pick = n => V.CAT.rows.filter(x => x.num === n && !x.sealed && x.img && x.market > 0).sort((a, b) => a.id - b.id)[0];
        const a = pick('OP01-016'), b = pick('OP01-025'), d = pick('ST01-002');
        window.__k128 = { items: V.OWN.items.slice(), pf: V.PF.active }; V.PF.active = 'main';
        const line = (p, ph) => ({ id: p.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', photo: ph, added: '2026-10-01T00:00:00.000Z', fav: false });
        V.OWN.items = [line(a, photo), line(b, null), line(d, photo)];
        V.go('collection'); await new Promise(r => setTimeout(r, 600)); window.scrollTo(0, 0);
        const tiles = [...document.querySelectorAll('#colGrid .tile')];
        const arrows = tiles.filter(t => t.querySelector('[data-act="flip"]')).length, photos = tiles.filter(t => t.querySelector('.art img[src^="data:"]')).length;
        return { ok: tiles.length === 3 && arrows === 2 && photos === 2, tiles: tiles.length, arrows, photos, ids: [a.id, b.id, d.id] };
      });
    } },
  { name: 'collection-after-a-tap-on-the-arrow', run: async (page) => {
      const id = await page.evaluate(() => window.VAULT.OWN.items[0].id);
      await page.click(`#colGrid .tile[data-open="${id}"] [data-act="flip"]`); await waitArt(page, `#colGrid .tile[data-open="${id}"] .art img.ref`); await wait(500);
      return page.evaluate(id => { const V = window.VAULT, t = document.querySelector(`#colGrid .tile[data-open="${id}"]`);
        return { ok: !!t.querySelector('.art img.ref.ok') && !t.querySelector('.art img[src^="data:"]') && V.OWN.items[0].pic === 'ref' && !document.getElementById('detail').classList.contains('on') && t.querySelector('[data-act="flip"]').getAttribute('aria-label') === 'Show your scan',
          pic: V.OWN.items[0].pic, label: t.querySelector('[data-act="flip"]').getAttribute('aria-label'), detailOpen: document.getElementById('detail').classList.contains('on') }; }, id);
    } },
  { name: 'collection-after-a-swipe-back-on-the-picture', run: async (page) => {
      /* a drag across the picture with the pointer (the mode bar takes the same); the click it leaves behind must not open the card */
      const id = await page.evaluate(() => window.VAULT.OWN.items[0].id);
      const b = await page.evaluate(id => { window.__ev = []; const g = document.getElementById('colGrid'); for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click']) g.addEventListener(t, e => window.__ev.push(`${e.type}@${e.target.tagName.toLowerCase()}.${String(e.target.className).split(' ')[0]}:${e.clientX},${e.clientY}`), true);
        const a = document.querySelector(`#colGrid .tile[data-open="${id}"] .art`).getBoundingClientRect(); return { x: a.left + a.width / 2, y: a.top + a.height / 2, w: a.width }; }, id);
      await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.mouse.move(b.x - 80, b.y + 3, { steps: 10 }); await page.mouse.up(); await wait(600);
      return page.evaluate(id => { const V = window.VAULT, t = document.querySelector(`#colGrid .tile[data-open="${id}"]`);
        const ev = window.__ev || []; delete window.__ev;   /* the first run's log: pointerdown, one move, then pointercancel -- the browser's own image drag had taken the pointer */
        return { ok: !!t.querySelector('.art img[src^="data:"]') && V.OWN.items[0].pic === undefined && !document.getElementById('detail').classList.contains('on') && !ev.some(e => /^pointercancel/.test(e)), pic: V.OWN.items[0].pic, detailOpen: document.getElementById('detail').classList.contains('on'), cancelled: ev.some(e => /^pointercancel/.test(e)), moves: ev.filter(e => /^pointermove/.test(e)).length }; }, id);
    } },
  { name: 'more-about-google-play-a-newer-take', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; V.OWN.items = window.__k128.items; V.PF.active = window.__k128.pf; V.OWN.save(); delete window.__k128;
        window.__store = []; window.Capacitor = { Plugins: { AppUpdate: { getAppUpdateInfo: async () => ({ updateAvailability: 2, availableVersionCode: String(V.TAKE + 1), currentVersionCode: String(V.TAKE) }), openAppStore: async () => { window.__store.push('store'); } } } };
        await V.UPDATE.check(); V.go('settings'); await new Promise(r => setTimeout(r, 300));
        const s = document.getElementById('aboutUpd'); if (s) window.scrollTo(0, Math.max(0, s.getBoundingClientRect().top + window.scrollY - 200));
        const b = s && s.closest('.row').querySelector('[data-act="update"]');
        return { ok: !!s && s.textContent === `Take ${V.TAKE + 1} is on Google Play — you have take ${V.TAKE}` && !!b && b.textContent === 'Update', text: s && s.textContent, btn: b && b.textContent };
      });
    } },
  { name: 'the-update-sheet', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; localStorage.removeItem('vault.updateSeen'); window.__offer = V.UPDATE.offer(); await new Promise(r => setTimeout(r, 500));
        const pk = document.getElementById('picker'), opts = [...pk.querySelectorAll('.opt b')].map(b => b.textContent);
        return { ok: pk.classList.contains('on') && opts.join() === 'Update,Later', title: document.getElementById('pkTitle').textContent, why: document.getElementById('pkWhy').textContent, opts };
      });
    } },
  { name: 'more-about-up-to-date', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; while (V.closeAnyOverlay()) {}
        window.Capacitor.Plugins.AppUpdate.getAppUpdateInfo = async () => ({ updateAvailability: 1, availableVersionCode: String(V.TAKE), currentVersionCode: String(V.TAKE) });
        await V.UPDATE.check(); V.go('settings'); await new Promise(r => setTimeout(r, 300));
        const s = document.getElementById('aboutUpd'); if (s) window.scrollTo(0, Math.max(0, s.getBoundingClientRect().top + window.scrollY - 200));
        const b = s && s.closest('.row').querySelector('[data-act="update"]');
        return { ok: !!s && s.textContent === 'Up to date on Google Play' && !!b && b.textContent === 'Check for updates', text: s && s.textContent, btn: b && b.textContent };
      });
    } },
  { name: 'more-about-in-a-browser-no-plugin', run: async (page) => {
      return page.evaluate(async () => {
        const V = window.VAULT; delete window.Capacitor; localStorage.removeItem('vault.updateSeen'); await V.UPDATE.check(); V.go('settings'); await new Promise(r => setTimeout(r, 300));
        const s = document.getElementById('aboutUpd'); if (s) window.scrollTo(0, Math.max(0, s.getBoundingClientRect().top + window.scrollY - 200));
        return { ok: !!s && /^Could not ask Google Play — this build has no update plugin/.test(s.textContent), text: s && s.textContent };
      });
    } },
  { name: 'hunt-sealed-a-product-with-no-price-yet-that-a-distributor-lists', run: async (page) => {
      /* D24, the owner's (b): the OP-18 box with its price taken away for the picture, listed because Southern Hobby names it */
      await page.evaluate(F => { window.__F128 = F; }, feed112());
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.NAV.zipAsked = true; V.HUNT.feed = window.__F128;
        const it = (window.__F128.sources.southern.items || []).find(i => i.id === '79311'); const box = it && V.CAT.byId.get(it.catalog_id); if (!box) return { ok: false, why: 'no OP-18 box' };
        window.__k128p = { id: box.id, market: box.market, low: box.low, high: box.high }; box.market = null; box.low = null; box.high = null;
        V.SEALED.kind = 'all'; V.SEALED.q = ''; V.SEALED.closed.delete(box.set); V.SEALED.open.add(box.set); V.DISTF.open.clear();
        V.MODE.set('hunt', true); await ${pause}; V.HUNT.feed = window.__F128; V.go('sealed'); V.HUNT.feed = window.__F128; V.paintSealed(); await ${pause};
        const row = document.querySelector('#sealedList button.row[data-open="' + box.id + '"]'), wrap = row && row.parentElement;   /* the distributor's line is the wrapping row's, beside the button */
        if (wrap) wrap.scrollIntoView({ block: 'center' });
        return { ok: !!row && /no market price yet/.test(row.textContent) && !!(wrap && wrap.querySelector('.dline')), words: row ? row.querySelector('.nm span').textContent : null, value: row ? row.querySelector('.v').textContent : null, line: wrap && wrap.querySelector('.dline') ? wrap.querySelector('.dline').textContent.trim() : null }; })()`);
      await waitArt(page, '#sealedList img'); await wait(300);
      return m;
    } },
  { name: 'hunt-sealed-restored', run: async (page) => {
      return page.evaluate(() => { const V = window.VAULT, k = window.__k128p; if (k) { const b = V.CAT.byId.get(k.id); Object.assign(b, { market: k.market, low: k.low, high: k.high }); } delete window.__k128p; V.HUNT.feed = null; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); V.go('home'); return { ok: true }; });
    } }
];

/* take 130: Walmart under a product -- the line the feed's item page gave (price, ships, the seller, the age), and
   the chip on the product's sheet; every row built from the saved real pages through --from-fixtures */
const take130 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); await page.evaluate(F => { window.__F130 = F; }, feed112()); return { ok: true }; } },
  { name: 'hunt-sealed-walmart-line', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.NAV.zipAsked = true;
        V.HUNT.feed = window.__F130; V.HUNT.setZip('48329'); V.SEALED.kind = 'all'; V.SEALED.q = ''; V.DISTF.open.clear();
        for (const id of Object.keys(V.HUNT.wmByCatalogId())) { const p = V.CAT.byId.get(+id); if (p) { V.SEALED.closed.delete(p.set); V.SEALED.open.add(p.set); } }
        V.MODE.set('hunt', true); await ${pause}; V.HUNT.feed = window.__F130; V.go('sealed'); V.paintSealed(); await ${pause};
        const line = [...document.querySelectorAll('#sealedList .nm span[style*="display:block"]')].find(x => /^Walmart \\$/.test(x.textContent.trim()));
        /* the row's opener is itself a button.row (sealedRow): tag the opener, the sheet step clicks it */
        const row = line && line.closest('button[data-open]'); if (row) { row.scrollIntoView({ block: 'center' }); row.setAttribute('data-look', 'wm'); }
        return { line: line ? line.textContent.trim() : null, row: row ? row.querySelector('.nm b').textContent : null, lines: [...document.querySelectorAll('#sealedList .nm span[style*="display:block"]')].filter(x => /^Walmart/.test(x.textContent.trim())).length }; })()`);
      await waitArt(page, '#sealedList img'); await wait(300);
      return { ok: !!m.line && /^Walmart \$26\.98 · ships · sold by .+ · /.test(m.line) && m.lines >= 1, ...m };
    } },
  { name: 'hunt-sheet-where-to-buy-walmart', run: async (page) => {
      await page.evaluate(() => { const r = document.querySelector('#sealedList button[data-look="wm"]'); r.scrollIntoView({ block: 'center' }); });
      await page.click('#sealedList button[data-look="wm"]'); await wait(700);
      /* the sheet's Where to buy is #dBuyList: a row per seller (its name in .nm b, its words in .nm span, an Open link) -- not the chips.
         The link is the item's own page as the site names it, with Walmart's own selectors (condition, class, the seller whose
         price the line shows); the rule is the smoke's: no referral or tracking parameter */
      const m = await page.evaluate(() => { const d = document.getElementById('detail'); const rows = [...d.querySelectorAll('#dBuyList .row')];
        const sellers = rows.map(r => r.querySelector('.nm b').textContent.trim()); const wm = rows.find(r => /Walmart/.test(r.querySelector('.nm b').textContent)); if (wm) wm.scrollIntoView({ block: 'center' });
        const a = wm && wm.querySelector('a.ghost[href^="http"]');
        return { on: d.classList.contains('on'), sellers, note: wm ? wm.querySelector('.nm span').textContent.trim() : null, href: a ? a.getAttribute('href') : null }; });
      await wait(300);
      return { ok: m.on && m.sellers.some(c => /Walmart/.test(c)) && /^https:\/\/www\.walmart\.com\/ip\//.test(m.href || '') && !/[?&](aff|tag|ref|utm|irgwc|cid|wmlspartner)/i.test(m.href || '') && /^TCGplayer/.test(m.sellers[0] || '') && /^\$26\.98 · ships · sold by /.test(m.note || ''), ...m };
    } },
];

/* take 131: Play online -- two browser contexts, host and joiner, joined by the real relay (relay/src/worker.js) under
   `wrangler dev`, started here for the list and stopped by its last step. The host's page is the look's; the joiner's
   is a second context (its own storage) whose picture rides beside each step as an extra shot. */
/* a fresh port per start: the first list's workerd (wrangler's child, its own process group) held the port after wrangler was
   killed and the second list's relay never came up (take 131's first look); so the group is killed, and the port is new */
const relay131 = { proc: null, url: null };
async function relayStart() {
  if (relay131.proc) return;
  const { spawn } = await import('node:child_process'); const path = await import('node:path');
  const cwd = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'relay'), port = 8700 + Math.floor(Math.random() * 250);
  const p = spawn('npx', ['wrangler', 'dev', '--port', String(port), '--ip', '127.0.0.1'], { cwd, detached: true, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { out += d; });
  const t0 = Date.now(); while (!/Ready on/.test(out) && Date.now() - t0 < 90000 && p.exitCode === null) await wait(250);
  if (!/Ready on/.test(out)) { try { process.kill(-p.pid, 'SIGKILL'); } catch (e) {} throw new Error('wrangler dev did not start: ' + out.slice(-300)); }
  relay131.proc = p; relay131.url = `http://127.0.0.1:${port}`;
}
async function relayStop() { const p = relay131.proc; relay131.proc = null; if (p) { try { process.kill(-p.pid, 'SIGTERM'); } catch (e) {} await wait(400); try { process.kill(-p.pid, 'SIGKILL'); } catch (e) {} } }
const toSimOnline = () => `(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.ONLINE.relay = '${relay131.url}'; V.ONLINE.mirror(); V.MODE.set('play', true); await ${pause}; V.go('sim'); V.paintSim(); await ${pause}; const p = document.querySelector('#simOnline'); if (p) p.scrollIntoView({ block: 'start' }); })()`;
const take131 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); await relayStart(); await page.evaluate(toSimOnline()); await wait(300);
      const m = await page.evaluate(() => { const p = document.querySelector('#simOnline'); return { panel: !!p, host: !!document.querySelector('#simOnline [data-sim="host"]'), join: !!document.querySelector('#simOnline [data-sim="join"]'), words: p ? /friends, not strangers/.test(p.textContent) : false }; });
      return { ok: m.panel && m.host && m.join && m.words, ...m }; } },
  { name: 'online-host-the-code', run: async (page) => {
      await page.click('#simOnline [data-sim="host"]'); await page.waitForFunction(() => window.VAULT.ONLINE.sess && window.VAULT.ONLINE.sess.live && window.VAULT.ONLINE.sess.code, null, { timeout: 15000 }); await wait(400);
      const m = await page.evaluate(() => { const s = window.VAULT.ONLINE.sess, p = document.querySelector('#simOnline'); return { code: s.code, seat: s.seat, live: s.live, peer: s.peer, shown: p ? p.textContent.includes(s.code) : false, waiting: p ? /waiting for your friend/.test(p.textContent) : false, dealOff: !!document.querySelector('#simOnline [data-sim="deal"][disabled]'), share: !!document.querySelector('#simOnline [data-sim="sharecode"]') }; });
      return { ok: /^[A-HJ-NP-Z2-9]{6}$/.test(m.code) && m.seat === 0 && m.live && !m.peer && m.shown && m.waiting && m.dealOff && m.share, ...m }; } },
  { name: 'online-the-friend-joins', run: async (page, ctx) => {
      const code = await page.evaluate(() => window.VAULT.ONLINE.sess.code);
      const v = SIZES[ctx.viewport]; const browser = page.context().browser(); const c2 = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, timezoneId: OWNER_TZ });
      const p2 = ctx.page2 = await c2.newPage(); await p2.goto(ctx.url, { waitUntil: 'networkidle' }); await p2.waitForFunction(() => window.VAULT && window.VAULT.CAT && window.VAULT.CAT.ready, null, { timeout: 30000 });
      await p2.evaluate(() => { const s = [...document.querySelectorAll('#tour button')].find(b => /skip/i.test(b.textContent)); if (s) s.click(); }); await p2.evaluate(toSimOnline()); await wait(300);
      await p2.evaluate(() => { const sel = document.querySelector('#simDO'); if (sel && sel.options.length > 1) { sel.value = '1'; sel.dispatchEvent(new Event('change', { bubbles: true })); } });
      await p2.fill('#simCode', code.toLowerCase()); await p2.click('#simOnline [data-sim="join"]');
      await p2.waitForFunction(() => window.VAULT.ONLINE.sess && window.VAULT.ONLINE.sess.live && window.VAULT.ONLINE.sess.peer, null, { timeout: 15000 });
      await page.waitForFunction(() => window.VAULT.ONLINE.sess && window.VAULT.ONLINE.sess.peer && window.VAULT.ONLINE.sess.deckTheirs, null, { timeout: 15000 }); await wait(400);
      const shot = await ctx.shot('03b-the-joiner-in-the-lobby', p2);
      const m = await page.evaluate(() => { const s = window.VAULT.ONLINE.sess, p = document.querySelector('#simOnline'); return { here: p ? /your friend is here/.test(p.textContent) : false, theirs: s.deckTheirs && s.deckTheirs.name, dealOn: !!document.querySelector('#simOnline [data-sim="deal"]:not([disabled])') }; });
      const j = await p2.evaluate(() => { const s = window.VAULT.ONLINE.sess, p = document.querySelector('#simOnline'); return { seat: s.seat, joined: p ? p.textContent.includes(s.code) && /Player 2/.test(p.textContent) && /the host is here/.test(p.textContent) : false, noDeal: !document.querySelector('#simOnline [data-sim="deal"]') }; });
      return { ok: m.here && !!m.theirs && m.dealOn && j.seat === 1 && j.joined && j.noDeal, shot, ...m, joiner: j }; } },
  { name: 'online-the-host-deals', run: async (page, ctx) => {
      await page.click('#simOnline [data-sim="deal"]'); await page.waitForFunction(() => window.VAULT.SIM.g && window.VAULT.ONLINE.sess.state === 'play', null, { timeout: 15000 });
      await ctx.page2.waitForFunction(() => window.VAULT.SIM.g && window.VAULT.ONLINE.sess.state === 'play', null, { timeout: 15000 }); await wait(500);
      const shot = await ctx.shot('04b-the-joiner-dealt', ctx.page2);
      const h = await page.evaluate(() => { const g = window.VAULT.SIM.g; return { seed: g.spec.seed, first: g.first, seat: window.VAULT.simSeat(), mull: !!document.querySelector('#simBoard .tb-mull'), cards: document.querySelectorAll('#simBoard .tb-mhand .sc').length, keep: !!document.querySelector('#simBoard [data-sim="keep:0"]') }; });
      const j = await ctx.page2.evaluate(() => { const g = window.VAULT.SIM.g; return { seed: g.spec.seed, first: g.first, seat: window.VAULT.simSeat(), mull: !!document.querySelector('#simBoard .tb-mull'), cards: document.querySelectorAll('#simBoard .tb-mhand .sc').length, keep: !!document.querySelector('#simBoard [data-sim="keep:1"]') }; });
      return { ok: h.seed === j.seed && h.first === j.first && h.seat === 0 && j.seat === 1 && h.mull && j.mull && h.cards === 5 && j.cards === 5 && h.keep && j.keep, shot, host: h, joiner: j }; } },
  { name: 'online-both-keep-over-the-wire', run: async (page, ctx) => {
      /* the first player keeps first (§5-2-1-6): whichever phone that is taps Keep, then the other; each keep is applied on the relay's echo */
      const first = await page.evaluate(() => window.VAULT.SIM.g.first); const P = [page, ctx.page2];
      for (const seat of [first, 1 - first]) { const pg = P[seat]; await pg.click(`#simBoard [data-sim="keep:${seat}"]`);
        await page.waitForFunction(n => window.VAULT.SIM.g.actions.length === n, seat === first ? 1 : 2, { timeout: 15000 }); await ctx.page2.waitForFunction(n => window.VAULT.SIM.g.actions.length === n, seat === first ? 1 : 2, { timeout: 15000 }); await wait(300); }
      await wait(500); const shot = await ctx.shot('05b-the-joiner-at-the-table', ctx.page2);
      const snap = () => { const g = window.VAULT.SIM.g; return JSON.stringify({ p: g.players, t: g.turn, a: g.active, ph: g.phase }); };
      const h = await page.evaluate(`(${snap})()`), j = await ctx.page2.evaluate(`(${snap})()`);
      const m = await page.evaluate(() => ({ turn: window.VAULT.SIM.g.turn, top: (document.querySelector('#simBoard .tb-stat') || {}).textContent || '', mat: !!document.querySelector('#simBoard .tb-mat'), end: (document.querySelector('#simBoard .tb-end') || {}).textContent || '' }));
      const m2 = await ctx.page2.evaluate(() => ({ top: (document.querySelector('#simBoard .tb-stat') || {}).textContent || '', mat: !!document.querySelector('#simBoard .tb-mat'), end: (document.querySelector('#simBoard .tb-end') || {}).textContent || '' }));
      const ends = m.end + m2.end;   /* End turn's note online is "then their turn", never the hot seat's "then pass the phone" (the first look read it on the joiner's table) */
      return { ok: h === j && m.turn === 1 && m.mat && m2.mat && ((/your turn/.test(m.top) && /their turn/.test(m2.top)) || (/your turn/.test(m2.top) && /their turn/.test(m.top))) && !/pass the phone/.test(ends) && /then their turn/.test(ends), shot, same: h === j, host: m.top, joiner: m2.top, end: ends.trim() }; } },
  { name: 'online-the-joiner-leaves-and-concedes', run: async (page, ctx) => {
      await ctx.page2.click('#simBoard [data-sim="leave"]'); await wait(400); await ctx.page2.click('#simSheet [data-sim="leavenow"]');
      await page.waitForFunction(() => window.VAULT.SIM.g && window.VAULT.SIM.g.over === 0, null, { timeout: 15000 }); await wait(500);
      const m = await page.evaluate(() => { const b = document.querySelector('#simBoard'); return { over: window.VAULT.SIM.g.over, wins: /Player 1[^<]*wins/.test(b.textContent), state: window.VAULT.ONLINE.sess && window.VAULT.ONLINE.sess.state }; });
      const j = await ctx.page2.evaluate(() => ({ room: !!window.VAULT.ONLINE.sess, game: !!window.VAULT.SIM.g, kept: !!localStorage.getItem('optcghub.online') }));
      await ctx.page2.context().close(); ctx.page2 = null; await relayStop(); await wait(900);
      /* the relay is gone and the game is over: the bar says so and owes the wire nothing (the first look read "reconnecting…" here) */
      const bar = await page.evaluate(() => (document.querySelector('#simBoard .tb-stat') || {}).textContent || '');
      return { ok: m.over === 0 && m.wins && m.state === 'over' && !j.room && !j.game && !j.kept && /The game is over/.test(bar) && !/reconnect|sending|away/.test(bar), bar, ...m, joiner: j }; } },
];

/* take 137 (A43): what you paid and a Hunt note's price, typed in the currency on screen (euros here) and read back as typed;
   Restore's sheet with this install's earlier days -- the Filesystem a stub in the page holding dated copies, as the smoke's,
   named by the phone's day (the look's clock is a New York evening when it runs after 8 PM there) */
const take137 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'what-you-paid-asks-in-euros', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); await ${pause};
        V.CUR.set('EUR'); const p = V.CAT.rows.find(r => r.num && !r.sealed && r.market > 5 && r.img);
        window.__k137 = { items: V.OWN.items, notes: V.LOCAL.notes, zip: V.HUNT.zip };
        V.OWN.items = [{ id: p.id, qty: 1, condition: 'NM', pf: 'main', game: 'optcg', added: new Date().toISOString(), fav: false }]; V.OWN.save();
        V.openDetail(p.id); await ${pause};
        const b = document.getElementById('dPaid'); b.scrollIntoView({ block: 'center' }); b.click(); await ${pause};
        return { on: document.getElementById('askSheet').classList.contains('on'), title: document.getElementById('askTitle').textContent, why: document.getElementById('askWhy').textContent, name: p.name }; })()`);
      await wait(400);
      return { ok: m.on && m.title === 'What you paid' && /in € EUR, converted \(≈\); it is kept in US dollars/.test(m.why), ...m };
    } },
  { name: 'what-you-paid-reads-back-as-typed', run: async (page) => {
      await page.fill('#askIn', '20'); await page.click('#askOk'); await wait(800);
      const m = await page.evaluate(() => { const b = document.getElementById('dPaid'); b.scrollIntoView({ block: 'center' }); return { paid: b.textContent.trim() }; });
      await wait(300);
      return { ok: m.paid === '≈€20.00', ...m };
    } },
  { name: 'hunt-note-price-asks-in-euros', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.NAV.zipAsked = true; V.HUNT.setZip('48329');
        V.MODE.set('hunt', true); await ${pause}; V.go('local'); V.paintLocal(); await ${pause};
        window.__note137 = V.addLocalNote('Take 137 Games'); await ${pause}; return true; })()`);
      await page.fill('#askIn', '3 OP-11 boxes'); await page.click('#askOk'); await wait(600);
      const q = await page.evaluate(() => ({ title: document.getElementById('askTitle').textContent, why: document.getElementById('askWhy').textContent, placeholder: document.getElementById('askIn').getAttribute('placeholder') }));
      return { ok: m && q.title === 'Price, if you saw one' && q.placeholder === '€ EUR, optional' && /in € EUR; it is kept in US dollars/.test(q.why), ...q };
    } },
  { name: 'hunt-note-shows-the-price-as-typed', run: async (page) => {
      await page.fill('#askIn', '20'); await page.click('#askOk'); await wait(500);
      await page.fill('#askIn', ''); await page.click('#askOk'); await wait(800);
      const m = await page.evaluate(() => { const row = [...document.querySelectorAll('#localList .row')].find(r => /Take 137 Games/.test(r.textContent));
        if (row) row.scrollIntoView({ block: 'center' }); return { note: row ? row.querySelector('.nm span').textContent.trim() : null }; });
      await wait(300);
      return { ok: !!m.note && /3 OP-11 boxes · ≈€20\.00/.test(m.note), ...m };
    } },
  { name: 'restore-offers-an-earlier-day', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.CUR.set('USD'); V.MODE.set('collect', true); await ${pause};
        V.OWN.items = window.__k137.items; V.OWN.save(); V.LOCAL.notes = window.__k137.notes; V.LOCAL.saveNotes();
        const iso = n => new Date(Date.now() + n * 864e5).toISOString(), now = iso(0), base = JSON.parse(V.backupJson());
        const latest = JSON.stringify({ ...base, at: now }), names = [0, 1, 2, 3, 7].map(n => 'backup-' + V.localDay(iso(-n)) + '.json');
        window.Capacitor = { Plugins: { Filesystem: { readdir: async () => ({ files: ['backup-latest.json', ...names, 'backup-before-restore.json'].map(name => ({ name, type: 'file' })) }),
          readFile: async ({ path }) => { if (/backup-latest\\.json$/.test(path)) return { data: latest }; throw new Error('File does not exist'); }, writeFile: async o => ({ uri: 'file:///' + o.path }) } } };
        try { localStorage.removeItem('vault.beforeRestore'); } catch (e) {}
        V.go('settings'); await ${pause}; window.__r137 = V.restoreFromBackup(); await ${pause};
        const pk = document.getElementById('picker'), opts = [...pk.querySelectorAll('.opt')].map(b => ({ t: b.querySelector('b').textContent, s: (b.querySelector('span') || {}).textContent || '', h: Math.round(b.getBoundingClientRect().height) }));
        return { on: pk.classList.contains('on'), title: document.getElementById('pkTitle').textContent, opts, days: [1, 2, 3].map(n => V.dayText(V.localDay(iso(-n)))) }; })()`);
      await wait(400);
      return { ok: m.on && m.title === 'Restore from' && m.opts.length === 5 && m.opts[0].t === 'The latest backup' && m.days.every((d, i) => m.opts[i + 1].t === 'The backup of ' + d) && m.opts[4].t === 'Choose a file' && m.opts.every(o => o.h >= 44), ...m };
    } },
  { name: 'restore-cancelled-nothing-changed', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; const n = V.OWN.items.length; V.PICKER.dismiss(); await window.__r137; delete window.Capacitor;
        if (window.__k137) { V.HUNT.setZip(window.__k137.zip || ''); } await ${pause};
        return { closed: !document.getElementById('picker').classList.contains('on'), same: V.OWN.items.length === n, screen: V.NAV.stack[V.NAV.stack.length - 1] }; })()`);
      return { ok: m.closed && m.same && m.screen === 'settings', ...m };
    } },
];

/* ---- take 138 — Hunt's notes cut to what a list is, its source and its age (the owner's word, A45 item 1) ----
   The feed, the store roster, the shops and the events are the fixture smoke builds (hunt.py --from-fixtures); the page's
   own syncs are stubbed, and the events are moved forward so that they fall in the next two weeks. */
let FX138 = null;
const fx138 = () => {
  if (!FX138) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-look-138-')), f = path.join(d, 'feed-fixture.json');
    execSync(`python3 tools/hunt.py --from-fixtures --out ${f}`, { cwd: ROOT, stdio: 'pipe' });
    const rd = n => JSON.parse(fs.readFileSync(path.join(d, n), 'utf8'));
    FX138 = { feed: rd('feed-fixture.json'), stores: rd('stores-fixture.json'), shops: rd('shops-fixture.json'), events: rd('events-fixture.json') };
    fs.rmSync(d, { recursive: true, force: true }); }
  return FX138;
};
const HUNT138 = `V.HUNT.sync = async () => false; V.HUNT.syncHistory = async () => false; V.NAV.zipAsked = true;
  V.LOCAL.syncStores = async () => false; V.LOCAL.syncShops = async () => false; V.EVENTS.sync = async () => false;
  V.HUNT.feed = window.__X138.feed; V.LOCAL.stores = window.__X138.stores; V.LOCAL.shops = window.__X138.shops; V.EVENTS.tab = window.__X138.events;
  if (V.HUNT.zip !== '48329') V.HUNT.setZip('48329'); V.LOCAL.radius = 50; V.MODE.set('hunt', true); await ${pause}`;
const note138 = sel => `[...document.querySelectorAll('${sel} .note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()).filter(t => t.length > 20)`;
const take138 = [
  { name: 'open', run: async (page, ctx) => {
      await ctx.open();
      const X = JSON.parse(JSON.stringify(fx138()));
      /* the fixture's events, moved so the first is tomorrow (the screen lists the next two weeks) */
      const days = X.events.rows.map(r => r[1]).sort(), shift = Math.round((Date.parse(new Date(Date.now() + 864e5).toISOString().slice(0, 10)) - Date.parse(days[0])) / 864e5);
      X.events.rows.forEach(r => { r[1] = new Date(Date.parse(r[1]) + shift * 864e5).toISOString().slice(0, 10); });
      await page.evaluate(x => { window.__X138 = x; window.__K138 = { zip: window.VAULT.HUNT.zip, radius: window.VAULT.LOCAL.radius }; }, X);
      return { ok: true, shift };
    } },
  { name: 'sealed-target-panel', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} ${HUNT138}; V.DISTF.open.clear(); V.go('sealed'); V.paintSealed(); await ${pause};
        const h = [...document.querySelectorAll('#sealedList h3')].find(e => e.textContent.trim() === 'Target'); const pn = h && h.closest('.panel'); if (pn) { const d = pn.querySelector('details'); if (d) d.open = true; pn.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        return { notes: pn ? ${note138('#sealedList .panel')}.filter(t => /Target|shelf|stores within/.test(t)) : [] }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^Online and shelf stock at Target, refreshed hourly\. Checked /.test(t)) && m.notes.some(t => /Target stores within 50 mi of 48329 · \d+ products checked on their shelves, a few each hour\./.test(t)), ...m };
    } },
  { name: 'sealed-distributors-open', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DISTF.open.clear(); V.DISTF.open.add('sealed'); V.go('sealed'); V.paintSealed(); await ${pause};
        const b = [...document.querySelectorAll('#sealedList b')].find(e => e.textContent.trim() === 'GTS Distribution'); if (b) { b.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); }
        const fold = b && b.closest('.dbody'); return { notes: fold ? [...fold.querySelectorAll('.note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()) : [] }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /\d+ products: \d+ sold out, \d+ allocated, \d+ with orders open, \d+ in stock for stores\./.test(t)) && m.notes.includes('Sells to stores, not to you. Allocated: stores get part of what they ordered. MSRP: the suggested shelf price.')
        && m.notes.includes('Lists order deadlines and release dates for stores, not stock.'), ...m };
    } },
  { name: 'local-top', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DISTF.open.clear(); ${HUNT138}; V.go('local'); V.paintLocal(); await ${pause}; window.scrollTo(0, 0);
        return { notes: ${note138('#localList')} }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^Zip 48329 · distances ±10 mi/.test(t)) && m.notes.some(t => /^Stores near you that run One Piece events\. From .+, (just now|\d+ min ago|\d+ h ago|\d+ days ago)\.$/.test(t)), ...m };
    } },
  { name: 'local-shops-and-notes', run: async (page) => {
      const m = await page.evaluate(`(async () => { const h = [...document.querySelectorAll('#localList h3')].find(e => /Shops with an online store/.test(e.textContent)); if (h) { h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        return { notes: ${note138('#localList')}.filter(t => /each shop|on a shelf/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^What each shop lists on its own site, checked hourly\. Fetched /.test(t)), ...m };
    } },
  { name: 'events', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('events'); V.paintEvents && V.paintEvents(); await ${pause};
        const n = [...document.querySelectorAll('#eventsList .note, #events .note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()); const last = [...document.querySelectorAll('#events .note')].pop(); if (last) last.scrollIntoView({ block: 'end' }); window.scrollBy(0, 120);
        return { notes: n.filter(t => /events/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.includes('One Piece events near you, from Bandai TCG+ via onepieceevents.com. Register in the TCG+ app or site.') && m.notes.some(t => /^\d+ stores, \d+ events in the next 14 days within 50 mi of 48329/.test(t)), ...m };
    } },
  { name: 'releases-notes', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DISTF.open.clear(); V.DISTF.open.add('releases'); V.go('releases'); V.paintReleases(); await ${pause};
        const n = [...document.querySelectorAll('#relList .note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()); const t = [...document.querySelectorAll('#relList .note')].find(e => /Announced to stores/.test(e.textContent)); if (t) { t.scrollIntoView({ block: 'center' }); }
        return { notes: n.filter(x => /Announced|Dates from/.test(x)) }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^Announced to stores before TCGplayer lists them\. Checked /.test(t)) && m.notes.includes('Dates from TCGplayer via TCGCSV, nightly. Remind me notifies you the day before.'), ...m };
    } },
  { name: 'restore', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DISTF.open.clear(); const k = window.__K138 || {};
        V.HUNT.setZip(k.zip || ''); V.LOCAL.radius = k.radius || V.LOCAL.radius; V.MODE.set('collect', true); await ${pause}; return { zip: V.HUNT.zip }; })()`);
      return { ok: true, ...m };
    } },
];

/* ---- take 139 — Collect's and More's notes cut short (A45 items 2 and 3, the owner's word) ---- */
const notes139 = sel => `[...document.querySelectorAll('${sel} .note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()).filter(t => t.length > 15)`;
const scrollTo139 = (sel, y = -90) => `(() => { const e = document.querySelector('${sel}'); if (e) { e.scrollIntoView({ block: 'start' }); window.scrollBy(0, ${y}); } return !!e; })()`;
const take139 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'home-sources', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('collect', true); await ${pause}; V.go('home'); V.paintHome(); await ${pause};
        ${scrollTo139('#srcPanel')}; return { note: document.getElementById('srcNote').textContent.replace(/\\s+/g, ' ').trim() }; })()`);
      await wait(400);
      return { ok: /^Prices from TCGplayer, via TCGCSV, updated [A-Z][a-z]{2} \d+\./.test(m.note) && /Not affiliated with/.test(m.note), ...m };
    } },
  { name: 'more-backup', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('settings'); await ${pause};
        const b = [...document.querySelectorAll('#setBody .note')].find(e => /Backed up to/.test(e.textContent)); if (b) { b.scrollIntoView({ block: 'center' }); }
        return { notes: ${notes139('#setBody')}.filter(t => /Backed up|Icons from/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^Backed up to Documents\/OPTCGHub on every save; photos aren’t included\. Before you uninstall or switch to the Play version, Export CSV and keep the file\.$/.test(t)), ...m };
    } },
  { name: 'more-appearance-and-sync', run: async (page) => {
      const m = await page.evaluate(`(async () => { const h = [...document.querySelectorAll('#setBody h3')].find(e => e.textContent.trim() === 'Appearance'); if (h) { h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        return { notes: ${notes139('#setBody')}.filter(t => /Auto follows|Gets new prices/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.includes('Auto follows your phone’s setting.') && m.notes.includes('Gets new prices nightly when you’re online. Everything else works offline.'), ...m };
    } },
  { name: 'more-catalogue-and-what-it-does-not-know', run: async (page) => {
      const m = await page.evaluate(`(async () => { const h = [...document.querySelectorAll('#setBody h3')].find(e => e.textContent.trim() === 'Catalogue'); if (h) { h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        const t = document.getElementById('setBody').textContent.replace(/\\s+/g, ' '); return { stamps: /\\d{4}-\\d\\d-\\d\\dT/.test(t), src: (t.match(/Source updated [^A-Z]{0,30}/) || [''])[0] }; })()`);
      await wait(400);
      return { ok: !m.stamps && /Source updated [A-Z]?[a-z]*/.test(m.src), ...m };
    } },
  { name: 'more-does-not-know-and-sources', run: async (page) => {
      const m = await page.evaluate(`(async () => { const h = [...document.querySelectorAll('#setBody h3')].find(e => /does not know/.test(e.textContent)); if (h) { h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); }
        return { notes: ${notes139('#setBody')}.filter(t => /Condition does not|Catalogue and prices/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.length === 2, ...m };
    } },
  { name: 'card-page-graded', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('home'); await ${pause}; const p = V.CAT.rows.find(r => r.num && !r.sealed && r.market > 5 && r.img);
        V.openDetail(p.id); await ${pause}; const n = [...document.querySelectorAll('.note')].find(e => /A slab is recorded/.test(e.textContent)); if (n) { n.scrollIntoView({ block: 'center' }); }
        return { note: n ? n.textContent.replace(/\\s+/g, ' ').trim() : null }; })()`);
      await wait(400);
      return { ok: m.note === 'A slab is recorded, not scanned. There are no graded prices here, so the value shown is the ungraded price — a graded copy is usually worth more.', ...m };
    } },
  { name: 'sealed-page-where-to-buy', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('home'); await ${pause}; const p = V.CAT.rows.find(r => V.SEALED.isProduct(r) && r.img);
        V.openDetail(p.id); await ${pause}; const b = document.getElementById('dBuy'); if (b) { b.scrollIntoView({ block: 'center' }); }
        return { note: b ? [...b.querySelectorAll('.note')].map(e => e.textContent.trim()).join(' | ') : null }; })()`);
      await wait(400);
      return { ok: /Opens the seller’s own page\. No referral links\./.test(m.note || ''), ...m };
    } },
  { name: 'trade', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('trade'); await ${pause}; window.scrollTo(0, 0);
        return { notes: ${notes139('#trade')} }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^What you give, what you get, and the difference at today’s prices\. Paste a list \(4 OP01-016 per line\) or pick from your collection\.$/.test(t)), ...m };
    } },
  { name: 'wants', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.go('wants'); await ${pause}; window.scrollTo(0, 0);
        return { notes: ${notes139('#wants')} }; })()`);
      await wait(400);
      return { ok: m.notes.includes('Cards you’re after. Add them from a checklist, a search or a card’s page.') && m.notes.includes('Checked nightly with new prices. One notification each.'), ...m };
    } },
];

/* ---- take 140 — Prep & Play's notes cut short (A45 item 4, the owner's word) ---- */
const notes140 = sel => `[...document.querySelectorAll('${sel} .note')].map(e => e.textContent.replace(/\\s+/g, ' ').trim()).filter(t => t.length > 15)`;
const take140 = [
  { name: 'open', run: async (page, ctx) => { await ctx.open(); return { ok: true }; } },
  { name: 'deck-rules-and-chart', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.MODE.set('play', true); await ${pause};
        const d = JSON.parse(JSON.stringify(V.CAT.stock[0])); d.id = 'look140'; d.name = 'Look 140'; delete d.stock;
        V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look140'); V.DECKS.list.push(d); V.go('decks'); V.paintDecks(); await ${pause};
        const h = [...document.querySelectorAll('#decks h3')].find(e => /in one breath/.test(e.textContent)); if (h) { h.closest('.panel').scrollIntoView({ block: 'end' }); window.scrollBy(0, 160); }
        return { notes: ${notes140('#decks')}.filter(t => /One Leader/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^One Leader and fifty cards that share a colour with it, at most four of each card number; ten DON!! cards go alongside\. Comprehensive Rules v1\.2\.1 §5-1\.$/.test(t)), ...m };
    } },
  { name: 'deck-chart', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.openDeck('look140'); await ${pause};
        const n = [...document.querySelectorAll('#deck .note')].find(e => /Dashed|One day of prices/.test(e.textContent)); if (n) { n.scrollIntoView({ block: 'center' }); }
        return { note: n ? n.textContent.trim() : null }; })()`);
      await wait(400);
      return { ok: /^(Dashed: estimated from each day’s prices\.|One day of prices so far; the line appears as days add up\.)$/.test(m.note || ''), ...m };
    } },
  { name: 'deck-import-prompt', run: async (page) => {
      await page.evaluate(() => { window.scrollTo(0, 0); }); await page.click('#dkImport'); await wait(700);
      const m = await page.evaluate(() => ({ title: document.getElementById('askTitle').textContent, why: document.getElementById('askWhy').textContent }));
      return { ok: /^One card per line, like 4 OP01-016 Nami; a Leader line sets the Leader\. Unknown lines are listed, not dropped\.$/.test(m.why), ...m };
    } },
  { name: 'play-counter', run: async (page) => {
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look140'); V.go('play'); V.paintPlay(); await ${pause}; window.scrollTo(0, 0);
        return { notes: ${notes140('#play')}.filter(t => /table game/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.includes('Life and DON!! for a table game. Nothing here is saved or sent.'), ...m };
    } },
  { name: 'sim-intro-and-online', run: async (page) => {
      /* Play online draws only with a relay configured; the look's page has none, so one is named for the drawing (no
         connection is made until Host or Join is tapped) */
      const m = await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} window.__relay140 = V.SIMUI.wire.relay; V.SIMUI.wire.relay = V.SIMUI.wire.relay || 'https://relay.invalid'; V.go('sim'); await ${pause}; window.scrollTo(0, 0);
        return { notes: ${notes140('#sim')}.filter(t => /Two players|Host a match/.test(t)) }; })()`);
      await wait(400);
      return { ok: m.notes.some(t => /^Two players on one phone, or you against the app\. The app keeps the rules \(Comprehensive Rules v[\d.]+\) and runs the card effects it understands; any other effect is yours to resolve by hand, with only the moves its words name\.$/.test(t))
        && m.notes.some(t => /For friends, not strangers: both phones hold the whole deal\. Only the code, the two deck lists and the moves leave the phone\.$/.test(t)), ...m };
    } },
  { name: 'sim-online', run: async (page) => {
      const m = await page.evaluate(() => { const o = document.getElementById('simOnline'); if (o) o.scrollIntoView({ block: 'center' }); return { on: !!o }; });
      await wait(400);
      return { ok: m.on, ...m };
    } },
  { name: 'restore', run: async (page) => {
      await page.evaluate(`(async () => { const V = window.VAULT; while (V.closeAnyOverlay()) {} if ('__relay140' in window) V.SIMUI.wire.relay = window.__relay140; V.DECKS.list = V.DECKS.list.filter(x => x.id !== 'look140'); V.MODE.set('collect', true); await ${pause}; })()`);
      return { ok: true };
    } },
];

export const STEPS = { 140: take140, 139: take139, 138: take138, 137: take137, 131: take131, 130: take130, 128: take128, 127: take127, 126: take126, 125: take125, 124: take124, 123: take123, 122: take122, 120: take120, 119: take119, 118: take118, 117: take117, 116: take116, 98: take98, 100: take100, 104: take104, 105: take105, 106: take106, 107: take107, 108: take108, 109: take109, 110: take110, 111: take111, 112: take112, 114: take114, 115: take115 };
