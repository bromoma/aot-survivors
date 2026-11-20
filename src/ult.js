'use strict';

const ULTS = {
  whirl: { name: 'Ackerman Dance', text: 'Blazes through the nearest titans and cuts every nape' },
  rage: { name: 'Untamed Rage', text: '8 seconds invulnerable: orbit twice as fast, attack from any height' },
  flares: { name: "Armin's Plan", text: 'A flare volley blinds every titan around for 4 seconds' },
  spears: { name: 'Thunder Spears', text: 'Spears hit the nearest titans: kill up to 15 m, stun the rest' },
  cavalry: { name: 'Survey Corps Charge', text: 'Cavalry sweeps the field, knocking titans down and finishing small ones' },
  blessing: { name: 'Royal Grace', text: 'Full heal and 6 seconds of protection' },
  arrows: { name: "Hunter's Volley", text: 'A dozen arrows stun titans and finish small ones' },
  dash: { name: 'Gas Burst', text: '3 seconds of crazy speed, invulnerability and a climb to the clouds' },
  care: { base: 'blessing', name: "Petra's Care", text: 'Full heal and 6 seconds of protection' },
  imitation: { base: 'whirl', name: 'Levi Impression', text: 'Tries to copy Levi: cuts the napes of the nearest titans' },
  veteran: { base: 'whirl', name: "Veteran's Strike", text: 'Dashes through the nearest titans and cuts every nape' },
  signal: { base: 'flares', name: 'Signal Flares', text: 'A flare volley blinds every titan around for 4 seconds' },
  garrison: { base: 'cavalry', name: 'Garrison to the Rescue', text: 'Garrison soldiers charge through, knocking titans down and finishing small ones' },
  barrage: { base: 'spears', name: 'Garrison Barrage', text: 'Cannons fire at the nearest titans: kill up to 15 m, stun the rest' },
  pistols: { base: 'arrows', name: "Kenny's Revolvers", text: 'Anti-personnel shots at the nearest titans: finish small ones, stun the rest' },
  crystal: { name: 'Crystal Cocoon', text: 'Hides in hardened crystal, then shatters it: stuns everything around and kills titans up to 16 m nearby' },
  armor: { name: 'Armored Charge', text: 'Turns into the Armored Titan for a moment and rams through everything in a straight line' },
  jaw: { name: 'Jaw Bites', text: 'Leaps between the nearest titans and bites through them, whatever their size' },
};
trFields(Object.values(ULTS), ['name', 'text']);
const HERO_ULT = {
  levi: ['whirl', 8], mikasa: ['whirl', 6], eren: ['rage'], armin: ['flares'], hange: ['spears', 8], cadet: ['spears', 4],
  erwin: ['cavalry', 8], jean: ['cavalry', 5], mike: ['cavalry', 6], historia: ['blessing'], sasha: ['arrows', 12], connie: ['dash'],
  petra: ['care'], nanaba: ['veteran', 5], oluo: ['imitation', 3], eld: ['spears', 5], gunther: ['dash'], moblit: ['signal'],
  hannes: ['garrison', 4], pixis: ['barrage', 10], kenny: ['pistols', 10], annie: ['crystal'], reiner: ['armor'], ymir: ['jaw', 7],
};
const heroUlt = id => HERO_ULT[id] || HERO_ULT.cadet;

function ultReset() {
  game.ult = 0;
  game.ultNeed = 25;
  game.ultFx = null;
  game.ultShield = 0;
  game.ultFree = 0;
  game.ultSpeed = 0;
  game.ultReadyShown = false;
}

function ultGain(x) {
  if (!game || game.ult === undefined) return;
  const was = game.ult;
  game.ult = Math.min(1, game.ult + x / ((game.ultNeed || 25) * (stats.ultMul || 1)));
  if (was < 1 && game.ult >= 1) {
    sfx('chime6', { vol: 0.6, tag: 'chime' });
    addText(tr('Ultimate ready!'), player.x, player.y - KZ * player.z - 70, '#ffd36e');
  }
}

