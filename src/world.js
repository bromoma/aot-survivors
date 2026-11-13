'use strict';

const CN = 512;
const CHUNK = CN * 2;
const CHUNK_KEEP = 64;
const ORIGIN = CHUNK / 2;
const TREE_KEYS = ['oak', 'apple_tree', 'pine1', 'pine2', 'pine3'];
const chunks = new Map();
const roadCache = new Map();
let WSEED = 1, worldKind = 'city', roadSP = 1300, pavingKey = 'paving_a', worldListsDirty = true, TEXD = null;

const ckey = (cx, cy) => (cx + 4096) * 8192 + (cy + 4096);

function texOf(key) {
  const img = SPR[key];
  if (!img) return null;
  const g = img.getContext('2d');
  return { w: img.width, h: img.height, d: new Uint32Array(g.getImageData(0, 0, img.width, img.height).data.buffer) };
}

function worldReset(kind, seed) {
  worldKind = kind;
  WSEED = seed;
  roadSP = kind === 'field' ? 2300 : kind === 'ruins' ? 1350 : 1250;
  chunks.clear();
  roadCache.clear();
  pavingKey = makeRng(seed * 7 + 3).pick(['paving_a', 'paving_b']);
  if (!TEXD) TEXD = {};
  for (const k of TR_GROUND) if (!TEXD[k]) TEXD[k] = texOf(k);
  buildings = []; trees = []; props = []; anchors = []; emitters = [];
  worldListsDirty = true;
}

function townAt(x, y) {
  const t = fbm(x / 2600, y / 2600, 3, WSEED + 5);
  const near = Math.max(0, 1 - Math.hypot(x - ORIGIN, y - ORIGIN) / 1800);
  if (worldKind === 'city') return smooth(clamp((t - 0.37) / 0.08 + near * 3, 0, 1));
  if (worldKind === 'ruins') return smooth(clamp((t - 0.43) / 0.08 + near * 3, 0, 1));
  return smooth(clamp((t - 0.6) / 0.06 - near * 4, 0, 1));
}

function forestAt(x, y) {
  const f = fbm(x / 1900, y / 1900, 3, WSEED + 11);
  const near = Math.max(0, 1 - Math.hypot(x - ORIGIN, y - ORIGIN) / 1300);
  const th = worldKind === 'field' ? 0.53 : worldKind === 'ruins' ? 0.6 : 0.64;
  return smooth(clamp((f - th) / 0.06 - near * 4, 0, 1)) * (1 - townAt(x, y));
}

function roadDef(axis, i) {
  const k = axis * 1e6 + i;
  let R = roadCache.get(k);
  if (R) return R;
  const r = makeRng(Math.floor(hash2(i, axis + 3, WSEED) * 4294967295));
  R = {
    o: ORIGIN + i * roadSP + (i ? r.range(-0.22, 0.22) * roadSP : 0),
    a1: r.range(120, 210), w1: r.range(430, 650), p1: r.range(0, TAU),
    a2: r.range(25, 60), w2: r.range(160, 260), p2: r.range(0, TAU),
    skip: worldKind === 'field' && i !== 0 && r.next() < 0.3,
  };
  roadCache.set(k, R);
  return R;
}
const roadAt = (R, s) => R.o + R.a1 * (Math.sin((s - ORIGIN) / R.w1 + R.p1) - Math.sin(R.p1)) + R.a2 * (Math.sin((s - ORIGIN) / R.w2 + R.p2) - Math.sin(R.p2));
const roadHalf = t => lerp(24, 34, t);

function stampMask(m, N, cx, cy, r, v) {
  const R = Math.ceil(r), r2 = r * r;
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(N - 1, Math.ceil(cy + R)); y++) {
    const dy = y - cy;
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(N - 1, Math.ceil(cx + R)); x++) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2 && (v === 1 || !m[y * N + x])) m[y * N + x] = v;
    }
  }
}

