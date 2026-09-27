#!/usr/bin/env python3
"""Round 2 of the premium drafts (27 Sept): the franchise's energy, kept premium.

Round 1 (directions.py: vault, wano, guide, launch) was premium and lost "the anime/manga/video game vibe"
(the owner). The owner's round-2 brief: the worlds are Gacha/JRPG, shonen manga and the anime itself; the
energy is "stylish", one or two big effects per frame; premium means rarity and reward, high polish,
cinematic framing, and value shown precisely and honestly. So there are three drafts, one per world, on the
same real content as round 1 (OP01-120's three SEC printings at 4:5, Home's value at 1:1):

  pull     a gacha result screen: the SEC pull lit by rays and a holo rim, HUD panels with chamfered
           corners, a condensed italic headline, the market values as a result readout
  jump     a shonen manga page: panels and gutters, speed lines, the icon's own DON sound effect, one
           spot red for the money, the cards the only full colour on the page
  episode  the anime's title-card energy: a bright sky, a sunburst behind the hit, a card breaking out of
           its frame, a fat outlined italic title

Every number, rarity and set comes from capture.mjs's report.json. A draft, not finished work.
  bash design/marketing/fetch_fonts.sh && python3 design/marketing/directions2.py
  node design/marketing/render.mjs --dir directions2
"""
import json, math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import directions as D                               # b64, face, page, grain, art, crop_img, day, icon
ADS, OUT = D.ADS, os.path.join(D.ADS, "directions2")

RARITY = {"C": "Common", "UC": "Uncommon", "R": "Rare", "SR": "Super Rare", "SEC": "Secret Rare", "L": "Leader",
          "SP": "Special", "P": "Promo", "TR": "Treasure Rare"}
HERO = LEFT = RIGHT = None

def data():
    """the capture's numbers, and the hero printings' roles by price: the dearest, the middle, the cheapest"""
    global HERO, LEFT, RIGHT
    R, ps, labels, why, home_crop, when = D.data()
    S = {s["name"]: s for s in R["steps"]}
    count = why.split()[0]                           # "6" of "6 printings share OP09-076, ..."
    HERO, LEFT, RIGHT = sorted(ps, key=lambda i: -(ps[i]["market"] or 0))
    return R, S, ps, labels, why, count, home_crop, when

def badge_text(p):
    """a prize card's name is its provenance; otherwise the rarity, spelled out"""
    return p["prov"] or f'{p["rarity"]} &middot; {RARITY.get(p["rarity"], p["rarity"])}'
SPARK = "M0,-1 C.08,-.08 .08,-.08 1,0 C.08,.08 .08,.08 0,1 C-.08,.08 -.08,.08 -1,0 C-.08,-.08 -.08,-.08 0,-1Z"

def sparkles(points, color="#fff"):
    return "".join(f'<svg class="abs" style="left:{x - s}px;top:{y - s}px;width:{2 * s}px;height:{2 * s}px;opacity:{o}" viewBox="-1 -1 2 2" aria-hidden="true">'
                   f'<path d="{SPARK}" fill="{color}"/></svg>' for x, y, s, o in points)

# ================================================================ pull (gacha / JRPG)
PULL_CSS = """
body{background:radial-gradient(ellipse 60% 45% at 50% 50%,#3a1f7a 0%,#1a1242 45%,#070a1f 100%);font-family:Rajdhani,sans-serif;color:#fff}
.rays{position:absolute;border-radius:50%;
  background:repeating-conic-gradient(from 4deg,rgba(255,214,120,.20) 0deg 5deg,transparent 5deg 15deg);
  -webkit-mask-image:radial-gradient(circle,#000 0,rgba(0,0,0,.7) 30%,transparent 68%)}
.halo{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,226,150,.55),rgba(255,160,90,.18) 40%,transparent 70%)}
h1{font:italic 900 102px/.9 'Barlow Condensed';letter-spacing:-.01em;text-transform:uppercase;transform:skewX(-6deg);
  filter:drop-shadow(0 6px 0 rgba(0,0,0,.45))}
h1 .gold{background:linear-gradient(180deg,#fff6d2 0%,#ffd66b 48%,#e39c1f 100%);-webkit-background-clip:text;color:transparent}
.chamf{clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)}
.hud{position:absolute;background:linear-gradient(180deg,rgba(18,20,52,.92),rgba(8,10,30,.92))}
.hud::before{content:'';position:absolute;inset:0;border:1.5px solid rgba(255,214,120,.55);clip-path:inherit}
.hud h3{font:700 19px/1 Rajdhani;letter-spacing:.26em;text-transform:uppercase;color:#ffd66b}
.row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-top:1px solid rgba(255,255,255,.10)}
.row span{font:600 21px/1 Rajdhani;letter-spacing:.08em;text-transform:uppercase;color:#c9c6e8}
.row b{font:italic 800 38px/1 'Barlow Condensed';letter-spacing:.01em;color:#fff}
.row.hit{background:linear-gradient(90deg,rgba(255,214,120,.18),transparent);margin:0 -24px;padding:10px 24px;border-top-color:rgba(255,214,120,.5)}
.row.hit span{color:#ffe7a3}.row.hit b{color:#ffd66b;font-size:48px}
.badge{position:absolute;padding:10px 22px 8px;background:linear-gradient(180deg,#ffe9a8,#e7a93a);color:#2a1600;
  font:italic 900 34px/1 'Barlow Condensed';letter-spacing:.06em}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden}
.card img{display:block;width:100%}
.pulled{box-shadow:0 0 0 3px rgba(255,255,255,.95),0 0 36px rgba(125,249,255,.65),0 0 90px rgba(255,106,213,.40),0 30px 60px rgba(0,0,0,.6)}
.pulled::after{content:'';position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:.30;
  background:linear-gradient(125deg,transparent 28%,#ff8bd8 40%,#8ef6ff 48%,#fff29a 56%,transparent 68%)}
.back{filter:brightness(.62) saturate(.85);box-shadow:0 20px 40px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.25)}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:46px;height:46px;border-radius:10px;box-shadow:0 0 0 2px rgba(255,214,120,.8)}
.brand b{font:700 24px/1 Rajdhani;letter-spacing:.22em;text-transform:uppercase}
.tag{position:absolute;padding:10px 18px;background:rgba(255,255,255,.08);font:700 20px/1 Rajdhani;letter-spacing:.2em;text-transform:uppercase;color:#e9e6ff}
.foot{font:600 18px/1.35 Rajdhani;letter-spacing:.04em;color:#a9a6cc}
.win{position:absolute;overflow:hidden;box-shadow:0 0 0 2px rgba(255,214,120,.7),0 0 60px rgba(255,190,90,.25),0 40px 90px rgba(0,0,0,.7)}
.win.fade{-webkit-mask-image:linear-gradient(180deg,#000 86%,transparent 100%)}
.corner{position:absolute;width:44px;height:44px;border:4px solid #ffd66b}
"""

def pull_fonts():
    return "".join([D.face("Barlow Condensed", f"barlow-condensed-latin-{w}-italic.woff2", w, "italic") for w in (800, 900)] +
                   [D.face("Rajdhani", f"rajdhani-latin-{w}-normal.woff2", w) for w in (600, 700)])

