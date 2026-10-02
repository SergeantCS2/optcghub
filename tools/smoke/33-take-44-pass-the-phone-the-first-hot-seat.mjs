/* smoke section 33: take 44 — pass the phone: the first hot-seat primitive (A23 step 1)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
{
section('take 44 — pass the phone: the first hot-seat primitive (A23 step 1)');
const P44 = V.PLAY;
P44.hotseat = false; P44.turn = 1; P44.first = 0;
ok('on the table, whose turn follows §6: first player on turn 1, alternating', P44.who() === 0 && (P44.turn = 2, P44.who() === 1) && (P44.turn = 3, P44.who() === 0));
P44.turn = 1;
ok('a Leader names the player; no Leader, the seat name', P44.label(0) === 'Player 1');
P44.hotseat = true; V.paintPlay();
const board = ctx.document.querySelector('#plBoard').innerHTML;
ok('in the hand, only the active player\'s panel is drawn, upright', (board.match(/class="panel plpanel"/g) || []).length === 1 && !/rotate\(180deg\)/.test(board));
ok('...with the opponent\'s life and DON!! on one line', /Opponent/.test(board) && /Life <b>5<\/b>/.test(board));
ok('the button says what happens next', /End turn|Start/.test(board));
V.plCurtain(1);
const cur = ctx.document.querySelector('#plCurtain');
ok('ending a turn drops a curtain that names who takes the phone', cur.classList.contains('on') && /Hand the phone to/.test(cur.innerHTML) && /Player 2/.test(cur.innerHTML));
ok('the curtain is dismissed by a tap, and the mode is remembered', /closest\('#plCurtain'\)/.test(js) && /vault\.hotseat/.test(js));
P44.hotseat = false; cur.classList.remove('on'); V.paintPlay();
ok('negative control: on the table both panels draw, one rotated to face across', (ctx.document.querySelector('#plBoard').innerHTML.match(/class="panel plpanel"/g) || []).length === 2 && /rotate\(180deg\)/.test(ctx.document.querySelector('#plBoard').innerHTML));
}
}
