/* Execute the SHIPPED app and assert on what it actually does.
 *
 * APEX landmine 39: a verifier that passes while the product fails is worse
 * than no verifier. So this loads www/app.js -- the built artifact, the same
 * bytes the APK ships -- into a DOM built from www/index.html, and drives it.
 * If an assertion here passes, that code path executed.
 *
 * It deliberately does NOT stub the confidence gate. The ask/auto ratio these
 * checks report is the real one, computed over the real catalogue.
 */
import fs from 'node:fs';
import os from 'node:os';
import { execSync } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { makeDom, boot } from './lib/appvm.mjs';
import zlib from 'node:zlib';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const W = p => path.join(ROOT, 'www', p);
/* take 132: the page and its script's files as one string, the way src/app.html alone read until the split */
const appSource = () => fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8') + fs.readdirSync(path.join(ROOT, 'src', 'app')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(ROOT, 'src', 'app', f), 'utf8')).join('');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (process.env.SMOKE_NAMES) console.log(`  name  ${name}`);   /* take 135: every check by name, pass or fail, for the diff across the split */
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
};
const section = s => console.log(`\n\u2500\u2500 ${s}`);
/* take 122: the effects bundle carries by-hand lines beside the scripted ones; the template sections read the scripted ones */
const scripted = E => Object.fromEntries(Object.entries(E).map(([k, L]) => [k, L.filter(e => !e.hand)]).filter(([, L]) => L.length));

/* the DOM stub and the boot live in tools/lib/appvm.mjs since take 122: the card proofs and self-play boot the shipped app the same way */

/* ---- run --------------------------------------------------------------- */
const APP = await boot();
const { html, js, catalog, manifest, store, remote, ctx, doc, listeners } = APP;
const pkg = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');   /* take 120: the plugin list the status bar needs */

const V = ctx.VAULT;
/* a card planted on the field is the engine's own shape, uid and all: what applies to it follows the uid (take 122's review) */
const onField = (id, turn, rested = false, don = 0) => Object.assign(V.SIM.inst(id, turn), { rested, don });

/* ---- the sections, one file each (take 135, A44 item 6) ------------------
   tools/smoke/NN-name.mjs, in the order they ran in this file until take 134; each exports run(harness) and gets the
   app's handles, ok and section, and the fixtures the foundation file (00-) returns -- what sections 3 to 16 built at
   the top level and 26 later sections read. The runner snapshots the app's state around each file and names what the
   file left changed: a note, never a failure (landmine 221's family: a check that passes or fails with what an earlier
   section left). SMOKE_NAMES=1 prints every check by name, the diff across any move of a section. */
import { pathToFileURL } from 'node:url';
const harness = { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot, fx: null };
const dir = path.join(ROOT, 'tools', 'smoke');
const files = fs.readdirSync(dir).filter(f => /^\d\d-[a-z0-9-]+\.mjs$/.test(f)).sort();
const short = v => { const s = String(v); return s.length > 60 ? s.slice(0, 57) + '...' : s; };
const snap = () => ({
  'collection lines': V.OWN.items.length,
  'collection': V.OWN.items.map(i => `${i.id}:${i.qty || 1}:${i.pf || ''}:${i.condition || ''}`).join(','),
  'store keys': Object.keys(store).sort().join(','),
  'mode': V.MODE.cur, 'nav': V.NAV.stack.join('>'), 'active collection': V.PF.active,
  'credits': JSON.stringify(V.CREDITS.state)
});
let leaks = 0;
for (const f of files) {
  const before = snap();
  const m = await import(pathToFileURL(path.join(dir, f)).href);
  try { const r = await m.run(harness); if (f.startsWith('00-')) harness.fx = r; }
  catch (e) { fail++; console.log(`  FAIL  ${f} threw: ${(e && e.stack) || e}`); }
  const after = snap();
  const changed = Object.keys(before).filter(k => before[k] !== after[k]).filter(k => k !== 'collection' || before['collection lines'] === after['collection lines']);
  if (changed.length) { leaks++; console.log(`   left changed by ${f}: ${changed.map(k => `${k} ${short(before[k])} -> ${short(after[k])}`).join('; ')}`); }
}
console.log(`\n${files.length} files, ${leaks} left the app's state changed (the notes above)`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
