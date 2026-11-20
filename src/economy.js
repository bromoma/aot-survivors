'use strict';

// Currencies
//   marks     — earned in runs; spent on training, hero training, star-ups and gear upgrades
//   wings     — "Wings of Freedom" badges; the only way to pay for summons
//   dossiers  — per hero; recruit a hero without luck and raise their stars
//   crystals  — titan crystals from bosses and elites; upgrade gear
//   feathers  — from every summon; spent in the summon shop
const WELCOME_WINGS = 1000;
const DOSSIER_DUP = { 3: 5, 4: 10, 5: 25 };
const DOSSIER_UNLOCK = { 3: 20, 4: 40, 5: 80 };
const STAR_DOSSIERS = [0, 10, 20, 40, 80];
const STAR_MARKS = [0, 300, 800, 2000, 5000];
const GEAR_DUP_CRYSTALS = [0, 1, 2, 4, 8, 15];

function migrateEco(s) {
  if (s.eco >= 2) return s;
  if (typeof s.marks !== 'number') s.marks = typeof s.tokens === 'number' ? s.tokens : 300;
  delete s.tokens;
  s.wings = (s.wings || 0) + WELCOME_WINGS;
  s.crystals = s.crystals || 0;
  s.dossiers = s.dossiers || {};
  s.eco = 2;
  return s;
}

function wings() { return save.wings || 0; }
function addWings(n) { save.wings = wings() + n; }
function crystals() { return save.crystals || 0; }
function addCrystals(n) { save.crystals = crystals() + n; }
function dossiers(id) { return (save.dossiers && save.dossiers[id]) || 0; }

// Dossiers of a hero who already has 5 stars turn into feathers (2 each).
function addDossiers(id, n) {
  if ((save.chars[id] || 0) >= 5) { addFeathers(n * 2); return { feathers: n * 2 }; }
  save.dossiers = save.dossiers || {};
  save.dossiers[id] = dossiers(id) + n;
  return { dossiers: n };
}

function recruitCost(id) { return DOSSIER_UNLOCK[charById(id).rarity] || 20; }
function canRecruit(id) { return !save.chars[id] && dossiers(id) >= recruitCost(id); }
function recruitHero(id) {
  if (!canRecruit(id)) return false;
  save.dossiers[id] -= recruitCost(id);
  save.chars[id] = 1;
  persist();
  return true;
}

function starCost(id) {
  const s = save.chars[id] || 0;
  if (!s || s >= 5) return null;
  return { d: STAR_DOSSIERS[s], m: STAR_MARKS[s] };
}
function canStarUp(id) { const c = starCost(id); return !!c && dossiers(id) >= c.d && save.marks >= c.m; }
function starUp(id) {
  if (!canStarUp(id)) return false;
  const c = starCost(id);
  save.dossiers[id] -= c.d;
  save.marks -= c.m;
  save.chars[id]++;
  persist();
  return true;
}

// A random hero for dossiers found on the battlefield: commons are frequent, legendaries rare.
function randomDossierHero() {
  const x = Math.random(), r = x < 0.6 ? 3 : x < 0.9 ? 4 : 5;
  return pick(CHARS.filter(c => c.rarity === r && c.id !== 'cadet')).id;
}

function gearUpCost(key) {
  const it = gearSave().items[key];
  if (!it || it.lvl >= 5) return null;
  const r = parseGear(key).r;
  return { c: 2 * r * it.lvl, m: 100 * r * it.lvl };
}
function canGearUp(key) { const c = gearUpCost(key); return !!c && crystals() >= c.c && save.marks >= c.m; }
function gearUp(key) {
  if (!canGearUp(key)) return false;
  const c = gearUpCost(key);
  save.crystals -= c.c;
  save.marks -= c.m;
  gearSave().items[key].lvl++;
  persist();
  return true;
}