def pull(ratio):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero = ps[HERO]
    css = pull_fonts() + PULL_CSS
    if ratio == "portrait":
        body = [f'<div class="rays" style="left:-150px;top:120px;width:1500px;height:1500px"></div>',
                f'<div class="halo" style="left:260px;top:360px;width:680px;height:680px"></div>',
                f'<div class="abs brand ov safe" style="left:64px;top:56px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>',
                f'<div class="tag chamf ov txt safe" style="right:64px;top:60px">{hero["num"]} &middot; {hero["name"]}</div>',
                f'<h1 class="abs ov txt safe" style="left:64px;top:150px;width:1080px">Which one did<br><span class="gold">you pull?</span></h1>']
        for pid, x, y, w, t in ((LEFT, 96, 560, 270, -9), (RIGHT, 834, 560, 270, 9)):
            body.append(f'<div class="card back safe" style="left:{x}px;top:{y}px;width:{w}px;transform:rotate({t}deg)"><img src="{D.art(pid)}"></div>')
        body.append(f'<div class="card pulled safe" style="left:405px;top:440px;width:390px;transform:rotate(-3deg)"><img src="{D.art(HERO)}"></div>')
        body.append(f'<div class="badge chamf ov txt safe" style="left:600px;top:404px;transform:translateX(-50%) rotate(-3deg);font-size:26px;white-space:nowrap">{badge_text(hero)}</div>')
        body.append(sparkles([(360, 470, 26, .95), (838, 520, 20, .9), (820, 930, 30, .95), (380, 940, 16, .8), (600, 380, 14, .7)], "#fff6d2"))
        rows = "".join(f'<div class="row{" hit" if pid == HERO else ""}"><span>{labels[pid]}</span><b>{ps[pid]["shown"]}</b></div>' for pid in (RIGHT, LEFT, HERO))
        body.append(f'<div class="hud chamf ov safe" style="left:220px;top:1080px;width:760px;padding:20px 24px 6px"><h3>Market value &middot; TCGplayer &middot; {when}</h3>{rows}</div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:220px;top:1404px;width:760px;text-align:center">{hero["num"]} has {count} printings. The scanner shows them all, and asks which one you hold.</div>')
        return D.page(ratio, css, "".join(body), "pull-portrait")
    t = S["open-home-tall"]["rects"]
    top = t["hero"]["y"] - 12
    crop = (8, top, 733, t["top"]["y"] + t["top"]["h"] + 12 - top)
    img, h = D.crop_img("open-home-tall", crop, 640, 1966)
    delta = S["home"]["delta"]
    body = [f'<div class="rays" style="left:-200px;top:-80px;width:1600px;height:1600px"></div>',
            f'<div class="halo" style="left:250px;top:300px;width:700px;height:700px;opacity:.6"></div>',
            f'<div class="abs brand ov safe" style="left:64px;top:56px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>',
            f'<h1 class="abs ov txt safe" style="left:64px;top:132px;width:1080px;font-size:100px">Binder value<br><span class="gold">updated nightly</span></h1>',
            f'<div class="win chamf fade safe" style="left:280px;top:392px;width:640px;height:{h}px">{img}</div>']
    for x, y, r in ((266, 378, 0), (884, 378, 90), (884, 356 + h, 180), (266, 356 + h, 270)):
        body.append(f'<div class="corner" style="left:{x}px;top:{y}px;border-right:0;border-bottom:0;transform:rotate({r}deg)"></div>')
    body.append(f'<div class="badge chamf ov txt safe" style="left:740px;top:470px;font-size:30px;transform:rotate(-3deg)">{delta.split(" in")[0]} &middot; 1M</div>')
    body.append(sparkles([(250, 420, 18, .9), (960, 700, 24, .9)], "#fff6d2"))
    body.append(f'<div class="abs foot ov txt safe" style="left:64px;top:1110px;width:1072px">A sample collection. TCGplayer market prices, {when}.</div>')
    return D.page(ratio, css, "".join(body), "pull-square")

