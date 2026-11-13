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
  cadet: { text: '+20% опыта в забеге', apply: s => { s.xp *= 1.2; } },
  connie: { text: 'Ещё +10% к скорости, планирует на 20% медленнее', apply: s => { s.speed *= 1.1; s.glide *= 0.8; } },
  sasha: { text: 'Лечение за убийства приходит ещё чаще', apply: s => { s.healEvery -= 4; } },
  jean: { text: 'Начинает забег с боевым товарищем', apply: s => { s.startSkills.push(['ally', 1]); } },
  eren: { text: 'Начинает забег с вихрем клинков', apply: s => { s.startSkills.push(['spin', 1]); } },
  armin: { text: 'Начинает забег с пушками гарнизона', apply: s => { s.startSkills.push(['cannon', 1]); } },
  hange: { text: 'Ловушка сразу 2 уровня', apply: s => { s.startSkills.push(['trap', 2]); } },
  mikasa: { text: 'Облёт ещё +20%, летит к следующему титану каждую секунду', apply: s => { s.orbit *= 1.2; s.chainCd = 1; } },
  levi: { text: 'Вихрь клинков сразу 2 уровня', apply: s => { s.startSkills.push(['spin', 2]); } },
  erwin: { text: 'Товарищи атакуют на 40% чаще', apply: s => { s.allyMul = 0.6; } },
  historia: { text: 'Ещё одно второе дыхание в каждом забеге', apply: s => { s.extraRevive = (s.extraRevive || 0) + 1; } },
  mike: { text: 'Ещё +15% к дальности атаки', apply: s => { s.engage *= 1.15; } },
};

const HERO_PERKS = [
  { at: 5, text: () => tr('+1 сердце в начале забега'), apply: s => { s.maxHp += 1; } },
  { at: 10, text: () => tr('Умения перезаряжаются на 10% быстрее'), apply: s => { s.cdMul *= 0.9; } },
  { at: 15, text: () => tr('Начинает забег со случайным улучшением'), apply: s => { s.startPassive = true; } },
  { at: 20, text: id => tr((SIGNATURE[id] || SIGNATURE.cadet).text), apply: (s, id) => (SIGNATURE[id] || SIGNATURE.cadet).apply(s) },
];

function heroBonusText(l) {
  return tr('Скорость и облёт +{0}%, дальность атаки +{1}%', l - 1, ((l - 1) * 0.5).toFixed(1).replace('.0', ''));
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
  if (!save.chars[id] || heroLevel(id) >= HERO_MAX || save.tokens < TRAIN_COST) return 0;
  save.tokens -= TRAIN_COST;
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
