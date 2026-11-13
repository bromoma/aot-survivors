'use strict';

let trail = [], xslashes = [];

function juiceReset() {
  trail = [];
  xslashes = [];
  game.slowT = 0;
  game.zoomT = 0;
  game.zoomAt = null;
  game.trailT = 0;
  game.kickT = 0;
}

function drawSprite(img, footX, footY, o = {}) {
  const sxk = o.sx ?? 1, syk = o.sy ?? 1, sh = o.shear ?? 0;
  if (sxk === 1 && syk === 1 && !sh) {
    bctx.drawImage(img, Math.round(footX - img.width / 2), Math.round(footY - img.height));
    return;
  }
  bctx.save();
  bctx.translate(Math.round(footX), Math.round(footY));
  bctx.transform(sxk, 0, -sh, syk, 0, 0);
  bctx.drawImage(img, -Math.round(img.width / 2), -img.height);
  bctx.restore();
}

function titanPoseFx(t) {
  const now = performance.now() / 1000;
  const o = { sx: 1, sy: 1, shear: 0, ox: 0, oy: 0 };
  if (t.boss && t.boss.kneel > 0) { o.sy = 0.8; o.sx = 1.06; o.shear = Math.sin(now * 3) * 0.02; return o; }
  if (t.boss && t.jz) { o.oy = -Math.round(t.jz / ART); o.sy = 1.06; o.shear = Math.cos(t.face) * 0.1; return o; }
  if (t.boss && t.boss.act === 'pounce') { const k = Math.min(1, t.boss.actT / 0.55); o.sy = 1 - 0.14 * k; o.sx = 1 + 0.06 * k; return o; }
  if (t.boss && t.boss.act === 'kick') { const k = 1 - t.boss.actT / 0.65; o.shear = Math.sin(k * 9) * 0.1 * k; o.sy = 1 + 0.06 * k; return o; }
  if (t.stun > 0) { o.shear = Math.sin(now * 18 + t.x) * 0.05; return o; }
  const st = t.state;
  if (st === 'walk') {
    const s = Math.sin(t.phase);
    const framed = true;
    o.shear = s * (framed ? 0.015 : 0.045) * (t.aberrant || t.kind === 'crawler' ? 1.8 : 1);
    o.sy = 1 - Math.abs(s) * 0.025;
    o.sx = 1 + Math.abs(s) * 0.015;
    o.oy = -Math.round(Math.abs(s) * 2);
    if (t.rageT > 0) o.shear *= 1.6;
  } else if (st === 'grab' || st === 'recover') {
    const k = st === 'grab' ? Math.min(1, t.grabT / grabWind(t)) : 1 - Math.min(1, t.grabT / 0.5);
    const c = Math.cos(t.grabAng);
    if (st === 'grab' && k < 0.35) { o.shear = -c * 0.1 * (k / 0.35); o.sy = 1 + 0.04 * (k / 0.35); }
    else { o.shear = c * 0.2 * k; o.sy = 1 - 0.05 * k; o.ox = Math.round(c * k * 10); o.oy = Math.round(Math.sin(t.grabAng) * k * 6 - k * 2); }
  } else if (st === 'stomp') {
    const k = t.spT / 0.7;
    if (t.spPhase === 'wind') { o.sy = 1 + 0.07 * Math.min(1, k); o.sx = 1 - 0.03 * Math.min(1, k); o.shear = Math.sin(now * 30) * 0.015; }
    else { const r = Math.min(1, t.spT / 0.45); o.sy = 0.88 + 0.12 * r; o.sx = 1.08 - 0.08 * r; }
  } else if (st === 'leap') {
    if (t.spPhase === 'crouch') { const k = Math.min(1, t.spT / 0.35); o.sy = 1 - 0.12 * k; o.sx = 1 + 0.06 * k; }
    else if (t.spPhase === 'air') { o.sy = 1.08; o.sx = 0.95; o.shear = Math.cos(t.face) * 0.12; o.oy = -Math.round(t.jz / ART); }
    else { const r = Math.min(1, t.spT / 0.4); o.sy = 0.86 + 0.14 * r; o.sx = 1.1 - 0.1 * r; }
  } else if (st === 'roar') {
    const k = Math.min(1, t.spT / 0.25);
    o.sy = 1 + 0.06 * k;
    o.shear = Math.sin(now * 40) * 0.02 * k;
  } else if (st === 'throw') {
    const c = Math.cos(t.face);
    if (t.spPhase === 'wind') { const k = Math.min(1, t.spT / 0.6); o.shear = -c * 0.14 * k; o.sy = 1 + 0.05 * k; }
    else { const r = Math.min(1, t.spT / 0.45); o.shear = c * 0.2 * (1 - r); o.sy = 0.95 + 0.05 * r; }
  } else if (st === 'eat') {
    o.sy = 1 + Math.sin(t.grabT * 9) * 0.02;
  }
  return o;
}

