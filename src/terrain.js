'use strict';

const BIOMES = {
  city: {
    grass: ['#33402c', '#3d4b31', '#475537', '#52603d', '#5e6c45', '#6c7a4e'],
    dirt: ['#4a3e30', '#584a39', '#665643', '#74634e'],
    stone: ['#5a564f', '#67625a', '#736e65', '#7f7a70', '#8b857a'],
    gap: '#2c2a26', edge: '#2e3a28', flowers: ['#b8b2a4', '#a89a62', '#8a6a72'], dirtAt: 0.64,
  },
  ruins: {
    grass: ['#363a2a', '#404430', '#4a4d36', '#55563c', '#606042', '#6a6948'],
    dirt: ['#3e352c', '#4a4035', '#574b3e', '#635647'],
    stone: ['#504c46', '#5b5750', '#67625a', '#726c63', '#7c766c'],
    gap: '#26231f', edge: '#2a2c22', flowers: ['#8a8070', '#7a6a5a'], dirtAt: 0.58,
  },
  field: {
    grass: ['#3c4a2c', '#465633', '#51623a', '#5c6e41', '#687a49', '#768852'],
    dirt: ['#4e4232', '#5c4f3c', '#6a5c47', '#796a53'],
    stone: ['#6a665e', '#7a756c', '#89847a', '#989288', '#a8a296'],
    gap: '#3a362f', edge: '#34422a', flowers: ['#c8c2b0', '#c0a85a', '#9a7a8a', '#8090a8'], dirtAt: 0.68,
  },
};

function noiseGrid(w, h, ox, oy, step, fn) {
  const gw = Math.ceil(w / step) + 2, gh = Math.ceil(h / step) + 2;
  const g = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) g[j * gw + i] = fn(ox + i * step, oy + j * step);
  return { g, gw, inv: 1 / step };
}

function sampleGrid(G, x, y) {
  const fx = x * G.inv, fy = y * G.inv, i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j;
  const k = j * G.gw + i, g = G.g;
  const top = g[k] + (g[k + 1] - g[k]) * tx, bot = g[k + G.gw] + (g[k + G.gw + 1] - g[k + G.gw]) * tx;
  return top + (bot - top) * ty;
}

const packRgb = c => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;

