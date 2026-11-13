'use strict';

const PITY5 = 70, SOFT5 = 50, PITY4 = 10;
const TIER_RATES = [0, 0.44, 0.3, 0.175, 0.07, 0.015];
const PULL_COST = 60, PULL10_COST = 540, PULL100_COST = 4800;
const FEATHER = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 20 };
const GOLD_CHANCE = 0.03;
const FEATURE5 = ['levi', 'mikasa', 'erwin'];
const FEATURE4 = ['eren', 'armin', 'hange', 'historia', 'mike'];
const FEATURE_GEAR = ['blade4', 'relic2', 'odm4', 'relic1', 'relic3', 'gas4'];
const BANNER_TITLES = { levi: 'Сильнейший солдат', mikasa: 'Алый шарф', erwin: 'Отдайте свои сердца' };

function weekIndex() { return Math.floor((Date.now() / 86400000 + 3) / 7); }

function bannerInfo() {
  const w = weekIndex();
  const five = FEATURE5[w % FEATURE5.length];
  const fours = [FEATURE4[w % FEATURE4.length], FEATURE4[(w + 2) % FEATURE4.length]];
  const gear = FEATURE_GEAR[w % FEATURE_GEAR.length];
  const end = ((w + 1) * 7 - 3) * 86400000;
  return { five, fours, gear, title: BANNER_TITLES[five], endsIn: end - Date.now() };
}

function gachaState() {
  if (!save.gacha) save.gacha = { guar: false, history: [], free: '' };
  const g = save.gacha;
  if (!g.chest) g.chest = {};
  return g;
}

function freeAvailable() { return gachaState().free !== todayKey(); }

function rate5() {
  const p = (save.pity5 || 0) + 1;
  if (p >= PITY5) return 1;
  return p > SOFT5 ? TIER_RATES[5] + (p - SOFT5) * 0.05 : TIER_RATES[5];
}

function rollTier() {
  const r5 = rate5();
  save.pity5 = (save.pity5 || 0) + 1;
  save.pity4 = (save.pity4 || 0) + 1;
  let t;
  const x = Math.random();
  if (x < r5) t = 5;
  else if (save.pity4 >= PITY4) t = 4;
  else {
    let acc = r5, y = x;
    t = 1;
    for (const k of [4, 3, 2]) { acc += TIER_RATES[k]; if (y < acc) { t = k; break; } }
  }
  if (t === 5) save.pity5 = 0;
  if (t >= 4) save.pity4 = 0;
  return t;
}

function heroOfTier(t, banner) {
  const g = gachaState(), B = bannerInfo();
  if (t === 5) {
    if (banner === 'event' && (g.guar || Math.random() < 0.5)) { g.guar = false; return { c: charById(B.five), featured: true }; }
    const pool = CHARS.filter(x => x.rarity === 5 && (banner !== 'event' || x.id !== B.five));
    if (banner === 'event') g.guar = true;
    return { c: pool.length ? pick(pool) : charById(B.five) };
  }
  if (t === 4) {
    if (banner === 'event' && Math.random() < 0.5) return { c: charById(pick(B.fours)), featured: true };
    return { c: pick(CHARS.filter(x => x.rarity === 4)) };
  }
  return { c: pick(CHARS.filter(x => x.rarity === 3 && x.id !== 'cadet')) };
}

function rollOne(banner) {
  const t = rollTier(), g = gachaState(), B = bannerInfo();
  const heroP = banner === 'arsenal' ? 0 : { 1: 0, 2: 0, 3: 0.3, 4: 0.45, 5: 0.7 }[t];
  if (Math.random() < heroP) {
    const h = heroOfTier(t, banner);
    const r = grantHero(h.c.id);
    r.kind = 'hero';
    r.rarity = t;
    r.featured = !!h.featured;
    save.golden = save.golden || {};
    if (!save.golden[h.c.id] && Math.random() < GOLD_CHANCE * (t === 5 ? 2 : 1)) { save.golden[h.c.id] = true; r.golden = true; }
    return r;
  }
  if (t <= 2 && Math.random() < 0.22) {
    save.manuals = (save.manuals || 0) + 1;
    return { kind: 'item', item: 'manual', rarity: t, isNew: false };
  }
  let id = pick(GEAR).id, featured = false;
  if (banner === 'arsenal' && t === 5) {
    if (g.guarG || Math.random() < 0.5) { id = B.gear; featured = true; g.guarG = false; }
    else { id = pick(GEAR.filter(x => x.id !== B.gear)).id; g.guarG = true; }
  } else if (banner === 'arsenal' && t === 4 && Math.random() < 0.3) { id = B.gear; featured = true; }
  const r = grantGear(id, t);
  r.kind = 'gear';
  r.featured = featured;
  return r;
}