function startTitanSpecial(t, kind) {
  t.state = kind;
  t.spT = 0;
  t.hand = null;
  if (kind === 'stomp') {
    t.spPhase = 'wind';
    marks.push({ x: t.x, y: t.y, r: stompR(t), life: 0.7, max: 0.7, kind: 'rock' });
    sfx('rumble', { x: t.x, y: t.y, vol: 0.6, tag: 'stompwind' });
  } else if (kind === 'leap') {
    t.spPhase = 'crouch';
    const p = player;
    const lead = 0.55, low = t.kind === 'crawler', cap = low ? 520 : 650;
    t.leapLow = low;
    t.leapFrom = { x: t.x, y: t.y };
    t.leapTo = { x: p.x + p.vx * lead, y: p.y + p.vy * lead };
    const d = Math.hypot(t.leapTo.x - t.x, t.leapTo.y - t.y);
    if (d > cap) { const k = cap / d; t.leapTo.x = t.x + (t.leapTo.x - t.x) * k; t.leapTo.y = t.y + (t.leapTo.y - t.y) * k; }
    t.face = Math.atan2(t.leapTo.y - t.y, t.leapTo.x - t.x);
    t.jz = 0;
    marks.push({ x: t.leapTo.x, y: t.leapTo.y, r: low ? 110 : 150, life: low ? 0.67 : 1.05, max: low ? 0.67 : 1.05, kind: 'rock' });
    if (low) sfx('hiss', { x: t.x, y: t.y, vol: 0.5, rate: 1.6, tag: 'crawl' });
  } else if (kind === 'roar') {
    sfx('roar', { x: t.x, y: t.y, vol: 0.9 });
  } else if (kind === 'throw') {
    t.spPhase = 'wind';
    sfx('swing', { x: t.x, y: t.y, vol: 0.5, rate: 0.6, tag: 'throwwind' });
  }
}

const stompR = t => 150 + t.H * 0.3;

