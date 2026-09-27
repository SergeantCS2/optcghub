// The motion engine: a composition page in, an H.264 MP4 out, frame-exact.
//
// The page is built with its clock stopped. For each frame at t seconds the engine
// - sets every CSS/Web animation to t (document.getAnimations()),
// - sets every outermost SVG's SMIL clock to t (the aura's rising noise is SMIL),
// - calls window.__frame(t) if the page has one (the timeline: tweens, the count-up),
// then takes a screenshot and pipes it to ffmpeg. Nothing runs on wall-clock time, so the same page renders
// the same video every time, however slow the machine is.
//   node motion/engine.mjs page.html out.mp4 [--fps 30] [--from S --to S] [--stills 0,1.5,3]
//     --stills writes PNGs of those times beside the MP4 and no video (for reading frames)
// ffmpeg is FFMPEG, or the static binary imageio-ffmpeg installs (a scratch venv, not a repo dependency).
// The page's size is its <html> element's width and height; its duration is <meta name="duration">.
import fs from 'node:fs'; import path from 'node:path'; import { spawn, execFileSync } from 'node:child_process';
import { browser } from '../../play-listing/lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const [src, out] = args.filter((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--')));
if (!src || !out) { console.log('usage: engine.mjs page.html out.mp4 [--fps 30] [--from S --to S] [--stills a,b,c]'); process.exit(2); }
const FPS = +opt('--fps', 30);

export function ffmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const py = process.env.FFMPEG_PY || 'python3';
  try { return execFileSync(py, ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim(); }
  catch { throw new Error('no ffmpeg: set FFMPEG, or FFMPEG_PY to a python with imageio-ffmpeg'); }
}

const html = fs.readFileSync(src, 'utf8');
const size = /html,body\{width:(\d+)px;height:(\d+)px/.exec(html);
const dur = /<meta name="duration" content="([\d.]+)">/.exec(html);
if (!size || !dur) { console.log('engine: the page needs html,body{width;height} and <meta name="duration">'); process.exit(2); }
const [W, H, D] = [+size[1], +size[2], +dur[1]];

const b = await browser();
const page = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
page.on('pageerror', e => { console.log('engine: page error', e.message); process.exitCode = 1; });
await page.goto('file://' + path.resolve(src), { waitUntil: 'load' });   // its assets sit beside it (build.py)
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  for (const s of document.querySelectorAll('svg')) if (!s.ownerSVGElement && s.pauseAnimations) s.pauseAnimations();
});
const seek = t => page.evaluate(t => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
  for (const s of document.querySelectorAll('svg')) if (!s.ownerSVGElement && s.setCurrentTime) s.setCurrentTime(t);
  if (window.__frame) window.__frame(t);
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

const stills = opt('--stills', null);
if (stills) {
  const dir = path.dirname(out), base = path.basename(out).replace(/\.mp4$/, '');
  for (const t of stills.split(',').map(Number)) {
    await seek(t); const f = path.join(dir, `${base}-${t.toFixed(2)}s.png`);
    await page.screenshot({ path: f }); console.log('engine: still', f);
  }
  await b.close(); process.exit(process.exitCode || 0);
}

const from = +opt('--from', 0), to = Math.min(+opt('--to', D), D);
const n = Math.round((to - from) * FPS);
const ff = spawn(ffmpeg(), ['-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
  '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',            // a silent track: some players and uploads want audio
  '-map', '0:v', '-map', '1:a', '-shortest',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await seek(from + i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % FPS === 0) process.stdout.write(`\rengine: ${i}/${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
ff.stdin.end();
const code = await new Promise(r => ff.on('close', r));
await b.close();
console.log(`\nengine: ${n} frames at ${FPS} fps (${(n / FPS).toFixed(2)} s, ${W}x${H}) -> ${out}, ffmpeg exit ${code}`);
process.exit(code || process.exitCode || 0);
