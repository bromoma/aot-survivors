# python3 dev/music.py [track ...] — composes and renders the game's own music into assets/music/*.ogg.
# Every melody here is written for this project; nothing is sampled or transcribed.
import os, sys
from synth import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'music')

class Song:
    def __init__(self, bpm, beats=4, seconds=120):
        self.beat = 60 / bpm; self.bar = beats * self.beat; self.mix = Mix(seconds)
    def t(self, bar, beat=0): return bar * self.bar + beat * self.beat
    def line(self, inst, bar, notes, oct=0, gain=1.0, pan=0.0, rev=0.3, legato=0.95):
        b = 0.0
        for n, d in notes:
            if n != 'r':
                f = hz(midi(n) + 12 * oct)
                self.mix.add(self.t(bar, b), inst(f, d * self.beat * legato), pan, gain, rev)
            b += d
        return b
    def pads(self, inst, bar, chords, oct=3, gain=1.0, pan=0.0, rev=0.45, beats=None):
        beats = beats or self.bar / self.beat
        for i, c in enumerate(chords):
            for k, m in enumerate(chord_notes(c, oct)):
                self.mix.add(self.t(bar + i), inst(hz(m), beats * self.beat * 0.98), pan + (k - 1) * 0.25, gain, rev)
    def ostinato(self, inst, bar, chords, pattern, oct=3, gain=1.0, pan=0.0, rev=0.2):
        """pattern: list of (chord tone index, beats); index 3 = root an octave up."""
        for i, c in enumerate(chords):
            cn = chord_notes(c, oct); cn = cn + [cn[0] + 12, cn[1] + 12 if len(cn) > 1 else cn[0] + 12]
            b = 0.0
            for idx, d in pattern:
                if idx is not None:
                    self.mix.add(self.t(bar + i, b), inst(hz(cn[idx]), d * self.beat * 0.9, 1.0), pan, gain, rev)
                b += d
    def arp(self, inst, bar, chords, step=0.5, oct=3, gain=1.0, pan=0.0, rev=0.35, shape=(0, 1, 2, 3, 4, 3, 2, 1)):
        for i, c in enumerate(chords):
            cn = chord_notes(c, oct); ext = cn + [m + 12 for m in cn] + [m + 24 for m in cn]
            per = int(round(self.bar / self.beat / step))
            for j in range(per):
                m = ext[shape[j % len(shape)] % len(ext)]
                self.mix.add(self.t(bar + i, j * step), inst(hz(m), step * self.beat), pan, gain, rev)
    def bassline(self, bar, chords, pattern=((0, 2), (0, 2)), oct=2, gain=1.0):
        for i, c in enumerate(chords):
            r = chord_notes(c, oct)[0]; b = 0.0
            for off, d in pattern:
                self.mix.add(self.t(bar + i, b), bass(hz(r + off), d * self.beat * 0.9), 0, gain, 0.08); b += d
    def drums(self, bar, bars, hits, gain=1.0):
        """hits: list of (beat, fn, pan, gain) repeated every bar."""
        for i in range(bars):
            for b, fn, pan, g in hits:
                self.mix.add(self.t(bar + i, b), fn(), pan, gain * g, 0.18)

def P(s):
    """'D5:2 A4:1 r:1' -> [('D5', 2.0), ('A4', 1.0), ('r', 1.0)]"""
    out = []
    for tok in s.split():
        n, d = tok.split(':'); out.append((n, float(d)))
    return out

