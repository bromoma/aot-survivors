# python3 dev/gen_ground.py — draws the seamless ground tiles of the world (grass, dry grass, dirt road, cobblestones)
# into assets/ground/. Everything is procedural, so the art belongs to this project.
import os, random, math
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'ground')
os.makedirs(OUT, exist_ok=True)
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

def hexc(h):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def noise(size, period, seed):
    rnd = random.Random(seed); g = [[rnd.random() for _ in range(period)] for _ in range(period)]
    cell = size / period; out = [[0.0] * size for _ in range(size)]
    for y in range(size):
        gy = y / cell; y0 = int(gy) % period; y1 = (y0 + 1) % period; fy = gy - int(gy); fy = fy * fy * (3 - 2 * fy)
        for x in range(size):
            gx = x / cell; x0 = int(gx) % period; x1 = (x0 + 1) % period; fx = gx - int(gx); fx = fx * fx * (3 - 2 * fx)
            a = g[y0][x0] + (g[y0][x1] - g[y0][x0]) * fx; b = g[y1][x0] + (g[y1][x1] - g[y1][x0]) * fx
            out[y][x] = a + (b - a) * fy
    return out

def fbm(size, periods, seed):
    layers = [noise(size, p, seed + i * 17) for i, p in enumerate(periods)]
    w = [0.55, 0.3, 0.15, 0.08][:len(periods)]; tw = sum(w)
    return [[sum(layers[i][y][x] * w[i] for i in range(len(layers))) / tw for x in range(size)] for y in range(size)]

