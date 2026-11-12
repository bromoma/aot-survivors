'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const VIEW_H = 1000;
const GROUND = 0;
const WORLD_W = 6400;
const WALL_W = 180;
const WALL_H = 1250;
const GRAVITY = 1650;
const R = 14;
const RUN = 380;
const MAX_SPEED = 1700;
const WIN_TIME = 600;

const SKINS = ['#e3a98c', '#d99a7c', '#eab9a0', '#c98a6e', '#e8a48f'];
const HAIRS = ['#3b2a20', '#5a3d2b', '#1f1a17', '#7a5a3a', '#2d2620'];
const TONES = [['#d9c7a3', '#5b4636'], ['#cdb79a', '#4f3c2f'], ['#e0d2b8', '#62503f'], ['#bfa88a', '#4a3a2e']];

const UPGRADES = [
  { name: 'Длинные тросы', desc: () => 'Трос цепляется на 20% дальше', apply: s => { s.range *= 1.2; } },
  { name: 'Мощная лебёдка', desc: () => 'Летаешь на 15% быстрее', apply: s => { s.pull *= 1.15; } },
  { name: 'Широкий замах', desc: () => 'Клинки достают дальше', apply: s => { s.reach += 10; } },
  { name: 'Перевязка', desc: () => '+1 к здоровью и лечение', apply: s => { s.maxHp += 1; player.hp = Math.min(s.maxHp, player.hp + 2); } },
  { name: 'Громовые копья', desc: s => s.spear ? 'Копья летят чаще' : 'Сами летят в ближайшего титана', apply: s => { s.spear++; } },
  { name: 'Вихрь клинков', desc: s => s.spin ? 'Вихрь шире и чаще' : 'Время от времени режет всех титанов рядом', apply: s => { s.spin++; } },
  { name: 'Полевой медик', desc: () => 'Лечение за убийства приходит быстрее', apply: s => { s.healEvery = Math.max(6, s.healEvery - 5); } },
];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hash = i => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };
const difficulty = () => clamp((game.time - 90) / 360, 0, 1);

let dpr = 1, W = 0, H = 0, scale = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  scale = H / VIEW_H;
}
addEventListener('resize', resize);
resize();

const viewW = () => W / scale;
const keys = {};
const mouse = { x: 0, y: 0 };

let state = 'menu';
let buildings, solids, titans, particles, texts, spears, rings, hook, preview, player, stats, game, cam;
let choices = [], pendingLevels = 0, sel = 0;
let best = 0;
try { best = +localStorage.getItem('aot-best') || 0; } catch (e) {}

function genCity() {
  const list = [];
  let x = WALL_W + 220;
  while (x < WORLD_W - WALL_W - 400) {
    const tower = Math.random() < 0.12;
    const w = tower ? rand(90, 130) : rand(150, 300);
    const h = tower ? rand(620, 760) : rand(170, 470);
    const b = { x, y: GROUND - h, w, h, tower, tone: TONES[Math.floor(Math.random() * TONES.length)], win: [], floors: [] };
    const cols = Math.max(1, Math.floor((w - 24) / 42));
    const rows = Math.max(1, Math.floor((h - 50) / 64));
    const gx = (w - cols * 42) / 2 + 14;
    for (let r = 0; r < rows; r++) {
      b.floors.push(b.y + 22 + r * 64);
      for (let c = 0; c < cols; c++) b.win.push({ x: x + gx + c * 42, y: b.y + 34 + r * 64, lit: Math.random() < 0.18 });
    }
    list.push(b);
    x += w + rand(70, 260);
  }
  return list;
}

function reset() {
  buildings = genCity();
  solids = [
    { x: 0, y: GROUND - WALL_H, w: WALL_W, h: WALL_H, wall: true },
    { x: WORLD_W - WALL_W, y: GROUND - WALL_H, w: WALL_W, h: WALL_H, wall: true },
    ...buildings,
  ];
  stats = { pull: 2100, range: 650, reach: 22, maxHp: 5, air: 650, spear: 0, spin: 0, healEvery: 12 };
  const mid = WORLD_W / 2;
  const start = buildings.reduce((a, b) => Math.abs(b.x + b.w / 2 - mid) < Math.abs(a.x + a.w / 2 - mid) ? b : a);
  player = { x: start.x + start.w / 2, y: start.y - R - 1, vx: 0, vy: 0, hp: 5, inv: 0, grounded: false, face: 1, hookCd: 0 };
  hook = null;
  preview = null;
  titans = [];
  particles = [];
  texts = [];
  spears = [];
  rings = [];
  pendingLevels = 0;
  game = { time: 0, kills: 0, xp: 0, level: 1, need: 5, spawnT: 3, shake: 0, hitstop: 0, combo: 0, lastKill: -10, healCount: 0, spearT: 2, spinT: 3 };
  cam = { x: player.x - viewW() / 2, y: player.y - VIEW_H * 0.55 };
  for (let i = 0; i < 2; i++) spawnTitan();
}

function start() {
  reset();
  state = 'play';
}

