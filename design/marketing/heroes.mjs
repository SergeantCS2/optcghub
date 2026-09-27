// Candidates for each concept's hero card (the owner, 27 Sept: "varied fan favourites"): for each popular
// character, the dearest printings in the live catalogue with a scan, marked when the showcase collection or
// deck holds that exact printing (the picture then matches the app on screen). It writes a contact sheet to
// read by eye (most TCGplayer scans carry a "SAMPLE" mark) and a JSON list; the picks go in heroes.json.
//   node design/marketing/heroes.mjs [Name ...]   -> $ADS_OUT/probe/heroes.png, heroes-candidates.json
import { launch, wait, REPO } from '../play-listing/lib.mjs';
import { ADS_DIR } from './paths.mjs';
import fs from 'node:fs'; import path from 'node:path';
const OUT = path.join(ADS_DIR, 'probe'); fs.mkdirSync(OUT, { recursive: true });
const NAMES = process.argv.slice(2).length ? process.argv.slice(2)
  : ['Monkey.D.Luffy', 'Shanks', 'Nami', 'Portgas.D.Ace', 'Trafalgar Law', 'Boa Hancock', 'Yamato', 'Sanji', 'Nico Robin', 'Uta'];
const held = new Set(fs.readFileSync(path.join(REPO, 'showcase', 'collection.csv'), 'utf8').split('\n').slice(1)
  .map(l => (l.split(',')[1] || '').replace(/"/g, '')).filter(Boolean).map(Number));
const deckNums = new Set(fs.readFileSync(path.join(REPO, 'showcase', 'deck.txt'), 'utf8').split('\n').map(l => (l.match(/[A-Z]+\d*-\d{3}/) || [])[0]).filter(Boolean));
const { browser, page, open } = await launch({ width: 1800, height: 1200, dpr: 1 });
await open();
const rows = await page.evaluate(({ names, held, deck }) => { const C = window.VAULT.CAT, heldS = new Set(held), deckS = new Set(deck);
  return names.map(n => ({ name: n, top: C.rows.filter(p => p.name === n && p.img && p.market > 0).sort((a, b) => b.market - a.market).slice(0, 6)
    .map(p => ({ id: p.id, num: p.num, treat: p.treat, rarity: p.rarity, prov: p.prov || '', market: p.market, held: heldS.has(p.id), inDeck: deckS.has(p.num),
      large: p.img.replace(/_200w\.jpg$/, '_in_1000x1000.jpg') })) })); }, { names: NAMES, held: [...held], deck: [...deckNums] });
fs.writeFileSync(path.join(OUT, 'heroes-candidates.json'), JSON.stringify(rows, null, 1));
await page.setContent('<body style="margin:0;background:#222;color:#eee;font:12px sans-serif;padding:8px">' + rows.map(r => `<div style="margin:6px 0 2px;font-weight:700">${r.name}</div><div style="display:flex;gap:6px">` +
  r.top.map(p => `<figure style="margin:0;width:150px"><img src="${p.large}" style="width:150px;display:block"><figcaption>${p.id} ${p.num}<br>${p.treat} ${p.rarity} $${p.market}${p.held ? ' HELD' : ''}${p.inDeck ? ' DECK' : ''}${p.prov ? '<br>' + p.prov.slice(0, 30) : ''}</figcaption></figure>`).join('') + '</div>').join('') + '</body>');
await wait(500);
await page.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 90000 }).catch(() => {});
await wait(800); await page.screenshot({ path: path.join(OUT, 'heroes.png'), fullPage: true });
for (const r of rows) console.log(r.name, r.top.map(p => `${p.id}:${p.num}:${p.treat}:$${p.market}${p.held ? ':HELD' : ''}${p.inDeck ? ':DECK' : ''}`).join(' '));
await browser.close();
