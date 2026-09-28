"""The backing track: a low, generic house groove, made here from oscillators and noise (ours: no licence,
no download, no account), on the beat grid build.py fitted to the video's slams.

  python music.py video1-9x16.cues.json out.wav     (needs numpy: run it with the venv python, FFMPEG_PY)

The groove, at the cue sheet's tempo and phase, in A minor (Am F C G, a bar each):
- before the drop (the first slam): a filtered pad swelling in, hats entering, no kick;
- from the drop: four-on-the-floor kick, a clap on 2 and 4, offbeat open hats, a rolling offbeat bass,
  chord stabs pumped by the kick (the house sidechain), the pad underneath;
- the last bar before the three beats: the kick drops out and a noise riser climbs into them;
- at the end card: the drums stop on the downbeat and the last chord rings out to silence by the end.
Every sound starts on a sample the grid computes, so a kick is exactly where build.py put the slam."""
import json, sys
import numpy as np

SR = 48000

def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR / decay)

def lowpass(x, fc):
    """a gentle FFT lowpass (a 2-pole slope), whole-signal: enough for a bed that sits under the effects"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / fc) ** 4) ** .5, len(x))

def highpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 2 / (1 + (f / fc) ** 4) ** .5, len(x))

def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    return sum(2 * ((t * freq * (1 + d)) % 1) - 1 for d in (-detune, 0, detune)) / 3

def kick(n=int(.32 * SR)):
    t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t / .035)                          # the pitch drop that makes a house kick
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, .11) + .3 * np.random.default_rng(1).standard_normal(n) * env_exp(n, .004)

def hat(n, decay, rng):
    return highpass(rng.standard_normal(n), 7000) * env_exp(n, decay)

def clap(rng, n=int(.25 * SR)):
    x = np.zeros(n); b = highpass(rng.standard_normal(n), 900)
    for k, d in enumerate((0, .011, .022)):                   # three quick hands, then the room
        s = int(d * SR); x[s:] += b[:n - s] * env_exp(n - s, .006 if k < 2 else .09)
    return lowpass(x, 5000)

def place(bus, snd, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(bus) or i + len(snd) <= 0:
        return
    lo = max(0, -i); hi = min(len(snd), len(bus) - i)
    bus[i + lo:i + hi] += gain * snd[lo:hi]

def track(sheet):
    D = sheet["duration"]; bpm, off = sheet["grid"]["bpm"], sheet["grid"]["offset"]
    b = 60 / bpm; drop, end = sheet["drop"], sheet["end"]
    beats_in = min(c[0] for c in sheet["cues"] if c[1] == "impact" and c[0] > 13)   # the three beats' first
    n = int(D * SR); rng = np.random.default_rng(7)
    drums, music, bass = np.zeros(n), np.zeros(n), np.zeros(n)
    K = kick(); C = clap(rng)
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G (MIDI)
    roots = [45, 41, 36, 43]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    first = int(np.floor((0 - off) / b)) - 1
    beats = [off + k * b for k in range(first, int((D - off) / b) + 2)]
    bar_of = lambda t: int(np.floor((t - drop) / (4 * b))) % 4      # bars counted from the drop, so Am lands on it
    kicks = []
    for t in beats:
        q = b / 4                                              # the cue sheet rounds to the ms: compare on the grid, a quarter-beat wide
        if t < -b or t >= end - q:
            continue
        beat_no = int(round((t - drop) / b)) % 4
        grooving = t >= drop - q
        riser_bar = beats_in - 4 * b - q <= t < beats_in - q
        if grooving and not riser_bar:
            place(drums, K, t, 1.0); kicks.append(t)
            if beat_no in (1, 3):
                place(drums, C, t, .45)
        if t >= drop - 4 * b:                                  # hats enter a bar before the drop
            place(drums, hat(int(.12 * SR), .045, rng), t + b / 2, .22 if grooving else .12)
            place(drums, hat(int(.03 * SR), .012, rng), t + b / 4, .08)
            place(drums, hat(int(.03 * SR), .012, rng), t + 3 * b / 4, .08)
        if grooving:
            r = hz(roots[bar_of(t)])                           # bass: the offbeat 8th, the root with an octave jump
            for k, (at, mul) in enumerate(((t + b / 2, 1), (t + 3 * b / 4, 2 if beat_no == 3 else 1))):
                m = int(.16 * SR)
                note = np.sin(2 * np.pi * r * mul * np.arange(m) / SR) + .3 * np.sin(4 * np.pi * r * mul * np.arange(m) / SR)
                place(bass, note * env_exp(m, .09), at, .55 if k == 0 else .35)
        if grooving and beat_no in (0, 2):                     # chord stabs on the & of 1 and 3
            m = int(.22 * SR); ch = chords[bar_of(t)]
            stab = sum(saw(hz(x), m, .004) for x in ch) / 3 * env_exp(m, .12)
            place(music, stab, t + b / 2, .5)
    # the pad: the bar's chord, long and soft, swelling in from silence
    for k in range(-3, int((D - drop) / (4 * b)) + 2):
        t0 = drop + k * 4 * b
        if t0 >= end:
            break
        m = int(4 * b * SR) + int(.1 * SR); ch = chords[k % 4]
        tail = .1
        if t0 + 4 * b > end:                                   # the bar the end card falls in: the pad fades under the ring
            tail = 1.2; m = int((end - t0 + tail) * SR)
        pad = sum(saw(hz(x - 12), m, .006) for x in ch) / 3
        pad *= np.minimum(1, np.arange(m) / (.05 * SR)) * np.minimum(1, (m - np.arange(m)) / (tail * SR))
        place(music, pad, t0, .28)
    # the ending: the last chord rings out from the end card's downbeat
    m = n - int(end * SR)
    if m > 0:
        ch = chords[bar_of(end)]
        ring = sum(saw(hz(x), m, .006) + .5 * saw(hz(x - 12), m, .006) for x in ch) / 4 * env_exp(m, .9)
        place(music, ring, end, .6)
        place(drums, K, end, 1.0); place(drums, C, end, .5)
    # the riser into the three beats: noise, climbing in pitch and level over the bar
    m = int(4 * b * SR); ramp = np.linspace(0, 1, m) ** 2
    place(music, highpass(rng.standard_normal(m), 2000) * ramp * .25, beats_in - 4 * b)
    # the house pump: everything but the kick ducks under each kick and breathes back
    pump = np.ones(n)
    for t in kicks:
        i = int(t * SR); m = min(int(b * SR), n - i)
        if m > 0:
            pump[i:i + m] = np.minimum(pump[i:i + m], 1 - .65 * np.exp(-np.arange(m) / SR / .09))
    # the intro's filter opens toward the drop; the music is darker overall so the effects keep the top end
    intro = np.clip((np.arange(n) / SR) / max(drop, .1), 0, 1)
    music = lowpass(music, 2400) * pump
    music = music * (.35 + .65 * intro)
    mix = drums * .9 + lowpass(bass, 400) * pump + music
    mix = highpass(mix, 30)
    mix /= np.max(np.abs(mix)) + 1e-9
    return (mix * .9).astype(np.float32)

def write_wav(path, x):
    import wave
    st = np.repeat(x[:, None], 2, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())

if __name__ == "__main__":
    sheet = json.load(open(sys.argv[1]))
    write_wav(sys.argv[2], track(sheet))
    print(f"music: {sheet['grid']['bpm']} BPM, drop at {sheet['drop']} s, end card at {sheet['end']} s -> {sys.argv[2]}")
