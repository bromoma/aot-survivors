'use strict';
const sfx = (n, o) => { if (typeof SND !== 'undefined') SND.play(n, o); };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const buf = document.createElement('canvas');
const bctx = buf.getContext('2d', { willReadFrequently: CPU_RASTER });

const WIN_TIME = 600;
const RUN = 170;
const ART = 2;
const GLIDE = 80;
const MAXZ = 380;
const FONT = "Pixellari, monospace";
const OUTLINE = '#140c10';

const SKINS = ['#c0927c', '#b8806e', '#c6a088', '#a88270', '#c49480', '#9a7462', '#d0a890', '#b08a76'];
const HAIRS = ['#3b2a20', '#5a3d2b', '#1f1a17', '#7a5a3a', '#2d2620', '#8d8780', '#c9a35a', '#8c3a22'];
const IRIS = ['#5a3a22', '#3a6a8a', '#4a7a3a', '#2a2a2a'];
const SHIRTS = ['#5a6878', '#7a5048', '#5c6a4a', '#8a7650', '#665a70', '#a8a090', '#6e5a46', '#4e5c5c'];
const PANTS = ['#5a4a3a', '#3e4a5a', '#6b5a48', '#4a4038'];

const FACTIONS = [
  { id: 'mp', name: 'Военная полиция', diff: 'Легко', color: '#7cfc9a', map: 'city', civs: 40, desc: 'Бескрайний город: улицы, площади и парки. Летай по крышам, титанов немного', base: 3, per: 1 / 45, cap: 11, spawn0: 5, spawnMin: 2.2, decay: 1 / 100, group: 2, abFrom: 240, abMax: 0.18, speed: 0.82, big: 0.12, heal: 10, grab: 1.25, turn: 0.85, req: 0.45 },
  { id: 'garrison', name: 'Гарнизон', diff: 'Средне', color: '#ffd27a', map: 'ruins', civs: 22, desc: 'Руины Шиганшины во все стороны: пожары, обломки, рощи. Титанов много', base: 4, per: 1 / 20, cap: 22, spawn0: 3.2, spawnMin: 0.95, decay: 1 / 50, group: 3, abFrom: 100, abMax: 0.32, speed: 1, big: 0.25, heal: 12, grab: 1.08, turn: 1, req: 0.5 },
  { id: 'scouts', name: 'Разведкорпус', diff: 'Сложно', color: '#ff6b6b', map: 'field', civs: 12, desc: 'Бескрайние поля, деревни и леса. Между рощами высоту набрать трудно', base: 4, per: 1 / 17, cap: 24, spawn0: 3.4, spawnMin: 0.85, decay: 1 / 45, group: 4, abFrom: 60, abMax: 0.42, speed: 1.12, big: 0.35, heal: 16, grab: 0.92, turn: 1.3, req: 0.6 },
];

const RARITY = {
  3: { name: 'Редкий', color: '#6fb6ff', flare: '#4a8cff' },
  4: { name: 'Эпический', color: '#c58cff', flare: '#a24aff' },
  5: { name: 'Легендарный', color: '#ffd36e', flare: '#ffcf3a' },
};

const CHARS = [
  { id: 'cadet', name: 'Кадет', rarity: 3, hair: '#3b2b22', look: 'short', ability: 'Обычный выпускник кадетского корпуса' },
  { id: 'connie', name: 'Конни', rarity: 3, hair: '#8d8780', look: 'buzz', ability: 'Шустрый: летает на 10% быстрее' },
  { id: 'sasha', name: 'Саша', rarity: 3, hair: '#7a4a2a', look: 'ponytail', ability: 'Картошка: +1 сердце и лечение чаще' },
  { id: 'jean', name: 'Жан', rarity: 3, hair: '#a07a4a', look: 'short', ability: 'Лидер: атака достаёт на 20% дальше' },
  { id: 'eren', name: 'Эрен', rarity: 4, hair: '#4a3020', look: 'long', ability: 'Ярость: комбо x3 лечит сердце' },
  { id: 'armin', name: 'Армин', rarity: 4, hair: '#e2c46a', look: 'bob', ability: 'Стратег: +25% опыта, ракеты предупреждают о титанах' },
  { id: 'hange', name: 'Ханджи', rarity: 4, hair: '#6a4028', look: 'goggles', ability: 'Учёный: убийство оглушает титанов рядом, с собой ловушка из тросов' },
  { id: 'mikasa', name: 'Микаса', rarity: 5, hair: '#151214', look: 'scarf', ability: 'Облёт +35%, после убийства сразу летит к следующему' },
  { id: 'levi', name: 'Леви', rarity: 5, hair: '#121014', look: 'undercut', ability: 'Сильнейший: вихрь клинков с начала, быстрее во всём' },
  { id: 'erwin', name: 'Эрвин', rarity: 5, hair: '#d8b860', look: 'short', ability: 'Командор: с начала световая ракета и боевой товарищ' },
  { id: 'historia', name: 'Хистория', rarity: 4, hair: '#f0d070', look: 'ponytail', ability: 'Королева: +2 сердца и лечение чаще' },
  { id: 'mike', name: 'Майк', rarity: 4, hair: '#c8a870', look: 'short', ability: 'Чутьё: атака дальше на 15%, +10% опыта, ракеты предупреждают о титанах' },
];
trFields(FACTIONS, ['name', 'diff', 'desc']);
trFields(Object.values(RARITY), ['name']);
trFields(CHARS, ['name', 'ability']);
const charById = id => CHARS.find(c => c.id === id) || CHARS[0];


const difficulty = () => clamp((game.time - 60) / 300, 0, 1);

let threat = 1;
const THREAT_NAMES = ['I', 'II', 'III', 'IV', 'V'];
function threatMax(fi) { return clamp((save.threat && save.threat[FACTIONS[fi].id]) || 1, 1, 5); }
function withThreat(f, k) {
  const e = k - 1;
  return { ...f, threat: k, cap: Math.round(f.cap * (1 + 0.25 * e)), base: Math.round(f.base * (1 + 0.25 * e)), per: f.per * (1 + 0.25 * e), spawn0: f.spawn0 * (1 - 0.1 * e), spawnMin: f.spawnMin * (1 - 0.12 * e), speed: f.speed * (1 + 0.08 * e), grab: f.grab * (1 - 0.07 * e), heal: f.heal + 3 * e, abMax: f.abMax + 0.05 * e };
}

const shadowLayer = makeCanvas(1, 1), steamLayer = makeCanvas(1, 1), smokeLayer = makeCanvas(1, 1);
let W = 0, H = 0, PX = 2, UP = 3, bw = 0, bh = 0, DPR = 1;
const VIEW_SHORT = 520;
function resize() {
  DPR = clamp(window.devicePixelRatio || 1, 1, 2);
  const cw = Math.max(320, innerWidth), ch = Math.max(240, innerHeight);
  W = Math.round(cw * DPR);
  H = Math.round(ch * DPR);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  const short = Math.min(W, H);
  let best = 2, bd = Infinity;
  for (let p = 1; p <= 8; p++) {
    const d = Math.abs(short / p - VIEW_SHORT);
    if (d <= bd) { bd = d; best = p; }
  }
  PX = Math.max(DPR >= 2 ? 2 : 1, best);
  UP = clamp(Math.round(Math.min(cw, ch) / 280), 2, 5) * DPR;
  bw = Math.ceil(W / PX) + 2;
  bh = Math.ceil(H / PX) + 2;
  buf.width = bw;
  buf.height = bh;
  for (const [c] of [shadowLayer, steamLayer, smokeLayer]) { c.width = bw; c.height = bh; }
}
addEventListener('resize', resize);
resize();


const viewW = () => (bw - 2) * ART;
const viewH = () => (bh - 2) * ART;
const keys = {};
const mouse = { x: 0, y: 0 };

let state = 'menu';
let faction = FACTIONS[0], factionSel = 0;
let menuTab = 0, squadSel = 0, menuMsg = '', menuMsgT = 0, pullRes = [], pullIdx = 0, pullT = 0;
let buildings, trees, anchors, titans, particles, texts, rings, slashes, decals, clouds, fogs, motes, emitters, civs, riders, flocks, flares;
let player, stats, game, cam;
let choices = [], pendingLevels = 0, sel = 1;
const SAVE_KEY = 'aot-td-save';
let save = loadSave();
LANG = pickLang(save);
document.documentElement.lang = LANG;
document.title = tr('Атака титанов: Survivors');
factionSel = clamp(save.faction || 0, 0, 2);

function loadSave() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  if (s && s.v === 1 && s.chars) return s;
  s = { v: 1, tokens: 300, pity5: 0, pity4: 0, pulls: 0, chars: { cadet: 1 }, selected: 'cadet', best: {}, faction: 0 };
  for (const f of FACTIONS) {
    try {
      const b = +localStorage.getItem('aot-td-best-' + f.id) || 0;
      if (b) s.best[f.id] = b;
    } catch (e) {}
  }
  return s;
}

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}

function checksum(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function exportCode() {
  const body = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
  return 'AOT1.' + body + '.' + checksum(body);
}

function importCode(code) {
  const m = /^AOT1\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(code.trim());
  if (!m || checksum(m[1]) !== m[2]) return false;
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (s.v !== 1 || !s.chars) return false;
    save = s;
    persist();
    return true;
  } catch (e) {
    return false;
  }
}

function bestOf(f) {
  return save.best[f.id] || 0;
}

function line(g, x0, y0, x1, y1, w, c) {
  g.fillStyle = c;
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const o = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) {
    g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w);
  }
}

function roundRect(g, x, y, w, h, r, c) {
  g.fillStyle = c;
  for (let i = 0; i < h; i++) {
    const d = i < r ? r - i - 0.5 : i >= h - r ? i - (h - r) + 0.5 : 0;
    const inset = d > 0 ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
    g.fillRect(Math.round(x) + inset, Math.round(y) + i, Math.round(w) - inset * 2, 1);
  }
}

function outlineCanvas(c, col) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const w = c.width, h = c.height;
  const img = g.getImageData(0, 0, w, h), a = img.data;
  const mark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (a[i * 4 + 3]) continue;
      if ((x > 0 && a[(i - 1) * 4 + 3]) || (x < w - 1 && a[(i + 1) * 4 + 3]) || (y > 0 && a[(i - w) * 4 + 3]) || (y < h - 1 && a[(i + w) * 4 + 3])) mark[i] = 1;
    }
  }
  const n = parseInt(col.slice(1), 16);
  for (let i = 0; i < w * h; i++) {
    if (!mark[i]) continue;
    a[i * 4] = (n >> 16) & 255;
    a[i * 4 + 1] = (n >> 8) & 255;
    a[i * 4 + 2] = n & 255;
    a[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const [out, og] = makeCanvas(w, h);
  og.drawImage(c, 0, 0);
  return out;
}

function mapSprite(rows, pal, edge = OUTLINE) {
  const [c, g] = makeCanvas(rows[0].length + 2, rows.length + 2, true);
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (pal[r[x]]) rect(g, x + 1, y + 1, 1, 1, pal[r[x]]);
  });
  return outlineCanvas(c, edge);
}

const flashCache = new WeakMap();
function flashOf(img) {
  let f = flashCache.get(img);
  if (!f) {
    const [c, g] = makeCanvas(img.width, img.height);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    flashCache.set(img, c);
    f = c;
  }
  return f;
}

const portraitCache = {};
function portrait(id) {
  if (portraitCache[id]) return portraitCache[id];
  const c = charById(id), hair = c.hair, hl = shade(hair, 1.7);
  const [cv, g] = makeCanvas(26, 26, true);
  const skin = '#f2c7a0', sd = '#d9a47e';
  rect(g, 4, 19, 18, 6, '#b98a52');
  rect(g, 4, 19, 18, 1, '#d4a86a');
  rect(g, 1, 20, 5, 5, '#2f6b45');
  rect(g, 20, 20, 5, 5, '#2f6b45');
  rect(g, 11, 19, 4, 3, '#e8e2d0');
  rect(g, 7, 21, 1, 4, '#3e2d22');
  rect(g, 18, 21, 1, 4, '#3e2d22');
  rect(g, 11, 15, 4, 4, sd);
  if (c.look === 'scarf') {
    rect(g, 8, 16, 10, 3, '#b3262e');
    rect(g, 15, 18, 3, 5, '#b3262e');
    rect(g, 8, 16, 10, 1, '#d84a4a');
  }
  if (c.look === 'long' || c.look === 'scarf' || c.look === 'bob') rect(g, 6, 7, 14, 8, hair);
  disc(g, 13, 10, 6, 7, sd);
  disc(g, 12, 10, 6, 7, skin);
  const lid = c.look === 'undercut' ? 1 : 2;
  for (const ex of [9, 14]) {
    rect(g, ex, 11, 2, lid, '#ffffff');
    rect(g, ex + 1, 11 + lid - 1, 1, 1, c.look === 'scarf' ? '#2a2a2a' : c.id === 'armin' ? '#3a6a8a' : '#1b1418');
    rect(g, ex - 1, 9 + (c.look === 'undercut' ? 1 : 0), 4, 1, shade(hair, 0.9));
  }
  rect(g, 12, 13, 1, 1, sd);
  rect(g, 11, 15, 3, 1, c.look === 'undercut' ? '#7a4a40' : '#9a5048');
  const cap = (y0, y1) => {
    for (let y = y0; y <= y1; y++) {
      const w = Math.round(6 * Math.sqrt(Math.max(0, 1 - ((y - 10) * (y - 10)) / 56)));
      rect(g, 12 - w - 1, y, w * 2 + 3, 1, hair);
    }
  };
  if (c.look === 'buzz') {
    cap(3, 6);
    for (let x = 7; x < 18; x += 2) rect(g, x, 5, 1, 1, hl);
  } else if (c.look === 'goggles') {
    cap(2, 7);
    for (let x = 5; x < 20; x += 3) rect(g, x, 1 + (x % 2), 2, 2, hair);
    rect(g, 6, 10, 13, 3, '#4a3a2e');
    disc(g, 10, 11, 2, 1, '#9fd0e8');
    disc(g, 15, 11, 2, 1, '#9fd0e8');
  } else {
    cap(2, 7);
    if (c.look === 'undercut') {
      rect(g, 5, 7, 3, 4, shade(hair, 1.4));
      rect(g, 16, 7, 3, 4, shade(hair, 1.4));
      rect(g, 8, 8, 2, 2, hair);
      rect(g, 14, 8, 3, 2, hair);
    } else {
      for (let x = 6; x < 19; x += 2) rect(g, x, 8, 1, 1 + (x % 3 === 0 ? 1 : 0), hair);
    }
    if (c.look === 'long' || c.look === 'scarf') {
      rect(g, 5, 7, 2, 8, hair);
      rect(g, 18, 7, 2, 8, hair);
    }
    if (c.look === 'bob') {
      rect(g, 4, 6, 3, 10, hair);
      rect(g, 18, 6, 3, 10, hair);
      rect(g, 6, 8, 13, 1, hair);
    }
    if (c.look === 'ponytail') {
      rect(g, 19, 6, 3, 3, hair);
      rect(g, 20, 9, 2, 8, hair);
    }
  }
  for (let x = 8; x < 13; x += 2) rect(g, x, 3, 1, 1, hl);
  portraitCache[id] = outlineCanvas(cv, OUTLINE);
  return portraitCache[id];
}
const HEART = mapSprite(['.rr.rr.', 'rRrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e5484d', R: '#ffc2c2' });
const HEART_EMPTY = mapSprite(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#4b4452' });

const EMBLEMS = {
  scouts: mapSprite([
    'BB.........WW',
    'BBB.......WWW',
    '.BBBB...WWWW.',
    '.BBbBB.WWwWW.',
    '..BBbBBWWwW..',
    '..BBBbBWwWW..',
    '...BBBbWwW...',
    '...BBBBWWW...',
    '....BBBWW....',
    '.....BBW.....',
    '......B......',
  ], { B: '#3f6fb5', b: '#2a4f86', W: '#f2f4f6', w: '#b9c2cc' }),
  garrison: mapSprite([
    '..rrr...rrr..',
    '.rRrrr.rRrrr.',
    '.rrRrr.rrRrr.',
    '.rrrrr.rrrrr.',
    '..rrr...rrr..',
    '...g.....g...',
    '...gl...lg...',
    '....g...g....',
    '....gg.gg....',
    '.....ggg.....',
    '......g......',
  ], { r: '#c8303a', R: '#ff8a8a', g: '#3f7a3f', l: '#6ab05a' }),
  mp: mapSprite([
    '.........y..',
    '........y...',
    '.....uuy....',
    '....uuuu....',
    '...uuueuu...',
    '..uuuuuuu...',
    '.uuuuuuuu...',
    '.uuu..uuum..',
    '......uuumm.',
    '.....uuuumm.',
    '....uuuuum..',
    '....uuuum...',
  ], { u: '#eef2ee', m: '#3f8a52', y: '#e8c45a', e: '#1b1418' }),
};
const BIRD = [['b...b', '.b.b.', '..b..'], ['.....', 'bbbbb', '..b..']].map(r => mapSprite(r, { b: '#2a2228' }, '#2a2228'));

let props = [];
const KZ = 1, KY = 0.5;

const BODIES = {
  normal: { leg: 0.43, head: 0.12, tw: 0.3, arm: 0.34 },
  lanky: { leg: 0.5, head: 0.1, tw: 0.22, arm: 0.42 },
  fat: { leg: 0.36, head: 0.118, tw: 0.4, arm: 0.3, belly: true },
  bighead: { leg: 0.36, head: 0.165, tw: 0.28, arm: 0.3 },
  aberrant: { leg: 0.47, head: 0.13, tw: 0.24, arm: 0.46 },
};

function bodyOf(type) {
  const b = BODIES[type], neck = 0.04;
  const th = 1 - b.leg - neck - b.head * 2;
  return { ...b, th, neck, nape: b.leg + th + neck * 0.5, headC: b.leg + th + neck + b.head, shoulder: b.leg + th - 0.03 };
}

function genWorld() {
  worldReset(faction.map, Math.floor(Math.random() * 1e9));
  clouds = [];
  for (let i = 0; i < 6; i++) clouds.push({ x: rand(-2600, 2600), y: rand(-2600, 2600), v: rand(10, 20), s: i % CLOUD_SPR.length });
  fogs = [];
  motes = [];
  for (let i = 0; i < (faction.map === 'ruins' ? 80 : 40); i++) motes.push({ x: rand(0, 1), y: rand(0, 1), v: rand(2, 6), p: rand(0, 6) });
}

function freeSpot(minDist, town) {
  return spotNear(Math.max(minDist, 60), Math.max(minDist, 60) + 1500, town ? (x, y) => townAt(x, y) > 0.35 : null);
}

function spawnRider() {
  const a = rand(0, TAU), d = rand(500, 1400), b = rand(0, TAU);
  riders.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, vx: Math.cos(b) * 160, vy: Math.sin(b) * 160, phase: 0, lastSpr: null });
}

