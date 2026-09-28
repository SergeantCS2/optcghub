"""HTML5 ad 1, "Which printing?": a playable for App campaigns (AdMob), in the Pull style.

  node design/marketing/capture.mjs h5- art   (HERO=OP11-118:632497,632498,632499 REPORT=html5): the app's own
                                                  screens and the card art -> report-html5.json, shots/h5-*.png
  python design/marketing/html5/build.py        (the venv python: imageio-ffmpeg) -> $ADS_OUT/html5/which-printing/
                                                  and which-printing.zip

The play (portrait):
- three face-down OP11-118 Luffys, dealt in a fresh order on every load, under "Same Luffy. Not the same price."
  (the owner, 28 Sept: "the red Luffy manga rare ... same Luffy of course"). OP11-118 has four printings; the
  game deals three, and the words never count them;
- a tap flips a card to its printing and its real price. A wrong pick says which it was and asks again; the
  Manga ignites in its flame aura, the three prices line up;
- then the app itself, in its own screens from the capture (the owner: "real screenshots from the app, maybe it
  being scanned, adding it to the collection and the number going up"): the scanner asking which printing, the
  Manga picked into the batch, and Home's total before and after, up by the card's price;
- the end card: the icon, the name, the line, the four features (the owner: "Scanner, Deck Builder, hunt product
  and local events & stock"), Google's badge;
- sound after the first tap only (Google's rule): Kenney's CC0 effects and the owner's jazz-hop bed, packed as
  base64 in sfx.js (the zip takes no audio files), played through Web Audio, with a mute button;
- no tap in 4 s: the cards pulse; none in 9 s: the reveal plays itself, cheapest first, silent throughout;
- the badge sits at the foot throughout, and the end card is tappable: either calls ExitApi.exit().
Google's rules (Google Ads Help, read 28 Sept 2026) are enforced by check.py; play.mjs plays it in Chromium.
The card back is drawn here, not the game's printed back. Card art is the capture's scans, as JPEG."""
import base64, json, os, shutil, subprocess, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MKT = os.path.dirname(HERE)
sys.path.insert(0, MKT); sys.path.insert(0, os.path.join(MKT, "motion"))
import style_pull as SP                              # the aura, the caption rules, the capture's paths
from build import speed_lines                        # the video's manga focus lines
import kenney, mix                                   # the CC0 effects, our own noise whoosh
D = SP.D
REPO = os.path.abspath(os.path.join(MKT, "..", ".."))
EXIT_API = "https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"
FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap"
W, H = 390, 844                                      # the stage, scaled to fit the screen
K = 2.625                                            # the capture's device pixel ratio

TEXT = {
    "head": "Same Luffy.", "head2": "Not the <em>same</em> price.",
    "ask": "Tap the printing worth the most.",
    "wrong": "That one is the {label}, {price}. Try another.",
    "right": "Found it: the {label}, {price}.",
    "auto": "Here is each printing, cheapest first.",
    "s1": "Scan it: the scanner asks which printing you hold.",
    "s2": "Pick it, and it joins your collection.",
    "s3": "Your collection's value goes up by its price.",
    "line": "Scan it. Value it. Build it.",
    "what": "One Piece Card Game collection tracker",
}
FEATURES = ["Scanner", "Deck builder", "Hunt sealed product", "Local events &amp; stock"]
LABEL = {"base": "Base", "alternate_art": "Alternate Art", "sp": "SP", "manga": "Manga"}
# the Manga's own red, read from its art (its frame is blue, so the edge-weighted accent.mjs reads blue; the
# owner wanted the aura as it was): the weighted mean of its saturated red pixels, 26 % of the colour
ACCENT = {"deep": "#4e1816", "bright": "#ff5e57"}
# the crops of the capture's screens, in CSS px of the 411-wide phone: only the honest parts (the web build's
# scan screen also says "Camera unavailable" and "Saving ... is too, for now", which is false on the phone)
CROPS = {"picker": ("h5-picker", (0, 282, 411, 478)), "scanned": ("h5-scanned", (0, 690, 411, 90)),
         "before": ("h5-home-before", (8, 176, 395, 190)), "after": ("h5-home-after", (8, 176, 395, 190))}

