/* smoke section 59: take 105 — the Fold\'s first run of the shrunk build: Back from a card on a fresh launch goes home (landmine 140), the notifications permission on an empty answer (landmine 141)
   Take 135 (A44 item 6): moved out of tools/smoke.mjs as it stood; the runner hands it the app's handles, ok and
   section, and the fixtures the foundation file (00-) built. */
export async function run(harness) {
  const { V, ctx, doc, listeners, store, remote, html, js, catalog, manifest, pkg, ok, section, scripted, onField, appSource, ROOT, W, fs, path, os, vm, zlib, execSync, makeDom, boot } = harness;
section('take 105 — the Fold\'s first run of the shrunk build: Back from a card on a fresh launch goes home (landmine 140), the notifications permission on an empty answer (landmine 141)');
{ /* the app booted in Collect above with nothing seeded: the stack must already hold Home (landmine 140: every earlier back test called V.go('home') first) */
  ok('a fresh boot in Collect puts Home on the stack before anything is tapped (the boot\'s own push, read from the boot record)', Array.isArray(V.NAV.bootStack) && V.NAV.bootStack[0] === 'home' && V.NAV.bootStack.length === 1, JSON.stringify(V.NAV.bootStack));
  V.MODE.set('collect', false); V.NAV.stack = []; const card105 = V.CAT.rows.find(p => !p.sealed && p.num);
  V.openDetail(card105.id);
  ok('...control: a card opened onto an empty stack sits there alone', V.NAV.stack.length === 1 && V.NAV.stack[0] === 'detail', V.NAV.stack.join('>'));
  const closed105 = V.closeAnyOverlay(); const back105 = V.NAV.back();
  ok('the back handler\'s sequence from that lone card goes HOME and reports handled — never minimizeApp() (the screen itself is the look\'s to see: the stub cannot read .on, landmine 136)', closed105 === false && back105 === true && V.NAV.stack.length === 1 && V.NAV.stack[0] === 'home', `closed=${closed105} back=${back105} top=${V.NAV.stack[V.NAV.stack.length - 1]}`);
  V.NAV.stack = ['home'];
  ok('...control: back from a lone Home is the one case that reports unhandled (that is the minimize, and only there)', V.NAV.back() === false && V.NAV.stack[V.NAV.stack.length - 1] === 'home');
  V.MODE.set('hunt', false); V.NAV.stack = ['sealed'];
  ok('...and the rule follows the mode: back from a lone Sealed in Hunt is unhandled too (it is Hunt\'s home)', V.NAV.back() === false);
  V.MODE.set('collect', false); V.NAV.stack = ['home'];
  /* landmine 141: the plugin answers with no data on the shrunk build; the app must say unknown, never denied, and must still ask */
  const savedPlugin = V.PLATFORM.plugin; let asked = 0;
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => undefined, requestPermissions: async () => { asked++; return undefined; } } : savedPlugin.call(V.PLATFORM, n);
  const perm105 = await V.PLATFORM.notifyPermission();
  ok('notifyPermission on an empty plugin answer returns "unknown" and still asked once', perm105 === 'unknown' && asked === 1, `${perm105}, asked ${asked}`);
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => ({ display: 'granted' }), requestPermissions: async () => ({ display: 'granted' }) } : savedPlugin.call(V.PLATFORM, n);
  ok('...control: a real answer still comes through as itself', (await V.PLATFORM.notifyPermission()) === 'granted');
  V.PLATFORM.plugin = (n) => n === 'LocalNotifications' ? { checkPermissions: async () => ({ display: 'denied' }), requestPermissions: async () => ({ display: 'denied' }) } : savedPlugin.call(V.PLATFORM, n);
  ok('...control: denied is still denied', (await V.PLATFORM.notifyPermission()) === 'denied');
  V.PLATFORM.plugin = savedPlugin;
  ok('the reminder toasts have a line for "unknown" (check the phone\'s notification settings), apart from "off"', /unknown/.test(js) && /notification settings/.test(js));
}
}
