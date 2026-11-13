'use strict';

const GEAR_SLOTS = ['blade', 'odm', 'gas', 'cloak', 'boots', 'relic'];
const SLOT_NAMES = { blade: 'Клинки', odm: 'Привод УПМ', gas: 'Газовые баллоны', cloak: 'Плащ', boots: 'Сапоги и ремни', relic: 'Реликвия' };
const GEAR_RAR = [null,
  { name: 'Обычное', col: '#b4b0a8', mul: 1 },
  { name: 'Необычное', col: '#5ac05a', mul: 1.7 },
  { name: 'Редкое', col: '#4a8cff', mul: 2.5 },
  { name: 'Эпическое', col: '#b05aff', mul: 3.6 },
  { name: 'Легендарное', col: '#ffcf3a', mul: 5 },
];

const GEAR = [
  { id: 'blade1', slot: 'blade', name: 'Клинки кадета', fx: { engage: 1.5 }, look: { grip: '#7a5030', blade: '#c8ccd4' } },
  { id: 'blade2', slot: 'blade', name: 'Клинки Разведкорпуса', fx: { engage: 1.2, orbit: 1.2 }, look: { grip: '#3e6a3a', blade: '#e0e4ec' } },
  { id: 'blade3', slot: 'blade', name: 'Зазубренные клинки', fx: { orbit: 2 }, look: { grip: '#4a3a3a', blade: '#9aa0b0', teeth: true } },
  { id: 'blade4', slot: 'blade', name: 'Клинки Леви', fx: { orbit: 1.5, cd: 1 }, look: { grip: '#1e1a20', blade: '#f4f6fa', rev: true } },
  { id: 'odm1', slot: 'odm', name: 'Учебный привод', fx: { speed: 1.5 }, look: { box: '#a87a40', trim: '#6a4a28' } },
  { id: 'odm2', slot: 'odm', name: 'Привод Разведкорпуса', fx: { speed: 1.2, range: 1.2 }, look: { box: '#b8bcc4', trim: '#3e6a3a' } },
  { id: 'odm3', slot: 'odm', name: 'Привод антиличного отряда', fx: { range: 2 }, look: { box: '#3a3a44', trim: '#8a8a96' } },
  { id: 'odm4', slot: 'odm', name: 'Прототип Ханджи', fx: { speed: 1.5, cd: 0.8 }, look: { box: '#6a7a8a', trim: '#5ad8ff', glow: true } },
  { id: 'gas1', slot: 'gas', name: 'Старые баллоны', fx: { glide: 2 }, look: { tank: '#8a8a8a', band: '#5a5a5a' } },
  { id: 'gas2', slot: 'gas', name: 'Баллоны Гарнизона', fx: { glide: 1.5, speed: 0.8 }, look: { tank: '#b03a30', band: '#e0d0b0' } },
  { id: 'gas3', slot: 'gas', name: 'Сдвоенные баллоны', fx: { glide: 2.5 }, look: { tank: '#a8b0b8', band: '#3e6a3a', gauge: true } },
  { id: 'gas4', slot: 'gas', name: 'Баллоны высокого давления', fx: { glide: 2, range: 1 }, look: { tank: '#c8ccd4', band: '#e8b040', gauge: true } },
  { id: 'cloak1', slot: 'cloak', name: 'Плащ кадета', fx: { hp: 1, inv: 4 }, look: { cloth: '#8a6a48', emb: null } },
  { id: 'cloak2', slot: 'cloak', name: 'Плащ Разведкорпуса', fx: { hp: 1, xp: 1 }, look: { cloth: '#3e6a3a', emb: 'wings' } },
  { id: 'cloak3', slot: 'cloak', name: 'Плащ Гарнизона', fx: { heal: 1 }, look: { cloth: '#8a2a28', emb: 'rose' } },
  { id: 'cloak4', slot: 'cloak', name: 'Плащ Военной полиции', fx: { tokens: 3 }, look: { cloth: '#2e4a3a', emb: 'uni' } },
  { id: 'boots1', slot: 'boots', name: 'Сапоги новобранца', fx: { speed: 1, orbit: 0.8 }, look: { leather: '#7a5030' } },
  { id: 'boots2', slot: 'boots', name: 'Ремни УПМ', fx: { orbit: 1.6 }, look: { leather: '#5a3a24', straps: true } },
  { id: 'boots3', slot: 'boots', name: 'Сапоги разведчика', fx: { speed: 1.6 }, look: { leather: '#2a2420' } },
  { id: 'boots4', slot: 'boots', name: 'Сапоги офицера', fx: { orbit: 1, engage: 1 }, look: { leather: '#1a1618', buckle: '#e8c040' } },
  { id: 'relic1', slot: 'relic', name: 'Ключ от подвала', fx: { xp: 3 }, look: { kind: 'key' } },
  { id: 'relic2', slot: 'relic', name: 'Красный шарф', fx: { hp: 1, orbit: 1 }, look: { kind: 'scarf' } },
  { id: 'relic3', slot: 'relic', name: 'Громовое копьё', fx: { cd: 2 }, look: { kind: 'spear' } },
  { id: 'relic4', slot: 'relic', name: 'Сыворотка титана', fx: { heal: 0.8, speed: 1 }, look: { kind: 'serum' } },
];
const gearById = id => GEAR.find(g => g.id === id);
const GEAR_TOTAL = GEAR.length * 5;