function chunkRoads(ch) {
  const N = CN + 2, m = new Uint8Array(N * N);
  const ax = ch.cx * CN - 1, ay = ch.cy * CN - 1;
  const pad = 300 + 0.22 * roadSP;
  ch.roads = [];
  for (const axis of [0, 1]) {
    const lo = (axis ? ax : ay) * ART, hi = ((axis ? ax : ay) + N) * ART;
    for (let i = Math.floor((lo - pad) / roadSP); i <= Math.ceil((hi + pad) / roadSP); i++) {
      const R = roadDef(axis, i);
      if (R.skip) continue;
      const pts = [];
      for (let s = 0; s < N; s++) {
        const ws = ((axis ? ay : ax) + s) * ART;
        const c = roadAt(R, ws);
        const cp = c / ART - (axis ? ax : ay);
        if (cp < -24 || cp > N + 24) continue;
        const wx = axis ? c : ws, wy = axis ? ws : c;
        const t = townAt(wx, wy);
        const kind = t > 0.45 ? 1 : 2;
        const hw = roadHalf(t) / ART * (0.92 + valueNoise(ws / 56, i, 31 + axis) * 0.2);
        const p0 = Math.max(0, Math.ceil(cp - hw)), p1 = Math.min(N - 1, Math.floor(cp + hw));
        for (let p = p0; p <= p1; p++) {
          const idx = axis ? s * N + p : p * N + s;
          if (kind === 1 || !m[idx]) m[idx] = kind;
        }
        if (s % 10 === 0) pts.push([wx, wy, t]);
      }
      if (pts.length > 1) ch.roads.push({ axis, i, R, pts, lane: false });
    }
  }
  return m;
}

function maskAt(ch, x, y) {
  const mx = Math.floor(x / ART) - ch.cx * CN + 1, my = Math.floor(y / ART) - ch.cy * CN + 1, N = CN + 2;
  if (mx < 0 || my < 0 || mx >= N || my >= N) return 0;
  return ch.mask[my * N + mx];
}

function inChunk(ch, x, y, mg) {
  return x >= ch.wx + mg && y >= ch.wy + mg && x <= ch.wx + CHUNK - mg && y <= ch.wy + CHUNK - mg;
}

function chunkPlazas(ch, rng) {
  const N = CN + 2;
  const hs = ch.roads.filter(r => r.axis === 0), vs = ch.roads.filter(r => r.axis === 1);
  ch.plazas = [];
  for (const h of hs) for (const v of vs) {
    let x = v.R.o, y = h.R.o;
    for (let k = 0; k < 6; k++) { y = roadAt(h.R, x); x = roadAt(v.R, y); }
    if (!inChunk(ch, x, y, 200)) continue;
    const t = townAt(x, y), origin = h.i === 0 && v.i === 0;
    if (t < 0.55 || (!origin && rng.next() > 0.5)) continue;
    const r = origin && worldKind !== 'field' ? 250 : rng.range(120, 175);
    const mx = x / ART - ch.cx * CN + 1, my = y / ART - ch.cy * CN + 1;
    for (let a = 0; a < TAU; a += 0.2) stampMask(ch.mask, N, mx + Math.cos(a) * r * 0.25 / ART, my + Math.sin(a) * r * 0.2 / ART, r * 0.8 / ART * (0.9 + valueNoise(Math.cos(a) * 3, Math.sin(a) * 3, ch.cx * 13 + ch.cy) * 0.2), 1);
    ch.plazas.push({ x, y, r, origin });
  }
}

