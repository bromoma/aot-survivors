'use strict';

const SHADOW = { kx: -0.67, ky: 0.31, ground: [0.57, -0.26] };

const silCache = new WeakMap();
function silhouette(img, color = '#000000') {
  let m = silCache.get(img);
  if (!m) { m = {}; silCache.set(img, m); }
  if (!m[color]) {
    const [c, g] = makeCanvas(img.width, img.height);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    m[color] = c;
  }
  return m[color];
}

function castShadow(g, spr, ax, ay, alpha, tint = '#0e0a16') {
  g.save();
  g.globalAlpha = alpha;
  g.translate(ax, ay);
  g.transform(1, 0, SHADOW.kx, SHADOW.ky, 0, 0);
  g.drawImage(silhouette(spr.img, tint), -spr.ox, -spr.oy);
  g.restore();
}

function blobShadow(g, x, y, rx, ry, alpha) {
  disc(g, x, y, rx, ry, `rgba(14, 10, 22, ${alpha})`);
}

const PUFFS = {};
function puffSprite(r, kind) {
  const key = kind + r;
  if (PUFFS[key]) return PUFFS[key];
  const tones = kind === 'smoke' ? ['#2a2626', '#3a3434', '#4a4442', '#5a5450'] : kind === 'gas' ? ['#aab4be', '#ccd4dc', '#e4eaf0', '#f6f9fb'] : ['#b4b2ae', '#d2d0ca', '#e8e6e0', '#f8f6f2'];
  const s = r * 2 + 3;
  const [c, g] = makeCanvas(s, s);
  const img = g.createImageData(s, s), d = img.data;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (x - s / 2 + 0.5) / r, dy = (y - s / 2 + 0.5) / r, q = dx * dx + dy * dy;
    if (q > 1) continue;
    const lit = -(dx * 0.55 + dy * 0.85);
    const t = clamp(Math.floor(1.6 + lit * 1.5 + bayer(x, y) * 0.7), 0, 3);
    const col = hexRgb(tones[t]);
    const i = (y * s + x) * 4;
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  PUFFS[key] = c;
  return c;
}

function drawPuff(g, x, y, r, alpha, kind = 'steam') {
  const R = clamp(Math.round(r), 1, 40);
  const s = puffSprite(R, kind);
  g.globalAlpha = alpha;
  g.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2));
  g.globalAlpha = 1;
}

let cloudLayer = null;
function steamColumn(g, x, y, w, h, n, seed, alpha = 0.8, kind = 'steam') {
  if (!cloudLayer || cloudLayer[0].width !== g.canvas.width || cloudLayer[0].height !== g.canvas.height) cloudLayer = makeCanvas(g.canvas.width, g.canvas.height);
  const [lc, lg] = cloudLayer;
  lg.clearRect(0, 0, lc.width, lc.height);
  const r = makeRng(seed);
  const list = [];
  for (let i = 0; i < n; i++) {
    const k = Math.pow(r.next(), 0.8);
    list.push({ x: x + r.range(-w / 2, w / 2) * (1 - k * 0.4) + k * k * r.range(4, 22), y: y - k * h, s: lerp(r.range(3, 6), r.range(7, 12), k) });
  }
  list.sort((a, b) => b.y - a.y);
  for (const p of list) drawPuff(lg, p.x, p.y, p.s, 1, kind);
  g.save();
  g.globalAlpha = alpha;
  g.drawImage(lc, 0, 0);
  g.restore();
}

function flames(g, x, y, w, seed, t = 0) {
  const r = makeRng(seed);
  for (let i = 0; i < w * 1.6; i++) {
    const fx = x + r.range(-w / 2, w / 2), fh = r.range(3, 11) * (1 - Math.abs(fx - x) / w);
    for (let k = 0; k < fh; k++) {
      const q = k / fh;
      rect(g, fx + Math.sin(k * 0.7 + i + t) * q * 1.5, y - k, 1, 1, q < 0.3 ? '#ffe08a' : q < 0.65 ? '#ff9a3a' : '#d8462a');
    }
  }
}