function paintGround(w, h, ox, oy, kind, isStreet, seed = 11) {
  const B = BIOMES[kind];
  const G = B.grass.map(hexRgb).map(packRgb), D = B.dirt.map(hexRgb).map(packRgb), T = B.stone.map(hexRgb).map(packRgb);
  const gap = packRgb(hexRgb(B.gap)), edge = packRgb(hexRgb(B.edge));
  const img = new ImageData(w, h);
  const px = new Uint32Array(img.data.buffer);
  const mask = new Uint8Array(w * h);
  if (isStreet) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = isStreet(x + ox, y + oy) || 0;
  const N1 = noiseGrid(w, h, ox, oy, 6, (X, Y) => fbm(X / 58, Y / 58, 3, seed));
  const N2 = noiseGrid(w, h, ox, oy, 4, (X, Y) => fbm(X / 13, Y / 13, 2, seed + 5));
  const DN = noiseGrid(w, h, ox, oy, 6, (X, Y) => fbm(X / 74, Y / 74, 3, seed + 21));
  const DD = noiseGrid(w, h, ox, oy, 4, (X, Y) => fbm(X / 9, Y / 9, 2, seed + 30));
  const TW = 104, TH = 84;
  let tiles = null;
  if (isStreet) {
    tiles = [0, 1].map(v => {
      const tile = new Uint32Array(TW * TH), tseed = seed + v * 101;
      const cx = (k, j) => ((k % 20) + 20) % 20 + ((((j % 20) + 20) % 20) * 20);
      const JX = new Float32Array(400), JY = new Float32Array(400), TN = new Float32Array(400);
      for (let q = 0; q < 400; q++) { JX[q] = 0.2 + hash2(q, 1, tseed) * 0.6; JY[q] = 0.2 + hash2(q, 2, tseed) * 0.6; TN[q] = hash2(q, 3, tseed); }
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        const gx = x / 5.2, gy = y / 4.2, bxc = Math.floor(gx), byc = Math.floor(gy);
        let d1 = 99, d2 = 99, best = 0, bx = 0, by = 0;
        for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
          const q = cx(bxc + k, byc + j);
          const ddx = gx - (bxc + k + JX[q]), ddy0 = gy - (byc + j + JY[q]), ddy = ddy0 * 1.15;
          const dd = ddx * ddx + ddy * ddy;
          if (dd < d1) { d2 = d1; d1 = dd; best = TN[q]; bx = ddx; by = ddy0; }
          else if (dd < d2) d2 = dd;
        }
        let c;
        if (Math.sqrt(d2) - Math.sqrt(d1) < 0.16) c = best < 0.1 ? G[1] : gap;
        else if (best < (kind === 'ruins' ? 0.09 : 0.03)) c = D[1];
        else {
          let t = 1 + Math.floor(best * 2.4);
          if (bx + by < -0.32) t += 1;
          if (bx + by > 0.36) t -= 1;
          c = T[t < 0 ? 0 : t > 4 ? 4 : t];
        }
        tile[y * TW + x] = c;
      }
      return tile;
    });
  }
  const holes = kind === 'ruins' ? 0.09 : 0.03, dirtAt = B.dirtAt;
  for (let y = 0; y < h; y++) {
    const Y = y + oy, brow = (Y & 3) * 4;
    for (let x = 0; x < w; x++) {
      const X = x + ox, i = y * w + x;
      const m = mask[i];
      const bz = BAYER4[brow + (X & 3)];
      if (m === 1) {
        const tx = ((X % TW) + TW) % TW, ty = ((Y % TH) + TH) % TH;
        px[i] = tiles[hash2(Math.floor(X / TW), Math.floor(Y / TH), seed) < 0.5 ? 0 : 1][ty * TW + tx];
        continue;
      }
      if (m === 2) {
        let t = Math.floor(sampleGrid(DD, x, y) * 4.2 - 0.4 + bz * 0.8);
        if (hash2(X, Y, seed + 41) < 0.03) t = 3;
        px[i] = D[t < 0 ? 0 : t > 3 ? 3 : t];
        continue;
      }
      const dn = sampleGrid(DN, x, y);
      if (dn > dirtAt) {
        let t = Math.floor((sampleGrid(DD, x, y) * 1.2 - 0.1) * 4 + bz * 0.8);
        if (hash2(X, Y, seed + 31) < 0.02) t = 3;
        px[i] = D[t < 0 ? 0 : t > 3 ? 3 : t];
        continue;
      }
      if (dn > dirtAt - 0.025) { px[i] = G[0]; continue; }
      const n = sampleGrid(N1, x, y) * 0.72 + sampleGrid(N2, x, y) * 0.36;
      const t = Math.floor((n - 0.12) * 6.4 + bz * 0.9);
      px[i] = G[t < 0 ? 0 : t > 5 ? 5 : t];
    }
  }
  if (isStreet) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (mask[i]) continue;
        if (mask[i - w] || mask[i - 1] || mask[i + 1] || mask[i + w]) px[i] = edge;
      }
    }
  }
  const r = makeRng(seed * 7 + 1);
  const tufts = Math.floor(w * h / 70);
  for (let k = 0; k < tufts; k++) {
    const x = r.int(1, w - 2), y = r.int(2, h - 2), i = y * w + x;
    if (mask[i] || mask[i - w]) continue;
    const bright = r.chance(0.5) ? 5 : 4;
    px[i - w - 1] = G[bright];
    px[i - w + 1] = G[bright];
    px[i] = G[bright - 1];
    px[i + w] = G[1];
  }
  const fl = Math.floor(w * h / (kind === 'field' ? 900 : 2600));
  for (let k = 0; k < fl; k++) {
    const x = r.int(3, w - 4), y = r.int(3, h - 4);
    if (mask[y * w + x]) continue;
    const c = packRgb(hexRgb(r.pick(B.flowers)));
    for (let j = 0; j < 4; j++) px[(y + r.int(-2, 2)) * w + x + r.int(-2, 2)] = c;
  }
  return img;
}

