/* smoke section 56: take 99 — the look (A40): the harness exists and stays out of the tree; what its first run on take 98 found
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 99 — the look (A40): the harness exists and stays out of the tree; what its first run on take 98 found');
ok('the look harness and its step lists exist beside the other tools, and look/ is gitignored (the pictures go to the owner)', fs.existsSync(path.join(ROOT, 'tools/look.mjs')) && fs.existsSync(path.join(ROOT, 'tools/look/steps.mjs')) && /^\/look\/$/m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')));
ok('...and the ignore is anchored to the root: tools/look/ (the step lists) is not ignored (landmine 138), while look/ is', (() => { try { execSync('git check-ignore -q tools/look/steps.mjs', { cwd: ROOT, stdio: 'pipe' }); return false; } catch (e) { return e.status === 1; } })() && (() => { try { execSync('git check-ignore -q look/x/report.json', { cwd: ROOT, stdio: 'pipe' }); return true; } catch (e) { return false; } })());
ok('a long toast is as wide as its text up to the cap, not half the screen (left:50% halves the available width — the look\'s first finding)', /\.toast\{[^}]*width:max-content/.test(html));
{ const box99 = V.CAT.rows.find(p => V.SEALED.isProduct(p) && !p.prov); const card99 = V.CAT.rows.find(p => !p.sealed && p.rarity && p.num);
  V.openDetail(box99.id); const subBox = ctx.document.getElementById('dSub').textContent;
  /* take 111: the line is the set's name -- or nothing, hidden, when the product is named for its set (every starter deck said its name twice) */
  const setBox = (V.CAT.sets.get(box99.set) || {}).name || '', hidBox = ctx.document.getElementById('dSub').hidden;
  ok('a sealed product\'s sheet subtitle is built from the parts it has — no "· ·" after the set name (the look\'s second finding)', !/· ·/.test(subBox) && !/·\s*$/.test(subBox)
     && (setBox && setBox !== box99.name ? subBox === setBox && !hidBox : subBox === '' && hidBox), JSON.stringify([subBox, setBox, box99.name]));
  V.openDetail(card99.id); const subCard = ctx.document.getElementById('dSub').textContent;
  ok('...control: a card\'s subtitle still carries set · rarity · number', subCard.split(' · ').length >= 3 && subCard.includes(card99.num) && subCard.includes(card99.rarity), JSON.stringify(subCard));
  V.go('home'); }
}
