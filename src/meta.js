'use strict';

const TRAINING = [
  { id: 'hp', name: 'Выносливость', icon: 3, max: 3, cost: [300, 800, 1800], text: l => tr('+{0} к здоровью в начале забега', l), apply: (s, l) => { s.maxHp += l; } },
  { id: 'speed', name: 'Лебёдка', icon: 0, max: 5, cost: [150, 300, 550, 900, 1400], text: l => tr('Полёт на {0}% быстрее', l * 4), apply: (s, l) => { s.speed *= 1 + l * 0.04; } },
  { id: 'gas', name: 'Газовые баллоны', icon: 6, max: 5, cost: [150, 300, 550, 900, 1400], text: l => tr('Планируешь вниз на {0}% медленнее', l * 8), apply: (s, l) => { s.glide *= 1 - l * 0.08; } },
  { id: 'xp', name: 'Строевая подготовка', icon: 11, max: 5, cost: [200, 400, 700, 1100, 1600], text: l => tr('+{0}% опыта', l * 6), apply: (s, l) => { s.xp *= 1 + l * 0.06; } },
  { id: 'greed', name: 'Жалованье', icon: 12, max: 5, cost: [250, 500, 900, 1400, 2000], text: l => tr('+{0}% жетонов за забег', l * 10) },
  { id: 'heal', name: 'Полевой госпиталь', icon: 5, max: 3, cost: [300, 700, 1300], text: l => tr('Лечение за убийства на {0} раньше', l * 2), apply: (s, l) => { s.healEvery -= l * 2; } },
  { id: 'reroll', name: 'Запасной план', icon: 13, max: 3, cost: [400, 900, 1600], text: l => tr(l === 1 ? '{0} переброс карточек уровня за забег (клавиша R)' : '{0} переброса карточек уровня за забег (клавиша R)', l) },
  { id: 'start', name: 'Боевой опыт', icon: 15, max: 1, cost: [1500], text: () => tr('Начинаешь забег со случайным умением 1 уровня') },
  { id: 'revive', name: 'Второе дыхание', icon: 14, max: 1, cost: [2500], text: () => tr('Один раз за забег встаёшь после смерти с 2 сердцами') },
];

const RANKS = [
  { at: 0, name: 'Кадет' }, { at: 3, name: 'Рядовой' }, { at: 7, name: 'Сержант' },
  { at: 12, name: 'Командир отделения' }, { at: 18, name: 'Капитан' }, { at: 25, name: 'Командор' },
];

trFields(TRAINING, ['name']);
trFields(RANKS, ['name']);
const FACTION_WIN_NAMES = { mp: 'Военная полиция', garrison: 'Гарнизон', scouts: 'Разведкорпус' };
const BOSS_NAMES = { female: 'Женская особь', armored: 'Бронированный', beast: 'Звероподобный', colossal: 'Колоссальный', jaw: 'Титан-челюсти', cart: 'Титан-перевозчик', hammer: 'Молот войны', reiss: 'Титан Рода Рейсса' };

function stat(k) { return (save.stats && save.stats[k]) || 0; }
function trainingTotal() { return Object.values(save.meta || {}).reduce((a, b) => a + b, 0); }

