'use strict';

const BW = 640, BH = 400, PXS = 2;
const mood = location.hash.slice(1) || 'dark';
const screen = document.getElementById('c');
const ctx = screen.getContext('2d');
const [buf, b] = makeCanvas(BW, BH);
const [shd, sg] = makeCanvas(BW, BH);

const isStreet = (x, y) => (y >= 250 && y <= 273) || (x >= 334 && x <= 355 && y >= 60 && y < 250);
b.putImageData(paintGround(BW, BH, 0, 0, 'city', isStreet, 11), 0, 0);
const wall = wallMaria(BW, 78, 5);
b.drawImage(wall, 0, -8);
for (let k = 0; k < 8; k++) {
  b.fillStyle = `rgba(12, 10, 14, ${0.34 - k * 0.04})`;
  b.fillRect(0, 70 + k, BW, 1);
}

const titan = (o) => ({ g: bodyOf(o.type), hair: '#3b2a20', style: 1, eyes: 'wide', mouth: 'grin', iris: '#3a6a8a', ...o });
const T1 = titan({ type: 'normal', Hp: 150, skin: '#c0927c', hair: '#4a3020', style: 1, eyes: 'wide', mouth: 'grin' });
const T2 = titan({ type: 'aberrant', Hp: 118, skin: '#b8806e', hair: '#2a2220', style: 2, eyes: 'big', mouth: 'lipless', iris: '#4a6a3a' });
const T3 = titan({ type: 'fat', Hp: 112, skin: '#b8947e', hair: '#6a5a4a', style: 0, eyes: 'dot', mouth: 'open', blush: true });
const T4 = titan({ type: 'lanky', Hp: 124, skin: '#9a6454', hair: '#2d2620', style: 4, eyes: 'sleepy', mouth: 'grin' });

const scout = { outfit: 'scout', cloak: true, hair: '#2a1e18', look: 'short', skin: '#e2b08e' };
const mikasa = { ...scout, look: 'scarf', hair: '#151214', scarf: true };
const civA = { shirt: '#7a5048', pants: '#4a4038', hair: '#5a3d2b', skin: '#e0b08a' };
const civB = { shirt: '#8a7650', pants: '#6b5a48', hair: '#2d2620', dress: true, skin: '#f0c8a8' };
const civC = { shirt: '#4e6a7a', pants: '#3e4a5a', hair: '#c9a35a', skin: '#e8bc98' };
const civD = { shirt: '#6e5a46', pants: '#5a4a3a', hair: '#8d8780', skin: '#d8a888' };

const items = [];
const R = (S, face, edge) => renderSculpt(S, face, { edge });
function sprite(spr, x, y, shadow = 0.32) {
  items.push({ y, draw: () => b.drawImage(spr.img, Math.round(x - spr.ox), Math.round(y - spr.oy)) });
  if (shadow) castShadow(sg, spr, x, y, 1);
  return { x: x - spr.ox, y: y - spr.oy };
}

const houses = [
  { x: 18, front: 192, w: 130, d: 62, h: 112, seed: 3 },
  { x: 438, front: 206, w: 150, d: 66, h: 118, seed: 8, ruin: true },
  { x: 486, front: 402, w: 152, d: 58, h: 96, seed: 14 },
];
for (const hdef of houses) {
  const spr = buildHouse2(hdef);
  hdef.spr = spr;
  const ox = SHADOW.ground[0] * hdef.h * 0.32, oy = SHADOW.ground[1] * hdef.h * 0.32;
  const x1 = hdef.x + hdef.w + 4, y0 = hdef.front - hdef.d, y1 = hdef.front;
  fillPoly(sg, [[x1, y1], [x1 + ox, y1 + oy - 4], [x1 + ox, y0 + oy], [x1, y0]], '#000');
  sg.fillStyle = '#000';
  sg.fillRect(hdef.x, y1, hdef.w + 4, 3);
  items.push({ y: hdef.front, draw: () => b.drawImage(spr.img, hdef.x - spr.ox, hdef.front - spr.wallH - spr.d - spr.oy) });
}

const trees = [[236, 236, 84, 4], [42, 238, 92, 7], [26, 398, 104, 2], [612, 236, 70, 9]];
for (const [x, y, h, s] of trees) sprite(R(buildTree(s, h), 0, 0), x, y);

