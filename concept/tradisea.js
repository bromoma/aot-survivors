'use strict';

const BW = 640, BH = 400, PXS = 2;
const screenC = document.getElementById('c');
const sctx = screenC.getContext('2d');
const [buf, b] = makeCanvas(BW, BH);

const FILES = {
  grass: '../assets/tradisea/grass.png', path: '../assets/tradisea/path.png',
  oak: '../assets/tradisea/oak.png', pine: '../assets/tradisea/pine1.png', pine2: '../assets/tradisea/pine2.png', statue: '../assets/tradisea/statue.png', bench: '../assets/tradisea/bench.png', flowers: '../assets/tradisea/flowers_wild.png', hay: '../assets/tradisea/hay_bales.png',
  well: '../assets/tradisea/well.png', lamp: '../assets/tradisea/lamp_post_wood.png', pots: '../assets/tradisea/flower_pots.png',
  barrel: '../assets/tradisea/rain_barrel.png', cart: '../assets/tradisea/cart.png', bush: '../assets/tradisea/bush1.png',
  berry: '../assets/tradisea/bush_berry.png', log: '../assets/tradisea/log_mossy.png', rock: '../assets/tradisea/rock_mossy.png',
  h1: '../assets/sprites/house_h1.png', h2: '../assets/sprites/house_h2.png', h3: '../assets/sprites/house_h3.png', tower: '../assets/sprites/house_tower.png',
  hero: '../assets/sprites/scout48_down.png', heroBack: '../assets/sprites/scout48_up.png', fly: '../assets/sprites/scoutfly44_left.png',
  tFront: '../assets/sprites/titan160_down.png', tBack: '../assets/sprites/titan160_up.png', tSide: '../assets/sprites/titan130_right.png',
};
const IMG = {};

function load() {
  return Promise.all(Object.entries(FILES).map(([k, src]) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => rej(new Error('load ' + src));
    im.src = src;
  })));
}

function shadow(x, y, rx, ry, a = 0.28) {
  b.save();
  b.globalAlpha = a;
  disc(b, x, y, rx, ry, '#1e3410');
  b.restore();
}

function put(img, x, y, items, sh = 0.28, flip = false) {
  items.push({ y, draw: () => {
    if (sh) shadow(x, y - 1, Math.round(img.width * 0.42), Math.max(2, Math.round(img.width * 0.12)), sh);
    const dx = Math.round(x - img.width / 2), dy = Math.round(y - img.height);
    if (flip) { b.save(); b.translate(dx + img.width, dy); b.scale(-1, 1); b.drawImage(img, 0, 0); b.restore(); }
    else b.drawImage(img, dx, dy);
  } });
}

function road(points, width) {
  const [mc, mg] = makeCanvas(BW, BH);
  mg.fillStyle = '#000';
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t);
      const w = width * (0.85 + valueNoise(x / 23, y / 23, 3) * 0.3);
      disc(mg, x, y, w, w * 0.8, '#000');
    }
  }
  const md = mg.getImageData(0, 0, BW, BH);
  const [tc, tg] = makeCanvas(BW, BH);
  tg.fillStyle = tg.createPattern(IMG.path, 'repeat');
  tg.fillRect(0, 0, BW, BH);
  tg.globalCompositeOperation = 'destination-in';
  tg.drawImage(mc, 0, 0);
  const ed = b.getImageData(0, 0, BW, BH);
  for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) {
    const i = (y * BW + x) * 4 + 3;
    if (md.data[i]) continue;
    if (md.data[i - 4] || md.data[i + 4] || md.data[i - BW * 4] || md.data[i + BW * 4]) {
      ed.data[i - 3] *= 0.72; ed.data[i - 2] *= 0.78; ed.data[i - 1] *= 0.7;
    }
  }
  b.putImageData(ed, 0, 0);
  b.drawImage(tc, 0, 0);
}

function puff(x, y, r, a) {
  b.save();
  b.globalAlpha = a;
  disc(b, x, y + 1, r, r * 0.9, '#c8ccd0');
  disc(b, x, y, r, r * 0.9, '#f4f6f8');
  disc(b, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.4, '#ffffff');
  b.restore();
}

function slash(x, y, R, a0, a1) {
  const steps = Math.ceil(Math.abs(a1 - a0) * R);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = lerp(a0, a1, t), th = Math.sin(t * Math.PI) * 3;
    for (let j = 0; j <= th; j++) rect(b, x + Math.cos(a) * (R - j), y + Math.sin(a) * (R - j) * 0.7, 1, 1, j === 0 ? '#ffffff' : '#bfe8ff');
  }
}