def ff(*a):
    import imageio_ffmpeg
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", *a], check=True, timeout=120)

def sounds(tmp, bed):
    """the effects (Kenney CC0, and our own whoosh) and the bed, as mp3 data URLs for sfx.js"""
    pal = kenney.palette()
    def layers(kind):
        return [(mix.synth_file(l["synth"]) if "synth" in l else kenney.path_of(l), pal[kind]["gain"] + l.get("gain", 0)) for l in pal[kind]["layers"]]
    want = {"flip": layers("swish"), "wrong": layers("pop"), "found": layers("impact"), "coin": layers("cash"),
            "whoosh": layers("whoosh"), "chime": layers("chime")}
    out = {}
    for name, ls in want.items():
        f = os.path.join(tmp, name + ".mp3")
        ins = sum((["-i", p] for p, _ in ls), [])
        graph = ";".join(f"[{i}:a]aresample=44100,volume={g + 8}dB[a{i}]" for i, (_, g) in enumerate(ls)) + ";" + \
                "".join(f"[a{i}]" for i in range(len(ls))) + f"amix=inputs={len(ls)}:normalize=0,atrim=0:2.2,afade=t=out:st=1.9:d=0.3[o]"
        ff(*ins, "-filter_complex", graph, "-map", "[o]", "-ac", "1", "-b:a", "80k", f)
        out[name] = f
    pick = json.load(open(os.path.join(MKT, "motion", "bed.json")))
    f = os.path.join(tmp, "music.mp3")
    ff("-ss", str(pick["start"]), "-t", "26", "-i", bed, "-af", "afade=t=in:d=1.2,afade=t=out:st=23:d=3", "-ac", "2", "-b:a", "96k", f)
    out["music"] = f
    return {k: "data:audio/mpeg;base64," + base64.b64encode(open(v, "rb").read()).decode() for k, v in out.items()}

def build():
    R = json.load(open(os.path.join(SP.ADS, "report-html5.json")))
    st = {s["name"]: s for s in R["steps"]}
    before, after = st["h5-home-before"], st["h5-home-after"]
    when = D.day(R["source"])
    ps = sorted(R["hero"]["printings"], key=lambda p: p["market"] or 0)        # cheapest first
    dear = ps[-1]; acc = ACCENT["bright"]; num = R["hero"]["num"]
    gain = round(after["value"] - before["value"], 2)
    assert abs(gain - dear["market"]) < .02, ("the total did not rise by the card's price", gain, dear["market"])
    foot = f"TCGplayer market prices, {when}. Three of {num}'s printings."
    foot2 = f"A sample collection. TCGplayer market prices, {when}."
    words = " ".join(v for k, v in TEXT.items() if "{" not in v) + " " + " ".join(FEATURES).replace("&amp;", "and")
    bad = SP.check_caption(words) + SP.check_caption(foot + " " + foot2, footnote=True)
    assert not bad, bad

    out = os.path.join(SP.ADS, "html5", "which-printing")
    if os.path.isdir(out):
        shutil.rmtree(out)
    for d in ("art", "img"):
        os.makedirs(os.path.join(out, d))
    for p in ps:
        ff("-i", os.path.join(SP.ADS, "art", f"{p['id']}.png"), "-q:v", "3", os.path.join(out, "art", f"{p['id']}.jpg"))
    for name, (shot, (x, y, w, h)) in CROPS.items():
        ff("-i", os.path.join(SP.ADS, "shots", shot + ".png"), "-vf", f"crop={round(w * K)}:{round(h * K)}:{round(x * K)}:{round(y * K)},scale=720:-1",
           "-q:v", "3", os.path.join(out, "img", f"app-{name}.jpg"))
    shutil.copy(os.path.join(REPO, "assets", "icon.svg"), os.path.join(out, "img", "icon.svg"))
    badge = os.path.join(SP.ADS, "badge", "google-play-badge.png")
    assert os.path.exists(badge), "no badge: run bash design/marketing/fetch_badge.sh"
    shutil.copy(badge, os.path.join(out, "img", "google-play-badge.png"))
    pick = json.load(open(os.path.join(MKT, "motion", "bed.json")))
    bed = os.path.join(SP.ADS, pick["file"])
    assert os.path.exists(bed), f"no bed: {bed} (bed.json says how to rebuild it)"
    with tempfile.TemporaryDirectory() as tmp:
        sfx = sounds(tmp, bed)
    open(os.path.join(out, "sfx.js"), "w").write("/* the ad's sounds: Kenney (kenney.nl, CC0), a whoosh made here, and a jazz-hop rework of Spring Spring's \"Jazz\" (OpenGameArt, CC0) */\nvar SFX = " + json.dumps(sfx) + ";\n")

    # the hero: the Manga large, in its aura (drawn once, shown when it is found); the art by relative path
    hx, hy, hw = 95, 262, 200
    aura = SP.aura_box(dear["id"], hx, hy, hw, 5, ACCENT, SP.AURA_LEVEL).replace(D.art(dear["id"]), f"art/{dear['id']}.jpg")
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
    feats = "".join(f"<span>{f}</span>" for f in FEATURES)
    delta = "+" + dear["shown"]

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
#mute{{position:absolute;right:16px;top:16px;width:40px;height:40px;border-radius:20px;background:rgba(16,13,34,.7);box-shadow:0 0 0 1px rgba(255,255,255,.18);
  display:none;align-items:center;justify-content:center;cursor:pointer;z-index:5}}