function inputDir() {
  return (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
}

function rayRect(ox, oy, dx, dy, r, maxT) {
  let tmin = 0, tmax = maxT;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return null;
  } else {
    let t1 = (r.x - ox) / dx, t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return null;
  } else {
    let t1 = (r.y - oy) / dy, t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

function circleRect(cx, cy, r, rc) {
  const nx = clamp(cx, rc.x, rc.x + rc.w), ny = clamp(cy, rc.y, rc.y + rc.h);
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function pointIn(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function geo(t) {
  const h = t.H, f = t.facing, x = t.x, y = t.y;
  const ns = Math.max(28, h * 0.1);
  return {
    nape: { x: x - f * h * 0.08 - ns / 2, y: y - h * 0.82 - ns / 2, w: ns, h: ns },
    shoulder: { x: x + f * h * 0.1, y: y - h * 0.74 },
  };
}

function napeCenter(t) {
  const n = geo(t).nape;
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function desiredAngle() {
  const dx = inputDir();
  const dy = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  if (dy > 0) return dx ? 90 - dx * 35 : 90;
  if (dy < 0) return dx ? (dx > 0 ? -15 : 195) : null;
  if (dx) return dx > 0 ? 30 : 150;
  return player.face > 0 ? 50 : 130;
}

function angDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function lineClear(x, y, ux, uy, d, near) {
  for (const s of near) {
    const t = rayRect(x, y, ux, uy, s, d - 3);
    if (t !== null && t > 1) return false;
  }
  return true;
}

function findAnchor() {
  const want = desiredAngle();
  if (want === null) return null;
  const p = player;
  const near = solids.filter(s => s.x < p.x + stats.range && s.x + s.w > p.x - stats.range);
  let found = null, bestScore = Infinity;
  const consider = (x, y, titan, bonus, minD = 90) => {
    const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
    if (d > stats.range || d < minD) return;
    const diff = angDiff(Math.atan2(-dy, dx) * 180 / Math.PI, want);
    if (diff > (titan ? 70 : 60)) return;
    const s = diff * 3 + Math.abs(d - 380) * 0.25 + bonus;
    if (s < bestScore) { bestScore = s; found = { x, y, titan }; }
  };
  for (const t of titans) {
    if (t.dying) continue;
    const n = napeCenter(t);
    consider(n.x, n.y, t, -120, 10);
  }
  for (const s of near) {
    if (p.y < s.y - 4) continue;
    for (const cx of [s.x + 12, s.x + s.w - 12]) {
      const cy = s.y - 20;
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
      if (lineClear(p.x, p.y, dx / d, dy / d, d, near)) consider(cx, cy, null, -80, 20);
    }
  }
  for (let a = want - 50; a <= want + 50; a += 10) {
    const r = a * Math.PI / 180, ux = Math.cos(r), uy = -Math.sin(r);
    let dist = stats.range;
    for (const s of near) {
      const t = rayRect(p.x, p.y, ux, uy, s, dist);
      if (t !== null && t > 1) dist = t;
    }
    if (dist < stats.range) consider(p.x + ux * dist, p.y + uy * dist, null, 0);
  }
  return found;
}

function updateHook(dt) {
  const p = player;
  p.hookCd -= dt;
  if (hook && hook.titan) {
    if (hook.titan.dying) hook = null;
    else Object.assign(hook, napeCenter(hook.titan));
  }
  if (!keys.Space) {
    hook = null;
    preview = findAnchor();
    return;
  }
  preview = null;
  if (hook && p.hookCd <= 0) {
    const d = Math.hypot(hook.x - p.x, hook.y - p.y);
    if (!hook.titan && (desiredAngle() !== hook.want || d < 60)) hook = null;
  }
  if (!hook && p.hookCd <= 0) {
    const a = findAnchor();
    if (a) {
      hook = { ...a, want: desiredAngle(), len: Math.hypot(a.x - p.x, a.y - p.y) };
      p.hookCd = 0.2;
    }
  }
}

function spawnTitan() {
  const t = game.time;
  const aberrant = t > 120 && Math.random() < 0.08 + difficulty() * 0.35;
  const big = !aberrant && Math.random() < Math.min(0.45, 0.2 + t / 600);
  const h = aberrant ? rand(230, 330) : big ? rand(330, 480) : rand(150, 260);
  const lo = WALL_W + 80, hi = WORLD_W - WALL_W - 80;
  let side = Math.random() < 0.5 ? -1 : 1;
  let x = player.x + side * rand(1000, 1500);
  if (x < lo || x > hi) { side = -side; x = player.x + side * rand(1000, 1500); }
  x = clamp(x, lo, hi);
  titans.push({
    x, y: GROUND, vx: 0, vy: 0, H: h, facing: -side, turnT: 0,
    turnDelay: aberrant ? 0.4 : rand(0.8, 1.4),
    speed: aberrant ? rand(160, 210) : rand(35, 65) * Math.sqrt(260 / h),
    aberrant, state: 'walk', grabT: 0, grabCd: rand(1, 2), stun: 0, jumpCd: rand(2.5, 4.5),
    skin: SKINS[Math.floor(Math.random() * SKINS.length)],
    hair: HAIRS[Math.floor(Math.random() * HAIRS.length)],
    phase: Math.random() * 6, stuckT: 0, dying: 0, fallDir: 1, hand: null, target: null,
  });
}

function addText(text, x, y, color) {
  texts.push({ text, x, y, color, life: 1.1 });
}

function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(120, 480);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, life: rand(0.4, 0.9), max: 0.9, size: rand(2, 5), color, g: 900 });
  }
}

function steam(x, y, n, spread = 20) {
  for (let i = 0; i < n; i++) {
    const life = rand(1, 2.2);
    particles.push({ x: x + rand(-spread, spread), y: y + rand(-spread, spread), vx: rand(-40, 40), vy: rand(-130, -40), life, max: life, size: rand(14, 32), color: 'steam', g: -15 });
  }
}

function hurtPlayer(t) {
  if (player.inv > 0) return;
  player.hp -= 1;
  player.inv = 2;
  hook = null;
  player.hookCd = 0.4;
  const d = Math.sign(player.x - t.x) || 1;
  player.vx = d * 650;
  player.vy = -450;
  game.shake = 16;
  burst(player.x, player.y, 18, '#c0392b');
  addText('-1 ♥', player.x, player.y - 30, '#ff6b6b');
  if (player.hp <= 0) gameOver();
}

function saveBest() {
  if (game.time > best) {
    best = game.time;
    try { localStorage.setItem('aot-best', String(best)); } catch (e) {}
  }
}

function gameOver() {
  state = 'over';
  hook = null;
  saveBest();
}

function killTitan(t) {
  const n = napeCenter(t);
  t.dying = 0.001;
  t.fallDir = t.facing;
  t.hand = null;
  t.state = 'dead';
  if (hook && hook.titan === t) {
    hook = null;
    player.hookCd = 0.15;
  }
  game.kills++;
  game.combo = game.time - game.lastKill < 4 ? game.combo + 1 : 1;
  game.lastKill = game.time;
  game.hitstop = 0.06;
  game.shake = 10;
  burst(n.x, n.y, 26, '#b3122e');
  steam(n.x, n.y, 12);
  addText(game.combo > 1 ? `КОМБО x${game.combo}` : 'Затылок!', n.x, n.y - 40, game.combo > 1 ? '#ffd27a' : '#ffffff');
  if (player.vy > -300) player.vy = -380;
  game.healCount++;
  if (game.healCount >= stats.healEvery) {
    game.healCount = 0;
    stats.healEvery += 3;
    if (player.hp < stats.maxHp) {
      player.hp++;
      addText('+1 ♥', player.x, player.y - 50, '#7cfc9a');
    }
  }
  gainXp(Math.round((t.H / 60 + (t.aberrant ? 2 : 0)) * (1 + 0.25 * (game.combo - 1))));
}

function gainXp(n) {
  game.xp += n;
  while (game.xp >= game.need) {
    game.xp -= game.need;
    game.level++;
    game.need = Math.round(game.need * 1.2 + 3);
    pendingLevels++;
  }
  if (pendingLevels > 0 && state === 'play') openLevelUp();
}

function openLevelUp() {
  const pool = UPGRADES.slice();
  choices = [];
  while (choices.length < 3) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  sel = 1;
  state = 'levelup';
}

function choose(i) {
  if (state !== 'levelup' || !choices[i]) return;
  choices[i].apply(stats);
  pendingLevels--;
  if (pendingLevels > 0) openLevelUp();
  else state = 'play';
}

function nearestTitan(maxD) {
  let found = null, bd = maxD;
  for (const t of titans) {
    if (t.dying) continue;
    const n = napeCenter(t);
    const d = Math.hypot(n.x - player.x, n.y - player.y);
    if (d < bd) { bd = d; found = t; }
  }
  return found;
}

function updateWeapons(dt) {
  if (stats.spear > 0) {
    game.spearT -= dt;
    if (game.spearT <= 0) {
      const t = nearestTitan(1100);
      if (t) {
        spears.push({ x: player.x, y: player.y, vx: 0, vy: -600, target: t, life: 2 });
        game.spearT = Math.max(1.8, 6.5 - stats.spear * 1.2);
      } else game.spearT = 0.5;
    }
  }
  if (stats.spin > 0) {
    game.spinT -= dt;
    if (game.spinT <= 0) {
      const rad = 110 + stats.spin * 30;
      rings.push({ x: player.x, y: player.y, r: rad, life: 0.35, color: '220, 230, 240' });
      for (const t of titans) {
        if (t.dying) continue;
        const n = napeCenter(t);
        if (Math.hypot(n.x - player.x, n.y - player.y) < rad) killTitan(t);
      }
      game.spinT = Math.max(2.5, 7 - stats.spin);
    }
  }
}

function explode(x, y) {
  const rad = 130;
  game.shake = Math.max(game.shake, 12);
  burst(x, y, 30, '#ffb347');
  steam(x, y, 10, 40);
  rings.push({ x, y, r: rad, life: 0.3, color: '255, 179, 71' });
  for (const t of titans) {
    if (t.dying) continue;
    const n = napeCenter(t);
    if (Math.hypot(n.x - x, n.y - y) < rad) killTitan(t);
  }
}

function updatePlayer(dt) {
  const p = player;
  const dir = inputDir();
  let ax = 0, ay = GRAVITY;
  if (p.grounded && !hook) p.vx = lerp(p.vx, dir * RUN, 1 - Math.exp(-dt * 10));
  else ax += dir * stats.air;
  if (dir) p.face = dir;

  if (hook) {
    const dx = hook.x - p.x, dy = hook.y - p.y, d = Math.hypot(dx, dy) || 1;
    ax += dx / d * stats.pull;
    ay += dy / d * stats.pull - GRAVITY * 0.4;
    if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y + 4, vx: -dx / d * 200 + rand(-30, 30), vy: -dy / d * 200 + rand(-30, 30), life: 0.35, max: 0.35, size: rand(4, 8), color: 'gas', g: 0 });
  }

  p.vx += ax * dt;
  p.vy += ay * dt;
  if (!p.grounded) {
    p.vx *= 1 - 0.3 * dt;
    p.vy *= 1 - 0.1 * dt;
  }
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > MAX_SPEED) { p.vx *= MAX_SPEED / sp; p.vy *= MAX_SPEED / sp; }
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (hook) {
    const dx = p.x - hook.x, dy = p.y - hook.y, d = Math.hypot(dx, dy) || 1;
    hook.len = Math.max(30, Math.min(hook.len, d));
    if (d > hook.len) {
      const nx = dx / d, ny = dy / d;
      p.x = hook.x + nx * hook.len;
      p.y = hook.y + ny * hook.len;
      const vr = p.vx * nx + p.vy * ny;
      if (vr > 0) { p.vx -= vr * nx; p.vy -= vr * ny; }
    }
  }

  p.grounded = false;
  for (const s of hook && hook.titan ? [] : solids) {
    const cx = clamp(p.x, s.x, s.x + s.w), cy = clamp(p.y, s.y, s.y + s.h);
    const dx = p.x - cx, dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= R * R) continue;
    let nx, ny, push;
    if (d2 === 0) {
      const opts = [[p.x - s.x, -1, 0], [s.x + s.w - p.x, 1, 0], [p.y - s.y, 0, -1], [s.y + s.h - p.y, 0, 1]];
      opts.sort((a, b) => a[0] - b[0]);
      [push, nx, ny] = opts[0];
      push += R;
    } else {
      const d = Math.sqrt(d2);
      nx = dx / d;
      ny = dy / d;
      push = R - d;
    }
    p.x += nx * push;
    p.y += ny * push;
    const vn = p.vx * nx + p.vy * ny;
    if (vn < 0) { p.vx -= vn * nx; p.vy -= vn * ny; }
    if (ny < -0.7) p.grounded = true;
  }
  if (p.y + R > GROUND) {
    p.y = GROUND - R;
    if (p.vy > 0) p.vy = 0;
    p.grounded = true;
  }
  p.x = clamp(p.x, WALL_W + R, WORLD_W - WALL_W - R);
  p.y = Math.max(p.y, -WALL_H - 900);
}

