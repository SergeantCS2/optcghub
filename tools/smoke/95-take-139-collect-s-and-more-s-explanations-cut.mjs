/* smoke section 95: take 139 — Collect's and More's explanations cut short (A45 items 2 and 3, the owner's word of 4 Oct:
   "short and simple - human like and only necessary info"). The words changed; what they carried does not: where a price
   comes from and its day, that the app is not affiliated, that a condition is the collector's own call, and what to do
   before an uninstall. The wording checks fail on take 138's build (SMOKE_APP), watched; the facts' checks are its controls. */
export async function run(harness) {
  const { V, ctx, html, ok, section } = harness;
  section('take 139 — Collect\'s and More\'s explanations cut short: the source and its day, not affiliated, condition the collector\'s call, Export CSV before an uninstall');
  const txt = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const day = V.dayText(V.CAT.man.source_updated_at);
  V.go('home'); V.paintHome();
  const src = txt(ctx.document.getElementById('srcNote').innerHTML);
  ok('Home\'s sources panel leads with the source and its day, in one sentence', src.startsWith(`Prices from TCGplayer , via TCGCSV , updated ${day}.`) || src.startsWith(`Prices from TCGplayer, via TCGCSV, updated ${day}.`), src.slice(0, 120));
  ok('...then the count, and a market price is an estimate, not a sale -- and no "built" day (About has it)', /\d[\d,]* cards across \d+ sets\./.test(src) && /A market price is an estimate, not a sale\./.test(src) && !/built /.test(src), src);
  ok('control: still not affiliated with any of the five', /Not affiliated with, endorsed by or sponsored by Bandai, Shueisha, Toei, Viz Media or TCGplayer\./.test(src), src.slice(-120));
  const page = V.collectionPage(), foot = txt((page.match(/<div class="note">([^<]*Made with OP TCG Hub[^<]*)<\/div>/) || [, ''])[1]);
  ok('the shared page\'s footer: a market price is an estimate, and condition is the owner\'s own call that does not change the price', /^Market prices are estimates\. Condition is the owner’s own call and doesn’t change the price shown\./.test(foot), foot);
  ok('control: ...and it is still not affiliated', /Not affiliated with Bandai, Shueisha, Toei Animation, Viz Media or TCGplayer\./.test(foot), foot);
  V.go('settings'); const more = ctx.document.querySelector('#setBody').innerHTML, mt = txt(more);
  ok('More\'s backup note: where and when, that photos are not in it, and Export CSV before an uninstall -- in two sentences', /Backed up to Documents\/OPTCGHub on every save; photos aren’t included\. Before you uninstall or switch to the Play version, Export CSV and keep the file\./.test(mt), (mt.match(/Backed up[^.]*\.[^.]*\./) || [mt.slice(0, 160)])[0]);
  ok('control: "Export CSV and keep the file" stays in bold, as it was', /<b>Before you uninstall or switch to the Play version, Export CSV and keep the file\.<\/b>/.test(more) || /<b>[^<]*Export CSV and keep the file[^<]*<\/b>/.test(more));
  ok('More\'s sync note and its cellular line, shorter', /Gets new prices nightly when you’re online\. Everything else works offline\./.test(mt) && /About 0\.5 MB a day\. Off: it waits for wifi\./.test(mt), (mt.match(/Gets new prices[^.]*\./) || [''])[0]);
  ok('More\'s Catalogue panel says its days in words, not as stamps (it showed 2026-10-03T20:05:38+0000)',
     more.includes(`<span>${V.momentText(V.CAT.man.source_updated_at)}</span>`) && !/\d{4}-\d\d-\d\dT\d\d:\d\d/.test(mt), (mt.match(/Source updated [^A-Z]{0,40}/) || [''])[0]);
  ok('"What this app does not know" keeps its four facts, one line each', /Condition does not change the price shown — the source has no prices by condition\. Graded copies show the ungraded price\. Japanese printings are not covered\. Sealed product is added by hand — it has no card number to scan\./.test(mt), (mt.match(/Condition does not[^]{0,260}/) || [''])[0]);
  ok('Data sources names the source, whose the art is, and that the app is not affiliated, in fewer words', /Catalogue and prices: TCGplayer , via TCGCSV|Catalogue and prices: TCGplayer, via TCGCSV/.test(mt) && /Card art belongs to Bandai, Shueisha, Toei and Viz Media/.test(mt) && /Not affiliated with, endorsed by, or sponsored by/.test(mt));
  { const c = V.CAT.rows.find(r => r.num && !r.sealed && r.market > 0 && r.low != null && r.high != null); V.openDetail(c.id);
    const pv = txt(ctx.document.getElementById('dProv').innerHTML);
    ok('a card\'s price block: market, its source and day, the day\'s low and high, and that market is an estimate -- in fewer words', new RegExp(`· TCGplayer via TCGCSV · as of ${day} ?\\. Low [^ ]+ – high [^ ]+ that day\\. Market is an estimate, not a sale\\.`).test(pv) && !/model, not a sale|on the same day/.test(pv), pv.slice(0, 200)); V.go('home'); }
  ok('the static notes: Set completion, Wants, price alerts, a graded copy, Trade, Diagnostics -- each one or two short sentences',
     /Cards you own, by set\.<\/div>/.test(html) && /Cards you’re after\. Add them from a checklist, a search or a card’s page\./.test(html) && /Checked nightly with new prices\. One notification each\./.test(html)
       && /There are no graded prices here, so the value shown is the <b>ungraded<\/b> price — a graded copy is usually worth more\./.test(html) && /What you give, what you get, and the difference at today’s prices\./.test(html)
       && /A report for the developer: what this phone stores and runs, with no collection contents\./.test(html));
  ok('control: none of the long forms is left in the page', !/Sealed product is excluded|valued the same way|fresh catalogue lands|free price feed|Everything needed to read this phone/.test(html));
  V.go('home');
}
