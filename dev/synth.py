# Small offline synthesizer used by dev/music.py and dev/sfx.py (numpy only).
# Wavetable instruments, drums, an FFT reverb and an OGG writer. All sounds of the game are made here.
import math, os, subprocess
import numpy as np

SR = 44100
TS = 4096
FF = os.path.join(os.path.expanduser('~'), 'bin', 'ffmpeg')
rng = np.random.default_rng(11)

NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def midi(n):
    if isinstance(n, (int, float)): return n
    m = NAMES[n[0]]; rest = n[1:]
    while rest and rest[0] in '#b':
        m += 1 if rest[0] == '#' else -1; rest = rest[1:]
    return m + 12 * (int(rest) + 1)

def hz(n): return 440.0 * 2 ** ((midi(n) - 69) / 12)

_tables = {}
def table(kind, f):
    nh = max(1, min(48, int(15000 / max(f, 20))))
    key = (kind, nh, int(f) if kind == 'choir' else 0)
    if key in _tables: return _tables[key]
    x = np.arange(TS) / TS
    t = np.zeros(TS)
    for k in range(1, nh + 1):
        if kind == 'saw': w = 1 / k
        elif kind == 'dark': w = 1 / k ** 1.45
        elif kind == 'reed': w = (1 / k) * (1.0 if k % 2 else 0.35)
        elif kind == 'brass_lo': w = [1, 0.55, 0.32, 0.18, 0.1, 0.05, 0.03, 0.02][k - 1] if k <= 8 else 0
        elif kind == 'brass_hi': w = 1 / k ** 0.75
        elif kind == 'flute': w = [1, 0.22, 0.07, 0.03][k - 1] if k <= 4 else 0
        elif kind == 'harp': w = [1, 0.45, 0.25, 0.14, 0.07, 0.04][k - 1] if k <= 6 else 0
        elif kind == 'organ': w = {1: 1, 2: 0.5, 3: 0.3, 4: 0.25, 6: 0.12, 8: 0.1}.get(k, 0)
        elif kind == 'choir':
            fk = k * f
            w = (1.0 * math.exp(-((fk - 720) / 160) ** 2) + 0.55 * math.exp(-((fk - 1150) / 190) ** 2) + 0.22 * math.exp(-((fk - 2700) / 300) ** 2) + 0.25 * math.exp(-((fk - 300) / 200) ** 2)) / k ** 0.3
        else: w = 1 if k == 1 else 0
        if w: t += w * np.sin(2 * np.pi * k * x)
    t /= max(1e-9, np.abs(t).max())
    _tables[key] = t
    return t

def osc(kind, f, n, vib=0.0, vib_rate=5.2, vib_delay=0.25, detune=0.0):
    t = np.arange(n) / SR
    fr = np.full(n, f * 2 ** (detune / 1200))
    if vib:
        ramp = np.clip((t - vib_delay) / 0.4, 0, 1)
        fr = fr * (1 + vib * ramp * np.sin(2 * np.pi * vib_rate * t + rng.uniform(0, 6.28)))
    ph = (np.cumsum(fr) / SR + rng.uniform(0, 1)) % 1.0
    return table(kind, f)[(ph * TS).astype(np.int64) % TS]

