import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image


def is_bg(r, g, b):
    if r > 120 and b > 120 and g < 90 and abs(r - b) < 110:
        return True
    mx, mn = max(r, g, b), min(r, g, b)
    if mx < 60:
        return False
    sat = (mx - mn) / mx
    if sat > 0.55 and g == mn and r > g + 70 and b > g + 70:
        return True
    return False


def mask_of(im):
    w, h = im.size
    px = im.load()
    m = [[False] * w for _ in range(h)]
    for y in range(h):
        row = m[y]
        for x in range(w):
            r, g, b = px[x, y][:3]
            row[x] = not is_bg(r, g, b)
    return m


def segments(m, w, h, min_gap=6, min_width=20):
    cols = [sum(1 for y in range(h) if m[y][x]) for x in range(w)]
    segs, start, gap = [], None, 0
    for x in range(w):
        if cols[x] > 2:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                if x - gap - start > min_width:
                    segs.append((start, x - gap))
                start, gap = None, 0
    if start is not None and w - start > min_width:
        segs.append((start, w - 1))
    return segs


def bbox(m, x0, x1, h):
    ys = [y for y in range(h) if any(m[y][x] for x in range(x0, x1 + 1))]
    xs = [x for x in range(x0, x1 + 1) if any(m[y][x] for y in range(h))]
    return min(xs), min(ys), max(xs), max(ys)


def pixel_size(im, m, box):
    x0, y0, x1, y1 = box
    px = im.load()
    runs = Counter()
    for y in range(y0, y1 + 1, 3):
        run, prev = 0, None
        for x in range(x0, x1 + 1):
            if not m[y][x]:
                if run:
                    runs[run] += 1
                run, prev = 0, None
                continue
            c = px[x, y][:3]
            if prev is not None and max(abs(c[i] - prev[i]) for i in range(3)) < 18:
                run += 1
            else:
                if run:
                    runs[run] += 1
                run = 1
            prev = c
    best, score = 4, -1
    for s in range(3, 16):
        sc = sum(n for r, n in runs.items() if r >= s - 1 and abs(r / s - round(r / s)) < 0.18) * s
        if sc > score:
            best, score = s, sc
    return best


def downscale(im, m, box, target_h):
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    k = bh / target_h
    tw = max(1, round(bw / k))
    out = Image.new('RGBA', (tw, target_h), (0, 0, 0, 0))
    src, dst = im.load(), out.load()
    for ty in range(target_h):
        for tx in range(tw):
            sx0, sx1 = x0 + int(tx * k), x0 + max(int(tx * k) + 1, int((tx + 1) * k))
            sy0, sy1 = y0 + int(ty * k), y0 + max(int(ty * k) + 1, int((ty + 1) * k))
            cnt, fg = Counter(), 0
            tot = 0
            for yy in range(sy0, min(sy1, y1 + 1)):
                for xx in range(sx0, min(sx1, x1 + 1)):
                    tot += 1
                    if m[yy][xx]:
                        fg += 1
                        r, g, b = src[xx, yy][:3]
                        cnt[(r >> 3, g >> 3, b >> 3)] += 1
            if tot and fg / tot >= 0.45 and cnt:
                q = cnt.most_common(1)[0][0]
                vals = [src[xx, yy][:3] for yy in range(sy0, min(sy1, y1 + 1)) for xx in range(sx0, min(sx1, x1 + 1)) if m[yy][xx] and (src[xx, yy][0] >> 3, src[xx, yy][1] >> 3, src[xx, yy][2] >> 3) == q]
                r = sum(v[0] for v in vals) // len(vals)
                g = sum(v[1] for v in vals) // len(vals)
                b = sum(v[2] for v in vals) // len(vals)
                dst[tx, ty] = (r, g, b, 255)
    return out


def main():
    src, name, target_h = sys.argv[1], sys.argv[2], int(sys.argv[3])
    labels = sys.argv[4].split(',') if len(sys.argv) > 4 else ['down', 'left', 'right', 'up']
    outdir = Path(sys.argv[5] if len(sys.argv) > 5 else 'assets/sprites')
    outdir.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert('RGB')
    w, h = im.size
    m = mask_of(im)
    segs = segments(m, w, h)
    info = {'segments': len(segs), 'frames': {}}
    for i, (a, b) in enumerate(segs[:len(labels)]):
        box = bbox(m, a, b, h)
        ps = pixel_size(im, m, box)
        spr = downscale(im, m, box, target_h)
        fn = outdir / f'{name}_{labels[i]}.png'
        spr.save(fn)
        info['frames'][labels[i]] = {'file': fn.name, 'w': spr.width, 'h': spr.height, 'src_box': box, 'src_px': ps, 'native_h': round((box[3] - box[1] + 1) / ps)}
    print(json.dumps(info))


if __name__ == '__main__':
    main()
