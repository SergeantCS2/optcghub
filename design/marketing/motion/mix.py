"""The video's sound: build.py's cue sheet played with sounds.json's picks, laid under the rendered picture.

  python3 design/marketing/motion/mix.py video1-9x16.mp4 [--synth] [--out f.mp4] [--bed track --start s] [--audio-only]
    --bed plays a recorded track (oga.py, CC0) from --start instead of music.py's groove
    the cue sheet is the video's stem + .cues.json (build.py writes it beside the page); the result is the stem
    + -sound.mp4, the picture copied untouched and the silent track replaced

- each cue: its kind's layers (sounds.json), each trimmed to the kind's max (or the cue's own length, as the
  count-up's), faded out briefly, set to the kind's gain plus the layer's own, delayed to the cue's time plus
  the layer's offset to the millisecond (a layer with "every" repeats through the cue), all summed without
  normalising;
- then loudness in two passes (ffmpeg's loudnorm, measured first, applied linearly): -16 LUFS integrated,
  true peak under -2 dBTP. YouTube plays ads at about -14, so the track sits just under and is never squashed;
- a layer lands by its loudest moment, not its first sample: its peak is measured and the layer delayed so
  the peak falls on the cue (a card slide peaks 0.15 s into its file, a whoosh 0.4 s; a punch at once). A
  whoosh or rise is cued where its motion arrives, so it swells into the moment instead of trailing it;
- the backing track (music.py, on the cue sheet's beat grid) is laid under at MUSIC dB and ducks under the
  effects (a sidechain keyed by them), so it never masks a hit; --no-music leaves it out;
- the sounds are Kenney's CC0 packs (kenney.py fetches them) and two made here from filtered noise, the whoosh
  and the rise (SYNTH); --synth plays every kind as its placeholder instead, to prove the timing alone."""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check, kenney

TARGET, PEAK = -16.0, -2.0     # -2 dBTP: the AAC encoder overshoots a -1.5 ceiling (check.py caught -0.9)
MUSIC = -15            # the bed against the effects, before the loudness pass: low, under everything
FADE = 0.06

# placeholders: shapes that stand in for each kind, so a mistimed cue is audible and visible in a waveform
SYNTH = {
    "swish":        ("anoisesrc=d=0.35:c=pink:a=0.6:r=48000", "highpass=f=1500,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.23"),
    "whoosh":       ("anoisesrc=d=0.9:c=brown:a=0.8:r=48000", "bandpass=f=700:w=600,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.45"),
    "rise":         ("anoisesrc=d=0.8:c=pink:a=0.6:r=48000", "highpass=f=600,afade=t=in:d=0.65:curve=exp,afade=t=out:st=0.65:d=0.15"),
    "impact":       ("aevalsrc='0.9*sin(2*PI*(70-40*t)*t)*exp(-3.5*t)+0.5*(random(0)-0.5)*exp(-45*t)':d=1.4:s=48000", None),
    "impact_light": ("aevalsrc='0.7*sin(2*PI*(140-60*t)*t)*exp(-9*t)+0.4*(random(0)-0.5)*exp(-60*t)':d=0.5:s=48000", None),
    "ignite":       ("anoisesrc=d=1.4:c=brown:a=0.8:r=48000", "lowpass=f=1800,afade=t=in:d=0.25,afade=t=out:st=0.4:d=1.0"),
    "hit_soft":     ("aevalsrc='0.6*sin(2*PI*220*t)*exp(-12*t)':d=0.4:s=48000", None),
    "pop":          ("aevalsrc='0.7*sin(2*PI*(700+2600*t)*t)*exp(-28*t)':d=0.18:s=48000", None),
    "cash":         ("aevalsrc='0.5*(sin(2*PI*1320*t)+0.6*sin(2*PI*1980*t))*exp(-4*t)':d=1.0:s=48000", None),
    "count":        ("aevalsrc='0.5*lt(mod(t,0.07),0.01)*sin(2*PI*2800*t)':d=1.6:s=48000", None),
    # the aura's swell (the owner: the fire "sounds weird"): low filtered noise breathing in and out, no crackle
    "swell":        ("anoisesrc=d=1.2:c=brown:a=0.9:r=48000", "lowpass=f=420,highpass=f=60,afade=t=in:d=0.4:curve=qsin,afade=t=out:st=0.4:d=0.8:curve=qsin"),
    "chime":        ("aevalsrc='0.3*(sin(2*PI*880*t)+sin(2*PI*1320*t)+0.7*sin(2*PI*1760*t))*exp(-1.4*t)':d=3:s=48000", None),
}