# ======================================================================= menu: "Wings over the Wall"
def menu():
    s = Song(92, seconds=110)
    A = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A']
    B = ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A']
    mA = P('D5:2 A4:1 D5:0.5 E5:0.5  F5:3 E5:0.5 D5:0.5  C5:2 A4:1 C5:1  E5:3 r:1  D5:1.5 E5:0.5 F5:1 G5:1  A5:2 G5:1 F5:1  G5:1.5 F5:0.5 E5:1 D5:1  C#5:3 r:1')
    mB = P('F5:1 D5:1 F5:1 Bb5:1  A5:2 G5:2  F5:1.5 E5:0.5 D5:2  A4:4  D5:1 F5:1 Bb5:1 A5:1  G5:1.5 E5:0.5 C5:2  E5:2 C#5:1 E5:1  A5:4')
    ost = [(0, 0.5), (0, 0.5), (2, 0.5), (0, 0.5), (3, 0.5), (0, 0.5), (2, 0.5), (0, 0.5)]
    def timp(bar, chords):
        for i, c in enumerate(chords):
            r = chord_notes(c, 2)[0]
            s.mix.add(s.t(bar + i), timpani(hz(r)), -0.2, 0.9, 0.25)
            s.mix.add(s.t(bar + i, 2.5), timpani(hz(r), 0.5), -0.2, 0.6, 0.25)
    bar = 0
    s.ostinato(spiccato, bar, ['Dm'] * 4, ost, 3, 0.9, -0.3); s.mix.add(s.t(0), roll(hz('D2'), s.bar * 2), 0, 0.6); bar += 4
    for sec, mel, inst, oc in ((A, mA, horn, -1), (A, mA, brass, 0), (B, mB, brass, 0), (A, mA, brass, 0)):
        s.ostinato(spiccato, bar, sec, ost, 3, 0.85, -0.3)
        s.pads(strings, bar, sec, 3, 0.5, 0.2)
        s.bassline(bar, sec, ((0, 2), (0, 1.5), (7, 0.5)), 2, 0.9)
        timp(bar, sec)
        s.line(inst, bar, mel, oc, 1.0, 0.1)
        if inst is brass: s.line(strings, bar, mel, oc - 1, 0.5, -0.1)
        if sec is B: s.pads(choir, bar, sec, 4, 0.9, 0.0, 0.6)
        if bar >= 20: s.line(choir, bar, mel, oc, 0.45, 0.0, 0.6)
        s.mix.add(s.t(bar), cymbal(0.5), 0.4, 0.6)
        bar += 8
    s.pads(strings, bar, ['Dm', 'Dm'], 3, 0.7); s.mix.add(s.t(bar), timpani(hz('D2')), 0, 1.0); s.line(brass, bar, P('D5:6'), 0, 0.9)
    s.mix.add(s.t(bar), cymbal(0.8, 2.5), 0.3, 0.7)
    return s.mix.render(s.t(bar + 2))

# ======================================================================= city: "Market Square"
def city():
    s = Song(104, seconds=100)
    A = ['G', 'Em', 'C', 'D', 'G', 'C', 'Am', 'D']
    B = ['G', 'Bm', 'C', 'G', 'Em', 'Am', 'D', 'G']
    mA = P('D5:1 B4:1 G4:1 B4:1  E5:2 D5:1 B4:1  C5:1 E5:1 G5:1 E5:1  F#5:2 A5:1 F#5:1  G5:1.5 F#5:0.5 E5:1 D5:1  E5:1 C5:1 A4:1 C5:1  B4:1 A4:1 G4:1 A4:1  A4:3 r:1')
    mB = P('B4:1 D5:1 G5:2  F#5:1 D5:1 B4:2  C5:1 E5:1 G5:1.5 A5:0.5  G5:3 r:1  E5:1 G5:1 B5:1 G5:1  A5:1.5 G5:0.5 E5:1 C5:1  D5:1 F#5:1 A5:1 F#5:1  G5:3 r:1')
    bar = 0
    s.arp(harp, bar, ['G', 'G'], 0.5, 3, 0.8, -0.3); bar += 2
    for k, (sec, mel) in enumerate(((A, mA), (B, mB), (A, mA), (B, mB))):
        s.arp(harp, bar, sec, 0.5, 3, 0.75, -0.35)
        s.bassline(bar, sec, ((0, 1.5), (7, 0.5), (0, 2)), 2, 0.7)
        if k >= 1: s.pads(pad, bar, sec, 3, 0.35, 0.3)
        if k == 3: s.ostinato(pizz, bar, sec, [(0, 1), (2, 1), (1, 1), (2, 1)], 4, 0.6, 0.4)
        s.line(flute, bar, mel, 0 if k < 3 else 0, 1.0, 0.15, 0.35)
        if k == 2: s.line(strings, bar, mel, -1, 0.45, -0.15)
        if k == 3: s.line(flute, bar, mel, -1, 0.4, -0.2)
        s.drums(bar, 8, [(0, lambda: snare(0.25, 0.05), 0.3, 0.5), (2, lambda: snare(0.25, 0.05), 0.3, 0.4)], 0.6)
        bar += 8
    s.arp(harp, bar, ['G', 'G'], 0.5, 3, 0.7, -0.3); s.pads(pad, bar, ['G', 'G'], 3, 0.4)
    return s.mix.render(s.t(bar + 2))