sprite(R(buildBarrel(1), 0.3, 2), 98, 200);
sprite(R(buildBarrel(2), 1.2, 2), 108, 206);
sprite(R(buildCrate(1), 0.4, 2), 124, 203);
sprite(R(buildCrate(2), 1.0, 2), 132, 210);
sprite(R(buildCrate(3), 0.2, 2), 392, 292);
sprite(R(buildBarrel(3), 0.8, 2), 405, 296);

const t1 = R(buildTitan(T1, 'walk', 0.62), -2.5, T1.Hp * 0.026);
const t1pos = sprite(t1, 296, 240);
const t2 = R(buildTitan(T2, 'walk', 0.3), 1.2, T2.Hp * 0.026);
sprite(t2, 150, 368);
const t3 = R(buildTitan(T3, 'eat', 0.62), 2.85, T3.Hp * 0.026);
const t3pos = sprite(t3, 566, 258);
const t4 = R(buildTitan(T4, 'fall', 1), 0.08, T4.Hp * 0.026);
const t4pos = sprite(t4, 346, 356, 0);

const civs = [[civA, 'run', 2, Math.PI - 0.1, 398, 262], [civB, 'panic', 5, Math.PI + 0.2, 424, 268], [civC, 'run', 6, Math.PI, 472, 259], [civD, 'run', 1, -0.5, 222, 318]];
for (const [spec, pose, f, face, x, y] of civs) sprite(R(buildHuman(spec, pose, f), face, 3), x, y);

const nape = t1.anchors.nape;
const nx = t1pos.x + nape.x, ny = t1pos.y + nape.y;
const hero = R(buildHuman(scout, 'slash', 0), -2.0, 3);
const heroX = nx + 13, heroY = ny - 8;
blobShadow(sg, nx + 20, 262, 7, 2.5, 1);

const ally = R(buildHuman(mikasa, 'fly', 1), Math.PI - 0.25, 3);
const allyX = 560, allyY = 142;
blobShadow(sg, 548, 236, 6, 2, 1);

const civHand = R(buildHuman(civC, 'panic', 3), 0.6, 3);

b.save();
b.globalAlpha = mood === 'day' ? 0.34 : 0.22;
b.drawImage(shd, 0, 0);
b.restore();

splat(b, 288, 252, 7, 3, 0.95);
splat(b, 306, 258, 4, 4, 0.9);
splat(b, 420, 352, 9, 5, 0.85);
splat(b, 560, 270, 5, 6, 0.9);

items.sort((p, q) => p.y - q.y);
for (const it of items) it.draw();

const h3 = t3.anchors.hand;
b.drawImage(civHand.img, Math.round(t3pos.x + h3.x - civHand.ox + 2), Math.round(t3pos.y + h3.y - civHand.oy + 18));

steamColumn(b, t4pos.x + t4.w * 0.45, 352, 100, 46, 26, 4, 0.42);
steamColumn(b, t4pos.x + t4.w * 0.85, 346, 30, 40, 12, 9, 0.5);
const H2 = houses[1];
steamColumn(b, H2.x + H2.w * 0.45, H2.front - H2.spr.wallH - H2.d * 0.6, 26, 120, 22, 12, 0.85, 'smoke');

const gx0 = heroX + 60, gy0 = heroY - 26;
for (let i = 0; i < 7; i++) drawPuff(b, lerp(heroX + 10, gx0, i / 6), lerp(heroY + 2, gy0, i / 6) + Math.sin(i) * 2, 2 + i * 0.6, 0.75 - i * 0.08, 'gas');
for (let i = 0; i < 6; i++) drawPuff(b, allyX + 14 + i * 9, allyY - 4 + Math.sin(i * 1.3) * 2, 2 + i * 0.5, 0.7 - i * 0.09, 'gas');
wire(b, heroX + 4, heroY - 2, H2.x + 12, H2.front - H2.spr.wallH - H2.d + 18, 3);
wire(b, heroX - 2, heroY + 2, nx - 10, ny + 22, 1);
wire(b, allyX - 2, allyY - 4, 352, 74, 4);
b.drawImage(ally.img, Math.round(allyX - ally.w / 2), Math.round(allyY - ally.h / 2));

