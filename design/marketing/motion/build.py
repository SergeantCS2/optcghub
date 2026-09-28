"""Video 1 as a composition page: the storyboard (storyboards/video1.json) laid out in the Pull style, with a
timeline engine.mjs drives frame by frame.

  python3 design/marketing/motion/build.py [video1] [--ratio 9x16]   -> $ADS_OUT/motion/video1-9x16.html

What moves, and how:
- every element is absolutely placed at its resting spot; the timeline (TL, below) moves it by keyframes of
  opacity, offset, scale and rotation, eased per segment. window.__frame(t) applies them: nothing reads the clock.
- the aura's tongues rise by SMIL (style_pull.flame_aura's motion), which the engine sets to t.
- impacts (a card landing) flash manga speed lines and shake the stage for a few frames.
- the count-up is the capture's own total, eased from zero.
Prices, the total, the date and the heroes come from the capture and heroes.json, as in the stills; the words
come from the storyboard and pass the same caption rules."""
import base64, hashlib, json, math, os, random, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import style_pull as SP                              # the Pull style: aura, card, accents, caption rules
import directions2 as P2                             # device, P5_CSS, fonts
D = SP.D

def badge():
    """Google's "Get it on Google Play" badge as fetch_badge.sh saved it (never drawn or altered here)"""
    f = os.path.join(SP.ADS, "badge", "google-play-badge.png")
    assert os.path.exists(f), "no badge: run bash design/marketing/fetch_badge.sh"
    return D.b64(f, "image/png")

RATIOS = {"9x16": (1080, 1920), "1x1": (1080, 1080), "16x9": (1920, 1080)}

# where each piece rests, per ratio (px). fan/luffy/beat_card: a card (x, y, width); phone*: (x, y, width), the
# height from 19.5:9; pills/call1/panel: (x, y, width); sub and beat_word carry a font size; fan_to moves the fan
# aside in the picker scene (dx, dy, scale), or None where there is no room and it leaves. zoom scales the UI
# pieces (pills, the total) and end_zoom the end card, so a smaller frame keeps their proportions.
LAYOUT = {
    "9x16": dict(pad=64, h1=118, h2=104, head_top=130, h1b_top=252, zoom=1,
                 fan=(440, 560, 470), fan_to=(230, -250, .5), pills=[(64, 1440, 300), (380, 1440, 300), (696, 1440, 320)],
                 sub=(64, 370, 560, 38), phone1=(64, 560, 560), call1=(546, 1240, 470),
                 luffy=(560, 520, 430), phone2=(64, 700, 500), panel=(456, 1170, 560),
                 beat_word=(64, 230, 150), beat_card=(470, 700, 500), end_top=560, end_zoom=1, foot=(64, 1830, 24),
                 brand=(64, 60)),
    "1x1":  dict(pad=64, h1=96, h2=84, head_top=64, h1b_top=164, zoom=.82,
                 fan=(660, 250, 320), fan_to=None, pills=[(64, 870, 260), (344, 870, 260), (624, 870, 280)],
                 sub=(64, 270, 470, 30), phone1=(640, 130, 360), call1=(64, 560, 440),
                 luffy=(720, 300, 290), phone2=(64, 300, 330), panel=(556, 740, 460),
                 beat_word=(64, 170, 112), beat_card=(650, 330, 360), end_top=150, end_zoom=.8, foot=(64, 1030, 20),
                 brand=(64, 56)),
    "16x9": dict(pad=96, h1=110, h2=100, head_top=150, h1b_top=264, zoom=1,
                 fan=(1180, 310, 400), fan_to=(330, -150, .55), pills=[(96, 450, 320), (96, 600, 320), (96, 750, 340)],
                 sub=(96, 390, 640, 34), phone1=(840, 100, 400), call1=(96, 560, 540),
                 luffy=(1400, 260, 360), phone2=(880, 100, 400), panel=(96, 520, 600),
                 beat_word=(96, 280, 160), beat_card=(1150, 250, 420), end_top=200, end_zoom=.9, foot=(96, 1016, 22),
                 brand=(96, 60)),
}