function scatterRubble(g, x, y, rad, seed) {
  const r = makeRng(seed);
  const tones = ['#3e3a34', '#57524a', '#6a655c', '#7e786e', '#8e887c'];
  for (let i = 0; i < rad * rad * 0.5; i++) {
    const a = r.range(0, TAU), d = Math.pow(r.next(), 0.7) * rad;
    const sx = Math.round(x + Math.cos(a) * d), sy = Math.round(y + Math.sin(a) * d * 0.6);
    const s = r.int(1, 3);
    rect(g, sx, sy + 1, s + 1, 1, '#2a2622');
    rect(g, sx, sy, s, s > 1 ? 2 : 1, tones[r.int(1, 3)]);
    rect(g, sx, sy, 1, 1, tones[4]);
  }
}

function scorch(g, x, y, rx, ry, seed) {
  const r = makeRng(seed);
  for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
    const q = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
    if (q > 1) continue;
    const X = Math.round(x + xx), Y = Math.round(y + yy);
    if (bayer(X, Y) + 0.5 < (1 - q) * 1.4 + (r.next() - 0.5) * 0.3) rect(g, X, Y, 1, 1, q < 0.3 ? '#1e1a16' : '#2c2620');
  }
}

function wallMaria(w, h, seed = 5) {
  const P = new PixBuf(w, h);
  const tones = ['#4a4640', '#55514a', '#605b53', '#6b665d', '#767066'].map(hexRgb);
  const mortar = hexRgb('#2e2b27'), moss = ['#3a4630', '#46543a'].map(hexRgb);
  const bh = 9, bw = 22, d = P.d;
  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / bh), off = (row & 1) * 11;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const col = Math.floor((x + off) / bw);
      const lx = (x + off) - col * bw, ly = y - row * bh;
      let cc;
      if (ly === 0 || lx === 0) cc = mortar;
      else {
        const hb = hash2(col, row, seed);
        let t = 1 + Math.floor(hb * 2.6);
        if (ly === 1) t += 1;
        if (ly === bh - 1 || lx === bw - 1) t -= 1;
        if (fbm(x / 3, y / 40, 2, seed + 4) > 0.68) t -= 1;
        t += Math.floor(bayer(x, y) * 0.6 + (valueNoise(x / 6, y / 6, seed + 8) - 0.5) * 1.2);
        cc = tones[clamp(t, 0, 4)];
        if (valueNoise(x / 18, y / 10, seed + 12) * 0.8 + (y / h) * 0.35 > 0.78) cc = moss[(hash2(x, y, 3) * 2) | 0];
      }
      const dark = Math.max(0, (y - h * 0.55) / (h * 0.45)) * 0.35;
      d[i * 4] = cc[0] * (1 - dark); d[i * 4 + 1] = cc[1] * (1 - dark); d[i * 4 + 2] = cc[2] * (1 - dark); d[i * 4 + 3] = 255;
    }
  }
  const r = makeRng(seed);
  for (let k = 0; k < Math.max(3, w / 90); k++) {
    let x = r.range(0, w), y = r.range(0, h * 0.7);
    for (let s = 0; s < 14; s++) {
      const nx = x + r.range(-3, 3), ny = y + r.range(1, 4);
      P.line(x, y, nx, ny, 1, 'rgba(20, 16, 14, 0.7)');
      x = nx; y = ny;
    }
  }
  for (let x = 0; x < w; x++) {
    const hh = Math.round(2 + valueNoise(x / 7, 1, seed) * 6);
    for (let k = 0; k < hh; k++) P.px(x, h - 1 - k, k < 2 ? '#2a2620' : r.pick(['#4a463e', '#5a554c', '#3e3a33']));
  }
  return P.canvas();
}