function spawnCiv(x, y) {
  civs.push({ x, y, v: Math.floor(Math.random() * 2), tx: x, ty: y, wait: rand(0, 2), phase: rand(0, 6), panic: 0, face: 1, dir: rand(0, TAU), moving: false, lastSpr: null });
}

let worldFor = -1, worldUsed = false;
function reset() {
  threat = clamp(save.threatSel && save.threatSel[FACTIONS[factionSel].id] || 1, 1, threatMax(factionSel));
  faction = withThreat(FACTIONS[factionSel], threat);
  if (worldFor !== factionSel || worldUsed) {
    genWorld();
    worldFor = factionSel;
    worldUsed = false;
  }
  stats = { speed: 480, range: 340, orbit: 620, engage: 380, maxHp: 5, spin: 0, healEvery: faction.heal, glide: GLIDE, xp: 1, cd: 0.45, stun: false, rage: false, chain: false, warn: false, cdMul: 1, allyMul: 1, chainCd: 2, startSkills: [] };
  const hero = save.chars[save.selected] ? charById(save.selected) : CHARS[0];
  const stars = save.chars[hero.id] || 1;
  if (hero.id === 'connie') { stats.speed *= 1.1; stats.glide *= 0.9; }
  if (hero.id === 'sasha') { stats.maxHp += 1; stats.healEvery -= 4; }
  if (hero.id === 'jean') { stats.engage *= 1.2; stats.orbit *= 1.1; }
  if (hero.id === 'eren') stats.rage = true;
  if (hero.id === 'armin') { stats.xp = 1.25; stats.warn = true; }
  if (hero.id === 'hange') stats.stun = true;
  if (hero.id === 'mikasa') { stats.orbit *= 1.35; stats.chain = true; }
  if (hero.id === 'levi') { stats.speed *= 1.15; stats.orbit *= 1.2; stats.cd = 0.15; }
  if (hero.id === 'erwin') stats.startSkills.push(['flash', 1], ['ally', 1]);
  if (hero.id === 'historia') { stats.maxHp += 2; stats.healEvery -= 2; }
  if (hero.id === 'mike') { stats.engage *= 1.15; stats.xp *= 1.1; stats.warn = true; }
  stats.speed *= 1 + (stars - 1) * 0.03;
  stats.orbit *= 1 + (stars - 1) * 0.03;
  applyHeroLevel(stats, hero.id);
  applyGear(stats);
  metaApply(stats);
  const start = startSpot();
  player = {
    x: start.x, y: start.y, z: 0, vx: 0, vy: 0, hp: 5, inv: 0, face: 1,
    mode: 'fly', anchor: null, prevAnchor: null, prevT: 0, hookT: 0, puffT: 0, ropeT: 1,
    target: null, phase: '', ang: 0, cutT: 0, attackT: 0, engageCd: 0, lowT: 0, lastChain: -10,
    char: hero.id, stars, dir: Math.PI / 2, runPhase: 0, lastSpr: null,
  };
  player.hp = stats.maxHp;
  titans = [];
  particles = [];
  texts = [];
  rings = [];
  slashes = [];
  decals = [];
  civs = [];
  riders = [];
  flocks = [];
  flares = [];
  cam = { x: player.x - viewW() / 2, y: player.y - viewH() / 2 - 60 };
  worldTick(true);
  for (let i = 0; i < faction.civs; i++) {
    const s = freeSpot(0, true);
    if (s) spawnCiv(s.x, s.y);
  }
  if (faction.map === 'field') for (let i = 0; i < 5; i++) spawnRider();
  for (let i = 0; i < (faction.map === 'field' ? 10 : 5); i++) spawnFlock();
  pendingLevels = 0;
  game = { time: 0, kills: 0, lost: 0, xp: 0, level: 1, need: 5, spawnT: 2, shake: 0, hitstop: 0, combo: 0, lastKill: -10, healCount: 0, spinT: 3, endless: false, civT: 0, flareT: 15, paidKills: 0, paidTime: 0, reward: 0 };
  combatReset();
  juiceReset();
  if (hero.id === 'levi') stats.skills.spin = 1;
  if (hero.id === 'hange') stats.skills.trap = 1;
  metaRunStart();
  heroRunStart();
  for (let i = 0; i < faction.base; i++) spawnTitan();
}

let resetQueued = 0;
function requestReset() {
  resetQueued = worldFor === factionSel && !worldUsed ? 1 : 2;
}

function start() {
  resetQueued = 0;
  save.faction = factionSel;
  persist();
  reset();
  worldUsed = true;
  state = 'play';
}

function inputVec() {
  const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const y = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const l = Math.hypot(x, y);
  return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}

function pickAnchor(ix, iy) {
  const p = player;
  let found = null, bs = Infinity;
  for (const a of anchors) {
    const dx = a.x - p.x, dy = a.y - p.y;
    if (Math.abs(dx) > stats.range || Math.abs(dy) > stats.range) continue;
    const d = Math.hypot(dx, dy);
    if (d < 60 || d > stats.range) continue;
    const cos = (dx * ix + dy * iy) / d;
    if (cos < 0.5) continue;
    const s = Math.abs(d - stats.range * 0.65) + (1 - cos) * 300 - a.z * 0.5;
    if (s < bs) { bs = s; found = a; }
  }
  return found;
}

function orbitR(t) {
  return t.H * 0.32 + 50;
}

function nape(t) {
  const f = t.fwd ?? -0.06;
  return { x: t.x + Math.cos(t.face) * t.H * f, y: t.y + Math.sin(t.face) * t.H * f, z: t.napeZ };
}

function reqZ(t) {
  let z = nape(t).z * faction.req;
  if (t.stun > 0) z *= 0.6;
  if (t.boss) z = Math.min(z, 210);
  if (t.boss && t.boss.def && t.boss.def.fixed) z = Math.min(z, 170);
  if (t.kind === 'giant') z = Math.min(z, 260);
  return z;
}

function grabWind(t) {
  if (t.boss) return (t.boss.kind === 'female' ? 0.65 : 0.75) * faction.grab;
  return (t.aberrant || t.kind === 'crawler' || t.kind === 'small' ? lerp(0.6, 0.4, difficulty()) : lerp(0.85, 0.5, difficulty())) * faction.grab * (t.kind === 'giant' ? 1.35 : 1);
}

function reachOf(t) {
  return t.H * (t.kind === 'giant' ? 0.36 : 0.45) + 30;
}

const KINDS = {
  normal: { h: [160, 250] },
  lanky: { h: [170, 260] },
  fat: { h: [160, 240] },
  bighead: { art: 'normal', h: [160, 230] },
  aberrant: { h: [220, 300], sp: [110, 150] },
  crawler: { body: 'aberrant', h: [150, 230], sp: [85, 115], xp: 1, fwd: 0.3 },
  small: { body: 'bighead', h: [110, 160], sp: [75, 100] },
  thrower: { body: 'normal', h: [270, 390], xp: 2 },
  giant: { body: 'normal', h: [470, 560], hp: 2, xp: 6 },
};
const kindReady = k => !!SPR[`titan_${k}_${sizesOf(k)[0]}_down`];

function rollKind() {
  const t = game.time, d = difficulty(), m = faction.map;
  if (t > faction.abFrom && Math.random() < 0.08 + d * faction.abMax) return 'aberrant';
  const opts = [
    ['small', t > 40 ? 0.12 * (m === 'city' ? 1.4 : 1) : 0],
    ['crawler', t > 70 ? (0.05 + 0.08 * d) * (m === 'field' ? 1.5 : 1) : 0],
    ['thrower', t > 110 ? (0.04 + 0.08 * d) * (m === 'city' ? 0.6 : m === 'ruins' ? 1.3 : 1) : 0],
    ['giant', t > 170 ? (0.025 + 0.05 * d) * (m === 'field' ? 1.5 : 1) : 0],
  ];
  let r = Math.random();
  for (const [k, p] of opts) if (p && kindReady(k)) { if (r < p) return k; r -= p; }
  if (Math.random() < Math.min(0.5, faction.big + t / 900)) return 'big';
  return pick(['normal', 'normal', 'lanky', 'fat', 'bighead']);
}

function spawnTitan(at, kind) {
  kind = kind || rollKind();
  let type = kind, h;
  if (kind === 'big') { type = pick(['normal', 'normal', 'lanky', 'fat']); h = rand(300, 420); }
  const K = KINDS[type];
  if (h === undefined) h = rand(K.h[0], K.h[1]);
  const aberrant = type === 'aberrant';
  let x, y;
  if (at) { x = at.x; y = at.y; }
  else {
    const a = Math.random() * Math.PI * 2, dist = Math.hypot(viewW(), viewH()) / 2 + 150;
    x = player.x + Math.cos(a) * dist;
    y = player.y + Math.sin(a) * dist;
  }
  const art = K.art || type;
  const sizes = sizesOf(art);
  let size = sizes[0];
  for (const sz of sizes) if (Math.abs(sz - h / ART) < Math.abs(size - h / ART)) size = sz;
  const tt = { art, size };
  const set = titanSet(tt);
  const nap = NAPE[`${set}_${size}`] || { fx: 0.5, fy: 0.2 };
  const H = size * ART;
  titans.push({
    x, y, H, Hp: size, size, art, set, napeZ: H * (1 - nap.fy), face: Math.atan2(player.y - y, player.x - x),
    type, kind: type, g: bodyOf(K.body || type), hp: K.hp || 1, fwd: K.fwd,
    speed: (K.sp ? rand(K.sp[0], K.sp[1]) : rand(35, 60) * Math.sqrt(250 / H)) * faction.speed,
    aberrant, state: 'walk', grabT: 0, grabCd: rand(1, 2), grabAng: 0, hand: null, prey: null, preyT: 0, held: -1,
    stun: 0, lunge: 0, lungeCd: rand(2, 4), flash: 0,
    phase: Math.random() * 6, dying: 0, fallDir: 1, fallSide: 1, deathKey: 'down',
  });
  return { x, y, kind: type };
}

function titanHit(t) {
  const p = player, n = nape(t);
  t.hp--;
  t.flash = 0.15;
  t.stun = Math.max(t.stun, 1.4);
  t.state = 'walk';
  t.hand = null;
  game.hitstop = 0.08;
  game.shake = 12;
  burst(n.x, n.y - KZ * n.z, 24, '#b3122e');
  steam(n.x, n.y - KZ * n.z, 10);
  slashes.push({ x: n.x, y: n.y - KZ * n.z, ang: t.face + Math.PI, life: 0.22 });
  sfx('slash', { vol: 1 });
  sfx('cut', { vol: 0.9, rate: 0.7 });
  addText(tr('Ещё удар!'), n.x, n.y - KZ * n.z - 40, '#ffd27a');
  if (p.target === t) {
    p.mode = 'fly';
    p.target = null;
    p.vx = -Math.cos(t.face) * 420;
    p.vy = -Math.sin(t.face) * 420;
    p.engageCd = 0.35;
  }
  gainXp(2);
}

function cutTitan(t, ally) {
  if (t.hp > 1) { titanHit(t); return false; }
  killTitan(t, ally);
  return true;
}

function spawnFlock(near) {
  let x, y;
  if (near) {
    const a = rand(0, Math.PI * 2), d = rand(300, 700);
    x = near.x + Math.cos(a) * d;
    y = near.y + Math.sin(a) * d;
  } else {
    const s = freeSpot(0) || { x: player.x + rand(-400, 400), y: player.y + rand(-400, 400) };
    x = s.x;
    y = s.y;
  }
  const n = 4 + Math.floor(Math.random() * 6), birds = [];
  for (let i = 0; i < n; i++) birds.push({ ox: rand(-25, 25), oy: rand(-15, 15), p: rand(0, 6) });
  flocks.push({ x, y, z: 0, vx: 0, vy: 0, vz: 0, fly: false, birds, life: 999 });
}

function fireFlare(x, y, color) {
  sfx('flare', { x, y, vol: 0.6, range: 2200 });
  flares.push({ x, y, z: 10, vz: 380, color, life: 3.5 });
}

