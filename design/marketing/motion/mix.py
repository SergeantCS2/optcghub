"""The video's sound: build.py's cue sheet played with sounds.json's picks, laid under the rendered picture.

  python3 design/marketing/motion/mix.py video1-9x16.mp4 [--synth] [--out f.mp4]
    the cue sheet is the video's stem + .cues.json (build.py writes it beside the page); the result is the stem
    + -sound.mp4, the picture copied untouched and the silent track replaced

- each cue: its kind's file, trimmed to the kind's max (or the cue's own length, as the count-up's), a short
  fade out, the kind's gain, delayed to the cue's time to the millisecond, all summed without normalising;
- then loudness in two passes (ffmpeg's loudnorm, measured first, applied linearly): -16 LUFS integrated,
  true peak under -1.5 dBTP. YouTube plays ads at about -14, so the track sits just under and is never squashed;
- --synth plays placeholder sounds made by ffmpeg (tones and filtered noise) instead of Freesound's: they prove
  the sync before any pick exists, and are never the delivered sound."""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check, freesound

TARGET, PEAK = -16.0, -1.5
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
    "chime":        ("aevalsrc='0.3*(sin(2*PI*880*t)+sin(2*PI*1320*t)+0.7*sin(2*PI*1760*t))*exp(-1.4*t)':d=3:s=48000", None),
}

def synth_file(kind):
    d = os.path.join(freesound.SFX, "synth"); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, f"{kind}.wav")
    if not os.path.exists(f):
        src, flt = SYNTH[kind]
        subprocess.run([check.ffmpeg(), "-y", "-loglevel", "error", "-f", "lavfi", "-i", src,
                        *(["-af", flt] if flt else []), "-ac", "2", f], check=True)
    return f

def sound_file(kind, spec, synth):
    if synth:
        return synth_file(kind)
    if not spec.get("pick"):
        sys.exit(f"mix: {kind} has no pick in sounds.json (freesound.py search, then pick)")
    f = os.path.join(freesound.SFX, f"{spec['pick']}.mp3")
    if not os.path.exists(f):
        sys.exit(f"mix: {f} is missing (freesound.py fetch)")
    return f

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)

def mix(video, synth=False, out=None):
    stem = video[:-4]
    sheet = json.load(open(stem + ".cues.json"))
    D, cues, pal = sheet["duration"], sheet["cues"], freesound.palette()
    missing = sorted({k for _, k, _ in cues} - set(pal))
    assert not missing, f"mix: cue kinds with no entry in sounds.json: {missing}"
    ins, parts = [], []
    for j, (t, kind, dur) in enumerate(cues):
        spec = pal[kind]; cap = dur or spec["max"]          # the count-up plays as long as the count
        ins += ["-i", sound_file(kind, spec, synth)]
        ms = round(t * 1000)
        parts.append(f"[{j}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{cap},asetpts=PTS-STARTPTS,"
                     f"afade=t=out:st={max(0, cap - FADE):.3f}:d={FADE},volume={spec['gain']}dB,adelay={ms}|{ms}[c{j}]")
    graph = (";".join(parts) + ";" + "".join(f"[c{j}]" for j in range(len(cues))) +
             f"amix=inputs={len(cues)}:normalize=0:dropout_transition=0,apad,atrim=0:{D}[m]")
    with tempfile.TemporaryDirectory() as tmp:
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
    print(f"mix: {len(cues)} cues ({'placeholders' if synth else 'Freesound picks'}) under {os.path.basename(video)} -> {out}")
    return out

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0].startswith("--"):
        print(__doc__); sys.exit(2)
    mix(a[0], synth="--synth" in a, out=a[a.index("--out") + 1] if "--out" in a else None)
