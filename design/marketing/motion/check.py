"""The video guard: what Google Ads takes, read back from the encoded file (not from the page).

  python3 design/marketing/motion/check.py video.mp4 [--frames 0,1,2.5]   frames pulled from the MP4 as PNGs
  python3 design/marketing/motion/check.py video.mp4 --audio              also: the sound is really there, at level
  python3 design/marketing/motion/check.py --selftest                      a planted 4 s clip must fail, a 12 s one pass;
                                                                          with --audio a silent clip must fail, a toned one pass

Checks: 10 to 60 s; H.264 in yuv420p; 30 fps; one of 1080x1920, 1080x1080, 1920x1080; an audio track (AAC);
at most 1 GB. ffmpeg is FFMPEG, or imageio-ffmpeg's (FFMPEG_PY names the python that has it)."""
import os, re, subprocess, sys, tempfile

SIZES = {(1080, 1920), (1080, 1080), (1920, 1080)}

def ffmpeg():
    if os.environ.get("FFMPEG"):
        return os.environ["FFMPEG"]
    py = os.environ.get("FFMPEG_PY", sys.executable)
    return subprocess.check_output([py, "-c", "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"], text=True).strip()

def probe(path):
    err = subprocess.run([ffmpeg(), "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    v = re.search(r"Stream #\S+: Video: (\w+)[^,]*, (\w+)[^,]*(?:\([^)]*\))?, (\d+)x(\d+)[^\n]*?([\d.]+) fps", err)
    a = re.search(r"Stream #\S+: Audio: (\w+)", err)
    return dict(dur=int(d[1]) * 3600 + int(d[2]) * 60 + float(d[3]) if d else None,
                codec=v and v[1], pix=v and v[2], size=v and (int(v[3]), int(v[4])), fps=v and float(v[5]),
                audio=a and a[1], mb=os.path.getsize(path) / 1e6)

def problems(p):
    why = []
    if p["dur"] is None or not 10 <= p["dur"] <= 60: why.append(f"duration {p['dur']} s (10 to 60)")
    if p["codec"] != "h264": why.append(f"codec {p['codec']}")
    if p["pix"] != "yuv420p": why.append(f"pixels {p['pix']}")
    if p["size"] not in SIZES: why.append(f"size {p['size']}")
    if p["fps"] != 30: why.append(f"fps {p['fps']}")
    if p["audio"] != "aac": why.append(f"audio {p['audio']}")
    if p["mb"] > 1000: why.append(f"{p['mb']:.0f} MB")
    return why

# the sound: a silent track passes every check above (the video carries one on purpose), so --audio reads the
# level itself. Integrated loudness -20 to -12 LUFS (mix.py aims at -16; YouTube plays at about -14), true peak
# at most -1 dBTP (so the encoders' own overshoot does not clip).
LUFS, TP = (-20.0, -12.0), -1.0

def loudness(path):
    err = subprocess.run([ffmpeg(), "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    summ = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summ); p = re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summ)
    val = lambda m: float("-inf") if not m or m[1] == "-inf" else float(m[1])
    return val(i), val(p)

def audio_problems(path):
    i, p = loudness(path)
    why = []
    if not LUFS[0] <= i <= LUFS[1]: why.append(f"loudness {i} LUFS ({LUFS[0]} to {LUFS[1]})")
    if p > TP: why.append(f"true peak {p} dBTP (at most {TP})")
    return why, i, p

def clip(path, secs, tone=None):
    audio = f"sine=f=440:r=48000,volume={tone}dB" if tone is not None else "anullsrc=r=48000:cl=stereo"
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=1080x1920:rate=30", "-f", "lavfi",
                    "-i", audio, "-t", str(secs), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "2", path], check=True)

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        with tempfile.TemporaryDirectory() as t:
            short, ok = os.path.join(t, "short.mp4"), os.path.join(t, "ok.mp4")
            clip(short, 4); clip(ok, 12)
            a, b = problems(probe(short)), problems(probe(ok))
        print("selftest: 4 s clip ->", a or "passes", "| 12 s clip ->", b or "passes")
        if not a or not any("duration" in w for w in a):
            print("selftest: FAILED -- the short clip passed (the guard cannot see duration)"); sys.exit(1)
        if b:
            print("selftest: FAILED -- a clip in spec was refused"); sys.exit(1)
        with tempfile.TemporaryDirectory() as t:
            silent, toned = os.path.join(t, "silent.mp4"), os.path.join(t, "toned.mp4")
            clip(silent, 12); clip(toned, 12, tone=6)     # lavfi's sine is 1/8 scale: +6 dB reads about -16 LUFS
            s_why, _, _ = audio_problems(silent); t_why, ti, tp = audio_problems(toned)
        print("selftest: --audio: silent clip ->", s_why or "passes", f"| toned clip ({ti} LUFS, {tp} dBTP) ->", t_why or "passes")
        if not s_why:
            print("selftest: FAILED -- a silent track passed --audio"); sys.exit(1)
        if t_why:
            print("selftest: FAILED -- a toned track at level was refused"); sys.exit(1)
        print("selftest: the short clip and the silent track are refused; the clips in spec pass"); sys.exit(0)
    path = sys.argv[1]; p = probe(path); why = problems(p)
    if "--audio" in sys.argv:
        a_why, li, lp = audio_problems(path); why += a_why
        print(f"check: sound {li} LUFS, true peak {lp} dBTP")
    print(f"check: {os.path.basename(path)} {p['dur']:.2f} s, {p['codec']} {p['pix']} {p['size']} {p['fps']} fps, audio {p['audio']}, {p['mb']:.1f} MB"
          + (" -- " + "; ".join(why) if why else " -- in spec"))
    if "--frames" in sys.argv:
        for t in sys.argv[sys.argv.index("--frames") + 1].split(","):
            f = path.replace(".mp4", f"-at{float(t):05.2f}.png")
            subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-ss", t, "-i", path, "-frames:v", "1", f], check=True)
            print("check: frame", f)
    sys.exit(1 if why else 0)