body.sound #mute{{display:flex}}
#mute svg{{width:20px;height:20px}} #mute .x{{display:none}} body.muted #mute .x{{display:inline}} body.muted #mute .w{{display:none}}
h1{{position:absolute;left:20px;right:16px;top:74px;font:800 34px/1.08 Inter,sans-serif;letter-spacing:-.035em;transition:opacity .4s}}
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
#hero{{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .5s,transform .7s cubic-bezier(.6,0,.2,1);transform-origin:{hx + hw / 2}px {hy}px}}
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
/* the app, in its own screens: the Manga steps back to the corner and the screens take the stage */
body.app #hero{{transform:translate(118px,-196px) scale(.4)}}
body.app h1,body.app .row,body.app .foot{{opacity:0 !important;transition:opacity .3s}}
body.app #hero .lines{{display:none}}
#app{{position:absolute;left:24px;right:24px;top:236px;height:470px;opacity:0;pointer-events:none;transform:translateY(24px);transition:opacity .5s,transform .5s}}
body.app #app{{opacity:1;transform:none}}
#app .cap{{position:absolute;left:0;right:70px;top:-66px;font:700 19px/1.3 Inter,sans-serif;letter-spacing:-.01em;transition:opacity .3s}}
#app .cap i{{display:block;font:700 12px/1 Inter,sans-serif;font-style:normal;letter-spacing:.14em;color:var(--acc);margin-bottom:8px}}
.scr{{position:absolute;left:0;right:0;top:0;border-radius:20px;overflow:hidden;background:#100d22;
  box-shadow:0 0 0 1.5px rgba(255,255,255,.14),0 30px 70px rgba(0,0,0,.6);opacity:0;transform:scale(.96);transition:opacity .45s,transform .45s}}
.scr img{{display:block;width:100%}}
.scr.on{{opacity:1;transform:none}}
#s1{{top:22px}} #s2{{top:120px}} #s3a,#s3b{{top:90px}}
.chip{{position:absolute;right:-6px;top:58px;padding:8px 12px;border-radius:999px;background:var(--acc);color:#16060a;font:800 18px/1 Inter,sans-serif;
  box-shadow:0 10px 30px color-mix(in srgb,var(--acc) 50%,transparent);opacity:0;transform:scale(.6);transition:opacity .3s,transform .4s cubic-bezier(.2,1.6,.4,1)}}
.chip.on{{opacity:1;transform:none}}
#app .f2{{position:absolute;left:0;right:0;top:420px;font:500 11px/1.3 Inter,sans-serif;color:#9da19c}}
.gp{{position:absolute;left:50%;bottom:26px;width:170px;transform:translateX(-50%);cursor:pointer}}
.gp img{{display:block;width:100%}}
#end{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:0 24px 60px;
  background:linear-gradient(180deg,rgba(8,8,10,.55),rgba(8,8,10,.92) 38%);opacity:0;pointer-events:none;transition:opacity .6s;cursor:pointer}}
