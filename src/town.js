'use strict';

let townMask = null, townRoads = [];

function roadPolyline(points, w, kind) {
  return { pts: points, w, kind };
}

function wanderRoad(x, y, ang, len, step, turn, w, kind, inside) {
  const pts = [[x, y]];
  let a = ang;
  for (let d = 0; d < len; d += step) {
    a += rand(-turn, turn);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    if (!inside(x, y)) break;
    pts.push([x, y]);
  }
  return roadPolyline(pts, w, kind);
}

function ringRoad(cx, cy, r, jitter, w, kind, seed) {
  const pts = [];
  for (let a = 0; a <= TAU + 0.001; a += TAU / 56) {
    const rr = r + (valueNoise(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed) - 0.5) * jitter * 2;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return roadPolyline(pts, w, kind);
}

function buildRoadNet(kind) {
  const c = WORLD / 2;
  const lo = BORDER + 70, hi = WORLD - BORDER - 70;
  const inside = (x, y) => x > lo && x < hi && y > lo && y < hi;
  const roads = [];
  const seed = Math.random() * 50;
  roads.push(ringRoad(c, c, 620, 70, 70, 1, seed));
  roads.push(ringRoad(c, c, 1180, 120, 66, 1, seed + 9));
  const nr = kind === 'ruins' ? 5 : 6, a0 = rand(0, TAU);
  for (let i = 0; i < nr; i++) {
    const a = a0 + i * TAU / nr + rand(-0.25, 0.25);
    roads.push(wanderRoad(c + Math.cos(a) * 230, c + Math.sin(a) * 230, a, 1700, 60, 0.09, 66, 1, inside));
  }
  const lanes = kind === 'ruins' ? 12 : 14;
  for (let i = 0; i < lanes; i++) {
    const base = pick(roads);
    const p = base.pts[Math.floor(rand(0, base.pts.length))];
    if (!p) continue;
    const out = Math.atan2(p[1] - c, p[0] - c);
    const a = out + (Math.random() < 0.5 ? 1 : -1) * rand(0.6, 1.6);
    roads.push(wanderRoad(p[0], p[1], a, rand(260, 560), 50, 0.22, 44, 2, inside));
  }
  return roads;
}

function rasterRoads(roads, n, kind) {
  const m = new Uint8Array(n * n);
  const stamp = (cx, cy, r, v) => {
    const R = Math.ceil(r), x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(n - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(n - 1, Math.ceil(cy + R)), r2 = r * r;
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy, row = y * n;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2 && (v === 1 || !m[row + x])) m[row + x] = v;
      }
    }
  };
  const order = roads.slice().sort((a, b) => b.kind - a.kind);
  for (const rd of order) {
    for (let i = 0; i < rd.pts.length - 1; i++) {
      const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay) / ART, steps = Math.max(1, Math.ceil(len / 1.5));
      for (let k = 0; k <= steps; k++) {
        const x = (ax + (bx - ax) * k / steps) / ART, y = (ay + (by - ay) * k / steps) / ART;
        const r = rd.w / 2 / ART * (0.9 + valueNoise(x / 14, y / 14, 31) * 0.25);
        stamp(x, y, r, rd.kind);
      }
    }
  }
  const pc = WORLD / 2 / ART;
  stamp(pc, pc, (kind === "city" ? 250 : 190) / ART, 1);
  return m;
}

function onRoad(x, y) {
  if (!townMask) return false;
  const n = Math.ceil(WORLD / ART);
  const X = Math.floor(x / ART), Y = Math.floor(y / ART);
  if (X < 0 || Y < 0 || X >= n || Y >= n) return false;
  return townMask[Y * n + X] > 0;
}

function footprintFree(x, y, w, d, margin) {
  if (x < BORDER + 30 || y < BORDER + 70 || x + w > WORLD - BORDER - 30 || y + d > WORLD - BORDER - 20) return false;
  for (const b of buildings) {
    if (x < b.x + b.w + margin && x + w + margin > b.x && y < b.y + b.d + margin * 1.6 && y + d + margin * 1.6 > b.y) return false;
  }
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 3; j++) if (onRoad(x + w * i / 4, y + d * j / 3)) return false;
  if (Math.hypot(x + w / 2 - WORLD / 2, y + d / 2 - WORLD / 2) < 300) return false;
  return true;
}

function spriteSize(key) {
  const img = SPR[key];
  if (!img) return null;
  const w = img.width * ART, full = img.height * ART;
  return { w, d: Math.round(full * 0.34) };
}

