/* smoke section 97: take 141 — the phone's day wherever the collector reads one (AGENDA A43, landmine 248). Each "today"
   below was the UTC date, tomorrow's on a US evening from 8 PM. Every check runs at 23:30 in New York, the clock pinned and
   the zone set, and each that is not a control fails on take 140's build (SMOKE_APP), watched. */
export async function run(harness) {
  const { V, ctx, doc, store, ok, section } = harness;
  section('take 141 — the phone\'s day: Events, Releases, Sealed, the newest set, the release reminder, the value snapshot and the export names, on a US evening');
  const RealDate = ctx.Date, tz0 = process.env.TZ;
  const html = id => (doc.getElementById(id) || {})._html || '';
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const P = V.PLATFORM, keep = { snaps: V.OWN.snaps, rel: V.RELALERTS.list, ev: V.EVENTS.tab, st: V.LOCAL.stores, zip: V.HUNT.zip, r: V.LOCAL.radius, days: V.EVENTS.days,
    notify: P.notify, notifyAt: P.notifyAt, share: P.shareFile, kind: V.SEALED.kind, q: V.SEALED.q, store: { ...store } };
  let set = null, pub0 = null;
  process.env.TZ = 'America/New_York';
  try {
    const late = new RealDate(); late.setHours(23, 30, 0, 0); const t = late.getTime();
    const day = n => ymd(new RealDate(late.getFullYear(), late.getMonth(), late.getDate() + n, 12));   // by the calendar: a DST night is not 24 h
    const today = ymd(late), yday = day(-1), tmrw = day(1), in2 = day(2), in7 = day(7), in14 = day(14), in15 = day(15);
    ctx.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } };
    ok('precondition: 23:30 in New York is already tomorrow in UTC, and the app sees that clock', late.toISOString().slice(0, 10) === tmrw && new ctx.Date().getTime() === t, late.toISOString());
    ok('phoneToday() is the phone\'s calendar day', typeof V.phoneToday === 'function' && V.phoneToday() === today, typeof V.phoneToday === 'function' ? V.phoneToday() : 'no phoneToday');

    /* Events: tonight's event stays until the phone's day ends; the horizon counts from the phone's day */
    V.LOCAL.stores = { stores: [{ name: 'Take 141 Games', zip: '48329', addr: '1 Main St', city: 'Waterford' }] }; V.HUNT.setZip('48329'); V.LOCAL.radius = 0; V.EVENTS.days = 14;
    V.EVENTS.tab = { url: 'https://www.bandai-tcg-plus.com/event/', titles: ['T141 last night', 'T141 tonight', 'T141 fortnight', 'T141 too far'],
      rows: [[0, yday, 0, 1, 0, 0, 0], [0, today, 1, 2, 0, 0, 0], [0, in14, 2, 3, 0, 0, 0], [0, in15, 3, 4, 0, 0, 0]] };
    const evs = V.EVENTS.rows().map(e => e.title);
    ok('Events keeps tonight\'s event at 23:30 (it left the list at 8 PM: the UTC date was tomorrow\'s)', evs.includes('T141 tonight'), evs.join(' | '));
    ok('control: last night\'s event is gone either way', !evs.includes('T141 last night'), evs.join(' | '));
    V.paintEvents(); const eh = html('eventsList');
    ok('"the next 14 days" ends fourteen days from the phone\'s day: the fifteenth day\'s event is not in them (the UTC horizon took it in)', /T141 fortnight/.test(eh) && !/T141 too far/.test(eh), eh.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));

    /* a set released today, and one tomorrow: Releases, Sealed, a set's card list, the newest set */
    ok('a set out today with no cards on file says its card list is not published yet (it said "sealed products only")', V.setCards({ n: 0, pub: today }) === 'card list not published yet', V.setCards({ n: 0, pub: today }));
    const src = V.HUNT.listedIds();
    const pick = V.SEALED.rows(src).map(p => V.CAT.sets.get(p.set)).find(s => s && s.kind === 'main' && s.pub && V.setTop(s.id));
    ok('precondition: a booster set with sealed products on Sealed and a top card', !!pick, pick ? pick.id : 'none');
    if (pick) {
      set = pick; pub0 = set.pub;
      set.pub = today; V.paintReleases(); const rh = html('relList');
      const row = rh.slice(rh.indexOf(`data-browse-set="${set.id}"`), rh.indexOf(`data-browse-set="${set.id}"`) + 1600);
      ok('Releases counts a set out today as "today" among the upcoming (it was "1 days ago", among the past)', rh.includes(`data-browse-set="${set.id}"`) && />today</.test(row) && !/days ago/.test(row), row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200));
      set.pub = tmrw; V.SEALED.kind = 'all'; V.SEALED.q = ''; V.paintSealed(); const sh = html('sealedList');
      const strip = sh.slice(sh.indexOf(`data-setfold="${set.id}"`), sh.indexOf(`data-setfold="${set.id}"`) + 1200);
      ok('Sealed says a set out tomorrow "Releases", not "Released"', sh.includes(`data-setfold="${set.id}"`) && new RegExp('Releases ' + V.dayText(tmrw)).test(strip), strip.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
      const nt = V.newestTop();
      ok('Home and Decks open under the newest set out by the phone\'s day, not one out tomorrow', !!nt && nt.set.id !== set.id, nt ? `${nt.set.id} ${nt.set.pub}` : 'none');
      set.pub = pub0; set = null;
    }

    /* the release reminder's on-open check: the day before, by the phone's day */
    const fired = []; P.notify = async (id, title) => { fired.push(title); }; P.notifyAt = async () => {};
    const rel = (id, name, pub) => ({ id, name, pub, created: late.toISOString(), fired: null });
    V.RELALERTS.list = [rel('t141-in2', 'T141 in two days', in2), rel('t141-tmrw', 'T141 tomorrow', tmrw), rel('t141-in7', 'T141 in a week', in7)];
    await V.RELALERTS.check();
    ok('a release two days off is not announced "tomorrow" on the evening before the day before (it was)', !fired.some(f => /T141 in two days/.test(f)) && V.RELALERTS.list[0].fired === null, fired.join(' | '));
    ok('a release tomorrow is announced "tomorrow", once, and marked on the phone\'s day (it said "releases today")', fired.length === 1 && /T141 tomorrow releases tomorrow/.test(fired[0]) && V.RELALERTS.list[1].fired === today, `${fired.join(' | ')} / ${V.RELALERTS.list[1].fired}`);
    ok('control: a release a week off is announced by neither clock', !fired.some(f => /T141 in a week/.test(f)) && V.RELALERTS.list[2].fired === null, fired.join(' | '));

    /* the collection's value: filed under the phone's day; a day filed ahead of it before this take keeps its place */
    V.OWN.snaps = [[yday, 1, 1]]; V.OWN.snapshot();
    ok('the value snapshot at 23:30 is filed under the phone\'s day (it went under tomorrow\'s)', V.OWN.snaps.length === 2 && V.OWN.snaps[1][0] === today, JSON.stringify(V.OWN.snaps.map(s => s[0])));
    V.OWN.snaps = [[yday, 1, 1], [tmrw, 2, 1]]; V.OWN.snapshot();
    ok('the guard: an entry filed under tomorrow\'s UTC date takes the value and keeps its day -- the series stays in order, no day twice (take 140 filed it so and passes; a plant comparing days with === fails)', V.OWN.snaps.length === 2 && V.OWN.snaps[1][0] === tmrw && V.OWN.snaps[1][1] === V.OWN.total(), JSON.stringify(V.OWN.snaps));

    /* the export names */
    const names = []; P.shareFile = async name => { names.push(name); return 'shared'; };
    await V.exportCsv(); await V.shareCollectionPage();
    ok('the CSV export and the shared page are named by the phone\'s day', names.length === 2 && names[0] === `optcghub-${today}.csv` && names[1] === `optcghub-${today}.html`, names.join(' | '));
  } finally {
    if (set) set.pub = pub0;
    ctx.Date = RealDate; if (tz0 === undefined) delete process.env.TZ; else process.env.TZ = tz0;
    Object.assign(P, { notify: keep.notify, notifyAt: keep.notifyAt, shareFile: keep.share });
    V.OWN.snaps = keep.snaps; V.RELALERTS.list = keep.rel; V.EVENTS.tab = keep.ev; V.LOCAL.stores = keep.st; V.HUNT.setZip(keep.zip || ''); V.LOCAL.radius = keep.r; V.EVENTS.days = keep.days;
    V.SEALED.kind = keep.kind; V.SEALED.q = keep.q;
    for (const k of Object.keys(store)) if (!(k in keep.store)) delete store[k];
    Object.assign(store, keep.store);
    V.OWN.save(); V.RELALERTS.save(true);
  }
}