body.end #end{{opacity:1;pointer-events:auto}}
#end .ic{{width:96px;height:96px;border-radius:22px;box-shadow:0 0 60px color-mix(in srgb,var(--acc) 40%,transparent),0 20px 40px rgba(0,0,0,.6)}}
#end h2{{font:800 38px/1 Inter,sans-serif;letter-spacing:-.035em;margin-top:6px}}
#end .l{{font:700 20px/1.2 Inter,sans-serif;color:var(--acc)}}
#end .feats{{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:330px;margin-top:4px}}
#end .feats span{{padding:9px 13px;border-radius:999px;background:rgba(16,13,34,.9);box-shadow:0 0 0 1px rgba(255,255,255,.18);font:700 14px/1 Inter,sans-serif}}
#end .w{{font:500 13px/1.3 Inter,sans-serif;color:#9da19c}}
#end .badge{{width:230px;margin-top:6px}}
#end .f{{position:absolute;left:0;right:0;bottom:22px;font:500 10px/1.3 Inter,sans-serif;color:#8d918c}}
body.end .gp{{opacity:0;pointer-events:none}}
/* under the end card the game steps back entirely: nothing of it shows through the lockup */
body.end #hero,body.end #app,body.end .row,body.end .foot,body.end .say,body.end h1,body.end .brand{{opacity:0 !important;transition:opacity .4s}}
</style>
<script type="text/javascript" src="sfx.js"></script>
</head>
<body>
<div class="ground"></div><div class="shade"></div>
<div id="stage">
<div class="brand"><img src="img/icon.svg" alt=""><span>OP TCG Hub</span></div>
<div id="mute" aria-label="Sound on or off"><svg viewBox="0 0 24 24" fill="none" stroke="#f4f5f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#f4f5f3"/><path class="w" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9l5 6M22 9l-5 6"/></svg></div>
<h1>{TEXT['head']}<br>{TEXT['head2']}</h1>
<div class="say" id="say"></div>
<div id="slots">{slots_html}</div>
<div id="hero">
<svg class="lines" width="{W}" height="{H}" viewBox="0 0 {W} {H}" aria-hidden="true">{lines}</svg>
<div class="auraw">{aura}</div>
<div class="big"><img src="art/{dear['id']}.jpg" alt="{dear['name']} {LABEL.get(dear['treat'], '')}"></div>
</div>
<div class="row" id="row">{row_html}</div>
<div class="foot">{foot}</div>
<div id="app">
<div class="cap" id="cap"></div>
<div class="scr" id="s1"><img src="img/app-picker.jpg" alt="The scanner asks which printing"></div>
<div class="scr" id="s2"><img src="img/app-scanned.jpg" alt="The Manga picked into the batch"></div>
<div class="scr" id="s3a"><img src="img/app-before.jpg" alt="The collection's value before"></div>
<div class="scr" id="s3b"><img src="img/app-after.jpg" alt="The collection's value after"></div>
<div class="chip" id="chip">{delta}</div>
<div class="f2">{foot2}</div>
</div>
<div class="gp" id="gp"><img src="img/google-play-badge.png" alt="Get it on Google Play"></div>
<div id="end">
<img class="ic" src="img/icon.svg" alt="">
<h2>OP TCG Hub</h2>
<div class="l">{TEXT['line']}</div>
<div class="feats">{feats}</div>
<div class="w">{TEXT['what']}</div>
<img class="badge" src="img/google-play-badge.png" alt="Get it on Google Play">
<div class="f">Hunt's local events and stock: United States. Google Play and the Google Play logo are trademarks of Google LLC.</div>
</div>
</div>
<script>
var CARDS = {json.dumps(cards)}, T = {json.dumps({k: v for k, v in TEXT.items() if "{" in v or k in ("ask", "auto", "s1", "s2", "s3")})};
var W = {W}, H = {H}, POS = [[14, -6], [136, 0], [258, 6]];
function fit() {{ var k = Math.min(innerWidth / W, innerHeight / H); document.documentElement.style.setProperty('--k', k); }}
addEventListener('resize', fit); fit();
function exitAd() {{ if (window.ExitApi) ExitApi.exit(); }}
document.getElementById('gp').addEventListener('click', function (e) {{ e.stopPropagation(); exitAd(); }});
document.getElementById('end').addEventListener('click', exitAd);
/* ---- sound: nothing before the viewer's first tap (Google's rule); then Web Audio, from sfx.js ---- */
var AC = null, BUF = {{}}, muted = false, music = null, pending = [];
window.__sound = {{ started: false, played: [] }};
function b64buf(u) {{ var s = atob(u.split(',')[1]), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; }}
function soundOn() {{
  if (AC || !window.SFX) return;
  try {{ AC = new (window.AudioContext || window.webkitAudioContext)(); }} catch (e) {{ return; }}
  window.__sound.started = true; document.body.classList.add('sound');
  Object.keys(SFX).forEach(function (k) {{ AC.decodeAudioData(b64buf(SFX[k]), function (b) {{ BUF[k] = b; if (k === 'music') startMusic();
    // the first tap's own sounds were asked for while still decoding: play them now if still fresh
    pending = pending.filter(function (p) {{ if (p[0] !== k) return true; if (Date.now() - p[2] < 800) play(k, p[1]); return false; }}); }}, function () {{}}); }});
}}
function play(k, g) {{
  if (!AC || muted) return;
  if (!BUF[k]) {{ pending.push([k, g, Date.now()]); return; }}
  var s = AC.createBufferSource(), v = AC.createGain(); s.buffer = BUF[k]; v.gain.value = g || 1; s.connect(v); v.connect(AC.destination); s.start();
  window.__sound.played.push(k);
}}
function startMusic() {{
  if (music || !BUF.music) return;
  var s = AC.createBufferSource(), v = AC.createGain(); s.buffer = BUF.music; s.loop = true; v.gain.value = muted ? 0 : .32;
  s.connect(v); v.connect(AC.destination); s.start(); music = v;
}}
document.addEventListener('pointerdown', soundOn, true);
document.getElementById('mute').addEventListener('click', function (e) {{
  e.stopPropagation(); muted = !muted; document.body.classList.toggle('muted', muted); if (music) music.gain.value = muted ? 0 : .32; }});
