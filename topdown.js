'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const buf = document.createElement('canvas');
const bctx = buf.getContext('2d');

const WORLD = 3600;
const BORDER = 140;
const WIN_TIME = 600;
const RUN = 170;
const ART = 3;
const GLIDE = 80;
const MAXZ = 380;
const OUTLINE = '#140c10';
const FONT = "'Pixelify Sans', system-ui, sans-serif";

const SKINS = ['#d6b4a0', '#c9a690', '#dfc2ae', '#bc9a86', '#c8a08c', '#a98672', '#e2c8b6', '#9f7c68'];
const HAIRS = ['#3b2a20', '#5a3d2b', '#1f1a17', '#7a5a3a', '#2d2620', '#8d8780', '#c9a35a', '#8c3a22'];
const IRIS = ['#5a3a22', '#3a6a8a', '#4a7a3a', '#2a2a2a'];
const WALLS = ['#a9a090', '#9b9282', '#b4aa98', '#8e8676', '#a39880'];
const ROOFS = ['#5b3f36', '#4a4648', '#634538', '#3c4150', '#553f36'];
const SHIRTS = ['#5a6878', '#7a5048', '#5c6a4a', '#8a7650', '#665a70', '#a8a090', '#6e5a46', '#4e5c5c'];
const PANTS = ['#5a4a3a', '#3e4a5a', '#6b5a48', '#4a4038'];

const FACTIONS = [
  { id: 'mp', name: 'Военная полиция', diff: 'Легко', color: '#7cfc9a', map: 'city', civs: 70, desc: 'Целый город за стенами. Летай по крышам, титаны заходят редко', base: 2, per: 1 / 60, cap: 8, spawn0: 6, spawnMin: 3, decay: 1 / 120, group: 1, abFrom: 300, abMax: 0.15, speed: 0.75, big: 0.1, heal: 8, grab: 1.35, turn: 0.8, req: 0.45 },
  { id: 'garrison', name: 'Гарнизон', diff: 'Средне', color: '#ffd27a', map: 'ruins', civs: 35, desc: 'Разрушенный Шиганшина. Титанов много, но и руин для тросов много', base: 4, per: 1 / 24, cap: 18, spawn0: 3.5, spawnMin: 1.1, decay: 1 / 55, group: 3, abFrom: 120, abMax: 0.3, speed: 0.95, big: 0.25, heal: 10, grab: 1.15, turn: 0.95, req: 0.5 },
  { id: 'scouts', name: 'Разведкорпус', diff: 'Сложно', color: '#ff6b6b', map: 'field', civs: 0, desc: 'Открытое поле за стеной. Только редкие деревья, высоту набрать трудно', base: 4, per: 1 / 18, cap: 22, spawn0: 3.5, spawnMin: 0.9, decay: 1 / 45, group: 4, abFrom: 60, abMax: 0.45, speed: 1.15, big: 0.4, heal: 16, grab: 0.9, turn: 1.35, req: 0.6 },
];

const BODIES = {
  normal: { leg: 0.44, head: 0.11, tw: 0.3, arm: 0.3 },
  lanky: { leg: 0.52, head: 0.09, tw: 0.22, arm: 0.36 },
  fat: { leg: 0.36, head: 0.11, tw: 0.4, arm: 0.27, belly: true },
  bighead: { leg: 0.38, head: 0.15, tw: 0.28, arm: 0.26 },
  aberrant: { leg: 0.48, head: 0.13, tw: 0.24, arm: 0.42 },
};

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
  { id: 'hange', name: 'Ханджи', rarity: 4, hair: '#6a4028', look: 'goggles', ability: 'Учёный: убийство оглушает титанов рядом' },
  { id: 'mikasa', name: 'Микаса', rarity: 5, hair: '#151214', look: 'scarf', ability: 'Облёт +35%, после убийства сразу летит к следующему' },
  { id: 'levi', name: 'Леви', rarity: 5, hair: '#121014', look: 'undercut', ability: 'Сильнейший: вихрь клинков с начала, быстрее во всём' },
];
const charById = id => CHARS.find(c => c.id === id) || CHARS[0];

const UPGRADES = [
  { name: 'Мощная лебёдка', desc: () => 'Летаешь на 12% быстрее', apply: s => { s.speed *= 1.12; } },
  { name: 'Длинные тросы', desc: () => 'Тросы и атака достают на 20% дальше', apply: s => { s.range *= 1.2; s.engage *= 1.2; } },
  { name: 'Быстрый облёт', desc: () => 'Заходишь титану за спину на 18% быстрее', apply: s => { s.orbit *= 1.18; } },
  { name: 'Перевязка', desc: () => '+1 к здоровью и лечение', apply: s => { s.maxHp += 1; player.hp = Math.min(s.maxHp, player.hp + 2); } },
  { name: 'Вихрь клинков', desc: s => s.spin ? 'Вихрь шире и чаще' : 'Время от времени режет всех титанов рядом', apply: s => { s.spin++; } },
  { name: 'Полевой медик', desc: () => 'Лечение за убийства приходит быстрее', apply: s => { s.healEvery = Math.max(6, s.healEvery - 5); } },
  { name: 'Лёгкий газ', desc: () => 'Планируешь вниз на 30% медленнее', apply: s => { s.glide *= 0.7; } },
];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
const difficulty = () => clamp((game.time - 90) / 360, 0, 1);

let W = 0, H = 0, PX = 3, bw = 0, bh = 0;
function resize() {
  W = Math.max(320, innerWidth);
  H = Math.max(240, innerHeight);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  PX = clamp(Math.round(Math.min(W, H) / 280), 2, 5);
  bw = Math.ceil(W / PX);
  bh = Math.ceil(H / PX);
  buf.width = bw;
  buf.height = bh;
}
addEventListener('resize', resize);
resize();

const viewW = () => bw * ART;
const viewH = () => bh * ART;
const keys = {};
const mouse = { x: 0, y: 0 };

let state = 'menu';
let faction = FACTIONS[0], factionSel = 0;
let menuTab = 0, squadSel = 0, menuMsg = '', menuMsgT = 0, pullRes = [], pullIdx = 0, pullT = 0;
let buildings, trees, anchors, titans, particles, texts, rings, slashes, decals, clouds, fogs, motes, emitters, civs, riders, flocks, flares;
let player, stats, game, cam, ground;
let choices = [], pendingLevels = 0, sel = 1;
const SAVE_KEY = 'aot-td-save';
let save = loadSave();
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

function makeCanvas(w, h, read = true) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const g = c.getContext('2d', { willReadFrequently: read });
  g.imageSmoothingEnabled = false;
  return [c, g];
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => clamp(Math.round(v * k), 0, 255).toString(16).padStart(2, '0');
  return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
}

function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function disc(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  const r = Math.max(1, Math.round(ry));
  for (let y = -r; y <= r; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r))));
    g.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2 + 1, 1);
  }
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
  const [out, og] = makeCanvas(w, h, false);
  og.drawImage(c, 0, 0);
  return out;
}

function mapSprite(rows, pal, edge = OUTLINE) {
  const [c, g] = makeCanvas(rows[0].length + 2, rows.length + 2);
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (pal[r[x]]) rect(g, x + 1, y + 1, 1, 1, pal[r[x]]);
  });
  return outlineCanvas(c, edge);
}

