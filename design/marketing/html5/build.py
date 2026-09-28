"""HTML5 ad 1, "Which printing?": a playable for App campaigns (AdMob), in the Pull style.

  python3 design/marketing/html5/build.py      -> $ADS_OUT/html5/which-printing/ (index.html, art/, img/) and .zip

The play (portrait, silent):
- three face-down EB04-007 Zoros, dealt in a fresh order on every load, under "Same Zoro. Three prices.";
- a tap flips a card: its printing and its real price (the capture's, with its date). A wrong pick says which
  printing it was and asks again; the SP ignites in its flame aura, the three prices line up, and the end card
  follows: the icon, the name, the line, Google's "Get it on Google Play" badge;
- no tap in 4 s: the cards pulse; none in 9 s: the reveal plays itself, cheapest first;
- the badge sits at the foot throughout, and the end card is tappable: either calls ExitApi.exit().
Google's rules (Google Ads Help, read 28 Sept 2026; check.py enforces them): one .zip of at most 5 MB and 512
files, only .html/.css/.js/.png/.jpg/.gif/.svg, relative paths, exitapi.js as a literal <script> in <head>,
ad.size and ad.orientation meta tags, no iframes, externals only from Google's list (Google Fonts here).
The card back is drawn here, not the game's printed back. Card art is the capture's scans, as JPEG."""
import json, os, random, re, shutil, subprocess, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MKT = os.path.dirname(HERE)
sys.path.insert(0, MKT); sys.path.insert(0, os.path.join(MKT, "motion"))
import style_pull as SP                              # the aura, the accents, the caption rules, the capture
from build import speed_lines                        # the video's manga focus lines
D = SP.D
REPO = os.path.abspath(os.path.join(MKT, "..", ".."))
EXIT_API = "https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"
FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap"
W, H = 390, 844                                      # the stage, scaled to fit the screen

TEXT = {
    "head": "Same Zoro.", "head2": "<em>Three</em> prices.",
    "ask": "Tap the printing worth the most.",
    "wrong": "That one is the {label}, {price}. Try another.",
    "right": "Found it: the {label}, {price}.",
    "auto": "Here is each printing, cheapest first.",
    "after": "Three printings of one number. The scanner shows each one, and asks which you hold.",
    "line": "Scan it. Value it. Build it.",
    "what": "One Piece Card Game collection tracker",
}
LABEL = {"base": "Base", "alternate_art": "Alternate Art", "sp": "SP"}

def jpeg(src_png, dest):
    import imageio_ffmpeg
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", src_png, "-q:v", "3", dest], check=True)

def build():
    R, S = SP.report()
    when = D.day(R["source"])
    foot = f"TCGplayer market prices, {when}."
    words = " ".join(v for k, v in TEXT.items() if "{" not in v)
    bad = SP.check_caption(words) + SP.check_caption(foot, footnote=True)
    assert not bad, bad
    ps = sorted(R["hero"]["printings"], key=lambda p: p["market"] or 0)        # cheapest first
    dear = ps[-1]; ac = SP.accent_of(dear["id"]); acc = ac["bright"]
    out = os.path.join(SP.ADS, "html5", "which-printing")
    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(os.path.join(out, "art")); os.makedirs(os.path.join(out, "img"))
    for p in ps:
        jpeg(os.path.join(SP.ADS, "art", f"{p['id']}.png"), os.path.join(out, "art", f"{p['id']}.jpg"))
    shutil.copy(os.path.join(REPO, "assets", "icon.svg"), os.path.join(out, "img", "icon.svg"))
    badge = os.path.join(SP.ADS, "badge", "google-play-badge.png")
    assert os.path.exists(badge), "no badge: run bash design/marketing/fetch_badge.sh"
    shutil.copy(badge, os.path.join(out, "img", "google-play-badge.png"))

    # the hero: the SP large, in its aura (drawn once, shown when it is found); the art by relative path
    hx, hy, hw = 95, 262, 200
    aura = SP.aura_box(dear["id"], hx, hy, hw, 5, ac, SP.AURA_LEVEL)
    aura = aura.replace(D.art(dear["id"]), f"art/{dear['id']}.jpg")
    assert "data:image" not in aura, "the aura still inlines the art"
    lines = speed_lines(hx + hw / 2, hy + hw * .7, 150, 900, n=72, seed=4)
    cards = [{"id": p["id"], "label": LABEL.get(p["treat"], p["treat"]), "price": p["shown"], "dear": p is dear} for p in ps]
    # the cards and the price row are written here with fixed paths (check.py verifies every one); the script only
    # shuffles where each card sits
    slots_html = "".join(
        f'<div class="slot deal{" dear" if c["dear"] else ""}" data-id="{c["id"]}"><div class="flip">'
        f'<div class="face back"><img src="img/icon.svg" alt=""><b>?</b></div>'
        f'<div class="face front"><img src="art/{c["id"]}.jpg" alt=""></div></div>'
        f'<div class="tag">{c["price"]}<span>{c["label"]}</span></div></div>' for c in cards)
    row_html = "".join(f'<div class="pill{" dear" if c["dear"] else ""}"><b>{c["price"]}</b><span>{c["label"]}</span></div>' for c in cards)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="ad.size" content="width=320,height=480">