function chunkLanes(ch, rng) {
  const t0 = townAt(ch.wx + CHUNK / 2, ch.wy + CHUNK / 2);
  if (t0 < 0.4 || !ch.roads.length) return;
  const N = CN + 2;
  const n = Math.round(t0 * rng.range(1, worldKind === 'field' ? 2.2 : 3.6));
  for (let k = 0; k < n; k++) {
    const rd = rng.pick(ch.roads);
    const q = Math.floor(rng.range(1, rd.pts.length - 1));
    const [px, py] = rd.pts[q], [qx, qy] = rd.pts[q + 1] || rd.pts[q - 1];
    if (!inChunk(ch, px, py, 80)) continue;
    let a = Math.atan2(qy - py, qx - px) + (rng.next() < 0.5 ? 1 : -1) * rng.range(1.1, 2.0);
    let x = px, y = py;
    const pts = [[x, y, 1]];
    const len = rng.range(260, 560);
    for (let d = 0; d < len; d += 40) {
      a += rng.range(-0.22, 0.22);
      x += Math.cos(a) * 40;
      y += Math.sin(a) * 40;
      if (!inChunk(ch, x, y, 50)) break;
      pts.push([x, y, 1]);
      stampMask(ch.mask, N, x / ART - ch.cx * CN + 1, y / ART - ch.cy * CN + 1, 10 * (0.9 + valueNoise(x / 60, y / 60, 9) * 0.25), 2);
    }
    if (pts.length > 2) ch.roads.push({ axis: -1, pts, lane: true });
  }
}

function footprintOk(ch, x, y, w, d, margin) {
  if (!inChunk(ch, x, y, 8) || !inChunk(ch, x + w, y + d, 8)) return false;
  for (const b of ch.buildings) if (x < b.x + b.w + margin && x + w + margin > b.x && y < b.y + b.d + margin * 1.6 && y + d + margin * 1.6 > b.y) return false;
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 3; j++) if (maskAt(ch, x + w * i / 4, y + d * j / 3)) return false;
  const cx = x + w / 2, cy = y + d / 2;
  if (Math.hypot(cx - ORIGIN, cy - ORIGIN) < 330) return false;
  for (const p of ch.plazas) if (Math.hypot(cx - p.x, cy - p.y) < p.r + Math.max(w, d) * 0.5) return false;
  return true;
}

function grassOk(ch, x, y, r) {
  if (!inChunk(ch, x, y, 26)) return false;
  if (maskAt(ch, x, y) || maskAt(ch, x + r, y) || maskAt(ch, x - r, y)) return false;
  for (const b of ch.buildings) if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.d + r * 2.5) return false;
  if (Math.hypot(x - ORIGIN, y - ORIGIN) < 170) return false;
  return true;
}

function chBuilding(ch, rng, kind, key, x, y) {
  const base = SPR[key];
  if (!base) return null;
  const img = rng.next() < 0.5 ? variant(base, 'flip') : base;
  const w = img.width * ART, full = img.height * ART;
  const d = Math.round(full * 0.34), h = full - d;
  const b = { kind, key, img, x, y, w, d, h, ruin: kind === 'ruin' };
  ch.buildings.push(b);
  if (kind === 'ruin' && key === 'ruin_r3') ch.emitters.push({ x: x + w * 0.52, y: y + d * 0.3, z: h * 0.78, t: 0 });
  else if (kind === 'ruin' && rng.next() < 0.4) ch.emitters.push({ x: x + w * rng.range(0.3, 0.7), y: y + d * 0.4, z: h * rng.range(0.55, 0.8), t: 0, fire: true, seed: Math.floor(rng.range(0, 99)) });
  if (kind === 'house' && rng.next() < 0.3) ch.emitters.push({ x: x + w * rng.range(0.2, 0.8), y: y + d * 0.2, z: h + 8, t: 0, chimney: true });
  if (kind === 'tower') ch.anchors.push({ x: x + w / 2, y: y + d / 2, z: h });
  else { ch.anchors.push({ x: x + w * 0.25, y: y + d * 0.5, z: h }); ch.anchors.push({ x: x + w * 0.75, y: y + d * 0.5, z: h }); }
  return b;
}

function chTree(ch, rng, x, y, key) {
  const img = SPR[key] || SPR.oak;
  if (!img) return;
  const t = { x, y, key, img, h: img.height * ART * 0.8, seed: rng.next() * 10 };
  ch.trees.push(t);
  ch.anchors.push({ x, y, z: t.h });
}

function chProp(ch, rng, x, y, key) {
  const img = SPR[key];
  if (!img) return;
  ch.props.push({ x, y, key, img: rng.next() < 0.5 ? variant(img, 'flip') : img });
}

