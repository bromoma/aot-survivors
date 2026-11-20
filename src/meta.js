'use strict';

const TRAINING = [
  { id: 'hp', name: 'Endurance', icon: 3, max: 3, cost: [300, 800, 1800], text: l => tr('+{0} health at the start of a run', l), apply: (s, l) => { s.maxHp += l; } },
  { id: 'speed', name: 'Winch', icon: 0, max: 5, cost: [150, 300, 550, 900, 1400], text: l => tr('Fly {0}% faster', l * 4), apply: (s, l) => { s.speed *= 1 + l * 0.04; } },
  { id: 'gas', name: 'Gas Tanks', icon: 6, max: 5, cost: [150, 300, 550, 900, 1400], text: l => tr('Glide down {0}% slower', l * 8), apply: (s, l) => { s.glide *= 1 - l * 0.08; } },
  { id: 'xp', name: 'Drill Training', icon: 11, max: 5, cost: [200, 400, 700, 1100, 1600], text: l => tr('+{0}% XP', l * 6), apply: (s, l) => { s.xp *= 1 + l * 0.06; } },
  { id: 'greed', name: "Soldier's Pay", icon: 12, max: 5, cost: [250, 500, 900, 1400, 2000], text: l => tr('+{0}% marks per run', l * 10) },
  { id: 'heal', name: 'Field Hospital', icon: 5, max: 3, cost: [300, 700, 1300], text: l => tr('Kill heals come {0} kills sooner', l * 2), apply: (s, l) => { s.healEvery -= l * 2; } },
  { id: 'reroll', name: 'Backup Plan', icon: 13, max: 3, cost: [400, 900, 1600], text: l => tr(l === 1 ? '{0} level-card reroll per run (R key)' : '{0} level-card rerolls per run (R key)', l) },
  { id: 'start', name: 'Battle Experience', icon: 15, max: 1, cost: [1500], text: () => tr('Start each run with a random level 1 skill') },
  { id: 'revive', name: 'Second Wind', icon: 14, max: 1, cost: [2500], text: () => tr('Once per run, get back up after death with 2 hearts') },
];

const RANKS = [
  { at: 0, name: 'Cadet' }, { at: 3, name: 'Private' }, { at: 7, name: 'Sergeant' },
  { at: 12, name: 'Squad Leader' }, { at: 18, name: 'Captain' }, { at: 25, name: 'Commander' },
];

trFields(TRAINING, ['name']);
trFields(RANKS, ['name']);
const FACTION_WIN_NAMES = { mp: 'Military Police', garrison: 'Garrison', scouts: 'Survey Corps' };
const BOSS_DOWN = { female: 'Female Titan Down', armored: 'Armored Titan Down', beast: 'Beast Titan Down', colossal: 'Colossal Titan Down', jaw: 'Jaw Titan Down', cart: 'Cart Titan Down', hammer: 'War Hammer Titan Down', reiss: 'Rod Reiss Titan Down' };
const BOSS_NAMES = { female: 'Female Titan', armored: 'Armored Titan', beast: 'Beast Titan', colossal: 'Colossal Titan', jaw: 'Jaw Titan', cart: 'Cart Titan', hammer: 'War Hammer Titan', reiss: 'Rod Reiss Titan' };

function stat(k) { return (save.stats && save.stats[k]) || 0; }
function trainingTotal() { return Object.values(save.meta || {}).reduce((a, b) => a + b, 0); }