function addText(text, x, y, color) {
  texts.push({ text, x, y, color, life: 1.1 });
}

function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(120, 420);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: rand(0.4, 0.9), max: 0.9, size: Math.random() < 0.3 ? 2 : 1, color, g: 700, kind: 'px' });
  }
}

function steam(x, y, n, spread = 20) {
  for (let i = 0; i < n; i++) {
    const life = rand(1, 2.2);
    particles.push({ x: x + rand(-spread, spread), y: y + rand(-spread, spread), vx: rand(-40, 40), vy: rand(-110, -40), life, max: life, size: rand(3, 7), g: -15, kind: 'steam' });
  }
}

function splatDecal(x, y, size) {
  const R = Math.ceil(size * 1.9) + 2;
  const [c, g] = makeCanvas(R * 2 + 1, Math.ceil(R * 1.2) + 1);
  const cx = R, cy = Math.ceil(R * 0.6);
  for (let i = 0; i < size * 5; i++) {
    const a = rand(0, TAU), d = Math.pow(Math.random(), 1.6) * size;
    rect(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.55, 1, 1, pick(['#4e0c0e', '#6a1214', '#7a1416', '#3a0a0c']));
  }
  for (let i = 0; i < 6; i++) {
    const a = rand(0, TAU), d = size * rand(1.1, 1.8);
    rect(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.55, 1, 1, '#6a1214');
  }
  decals.push({ x, y, img: c, ox: cx, oy: cy, life: 25 });
  if (decals.length > 60) decals.shift();
}

function saveBest() {
  if (game.time > bestOf(faction)) save.best[faction.id] = game.time;
  persist();
}

function finishRun(won) {
  const mul = [1, 1.5, 2][factionSel] * (1 + 0.3 * (threat - 1));
  if (won && threat < 5 && threatMax(factionSel) <= threat) {
    save.threat = save.threat || {};
    save.threat[faction.id] = threat + 1;
    game.unlocked = threat + 1;
  }
  const greed = 1 + ((save.meta && save.meta.greed) || 0) * 0.1;
  const hx = runHeroXp(won, game.kills - game.paidKills, game.time - game.paidTime, game.bossKills - (game.paidBoss || 0));
  if (save.chars[player.char]) {
    const ups = addHeroXp(player.char, hx);
    game.heroXpGain = (game.heroXpGain || 0) + hx;
    game.heroUps = (game.heroUps || 0) + ups;
  }
  const tk = Math.floor((game.kills - game.paidKills) / 70) + (game.bossKills - (game.paidBoss || 0)) + (won ? 2 : 0);
  if (tk > 0) { const gs = gachaState(); gs.tickets = (gs.tickets || 0) + tk; game.ticketGain = (game.ticketGain || 0) + tk; }
  const earned = Math.round(((game.kills - game.paidKills) * 2 + Math.floor((game.time - game.paidTime) / 10) + (won ? 300 : 0) + (game.bossKills - (game.paidBoss || 0)) * 60) * mul * greed * (stats.tokenMul || 1));
  game.paidBoss = game.bossKills;
  game.paidKills = game.kills;
  game.paidTime = game.time;
  game.reward = earned;
  save.tokens += earned;
  if (!save.stats) save.stats = { runs: 0, kills: 0, bestLevel: 1, wins: 0, time: 0 };
  if (!game.counted) {
    game.counted = true;
    save.stats.runs++;
    if (won) save.stats.wins++;
  }
  save.stats.kills += game.kills - (game.statKills || 0);
  save.stats.time += game.time - (game.statTime || 0);
  game.statKills = game.kills;
  game.statTime = game.time;
  save.stats.bestLevel = Math.max(save.stats.bestLevel, game.level);
  metaRunEnd(won);
  saveBest();
}

function hurtPlayer(t) {
  const p = player;
  if (p.inv > 0) return;
  p.hp -= 1;
  p.inv = 2 * (stats.invMul || 1);
  sfx('hurt', { vol: 0.9 });
  sfx('maul', { vol: 0.8, rate: 0.8 });
  p.mode = 'fly';
  p.target = null;
  p.anchor = null;
  const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy) || 1;
  p.vx = dx / d * 520;
  p.vy = dy / d * 520;
  game.shake = 14;
  burst(p.x, p.y - KZ * p.z, 18, '#c0392b');
  addText('-1 ♥', p.x, p.y - KZ * p.z - 30, '#ff6b6b');
  if (p.hp <= 0 && game.revives > 0) {
    game.revives--;
    p.hp = Math.min(2, stats.maxHp);
    p.inv = 3;
    game.banner = { text: tr('Второе дыхание!'), sub: tr('Вставай, солдат!'), t: 2.2, win: true };
    for (const o of titans) if (!o.dying && Math.hypot(o.x - p.x, o.y - p.y) < 450) stunTitan(o, 2, 'flash');
    rings.push({ x: p.x, y: p.y, r: 450, life: 0.35, color: '#fff6c8' });
    sfx('levelup', { vol: 0.8 });
    return;
  }
  if (p.hp <= 0) {
    state = 'over';
    finishRun(false);
    sfx('defeat', { vol: 0.8 });
  }
}

function killTitan(t) {
  const n = nape(t);
  t.dying = 0.001;
  t.flash = 0.035;
  t.fallDir = Math.cos(t.face) >= 0 ? 1 : -1;
  t.deathKey = dir4(t.face);
  t.fallSide = Math.cos(t.face) >= 0 ? 1 : -1;
  t.state = 'dead';
  t.hand = null;
  t.held = -1;
  if (player.target === t) {
    player.mode = 'fly';
    player.target = null;
  }
  game.kills++;
  game.combo = game.time - game.lastKill < 4 ? game.combo + 1 : 1;
  if (game.combo > (game.maxCombo || 0)) game.maxCombo = game.combo;
  sfx('slash', { vol: 0.9 });
  sfx('cut', { vol: 0.8, rate: 0.85 });
  sfx('chime' + Math.min(7, game.combo - 1), { vol: 0.55, tag: 'chime' });
  sfx('thud', { x: t.x, y: t.y, delay: 0.45, vol: Math.min(1, t.H / 300) });
  sfx('hiss', { x: t.x, y: t.y, delay: 0.7, vol: 0.8 });
  game.lastKill = game.time;
  if (stats.rage && game.combo === 3 && player.hp < stats.maxHp) {
    player.hp++;
    addText(tr('ЯРОСТЬ! +1 ♥'), player.x, player.y - KZ * player.z - 60, '#ff6b4a');
  }
  if (stats.stun) {
    for (const o of titans) {
      if (o === t || o.dying || Math.hypot(o.x - t.x, o.y - t.y) > 350) continue;
      o.stun = 1.5;
      o.state = 'walk';
      o.hand = null;
      steam(o.x, o.y - KZ * o.H * 0.9, 3, 10);
    }
  }
  game.hitstop = 0.07;
  game.shake = 10;
  burst(n.x, n.y - KZ * n.z, 30, '#b3122e');
  burst(n.x, n.y - KZ * n.z, 8, '#fff2d0');
  steam(n.x, n.y - KZ * n.z, 10);
  slashes.push({ x: n.x, y: n.y - KZ * n.z, ang: t.face + Math.PI, life: 0.22 });
  splatDecal(t.x + Math.cos(t.face) * t.H * 0.55, t.y + Math.sin(t.face) * t.H * 0.3, Math.max(6, Math.round(t.Hp * 0.12)));
  addText(game.combo > 1 ? tr('КОМБО x{0}', game.combo) : tr('ЗАТЫЛОК!'), n.x, n.y - KZ * n.z - 40, game.combo > 1 ? '#ffd27a' : '#ffffff');
  if (player.target === t || game.slowT > 0) texts[texts.length - 1].big = true;
  game.healCount++;
  if (game.healCount >= stats.healEvery) {
    game.healCount = 0;
    stats.healEvery += 10;
    if (player.hp < stats.maxHp) {
      player.hp++;
      addText('+1 ♥', player.x, player.y - KZ * player.z - 50, '#7cfc9a');
    }
  }
  gainXp(Math.round((t.H / 60 + (t.aberrant ? 2 : 0) + ((KINDS[t.kind] && KINDS[t.kind].xp) || 0)) * Math.min(4, 1 + 0.2 * (game.combo - 1)) * stats.xp));
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
  choices = rollChoices(3);
  sel = 1;
  if (state !== 'levelup') sfx('levelup', { vol: 0.7 });
  state = 'levelup';
}

function rerollChoices() {
  if (state !== 'levelup' || !(game.rerolls > 0)) return;
  game.rerolls--;
  choices = rollChoices(3);
  sfx('cast', { vol: 0.5, rate: 1.3 });
}

function choose(i) {
  if (state !== 'levelup' || !choices[i]) return;
  choices[i].apply();
  sfx('confirm', { vol: 0.8 });
  pendingLevels--;
  if (pendingLevels > 0) openLevelUp();
  else state = 'play';
}

function engage() {
  const p = player;
  if (state !== 'play' || p.mode !== 'fly' || p.engageCd > 0) return;
  const inp = inputVec();
  let found = null, foundWp = null, bs = Infinity, tooLow = false, hard = false;
  for (const t of titans) {
    if (t.dying) continue;
    const wp = t.boss && !(t.boss.kneel > 0) ? bossWeak(t) : null;
    const tp = wp ? wpPos(t, wp) : t;
    const dx = tp.x - p.x, dy = tp.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d > stats.engage + (wp ? 80 : t.H * 0.2)) continue;
    if (t.boss && t.boss.harden > 0) { hard = true; continue; }
    if (!wp && p.z < reqZ(t)) { tooLow = true; continue; }
    const s = d - ((dx * inp.x + dy * inp.y) / d) * 150 - (wp ? 120 : 0);
    if (s < bs) { bs = s; found = t; foundWp = wp; }
  }
  p.wp = foundWp;
  if (!found) {
    addText(tooLow ? tr('Слишком низко! Набери высоту') : hard ? tr('Затылок затвердел — подожди!') : tr('Рядом нет титанов'), p.x, p.y - KZ * p.z - 40, tooLow ? '#ffb347' : hard ? '#9fe8ff' : '#e9e4da');
    sfx('tick', { vol: 0.6 });
    if (tooLow) p.lowT = 0.8;
    return;
  }
  p.mode = 'attack';
  p.target = found;
  sfx('rope', { vol: 0.6, tag: 'engage' });
  sfx('cast', { vol: 0.5, rate: 1.1, tag: 'engage2' });
  p.phase = 'approach';
  p.attackT = 0;
  p.ropeT = 0;
  if (p.anchor) { p.prevAnchor = p.anchor; p.prevT = 0.25; }
  p.anchor = null;
}

function updateFly(dt) {
  const p = player;
  const inp = inputVec();
  const moving = inp.x || inp.y;
  p.hookT -= dt;
  if (moving) {
    const a = p.anchor;
    const passed = a && (a.x - p.x) * inp.x + (a.y - p.y) * inp.y < 50;
    if (!a || passed || p.hookT <= 0) {
      const na = pickAnchor(inp.x, inp.y);
      if (na !== a) {
        if (a) { p.prevAnchor = a; p.prevT = 0.25; }
        p.anchor = na;
        p.ropeT = 0;
        if (na) { sfx('rope', { vol: 0.35 }); sfx('cast', { vol: 0.25, rate: 1.4, tag: 'rope2' }); }
      }
      p.hookT = na ? 0.4 : 0.15;
    }
  } else if (p.anchor) {
    p.prevAnchor = p.anchor;
    p.prevT = 0.25;
    p.anchor = null;
  }
  const fly = !!p.anchor;
  const floor = floorZ(p.x, p.y);
  const onFloor = !fly && p.z <= floor + 1;
  let sp, k;
  if (fly) { sp = stats.speed; k = 4; }
  else if (onFloor) { sp = RUN; k = moving ? 8 : 10; }
  else { sp = stats.speed * 0.7; k = moving ? 1.2 : 0.5; }
  p.vx = lerp(p.vx, inp.x * sp, 1 - Math.exp(-k * dt));
  p.vy = lerp(p.vy, inp.y * sp, 1 - Math.exp(-k * dt));
  if (fly) {
    const dx = p.anchor.x - p.x, dy = p.anchor.y - p.y, d = Math.hypot(dx, dy) || 1;
    p.vx += dx / d * 300 * dt;
    p.vy += dy / d * 300 * dt;
    p.puffT -= dt;
    if (p.puffT <= 0) {
      p.puffT = 0.03;
      sfx('gas', { vol: 0.5 });
      particles.push({ x: p.x - inp.x * 10, y: p.y - KZ * p.z + 4 - inp.y * 10, vx: -inp.x * 160 + rand(-30, 30), vy: -inp.y * 160 + rand(-30, 30), life: 0.35, max: 0.35, size: rand(1, 2.5), g: 0, kind: 'gas' });
    }
  } else if (moving && onFloor) {
    p.puffT -= dt;
    if (p.puffT <= 0) {
      p.puffT = 0.12;
      particles.push({ x: p.x, y: p.y - KZ * p.z, vx: rand(-20, 20), vy: rand(-20, -5), life: 0.4, max: 0.4, size: 1.5, g: 0, kind: 'dust' });
    }
  }
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
  const lim = p.z + 12, fz = floorZ(nx, ny);
  let climbing = false;
  if (fz <= lim) { p.x = nx; p.y = ny; }
  else if (moving) {
    climbing = true;
    p.z = Math.min(fz, p.z + 620 * dt);
    if (Math.random() < dt * 20) particles.push({ x: p.x, y: p.y - KZ * p.z + 6, vx: rand(-30, 30), vy: rand(10, 40), life: 0.35, max: 0.35, size: 1.5, g: 0, kind: 'dust' });
  }
  else if (floorZ(nx, p.y) <= lim) { p.x = nx; p.vy = 0; }
  else if (floorZ(p.x, ny) <= lim) { p.y = ny; p.vx = 0; }
  else { p.vx = 0; p.vy = 0; }
  const fl = floorZ(p.x, p.y);
  if (fly) p.z = lerp(p.z, p.anchor.z + 25, 1 - Math.exp(-3.5 * dt));
  else if (!climbing) p.z -= stats.glide * dt;
  p.z = Math.max(p.z, fl);
  if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
  if (Math.hypot(p.vx, p.vy) > 30) p.dir = Math.atan2(p.vy, p.vx);
}