function rotated(src, q) {
  const w = q % 2 ? src.height : src.width, h = q % 2 ? src.width : src.height;
  const [c, g] = makeCanvas(w, h, false);
  g.translate(w / 2, h / 2);
  g.rotate(q * Math.PI / 2);
  g.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

const flashCache = new WeakMap();
function flashOf(img) {
  let f = flashCache.get(img);
  if (!f) {
    const [c, g] = makeCanvas(img.width, img.height, false);
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    flashCache.set(img, c);
    f = c;
  }
  return f;
}

const PAL = {
  h: '#3b2b22', s: '#f2c7a0', S: '#d9a47e', e: '#1b1418',
  j: '#b98a52', J: '#8a6236', x: '#3e2d22',
  c: '#2f6b45', C: '#1f4a30', E: '#e8edf2', B: '#4a78b5',
  w: '#ebe5d6', W: '#c4baa6', b: '#4a3326',
  g: '#9aa3aa', G: '#626b72', l: '#e3ecf2', L: '#9fb0bd',
};
const STAND_ROWS = [
  '....hhhh....',
  '...hhhhhh...',
  '...hhssshh..',
  '...hssses...',
  '....sSss....',
  '...cjjjjc...',
  '..ccjxjjcc..',
  '..cCjjxjCc..',
  '..cCjjjjCc..',
  '..cCsxxsCc..',
  '..CgwwwwgC..',
  '..CGwwwwGC..',
  '...CwWwWC...',
  '....ww.ww...',
  '....wW.wW...',
  '....bb.bb...',
  '....bb.bb...',
];
const FLY_ROWS = [[
  '................',
  '..........hhhh..',
  '.........hhhhhh.',
  '.........hhssse.',
  '..........sSss..',
  'CCcc.....jjjjsll',
  '.CCcccc.jjxjjLll',
  '..CCEBccjjjxjj..',
  '...CCcccjjjjg...',
  '.....CCcwwwwG...',
  '........wwWww...',
  '.......ww...ww..',
  '......bb.....bb.',
  '................',
], [
  '................',
  '..........hhhh..',
  '.........hhhhhh.',
  '.........hhssse.',
  '..........sSss..',
  '.........jjjjsll',
  'CCccccc.jjxjjLll',
  '.CCCEBccjjjxjj..',
  '...CCCccjjjjg...',
  '.....CCcwwwwG...',
  '........wwWww...',
  '.......ww...ww..',
  '......bb.....bb.',
  '................',
]];
const charCache = {};
function charSprites(id) {
  if (charCache[id]) return charCache[id];
  const c = charById(id);
  const pal = { ...PAL, h: c.hair };
  if (c.look === 'scarf') pal.S = '#b3262e';
  if (c.look === 'goggles') pal.e = '#c9a24a';
  const fly = FLY_ROWS.map(r => mapSprite(r, pal));
  charCache[id] = { stand: mapSprite(STAND_ROWS, pal), fly, spin: [0, 1, 2, 3].map(q => rotated(fly[0], q)) };
  return charCache[id];
}

const portraitCache = {};
function portrait(id) {
  if (portraitCache[id]) return portraitCache[id];
  const c = charById(id), hair = c.hair, hl = shade(hair, 1.7);
  const [cv, g] = makeCanvas(26, 26);
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

const CIV_ROWS = [[
  '..hhh..',
  '.hhhhh.',
  '.hssse.',
  '..sss..',
  '.ttttt.',
  'tttTttt',
  's.tTt.s',
  '..ppp..',
  '..p.p..',
  '.pp..p.',
  '.b...b.',
], [
  '..hhh..',
  '.hhhhh.',
  '.hssse.',
  '..sss..',
  '.ttttt.',
  'tttTttt',
  's.tTt.s',
  '..ppp..',
  '..p.p..',
  '..p.pp.',
  '..b..b.',
]];
const CIVS = [];
for (let i = 0; i < 10; i++) {
  const shirt = pick(SHIRTS);
  const pal = { h: pick(HAIRS), s: pick(['#f2c7a0', '#e0b08a', '#c99470', '#f5d2b0']), e: '#1b1418', t: shirt, T: shade(shirt, 0.8), p: pick(PANTS), b: '#3a2a20' };
  CIVS.push(CIV_ROWS.map(r => mapSprite(r, pal)));
}
const HORSE = [[
  '........hh......',
  '.......hss......',
  '......cjjc......',
  '.....cCjjc...mo.',
  '.....Ccjj...mooo',
  '.ooooooooooomoo.',
  'oooooooooooooo..',
  '.oOoooooooOoo...',
  '..OoooooooOo....',
  '..o.o....o.o....',
  '..o.o....o..o...',
  '..O.O....O..O...',
], [
  '........hh......',
  '.......hss......',
  '......cjjc......',
  '.....cCjjc...mo.',
  '.....Ccjj...mooo',
  '.ooooooooooomoo.',
  'oooooooooooooo..',
  '.oOoooooooOoo...',
  '..OoooooooOo....',
  '...o.o..o.o.....',
  '...o..o.o..o....',
  '...O..O.O..O....',
]].map(r => mapSprite(r, { h: '#3b2b22', s: '#f2c7a0', c: '#2f6b45', C: '#1f4a30', j: '#b98a52', o: '#7a4e30', O: '#5a3622', m: '#2a1a12' }));
const BIRD = [['b...b', '.b.b.', '..b..'], ['.....', 'bbbbb', '..b..']].map(r => mapSprite(r, { b: '#2a2228' }, '#2a2228'));

function buildPuffs(col, edge) {
  const list = [];
  for (let r = 1; r <= 10; r++) {
    const [c, g] = makeCanvas(r * 2 + 3, r * 2 + 3, false);
    disc(g, r + 1, r + 1, r, r, edge);
    disc(g, r + 1, r + 1, Math.max(0, r - 1), Math.max(0, r - 1), col);
    if (r > 2) disc(g, r, r, Math.max(1, r - 3), Math.max(1, r - 3), shade(col, 1.08));
    list.push(c);
  }
  return list;
}
const PUFF = buildPuffs('#eceae4', '#c9c5bd');
const SMOKE = buildPuffs('#5a5450', '#45403d');

function buildTreeSprites() {
  const list = [];
  for (let v = 0; v < 9; v++) {
    const r = 8 + v;
    const [c, g] = makeCanvas(r * 2 + 6, r * 2 + 6);
    const o = r + 3;
    disc(g, o + 1, o + 1, r, r - 1, '#1f3324');
    disc(g, o, o, r, r - 1, '#2c4632');
    for (let i = 0; i < 5 + v; i++) {
      const a = rand(0, Math.PI * 2), d = rand(0, r * 0.55);
      disc(g, o + Math.cos(a) * d, o + Math.sin(a) * d, r * 0.35, r * 0.3, '#263d2b');
    }
    disc(g, o - r * 0.3, o - r * 0.35, r * 0.45, r * 0.38, '#3d5a3c');
    disc(g, o - r * 0.45, o - r * 0.5, r * 0.18, r * 0.15, '#56704c');
    for (let i = 0; i < r * 3; i++) {
      const a = rand(0, Math.PI * 2), d = rand(0, r * 0.9);
      rect(g, o + Math.cos(a) * d, o + Math.sin(a) * d * 0.9, 1, 1, pick(['#1f3324', '#344f36', '#4a6444']));
    }
    list.push(outlineCanvas(c, '#0d150f'));
  }
  return list;
}
const TREES = buildTreeSprites();

function buildFountain() {
  const [c, g] = makeCanvas(44, 34);
  disc(g, 22, 23, 19, 9, '#5e5a54');
  disc(g, 22, 22, 19, 9, '#7c776e');
  disc(g, 22, 22, 15, 6, '#2e4450');
  disc(g, 21, 21, 12, 4, '#3e5a68');
  rect(g, 20, 8, 5, 14, '#726d64');
  rect(g, 23, 8, 2, 14, '#5e5a54');
  disc(g, 22, 8, 6, 2, '#86817a');
  disc(g, 22, 7, 4, 1, '#3e5a68');
  return outlineCanvas(c, '#2a1d16');
}
const FOUNTAIN = buildFountain();


function buildHouse(b) {
  const wp = Math.round(b.w / ART), dp = Math.round(b.d / ART), hp = Math.round(b.h / ART);
  const [c, g] = makeCanvas(wp + 6, dp + hp + 6);
  const x0 = 3, y0 = 3, wy = y0 + dp;
  const beam = '#2e231c';
  rect(g, x0, wy, wp, hp, b.wall);
  rect(g, x0 + wp - 3, wy, 3, hp, shade(b.wall, 0.86));
  rect(g, x0, wy + hp - 3, wp, 3, '#8a8073');
  for (let x = x0; x < x0 + wp; x += 3) rect(g, x, wy + hp - 3, 1, 3, '#766d61');
  const floors = Math.max(1, Math.floor((hp - 6) / 14));
  const cols = Math.max(1, Math.floor((wp - 4) / 11));
  const gx = Math.floor((wp - cols * 11) / 2) + 3;
  for (let r = 0; r <= floors; r++) rect(g, x0, wy + 1 + r * 14, wp, 1, beam);
  rect(g, x0, wy, 1, hp - 3, beam);
  rect(g, x0 + wp - 1, wy, 1, hp - 3, beam);
  const doorCol = Math.floor(cols / 2);
  for (let r = 0; r < floors; r++) {
    for (let k = 0; k < cols; k++) {
      const wx = x0 + gx + k * 11, wyy = wy + 4 + r * 14;
      if (r === floors - 1 && k === doorCol) continue;
      if (k < cols - 1 && (r + k) % 2 === 0) line(g, wx + 6, wyy + 8, wx + 10, wyy - 2, 1, beam);
      const lit = !b.ruin && Math.random() < 0.07;
      rect(g, wx - 1, wyy - 1, 6, 8, beam);
      rect(g, wx, wyy, 4, 6, lit ? '#d8a04a' : b.ruin ? '#140f0c' : '#1d2430');
      rect(g, wx, wyy, 1, 2, lit ? '#f2d08a' : b.ruin ? '#2a221e' : '#4e5c6c');
      rect(g, wx + 2, wyy, 1, 6, beam);
      rect(g, wx - 1, wyy + 7, 6, 1, shade(b.wall, 1.1));
      if (!b.ruin && Math.random() < 0.08) {
        rect(g, wx - 1, wyy + 6, 6, 2, '#5a7a3a');
        rect(g, wx, wyy + 5, 1, 1, pick(['#9a4a50', '#b8a060', '#a8a0b0']));
        rect(g, wx + 3, wyy + 5, 1, 1, pick(['#9a4a50', '#b8a060', '#a8a0b0']));
      }
    }
  }
  const dx = x0 + gx + doorCol * 11 - 1;
  rect(g, dx - 1, wy + hp - 13, 7, 10, beam);
  rect(g, dx, wy + hp - 12, 5, 9, b.ruin ? '#1e1814' : '#6b4630');
  if (!b.ruin) {
    rect(g, dx + 2, wy + hp - 12, 1, 9, '#583a28');
    rect(g, dx + 3, wy + hp - 8, 1, 1, '#d9b45a');
  }
  rect(g, x0, wy, wp, 1, shade(b.wall, 0.65));
  rect(g, x0, wy + 1, wp, 1, shade(b.wall, 0.82));
  rect(g, x0 - 2, y0, wp + 4, dp, b.roof);
  for (let y = y0 + 1, i = 0; y < y0 + dp - 1; y += 3, i++) {
    rect(g, x0 - 2, y, wp + 4, 1, shade(b.roof, 0.84));
    for (let x = x0 - 2 + (i % 2) * 2; x < x0 + wp + 2; x += 4) rect(g, x, y + 1, 1, 2, shade(b.roof, 0.9));
  }
  const mid = y0 + Math.floor(dp / 2);
  rect(g, x0 - 2, mid - 1, wp + 4, 1, shade(b.roof, 1.18));
  rect(g, x0 - 2, mid, wp + 4, 2, shade(b.roof, 0.68));
  rect(g, x0 - 2, y0 + dp - 1, wp + 4, 1, shade(b.roof, 0.6));
  rect(g, x0 - 2, y0, wp + 4, 1, shade(b.roof, 1.1));
  if (Math.random() < 0.7) {
    const cx = x0 + Math.round(wp * rand(0.15, 0.75)), cy = y0 + Math.round(rand(1, Math.max(1, dp / 2 - 6)));
    rect(g, cx, cy, 5, 7, '#8c5a48');
    rect(g, cx + 3, cy, 2, 7, '#6e4436');
    rect(g, cx - 1, cy, 7, 2, '#5d3a2e');
  }
  if (b.ruin) {
    const fromLeft = Math.random() < 0.5;
    const cut = x0 - 2 + Math.round((wp + 4) * rand(0.3, 0.75));
    const x1 = fromLeft ? x0 - 2 : cut, x2 = fromLeft ? cut : x0 + wp + 2;
    rect(g, x1, y0, x2 - x1, dp, '#3b2f28');
    for (let i = 0; i < (x2 - x1) * dp * 0.3; i++) rect(g, rand(x1, x2), rand(y0, y0 + dp), rand(1, 3), 1, pick(['#6e665c', '#8a8073', '#5b4636', '#2a221e']));
    for (let i = 0; i < 3; i++) line(g, rand(x1, x2), y0 + rand(0, dp), rand(x1, x2), y0 + rand(0, dp), 1, '#4a3426');
    let depth = 2;
    for (let x = x1; x < x2; x++) {
      depth = clamp(depth + Math.round(rand(-1.4, 1.4)), 1, Math.min(10, hp - 6));
      rect(g, x, wy, 1, depth, '#2e2420');
    }
    for (let i = 0; i < wp * hp * 0.06; i++) rect(g, x0 + rand(0, wp), wy + rand(0, hp), rand(1, 3), rand(1, 2), 'rgba(30, 22, 18, 0.55)');
  }
  b.sprite = outlineCanvas(c, '#2a1d16');
  b.ox = x0;
  b.oy = y0;
}

function buildTower(b) {
  const wp = Math.round(b.w / ART), dp = Math.round(b.d / ART), hp = Math.round(b.h / ART);
  const rh = b.ruin ? 0 : Math.round(wp * 1.1);
  const [c, g] = makeCanvas(wp + 8, dp + hp + rh + 8);
  const x0 = 4, y0 = 4 + rh, wy = y0 + dp;
  const stone = '#aaa294', dark = '#878072';
  rect(g, x0, wy, wp, hp, stone);
  rect(g, x0 + wp - 4, wy, 4, hp, dark);
  for (let y = wy + 3, i = 0; y < wy + hp; y += 4, i++) {
    rect(g, x0, y, wp, 1, dark);
    for (let x = x0 + (i % 2) * 3; x < x0 + wp; x += 6) rect(g, x, y - 3, 1, 3, dark);
  }
  for (let k = 0; k < 3; k++) {
    const wx = x0 + Math.round(wp * (0.2 + k * 0.3)) - 1;
    rect(g, wx, wy + 6, 3, 7, '#2a2430');
    rect(g, wx + 1, wy + 5, 1, 1, '#2a2430');
  }
  if (!b.ruin) {
    disc(g, x0 + wp / 2, wy + 22, 5, 5, '#3a3430');
    disc(g, x0 + wp / 2, wy + 22, 4, 4, '#efe6cc');
    rect(g, x0 + wp / 2, wy + 19, 1, 3, '#2a2430');
    rect(g, x0 + wp / 2, wy + 22, 3, 1, '#2a2430');
  }
  for (let y = wy + 34; y < wy + hp - 14; y += 18) rect(g, x0 + wp / 2 - 1, y, 2, 6, '#2a2430');
  rect(g, x0 + wp / 2 - 4, wy + hp - 12, 8, 12, '#4a3426');
  rect(g, x0 + wp / 2 - 3, wy + hp - 11, 6, 11, '#6b4630');
  rect(g, x0 - 1, y0, wp + 2, dp, '#948c7e');
  for (let x = x0 - 1; x < x0 + wp + 1; x += 4) rect(g, x, y0, 2, 2, '#bab2a2');
  if (!b.ruin) {
    const apex = y0 + Math.round(dp / 2) - rh, base = y0 + dp;
    for (let y = apex; y <= base; y++) {
      const k = (y - apex) / (base - apex);
      const half = Math.round(k * (wp / 2 + 2));
      const cx = x0 + Math.round(wp / 2);
      rect(g, cx - half, y, half, 1, '#55607a');
      rect(g, cx, y, half + 1, 1, '#3e475c');
      if ((y - apex) % 4 === 0) rect(g, cx - half, y, half * 2 + 1, 1, '#2e3548');
    }
    rect(g, x0 + Math.round(wp / 2), apex - 3, 1, 3, '#e8c45a');
  } else {
    let depth = 3;
    for (let x = x0 - 1; x < x0 + wp + 1; x++) {
      depth = clamp(depth + Math.round(rand(-2, 2)), 0, 14);
      g.clearRect(x, y0, 1, depth);
    }
  }
  b.sprite = outlineCanvas(c, '#2a1d16');
  b.ox = x0;
  b.oy = y0;
}

function cobbleRow(g, x, y, w, tones) {
  const off = (Math.floor(y / 3) % 2) * 2;
  for (let xx = x - off; xx < x + w; xx += 4) {
    const sx = Math.max(x, xx), ex = Math.min(x + w, xx + 3);
    if (ex > sx) rect(g, sx, y, ex - sx, 2, pick(tones));
  }
}

function rubble(g, x, y, r) {
  for (let i = 0; i < r * r * 1.5; i++) {
    const a = rand(0, Math.PI * 2), d = Math.pow(Math.random(), 0.7) * r;
    rect(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, rand(1, 3), rand(1, 2), pick(['#5a554e', '#4a4640', '#66615a', '#3e3028', '#2e2a26']));
  }
}

function streets(g, n, tones, edge, cracks) {
  const b0 = Math.round(BORDER / ART), b1 = n - b0;
  for (let x = BORDER + 80 - 45; x < WORLD; x += 260) {
    const sx = Math.round(x / ART);
    rect(g, sx, b0, 14, b1 - b0, '#45413b');
    for (let y = b0; y < b1; y += 3) cobbleRow(g, sx, y, 14, tones);
    rect(g, sx - 1, b0, 1, b1 - b0, edge);
    rect(g, sx + 14, b0, 1, b1 - b0, edge);
  }
  for (let y = BORDER + 160 - 45; y < WORLD; y += 230) {
    const sy = Math.round(y / ART);
    rect(g, b0, sy, b1 - b0, 14, '#45413b');
    for (let yy = sy; yy < sy + 14; yy += 3) cobbleRow(g, b0, yy, b1 - b0, tones);
    rect(g, b0, sy - 1, b1 - b0, 1, edge);
    rect(g, b0, sy + 14, b1 - b0, 1, edge);
  }
  if (cracks) {
    for (let i = 0; i < 400; i++) {
      let x = rand(b0, b1), y = rand(b0, b1);
      for (let k = 0; k < 6; k++) {
        const nx = x + rand(-3, 3), ny = y + rand(-3, 3);
        line(g, x, y, nx, ny, 1, '#5a5044');
        x = nx;
        y = ny;
      }
    }
  }
}

function walls(g, n, breach) {
  const b0 = Math.round(BORDER / ART), b1 = n - b0, face = 40, fy = b0 - face;
  const top = '#6a655d', seam = '#55514b';
  rect(g, 0, 0, n, b0, top);
  rect(g, 0, b1, n, n - b1, top);
  rect(g, 0, 0, b0, n, top);
  rect(g, b1, 0, n - b1, n, top);
  for (let y = 0; y < n; y += 6) {
    const inner = y > fy - 6 && y < b1 + 2;
    for (let x = ((y / 6) % 2) * 6; x < n; x += 12) {
      if (inner && x > b0 - 2 && x < b1 + 2) continue;
      rect(g, x, y, 1, 6, seam);
    }
    if (inner) {
      rect(g, 0, y, b0, 1, seam);
      rect(g, b1, y, n - b1, 1, seam);
    } else rect(g, 0, y, n, 1, seam);
  }
  rect(g, b0, fy, b1 - b0, face, '#57524b');
  for (let y = fy; y < b0; y += 7) {
    rect(g, b0, y, b1 - b0, 1, '#3f3b36');
    for (let x = b0 + (((y - fy) / 7) % 2) * 7; x < b1; x += 14) rect(g, x, y, 1, 7, '#3f3b36');
  }
  for (let i = 0; i < (b1 - b0) / 5; i++) rect(g, rand(b0, b1), fy + rand(0, 10), Math.random() < 0.3 ? 2 : 1, rand(8, face - 4), 'rgba(18, 14, 12, 0.35)');
  for (let i = 0; i < 12; i++) {
    g.fillStyle = `rgba(10, 8, 12, ${(0.04 * (i + 1)).toFixed(2)})`;
    g.fillRect(b0, b0 - 12 + i, b1 - b0, 1);
  }
  for (let x = b0; x < b1; x++) if (Math.random() < 0.45) rect(g, x, b0 - rand(1, 5), 1, rand(1, 5), pick(['#33422c', '#2a3624', '#3d4a32']));
  for (let x = b0; x < b1; x += 10) {
    rect(g, x, fy - 5, 6, 5, '#77726a');
    rect(g, x, fy - 5, 6, 1, '#8a857c');
  }
  rect(g, b0 - 3, b0, 3, b1 - b0, '#36322e');
  rect(g, b1, b0, 3, b1 - b0, '#36322e');
  rect(g, b0, b1, b1 - b0, 3, '#36322e');
  g.fillStyle = 'rgba(10, 8, 18, 0.35)';
  g.fillRect(b0, b0, b1 - b0, 16);
  if (breach) {
    const cx = Math.round(n / 2);
    let d = 6;
    for (let x = -46; x <= 46; x++) {
      d = clamp(d + Math.round(rand(-2, 2)), 2, 12);
      const edge = 46 - Math.abs(x);
      rect(g, cx + x, fy - 5, 1, Math.min(face + 5, edge * 2 + d), '#120e0c');
    }
    for (let i = 0; i < 10; i++) rubble(g, cx + rand(-60, 60), b0 + rand(0, 36), rand(5, 10));
    for (let i = 0; i < 40; i++) rect(g, cx + rand(-50, 50), b0 + rand(0, 50), rand(2, 6), rand(2, 4), pick(['#57524b', '#6a655d', '#3f3b36']));
  }
}

function forestEdge(g, n) {
  const b0 = Math.round(BORDER / ART), b1 = n - b0;
  rect(g, 0, 0, n, b0 + 4, '#18241a');
  rect(g, 0, b1 - 4, n, n - b1 + 4, '#18241a');
  rect(g, 0, 0, b0 + 4, n, '#18241a');
  rect(g, b1 - 4, 0, n - b1 + 4, n, '#18241a');
  for (let i = 0; i < 900; i++) {
    const side = i % 4, t = Math.random() * n, d = rand(-6, b0 + 6);
    const x = side === 0 ? t : side === 1 ? t : side === 2 ? d : n - d;
    const y = side === 0 ? d : side === 1 ? n - d : t;
    const s = TREES[Math.floor(rand(2, 9))];
    g.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2));
  }
}