function ultUse() {
  if (state !== 'play' || game.ult < 1 || game.ultFx) return false;
  const [type0, n] = heroUlt(player.char), p = player, type = ULTS[type0].base || type0;
  game.ult = 0;
  game.ultNeed = Math.min(55, game.ultNeed + 6);
  game.ultUses = (game.ultUses || 0) + 1;
  if (save.stats) save.stats.ults = (save.stats.ults || 0) + 1;
  game.banner = { text: ULTS[type0].name, sub: charById(player.char).name, t: 1.6, win: true };
  sfx('horn', { vol: 0.5, rate: 1.2 });
  rings.push({ x: p.x, y: p.y, r: 260, life: 0.35, color: '#ffd36e' });
  const near = (r, f) => titans.filter(t => !t.dying && !t.retreat && Math.hypot(t.x - p.x, t.y - p.y) < r && (!f || f(t))).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  if (type === 'whirl' || type === 'jaw') {
    const list = near(950, t => !t.boss).slice(0, n);
    game.ultFx = { type: 'whirl', list, i: 0, t: 0, kill: type === 'jaw', gap: type === 'jaw' ? 0.13 : 0.11 };
    if (type === 'jaw') sfx('roar', { vol: 0.7, rate: 1.4 });
    game.ultShield = 1.5 + list.length * 0.14;
    p.mode = 'fly'; p.target = null;
  } else if (type === 'rage') {
    game.ultShield = 8; game.ultFree = 8; game.ultSpeed = 8;
    stats.orbit *= 2; game.ultOrbit = true;
    steam(p.x, p.y - KZ * p.z, 20, 40);
    sfx('roar', { vol: 0.8, rate: 1.3 });
  } else if (type === 'flares') {
    for (const t of near(1150)) stunTitan(t, 4, 'flash');
    for (let i = 0; i < 4; i++) fireFlare(p.x + rand(-300, 300), p.y + rand(-200, 200), pick(['#ff4a3a', '#5ae06a', '#ffd36e']));
    game.flashT = 0.2;
    sfx('flashbang', { vol: 0.9 });
  } else if (type === 'spears' || type === 'arrows') {
    const list = near(950).slice(0, n);
    const kh = type0 === 'pistols' ? 280 : type === 'arrows' ? 240 : 300;
    list.forEach((t, i) => shots.push({ x0: p.x, y0: p.y, t: 0, dur: 0.3 + i * 0.07, target: t, x: t.x, y: t.y, stun: type === 'arrows' ? 2.5 : 2, killH: kh, spear: true }));
    sfx('swing', { vol: 0.8, rate: 1.4 });
  } else if (type === 'cavalry') {
    const a = Math.atan2(p.vy, p.vx) || p.dir || 0, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
    const list = [];
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 90;
      list.push({ x: p.x - ux * 500 + vx * off, y: p.y - uy * 500 + vy * off, vx: ux * 820, vy: uy * 820, phase: i, life: 1.8, charge: true, hit: new Set() });
    }
    game.ultFx = { type, list, t: 0 };
    sfx('rumble', { vol: 0.9 });
  } else if (type === 'blessing') {
    p.hp = stats.maxHp;
    game.ultShield = 6;
    addText('+♥♥♥', p.x, p.y - KZ * p.z - 50, '#7cfc9a');
    sfx('levelup', { vol: 0.8 });
  } else if (type === 'crystal') {
    game.ultShield = 5; p.vx = 0; p.vy = 0;
    game.ultFx = { type, t: 0 };
    sfx('crystal', { vol: 0.9 });
  } else if (type === 'armor') {
    const a = Math.hypot(p.vx, p.vy) > 30 ? Math.atan2(p.vy, p.vx) : (p.dir || 0);
    game.ultFx = { type, t: 0, a, hit: new Set() };
    game.ultShield = 2.2;
    sfx('roar', { vol: 0.9, rate: 0.8 });
  } else if (type === 'dash') {
    game.ultShield = 3; game.ultSpeed = 3;
    p.z = Math.max(p.z, 340);
    sfx('gas', { vol: 1 });
  }
  return true;
}