function wallTop(g, x, y, w, h, seed) {
  const P = new PixBuf(w, h);
  const r = makeRng(seed);
  const tones = ['#5e5a52', '#6a665d', '#767168', '#827c72', '#8e887d'];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const row = Math.floor(yy / 8), off = (row & 1) * 7, col = Math.floor((xx + off) / 14);
    const lx = (xx + off) - col * 14, ly = yy - row * 8;
    let t = 2 + Math.floor(hash2(col, row, seed) * 2 + bayer(xx, yy) * 0.5);
    if (lx === 0 || ly === 0) t = 0;
    else if (ly === 1) t += 1;
    if (valueNoise(xx / 9, yy / 9, seed) > 0.82) t -= 1;
    P.px(xx, yy, tones[clamp(t, 0, 4)]);
  }
  g.drawImage(P.canvas(), x, y);
}

const WALLS = ['#cdbfa4', '#c4b496', '#d4c8b0', '#bcae94', '#c8b89a'];
const ROOFS = ['#6b3a2c', '#5a4a48', '#7a4630', '#4a4e5a', '#6a4436', '#5e3a30'];
const SHUTTERS = ['#3e5a44', '#5a3a2c', '#4a5468', '#6a3a32'];

function buildHouse2(o) {
  const r = makeRng(o.seed || 1);
  const w = Math.round(o.w), dpt = Math.round(o.d), wallH = Math.round(o.h * KZ);
  const side = 5, chim = 14, pad = 4;
  const P = new PixBuf(w + side + pad * 2, dpt + wallH + chim + pad * 2);
  const x0 = pad, y0 = pad + chim, wy = y0 + dpt;
  const plaster = o.wall || r.pick(WALLS), roof = o.roof || r.pick(ROOFS), beam = '#3a2a20', beamL = '#54402e';
  const shutter = r.pick(SHUTTERS);
  const pr = makeRamp(plaster, 5, { lo: 0.3, hi: 0.08 }).map(hexRgb);
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < w; x++) {
      const n = valueNoise((x + o.seed * 31) / 5, y / 11, 4) + (hash2(x, y, o.seed) - 0.5) * 0.25;
      let t = 3 + Math.floor((n - 0.5) * 1.6 + bayer(x, y) * 0.5);
      if (x < 2) t += 1;
      if (y > wallH - 6) t -= 1;
      if (y > wallH - 3) t -= 1;
      P.put(x0 + x, wy + y, pr[t < 0 ? 0 : t > 4 ? 4 : t]);
    }
  }
  const stoneH = wallH > 52 ? Math.round(22 * KZ) : 0;
  if (stoneH) {
    const sr = makeRamp('#8a8476', 5, { lo: 0.3, hi: 0.1 }).map(hexRgb);
    for (let y = 0; y < stoneH; y++) {
      const row = Math.floor(y / 5), off = (row & 1) * 4;
      for (let x = 0; x < w; x++) {
        const lx = (x + off) % 8, ly = y % 5;
        let t = 2 + Math.floor(hash2(Math.floor((x + off) / 8), row, o.seed + 1) * 2);
        if (lx === 0 || ly === 0) t = 0;
        else if (ly === 1) t += 1;
        if (y > stoneH - 3) t -= 1;
        P.put(x0 + x, wy + wallH - stoneH + y, sr[t < 0 ? 0 : t > 4 ? 4 : t]);
      }
    }
  }
  const upper = wallH - stoneH;
  const floorH = Math.max(20, Math.round(34 * KZ));
  const floors = Math.max(1, Math.round(upper / floorH));
  const fh = upper / floors;
  const bays = Math.max(2, Math.round(w / 21));
  const bw = w / bays;
  for (let f = 0; f <= floors; f++) {
    const yy = Math.round(wy + f * fh);
    if (f < floors || !stoneH) P.rect(x0, yy, w, 2, beam);
    P.rect(x0, yy, w, 1, beamL);
  }
  for (let b = 0; b <= bays; b++) {
    const xx = Math.round(x0 + b * bw) - (b === bays ? 2 : 0);
    P.rect(xx, wy, 2, upper, beam);
    P.rect(xx, wy, 1, upper, beamL);
  }
  for (let f = 0; f < floors; f++) {
    for (let b = 0; b < bays; b++) {
      if ((b + f) % 3 !== 0) continue;
      const ax = x0 + b * bw + 2, ay = wy + f * fh + 2, bx = x0 + (b + 1) * bw - 1, by = wy + (f + 1) * fh - 1;
      if (r.chance(0.5)) { P.line(ax, by, bx, ay, 1, beam); P.line(ax, ay, bx, by, 1, beam); }
      else { P.line(ax, by, (ax + bx) / 2, ay, 1, beam); P.line((ax + bx) / 2, ay, bx, by, 1, beam); }
    }
  }
  const glass = o.ruin ? '#120e0c' : '#1e2632', glassL = o.ruin ? '#2a221e' : '#55667a';
  for (let f = 0; f < floors; f++) {
    for (let b = 0; b < bays; b++) {
      if ((b + f) % 3 === 0) continue;
      const cx = Math.round(x0 + (b + 0.5) * bw), wy0 = Math.round(wy + f * fh + fh * 0.22);
      const ww = 6, wh = Math.max(7, Math.round(fh * 0.5));
      P.rect(cx - ww / 2 - 1, wy0 - 1, ww + 2, wh + 2, beam);
      const lit = !o.ruin && r.chance(o.lit ?? 0.1);
      P.rect(cx - ww / 2, wy0, ww, wh, lit ? '#d89848' : glass);
      P.rect(cx - ww / 2, wy0, 2, 2, lit ? '#f6d48a' : glassL);
      P.rect(cx - 0.5, wy0, 1, wh, beam);
      P.rect(cx - ww / 2, wy0 + Math.round(wh / 2), ww, 1, beam);
      if (!o.ruin && r.chance(0.7)) {
        P.rect(cx - ww / 2 - 3, wy0, 2, wh, shutter);
        P.rect(cx + ww / 2 + 1, wy0, 2, wh, shutter);
        P.rect(cx - ww / 2 - 3, wy0, 1, wh, shade(shutter, 1.25));
      }
      P.rect(cx - ww / 2 - 1, wy0 + wh + 1, ww + 2, 1, shade(plaster, 1.08));
      if (!o.ruin && r.chance(0.18)) {
        P.rect(cx - ww / 2 - 1, wy0 + wh, ww + 2, 2, '#4e6a36');
        for (let k = 0; k < 3; k++) P.px(cx - ww / 2 + k * 2, wy0 + wh - 1, r.pick(['#b8505a', '#d0b860', '#c8c0d8']));
      }
      if (o.ruin) for (let k = 0; k < 8; k++) P.px(cx + r.range(-4, 4), wy0 - r.range(1, 8), 'rgba(20, 14, 12, 0.6)');
    }
  }
  const doorX = Math.round(x0 + (Math.floor(bays / 2) + 0.5) * bw);
  const dh = Math.round(Math.min(stoneH || wallH * 0.4, 18 * KZ) + 2), dwid = 8;
  const dy = wy + wallH - dh;
  P.rect(doorX - dwid / 2 - 1, dy - 1, dwid + 2, dh + 1, '#2a1e18');
  P.rect(doorX - dwid / 2, dy, dwid, dh, o.ruin ? '#1a1410' : '#6b4630');
  if (!o.ruin) {
    for (let k = 1; k < dwid; k += 2) P.rect(doorX - dwid / 2 + k, dy + 1, 1, dh - 1, '#5a3a28');
    P.px(doorX + 2, dy + Math.round(dh / 2), '#d9b45a');
  }
  P.rect(doorX - dwid / 2 - 1, dy - 2, dwid + 2, 1, '#2a1e18');
  const sideR = makeRamp(plaster, 5, { lo: 0.4, hi: 0.05 }).map(hexRgb);
  for (let y = 0; y < wallH; y++) for (let x = 0; x < side; x++) P.put(x0 + w + x, wy + y - Math.round(x * 0.6), sideR[x < 1 ? 1 : 0]);
  const rrh = makeRamp(roof, 6, { lo: 0.26, hi: 0.2 }), rr = rrh.map(hexRgb);
  const ridge = y0 + Math.round(dpt * 0.42);
  for (let y = y0 - 1; y < wy + 3; y++) {
    const north = y < ridge;
    const rowH = north ? 3 : 4;
    const row = Math.floor((y - (north ? y0 : ridge)) / rowH), ly = (y - (north ? y0 : ridge)) - row * rowH;
    const off = (row & 1) * 2;
    for (let x = -2; x < w + side + 1; x++) {
      const lx = (((x + off) % 4) + 4) % 4;
      let t = north ? 2 : 3;
      if (ly === 0) t += 1;
      if (ly === rowH - 1) t -= 2;
      if (lx === 3) t -= 1;
      t += Math.floor((hash2(Math.floor((x + off) / 4), row, o.seed + (north ? 5 : 6)) - 0.5) * 1.6 + bayer(x, y) * 0.3);
      if (north) t = Math.min(t, 3);
      if (x >= w) t -= 1;
      P.put(x0 + x, y - (x >= w ? Math.round((x - w) * 0.6) : 0), rr[t < 0 ? 0 : t > 5 ? 5 : t]);
    }
  }
  P.rect(x0 - 2, ridge - 1, w + side + 3, 1, rrh[5]);
  P.rect(x0 - 2, ridge, w + side + 3, 1, rrh[0]);
  P.rect(x0 - 2, wy + 2, w + 3, 1, rrh[0]);
  for (let k = 0; k < 3; k++) P.rect(x0, wy + 3 + k, w, 1, `rgba(16, 10, 10, ${0.45 - k * 0.14})`);
  let chimney = null;
  if (r.chance(0.75) && !o.ruin) {
    const cx = x0 + Math.round(w * r.range(0.15, 0.75)), cy = ridge - 12;
    const br = makeRamp('#7a4a3a', 4, { lo: 0.25, hi: 0.1 });
    P.rect(cx, cy, 6, 12, br[2]);
    P.rect(cx + 4, cy, 2, 12, br[1]);
    P.rect(cx - 1, cy, 8, 2, br[0]);
    P.rect(cx - 1, cy, 8, 1, br[3]);
    for (let k = 3; k < 12; k += 3) P.rect(cx, cy + k, 4, 1, br[1]);
    chimney = { x: cx + 3 - x0, y: cy - y0 };
  }
  let hole = null;
  if (o.ruin) {
    const from = r.range(0.2, 0.55), to = from + r.range(0.25, 0.4);
    const ax = Math.round(x0 + w * from), bx = Math.round(x0 + w * Math.min(1, to));
    hole = { x: (ax + bx) / 2 - x0, y: dpt * 0.5 };
    for (let x = ax; x < bx; x++) {
      const top = y0 + Math.round(r.range(0, dpt * 0.3));
      for (let y = top; y < wy + 2; y++) P.px(x, y, hash2(x, y, 3) < 0.08 ? '#5a4636' : (y - top < 2 ? '#2a201a' : '#17110e'));
    }
    for (let k = 0; k < 5; k++) {
      const xx = r.range(ax, bx);
      P.line(xx, y0 + r.range(0, dpt * 0.3), xx + r.range(-8, 8), wy, 2, '#3a2a1e');
    }
    let depth = 2;
    for (let x = ax - 4; x < bx + 4; x++) {
      depth = clamp(depth + Math.round(r.range(-1.5, 1.5)), 0, Math.min(14, wallH - 10));
      P.clear(x, wy - 4, 1, depth + 4);
      P.px(x, wy + depth, '#2a2018');
    }
    for (let k = 0; k < 6; k++) P.disc(x0 + r.range(0, w), wy + r.range(0, wallH * 0.7), r.range(3, 7), r.range(5, 12), 'rgba(18, 12, 10, 0.32)');
  }
  return { img: P.canvas(), ox: x0, oy: y0, w, d: dpt, wallH, chimney, hole };
}

