'use strict';

const CAM_E = 32 * Math.PI / 180;
const KY = Math.sin(CAM_E), KZ = Math.cos(CAM_E);
const FAR = 900;
const OUTLINE = '#120b10';
const OUTLINE_RGB = hexRgb(OUTLINE);
const LIGHT = (() => {
  const v = [-0.68, 0.32, 0.66], l = Math.hypot(...v);
  return v.map(x => x / l);
})();
const VIEW = [0, KZ, KY];

const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
function rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
function mmul(A, B) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
  return r;
}
function mv(M, v) {
  return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
}
const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  len: a => Math.hypot(a[0], a[1], a[2]),
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
};

function ik2(root, end, l1, l2, bend) {
  const d = v3.sub(end, root);
  let dist = v3.len(d);
  const maxd = (l1 + l2) * 0.999;
  let tip = end;
  if (dist > maxd) {
    tip = v3.add(root, v3.mul(d, maxd / dist));
    dist = maxd;
  }
  const dir = v3.mul(v3.sub(tip, root), 1 / (dist || 1));
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist || 1);
  const hgt = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let perp = v3.sub(bend, v3.mul(dir, v3.dot(bend, dir)));
  if (v3.len(perp) < 1e-4) perp = [0, 0, 1];
  perp = v3.norm(perp);
  return { mid: v3.add(v3.add(root, v3.mul(dir, a)), v3.mul(perp, hgt)), tip };
}

function material(base, o = {}) {
  const ramp = o.ramp || makeRamp(base, o.n || 5, o);
  return {
    ramp, rgb: ramp.map(hexRgb), n: ramp.length,
    dither: o.dither ?? 0, noise: o.noise ?? 0, nscale: o.nscale ?? 1, gloss: o.gloss ?? 0,
    flat: o.flat ?? -1, bias: o.bias ?? 0, contrast: o.contrast ?? 1, edge: o.edge ?? true,
  };
}

class Sculpt {
  constructor() {
    this.prims = [];
    this.dots = [];
    this.anchors = [];
  }
  mark() {
    return { p: this.prims.length, d: this.dots.length, a: this.anchors.length };
  }
  sph(c, r, m) {
    this.prims.push({ k: 0, c: c.slice(), r, m });
    return this;
  }
  ell(c, rad, m, R = I3) {
    this.prims.push({ k: 1, c: c.slice(), rad: rad.slice(), m, R: R.slice() });
    return this;
  }
  cone(a, b, ra, rb, m) {
    if (rb === undefined) rb = ra;
    if (v3.len(v3.sub(b, a)) <= Math.abs(ra - rb) + 0.05) return this.sph(ra > rb ? a : b, Math.max(ra, rb), m);
    this.prims.push({ k: 2, a: a.slice(), b: b.slice(), ra, rb, m });
    return this;
  }
  box(c, half, m, R = I3) {
    this.prims.push({ k: 3, c: c.slice(), half: half.slice(), m, R: R.slice() });
    return this;
  }
  dot(p, color, w = 1, h = 1) {
    this.dots.push({ p: p.slice(), rgb: hexRgb(color), w, h });
    return this;
  }
  stroke(pts, color, step = 0.5) {
    for (let i = 0; i < pts.length - 1; i++) {
      const n = Math.max(1, Math.ceil(v3.len(v3.sub(pts[i + 1], pts[i])) / step));
      for (let k = 0; k <= n; k++) this.dot(v3.lerp(pts[i], pts[i + 1], k / n), color);
    }
    return this;
  }
  anchor(name, p) {
    this.anchors.push({ name, p: p.slice() });
    return this;
  }
  xform(M, pivot, from = { p: 0, d: 0, a: 0 }, to = this.mark()) {
    const tp = q => v3.add(mv(M, v3.sub(q, pivot)), pivot);
    for (let i = from.p; i < to.p; i++) {
      const p = this.prims[i];
      if (p.k === 2) { p.a = tp(p.a); p.b = tp(p.b); }
      else p.c = tp(p.c);
      if (p.k === 1 || p.k === 3) p.R = mmul(M, p.R);
    }
    for (let i = from.d; i < to.d; i++) this.dots[i].p = tp(this.dots[i].p);
    for (let i = from.a; i < to.a; i++) this.anchors[i].p = tp(this.anchors[i].p);
    return this;
  }
  shift(off, from = { p: 0, d: 0, a: 0 }, to = this.mark()) {
    for (let i = from.p; i < to.p; i++) {
      const p = this.prims[i];
      if (p.k === 2) { p.a = v3.add(p.a, off); p.b = v3.add(p.b, off); }
      else p.c = v3.add(p.c, off);
    }
    for (let i = from.d; i < to.d; i++) this.dots[i].p = v3.add(this.dots[i].p, off);
    for (let i = from.a; i < to.a; i++) this.anchors[i].p = v3.add(this.anchors[i].p, off);
    return this;
  }
}