function pickBuildingKey(rng, t) {
  const ruins = worldKind === 'ruins';
  if (rng.next() < (ruins ? 0.04 : worldKind === 'field' ? 0.05 : 0.07)) return ['tower', 'house_tower'];
  if (ruins && rng.next() < 0.6) return ['ruin', rng.pick(['ruin_r1', 'ruin_r2', 'ruin_r3', 'ruin_r4'])];
  return ['house', rng.pick(['house_h1', 'house_h2', 'house_h3'])];
}

function tryBuilding(ch, rng, cx, cy, margin) {
  const [kind, key] = pickBuildingKey(rng);
  const img = SPR[key];
  if (!img) return null;
  const w = img.width * ART, d = Math.round(img.height * ART * 0.34);
  const x = cx - w / 2, y = cy - d / 2;
  if (!footprintOk(ch, x, y, w, d, margin)) return null;
  const b = chBuilding(ch, rng, kind, key, x, y);
  if (b && kind === 'house' && rng.next() < 0.55) {
    const pool = ['rain_barrel', 'flower_pots', 'woodpile', 'bench', 'cart', 'lamp_post_wood', 'bush1', 'flowers_wild'];
    const fy = b.y + b.d + rng.range(6, 16);
    for (let i = 0, n = 1 + Math.floor(rng.next() * 2); i < n; i++) chProp(ch, rng, b.x + rng.range(10, b.w - 10), fy + rng.range(-2, 8), rng.pick(pool));
  } else if (b && kind === 'ruin' && rng.next() < 0.6) chProp(ch, rng, b.x + rng.range(10, b.w - 10), b.y + b.d + rng.range(6, 18), rng.pick(['rock_mossy', 'woodpile', 'cart', 'rain_barrel', 'log_mossy']));
  return b;
}

function chunkBuildings(ch, rng) {
  const dens = worldKind === 'city' ? 0.9 : worldKind === 'ruins' ? 0.72 : 0.7;
  for (const rd of ch.roads) {
    let acc = rng.range(0, 120), next = rng.range(150, 230);
    for (let i = 1; i < rd.pts.length; i++) {
      const [ax, ay] = rd.pts[i - 1], [bx, by, t] = rd.pts[i];
      const seg = Math.hypot(bx - ax, by - ay) || 1;
      acc += seg;
      if (acc < next) continue;
      acc = 0;
      next = rng.range(150, 230);
      const tt = rd.lane ? townAt(bx, by) : t;
      if (tt < 0.3) continue;
      const nx = -(by - ay) / seg, ny = (bx - ax) / seg;
      for (const side of [-1, 1]) {
        if (rng.next() > tt * dens) continue;
        const [kind, key] = pickBuildingKey(rng);
        const img = SPR[key];
        if (!img) continue;
        const w = img.width * ART, d = Math.round(img.height * ART * 0.34);
        const half = Math.abs(nx) * w / 2 + Math.abs(ny) * d / 2;
        const off = (rd.lane ? 20 : roadHalf(tt)) + half + rng.range(14, 40);
        const x = bx + nx * side * off - w / 2, y = by + ny * side * off - d / 2;
        if (!footprintOk(ch, x, y, w, d, 26)) continue;
        const b = chBuilding(ch, rng, kind, key, x, y);
        if (b && kind === 'house' && rng.next() < 0.55) {
          const pool = ['rain_barrel', 'flower_pots', 'woodpile', 'bench', 'cart', 'lamp_post_wood', 'bush1', 'flowers_wild'];
          const fy = b.y + b.d + rng.range(6, 16);
          for (let k = 0, n = 1 + Math.floor(rng.next() * 2); k < n; k++) chProp(ch, rng, b.x + rng.range(10, b.w - 10), fy + rng.range(-2, 8), rng.pick(pool));
        } else if (b && kind === 'ruin' && rng.next() < 0.6) chProp(ch, rng, b.x + rng.range(10, b.w - 10), b.y + b.d + rng.range(6, 18), rng.pick(['rock_mossy', 'woodpile', 'cart', 'rain_barrel', 'log_mossy']));
      }
    }
  }
  const tries = worldKind === 'field' ? 4 : 14;
  for (let k = 0; k < tries; k++) {
    const x = ch.wx + rng.range(60, CHUNK - 60), y = ch.wy + rng.range(60, CHUNK - 60);
    if (townAt(x, y) < 0.65) continue;
    tryBuilding(ch, rng, x, y, 30);
  }
}

