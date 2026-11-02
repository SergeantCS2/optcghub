/* Take 150, the date sweep: the whole smoke, the shipped app's, run on other days -- the instants a check written today
   can go stale on (DST nights, month and year ends, the weeks ahead, a set's release day), each in UTC (the runner's
   zone) and in New York (the owner's). Prints the checks that fail at each instant and not on the real clock.

     node tools/sweep.mjs                     # every instant, 4 at a time
     node tools/sweep.mjs 2026-12-31T23:30:00Z  # one instant, both zones

   Slow (one smoke per instant and zone, ~3 min each), so it is run by hand or on a schedule, never in the pipeline. A
   failure here is read, not obeyed: a check that fails because the prices on disk are weeks old at a clock weeks ahead
   is the data's age, not the check's -- the sweep says which checks to read. */
import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const DAY = 864e5, now = Date.now(), iso = t => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z');
const INSTANTS = process.argv.slice(2).length ? process.argv.slice(2) : [
  '2026-11-02T04:30:00Z',   // 23:30 on 1 Nov in New York: the day DST ends, 25 hours long
  '2027-03-15T03:30:00Z',   // 23:30 on 14 Mar in New York: the day DST starts, 23 hours long
  '2026-12-01T04:30:00Z',   // 23:30 on 30 Nov in New York, already December in UTC: a month's end
  '2027-01-01T04:30:00Z',   // 23:30 on 31 Dec in New York, already the new year in UTC
  '2026-11-20T15:00:00Z',   // OP-18's release day
  iso(now + 30 * DAY), iso(now + 60 * DAY), iso(now + 90 * DAY),
];
const ZONES = ['UTC', 'America/New_York'];
const run = (when, tz) => new Promise(res => {
  const p = spawn('node', [path.join(ROOT, 'tools', 'smoke.mjs')], { cwd: ROOT, env: { ...process.env, TZ: tz, ...(when ? { SMOKE_NOW: when } : {}) } });
  let out = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
  p.on('close', code => {
    const fails = out.split('\n').filter(l => l.startsWith('  FAIL')).map(l => l.slice(8, 200)), tally = (out.match(/\d+ passed, \d+ failed/) || [''])[0];
    /* a run that never reached its tally, or ended red with no check named, crashed: that is a failure, never a clean day */
    if (!tally || (code !== 0 && !fails.length)) fails.push(`the smoke did not finish (exit ${code}): ${out.trim().split('\n').slice(-3).join(' | ').slice(0, 160)}`);
    res({ when: when || 'the real clock', tz, code, fails, tally: tally || 'no tally' });
  });
});
const jobs = [...ZONES.map(tz => [null, tz]), ...INSTANTS.flatMap(w => ZONES.map(tz => [w, tz]))], results = [];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const [w, tz] = jobs[next++]; results.push(await run(w, tz)); } }));
const base = new Set(results.filter(r => r.when === 'the real clock').flatMap(r => r.fails));
let stale = 0;
for (const r of results.sort((a, b) => String(a.when).localeCompare(String(b.when)) || a.tz.localeCompare(b.tz))) {
  const own = r.fails.filter(f => !base.has(f)); stale += own.length;
  console.log(`\n${r.when}  ${r.tz}  ${r.tally}${own.length ? '' : '  -- nothing beyond the real clock'}`);
  own.forEach(f => console.log(`   FAIL  ${f}`));
}
[...base].forEach(f => console.log(`   on the real clock: FAIL  ${f}`));
console.log(`\n${base.size} check(s) fail on the real clock; ${stale} more on the instants above`);
process.exit(base.size || stale ? 1 : 0);