const projU = p => p[0];
const projV = p => KY * p[1] - KZ * p[2];

function primBounds(p) {
  if (p.k === 0) return [p.c[0] - p.r, p.c[0] + p.r, projV(p.c) - p.r, projV(p.c) + p.r];
  if (p.k === 1 || p.k === 3) {
    const R = p.k === 1 ? Math.max(p.rad[0], p.rad[1], p.rad[2]) : Math.hypot(p.half[0], p.half[1], p.half[2]);
    return [p.c[0] - R, p.c[0] + R, projV(p.c) - R, projV(p.c) + R];
  }
  const va = projV(p.a), vb = projV(p.b);
  return [Math.min(p.a[0] - p.ra, p.b[0] - p.rb), Math.max(p.a[0] + p.ra, p.b[0] + p.rb), Math.min(va - p.ra, vb - p.rb), Math.max(va + p.ra, vb + p.rb)];
}

function renderSculpt(S, face = 0, o = {}) {
  const M = rotZ(face);
  const prims = S.prims.map(p => {
    if (p.k === 0) return { k: 0, c: mv(M, p.c), r: p.r, m: p.m };
    if (p.k === 1) return { k: 1, c: mv(M, p.c), rad: p.rad, R: mmul(M, p.R), m: p.m };
    if (p.k === 3) return { k: 3, c: mv(M, p.c), half: p.half, R: mmul(M, p.R), m: p.m };
    return { k: 2, a: mv(M, p.a), b: mv(M, p.b), ra: p.ra, rb: p.rb, m: p.m };
  });
  if (!prims.length) {
    const [c] = makeCanvas(1, 1);
    return { img: c, ox: 0, oy: 0, anchors: {} };
  }
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const p of prims) {
    p.bb = primBounds(p);
    minU = Math.min(minU, p.bb[0]); maxU = Math.max(maxU, p.bb[1]);
    minV = Math.min(minV, p.bb[2]); maxV = Math.max(maxV, p.bb[3]);
  }
  const pad = 2;
  const U0 = Math.floor(minU) - pad, V0 = Math.floor(minV) - pad;
  const w = Math.ceil(maxU) + pad - U0 + 1, h = Math.ceil(maxV) + pad - V0 + 1;
  const N = w * h;
  const depth = new Float32Array(N).fill(Infinity);
  const val = new Float32Array(N);
  const mid = new Int16Array(N).fill(-1);
  const pid = new Int16Array(N).fill(-1);
  const mats = [], matIdx = new Map();
  const rdy = -KZ, rdz = -KY;
  for (let pi = 0; pi < prims.length; pi++) {
    const p = prims[pi];
    let mi = matIdx.get(p.m);
    if (mi === undefined) { mi = mats.length; mats.push(p.m); matIdx.set(p.m, mi); }
    const x0 = Math.max(0, Math.floor(p.bb[0]) - U0), x1 = Math.min(w - 1, Math.ceil(p.bb[1]) - U0);
    const y0 = Math.max(0, Math.floor(p.bb[2]) - V0), y1 = Math.min(h - 1, Math.ceil(p.bb[3]) - V0);
    const m = p.m;
    let pre;
    if (p.k === 1) {
      const R = p.R, rad = p.rad;
      const dl = [(R[0] * 0 + R[3] * rdy + R[6] * rdz) / rad[0], (R[1] * 0 + R[4] * rdy + R[7] * rdz) / rad[1], (R[2] * 0 + R[5] * rdy + R[8] * rdz) / rad[2]];
      pre = { dl, A: dl[0] * dl[0] + dl[1] * dl[1] + dl[2] * dl[2] };
    } else if (p.k === 3) {
      const R = p.R;
      pre = { d: [R[3] * rdy + R[6] * rdz, R[4] * rdy + R[7] * rdz, R[5] * rdy + R[8] * rdz] };
    } else if (p.k === 2) {
      const ba = v3.sub(p.b, p.a), rr = p.ra - p.rb, m0 = v3.dot(ba, ba), m2 = ba[1] * rdy + ba[2] * rdz;
      const d2 = m0 - rr * rr;
      pre = { ba, rr, m0, m2, d2, k2: d2 - m2 * m2 };
    }
    for (let py = y0; py <= y1; py++) {
      const v = V0 + py + 0.5;
      const oy = v / KY + FAR * KZ, oz = FAR * KY;
      for (let px = x0; px <= x1; px++) {
        const u = U0 + px + 0.5;
        let t = -1, nx = 0, ny = 0, nz = 0;
        if (p.k === 0) {
          const cx = u - p.c[0], cy = oy - p.c[1], cz = oz - p.c[2];
          const b = cy * rdy + cz * rdz, c = cx * cx + cy * cy + cz * cz - p.r * p.r, d = b * b - c;
          if (d < 0) continue;
          t = -b - Math.sqrt(d);
          nx = (cx) / p.r; ny = (cy + t * rdy) / p.r; nz = (cz + t * rdz) / p.r;
        } else if (p.k === 1) {
          const R = p.R, rad = p.rad;
          const ex = u - p.c[0], ey = oy - p.c[1], ez = oz - p.c[2];
          const lx = (R[0] * ex + R[3] * ey + R[6] * ez) / rad[0];
          const ly = (R[1] * ex + R[4] * ey + R[7] * ez) / rad[1];
          const lz = (R[2] * ex + R[5] * ey + R[8] * ez) / rad[2];
          const dl = pre.dl;
          const B = lx * dl[0] + ly * dl[1] + lz * dl[2], C = lx * lx + ly * ly + lz * lz - 1, d = B * B - pre.A * C;
          if (d < 0) continue;
          t = (-B - Math.sqrt(d)) / pre.A;
          const qx = (lx + t * dl[0]) / rad[0], qy = (ly + t * dl[1]) / rad[1], qz = (lz + t * dl[2]) / rad[2];
          nx = R[0] * qx + R[1] * qy + R[2] * qz;
          ny = R[3] * qx + R[4] * qy + R[5] * qz;
          nz = R[6] * qx + R[7] * qy + R[8] * qz;
          const l = Math.hypot(nx, ny, nz) || 1;
          nx /= l; ny /= l; nz /= l;
        } else if (p.k === 3) {
          const R = p.R, hf = p.half, dd = pre.d;
          const ex = u - p.c[0], ey = oy - p.c[1], ez = oz - p.c[2];
          const lo = [R[0] * ex + R[3] * ey + R[6] * ez, R[1] * ex + R[4] * ey + R[7] * ez, R[2] * ex + R[5] * ey + R[8] * ez];
          let tn = -Infinity, tf = Infinity, ax = -1, sg = 1;
          let miss = false;
          for (let q = 0; q < 3; q++) {
            if (Math.abs(dd[q]) < 1e-9) {
              if (Math.abs(lo[q]) > hf[q]) { miss = true; break; }
              continue;
            }
            let t1 = (-hf[q] - lo[q]) / dd[q], t2 = (hf[q] - lo[q]) / dd[q], s1 = -1;
            if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s1 = 1; }
            if (t1 > tn) { tn = t1; ax = q; sg = s1; }
            if (t2 < tf) tf = t2;
          }
          if (miss || tn > tf || ax < 0) continue;
          t = tn;
          const nl = [0, 0, 0];
          nl[ax] = sg;
          nx = R[0] * nl[0] + R[1] * nl[1] + R[2] * nl[2];
          ny = R[3] * nl[0] + R[4] * nl[1] + R[5] * nl[2];
          nz = R[6] * nl[0] + R[7] * nl[1] + R[8] * nl[2];
        } else {
          const { ba, rr, m0, m2, d2, k2 } = pre;
          const oax = u - p.a[0], oay = oy - p.a[1], oaz = oz - p.a[2];
          const obx = u - p.b[0], oby = oy - p.b[1], obz = oz - p.b[2];
          const m1 = ba[0] * oax + ba[1] * oay + ba[2] * oaz;
          const m3 = oay * rdy + oaz * rdz;
          const m5 = oax * oax + oay * oay + oaz * oaz;
          const m6 = oby * rdy + obz * rdz;
          const m7 = obx * obx + oby * oby + obz * obz;
          const ra = p.ra, rb = p.rb;
          const k1 = d2 * m3 - m1 * m2 + m2 * rr * ra;
          const k0 = d2 * m5 - m1 * m1 + m1 * rr * ra * 2 - m0 * ra * ra;
          const hh = k1 * k1 - k0 * k2;
          if (hh < 0) continue;
          let hit = false;
          if (Math.abs(k2) > 1e-9) {
            const tt = (-Math.sqrt(hh) - k1) / k2;
            const y = m1 - ra * rr + tt * m2;
            if (y > 0 && y < d2) {
              t = tt;
              nx = d2 * oax - ba[0] * y;
              ny = d2 * (oay + tt * rdy) - ba[1] * y;
              nz = d2 * (oaz + tt * rdz) - ba[2] * y;
              const l = Math.hypot(nx, ny, nz) || 1;
              nx /= l; ny /= l; nz /= l;
              hit = true;
            }
          }
          if (!hit) {
            const h1 = m3 * m3 - m5 + ra * ra, h2 = m6 * m6 - m7 + rb * rb;
            let best = Infinity;
            if (h1 > 0) {
              const tt = -m3 - Math.sqrt(h1);
              best = tt;
              nx = oax / ra; ny = (oay + tt * rdy) / ra; nz = (oaz + tt * rdz) / ra;
            }
            if (h2 > 0) {
              const tt = -m6 - Math.sqrt(h2);
              if (tt < best) {
                best = tt;
                nx = obx / rb; ny = (oby + tt * rdy) / rb; nz = (obz + tt * rdz) / rb;
              }
            }
            if (best === Infinity) continue;
            t = best;
          }
        }
        const i = py * w + px;
        if (t >= depth[i]) continue;
        depth[i] = t;
        mid[i] = mi;
        pid[i] = pi;
        let lam = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        let sv = lam * 0.5 + 0.5;
        if (m.gloss) {
          const rx = 2 * lam * nx - LIGHT[0], ry = 2 * lam * ny - LIGHT[1], rz = 2 * lam * nz - LIGHT[2];
          const sp = Math.max(0, rx * VIEW[0] + ry * VIEW[1] + rz * VIEW[2]);
          sv += Math.pow(sp, 10) * m.gloss;
        }
        val[i] = sv;
      }
    }
  }
  const anchors = {};
  for (const a of S.anchors) {
    const q = mv(M, a.p);
    const px = Math.floor(projU(q) - U0), py = Math.floor(projV(q) - V0);
    const i = py * w + px;
    const vis = px >= 0 && py >= 0 && px < w && py < h ? (depth[i] === Infinity || depthOfPoint(q, U0 + px + 0.5, V0 + py + 0.5) <= depth[i] + 1.5) : true;
    anchors[a.name] = { x: projU(q) - U0, y: projV(q) - V0, vis, z: q[2] };
  }
  const img = new ImageData(w, h);
  const d = img.data;
  const tone = new Int8Array(N).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const mi = mid[i];
      if (mi < 0) continue;
      const m = mats[mi];
      let ti;
      if (m.flat >= 0) ti = m.flat;
      else {
        let sv = (val[i] - 0.5) * m.contrast + 0.5 + m.bias;
        if (m.noise) sv += (hash2(Math.floor((x + U0) / m.nscale), Math.floor((y + V0) / m.nscale), 7) - 0.5) * m.noise;
        sv += bayer(x + U0, y + V0) * m.dither / m.n;
        ti = clamp(Math.floor(sv * m.n), 0, m.n - 1);
      }
      tone[i] = ti;
    }
  }
  const edgeT = o.edge ?? 2.2;
  const mark = new Uint8Array(N);
  if (edgeT > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mid[i] < 0 || !mats[mid[i]].edge) continue;
        const di = depth[i];
        const q = pid[i];
        const t = j => mid[j] >= 0 && pid[j] !== q && di - depth[j] > edgeT;
        if ((x > 0 && t(i - 1)) || (x < w - 1 && t(i + 1)) || (y > 0 && t(i - w)) || (y < h - 1 && t(i + w))) mark[i] = 1;
      }
    }
  }
  const ek = o.edgeMix ?? 0.5;
  for (let i = 0; i < N; i++) {
    if (mid[i] < 0) continue;
    const m = mats[mid[i]];
    if (mark[i]) {
      const c = m.rgb[Math.max(0, Math.min(tone[i] - 2, 1))];
      d[i * 4] = lerp(c[0], OUTLINE_RGB[0], ek); d[i * 4 + 1] = lerp(c[1], OUTLINE_RGB[1], ek); d[i * 4 + 2] = lerp(c[2], OUTLINE_RGB[2], ek);
    } else {
      const c = m.rgb[tone[i]];
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2];
    }
    d[i * 4 + 3] = 255;
  }
  for (const dt of S.dots) {
    const q = mv(M, dt.p);
    const px = Math.floor(projU(q) - U0), py = Math.floor(projV(q) - V0);
    for (let yy = 0; yy < dt.h; yy++) {
      for (let xx = 0; xx < dt.w; xx++) {
        const X = px + xx, Y = py + yy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const i = Y * w + X;
        if (mid[i] < 0) continue;
        if (depthOfPoint(q, U0 + X + 0.5, V0 + Y + 0.5) > depth[i] + (o.dotTol ?? 1.2)) continue;
        d[i * 4] = dt.rgb[0]; d[i * 4 + 1] = dt.rgb[1]; d[i * 4 + 2] = dt.rgb[2]; d[i * 4 + 3] = 255;
      }
    }
  }
  if (o.outline !== false) {
    const oc = o.outline ? hexRgb(o.outline) : null;
    const k = o.selout ?? 0.78;
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mid[i] >= 0) continue;
        let j = -1;
        if (x > 0 && mid[i - 1] >= 0) j = i - 1;
        else if (x < w - 1 && mid[i + 1] >= 0) j = i + 1;
        else if (y > 0 && mid[i - w] >= 0) j = i - w;
        else if (y < h - 1 && mid[i + w] >= 0) j = i + w;
        if (j < 0) continue;
        const base = oc || mats[mid[j]].rgb[0];
        out[i * 4] = lerp(base[0], OUTLINE_RGB[0], oc ? 0 : k);
        out[i * 4 + 1] = lerp(base[1], OUTLINE_RGB[1], oc ? 0 : k);
        out[i * 4 + 2] = lerp(base[2], OUTLINE_RGB[2], oc ? 0 : k);
        out[i * 4 + 3] = 255;
      }
    }
    img.data.set(out);
  }
  const [c, g] = makeCanvas(w, h);
  g.putImageData(img, 0, 0);
  const res = { img: c, ox: -U0, oy: -V0, anchors, w, h };
  if (o.shadow) res.shadow = shearShadow(img.data, w, h, -U0, -V0);
  if (o.tint) res.tint = tintCopy(img.data, w, h, o.tint);
  if (o.white) res.white = tintCopy(img.data, w, h, '#ffffff');
  return res;
}