/* ---- the game ---- */
var say = document.getElementById('say');
function tell(s) {{ say.style.opacity = 0; setTimeout(function () {{ say.textContent = s; say.style.opacity = 1; }}, 180); }}
function fill(s, c) {{ return s.replace('{{label}}', c.label).replace('{{price}}', c.price); }}
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
  calm(); s.classList.add('open'); play('flip', .9);
  if (c.dear) {{ done = true; if (!byAuto) tell(fill(T.right, c)); setTimeout(found, 900); }}
  else {{ if (!byAuto) {{ tell(fill(T.wrong, c)); play('wrong', .8); wait(); }} }}
}}
function step(n) {{
  ['s1', 's2', 's3a', 's3b'].forEach(function (id) {{ document.getElementById(id).classList.toggle('on', id === n || (n === 's3b' && id === 's3a')); }});
}}
function caption(i, s) {{ var c = document.getElementById('cap'); c.style.opacity = 0;
  setTimeout(function () {{ c.innerHTML = '<i>' + i + ' / 3</i>' + s; c.style.opacity = 1; }}, 200); }}
function found() {{
  document.body.classList.add('found'); play('found', 1); setTimeout(function () {{ play('coin', .7); }}, 800);
  setTimeout(function () {{ document.body.classList.add('app'); say.style.opacity = 0; play('whoosh', .8); caption(1, T.s1); step('s1'); }}, 2600);
  setTimeout(function () {{ caption(2, T.s2); step('s2'); play('flip', .9); }}, 5000);
  setTimeout(function () {{ caption(3, T.s3); step('s3a'); }}, 7200);
  setTimeout(function () {{ step('s3b'); document.getElementById('chip').classList.add('on'); play('coin', .9); }}, 8200);
  setTimeout(function () {{ document.body.classList.add('end'); play('chime', .8); }}, 10600);
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
    print(f"html5: which-printing ({num}) -> {z} ({os.path.getsize(z) / 1024:.0f} KB, {sum(len(fs) for _, _, fs in os.walk(out))} files)")
    return z

if __name__ == "__main__":
    build()