function updateAttack(dt) {
  const p = player, t = p.target;
  if (!t || t.dying) {
    p.mode = 'fly';
    p.target = null;
    return;
  }
  p.attackT += dt;
  if (p.attackT > 5) {
    p.mode = 'fly';
    p.target = null;
    p.wp = null;
    return;
  }
  if (p.wp) {
    if (p.wp.cut || !t.boss || t.boss.kneel > 0) { p.mode = 'fly'; p.target = null; p.wp = null; return; }
    const w = wpPos(t, p.wp), dx = w.x - p.x, dy = w.y - p.y, d = Math.hypot(dx, dy) || 1, sp = stats.speed * 1.7;
    p.z = lerp(p.z, w.z + 16, 1 - Math.exp(-6 * dt));
    if (d < 28 && Math.abs(p.z - w.z) < 60) { cutWeakPoint(t, p.wp); return; }
    const step = Math.min(d, sp * dt);
    p.vx = dx / d * sp;
    p.vy = dy / d * sp;
    p.x += dx / d * step;
    p.y += dy / d * step;
    if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y - KZ * p.z + 4, vx: -p.vx * 0.2, vy: -p.vy * 0.2, life: 0.3, max: 0.3, size: rand(1, 2), g: 0, kind: 'gas' });
    if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
    p.dir = Math.atan2(p.vy, p.vx);
    return;
  }
  const R = orbitR(t);
  const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy) || 1;
  const nz = nape(t).z;
  if (p.phase === 'approach') {
    p.z = lerp(p.z, nz * 0.9, 1 - Math.exp(-4 * dt));
    const mx = t.x + dx / d * R - p.x, my = t.y + dy / d * R - p.y, md = Math.hypot(mx, my) || 1;
    const sp = stats.speed * 1.4;
    const step = Math.min(md, sp * dt);
    p.vx = mx / md * sp;
    p.vy = my / md * sp;
    p.x += mx / md * step;
    p.y += my / md * step;
    if (md < 14) {
      p.phase = 'orbit';
      p.ang = Math.atan2(dy, dx);
    }
  } else if (p.phase === 'orbit') {
    p.z = lerp(p.z, nz * 0.9, 1 - Math.exp(-4 * dt));
    const delta = wrapAngle(t.face + Math.PI - p.ang);
    if (Math.abs(delta) < 0.3) {
      p.phase = 'cut';
      p.cutT = 0;
    } else {
      const dir = Math.sign(delta);
      p.ang += dir * Math.min(Math.abs(delta), stats.orbit / R * dt);
      p.vx = -Math.sin(p.ang) * dir * stats.orbit;
      p.vy = Math.cos(p.ang) * dir * stats.orbit;
    }
    p.x = t.x + Math.cos(p.ang) * R;
    p.y = t.y + Math.sin(p.ang) * R;
    if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y - KZ * p.z + 4, vx: -p.vx * 0.2, vy: -p.vy * 0.2, life: 0.3, max: 0.3, size: rand(1, 2), g: 0, kind: 'gas' });
  } else {
    p.cutT += dt;
    const n = nape(t);
    const k = 1 - Math.exp(-14 * dt);
    p.x = lerp(p.x, n.x, k);
    p.y = lerp(p.y, n.y, k);
    p.z = lerp(p.z, n.z, k);
    if (p.cutT > 0.12) {
      p.vx = Math.cos(t.face) * 300;
      p.vy = Math.sin(t.face) * 300;
      p.engageCd = stats.cd;
      epicKill(t);
      if (t.boss) { bossHit(t); return; }
      if (!cutTitan(t)) return;
      if (stats.chain && game.time - p.lastChain > (stats.chainCd || 2) && state === 'play') {
        let next = null, bd = stats.engage;
        for (const o of titans) {
          if (o.dying) continue;
          const d = Math.hypot(o.x - p.x, o.y - p.y);
          if (d < bd) { bd = d; next = o; }
        }
        if (next) {
          p.wp = null;
          p.lastChain = game.time;
          p.mode = 'attack';
          p.target = next;
          p.phase = 'approach';
          p.attackT = 0;
          p.ropeT = 0;
        }
      }
    }
  }
  if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
  if (Math.hypot(p.vx, p.vy) > 30) p.dir = Math.atan2(p.vy, p.vx);
}

function updateTitans(dt) {
  const diff = difficulty();
  const p = player;
  for (const t of titans) {
    t.flash = Math.max(0, t.flash - dt);
    if (t.dying) {
      t.dying += dt;
      if (!t.landed && t.dying >= 0.6) {
        t.landed = true;
        const fx = t.x + Math.cos(t.face) * t.H * 0.45, fy = t.y + Math.sin(t.face) * t.H * 0.25;
        rings.push({ x: fx, y: fy, r: t.H * 0.55, life: 0.35, color: '#d8c8a0' });
        for (let i = 0; i < 20; i++) { const a = rand(0, TAU), sp = rand(80, 300); particles.push({ x: fx + rand(-30, 30), y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, life: 0.7, max: 0.7, size: 2, g: 0, kind: 'dust' }); }
        game.shake = Math.max(game.shake, 4 + t.H / 80);
      }
      if (t.dying > 0.6 && Math.random() < dt * 34) {
        const k = rand(0.1, 0.95);
        steam(t.x + Math.cos(t.face) * t.H * k, t.y + Math.sin(t.face) * t.H * k * KY - rand(0, 24), 1, 12);
      }
      continue;
    }
    if (t.stun > 0) {
      t.stun -= dt;
      if (t.boss) {
        t.boss.harden = Math.max(0, t.boss.harden - dt);
        if (t.boss.kneel > 0 && (t.boss.kneel -= dt) <= 0) { bossRise(t); addText(tr('Сухожилия срослись!'), t.x, t.y - KZ * t.H * 0.9, '#9fe8ff'); }
      }
      continue;
    }
    if (t.boss && updateBoss(t, dt)) continue;
    if (!t.boss && updateTitanSpecial(t, dt)) continue;
    const pd = Math.hypot(p.x - t.x, p.y - t.y);
    t.preyT -= dt;
    if (t.preyT <= 0 && t.state === 'walk') {
      t.preyT = 1;
      t.prey = null;
      if (pd > 600) {
        let bd = 450;
        for (const c of civs) {
          const d = Math.hypot(c.x - t.x, c.y - t.y);
          if (d < bd) { bd = d; t.prey = c; }
        }
      }
    }
    if (t.prey && t.prey.dead) t.prey = null;
    const tx = t.prey ? t.prey.x : p.x, ty = t.prey ? t.prey.y : p.y;
    const dx = tx - t.x, dy = ty - t.y, d = Math.hypot(dx, dy) || 1;
    const to = Math.atan2(dy, dx);
    const turn = (t.aberrant ? lerp(1.8, 3.4, diff) : lerp(0.9, 2.4, diff)) * faction.turn * (t.state === 'grab' ? 0.3 : 1);
    const speed = t.speed * (1 + diff * 0.6) * (t.prey ? 1.3 : 1) * (t.rageT > 0 ? 1.5 : 1);
    if (t.state !== 'eat') t.face += clamp(wrapAngle(to - t.face), -turn * dt, turn * dt);
    const reach = reachOf(t);
    const pto = Math.atan2(p.y - t.y, p.x - t.x);
    if (t.state === 'walk') {
      if (d > reach * (t.prey ? 0.3 : 0.6)) {
        t.x += dx / d * speed * dt;
        t.y += dy / d * speed * dt;
        const ph0 = t.phase;
        t.phase += dt * speed / t.H * 9;
        if (Math.floor(ph0 / Math.PI) !== Math.floor(t.phase / Math.PI) && t.H > 200) sfx('step', { x: t.x, y: t.y, vol: Math.min(0.8, t.H / 500), range: 1100 });
      }
      if (t.prey && d < reach * 0.6) {
        t.state = 'eat';
        t.grabT = 0;
        sfx('swing', { x: t.x, y: t.y, vol: 0.5, tag: 'eat' });
        t.held = t.prey.v;
        t.eatFrom = { x: t.prey.x, y: t.prey.y };
        t.prey.dead = true;
        t.prey = null;
      }
      if (t.aberrant) {
        t.lungeCd -= dt;
        if (t.lungeCd <= 0 && pd < 520 && pd > reach) {
          t.lunge = 0.45;
          t.lungeCd = rand(3, 5);
        }
      }
      t.grabCd -= dt;
      if (t.state === 'walk' && t.grabCd <= 0 && pd < reach && Math.abs(wrapAngle(pto - t.face)) < 0.9) {
        t.state = 'grab';
        t.grabT = 0;
        sfx('swing', { x: t.x, y: t.y, vol: 0.9 });
      }
    } else if (t.state === 'eat') {
      t.grabT += dt;
      const k = Math.min(1, t.grabT / 1.1);
      t.hand = { x: lerp(t.eatFrom.x, t.x + Math.cos(t.face) * t.H * 0.05, k), y: lerp(t.eatFrom.y, t.y + Math.sin(t.face) * t.H * 0.05, k), z: lerp(5, t.H * (t.g.headC - t.g.head * 0.4), k) };
      if (t.grabT >= 1.1 && t.held >= 0) {
        t.held = -1;
        game.lost++;
        sfx('chomp', { x: t.x, y: t.y, vol: 0.5 });
        burst(t.hand.x, t.hand.y - KZ * t.hand.z, 14, '#a32222');
        splatDecal(t.x, t.y, 6);
      }
      if (t.grabT > 1.5) {
        t.state = 'walk';
        t.hand = null;
      }
    } else if (t.state === 'grab') {
      t.grabT += dt;
      t.grabAng = t.face;
      const k = Math.min(1, t.grabT / grabWind(t));
      const r = k < 0.35 ? -reach * 0.15 * (k / 0.35) : reach * ((k - 0.35) / 0.65) ** 2;
      t.hand = { x: t.x + Math.cos(t.grabAng) * r, y: t.y + Math.sin(t.grabAng) * r, z: t.H * (0.5 + (k < 0.35 ? k * 0.4 : 0.14 - (k - 0.35) * 0.2)) };
      if (t.grabT >= grabWind(t)) {
        if (pd < reach + 10 && Math.abs(wrapAngle(pto - t.grabAng)) < 0.65) hurtPlayer(t);
        t.state = 'recover';
        t.grabT = 0;
        game.shake = Math.max(game.shake, 4);
        for (let i = 0; i < 6; i++) particles.push({ x: t.hand.x + rand(-15, 15), y: t.hand.y - KZ * t.hand.z + rand(-10, 10), vx: rand(-60, 60), vy: rand(-60, 0), life: 0.4, max: 0.4, size: 1.5, g: 200, kind: 'dust' });
      }
    } else if (t.state === 'recover') {
      t.grabT += dt;
      const k = 1 - Math.min(1, t.grabT / 0.5);
      t.hand = { x: t.x + Math.cos(t.grabAng) * reach * k, y: t.y + Math.sin(t.grabAng) * reach * k, z: t.H * 0.5 };
      if (t.grabT > 0.5) {
        t.state = 'walk';
        t.hand = null;
        t.grabCd = rand(1.5, 2.5) * (1 - diff * 0.5);
      }
    }
    if (t.lunge > 0) {
      t.lunge -= dt;
      t.x += Math.cos(t.face) * 600 * dt;
      t.y += Math.sin(t.face) * 600 * dt;
      t.phase += dt * 12;
    }
    if (!t.boss && p.target !== t && (Math.abs(t.x - p.x) > 2700 || Math.abs(t.y - p.y) > 2300)) t.gone = true;
  }
  for (let i = 0; i < titans.length; i++) {
    const a = titans[i];
    if (a.dying) continue;
    for (let j = i + 1; j < titans.length; j++) {
      const b = titans[j];
      if (b.dying) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const min = (a.H + b.H) * 0.15;
      if (d < min) {
        const push = (min - d) / 2;
        a.x -= dx / d * push;
        a.y -= dy / d * push;
        b.x += dx / d * push;
        b.y += dy / d * push;
      }
    }
  }
  titans = titans.filter(t => !t.gone && (!t.dying || t.dying < 3.2));
}

function updateLife(dt) {
  for (const c of civs) {
    let fx = 0, fy = 0, near = 450;
    for (const t of titans) {
      if (t.dying) continue;
      const d = Math.hypot(c.x - t.x, c.y - t.y);
      if (d < near) {
        near = d;
        fx = (c.x - t.x) / (d || 1);
        fy = (c.y - t.y) / (d || 1);
      }
    }
    let vx = 0, vy = 0;
    if (near < 450) {
      c.panic = 1;
      vx = fx * 130;
      vy = fy * 130;
    } else {
      c.panic = Math.max(0, c.panic - dt);
      c.wait -= dt;
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d < 8 || c.wait < -6) {
        if (c.wait < 0 && d < 8) c.wait = rand(1, 4);
        if (c.wait <= 0 || c.wait < -6) {
          c.tx = c.x + rand(-250, 250);
          c.ty = c.y + rand(-250, 250);
          c.wait = 0;
        }
      } else if (c.wait <= 0) {
        vx = dx / d * 45;
        vy = dy / d * 45;
      }
    }
    const nx = c.x + vx * dt, ny = c.y + vy * dt;
    if (Math.abs(c.x - player.x) > 2600 || Math.abs(c.y - player.y) > 2200) c.gone = true;
    if (floorZ(nx, ny) > 0) {
      if (floorZ(nx, c.y) === 0) c.x = nx;
      else if (floorZ(c.x, ny) === 0) c.y = ny;
      else { c.tx = c.x + rand(-200, 200); c.ty = c.y + rand(-200, 200); }
    } else {
      c.x = nx;
      c.y = ny;
    }
    c.moving = !!(vx || vy);
    if (vx || vy) {
      c.phase += dt * Math.hypot(vx, vy) * 0.12;
      if (Math.abs(vx) > 5) c.face = Math.sign(vx);
      c.dir = Math.atan2(vy, vx);
    }
  }
  civs = civs.filter(c => !c.dead && !c.gone);
  if (faction.civs) {
    game.civT -= dt;
    if (game.civT <= 0 && civs.length < faction.civs) {
      game.civT = 2;
      const s = freeSpot(viewW() * 0.6, true);
      if (s) spawnCiv(s.x, s.y);
    }
  }
  for (const r of riders) {
    let near = null, nd = 500;
    for (const t of titans) {
      if (t.dying) continue;
      const d = Math.hypot(r.x - t.x, r.y - t.y);
      if (d < nd) { nd = d; near = t; }
    }
    if (near) {
      const a = Math.atan2(r.y - near.y, r.x - near.x);
      r.vx = lerp(r.vx, Math.cos(a) * 240, 1 - Math.exp(-2 * dt));
      r.vy = lerp(r.vy, Math.sin(a) * 240, 1 - Math.exp(-2 * dt));
    }
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    if (Math.hypot(r.x - player.x, r.y - player.y) > 2400) r.gone = true;
    r.phase += dt * 8;
    if (Math.random() < dt * 6) particles.push({ x: r.x - Math.sign(r.vx) * 20, y: r.y, vx: rand(-20, 20), vy: rand(-25, -5), life: 0.5, max: 0.5, size: 1.5, g: 0, kind: 'dust' });
  }
  for (const f of flocks) {
    if (!f.fly) {
      let scare = Math.hypot(player.x - f.x, player.y - f.y) < 220;
      for (const t of titans) if (!t.dying && Math.hypot(t.x - f.x, t.y - f.y) < 400) scare = true;
      if (scare) {
        f.fly = true;
        const a = rand(0, Math.PI * 2);
        f.vx = Math.cos(a) * 220;
        f.vy = Math.sin(a) * 220;
        f.vz = 120;
        f.life = 8;
      }
    } else {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.z += f.vz * dt;
      f.vz = Math.max(20, f.vz - 30 * dt);
      f.life -= dt;
    }
    for (const b of f.birds) b.p += dt * (f.fly ? 14 : 2);
  }
  flocks = flocks.filter(f => f.life > 0 && Math.hypot(f.x - player.x, f.y - player.y) < 2600);
  if (riders.some(r => r.gone)) { riders = riders.filter(r => !r.gone); spawnRider(); }
  if (flocks.length < (faction.map === 'field' ? 10 : 5) && Math.random() < dt * 0.5) spawnFlock(player);
  for (const fl of flares) {
    fl.life -= dt;
    if (fl.vz > 0) {
      fl.z += fl.vz * dt;
      fl.vz -= 150 * dt;
      particles.push({ x: fl.x + rand(-3, 3), y: fl.y - KZ * fl.z, vx: rand(-10, 10), vy: rand(-10, 10), life: 1.2, max: 1.2, size: rand(2, 4), g: -5, kind: 'flare', color: fl.color });
    }
  }
  flares = flares.filter(f => f.life > 0);
  for (const e of emitters) {
    if (Math.abs(e.x - player.x) > viewW() || Math.abs(e.y - player.y) > viewH()) continue;
    e.t -= dt;
    if (e.t <= 0) {
      e.t = e.chimney ? rand(0.35, 0.7) : rand(0.12, 0.3);
      const life = rand(2, 3.5);
      particles.push({ x: e.x + rand(-6, 6), y: e.y - KZ * e.z - 6, vx: rand(5, 25), vy: rand(-50, -25), life, max: life, size: e.chimney ? rand(2, 4) : rand(3, 7), g: -6, kind: 'smoke' });
    }
  }
}