function chunkNature(ch, rng) {
  const ruins = worldKind === 'ruins', field = worldKind === 'field';
  const cell = 104;
  for (let gy = ch.wy + cell / 2; gy < ch.wy + CHUNK; gy += cell) for (let gx = ch.wx + cell / 2; gx < ch.wx + CHUNK; gx += cell) {
    const f = forestAt(gx, gy);
    if (f < 0.08 || rng.next() > f * 0.72) continue;
    const x = gx + rng.range(-34, 34), y = gy + rng.range(-34, 34);
    if (grassOk(ch, x, y, 34)) chTree(ch, rng, x, y, rng.pick(field ? ['pine1', 'pine2', 'pine3', 'oak', 'pine2'] : ['oak', 'pine1', 'pine2', 'pine3']));
  }
  const groups = field ? 3 : ruins ? 1 : 2;
  for (let k = 0; k < groups; k++) {
    const gx = ch.wx + rng.range(120, CHUNK - 120), gy = ch.wy + rng.range(120, CHUNK - 120);
    if (forestAt(gx, gy) > 0.3) continue;
    const n = field ? 1 + Math.floor(rng.next() * 3) : 2 + Math.floor(rng.next() * 4);
    for (let i = 0; i < n; i++) {
      const x = gx + rng.range(-110, 110), y = gy + rng.range(-80, 80);
      if (grassOk(ch, x, y, 40) && !ch.trees.some(t => Math.hypot(t.x - x, t.y - y) < 70)) chTree(ch, rng, x, y, rng.pick(ruins ? ['oak', 'pine1', 'pine2'] : TREE_KEYS));
    }
  }
  const smalls = ruins ? ['rock_mossy', 'log_mossy', 'woodpile', 'grass_tall', 'bush0']
    : field ? ['hay_bales', 'log_mossy', 'rock_mossy', 'bush0', 'bush1', 'bush2', 'flowers_wild', 'flowers_blue', 'grass_tall', 'grass_tall']
      : ['bush1', 'bush_berry', 'bush0', 'bush2', 'flowers_wild', 'flowers_blue', 'grass_tall', 'grass_tall', 'flower_pots'];
  for (let i = 0, n = ruins ? 10 : field ? 12 : 17; i < n; i++) {
    const x = ch.wx + rng.range(30, CHUNK - 30), y = ch.wy + rng.range(30, CHUNK - 30);
    if (grassOk(ch, x, y, 18)) chProp(ch, rng, x, y, rng.pick(smalls));
  }
  if (field && rng.next() < 0.45) {
    const gx = ch.wx + rng.range(150, CHUNK - 150), gy = ch.wy + rng.range(150, CHUNK - 150);
    if (forestAt(gx, gy) < 0.2) for (let i = 0; i < 4; i++) { const x = gx + rng.range(-90, 90), y = gy + rng.range(-60, 60); if (grassOk(ch, x, y, 20)) chProp(ch, rng, x, y, 'hay_bales'); }
  }
  for (const rd of ch.roads) {
    if (rd.lane) continue;
    for (let i = 2; i < rd.pts.length - 1; i += ruins ? 10 : 6) {
      const [ax, ay, t] = rd.pts[i], [bx, by] = rd.pts[i + 1];
      if (t < 0.45) continue;
      const l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l, side = rng.next() < 0.5 ? 1 : -1;
      const off = roadHalf(t) + 14, x = ax + nx * side * off, y = ay + ny * side * off;
      if (grassOk(ch, x, y, 8)) chProp(ch, rng, x, y, 'lamp_post_wood');
    }
  }
  for (const p of ch.plazas) {
    const centre = worldKind === 'city' ? 'statue' : 'well';
    chProp(ch, rng, p.x, p.y + 10, centre);
    ch.anchors.push({ x: p.x, y: p.y, z: centre === 'statue' ? 120 : 70 });
    for (let a = rng.range(0, 1); a < TAU; a += TAU / 6) chProp(ch, rng, p.x + Math.cos(a) * p.r * 0.72, p.y + Math.sin(a) * p.r * 0.6, 'lamp_post_wood');
    for (let a = 0.5; a < TAU; a += TAU / 4) chProp(ch, rng, p.x + Math.cos(a) * p.r * 0.45, p.y + Math.sin(a) * p.r * 0.38 + 10, 'bench');
  }
  if (!field && rng.next() < 0.3) {
    const x = ch.wx + rng.range(200, CHUNK - 200), y = ch.wy + rng.range(200, CHUNK - 200);
    if (grassOk(ch, x, y, 50)) {
      chProp(ch, rng, x, y, 'well');
      for (let k = 0; k < 3; k++) { const a = rng.range(0, TAU), px = x + Math.cos(a) * 70, py = y + Math.sin(a) * 50; if (grassOk(ch, px, py, 15)) chProp(ch, rng, px, py, rng.pick(['bench', 'flowers_wild', 'rain_barrel'])); }
    }
  }
}