def speed_lines(cx, cy, r0, r1, n=84, seed=5, colour="#fff"):
    """manga focus lines: thin wedges from a ring out past the frame, of uneven width and reach"""
    rnd = random.Random(seed); ps = []
    for i in range(n):
        a = (i + rnd.random() * .6) / n * 2 * math.pi; da = rnd.uniform(.004, .018)
        r = r0 * rnd.uniform(.85, 1.25)
        pts = [(cx + r * math.cos(a), cy + r * math.sin(a)),
               (cx + r1 * math.cos(a - da), cy + r1 * math.sin(a - da)), (cx + r1 * math.cos(a + da), cy + r1 * math.sin(a + da))]
        ps.append('<polygon points="' + " ".join(f"{x:.0f},{y:.0f}" for x, y in pts) + '"/>')
    return f'<g fill="{colour}">{"".join(ps)}</g>'

def build(name="video1", ratio="9x16"):
    SB = json.load(open(os.path.join(HERE, "storyboards", f"{name}.json")))
    R, S = SP.report()
    W, H = RATIOS[ratio]; DUR = SB["duration"]; L = LAYOUT[ratio]
    sc = {s["id"]: s for s in SB["scenes"]}
    when = D.day(R["source"])
    # every word on screen passes the ad text's rules
    words = [sc["fan"]["head"], sc["fan"]["head2"], sc["picker"]["head"], sc["picker"]["sub"], sc["value"]["head"],
             sc["value"]["label"], sc["end"]["line"], sc["end"]["what"]] + [b["word"] for b in sc["beats"]["beats"]]
    bad = SP.check_caption(" ".join(words)) + SP.check_caption(f"TCGplayer market prices, {when}. A sample collection.", footnote=True)
    # Google's trademark line is Google's wording, kept verbatim (its "LLC" is not a word in capitals)
    assert sc["end"]["legal"] == "Google Play and the Google Play logo are trademarks of Google LLC.", sc["end"]["legal"]
    assert not bad, bad

    ps = {p["id"]: p for p in R["hero"]["printings"]}
    dear, mid, low = sorted(ps, key=lambda i: -(ps[i]["market"] or 0))
    hero_of = lambda k: SP.HEROES[k]["ids"][0]
    ac = {pid: SP.accent_of(pid) for pid in [dear, hero_of("value")] + [hero_of(b["hero"]) for b in sc["beats"]["beats"]]}
    el = []          # the page's elements, back to front
    TL = {}          # id -> [[t, {o,x,y,s,r}, ease], ...]
    def add(id_, html, keys=None, pos="", origin=None):
        style = pos + (f";transform-origin:{origin}" if origin else "")
        el.append(f'<div id="{id_}" class="abs mv" style="{style}">{html}</div>')
        if keys:
            TL[id_] = keys

    # ---- grounds: one per hero, crossfaded
    grounds = [("g0", dear, [[0, {"o": 1}], [10, {"o": 1}], [10.4, {"o": 0}], [17, {"o": 0}], [17.4, {"o": .6}]]),
               ("g1", hero_of("value"), [[0, {"o": 0}], [10, {"o": 0}], [10.4, {"o": 1}], [14, {"o": 1}], [14.2, {"o": 0}]])]
    for i, b in enumerate(sc["beats"]["beats"]):
        t0 = sc["beats"]["start"] + i
        grounds.append((f"g{2 + i}", hero_of(b["hero"]), [[0, {"o": 0}], [t0 - .1, {"o": 0}], [t0 + .1, {"o": 1}], [t0 + .95, {"o": 1}], [t0 + 1.1, {"o": 0}]]))
    for gid, pid, keys in grounds:
        add(gid, f'<img class="ground" src="{D.art(pid)}" style="position:absolute;left:-200px;top:-300px;width:{W + 400}px">', keys)
    el.append('<div class="shade"></div>')

    # ---- the stage: everything that shakes on an impact
    el.append('<div id="stage" class="abs mv" style="left:0;top:0;width:100%;height:100%">')
    TL["stage"] = [[0, {}]]
    def impact(t):
        TL["stage"] += [[t, {}], [t + .03, {"x": -14, "y": 9}], [t + .07, {"x": 11, "y": -8}], [t + .11, {"x": -6, "y": 4}], [t + .16, {}]]
    def flash(id_, t, cx, cy):
        add(id_, f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="opacity:.55">{speed_lines(cx, cy, 300 * min(W, H) / 1080, math.hypot(W, H), seed=len(TL))}</svg>',
            [[0, {"o": 0}], [t, {"o": 0, "s": 1.25}], [t + .05, {"o": 1, "s": 1}], [t + .45, {"o": 0, "s": .96}]], origin=f"{cx}px {cy}px")

    # ---- scene 1, the fan: three printings land; the dear one ignites
    f = sc["fan"]; cx, cy, cw = L["fan"]; z = L["zoom"]
    fan = [(low, -.45, .19, .71, -13, .25), (mid, -.24, .10, .76, -3, .5)]
    if L["fan_to"]:            # the fan steps aside, small, while the phone takes the stage
        fx, fy, fs = L["fan_to"]
        fan_keys = [[0, {}], [5.0, {}], [5.6, {"x": fx, "y": fy, "s": fs}, "io"], [9.9, {"x": fx, "y": fy, "s": fs}],
                    [10.2, {"x": fx + 470, "y": fy, "s": fs, "o": 0}, "in"]]
    else:                      # no room beside the phone: the fan leaves
        fan_keys = [[0, {}], [5.0, {}], [5.4, {"y": -H, "o": 0}, "in"]]
    flash("sl1", .9, cx + cw / 2, cy + cw * .7)
    el.append(f'<div id="fan" class="abs mv" style="left:0;top:0;width:100%;height:100%;transform-origin:{cx + cw * .3:.0f}px {cy + cw * .6:.0f}px">')
    TL["fan"] = fan_keys
    for pid, ox, oy, k, t, t0 in fan:
        add(f"c{pid}", SP.card(pid, cx + ox * cw, cy + oy * cw, cw * k, t),
            [[0, {"o": 0, "y": H, "r": -25}], [t0, {"o": 0, "y": H, "r": -25}], [t0 + .08, {"o": 1}], [t0 + .38, {"y": 0, "r": 0}, "back"]])
    add("aura1", SP.aura_box(dear, cx, cy, cw, 7, ac[dear], SP.AURA_LEVEL, motion=DUR),
        [[0, {"o": 0}], [.9, {"o": 0, "s": .8}], [1.4, {"o": 1, "s": 1}, "out"]], origin=f"{cx + cw / 2:.0f}px {cy + cw * 1.4:.0f}px")
    add(f"c{dear}", SP.card(dear, cx, cy, cw, 7, "box-shadow:0 34px 44px -20px rgba(0,0,0,.7)"),
        [[0, {"o": 0, "s": 1.9, "r": 8}], [.7, {"o": 0, "s": 1.9, "r": 8}], [.74, {"o": 1}], [.9, {"s": 1, "r": 0}, "in"]])
    el.append('</div>')
    impact(.9)
    acc = ac[dear]["bright"]; px_ = L["pad"]
    for id_, text, top, t_in in (("h1a", f["head"], L["head_top"], .3), ("h1b", f["head2"], L["h1b_top"], 2.3)):
        add(id_, f'<h1 style="font-size:{L["h1"]}px;--accent:{acc}">{text}</h1>',
            [[0, {"o": 0, "s": 1.3}], [t_in, {"o": 0, "s": 1.3}], [t_in + .15, {"o": 1, "s": 1}, "out"], [5, {}], [5.25, {"o": 0, "y": -60}, "in"]],
            pos=f"left:{px_}px;top:{top}px", origin="0 50%")
    # the price pills, in the fan's order, the dear one last and loudest
    for i, pid in enumerate([low, mid, dear]):
        p = ps[pid]; big = pid == dear; x, y, w = L["pills"][i]
        add(f"p{pid}", f'<div class="pill{" big" if big else ""}" style="--accent:{acc};zoom:{z}"><b>{p["shown"]}</b><span>{f["labels"][p["treat"]]}</span></div>',
            [[0, {"o": 0, "y": 40}], [2.7 + i * .4, {"o": 0, "y": 40}], [2.85 + i * .4, {"o": 1, "y": 0}, "back"], [5, {}], [5.2, {"o": 0, "y": 40}, "in"]],
            pos=f"left:{x}px;top:{y}px;width:{w}px")
    x, y, w = L["pills"][2]
    impact(3.55); flash("sl2", 3.55, x + w / 2, y + 60 * z)

    # ---- scene 2, the picker: the phone rises with the real screen; the SP row lifts out
    p2 = sc["picker"]
    add("h1c", f'<h1 style="font-size:{L["h2"]}px;--accent:{acc}">{p2["head"]}</h1>',
        [[0, {"o": 0, "s": 1.3}], [5.3, {"o": 0, "s": 1.3}], [5.45, {"o": 1, "s": 1}, "out"], [9.9, {}], [10.15, {"o": 0, "y": -60}, "in"]],
        pos=f"left:{px_}px;top:{L['head_top']}px", origin="0 50%")
    sx, sy, sw_, sf = L["sub"]
    add("sub1", f'<div class="sub" style="font-size:{sf}px;width:{sw_}px">{p2["sub"]}</div>',
        [[0, {"o": 0, "y": 20}], [5.7, {"o": 0, "y": 20}], [6.0, {"o": 1, "y": 0}, "out"], [9.9, {}], [10.15, {"o": 0}, "in"]], pos=f"left:{sx}px;top:{sy}px")
    def screen_crop(dw, dh, bottom=960):
        """the screen's crop for a phone dw x dh (px), bottom-aligned to the shot, so a sheet sits at the foot as
        it does on the phone and the screen is filled edge to edge"""
        sw = dw - 18; ch = round(((dh - 18) - round(sw * .085)) * 411 / sw)
        return (0, bottom - ch, 411, ch)
    phone_h = lambda dw: round((dw - 18) * 19.5 / 9) + 18
    dx, dy, dw = L["phone1"]; dh = phone_h(dw)
    add("phone1", P2.device(dx, dy, dw, dh, "picker", screen_crop(dw, dh), None, 1079, tilt=-2),
        [[0, {"y": H}], [5.3, {"y": H}], [6.1, {"y": 0}, "out"], [9.9, {}], [10.3, {"x": -W}, "in"]])
    o = next(o for o in S["picker"]["options"] if o["price"] == ps[dear]["shown"])
    kx, ky, kw = L["call1"]; cimg, ch = D.crop_img("picker", (12, o["top"] - 4, 387, o["bottom"] - o["top"] + 8), kw)
    add("call1", f'<div class="callout" style="position:relative;width:{kw}px;height:{ch}px;--accent:{acc}">{cimg}</div>',
        [[0, {"o": 0, "x": -260, "s": .7}], [7.0, {"o": 0, "x": -260, "s": .7}], [7.45, {"o": 1, "x": 0, "s": 1}, "back"], [9.9, {}], [10.2, {"o": 0, "x": 300}, "in"]],
        pos=f"left:{kx}px;top:{ky}px")
    impact(7.45)
    fx_, fy_, ff = L["foot"]
    add("foot1", f'<div class="foot" style="font-size:{ff}px">TCGplayer market prices, {when}.</div>',
        [[0, {"o": 0}], [2.7, {"o": 0}], [3.0, {"o": 1}], [9.9, {}], [10.1, {"o": 0}]], pos=f"left:{fx_}px;top:{fy_}px")

    # ---- scene 3, value: the Luffy slams in, the phone with Home, and the total counts up
    v = sc["value"]; lv = hero_of("value"); la = ac[lv]["bright"]
    add("h1d", f'<h1 style="font-size:{L["h2"]}px;--accent:{la}">{v["head"]}</h1>',
        [[0, {"o": 0, "s": 1.3}], [10.2, {"o": 0, "s": 1.3}], [10.35, {"o": 1, "s": 1}, "out"], [13.85, {}], [14.05, {"o": 0, "y": -60}, "in"]],
        pos=f"left:{px_}px;top:{L['head_top']}px", origin="0 50%")
    lx, ly, lw = L["luffy"]
    flash("sl3", 10.55, lx + lw / 2, ly + lw * .7)
    add("aura2", SP.aura_box(lv, lx, ly, lw, 7, ac[lv], SP.AURA_LEVEL, motion=DUR),
        [[0, {"o": 0}], [10.5, {"o": 0, "s": .8}], [11.0, {"o": 1, "s": 1}, "out"], [13.85, {}], [14.05, {"o": 0}]], origin=f"{lx + lw / 2:.0f}px {ly + lw * 1.4:.0f}px")
    add("c2", SP.card(lv, lx, ly, lw, 7, "box-shadow:0 34px 44px -20px rgba(0,0,0,.7)"),
        [[0, {"o": 0, "s": 1.9}], [10.3, {"o": 0, "s": 1.9}], [10.35, {"o": 1}], [10.55, {"s": 1}, "in"], [13.85, {}], [14.05, {"o": 0, "s": 1.1}]],
        origin=f"{lx + lw / 2:.0f}px {ly + lw * .7:.0f}px")
    impact(10.55)
    dx, dy, dw = L["phone2"]
    add("phone2", P2.device(dx, dy, dw, phone_h(dw), "home", (0, 40, 411, 900), None, 1079, tilt=-2),
        [[0, {"y": H}], [10.4, {"y": H}], [11.1, {"y": 0}, "out"], [13.85, {}], [14.1, {"y": H}, "in"]])
    hs = S["home"]; nx, ny, nw = L["panel"]
    add("total", f'<div class="panel" style="--accent:{la};zoom:{z}"><span>{v["label"]}</span><b id="num">$0.00</b><i>{hs["delta"]}</i></div>',
        [[0, {"o": 0, "s": .8}], [11.0, {"o": 0, "s": .8}], [11.3, {"o": 1, "s": 1}, "back"], [13.85, {}], [14.05, {"o": 0}]], pos=f"left:{nx}px;top:{ny}px;width:{nw}px")
    add("foot2", f'<div class="foot" style="font-size:{ff}px">A sample collection. TCGplayer market prices, {when}.</div>',
        [[0, {"o": 0}], [10.4, {"o": 0}], [10.7, {"o": 1}], [13.85, {}], [14.0, {"o": 0}]], pos=f"left:{fx_}px;top:{fy_}px")
    count = (11.3, 12.9, R["collection"]["total"])

    # ---- scene 4, three beats: a word and a card each, one second apiece
    bt = sc["beats"]; wx, wy, wf = L["beat_word"]
    for i, b in enumerate(bt["beats"]):
        t0 = bt["start"] + i; pid = hero_of(b["hero"]); a = ac[pid]; bx, by, bw = L["beat_card"]
        flash(f"slb{i}", t0 + .12, bx + bw / 2, by + bw * .7)
        add(f"ab{i}", SP.aura_box(pid, bx, by, bw, 6, a, SP.AURA_LEVEL, motion=DUR),
            [[0, {"o": 0}], [t0 + .1, {"o": 0, "s": .85}], [t0 + .35, {"o": 1, "s": 1}, "out"], [t0 + .9, {}], [t0 + 1.0, {"o": 0}]],
            origin=f"{bx + bw / 2:.0f}px {by + bw * 1.4:.0f}px")
        add(f"cb{i}", SP.card(pid, bx, by, bw, 6, "box-shadow:0 34px 44px -20px rgba(0,0,0,.7)"),
            [[0, {"o": 0, "s": 1.8}], [t0, {"o": 0, "s": 1.8}], [t0 + .03, {"o": 1}], [t0 + .12, {"s": 1}, "in"], [t0 + .9, {"s": 1.04}],
             [t0 + 1.0, {"o": 0, "x": -500, "s": 1.04}, "in"]], origin=f"{bx + bw / 2:.0f}px {by + bw * .7:.0f}px")
        impact(t0 + .12)
        add(f"wb{i}", f'<h1 style="font-size:{wf}px;line-height:.95;--accent:{a["bright"]}">{b["word"]}</h1>',
            [[0, {"o": 0, "s": 1.4}], [t0 + .05, {"o": 0, "s": 1.4}], [t0 + .17, {"o": 1, "s": 1}, "out"], [t0 + .9, {"s": 1.02}], [t0 + 1.0, {"o": 0, "x": -300}, "in"]],
            pos=f"left:{wx}px;top:{wy}px", origin="0 50%")

    # ---- scene 5, the end card
    e = sc["end"]
    add("end", f'<div class="endc" style="--accent:{acc};zoom:{L["end_zoom"]}"><img src="{D.icon()}"><b>OP TCG Hub</b><p>{e["line"]}</p><span>{e["what"]}</span><img class="gp" src="{badge()}" alt="Get it on Google Play"></div>',
        [[0, {"o": 0, "s": .9}], [17.0, {"o": 0, "s": .9}], [17.4, {"o": 1, "s": 1}, "out"]], pos=f"left:0;top:{L['end_top']}px;width:100%", origin="50% 30%")
    el.append('</div>')                                         # the stage
    add("legal", f'<div class="legal">{e["legal"]}</div>', [[0, {"o": 0}], [17.2, {"o": 0}], [17.6, {"o": 1}]],
        pos=f"left:0;width:100%;top:{fy_ + ff * .2:.0f}px")
    add("brand", f'<div class="brand"><img src="{D.icon()}"><b>OP TCG Hub</b></div>', [[0, {"o": 1}], [16.9, {"o": 1}], [17.1, {"o": 0}]], pos=f"right:{L['brand'][0]}px;top:{L['brand'][1]}px")

    css = P2.p3_fonts() + P2.P5_CSS + SP.GROUND_CSS + """
.mv{will-change:transform,opacity}
.sub{text-wrap:balance}
.brand img{width:56px;height:56px;border-radius:13px}.brand b{font-size:28px}
.pill{display:flex;flex-direction:column;gap:6px;padding:20px 26px;border-radius:22px;background:rgba(16,13,34,.88);
  box-shadow:0 0 0 1.5px rgba(255,255,255,.16),0 24px 50px rgba(0,0,0,.55)}
.pill b{font:800 52px/1 Inter;letter-spacing:-.03em;color:#f4f5f3}
.pill span{font:600 26px/1 Inter;color:#b8bcb7}
.pill.big{box-shadow:0 0 0 2.5px var(--accent),0 0 70px color-mix(in srgb,var(--accent) 45%,transparent),0 24px 50px rgba(0,0,0,.55)}
.pill.big b{font-size:62px;color:var(--accent)}
.panel{display:flex;flex-direction:column;gap:14px;padding:30px 36px;border-radius:26px;background:rgba(16,13,34,.92);
  box-shadow:0 0 0 2px var(--accent),0 0 70px color-mix(in srgb,var(--accent) 35%,transparent),0 30px 60px rgba(0,0,0,.6)}
.panel span{font:600 26px/1 Inter;letter-spacing:.08em;text-transform:uppercase;color:#b8bcb7}
.panel b{font:800 92px/1 Inter;letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:#f4f5f3}
.panel i{font:600 28px/1 Inter;font-style:normal;color:#5fd08a}
.endc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:26px}
.endc img{width:240px;height:240px;border-radius:54px;box-shadow:0 0 0 2px rgba(255,255,255,.12),0 0 120px color-mix(in srgb,var(--accent) 45%,transparent),0 40px 80px rgba(0,0,0,.6)}
.endc b{font:800 104px/1 Inter;letter-spacing:-.04em;margin-top:24px}
.endc p{font:700 48px/1.2 Inter;letter-spacing:-.02em;color:var(--accent)}
.endc span{font:500 32px/1.3 Inter;color:#b8bcb7}
/* Google's badge exactly as shipped: no shadow, filter or radius (the rules forbid effects); its file carries its
   own clear space (40 px of 250 each side, over the quarter-height the rules ask) */
.endc img.gp{width:500px;height:auto;border-radius:0;box-shadow:none;margin-top:10px}
.legal{font:500 20px/1.3 Inter;color:#8d918c;text-align:center}
"""
    js = """
const TL = %s, COUNT = %s;
const E = { lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t,
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c = 1.70158, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const Z = { o: 1, x: 0, y: 0, s: 1, r: 0 };
const els = {}; for (const id in TL) els[id] = document.getElementById(id);
// each key holds only what it changes: fill the rest from the key before, so a key never snaps a value back
for (const id in TL) { let prev = { ...Z }; TL[id] = TL[id].map(k => { prev = { ...prev, ...k[1] }; return [k[0], prev, k[2] || 'out']; }); }
function at(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const [t0, a] = keys[i - 1], [t1, b, e] = keys[i], u = E[e]((t - t0) / (t1 - t0)), o = {};
    for (const k in Z) o[k] = a[k] + (b[k] - a[k]) * u; return o; }
  return keys[keys.length - 1][1];
}
const money = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
window.__frame = t => {
  for (const id in TL) { const p = at(TL[id], t), s = els[id].style;
    s.opacity = Math.max(0, Math.min(1, p.o)); s.display = p.o <= .001 ? 'none' : '';
    s.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(${p.s})`; }
  const [c0, c1, total] = COUNT, u = Math.max(0, Math.min(1, (t - c0) / (c1 - c0)));
  document.getElementById('num').textContent = money(Math.round(total * (1 - Math.pow(1 - u, 4)) * 100) / 100);
};
window.__frame(0);
""" % (json.dumps(TL), json.dumps(count))
    return (f'<!doctype html><html><head><meta charset=utf-8><meta name="duration" content="{DUR}"><title>{name}-{ratio}</title><style>'
            f"*{{box-sizing:border-box;margin:0}}html,body{{width:{W}px;height:{H}px;overflow:hidden}}body{{position:relative}}"
            f".abs{{position:absolute}}{css}</style></head><body>{''.join(el)}<script>{js}</script></body></html>")