function nearestTitan(maxD) {
  let found = null, bd = maxD;
  for (const t of titans) {
    if (t.dying) continue;
    const d = Math.hypot(t.x - player.x, t.y - player.y);
    if (d < bd) { bd = d; found = t; }
  }
  return found;
}

function updateFx(dt) {
  for (const p of particles) {
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  if (particles.length > 900) particles.splice(0, particles.length - 900);
  for (const t of texts) { t.y -= 40 * dt; t.life -= dt; }
  texts = texts.filter(t => t.life > 0);
  for (const r of rings) r.life -= dt;
  rings = rings.filter(r => r.life > 0);
  for (const s of slashes) s.life -= dt;
  slashes = slashes.filter(s => s.life > 0);
  for (const d of decals) d.life -= dt;
  decals = decals.filter(d => d.life > 0);
  const ccx = cam.x + viewW() / 2, ccy = cam.y + viewH() / 2;
  for (const c of clouds) {
    c.x += c.v * dt;
    if (c.x - ccx > 2600) c.x -= 5200; else if (c.x - ccx < -2600) c.x += 5200;
    if (c.y - ccy > 2600) c.y -= 5200; else if (c.y - ccy < -2600) c.y += 5200;
  }
  player.prevT = Math.max(0, player.prevT - dt);
  player.ropeT += dt;
  player.lowT = Math.max(0, player.lowT - dt);
}

function updateCamera(dt) {
  const vw = viewW(), vh = viewH();
  const k = 1 - Math.exp(-dt * 4.2);
  const p = player, la = p.mode === 'attack' ? 0.08 : 0.22;
  cam.lx = lerp(cam.lx || 0, clamp(p.vx * la, -220, 220), 1 - Math.exp(-dt * 2.5));
  cam.ly = lerp(cam.ly || 0, clamp(p.vy * la, -160, 160), 1 - Math.exp(-dt * 2.5));
  cam.x = lerp(cam.x, p.x + cam.lx - vw / 2, k);
  cam.y = lerp(cam.y, p.y + cam.ly - KZ * p.z * 0.5 - vh / 2 - 40, k);
}

function update(dt) {
  if (state === 'play') {
    updateJuice(dt);
    if (game.hitstop > 0) { game.hitstop -= dt; return; }
    if (game.slowT > 0) { game.slowT -= dt; dt *= 0.3; }
    game.time += dt;
    if (!game.endless && game.time >= WIN_TIME) {
      state = 'win';
      finishRun(true);
      sfx('victory', { vol: 0.9 });
      return;
    }
    if (player.mode === 'attack') updateAttack(dt);
    else updateFly(dt);
    player.inv = Math.max(0, player.inv - dt);
    pushTrail();
    player.runPhase += dt * Math.hypot(player.vx, player.vy) * 0.05;
    player.engageCd = Math.max(0, player.engageCd - dt);
    updateTitans(dt);
    updateLife(dt);
    updateSkills(dt);
    bossSchedule();
    if (game.flashT > 0) game.flashT -= dt;
    if (game.banner && (game.banner.t -= dt) <= 0) game.banner = null;
    game.spawnT -= dt;
    if (game.spawnT <= 0) {
      const alive = titans.filter(t => !t.dying).length;
      const room = Math.floor(Math.min(faction.cap, faction.base + Math.floor(game.time * faction.per)) * (game.boss ? 0.6 : 1)) - alive;
      const group = 1 + Math.floor(difficulty() * (faction.group - 1) + 0.0001);
      let first = null;
      for (let i = 0; i < Math.min(room, group); i++) {
        const pos = spawnTitan(first && { x: first.x + rand(-200, 200), y: first.y + rand(-200, 200) });
        if (!first) first = pos;
        if (pos.kind === 'small') for (let k = 0, n = 2 + Math.floor(Math.random() * 3); k < n; k++) spawnTitan({ x: pos.x + rand(-170, 170), y: pos.y + rand(-170, 170) }, 'small');
      }
      if (first && (faction.map === 'field' || stats.warn)) {
        const a = Math.atan2(first.y - player.y, first.x - player.x), r = Math.min(viewW(), viewH()) * 0.42;
        fireFlare(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r + 100, '#ff4a3a');
      }
      game.spawnT = Math.max(faction.spawnMin, faction.spawn0 - game.time * faction.decay);
    }
    if (faction.map === 'field') {
      game.flareT -= dt;
      if (game.flareT <= 0) {
        game.flareT = rand(18, 30);
        const r = riders.length ? pick(riders) : player;
        fireFlare(r.x, r.y, '#5ae06a');
      }
    }
  } else if (state === 'menu') {
    updateLife(dt);
  } else if (state === 'pull') {
    pullT += dt;
  }
  menuMsgT = Math.max(0, menuMsgT - dt);
  if (state === 'play' || state === 'over' || state === 'menu' || state === 'win') {
    updateFx(dt);
    updateCamera(dt);
    worldTick(false);
  }
  game.shake = Math.max(0, game.shake - dt * 40);
}

let camA = { x: 0, y: 0 }, shk = { x: 0, y: 0 };
const sx = x => Math.round(x / ART) - camA.x + shk.x;
const sy = (y, z) => Math.round((y - KZ * z) / ART) - camA.y + shk.y;

const CLOUD_SPR = [0, 1, 2].map(i => {
  const r = makeRng(900 + i);
  const w = 260 + i * 40, h = 140 + i * 20;
  const [c, g] = makeCanvas(w, h);
  for (let k = 0; k < 5; k++) ditherBlob(g, w / 2 + r.range(-w * 0.22, w * 0.22), h / 2 + r.range(-h * 0.18, h * 0.18), Math.round(w * r.range(0.2, 0.32)), Math.round(h * r.range(0.24, 0.36)), '#000000', 0.95);
  return c;
});

const WALK_SEQ = [0, 1, 0, 2];
function walkFrame(t, dir) {
  const base = `titan_${t.set}_${t.size}_walk`;
  if (!SPR[base + '0_' + dir]) {
    const img = SPR[`titan_${t.set}_${t.size}_${dir}`];
    if (!img || t.state !== 'walk' || t.stun > 0) return null;
    const fr = proceduralWalk(img, t.set, dir);
    return fr[WALK_SEQ[Math.floor(((t.phase % TAU) + TAU) % TAU / (Math.PI / 2)) & 3]];
  }
  if (t.state === 'walk' && t.stun <= 0) {
    const i = WALK_SEQ[Math.floor(((t.phase % TAU) + TAU) % TAU / (Math.PI / 2)) & 3];
    return SPR[base + i + '_' + dir];
  }
  return SPR[base + '0_' + dir];
}

function titanImg(t, dir) {
  if (!t.boss && !t.dying && t.set) {
    let grabPose = false;
    if (t.state === 'grab') grabPose = t.grabT / grabWind(t) > 0.3;
    else if (t.state === 'recover') grabPose = t.grabT < 0.3;
    else if (t.state === 'eat') grabPose = t.grabT < 0.6;
    else if (t.state === 'stomp' || t.state === 'roar') grabPose = true;
    if (grabPose) { const g = SPR[`titan_${t.set}_${t.size}_grab_${dir}`]; if (g) return g; }
    const wf = walkFrame(t, dir);
    if (wf) return wf;
  }
  if (t.boss) return SPR['boss_' + t.boss.kind + '_' + dir] || SPR['titan_normal_200_' + dir];
  const set = t.set || (t.set = titanSet(t));
  return set ? SPR[`titan_${set}_${t.size}_${dir}`] : null;
}

function napeScreen(t, dir, img, dx, dy) {
  const n = NAPE[`${t.set}_${t.size}`] || { fx: 0.5, fy: 0.2 };
  let fx = n.fx;
  if (dir === 'left') fx = 0.62;
  else if (dir === 'right') fx = 0.38;
  return { x: dx + img.width * fx, y: dy + img.height * n.fy };
}

function drawTitanDecals(t) {
  const x = sx(t.x), y = sy(t.y, 0);
  const targeted = player.target === t;
  const dist = Math.hypot(player.x - t.x, player.y - t.y);
  if (targeted || dist < 600) {
    const R = orbitR(t) / ART, back = t.face + Math.PI;
    const ok = targeted || player.z >= reqZ(t);
    bctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let a = 0; a < TAU; a += 5 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R * 0.75), 1, 1);
    bctx.fillStyle = ok ? (targeted ? '#ffd36e' : 'rgba(255, 211, 110, 0.9)') : 'rgba(150, 140, 160, 0.7)';
    for (let a = back - 0.35; a <= back + 0.35; a += 0.8 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R) - 1, Math.round(y + Math.sin(a) * R * 0.75) - 1, 2, 2);
  }
  if (t.state === 'grab') {
    const k = Math.min(1, t.grabT / grabWind(t)), reach = reachOf(t) / ART;
    bctx.fillStyle = `rgba(229, 72, 77, ${(0.14 + 0.3 * k).toFixed(2)})`;
    bctx.beginPath();
    bctx.ellipse(x, y, reach, reach * 0.75, 0, t.grabAng - 0.65, t.grabAng + 0.65);
    bctx.lineTo(x, y);
    bctx.closePath();
    bctx.fill();
  }
}

function drawTitan(t) {
  const dir = t.dying ? t.deathKey : dir4(t.face);
  const img = titanImg(t, dir);
  if (!img) return;
  const x = sx(t.x), y = sy(t.y, 0);
  if (t.dying) {
    const k = Math.min(1, t.dying / 0.6), ang = Math.pow(k, 1.7) * Math.PI / 2 * t.fallSide;
    let alpha = 1;
    if (t.dying > 1.6) alpha = Math.max(0, Math.ceil((1 - (t.dying - 1.6) / 1.5) * 5) / 5);
    bctx.save();
    bctx.translate(x, y);
    bctx.rotate(ang);
    bctx.globalAlpha = alpha;
    bctx.drawImage(t.flash > 0 ? variant(img, 'white') : img, -Math.round(img.width / 2), -img.height);
    if (t.dying > 0.7) {
      bctx.globalAlpha = alpha * Math.min(0.55, (t.dying - 0.7) * 0.5);
      bctx.drawImage(variant(img, 'tint'), -Math.round(img.width / 2), -img.height);
    }
    bctx.restore();
    return;
  }
  const pose = titanPoseFx(t);
  const ox = pose.ox, oy = pose.oy;
  const dx = Math.round(x - img.width / 2 + ox), dy = y - img.height + oy;
  drawBoundCables(t, dx, dy, img);
  drawSprite(t.flash > 0 ? variant(img, 'white') : img, x + ox, y + oy, pose);
  if (t.rageT > 0 && Math.floor(performance.now() / 90) % 3 === 0) { bctx.globalAlpha = 0.25; drawSprite(variant(img, 'tint'), x + ox, y + oy, pose); bctx.globalAlpha = 1; }
  if (t.stun > 0) drawStunStars(dx + img.width / 2, dy - 3, t.boss ? 4 : 3);
  if (t.boss && !(t.boss.kneel > 0)) {
    const on = Math.floor(performance.now() / 160) % 2;
    for (const w of t.boss.wp) {
      if (w.cut) continue;
      const q = wpPos(t, w), qx = sx(q.x), qy = sy(q.y, q.z), tg = player.wp === w;
      const c = tg ? '#ffffff' : on ? '#ffb347' : '#ffd36e';
      for (const [a, b2] of [[0, -3], [-1, -2], [0, -2], [1, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) rect(bctx, qx + a, qy + b2 - 4, 1, 1, c);
    }
  }
  if (t.boss && t.boss.harden > 0 && dir !== 'down') {
    const n = napeScreen(t, dir, img, dx, dy), on = Math.floor(performance.now() / 120) % 2;
    for (const [ox2, oy2] of [[0, -3], [-2, 0], [0, 0], [2, 0], [0, 3], [-1, -1], [1, -1], [-1, 1], [1, 1]]) rect(bctx, n.x + ox2, n.y + oy2, 1, 1, on ? '#dff8ff' : '#7ad8f0');
  }
  if (t.held >= 0) {
    const cs = civImg(t.held, 'down');
    if (cs) {
      const hx = dx + img.width * (dir === 'left' ? 0.3 : dir === 'right' ? 0.7 : 0.5), hy = dy + img.height * 0.2;
      bctx.drawImage(cs, Math.round(hx - cs.width / 2), Math.round(hy - cs.height * 0.5));
    }
  }
  if (dir !== 'down' && (player.target === t || Math.hypot(player.x - t.x, player.y - t.y) < 460)) {
    const on = Math.floor(performance.now() / 150) % 2 === 0;
    if (player.target === t || on) {
      const n = napeScreen(t, dir, img, dx, dy), nm = Math.max(5, Math.round(img.width * 0.12));
      bctx.strokeStyle = player.target === t ? '#ffffff' : player.z >= reqZ(t) && !(t.boss && !(t.boss.kneel > 0)) ? '#ffd36e' : '#8a8296';
      bctx.lineWidth = 1;
      bctx.strokeRect(Math.round(n.x - nm / 2) + 0.5, Math.round(n.y - nm / 2) + 0.5, nm, nm);
    }
  }
}

function drawBuilding(b) {
  bctx.drawImage(b.img, sx(b.x), sy(b.y + b.d, 0) - b.img.height);
}

function drawTree(t) {
  bctx.drawImage(t.img, sx(t.x) - (t.img.width >> 1), sy(t.y, 0) - t.img.height);
}

function drawProp(p) {
  bctx.drawImage(p.img, sx(p.x) - (p.img.width >> 1), sy(p.y, 0) - p.img.height);
}

const CIV_KINDS = ['civ_man', 'civ_woman'];
function civImg(v, dir) {
  return SPR[`${CIV_KINDS[v % 2]}_${dir}`] || SPR[`${CIV_KINDS[(v + 1) % 2]}_${dir}`] || SPR[`hero_${dir}`];
}

function civRunImg(v, dir, moving, phase) {
  const kind = CIV_KINDS[v % 2];
  if (!SPR[`${kind}_run0_${dir}`]) return null;
  const i = moving ? [1, 0, 2, 0][Math.floor(phase * 1.6) & 3] : 0;
  return SPR[`${kind}_run${i}_${dir}`];
}

function drawCiv(c) {
  const dir = dir4(c.dir ?? Math.PI / 2);
  const run = civRunImg(c.v, dir, c.moving, c.phase);
  const img = run || civImg(c.v, dir);
  if (!img) return;
  const oy = c.moving ? -Math.round(Math.abs(Math.sin(c.phase * 1.6 * Math.PI / 2)) * (run ? 1 : 2)) : 0;
  const x = sx(c.x), y = sy(c.y, 0);
  bctx.drawImage(img, x - (img.width >> 1), y - img.height + oy);
  if (c.panic > 0.5 && Math.floor(performance.now() / 220 + c.phase) % 3 === 0) {
    rect(bctx, x, y - img.height - 6 + oy, 1, 3, '#ffffff');
    rect(bctx, x, y - img.height - 2 + oy, 1, 1, '#ffffff');
  }
}

function drawRider(r) {
  const img = SPR[`rider_${dir4(Math.atan2(r.vy, r.vx))}`];
  if (!img) return;
  const oy = -Math.round(Math.abs(Math.sin(r.phase * 1.4)) * 3);
  bctx.drawImage(img, sx(r.x) - (img.width >> 1), sy(r.y, 0) - img.height + oy);
}

function drawPlayer() {
  const p = player;
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) return;
  const now = performance.now() / 1000;
  const hgt = p.z - floorZ(p.x, p.y);
  const flying = hgt > 8 || p.mode === 'attack';
  let dir = dir4(p.dir);
  if (p.mode === 'attack' && p.phase === 'cut') dir = DIR_KEYS[[0, 2, 3, 1][Math.floor(now * 22) % 4]];
  let img = heroImg(p.char, dir, flying);
  const gold = save.golden && save.golden[p.char] && !(save.goldOff && save.goldOff[p.char]);
  if (!img) return;
  const running = !flying && Math.hypot(p.vx, p.vy) > 40;
  if (running) img = proceduralWalk(img, 'hero', dir)[WALK_SEQ[Math.floor(p.runPhase * 2) & 3]];
  let oy = 0;
  const o = { shear: 0, sx: 1, sy: 1 };
  if (!flying && Math.hypot(p.vx, p.vy) > 40) { oy = -Math.round(Math.abs(Math.sin(p.runPhase * Math.PI)) * 2); o.sy = 1 - Math.abs(Math.sin(p.runPhase * Math.PI)) * 0.05; }
  if (flying) { oy = Math.round(Math.sin(now * 6)); o.shear = clamp(p.vx / 1800, -0.28, 0.28); }
  if (p.mode === 'attack' && p.phase === 'cut') { o.sx = 1.15; o.sy = 1.15; }
  drawTrail();
  drawSprite(p.inv > 1.6 ? variant(img, 'white') : gold ? variant(img, 'gold') : img, sx(p.x), sy(p.y, p.z) + oy, o);
  if (gold && Math.random() < 0.3) particles.push({ x: p.x + rand(-14, 14), y: p.y - KZ * p.z - rand(4, 40), vx: rand(-10, 10), vy: rand(-30, -10), life: 0.6, max: 0.6, size: rand(1, 2.5), g: 0, kind: 'flare', color: '#ffd36e' });
}

function drawRope(a, alpha, grow) {
  const p = player;
  const x0 = sx(p.x), y0 = sy(p.y, p.z) - 18;
  let x1 = sx(a.x), y1 = sy(a.y, a.z);
  if (grow < 1) { x1 = Math.round(lerp(x0, x1, grow)); y1 = Math.round(lerp(y0, y1, grow)); }
  wire(bctx, x0, y0, x1, y1, 1 + Math.hypot(x1 - x0, y1 - y0) * 0.02, alpha);
}

function drawParticles() {
  const [stc, stg] = steamLayer, [smc, smg] = smokeLayer;
  stg.clearRect(0, 0, bw, bh);
  smg.clearRect(0, 0, bw, bh);
  let hasSteam = false, hasSmoke = false;
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    const x = sx(p.x), y = sy(p.y, 0);
    if (x < -24 || y < -24 || x > bw + 24 || y > bh + 24) continue;
    if (p.kind === 'steam' || p.kind === 'smoke') {
      const r = clamp(Math.round(p.size * (1.6 - a * 0.6)), 1, 14);
      drawPuff(p.kind === 'smoke' ? smg : stg, x, y, r, Math.min(1, a * 1.6), p.kind);
      if (p.kind === 'smoke') hasSmoke = true; else hasSteam = true;
    } else if (p.kind === 'gas') {
      drawPuff(bctx, x, y, Math.round(p.size * (1.6 - a)) + 1, a * 0.75, 'gas');
    } else if (p.kind === 'dust') {
      bctx.globalAlpha = a * 0.75;
      rect(bctx, x, y, 2, 1, '#c8b48a');
      bctx.globalAlpha = 1;
    } else if (p.kind === 'flare') {
      bctx.globalAlpha = Math.ceil(a * 3) / 3;
      rect(bctx, x, y, Math.round(p.size), Math.round(p.size), a > 0.7 ? '#ffffff' : p.color);
      bctx.globalAlpha = 1;
    } else rect(bctx, x, y, p.size, p.size, p.color);
  }
  if (hasSmoke) { bctx.globalAlpha = 0.7; bctx.drawImage(smc, 0, 0); }
  if (hasSteam) { bctx.globalAlpha = 0.7; bctx.drawImage(stc, 0, 0); }
  bctx.globalAlpha = 1;
}