function buildTower2(o) {
  const r = makeRng(o.seed || 1);
  const w = Math.round(o.w), dpt = Math.round(o.d), wallH = Math.round(o.h * KZ);
  const roofH = o.ruin ? 0 : Math.round(w * 1.25);
  const pad = 4;
  const P = new PixBuf(w + 6 + pad * 2, dpt + wallH + roofH + pad * 2);
  const x0 = pad, y0 = pad + roofH, wy = y0 + dpt;
  const sr = makeRamp('#a8a090', 5, { lo: 0.34, hi: 0.1 });
  for (let y = 0; y < wallH; y++) {
    const row = Math.floor(y / 5), off = (row & 1) * 4;
    for (let x = 0; x < w; x++) {
      const lx = (x + off) % 9, ly = y % 5;
      let t = 2 + Math.floor(hash2(Math.floor((x + off) / 9), row, o.seed) * 2);
      if (lx === 0 || ly === 0) t = 1;
      else if (ly === 1) t += 1;
      if (x < 2) t += 1;
      if (x > w - 5) t -= 1;
      if (y > wallH - 4) t -= 1;
      if (valueNoise(x / 6, y / 14, o.seed) > 0.8) t -= 1;
      P.px(x0 + x, wy + y, sr[clamp(t, 0, 4)]);
    }
  }
  for (let y = 0; y < wallH; y++) for (let x = 0; x < 6; x++) P.px(x0 + w + x, wy + y - Math.round(x * 0.6), sr[x < 1 ? 1 : 0]);
  const slit = (cx, cy, hh) => {
    P.rect(cx - 2, cy - 1, 5, hh + 2, sr[0]);
    P.rect(cx - 1, cy, 3, hh, '#1a1820');
    P.px(cx - 1, cy, '#3a3a48');
    P.disc(cx, cy, 1.5, 1, '#1a1820');
  };
  for (let y = 14; y < wallH - 26; y += 22) slit(x0 + Math.round(w / 2), wy + y, 9);
  if (!o.ruin) {
    const cx = x0 + Math.round(w / 2), cy = wy + 12;
    P.disc(cx, cy + 1, 7, 7, '#2a2620');
    P.disc(cx, cy, 6, 6, '#efe6cc');
    P.disc(cx, cy, 5, 5, '#e0d4b4');
    P.line(cx, cy, cx, cy - 4, 1, '#2a2430');
    P.line(cx, cy, cx + 3, cy + 1, 1, '#2a2430');
  }
  const dx = x0 + Math.round(w / 2);
  P.rect(dx - 5, wy + wallH - 15, 10, 15, sr[0]);
  P.rect(dx - 4, wy + wallH - 14, 8, 14, '#5a3a28');
  P.disc(dx, wy + wallH - 14, 4, 2, '#5a3a28');
  for (let k = -3; k < 4; k += 2) P.rect(dx + k, wy + wallH - 12, 1, 12, '#4a2e20');
  const tr = makeRamp('#9a9282', 5, { lo: 0.3, hi: 0.12 });
  P.rect(x0 - 1, y0, w + 2, dpt, tr[2]);
  for (let x = x0 - 1; x < x0 + w + 1; x += 5) { P.rect(x, y0 - 2, 3, 3, tr[3]); P.rect(x, y0, 3, 1, tr[4]); }
  P.rect(x0 - 1, wy - 1, w + 2, 1, tr[0]);
  if (!o.ruin) {
    const rr = makeRamp(o.roof || '#4e5a72', 5, { lo: 0.28, hi: 0.14 });
    const apex = y0 - roofH + Math.round(dpt * 0.3), base = wy + 1, cx = x0 + Math.round(w / 2);
    for (let y = apex; y <= base; y++) {
      const k = (y - apex) / (base - apex);
      const half = Math.round(k * (w / 2 + 3));
      for (let x = -half; x <= half; x++) {
        let t = x < -half * 0.35 ? 3 : x < half * 0.4 ? 2 : 1;
        if ((y - apex) % 4 === 0) t -= 1;
        if (((x + (Math.floor((y - apex) / 4) & 1) * 2) & 3) === 0 && (y - apex) % 4 !== 0) t -= 1;
        if (x === -half) t = 4;
        P.px(cx + x, y, rr[clamp(t, 0, 4)]);
      }
    }
    P.rect(cx, apex - 6, 1, 6, '#3a3430');
    P.rect(cx - 1, apex - 5, 3, 1, '#3a3430');
    P.px(cx, apex - 7, '#e8c45a');
  } else {
    let depth = 3;
    for (let x = x0 - 1; x < x0 + w + 7; x++) {
      depth = clamp(depth + Math.round(r.range(-2, 2)), 0, 16);
      P.clear(x, y0 - 3, 1, depth + 3);
    }
  }
  return { img: P.canvas(), ox: x0, oy: y0, w, d: dpt, wallH };
}

