"""The video's sound: build.py's cue sheet played with sounds.json's picks, laid under the rendered picture.

  python3 design/marketing/motion/mix.py video1-9x16.mp4 [--synth] [--out f.mp4]
    the cue sheet is the video's stem + .cues.json (build.py writes it beside the page); the result is the stem
    + -sound.mp4, the picture copied untouched and the silent track replaced

- each cue: its kind's layers (sounds.json), each trimmed to the kind's max (or the cue's own length, as the
  count-up's), faded out briefly, set to the kind's gain plus the layer's own, delayed to the cue's time plus
  the layer's offset to the millisecond (a layer with "every" repeats through the cue), all summed without
  normalising;
- then loudness in two passes (ffmpeg's loudnorm, measured first, applied linearly): -16 LUFS integrated,
  true peak under -1.5 dBTP. YouTube plays ads at about -14, so the track sits just under and is never squashed;
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

TARGET, PEAK = -16.0, -1.5
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

PEAKS = {}
def peak_of(f):
    """seconds into the file of its loudest 5 ms (decoded at 8 kHz mono; no numpy needed)"""
    if f not in PEAKS:
        import array
        raw = subprocess.run([check.ffmpeg(), "-v", "error", "-i", f, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                             capture_output=True, check=True).stdout
        a = array.array("h"); a.frombytes(raw)
        w = 40; best, at = -1, 0
        for i in range(0, max(1, len(a) - w), w // 2):
            e = sum(x * x for x in a[i:i + w])
            if e > best:
                best, at = e, i
        PEAKS[f] = at / 8000
    return PEAKS[f]

def run(cmd):
    # a mix takes seconds; one stalled once for five minutes and did not reproduce, so a stall now fails loudly
    return subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)

def mix(video, synth=False, out=None, music=True):
    stem = video[:-4]
    sheet = json.load(open(stem + ".cues.json"))
    D, cues, pal = sheet["duration"], sheet["cues"], kenney.palette()
    missing = sorted({k for _, k, _ in cues} - set(pal))
    assert not missing, f"mix: cue kinds with no entry in sounds.json: {missing}"
    ins, parts = [], []
    for t, kind, dur in cues:
        spec = pal[kind]; cap = dur or spec["max"]          # the count-up plays as long as the count
        for f, lg, off, every in layers(kind, spec, synth):
            starts = [off + k * every for k in range(int((cap - off) / every) + 1)] if every else [off]
            pk = peak_of(f)
            for st in starts:
                j = len(ins) // 2; ins += ["-i", f]
                seg = cap - st if not every else min(every, cap - st)
                land = t + st - pk                               # where the file must start for its peak to hit the cue
                skip = max(0.0, -land); ms = round(max(0.0, land) * 1000)
                parts.append(f"[{j}:a]aresample=48000,aformat=channel_layouts=stereo,atrim={skip:.3f}:{skip + seg:.3f},asetpts=PTS-STARTPTS,"
                             f"afade=t=out:st={max(0, seg - FADE):.3f}:d={min(FADE, seg):.3f},volume={spec['gain'] + lg}dB,"
                             f"adelay={ms}|{ms}[c{j}]")
    n = len(parts)
    graph = (";".join(parts) + ";" + "".join(f"[c{j}]" for j in range(n)) +
             f"amix=inputs={n}:normalize=0:dropout_transition=0,apad,atrim=0:{D}" + ("[m]" if not music else "[fx]"))
    with tempfile.TemporaryDirectory() as tmp:
        if music:
            bed = os.path.join(tmp, "bed.wav")
            py = os.environ.get("FFMPEG_PY", sys.executable)          # music.py needs numpy: the venv's python
            subprocess.run([py, os.path.join(HERE, "music.py"), stem + ".cues.json", bed], check=True)
            k = len(ins) // 2; ins += ["-i", bed]
            # the bed ducks under the effects: a sidechain keyed by them, quick to duck and slow to return
            graph += (f";[fx]asplit=2[fx1][fx2];[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume={MUSIC}dB[bd];"
                      f"[bd][fx2]sidechaincompress=threshold=0.02:ratio=5:attack=4:release=260[bdk];"
                      f"[fx1][bdk]amix=inputs=2:normalize=0:dropout_transition=0,atrim=0:{D}[m]")
        raw, norm = os.path.join(tmp, "raw.wav"), os.path.join(tmp, "norm.wav")
        run([check.ffmpeg(), "-y", "-loglevel", "error", *ins, "-filter_complex", graph, "-map", "[m]", raw])
        # loudness, pass 1: measure
        err = run([check.ffmpeg(), "-hide_banner", "-i", raw, "-af", f"loudnorm=I={TARGET}:TP={PEAK}:LRA=11:print_format=json",
                   "-f", "null", "-"]).stderr
        m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
        # pass 2: apply, linearly, with the measurement
        run([check.ffmpeg(), "-y", "-loglevel", "error", "-i", raw, "-af",
             f"loudnorm=I={TARGET}:TP={PEAK}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
             f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
             f"aresample=48000", "-ar", "48000", norm])
        out = out or stem + "-sound.mp4"
        run([check.ffmpeg(), "-y", "-loglevel", "error", "-i", video, "-i", norm, "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), "-movflags", "+faststart", out])
    print(f"mix: {len(cues)} cues, {n} sounds{', over the house bed' if music else ''} ({'placeholders' if synth else 'Kenney CC0 and our own whooshes'}) under {os.path.basename(video)} -> {out}")
    return out

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0].startswith("--"):
        print(__doc__); sys.exit(2)
    mix(a[0], synth="--synth" in a, out=a[a.index("--out") + 1] if "--out" in a else None, music="--no-music" not in a)