function drawSlashes() {
  for (const s of slashes) {
    const k = 1 - s.life / 0.22;
    const R = s.big ? 20 + k * 12 : 13 + k * 6;
    slashArc(bctx, sx(s.x), sy(s.y, 0), R, s.ang - 1.4, s.ang - 1.4 + 2.8 * Math.min(1, 0.35 + k), 1 - k * 0.4);
  }
}

const DL = [];
let dlN = 0;
function dl(k, fn, a) {
  let e = DL[dlN];
  if (!e) e = DL[dlN] = { k: 0, fn: null, a: null };
  e.k = k; e.fn = fn; e.a = a;
  dlN++;
}

function drawWorld() {
  const now = performance.now() / 1000;
  bctx.imageSmoothingEnabled = false;
  bctx.fillStyle = '#3c6a2a';
  bctx.fillRect(0, 0, bw, bh);
  drawGround();
  for (const d of decals) {
    const x = sx(d.x), y = sy(d.y, 0);
    if (x < -40 || y < -40 || x > bw + 40 || y > bh + 40) continue;
    bctx.globalAlpha = Math.min(1, d.life / 8);
    bctx.drawImage(d.img, x - d.ox, y - d.oy);
  }
  bctx.globalAlpha = 1;
  for (const r of rings) {
    const k = r.life / 0.35, R = r.r / ART * (1.1 - k * 0.3);
    bctx.globalAlpha = Math.ceil(k * 3) / 3;
    bctx.fillStyle = r.color;
    for (let a = 0; a < TAU; a += 1.5 / R) bctx.fillRect(Math.round(sx(r.x) + Math.cos(a) * R), Math.round(sy(r.y, 0) + Math.sin(a) * R * 0.75), 2, 2);
    bctx.globalAlpha = 1;
  }
  const vw = viewW(), vh = viewH();
  const inView = (x, y, m) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - 60 && y < cam.y + vh + m;
  const [shc, shg] = shadowLayer;
  shg.clearRect(0, 0, bw, bh);
  const vis = titans.filter(t => inView(t.x, t.y, t.H + 120));
  const sh = (x, y, rx, ry) => disc(shg, x, y, rx, ry, '#000');
  for (const t of vis) if (!t.dying || t.dying < 1.5) { const L = titanShadowLift(t); sh(sx(t.x) + 2, sy(t.y, 0), Math.round(t.size * 0.17 * L), Math.max(2, Math.round(t.size * 0.045 * L))); }
  for (const c of civs) if (inView(c.x, c.y, 40)) sh(sx(c.x), sy(c.y, 0), 6, 2);
  for (const r of riders) if (inView(r.x, r.y, 60)) sh(sx(r.x), sy(r.y, 0), 13, 3);
  for (const p of props) if (inView(p.x, p.y, 40)) sh(sx(p.x) + 1, sy(p.y, 0), Math.max(3, Math.round(p.img.width * 0.38)), Math.max(1, Math.round(p.img.width * 0.1)));
  if (state !== 'menu') {
    const fz = floorZ(player.x, player.y), hgt = player.z - fz;
    sh(sx(player.x), sy(player.y, fz), Math.max(3, 8 - hgt / 50), Math.max(1, 3 - hgt / 120));
  }
  bctx.globalAlpha = 0.26;
  bctx.drawImage(shc, 0, 0);
  bctx.globalAlpha = 1;
  drawCombatGround();
  for (const t of vis) if (!t.dying) drawTitanDecals(t);
  dlN = 0;
  for (const b of buildings) if (inView(b.x + b.w / 2, b.y + b.d, 300 + b.h)) dl(b.y + b.d, drawBuilding, b);
  for (const t of trees) if (inView(t.x, t.y, 260)) dl(t.y, drawTree, t);
  for (const t of vis) dl(t.y, drawTitan, t);
  for (const c of civs) if (inView(c.x, c.y, 60)) dl(c.y, drawCiv, c);
  for (const r of riders) if (inView(r.x, r.y, 100)) dl(r.y, drawRider, r);
  for (const p of props) if (inView(p.x, p.y, 80)) dl(p.y, drawProp, p);
  for (const a of allies) dl(a.y + a.z * 0.15, drawAlly, a);
  if (state !== 'menu') dl(player.y + player.z * 0.15, drawPlayer, null);
  for (let i = 1; i < dlN; i++) {
    const e = DL[i];
    let j = i - 1;
    while (j >= 0 && DL[j].k > e.k) { DL[j + 1] = DL[j]; j--; }
    DL[j + 1] = e;
  }
  for (let i = 0; i < dlN; i++) DL[i].fn(DL[i].a);
  for (const e of emitters) {
    if (!e.fire) continue;
    const x = sx(e.x), y = sy(e.y, e.z);
    if (x < -30 || y < -30 || x > bw + 30 || y > bh + 30) continue;
    const gs = glowSprite();
    bctx.globalAlpha = 0.55;
    bctx.drawImage(gs, x - (gs.width >> 1), y + 4 - (gs.height >> 1));
    bctx.globalAlpha = 1;
    bctx.drawImage(fireFrame(Math.floor(now * 9) + (e.seed || 0)), x - 13, y - 10);
  }
  if (state !== 'menu') {
    if (player.prevAnchor && player.prevT > 0) drawRope(player.prevAnchor, player.prevT / 0.25 * 0.6, 1);
    const grow = Math.min(1, player.ropeT / 0.08);
    if (player.mode === 'fly' && player.anchor) drawRope(player.anchor, 1, grow);
    if (player.mode === 'attack' && player.target) drawRope(player.wp ? wpPos(player.target, player.wp) : nape(player.target), 1, grow);
  }
  drawOrbitTrail();
  drawParticles();
  drawCombatAir();
  drawSlashes();
  drawXSlashes();
  for (const f of flocks) {
    for (const b of f.birds) {
      const x = sx(f.x + b.ox), y = sy(f.y + b.oy, f.z);
      if (x < -6 || y < -6 || x > bw + 6 || y > bh + 6) continue;
      bctx.drawImage(BIRD[f.fly ? Math.floor(b.p) & 1 : (Math.floor(b.p) % 5 === 0 ? 0 : 1)], x - 3, y - 2);
    }
  }
  bctx.globalAlpha = 0.08;
  for (const c of clouds) {
    const s = CLOUD_SPR[c.s], x = sx(c.x) - s.width / 2, y = sy(c.y, 0) - s.height / 2;
    if (x + s.width < 0 || x > bw || y + s.height < 0 || y > bh) continue;
    bctx.drawImage(s, Math.round(x), Math.round(y));
  }
  bctx.globalAlpha = 1;
  for (const m of motes) {
    let x, y;
    if (faction.map === 'ruins') {
      x = ((m.x * bw + Math.sin(now * 0.6 + m.p) * 10 + now * m.v * 1.5) % bw + bw) % bw;
      y = ((m.y * bh + now * m.v * 4) % bh + bh) % bh;
      bctx.fillStyle = m.p < 1.4 ? '#f08a3a' : 'rgba(190, 184, 176, 0.8)';
    } else {
      x = ((m.x * bw + now * m.v) % bw + bw) % bw;
      y = ((m.y * bh + Math.sin(now * 0.7 + m.p) * 6 - now * m.v * 0.4) % bh + bh) % bh;
      bctx.fillStyle = 'rgba(255, 250, 220, 0.75)';
    }
    bctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

function fmtTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

function font(size, weight = 700) {
  return `${weight} ${size}px ${FONT}`;
}

function shadowText(text, x, y, color = '#fff') {
  ctx.fillStyle = 'rgba(6, 4, 8, 0.9)';
  ctx.fillText(text, x + UP, y + UP);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawWorldTexts() {
  ctx.textAlign = 'center';
  const zt = zoomTransform();
  for (const t of texts) {
    const age = 1.1 - t.life, big = t.big ? 1.5 : 1;
    const pop = age < 0.12 ? 1.7 - age / 0.12 * 0.7 : 1;
    ctx.font = font(Math.round(UP * 7 * big * pop));
    ctx.globalAlpha = Math.min(1, t.life * 2);
    let x = (sx(t.x) - camFrac.x) * PX, y = (sy(t.y, 0) - camFrac.y) * PX;
    if (zt) { x = (x - zt.fx) * zt.z + zt.fx; y = (y - zt.fy) * zt.z + zt.fy; }
    shadowText(t.text, x, y, t.color);
  }
  ctx.globalAlpha = 1;
}

function panel(x, y, w, h, fill = '#1e1a2b', edge = '#e9e4da') {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - UP, y - UP, w + UP * 2, h + UP * 2);
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + UP, y + UP, w - UP * 2, h - UP * 2);
}

function drawHud() {
  ctx.textBaseline = 'alphabetic';
  const hs = UP * 2;
  for (let i = 0; i < stats.maxHp; i++) ctx.drawImage(i < player.hp ? HEART : HEART_EMPTY, 12 + i * (HEART.width * hs + UP * 2), 12, HEART.width * hs, HEART.height * hs);
  const hero = charById(player.char);
  ctx.textAlign = 'left';
  ctx.font = font(UP * 5);
  shadowText(hero.name, 14 + stats.maxHp * (HEART.width * hs + UP * 2), 12 + UP * 9, RARITY[hero.rarity].color);

  const gx = 14, gy = 12 + HEART.height * hs + UP * 10, gw = UP * 5, gh = UP * 60;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(gx - UP, gy - UP, gw + UP * 2, gh + UP * 2);
  ctx.fillStyle = '#2d2838';
  ctx.fillRect(gx, gy, gw, gh);
  const fill = Math.round(clamp(player.z / MAXZ, 0, 1) * gh / UP) * UP;
  ctx.fillStyle = player.lowT > 0 && Math.floor(player.lowT * 10) % 2 ? '#ff6b6b' : '#8fd3ff';
  ctx.fillRect(gx, gy + gh - fill, gw, fill);
  ctx.fillStyle = '#d6f0ff';
  ctx.fillRect(gx, gy + gh - fill, UP, fill);
  const nt = nearestTitan(stats.engage + 200);
  if (nt) {
    const ry = gy + gh - Math.round(clamp(reqZ(nt) / MAXZ, 0, 1) * gh / UP) * UP;
    ctx.fillStyle = player.z >= reqZ(nt) ? '#7cfc9a' : '#ff6b6b';
    ctx.fillRect(gx - UP * 2, ry - UP, gw + UP * 4, UP * 2);
  }
  ctx.save();
  ctx.translate(gx + gw + UP * 5, gy + gh);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.font = font(UP * 5);
  shadowText('ВЫСОТА', 0, 0, '#cfe3f0');
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = font(UP * 11);
  shadowText(game.endless ? fmtTime(game.time) : `${fmtTime(game.time)} / ${fmtTime(WIN_TIME)}`, W / 2, 14 + UP * 9);
  ctx.font = font(UP * 6, 400);
  shadowText(`Титанов убито: ${game.kills}`, W / 2, 20 + UP * 16);
  if (faction.civs) {
    ctx.textAlign = 'right';
    shadowText(`Горожан погибло: ${game.lost}`, W - 14, 14 + UP * 6, game.lost ? '#ff9a8a' : '#e9e4da');
    ctx.textAlign = 'center';
  }
  if (game.combo > 1 && game.time - game.lastKill < 4) {
    ctx.font = font(UP * 10);
    shadowText(`КОМБО x${game.combo}`, W / 2, 26 + UP * 27, '#ffd27a');
  }
  if (game.time < 16) {
    ctx.font = font(UP * 6, 400);
    shadowText('WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака', W / 2, H - UP * 12, '#e9e4da');
  }

  const bh2 = UP * 3;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(0, H - bh2 - UP, W, bh2 + UP);
  ctx.fillStyle = '#2d3a2f';
  ctx.fillRect(0, H - bh2, W, bh2);
  ctx.fillStyle = '#7fd18b';
  ctx.fillRect(0, H - bh2, Math.round(W * game.xp / game.need / UP) * UP, bh2);
  ctx.fillStyle = '#b8f0c0';
  ctx.fillRect(0, H - bh2, Math.round(W * game.xp / game.need / UP) * UP, UP);
  ctx.textAlign = 'left';
  ctx.font = font(UP * 6);
  shadowText(`УР. ${game.level}`, 12, H - bh2 - UP * 3);

  const cx = W / 2, cy = H / 2;
  for (const t of titans) {
    if (t.dying) continue;
    const tx = sx(t.x) * PX, ty = sy(t.y, t.H * 0.5) * PX;
    if (tx > 0 && tx < W && ty > 0 && ty < H) continue;
    const dx = tx - cx, dy = ty - cy;
    const k = Math.min((W / 2 - 20) / Math.abs(dx || 1), (H / 2 - 20) / Math.abs(dy || 1));
    const ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), s = UP * 3 + t.H / 60 * UP;
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * (s + UP), ey + Math.sin(a) * (s + UP));
    ctx.lineTo(ex + Math.cos(a + 2.4) * (s + UP), ey + Math.sin(a + 2.4) * (s + UP));
    ctx.lineTo(ex + Math.cos(a - 2.4) * (s + UP), ey + Math.sin(a - 2.4) * (s + UP));
    ctx.fill();
    ctx.fillStyle = t.kind === 'giant' ? '#c58cff' : t.aberrant || t.kind === 'crawler' ? '#ffb347' : '#e5484d';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * s, ey + Math.sin(a) * s);
    ctx.lineTo(ex + Math.cos(a + 2.4) * s, ey + Math.sin(a + 2.4) * s);
    ctx.lineTo(ex + Math.cos(a - 2.4) * s, ey + Math.sin(a - 2.4) * s);
    ctx.fill();
  }
}

