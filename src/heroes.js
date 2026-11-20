'use strict';

const HERO_MAX = 20;
const MANUAL_XP = 150;
const TRAIN_XP = 100, TRAIN_COST = 150;
const heroNeed = l => 80 + l * 50;

function heroXp(id) { return (save.heroXp && save.heroXp[id]) || 0; }

function heroLevelOf(xp) {
  let l = 1;
  while (l < HERO_MAX && xp >= heroNeed(l)) { xp -= heroNeed(l); l++; }
  return { level: l, into: xp, need: l < HERO_MAX ? heroNeed(l) : 0 };
}

function heroLevel(id) { return heroLevelOf(heroXp(id)).level; }

function addHeroXp(id, n) {
  save.heroXp = save.heroXp || {};
  const before = heroLevel(id);
  let cap = 0;
  for (let l = 1; l < HERO_MAX; l++) cap += heroNeed(l);
  save.heroXp[id] = Math.min(cap, heroXp(id) + Math.max(0, Math.round(n)));
  return heroLevel(id) - before;
}

const SIGNATURE = {
  cadet: { text: '+20% XP in runs', apply: s => { s.xp *= 1.2; } },
  connie: { text: 'Another +10% speed, glides 20% slower', apply: s => { s.speed *= 1.1; s.glide *= 0.8; } },
  sasha: { text: 'Kill heals come even sooner', apply: s => { s.healEvery -= 4; } },
  jean: { text: 'Starts each run with a Comrade', apply: s => { s.startSkills.push(['ally', 1]); } },
  eren: { text: 'Starts each run with Blade Whirl', apply: s => { s.startSkills.push(['spin', 1]); } },
  armin: { text: 'Starts each run with Garrison Cannons', apply: s => { s.startSkills.push(['cannon', 1]); } },
  hange: { text: 'Trap starts at level 2', apply: s => { s.startSkills.push(['trap', 2]); } },
  mikasa: { text: 'Orbit +20% more, dashes to the next titan every second', apply: s => { s.orbit *= 1.2; s.chainCd = 1; } },
  levi: { text: 'Blade Whirl starts at level 2', apply: s => { s.startSkills.push(['spin', 2]); } },
  erwin: { text: 'Comrades attack 40% more often', apply: s => { s.allyMul = 0.6; } },
  historia: { text: 'One more second wind in every run', apply: s => { s.extraRevive = (s.extraRevive || 0) + 1; } },
  mike: { text: 'Another +15% attack reach', apply: s => { s.engage *= 1.15; } },
  petra: { text: 'Kill heals come 3 kills sooner', apply: s => { s.healEvery -= 3; } },
  nanaba: { text: 'Skills recharge another 10% faster', apply: s => { s.cdMul *= 0.9; } },
  oluo: { text: 'Starts each run with Blade Whirl', apply: s => { s.startSkills.push(['spin', 1]); } },
  eld: { text: 'Starts each run with a Comrade', apply: s => { s.startSkills.push(['ally', 1]); } },
  gunther: { text: 'Another +10% flight speed', apply: s => { s.speed *= 1.1; } },
  moblit: { text: 'Trap starts at level 2', apply: s => { s.startSkills.push(['trap', 2]); } },
  hannes: { text: 'One more second wind in every run', apply: s => { s.extraRevive = (s.extraRevive || 0) + 1; } },
  ymir: { text: 'Ultimate charges another 15% faster', apply: s => { s.ultMul = (s.ultMul || 1) * 0.85; } },
  annie: { text: 'After a kill, flies straight to the next titan', apply: s => { s.chain = true; } },
  reiner: { text: 'Another +1 heart', apply: s => { s.maxHp += 1; } },
  kenny: { text: 'Another +15% flight speed', apply: s => { s.speed *= 1.15; } },
  pixis: { text: 'Skills recharge 15% faster', apply: s => { s.cdMul *= 0.85; } },
};

const HERO_PERKS = [
  { at: 5, text: () => tr('+1 heart at the start of a run'), apply: s => { s.maxHp += 1; } },
  { at: 10, text: () => tr('Skills recharge 10% faster'), apply: s => { s.cdMul *= 0.9; } },
  { at: 15, text: () => tr('Starts each run with a random upgrade'), apply: s => { s.startPassive = true; } },
  { at: 20, text: id => tr((SIGNATURE[id] || SIGNATURE.cadet).text), apply: (s, id) => (SIGNATURE[id] || SIGNATURE.cadet).apply(s) },
];

function heroBonusText(l) {
  return tr('Speed and orbit +{0}%, attack reach +{1}%', l - 1, ((l - 1) * 0.5).toFixed(1).replace('.0', ''));
}

function applyHeroLevel(s, id) {
  const l = heroLevel(id);
  s.speed *= 1 + 0.01 * (l - 1);
  s.orbit *= 1 + 0.01 * (l - 1);
  s.engage *= 1 + 0.005 * (l - 1);
  for (const p of HERO_PERKS) if (l >= p.at) p.apply(s, id);
}

function heroRunStart() {
  for (const [k, lv] of stats.startSkills) {
    stats.skills[k] = Math.max(stats.skills[k] || 0, lv);
    if (k === 'ally' && typeof syncAllies === 'function') syncAllies();
  }
  if (stats.startPassive) {
    const k = pick(Object.keys(PASSIVES));
    PASSIVES[k].apply(stats);
    stats.pass[k] = (stats.pass[k] || 0) + 1;
  }
  if (stats.extraRevive) game.revives = (game.revives || 0) + stats.extraRevive;
}

function runHeroXp(won, dk, dt, db) {
  return Math.round((dk + Math.floor(dt / 6) + db * 40 + (won ? 150 : 0)) * (1 + 0.25 * (threat - 1)));
}

function trainHero(id) {
  if (!save.chars[id] || heroLevel(id) >= HERO_MAX || save.marks < TRAIN_COST) return 0;
  save.marks -= TRAIN_COST;
  const ups = addHeroXp(id, TRAIN_XP);
  persist();
  return 1 + ups;
}

function useManual(id) {
  if (!save.chars[id] || heroLevel(id) >= HERO_MAX || !(save.manuals > 0)) return 0;
  save.manuals--;
  const ups = addHeroXp(id, MANUAL_XP);
  persist();
  return 1 + ups;
}
