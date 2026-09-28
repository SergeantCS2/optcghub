"""A jazz-hop rework of a CC0 jazz recording (the owner, 28 Sept: "I like Jazz the most ... also think samurai
champloo"): the track's own groove, thickened into boom-bap, dusted like a sampled record.

  python jazzhop.py IN OUT.wav [--bpm 90.02 --phase 1.853]      (numpy: run it with the venv python, FFMPEG_PY)

The recording stays as it is (CC0 allows reworking), and only this is added, all made here:
- boom-bap drums on the track's own beat grid (the tempo and the downbeat measured from its onsets): kick on 1,
  a ghost kick on the "a" of 2, kick on the "and" of 3; snare on 2 and 4, laid back 18 ms; swung hats (58 %)
  with a ghost rim before the bar line;
- the record's top end rolled off above 4.5 kHz and lightly saturated, as a sample off vinyl;
- vinyl: sparse crackle and a low hiss;
- the jazz ducks a little under each kick, so the kick sits in it.
No melody, chord or phrase from any other song is used: the style is the reference, not a tune."""
import subprocess, sys, wave
import numpy as np

SR = 48000

def load(path):
    import imageio_ffmpeg
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)

def lowpass(x, fc, order=2):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** (2 * order))[:, None], len(x), axis=0)

def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)

def kick(rng):
    n = int(.42 * SR); t = np.arange(n) / SR
    f = 46 + 85 * np.exp(-t / .03)                          # a round, low boom-bap kick
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .16)
    click = lowpass(rng.standard_normal((n, 1)), 3000)[:, 0] * env(n, .003) * .35
    return np.tanh((body + click) * 1.6) / np.tanh(1.6)

def snare(rng):
    n = int(.3 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 185 * t) * env(n, .05) * .6
    nz = rng.standard_normal(n); nz = lowpass(nz[:, None], 6500)[:, 0] - lowpass(nz[:, None], 900)[:, 0]
    x = tone + nz * env(n, .11) * 1.2
    room = lowpass(rng.standard_normal((int(.12 * SR), 1)), 3000)[:, 0] * env(int(.12 * SR), .035)
    return np.convolve(x, room / np.abs(room).sum() * 6)[:n] * .5 + x * .7

def hat(rng, decay):
    n = int(.09 * SR); nz = rng.standard_normal((n, 1))
    x = (lowpass(nz, 9000) - lowpass(nz, 6000))[:, 0]       # dusty: no air above 9 kHz
    return x * env(n, decay)

def rework(x, bpm, phase):
    rng = np.random.default_rng(11)
    n = len(x); P = 60 / bpm
    drums = np.zeros(n); kicks = []
    K, S, Hc, Ho, R = kick(rng), snare(rng), hat(rng, .018), hat(rng, .05), hat(rng, .01)
    def put(snd, at, g):
        i = int(round(at * SR))
        if 0 <= i < n:
            m = min(len(snd), n - i); drums[i:i + m] += g * snd[:m]
    bar = phase - 4 * P * np.ceil(phase / (4 * P))           # the first bar line at or before the start
    while bar < n / SR:
        for at, g in ((0, 1.0), (1.75 * P, .45), (2.5 * P, .85)):
            put(K, bar + at, g); kicks.append(bar + at)
        for at in (1 * P, 3 * P):
            put(S, bar + at + .018, .8)
        put(R, bar + 3.75 * P, .25)
        for b in range(4):
            put(Hc, bar + b * P, .32 if b % 2 == 0 else .26)
            put(Ho if b == 3 else Hc, bar + b * P + .58 * P, .2)   # swung offbeats
        bar += 4 * P
    # the record, dusted: top end rolled off, a touch of tape drive
    rec = lowpass(x, 4500, 2)
    rec = np.tanh(rec * 1.4) / np.tanh(1.4)
    duck = np.ones(n)
    for t in kicks:
        i = int(t * SR); m = min(int(.18 * SR), n - i)
        if 0 <= i and m > 0:
            duck[i:i + m] = np.minimum(duck[i:i + m], 1 - .22 * env(m, .07))
    # vinyl: sparse clicks and a low hiss
    crackle = np.zeros(n); k = rng.poisson(9 * n / SR)
    for i, a in zip(rng.integers(0, n, k), rng.uniform(.05, .35, k)):
        crackle[i:i + 24] += a * rng.standard_normal(min(24, n - i)) * np.exp(-np.arange(min(24, n - i)) / 5)
    hiss = lowpass(rng.standard_normal((n, 1)), 5000)[:, 0] * .006
    vinyl = lowpass((crackle + hiss)[:, None], 7000)[:, 0] * .5
    drums = lowpass(drums[:, None], 10000)[:, 0]
    out = rec * duck[:, None] * .85 + (drums * .55 + vinyl)[:, None]
    return out / (np.max(np.abs(out)) + 1e-9) * .9

if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    x = load(a[0]); y = rework(x, opt("--bpm", 90.02), opt("--phase", 1.853))
    with wave.open(a[1], "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"jazzhop: {a[0]} -> {a[1]} ({len(y) / SR:.1f} s)")
