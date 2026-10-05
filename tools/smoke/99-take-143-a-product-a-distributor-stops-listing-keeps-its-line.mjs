/* smoke section 99: take 143 — A32's Next, its second item: a delisted item. The runner keeps each matched item's catalogue id
   and last listing in the history (tools/hunt.py record_items, its own probes in --selftest); a product's page keeps a
   distributor that listed it and lists it no more, "no longer on its list · last listed Oct 3", with its History. Run in the
   owner's zone. Each app check that is not a control fails on take 142's build (SMOKE_APP), watched. */
export async function run(harness) {
  const { V, ctx, ok, section, ROOT, fs, path, os, execSync } = harness;
  section('take 143 — a product a distributor stops listing keeps its line, by the history\'s map of ids to products');
  const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optcghub-gone-')), feedF = path.join(fxDir, 'feed-fixture.json');
  execSync(`python3 tools/hunt.py --from-fixtures --out ${feedF}`, { cwd: ROOT, stdio: 'pipe' });
  const F = JSON.parse(fs.readFileSync(feedF, 'utf8')), HF = JSON.parse(fs.readFileSync(path.join(fxDir, 'history-fixture.json'), 'utf8')), R0 = HF.runs[0];
  const gi = F.sources.gts.items, si = F.sources.southern.items;
  const kept = (list, k, d) => list.every(i => Number.isInteger(i.catalog_id)
    ? JSON.stringify(((HF.items || {})[d] || {})[i[k]]) === JSON.stringify({ catalog_id: i.catalog_id, seen: F.fetched_at }) : !(((HF.items || {})[d] || {})[i[k]]));
  ok('the runner (this tree\'s hunt.py, so on any build): the fixture run keeps each GTS and Southern Hobby item matched to a product -- its catalogue id and listing, by its own id -- and no other',
     !!HF.items && kept(gi, 'sku', 'gts') && kept(si, 'id', 'southern') && gi.concat(si).some(i => Number.isInteger(i.catalog_id)), JSON.stringify(HF.items || null).slice(0, 160));
  const TZ0 = process.env.TZ; process.env.TZ = 'America/New_York';
  const keep = { feed: V.HUNT.feed, hist: V.HUNT.hist, zip: V.HUNT.zip, mode: V.MODE.cur };
  try {
    const G = gi.find(i => i.sku === 'BJP2873812') || {}, S = si.find(i => i.id === '79311') || {}, PID = G.catalog_id;
    ok('premise: the OP-18 box, on both distributors\' lists', !!PID && S.catalog_id === PID, `${PID} ${S.catalog_id}`);
    const nb = s => String(s).replace(/[  ]/g, ' ');
    const ld = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    /* 30 runs, 4-hourly, ending on the fixture's own: GTS read in each, listing the box until run 19 and not from run 20; Southern Hobby
       in the last four, listing it throughout. The feed now is the fixture's without the box on GTS's list. */
    const END = Date.parse(F.fetched_at), N = 30, runs = [];
    for (let k = N - 1; k >= 0; k--) runs.push({ t: new Date(END - k * 4 * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z'), online: {}, shelf: {} });
    runs.forEach((r, i) => { r.gts = { ...R0.gts }; if (i >= 20) delete r.gts.BJP2873812; if (i >= N - 4) r.southern = { ...R0.southern }; });
    const items = { gts: { BJP2873812: { catalog_id: PID, seen: runs[19].t } }, southern: { '79311': { catalog_id: PID, seen: runs[N - 1].t } } };
    const H = { runs, since: runs[0].t, stores: {}, titles: {}, items };
    const F2 = JSON.parse(JSON.stringify(F)); F2.sources.gts.items = F2.sources.gts.items.filter(i => i.sku !== 'BJP2873812');
    V.HUNT.feed = F2; V.HUNT.hist = H; V.HUNT.setZip(''); V.MODE.set('hunt', false); V.DISTF.open.clear();
    const gone = typeof V.HUNT.goneFor === 'function' ? V.HUNT.goneFor(PID) : null;
    ok('the box GTS no longer lists is found by the history\'s map: GTS, its SKU, its last listing; Southern Hobby, which lists it, is not',
       JSON.stringify(gone && gone.map(g => [g._d, g.sku, g.seen, g._gone])) === JSON.stringify([['gts', 'BJP2873812', runs[19].t, true]]), JSON.stringify(gone));
    /* on screen: the box's page, Distributor info open, GTS's history open */
    V.openDetail(PID, { dist: true }); if (typeof V.distHistTap === 'function') V.distHistTap('gts');
    const h = ctx.document.querySelector('#dDist').innerHTML;
    const text = h.replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').split('\n').map(x => x.trim()).filter(Boolean);
    ok('the page keeps GTS\'s line, "no longer on its list" with the day it was last listed, and no Open to a page it no longer has',
       text.includes(`no longer on its list · last listed ${nb(V.dayText(ld(runs[19].t)))}`) && !/Open GTS Distribution/.test(h), text.slice(0, 12).join(' | '));
    ok('...and its History, which ends with the box leaving the list, between the two reads',
       text.some(l => /^sold out → not on its list · between /.test(l) || / → not on its list · between /.test(l)), text.filter(l => /not on its list/.test(l)).join(' | '));
    ok('control: Southern Hobby, which lists it, keeps its own line as before', /<b>Southern Hobby<\/b>/.test(h) && text.some(l => /^stores’ orders closed/.test(l)), text.filter(l => /Southern|orders/.test(l)).join(' | '));
    /* controls: listed on the feed now; no list from GTS on this phone; no map in the history */
    V.HUNT.feed = F; const listed = typeof V.HUNT.goneFor === 'function' ? V.HUNT.goneFor(PID) : [];
    const F3 = JSON.parse(JSON.stringify(F2)); delete F3.sources.gts; V.HUNT.feed = F3; const nolist = typeof V.HUNT.goneFor === 'function' ? V.HUNT.goneFor(PID) : [];
    V.HUNT.feed = F2; V.HUNT.hist = { ...H, items: undefined }; const nonames = typeof V.HUNT.goneFor === 'function' ? V.HUNT.goneFor(PID) : [];
    V.HUNT.hist = { ...H, items: { gts: { BJP2873812: 'x', B: { catalog_id: PID } }, southern: [1] } }; const odd = typeof V.HUNT.goneFor === 'function' ? V.HUNT.goneFor(PID) : [];
    ok('control: nothing is called gone while it is listed, when this phone holds no list from that distributor, with no map on file, or a map of an odd shape',
       !listed.length && !nolist.length && !nonames.length && !odd.length, JSON.stringify([listed, nolist, nonames, odd]));
  } finally {
    V.HUNT.feed = keep.feed; V.HUNT.hist = keep.hist; V.HUNT.setZip(keep.zip || ''); V.MODE.set(keep.mode, false); V.DISTF.open.clear();
    if (TZ0 === undefined) delete process.env.TZ; else process.env.TZ = TZ0;
  }
}