function dim(a = 0.72) {
  ctx.fillStyle = `rgba(8, 6, 10, ${a})`;
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

function cardRects(h = UP * 58) {
  const cw = Math.min(UP * 95, (W - 80) / 3), gap = UP * 7;
  const x0 = (W - (cw * 3 + gap * 2)) / 2, y0 = H / 2 - h / 2 + UP * 8;
  return [0, 1, 2].map(i => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h }));
}

function pointIn(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

const TABS = ['Бой', 'Отряд', 'Призыв'];

function tabRects() {
  const tw = UP * 40, gap = UP * 4, x0 = W / 2 - (tw * 3 + gap * 2) / 2, y = H * 0.17 + UP * 20;
  return TABS.map((_, i) => ({ x: x0 + i * (tw + gap), y, w: tw, h: UP * 11 }));
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

const shadowCache = {};
function lockedPortrait(id) {
  if (!shadowCache[id]) {
    const img = portrait(id);
    const [c, g] = makeCanvas(img.width, img.height);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#2a2436';
    g.fillRect(0, 0, c.width, c.height);
    shadowCache[id] = c;
  }
  return shadowCache[id];
}

function drawPortrait(id, x, y, size, locked) {
  const img = portrait(id);
  if (locked) {
    ctx.drawImage(lockedPortrait(id), x, y, size, size);
    ctx.textAlign = 'center';
    ctx.font = font(size * 0.45);
    ctx.fillStyle = '#5a5268';
    ctx.fillText('?', x + size / 2, y + size * 0.68);
  } else ctx.drawImage(img, x, y, size, size);
}

function drawMenu() {
  dim(0.62);
  ctx.textAlign = 'center';
  ctx.font = font(Math.min(UP * 22, W / 11));
  shadowText('АТАКА ТИТАНОВ', W / 2, H * 0.15, '#c0262e');
  ctx.font = font(UP * 8);
  shadowText('S U R V I V O R S', W / 2, H * 0.15 + UP * 11, '#a8a49c');
  tabRects().forEach((r, i) => {
    const on = i === menuTab;
    panel(r.x, r.y, r.w, r.h, on ? '#3a3350' : '#1a1724', on ? '#ffd27a' : '#6a6276');
    ctx.font = font(UP * 6);
    ctx.fillStyle = on ? '#ffd27a' : '#cfd6dc';
    ctx.fillText(TABS[i], r.x + r.w / 2, r.y + UP * 7.5);
  });
  ctx.font = font(UP * 5, 400);
  shadowText('Tab / Q / E — вкладки', W / 2, tabRects()[0].y + UP * 18, 'rgba(255,255,255,0.55)');
  if (menuTab === 0) drawBattleTab();
  else if (menuTab === 1) drawSquadTab();
  else drawGachaTab();
  ctx.textAlign = 'left';
  ctx.font = font(UP * 7);
  shadowText(`Жетоны: ${save.tokens}`, 16, H - UP * 6, '#ffd27a');
  const hero = charById(save.selected);
  ctx.textAlign = 'right';
  shadowText(`${hero.name} ${stars(save.chars[hero.id] || 1)}`, W - 16, H - UP * 6, RARITY[hero.rarity].color);
  if (resetQueued) {
    ctx.textAlign = 'center';
    ctx.font = font(UP * 9);
    shadowText(tr('Строим карту…'), W / 2, H / 2 + UP * 4, '#ffd27a');
  }
  if (menuMsgT > 0) {
    ctx.textAlign = 'center';
    ctx.font = font(UP * 7);
    shadowText(menuMsg, W / 2, H - UP * 18, '#ffffff');
  }
}

function drawBattleTab() {
  const rects = cardRects(UP * 82);
  rects.forEach((r, i) => {
    const f = FACTIONS[i], on = i === factionSel;
    const y = r.y - (on ? UP * 3 : 0);
    panel(r.x, y, r.w, r.h, on ? '#2a2638' : '#1a1724', on ? f.color : '#6a6276');
    const em = EMBLEMS[f.id], es = UP * 3;
    ctx.drawImage(em, r.x + r.w / 2 - em.width * es / 2, y + UP * 6, em.width * es, em.height * es);
    ctx.textAlign = 'center';
    ctx.font = font(UP * 7);
    ctx.fillStyle = '#fff';
    ctx.fillText(f.name, r.x + r.w / 2, y + UP * 50);
    ctx.font = font(UP * 6);
    ctx.fillStyle = f.color;
    ctx.fillText(`${f.diff} · жетоны x${[1, 1.5, 2][i]}`, r.x + r.w / 2, y + UP * 58);
    ctx.font = font(UP * 4.5, 400);
    ctx.fillStyle = '#cfd6dc';
    wrap(f.desc, r.w - UP * 10).forEach((l, j) => ctx.fillText(l, r.x + r.w / 2, y + UP * 66 + j * UP * 6));
    const b = bestOf(f);
    if (b > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(`Рекорд: ${fmtTime(b)}`, r.x + r.w / 2, y + r.h - UP * 3);
    }
  });
  const yb = rects[0].y + rects[0].h + UP * 12;
  ctx.textAlign = 'center';
  ctx.font = font(UP * 5, 400);
  shadowText('WASD — летишь на тросах, они поднимают тебя на крыши и деревья. С высоты — Пробел: атака', W / 2, yb, '#e9e4da');
  ctx.font = font(UP * 8);
  if (Math.floor(performance.now() / 500) % 2 === 0) shadowText('← → выбрать, Enter — в бой', W / 2, yb + UP * 14, '#7cfc9a');
}

function squadRects() {
  const size = Math.min(UP * 44, (W - 80) / 5.5), gap = UP * 4, cols = 5;
  const total = cols * size + (cols - 1) * gap, x0 = W / 2 - total / 2, y0 = tabRects()[0].y + UP * 26;
  return CHARS.map((_, i) => ({ x: x0 + (i % cols) * (size + gap), y: y0 + Math.floor(i / cols) * (size + gap + UP * 12), w: size, h: size + UP * 10 }));
}

function drawSquadTab() {
  const rects = squadRects();
  rects.forEach((r, i) => {
    const c = CHARS[i], owned = save.chars[c.id], on = i === squadSel, chosen = save.selected === c.id;
    panel(r.x, r.y, r.w, r.h, on ? '#2f2a40' : '#1a1724', chosen ? '#7cfc9a' : on ? RARITY[c.rarity].color : '#4a4458');
    drawPortrait(c.id, r.x + UP * 3, r.y + UP * 2, r.w - UP * 6, !owned);
    ctx.textAlign = 'center';
    ctx.font = font(UP * 5);
    ctx.fillStyle = owned ? '#fff' : '#6a6276';
    ctx.fillText(owned ? c.name : '???', r.x + r.w / 2, r.y + r.h - UP * 6);
    ctx.font = font(UP * 4, 400);
    ctx.fillStyle = RARITY[c.rarity].color;
    ctx.fillText(owned ? stars(owned) : RARITY[c.rarity].name, r.x + r.w / 2, r.y + r.h - UP * 1.5);
  });
  const c = CHARS[squadSel], owned = save.chars[c.id];
  const last = rects[rects.length - 1];
  const y = last.y + last.h + UP * 12;
  ctx.textAlign = 'center';
  ctx.font = font(UP * 8);
  shadowText(owned ? c.name : 'Не открыт', W / 2, y, owned ? RARITY[c.rarity].color : '#8a8296');
  ctx.font = font(UP * 5.5, 400);
  shadowText(owned ? c.ability : `${RARITY[c.rarity].name} — можно получить во вкладке «Призыв»`, W / 2, y + UP * 9, '#e9e4da');
  ctx.font = font(UP * 5, 400);
  shadowText('Стрелки — выбрать, Enter — взять в бой.   C — скопировать код сохранения, V — вставить код', W / 2, y + UP * 20, 'rgba(255,255,255,0.6)');
}

function drawGachaTab() {
  const pw = Math.min(W - 60, UP * 270), ph = UP * 96, x = W / 2 - pw / 2, y = tabRects()[0].y + UP * 26;
  panel(x, y, pw, ph, '#221d30', '#ffd36e');
  const g = ctx.createLinearGradient(x, y, x, y + ph);
  g.addColorStop(0, 'rgba(255, 207, 58, 0.18)');
  g.addColorStop(1, 'rgba(162, 74, 255, 0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x + UP, y + UP, pw - UP * 2, ph - UP * 2);
  const ps = Math.min(UP * 34, (pw - UP * 170) / 2 - UP * 6);
  drawPortrait('mikasa', x + UP * 5, y + ph / 2 - ps / 2, ps, false);
  drawPortrait('levi', x + pw - UP * 5 - ps, y + ph / 2 - ps / 2, ps, false);
  ctx.textAlign = 'center';
  ctx.font = font(UP * 10);
  shadowText('ПРИЗЫВ РАЗВЕДЧИКОВ', W / 2, y + UP * 16, '#ffd36e');
  ctx.font = font(UP * 5.5, 400);
  shadowText('Сигнальная ракета покажет, кто откликнулся', W / 2, y + UP * 25, '#e9e4da');
  shadowText('★★★★★ 4%   ★★★★ 21%   ★★★ 75%', W / 2, y + UP * 36, '#cfd6dc');
  shadowText(`Эпический гарантирован через ${Math.max(1, 10 - save.pity4)}, легендарный — через ${Math.max(1, 40 - save.pity5)}`, W / 2, y + UP * 45, '#c58cff');
  shadowText('Повтор даёт звезду (+3% скорости), на 5★ — жетоны', W / 2, y + UP * 54, 'rgba(255,255,255,0.6)');
  const bw2 = UP * 70, bh2 = UP * 16, by = y + UP * 66;
  const can1 = save.tokens >= 100, can10 = save.tokens >= 900;
  panel(W / 2 - bw2 - UP * 4, by, bw2, bh2, can1 ? '#2f4a3a' : '#2a2630', can1 ? '#7cfc9a' : '#5a5268');
  panel(W / 2 + UP * 4, by, bw2, bh2, can10 ? '#4a3a20' : '#2a2630', can10 ? '#ffd36e' : '#5a5268');
  ctx.font = font(UP * 6);
  ctx.fillStyle = can1 ? '#fff' : '#6a6276';
  ctx.fillText('[1] Один — 100', W / 2 - bw2 / 2 - UP * 4, by + UP * 10);
  ctx.fillStyle = can10 ? '#fff' : '#6a6276';
  ctx.fillText('[0] Десять — 900', W / 2 + bw2 / 2 + UP * 4, by + UP * 10);
  ctx.font = font(UP * 5, 400);
  shadowText('Жетоны дают за каждый забег: за убийства, время и победу', W / 2, y + ph + UP * 10, 'rgba(255,255,255,0.6)');
}

function rollRarity() {
  save.pity5++;
  save.pity4++;
  if (save.pity5 >= 40) return 5;
  const r = Math.random();
  if (r < 0.04) return 5;
  if (save.pity4 >= 10 || r < 0.25) return 4;
  return 3;
}

function pull(n) {
  const cost = n === 10 ? 900 : 100;
  if (save.tokens < cost) {
    menuMsg = 'Не хватает жетонов — сыграй забег';
    menuMsgT = 2;
    return;
  }
  save.tokens -= cost;
  pullRes = [];
  for (let i = 0; i < n; i++) {
    const r = rollRarity();
    if (r === 5) save.pity5 = 0;
    if (r >= 4) save.pity4 = 0;
    const c = pick(CHARS.filter(x => x.rarity === r && x.id !== 'cadet'));
    const had = save.chars[c.id] || 0;
    if (had >= 5) save.tokens += 20 * r;
    save.chars[c.id] = Math.min(5, had + 1);
    pullRes.push({ c, isNew: !had, stars: save.chars[c.id], refund: had >= 5 ? 20 * r : 0 });
  }
  save.pulls += n;
  dailyProgress('pull', n);
  persist();
  pullIdx = 0;
  pullT = 0;
  state = 'pull';
}

function nextPull() {
  if (pullIdx < pullRes.length && pullT < 0.9) { pullT = 0.9; return; }
  pullIdx++;
  pullT = 0;
  if (pullIdx > pullRes.length || (pullIdx === pullRes.length && pullRes.length === 1)) {
    state = 'menu';
    menuTab = 2;
  }
}

function drawPull() {
  ctx.fillStyle = '#0e0b16';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  if (pullIdx >= pullRes.length) {
    ctx.font = font(UP * 10);
    shadowText('ИТОГИ ПРИЗЫВА', W / 2, H * 0.14, '#ffd36e');
    const size = Math.min(UP * 34, (W - 80) / 5.8), gap = UP * 4;
    pullRes.forEach((r, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = W / 2 - (5 * size + 4 * gap) / 2 + col * (size + gap), y = H * 0.22 + row * (size + UP * 22);
      panel(x, y, size, size + UP * 12, '#1a1724', RARITY[r.c.rarity].color);
      drawPortrait(r.c.id, x + UP * 2, y + UP * 2, size - UP * 4, false);
      ctx.font = font(UP * 4.5);
      ctx.fillStyle = '#fff';
      ctx.fillText(r.c.name, x + size / 2, y + size + UP * 4);
      ctx.fillStyle = r.isNew ? '#7cfc9a' : RARITY[r.c.rarity].color;
      ctx.fillText(r.isNew ? 'НОВЫЙ!' : r.refund ? `+${r.refund} жет.` : stars(r.stars), x + size / 2, y + size + UP * 10);
    });
    ctx.font = font(UP * 7);
    if (Math.floor(performance.now() / 500) % 2 === 0) shadowText('Enter — назад', W / 2, H - UP * 14, '#7cfc9a');
    return;
  }
  const r = pullRes[pullIdx], rar = RARITY[r.c.rarity];
  const k = Math.min(1, pullT / 0.9);
  if (pullT < 0.9) {
    const fx = W / 2, fy = H * (0.95 - 0.6 * (1 - (1 - k) * (1 - k)));
    for (let i = 0; i < 26; i++) {
      const t = i / 26;
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.fillStyle = i % 3 ? rar.flare : '#ffffff';
      const s = Math.max(UP, Math.round((1 - t) * UP * 3));
      ctx.fillRect(Math.round(fx + Math.sin(i * 1.7) * UP * t * 3), Math.round(fy + t * H * 0.35), s, s);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx - UP * 2, fy - UP * 2, UP * 4, UP * 4);
  } else {
    const t = pullT - 0.9;
    if (t < 0.25) {
      ctx.globalAlpha = 1 - t / 0.25;
      ctx.fillStyle = rar.flare;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.45);
    g.addColorStop(0, rar.flare + '66');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const size = Math.min(H * 0.42, UP * 100);
    const pop = Math.min(1, t / 0.18);
    const sz = size * (0.7 + 0.3 * pop);
    drawPortrait(r.c.id, W / 2 - sz / 2, H * 0.42 - sz / 2, sz, false);
    ctx.font = font(UP * 12);
    shadowText(r.c.name.toUpperCase(), W / 2, H * 0.42 + size / 2 + UP * 16, rar.color);
    ctx.font = font(UP * 7);
    shadowText(`${rar.name} ${stars(r.stars)}`, W / 2, H * 0.42 + size / 2 + UP * 27, rar.color);
    ctx.font = font(UP * 6, 400);
    shadowText(r.isNew ? 'НОВЫЙ БОЕЦ! ' + r.c.ability : r.refund ? `Уже 5★ — возвращено ${r.refund} жетонов` : 'Повтор: +1 звезда', W / 2, H * 0.42 + size / 2 + UP * 37, r.isNew ? '#7cfc9a' : '#e9e4da');
    ctx.font = font(UP * 6);
    if (Math.floor(performance.now() / 500) % 2 === 0) shadowText(`Enter — дальше (${pullIdx + 1}/${pullRes.length})`, W / 2, H - UP * 10, 'rgba(255,255,255,0.7)');
  }
}

function drawLevelUp() {
  dim(0.6);
  ctx.textAlign = 'center';
  ctx.font = font(UP * 14);
  shadowText(`УРОВЕНЬ ${game.level - pendingLevels + 1}!`, W / 2, H / 2 - UP * 42, '#7cfc9a');
  ctx.font = font(UP * 6, 400);
  shadowText('← → выбрать, Enter — взять (или 1 / 2 / 3)', W / 2, H / 2 - UP * 31, '#e9e4da');
  cardRects().forEach((r, i) => {
    const c = choices[i];
    const on = i === sel;
    panel(r.x, r.y - (on ? UP * 2 : 0), r.w, r.h, on ? '#2f4a3a' : '#1e1a2b', on ? '#7cfc9a' : '#8a8296');
    const y = r.y - (on ? UP * 2 : 0);
    ctx.font = font(UP * 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(String(i + 1), r.x + r.w / 2, y + UP * 10);
    ctx.font = font(UP * 7);
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, r.x + r.w / 2, y + UP * 22);
    ctx.font = font(UP * 5, 400);
    ctx.fillStyle = '#cfd6dc';
    wrap(c.desc(stats), r.w - UP * 10).forEach((l, j) => ctx.fillText(l, r.x + r.w / 2, y + UP * 34 + j * UP * 7));
  });
}

function drawOver() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = font(UP * 22);
  shadowText('ТЫ ПАЛ', W / 2, H * 0.32, '#e5484d');
  ctx.font = font(UP * 6, 400);
  shadowText(`${faction.name} · отдай своё сердце…`, W / 2, H * 0.32 + UP * 13, 'rgba(255,255,255,0.7)');
  ctx.font = font(UP * 8);
  shadowText(`Продержался: ${fmtTime(game.time)}   Титанов: ${game.kills}   Уровень: ${game.level}`, W / 2, H * 0.48);
  ctx.font = font(UP * 6, 400);
  shadowText(`Рекорд: ${fmtTime(bestOf(faction))}`, W / 2, H * 0.48 + UP * 12, 'rgba(255,255,255,0.7)');
  ctx.font = font(UP * 8);
  shadowText(`+${game.reward} жетонов`, W / 2, H * 0.48 + UP * 22, '#ffd27a');
  ctx.font = font(UP * 8);
  shadowText('Enter — ещё раз   Esc — выбор фракции', W / 2, H * 0.48 + UP * 32, '#7cfc9a');
}

function drawWin() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = font(UP * 22);
  shadowText(faction.map === 'field' ? 'ВЫЛАЗКА УДАЛАСЬ!' : 'ГОРОД ОТБИТ!', W / 2, H * 0.32, '#7cfc9a');
  ctx.font = font(UP * 6, 400);
  shadowText(`${faction.name} гордится тобой`, W / 2, H * 0.32 + UP * 13, 'rgba(255,255,255,0.7)');
  ctx.font = font(UP * 8);
  shadowText(`Титанов: ${game.kills}   Уровень: ${game.level}${faction.civs ? `   Горожан погибло: ${game.lost}` : ''}`, W / 2, H * 0.48);
  shadowText(`+${game.reward} жетонов`, W / 2, H * 0.48 + UP * 11, '#ffd27a');
  shadowText('Enter — играть дальше без конца', W / 2, H * 0.48 + UP * 24, '#7cfc9a');
  ctx.font = font(UP * 6, 400);
  shadowText('R — новая игра   Esc — выбор фракции', W / 2, H * 0.48 + UP * 36, '#e9e4da');
}


const camFrac = { x: 0, y: 0 };
function render() {
  camA.x = Math.floor(cam.x / ART);
  camA.y = Math.floor(cam.y / ART);
  camFrac.x = cam.x / ART - camA.x;
  camFrac.y = cam.y / ART - camA.y;
  const shakeOn = !save.settings || save.settings.shake !== false;
  const tt = performance.now() / 1000;
  shk.x = game.shake && shakeOn ? Math.round((Math.sin(tt * 61) * 0.7 + Math.sin(tt * 37 + 1) * 0.3) * game.shake / ART) : 0;
  shk.y = game.shake && shakeOn ? Math.round((Math.sin(tt * 53 + 2) * 0.7 + Math.sin(tt * 29) * 0.3) * game.shake / ART) : 0;
  bctx.imageSmoothingEnabled = false;
  drawWorld();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const zt = zoomTransform();
  if (zt) {
    const ox = -camFrac.x * PX, oy = -camFrac.y * PX;
    ctx.drawImage(buf, Math.round((ox - zt.fx) * zt.z + zt.fx), Math.round((oy - zt.fy) * zt.z + zt.fy), Math.round(bw * PX * zt.z), Math.round(bh * PX * zt.z));
  } else ctx.drawImage(buf, -Math.round(camFrac.x * PX), -Math.round(camFrac.y * PX), bw * PX, bh * PX);
  drawWorldTexts();
  if (state === 'play' || state === 'levelup') drawArrows();
  if (game.flashT > 0) {
    ctx.fillStyle = `rgba(255, 250, 230, ${Math.min(0.6, game.flashT * 5)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawArrows() {
  const cx = W / 2, cy = H / 2;
  for (const t of titans) {
    if (t.dying) continue;
    const tx = sx(t.x) * PX, ty = sy(t.y, t.H * 0.5) * PX;
    if (tx > 0 && tx < W && ty > 0 && ty < H) continue;
    const dx = tx - cx, dy = ty - cy;
    const k = Math.min((W / 2 - 24) / Math.abs(dx || 1), (H / 2 - 24) / Math.abs(dy || 1));
    const ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), s = 10 + t.H / 60 * 2;
    ctx.fillStyle = '#2a1206';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * (s + 3), ey + Math.sin(a) * (s + 3));
    ctx.lineTo(ex + Math.cos(a + 2.4) * (s + 3), ey + Math.sin(a + 2.4) * (s + 3));
    ctx.lineTo(ex + Math.cos(a - 2.4) * (s + 3), ey + Math.sin(a - 2.4) * (s + 3));
    ctx.fill();
    ctx.fillStyle = t.kind === 'giant' ? '#c58cff' : t.aberrant || t.kind === 'crawler' ? '#ffb347' : '#e5484d';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * s, ey + Math.sin(a) * s);
    ctx.lineTo(ex + Math.cos(a + 2.4) * s, ey + Math.sin(a + 2.4) * s);
    ctx.lineTo(ex + Math.cos(a - 2.4) * s, ey + Math.sin(a - 2.4) * s);
    ctx.fill();
  }
}

function toMenu() {
  state = 'menu';
  reset();
}

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyM' && state !== 'menu' && state !== 'pull' && typeof UI !== 'undefined') { UI.key(e); return; }
  if ((state === 'menu' || state === 'pull') && typeof UI !== 'undefined' && UI.key(e)) return;
  const confirm = e.code === 'Enter' || e.code === 'Space';
  if (state === 'pull') {
    if (confirm) nextPull();
    if (e.code === 'Escape') { pullIdx = pullRes.length; pullT = 0; if (pullRes.length === 1) { state = 'menu'; menuTab = 2; } }
    return;
  }
  if (state === 'menu') {
    if (e.code === 'Tab' || e.code === 'KeyE') { e.preventDefault(); menuTab = (menuTab + 1) % 3; return; }
    if (e.code === 'KeyQ') { menuTab = (menuTab + 2) % 3; return; }
    if (menuTab === 0) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { factionSel = (factionSel + 2) % 3; requestReset(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { factionSel = (factionSel + 1) % 3; requestReset(); }
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) { factionSel = +e.code.slice(5) - 1; requestReset(); }
      if (confirm) start();
    } else if (menuTab === 1) {
      const n = CHARS.length;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') squadSel = (squadSel + n - 1) % n;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') squadSel = (squadSel + 1) % n;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') squadSel = (squadSel + n - 5) % n;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') squadSel = Math.min(n - 1, squadSel + 5);
      if (confirm) {
        const c = CHARS[squadSel];
        if (save.chars[c.id]) {
          save.selected = c.id;
          persist();
          menuMsg = `${c.name} идёт в бой`;
        } else menuMsg = 'Этот боец ещё не открыт';
        menuMsgT = 2;
      }
      if (e.code === 'KeyC') {
        const code = exportCode();
        const fallback = () => prompt('Код сохранения — скопируй и сохрани:', code);
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => { menuMsg = 'Код сохранения скопирован в буфер'; menuMsgT = 3; }, fallback);
        else fallback();
      }
      if (e.code === 'KeyV') {
        const code = prompt('Вставь код сохранения:');
        if (code) {
          const ok = importCode(code);
          menuMsg = ok ? 'Сохранение загружено' : 'Код не подходит';
          menuMsgT = 3;
          if (ok) { factionSel = clamp(save.faction || 0, 0, 2); reset(); }
        }
        for (const k in keys) keys[k] = false;
      }
    } else {
      if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') pull(1);
      if (e.code === 'Digit0') pull(10);
    }
    return;
  }
  if (state === 'over') {
    if (confirm || e.code === 'KeyR') return start();
    if (e.code === 'Escape') return toMenu();
    return;
  }
  if (state === 'win') {
    if (e.code === 'KeyR') return start();
    if (e.code === 'Escape') return toMenu();
    if (e.code === 'Enter') {
      game.endless = true;
      state = 'play';
    }
    return;
  }
  if (state === 'levelup') {
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) return choose(+e.code.slice(5) - 1);
    if (e.code === 'KeyR') return rerollChoices();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') sel = (sel + 2) % 3;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') sel = (sel + 1) % 3;
    if (confirm) choose(sel);
    return;
  }
  if (state === 'paused' && e.code === 'KeyQ') return toMenu();
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (state === 'play') state = 'paused';
    else if (state === 'paused') state = 'play';
    return;
  }
  if (state === 'play' && e.code === 'Space') engage();
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
  if (state === 'pull') return nextPull();
  if (state === 'menu') {
    const ti = tabRects().findIndex(r => pointIn(e.clientX, e.clientY, r));
    if (ti >= 0) { menuTab = ti; return; }
    if (menuTab === 0) {
      const i = cardRects(UP * 82).findIndex(r => pointIn(e.clientX, e.clientY, r));
      if (i >= 0) {
        if (i === factionSel) start();
        else { factionSel = i; requestReset(); }
      }
    } else if (menuTab === 1) {
      const i = squadRects().findIndex(r => pointIn(e.clientX, e.clientY, r));
      if (i >= 0) {
        squadSel = i;
        if (save.chars[CHARS[i].id]) { save.selected = CHARS[i].id; persist(); }
      }
    }
    return;
  }
  if (state === 'over') return start();
  if (state === 'levelup') {
    const i = cardRects().findIndex(r => pointIn(e.clientX, e.clientY, r));
    if (i >= 0) choose(i);
  }
});

addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (state === 'play') state = 'paused';
});

let last = performance.now();
let loadP = 0;
function drawLoading() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#1c2a14';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = font(UP * 10);
  shadowText(tr('АТАКА ТИТАНОВ'), W / 2, H / 2 - UP * 12, '#e8c45a');
  ctx.fillStyle = '#0e140a';
  ctx.fillRect(W / 2 - UP * 60, H / 2, UP * 120, UP * 5);
  ctx.fillStyle = '#7cc84a';
  ctx.fillRect(W / 2 - UP * 60, H / 2, UP * 120 * loadP, UP * 5);
}
drawLoading();
loadAssets(p => { loadP = p; drawLoading(); }).then(() => {
  reset();
  if (typeof UI !== 'undefined') UI.init();
  last = performance.now();
  requestAnimationFrame(frame);
});
function frame(now) {
  if (resetQueued && --resetQueued === 0) reset();
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  if (!window.FREEZE) update(dt);
  render();
  if (typeof UI !== 'undefined') UI.sync(dt);
  requestAnimationFrame(frame);
}