function buildGround(kind) {
  const n = Math.ceil(WORLD / ART);
  const [c, g] = makeCanvas(n, n, false);
  const grass = kind === 'field' ? ['#5f6c48', '#66734e', '#586544', '#6d7954', '#525e3f'] : kind === 'ruins' ? ['#4f5540', '#484e3a', '#565b45', '#55503f', '#4c4638'] : ['#56624a', '#5d6a50', '#4f5b44', '#646f55', '#4a553f'];
  rect(g, 0, 0, n, n, grass[0]);
  for (let i = 0; i < n * n * 0.07; i++) rect(g, Math.random() * n, Math.random() * n, 1, 1, pick(grass));
  for (let i = 0; i < (kind === 'field' ? 9000 : 4000); i++) {
    const x = Math.random() * n, y = Math.random() * n;
    rect(g, x, y, 1, 2, shade(grass[0], 0.78));
    rect(g, x + 1, y - 1, 1, 2, shade(grass[0], 0.88));
  }
  const flowers = kind === 'ruins' ? 60 : kind === 'field' ? 500 : 180;
  for (let i = 0; i < flowers; i++) rect(g, Math.random() * n, Math.random() * n, 1, 1, pick(['#a89a62', '#b8b2a4', '#8a6a72', '#7a8494']));
  const pc = n / 2;
  if (kind === 'city') {
    streets(g, n, ['#6e6a62', '#77726a', '#66625a', '#7e786e'], '#33382c', false);
    const pr = Math.round(250 / ART);
    for (let y = -pr; y <= pr; y += 3) {
      const half = Math.round(Math.sqrt(Math.max(0, pr * pr - y * y)));
      rect(g, pc - half, pc + y, half * 2, 3, '#4e4a44');
      cobbleRow(g, pc - half, pc + y, half * 2, ['#7c776e', '#857f75', '#736e66', '#8b857a']);
    }
    for (let a = 0; a < Math.PI * 2; a += 0.02) rect(g, pc + Math.cos(a) * 60, pc + Math.sin(a) * 60, 2, 2, '#5a554c');
    walls(g, n, false);
  } else if (kind === 'ruins') {
    streets(g, n, ['#625c52', '#5a554c', '#6a645a', '#545048'], '#2e3226', true);
    for (let i = 0; i < 260; i++) disc(g, rand(0, n), rand(0, n), rand(4, 14), rand(2, 7), 'rgba(35, 25, 20, 0.25)');
    for (let i = 0; i < 220; i++) rubble(g, rand(0, n), rand(0, n), rand(3, 9));
    walls(g, n, true);
  } else {
    let y = n * 0.3;
    for (let x = 0; x < n; x++) {
      y += Math.sin(x / 60) * 0.6 + rand(-0.3, 0.3);
      rect(g, x, y, 1, 9, '#6e6250');
      if (Math.random() < 0.4) rect(g, x, y + rand(1, 8), 1, 1, pick(['#5e5444', '#7a6e5a']));
      rect(g, x, y + 4, 1, 1, '#5a5040');
    }
    let x2 = n * 0.65;
    for (let yy = 0; yy < n; yy++) {
      x2 += Math.sin(yy / 80) * 0.5 + rand(-0.3, 0.3);
      rect(g, x2, yy, 8, 1, '#6e6250');
      if (Math.random() < 0.4) rect(g, x2 + rand(1, 7), yy, 1, 1, pick(['#5e5444', '#7a6e5a']));
    }
    for (let i = 0; i < 120; i++) {
      const rx = rand(0, n), ry = rand(0, n), r = rand(2, 5);
      disc(g, rx + 1, ry + 1, r, r * 0.7, '#6a665e');
      disc(g, rx, ry, r, r * 0.7, '#9a968c');
      rect(g, rx - r * 0.4, ry - r * 0.4, 2, 1, '#bab6aa');
    }
    forestEdge(g, n);
  }
  bakeShadows(g, kind, pc);
  return c;
}

function bakeShadows(g, kind, pc) {
  g.fillStyle = 'rgba(10, 8, 18, 0.4)';
  for (const b of buildings) {
    const x = Math.round((b.x + b.w) / ART), y = Math.round(b.y / ART), d = Math.round(b.d / ART), s = Math.round(b.h / ART * 0.5);
    for (let i = 0; i < d + 4; i++) g.fillRect(x, y + i, Math.round(s * Math.min(1, i / 6)), 1);
  }
  for (const t of trees) disc(g, t.x / ART + 6, t.y / ART + 1, 9 + t.v, 3 + t.v * 0.3, 'rgba(30, 20, 45, 0.25)');
  if (kind === 'city') disc(g, pc + 4, pc + 6, 20, 7, 'rgba(30, 20, 45, 0.22)');
}


function addHouse(x, y, w, d, h, ruin) {
  const b = { kind: 'house', x, y, w, d, h, ruin, wall: pick(WALLS), roof: pick(ROOFS) };
  if (ruin) b.wall = shade(b.wall, 0.82);
  buildHouse(b);
  buildings.push(b);
  return b;
}

function addTower(x, y, h, ruin) {
  const b = { kind: 'tower', x, y, w: rand(66, 84), d: rand(60, 72), h, ruin };
  buildTower(b);
  buildings.push(b);
  return b;
}

function addTree(x, y, h) {
  trees.push({ x, y, h, v: clamp(Math.round((h - 60) / 15), 0, 8), seed: Math.random() * 10 });
}

function genCity() {
  const c = WORLD / 2;
  for (let gx = BORDER + 80; gx < WORLD - BORDER - 220; gx += 260) {
    for (let gy = BORDER + 160; gy < WORLD - BORDER - 160; gy += 230) {
      if (Math.hypot(gx + 100 - c, gy + 75 - c) < 280) continue;
      const r = Math.random();
      if (r < 0.07) addTower(gx + rand(20, 120), gy + rand(10, 70), rand(280, 340), false);
      else if (r < 0.8) {
        const w = rand(120, 200), d = rand(80, 140);
        const b = addHouse(gx + rand(0, 210 - w), gy + rand(0, 150 - d), w, d, rand(110, 200), false);
        if (Math.random() < 0.18) emitters.push({ x: b.x + rand(0.2, 0.8) * b.w, y: b.y + rand(0.2, 0.5) * b.d, z: b.h + 12, t: 0, chimney: true });
      } else if (r < 0.94) {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) addTree(gx + rand(20, 200), gy + rand(30, 160), rand(70, 110));
      }
    }
  }
}

function genRuins() {
  const c = WORLD / 2;
  for (let gx = BORDER + 80; gx < WORLD - BORDER - 220; gx += 260) {
    for (let gy = BORDER + 160; gy < WORLD - BORDER - 160; gy += 230) {
      if (Math.hypot(gx + 100 - c, gy + 75 - c) < 220) continue;
      const r = Math.random();
      if (r < 0.04) addTower(gx + rand(20, 120), gy + rand(10, 70), rand(200, 280), true);
      else if (r < 0.88) {
        const w = rand(110, 200), d = rand(80, 140), ruin = Math.random() < 0.6;
        const b = addHouse(gx + rand(0, 210 - w), gy + rand(0, 150 - d), w, d, ruin ? rand(70, 130) : rand(100, 170), ruin);
        if (ruin && Math.random() < 0.3) emitters.push({ x: b.x + rand(0.2, 0.8) * b.w, y: b.y + rand(0.3, 0.7) * b.d, z: b.h, t: 0 });
      } else addTree(gx + rand(20, 200), gy + rand(30, 160), rand(60, 95));
    }
  }
}

function genField() {
  for (let i = 0; i < 4; i++) {
    const x = rand(BORDER + 300, WORLD - BORDER - 400), y = rand(BORDER + 300, WORLD - BORDER - 400);
    addHouse(x, y, rand(110, 160), rand(80, 110), rand(70, 110), Math.random() < 0.5);
  }
  for (let i = 0; i < 2; i++) addTower(rand(BORDER + 400, WORLD - BORDER - 500), rand(BORDER + 400, WORLD - BORDER - 500), rand(220, 260), true);
  for (let i = 0; i < 22; i++) addTree(rand(BORDER + 100, WORLD - BORDER - 100), rand(BORDER + 100, WORLD - BORDER - 100), rand(90, 180));
  for (let k = 0; k < 4; k++) {
    const gx = rand(BORDER + 400, WORLD - BORDER - 400), gy = rand(BORDER + 400, WORLD - BORDER - 400);
    for (let i = 0; i < 5; i++) addTree(gx + rand(-200, 200), gy + rand(-150, 150), rand(120, 190));
  }
  const mid = WORLD / 2;
  trees = trees.filter(t => Math.hypot(t.x - mid, t.y - mid) > 120);
  buildings = buildings.filter(b => Math.hypot(b.x + b.w / 2 - mid, b.y + b.d / 2 - mid) > 250);
}

function genWorld() {
  buildings = [];
  trees = [];
  emitters = [];
  if (faction.map === 'city') genCity();
  else if (faction.map === 'ruins') genRuins();
  else genField();
  anchors = [];
  for (const b of buildings) {
    if (b.kind === 'tower') anchors.push({ x: b.x + b.w / 2, y: b.y + b.d / 2, z: b.h });
    else {
      anchors.push({ x: b.x + b.w * 0.25, y: b.y + b.d * 0.5, z: b.h });
      anchors.push({ x: b.x + b.w * 0.75, y: b.y + b.d * 0.5, z: b.h });
    }
  }
  for (const t of trees) anchors.push({ x: t.x, y: t.y, z: t.h });
  if (faction.map === 'city') anchors.push({ x: WORLD / 2, y: WORLD / 2, z: 45 });
  const edgeZ = faction.map === 'field' ? 140 : 130;
  for (let i = BORDER; i < WORLD - BORDER; i += 180) {
    anchors.push({ x: i, y: BORDER, z: edgeZ }, { x: i, y: WORLD - BORDER, z: edgeZ });
    anchors.push({ x: BORDER, y: i, z: edgeZ }, { x: WORLD - BORDER, y: i, z: edgeZ });
  }
  ground = buildGround(faction.map);
  clouds = [];
  for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, WORLD), y: rand(0, WORLD), rx: rand(130, 230), ry: rand(60, 110), v: rand(10, 20) });
  fogs = [];
  for (let i = 0; i < (faction.map === 'city' ? 8 : 12); i++) fogs.push({ x: rand(0, WORLD), y: rand(0, WORLD), rx: rand(220, 420), ry: rand(90, 170), v: rand(6, 14) });
  motes = [];
  for (let i = 0; i < (faction.map === 'city' ? 40 : 90); i++) motes.push({ x: rand(0, 1), y: rand(0, 1), v: rand(2, 6), p: rand(0, 6) });
}

function floorZ(x, y) {
  let z = 0;
  for (const b of buildings) if (b.h > z && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.d) z = b.h;
  return z;
}

function freeSpot(minDist) {
  for (let i = 0; i < 40; i++) {
    const x = rand(BORDER + 60, WORLD - BORDER - 60), y = rand(BORDER + 60, WORLD - BORDER - 60);
    if (floorZ(x, y) > 0) continue;
    if (player && Math.hypot(x - player.x, y - player.y) < minDist) continue;
    return { x, y };
  }
  return null;
}

function spawnCiv(x, y) {
  civs.push({ x, y, v: Math.floor(Math.random() * CIVS.length), tx: x, ty: y, wait: rand(0, 2), phase: rand(0, 6), panic: 0, face: 1 });
}

function reset() {
  faction = FACTIONS[factionSel];
  genWorld();
  stats = { speed: 480, range: 340, orbit: 620, engage: 380, maxHp: 5, spin: 0, healEvery: faction.heal, glide: GLIDE, xp: 1, cd: 0.45, stun: false, rage: false, chain: false, warn: false };
  const hero = save.chars[save.selected] ? charById(save.selected) : CHARS[0];
  const stars = save.chars[hero.id] || 1;
  if (hero.id === 'connie') { stats.speed *= 1.1; stats.glide *= 0.9; }
  if (hero.id === 'sasha') { stats.maxHp += 1; stats.healEvery -= 4; }
  if (hero.id === 'jean') { stats.engage *= 1.2; stats.orbit *= 1.1; }
  if (hero.id === 'eren') stats.rage = true;
  if (hero.id === 'armin') { stats.xp = 1.25; stats.warn = true; }
  if (hero.id === 'hange') stats.stun = true;
  if (hero.id === 'mikasa') { stats.orbit *= 1.35; stats.chain = true; }
  if (hero.id === 'levi') { stats.spin = 1; stats.speed *= 1.15; stats.orbit *= 1.2; stats.cd = 0.15; }
  stats.speed *= 1 + (stars - 1) * 0.03;
  stats.orbit *= 1 + (stars - 1) * 0.03;
  const start = faction.map === 'city' ? { x: WORLD / 2, y: WORLD / 2 + 120 } : { x: WORLD / 2, y: WORLD / 2 };
  player = {
    x: start.x, y: start.y, z: 0, vx: 0, vy: 0, hp: 5, inv: 0, face: 1,
    mode: 'fly', anchor: null, prevAnchor: null, prevT: 0, hookT: 0, puffT: 0, ropeT: 1,
    target: null, phase: '', ang: 0, cutT: 0, attackT: 0, engageCd: 0, lowT: 0, lastChain: -10,
    char: hero.id, stars,
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
  for (let i = 0; i < faction.civs; i++) {
    const s = freeSpot(0);
    if (s) spawnCiv(s.x, s.y);
  }
  if (faction.map === 'field') {
    for (let i = 0; i < 5; i++) {
      const a = rand(0, Math.PI * 2);
      riders.push({ x: rand(BORDER + 200, WORLD - BORDER - 200), y: rand(BORDER + 200, WORLD - BORDER - 200), vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, phase: 0 });
    }
  }
  for (let i = 0; i < (faction.map === 'field' ? 10 : 5); i++) spawnFlock();
  pendingLevels = 0;
  game = { time: 0, kills: 0, lost: 0, xp: 0, level: 1, need: 5, spawnT: 2, shake: 0, hitstop: 0, combo: 0, lastKill: -10, healCount: 0, spinT: 3, endless: false, civT: 0, flareT: 15, paidKills: 0, paidTime: 0, reward: 0 };
  cam = { x: player.x - viewW() / 2, y: player.y - viewH() / 2 - 60 };
  for (let i = 0; i < faction.base; i++) spawnTitan();
}

function start() {
  save.faction = factionSel;
  persist();
  reset();
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
  return { x: t.x - Math.cos(t.face) * t.H * 0.06, y: t.y - Math.sin(t.face) * t.H * 0.06, z: t.H * t.g.nape };
}

function reqZ(t) {
  return nape(t).z * faction.req;
}

function grabWind(t) {
  return (t.aberrant ? lerp(0.6, 0.4, difficulty()) : lerp(0.85, 0.5, difficulty())) * faction.grab;
}

function reachOf(t) {
  return t.H * 0.45 + 30;
}

function bodyOf(type) {
  const b = BODIES[type], neck = 0.04;
  const th = 1 - b.leg - neck - b.head * 2;
  return { ...b, th, neck, nape: b.leg + th + neck * 0.5, headC: b.leg + th + neck + b.head, shoulder: b.leg + th - 0.03 };
}

function spawnTitan(at) {
  const t = game.time;
  const aberrant = t > faction.abFrom && Math.random() < 0.08 + difficulty() * faction.abMax;
  const big = !aberrant && Math.random() < Math.min(0.5, faction.big + t / 900);
  const h = aberrant ? rand(220, 300) : big ? rand(300, 420) : rand(160, 250);
  let x, y;
  if (at) { x = at.x; y = at.y; }
  else {
    const a = Math.random() * Math.PI * 2, dist = Math.hypot(viewW(), viewH()) / 2 + 150;
    x = player.x + Math.cos(a) * dist;
    y = player.y + Math.sin(a) * dist;
  }
  x = clamp(x, BORDER + 60, WORLD - BORDER - 60);
  y = clamp(y, BORDER + 60, WORLD - BORDER - 60);
  const type = aberrant ? 'aberrant' : pick(['normal', 'normal', 'lanky', 'fat', 'bighead']);
  titans.push({
    x, y, H: h, hp: Math.round(h / ART), face: Math.atan2(player.y - y, player.x - x),
    type, g: bodyOf(type),
    speed: (aberrant ? rand(110, 150) : rand(35, 60) * Math.sqrt(250 / h)) * faction.speed,
    aberrant, state: 'walk', grabT: 0, grabCd: rand(1, 2), grabAng: 0, hand: null, prey: null, preyT: 0, held: -1,
    stun: 0, lunge: 0, lungeCd: rand(2, 4), flash: 0,
    skin: aberrant ? pick(['#d98f80', '#e8b0a0', '#c97a6a']) : pick(SKINS), hair: pick(HAIRS), style: Math.floor(Math.random() * 5),
    eyes: aberrant ? pick(['wide', 'big']) : pick(['wide', 'dot', 'sleepy', 'big', 'dot']),
    mouth: aberrant ? pick(['open', 'lipless']) : pick(['grin', 'grin', 'open', 'smirk', 'lipless']),
    iris: pick(IRIS), beard: Math.random() < 0.2, blush: Math.random() < 0.25, angry: Math.random() < 0.3, old: Math.random() < 0.2,
    spr: { front: [], back: [], side: [] },
    phase: Math.random() * 6, dying: 0, fallDir: 1,
  });
  return { x, y };
}

function spawnFlock(near) {
  let x, y;
  if (near) {
    const a = rand(0, Math.PI * 2), d = rand(300, 700);
    x = near.x + Math.cos(a) * d;
    y = near.y + Math.sin(a) * d;
  } else {
    const s = freeSpot(0) || { x: WORLD / 2, y: WORLD / 2 };
    x = s.x;
    y = s.y;
  }
  const n = 4 + Math.floor(Math.random() * 6), birds = [];
  for (let i = 0; i < n; i++) birds.push({ ox: rand(-25, 25), oy: rand(-15, 15), p: rand(0, 6) });
  flocks.push({ x, y, z: 0, vx: 0, vy: 0, vz: 0, fly: false, birds, life: 999 });
}

function fireFlare(x, y, color) {
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

function splat(x, y, size) {
  const pts = [];
  for (let i = 0; i < size * 4; i++) {
    const a = rand(0, Math.PI * 2), d = Math.pow(Math.random(), 1.5) * size;
    pts.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d * 0.6), Math.random() < 0.6 ? '#4e0c0e' : '#7a1416']);
  }
  decals.push({ x, y, pts, life: 25 });
  if (decals.length > 60) decals.shift();
}