function wireLine(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * 4;
    rect(b, x, y + 1, 1, 1, '#3a3f46');
    rect(b, x, y, 1, 1, i % 6 < 3 ? '#ffffff' : '#c9d3dc');
  }
}

load().then(() => {
  b.fillStyle = b.createPattern(IMG.grass, 'repeat');
  b.fillRect(0, 0, BW, BH);
  road([[-20, 300], [120, 290], [260, 312], [400, 300], [520, 318], [660, 305]], 17);
  road([[300, 306], [292, 240], [300, 170], [318, 90], [330, -20]], 13);
  road([[470, 312], [500, 380], [520, 420]], 11);

  const items = [];
  put(IMG.h1, 70, 222, items, 0.22);
  put(IMG.h2, 190, 214, items, 0.22);
  put(IMG.h3, 430, 226, items, 0.22);
  put(IMG.tower, 582, 222, items, 0.22);
  put(IMG.oak, 250, 120, items);
  put(IMG.pine, 30, 395, items);
  put(IMG.oak, 600, 400, items);
  put(IMG.pine2, 395, 120, items);
  put(IMG.well, 372, 372, items);
  put(IMG.hay, 560, 300, items);
  put(IMG.cart, 128, 262, items);
  put(IMG.lamp, 236, 292, items, 0.18);
  put(IMG.lamp, 368, 288, items, 0.18);
  put(IMG.pots, 150, 232, items, 0.15);
  put(IMG.barrel, 488, 238, items, 0.2);
  put(IMG.bush, 20, 246, items);
  put(IMG.berry, 252, 238, items);
  put(IMG.log, 150, 360, items);
  put(IMG.rock, 455, 395, items);
  put(IMG.bush, 220, 392, items);

  const T1 = { img: IMG.tFront, x: 130, y: 342 };
  const T2 = { img: IMG.tBack, x: 455, y: 296 };
  put(T1.img, T1.x, T1.y, items, 0.3);
  put(T2.img, T2.x, T2.y, items, 0.3);
  put(IMG.tSide, 600, 330, items, 0.3, true);
  put(IMG.hero, 300, 300, items, 0.3);
  items.sort((p, q) => p.y - q.y);
  for (const it of items) it.draw();

  const nx = T2.x, ny = T2.y - T2.img.height * 0.79;
  const hx = nx + 30, hy = ny - 10;
  shadow(hx, 302, 8, 3, 0.25);
  wireLine(hx - 6, hy + 4, 582, 222 - IMG.tower.height + 20);
  wireLine(hx - 10, hy + 6, nx + 2, ny + 6);
  for (let i = 0; i < 6; i++) puff(hx + 14 + i * 7, hy - 2 + Math.sin(i) * 2, 2 + i * 0.5, 0.75 - i * 0.1);
  for (let i = 0; i < 9; i++) puff(nx + Math.sin(i * 2.1) * 8, ny - i * 3, 3 + i * 0.5, 0.7 - i * 0.05);
  const r = makeRng(7);
  for (let i = 0; i < 40; i++) {
    const a = Math.PI * 0.75 + r.range(-0.7, 0.7), d = r.range(2, 24);
    rect(b, nx + Math.cos(a) * d, ny + Math.sin(a) * d * 0.6 + d * d * 0.01, r.chance(0.3) ? 2 : 1, 1, r.pick(['#d8283a', '#b3122e', '#8a0e20']));
  }
  b.drawImage(IMG.fly, Math.round(hx - IMG.fly.width / 2), Math.round(hy - IMG.fly.height / 2));
  slash(nx + 2, ny + 2, 15, Math.PI * 0.1, Math.PI * 1.05);

  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(buf, 0, 0, BW * PXS, BH * PXS);
  const vg = sctx.createRadialGradient(640, 400, 300, 640, 400, 820);
  vg.addColorStop(0, 'rgba(20, 10, 0, 0)');
  vg.addColorStop(1, 'rgba(20, 10, 0, 0.32)');
  sctx.fillStyle = vg;
  sctx.fillRect(0, 0, 1280, 800);
  const out = document.createElement('pre');
  out.id = 'snap';
  out.textContent = screenC.toDataURL('image/png');
  document.body.appendChild(out);
}).catch(e => document.body.setAttribute('data-err', e.message));