function checkCuts() {
  for (const t of titans) {
    if (!t.dying && circleRect(player.x, player.y, R + stats.reach, geo(t).nape)) killTitan(t);
  }
}

function grabWind(t) {
  return t.aberrant ? lerp(0.6, 0.4, difficulty()) : lerp(0.85, 0.5, difficulty());
}

function updateTitans(dt) {
  const lo = WALL_W + 60, hi = WORLD_W - WALL_W - 60;
  for (const t of titans) {
    if (t.dying) {
      t.dying += dt;
      if (t.dying > 0.9 && Math.random() < dt * 25) steam(t.x + t.fallDir * t.H * rand(0.1, 0.9), t.y - rand(0, 30), 1, 10);
      continue;
    }
    if (t.y < GROUND || t.vy < 0) {
      t.vy += GRAVITY * 0.8 * dt;
      t.y += t.vy * dt;
      t.x += t.vx * dt;
      if (t.y >= GROUND) {
        t.y = GROUND;
        t.vy = 0;
        t.vx = 0;
        if (Math.abs(t.x - player.x) < 900) game.shake = Math.max(game.shake, 6);
      }
    }
    t.x = clamp(t.x, lo, hi);
    const onGround = t.y >= GROUND;
    const dx = player.x - t.x;
    const want = Math.sign(dx) || t.facing;
    if (want !== t.facing && t.state === 'walk') {
      t.turnT += dt;
      if (t.turnT >= t.turnDelay) { t.facing = want; t.turnT = 0; }
    } else t.turnT = 0;
    if (t.state === 'walk' && onGround && Math.abs(dx) > t.H * 0.22 && Math.sign(dx) === t.facing) {
      t.x += t.facing * t.speed * dt;
      t.phase += dt * (t.speed / t.H) * 9;
    }
    if (t.aberrant && onGround && t.state === 'walk') {
      t.jumpCd -= dt;
      if (t.jumpCd <= 0 && Math.abs(dx) < 800) {
        t.vy = -rand(700, 900);
        t.vx = Math.sign(dx) * rand(220, 360);
        t.facing = Math.sign(dx) || t.facing;
        t.jumpCd = rand(3, 5);
      }
    }

    const g = geo(t);
    const reach = t.H * (0.6 + difficulty() * 0.2);
    const above = g.shoulder.y - player.y;
    if (onGround && t.state === 'walk' && Math.abs(dx) < t.H * 0.6 && above > reach * 0.8) {
      t.stuckT += dt;
      if (t.stuckT > 4) {
        const need = above - reach * 0.5;
        t.vy = -Math.min(1400, Math.sqrt(2 * GRAVITY * 0.8 * need));
        t.vx = Math.sign(dx) * 80;
        t.stuckT = -rand(0, 2);
        t.grabCd = 0;
      }
    } else if (onGround) t.stuckT = Math.max(0, t.stuckT - dt);
    t.grabCd -= dt;
    const wind = grabWind(t);
    if (t.state === 'walk' && t.grabCd <= 0) {
      const px = player.x - g.shoulder.x, py = player.y - g.shoulder.y;
      const pyBent = py > 0 ? py * 0.6 : py;
      if (px * px + pyBent * pyBent < reach * reach && dx * t.facing > -t.H * 0.05) {
        t.state = 'grab';
        t.grabT = 0;
        t.target = { x: player.x, y: player.y };
      }
    } else if (t.state === 'grab') {
      t.grabT += dt;
      const follow = 1 - Math.exp(-dt * (t.aberrant ? 3 : 2));
      t.target.x = lerp(t.target.x, player.x, follow);
      t.target.y = lerp(t.target.y, player.y, follow);
      const tx = t.target.x - g.shoulder.x, ty = t.target.y - g.shoulder.y;
      const td = Math.hypot(tx, ty > 0 ? ty * 0.6 : ty) || 1;
      if (td > reach) { t.target.x = g.shoulder.x + tx / td * reach; t.target.y = g.shoulder.y + ty / td * reach; }
      const k = Math.min(1, t.grabT / wind);
      t.hand = { x: lerp(g.shoulder.x, t.target.x, k * k), y: lerp(g.shoulder.y, t.target.y, k * k) };
      if (t.grabT >= wind) {
        if (Math.hypot(player.x - t.target.x, player.y - t.target.y) < t.H * 0.12 + 16) hurtPlayer(t);
        t.state = 'recover';
        t.grabT = 0;
      }
    } else if (t.state === 'recover') {
      t.grabT += dt;
      const k = 1 - Math.min(1, t.grabT / 0.5);
      t.hand = { x: lerp(g.shoulder.x, t.target.x, k), y: lerp(g.shoulder.y, t.target.y, k) };
      if (t.grabT > 0.5) {
        t.state = 'walk';
        t.grabCd = rand(1.5, 2.5) * (1 - difficulty() * 0.5);
        t.hand = null;
      }
    }
  }
  titans = titans.filter(t => !t.dying || t.dying < 3.2);
}