function placeAlongRoads(kind) {
  const ruinKeys = ['ruin_r1', 'ruin_r2', 'ruin_r3', 'ruin_r4'].filter(k => SPR[k]);
  const ruins = kind === 'ruins';
  const pickKey = () => {
    const r = Math.random();
    if (r < (ruins ? 0.04 : 0.07)) return ['tower', 'house_tower'];
    if (ruins && ruinKeys.length && Math.random() < 0.6) return ['ruin', pick(ruinKeys)];
    return ['house', pick(['house_h1', 'house_h2', 'house_h3'])];
  };
  const skip = ruins ? 0.3 : 0.14;
  const list = townRoads.slice().sort((a, b) => a.kind - b.kind);
  for (const rd of list) {
    let carry = rand(0, 80);
    for (let i = 0; i < rd.pts.length - 1; i++) {
      const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
      const seg = Math.hypot(bx - ax, by - ay);
      const tx = (bx - ax) / seg, ty = (by - ay) / seg, nx = -ty, ny = tx;
      for (let s = carry; s < seg; s += rand(150, 230)) {
        const px = ax + tx * s, py = ay + ty * s;
        for (const side of [-1, 1]) {
          if (Math.random() < skip) continue;
          const [kindB, key] = pickKey();
          const sz = spriteSize(key);
          if (!sz) continue;
          const half = Math.abs(nx) * sz.w / 2 + Math.abs(ny) * sz.d / 2;
          const off = rd.w / 2 + half + rand(14, 40);
          const cx = px + nx * side * off, cy = py + ny * side * off;
          const x = cx - sz.w / 2, y = cy - sz.d / 2;
          if (!footprintFree(x, y, sz.w, sz.d, 26)) continue;
          const b = addBuilding(kindB, key, x, y);
          if (b && kindB === 'house') houseProps(b);
          else if (b && kindB === 'ruin' && Math.random() < 0.6) addProp(b.x + rand(10, b.w - 10), b.y + b.d + rand(6, 18), pick(['rock_mossy', 'woodpile', 'cart', 'rain_barrel', 'log_mossy']));
        }
        carry = 0;
      }
    }
  }
}

function freeGrass(x, y, r) {
  if (x < BORDER + 40 || y < BORDER + 60 || x > WORLD - BORDER - 40 || y > WORLD - BORDER - 30) return false;
  if (onRoad(x, y) || onRoad(x + r, y) || onRoad(x - r, y)) return false;
  for (const b of buildings) if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.d + r * 2.5) return false;
  return true;
}

function decorateTown(kind) {
  const c = WORLD / 2;
  const ruins = kind === 'ruins';
  for (let k = 0; k < (ruins ? 22 : 44); k++) {
    const gx = rand(BORDER + 150, WORLD - BORDER - 150), gy = rand(BORDER + 150, WORLD - BORDER - 150);
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const x = gx + rand(-110, 110), y = gy + rand(-80, 80);
      if (freeGrass(x, y, 40) && !trees.some(t => Math.hypot(t.x - x, t.y - y) < 70)) addTree(x, y, pick(ruins ? ['oak', 'pine1', 'pine2'] : TREE_KEYS));
    }
  }
  const smalls = ruins ? ['rock_mossy', 'log_mossy', 'woodpile', 'grass_tall', 'bush0'] : ['bush1', 'bush_berry', 'bush0', 'bush2', 'flowers_wild', 'flowers_blue', 'grass_tall', 'grass_tall', 'flower_pots'];
  for (let i = 0; i < (ruins ? 120 : 220); i++) {
    const x = rand(BORDER + 60, WORLD - BORDER - 60), y = rand(BORDER + 80, WORLD - BORDER - 60);
    if (freeGrass(x, y, 18)) addProp(x, y, pick(smalls));
  }
  for (const rd of townRoads) {
    if (rd.kind !== 1) continue;
    for (let i = 3; i < rd.pts.length - 1; i += ruins ? 9 : 6) {
      const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1];
      const l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l, side = Math.random() < 0.5 ? 1 : -1;
      const x = ax + nx * side * (rd.w / 2 + 14), y = ay + ny * side * (rd.w / 2 + 14);
      if (freeGrass(x, y, 8)) addProp(x, y, 'lamp_post_wood');
    }
  }
  for (let i = 0; i < (ruins ? 3 : 6); i++) {
    const x = rand(BORDER + 200, WORLD - BORDER - 200), y = rand(BORDER + 200, WORLD - BORDER - 200);
    if (freeGrass(x, y, 50)) {
      addProp(x, y, 'well');
      for (let k = 0; k < 3; k++) { const a = rand(0, TAU); if (freeGrass(x + Math.cos(a) * 70, y + Math.sin(a) * 50, 15)) addProp(x + Math.cos(a) * 70, y + Math.sin(a) * 50, pick(['bench', 'flowers_wild', 'rain_barrel'])); }
    }
  }
  if (!ruins) {
    addProp(c, c + 10, 'statue');
    for (let a = 0; a < TAU; a += TAU / 6) addProp(c + Math.cos(a) * 200, c + Math.sin(a) * 200, 'lamp_post_wood');
    for (let a = 0.5; a < TAU; a += TAU / 4) addProp(c + Math.cos(a) * 125, c + Math.sin(a) * 125 + 10, 'bench');
  }
}

function genTown(kind) {
  townRoads = buildRoadNet(kind);
  townMask = rasterRoads(townRoads, Math.ceil(WORLD / ART), kind);
  placeAlongRoads(kind);
  decorateTown(kind);
}