const ACHIEVEMENTS = [
  ...[[50, 50], [250, 100], [1000, 200], [3000, 400], [10000, 800]].map(([n, r], i) => ({ id: 'kills' + i, get name() { return tr('Titan Hunter {0}', ['I', 'II', 'III', 'IV', 'V'][i]); }, get text() { return tr('Kill {0} titans in total', n); }, goal: n, reward: r, get: () => stat('kills') })),
  ...[[1, 30], [10, 100], [50, 300]].map(([n, r], i) => ({ id: 'runs' + i, get name() { return tr(['First Sortie', 'Veteran', 'Living Legend'][i]); }, get text() { return tr(n === 1 ? 'Play {0} run' : 'Play {0} runs', n); }, goal: n, reward: r, get: () => stat('runs') })),
  ...Object.entries(BOSS_NAMES).map(([k, nm], i) => ({ id: 'boss_' + k, get name() { return tr(BOSS_DOWN[k]); }, get text() { return tr('Defeat the shifter: {0}', tr(nm)); }, goal: 1, reward: [150, 200, 250, 400, 150, 150, 250, 400][i], get: () => (save.stats && save.stats.bosses && save.stats.bosses[k]) || 0 })),
  { id: 'boss_all', get name() { return tr('Shifter Hunt'); }, get text() { return tr('Defeat five shifters in one run'); }, goal: 5, reward: 600, get: () => stat('maxBossRun') },
  ...Object.entries(FACTION_WIN_NAMES).map(([k, nm], i) => ({ id: 'win_' + k, get name() { return tr(['Order in the Capital', 'Shiganshina Retaken', 'Beyond the Wall'][i]); }, get text() { return tr('Survive 10 minutes: {0}', tr(nm)) + (k === 'garrison' ? ' · ' + tr('reward: {0} joins the squad', charById('hannes').name) : ''); }, hero: k === 'garrison' ? 'hannes' : null, goal: 1, reward: [200, 300, 500][i], get: () => (save.stats && save.stats.winsBy && save.stats.winsBy[k]) || 0 })),
  ...[[10, 60], [20, 150], [30, 300]].map(([n, r], i) => ({ id: 'lvl' + i, get name() { return tr(['Fast Learner', 'Seasoned Fighter', 'Elite'][i]); }, get text() { return tr('Reach level {0} in one run', n); }, goal: n, reward: r, get: () => stat('bestLevel') })),
  ...[[10, 60], [30, 150], [60, 300]].map(([n, r], i) => ({ id: 'combo' + i, get name() { return tr(['Combo', 'Whirlwind', 'Hurricane'][i]); }, get text() { return tr('Make a x{0} combo', n); }, goal: n, reward: r, get: () => stat('maxCombo') })),
  ...[[3, 80], [6, 200], [9, 500]].map(([n, r], i) => ({ id: 'squad' + i, get name() { return tr(['My Own Team', 'Levi Squad', 'Full Squad'][i]); }, get text() { return tr('Unlock {0} soldiers', n); }, goal: n, reward: r, get: () => Object.keys(save.chars).length })),
  { id: 'skill5', get name() { return tr('Skill Master'); }, get text() { return tr('Raise a skill to level 5'); }, goal: 5, reward: 100, get: () => stat('maxSkill') },
  { id: 'arsenal', get name() { return tr('Full Arsenal'); }, get text() { return tr('Get all 5 skills in one run'); }, goal: 5, reward: 250, get: () => stat('maxSkillsRun') },
  { id: 'train5', get name() { return tr('Recruit'); }, get text() { return tr('Buy {0} training levels', 5); }, goal: 5, reward: 100, get: trainingTotal },
  { id: 'train20', get name() { return tr('Boot Camp Done'); }, get text() { return tr('Buy {0} training levels', 20); }, goal: 20, reward: 300, get: trainingTotal },
  ...[[10, 80], [50, 200], [200, 500]].map(([n, r], i) => ({ id: 'ult' + i, get name() { return tr(['Signature Move', 'Hope of Humanity', "Humanity's Strongest"][i]); }, get text() { return tr('Use ultimates {0} times', n); }, goal: n, reward: r, get: () => stat('ults') })),
  ...[[1, 150], [5, 600]].map(([n, r], i) => ({ id: 'evo' + i, get name() { return tr(['First Evolution', 'Evolved Arsenal'][i]); }, get text() { return n === 1 ? tr('Evolve a skill') : tr('Discover all {0} evolutions', n); }, goal: n, reward: r, get: () => Object.keys((save.stats && save.stats.evos) || {}).length })),
  ...[[10, 100], [50, 300]].map(([n, r], i) => ({ id: 'chest' + i, get name() { return tr(['Supply Run', 'Quartermaster'][i]); }, get text() { return tr('Open {0} supply chests', n); }, goal: n, reward: r, get: () => stat('chests') })),
  { id: 'elite0', get name() { return tr('Elite Slayer'); }, get text() { return tr('Kill {0} golden elite titans', 25); }, goal: 25, reward: 250, get: () => stat('elites') },
  ...[[1, 80], [10, 300]].map(([n, r], i) => ({ id: 'night' + i, get name() { return tr(['Night Watch', 'Child of the Night'][i]); }, get text() { return n === 1 ? tr('Survive a night until dawn') : tr('Survive {0} nights until dawn', n); }, goal: n, reward: r, get: () => stat('nights') })),
  ...[[1, 200], [5, 600]].map(([n, r], i) => ({ id: 'chal' + i, get name() { return tr(['Weekly Challenger', 'Challenge Veteran'][i]); }, get text() { return n === 1 ? tr('Win a weekly challenge') : tr('Win {0} weekly challenges', n); }, goal: n, reward: r, get: () => stat('chalWins') })),
  { id: 'dexall', get name() { return tr('Titanologist'); }, get text() { return tr('Discover all {0} Titanpedia entries', DEX.length); }, get goal() { return DEX.length; }, reward: 500, get: () => dexSeen() },
  ...[[7, 150], [30, 500]].map(([n, r], i) => ({ id: 'login' + i, get name() { return tr(['Loyal Soldier', 'Dedicated Heart'][i]); }, get text() { return tr('Collect daily supplies {0} times', n); }, goal: n, reward: r, get: () => stat('loginDays') })),
  { id: 'saver', get name() { return tr('City Defender'); }, get text() { return tr('Survive 10 minutes as the Military Police losing no more than 3 citizens'); }, goal: 1, reward: 300, get: () => stat('cleanCity') },
];