function buildBarrel(seed) {
  const S = new Sculpt();
  const wood = matOf('#7a5434', { lo: 0.3, hi: 0.12, noise: 0.2 });
  S.cone([0, 0, 0.5], [0, 0, 9.5], 4.2, 4.2, wood);
  S.ell([0, 0, 5], [4.6, 4.6, 3.2], wood);
  for (const z of [2, 8]) for (let a = 0; a < TAU; a += 0.25) S.dot([Math.cos(a) * 4.45, Math.sin(a) * 4.45, z], '#3a3632');
  return S;
}

function buildCrate(seed) {
  const S = new Sculpt();
  const wood = matOf('#8a6a44', { lo: 0.3, hi: 0.1, noise: 0.15 });
  S.box([0, 0, 5], [5, 5, 5], wood);
  for (const s of [-1, 1]) {
    S.stroke([[s * 5.05, -5, 0.5], [s * 5.05, 5, 9.5]], '#4a3622');
    S.stroke([[-5, s * 5.05, 0.5], [5, s * 5.05, 9.5]], '#4a3622');
  }
  S.stroke([[-5, -5, 10.05], [5, 5, 10.05]], '#4a3622');
  return S;
}

function buildHay(seed) {
  const r = makeRng(seed);
  const S = new Sculpt();
  const hay = matOf('#b89a52', { lo: 0.34, hi: 0.14, noise: 0.5, dither: 0.6 });
  S.ell([0, 0, 6], [9, 9, 7.5], hay);
  S.ell([r.range(-2, 2), r.range(-2, 2), 11], [5, 5, 4], hay);
  return S;
}

function buildFountain() {
  const S = new Sculpt();
  const stone = matOf('#9a948a', { lo: 0.36, hi: 0.12, noise: 0.15 });
  const water = material('#4e7a90', { ramp: ['#24404e', '#355a6c', '#4e7a90', '#7aa4b4', '#cfe6ee'], gloss: 1.4 });
  S.cone([0, 0, 0], [0, 0, 7], 23, 23, stone);
  S.ell([0, 0, 6.6], [20, 20, 1.2], water);
  S.cone([0, 0, 6], [0, 0, 20], 3.2, 2.4, stone);
  S.ell([0, 0, 20], [8, 8, 2.4], stone);
  S.ell([0, 0, 21.4], [6.4, 6.4, 0.9], water);
  S.cone([0, 0, 21], [0, 0, 27], 1.4, 1.0, stone);
  S.sph([0, 0, 28], 1.8, stone);
  return S;
}