function gachaPull(n, banner, mode) {
  const g0 = gachaState();
  const cost = mode ? 0 : n === 100 ? PULL100_COST : n === 10 ? PULL10_COST : PULL_COST * n;
  if (mode === 'free' && !freeAvailable()) return null;
  if (mode === 'ticket' && (n === 10 ? (g0.tickets10 || 0) < 1 : tickets() < n)) return null;
  if (save.tokens < cost) return null;
  if (mode === 'free') g0.free = todayKey();
  if (mode === 'ticket') { if (n === 10) g0.tickets10--; else g0.tickets -= n; }
  save.tokens -= cost;
  const res = [];
  for (let i = 0; i < n; i++) res.push(rollOne(banner));
  for (let b = 0; b < n; b += 10) {
    if (n >= 10 && !res.slice(b, b + 10).some(r => r.rarity >= 4)) { save.pity4 = PITY4 - 1; res[b + 9] = rollOne(banner); }
  }
  let fe = 0;
  for (const r of res) { r.feathers = FEATHER[r.rarity] * (r.maxed || (r.kind === 'hero' && !r.isNew && r.stars >= 5) ? 3 : 1); fe += r.feathers; }
  const ck = banner === 'standard' ? 'standard' : banner;
  g0.chest[ck] = (g0.chest[ck] || 0) + n / 10;
  if (g0.chest[ck] >= 10) {
    g0.chest[ck] -= 10;
    const t = Math.random() < 0.25 ? 5 : 4;
    const id = banner === 'arsenal' && Math.random() < 0.5 ? bannerInfo().gear : pick(GEAR).id;
    const cr = grantGear(id, t);
    cr.kind = 'gear';
    cr.feathers = 50;
    fe += 50;
    res.chest = cr;
  }
  addFeathers(fe);
  res.feathers = fe;
  res.anomaly = !!window.FORCE_ANOMALY || Math.random() < ANOMALY_CHANCE;
  for (const r of res) g0.history.unshift({ id: r.kind === 'hero' ? r.c.id : r.kind === 'gear' ? r.key : r.item, k: r.kind, r: r.rarity, f: !!r.featured, gold: !!r.golden, t: Date.now() });
  g0.history = g0.history.slice(0, 60);
  save.pulls = (save.pulls || 0) + n;
  dailyProgress('pull', n);
  persist();
  return res;
}

const ANOMALY_CHANCE = 0.08;
const SHOP = [
  { id: 'ticket', cost: 30, icon: 'pearl', name: 'Билет призыва', text: 'Один призыв на любом баннере' },
  { id: 'manual', cost: 8, icon: 'scroll', name: 'Наставление', text: '+150 опыта любому герою' },
  { id: 'pick4', cost: 160, icon: 'seal_red', name: 'Эпический на выбор', text: 'Любой эпический герой или +1 звезда ему' },
  { id: 'pick5', cost: 450, icon: 'ribbon', name: 'Легендарный на выбор', text: 'Любой легендарный герой или +1 звезда ему' },
];
const QUOTES = {
  cadet: 'Я готов отдать сердце человечеству!',
  connie: 'Я самый быстрый в отряде — догоняйте!',
  sasha: 'А картошка у вас есть?..',
  jean: 'Я не герой. Просто делаю, что должен.',
  eren: 'Я вырежу их всех до последнего!',
  armin: 'Чтобы что-то изменить, придётся рискнуть.',
  hange: 'Титаны — это же так интересно!',
  mikasa: 'Я буду защищать тебя. Всегда.',
  levi: 'Выбирай сам — и не оглядывайся.',
  erwin: 'Вперёд! За стену, к правде!',
  historia: 'Я сама выбираю, кем мне быть.',
  mike: '*принюхивается* Титаны близко.',
};

function feathers() { return gachaState().feathers || 0; }
function tickets() { return gachaState().tickets || 0; }

function addFeathers(n) { const g = gachaState(); g.feathers = (g.feathers || 0) + n; }

function grantHero(id) {
  const c = charById(id), had = save.chars[id] || 0;
  const refund = had >= 5 ? 20 * c.rarity : 0;
  if (refund) save.tokens += refund;
  save.chars[id] = Math.min(5, had + 1);
  return { kind: 'hero', c, rarity: c.rarity, isNew: !had, stars: save.chars[id], refund };
}

function buyShop(id, heroId) {
  const it = SHOP.find(s => s.id === id), g = gachaState();
  if (!it || feathers() < it.cost) return null;
  if ((id === 'pick4' || id === 'pick5') && (!heroId || charById(heroId).rarity !== (id === 'pick4' ? 4 : 5))) return null;
  g.feathers -= it.cost;
  let res = true;
  if (id === 'ticket') g.tickets = tickets() + 1;
  else if (id === 'manual') save.manuals = (save.manuals || 0) + 1;
  else res = grantHero(heroId);
  persist();
  return res;
}

function anomalyReward() {
  const g = gachaState();
  g.tickets = tickets() + 1;
  addFeathers(10);
  persist();
}