<meta name="ad.orientation" content="portrait">
<title>Which printing?</title>
<script type="text/javascript" src="{EXIT_API}"></script>
<link rel="stylesheet" href="{FONTS}">
<style>
:root{{--acc:{acc};--k:1}}
*{{box-sizing:border-box;margin:0;-webkit-tap-highlight-color:transparent}}
html,body{{width:100%;height:100%;overflow:hidden;background:#0a0a0b;color:#f4f5f3;font-family:Inter,system-ui,sans-serif}}
.ground{{position:fixed;inset:-10%;background:url(art/{dear['id']}.jpg) center/cover;filter:blur(48px) saturate(1.4) brightness(.36);transform:scale(1.2)}}
.shade{{position:fixed;inset:0;background:radial-gradient(ellipse 90% 70% at 50% 42%,rgba(6,7,7,.1),rgba(6,7,7,.55) 60%,rgba(6,7,7,.95))}}
#stage{{position:absolute;left:50%;top:50%;width:{W}px;height:{H}px;transform:translate(-50%,-50%) scale(var(--k));transform-origin:50% 50%}}
.abs{{position:absolute}}
.brand{{position:absolute;left:20px;top:22px;display:flex;align-items:center;gap:8px;font:700 15px/1 Inter,sans-serif}}
.brand img{{width:30px;height:30px;border-radius:7px}}
h1{{position:absolute;left:20px;top:70px;font:800 44px/1.02 Inter,sans-serif;letter-spacing:-.035em}}
h1 em{{font-style:normal;color:var(--acc)}}
.say{{position:absolute;left:20px;right:20px;top:176px;font:600 17px/1.35 Inter,sans-serif;color:#d4d7d2;min-height:46px;transition:opacity .25s}}
.slot{{position:absolute;top:318px;width:118px;height:165px;perspective:900px;cursor:pointer;transition:transform .5s cubic-bezier(.2,1.4,.4,1),opacity .4s}}
.slot.deal{{transform:translateY(560px) rotate(18deg)}}
.flip{{position:relative;width:100%;height:100%;transition:transform .55s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}}
.slot.open .flip{{transform:rotateY(180deg)}}
.face{{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:6px;overflow:hidden;box-shadow:0 14px 26px rgba(0,0,0,.55)}}
.front{{transform:rotateY(180deg)}}
.front img{{width:100%;height:100%;object-fit:cover;display:block}}
.back{{background:radial-gradient(circle at 50% 38%,#2a2150,#120e24 70%);border:1.5px solid rgba(242,193,78,.55)}}
.back::before{{content:"";position:absolute;inset:7px;border:1px solid rgba(242,193,78,.28);border-radius:3px}}
.back img{{position:absolute;left:50%;top:44%;width:52px;height:52px;border-radius:12px;transform:translate(-50%,-50%);opacity:.92}}
.back b{{position:absolute;left:0;right:0;bottom:16px;text-align:center;font:800 26px/1 Inter,sans-serif;color:rgba(242,193,78,.8)}}
.slot.hint .flip{{animation:hint 1.1s ease-in-out infinite}}
@keyframes hint{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-8px)}}}}
.slot.hint .back{{box-shadow:0 0 0 2px var(--acc),0 0 28px color-mix(in srgb,var(--acc) 55%,transparent),0 14px 26px rgba(0,0,0,.55)}}
.tag{{position:absolute;left:50%;top:174px;transform:translateX(-50%);white-space:nowrap;padding:6px 10px;border-radius:10px;background:rgba(16,13,34,.92);
  box-shadow:0 0 0 1px rgba(255,255,255,.16);font:800 16px/1 Inter,sans-serif;opacity:0;transition:opacity .3s .3s;text-align:center}}
.tag span{{display:block;font:600 11px/1 Inter,sans-serif;color:#b8bcb7;margin-top:4px}}
.slot.open .tag{{opacity:1}}
.slot.dear.open .tag{{box-shadow:0 0 0 2px var(--acc),0 0 24px color-mix(in srgb,var(--acc) 50%,transparent);color:var(--acc)}}
#hero{{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .5s}}
#hero .big{{position:absolute;left:{hx}px;top:{hy}px;width:{hw}px;transform:rotate(5deg) scale(1.6);opacity:0;transition:transform .45s cubic-bezier(.7,0,.8,.4),opacity .15s;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 30px 40px -18px rgba(0,0,0,.75)}}
#hero .big img{{display:block;width:100%}}
#hero .auraw{{opacity:0;transform:scale(.85);transform-origin:50% 85%;transition:opacity .6s .35s,transform .7s .35s}}
#hero .lines{{position:absolute;inset:0;opacity:0}}
body.found #hero{{opacity:1}}
body.found #hero .big{{transform:rotate(5deg) scale(1);opacity:1}}
body.found #hero .auraw{{opacity:1;transform:scale(1);animation:breathe 2.4s ease-in-out 1.2s infinite}}
body.found #hero .lines{{animation:flash .6s ease-out .42s both}}
@keyframes breathe{{0%,100%{{transform:scale(1)}}50%{{transform:scale(1.035) translateY(-3px)}}}}
@keyframes flash{{0%{{opacity:0;transform:scale(1.2)}}12%{{opacity:.55;transform:scale(1)}}100%{{opacity:0;transform:scale(.97)}}}}
body.found .slot{{opacity:0;pointer-events:none;transform:translateY(40px)}}
.row{{position:absolute;left:14px;right:14px;top:585px;display:flex;gap:8px;opacity:0;transform:translateY(20px);transition:opacity .4s .7s,transform .4s .7s}}
body.found .row{{opacity:1;transform:none}}
.pill{{flex:1;padding:10px 8px;border-radius:14px;background:rgba(16,13,34,.9);box-shadow:0 0 0 1px rgba(255,255,255,.15);text-align:center}}
.pill b{{display:block;font:800 19px/1 Inter,sans-serif;letter-spacing:-.02em}}
.pill span{{display:block;margin-top:5px;font:600 11px/1 Inter,sans-serif;color:#b8bcb7}}
.pill.dear{{box-shadow:0 0 0 2px var(--acc),0 0 30px color-mix(in srgb,var(--acc) 45%,transparent)}}
.pill.dear b{{color:var(--acc)}}
.foot{{position:absolute;left:20px;right:20px;top:668px;font:500 11px/1.3 Inter,sans-serif;color:#9da19c;opacity:0;transition:opacity .4s 1s}}
body.found .foot{{opacity:1}}
.gp{{position:absolute;left:50%;bottom:26px;width:170px;transform:translateX(-50%);cursor:pointer}}
.gp img{{display:block;width:100%}}
#end{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:0 28px 60px;
  background:linear-gradient(180deg,rgba(8,8,10,.55),rgba(8,8,10,.92) 38%);opacity:0;pointer-events:none;transition:opacity .6s;cursor:pointer}}
body.end #end{{opacity:1;pointer-events:auto}}
#end .ic{{width:96px;height:96px;border-radius:22px;box-shadow:0 0 60px color-mix(in srgb,var(--acc) 40%,transparent),0 20px 40px rgba(0,0,0,.6)}}
#end h2{{font:800 38px/1 Inter,sans-serif;letter-spacing:-.035em;margin-top:6px}}
#end .l{{font:700 20px/1.2 Inter,sans-serif;color:var(--acc)}}
#end .a{{font:500 15px/1.4 Inter,sans-serif;color:#d4d7d2;max-width:310px}}
#end .w{{font:500 13px/1.3 Inter,sans-serif;color:#9da19c}}
#end .badge{{width:230px;margin-top:6px}}
#end .f{{position:absolute;left:0;right:0;bottom:22px;font:500 10px/1.3 Inter,sans-serif;color:#8d918c}}
body.end .gp{{opacity:0;pointer-events:none}}
/* under the end card the game steps back entirely: nothing of it shows through the lockup */
body.end #hero,body.end .row,body.end .foot,body.end .say,body.end h1,body.end .brand{{opacity:0;transition:opacity .4s}}
body.end .say{{opacity:0 !important}}   /* tell() sets its opacity inline, which beats the rule above */
</style>
</head>
<body>
<div class="ground"></div><div class="shade"></div>
<div id="stage">
<div class="brand"><img src="img/icon.svg" alt=""><span>OP TCG Hub</span></div>
<h1>{TEXT['head']}<br>{TEXT['head2']}</h1>
<div class="say" id="say"></div>
<div id="slots">{slots_html}</div>
<div id="hero">
<svg class="lines" width="{W}" height="{H}" viewBox="0 0 {W} {H}" aria-hidden="true">{lines}</svg>
<div class="auraw">{aura}</div>
<div class="big"><img src="art/{dear['id']}.jpg" alt="{dear['name']} SP"></div>
</div>
<div class="row" id="row">{row_html}</div>
<div class="foot">{foot}</div>
<div class="gp" id="gp"><img src="img/google-play-badge.png" alt="Get it on Google Play"></div>
<div id="end">
<img class="ic" src="img/icon.svg" alt="">
<h2>OP TCG Hub</h2>
<div class="l">{TEXT['line']}</div>
<div class="a">{TEXT['after']}</div>
<div class="w">{TEXT['what']}</div>
<img class="badge" src="img/google-play-badge.png" alt="Get it on Google Play">
<div class="f">{foot} Google Play and the Google Play logo are trademarks of Google LLC.</div>
</div>
</div>
<script>
var CARDS = {json.dumps(cards)}, T = {json.dumps({k: v for k, v in TEXT.items() if "{" in v or k in ("ask", "auto")})};
var W = {W}, H = {H}, POS = [[14, -6], [136, 0], [258, 6]];
function fit() {{ var k = Math.min(innerWidth / W, innerHeight / H); document.documentElement.style.setProperty('--k', k); }}
addEventListener('resize', fit); fit();
function exitAd() {{ if (window.ExitApi) ExitApi.exit(); }}
document.getElementById('gp').addEventListener('click', function (e) {{ e.stopPropagation(); exitAd(); }});
document.getElementById('end').addEventListener('click', exitAd);
var say = document.getElementById('say');
function tell(s) {{ say.style.opacity = 0; setTimeout(function () {{ say.textContent = s; say.style.opacity = 1; }}, 180); }}
function fill(s, c) {{ return s.replace('{{label}}', c.label).replace('{{price}}', c.price); }}
// a fresh deal every load: the order of the three is shuffled
var order = CARDS.slice(); for (var i = order.length - 1; i > 0; i--) {{ var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }}
var done = false, idle, auto;
order.forEach(function (c, i) {{
  var s = document.querySelector('.slot[data-id="' + c.id + '"]');
  s.style.left = POS[i][0] + 'px'; s.style.rotate = POS[i][1] + 'deg';
  s.addEventListener('click', function () {{ pick(s, c, false); }});
  setTimeout(function () {{ s.classList.remove('deal'); }}, 250 + i * 160);
}});
function calm() {{ document.querySelectorAll('.slot').forEach(function (s) {{ s.classList.remove('hint'); }}); clearTimeout(idle); clearTimeout(auto); }}
function wait() {{
  idle = setTimeout(function () {{ document.querySelectorAll('.slot:not(.open)').forEach(function (s) {{ s.classList.add('hint'); }}); }}, 4000);
  auto = setTimeout(autoplay, 9000);
}}
function pick(s, c, byAuto) {{
  if (done || s.classList.contains('open')) return;
  calm(); s.classList.add('open');
  if (c.dear) {{ done = true; if (!byAuto) tell(fill(T.right, c)); setTimeout(found, 900); }}
  else {{ if (!byAuto) {{ tell(fill(T.wrong, c)); wait(); }} }}
}}
function found() {{
  document.body.classList.add('found');
  setTimeout(function () {{ document.body.classList.add('end'); }}, 3600);
}}
function autoplay() {{
  if (done) return; tell(T.auto);
  var rest = CARDS.filter(function (c) {{ return !document.querySelector('.slot[data-id="' + c.id + '"]').classList.contains('open'); }});
  rest.forEach(function (c, i) {{ setTimeout(function () {{ pick(document.querySelector('.slot[data-id="' + c.id + '"]'), c, true); }}, 300 + i * 800); }});
}}
setTimeout(function () {{ tell(T.ask); wait(); }}, 900);
</script>
</body>
</html>
"""
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    z = out + ".zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as f:
        for root, _, files in os.walk(out):
            for name in sorted(files):
                p = os.path.join(root, name); f.write(p, os.path.relpath(p, out))
    print(f"html5: which-printing -> {z} ({os.path.getsize(z) / 1024:.0f} KB, {sum(len(fs) for _, _, fs in os.walk(out))} files)")
    return z

if __name__ == "__main__":
    build()