const RUIN_TINT = [0.847, 0.795, 0.713];
function paintChunk(ch, rng) {
  const N = CN + 2, m = ch.mask;
  const [c, g] = makeCanvas(CN, CN);
  const img = g.createImageData(CN, CN), out = new Uint32Array(img.data.buffer);
  const G = TEXD.grass, G3 = TEXD.grass3 || G, P = TEXD.path, S = TEXD[pavingKey] || TEXD.paving_a;
  const ax = ch.cx * CN, ay = ch.cy * CN;
  const pc = CN >> 2, patch = new Uint8Array(pc * pc);
  const nc = pc / 4, nodes = new Float32Array((nc + 1) * (nc + 1));
  for (let j = 0; j <= nc; j++) for (let i = 0; i <= nc; i++) nodes[j * (nc + 1) + i] = fbm((ax / 4 + i * 4) / 26, (ay / 4 + j * 4) / 26, 2, 77);
  for (let j = 0; j < pc; j++) for (let i = 0; i < pc; i++) {
    const ni = (j >> 2) * (nc + 1) + (i >> 2), fx = (i & 3) / 4, fy = (j & 3) / 4;
    patch[j * pc + i] = lerp(lerp(nodes[ni], nodes[ni + 1], fx), lerp(nodes[ni + nc + 1], nodes[ni + nc + 2], fx), fy) > 0.58 ? 1 : 0;
  }
  const fc = CN >> 4, shadeF = new Float32Array((fc + 1) * (fc + 1));
  for (let j = 0; j <= fc; j++) for (let i = 0; i <= fc; i++) shadeF[j * (fc + 1) + i] = 1 - forestAt((ax + i * 16) * ART, (ay + j * 16) * ART) * 0.14;
  const ruins = worldKind === 'ruins';
  const tr = ruins ? RUIN_TINT[0] : 1, tg = ruins ? RUIN_TINT[1] : 1, tb = ruins ? RUIN_TINT[2] : 1;
  const mod = (v, n) => ((v % n) + n) % n;
  const xt = T => { const t = new Int32Array(CN); for (let x = 0; x < CN; x++) t[x] = mod(ax + x, T.w); return t; };
  const xS = xt(S), xP = xt(P), xG = xt(G), xG3 = xt(G3);
  const sh4 = new Float32Array(pc * pc);
  let plain = !ruins;
  for (let j = 0; j < pc; j++) for (let i = 0; i < pc; i++) {
    const px = i * 4 + 2, py = j * 4 + 2, fi = (py >> 4) * (fc + 1) + (px >> 4), fx = (px & 15) / 16, fy = (py & 15) / 16;
    const v = lerp(lerp(shadeF[fi], shadeF[fi + 1], fx), lerp(shadeF[fi + fc + 1], shadeF[fi + fc + 2], fx), fy);
    sh4[j * pc + i] = v;
    if (v < 0.999) plain = false;
  }
  for (let y = 0; y < CN; y++) {
    const Y = ay + y, row = (y + 1) * N, o = y * CN, cr = (y >> 2) * pc;
    const gyS = mod(Y, S.h) * S.w, gyP = mod(Y, P.h) * P.w, gyG = mod(Y, G.h) * G.w, gyG3 = mod(Y, G3.h) * G3.w;
    for (let x = 0; x < CN; x++) {
      const mi = row + x + 1, v = m[mi];
      if (v === 1) { out[o + x] = S.d[gyS + xS[x]]; continue; }
      const n1 = m[mi - 1], n2 = m[mi + 1], n3 = m[mi - N], n4 = m[mi + N];
      if (v === 2) {
        const col = P.d[gyP + xP[x]];
        out[o + x] = n1 === 1 || n2 === 1 || n3 === 1 || n4 === 1 ? ((col & 0xff) * 0.85) | ((((col >> 8) & 0xff) * 0.85) << 8) | ((((col >> 16) & 0xff) * 0.82) << 16) | 0xff000000 : col;
        continue;
      }
      const ci = cr + (x >> 2);
      const col = patch[ci] ? G3.d[gyG3 + xG3[x]] : G.d[gyG + xG[x]];
      const edge = n1 | n2 | n3 | n4;
      if (plain && !edge) { out[o + x] = col; continue; }
      const sf = sh4[ci];
      let kr = tr * sf, kg = tg * sf, kb = tb * sf;
      if (edge) {
        const k = n1 === 1 || n2 === 1 || n3 === 1 || n4 === 1 ? 0.7 : 0.8;
        kr *= k; kg *= k; kb *= k * 0.92;
      }
      out[o + x] = ((col & 0xff) * kr) | ((((col >> 8) & 0xff) * kg) << 8) | ((((col >> 16) & 0xff) * kb) << 16) | 0xff000000;
    }
  }
  g.putImageData(img, 0, 0);
  if (ruins) {
    for (let i = 0; i < 7; i++) scorch(g, rng.range(20, CN - 20), rng.range(20, CN - 20), rng.range(6, 14), rng.range(3, 7), Math.floor(rng.range(0, 1e6)));
    for (let i = 0; i < 11; i++) scatterRubble(g, rng.range(20, CN - 20), rng.range(20, CN - 20), rng.range(3, 7), Math.floor(rng.range(0, 1e6)));
  }
  g.save();
  g.globalAlpha = 0.22;
  for (const b of ch.buildings) disc(g, (b.x + b.w * 0.55) / ART - ax, (b.y + b.d) / ART - ay, b.w / ART * 0.55, 6, '#14240c');
  for (const t of ch.trees) disc(g, t.x / ART + 3 - ax, t.y / ART - ay, t.img.width * 0.42, Math.max(3, t.img.width * 0.12), '#14240c');
  g.restore();
  return c;
}