const ACHIEVEMENTS = [
  ...[[50, 50], [250, 100], [1000, 200], [3000, 400], [10000, 800]].map(([n, r], i) => ({ id: 'kills' + i, get name() { return tr('Охотник на титанов {0}', ['I', 'II', 'III', 'IV', 'V'][i]); }, get text() { return tr('Убей {0} титанов за всё время', n); }, goal: n, reward: r, get: () => stat('kills') })),
  ...[[1, 30], [10, 100], [50, 300]].map(([n, r], i) => ({ id: 'runs' + i, get name() { return tr(['Первая вылазка', 'Ветеран', 'Живая легенда'][i]); }, get text() { return tr(n === 1 ? 'Сыграй {0} забег' : 'Сыграй {0} забегов', n); }, goal: n, reward: r, get: () => stat('runs') })),
  ...Object.entries(BOSS_NAMES).map(([k, nm], i) => ({ id: 'boss_' + k, get name() { return tr(nm + ' повержен' + (k === 'female' ? 'а' : '')); }, get text() { return tr('Победи шифтера «{0}»', tr(nm)); }, goal: 1, reward: [150, 200, 250, 400, 150, 150, 250, 400][i], get: () => (save.stats && save.stats.bosses && save.stats.bosses[k]) || 0 })),
  { id: 'boss_all', get name() { return tr('Охота на шифтеров'); }, get text() { return tr('Победи пятерых шифтеров за один забег'); }, goal: 5, reward: 600, get: () => stat('maxBossRun') },
  ...Object.entries(FACTION_WIN_NAMES).map(([k, nm], i) => ({ id: 'win_' + k, get name() { return tr(['Порядок в столице', 'Шиганшина отбита', 'Вылазка за стену'][i]); }, get text() { return tr('Продержись 10 минут: {0}', tr(nm)); }, goal: 1, reward: [200, 300, 500][i], get: () => (save.stats && save.stats.winsBy && save.stats.winsBy[k]) || 0 })),
  ...[[10, 60], [20, 150], [30, 300]].map(([n, r], i) => ({ id: 'lvl' + i, get name() { return tr(['Быстро учусь', 'Опытный боец', 'Элита'][i]); }, get text() { return tr('Достигни {0} уровня за один забег', n); }, goal: n, reward: r, get: () => stat('bestLevel') })),
  ...[[10, 60], [30, 150], [60, 300]].map(([n, r], i) => ({ id: 'combo' + i, get name() { return tr(['Комбо', 'Вихрь', 'Ураган'][i]); }, get text() { return tr('Сделай комбо x{0}', n); }, goal: n, reward: r, get: () => stat('maxCombo') })),
  ...[[3, 80], [6, 200], [9, 500]].map(([n, r], i) => ({ id: 'squad' + i, get name() { return tr(['Своя команда', 'Отряд Леви', 'Весь отряд'][i]); }, get text() { return tr('Открой {0} бойцов', n); }, goal: n, reward: r, get: () => Object.keys(save.chars).length })),
  { id: 'skill5', get name() { return tr('Мастер умения'); }, get text() { return tr('Прокачай умение до 5 уровня'); }, goal: 5, reward: 100, get: () => stat('maxSkill') },
  { id: 'arsenal', get name() { return tr('Полный арсенал'); }, get text() { return tr('Возьми все 5 умений за один забег'); }, goal: 5, reward: 250, get: () => stat('maxSkillsRun') },
  { id: 'train5', get name() { return tr('Новобранец'); }, get text() { return tr('Купи {0} уровней тренировок', 5); }, goal: 5, reward: 100, get: trainingTotal },
  { id: 'train20', get name() { return tr('Учебка пройдена'); }, get text() { return tr('Купи {0} уровней тренировок', 20); }, goal: 20, reward: 300, get: trainingTotal },
  { id: 'saver', get name() { return tr('Защитник города'); }, get text() { return tr('Продержись 10 минут за Военную полицию, потеряв не больше 3 горожан'); }, goal: 1, reward: 300, get: () => stat('cleanCity') },
];

const DAILY_POOL = [
  { type: 'kills', goals: [100, 200, 300], reward: 120, text: n => tr('Убей {0} титанов', n) },
  { type: 'boss', goals: [1], reward: 150, text: () => tr('Победи любого шифтера') },
  { type: 'level', goals: [12, 15, 18], reward: 120, text: n => tr('Достигни {0} уровня за забег', n) },
  { type: 'combo', goals: [10, 15], reward: 120, text: n => tr('Сделай комбо x{0}', n) },
  { type: 'time', goals: [300, 600], reward: 100, text: n => tr('Продержись в боях {0} мин суммарно', n / 60) },
  { type: 'faction', goals: [1], reward: 100, text: (n, f) => tr('Сыграй забег от 3 минут: {0}', tr(FACTION_WIN_NAMES[f])) },
  { type: 'pull', goals: [1], reward: 80, text: () => tr('Призови бойца') },
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
  for (const k of ['maxCombo', 'maxBossRun', 'maxSkill', 'maxSkillsRun', 'cleanCity']) if (typeof st[k] !== 'number') st[k] = 0;
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
  if (!c || save.tokens < c) return false;
  save.tokens -= c;
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
  save.tokens += a.reward;
  persist();
  return a.reward;
}

function claimDaily(i) {
  const t = dailyState()[i];
  if (!t || !t.done || t.claimed) return 0;
  save.daily.tasks[i].claimed = true;
  save.tokens += t.reward;
  persist();
  return t.reward;
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
