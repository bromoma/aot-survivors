# python3 dev/sfx.py — synthesizes every file-based sound effect of the game into assets/sfx/*.ogg
# (UI clicks, chimes, blade cuts, metal, impacts, the victory fanfare...). Same file names the game already loads.
import os
from synth import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sfx')

def norm(x, peak=0.85):
    x = x - x.mean()
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x

def env_exp(n, tau, att=0.002):
    t = np.arange(n) / SR
    return np.minimum(1, t / att) * np.exp(-t / tau)

def sweep(f0, f1, dur, kind='sine'):
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) if kind == 'sine' else np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR))

def mono(x, peak=0.85): return norm(x, peak)

# average loudness (dB RMS) each sound is matched to, so the in-game balance stays as tuned
LEVEL = {'bong': -16.2, 'cast_01': -24.8, 'cast_02': -24.7, 'chime': -22.6, 'click': -16.2, 'close': -14.2, 'confirm': -12.5, 'cut': -26.3,
         'error': -18.7, 'fall': -21.9, 'maul': -20.0, 'metal': -28.0, 'open': -14.2, 'thump': -27.4}

def save(name, x, peak=0.85):
    x = mono(x, 1.0)
    key = name if name in LEVEL else name.split('_')[0]
    rms = np.sqrt((x ** 2).mean())
    if key in LEVEL and rms > 0: x = x * (10 ** (LEVEL[key] / 20) / rms)
    top = np.abs(x).max()
    if top > 0.97: x = np.tanh(x / top * 1.4) / np.tanh(1.4) * 0.97
    write_ogg(os.path.join(OUT, name + '.ogg'), x[None, :], q=5)

def place(total, parts):
    out = np.zeros(int(total * SR))
    for t, s, g in parts:
        p = int(t * SR); m = min(len(s), len(out) - p)
        if m > 0: out[p:p + m] += s[:m] * g
    return out

def ui():
    n = int(0.03 * SR); t = np.arange(n) / SR
    save('click', np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.006) + band(noise(n), 2000, 8000) * np.exp(-t / 0.003) * 0.4, 0.6)
    n = int(0.38 * SR); t = np.arange(n) / SR
    leather = band(noise(n), 300, 2500) * np.exp(-t / 0.04)
    open_ = band(noise(n), 500, 4000) * np.sin(np.pi * np.clip(t / 0.3, 0, 1)) * 0.5 + place(0.38, [(0.02, leather, 0.8), (0.0, bell(hz('G5'), 0, 0.6, 0.35), 0.25)])
    save('open', open_, 0.6)
    close = band(noise(n), 300, 2500) * np.sin(np.pi * np.clip(t / 0.25, 0, 1)) * 0.5 + place(0.38, [(0.16, leather, 0.9), (0.12, bell(hz('D5'), 0, 0.5, 0.3), 0.2)])
    save('close', close, 0.6)
    save('confirm', place(0.35, [(0, bell(hz('G5'), 0, 1, 0.35), 1), (0.09, bell(hz('D6'), 0, 1, 0.3), 1)]), 0.6)
    n = int(0.5 * SR); t = np.arange(n) / SR
    buzz = lambda f, d: np.tanh(3 * np.sin(2 * np.pi * f * t[: int(d * SR)])) * env_exp(int(d * SR), d / 2.5, 0.004)
    save('error', place(0.5, [(0, buzz(220, 0.18), 1), (0.17, buzz(165, 0.3), 1)]), 0.5)
    n = int(0.15 * SR); t = np.arange(n) / SR
    clink = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dk) for f, dk in ((2350, 0.05), (3910, 0.03), (5770, 0.02)))
    save('bong', clink, 0.55)
    for i, nm in enumerate(('C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7')):
        save('chime_%d' % i, place(0.42 - i * 0.015, [(0, bell(hz(nm), 0, 1, 0.42 - i * 0.015), 1), (0, bell(hz(nm) * 2, 0, 1, 0.25), 0.35)]), 0.55)