function ultTick(dt) {
  const p = player;
  game.ultShield = Math.max(0, game.ultShield - dt);
  game.ultFree = Math.max(0, game.ultFree - dt);
  if (game.ultSpeed > 0) {
    game.ultSpeed -= dt;
    if (Math.random() < dt * 30) particles.push({ x: p.x, y: p.y - KZ * p.z + 4, vx: -p.vx * 0.3, vy: -p.vy * 0.3, life: 0.4, max: 0.4, size: rand(2, 4), g: 0, kind: 'gas' });
    if (game.ultSpeed <= 0 && game.ultOrbit) { stats.orbit /= 2; game.ultOrbit = false; }
  }
  const fx = game.ultFx;
  if (!fx) return false;
  if (fx.type === 'whirl') {
    fx.t -= dt;
    if (fx.t > 0) return true;
    const t = fx.list[fx.i++];
    if (!t) {
      game.ultFx = null;
      rings.push({ x: p.x, y: p.y, r: 200, life: 0.35, color: '#ffffff' });
      if (pendingLevels > 0) openLevelUp();
      return false;
    }
    fx.t = fx.gap || 0.11;
    if (t.dying) return true;
    const n = nape(t);
    trailBurst(p.x, p.y, p.z, n.x, n.y, n.z);
    p.x = n.x - Math.cos(t.face) * 30; p.y = n.y - Math.sin(t.face) * 30; p.z = n.z;
    p.vx = Math.cos(t.face) * 300; p.vy = Math.sin(t.face) * 300;
    p.dir = Math.atan2(p.vy, p.vx);
    slashes.push({ x: n.x, y: n.y - KZ * n.z, ang: t.face + Math.PI, life: 0.22, big: true });
    sfx('slash', { vol: 0.7, tag: 'ultslash' });
    if (fx.kill) { sfx('chomp', { vol: 0.7, tag: 'ultslash' }); killTitan(t); } else cutTitan(t);
    game.shake = Math.max(game.shake, fx.kill ? 8 : 5);
    return true;
  }
  if (fx.type === 'crystal') {
    fx.t += dt;
    if (Math.random() < dt * 25) particles.push({ x: p.x + rand(-30, 30), y: p.y - KZ * p.z - rand(0, 50), vx: rand(-20, 20), vy: rand(-40, 0), life: 0.5, max: 0.5, size: rand(1.5, 3), g: 0, kind: 'flare', color: '#9fe8ff' });
    if (fx.t < 1.2) return true;
    game.ultFx = null;
    rings.push({ x: p.x, y: p.y, r: 380, life: 0.35, color: '#9fe8ff' }, { x: p.x, y: p.y, r: 900, life: 0.4, color: '#ffffff' });
    for (let i = 0; i < 50; i++) { const a = rand(0, TAU), s = rand(150, 520); particles.push({ x: p.x, y: p.y - KZ * p.z - 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.8, max: 0.8, size: rand(2, 4), g: 120, kind: 'flare', color: pick(['#9fe8ff', '#ffffff', '#5ac8f0']) }); }
    for (const t of titans) {
      if (t.dying) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < 380 && !t.boss && t.H < 330) killTitan(t);
      else if (d < 900) stunTitan(t, 3, 'flash');
    }
    game.shake = 14; game.flashT = 0.15;
    sfx('crack', { vol: 0.9 });
    if (pendingLevels > 0) openLevelUp();
    return false;
  }
  if (fx.type === 'armor') {
    fx.t += dt;
    const iv = inputVec();
    if (iv.x || iv.y) { let d = Math.atan2(iv.y, iv.x) - fx.a; d = Math.atan2(Math.sin(d), Math.cos(d)); fx.a += Math.max(-4 * dt, Math.min(4 * dt, d)); }
    p.vx = Math.cos(fx.a) * 1100; p.vy = Math.sin(fx.a) * 1100;
    p.x += p.vx * dt; p.y += p.vy * dt; p.dir = fx.a;
    p.z = Math.max(floorZ(p.x, p.y), p.z - 500 * dt);
    if (Math.random() < dt * 40) particles.push({ x: p.x + rand(-20, 20), y: p.y, vx: rand(-60, 60), vy: rand(-60, -10), life: 0.6, max: 0.6, size: 2, g: 0, kind: 'dust' });
    for (const t of titans) {
      if (t.dying || fx.hit.has(t) || Math.hypot(t.x - p.x, t.y - p.y) > 90 + t.H * 0.12) continue;
      fx.hit.add(t);
      if (!t.boss && t.H < 420) killTitan(t); else stunTitan(t, 2.5, 'rock');
      game.shake = Math.max(game.shake, 10);
      sfx('thud', { x: t.x, y: t.y, vol: 0.8 });
    }
    if (fx.t > 1.5) { game.ultFx = null; if (pendingLevels > 0) openLevelUp(); return false; }
    return true;
  }
  if (fx.type === 'cavalry') {
    fx.t += dt;
    for (const r of fx.list) {
      r.x += r.vx * dt; r.y += r.vy * dt; r.phase += dt * 12; r.life -= dt;
      if (Math.random() < dt * 20) particles.push({ x: r.x, y: r.y, vx: rand(-30, 30), vy: rand(-30, -5), life: 0.6, max: 0.6, size: 2, g: 0, kind: 'dust' });
      for (const t of titans) {
        if (t.dying || r.hit.has(t) || Math.hypot(t.x - r.x, t.y - r.y) > 80) continue;
        r.hit.add(t);
        if (!t.boss && t.H < 260) cutTitan(t);
        else stunTitan(t, 2.5, 'rock');
      }
    }
    if (fx.t > 1.8) { game.ultFx = null; if (pendingLevels > 0) openLevelUp(); }
    return false;
  }
  return false;
}

