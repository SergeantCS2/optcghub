/* smoke section 96: take 140 — Prep & Play's explanations cut short (A45 item 4, the owner's word of 4 Oct). The words
   changed; what they carried stays: the deck rules and their version, what leaves the phone when playing online, that
   the counter saves nothing, that an unknown import line is listed. The wording checks fail on take 139's build (the
   ones the app draws; the page is this build's under SMOKE_APP), watched; the controls hold on both. */
export async function run(harness) {
  const { html, js, ok, section } = harness;
  section('take 140 — Prep & Play\'s explanations cut short: the rules and their version, what leaves the phone, nothing saved, nothing dropped');
  ok('the deck rules panel: one Leader, fifty cards of its colour, four of a number, ten DON!!, and the rules\' version -- in one sentence and a citation',
     /One Leader and fifty cards that share a colour with it, at most four of\s+each card number; ten DON!! cards go alongside\. <b>Comprehensive Rules v[\d.]+ §5-1<\/b>\.<\/div>/.test(html));
  { const panel = (html.match(/Comprehensive Rules v([\d.]+) §5-1/) || [])[1], sim = (js.match(/RULES: '([\d.]+)'/) || [])[1];
    ok('...and the panel names the rules\' version the Sim plays by (it said 1.2.0 while the Sim and docs/RULES.md were on 1.2.1 since take 122)', !!panel && panel === sim, `${panel} vs ${sim}`); }
  ok('Play\'s counter: nothing saved or sent, in one line', /Life and DON!! for a table game\. Nothing here is saved or sent\./.test(html) && !/Two Leaders, one phone/.test(html));
  ok('copies count by number, the printing only the price', /Copies count by card number; the printing only changes the price\./.test(html));
  ok('the Sim\'s intro: the rules\' version, what the app runs and what is yours by hand',
     /Two players on one phone, or you against the app\. The app keeps the rules \(Comprehensive Rules v\$\{SIM\.RULES\}\) and runs the card effects it understands; any other effect is yours to resolve <b>by hand<\/b>, with only the moves its words name\./.test(js));
  ok('Play online: for friends, and only the code, the two decks and the moves leave the phone',
     /For friends, not strangers: both phones hold the whole deal\. Only the code, the two deck lists and the moves leave the phone\./.test(js));
  ok('the deck import prompt: an unknown line is listed, not dropped', /Unknown lines are listed, not dropped\./.test(js));
  ok('control: the app as opponent still never sees your hand', /The app \\u2014 legal and not clever; it never sees your hand/.test(js));
  ok('none of the long forms is left', !/ride alongside|keeps the rules of the Comprehensive|a changed app could read your hand|Solid history arrives|reported, never dropped/.test(js + html));
}
