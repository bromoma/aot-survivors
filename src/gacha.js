'use strict';

const PITY5 = 45, SOFT5 = 30, PITY4 = 10;
const RATE5 = 0.03, RATE4 = 0.18;
const PULL_COST = 100, PULL10_COST = 900;
const FEATURE5 = ['levi', 'mikasa', 'erwin'];
const FEATURE4 = ['eren', 'armin', 'hange', 'historia', 'mike'];
const BANNER_TITLES = { levi: 'Сильнейший солдат', mikasa: 'Алый шарф', erwin: 'Отдайте свои сердца' };

function weekIndex() { return Math.floor((Date.now() / 86400000 + 3) / 7); }

function bannerInfo() {
  const w = weekIndex();
  const five = FEATURE5[w % FEATURE5.length];
  const fours = [FEATURE4[w % FEATURE4.length], FEATURE4[(w + 2) % FEATURE4.length]];
  const end = ((w + 1) * 7 - 3) * 86400000;
  return { five, fours, title: BANNER_TITLES[five], endsIn: end - Date.now() };
}

function gachaState() {
  if (!save.gacha) save.gacha = { guar: false, history: [], free: '' };
  return save.gacha;
}

function freeAvailable() { return gachaState().free !== todayKey(); }

function rate5() {
  const p = (save.pity5 || 0) + 1;
  if (p >= PITY5) return 1;
  return p > SOFT5 ? RATE5 + (p - SOFT5) * 0.06 : RATE5;
}

function rollOne(banner) {
  const g = gachaState(), B = bannerInfo();
  const r5 = rate5();
  save.pity5 = (save.pity5 || 0) + 1;
  save.pity4 = (save.pity4 || 0) + 1;
  let rar = 3;
  if (Math.random() < r5) rar = 5;
  else if (save.pity4 >= PITY4 || Math.random() < RATE4) rar = 4;
  if (rar === 5) save.pity5 = 0;
  if (rar >= 4) save.pity4 = 0;
  let c = null, featured = false;
  if (rar === 5) {
    if (banner === 'event' && (g.guar || Math.random() < 0.5)) { c = charById(B.five); featured = true; g.guar = false; }
    else {
      const pool = CHARS.filter(x => x.rarity === 5 && (banner !== 'event' || x.id !== B.five));
      c = pool.length ? pick(pool) : charById(B.five);
      if (banner === 'event') g.guar = true;
    }
  } else if (rar === 4) {
    if (banner === 'event' && Math.random() < 0.5) { c = charById(pick(B.fours)); featured = true; }
    else c = pick(CHARS.filter(x => x.rarity === 4));
  } else if (Math.random() < 0.55) {
    save.manuals = (save.manuals || 0) + 1;
    return { item: 'manual', rarity: 3 };
  } else c = pick(CHARS.filter(x => x.rarity === 3 && x.id !== 'cadet'));
  const r = grantHero(c.id);
  r.rarity = rar;
  r.featured = featured;
  return r;
}

function gachaPull(n, banner, mode) {
  const g0 = gachaState();
  const cost = mode ? 0 : n === 10 ? PULL10_COST : PULL_COST * n;
  if (mode === 'free' && !freeAvailable()) return null;
  if (mode === 'ticket' && tickets() < n) return null;
  if (save.tokens < cost) return null;
  if (mode === 'free') g0.free = todayKey();
  if (mode === 'ticket') g0.tickets -= n;
  save.tokens -= cost;
  const res = [];
  for (let i = 0; i < n; i++) res.push(rollOne(banner));
  if (n === 10 && !res.some(r => r.rarity >= 4)) { save.pity4 = PITY4 - 1; res[9] = rollOne(banner); }
  const g = gachaState();
  let fe = 0;
  for (const r of res) { r.feathers = FEATHER[r.rarity] + (r.c && !r.isNew ? FEATHER[r.rarity] : 0); fe += r.feathers; }
  addFeathers(fe);
  res.feathers = fe;
  res.anomaly = !!window.FORCE_ANOMALY || Math.random() < ANOMALY_CHANCE;
  for (const r of res) g.history.unshift({ id: r.c ? r.c.id : r.item, r: r.rarity, f: !!r.featured, t: Date.now() });
  g.history = g.history.slice(0, 40);
  save.pulls = (save.pulls || 0) + n;
  dailyProgress('pull', n);
  persist();
  return res;
}

const FEATHER = { 3: 1, 4: 6, 5: 15 };
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
  return { c, rarity: c.rarity, isNew: !had, stars: save.chars[id], refund };
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
