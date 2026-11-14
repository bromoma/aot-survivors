'use strict';

const DEX = [
  { key: 'normal', spr: 'titan_normal_140_down', name: 'Обычный титан', lore: 'Бродит без цели и тянется к людям. Рост 4–7 метров.' },
  { key: 'lanky', spr: 'titan_lanky_140_down', name: 'Долговязый', lore: 'Длинные руки достают дальше, чем кажется.' },
  { key: 'fat', spr: 'titan_fat_140_down', name: 'Толстяк', lore: 'Медленный, но захват у него крепкий.' },
  { key: 'small', spr: 'titan_small_84_down', name: 'Мелкий', lore: 'Ходят стаями по трое-пятеро.' },
  { key: 'aberrant', spr: 'titan_aberrant_140_down', name: 'Аномальный', lore: 'Не идёт к людям, а мечется и прыгает.' },
  { key: 'crawler', spr: 'titan_crawler_100_down', name: 'Ползун', lore: 'Бросается на тех, кто летит низко.' },
  { key: 'thrower', spr: 'titan_thrower_170_down', name: 'Метатель', lore: 'Швыряет валуны туда, куда ты летишь.' },
  { key: 'giant', spr: 'titan_giant_240_down', name: 'Великан', lore: 'Пятнадцать метров. Затылок приходится резать дважды.' },
  { key: 'boss_female', spr: 'boss_female_down', name: 'Женская особь', lore: 'Быстрая и хитрая: твердеет и убегает.', boss: true },
  { key: 'boss_jaw', spr: 'boss_jaw_down', name: 'Титан-челюсти', lore: 'Маленький и стремительный, кусает в прыжке.', boss: true },
  { key: 'boss_cart', spr: 'boss_cart_down', name: 'Титан-перевозчик', lore: 'Держит дистанцию и бьёт из пушек.', boss: true },
  { key: 'boss_armored', spr: 'boss_armored_down', name: 'Бронированный титан', lore: 'Таранит всё на пути. Слабое место — колени.', boss: true },
  { key: 'boss_beast', spr: 'boss_beast_down', name: 'Звероподобный титан', lore: 'Бросает валуны и зовёт стаю.', boss: true },
  { key: 'boss_hammer', spr: 'boss_hammer_down', name: 'Молот войны', lore: 'Растит кристаллы из-под земли. Ищи их вокруг.', boss: true },
  { key: 'boss_colossal', spr: 'boss_colossal_down', name: 'Колоссальный титан', lore: 'Шестьдесят метров пара и жара.', boss: true },
  { key: 'boss_reiss', spr: 'boss_reiss_down', name: 'Титан Рода Рейсса', lore: 'Ползёт раскалённым и сжигает всё вокруг.', boss: true },
];
trFields(DEX, ['name', 'lore']);
const DEX_TIERS = { titan: [10, 100, 500], boss: [1, 5, 20] };
const DEX_REWARD = [[60, 5], [180, 15], [500, 40]];

function dexKey(t) {
  if (t.boss) return 'boss_' + t.boss.kind;
  const k = t.kind || t.type;
  return k === 'bighead' ? 'normal' : k;
}

function dexCount(key) { return (save.stats && save.stats.killsBy && save.stats.killsBy[key]) || 0; }

function dexRecord(t) {
  if (!save.stats) return;
  const by = save.stats.killsBy || (save.stats.killsBy = {});
  const k = dexKey(t);
  const was = by[k] || 0;
  by[k] = was + 1;
  if (!was) { game.dexNew = (game.dexNew || []); game.dexNew.push(k); }
}

function dexTier(e) {
  const n = dexCount(e.key), T = DEX_TIERS[e.boss ? 'boss' : 'titan'];
  let t = 0;
  while (t < T.length && n >= T[t]) t++;
  return t;
}

function dexClaimable(e) {
  const c = (save.dexClaim && save.dexClaim[e.key]) || 0;
  return dexTier(e) > c;
}

function dexClaimAll(e) {
  save.dexClaim = save.dexClaim || {};
  let c = save.dexClaim[e.key] || 0, tk = 0, fe = 0;
  const t = dexTier(e);
  while (c < t) { tk += DEX_REWARD[c][0]; fe += DEX_REWARD[c][1]; c++; }
  save.dexClaim[e.key] = c;
  save.tokens += tk;
  const g = gachaState();
  g.feathers = (g.feathers || 0) + fe;
  persist();
  return [tk, fe];
}

function dexClaimCount() { return DEX.filter(dexClaimable).length; }
function dexSeen() { return DEX.filter(e => dexCount(e.key) > 0).length; }