function updateTitanSpecial(t, dt) {
  const p = player, pd = Math.hypot(p.x - t.x, p.y - t.y);
  if (t.rageT > 0) t.rageT -= dt;
  if (t.state === 'walk') {
    t.spCd = (t.spCd ?? rand(3, 6)) - dt;
    if (t.spCd > 0 || t.prey) return false;
    if (t.kind === 'crawler' && pd > 170 && pd < 560 && p.z < 240) { t.spCd = rand(3.5, 5); startTitanSpecial(t, 'leap'); return true; }
    if (t.kind === 'thrower' && pd > 280 && pd < 950) { t.spCd = rand(3.5, 5.5); startTitanSpecial(t, 'throw'); return true; }
    if (t.kind === 'giant' && pd < stompR(t) + 80) { t.spCd = rand(3, 5); startTitanSpecial(t, 'stomp'); return true; }
    if (t.aberrant && pd > 260 && pd < 820) { t.spCd = rand(4, 6.5); startTitanSpecial(t, 'leap'); return true; }
    if (!t.aberrant && t.H >= 300 && pd < stompR(t) + 40 && Math.random() < 0.6) { t.spCd = rand(4, 7); startTitanSpecial(t, 'stomp'); return true; }
    if (pd < 750 && Math.random() < 0.2) { t.spCd = rand(10, 16); startTitanSpecial(t, 'roar'); return true; }
    t.spCd = rand(0.8, 1.6);
    return false;
  }
  if (t.state === 'stomp') {
    t.spT += dt;
    if (t.spPhase === 'wind' && t.spT >= 0.7) {
      t.spPhase = 'slam';
      t.spT = 0;
      const R = stompR(t);
      rings.push({ x: t.x, y: t.y, r: R, life: 0.35, color: '#d8c8a0' });
      rings.push({ x: t.x, y: t.y, r: R * 0.6, life: 0.3, color: '#ffffff' });
      for (let i = 0; i < 26; i++) { const a = rand(0, TAU), s = rand(120, 380); particles.push({ x: t.x + Math.cos(a) * 30, y: t.y + Math.sin(a) * 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, life: 0.7, max: 0.7, size: 2, g: 0, kind: 'dust' }); }
      game.shake = Math.max(game.shake, 10);
      sfx('boom', { x: t.x, y: t.y, vol: 1, rate: 0.6, tag: 'stomp' });
      if (pd < R && p.z < 110) hurtPlayer(t);
      for (const c of civs) if (Math.hypot(c.x - t.x, c.y - t.y) < R * 0.7) c.panic = 1;
    } else if (t.spPhase === 'slam' && t.spT >= 0.45) { t.state = 'walk'; t.grabCd = Math.max(t.grabCd, 0.6); }
    return true;
  }
  if (t.state === 'leap') {
    t.spT += dt;
    const low = t.leapLow, airT = low ? 0.42 : 0.7;
    if (t.spPhase === 'crouch' && t.spT >= (low ? 0.25 : 0.35)) { t.spPhase = 'air'; t.spT = 0; sfx('swing', { x: t.x, y: t.y, vol: 0.8, rate: 0.7, tag: 'leap' }); }
    else if (t.spPhase === 'air') {
      const k = Math.min(1, t.spT / airT);
      t.x = lerp(t.leapFrom.x, t.leapTo.x, k);
      t.y = lerp(t.leapFrom.y, t.leapTo.y, k);
      t.jz = Math.sin(k * Math.PI) * (low ? 55 : 160 + t.H * 0.3);
      t.phase += dt * 4;
      if (k >= 1) {
        t.spPhase = 'land';
        t.spT = 0;
        t.jz = 0;
        rings.push({ x: t.x, y: t.y, r: low ? 110 : 150, life: 0.35, color: '#d8c8a0' });
        for (let i = 0; i < 18; i++) { const a = rand(0, TAU), s = rand(100, 300); particles.push({ x: t.x, y: t.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, life: 0.6, max: 0.6, size: 2, g: 0, kind: 'dust' }); }
        game.shake = Math.max(game.shake, 9);
        sfx('boom', { x: t.x, y: t.y, vol: 0.9, rate: 0.75, tag: 'land' });
        if (Math.hypot(p.x - t.x, p.y - t.y) < (low ? 110 : 150) && p.z < (low ? 170 : t.H * 0.45)) hurtPlayer(t);
      }
    } else if (t.spPhase === 'land' && t.spT >= 0.4) t.state = 'walk';
    clampTitan(t);
    return true;
  }
  if (t.state === 'throw') {
    t.spT += dt;
    if (t.spPhase === 'wind') {
      t.face = Math.atan2(p.y - t.y, p.x - t.x);
      if (t.spT >= 0.6) {
        t.spPhase = 'release';
        t.spT = 0;
        const n = game.time > 300 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const tx = p.x + p.vx * 0.9 + rand(-90, 90), ty = p.y + p.vy * 0.9 + rand(-90, 90), dur = 1.0 + i * 0.15;
          rocks.push({ x0: t.x, y0: t.y, z0: t.H * 0.95, tx, ty, t: 0, dur });
          marks.push({ x: tx, y: ty, r: 75, life: dur, max: dur, kind: 'rock' });
        }
        sfx('swing', { x: t.x, y: t.y, vol: 0.9, rate: 0.7, tag: 'throw' });
      }
    } else if (t.spT >= 0.45) t.state = 'walk';
    return true;
  }
  if (t.state === 'roar') {
    t.spT += dt;
    if (t.spT > 0.2 && t.spT - dt <= 0.2) {
      game.shake = Math.max(game.shake, 5);
      for (let i = 0; i < 3; i++) rings.push({ x: t.x, y: t.y - 10, r: 120 + i * 90, life: 0.35 + i * 0.08, color: '#fff6e0' });
      for (const o of titans) if (o !== t && !o.dying && !o.boss && Math.hypot(o.x - t.x, o.y - t.y) < 520) o.rageT = 3.5;
      t.rageT = 3.5;
      if (Math.hypot(p.x - t.x, p.y - t.y) < 520) addText(tr('Рёв!'), t.x, t.y - KZ * t.H * 0.9, '#ff9a6a');
    }
    if (t.spT >= 1.0) t.state = 'walk';
    return true;
  }
  return false;
}

