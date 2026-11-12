'use strict';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (a, b) => a + next() * (b - a),
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    chance: p => next() < p,
  };
}

let RNG = makeRng(1337);
const rand = (a, b) => RNG.range(a, b);
const pick = arr => RNG.pick(arr);

function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
}

function fbm(x, y, oct = 3, seed = 0) {
  let v = 0, amp = 0.5, f = 1, tot = 0;
  for (let i = 0; i < oct; i++) {
    v += valueNoise(x * f, y * f, seed + i * 17) * amp;
    tot += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return v / tot;
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.47);
const bayer = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)];

function hexRgb(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbHex(r, g, b) {
  const f = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

function mixHex(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

function shade(hex, k) {
  const c = hexRgb(hex);
  return rgbHex(c[0] * k, c[1] * k, c[2] * k);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  if (!s) return rgbHex(l * 255, l * 255, l * 255);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
}

function hueToward(h, target, deg) {
  const d = ((target - h + 540) % 360) - 180;
  return h + clamp(d, -Math.abs(deg), Math.abs(deg));
}

function makeRamp(base, n = 5, o = {}) {
  const [h, s, l] = rgbToHsl(...hexRgb(base));
  const lo = o.lo ?? 0.36, hi = o.hi ?? 0.18, shift = o.shift ?? 1, mid = o.mid ?? 0.6;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? mid : i / (n - 1);
    const k = t < mid ? (t - mid) / mid : (t - mid) / (1 - mid);
    const hh = k < 0 ? hueToward(h, 255, -k * 24 * shift) : hueToward(h, 52, k * 14 * shift);
    const ss = s * (k < 0 ? 1 - 0.12 * -k : 1 - 0.35 * k);
    const ll = k < 0 ? Math.max(0.05 + i * 0.025, l + k * lo) : Math.min(0.96, l + k * hi);
    out.push(hslToHex(hh, ss, ll));
  }
  return out;
}

const CPU_RASTER = true;
function makeCanvas(w, h, read = CPU_RASTER) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext('2d', read ? { willReadFrequently: true } : undefined);
  g.imageSmoothingEnabled = false;
  return [c, g];
}

function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function disc(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  const r = Math.max(1, Math.round(ry));
  for (let y = -r; y <= r; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r))));
    g.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2 + 1, 1);
  }
}

function pline(g, x0, y0, x1, y1, w, c) {
  g.fillStyle = c;
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const o = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w);
}

const colorCache = new Map();
function parseColor(c) {
  let v = colorCache.get(c);
  if (v) return v;
  if (c[0] === '#') v = [...hexRgb(c), 1];
  else {
    const m = c.match(/[\d.]+/g).map(Number);
    v = [m[0], m[1], m[2], m.length > 3 ? m[3] : 1];
  }
  colorCache.set(c, v);
  return v;
}

class PixBuf {
  constructor(w, h) {
    this.w = Math.max(1, Math.ceil(w));
    this.h = Math.max(1, Math.ceil(h));
    this.img = new ImageData(this.w, this.h);
    this.d = this.img.data;
  }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = parseColor(c), i = (y * this.w + x) * 4, d = this.d;
    if (a >= 1) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; return; }
    if (!d[i + 3]) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a * 255; return; }
    d[i] += (r - d[i]) * a; d[i + 1] += (g - d[i + 1]) * a; d[i + 2] += (b - d[i + 2]) * a;
  }
  put(x, y, rgb) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.d;
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
  }
  rect(x, y, w, h, c) {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x) + Math.round(w)), y1 = Math.min(this.h, Math.round(y) + Math.round(h));
    if (x1 <= x0 || y1 <= y0) return;
    const [r, g, b, a] = parseColor(c), d = this.d;
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 4;
      for (let xx = x0; xx < x1; xx++, i += 4) {
        if (a >= 1 || !d[i + 3]) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a >= 1 ? 255 : a * 255; }
        else { d[i] += (r - d[i]) * a; d[i + 1] += (g - d[i + 1]) * a; d[i + 2] += (b - d[i + 2]) * a; }
      }
    }
  }
  line(x0, y0, x1, y1, w, c) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    const o = Math.floor(w / 2);
    for (let i = 0; i <= n; i++) this.rect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w, c);
  }
  disc(cx, cy, rx, ry, c) {
    const r = Math.max(1, Math.round(ry));
    for (let y = -r; y <= r; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r))));
      this.rect(Math.round(cx) - w, Math.round(cy) + y, w * 2 + 1, 1, c);
    }
  }
  clear(x, y, w, h) {
    const x0 = Math.round(x), y0 = Math.round(y);
    for (let yy = Math.max(0, y0); yy < Math.min(this.h, y0 + Math.round(h)); yy++) for (let xx = Math.max(0, x0); xx < Math.min(this.w, x0 + Math.round(w)); xx++) this.d[(yy * this.w + xx) * 4 + 3] = 0;
  }
  canvas() {
    const [c, g] = makeCanvas(this.w, this.h);
    g.putImageData(this.img, 0, 0);
    return c;
  }
}