const GEN_PROF = {};
function genChunk(cx, cy) {
  const T = performance.now();
  const rng = makeRng(Math.floor(hash2(cx, cy, WSEED + 101) * 4294967295));
  const ch = { cx, cy, wx: cx * CHUNK, wy: cy * CHUNK, buildings: [], trees: [], props: [], anchors: [], emitters: [], plazas: [], roads: [], mask: null, canvas: null };
  ch.mask = chunkRoads(ch);
  const T1 = performance.now();
  chunkPlazas(ch, rng);
  chunkLanes(ch, rng);
  chunkBuildings(ch, rng);
  chunkNature(ch, rng);
  const T2 = performance.now();
  ch.canvas = paintChunk(ch, rng);
  const T3 = performance.now();
  GEN_PROF.roads = (GEN_PROF.roads || 0) + T1 - T; GEN_PROF.place = (GEN_PROF.place || 0) + T2 - T1; GEN_PROF.paint = (GEN_PROF.paint || 0) + T3 - T2; GEN_PROF.n = (GEN_PROF.n || 0) + 1;
  chunks.set(ckey(cx, cy), ch);
  worldListsDirty = true;
  return ch;
}

function chunkOf(x, y) {
  return chunks.get(ckey(Math.floor(x / CHUNK), Math.floor(y / CHUNK)));
}