# ======================================================================= ruins: "Ashes and Embers"
def ruins():
    s = Song(66, seconds=120)
    A = ['Am', 'F', 'Dm', 'E', 'Am', 'C', 'F', 'E']
    B = ['F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E']
    mA = P('E4:2 A4:2  C5:3 B4:1  A4:2 F4:2  G#4:4  A4:1.5 B4:0.5 C5:2  E5:2 D5:1 C5:1  D5:2 C5:1 A4:1  B4:4')
    mB = P('A4:2 C5:2  D5:2 B4:2  C5:1 B4:1 A4:2  E4:4  F4:1 A4:1 C5:2  B4:1 D5:1 G5:2  G#5:2 E5:2  B4:4')
    bar = 0
    s.pads(pad, bar, ['Am', 'Am'], 3, 0.6); s.mix.add(0, bass(hz('A2'), s.bar * 2), 0, 0.4, 0.3); bar += 2
    for k, (sec, mel, oc) in enumerate(((A, mA, -1), (B, mB, -1), (A, mA, 0))):
        s.pads(pad, bar, sec, 3, 0.55, 0.0)
        for i, c in enumerate(sec): s.mix.add(s.t(bar + i), bass(hz(chord_notes(c, 2)[0]), s.bar * 0.95), 0, 0.4, 0.3)
        s.arp(harp, bar, sec, 1, 3, 0.4, 0.4, 0.5, shape=(0, 2, 4, 2))
        s.line(strings, bar, mel, oc, 1.1, -0.1, 0.45)
        if k >= 1: s.pads(choir, bar, sec, 4, 0.7, 0.0, 0.7)
        if k == 2: s.line(choir, bar, mel, 0, 0.5, 0.1, 0.7)
        for i in range(0, 8, 2): s.mix.add(s.t(bar + i), timpani(hz('A2'), 0.45, 1.2), 0, 0.6, 0.5)
        bar += 8
    s.pads(pad, bar, ['Am', 'Am'], 3, 0.55); s.pads(choir, bar, ['Am', 'Am'], 4, 0.6, rev=0.7)
    return s.mix.render(s.t(bar + 2), room=3.4)

# ======================================================================= field: "Beyond the Gate" (6/8, eighth-note units)
def field():
    s = Song(264, beats=6, seconds=80)
    A = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B']
    B = ['C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B']
    mA = P('B4:3 E5:2 F#5:1  G5:4 F#5:1 E5:1  D5:3 B4:3  A4:4 D5:2  E5:2 F#5:1 G5:2 A5:1  B5:4 A5:1 G5:1  A5:2 G5:1 F#5:2 E5:1  D#5:6')
    mB = P('E5:2 G5:1 C6:3  B5:2 A5:1 F#5:3  G5:2 F#5:1 E5:3  B4:6  C5:2 E5:1 G5:3  F#5:2 A5:1 D6:3  D#6:3 B5:3  F#5:6')
    gallop = [(0, 1), (0, 1), (2, 1), (0, 1), (3, 1), (2, 1)]
    hits = [(0, kick, 0, 0.8), (3, kick, 0, 0.6), (2, lambda: snare(0.4, 0.06), 0.3, 0.5), (5, lambda: snare(0.4, 0.06), 0.3, 0.6), (4, lambda: snare(0.25, 0.04), 0.3, 0.35)]
    bar = 0
    s.ostinato(spiccato, bar, ['Em', 'Em'], gallop, 3, 0.9, -0.3); s.drums(bar, 2, hits, 0.8); bar += 2
    for k, (sec, mel) in enumerate(((A, mA), (B, mB), (A, mA), (B, mB), (A, mA))):
        s.ostinato(spiccato, bar, sec, gallop, 3, 0.85, -0.3)
        s.bassline(bar, sec, ((0, 3), (0, 2), (7, 1)), 2, 0.8)
        s.drums(bar, 8, hits, 0.8)
        s.pads(strings, bar, sec, 3, 0.35, 0.25)
        s.line(horn if k == 0 else brass, bar, mel, 0 if k else -1, 1.0, 0.1)
        if k >= 2: s.line(strings, bar, mel, -1 if k % 2 else 0, 0.45, -0.15)
        if k == 4: s.pads(choir, bar, sec, 4, 0.6, rev=0.6)
        s.mix.add(s.t(bar), cymbal(0.5), 0.4, 0.6)
        bar += 8
    s.pads(strings, bar, ['Em'], 3, 0.6); s.line(brass, bar, P('E5:6'), 0, 0.9); s.mix.add(s.t(bar), timpani(hz('E2')), 0, 1)
    return s.mix.render(s.t(bar + 1))