def blades():
    for i, (lo, hi, tau, thud_f) in enumerate(((700, 5200, 0.09, 140), (900, 6500, 0.07, 120), (600, 4200, 0.06, 160))):
        n = int(0.55 * SR); t = np.arange(n) / SR
        swish = band(noise(n), lo, hi) * np.exp(-((t - 0.04) / 0.05) ** 2)
        flesh = band(noise(n), 150, 1400) * np.exp(-np.maximum(0, t - 0.07) / tau) * (t > 0.07)
        thud = np.sin(2 * np.pi * thud_f * t) * np.exp(-np.maximum(0, t - 0.07) / 0.12) * (t > 0.07)
        save('cut_%02d' % (i + 1), swish * 0.7 + flesh * 0.9 + thud * 0.6, 0.8)
    for i, base in enumerate((1150, 1530, 1870)):
        n = int(0.4 * SR); t = np.arange(n) / SR
        ring = sum(w * np.sin(2 * np.pi * base * m * t) * np.exp(-t / dk) for m, w, dk in ((1, 1, 0.12), (2.76, 0.6, 0.07), (5.4, 0.4, 0.04), (8.9, 0.25, 0.02)))
        hit = band(noise(n), 2000, 12000) * np.exp(-t / 0.008)
        save('metal_%02d' % (i + 1), ring + hit * 0.6, 0.7)

def impacts():
    for i, f in enumerate((62, 55, 70)):
        n = int(0.56 * SR); t = np.arange(n) / SR
        fr = f * (1 + 0.8 * np.exp(-t / 0.03))
        body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.15)
        dirt = band(noise(n), 80, 900) * np.exp(-t / 0.06)
        save('thump_%02d' % (i + 1), body + dirt * 0.6, 0.85)
    n = int(1.3 * SR); t = np.arange(n) / SR
    crash = band(noise(n), 60, 1800) * np.exp(-t / 0.35) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) ** 2)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5)
    save('fall', place(1.3, [(0, band(noise(int(0.3 * SR)), 1500, 6000) * np.linspace(0, 1, int(0.3 * SR)) * 0.3, 1), (0.25, crash, 1), (0.25, boom, 1.2)]), 0.85)
    n = int(0.62 * SR); t = np.arange(n) / SR
    grind = band(noise(n), 120, 1100) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 14 * t))) * np.exp(-t / 0.2)
    growl = np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(70 + 15 * np.sin(2 * np.pi * 6 * t)) / SR)) * np.exp(-t / 0.25)
    save('maul', grind + growl * 0.5, 0.85)

def casts():
    for i, (f0, f1) in enumerate(((300, 1400), (420, 1800))):
        dur = 1.15; n = int(dur * SR); t = np.arange(n) / SR
        rise = band(noise(n), 600, 7000) * np.sin(np.pi * t / dur) ** 2 * 0.45
        tone = sweep(f0, f1, dur) * np.sin(np.pi * t / dur) * 0.35
        sparkle = place(dur, [(0.15 * k, bell(hz(m), 0, 0.7, 0.4), 0.5) for k, m in enumerate(('E6', 'G6', 'B6', 'E7', 'G7')[: 4 + i])])
        save('cast_%02d' % (i + 1), rise + tone + sparkle, 0.75)

def victory():
    s = 60 / 112
    m = Mix(9)
    fan = [('D4', 0, 0.5), ('D4', 0.5, 0.25), ('D4', 0.75, 0.25), ('A4', 1, 1), ('F#4', 2, 0.5), ('A4', 2.5, 0.5), ('D5', 3, 3.5)]
    for nm, b, d in fan:
        for k, sh in enumerate((0, -12)):
            m.add(b * s, brass(hz(midi(nm) + sh), d * s * 0.95), (-0.2 if k else 0.2), 1.0 if k == 0 else 0.6, 0.35)
    for nm in ('D3', 'F#3', 'A3'):
        m.add(3 * s, strings(hz(nm), 3.5 * s), 0, 0.6, 0.45)
    m.add(0, roll(hz('D2'), 2.8 * s), 0, 0.6, 0.3)
    m.add(3 * s, timpani(hz('D2')), 0, 1.1, 0.3)
    m.add(3 * s, cymbal(0.9, 2.2), 0.3, 0.8, 0.4)
    for k, nm in enumerate(('D6', 'F#6', 'A6', 'D7')):
        m.add(3 * s + 0.12 * k, bell(hz(nm), 0, 0.5, 1.5), 0.4, 0.35, 0.5)
    write_ogg(os.path.join(OUT, 'victory.ogg'), m.render(6.4, fade=0.6, lufs_rms=-23), q=5)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    ui(); blades(); impacts(); casts(); victory()
    print('ok', len([f for f in os.listdir(OUT) if f.endswith('.ogg')]), 'files')