def adsr(n, a, d, s, r, hold):
    """hold = seconds the key is held; n = total samples (hold + release)."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    lvl_at_rel = np.interp(hold, t, e) if hold < t[-1] else e[-1]
    rel = t >= hold
    e[rel] = lvl_at_rel * np.exp(-(t[rel] - hold) / max(r, 1e-4) * 3)
    return e

def soft_lp(x, k):
    """cheap one-pole low-pass, k in (0,1]: smaller = darker."""
    y = np.empty_like(x); acc = 0.0
    # vectorised via cumulative filter is not trivial; use FFT mask instead for long signals
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    fc = k * SR / 2
    X *= 1 / np.sqrt(1 + (fr / fc) ** 4)
    return np.fft.irfft(X, len(x))

def band(x, lo, hi):
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(fr)
    if lo: m *= 1 / np.sqrt(1 + (lo / np.maximum(fr, 1)) ** 4)
    if hi: m *= 1 / np.sqrt(1 + (fr / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

def noise(n): return rng.uniform(-1, 1, n)

# ---------- instruments: (freq, seconds held, velocity) -> mono signal incl. release ----------
def strings(f, d, v=1.0, a=0.12, r=0.35):
    n = int((d + r * 1.2) * SR)
    x = osc('dark', f, n, vib=0.004, detune=-5) + osc('dark', f, n, vib=0.004, detune=6) + 0.5 * osc('saw', f, n, vib=0.003, detune=0)
    return x * adsr(n, a, 0.4, 0.85, r, d) * v * 0.28

def pad(f, d, v=1.0): return strings(f, d, v, a=0.5, r=0.8)

def spiccato(f, d, v=1.0):
    n = int((d + 0.08) * SR)
    x = osc('dark', f, n, detune=-4) + osc('saw', f, n, detune=5) * 0.6
    return x * adsr(n, 0.004, 0.09, 0.25, 0.06, d) * v * 0.3

def pizz(f, d, v=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = osc('dark', f, n) * np.exp(-t / 0.13) + 0.3 * osc('sine', f * 2, n) * np.exp(-t / 0.05)
    return x * np.minimum(1, t / 0.002) * v * 0.45

def brass(f, d, v=1.0):
    n = int((d + 0.2) * SR)
    e = adsr(n, 0.04, 0.25, 0.8, 0.18, d)
    lo = osc('brass_lo', f, n, vib=0.005, vib_delay=0.35, detune=-3) + osc('brass_lo', f, n, vib=0.005, vib_delay=0.35, detune=4)
    hi = osc('brass_hi', f, n, vib=0.005, vib_delay=0.35)
    br = np.clip(e * 1.15, 0, 1) ** 1.5
    return (lo * (1 - br * 0.6) + hi * br * 0.7) * e * v * 0.3

def horn(f, d, v=1.0):
    n = int((d + 0.25) * SR)
    e = adsr(n, 0.07, 0.3, 0.85, 0.22, d)
    x = osc('brass_lo', f, n, vib=0.004, vib_delay=0.4, detune=-3) + osc('brass_lo', f, n, vib=0.004, vib_delay=0.4, detune=3)
    return soft_lp(x * e, 0.18) * v * 0.33

def choir(f, d, v=1.0):
    n = int((d + 0.9) * SR)
    x = sum(osc('choir', f, n, vib=0.007, vib_rate=4.8 + i * 0.4, vib_delay=0.1, detune=dt) for i, dt in enumerate((-9, 0, 8)))
    return x * adsr(n, 0.45, 0.5, 0.9, 0.7, d) * v * 0.16

def flute(f, d, v=1.0):
    n = int((d + 0.15) * SR)
    e = adsr(n, 0.05, 0.2, 0.85, 0.1, d)
    x = osc('flute', f, n, vib=0.009, vib_delay=0.3)
    br = band(noise(n), f * 0.8, f * 3) * 0.12
    return (x + br) * e * v * 0.32

def harp(f, d, v=1.0):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = osc('harp', f, n) * np.exp(-t / 0.7) + 0.4 * osc('sine', f * 3, n) * np.exp(-t / 0.12)
    return x * np.minimum(1, t / 0.0015) * v * 0.32

def bell(f, d, v=1.0, tail=1.2):
    n = int(tail * SR)
    t = np.arange(n) / SR
    x = sum(w * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (tail * dk)) for m, w, dk in ((1, 1, 0.5), (2.01, 0.5, 0.3), (3.0, 0.3, 0.2), (4.16, 0.25, 0.12), (5.43, 0.15, 0.08)))
    return x * np.minimum(1, t / 0.001) * v * 0.3

def bass(f, d, v=1.0):
    n = int((d + 0.12) * SR)
    x = osc('sine', f, n) + 0.35 * osc('sine', 2 * f, n) + 0.12 * osc('dark', f, n)
    return x * adsr(n, 0.01, 0.3, 0.8, 0.1, d) * v * 0.4

def timpani(f, v=1.0, tau=0.7):
    n = int(tau * 2.6 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 0.08 * np.exp(-t / 0.05))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / tau) + 0.45 * np.sin(2 * np.pi * np.cumsum(fr * 1.5) / SR) * np.exp(-t / (tau * 0.4))
    hit = band(noise(n), 80, 1200) * np.exp(-t / 0.03) * 0.5
    return (x + hit) * v * 0.55

def kick(v=1.0):
    n = int(0.4 * SR); t = np.arange(n) / SR
    fr = 45 + 70 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.16) * v * 0.8

def snare(v=1.0, tau=0.12):
    n = int(0.45 * SR); t = np.arange(n) / SR
    x = band(noise(n), 900, 7000) * np.exp(-t / tau) + 0.5 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return x * v * 0.45

def tom(f, v=1.0):
    n = int(0.7 * SR); t = np.arange(n) / SR
    fr = f * (1 + 0.35 * np.exp(-t / 0.04))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.22) + band(noise(n), 100, 2000) * np.exp(-t / 0.025) * 0.3
    return x * v * 0.6

def cymbal(v=1.0, tau=1.6):
    n = int(tau * 2.5 * SR); t = np.arange(n) / SR
    x = band(noise(n), 4500, 16000) * np.exp(-t / tau) * np.minimum(1, t / 0.003)
    return x * v * 0.35

def roll(f, dur, v=1.0):
    """timpani roll: fast soft hits with a crescendo."""
    n = int((dur + 1.5) * SR); out = np.zeros(n)
    k = int(dur / 0.06)
    for i in range(k):
        s = timpani(f, v * (0.25 + 0.75 * i / max(1, k - 1)) * 0.5, tau=0.25)
        p = int(i * 0.06 * SR); m = min(len(s), n - p); out[p:p + m] += s[:m]
    return out

# ---------- mixing ----------
class Mix:
    def __init__(self, seconds):
        self.n = int((seconds + 4) * SR)
        self.dry = np.zeros((2, self.n)); self.send = np.zeros((2, self.n))
    def add(self, t, sig, pan=0.0, gain=1.0, rev=0.25):
        p = int(t * SR)
        if p >= self.n: return
        m = min(len(sig), self.n - p)
        a = (pan + 1) * math.pi / 4
        l, r = math.cos(a) * gain, math.sin(a) * gain
        self.dry[0, p:p + m] += sig[:m] * l; self.dry[1, p:p + m] += sig[:m] * r
        if rev:
            self.send[0, p:p + m] += sig[:m] * l * rev; self.send[1, p:p + m] += sig[:m] * r * rev
    def render(self, length, room=2.6, fade=2.5, peak=0.93, lufs_rms=-21.0):
        ir_n = int(room * SR); t = np.arange(ir_n) / SR
        out = self.dry.copy()
        N = 1 << int(math.ceil(math.log2(self.n + ir_n)))
        for c in range(2):
            ir = rng.normal(size=ir_n) * np.exp(-t / (room / 5.5))
            ir[: int(0.012 * SR)] = 0
            ir = soft_lp(ir, 0.35)
            ir /= np.sqrt((ir ** 2).sum()) * 1.6
            wet = np.fft.irfft(np.fft.rfft(self.send[c], N) * np.fft.rfft(ir, N), N)[: self.n]
            out[c] += wet
        end = int((length + fade) * SR)
        out = out[:, :end]
        f0 = int(length * SR)
        out[:, f0:] *= np.linspace(1, 0, end - f0) ** 2
        out -= out.mean(axis=1, keepdims=True)
        for c in range(2): out[c] = band(out[c], 32, 0)
        out /= max(1e-9, np.percentile(np.abs(out), 99.97))
        out = np.tanh(out * 0.85) / np.tanh(0.85)
        rms = np.sqrt((out ** 2).mean())
        out *= (10 ** (lufs_rms / 20)) / max(rms, 1e-9)
        top = np.abs(out).max()
        if top > peak: out *= peak / top
        return out

def write_ogg(path, stereo, q=4):
    data = np.ascontiguousarray(stereo.T.astype(np.float32)).tobytes()
    ch = stereo.shape[0] if stereo.ndim == 2 else 1
    subprocess.run([FF, '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-', '-c:a', 'libvorbis', '-q:a', str(q), path], input=data, check=True)

CHORD = {'': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10), 'maj7': (0, 4, 7, 11), 'sus4': (0, 5, 7), 'sus2': (0, 2, 7), 'dim': (0, 3, 6), '5': (0, 7)}

def chord_notes(name, octave=3):
    root = name[0]; rest = name[1:]
    if rest[:1] in ('#', 'b'): root += rest[0]; rest = rest[1:]
    base = midi(root + str(octave))
    return [base + i for i in CHORD[rest]]