def shade_pick(pal, v, x, y):
    t = v * (len(pal) - 1) + (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.9
    return pal[max(0, min(len(pal) - 1, int(round(t))))]

def grassy(name, size, pal, flower_rate, flowers, seed, clover=False):
    rnd = random.Random(seed)
    n = fbm(size, [8, 24, 48, 96], seed)
    im = Image.new('RGB', (size, size)); px = im.load()
    lo = min(min(r) for r in n); hi = max(max(r) for r in n)
    for y in range(size):
        for x in range(size):
            v = 0.5 + ((n[y][x] - lo) / (hi - lo) - 0.5) * 0.7 + (rnd.random() - 0.5) * 0.45
            px[x, y] = shade_pick(pal, max(0, min(1, v)), x, y)
    for _ in range(size * size // 6):
        x, y = rnd.randrange(size), rnd.randrange(size); h = rnd.choice((2, 2, 3))
        c = pal[0] if rnd.random() < 0.55 else pal[-1]
        for k in range(h): px[x, (y - k) % size] = c
        if rnd.random() < 0.3: px[(x + 1) % size, (y - h + 1) % size] = c
    if clover:
        for _ in range(size // 6):
            cx, cy = rnd.randrange(size), rnd.randrange(size)
            for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0), (0, -1)):
                if rnd.random() < 0.8: px[(cx + dx) % size, (cy + dy) % size] = pal[1]
    for _ in range(int(size * size * flower_rate)):
        x, y = rnd.randrange(size), rnd.randrange(size)
        px[x, y] = rnd.choice(flowers); px[x, (y + 1) % size] = pal[0]
    im.save(os.path.join(OUT, name + '.png'))

def dirt(name, size, pal, seed):
    rnd = random.Random(seed)
    n = fbm(size, [8, 24, 48, 96], seed)
    lo = min(min(r) for r in n); hi = max(max(r) for r in n)
    im = Image.new('RGB', (size, size)); px = im.load()
    for y in range(size):
        for x in range(size):
            v = 0.5 + ((n[y][x] - lo) / (hi - lo) - 0.5) * 0.75 + (rnd.random() - 0.5) * 0.4
            px[x, y] = shade_pick(pal, max(0, min(1, v)), x, y)
    stones = [hexc('#d8c8a8'), hexc('#bcae94'), hexc('#a89c88')]
    for _ in range(size * size // 70):
        x, y = rnd.randrange(size), rnd.randrange(size); c = rnd.choice(stones); w = rnd.choice((1, 2, 2, 3))
        for k in range(w): px[(x + k) % size, y] = c
        for k in range(w): px[(x + k) % size, (y + 1) % size] = pal[0]
    im.save(os.path.join(OUT, name + '.png'))

def cobbles(name, size, cells, stone_pals, mortar, seed, moss=None):
    rnd = random.Random(seed)
    pts = []
    for j in range(cells):
        for i in range(cells):
            pts.append(((i + 0.5 + rnd.uniform(-0.32, 0.32)) * size / cells, (j + 0.5 + rnd.uniform(-0.32, 0.32)) * size / cells, rnd.choice(stone_pals), rnd.random()))
    im = Image.new('RGB', (size, size)); px = im.load()
    def tor(a, b):
        d = abs(a - b); return min(d, size - d)
    def tsign(a, b):
        d = a - b
        if d > size / 2: d -= size
        if d < -size / 2: d += size
        return d
    n = fbm(size, [8, 16, 32], seed + 5)
    for y in range(size):
        for x in range(size):
            best = second = 1e9; bp = None
            for p in pts:
                d = math.hypot(tor(x, p[0]), tor(y, p[1]))
                if d < best: second = best; best = d; bp = p
                elif d < second: second = d
            edge = second - best
            cr = size / cells * 0.62 * (0.85 + bp[3] * 0.3)
            if edge < 1.8 or best > cr:
                c = mortar[0] if (x + y) % 3 else mortar[1]
                if moss and rnd.random() < 0.18: c = rnd.choice(moss)
                px[x, y] = c; continue
            pal = bp[2]
            dx, dy = tsign(x, bp[0]), tsign(y, bp[1])
            r = math.hypot(dx, dy) or 1
            q = min(1, best / cr)
            v = 0.55 + (n[y][x] - 0.5) * 0.6 + (bp[3] - 0.5) * 0.3 - (dx + dy) / (cr * 2.2) * (0.4 + q * 0.5)
            if min(edge - 1.8, cr - best) < 1.5: v -= 0.25 if dx + dy > 0 else -0.05
            px[x, y] = shade_pick(pal, max(0, min(1, v)), x, y)
    im.save(os.path.join(OUT, name + '.png'))

G = [hexc(c) for c in ('#2f7426', '#3c8a2c', '#4a9c32', '#58ac38', '#68ba40', '#7cc84c')]
G3 = [hexc(c) for c in ('#3d6e24', '#4d8230', '#5c9236', '#6ca23e', '#7eb048', '#92bc56')]
grassy('grass', 192, G, 0.0016, [hexc('#f4f0e0'), hexc('#f8d860'), hexc('#e8a0c8')], 11)
grassy('grass3', 192, G3, 0.0008, [hexc('#f4f0e0'), hexc('#f0d070')], 23, clover=True)
dirt('path', 192, [hexc(c) for c in ('#8c5e2c', '#a06c34', '#b27c40', '#c08c4c', '#cc9a5a')], 31)
stone = [[hexc(c) for c in ('#5a5c60', '#6e7074', '#828488', '#96989a', '#acadae')],
         [hexc(c) for c in ('#625e58', '#76726a', '#8a867e', '#9e9a92', '#b2aea6')],
         [hexc(c) for c in ('#585e64', '#6c7278', '#80868c', '#949a9e', '#a8aeb2')]]
cobbles('paving_a', 160, 7, stone, [hexc('#7a6a4c'), hexc('#6a5a40')], 41)
cobbles('paving_b', 160, 10, stone, [hexc('#6e6250'), hexc('#5e5444')], 43, moss=[hexc('#5a7a34'), hexc('#4a6a2c')])
cobbles('paving_c', 160, 9, stone[:2], [hexc('#7a6a4c'), hexc('#6a5a40')], 47)
print('ok')