steamColumn(b, nx - 2, ny - 2, 10, 16, 6, 21, 0.6);
spray(b, nx - 2, ny + 2, Math.PI * 0.85, 46, 3);
spray(b, nx, ny, -Math.PI * 0.6, 20, 8);
b.drawImage(hero.img, Math.round(heroX - hero.w / 2), Math.round(heroY - hero.h / 2));
slashArc(b, nx + 2, ny + 2, 16, Math.PI * 0.15, Math.PI * 1.05, 1);
slashArc(b, nx + 4, ny, 11, Math.PI * 0.25, Math.PI * 0.95, 0.7);

const birds = makeRng(41);
for (let i = 0; i < 9; i++) {
  const x = 120 + birds.range(-50, 60), y = 30 + birds.range(-14, 18), up = birds.chance(0.5);
  rect(b, x, y, 1, 1, '#1a1418');
  rect(b, x - 1, y + (up ? -1 : 0), 1, 1, '#1a1418');
  rect(b, x + 1, y + (up ? -1 : 0), 1, 1, '#1a1418');
  rect(b, x - 2, y + (up ? -2 : 1), 1, 1, '#1a1418');
  rect(b, x + 2, y + (up ? -2 : 1), 1, 1, '#1a1418');
}

const atm = makeRng(77);
if (mood === 'dark') {
  b.save();
  b.globalCompositeOperation = 'multiply';
  b.fillStyle = '#9a98b2';
  b.fillRect(0, 0, BW, BH);
  b.restore();
  const fire = [H2.x + H2.w * 0.45, H2.front - H2.spr.wallH - H2.d * 0.45];
  glow(b, fire[0], fire[1] + 6, 22, '#ff7a2a', 0.22);
  flames(b, fire[0], fire[1] + 10, 22, 3);
  for (let i = 0; i < 40; i++) rect(b, fire[0] + atm.range(-20, 40), fire[1] - atm.range(0, 110), 1, 1, atm.pick(['#ffb347', '#ff7a2a', '#ffe08a']));
  for (let i = 0; i < 120; i++) rect(b, atm.range(0, BW), atm.range(0, BH), 1, 1, atm.chance(0.15) ? '#d8692e' : 'rgba(170, 166, 160, 0.7)');
} else {
  for (let i = 0; i < 4; i++) {
    const [cl, cg] = makeCanvas(BW, BH);
    ditherBlob(cg, atm.range(0, BW), atm.range(0, BH), atm.int(110, 180), atm.int(50, 80), '#000000', 0.9);
    b.save();
    b.globalAlpha = 0.13;
    b.drawImage(cl, 0, 0);
    b.restore();
  }
  b.save();
  b.globalCompositeOperation = 'soft-light';
  b.fillStyle = '#ffd59a';
  b.globalAlpha = 0.55;
  b.fillRect(0, 0, BW, BH);
  b.restore();
  for (let i = 0; i < 50; i++) rect(b, atm.range(0, BW), atm.range(0, BH), 1, 1, 'rgba(255, 246, 210, 0.7)');
}

ctx.imageSmoothingEnabled = false;
ctx.filter = mood === 'day' ? 'saturate(1.12) contrast(1.04)' : 'saturate(0.88) contrast(1.06)';
ctx.drawImage(buf, 0, 0, BW * PXS, BH * PXS);
ctx.filter = 'none';
if (mood === 'dark') {
  for (const [fx, fy, fr] of [[300, 640, 520], [1050, 520, 420], [200, 180, 360]]) {
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    fg.addColorStop(0, 'rgba(150, 156, 172, 0.16)');
    fg.addColorStop(1, 'rgba(150, 156, 172, 0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, 1280, 800);
  }
}
const vg = ctx.createRadialGradient(640, 400, 260, 640, 400, 820);
vg.addColorStop(0, 'rgba(6, 4, 10, 0)');
vg.addColorStop(1, mood === 'day' ? 'rgba(6, 4, 10, 0.38)' : 'rgba(6, 4, 10, 0.72)');
ctx.fillStyle = vg;
ctx.fillRect(0, 0, 1280, 800);

const out = document.createElement('pre');
out.id = 'snap';
out.textContent = screen.toDataURL('image/png');
document.body.appendChild(out);