# ================================================================ jump (shonen manga)
def speed_lines(w, h, cx, cy, n=150, seed=5, inner=(.28, .46), color="#0b0b0b"):
    rnd = random.Random(seed); R = math.hypot(w, h); polys = []
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi); da = rnd.uniform(.004, .014)
        r0 = rnd.uniform(*inner) * min(w, h)
        p = [(cx + math.cos(a) * r0, cy + math.sin(a) * r0),
             (cx + math.cos(a - da) * R, cy + math.sin(a - da) * R), (cx + math.cos(a + da) * R, cy + math.sin(a + da) * R)]
        polys.append('<polygon points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in p) + '"/>')
    return f'<svg class="abs" style="left:0;top:0;width:{w}px;height:{h}px" viewBox="0 0 {w} {h}" aria-hidden="true"><g fill="{color}">{"".join(polys)}</g></svg>'

def burst(w, h, spikes=18, seed=3):
    rnd = random.Random(seed); pts = []
    for i in range(spikes * 2):
        a = i / (spikes * 2) * 2 * math.pi; r = 1 if i % 2 == 0 else rnd.uniform(.72, .82)
        pts.append(f"{50 + 50 * r * math.cos(a):.1f},{50 + 50 * r * math.sin(a):.1f}")
    return (f'<svg class="abs" style="inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'
            f'<polygon points="{" ".join(pts)}" fill="#e5202e" stroke="#0b0b0b" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>')

JUMP_CSS = """
body{background:#f6f3ec;font-family:'Barlow Condensed',sans-serif;color:#0b0b0b}
.panel{position:absolute;overflow:hidden;background:#fff;outline:5px solid #0b0b0b}
.tone{position:absolute;inset:0;background:radial-gradient(circle,#0b0b0b 1.3px,transparent 1.6px) 0 0/9px 9px}
.sfx{font:400 160px/.9 Dela;color:#0b0b0b;-webkit-text-stroke:11px #fff;paint-order:stroke fill;letter-spacing:-.04em;white-space:nowrap}
.head{font:400 68px/1 Dela;letter-spacing:-.01em;text-transform:uppercase;white-space:nowrap}
.nar{position:absolute;background:#fff;border:4px solid #0b0b0b;padding:12px 18px;font:italic 800 30px/1.1 'Barlow Condensed';text-transform:uppercase;letter-spacing:.01em}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 0 0 5px #0b0b0b}
.card img{display:block;width:100%}
.price{position:absolute;text-align:center;color:#fff;font:400 50px/1 Dela;-webkit-text-stroke:3px #0b0b0b;paint-order:stroke fill;white-space:nowrap}
.price small{display:block;font:italic 800 24px/1 'Barlow Condensed';letter-spacing:.08em;margin-bottom:8px;-webkit-text-stroke:0;color:#fff}
.tag{font:italic 800 22px/1 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}
.money{font:400 42px/1 Dela;color:#e5202e}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:44px;height:44px;border-radius:9px;box-shadow:0 0 0 3px #0b0b0b}
.brand b{font:400 26px/1 Dela}
.foot{font:600 19px/1.3 'Barlow Condensed';letter-spacing:.04em;color:#3a3a3a}
.shot{position:absolute;overflow:hidden;box-shadow:0 0 0 5px #0b0b0b}
"""

def jump_fonts():
    return "".join([D.face("Dela", "dela-gothic-one-latin-400-normal.woff2", 400), D.face("Dela", "dela-gothic-one-119-400-normal.woff2", 400),
                    D.face("Barlow Condensed", "barlow-condensed-latin-800-italic.woff2", 800, "italic"),
                    D.face("Barlow Condensed", "barlow-condensed-latin-600-normal.woff2", 600)])

def jump(ratio):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero = ps[HERO]
    css = jump_fonts() + JUMP_CSS
    if ratio == "portrait":
        M = 40
        body = [
            # panel 1: the question, on tone
            f'<div class="panel" style="left:{M}px;top:{M}px;width:{1200 - 2 * M}px;height:300px;clip-path:polygon(0 0,100% 0,100% 82%,0 100%)">'
            f'<div class="tone" style="-webkit-mask-image:linear-gradient(90deg,transparent 35%,#000 100%);opacity:.5"></div></div>',
            f'<div class="abs head ov txt safe" style="left:84px;top:78px;width:900px">Same number.<br><span style="color:#e5202e">Different card.</span></div>',
            # panel 2: the hit, speed lines, the sound effect breaking the frame
            f'<div class="panel" style="left:{M}px;top:326px;width:{1200 - 2 * M}px;height:700px;clip-path:polygon(0 4%,100% 0,100% 100%,0 96%)">'
            f'{speed_lines(1120, 700, 520, 360, 170)}</div>',
            f'<div class="card safe" style="left:350px;top:372px;width:410px;transform:rotate(-5deg)"><img src="{D.art(HERO)}"></div>',
            f'<div class="abs sfx ov txt safe" style="left:742px;top:410px;transform:rotate(8deg)">ドン!!</div>',
            f'<div class="abs safe" style="left:720px;top:730px;width:420px;height:250px;transform:rotate(-4deg)">{burst(420, 250)}'
            f'<div class="price ov txt" style="position:absolute;left:0;right:0;top:78px"><small>{labels[HERO]}</small>{hero["shown"]}</div></div>',
            f'<div class="nar ov txt safe" style="left:84px;top:386px;transform:rotate(-2deg)">{hero["num"]}.<br>{count} printings.</div>',
            # panel 3 and 4: the look-alikes, and the app asking
            f'<div class="panel" style="left:{M}px;top:1052px;width:540px;height:340px">'
            f'<div class="tone" style="-webkit-mask-image:linear-gradient(180deg,#000,transparent 70%);opacity:.35"></div></div>',
        ]
        for pid, x in ((LEFT, 92), (RIGHT, 332)):
            body.append(f'<div class="card safe" style="left:{x}px;top:1072px;width:176px"><img src="{D.art(pid)}"></div>')
            body.append(f'<div class="abs ov txt safe" style="left:{x - 20}px;top:1330px;width:216px;text-align:center"><span class="money" style="font-size:36px">{ps[pid]["shown"]}</span></div>')
        why_r = S["picker"]["rects"]["why"]; opts = S["picker"]["rects"]["opts"]
        crop = (why_r["x"] - 8, S["picker"]["rects"]["title"]["y"] - 14, why_r["w"] + 16, opts["y"] + 300 - (S["picker"]["rects"]["title"]["y"] - 14))
        img, h = D.crop_img("picker", crop, 520)
        body.append(f'<div class="panel" style="left:604px;top:1052px;width:556px;height:340px;background:#100d22">'
                    f'<div style="position:absolute;left:18px;top:14px;width:520px;height:{h}px">{img}</div></div>')
        body.append(f'<div class="nar ov txt safe" style="left:640px;top:1300px;transform:rotate(2deg);font-size:26px">The scanner asks.</div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:{M}px;top:1420px;width:700px">TCGplayer market prices, {when}.</div>')
        body.append(f'<div class="abs brand ov safe" style="right:{M}px;top:1410px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>')
        return D.page(ratio, css, "".join(body), "jump-portrait")
    img, h = D.crop_img("home", home_crop, 620)
    delta = S["home"]["delta"]
    body = [f'<div class="panel" style="left:40px;top:40px;width:1120px;height:1030px">{speed_lines(1120, 1030, 560, 560, 160, 9, (.36, .5))}</div>',
            f'<div class="abs head ov txt safe" style="left:84px;top:78px;width:1000px;font-size:74px">Your binder.<br><span style="color:#e5202e">Priced nightly.</span></div>',
            f'<div class="shot safe" style="left:290px;top:330px;width:620px;height:{h}px;transform:rotate(-3deg)">{img}</div>',
            f'<div class="abs safe" style="left:760px;top:{330 + h - 110}px;width:360px;height:220px;transform:rotate(6deg)">{burst(360, 220, 16, 8)}'
            f'<div class="price ov txt" style="position:absolute;left:0;right:0;top:62px;font-size:48px"><small>This month</small>{delta.split(" in")[0]}</div></div>',
            f'<div class="abs foot ov txt safe" style="left:40px;top:1098px;width:700px">A sample collection. TCGplayer market prices, {when}.</div>',
            f'<div class="abs brand ov safe" style="right:40px;top:1090px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>']
    return D.page(ratio, css, "".join(body), "jump-square")

# ================================================================ episode (the anime's own energy)
EP_CSS = """
body{background:linear-gradient(180deg,#0f5fd6 0%,#1e9bff 55%,#8fd6ff 100%);font-family:Rubik,sans-serif;color:#fff}
.sun{position:absolute;border-radius:50%;
  background:repeating-conic-gradient(from 0deg,#ffd23f 0deg 9deg,#ff9f1c 9deg 18deg);
  -webkit-mask-image:radial-gradient(circle,#000 0,#000 30%,transparent 70%)}
.title{font:italic 900 118px/.92 Rubik;text-transform:uppercase;letter-spacing:-.02em;color:#fff;
  -webkit-text-stroke:12px #0a1a4a;paint-order:stroke fill;filter:drop-shadow(0 10px 0 #0a1a4a)}
.title .hot{color:#ffd23f}
.ep{position:absolute;padding:10px 22px 8px;background:#e8342e;color:#fff;font:italic 800 32px/1 'Barlow Condensed';letter-spacing:.12em;
  text-transform:uppercase;transform:rotate(-4deg);box-shadow:6px 6px 0 #0a1a4a}
.frame{position:absolute;border:10px solid #fff;border-radius:28px;box-shadow:0 0 0 8px #0a1a4a,0 24px 0 8px rgba(10,26,74,.35)}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 0 0 7px #fff,0 0 0 13px #0a1a4a,0 26px 40px rgba(10,26,74,.45)}
.card img{display:block;width:100%}
.pill{position:absolute;text-align:center;background:#fff;color:#0a1a4a;border-radius:999px;padding:10px 0 8px;box-shadow:0 0 0 6px #0a1a4a,0 10px 0 6px rgba(10,26,74,.35)}
.pill span{display:block;font:italic 800 20px/1 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:#4a5a8a}
.pill b{display:block;font:italic 900 42px/1.05 Rubik;letter-spacing:-.01em}
.pill.hot{background:#ffd23f}.pill.hot b{font-size:52px;color:#0a1a4a}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:56px;height:56px;border-radius:12px;box-shadow:0 0 0 5px #fff,0 0 0 9px #0a1a4a}
.brand b{font:italic 900 40px/1 Rubik;text-transform:uppercase;color:#fff;-webkit-text-stroke:7px #0a1a4a;paint-order:stroke fill}
.foot{font:600 19px/1.3 'Barlow Condensed';letter-spacing:.04em;color:#0a1a4a}
.shot{position:absolute;overflow:hidden;border-radius:26px;box-shadow:0 0 0 8px #fff,0 0 0 14px #0a1a4a,0 26px 0 14px rgba(10,26,74,.3)}
"""

def ep_fonts():
    return "".join([D.face("Rubik", "rubik-latin-900-italic.woff2", 900, "italic"), D.face("Barlow Condensed", "barlow-condensed-latin-800-italic.woff2", 800, "italic"),
                    D.face("Barlow Condensed", "barlow-condensed-latin-600-normal.woff2", 600)])

def episode(ratio):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero = ps[HERO]
    css = ep_fonts() + EP_CSS
    if ratio == "portrait":
        body = [f'<div class="sun" style="left:-100px;top:320px;width:1400px;height:1400px"></div>',
                f'<div class="ep ov txt safe" style="left:70px;top:70px">Next time on your binder</div>',
                f'<div class="abs title ov txt safe" style="left:60px;top:150px;width:1080px">One number,<br><span class="hot">{count} cards!</span></div>',
                f'<div class="frame" style="left:150px;top:640px;width:900px;height:360px;background:rgba(255,255,255,.16)"></div>']
        for pid, x, y, w, t in ((LEFT, 200, 600, 240, -8), (RIGHT, 760, 600, 240, 8)):
            body.append(f'<div class="card safe" style="left:{x}px;top:{y}px;width:{w}px;transform:rotate({t}deg)"><img src="{D.art(pid)}"></div>')
        body.append(f'<div class="card safe" style="left:425px;top:470px;width:350px;transform:rotate(-2deg)"><img src="{D.art(HERO)}"></div>')
        for pid, cx, y, w, hot in ((LEFT, 250, 1110, 230, False), (HERO, 600, 1090, 380, True), (RIGHT, 950, 1110, 230, False)):
            body.append(f'<div class="pill ov safe{" hot" if hot else ""}" style="left:{cx - w / 2:.0f}px;top:{y}px;width:{w}px"><span>{labels[pid]}</span><b>{ps[pid]["shown"]}</b></div>')
        body.append(f'<div class="abs brand ov safe" style="left:60px;top:1330px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:60px;top:1420px;width:900px">{hero["num"]} {hero["name"]}, {hero["rarity"]}. TCGplayer market prices, {when}.</div>')
        return D.page(ratio, css, "".join(body), "episode-portrait")
    img, h = D.crop_img("home", home_crop, 640)
    delta = S["home"]["delta"]
    body = [f'<div class="sun" style="left:-120px;top:120px;width:1440px;height:1440px"></div>',
            f'<div class="ep ov txt safe" style="left:70px;top:70px">Updated every night</div>',
            f'<div class="abs title ov txt safe" style="left:60px;top:140px;width:1080px;font-size:104px">Your binder&rsquo;s<br><span class="hot">bounty!</span></div>',
            f'<div class="shot safe" style="left:280px;top:420px;width:640px;height:{h}px;transform:rotate(-3deg)">{img}</div>',
            f'<div class="pill hot ov safe" style="left:760px;top:{420 + h - 40}px;width:330px;transform:rotate(5deg)"><span>This month</span><b style="font-size:48px">{delta.split(" in")[0]}</b></div>',
            f'<div class="abs brand ov safe" style="left:60px;top:1044px"><img src="{D.icon()}" style="width:48px;height:48px"><b style="font-size:34px">OP TCG Hub</b></div>',
            f'<div class="abs foot ov txt safe" style="left:60px;top:1122px;width:900px">A sample collection. TCGplayer market prices, {when}.</div>']
    return D.page(ratio, css, "".join(body), "episode-square")

def pullmulti(ratio):
    """a multi-pull result: every printing of the number in a grid, the dearest glowing, each with its price"""
    R, S, ps, labels, why, count, home_crop, when = data()
    allp = [a for a in R["hero"]["all"] if a.get("file")][:6]
    top = allp[0]
    css = pull_fonts() + PULL_CSS + """
.slot{position:absolute;text-align:center}
.slot .card{position:relative;margin:0 auto}
.slot .card img{aspect-ratio:600/838;object-fit:cover}
.slot .chip{margin:14px auto 0;padding:8px 0 6px;background:rgba(10,12,35,.88);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18)}
.slot .chip span{display:block;font:700 15px/1.2 Rajdhani;letter-spacing:.14em;text-transform:uppercase;color:#bdb9e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 10px}
.slot .chip b{display:block;font:italic 800 38px/1.1 'Barlow Condensed';color:#fff}
.slot.top .chip{box-shadow:inset 0 0 0 2px #ffd66b,0 0 30px rgba(255,214,107,.35)}.slot.top .chip b{color:#ffd66b}
.slot .chip span.long{white-space:normal;font-size:13px;letter-spacing:.1em;line-height:1.25}
"""
    def label(a):
        return a["prov"] or a["treat"].replace("_", " ").title()   # a prize card's name is its provenance
    body = [f'<div class="rays" style="left:-150px;top:60px;width:1500px;height:1500px;opacity:.8"></div>',
            f'<div class="abs brand ov safe" style="left:64px;top:56px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>',
            f'<div class="tag chamf ov txt safe" style="right:64px;top:60px">{R["hero"]["num"]} &middot; {count} printings</div>',
            f'<h1 class="abs ov txt safe" style="left:64px;top:140px;width:1080px;font-size:96px">Same number.<br><span class="gold">Every pull priced.</span></h1>']
    cw, xs, ys = 270, (95, 465, 835), (400, 890)
    for i, a in enumerate(allp):
        x, y = xs[i % 3], ys[i // 3]
        cls = "card pulled" if i == 0 else "card back"
        dim = "" if i == 0 else "filter:none;"
        body.append(f'<div class="slot{" top" if i == 0 else ""} safe" style="left:{x}px;top:{y}px;width:{cw}px">'
                    f'<div class="{cls}" style="width:{cw}px;{dim}"><img src="{D.art(a["id"])}"></div>'
                    f'<div class="chip chamf ov" style="width:{cw}px"><span{" class=long" if len(label(a)) > 22 else ""}>{label(a)}</span><b>{a["shown"]}</b></div></div>')
    body.append(sparkles([(95 + cw - 10, 410, 22, .95), (110, 640, 14, .8)], "#fff6d2"))
    body.append(f'<div class="abs foot ov txt safe" style="left:64px;top:1420px;width:1072px;text-align:center">TCGplayer market prices, {when}. The scanner shows them all, and asks which one you hold.</div>')
    return D.page(ratio, css, "".join(body), f"pullmulti-{ratio}")

# ================================================================ pull v3 (27 Sept): de-slopped, manga-led
# The owner on Pull v2: it reads "very AI like" (the font, the rays, the sparkles, the table); wanted bigger
# card art, more colour, more app, never hands, and manga instead of sparkles ("his signature demon aura").
# The references (PokeScreener, Collectr, Robinhood) share one grammar: a clean sentence-case headline with
# one accent word, one real device with the real UI, one or two real UI pieces lifted out and enlarged, one
# accent colour, and no stock effects. So: no rays, no sparkles, no invented table. The light and the colour
# come from the card: the ground is the hero's own art, blurred; the aura takes the art's own accent
# (accent.mjs); the only prices are the app's own rows.

WORDS = {2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven"}

def accents():
    try:
        return json.load(open(os.path.join(ADS, "art", "accents.json")))
    except OSError:
        return {}

def aura(w, h, deep, bright, seed=11, pad=170):
    """a rising, flame-edged glow the size of the card: the demon aura, in the card's own colour. Vertical
    streaks come from noise that changes fast across and slowly up; the hot inner edge is a second, tighter
    flame. It sits behind the card, positioned at the card's own box."""
    W, H = w + 2 * pad, h + 2 * pad
    def fl(fid, freq, scale, blur):
        return (f'<filter id="{fid}" x="-40%" y="-50%" width="180%" height="190%" color-interpolation-filters="sRGB">'
                f'<feGaussianBlur in="SourceGraphic" stdDeviation="{blur}" result="b"/>'
                f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="3" seed="{seed}" result="n"/>'
                f'<feDisplacementMap in="b" in2="n" scale="{scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>'
                f'<feComponentTransfer in="d"><feFuncA type="linear" slope="1.6" intercept="-0.05"/></feComponentTransfer></filter>')
    return (f'<svg class="abs" style="left:{-pad}px;top:{-pad}px;width:{W}px;height:{H}px;overflow:visible;pointer-events:none" viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<defs>{fl(f"fo{seed}", "0.022 0.006", 95, 30)}{fl(f"fi{seed}", "0.03 0.009", 45, 12)}'
            f'<linearGradient id="ag{seed}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{deep}"/><stop offset=".7" stop-color="{bright}"/>'
            f'<stop offset="1" stop-color="{bright}" stop-opacity=".0"/></linearGradient></defs>'
            f'<rect x="{pad - 40}" y="{pad - 150}" width="{w + 80}" height="{h + 170}" rx="60" fill="url(#ag{seed})" opacity=".9" filter="url(#fo{seed})"/>'
            f'<rect x="{pad - 12}" y="{pad - 44}" width="{w + 24}" height="{h + 52}" rx="30" fill="{bright}" opacity=".75" filter="url(#fi{seed})"/></svg>')

def slash(x, y, length, angle, width, color="#ffffff", opacity=.75):
    """a sword's cut, drawn as a tapering crescent (the manga 'zan' stroke), not a sparkle"""
    return (f'<svg class="abs" style="left:{x}px;top:{y}px;width:{length}px;height:{width * 4}px;transform:rotate({angle}deg);transform-origin:0 50%;overflow:visible" '
            f'viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg{x}{y}" x1="0" x2="1">'
            f'<stop offset="0" stop-color="{color}" stop-opacity="0"/><stop offset=".55" stop-color="{color}" stop-opacity="{opacity}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
            f'<path d="M0 22 Q50 2 100 18 Q50 10 0 22Z" fill="url(#sg{x}{y})"/></svg>')

P3_CSS = """
body{background:#060707;font-family:Inter,sans-serif;color:#f4f5f3;overflow:hidden}
.ground{position:absolute;filter:blur(90px) saturate(1.5) brightness(.6)}
.shade{position:absolute;inset:0;background:radial-gradient(ellipse 85% 70% at 62% 45%,rgba(6,7,7,0) 0%,rgba(6,7,7,.4) 62%,rgba(6,7,7,.92) 100%)}
h1{font:800 88px/1.02 Inter;letter-spacing:-.035em;color:#f4f5f3}
h1 em{font-style:normal;color:var(--accent)}
.sub{font:500 27px/1.38 Inter;letter-spacing:-.01em;color:#b8bcb7}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:48px;height:48px;border-radius:11px}
.brand b{font:700 23px/1 Inter;letter-spacing:-.01em;color:#f4f5f3}
.card{position:absolute;border-radius:3.6%/2.6%;overflow:hidden;box-shadow:0 2px 3px rgba(0,0,0,.5),0 24px 50px rgba(0,0,0,.55)}
.card img{display:block;width:100%;aspect-ratio:600/838;object-fit:cover}
.tone{position:absolute;border-radius:50%;background:radial-gradient(circle,var(--accent) 1.4px,transparent 1.8px) 0 0/10px 10px;
  -webkit-mask-image:radial-gradient(closest-side,#000 0,rgba(0,0,0,.6) 45%,transparent 100%);opacity:.22}
.device{position:absolute;background:#0c0d0d;box-shadow:0 0 0 2px #2d302f,0 0 0 3px #050505,0 60px 120px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,255,255,.07)}
.device .screen{position:absolute;overflow:hidden;background:#100d22}
.device .cam{position:absolute;width:16px;height:16px;border-radius:50%;background:#050505;box-shadow:inset 0 0 0 3px #151717;z-index:3}
.device .hinge{position:absolute;top:0;bottom:0;width:2px;left:50%;background:linear-gradient(180deg,rgba(255,255,255,.0),rgba(255,255,255,.07),rgba(255,255,255,0));z-index:3}
.callout{position:absolute;overflow:hidden;border-radius:18px;background:#100d22;
  box-shadow:0 0 0 1.5px var(--accent),0 30px 60px rgba(0,0,0,.6),0 0 60px color-mix(in srgb,var(--accent) 30%,transparent)}
.foot{font:500 17px/1.4 Inter;color:#8d918c}
"""

def p3_fonts():
    return "".join(D.face("Inter", f"inter-latin-{w}-normal.woff2", w) for w in (500, 600, 700, 800))

def device(x, y, w, h, inner_html, radius=54, pad=12, tilt=0.0, fold=False, cls=""):
    """a plain modern phone (a punch-hole camera, as the owner's Samsung has), or the open Fold with its hinge"""
    cam = '' if fold else f'<div class="cam" style="left:{w / 2 - 8:.0f}px;top:{pad + 14}px"></div>'   # the Fold's inner camera is under the screen
    hinge = '<div class="hinge"></div>' if fold else ''
    return (f'<div class="device {cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{radius}px;transform:rotate({tilt}deg)">'
            f'<div class="screen" style="left:{pad}px;top:{pad}px;right:{pad}px;bottom:{pad}px;border-radius:{radius - pad}px">{inner_html}</div>{cam}{hinge}</div>')

def pull3(ratio):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero, mid, low = ps[HERO], ps[LEFT], ps[RIGHT]
    ac = accents().get(str(HERO), {"deep": "#0f5a35", "bright": "#6df0a4"})
    css = p3_fonts() + P3_CSS.replace("var(--accent)", ac["bright"])
    ground = (f'<img class="ground" src="{D.art(HERO)}" style="left:-160px;top:-220px;width:1600px">'
              '<div class="shade"></div>')
    brand = f'<div class="abs brand ov safe" style="right:64px;top:74px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>'
    if ratio == "portrait":
        body = [ground, brand,
                f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px">Same {hero["name"].split()[-1]}.<br><em>{WORDS.get(len(ps), len(ps))}</em> prices.</h1>',
                f'<div class="abs sub ov txt safe" style="left:64px;top:262px;width:640px">{hero["num"]} has {count} printings. The scanner shows each one, and asks which you hold.</div>']
        # the phone, bottom left, bleeding off the frame: the app's own picker, from the top of the screen
        pw, ph, pad = 430, 900, 12
        ty = S["picker"]["rects"]["title"]["y"]
        img, _ = D.crop_img("picker", (0, ty - 90, 411, 900), pw - 2 * pad)
        body.append(device(58, 842, pw, ph, img, tilt=-7))
        # the fan: the two others behind, the dear one in front in its aura, cut by two sword strokes
        cx, cy, cw = 640, 400, 470
        chh = round(cw * 838 / 600)
        body.append(f'<div class="tone" style="left:{cx - 160}px;top:{cy - 150}px;width:{cw + 320}px;height:{chh + 300}px"></div>')
        body.append(f'<div class="abs" style="left:{cx}px;top:{cy}px;width:{cw}px;height:{chh}px;transform:rotate(8deg)">{aura(cw, chh, ac["deep"], ac["bright"])}</div>')
        body.append(slash(470, 440, 700, 22, 30, "#ffffff", .5))
        body.append(f'<div class="card safe" style="left:330px;top:500px;width:360px;transform:rotate(-15deg)"><img src="{D.art(low["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:470px;top:455px;width:380px;transform:rotate(-4deg)"><img src="{D.art(mid["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:{cx}px;top:{cy}px;width:{cw}px;transform:rotate(8deg)"><img src="{D.art(HERO)}"></div>')
        # the callout: the app's own row for the dear one, lifted out of the picker and enlarged
        o = next(o for o in S["picker"]["options"] if o["price"] == hero["shown"])
        crop = (12, o["top"] - 4, 387, o["bottom"] - o["top"] + 8)
        cimg, chh2 = D.crop_img("picker", crop, 520)
        body.append(f'<div class="callout ov safe" style="left:612px;top:1196px;width:520px;height:{chh2}px">{cimg}</div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:612px;top:{1196 + chh2 + 22}px;width:520px">TCGplayer market prices, {when}.</div>')
        return D.page(ratio, css, "".join(body), "pull3-portrait")
    # square: the binder, on the open Fold, over the same ground; the total lifted out as the one callout
    t = S["open-home-tall"]["rects"]
    fw, fh, pad = 660, round(660 * 832 / 749), 14
    img, _ = D.crop_img("open-home-tall", (0, t["hero"]["y"] - 70, 749, 1100), fw - 2 * pad, 1966)
    hr = S["home"]["rects"]["hero"]
    cimg, chh = D.crop_img("home", (hr["x"] - 4, hr["y"] - 4, hr["w"] + 8, hr["h"] + 8), 470)
    body = [ground, brand,
            f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px;font-size:80px">Your binder,<br>valued <em>nightly</em>.</h1>',
            f'<div class="abs" style="left:880px;top:250px;width:250px;height:{round(250 * 838 / 600)}px;transform:rotate(12deg)">{aura(250, round(250 * 838 / 600), ac["deep"], ac["bright"], 5, 110)}</div>',
            f'<div class="card safe" style="left:880px;top:250px;width:250px;transform:rotate(12deg)"><img src="{D.art(HERO)}"></div>',
            device(470, 330, fw, fh, img, radius=40, pad=pad, tilt=-3, fold=True),
            f'<div class="callout ov safe" style="left:64px;top:560px;width:470px;height:{chh}px">{cimg}</div>',
            f'<div class="abs sub ov txt safe" style="left:64px;top:{560 + chh + 34}px;width:360px;font-size:24px">Every card at the price of the printing you own.</div>',
            f'<div class="abs foot ov txt safe" style="left:64px;top:1120px;width:520px">A sample collection. TCGplayer market prices, {when}.</div>']
    return D.page(ratio, css, "".join(body), "pull3-square")

# ================================================================ pull v4 (27 Sept)
# The owner on v3: getting there. The subtext is hard to read; the aura is off -- stronger, more manga;
# "a real phone, not whatever that is. A real phone, a real foldable/tablet"; more manga inspiration.
# MANGA Plus (Shueisha's own app) markets itself with a real, detailed phone and the art bursting out in
# front of it. So: a phone with a metal frame, side keys, a punch-hole and a status bar; the Fold open, with
# its crease and no camera on the inner screen; a drawn aura -- ink-outlined flame tongues in the card's own
# colour over a black ink layer, rising; and the card's own attribute, the slash kanji printed on it, brushed
# large behind the fan.

def flames(w, h, deep, bright, seed=3, n=None, reach=1.0):
    """the manga aura: closed flame silhouettes hugging a card (w x h, card-local px) -- an ink layer, a colour
    layer with an ink outline, and a hot core -- whose edge rises into curved, pointed tongues, tallest over
    the top and fading down the sides. Each layer is one contour, walked round the card's upper outline."""
    rnd = random.Random(seed); pad = 240
    def contour(off, amp, count, sharp):
        pts = []
        # the outline from the bottom of the left side, up and over the top, down to the right side's bottom
        path = [(0, h * .92), (0, 0), (w, 0), (w, h * .92)]
        L = [math.dist(path[i], path[i + 1]) for i in range(3)]; T = sum(L)
        for k in range(count + 1):
            d = T * k / count; i = 0
            while i < 2 and d > L[i]: d -= L[i]; i += 1
            (x1, y1), (x2, y2) = path[i], path[i + 1]
            f = d / L[i]; x, y = x1 + (x2 - x1) * f, y1 + (y2 - y1) * f
            nx, ny = (-1, 0) if i == 0 else (0, -1) if i == 1 else (1, 0)
            lift = (1 - y / h) ** 1.4 if i != 1 else 1.0          # tallest on the top edge, dying down the sides
            peak = k % 2 == 1
            a = off + (amp * reach * lift * rnd.uniform(.55, 1.1) if peak else amp * reach * lift * rnd.uniform(.05, .22))
            px, py = x + nx * a, y + ny * a - (a * .55 if peak else 0)   # tongues lean upward: fire rises
            if peak: px += rnd.uniform(-1, 1) * sharp
            pts.append((px, py, peak))
        d = f"M{pad:.0f},{h * .98 + pad:.0f} L{pts[0][0] + pad:.0f},{pts[0][1] + pad:.0f} "
        for j in range(1, len(pts)):
            (x0, y0, _), (x1, y1, pk) = pts[j - 1], pts[j]
            mx, my = (x0 + x1) / 2, (y0 + y1) / 2
            if pk:   # a tongue: bow out, then snap to the point
                d += f"Q{mx + (y1 - y0) * .25 + pad:.0f},{my - (x1 - x0) * .25 + pad:.0f} {x1 + pad:.0f},{y1 + pad:.0f} "
            else:    # a trough: a soft curve back in
                d += f"Q{mx - (y1 - y0) * .18 + pad:.0f},{my + (x1 - x0) * .18 + pad:.0f} {x1 + pad:.0f},{y1 + pad:.0f} "
        return d + f"L{w + pad:.0f},{h * .98 + pad:.0f}Z"
    n = n or max(18, round((w + 2 * h) / 38))
    ink, col, hot = contour(26, 150, n, 18), contour(14, 118, n, 14), contour(4, 56, n, 8)
    W, H = w + 2 * pad, h + 2 * pad
    return (f'<svg class="abs" style="left:{-pad}px;top:{-pad}px;width:{W}px;height:{H}px;overflow:visible;pointer-events:none" viewBox="0 0 {W} {H}" aria-hidden="true">'
            f'<defs><linearGradient id="fg{seed}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{deep}"/><stop offset=".5" stop-color="{bright}"/>'
            f'<stop offset="1" stop-color="#ffe8e4"/></linearGradient></defs>'
            f'<path d="{ink}" fill="#0b0b0b"/>'
            f'<path d="{col}" fill="url(#fg{seed})" stroke="#0b0b0b" stroke-width="5" stroke-linejoin="round"/>'
            f'<path d="{hot}" fill="#fff4f0" opacity=".85"/></svg>')

P4_CSS = P3_CSS + """
.sub{font:500 30px/1.36 Inter;letter-spacing:-.01em;color:#eef0ec;text-shadow:0 2px 14px rgba(0,0,0,.75)}
.foot{font:500 18px/1.4 Inter;color:#d3d6d1;text-shadow:0 1px 8px rgba(0,0,0,.8)}
.kanji{position:absolute;font:400 760px/1 Brush;white-space:nowrap;color:transparent;-webkit-text-stroke:3px var(--kanji);opacity:.5}
.rphone{position:absolute;border-radius:64px;box-shadow:0 70px 140px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.6);
  background:linear-gradient(140deg,#6d7176 0%,#26282b 18%,#46494d 42%,#17181a 70%,#595c60 100%)}
.rphone .bezel{position:absolute;inset:5px;border-radius:59px;background:#030303}
.rphone .screen{position:absolute;overflow:hidden;background:#100d22}
.rphone .glass{position:absolute;pointer-events:none;background:linear-gradient(118deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.03) 28%,rgba(255,255,255,0) 40%)}
.rphone .key{position:absolute;width:6px;border-radius:3px;background:linear-gradient(90deg,#1c1d1f,#77797c 50%,#1c1d1f)}
.rphone .punch{position:absolute;width:24px;height:24px;border-radius:50%;background:#000;box-shadow:inset 0 0 0 3px #111,0 0 0 2px #050505;z-index:4}
.rphone .status{position:absolute;left:0;right:0;top:0;height:54px;display:flex;justify-content:space-between;align-items:center;
  padding:0 34px;font:600 21px/1 Inter;color:#f2f2f2;z-index:3;background:linear-gradient(180deg,rgba(16,13,34,.95),rgba(16,13,34,0))}
.rphone .status i{font-style:normal;letter-spacing:2px;font-size:17px}
.rphone .crease{position:absolute;top:0;bottom:0;width:18px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.07) 45%,rgba(0,0,0,.25) 55%,rgba(255,255,255,0));z-index:3}
"""

def realphone(x, y, w, h, inner_html, tilt=0.0, fold=False):
    """a real phone: a metal frame, a black bezel, side keys, a punch-hole camera and a status bar over the
    app. fold=True is the Fold open: squarer corners, the crease, and no camera on the inner screen."""
    r = 40 if fold else 64
    b = 18 if fold else 16                               # frame + bezel to the glass
    keys = ("" if fold else f'<div class="key" style="right:-4px;top:{h * .22:.0f}px;height:{h * .09:.0f}px"></div>'
            f'<div class="key" style="right:-4px;top:{h * .34:.0f}px;height:{h * .15:.0f}px"></div>')
    punch = "" if fold else f'<div class="punch" style="left:{w / 2 - 12:.0f}px;top:{b + 20}px"></div>'
    crease = f'<div class="crease" style="left:{w / 2 - 9:.0f}px"></div>' if fold else ""
    status = ('<div class="status"><span>10:08</span><i>&#9679;&#9679;&#9679; 5G &#9646;</i></div>')
    return (f'<div class="rphone" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{r}px;transform:rotate({tilt}deg)">{keys}'
            f'<div class="bezel" style="border-radius:{r - 5}px"></div>'
            f'<div class="screen" style="left:{b}px;top:{b}px;right:{b}px;bottom:{b}px;border-radius:{r - b + 4}px">{status}{inner_html}</div>'
            f'<div class="glass" style="left:{b}px;top:{b}px;right:{b}px;bottom:{b}px;border-radius:{r - b + 4}px"></div>{crease}{punch}</div>')

def p4_fonts():
    return p3_fonts() + D.face("Brush", "yuji-boku-81-400-normal.woff2", 400)

def pull4(ratio):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero, mid, low = ps[HERO], ps[LEFT], ps[RIGHT]
    ac = accents().get(str(HERO), {"deep": "#4c1c23", "bright": "#ff6e83"})
    css = p4_fonts() + P4_CSS.replace("var(--accent)", ac["bright"]).replace("var(--kanji)", ac["bright"])
    ground = (f'<img class="ground" src="{D.art(HERO)}" style="left:-160px;top:-220px;width:1600px">'
              '<div class="shade"></div>')
    brand = f'<div class="abs brand ov safe" style="right:64px;top:74px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>'
    if ratio == "portrait":
        body = [ground, f'<div class="kanji" style="left:520px;top:300px">斬</div>', brand,
                f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px">Same {hero["name"].split()[-1]}.<br><em>{WORDS.get(len(ps), len(ps))}</em> prices.</h1>',
                f'<div class="abs sub ov txt safe" style="left:64px;top:262px;width:620px">{hero["num"]} has {count} printings. The scanner shows each one, and asks which you hold.</div>']
        pw, ph, b = 450, 940, 16
        ty = S["picker"]["rects"]["title"]["y"]
        img, _ = D.crop_img("picker", (0, ty - 120, 411, 900), pw - 2 * b)
        body.append(realphone(50, 830, pw, ph, f'<div style="position:absolute;left:0;top:54px;right:0;bottom:0;overflow:hidden">{img}</div>', tilt=-6))
        cx, cy, cw = 650, 470, 440
        chh = round(cw * 838 / 600)
        body.append(f'<div class="abs" style="left:{cx}px;top:{cy}px;width:{cw}px;height:{chh}px;transform:rotate(8deg)">{flames(cw, chh, ac["deep"], ac["bright"])}</div>')
        body.append(f'<div class="card safe" style="left:340px;top:570px;width:340px;transform:rotate(-15deg)"><img src="{D.art(low["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:480px;top:525px;width:360px;transform:rotate(-4deg)"><img src="{D.art(mid["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:{cx}px;top:{cy}px;width:{cw}px;transform:rotate(8deg)"><img src="{D.art(HERO)}"></div>')
        o = next(o for o in S["picker"]["options"] if o["price"] == hero["shown"])
        cimg, chh2 = D.crop_img("picker", (12, o["top"] - 4, 387, o["bottom"] - o["top"] + 8), 520)
        body.append(f'<div class="callout ov safe" style="left:612px;top:1216px;width:520px;height:{chh2}px">{cimg}</div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:612px;top:{1216 + chh2 + 22}px;width:520px">TCGplayer market prices, {when}.</div>')
        return D.page(ratio, css, "".join(body), "pull4-portrait")
    t = S["open-home-tall"]["rects"]
    fw = 680; b = 18; fh = round((fw - 2 * b) * 832 / 749) + 2 * b
    img, _ = D.crop_img("open-home-tall", (0, t["hero"]["y"] - 60, 749, 1100), fw - 2 * b, 1966)
    hr = S["home"]["rects"]["hero"]
    cimg, chh = D.crop_img("home", (hr["x"] - 4, hr["y"] - 4, hr["w"] + 8, hr["h"] + 8), 470)
    sw = 230; shh = round(sw * 838 / 600)
    body = [ground, brand,
            f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px;font-size:80px">Your binder,<br>valued <em>nightly</em>.</h1>',
            realphone(460, 330, fw, fh, f'<div style="position:absolute;left:0;top:54px;right:0;bottom:0;overflow:hidden">{img}</div>', tilt=-3, fold=True),
            f'<div class="callout ov safe" style="left:64px;top:560px;width:470px;height:{chh}px">{cimg}</div>',
            f'<div class="abs sub ov txt safe" style="left:64px;top:{560 + chh + 34}px;width:380px;font-size:26px">Every card at the price of the printing you own.</div>',
            f'<div class="abs foot ov txt safe" style="left:64px;top:1120px;width:720px">A sample collection. TCGplayer market prices, {when}.</div>']
    return D.page(ratio, css, "".join(body), "pull4-square")

# ================================================================ pull v5 (27 Sept)
# The owner on v4: too much on the subtext; the phone still looks bad and the fold line is unwanted; the drawn
# aura is a downgrade -- an aura only works blended seamlessly into the card. The device: modern, seamless
# thin bezels like the Fold 7, no front camera (Google's own frames stop at older Pixels). The aura: built
# from the card's own pixels -- its colours bleeding out of its edges and rising -- or v3's soft glow.

P5_CSS = P3_CSS + """
.sub{font:500 28px/1.38 Inter;letter-spacing:-.01em;color:#d4d7d2;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.foot{font:500 17px/1.4 Inter;color:#a9ada8}
.dev{position:absolute;background:#050505;
  box-shadow:0 0 0 2.5px #3a3d40,0 0 0 3.5px #0c0d0e,inset 0 0 0 1px rgba(255,255,255,.06),
    0 2px 4px rgba(0,0,0,.6),0 40px 90px rgba(0,0,0,.55)}
.dev::before{content:'';position:absolute;inset:-2.5px;border-radius:inherit;pointer-events:none;
  background:linear-gradient(160deg,rgba(255,255,255,.38),rgba(255,255,255,0) 22%,rgba(255,255,255,0) 78%,rgba(255,255,255,.18));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;padding:2.5px}
.dev .scr{position:absolute;overflow:hidden;background:#100d22}
.dev .glass{position:absolute;pointer-events:none;background:linear-gradient(125deg,rgba(255,255,255,.07),rgba(255,255,255,0) 30%)}
.sbar{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;color:#f1f1f3;z-index:3;background:#100d22}
.sbar b{font:600 19px/1 Inter;letter-spacing:.01em}
.sbar svg{display:block}
.pa{position:absolute;pointer-events:none}
.pa img{position:absolute;left:0;top:0;width:100%;aspect-ratio:600/838;border-radius:4%}
"""

# one family: every glyph 12 units tall on one baseline, one stroke weight, filled like Android's own; drawn
# at a height set by the status bar (not fixed pixels), so a small phone gets small icons
STATUS_ICONS = ('<svg viewBox="0 0 58 12" aria-hidden="true" fill="currentColor" style="height:{h}px;width:auto">'
    # signal bars
    '<rect x="0" y="8" width="2.4" height="4" rx=".6"/><rect x="3.6" y="5.5" width="2.4" height="6.5" rx=".6"/>'
    '<rect x="7.2" y="3" width="2.4" height="9" rx=".6"/><rect x="10.8" y="0" width="2.4" height="12" rx=".6"/>'
    # wi-fi, a filled fan
    '<path d="M25 12L17.2 4.2A11 11 0 0 1 32.8 4.2Z"/>'
    # battery
    '<rect x="37.65" y=".65" width="18.2" height="10.7" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.3"/>'
    '<rect x="39.6" y="2.6" width="11.5" height="6.8" rx=".9"/><rect x="56.6" y="4.2" width="1.4" height="3.6" rx=".6"/></svg>')

def device(x, y, w, h, shot, crop, screen_w, shot_w=1079, tilt=0.0):
    """a modern slab: an ultra-thin, even black bezel, a thin titanium rim with one soft highlight, no camera,
    no keys, no crease; an Android status bar in the app's own top colour over the app's real screen"""
    bez = 9; r = round(w * .075)
    sw = w - 2 * bez; sbh = round(sw * .085)
    img, _ = D.crop_img(shot, crop, sw, shot_w)
    return (f'<div class="dev" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{r}px;transform:rotate({tilt}deg)">'
            f'<div class="scr" style="left:{bez}px;top:{bez}px;right:{bez}px;bottom:{bez}px;border-radius:{r - bez}px">'
            f'<div class="sbar" style="height:{sbh}px;padding:0 {round(sw * .07)}px"><b style="font-size:{round(sbh * .36)}px">10:08</b>'
            f'{STATUS_ICONS.replace("{h}", str(round(sbh * .28)))}</div>'
            f'<div style="position:absolute;left:0;right:0;top:{sbh}px;bottom:0;overflow:hidden">{img}</div></div>'
            f'<div class="glass" style="left:{bez}px;top:{bez}px;right:{bez}px;bottom:{bez}px;border-radius:{r - bez}px"></div></div>')

def pixel_aura(pid, w, accent, seed=21):
    """the card's own image, blurred and scaled out of its own edges, pushed upward by vertical noise and faded
    by a mask: the glow is the card's colours, so it meets the card without a line. Sits in the card's box."""
    h = round(w * 838 / 600); src = D.art(pid)
    fid = f"pf{seed}"
    return (f'<svg width="0" height="0" style="position:absolute"><filter id="{fid}" x="-50%" y="-60%" width="200%" height="220%">'
            f'<feGaussianBlur stdDeviation="16"/>'
            f'<feColorMatrix type="saturate" values="2.2" result="b"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.018 0.004" numOctaves="3" seed="{seed}" result="n"/>'
            f'<feDisplacementMap in="b" in2="n" scale="190" xChannelSelector="R" yChannelSelector="G"/></filter></svg>'
            # the rising body: flame-displaced, masked to fade down the sides and below
            f'<div class="pa" style="left:{-w * .18:.0f}px;top:{-h * .32:.0f}px;width:{w * 1.36:.0f}px;height:{h * 1.4:.0f}px;'
            f'-webkit-mask-image:radial-gradient(ellipse 58% 62% at 50% 44%,#000 38%,rgba(0,0,0,.55) 62%,transparent 86%);mix-blend-mode:screen;opacity:.95">'
            f'<img src="{src}" style="width:100%;height:100%;filter:url(#{fid}) brightness(1.5)"></div>'
            # the halo: the card, scaled a little and softly blurred, so its own colours ring its edge
            f'<div class="pa" style="left:{-w * .07:.0f}px;top:{-h * .09:.0f}px;width:{w * 1.14:.0f}px;height:{h * 1.12:.0f}px;mix-blend-mode:screen;opacity:.9">'
            f'<img src="{src}" style="width:100%;height:100%;filter:blur(28px) saturate(2) brightness(1.35)"></div>'
            # the seam: an accent rim light on the card's own border
            f'<div class="pa" style="left:-3px;top:-3px;width:{w + 6}px;height:{h + 6}px;border-radius:4.5%;'
            f'box-shadow:0 0 18px 4px {accent},0 0 60px 10px color-mix(in srgb,{accent} 45%,transparent);opacity:.65"></div>')

def pull5(ratio, aura_kind="v3"):
    R, S, ps, labels, why, count, home_crop, when = data()
    hero, mid, low = ps[HERO], ps[LEFT], ps[RIGHT]
    ac = accents().get(str(HERO), {"deep": "#4c1c23", "bright": "#ff6e83"})
    css = p3_fonts() + P5_CSS.replace("var(--accent)", ac["bright"])
    ground = (f'<img class="ground" src="{D.art(HERO)}" style="left:-160px;top:-220px;width:1600px">'
              '<div class="shade"></div>')
    brand = f'<div class="abs brand ov safe" style="right:64px;top:74px"><img src="{D.icon()}"><b>OP TCG Hub</b></div>'
    def hero_aura(w):
        h = round(w * 838 / 600)
        return pixel_aura(HERO, w, ac["bright"]) if aura_kind == "pixel" else aura(w, h, ac["deep"], ac["bright"])
    if ratio == "portrait":
        body = [ground, brand,
                f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px">Same {hero["name"].split()[-1]}.<br><em>{WORDS.get(len(ps), len(ps))}</em> prices.</h1>',
                f'<div class="abs sub ov txt safe" style="left:64px;top:262px;width:600px">{hero["num"]} has {count} printings. The scanner shows each one, and asks which you hold.</div>']
        # the phone: 19.5:9, upright but for a breath of tilt, its foot cropped by the frame's edge only
        pw = 440; ph = round((pw - 18) * 19.5 / 9) + 18
        ty = S["picker"]["rects"]["title"]["y"]
        body.append(device(64, 880, pw, ph, "picker", (0, ty - 40, 411, 900), None, tilt=-2))
        cx, cy, cw = 690, 440, 420
        body.append(f'<div class="abs" style="left:{cx}px;top:{cy}px;width:{cw}px;height:{round(cw * 838 / 600)}px;transform:rotate(7deg)">{hero_aura(cw)}</div>')
        body.append(f'<div class="card safe" style="left:500px;top:520px;width:300px;transform:rotate(-13deg)"><img src="{D.art(low["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:590px;top:480px;width:320px;transform:rotate(-3deg)"><img src="{D.art(mid["id"])}"></div>')
        body.append(f'<div class="card safe" style="left:{cx}px;top:{cy}px;width:{cw}px;transform:rotate(7deg)"><img src="{D.art(HERO)}"></div>')
        o = next(o for o in S["picker"]["options"] if o["price"] == hero["shown"])
        cimg, chh2 = D.crop_img("picker", (12, o["top"] - 4, 387, o["bottom"] - o["top"] + 8), 560)
        body.append(f'<div class="callout ov safe" style="left:576px;top:1200px;width:560px;height:{chh2}px">{cimg}</div>')
        body.append(f'<div class="abs foot ov txt safe" style="left:576px;top:{1200 + chh2 + 20}px;width:560px">TCGplayer market prices, {when}.</div>')
        return D.page(ratio, css, "".join(body), "pull5-portrait")
    # square: the Fold 7 open, as a seamless slab; its total lifted out
    t = S["open-home-tall"]["rects"]
    fw = 640; fh = round((fw - 18) * 1.08) + 18
    hr = S["home"]["rects"]["hero"]
    cimg, chh = D.crop_img("home", (hr["x"] - 4, hr["y"] - 4, hr["w"] + 8, hr["h"] + 8), 460)
    body = [ground, brand,
            f'<h1 class="abs ov txt safe" style="left:64px;top:64px;width:760px;font-size:80px">Your binder,<br>valued <em>nightly</em>.</h1>',
            device(496, 350, fw, fh, "open-home-tall", (0, t["hero"]["y"] - 70, 749, 1100), None, 1966, tilt=-2),
            f'<div class="callout ov safe" style="left:64px;top:560px;width:460px;height:{chh}px">{cimg}</div>',
            f'<div class="abs sub ov txt safe" style="left:64px;top:{560 + chh + 32}px;width:380px;font-size:26px">Every card at the price of the printing you own.</div>',
            f'<div class="abs foot ov txt safe" style="left:64px;top:1116px;width:720px">A sample collection. TCGplayer market prices, {when}.</div>']
    return D.page(ratio, css, "".join(body), "pull5-square")

def pull5pixel(ratio):
    """the pixel-born aura, tried once and kept for the record: it met the card's edge softly, but the
    displaced streaks smeared the black-and-white art into a grey band, so v3's glow leads"""
    return pull5(ratio, "pixel").replace("pull5-", "pull5pixel-")

DRAFTS = {"pull": pull, "jump": jump, "episode": episode, "pullmulti": pullmulti, "pull3": pull3, "pull4": pull4,
          "pull5": pull5, "pull5pixel": pull5pixel}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for name, make in DRAFTS.items():
        if only and name not in only:
            continue
        for ratio in (("portrait",) if name in ("pullmulti", "pull5pixel") else ("portrait", "square")):
            open(os.path.join(OUT, f"{name}-{ratio}.html"), "w").write(make(ratio))
    print(f"directions2: written to {OUT}")
