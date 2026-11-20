# python3 dev/cut_kit.py <sheet.png> <out_dir> <name1,name2,...> [px]
# Cuts a ChatGPT UI-kit sheet drawn on flat magenta: finds every part, orders them row by row,
# removes the magenta and shrinks each part to its pixel-art grid (px = size of one art pixel).
import sys, os
from collections import deque
from PIL import Image

src, out, names = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
force_px = float(sys.argv[4]) if len(sys.argv) > 4 else 0
im = Image.open(src).convert('RGBA')
W, H = im.size
px = im.load()

def is_bg(c):
    r, g, b, a = c
    return a < 20 or (r > 140 and b > 140 and g < 120 and abs(r - b) < 90) or (r - g > 70 and b - g > 70 and min(r, b) > 110)

for y in range(H):
    for x in range(W):
        if is_bg(px[x, y]): px[x, y] = (0, 0, 0, 0)
# magenta fringe: tinted pixels next to the background
for _ in range(2):
    kill = []
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            r, g, b, a = px[x, y]
            if a and r - g > 45 and b - g > 45 and any(px[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                kill.append((x, y))
    for q in kill: px[q] = (0, 0, 0, 0)

S = 3
mw, mh = W // S, H // S
mask = [[px[x * S + 1, y * S + 1][3] > 0 for x in range(mw)] for y in range(mh)]
seen = [[False] * mw for _ in range(mh)]
boxes = []
for y in range(mh):
    for x in range(mw):
        if not mask[y][x] or seen[y][x]: continue
        q = deque([(x, y)]); seen[y][x] = True
        x0 = x1 = x; y0 = y1 = y; n = 0
        while q:
            cx, cy = q.popleft(); n += 1
            x0 = min(x0, cx); x1 = max(x1, cx); y0 = min(y0, cy); y1 = max(y1, cy)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < mw and 0 <= ny < mh and mask[ny][nx] and not seen[ny][nx]:
                    seen[ny][nx] = True; q.append((nx, ny))
        if n > 60: boxes.append([x0 * S, y0 * S, (x1 + 1) * S, (y1 + 1) * S, n])

boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
rows = []
for b in boxes:
    cy = (b[1] + b[3]) / 2
    if rows and abs(cy - rows[-1][0]) < (b[3] - b[1]) * 0.6 + 20:
        rows[-1][1].append(b)
    else:
        rows.append([cy, [b]])
ordered = [b for _, r in rows for b in sorted(r, key=lambda b: b[0])]
print('found', len(ordered), 'parts in', len(rows), 'rows; names', len(names))

def estimate(img):
    w, h = img.size; d = img.load(); runs = {}
    for y in range(0, h, 2):
        run = 0; prev = None
        for x in range(w):
            c = d[x, y]
            if c[3] < 128:
                if run: runs[run] = runs.get(run, 0) + 1
                run = 0; prev = None; continue
            if prev and all(abs(c[i] - prev[i]) < 18 for i in range(3)): run += 1
            else:
                if run: runs[run] = runs.get(run, 0) + 1
                run = 1
            prev = c
    best, score = 1, -1
    for s in range(2, 16):
        sc = sum(n for r, n in runs.items() if r >= s - 1 and abs(r / s - round(r / s)) < 0.18) * s
        if sc > score: best, score = s, sc
    return best

def shrink(img, s):
    w, h = img.size; tw, th = max(1, round(w / s)), max(1, round(h / s))
    d = img.load(); o = Image.new('RGBA', (tw, th)); od = o.load()
    for ty in range(th):
        for tx in range(tw):
            xa, xb = int(tx * w / tw), max(int(tx * w / tw) + 1, int((tx + 1) * w / tw))
            ya, yb = int(ty * h / th), max(int(ty * h / th) + 1, int((ty + 1) * h / th))
            cnt = {}; op = tot = 0
            for yy in range(ya, yb):
                for xx in range(xa, xb):
                    c = d[xx, yy]; tot += 1
                    if c[3] < 128: continue
                    op += 1
                    k = (c[0] >> 3, c[1] >> 3, c[2] >> 3)
                    e = cnt.setdefault(k, [0, 0, 0, 0]); e[0] += 1; e[1] += c[0]; e[2] += c[1]; e[3] += c[2]
            if op / tot < 0.5: continue
            e = max(cnt.values(), key=lambda e: e[0])
            od[tx, ty] = (e[1] // e[0], e[2] // e[0], e[3] // e[0], 255)
    return o

os.makedirs(out, exist_ok=True)
crops = [im.crop((b[0], b[1], b[2], b[3])) for b in ordered]
s = force_px or estimate(max(crops, key=lambda c: c.size[0] * c.size[1]))
print('pixel size', s)
for i, c in enumerate(crops):
    name = names[i] if i < len(names) else 'extra%d' % i
    r = shrink(c, s)
    if len(sys.argv) > 5:
        a = r.getchannel('A'); q = r.convert('RGB').quantize(colors=int(sys.argv[5]), method=Image.Quantize.MEDIANCUT).convert('RGB'); q.putalpha(a); r = q
    r.save(os.path.join(out, name + '.png'))
    print(name, c.size, '->', r.size)