function titanShadowLift(t) {
  if (t.boss && t.jz) return Math.max(0.4, 1 - t.jz / 400);
  return t.state === 'leap' && t.spPhase === 'air' ? Math.max(0.4, 1 - t.jz / 400) : 1;
}

function pushTrail() {
  const p = player;
  game.trailT -= 1 / 60;
  const fast = p.mode === 'attack' || Math.hypot(p.vx, p.vy) > 470;
  if (!fast || game.trailT > 0) return;
  game.trailT = p.mode === 'attack' ? 0.022 : 0.04;
  const hgt = p.z - floorZ(p.x, p.y);
  trail.push({ x: p.x, y: p.y, z: p.z, dir: dir4(p.dir), fly: hgt > 8 || p.mode === 'attack', t: 0, cut: p.phase === 'cut' });
  if (trail.length > 14) trail.shift();
}

function updateJuice(dt) {
  for (const g of trail) g.t += dt;
  trail = trail.filter(g => g.t < 0.24);
  for (const x of xslashes) x.t += dt;
  xslashes = xslashes.filter(x => x.t < 0.32);
  if (game.zoomT > 0) game.zoomT = Math.max(0, game.zoomT - dt);
}

function drawTrail() {
  const p = player;
  for (const g of trail) {
    const img = heroImg(p.char, g.dir, g.fly);
    if (!img) continue;
    const a = 0.5 * (1 - g.t / 0.24);
    bctx.globalAlpha = a;
    bctx.drawImage(variant(img, 'ghost'), sx(g.x) - (img.width >> 1), sy(g.y, g.z) - img.height);
  }
  bctx.globalAlpha = 1;
}

function drawOrbitTrail() {
  const p = player, t = p.target;
  if (p.mode !== 'attack' || !t || t.dying) return;
  const R = orbitR(t);
  if (p.phase === 'orbit') {
    const dir = Math.sign(wrapAngle(t.face + Math.PI - p.ang)) || 1;
    for (let i = 1; i < 22; i++) {
      const a = p.ang - dir * i * 0.07;
      const x = sx(t.x + Math.cos(a) * R), y = sy(t.y + Math.sin(a) * R, p.z) - 8;
      const k = 1 - i / 22;
      bctx.globalAlpha = 0.85 * k;
      rect(bctx, x, y, i < 6 ? 2 : 1, 1, i % 3 ? '#ffffff' : '#9fe8ff');
      if (i % 4 === 0) rect(bctx, x, y + 3, 1, 1, '#dfe8f0');
    }
    bctx.globalAlpha = 1;
  }
}

function epicKill(t) {
  const n = nape(t);
  game.slowT = 0.3;
  game.zoomT = 0.42;
  game.zoomAt = { x: n.x, y: n.y, z: n.z };
  game.hitstop = Math.max(game.hitstop, 0.05);
  game.kickT = 0.1;
  xslashes.push({ x: n.x, y: n.y - KZ * n.z, ang: t.face + Math.PI / 2 + rand(-0.3, 0.3), t: 0 });
  const back = t.face + Math.PI;
  for (let i = 0; i < 70; i++) {
    const a = back + rand(-0.9, 0.9), s = rand(200, 620);
    particles.push({ x: n.x, y: n.y - KZ * n.z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - rand(80, 260), life: rand(0.6, 1.3), max: 1.3, size: Math.random() < 0.4 ? 4 : 3, color: pick(['#d8283a', '#b3122e', '#8a0e20', '#ff4a4a']), g: 900, kind: 'px' });
  }
  steam(n.x, n.y - KZ * n.z, 16, 36);
}

