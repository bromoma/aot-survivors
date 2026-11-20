# python3 dev/fit_sprites.py <src_dir> <out_dir> name:height[,name:height...] [colors]
# Shrinks full-size cut sprites to the art-pixel height the world expects: every target pixel takes the most
# common colour of its block (keeps crisp pixel art), then the palette is reduced and the alpha made hard.
import sys, os
from PIL import Image

src, out, spec = sys.argv[1], sys.argv[2], sys.argv[3]
colors = int(sys.argv[4]) if len(sys.argv) > 4 else 32
os.makedirs(out, exist_ok=True)

def shrink(img, tw, th):
    w, h = img.size; d = img.load(); o = Image.new('RGBA', (tw, th)); od = o.load()
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

for item in spec.split(','):
    name, h = item.split(':')
    im = Image.open(os.path.join(src, name + '.png')).convert('RGBA')
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    th = int(h); tw = max(1, round(im.width * th / im.height))
    r = shrink(im, tw, th)
    a = r.getchannel('A')
    q = r.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert('RGB'); q.putalpha(a)
    q.save(os.path.join(out, name + '.png'))
    print(name, im.size, '->', q.size)
