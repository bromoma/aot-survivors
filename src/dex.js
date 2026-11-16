'use strict';

const DEX = [
  { key: 'normal', spr: 'titan_normal_140_down', name: 'Common Titan', lore: 'Wanders aimlessly and reaches for people. 4–7 meters tall.' },
  { key: 'lanky', spr: 'titan_lanky_140_down', name: 'Lanky', lore: 'Its long arms reach farther than they seem.' },
  { key: 'fat', spr: 'titan_fat_140_down', name: 'Fatty', lore: 'Slow, but its grip is strong.' },
  { key: 'small', spr: 'titan_small_84_down', name: 'Small', lore: 'They roam in packs of three to five.' },
  { key: 'aberrant', spr: 'titan_aberrant_140_down', name: 'Aberrant', lore: 'Instead of walking to people it darts around and leaps.' },
  { key: 'crawler', spr: 'titan_crawler_100_down', name: 'Crawler', lore: 'Pounces on anyone flying too low.' },
  { key: 'thrower', spr: 'titan_thrower_170_down', name: 'Thrower', lore: 'Hurls boulders where you are flying to.' },
  { key: 'giant', spr: 'titan_giant_240_down', name: 'Giant', lore: 'Fifteen meters tall. Its nape must be cut twice.' },
  { key: 'boss_female', spr: 'boss_female_down', name: 'Female Titan', lore: 'Fast and cunning: hardens and runs away.', boss: true },
  { key: 'boss_jaw', spr: 'boss_jaw_down', name: 'Jaw Titan', lore: 'Small and swift, it bites in mid-leap.', boss: true },
  { key: 'boss_cart', spr: 'boss_cart_down', name: 'Cart Titan', lore: 'Keeps its distance and fires cannons.', boss: true },
  { key: 'boss_armored', spr: 'boss_armored_down', name: 'Armored Titan', lore: 'Rams everything in its path. Its weak spot is the knees.', boss: true },
  { key: 'boss_beast', spr: 'boss_beast_down', name: 'Beast Titan', lore: 'Throws boulders and calls the pack.', boss: true },
  { key: 'boss_hammer', spr: 'boss_hammer_down', name: 'War Hammer Titan', lore: 'Grows crystals from the ground. Look for them around it.', boss: true },
  { key: 'boss_colossal', spr: 'boss_colossal_down', name: 'Colossal Titan', lore: 'Sixty meters of steam and heat.', boss: true },
  { key: 'boss_reiss', spr: 'boss_reiss_down', name: 'Rod Reiss Titan', lore: 'Crawls red-hot and burns everything around it.', boss: true },
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