function gearSave() {
  if (!save.gear) save.gear = { items: {}, eq: {} };
  return save.gear;
}
const gearKey = (id, r) => id + '_' + r;
function parseGear(key) { const i = key.lastIndexOf('_'); return { m: gearById(key.slice(0, i)), r: +key.slice(i + 1) }; }
function gearOwned() { return Object.keys(gearSave().items).length; }

function grantGear(id, r) {
  const s = gearSave(), k = gearKey(id, r), it = s.items[k];
  if (!it) {
    s.items[k] = { lvl: 1 };
    const cur = s.eq[gearById(id).slot];
    if (!cur || parseGear(cur).r < r) s.eq[gearById(id).slot] = k;
    return { gear: gearById(id), rarity: r, key: k, isNew: true, lvl: 1 };
  }
  if (it.lvl < 5) { it.lvl++; return { gear: gearById(id), rarity: r, key: k, isNew: false, lvl: it.lvl, up: true }; }
  return { gear: gearById(id), rarity: r, key: k, isNew: false, lvl: 5, maxed: true };
}

function gearEffects() {
  const s = gearSave(), tot = {};
  for (const slot of GEAR_SLOTS) {
    const k = s.eq[slot];
    if (!k || !s.items[k]) continue;
    const { m, r } = parseGear(k);
    const lv = s.items[k].lvl, mul = GEAR_RAR[r].mul * (1 + 0.25 * (lv - 1));
    for (const [e, v] of Object.entries(m.fx)) {
      const add = e === 'hp' ? Math.floor(GEAR_RAR[r].mul * 0.4 + (lv >= 5 ? 1 : 0)) : e === 'heal' ? Math.floor(v * mul) : v * mul;
      tot[e] = (tot[e] || 0) + add;
    }
  }
  return tot;
}

function applyGear(st) {
  const t = gearEffects();
  if (t.engage) st.engage *= 1 + t.engage / 100;
  if (t.orbit) st.orbit *= 1 + t.orbit / 100;
  if (t.speed) st.speed *= 1 + t.speed / 100;
  if (t.range) st.range *= 1 + t.range / 100;
  if (t.glide) st.glide *= Math.max(0.4, 1 - t.glide / 100);
  if (t.hp) st.maxHp += t.hp;
  if (t.heal) st.healEvery = Math.max(4, st.healEvery - t.heal);
  if (t.xp) st.xp *= 1 + t.xp / 100;
  if (t.cd) st.cdMul *= Math.max(0.5, 1 - t.cd / 100);
  if (t.inv) st.invMul = 1 + t.inv / 100;
  st.tokenMul = 1 + (t.tokens || 0) / 100;
}