function floorZ(x, y) {
  const ch = chunkOf(x, y);
  if (!ch) return 0;
  let z = 0;
  for (const b of ch.buildings) if (b.h > z && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.d) z = b.h;
  return z;
}

function syncWorldLists() {
  buildings = []; trees = []; props = []; anchors = []; emitters = [];
  for (const ch of chunks.values()) {
    for (const o of ch.buildings) buildings.push(o);
    for (const o of ch.trees) trees.push(o);
    for (const o of ch.props) props.push(o);
    for (const o of ch.anchors) anchors.push(o);
    for (const o of ch.emitters) emitters.push(o);
  }
  worldListsDirty = false;
}

function worldTick(all) {
  if (!cam) return;
  const vw = viewW(), vh = viewH();
  const x0 = Math.floor((cam.x - 120) / CHUNK), x1 = Math.floor((cam.x + vw + 120) / CHUNK);
  const y0 = Math.floor((cam.y - 120) / CHUNK), y1 = Math.floor((cam.y + vh + 420) / CHUNK);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (!chunks.has(ckey(cx, cy))) genChunk(cx, cy);
  const mx = (cam.x + vw / 2) / CHUNK - 0.5, my = (cam.y + vh / 2) / CHUNK - 0.5;
  let best = null, bd = Infinity;
  for (let cy = y0 - 1; cy <= y1 + 1; cy++) for (let cx = x0 - 1; cx <= x1 + 1; cx++) {
    if (chunks.has(ckey(cx, cy))) continue;
    if (all) { genChunk(cx, cy); continue; }
    const d = Math.hypot(cx - mx, cy - my);
    if (d < bd) { bd = d; best = [cx, cy]; }
  }
  if (best) genChunk(best[0], best[1]);
  if (chunks.size > CHUNK_KEEP) {
    const list = [...chunks.values()].sort((a, b) => Math.hypot(b.cx - mx, b.cy - my) - Math.hypot(a.cx - mx, a.cy - my));
    const drop = chunks.size - CHUNK_KEEP + 8;
    for (let i = 0; i < drop && i < list.length; i++) {
      const ch = list[i];
      if (ch.cx >= x0 - 1 && ch.cx <= x1 + 1 && ch.cy >= y0 - 1 && ch.cy <= y1 + 1) continue;
      chunks.delete(ckey(ch.cx, ch.cy));
    }
    worldListsDirty = true;
  }
  if (worldListsDirty) syncWorldLists();
}

function drawGround() {
  const vw = viewW(), vh = viewH();
  const x0 = Math.floor(cam.x / CHUNK), x1 = Math.floor((cam.x + vw) / CHUNK);
  const y0 = Math.floor(cam.y / CHUNK), y1 = Math.floor((cam.y + vh) / CHUNK);
  for (let cy = y0; cy <= y1 + 1; cy++) for (let cx = x0; cx <= x1 + 1; cx++) {
    const ch = chunks.get(ckey(cx, cy));
    if (ch) bctx.drawImage(ch.canvas, cx * CN - camA.x + shk.x, cy * CN - camA.y + shk.y);
  }
}

function spotNear(minD, maxD, test) {
  const p = player;
  for (let i = 0; i < 40; i++) {
    const a = rand(0, TAU), d = rand(minD, maxD);
    const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (!chunkOf(x, y) || floorZ(x, y) > 0) continue;
    if (test && !test(x, y)) continue;
    return { x, y };
  }
  return null;
}

function startSpot() {
  return { x: ORIGIN, y: ORIGIN + (worldKind === 'field' ? 0 : 120) };
}