function updateSpears(dt) {
  for (const s of spears) {
    s.life -= dt;
    if (s.target && !s.target.dying) {
      const n = napeCenter(s.target);
      const dx = n.x - s.x, dy = n.y - s.y, d = Math.hypot(dx, dy) || 1;
      const k = 1 - Math.exp(-dt * 6);
      s.vx = lerp(s.vx, dx / d * 1300, k);
      s.vy = lerp(s.vy, dy / d * 1300, k);
      if (d < 30) s.boom = true;
    } else s.vy += 600 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (Math.random() < 0.6) particles.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 4, color: 'gas', g: 0 });
    if (s.boom || s.life <= 0 || s.y >= GROUND) {
      s.dead = true;
      explode(s.x, s.y);
    }
  }
  spears = spears.filter(s => !s.dead);
}

function updateFx(dt) {
  for (const p of particles) {
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  if (particles.length > 700) particles.splice(0, particles.length - 700);
  for (const t of texts) { t.y -= 40 * dt; t.life -= dt; }
  texts = texts.filter(t => t.life > 0);
  for (const r of rings) r.life -= dt;
  rings = rings.filter(r => r.life > 0);
}

function updateCamera(dt) {
  const vw = viewW();
  const tx = player.x - vw / 2 + clamp(player.vx * 0.25, -vw * 0.2, vw * 0.2);
  const ty = player.y - VIEW_H * 0.55;
  const k = 1 - Math.exp(-dt * 5);
  cam.x = clamp(lerp(cam.x, tx, k), -60, WORLD_W - vw + 60);
  cam.y = clamp(lerp(cam.y, ty, k), -WALL_H - 500, GROUND + 110 - VIEW_H);
}

function update(dt) {
  if (state === 'play') {
    if (game.hitstop > 0) { game.hitstop -= dt; return; }
    game.time += dt;
    if (!game.endless && game.time >= WIN_TIME) {
      state = 'win';
      hook = null;
      saveBest();
      return;
    }
    updateHook(dt);
    const steps = 3;
    for (let i = 0; i < steps && state === 'play'; i++) {
      updatePlayer(dt / steps);
      checkCuts();
    }
    player.inv = Math.max(0, player.inv - dt);
    updateTitans(dt);
    updateWeapons(dt);
    updateSpears(dt);
    game.spawnT -= dt;
    if (game.spawnT <= 0) {
      const alive = titans.filter(t => !t.dying).length;
      if (alive < Math.min(20, 3 + Math.floor(game.time / 25))) spawnTitan();
      game.spawnT = Math.max(0.8, 5 - game.time / 45);
    }
  }
  if (state === 'play' || state === 'over' || state === 'menu') {
    updateFx(dt);
    updateCamera(dt);
  }
  game.shake = Math.max(0, game.shake - dt * 40);
}

function ridge(par, base, amp, freq, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let sx = 0; sx <= W + 20; sx += 16) {
    const wx = sx / scale + cam.x * par;
    const n = Math.sin(wx * freq) * 0.5 + Math.sin(wx * freq * 2.3 + 1.7) * 0.3 + Math.sin(wx * freq * 0.37 + 4) * 0.6 + 1.4;
    ctx.lineTo(sx, base - n * amp);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#202b48');
  g.addColorStop(0.55, '#b5664a');
  g.addColorStop(1, '#eaa66c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rest = (VIEW_H - 110) * scale;
  const lift = (GROUND - cam.y) * scale - rest;
  ctx.fillStyle = 'rgba(255, 214, 160, 0.85)';
  ctx.beginPath();
  ctx.arc(W * 0.72, rest - 330 * scale + lift * 0.1, 60 * scale, 0, Math.PI * 2);
  ctx.fill();
  ridge(0.08, rest - 120 * scale + lift * 0.2, 130 * scale, 0.0016, '#4f405e');
  const wallTop = rest - 170 * scale + lift * 0.35;
  ctx.fillStyle = '#7a625e';
  ctx.fillRect(0, wallTop, W, H);
  ctx.fillStyle = '#665250';
  ctx.fillRect(0, wallTop, W, 6 * scale);
  const par = 0.55, base = rest - 20 * scale + lift * 0.55;
  ctx.fillStyle = '#5e4746';
  const step = 70;
  const first = Math.floor((cam.x * par) / step) - 1;
  for (let i = first; i < first + viewW() / step + 3; i++) {
    const h = (60 + hash(i) * 140) * scale;
    const x = (i * step - cam.x * par) * scale;
    ctx.fillRect(x, base - h, (step - 8 - hash(i + 9) * 20) * scale, h + H);
    if (hash(i + 3) > 0.6) {
      ctx.beginPath();
      ctx.moveTo(x - 4 * scale, base - h);
      ctx.lineTo(x + (step - 8) * scale / 2, base - h - 30 * scale);
      ctx.lineTo(x + (step - 4) * scale, base - h);
      ctx.fill();
    }
  }
}

function drawWall(s) {
  ctx.fillStyle = '#8d8173';
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = 'rgba(60, 50, 40, 0.35)';
  ctx.lineWidth = 2;
  for (let y = s.y + 40, r = 0; y < GROUND; y += 40, r++) {
    ctx.beginPath();
    ctx.moveTo(s.x, y);
    ctx.lineTo(s.x + s.w, y);
    ctx.stroke();
    for (let x = s.x + (r % 2 ? 30 : 60); x < s.x + s.w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y - 40);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#6e6458';
  ctx.fillRect(s.x - 6, s.y, s.w + 12, 18);
}

function drawBuilding(b) {
  ctx.fillStyle = b.tone[0];
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = b.tone[1];
  for (const fy of b.floors) ctx.fillRect(b.x, fy, b.w, 4);
  ctx.fillRect(b.x, b.y, 5, b.h);
  ctx.fillRect(b.x + b.w - 5, b.y, 5, b.h);
  for (const w of b.win) {
    ctx.fillStyle = w.lit ? '#f4c86a' : '#3a3040';
    ctx.fillRect(w.x, w.y, 14, 24);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(b.x + b.w - 16, b.y, 16, b.h);
  ctx.fillStyle = '#7b3b2c';
  ctx.fillRect(b.x - 4, b.y, b.w + 8, 12);
  if (b.tower) {
    ctx.fillStyle = '#f1e6cc';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + 50, Math.min(30, b.w * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a3040';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w / 2, b.y + 50);
    ctx.lineTo(b.x + b.w / 2, b.y + 32);
    ctx.moveTo(b.x + b.w / 2, b.y + 50);
    ctx.lineTo(b.x + b.w / 2 + 12, b.y + 50);
    ctx.stroke();
  }
}

function shadeColor(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

function drawTitan(t) {
  const h = t.H, f = t.facing;
  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.dying) {
    const k = Math.min(1, t.dying / 0.9);
    ctx.rotate(t.fallDir * k * k * Math.PI / 2 * 0.95);
    if (t.dying > 2.2) ctx.globalAlpha = Math.max(0, 1 - (t.dying - 2.2));
  }
  const dark = shadeColor(t.skin, 0.8);
  const step = Math.sin(t.phase);
  ctx.lineCap = 'round';

  ctx.strokeStyle = dark;
  ctx.lineWidth = h * 0.07;
  ctx.beginPath();
  ctx.moveTo(-f * h * 0.1, -h * 0.74);
  ctx.lineTo(-f * h * 0.14 - step * h * 0.04, -h * 0.46);
  ctx.stroke();

  ctx.fillStyle = dark;
  ctx.fillRect(-h * 0.11 + step * h * 0.03, -h * 0.46, h * 0.1, h * 0.46);
  ctx.fillStyle = shadeColor(t.skin, 0.9);
  ctx.fillRect(h * 0.01 - step * h * 0.03, -h * 0.46, h * 0.1, h * 0.46);

  ctx.fillStyle = t.skin;
  ctx.beginPath();
  ctx.roundRect(-h * 0.15, -h * 0.8, h * 0.3, h * 0.37, h * 0.06);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 40, 30, 0.25)';
  ctx.lineWidth = Math.max(1.5, h * 0.008);
  ctx.beginPath();
  ctx.moveTo(f * h * 0.02, -h * 0.68);
  ctx.lineTo(f * h * 0.02, -h * 0.5);
  ctx.moveTo(-h * 0.08, -h * 0.7);
  ctx.quadraticCurveTo(f * h * 0.04, -h * 0.66, h * 0.08, -h * 0.7);
  ctx.stroke();

  ctx.fillStyle = t.skin;
  ctx.fillRect(-h * 0.05 + f * h * 0.01, -h * 0.84, h * 0.1, h * 0.06);
  const hx = f * h * 0.02, hy = -h * 0.9, hr = h * 0.1;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.hair;
  ctx.beginPath();
  ctx.arc(hx - f * hr * 0.15, hy - hr * 0.15, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - f * hr * 0.6, hy - hr * 0.1, hr * 0.45, hr * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hx + f * hr * 0.5, hy - hr * 0.15, hr * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(hx + f * hr * 0.58, hy - hr * 0.13, hr * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a1d1d';
  ctx.lineWidth = Math.max(1.5, hr * 0.06);
  ctx.beginPath();
  ctx.moveTo(hx + f * hr * 0.1, hy + hr * 0.45);
  ctx.quadraticCurveTo(hx + f * hr * 0.6, hy + hr * 0.62, hx + f * hr * 0.98, hy + hr * 0.35);
  ctx.stroke();
  ctx.strokeStyle = '#f3ead8';
  ctx.lineWidth = Math.max(1, hr * 0.04);
  for (let i = 1; i < 5; i++) {
    const tx = hx + f * hr * (0.1 + i * 0.18);
    ctx.beginPath();
    ctx.moveTo(tx, hy + hr * 0.42);
    ctx.lineTo(tx, hy + hr * 0.56);
    ctx.stroke();
  }

  if (!t.dying) {
    const ns = Math.max(28, h * 0.1);
    const nx = -f * h * 0.08 - ns / 2, ny = -h * 0.82 - ns / 2;
    ctx.fillStyle = 'rgba(150, 40, 40, 0.35)';
    ctx.fillRect(nx, ny, ns, ns);
    const targeted = (hook && hook.titan === t) || (preview && preview.titan === t);
    if (targeted) {
      ctx.strokeStyle = `rgba(255, 70, 60, ${0.55 + 0.45 * Math.sin(performance.now() / 120)})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(nx - 3, ny - 3, ns + 6, ns + 6);
    }
  }

  ctx.strokeStyle = t.skin;
  ctx.lineWidth = h * 0.075;
  const sx = f * h * 0.1, sy = -h * 0.74;
  let ex, ey;
  if (t.hand) { ex = t.hand.x - t.x; ey = t.hand.y - t.y; }
  else { ex = f * h * 0.14 + step * h * 0.04; ey = -h * 0.46; }
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.fillStyle = t.skin;
  ctx.beginPath();
  ctx.arc(ex, ey, h * (t.hand ? 0.065 : 0.045), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (t.state === 'grab' && t.target) {
    const k = Math.min(1, t.grabT / grabWind(t));
    ctx.strokeStyle = `rgba(255, 60, 50, ${0.25 + k * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.target.x, t.target.y, (t.H * 0.12 + 16) * (1.6 - k * 0.6), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer() {
  const p = player;
  const sp = Math.hypot(p.vx, p.vy);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) ctx.globalAlpha = 0.35;
  const cx = -p.vx / (sp + 60), cy = -p.vy / (sp + 60);
  const len = 16 + Math.min(28, sp / 45);
  const droop = 12 * (1 - Math.min(1, sp / 400));
  ctx.fillStyle = '#2e5a3c';
  ctx.beginPath();
  ctx.moveTo(-6, -9);
  ctx.lineTo(6, -9);
  ctx.lineTo(cx * len + cy * 8, cy * len - cx * 8 + droop);
  ctx.lineTo(cx * len - cy * 8, cy * len + cx * 8 + droop);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(clamp(p.vx / 1500, -0.6, 0.6));
  ctx.fillStyle = '#e8e2d0';
  ctx.fillRect(-5, 3, 4, 10);
  ctx.fillRect(1, 3, 4, 10);
  ctx.fillStyle = '#3b2b22';
  ctx.fillRect(-5, 11, 4, 4);
  ctx.fillRect(1, 11, 4, 4);
  ctx.fillStyle = '#c8a874';
  ctx.fillRect(-6, -9, 12, 13);
  ctx.fillStyle = '#8a9096';
  ctx.fillRect(-10, 0, 5, 8);
  ctx.fillRect(5, 0, 5, 8);
  ctx.fillStyle = '#f0c9a0';
  ctx.beginPath();
  ctx.arc(0, -15, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2420';
  ctx.beginPath();
  ctx.arc(0, -16.5, 5.8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const a = sp > 120 ? Math.atan2(p.vy, p.vx) : (p.face > 0 ? 0 : Math.PI);
  ctx.strokeStyle = '#d7dde3';
  ctx.lineWidth = 2;
  for (const o of [-0.35, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(a + o) * 6, p.y + Math.sin(a + o) * 6);
    ctx.lineTo(p.x + Math.cos(a + o * 0.3) * 22, p.y + Math.sin(a + o * 0.3) * 22);
    ctx.stroke();
  }
}

function drawWorld() {
  const vw = viewW();
  for (const s of solids) {
    if (s.x + s.w < cam.x - 20 || s.x > cam.x + vw + 20) continue;
    if (s.wall) drawWall(s);
    else drawBuilding(s);
  }
  ctx.fillStyle = '#5a4b38';
  ctx.fillRect(cam.x - 100, GROUND, vw + 200, 600);
  ctx.fillStyle = '#7a6a4f';
  ctx.fillRect(cam.x - 100, GROUND, vw + 200, 10);

  const visible = t => t.x + t.H > cam.x && t.x - t.H < cam.x + vw;
  for (const t of titans) if (t.dying && visible(t)) drawTitan(t);
  for (const t of titans) if (!t.dying && visible(t)) drawTitan(t);

  if (state === 'play' && preview) {
    ctx.strokeStyle = preview.titan ? 'rgba(255, 110, 90, 0.5)' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(preview.x, preview.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(preview.x, preview.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (hook) {
    ctx.strokeStyle = 'rgba(225, 230, 236, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 2);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(hook.x, hook.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state !== 'menu') drawPlayer();

  for (const s of spears) {
    ctx.strokeStyle = '#ffcf6b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 0.015, s.y - s.vy * 0.015);
    ctx.stroke();
  }
  for (const r of rings) {
    const k = r.life / 0.35;
    ctx.strokeStyle = `rgba(${r.color}, ${k})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r * (1.1 - k * 0.3), 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    if (p.color === 'steam') {
      ctx.fillStyle = `rgba(238, 236, 232, ${a * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.color === 'gas') {
      ctx.fillStyle = `rgba(225, 230, 236, ${a * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.5 - a * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  ctx.textAlign = 'center';
  ctx.font = '800 22px system-ui, sans-serif';
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(t.text, t.x + 2, t.y + 2);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function fmtTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

function shadowText(text, x, y, color = '#fff') {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHud() {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '26px system-ui, sans-serif';
  for (let i = 0; i < stats.maxHp; i++) shadowText('♥', 18 + i * 28, 38, i < player.hp ? '#e5484d' : 'rgba(255,255,255,0.25)');

  ctx.textAlign = 'center';
  ctx.font = '800 30px system-ui, sans-serif';
  shadowText(game.endless ? fmtTime(game.time) : `${fmtTime(game.time)} / ${fmtTime(WIN_TIME)}`, W / 2, 40);
  ctx.font = '600 15px system-ui, sans-serif';
  shadowText(`Титанов убито: ${game.kills}`, W / 2, 62);
  if (game.combo > 1 && game.time - game.lastKill < 4) {
    ctx.font = '900 26px system-ui, sans-serif';
    shadowText(`КОМБО x${game.combo}`, W / 2, 96, '#ffd27a');
  }
  if (game.time < 12) {
    ctx.font = '600 17px system-ui, sans-serif';
    shadowText('Держи Пробел + стрелку: ↑ вверх, ↗ по диагонали, → вбок. Влетай в затылок титана!', W / 2, H - 40, '#e9e4da');
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, H - 8, W, 8);
  ctx.fillStyle = '#7fd18b';
  ctx.fillRect(0, H - 8, W * game.xp / game.need, 8);
  ctx.textAlign = 'left';
  ctx.font = '700 14px system-ui, sans-serif';
  shadowText(`Ур. ${game.level}`, 12, H - 16);

  for (const t of titans) {
    if (t.dying) continue;
    const sx = (t.x - cam.x) * scale;
    if (sx > -t.H * 0.15 * scale && sx < W + t.H * 0.15 * scale) continue;
    const left = sx < 0;
    const sy = clamp((t.y - t.H * 0.6 - cam.y) * scale, 80, H - 40);
    const ex = left ? 14 : W - 14, s = 7 + t.H / 40;
    ctx.fillStyle = t.aberrant ? '#ffb347' : '#e5484d';
    ctx.beginPath();
    ctx.moveTo(ex + (left ? -6 : 6), sy);
    ctx.lineTo(ex + (left ? s : -s), sy - s * 0.7);
    ctx.lineTo(ex + (left ? s : -s), sy + s * 0.7);
    ctx.closePath();
    ctx.fill();
  }
}

function dim(a = 0.72) {
  ctx.fillStyle = `rgba(8, 10, 18, ${a})`;
  ctx.fillRect(0, 0, W, H);
}

function wrap(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function cardRects() {
  const cw = Math.min(280, (W - 80) / 3), ch = 170, gap = 20;
  const x0 = (W - (cw * 3 + gap * 2)) / 2, y0 = H / 2 - ch / 2 + 20;
  return [0, 1, 2].map(i => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch }));
}

function drawMenu() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = `900 ${Math.min(72, W / 11)}px system-ui, sans-serif`;
  shadowText('АТАКА ТИТАНОВ', W / 2, H * 0.24);
  ctx.font = '800 26px system-ui, sans-serif';
  shadowText('S U R V I V O R S', W / 2, H * 0.24 + 40, '#cfe3f0');
  ctx.font = '500 15px system-ui, sans-serif';
  shadowText('фан-игра', W / 2, H * 0.24 + 66, 'rgba(255,255,255,0.6)');
  const lines = [
    'Держи Пробел — трос сам цепляется и несёт тебя. Отпусти — летишь по инерции',
    'Стрелки (или WASD) — куда лететь: ↑ вверх на крышу, ↗ по диагонали, → вбок',
    'Рядом с титаном трос цепляется прямо в затылок — и ты режешь сам',
    'Красный круг — титан тянется схватить. Улетай!',
    'Продержись 10 минут, чтобы отбить город. Esc — пауза',
  ];
  ctx.font = '500 17px system-ui, sans-serif';
  lines.forEach((l, i) => shadowText(l, W / 2, H * 0.46 + i * 30, '#e9e4da'));
  ctx.font = '800 22px system-ui, sans-serif';
  shadowText('Нажми Enter или Пробел, чтобы начать', W / 2, H * 0.46 + lines.length * 30 + 50, '#7cfc9a');
  if (best > 0) {
    ctx.font = '600 15px system-ui, sans-serif';
    shadowText(`Рекорд: ${fmtTime(best)}`, W / 2, H * 0.46 + lines.length * 30 + 84, 'rgba(255,255,255,0.7)');
  }
}

function drawLevelUp() {
  dim(0.6);
  ctx.textAlign = 'center';
  ctx.font = '900 40px system-ui, sans-serif';
  shadowText(`Уровень ${game.level - pendingLevels + 1}!`, W / 2, H / 2 - 120, '#7cfc9a');
  ctx.font = '500 16px system-ui, sans-serif';
  shadowText('← → выбрать, Enter — взять (или 1 / 2 / 3)', W / 2, H / 2 - 90, '#e9e4da');
  cardRects().forEach((r, i) => {
    const c = choices[i];
    const on = i === sel;
    ctx.fillStyle = on ? '#2f4a3a' : '#1e2433';
    ctx.strokeStyle = on ? '#7cfc9a' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = on ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(String(i + 1), r.x + r.w / 2, r.y + 26);
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, r.x + r.w / 2, r.y + 60);
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillStyle = '#cfd6dc';
    wrap(c.desc(stats), r.w - 30).forEach((l, j) => ctx.fillText(l, r.x + r.w / 2, r.y + 94 + j * 20));
  });
}

function drawOver() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = '900 60px system-ui, sans-serif';
  shadowText('ТЫ ПАЛ', W / 2, H * 0.32, '#e5484d');
  ctx.font = 'italic 500 18px system-ui, sans-serif';
  shadowText('Отдай своё сердце…', W / 2, H * 0.32 + 36, 'rgba(255,255,255,0.7)');
  ctx.font = '700 22px system-ui, sans-serif';
  shadowText(`Продержался: ${fmtTime(game.time)}   Титанов: ${game.kills}   Уровень: ${game.level}`, W / 2, H * 0.48);
  ctx.font = '600 16px system-ui, sans-serif';
  shadowText(`Рекорд: ${fmtTime(best)}`, W / 2, H * 0.48 + 32, 'rgba(255,255,255,0.7)');
  ctx.font = '800 22px system-ui, sans-serif';
  shadowText('Enter — ещё раз', W / 2, H * 0.48 + 90, '#7cfc9a');
}

function drawWin() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = '900 60px system-ui, sans-serif';
  shadowText('ГОРОД ОТБИТ!', W / 2, H * 0.32, '#7cfc9a');
  ctx.font = 'italic 500 18px system-ui, sans-serif';
  shadowText('Разведкорпус гордится тобой', W / 2, H * 0.32 + 36, 'rgba(255,255,255,0.7)');
  ctx.font = '700 22px system-ui, sans-serif';
  shadowText(`Титанов: ${game.kills}   Уровень: ${game.level}`, W / 2, H * 0.48);
  ctx.font = '800 22px system-ui, sans-serif';
  shadowText('Enter — играть дальше без конца', W / 2, H * 0.48 + 70, '#7cfc9a');
  ctx.font = '600 17px system-ui, sans-serif';
  shadowText('R — новая игра', W / 2, H * 0.48 + 104, '#e9e4da');
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackdrop();
  const sx = game.shake ? rand(-1, 1) * game.shake : 0, sy = game.shake ? rand(-1, 1) * game.shake : 0;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-cam.x + sx, -cam.y + sy);
  drawWorld();
  ctx.restore();
  if (state !== 'menu') drawHud();
  if (state === 'menu') drawMenu();
  else if (state === 'levelup') drawLevelUp();
  else if (state === 'over') drawOver();
  else if (state === 'win') drawWin();
  else if (state === 'paused') {
    dim(0.5);
    ctx.textAlign = 'center';
    ctx.font = '900 44px system-ui, sans-serif';
    shadowText('Пауза', W / 2, H / 2);
    ctx.font = '500 16px system-ui, sans-serif';
    shadowText('Esc — продолжить', W / 2, H / 2 + 34, '#e9e4da');
  }
}

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  const confirm = e.code === 'Enter' || e.code === 'Space';
  if (state === 'menu' && confirm) return start();
  if (state === 'over' && (confirm || e.code === 'KeyR')) return start();
  if (state === 'win') {
    if (e.code === 'KeyR') return start();
    if (e.code === 'Enter') {
      game.endless = true;
      state = 'play';
    }
    return;
  }
  if (state === 'levelup') {
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) return choose(+e.code.slice(5) - 1);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') sel = (sel + 2) % 3;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') sel = (sel + 1) % 3;
    if (confirm) choose(sel);
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (state === 'play') state = 'paused';
    else if (state === 'paused') state = 'play';
    return;
  }
  if (state === 'play' && (e.code === 'KeyW' || e.code === 'ArrowUp') && player.grounded && !keys.Space) player.vy = -650;
});

addEventListener('keyup', e => {
  keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (state === 'levelup') {
    const i = cardRects().findIndex(r => pointIn(mouse.x, mouse.y, r));
    if (i >= 0) sel = i;
  }
});

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (state === 'menu' || state === 'over') return start();
  if (state === 'levelup') {
    const i = cardRects().findIndex(r => pointIn(e.clientX, e.clientY, r));
    if (i >= 0) choose(i);
  }
});

addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (state === 'play') state = 'paused';
});

reset();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