EXT = {"image/png": "png", "image/svg+xml": "svg", "font/woff2": "woff2", "image/jpeg": "jpg"}

def externalise(html, out):
    """every inlined data URL written once to out/assets/<hash>.<ext> and referenced by that path: the stills'
    modules inline each image at every use, which made this page 56 MB (27 Sept)"""
    os.makedirs(os.path.join(out, "assets"), exist_ok=True)
    def one(m):
        mime, data = m.group(1), m.group(2)
        raw = base64.b64decode(data); name = f"assets/{hashlib.sha1(raw).hexdigest()[:16]}.{EXT[mime]}"
        f = os.path.join(out, name)
        if not os.path.exists(f):
            open(f, "wb").write(raw)
        return name
    return re.sub(r"data:(image/png|image/svg\+xml|font/woff2|image/jpeg);base64,([A-Za-z0-9+/=]+)", one, html)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ratio = sys.argv[sys.argv.index("--ratio") + 1] if "--ratio" in sys.argv else "9x16"
    name = next((a for a in args if a != ratio), "video1")
    out = os.path.join(SP.ADS, "motion"); os.makedirs(out, exist_ok=True)
    f = os.path.join(out, f"{name}-{ratio}.html")
    open(f, "w").write(externalise(build(name, ratio), out))
    print(f"build: {name} at {ratio} -> {f}")