function drawXSlashes() {
  for (const s of xslashes) {
    const k = s.t / 0.32, grow = Math.min(1, s.t / 0.07), L = 46 * grow, fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    const x = sx(s.x), y = sy(s.y, 0);
    bctx.globalAlpha = fade;
    for (const da of [0, 1.15]) {
      const a = s.ang + da, cx = Math.cos(a), cy = Math.sin(a) * 0.8;
      const x0 = x - cx * L, y0 = y - cy * L, x1 = x + cx * L, y1 = y + cy * L;
      const steps = Math.ceil(L * 2);
      for (let i = 0; i <= steps; i++) {
        const q = i / steps, th = Math.sin(q * Math.PI) * 3.4 * (1 - k * 0.6);
        const px = lerp(x0, x1, q), py = lerp(y0, y1, q);
        for (let j = -th; j <= th; j++) rect(bctx, px - cy * j * 0.7, py + cx * j * 0.7, 1, 1, Math.abs(j) < th * 0.45 ? '#ffffff' : '#9fdcff');
      }
    }
    bctx.globalAlpha = 1;
  }
}

function zoomTransform() {
  if (!(game.zoomT > 0) || !game.zoomAt) return null;
  const k = game.zoomT / 0.42;
  const z = 1 + 0.16 * Math.sin(k * Math.PI * 0.5) * (k > 0.8 ? (1 - k) / 0.2 : 1);
  const fx = (sx(game.zoomAt.x) - camFrac.x) * PX, fy = (sy(game.zoomAt.y, game.zoomAt.z) - camFrac.y) * PX;
  return { z, fx, fy };
}

const LEG_FRAC = { normal: 0.43, lanky: 0.5, fat: 0.36, aberrant: 0.45, hero: 0.3, crawler: 0.34, small: 0.3, thrower: 0.4, giant: 0.42 };
const walkCache = new WeakMap();

function bodyMask(img) {
  const g = img.getContext('2d');
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const rows = new Int32Array(img.height);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] > 100) rows[y]++;
  return rows;
}

function proceduralWalk(img, set, dir) {
  let m = walkCache.get(img);
  if (m) return m;
  const w = img.width, h = img.height;
  const legH = Math.round(h * (LEG_FRAC[set] || 0.43));
  const hipY = h - legH;
  const marg = Math.ceil(legH * 0.24) + 2;
  const make = (fn) => {
    const [c, g] = makeCanvas(w + marg * 2, h);
    g.imageSmoothingEnabled = false;
    fn(g);
    return c;
  };
  const upper = (g, dy, dx = 0) => g.drawImage(img, 0, 0, w, hipY + 2, marg + dx, dy, w, hipY + 2);
  const frames = [make(g => g.drawImage(img, marg, 0))];
  if (dir === 'left' || dir === 'right') {
    const s = Math.max(2, Math.round(legH * 0.22));
    const sign = dir === 'left' ? -1 : 1;
    for (const ph of [1, -1]) {
      frames.push(make(g => {
        const k = s / legH;
        g.save();
        g.translate(marg, hipY);
        g.transform(1, 0, -k * ph * sign, 1, 0, 0);
        g.filter = 'brightness(0.78)';
        g.drawImage(img, 0, hipY, w, legH, 0, 0, w, legH);
        g.restore();
        g.save();
        g.translate(marg, hipY);
        g.transform(1, 0, k * ph * sign, 1, 0, 0);
        g.drawImage(img, 0, hipY, w, legH, 0, 0, w, legH);
        g.restore();
        upper(g, 1);
      }));
    }
  } else {
    const lift = Math.max(2, Math.round(legH * 0.13));
    const cx = Math.round(w / 2);
    for (const side of [0, 1]) {
      frames.push(make(g => {
        const x0 = side ? cx : 0, x1 = side ? w : cx;
        const ox0 = side ? 0 : cx, ox1 = side ? cx : w;
        g.drawImage(img, ox0, hipY, ox1 - ox0, legH, marg + ox0, hipY, ox1 - ox0, legH);
        g.drawImage(img, x0, hipY, x1 - x0, legH, marg + x0, hipY - 1, x1 - x0, legH - lift);
        upper(g, 1, side ? -1 : 1);
      }));
    }
  }
  m = frames;
  walkCache.set(img, m);
  return m;
}