def synth_file(kind):
    d = os.path.join(kenney.ADS, "sfx", "synth"); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, f"{kind}.wav")
    if not os.path.exists(f):
        src, flt = SYNTH[kind]
        subprocess.run([check.ffmpeg(), "-y", "-loglevel", "error", "-f", "lavfi", "-i", src,
                        *(["-af", flt] if flt else []), "-ac", "2", f], check=True)
    return f

def layers(kind, spec, synth):
    """(file, gain dB, offset s, every s or None) for each layer of a kind"""
    if synth:
        return [(synth_file(kind), 0, 0, None)]
    return [(synth_file(l["synth"]) if "synth" in l else kenney.path_of(l), l.get("gain", 0), l.get("offset", 0), l.get("every"))
            for l in spec["layers"]]

SR = 48000
_DEC = {}
def decode(f):
    """a file as float32 stereo at 48 kHz (each file decoded once)"""
    import numpy as np
    if f not in _DEC:
        raw = subprocess.run([check.ffmpeg(), "-v", "error", "-i", f, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                             capture_output=True, check=True, timeout=120).stdout
        _DEC[f] = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    return _DEC[f]

def peak_of(f):
    """seconds into the file of its loudest 5 ms"""
    import numpy as np
    x = decode(f).mean(1); w = int(.005 * SR)
    e = np.convolve(x * x, np.ones(w), "valid")
    return float(np.argmax(e)) / SR

def run(cmd):
    # ffmpeg does only single-input jobs here (decode, trim, loudness, mux); a stall still fails loudly
    return subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)

def bed_from(path, start, D, end, tmp):
    """a recorded track as the bed: D seconds from `start`, faded in over 0.8 s and out from the end card"""
    f = os.path.join(tmp, "bed.wav")
    run([check.ffmpeg(), "-y", "-loglevel", "error", "-ss", str(start), "-t", str(D), "-i", path, "-ac", "2", "-ar", str(SR),
         "-af", f"afade=t=in:d=0.8,afade=t=out:st={end + 0.6:.2f}:d={D - end - 0.6:.2f},apad,atrim=0:{D}", f])
    return f

def duck(bed, fx, thr=0.02, ratio=5.0, attack=.004, release=.26):
    """the bed under the effects: a feed-forward compressor keyed by the effects' level, in 5 ms blocks"""
    import numpy as np
    blk = int(.005 * SR); n = len(fx) // blk
    lvl = np.sqrt((fx[:n * blk] ** 2).mean(1).reshape(n, blk).mean(1))
    a, r = np.exp(-.005 / attack), np.exp(-.005 / release); env = np.zeros(n); e = 0.0
    for k in range(n):                                               # 4000 blocks: a plain loop is quick enough
        e = a * e + (1 - a) * lvl[k] if lvl[k] > e else r * e + (1 - r) * lvl[k]
        env[k] = e
    gain = np.where(env > thr, (np.maximum(env, 1e-9) / thr) ** (1 / ratio - 1), 1.0)
    g = np.interp(np.arange(len(bed)), np.arange(n) * blk + blk / 2, gain)
    return bed * g[:, None]