const FX_TEXT = {
  engage: 'Дальность атаки +{0}%', orbit: 'Облёт +{0}%', speed: 'Скорость полёта +{0}%', range: 'Длина тросов +{0}%',
  glide: 'Планирование медленнее на {0}%', hp: '+{0} к сердцам', heal: 'Лечение раньше на {0} убийств', xp: 'Опыт +{0}%',
  cd: 'Перезарядка умений −{0}%', inv: 'Неуязвимость после удара +{0}%', tokens: 'Жетоны за забег +{0}%',
};
function gearFxLines(m, r, lv) {
  const mul = GEAR_RAR[r].mul * (1 + 0.25 * ((lv || 1) - 1));
  return Object.entries(m.fx).map(([e, v]) => {
    const n = e === 'hp' ? Math.floor(GEAR_RAR[r].mul * 0.4 + ((lv || 1) >= 5 ? 1 : 0)) : e === 'heal' ? Math.floor(v * mul) : Math.round(v * mul * 10) / 10;
    return n ? tr(FX_TEXT[e], n) : null;
  }).filter(Boolean);
}

const gearIconCache = {};
function gearIcon(id) {
  if (gearIconCache[id]) return gearIconCache[id];
  if (SPR['gear_' + id]) return (gearIconCache[id] = SPR['gear_' + id]);
  const m = gearById(id), L = m.look;
  const [c, g] = makeCanvas(22, 22, true);
  const steel = L.blade || '#c8ccd4';
  if (m.slot === 'blade') {
    for (const [dx, flip] of [[0, 1], [5, 1]]) {
      const x0 = 3 + dx, y0 = 18, x1 = 15 + dx, y1 = 4;
      pline(g, x0, y0, x0 + 3, y0 - 3, 2, L.grip);
      pline(g, x0 + 3, y0 - 3, x1, y1, 2, steel);
      pline(g, x0 + 4, y0 - 3, x1, y1 + 1, 1, '#ffffff');
      if (L.teeth) for (let i = 0; i < 4; i++) rect(g, x0 + 6 + i * 2, y0 - 7 - i * 2, 1, 1, '#5a5a6a');
      rect(g, x0 + 2, y0 - 4, 3, 1, '#d8b060');
    }
    if (L.rev) { rect(g, 2, 3, 3, 1, '#d8b060'); }
  } else if (m.slot === 'odm') {
    rect(g, 6, 7, 10, 9, L.box);
    rect(g, 6, 7, 10, 2, L.trim);
    rect(g, 7, 10, 3, 3, '#2a2a30');
    rect(g, 12, 10, 3, 3, '#2a2a30');
    disc(g, 8.5, 11.5, 1, 1, L.glow ? '#5ad8ff' : '#d8b060');
    disc(g, 13.5, 11.5, 1, 1, L.glow ? '#5ad8ff' : '#d8b060');
    rect(g, 2, 9, 4, 2, '#8a8a96');
    rect(g, 16, 9, 4, 2, '#8a8a96');
    rect(g, 1, 8, 2, 4, steel);
    rect(g, 19, 8, 2, 4, steel);
    rect(g, 9, 16, 4, 3, L.trim);
  } else if (m.slot === 'gas') {
    for (const x of [5, 12]) {
      rect(g, x, 4, 5, 15, L.tank);
      rect(g, x, 4, 1, 15, '#ffffff');
      rect(g, x + 4, 4, 1, 15, '#00000055');
      rect(g, x, 8, 5, 2, L.band);
      rect(g, x, 15, 5, 2, L.band);
      rect(g, x + 1, 2, 3, 2, '#5a5a66');
    }
    if (L.gauge) { disc(g, 11, 12, 2, 2, '#f0f0e8'); rect(g, 11, 11, 1, 2, '#c03030'); }
  } else if (m.slot === 'cloak') {
    for (let y = 3; y < 20; y++) { const w = 5 + Math.round((y - 3) * 0.45); rect(g, 11 - w, y, w * 2, 1, L.cloth); }
    rect(g, 7, 3, 8, 2, '#00000040');
    for (let y = 6; y < 20; y += 3) rect(g, 6 + (y % 2), y, 1, 2, '#ffffff30');
    if (L.emb === 'wings') { rect(g, 8, 10, 3, 4, '#f0f0f0'); rect(g, 11, 10, 3, 4, '#4a7ac8'); }
    if (L.emb === 'rose') { disc(g, 9, 12, 1.5, 1.5, '#e04050'); disc(g, 13, 12, 1.5, 1.5, '#e04050'); rect(g, 10, 14, 2, 3, '#3e7a3e'); }
    if (L.emb === 'uni') { rect(g, 9, 10, 4, 4, '#f0f0e8'); rect(g, 12, 9, 2, 2, '#e8c040'); }
  } else if (m.slot === 'boots') {
    for (const x of [3, 11]) {
      rect(g, x + 2, 3, 5, 12, L.leather);
      rect(g, x, 14, 8, 4, L.leather);
      rect(g, x, 18, 8, 1, '#1a1210');
      rect(g, x + 3, 3, 1, 11, '#ffffff22');
      if (L.straps) { rect(g, x + 1, 6, 7, 1, '#d8c8a0'); rect(g, x + 1, 10, 7, 1, '#d8c8a0'); }
      if (L.buckle) rect(g, x + 4, 12, 2, 2, L.buckle);
    }
  } else {
    if (L.kind === 'key') { disc(g, 7, 7, 3.5, 3.5, '#8a8478'); disc(g, 7, 7, 1.5, 1.5, '#00000000'); g.clearRect(6, 6, 2, 2); pline(g, 9, 9, 17, 17, 2, '#8a8478'); rect(g, 14, 15, 3, 2, '#8a8478'); rect(g, 12, 13, 2, 3, '#8a8478'); pline(g, 4, 3, 9, 1, 1, '#d8c8a0'); }
    if (L.kind === 'scarf') { for (let i = 0; i < 16; i++) rect(g, 3 + i, 8 + Math.round(Math.sin(i * 0.6) * 3), 2, 4, i % 4 < 2 ? '#c02a30' : '#e0404a'); rect(g, 14, 12, 3, 8, '#c02a30'); rect(g, 17, 13, 2, 7, '#a0242a'); }
    if (L.kind === 'spear') { pline(g, 3, 19, 15, 7, 2, '#6a4a2a'); disc(g, 16, 6, 3, 3, '#5a5a66'); pline(g, 16, 6, 20, 2, 2, '#c8ccd4'); rect(g, 15, 5, 2, 2, '#e04030'); rect(g, 6, 15, 3, 2, '#d8b060'); }
    if (L.kind === 'serum') { rect(g, 8, 4, 6, 12, '#d8f0f8'); rect(g, 9, 7, 4, 8, '#5ae8d0'); rect(g, 7, 3, 8, 2, '#8a8a96'); rect(g, 10, 1, 2, 2, '#8a8a96'); pline(g, 11, 16, 11, 21, 1, '#c8ccd4'); rect(g, 9, 9, 1, 4, '#ffffff'); }
  }
  gearIconCache[id] = outlineCanvas(c, '#140c10');
  return gearIconCache[id];
}

function equipGear(key) {
  const s = gearSave();
  if (!s.items[key]) return false;
  s.eq[parseGear(key).m.slot] = key;
  persist();
  return true;
}
trFields(GEAR_RAR.slice(1), ['name']);