function trailBurst(x0, y0, z0, x1, y1, z1) {
  for (let i = 0; i < 10; i++) {
    const k = i / 10;
    particles.push({ x: lerp(x0, x1, k), y: lerp(y0, y1, k) - KZ * lerp(z0, z1, k), vx: rand(-20, 20), vy: rand(-20, 20), life: 0.35, max: 0.35, size: rand(1.5, 3), g: 0, kind: 'flare', color: i % 2 ? '#ffffff' : '#bfeaff' });
  }
}

function drawUltWorld() {
  const fx = game && game.ultFx;
  if (!fx || fx.type !== 'cavalry') return;
  for (const r of fx.list) dl(r.y, drawRider, r);
}

function drawSpear(s) {
  const k = Math.min(1, s.t / s.dur);
  const wx = lerp(s.x0, s.x, k), wy = lerp(s.y0, s.y, k), wz = Math.sin(k * Math.PI) * 180 + (1 - k) * 60 + k * 90;
  const k2 = Math.min(1, k + 0.05);
  const x = sx(wx), y = sy(wy, wz), nx = sx(lerp(s.x0, s.x, k2)), ny = sy(lerp(s.y0, s.y, k2), Math.sin(k2 * Math.PI) * 180 + (1 - k2) * 60 + k2 * 90);
  const a = Math.atan2(ny - y, nx - x), L = s.killH === 240 ? 5 : 7;
  pline(bctx, Math.round(x - Math.cos(a) * L), Math.round(y - Math.sin(a) * L), x, y, 1, s.killH === 240 ? '#8a6a40' : '#6a7080');
  rect(bctx, Math.round(x + Math.cos(a) * 1), Math.round(y + Math.sin(a) * 1), 2, 2, s.killH === 240 ? '#e8e0d0' : '#ffd36e');
  if (s.killH !== 240 && Math.random() < 0.7) particles.push({ x: wx, y: wy - KZ * wz, vx: rand(-10, 10), vy: rand(-20, 0), life: 0.35, max: 0.35, size: rand(2, 3), g: -10, kind: 'smoke' });
}

function drawUltAura(p, now) {
  const x = sx(p.x), y = sy(p.y, p.z) - 12, r = 15 + Math.sin(now * 10) * 1.5;
  if (game.ultFx && game.ultFx.type === 'crystal') {
    const k = Math.min(1, game.ultFx.t / 0.4), hw = Math.round(12 * k), hh = Math.round(22 * k);
    bctx.globalAlpha = 0.55;
    bctx.fillStyle = '#bff0ff';
    bctx.beginPath(); bctx.moveTo(x, y - hh); bctx.lineTo(x + hw, y); bctx.lineTo(x, y + hh); bctx.lineTo(x - hw, y); bctx.closePath(); bctx.fill();
    bctx.globalAlpha = 1;
    pline(bctx, x, y - hh, x + hw, y, 1, '#ffffff'); pline(bctx, x + hw, y, x, y + hh, 1, '#5ac8f0');
    pline(bctx, x, y + hh, x - hw, y, 1, '#5ac8f0'); pline(bctx, x - hw, y, x, y - hh, 1, '#ffffff');
    return;
  }
  bctx.globalAlpha = 0.55;
  const col = heroUlt(p.char)[0] === 'rage' ? '#ff7a4a' : '#ffd36e';
  for (let a = now * 3; a < now * 3 + TAU; a += 0.42) rect(bctx, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.9), 2, 2, col);
  bctx.globalAlpha = 1;
}