def mix(video, synth=False, out=None, music=True, bed=None, start=0.0, audio_only=False):
    """the effects are placed sample by sample in numpy, not in one ffmpeg graph: a graph mixing 59 inputs
    (amix, adelay) stalled ffmpeg now and then for minutes, with or without the bed, and did not reproduce"""
    import numpy as np
    stem = video[:-4]
    sheet = json.load(open(stem + ".cues.json"))
    D, cues, pal = sheet["duration"], sheet["cues"], kenney.palette()
    missing = sorted({k for _, k, _ in cues} - set(pal))
    assert not missing, f"mix: cue kinds with no entry in sounds.json: {missing}"
    N = int(round(D * SR)); fx = np.zeros((N, 2), np.float32); n = 0
    for t, kind, dur in cues:
        spec = pal[kind]; cap = dur or spec["max"]          # the count-up plays as long as the count
        for f, lg, off, every in layers(kind, spec, synth):
            x = decode(f); pk = peak_of(f)
            starts = [off + k * every for k in range(int((cap - off) / every) + 1)] if every else [off]
            for st in starts:
                seg = cap - st if not every else min(every, cap - st)
                land = t + st - pk                               # where the file must start for its peak to hit the cue
                skip = max(0.0, -land)
                y = x[int(skip * SR):int((skip + seg) * SR)].copy()
                fl = min(len(y), int(FADE * SR))
                if fl: y[-fl:] *= np.linspace(1, 0, fl, dtype=np.float32)[:, None]
                y *= 10 ** ((spec["gain"] + lg) / 20)
                i0 = int(round(max(0.0, land) * SR)); i1 = min(N, i0 + len(y))
                if i1 > i0: fx[i0:i1] += y[:i1 - i0]
                n += 1
    with tempfile.TemporaryDirectory() as tmp:
        raw, norm = os.path.join(tmp, "raw.wav"), os.path.join(tmp, "norm.wav")
        total = fx
        if music:
            if bed:                                                   # a recorded track (oga.py, CC0)
                bedf = bed_from(bed, start, D, sheet["end"], tmp)
            else:                                                     # the groove made here (music.py)
                bedf = os.path.join(tmp, "bed.wav")
                subprocess.run([sys.executable, os.path.join(HERE, "music.py"), stem + ".cues.json", bedf], check=True)
            b = decode(bedf)[:N]
            b = np.pad(b, ((0, N - len(b)), (0, 0))) * 10 ** (MUSIC / 20)
            total = fx + duck(b, fx)
        import wave
        with wave.open(raw, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(total, -1, 1) * 32767).astype("<i2").tobytes())
        # loudness, pass 1: measure
        err = run([check.ffmpeg(), "-hide_banner", "-i", raw, "-af", f"loudnorm=I={TARGET}:TP={PEAK}:LRA=11:print_format=json",
                   "-f", "null", "-"]).stderr
        m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
        # pass 2: apply, linearly, with the measurement
        run([check.ffmpeg(), "-y", "-loglevel", "error", "-i", raw, "-af",
             f"loudnorm=I={TARGET}:TP={PEAK}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
             f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
             f"aresample={SR}", "-ar", str(SR), norm])
        out = out or stem + "-sound.mp4"
        if audio_only:                                                # an audition: the soundtrack alone
            run([check.ffmpeg(), "-y", "-loglevel", "error", "-i", norm, "-c:a", "libmp3lame", "-b:a", "192k", out])
        else:
            run([check.ffmpeg(), "-y", "-loglevel", "error", "-i", video, "-i", norm, "-map", "0:v", "-map", "1:a",
                 "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), "-movflags", "+faststart", out])
    what = "a recorded bed" if bed else "the house bed" if music else "no bed"
    print(f"mix: {len(cues)} cues, {n} sounds, {what} ({'placeholders' if synth else 'Kenney CC0 and our own whooshes'}) under {os.path.basename(video)} -> {out}")
    return out

if __name__ == "__main__":
    try:
        import numpy                                                  # the mix is numpy: re-run under the venv's python
    except ImportError:
        py = os.environ.get("FFMPEG_PY")
        if not py:
            sys.exit("mix: needs numpy (set FFMPEG_PY to the venv python that has imageio-ffmpeg and numpy)")
        os.execv(py, [py, os.path.abspath(__file__), *sys.argv[1:]])
    a = sys.argv[1:]
    if not a or a[0].startswith("--"):
        print(__doc__); sys.exit(2)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    mix(a[0], synth="--synth" in a, out=opt("--out"), music="--no-music" not in a,
        bed=opt("--bed"), start=float(opt("--start", 0)), audio_only="--audio-only" in a)