function saveBest() {
  if (game.time > bestOf(faction)) save.best[faction.id] = game.time;
  persist();
}

function finishRun(won) {
  const mul = [1, 1.5, 2][FACTIONS.indexOf(faction)];
  const earned = Math.round(((game.kills - game.paidKills) * 2 + Math.floor((game.time - game.paidTime) / 10) + (won ? 300 : 0)) * mul);
  game.paidKills = game.kills;
  game.paidTime = game.time;
  game.reward = earned;
  save.tokens += earned;
  saveBest();
}

function hurtPlayer(t) {
  const p = player;
  if (p.inv > 0) return;
  p.hp -= 1;
  p.inv = 2;
  p.mode = 'fly';
  p.target = null;
  p.anchor = null;
  const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy) || 1;
  p.vx = dx / d * 520;
  p.vy = dy / d * 520;
  game.shake = 14;
  burst(p.x, p.y - p.z, 18, '#c0392b');
  addText('-1 ♥', p.x, p.y - p.z - 30, '#ff6b6b');
  if (p.hp <= 0) {
    state = 'over';
    finishRun(false);
  }
}

function killTitan(t) {
  const n = nape(t);
  t.dying = 0.001;
  t.flash = 0.1;
  t.fallDir = Math.cos(t.face) >= 0 ? 1 : -1;
  t.state = 'dead';
  t.hand = null;
  t.held = -1;
  if (player.target === t) {
    player.mode = 'fly';
    player.target = null;
  }
  game.kills++;
  game.combo = game.time - game.lastKill < 4 ? game.combo + 1 : 1;
  game.lastKill = game.time;
  if (stats.rage && game.combo === 3 && player.hp < stats.maxHp) {
    player.hp++;
    addText('ЯРОСТЬ! +1 ♥', player.x, player.y - player.z - 60, '#ff6b4a');
  }
  if (stats.stun) {
    for (const o of titans) {
      if (o === t || o.dying || Math.hypot(o.x - t.x, o.y - t.y) > 350) continue;
      o.stun = 1.5;
      o.state = 'walk';
      o.hand = null;
      steam(o.x, o.y - o.H * 0.9, 3, 10);
    }
  }
  game.hitstop = 0.07;
  game.shake = 10;
  burst(n.x, n.y - n.z, 30, '#b3122e');
  burst(n.x, n.y - n.z, 8, '#fff2d0');
  steam(n.x, n.y - n.z, 10);
  slashes.push({ x: n.x, y: n.y - n.z, ang: t.face + Math.PI, life: 0.22 });
  splat(t.x + t.fallDir * t.H * 0.3, t.y, Math.max(6, Math.round(t.hp * 0.12)));
  addText(game.combo > 1 ? `КОМБО x${game.combo}` : 'ЗАТЫЛОК!', n.x, n.y - n.z - 40, game.combo > 1 ? '#ffd27a' : '#ffffff');
  game.healCount++;
  if (game.healCount >= stats.healEvery) {
    game.healCount = 0;
    stats.healEvery += 8;
    if (player.hp < stats.maxHp) {
      player.hp++;
      addText('+1 ♥', player.x, player.y - player.z - 50, '#7cfc9a');
    }
  }
  gainXp(Math.round((t.H / 60 + (t.aberrant ? 2 : 0)) * (1 + 0.25 * (game.combo - 1)) * stats.xp));
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

function engage() {
  const p = player;
  if (state !== 'play' || p.mode !== 'fly' || p.engageCd > 0) return;
  const inp = inputVec();
  let found = null, bs = Infinity, tooLow = false;
  for (const t of titans) {
    if (t.dying) continue;
    const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d > stats.engage + t.H * 0.2) continue;
    if (p.z < reqZ(t)) { tooLow = true; continue; }
    const s = d - ((dx * inp.x + dy * inp.y) / d) * 150;
    if (s < bs) { bs = s; found = t; }
  }
  if (!found) {
    addText(tooLow ? 'Слишком низко! Набери высоту' : 'Рядом нет титанов', p.x, p.y - p.z - 40, tooLow ? '#ffb347' : '#e9e4da');
    if (tooLow) p.lowT = 0.8;
    return;
  }
  p.mode = 'attack';
  p.target = found;
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
      particles.push({ x: p.x - inp.x * 10, y: p.y - p.z + 4 - inp.y * 10, vx: -inp.x * 160 + rand(-30, 30), vy: -inp.y * 160 + rand(-30, 30), life: 0.35, max: 0.35, size: rand(1, 2.5), g: 0, kind: 'gas' });
    }
  } else if (moving && onFloor) {
    p.puffT -= dt;
    if (p.puffT <= 0) {
      p.puffT = 0.12;
      particles.push({ x: p.x, y: p.y - p.z, vx: rand(-20, 20), vy: rand(-20, -5), life: 0.4, max: 0.4, size: 1.5, g: 0, kind: 'dust' });
    }
  }
  const nx = clamp(p.x + p.vx * dt, BORDER + 20, WORLD - BORDER - 20);
  const ny = clamp(p.y + p.vy * dt, BORDER + 20, WORLD - BORDER - 20);
  const lim = p.z + 12;
  if (floorZ(nx, ny) <= lim) { p.x = nx; p.y = ny; }
  else if (floorZ(nx, p.y) <= lim) { p.x = nx; p.vy = 0; }
  else if (floorZ(p.x, ny) <= lim) { p.y = ny; p.vx = 0; }
  else { p.vx = 0; p.vy = 0; }
  const fl = floorZ(p.x, p.y);
  if (fly) p.z = lerp(p.z, p.anchor.z + 25, 1 - Math.exp(-3.5 * dt));
  else p.z -= stats.glide * dt;
  p.z = Math.max(p.z, fl);
  if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
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
    if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y - p.z + 4, vx: -p.vx * 0.2, vy: -p.vy * 0.2, life: 0.3, max: 0.3, size: rand(1, 2), g: 0, kind: 'gas' });
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
      killTitan(t);
      if (stats.chain && game.time - p.lastChain > 2 && state === 'play') {
        let next = null, bd = stats.engage;
        for (const o of titans) {
          if (o.dying) continue;
          const d = Math.hypot(o.x - p.x, o.y - p.y);
          if (d < bd) { bd = d; next = o; }
        }
        if (next) {
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
  p.x = clamp(p.x, BORDER + 20, WORLD - BORDER - 20);
  p.y = clamp(p.y, BORDER + 20, WORLD - BORDER - 20);
  if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
}

function updateTitans(dt) {
  const diff = difficulty();
  const p = player;
  for (const t of titans) {
    t.flash = Math.max(0, t.flash - dt);
    if (t.dying) {
      t.dying += dt;
      if (t.dying > 0.7 && Math.random() < dt * 30) steam(t.x + t.fallDir * t.H * rand(0.1, 0.9), t.y - rand(0, 30), 1, 12);
      continue;
    }
    if (t.stun > 0) {
      t.stun -= dt;
      continue;
    }
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
    const speed = t.speed * (1 + diff * 0.6) * (t.prey ? 1.3 : 1);
    if (t.state !== 'eat') t.face += clamp(wrapAngle(to - t.face), -turn * dt, turn * dt);
    const reach = reachOf(t);
    const pto = Math.atan2(p.y - t.y, p.x - t.x);
    if (t.state === 'walk') {
      if (d > reach * (t.prey ? 0.3 : 0.6)) {
        t.x += dx / d * speed * dt;
        t.y += dy / d * speed * dt;
        t.phase += dt * speed / t.H * 9;
      }
      if (t.prey && d < reach * 0.6) {
        t.state = 'eat';
        t.grabT = 0;
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
      }
    } else if (t.state === 'eat') {
      t.grabT += dt;
      const k = Math.min(1, t.grabT / 1.1);
      t.hand = { x: lerp(t.eatFrom.x, t.x + Math.cos(t.face) * t.H * 0.05, k), y: lerp(t.eatFrom.y, t.y + Math.sin(t.face) * t.H * 0.05, k), z: lerp(5, t.H * (t.g.headC - t.g.head * 0.4), k) };
      if (t.grabT >= 1.1 && t.held >= 0) {
        t.held = -1;
        game.lost++;
        burst(t.hand.x, t.hand.y - t.hand.z, 14, '#a32222');
        splat(t.x, t.y, 5);
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
        for (let i = 0; i < 6; i++) particles.push({ x: t.hand.x + rand(-15, 15), y: t.hand.y - t.hand.z + rand(-10, 10), vx: rand(-60, 60), vy: rand(-60, 0), life: 0.4, max: 0.4, size: 1.5, g: 200, kind: 'dust' });
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
    t.x = clamp(t.x, BORDER + 40, WORLD - BORDER - 40);
    t.y = clamp(t.y, BORDER + 40, WORLD - BORDER - 40);
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
  titans = titans.filter(t => !t.dying || t.dying < 3.2);
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
    const nx = clamp(c.x + vx * dt, BORDER + 30, WORLD - BORDER - 30), ny = clamp(c.y + vy * dt, BORDER + 30, WORLD - BORDER - 30);
    if (floorZ(nx, ny) > 0) {
      if (floorZ(nx, c.y) === 0) c.x = nx;
      else if (floorZ(c.x, ny) === 0) c.y = ny;
      else { c.tx = c.x + rand(-200, 200); c.ty = c.y + rand(-200, 200); }
    } else {
      c.x = nx;
      c.y = ny;
    }
    if (vx || vy) {
      c.phase += dt * Math.hypot(vx, vy) * 0.12;
      if (Math.abs(vx) > 5) c.face = Math.sign(vx);
    }
  }
  civs = civs.filter(c => !c.dead);
  if (faction.civs) {
    game.civT -= dt;
    if (game.civT <= 0 && civs.length < faction.civs) {
      game.civT = 2;
      const s = freeSpot(viewW() * 0.6);
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
    if (r.x < BORDER + 100 || r.x > WORLD - BORDER - 100) r.vx = -r.vx;
    if (r.y < BORDER + 100 || r.y > WORLD - BORDER - 100) r.vy = -r.vy;
    r.x = clamp(r.x, BORDER + 100, WORLD - BORDER - 100);
    r.y = clamp(r.y, BORDER + 100, WORLD - BORDER - 100);
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
  flocks = flocks.filter(f => f.life > 0);
  if (flocks.length < (faction.map === 'field' ? 10 : 5) && Math.random() < dt * 0.5) spawnFlock(player);
  for (const fl of flares) {
    fl.life -= dt;
    if (fl.vz > 0) {
      fl.z += fl.vz * dt;
      fl.vz -= 150 * dt;
      particles.push({ x: fl.x + rand(-3, 3), y: fl.y - fl.z, vx: rand(-10, 10), vy: rand(-10, 10), life: 1.2, max: 1.2, size: rand(2, 4), g: -5, kind: 'flare', color: fl.color });
    }
  }
  flares = flares.filter(f => f.life > 0);
  for (const e of emitters) {
    if (Math.abs(e.x - player.x) > viewW() || Math.abs(e.y - player.y) > viewH()) continue;
    e.t -= dt;
    if (e.t <= 0) {
      e.t = e.chimney ? rand(0.35, 0.7) : rand(0.12, 0.3);
      const life = rand(2, 3.5);
      particles.push({ x: e.x + rand(-6, 6), y: e.y - e.z - 6, vx: rand(5, 25), vy: rand(-50, -25), life, max: life, size: e.chimney ? rand(2, 4) : rand(3, 7), g: -6, kind: 'smoke' });
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

function updateWeapons(dt) {
  if (stats.spin > 0) {
    game.spinT -= dt;
    if (game.spinT <= 0) {
      const rad = 120 + stats.spin * 35;
      rings.push({ x: player.x, y: player.y, r: rad, life: 0.35, color: '#dfe8f0' });
      for (let i = 0; i < 4; i++) slashes.push({ x: player.x, y: player.y - player.z, ang: i * Math.PI / 2, life: 0.22, big: true });
      for (const t of titans) {
        if (!t.dying && Math.hypot(t.x - player.x, t.y - player.y) < rad + t.H * 0.1 && player.z >= reqZ(t) * 0.6) killTitan(t);
      }
      game.spinT = Math.max(2.5, 7 - stats.spin);
    }
  }
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
  for (const c of clouds.concat(fogs)) {
    c.x += c.v * dt;
    if (c.x - c.rx > WORLD) c.x = -c.rx;
  }
  player.prevT = Math.max(0, player.prevT - dt);
  player.ropeT += dt;
  player.lowT = Math.max(0, player.lowT - dt);
}

function updateCamera(dt) {
  const vw = viewW(), vh = viewH();
  const k = 1 - Math.exp(-dt * 5);
  cam.x = clamp(lerp(cam.x, player.x - vw / 2, k), -100, WORLD - vw + 100);
  cam.y = clamp(lerp(cam.y, player.y - player.z * 0.5 - vh / 2 - 40, k), -250, WORLD - vh + 100);
}

function update(dt) {
  if (state === 'play') {
    if (game.hitstop > 0) { game.hitstop -= dt; return; }
    game.time += dt;
    if (!game.endless && game.time >= WIN_TIME) {
      state = 'win';
      finishRun(true);
      return;
    }
    if (player.mode === 'attack') updateAttack(dt);
    else updateFly(dt);
    player.inv = Math.max(0, player.inv - dt);
    player.engageCd = Math.max(0, player.engageCd - dt);
    updateTitans(dt);
    updateLife(dt);
    updateWeapons(dt);
    game.spawnT -= dt;
    if (game.spawnT <= 0) {
      const alive = titans.filter(t => !t.dying).length;
      const room = Math.min(faction.cap, faction.base + Math.floor(game.time * faction.per)) - alive;
      const group = 1 + Math.floor(difficulty() * (faction.group - 1) + 0.0001);
      let first = null;
      for (let i = 0; i < Math.min(room, group); i++) {
        const pos = spawnTitan(first && { x: first.x + rand(-200, 200), y: first.y + rand(-200, 200) });
        if (!first) first = pos;
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
  }
  game.shake = Math.max(0, game.shake - dt * 40);
}

function titanFrame(t, view, f) {
  const hp = t.hp, G = t.g;
  const w = Math.round(hp * (G.tw + 0.2)) + 10, h = hp + 12;
  const [c, g] = makeCanvas(w, h);
  const cx = Math.floor(w / 2), by = h - 3;
  const sk = t.skin, lt = shade(sk, 1.1), dk = shade(sk, 0.84), dd = shade(sk, 0.68);
  const bob = f % 2;
  const twp = Math.round(hp * G.tw);
  const legH = Math.round(hp * G.leg), legW = Math.max(3, Math.round(twp * 0.36));
  const hip = by - legH;
  if (view === 'side') {
    const st = Math.max(1, Math.round(hp * 0.045)) * [1, 0, -1, 0][f];
    const lx = cx - (legW >> 1);
    rect(g, lx - st, hip, legW, legH, dd);
    rect(g, lx - st, by - 1, legW + 2, 2, shade(sk, 0.6));
    rect(g, lx + st, hip, legW, legH, sk);
    rect(g, lx + st + legW - 1, hip, 1, legH, dk);
    rect(g, lx + st, hip + Math.round(legH * 0.45), legW, 1, dk);
    rect(g, lx + st, by - 1, legW + 2, 2, dk);
  } else {
    const lift = Math.max(1, Math.round(hp * 0.025));
    const xs = [cx - Math.round(twp * 0.44), cx + Math.round(twp * 0.44) - legW + 1];
    xs.forEach((lx, i) => {
      const up = (f === 1 && i === 0) || (f === 3 && i === 1) ? lift : 0;
      rect(g, lx, hip, legW, legH - up, sk);
      rect(g, lx + legW - 1, hip, 1, legH - up, dk);
      rect(g, lx, hip, 1, legH - up, lt);
      rect(g, lx, hip + Math.round(legH * 0.45), legW, 1, dk);
      rect(g, lx - 1 + i * 2, by - up - 2, legW, 2, sk);
      rect(g, lx - 1 + i * 2, by - up - 1, legW, 1, dk);
    });
  }
  const th = Math.round(hp * G.th);
  const top = hip - th + bob + 1;
  const tw = view === 'side' ? Math.round(twp * 0.7) : twp;
  const tx = cx - (tw >> 1);
  roundRect(g, tx, top, tw, th, Math.max(2, Math.round(hp * 0.05)), sk);
  if (G.belly) {
    if (view === 'side') disc(g, cx + Math.round(tw * 0.35), top + Math.round(th * 0.68), Math.round(tw * 0.35), Math.round(th * 0.28), sk);
    else disc(g, cx, top + Math.round(th * 0.7), Math.round(tw * 0.55), Math.round(th * 0.28), sk);
  }
  rect(g, tx + tw - 3, top + 2, 3, th - 4, dk);
  rect(g, tx + tw - 1, top + 3, 1, th - 6, dd);
  rect(g, tx + 1, top + 3, 1, th - 6, lt);
  if (view !== 'side') for (let i = 0; i < 3; i++) {
    const ry = top + Math.round(th * (0.3 + i * 0.1));
    rect(g, tx + 2, ry, Math.max(2, Math.round(tw * 0.18)), 1, dk);
    rect(g, tx + tw - 2 - Math.max(2, Math.round(tw * 0.18)), ry, Math.max(2, Math.round(tw * 0.18)), 1, dd);
  }
  rect(g, tx + 2, top + th - 2, tw - 4, 1, dk);
  if (view === 'front') {
    line(g, tx + 2, top + Math.round(th * 0.28), cx - 1, top + Math.round(th * 0.36), 1, dk);
    line(g, tx + tw - 3, top + Math.round(th * 0.28), cx + 1, top + Math.round(th * 0.36), 1, dk);
    if (G.belly) line(g, cx - Math.round(tw * 0.4), top + Math.round(th * 0.92), cx + Math.round(tw * 0.4), top + Math.round(th * 0.92), 1, dk);
    else {
      rect(g, cx, top + Math.round(th * 0.42), 1, Math.round(th * 0.4), dk);
      for (let i = 1; i <= 2; i++) rect(g, cx - Math.round(tw * 0.15), top + Math.round(th * (0.45 + i * 0.13)), Math.round(tw * 0.3) + 1, 1, dk);
    }
    rect(g, cx, top + Math.round(th * 0.8), 1, 1, dd);
    if (t.old) for (let i = 0; i < 3; i++) rect(g, tx + 3, top + Math.round(th * (0.4 + i * 0.1)), Math.round(tw * 0.25), 1, dk);
  } else if (view === 'back') {
    rect(g, cx, top + 2, 1, th - 4, dk);
    line(g, tx + 3, top + 3, tx + 3 + Math.round(tw * 0.2), top + Math.round(th * 0.35), 1, dk);
    line(g, tx + tw - 4, top + 3, tx + tw - 4 - Math.round(tw * 0.2), top + Math.round(th * 0.35), 1, dk);
  } else {
    rect(g, tx + tw - 3, top + Math.round(th * 0.25), 1, Math.round(th * 0.15), dd);
  }
  const nw = Math.max(3, Math.round(hp * 0.08)), nh = Math.max(2, Math.round(hp * G.neck) + 1);
  rect(g, cx - (nw >> 1), top - nh + 1, nw, nh, sk);
  rect(g, cx - (nw >> 1) + nw - 1, top - nh + 1, 1, nh, dk);
  const hr = Math.max(6, Math.round(hp * G.head));
  const hx = cx + (view === 'side' ? Math.round(hr * 0.15) : 0), hy = top - nh - hr + 2;
  if (view !== 'side') {
    rect(g, hx - hr - 2, hy - 1, 3, 4, sk);
    rect(g, hx + hr, hy - 1, 3, 4, sk);
    rect(g, hx - hr - 1, hy, 1, 2, dd);
    rect(g, hx + hr + 1, hy, 1, 2, dd);
  }
  disc(g, hx + 1, hy + 1, hr, hr + 1, dk);
  disc(g, hx, hy, hr, hr + 1, sk);
  drawHead(g, t, view, hx, hy, hr, top - nh, cx);
  return outlineCanvas(c, OUTLINE);
}

function drawHead(g, t, view, hx, hy, hr, neckY, cx) {
  const sk = t.skin, lt = shade(sk, 1.12), dk = shade(sk, 0.84), dd = shade(sk, 0.68);
  const hair = t.hair, hl = shade(hair, 1.6);
  const rowW = y => Math.round(hr * Math.sqrt(Math.max(0, 1 - (y * y) / ((hr + 1) * (hr + 1)))));
  const st = t.style;
  if (st === 0) rect(g, hx - Math.round(hr * 0.5), hy - Math.round(hr * 0.65), 2, 1, lt);
  else {
    const capEnd = view === 'back' ? Math.round(hr * (st === 2 ? 1.0 : 0.55)) : -Math.round(hr * (st === 4 ? 0.3 : 0.42));
    g.fillStyle = hair;
    for (let y = -hr - 1; y <= capEnd; y++) {
      const rw = rowW(y) + 1;
      g.fillRect(hx - rw, hy + y, rw * 2 + 1, 1);
    }
    if (view === 'side') {
      for (let y = capEnd; y <= Math.round(hr * (st === 2 ? 1.1 : 0.5)); y++) {
        const rw = rowW(y) + 1;
        g.fillRect(hx - rw, hy + y, Math.max(1, Math.round(rw * 0.75)), 1);
      }
    }
    if (view === 'front') {
      const fw = rowW(capEnd);
      for (let x = hx - fw; x <= hx + fw; x += 2) rect(g, x, hy + capEnd + 1, 1, 1 + ((x * 7) % 3 === 0 ? 1 : 0), hair);
      if (st === 2) {
        rect(g, hx - hr - 2, hy + capEnd, 3, Math.round(hr * 1.5), hair);
        rect(g, hx + hr, hy + capEnd, 3, Math.round(hr * 1.5), hair);
      }
    }
    if (view === 'back' && st === 2) rect(g, hx - Math.round(hr * 0.8), hy + capEnd, Math.round(hr * 1.6) + 1, Math.round(hr * 0.6), hair);
    if (st === 3) disc(g, hx - (view === 'side' ? Math.round(hr * 0.5) : 0), hy - hr - Math.round(hr * 0.15), Math.round(hr * 0.38), Math.round(hr * 0.32), hair);
    if (st === 4) for (let x = hx - hr + 1; x < hx + hr; x += 2) rect(g, x, hy - hr - 2 - ((x * 13) % 3), 1, 2 + ((x * 13) % 3), hair);
    for (let x = hx - Math.round(hr * 0.6); x < hx + Math.round(hr * 0.2); x += 2) rect(g, x, hy - hr + 1, 1, 1, hl);
  }
  const ink = '#140c0c', white = '#f6f2ea', lip = '#3a1214', tooth = '#f2ead8';
  const es = Math.max(1, Math.round(hr * 0.17)), ey = hy - Math.round(hr * 0.1);
  if (view === 'front') {
    const ex = Math.max(2, Math.round(hr * 0.42));
    for (const s of [-1, 1]) {
      const x = hx + s * ex;
      if (t.eyes !== 'dot') rect(g, x - es - 2, ey - es - 2, es * 2 + 5, es * 2 + 4, shade(sk, 0.6));
      if (t.eyes === 'wide') {
        rect(g, x - es - 1, ey - es - 1, es * 2 + 3, es * 2 + 3, dd);
        rect(g, x - es, ey - es, es * 2 + 1, es * 2 + 1, white);
        rect(g, x, ey, 1, 1, ink);
      } else if (t.eyes === 'dot') {
        rect(g, x - (es >> 1), ey - (es >> 1), Math.max(1, es), Math.max(1, es), ink);
        if (es > 1) rect(g, x - (es >> 1), ey - (es >> 1), 1, 1, '#ffffff');
      } else if (t.eyes === 'sleepy') {
        rect(g, x - es, ey, es * 2 + 1, Math.max(1, es), white);
        rect(g, x - es - 1, ey - 1, es * 2 + 3, 1, dd);
        rect(g, x - s, ey, 1, Math.max(1, es), ink);
      } else {
        disc(g, x, ey, es + 1, es + 1, white);
        disc(g, x, ey, Math.max(1, es - 1), Math.max(1, es - 1), t.iris);
        rect(g, x, ey, 1, 1, ink);
        rect(g, x - 1, ey - 1, 1, 1, '#ffffff');
      }
      if (t.angry) line(g, x - s * (es + 2), ey - es - 3, x + s * (es + 1), ey - es - 1, 1, shade(hair, 0.9));
      else rect(g, x - es - 1, ey - es - 3, es * 2 + 3, 1, shade(hair, 0.9));
      if (t.old) rect(g, x - es, ey + es + 2, es * 2, 1, dk);
      if (t.blush) rect(g, x - s, ey + es + 2, 3, 1, '#e8857a');
    }
    const ny = hy + Math.round(hr * 0.22);
    rect(g, hx + 1, ey + 1, 1, ny - ey, dk);
    rect(g, hx - 1, ny, 3, 1, dk);
    rect(g, hx - 1, ny, 1, 1, dd);
    rect(g, hx + 1, ny, 1, 1, dd);
    rect(g, hx - 1, ey + 2, 1, ny - ey - 2, lt);
    const my = hy + Math.round(hr * 0.55), mw = Math.round(hr * (t.mouth === 'grin' || t.mouth === 'lipless' ? 0.86 : 0.55));
    if (t.mouth === 'grin') {
      rect(g, hx - mw, my, mw * 2 + 1, 1, lip);
      rect(g, hx - mw + 1, my - 1, mw * 2 - 1, 1, tooth);
      for (let x = hx - mw + 2; x < hx + mw; x += 2) rect(g, x, my - 1, 1, 1, '#bdb29e');
      rect(g, hx - mw - 1, my - 1, 1, 1, lip);
      rect(g, hx + mw + 1, my - 1, 1, 1, lip);
      rect(g, hx - mw - 2, my - 2, 1, 1, dd);
      rect(g, hx + mw + 2, my - 2, 1, 1, dd);
      rect(g, hx - mw + 1, my + 1, mw * 2 - 1, 1, dk);
    } else if (t.mouth === 'open') {
      disc(g, hx, my + 1, Math.max(2, mw), Math.max(1, Math.round(hr * 0.22)), lip);
      rect(g, hx - mw + 1, my + 1 - Math.round(hr * 0.22), mw * 2 - 1, 1, tooth);
      rect(g, hx - 1, my + Math.round(hr * 0.15), 3, 1, '#b5424a');
    } else if (t.mouth === 'smirk') {
      line(g, hx - mw, my, hx + mw, my - 1, 1, lip);
      rect(g, hx + mw + 1, my - 2, 1, 1, lip);
      rect(g, hx - mw + 1, my + 1, mw * 2 - 1, 1, dk);
    } else {
      rect(g, hx - mw - 1, my - 2, mw * 2 + 3, 5, '#a8454a');
      rect(g, hx - mw, my - 1, mw * 2 + 1, 1, tooth);
      rect(g, hx - mw, my + 1, mw * 2 + 1, 1, tooth);
      rect(g, hx - mw, my, mw * 2 + 1, 1, lip);
      for (let x = hx - mw + 1; x < hx + mw; x += 2) {
        rect(g, x, my - 1, 1, 1, '#bdb29e');
        rect(g, x, my + 1, 1, 1, '#bdb29e');
      }
    }
    if (t.beard) {
      rect(g, hx - mw, my - 2, mw * 2 + 1, 1, hair);
      for (let y = my + 2; y <= hy + hr + 1; y++) {
        const rw = rowW(y - hy);
        if (rw > 0) g.fillStyle = hair, g.fillRect(hx - rw, y, rw * 2 + 1, 1);
      }
    }
  } else if (view === 'side') {
    const x = hx + Math.round(hr * 0.5);
    rect(g, x - es - 1, ey - es - 1, es * 2 + 3, es * 2 + 2, shade(sk, 0.6));
    if (t.eyes === 'dot') rect(g, x, ey, Math.max(1, es), Math.max(1, es), ink);
    else {
      rect(g, x - es + 1, ey - es + 1, es * 2, es * 2, white);
      rect(g, x + es - (es > 1 ? 1 : 0), ey, 1, Math.max(1, es), ink);
      if (t.eyes === 'sleepy') rect(g, x - es + 1, ey - es + 1, es * 2, es, dd);
    }
    if (t.angry) line(g, x - es, ey - es - 3, x + es + 1, ey - es - 1, 1, shade(hair, 0.9));
    else rect(g, x - es, ey - es - 2, es * 2 + 2, 1, shade(hair, 0.9));
    const nl = Math.max(2, Math.round(hr * 0.3));
    rect(g, hx + hr, ey + 1, 2, nl, sk);
    rect(g, hx + hr + 1, ey + nl, 1, 1, dd);
    rect(g, hx - Math.round(hr * 0.25), hy - 1, 3, 4, dk);
    rect(g, hx - Math.round(hr * 0.25) + 1, hy, 1, 2, dd);
    const my = hy + Math.round(hr * 0.55), m0 = hx + Math.round(hr * 0.15), m1 = hx + hr;
    if (t.mouth === 'open') {
      rect(g, m0 + 2, my - 1, m1 - m0 - 1, Math.max(2, Math.round(hr * 0.3)), lip);
      rect(g, m0 + 2, my - 1, m1 - m0 - 1, 1, tooth);
    } else if (t.mouth === 'lipless') {
      rect(g, m0, my - 2, m1 - m0 + 1, 5, '#a8454a');
      rect(g, m0 + 1, my - 1, m1 - m0, 1, tooth);
      rect(g, m0 + 1, my + 1, m1 - m0, 1, tooth);
      rect(g, m0 + 1, my, m1 - m0, 1, lip);
    } else {
      rect(g, m0, my, m1 - m0 + 1, 1, lip);
      if (t.mouth === 'grin') {
        rect(g, m0 + 1, my - 1, m1 - m0, 1, tooth);
        for (let xx = m0 + 2; xx < m1; xx += 2) rect(g, xx, my - 1, 1, 1, '#bdb29e');
      }
      rect(g, m0 - 1, my - 1, 1, 1, lip);
    }
    if (t.beard) {
      for (let y = my + 2; y <= hy + hr + 1; y++) {
        const rw = rowW(y - hy);
        if (rw > 0) rect(g, hx - Math.round(rw * 0.3), y, Math.round(rw * 1.3) + 1, 1, hair);
      }
    }
  }
  if (view !== 'front') {
    const nm = Math.max(3, Math.round(t.hp * 0.07));
    const nx = view === 'back' ? cx - (nm >> 1) : hx - Math.round(hr * 0.95);
    rect(g, nx, neckY - 1, nm, Math.max(2, Math.round(nm * 0.7)), '#8e2a2a');
    rect(g, nx, neckY - 1, nm, 1, '#b84040');
  }
}

function titanView(t) {
  const fy = Math.sin(t.face);
  if (fy > 0.6) return ['front', 1];
  if (fy < -0.6) return ['back', 1];
  return ['side', Math.cos(t.face) >= 0 ? 1 : -1];
}

function titanSprite(t, view, f) {
  return t.spr[view][f] || (t.spr[view][f] = titanFrame(t, view, f));
}

let camA = { x: 0, y: 0 }, shk = { x: 0, y: 0 };
const sx = x => Math.round(x / ART) - camA.x + shk.x;
const sy = (y, z) => Math.round((y - z) / ART) - camA.y + shk.y;

function blit(img, x, y, mirror) {
  if (!mirror) {
    bctx.drawImage(img, x, y);
    return;
  }
  bctx.save();
  bctx.translate(x + img.width, y);
  bctx.scale(-1, 1);
  bctx.drawImage(img, 0, 0);
  bctx.restore();
}

function drawArm(x0, y0, x1, y1, w, skin, open) {
  line(bctx, x0, y0, x1, y1, w + 2, OUTLINE);
  line(bctx, x0, y0, x1, y1, w, skin);
  if (w > 2) line(bctx, x0 + 1, y0 + 1, x1 + 1, y1 + 1, 1, shade(skin, 0.82));
  const hw = Math.max(2, Math.round(w * (open ? 0.9 : 0.7)));
  disc(bctx, x1, y1, hw + 1, hw + 1, OUTLINE);
  disc(bctx, x1, y1, hw, hw, skin);
  if (open) {
    for (let i = -1; i <= 1; i++) {
      const a = Math.atan2(y1 - y0, x1 - x0) + i * 0.5;
      line(bctx, x1, y1, x1 + Math.cos(a) * (hw + 2), y1 + Math.sin(a) * (hw + 2), 1, shade(skin, 0.9));
    }
  }
}

function drawTitanDecals(t) {
  const x = sx(t.x), y = sy(t.y, 0), hp = t.hp;
  disc(bctx, x, y, Math.round(hp * Math.max(0.2, t.g.tw * 0.7)), Math.max(2, Math.round(hp * 0.07)), 'rgba(25, 15, 35, 0.32)');
  const targeted = player.target === t;
  const dist = Math.hypot(player.x - t.x, player.y - t.y);
  if (targeted || dist < 600) {
    const R = orbitR(t) / ART, back = t.face + Math.PI;
    const ok = targeted || player.z >= reqZ(t);
    bctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let a = 0; a < Math.PI * 2; a += 5 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R), 1, 1);
    bctx.fillStyle = ok ? (targeted ? '#ffd36e' : 'rgba(255, 211, 110, 0.75)') : 'rgba(150, 140, 160, 0.6)';
    for (let a = back - 0.35; a <= back + 0.35; a += 0.8 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R) - 1, Math.round(y + Math.sin(a) * R) - 1, 2, 2);
  }
  if (t.state === 'grab') {
    const k = Math.min(1, t.grabT / grabWind(t)), reach = reachOf(t) / ART;
    bctx.fillStyle = `rgba(229, 72, 77, ${(0.15 + 0.3 * k).toFixed(2)})`;
    bctx.beginPath();
    bctx.moveTo(x, y);
    bctx.arc(x, y, reach, t.grabAng - 0.65, t.grabAng + 0.65);
    bctx.closePath();
    bctx.fill();
    bctx.fillStyle = '#e5484d';
    for (let a = t.grabAng - 0.65; a <= t.grabAng + 0.65; a += 1.5 / reach) bctx.fillRect(Math.round(x + Math.cos(a) * reach), Math.round(y + Math.sin(a) * reach), 1, 1);
  }
}

function drawTitan(t) {
  const [view, f] = titanView(t);
  const frame = t.state === 'walk' && !t.dying ? Math.floor(t.phase / (Math.PI / 2)) & 3 : 0;
  const spr = titanSprite(t, view, frame);
  const x = sx(t.x), y = sy(t.y, 0);
  const cx = Math.floor(spr.width / 2), by = spr.height - 3;
  const mirror = view === 'side' && f < 0;
  if (t.dying) {
    const steps = [0, 0.25, 0.6, 1.0, 1.35, 1.5];
    const ang = t.fallDir * steps[Math.min(5, Math.floor(t.dying / 0.1))];
    bctx.save();
    bctx.globalAlpha = t.dying > 1.4 ? Math.max(0, Math.ceil((1 - (t.dying - 1.4) / 1.6) * 4) / 4) : 1;
    bctx.translate(x, y);
    bctx.rotate(ang);
    if (mirror) bctx.scale(-1, 1);
    bctx.drawImage(t.flash > 0 ? flashOf(spr) : spr, -cx, -by);
    bctx.restore();
    return;
  }
  const hp = t.hp, G = t.g, bob = frame % 2;
  const twp = Math.round(hp * G.tw);
  const shY = y - Math.round(hp * G.shoulder) + bob;
  const armW = Math.max(2, Math.round(hp * (t.type === 'fat' ? 0.08 : t.type === 'lanky' ? 0.05 : 0.065)));
  const armL = Math.round(hp * G.arm);
  const swing = Math.round(Math.sin(t.phase) * hp * 0.04);
  const hand = t.hand ? { x: sx(t.hand.x), y: sy(t.hand.y, t.hand.z) } : null;
  const dk = shade(t.skin, 0.78);
  const open = t.state === 'grab' || t.state === 'recover';
  if (view === 'side') {
    const s0 = x - f * Math.round(twp * 0.2);
    drawArm(s0, shY, s0 - f * Math.round(hp * 0.02) - swing * f, shY + armL, armW, dk, false);
  }
  blit(t.flash > 0 ? flashOf(spr) : spr, x - cx, y - by, mirror);
  if (view === 'side') {
    const s0 = x + f * Math.round(twp * 0.15);
    if (hand) drawArm(s0, shY, hand.x, hand.y, armW, t.skin, open);
    else drawArm(s0, shY, s0 + f * Math.round(hp * 0.02) + swing * f, shY + armL, armW, t.skin, false);
  } else {
    const half = (twp >> 1) + 1;
    for (const s of [-1, 1]) {
      const s0 = x + s * half;
      const reaching = hand && (Math.sign(hand.x - x) || 1) === s;
      if (reaching) drawArm(s0, shY, hand.x, hand.y, armW, t.skin, open);
      else drawArm(s0, shY, s0 + s * Math.round(hp * 0.03), shY + armL + s * swing, armW, view === 'back' ? shade(t.skin, 0.92) : t.skin, false);
    }
  }
  if (hand && t.held >= 0) {
    const cs = CIVS[t.held][Math.floor(performance.now() / 120) & 1];
    bctx.drawImage(cs, hand.x - (cs.width >> 1), hand.y - cs.height + 3);
  }
  if (view !== 'front' && (player.target === t || Math.hypot(player.x - t.x, player.y - t.y) < 450)) {
    const n = nape(t), nm = Math.max(3, Math.round(hp * 0.07)) + 2;
    const on = Math.floor(performance.now() / 150) % 2 === 0;
    if (player.target === t || on) {
      bctx.strokeStyle = player.target === t ? '#ff4040' : player.z >= reqZ(t) ? '#ffb347' : '#8a8296';
      bctx.lineWidth = 1;
      bctx.strokeRect(sx(n.x) - (nm >> 1) - 1.5, sy(n.y, n.z) - (nm >> 1) - 1.5, nm + 2, nm + 1);
    }
  }
}

function drawBuilding(b) {
  bctx.drawImage(b.sprite, sx(b.x) - b.ox, sy(b.y - b.h, 0) - b.oy);
}

function drawTree(t) {
  const s = TREES[t.v];
  const x = sx(t.x), y = sy(t.y, 0);
  const sway = Math.round(Math.sin(performance.now() / 900 + t.seed) * 1.2);
  const crownY = y - Math.round(t.h * 0.8 / ART);
  const tw = 3 + (t.v > 4 ? 1 : 0);
  rect(bctx, x - (tw >> 1) - 1, crownY, tw + 2, y - crownY + 1, '#1d1410');
  rect(bctx, x - (tw >> 1), crownY, tw, y - crownY, '#5b4030');
  rect(bctx, x - (tw >> 1) + tw - 1, crownY, 1, y - crownY, '#3f2c22');
  rect(bctx, x - (tw >> 1) - 1, y - 1, tw + 2, 1, '#5b4030');
  bctx.drawImage(s, x - (s.width >> 1) + sway, crownY - (s.height >> 1));
}

function drawFountain() {
  const x = sx(WORLD / 2), y = sy(WORLD / 2, 0);
  bctx.drawImage(FOUNTAIN, x - 22, y - 26);
  const now = performance.now() / 120;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.7 + now * 0.3;
    bctx.fillStyle = (Math.floor(now) + i) % 3 ? '#8aa0aa' : '#c4d0d4';
    bctx.fillRect(x + Math.round(Math.cos(a) * 9), y - 4 + Math.round(Math.sin(a) * 3), 1, 1);
  }
  for (let i = 0; i < 4; i++) {
    const k = ((now * 0.25 + i / 4) % 1);
    bctx.fillStyle = '#9aaeb6';
    bctx.fillRect(x + Math.round((i - 1.5) * 3 * k), y - 20 + Math.round(-4 * Math.sin(k * Math.PI) + k * 12), 1, 1);
  }
}

function drawCiv(c) {
  const s = CIVS[c.v][Math.floor(c.phase) & 1];
  blit(s, sx(c.x) - (s.width >> 1), sy(c.y, 0) - s.height + 1, c.face < 0);
  if (c.panic > 0.5 && Math.floor(performance.now() / 200 + c.phase) % 3 === 0) rect(bctx, sx(c.x), sy(c.y, 0) - s.height - 3, 1, 2, '#ffffff');
}

function drawRider(r) {
  const s = HORSE[Math.floor(r.phase) & 1];
  disc(bctx, sx(r.x), sy(r.y, 0), 7, 2, 'rgba(25, 15, 35, 0.3)');
  blit(s, sx(r.x) - (s.width >> 1), sy(r.y, 0) - s.height + 1, r.vx < 0);
}

function drawPlayer() {
  const p = player;
  const x = sx(p.x), fz = floorZ(p.x, p.y), gy = sy(p.y, fz), y = sy(p.y, p.z);
  const hgt = p.z - fz;
  disc(bctx, x, gy, Math.max(2, 5 - hgt / 40), Math.max(1, 2 - hgt / 90), 'rgba(25, 15, 35, 0.35)');
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) return;
  let spr;
  const cs = charSprites(p.char);
  if (p.mode === 'attack' && p.phase === 'cut') spr = cs.spin[Math.floor(performance.now() / 40) & 3];
  else if (hgt > 8 || p.mode === 'attack') spr = cs.fly[Math.floor(performance.now() / 110) & 1];
  else spr = cs.stand;
  blit(spr, x - (spr.width >> 1), y - spr.height + 4, p.face < 0);
}

function drawRope(a, alpha, grow) {
  const p = player;
  const x0 = sx(p.x) + p.face * 4, y0 = sy(p.y, p.z) - 6;
  let x1 = sx(a.x), y1 = sy(a.y, a.z);
  if (grow < 1) { x1 = Math.round(lerp(x0, x1, grow)); y1 = Math.round(lerp(y0, y1, grow)); }
  bctx.globalAlpha = alpha;
  line(bctx, x0, y0 + 1, x1, y1 + 1, 1, '#4d5258');
  line(bctx, x0, y0, x1, y1, 1, '#eef1f4');
  rect(bctx, x1 - 1, y1 - 1, 2, 2, '#2a2a2a');
  bctx.globalAlpha = 1;
}

function drawParticles() {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    const x = sx(p.x), y = sy(p.y, 0);
    if (x < -12 || y < -12 || x > bw + 12 || y > bh + 12) continue;
    if (p.kind === 'steam' || p.kind === 'smoke') {
      const r = clamp(Math.round(p.size * (1.5 - a * 0.5)), 1, 10);
      bctx.globalAlpha = Math.ceil(a * 3) / 3 * (p.kind === 'smoke' ? 0.6 : 0.55);
      const img = (p.kind === 'smoke' ? SMOKE : PUFF)[r - 1];
      bctx.drawImage(img, x - r - 1, y - r - 1);
      bctx.globalAlpha = 1;
    } else if (p.kind === 'gas') {
      bctx.globalAlpha = Math.ceil(a * 3) / 3 * 0.7;
      rect(bctx, x, y, Math.round(p.size * (1.5 - a)) + 1, Math.round(p.size * (1.5 - a)) + 1, '#e8edf1');
      bctx.globalAlpha = 1;
    } else if (p.kind === 'dust') {
      bctx.globalAlpha = a * 0.7;
      rect(bctx, x, y, 2, 1, '#cbb893');
      bctx.globalAlpha = 1;
    } else if (p.kind === 'flare') {
      bctx.globalAlpha = Math.ceil(a * 3) / 3;
      rect(bctx, x, y, Math.round(p.size), Math.round(p.size), a > 0.7 ? '#ffffff' : p.color);
      bctx.globalAlpha = 1;
    } else {
      rect(bctx, x, y, p.size, p.size, p.color);
    }
  }
}

function drawSlashes() {
  for (const s of slashes) {
    const k = 1 - s.life / 0.22;
    const R = s.big ? 14 + k * 10 : 8 + k * 5;
    const x = sx(s.x), y = sy(s.y, 0);
    for (let a = -1.3; a <= 1.3 * (0.3 + k); a += 0.12) {
      const ang = s.ang + a;
      rect(bctx, Math.round(x + Math.cos(ang) * R) - 1, Math.round(y + Math.sin(ang) * R * 0.8) - 1, 2, 2, '#ffffff');
      rect(bctx, Math.round(x + Math.cos(ang) * (R - 2)), Math.round(y + Math.sin(ang) * (R - 2) * 0.8), 1, 1, '#9fdcff');
    }
  }
}

function drawWorld() {
  bctx.fillStyle = '#2b2620';
  bctx.fillRect(0, 0, bw, bh);
  bctx.drawImage(ground, -camA.x + shk.x, -camA.y + shk.y);
  for (const d of decals) {
    bctx.globalAlpha = Math.min(1, d.life / 8);
    const x = sx(d.x), y = sy(d.y, 0);
    for (const [px, py, c] of d.pts) rect(bctx, x + px, y + py, 1, 1, c);
  }
  bctx.globalAlpha = 1;
  for (const r of rings) {
    const k = r.life / 0.35, R = r.r / ART * (1.1 - k * 0.3);
    bctx.globalAlpha = Math.ceil(k * 3) / 3;
    bctx.fillStyle = r.color;
    for (let a = 0; a < Math.PI * 2; a += 1.5 / R) bctx.fillRect(Math.round(sx(r.x) + Math.cos(a) * R), Math.round(sy(r.y, 0) + Math.sin(a) * R), 2, 2);
    bctx.globalAlpha = 1;
  }
  for (const t of titans) if (!t.dying) drawTitanDecals(t);

  const vw = viewW(), vh = viewH();
  const inView = (x, y, m) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - 60 && y < cam.y + vh + m;
  const list = [];
  for (const b of buildings) if (inView(b.x + b.w / 2, b.y + b.d, 300 + b.h)) list.push({ k: b.y + b.d, draw: () => drawBuilding(b) });
  for (const t of trees) if (inView(t.x, t.y, 200)) list.push({ k: t.y, draw: () => drawTree(t) });
  for (const t of titans) if (inView(t.x, t.y, t.H + 100)) list.push({ k: t.y, draw: () => drawTitan(t) });
  for (const c of civs) if (inView(c.x, c.y, 40)) list.push({ k: c.y, draw: () => drawCiv(c) });
  for (const r of riders) if (inView(r.x, r.y, 60)) list.push({ k: r.y, draw: () => drawRider(r) });
  if (faction.map === 'city' && inView(WORLD / 2, WORLD / 2, 100)) list.push({ k: WORLD / 2 + 10, draw: drawFountain });
  if (state !== 'menu') list.push({ k: player.y + player.z, draw: drawPlayer });
  list.sort((a, b) => a.k - b.k);
  for (const it of list) it.draw();

  for (const e of emitters) {
    if (e.chimney) continue;
    const x = sx(e.x), y = sy(e.y, e.z);
    if (x < -10 || y < -10 || x > bw + 10 || y > bh + 10) continue;
    for (let i = 0; i < 6; i++) rect(bctx, x + Math.round(rand(-4, 4)), y - Math.round(rand(0, 6)), 1, Math.round(rand(1, 3)), pick(['#ffb347', '#ff7a2a', '#ffe08a', '#e8462a']));
  }

  if (state !== 'menu') {
    if (player.prevAnchor && player.prevT > 0) drawRope(player.prevAnchor, player.prevT / 0.25 * 0.6, 1);
    const grow = Math.min(1, player.ropeT / 0.08);
    if (player.mode === 'fly' && player.anchor) drawRope(player.anchor, 1, grow);
    if (player.mode === 'attack' && player.target) drawRope(nape(player.target), 1, grow);
  }
  drawParticles();
  drawSlashes();

  for (const f of flocks) {
    for (const b of f.birds) {
      const x = sx(f.x + b.ox), y = sy(f.y + b.oy, f.z);
      if (x < -6 || y < -6 || x > bw + 6 || y > bh + 6) continue;
      bctx.drawImage(BIRD[f.fly ? Math.floor(b.p) & 1 : (Math.floor(b.p) % 5 === 0 ? 0 : 1)], x - 3, y - 2);
    }
  }

  for (const c of clouds) {
    const x = sx(c.x), y = sy(c.y, 0), rx = Math.round(c.rx / ART), ry = Math.round(c.ry / ART);
    if (x + rx < 0 || x - rx > bw || y + ry < 0 || y - ry > bh) continue;
    disc(bctx, x, y, rx, ry, 'rgba(8, 10, 20, 0.12)');
  }
  bctx.globalCompositeOperation = 'multiply';
  bctx.fillStyle = faction.map === 'ruins' ? '#c4a49c' : faction.map === 'field' ? '#b8bcc4' : '#b2b8c6';
  bctx.fillRect(0, 0, bw, bh);
  bctx.globalCompositeOperation = 'source-over';
  for (const f of fogs) {
    const x = sx(f.x), y = sy(f.y, 0), rx = Math.round(f.rx / ART), ry = Math.round(f.ry / ART);
    if (x + rx < 0 || x - rx > bw || y + ry < 0 || y - ry > bh) continue;
    disc(bctx, x, y, rx, ry, 'rgba(176, 182, 192, 0.07)');
    disc(bctx, x + rx * 0.2, y - ry * 0.1, rx * 0.6, ry * 0.6, 'rgba(176, 182, 192, 0.05)');
  }
  const now = performance.now() / 1000;
  const falling = faction.map !== 'city';
  for (const m of motes) {
    let x, y;
    if (falling) {
      x = ((m.x * bw + Math.sin(now * 0.6 + m.p) * 10 + now * m.v * 1.5) % bw + bw) % bw;
      y = ((m.y * bh + now * m.v * 4) % bh + bh) % bh;
      bctx.fillStyle = faction.map === 'ruins' && m.p < 1.4 ? '#d8692e' : 'rgba(150, 146, 140, 0.8)';
    } else {
      x = ((m.x * bw + now * m.v) % bw + bw) % bw;
      y = ((m.y * bh + Math.sin(now * 0.7 + m.p) * 6 - now * m.v * 0.4) % bh + bh) % bh;
      bctx.fillStyle = 'rgba(200, 200, 190, 0.35)';
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
  ctx.fillText(text, x + PX, y + PX);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawWorldTexts() {
  ctx.textAlign = 'center';
  ctx.font = font(PX * 7);
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    shadowText(t.text, sx(t.x) * PX, sy(t.y, 0) * PX, t.color);
  }
  ctx.globalAlpha = 1;
}

function panel(x, y, w, h, fill = '#1e1a2b', edge = '#e9e4da') {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - PX, y - PX, w + PX * 2, h + PX * 2);
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + PX, y + PX, w - PX * 2, h - PX * 2);
}

function drawHud() {
  ctx.textBaseline = 'alphabetic';
  const hs = PX * 2;
  for (let i = 0; i < stats.maxHp; i++) ctx.drawImage(i < player.hp ? HEART : HEART_EMPTY, 12 + i * (HEART.width * hs + PX * 2), 12, HEART.width * hs, HEART.height * hs);
  const hero = charById(player.char);
  ctx.textAlign = 'left';
  ctx.font = font(PX * 5);
  shadowText(hero.name, 14 + stats.maxHp * (HEART.width * hs + PX * 2), 12 + PX * 9, RARITY[hero.rarity].color);

  const gx = 14, gy = 12 + HEART.height * hs + PX * 10, gw = PX * 5, gh = PX * 60;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(gx - PX, gy - PX, gw + PX * 2, gh + PX * 2);
  ctx.fillStyle = '#2d2838';
  ctx.fillRect(gx, gy, gw, gh);
  const fill = Math.round(clamp(player.z / MAXZ, 0, 1) * gh / PX) * PX;
  ctx.fillStyle = player.lowT > 0 && Math.floor(player.lowT * 10) % 2 ? '#ff6b6b' : '#8fd3ff';
  ctx.fillRect(gx, gy + gh - fill, gw, fill);
  ctx.fillStyle = '#d6f0ff';
  ctx.fillRect(gx, gy + gh - fill, PX, fill);
  const nt = nearestTitan(stats.engage + 200);
  if (nt) {
    const ry = gy + gh - Math.round(clamp(reqZ(nt) / MAXZ, 0, 1) * gh / PX) * PX;
    ctx.fillStyle = player.z >= reqZ(nt) ? '#7cfc9a' : '#ff6b6b';
    ctx.fillRect(gx - PX * 2, ry - PX, gw + PX * 4, PX * 2);
  }
  ctx.save();
  ctx.translate(gx + gw + PX * 5, gy + gh);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.font = font(PX * 5);
  shadowText('ВЫСОТА', 0, 0, '#cfe3f0');
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = font(PX * 11);
  shadowText(game.endless ? fmtTime(game.time) : `${fmtTime(game.time)} / ${fmtTime(WIN_TIME)}`, W / 2, 14 + PX * 9);
  ctx.font = font(PX * 6, 400);
  shadowText(`Титанов убито: ${game.kills}`, W / 2, 20 + PX * 16);
  if (faction.civs) {
    ctx.textAlign = 'right';
    shadowText(`Горожан погибло: ${game.lost}`, W - 14, 14 + PX * 6, game.lost ? '#ff9a8a' : '#e9e4da');
    ctx.textAlign = 'center';
  }
  if (game.combo > 1 && game.time - game.lastKill < 4) {
    ctx.font = font(PX * 10);
    shadowText(`КОМБО x${game.combo}`, W / 2, 26 + PX * 27, '#ffd27a');
  }
  if (game.time < 16) {
    ctx.font = font(PX * 6, 400);
    shadowText('WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака', W / 2, H - PX * 12, '#e9e4da');
  }

  const bh2 = PX * 3;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(0, H - bh2 - PX, W, bh2 + PX);
  ctx.fillStyle = '#2d3a2f';
  ctx.fillRect(0, H - bh2, W, bh2);
  ctx.fillStyle = '#7fd18b';
  ctx.fillRect(0, H - bh2, Math.round(W * game.xp / game.need / PX) * PX, bh2);
  ctx.fillStyle = '#b8f0c0';
  ctx.fillRect(0, H - bh2, Math.round(W * game.xp / game.need / PX) * PX, PX);
  ctx.textAlign = 'left';
  ctx.font = font(PX * 6);
  shadowText(`УР. ${game.level}`, 12, H - bh2 - PX * 3);

  const cx = W / 2, cy = H / 2;
  for (const t of titans) {
    if (t.dying) continue;
    const tx = sx(t.x) * PX, ty = sy(t.y, t.H * 0.5) * PX;
    if (tx > 0 && tx < W && ty > 0 && ty < H) continue;
    const dx = tx - cx, dy = ty - cy;
    const k = Math.min((W / 2 - 20) / Math.abs(dx || 1), (H / 2 - 20) / Math.abs(dy || 1));
    const ex = cx + dx * k, ey = cy + dy * k, a = Math.atan2(dy, dx), s = PX * 3 + t.H / 60 * PX;
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * (s + PX), ey + Math.sin(a) * (s + PX));
    ctx.lineTo(ex + Math.cos(a + 2.4) * (s + PX), ey + Math.sin(a + 2.4) * (s + PX));
    ctx.lineTo(ex + Math.cos(a - 2.4) * (s + PX), ey + Math.sin(a - 2.4) * (s + PX));
    ctx.fill();
    ctx.fillStyle = t.aberrant ? '#ffb347' : '#e5484d';
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

function cardRects(h = PX * 58) {
  const cw = Math.min(PX * 95, (W - 80) / 3), gap = PX * 7;
  const x0 = (W - (cw * 3 + gap * 2)) / 2, y0 = H / 2 - h / 2 + PX * 8;
  return [0, 1, 2].map(i => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h }));
}

function pointIn(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

const TABS = ['Бой', 'Отряд', 'Призыв'];

function tabRects() {
  const tw = PX * 40, gap = PX * 4, x0 = W / 2 - (tw * 3 + gap * 2) / 2, y = H * 0.17 + PX * 20;
  return TABS.map((_, i) => ({ x: x0 + i * (tw + gap), y, w: tw, h: PX * 11 }));
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

const shadowCache = {};
function silhouette(id) {
  if (!shadowCache[id]) {
    const img = portrait(id);
    const [c, g] = makeCanvas(img.width, img.height, false);
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
    ctx.drawImage(silhouette(id), x, y, size, size);
    ctx.textAlign = 'center';
    ctx.font = font(size * 0.45);
    ctx.fillStyle = '#5a5268';
    ctx.fillText('?', x + size / 2, y + size * 0.68);
  } else ctx.drawImage(img, x, y, size, size);
}

function drawMenu() {
  dim(0.62);
  ctx.textAlign = 'center';
  ctx.font = font(Math.min(PX * 22, W / 11));
  shadowText('АТАКА ТИТАНОВ', W / 2, H * 0.15, '#c0262e');
  ctx.font = font(PX * 8);
  shadowText('S U R V I V O R S', W / 2, H * 0.15 + PX * 11, '#a8a49c');
  tabRects().forEach((r, i) => {
    const on = i === menuTab;
    panel(r.x, r.y, r.w, r.h, on ? '#3a3350' : '#1a1724', on ? '#ffd27a' : '#6a6276');
    ctx.font = font(PX * 6);
    ctx.fillStyle = on ? '#ffd27a' : '#cfd6dc';
    ctx.fillText(TABS[i], r.x + r.w / 2, r.y + PX * 7.5);
  });
  ctx.font = font(PX * 5, 400);
  shadowText('Tab / Q / E — вкладки', W / 2, tabRects()[0].y + PX * 18, 'rgba(255,255,255,0.55)');
  if (menuTab === 0) drawBattleTab();
  else if (menuTab === 1) drawSquadTab();
  else drawGachaTab();
  ctx.textAlign = 'left';
  ctx.font = font(PX * 7);
  shadowText(`Жетоны: ${save.tokens}`, 16, H - PX * 6, '#ffd27a');
  const hero = charById(save.selected);
  ctx.textAlign = 'right';
  shadowText(`${hero.name} ${stars(save.chars[hero.id] || 1)}`, W - 16, H - PX * 6, RARITY[hero.rarity].color);
  if (menuMsgT > 0) {
    ctx.textAlign = 'center';
    ctx.font = font(PX * 7);
    shadowText(menuMsg, W / 2, H - PX * 18, '#ffffff');
  }
}

function drawBattleTab() {
  const rects = cardRects(PX * 82);
  rects.forEach((r, i) => {
    const f = FACTIONS[i], on = i === factionSel;
    const y = r.y - (on ? PX * 3 : 0);
    panel(r.x, y, r.w, r.h, on ? '#2a2638' : '#1a1724', on ? f.color : '#6a6276');
    const em = EMBLEMS[f.id], es = PX * 3;
    ctx.drawImage(em, r.x + r.w / 2 - em.width * es / 2, y + PX * 6, em.width * es, em.height * es);
    ctx.textAlign = 'center';
    ctx.font = font(PX * 7);
    ctx.fillStyle = '#fff';
    ctx.fillText(f.name, r.x + r.w / 2, y + PX * 50);
    ctx.font = font(PX * 6);
    ctx.fillStyle = f.color;
    ctx.fillText(`${f.diff} · жетоны x${[1, 1.5, 2][i]}`, r.x + r.w / 2, y + PX * 58);
    ctx.font = font(PX * 4.5, 400);
    ctx.fillStyle = '#cfd6dc';
    wrap(f.desc, r.w - PX * 10).forEach((l, j) => ctx.fillText(l, r.x + r.w / 2, y + PX * 66 + j * PX * 6));
    const b = bestOf(f);
    if (b > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(`Рекорд: ${fmtTime(b)}`, r.x + r.w / 2, y + r.h - PX * 3);
    }
  });
  const yb = rects[0].y + rects[0].h + PX * 12;
  ctx.textAlign = 'center';
  ctx.font = font(PX * 5, 400);
  shadowText('WASD — летишь на тросах, они поднимают тебя на крыши и деревья. С высоты — Пробел: атака', W / 2, yb, '#e9e4da');
  ctx.font = font(PX * 8);
  if (Math.floor(performance.now() / 500) % 2 === 0) shadowText('← → выбрать, Enter — в бой', W / 2, yb + PX * 14, '#7cfc9a');
}

function squadRects() {
  const size = Math.min(PX * 44, (W - 80) / 5.5), gap = PX * 4, cols = 5;
  const total = cols * size + (cols - 1) * gap, x0 = W / 2 - total / 2, y0 = tabRects()[0].y + PX * 26;
  return CHARS.map((_, i) => ({ x: x0 + (i % cols) * (size + gap), y: y0 + Math.floor(i / cols) * (size + gap + PX * 12), w: size, h: size + PX * 10 }));
}

function drawSquadTab() {
  const rects = squadRects();
  rects.forEach((r, i) => {
    const c = CHARS[i], owned = save.chars[c.id], on = i === squadSel, chosen = save.selected === c.id;
    panel(r.x, r.y, r.w, r.h, on ? '#2f2a40' : '#1a1724', chosen ? '#7cfc9a' : on ? RARITY[c.rarity].color : '#4a4458');
    drawPortrait(c.id, r.x + PX * 3, r.y + PX * 2, r.w - PX * 6, !owned);
    ctx.textAlign = 'center';
    ctx.font = font(PX * 5);
    ctx.fillStyle = owned ? '#fff' : '#6a6276';
    ctx.fillText(owned ? c.name : '???', r.x + r.w / 2, r.y + r.h - PX * 6);
    ctx.font = font(PX * 4, 400);
    ctx.fillStyle = RARITY[c.rarity].color;
    ctx.fillText(owned ? stars(owned) : RARITY[c.rarity].name, r.x + r.w / 2, r.y + r.h - PX * 1.5);
  });
  const c = CHARS[squadSel], owned = save.chars[c.id];
  const last = rects[rects.length - 1];
  const y = last.y + last.h + PX * 12;
  ctx.textAlign = 'center';
  ctx.font = font(PX * 8);
  shadowText(owned ? c.name : 'Не открыт', W / 2, y, owned ? RARITY[c.rarity].color : '#8a8296');
  ctx.font = font(PX * 5.5, 400);
  shadowText(owned ? c.ability : `${RARITY[c.rarity].name} — можно получить во вкладке «Призыв»`, W / 2, y + PX * 9, '#e9e4da');
  ctx.font = font(PX * 5, 400);
  shadowText('Стрелки — выбрать, Enter — взять в бой.   C — скопировать код сохранения, V — вставить код', W / 2, y + PX * 20, 'rgba(255,255,255,0.6)');
}

function drawGachaTab() {
  const pw = Math.min(W - 60, PX * 270), ph = PX * 96, x = W / 2 - pw / 2, y = tabRects()[0].y + PX * 26;
  panel(x, y, pw, ph, '#221d30', '#ffd36e');
  const g = ctx.createLinearGradient(x, y, x, y + ph);
  g.addColorStop(0, 'rgba(255, 207, 58, 0.18)');
  g.addColorStop(1, 'rgba(162, 74, 255, 0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x + PX, y + PX, pw - PX * 2, ph - PX * 2);
  const ps = Math.min(PX * 34, (pw - PX * 170) / 2 - PX * 6);
  drawPortrait('mikasa', x + PX * 5, y + ph / 2 - ps / 2, ps, false);
  drawPortrait('levi', x + pw - PX * 5 - ps, y + ph / 2 - ps / 2, ps, false);
  ctx.textAlign = 'center';
  ctx.font = font(PX * 10);
  shadowText('ПРИЗЫВ РАЗВЕДЧИКОВ', W / 2, y + PX * 16, '#ffd36e');
  ctx.font = font(PX * 5.5, 400);
  shadowText('Сигнальная ракета покажет, кто откликнулся', W / 2, y + PX * 25, '#e9e4da');
  shadowText('★★★★★ 4%   ★★★★ 21%   ★★★ 75%', W / 2, y + PX * 36, '#cfd6dc');
  shadowText(`Эпический гарантирован через ${Math.max(1, 10 - save.pity4)}, легендарный — через ${Math.max(1, 40 - save.pity5)}`, W / 2, y + PX * 45, '#c58cff');
  shadowText('Повтор даёт звезду (+3% скорости), на 5★ — жетоны', W / 2, y + PX * 54, 'rgba(255,255,255,0.6)');
  const bw2 = PX * 70, bh2 = PX * 16, by = y + PX * 66;
  const can1 = save.tokens >= 100, can10 = save.tokens >= 900;
  panel(W / 2 - bw2 - PX * 4, by, bw2, bh2, can1 ? '#2f4a3a' : '#2a2630', can1 ? '#7cfc9a' : '#5a5268');
  panel(W / 2 + PX * 4, by, bw2, bh2, can10 ? '#4a3a20' : '#2a2630', can10 ? '#ffd36e' : '#5a5268');
  ctx.font = font(PX * 6);
  ctx.fillStyle = can1 ? '#fff' : '#6a6276';
  ctx.fillText('[1] Один — 100', W / 2 - bw2 / 2 - PX * 4, by + PX * 10);
  ctx.fillStyle = can10 ? '#fff' : '#6a6276';
  ctx.fillText('[0] Десять — 900', W / 2 + bw2 / 2 + PX * 4, by + PX * 10);
  ctx.font = font(PX * 5, 400);
  shadowText('Жетоны дают за каждый забег: за убийства, время и победу', W / 2, y + ph + PX * 10, 'rgba(255,255,255,0.6)');
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
    ctx.font = font(PX * 10);
    shadowText('ИТОГИ ПРИЗЫВА', W / 2, H * 0.14, '#ffd36e');
    const size = Math.min(PX * 34, (W - 80) / 5.8), gap = PX * 4;
    pullRes.forEach((r, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = W / 2 - (5 * size + 4 * gap) / 2 + col * (size + gap), y = H * 0.22 + row * (size + PX * 22);
      panel(x, y, size, size + PX * 12, '#1a1724', RARITY[r.c.rarity].color);
      drawPortrait(r.c.id, x + PX * 2, y + PX * 2, size - PX * 4, false);
      ctx.font = font(PX * 4.5);
      ctx.fillStyle = '#fff';
      ctx.fillText(r.c.name, x + size / 2, y + size + PX * 4);
      ctx.fillStyle = r.isNew ? '#7cfc9a' : RARITY[r.c.rarity].color;
      ctx.fillText(r.isNew ? 'НОВЫЙ!' : r.refund ? `+${r.refund} жет.` : stars(r.stars), x + size / 2, y + size + PX * 10);
    });
    ctx.font = font(PX * 7);
    if (Math.floor(performance.now() / 500) % 2 === 0) shadowText('Enter — назад', W / 2, H - PX * 14, '#7cfc9a');
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
      const s = Math.max(PX, Math.round((1 - t) * PX * 3));
      ctx.fillRect(Math.round(fx + Math.sin(i * 1.7) * PX * t * 3), Math.round(fy + t * H * 0.35), s, s);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx - PX * 2, fy - PX * 2, PX * 4, PX * 4);
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
    const size = Math.min(H * 0.42, PX * 100);
    const pop = Math.min(1, t / 0.18);
    const sz = size * (0.7 + 0.3 * pop);
    drawPortrait(r.c.id, W / 2 - sz / 2, H * 0.42 - sz / 2, sz, false);
    ctx.font = font(PX * 12);
    shadowText(r.c.name.toUpperCase(), W / 2, H * 0.42 + size / 2 + PX * 16, rar.color);
    ctx.font = font(PX * 7);
    shadowText(`${rar.name} ${stars(r.stars)}`, W / 2, H * 0.42 + size / 2 + PX * 27, rar.color);
    ctx.font = font(PX * 6, 400);
    shadowText(r.isNew ? 'НОВЫЙ БОЕЦ! ' + r.c.ability : r.refund ? `Уже 5★ — возвращено ${r.refund} жетонов` : 'Повтор: +1 звезда', W / 2, H * 0.42 + size / 2 + PX * 37, r.isNew ? '#7cfc9a' : '#e9e4da');
    ctx.font = font(PX * 6);
    if (Math.floor(performance.now() / 500) % 2 === 0) shadowText(`Enter — дальше (${pullIdx + 1}/${pullRes.length})`, W / 2, H - PX * 10, 'rgba(255,255,255,0.7)');
  }
}

function drawLevelUp() {
  dim(0.6);
  ctx.textAlign = 'center';
  ctx.font = font(PX * 14);
  shadowText(`УРОВЕНЬ ${game.level - pendingLevels + 1}!`, W / 2, H / 2 - PX * 42, '#7cfc9a');
  ctx.font = font(PX * 6, 400);
  shadowText('← → выбрать, Enter — взять (или 1 / 2 / 3)', W / 2, H / 2 - PX * 31, '#e9e4da');
  cardRects().forEach((r, i) => {
    const c = choices[i];
    const on = i === sel;
    panel(r.x, r.y - (on ? PX * 2 : 0), r.w, r.h, on ? '#2f4a3a' : '#1e1a2b', on ? '#7cfc9a' : '#8a8296');
    const y = r.y - (on ? PX * 2 : 0);
    ctx.font = font(PX * 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(String(i + 1), r.x + r.w / 2, y + PX * 10);
    ctx.font = font(PX * 7);
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, r.x + r.w / 2, y + PX * 22);
    ctx.font = font(PX * 5, 400);
    ctx.fillStyle = '#cfd6dc';
    wrap(c.desc(stats), r.w - PX * 10).forEach((l, j) => ctx.fillText(l, r.x + r.w / 2, y + PX * 34 + j * PX * 7));
  });
}

function drawOver() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = font(PX * 22);
  shadowText('ТЫ ПАЛ', W / 2, H * 0.32, '#e5484d');
  ctx.font = font(PX * 6, 400);
  shadowText(`${faction.name} · отдай своё сердце…`, W / 2, H * 0.32 + PX * 13, 'rgba(255,255,255,0.7)');
  ctx.font = font(PX * 8);
  shadowText(`Продержался: ${fmtTime(game.time)}   Титанов: ${game.kills}   Уровень: ${game.level}`, W / 2, H * 0.48);
  ctx.font = font(PX * 6, 400);
  shadowText(`Рекорд: ${fmtTime(bestOf(faction))}`, W / 2, H * 0.48 + PX * 12, 'rgba(255,255,255,0.7)');
  ctx.font = font(PX * 8);
  shadowText(`+${game.reward} жетонов`, W / 2, H * 0.48 + PX * 22, '#ffd27a');
  ctx.font = font(PX * 8);
  shadowText('Enter — ещё раз   Esc — выбор фракции', W / 2, H * 0.48 + PX * 32, '#7cfc9a');
}

function drawWin() {
  dim();
  ctx.textAlign = 'center';
  ctx.font = font(PX * 22);
  shadowText(faction.map === 'field' ? 'ВЫЛАЗКА УДАЛАСЬ!' : 'ГОРОД ОТБИТ!', W / 2, H * 0.32, '#7cfc9a');
  ctx.font = font(PX * 6, 400);
  shadowText(`${faction.name} гордится тобой`, W / 2, H * 0.32 + PX * 13, 'rgba(255,255,255,0.7)');
  ctx.font = font(PX * 8);
  shadowText(`Титанов: ${game.kills}   Уровень: ${game.level}${faction.civs ? `   Горожан погибло: ${game.lost}` : ''}`, W / 2, H * 0.48);
  shadowText(`+${game.reward} жетонов`, W / 2, H * 0.48 + PX * 11, '#ffd27a');
  shadowText('Enter — играть дальше без конца', W / 2, H * 0.48 + PX * 24, '#7cfc9a');
  ctx.font = font(PX * 6, 400);
  shadowText('R — новая игра   Esc — выбор фракции', W / 2, H * 0.48 + PX * 36, '#e9e4da');
}

function render() {
  camA.x = Math.round(cam.x / ART);
  camA.y = Math.round(cam.y / ART);
  shk.x = game.shake ? Math.round(rand(-1, 1) * game.shake / ART) : 0;
  shk.y = game.shake ? Math.round(rand(-1, 1) * game.shake / ART) : 0;
  bctx.imageSmoothingEnabled = false;
  drawWorld();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, bw * PX, bh * PX);
  drawWorldTexts();
  if (state !== 'menu' && state !== 'pull') drawHud();
  if (state === 'menu') drawMenu();
  else if (state === 'pull') drawPull();
  else if (state === 'levelup') drawLevelUp();
  else if (state === 'over') drawOver();
  else if (state === 'win') drawWin();
  else if (state === 'paused') {
    dim(0.5);
    ctx.textAlign = 'center';
    ctx.font = font(PX * 16);
    shadowText('ПАУЗА', W / 2, H / 2);
    ctx.font = font(PX * 6, 400);
    shadowText('Esc — продолжить   Q — выйти в меню', W / 2, H / 2 + PX * 12, '#e9e4da');
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
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { factionSel = (factionSel + 2) % 3; reset(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { factionSel = (factionSel + 1) % 3; reset(); }
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) { factionSel = +e.code.slice(5) - 1; reset(); }
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
      const i = cardRects(PX * 82).findIndex(r => pointIn(e.clientX, e.clientY, r));
      if (i >= 0) {
        if (i === factionSel) start();
        else { factionSel = i; reset(); }
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