# ======================================================================= boss: "Shifter"
def boss():
    s = Song(138, seconds=80)
    A = ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G']
    mA = P('C4:2 Eb4:1 G4:1  Ab4:3 G4:1  F4:2 Ab4:1 C5:1  B4:4  C5:1.5 D5:0.5 Eb5:2  C5:2 Ab4:2  Bb4:1 D5:1 F5:2  G5:2 F5:1 D5:1')
    ost = [(0, 0.25)] * 4 + [(0, 0.25), (0, 0.25), (2, 0.25), (0, 0.25)] + [(0, 0.25)] * 4 + [(3, 0.25), (0, 0.25), (2, 0.25), (1, 0.25)]
    hits = [(0, kick, 0, 1), (1, lambda: tom(hz('G2')), -0.3, 0.8), (1.5, kick, 0, 0.6), (2, kick, 0, 0.9), (3, lambda: snare(0.7), 0.2, 0.8), (3.5, lambda: tom(hz('C3')), 0.3, 0.6)]
    def stabs(bar, chords):
        for i, c in enumerate(chords):
            for m in chord_notes(c, 4):
                s.mix.add(s.t(bar + i), brass(hz(m), s.beat * 0.4), 0.2, 0.55, 0.3)
                s.mix.add(s.t(bar + i, 1.5), brass(hz(m), s.beat * 0.3), 0.2, 0.4, 0.3)
    bar = 0
    s.ostinato(spiccato, bar, ['Cm'] * 4, ost, 3, 0.9, -0.25); s.drums(bar + 2, 2, hits, 0.9); s.mix.add(0, roll(hz('C2'), s.bar * 2), 0, 0.7); bar += 4
    for k in range(4):
        sec = A if k != 2 else ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G', 'G']
        s.ostinato(spiccato, bar, sec, ost, 3, 0.85, -0.25)
        s.bassline(bar, sec, ((0, 0.75), (0, 0.75), (0, 0.5), (12, 0.5), (0, 0.75), (7, 0.75)), 2, 0.9)
        s.drums(bar, 8, hits, 0.9)
        if k != 2:
            s.line(brass, bar, mA, 0 if k < 3 else 0, 1.0, 0.0)
            s.line(strings, bar, mA, -1, 0.5, -0.2)
            stabs(bar, sec)
        else:
            s.pads(choir, bar, sec, 4, 1.0, rev=0.6); s.pads(strings, bar, sec, 3, 0.6)
        if k >= 1: s.pads(choir, bar, sec, 3, 0.5, rev=0.55)
        s.mix.add(s.t(bar), cymbal(0.7), 0.4, 0.7)
        bar += 8
    s.mix.add(s.t(bar), timpani(hz('C2')), 0, 1); s.pads(brass, bar, ['Cm'], 4, 0.8); s.mix.add(s.t(bar), cymbal(0.9, 2.5), 0.3, 0.7)
    return s.mix.render(s.t(bar + 1))

TRACKS = {'menu_main': menu, 'city_square': city, 'ruins_ashes': ruins, 'field_gate': field, 'boss_shifter': boss}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    pick = sys.argv[1:] or list(TRACKS)
    for name in pick:
        audio = TRACKS[name]()
        write_ogg(os.path.join(OUT, name + '.ogg'), audio, q=3)
        print(name, round(audio.shape[1] / SR, 1), 's')
