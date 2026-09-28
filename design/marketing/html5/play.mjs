// The HTML5 ad, played in real Chromium from the .zip itself (extracted), with Google's ExitApi stubbed to count
// calls. Screenshots of every step go beside the zip, for the session to read before sending.
//   node design/marketing/html5/play.mjs AD.zip
// Sound: the untouched path must never start audio (Google: no sound before the viewer interacts); the player
// path must start it on the first tap and play the effects (window.__sound, which the ad keeps).
// Refused: a console or page error; an image that did not load; a request outside the zip other than Google's
// exit API and Google Fonts; the player path (a wrong pick, then the SP, then the badge) not reaching the end
// card and exactly one ExitApi.exit(); the untouched path (no tap) not reaching the end card by itself; the
// stage leaving the screen at any of four phone and tablet sizes.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
import { browser } from '../../play-listing/lib.mjs';

const zip = path.resolve(process.argv[2]);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html5-'));
execFileSync('python3', ['-c', 'import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', zip, dir]);
const shots = zip.replace(/\.zip$/, '-play'); fs.mkdirSync(shots, { recursive: true });
const EXIT = 'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js';
const STUB = 'window.ExitApi = { exit: function () { window.__exits = (window.__exits || 0) + 1; } };';
const fails = []; const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await browser();

async function open(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const log = { errors: [], outside: [] };
  page.on('console', m => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', e => log.errors.push(String(e)));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u === EXIT) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) {
      try { return r.fulfill({ response: await r.fetch() }); } catch { return r.abort(); }   // allowed: fetched through the proxy
    }
    if (/^https?:/.test(u)) { log.outside.push(u); return r.abort(); }
    return r.continue();
  });
  await page.goto('file://' + path.join(dir, 'index.html'), { waitUntil: 'load' });
  return { ctx, page, log };
}
async function audit(page, log, tag) {
  const broken = await page.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')));
  if (broken.length) fails.push(`${tag}: images not loaded ${broken}`);
  if (log.errors.length) fails.push(`${tag}: console errors ${log.errors.join(' | ')}`);
  if (log.outside.length) fails.push(`${tag}: requests outside the zip ${log.outside.join(', ')}`);
  const box = await page.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight]; });
  if (box[0] < -1 || box[1] < -1 || box[2] > box[4] + 1 || box[3] > box[5] + 1) fails.push(`${tag}: the stage leaves the screen ${box.map(Math.round)}`);
}
const shot = (page, name) => page.screenshot({ path: path.join(shots, name + '.png') });

// the player: a wrong pick, then the SP, then the badge on the end card
{
  const { ctx, page, log } = await open(390, 844);
  await wait(1400); await shot(page, '1-deal');
  const wrong = await page.$('.slot:not(.dear)'); await wrong.tap(); await wait(900); await shot(page, '2-wrong-pick');
  const snd = await page.evaluate(() => window.__sound);
  if (!snd.started) fails.push('player: no sound after the first tap');
  await (await page.$('.slot.dear')).tap(); await wait(700); await shot(page, '3-found');
  await wait(1600); await shot(page, '4-hero');
  // the app's three screens: each shot once its own caption is up (taps take variable time here)
  for (const [n, name, extra] of [[1, '5-app-scan', 700], [2, '6-app-add', 700], [3, '7-app-grow', 1500]]) {
    await page.waitForFunction(n => (document.getElementById('cap').textContent || '').startsWith(n + ' / 3'), n, { timeout: 12000 })
      .catch(() => fails.push(`player: app step ${n} never showed`));
    await wait(extra); await shot(page, name);
  }
  await page.waitForFunction(() => document.body.classList.contains('end'), null, { timeout: 8000 }).catch(() => fails.push('player: no end card'));
  await wait(700); await shot(page, '8-end');
  const played = await page.evaluate(() => window.__sound.played);
  for (const k of ['flip', 'wrong', 'found', 'coin', 'chime']) if (!played.includes(k)) fails.push(`player: the ${k} sound never played (${played})`);
  await page.tap('#end .badge'); await wait(200);
  const exits = await page.evaluate(() => window.__exits || 0);
  if (exits !== 1) fails.push(`player: ExitApi.exit() called ${exits} times after the badge (want 1)`);
  await audit(page, log, 'player'); await ctx.close();
}
// untouched: the hint, then the reveal plays itself and the end card follows
{
  const { ctx, page, log } = await open(360, 640);
  await wait(4800); await shot(page, '9-idle-hint');
  const hinted = await page.evaluate(() => document.querySelectorAll('.slot.hint').length);
  if (hinted !== 3) fails.push(`untouched: ${hinted} cards hinting at 4.8 s (want 3)`);
  await page.waitForFunction(() => document.body.classList.contains('end'), null, { timeout: 30000 }).catch(() => fails.push('untouched: no end card by itself'));
  await wait(700); await shot(page, '10-untouched-end');
  const heard = await page.evaluate(() => window.__sound);
  if (heard.started || heard.played.length) fails.push(`untouched: sound without a tap (${JSON.stringify(heard)})`);
  const exits = await page.evaluate(() => window.__exits || 0);
  if (exits !== 0) fails.push(`untouched: ExitApi.exit() called ${exits} times without a tap`);
  await audit(page, log, 'untouched'); await ctx.close();
}
// the layout at other sizes: a Fold's cover screen, a tall phone, a tablet
for (const [w, h] of [[412, 915], [344, 882], [768, 1024]]) {
  const { ctx, page, log } = await open(w, h);
  await wait(1400); await shot(page, `11-size-${w}x${h}`);
  await audit(page, log, `${w}x${h}`); await ctx.close();
}
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails.length ? 'play: FAILED\n  ' + fails.join('\n  ') : `play: the player path exits once, the untouched path ends by itself, four sizes fit; shots in ${shots}`);
process.exit(fails.length ? 1 : 0);