const SHEAR = { kx: -0.67, ky: 0.31 };
function shearShadow(d, w, h, ox, oy) {
  const kx = SHEAR.kx, ky = SHEAR.ky;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let y = 0; y < h; y++) {
    const v = y - oy;
    for (let x = 0; x < w; x++) {
      if (!d[(y * w + x) * 4 + 3]) continue;
      const sx = Math.round(x - ox + kx * v), sy = Math.round(ky * v);
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    }
  }
  if (minX === Infinity) return null;
  const sw = maxX - minX + 1, sh = maxY - minY + 1;
  const out = new ImageData(sw, sh), od = out.data;
  for (let y = 0; y < h; y++) {
    const v = y - oy;
    for (let x = 0; x < w; x++) {
      if (!d[(y * w + x) * 4 + 3]) continue;
      const sx = Math.round(x - ox + kx * v) - minX, sy = Math.round(ky * v) - minY;
      const i = (sy * sw + sx) * 4;
      od[i] = 14; od[i + 1] = 10; od[i + 2] = 22; od[i + 3] = 255;
      if (sx + 1 < sw && !od[i + 7]) { od[i + 4] = 14; od[i + 5] = 10; od[i + 6] = 22; od[i + 7] = 255; }
    }
  }
  const [c, g] = makeCanvas(sw, sh);
  g.putImageData(out, 0, 0);
  return { img: c, ox: -minX, oy: -minY };
}

function tintCopy(d, w, h, hex) {
  const [r, g0, b] = hexRgb(hex);
  const out = new ImageData(w, h), od = out.data;
  for (let i = 0; i < w * h * 4; i += 4) {
    if (!d[i + 3]) continue;
    od[i] = r; od[i + 1] = g0; od[i + 2] = b; od[i + 3] = 255;
  }
  const [c, g] = makeCanvas(w, h);
  g.putImageData(out, 0, 0);
  return c;
}

function depthOfPoint(q, u, v) {
  const oy = v / KY + FAR * KZ, oz = FAR * KY;
  return (oy - q[1]) * KZ + (oz - q[2]) * KY;
}

function projectLocal(p, face) {
  const q = mv(rotZ(face), p);
  return { x: projU(q), y: projV(q) };
}