function splat(g, x, y, size, seed, alpha = 1) {
  const r = makeRng(seed);
  const cols = ['#4e0c0e', '#6a1214', '#7a1416', '#3a0a0c'];
  g.globalAlpha = alpha;
  for (let i = 0; i < size * size * 1.4; i++) {
    const a = r.range(0, TAU), d = Math.pow(r.next(), 1.6) * size;
    rect(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55, r.chance(0.3) ? 2 : 1, 1, r.pick(cols));
  }
  for (let i = 0; i < 6; i++) {
    const a = r.range(0, TAU), d = size * r.range(1.1, 1.8);
    rect(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55, 1, 1, cols[1]);
  }
  g.globalAlpha = 1;
}

function spray(g, x, y, dir, n, seed) {
  const r = makeRng(seed);
  for (let i = 0; i < n; i++) {
    const a = dir + r.range(-0.7, 0.7), d = r.range(2, 26), drop = d * d * 0.012;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7 + drop;
    rect(g, px, py, r.chance(0.35) ? 2 : 1, r.chance(0.2) ? 2 : 1, r.pick(['#b3122e', '#8a0e20', '#d8283a', '#6a0a16']));
  }
}

function slashArc(g, x, y, R, a0, a1, k = 1) {
  const steps = Math.ceil(Math.abs(a1 - a0) * R / 0.8);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = lerp(a0, a1, t);
    const th = Math.sin(t * Math.PI) * 3 * k;
    for (let j = 0; j <= th; j++) {
      const rr = R - j;
      rect(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75, 1, 1, j === 0 ? '#ffffff' : j < 2 ? '#d8f2ff' : '#7fc8f0');
    }
  }
}

function wire(g, x0, y0, x1, y1, sag = 6, alpha = 1) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  g.globalAlpha = alpha;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag;
    rect(g, x, y + 1, 1, 1, '#2c3036');
    rect(g, x, y, 1, 1, i % 7 < 3 ? '#f4f7fa' : '#b8c2cc');
    px = x; py = y;
  }
  rect(g, x1 - 1, y1 - 1, 3, 3, '#1e2024');
  rect(g, x1, y1, 1, 1, '#9aa4ae');
  g.globalAlpha = 1;
}

const FIRE_FRAMES = [];
function fireFrame(i) {
  if (!FIRE_FRAMES.length) {
    for (let f = 0; f < 6; f++) {
      const [c, g] = makeCanvas(26, 18);
      flames(g, 13, 17, 14, 7 + f * 13, f * 1.1);
      FIRE_FRAMES.push(c);
    }
  }
  return FIRE_FRAMES[((i % 6) + 6) % 6];
}

let GLOW_SPR = null;
function glowSprite() {
  if (!GLOW_SPR) {
    const R = 18;
    const [c, g] = makeCanvas(R * 2 + 1, R * 2 + 1);
    for (let i = 4; i >= 1; i--) {
      g.globalAlpha = 0.16;
      disc(g, R, R, R * i / 4, R * i / 4 * 0.8, '#ff8a3a');
    }
    GLOW_SPR = c;
  }
  return GLOW_SPR;
}

function glow(g, x, y, r, color, alpha) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const steps = 4;
  for (let i = steps; i >= 1; i--) {
    g.globalAlpha = alpha / steps;
    disc(g, x, y, r * i / steps, r * i / steps, color);
  }
  g.restore();
}

function ditherBlob(g, x, y, rx, ry, color, density) {
  const c = hexRgb(color);
  g.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
    const q = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
    if (q > 1) continue;
    const X = Math.round(x + xx), Y = Math.round(y + yy);
    const dens = density * (1 - q) * 1.6;
    if (bayer(X, Y) + 0.5 < dens) g.fillRect(X, Y, 1, 1);
  }
}

function fillPoly(g, pts, color) {
  g.fillStyle = color;
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) g.fillRect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]), 1);
  }
}