const DAILY_POOL = [
  { type: 'kills', goals: [100, 200, 300], reward: 120, text: n => tr('Kill {0} titans', n) },
  { type: 'boss', goals: [1], reward: 150, text: () => tr('Defeat any shifter') },
  { type: 'level', goals: [12, 15, 18], reward: 120, text: n => tr('Reach level {0} in a run', n) },
  { type: 'combo', goals: [10, 15], reward: 120, text: n => tr('Make a x{0} combo', n) },
  { type: 'time', goals: [300, 600], reward: 100, text: n => tr('Fight for {0} min in total', n / 60) },
  { type: 'faction', goals: [1], reward: 100, text: (n, f) => tr('Play a run of 3+ minutes: {0}', tr(FACTION_WIN_NAMES[f])) },
  { type: 'pull', goals: [1], reward: 80, text: () => tr('Summon a soldier') },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ensureMeta() {
  if (!save.meta) save.meta = {};
  for (const t of TRAINING) if (typeof save.meta[t.id] !== 'number') save.meta[t.id] = 0;
  if (!save.stats) save.stats = { runs: 0, kills: 0, bestLevel: 1, wins: 0, time: 0 };
  const st = save.stats;
  if (!st.bosses) st.bosses = {};
  if (!st.winsBy) st.winsBy = {};
  for (const k of ['maxCombo', 'maxBossRun', 'maxSkill', 'maxSkillsRun', 'cleanCity', 'ults', 'chests', 'elites', 'nights', 'chalWins', 'loginDays']) if (typeof st[k] !== 'number') st[k] = 0;
  if (!st.evos) st.evos = {};
  if (!save.claimed) save.claimed = {};
  const day = todayKey();
  if (!save.daily || save.daily.day !== day) {
    let h = 0;
    for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rng = makeRng(h || 7);
    const pool = DAILY_POOL.slice();
    const tasks = [];
    while (tasks.length < 3 && pool.length) {
      const p = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
      tasks.push({ type: p.type, goal: p.goals[Math.floor(rng.next() * p.goals.length)], faction: p.type === 'faction' ? FACTIONS[Math.floor(rng.next() * 3)].id : null, progress: 0, claimed: false });
    }
    save.daily = { day, tasks };
  }
}

function dailyDef(t) { return DAILY_POOL.find(p => p.type === t.type); }

function dailyProgress(type, value, mode = 'add', fid = null) {
  ensureMeta();
  for (const t of save.daily.tasks) {
    if (t.type !== type || t.claimed) continue;
    if (type === 'faction' && t.faction !== fid) continue;
    t.progress = mode === 'max' ? Math.max(t.progress, value) : t.progress + value;
  }
}

function metaApply(s) {
  ensureMeta();
  for (const t of TRAINING) {
    const l = save.meta[t.id];
    if (l && t.apply) t.apply(s, l);
  }
}

function metaRunStart() {
  ensureMeta();
  game.rerolls = save.meta.reroll;
  game.revives = save.meta.revive;
  game.maxCombo = 0;
  game.bossKinds = [];
  game.paidBossKinds = 0;
  game.dailyKills = 0;
  game.dailyTime = 0;
  game.factionCounted = false;
  game.doneBefore = achievementsState().filter(a => a.done).map(a => a.id);
  game.dailyBefore = dailyState().filter(t => t.done).length;
  if (save.meta.start) {
    const free = Object.keys(SKILLS).filter(k => !stats.skills[k]);
    if (free.length) {
      const k = pick(free);
      stats.skills[k] = 1;
      if (k === 'ally') syncAllies();
    }
  }
}

function trainingCost(t) {
  const l = save.meta[t.id];
  return l >= t.max ? null : t.cost[l];
}

function buyTraining(id) {
  ensureMeta();
  const t = TRAINING.find(x => x.id === id);
  const c = t && trainingCost(t);
  if (!c || save.marks < c) return false;
  save.marks -= c;
  save.meta[id]++;
  persist();
  return true;
}

function achievementsState() {
  ensureMeta();
  return ACHIEVEMENTS.map(a => {
    const v = Math.min(a.goal, a.get());
    return { ...a, value: v, done: v >= a.goal, claimed: !!save.claimed[a.id] };
  });
}

function dailyState() {
  ensureMeta();
  return save.daily.tasks.map((t, i) => {
    const d = dailyDef(t);
    return { i, text: d.text(t.goal, t.faction), goal: t.goal, value: Math.min(t.goal, t.progress), done: t.progress >= t.goal, claimed: t.claimed, reward: d.reward };
  });
}

function claimAchievement(id) {
  const a = achievementsState().find(x => x.id === id);
  if (!a || !a.done || a.claimed) return 0;
  save.claimed[id] = true;
  save.marks += a.reward;
  addWings(achWings(a.reward));
  const h = a.hero ? grantHeroReward(a.hero) : null;
  persist();
  return { m: a.reward, w: achWings(a.reward), hero: h && a.hero };
}

const achWings = r => Math.round(r / 20) * 10;
const DAILY_WINGS = 20;

function claimDaily(i) {
  const t = dailyState()[i];
  if (!t || !t.done || t.claimed) return 0;
  save.daily.tasks[i].claimed = true;
  save.marks += t.reward;
  addWings(DAILY_WINGS);
  persist();
  return { m: t.reward, w: DAILY_WINGS };
}

function claimableCount() {
  return achievementsState().filter(a => a.done && !a.claimed).length + dailyState().filter(t => t.done && !t.claimed).length;
}

function rankInfo() {
  const n = Object.keys(save.claimed || {}).length;
  let r = RANKS[0], next = null;
  for (const x of RANKS) { if (n >= x.at) r = x; else if (!next) next = x; }
  return { name: r.name, n, next };
}

function metaRunEnd(won) {
  ensureMeta();
  const st = save.stats;
  const before = new Set(game.doneBefore || []);
  const beforeDaily = game.dailyBefore || 0;
  for (const k of game.bossKinds.slice(game.paidBossKinds)) st.bosses[k] = (st.bosses[k] || 0) + 1;
  dailyProgress('boss', game.bossKinds.length - game.paidBossKinds);
  game.paidBossKinds = game.bossKinds.length;
  st.maxBossRun = Math.max(st.maxBossRun, new Set(game.bossKinds).size);
  st.maxCombo = Math.max(st.maxCombo, game.maxCombo);
  const lv = Object.values(stats.skills || {});
  st.maxSkill = Math.max(st.maxSkill, ...lv, 0);
  st.maxSkillsRun = Math.max(st.maxSkillsRun, lv.filter(Boolean).length);
  if (won) {
    st.winsBy[faction.id] = (st.winsBy[faction.id] || 0) + 1;
    if (faction.id === 'mp' && game.lost <= 3) st.cleanCity = 1;
  }
  dailyProgress('kills', game.kills - game.dailyKills);
  dailyProgress('time', Math.floor(game.time - game.dailyTime));
  game.dailyKills = game.kills;
  game.dailyTime = Math.floor(game.time);
  dailyProgress('level', game.level, 'max');
  dailyProgress('combo', game.maxCombo, 'max');
  if (!game.factionCounted && game.time >= 180) { game.factionCounted = true; dailyProgress('faction', 1, 'add', faction.id); }
  game.newDone = achievementsState().filter(a => a.done && !before.has(a.id)).map(a => a.name);
  game.newDaily = dailyState().filter(t => t.done).length - beforeDaily;
}
