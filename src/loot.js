'use strict';

let chests = [], lootRes = null;

function lootReset() {
  chests = [];
  lootRes = null;
  game.eliteT = 95 + rand(0, 25);
}

function spawnElite() {
  const kinds = ['normal', 'lanky', 'fat', 'thrower', 'crawler'].filter(k => KINDS[k] && (KINDS[k].art || kindReady(k)));
  const pos = spawnTitan(null, pick(kinds));
  const t = titans[titans.length - 1];
  t.elite = true;
  t.hp = Math.max(t.hp, 3);
  t.speed *= 1.15;
  game.banner = { text: tr('Elite titan!'), sub: tr('Cut it three times to win a supply chest'), t: 2.2 };
  sfx('horn', { vol: 0.5, rate: 1.3 });
  if (stats.warn || faction.map === 'field') fireFlare(pos.x, pos.y, '#ffd36e');
  return t;
}

function dropChest(x, y, boss) {
  chests.push({ x, y, t: 0, boss: !!boss });
  rings.push({ x, y, r: 120, life: 0.35, color: '#ffd36e' });
  sfx('chime5', { x, y, vol: 0.7, tag: 'chestdrop' });
}

function updateLoot(dt) {
  if (game.time > 60) {
    game.eliteT -= dt;
    if (game.eliteT <= 0) { game.eliteT = rand(70, 100); spawnElite(); }
  }
  const p = player;
  for (const c of chests) {
    c.t += dt;
    if (c.t > 0.6 && Math.hypot(c.x - p.x, c.y - p.y) < 75) { c.taken = true; openChest(c); break; }
    if (Math.random() < dt * 6) particles.push({ x: c.x + rand(-14, 14), y: c.y - rand(10, 60), vx: rand(-8, 8), vy: rand(-40, -15), life: 0.8, max: 0.8, size: rand(1, 2.5), g: 0, kind: 'flare', color: '#ffd36e' });
  }
  chests = chests.filter(c => !c.taken);
}

function lootRoll() {
  const pool = rollChoices(3);
  const evo = pool.find(c => c.kind === 'evo');
  return evo || pick(pool);
}

function openChest(c) {
  if (save.stats) save.stats.chests = (save.stats.chests || 0) + 1;
  const n = c.boss ? 3 : Math.random() < 0.15 ? 3 : 1;
  const items = [];
  for (let i = 0; i < n; i++) {
    const ch = lootRoll();
    ch.apply();
    items.push({ name: ch.name, icon: ch.icon, kind: ch.kind, lvl: ch.kind === 'evo' ? 0 : ch.lvl + 1 });
  }
  const healed = player.hp < stats.maxHp;
  if (healed) player.hp++;
  const coins = c.boss ? 60 : 25;
  game.lootTokens = (game.lootTokens || 0) + coins;
  save.tokens += coins;
  const evo = items.find(i => i.kind === 'evo');
  game.banner = null;
  lootRes = { items, healed, coins, boss: c.boss, t: 0, evo: evo && evo.name };
  state = 'loot';
  sfx('reveal', { vol: 0.7 });
}

function closeLoot() {
  if (state !== 'loot') return;
  if (lootRes && lootRes.evo) game.banner = { text: tr('Evolution!'), sub: lootRes.evo, t: 2.2, win: true };
  lootRes = null;
  state = 'play';
  if (pendingLevels > 0) openLevelUp();
}

function drawChestsWorld(c) {
  const img = SPR.ui_chest;
  if (!img) return;
  const now = performance.now() / 1000, bob = Math.round(Math.sin(now * 3 + c.x) * 2);
  const s = c.boss ? 0.36 : 0.28, w = Math.round(img.width * s), h = Math.round(img.height * s);
  const x = sx(c.x), y = sy(c.y, 0);
  bctx.globalAlpha = 0.18 + 0.08 * Math.sin(now * 4);
  bctx.fillStyle = '#ffe9a8';
  bctx.fillRect(x - 3, y - 140, 6, 140);
  bctx.globalAlpha = 0.3;
  disc(bctx, x, y, w * 0.6, 4, '#000');
  bctx.globalAlpha = 1;
  bctx.drawImage(img, x - (w >> 1), y - h + bob - 2, w, h);
}

function drawChestArrows() {
  const cx = W / 2, cy = H / 2;
  for (const c of chests) {
    const tx = sx(c.x) * PX, ty = sy(c.y, 0) * PX;
    if (tx > 0 && tx < W && ty > 0 && ty < H) continue;
    const dx = tx - cx, dy = ty - cy;
    const k = Math.min((W / 2 - 40) / Math.abs(dx || 1), (H / 2 - 40) / Math.abs(dy || 1));
    const ex = cx + dx * k, ey = cy + dy * k;
    const img = SPR.ui_chest;
    if (img) ctx.drawImage(img, ex - 22, ey - 18, 44, 36);
    const a = Math.atan2(dy, dx);
    ctx.fillStyle = '#ffd36e';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * 34, ey + Math.sin(a) * 34);
    ctx.lineTo(ex + Math.cos(a + 0.5) * 22, ey + Math.sin(a + 0.5) * 22);
    ctx.lineTo(ex + Math.cos(a - 0.5) * 22, ey + Math.sin(a - 0.5) * 22);
    ctx.fill();
  }
}
