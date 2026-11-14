'use strict';

const CHALLENGES = [
  { id: 'night', map: 2, name: 'Ночная вылазка', text: 'Тьма за стеной: видно только то, что рядом с тобой, ракетами и пожарами' },
  { id: 'aberrant', map: 1, name: 'Нашествие аномальных', text: 'Только аномальные титаны и ползуны — быстрые и непредсказуемые' },
  { id: 'giants', map: 2, name: 'Земля гигантов', text: 'Титанов меньше, но все огромные: великаны, метатели и 15-метровые' },
  { id: 'glass', map: 0, name: 'Последний рубеж', text: 'Одно сердце и никакого лечения, зато опыта вдвое больше' },
  { id: 'bosses', map: 1, name: 'Охота на шифтеров', text: 'Шифтеры приходят каждые 70 секунд' },
];
trFields(CHALLENGES, ['name', 'text']);
const CHAL_TIME = 300;

let challengeOn = false;
function weekChallenge() {
  const f = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('chal');
  return (f && CHALLENGES.find(x => x.id === f)) || CHALLENGES[weekIndex() % CHALLENGES.length];
}
function challengeDone() { return save.chalWeek === weekIndex(); }

function applyChallenge(f) {
  const c = weekChallenge();
  const out = { ...f, challenge: c.id, threat: 1 };
  if (c.id === 'aberrant') { out.abFrom = 0; out.abMax = 0.9; out.speed *= 1.05; }
  if (c.id === 'giants') { out.cap = Math.round(f.cap * 0.55); out.spawn0 *= 1.5; out.spawnMin *= 1.7; out.big = 1; }
  if (c.id === 'night') { out.spawnMin *= 1.1; }
  return out;
}

function challengeKind() {
  const c = faction.challenge;
  if (c === 'aberrant') return Math.random() < 0.65 ? 'aberrant' : kindReady('crawler') ? 'crawler' : 'aberrant';
  if (c === 'giants') { const r = Math.random(); return r < 0.25 && kindReady('giant') ? 'giant' : r < 0.5 && kindReady('thrower') ? 'thrower' : 'big'; }
  return null;
}

function challengeStart() {
  if (faction.challenge === 'glass') {
    stats.maxHp = 1;
    player.hp = 1;
    stats.healEvery = 99999;
    stats.xp *= 2;
    game.revives = 0;
  }
}

function challengeBossPlan() {
  if (faction.challenge !== 'bosses') return null;
  return [[70, 0], [140, 0], [210, 1], [280, 2]];
}

function challengeReward(won) {
  if (!faction.challenge || !won || challengeDone()) return false;
  save.chalWeek = weekIndex();
  const g = gachaState();
  g.tickets10 = (g.tickets10 || 0) + 1;
  g.feathers = (g.feathers || 0) + 30;
  return true;
}

const nightLayer = makeCanvas(1, 1);
function drawNight() {
  if (faction.challenge !== 'night') return;
  const [c, g] = nightLayer;
  if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, bw, bh);
  g.fillStyle = 'rgba(6, 8, 22, 0.86)';
  g.fillRect(0, 0, bw, bh);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.75})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  hole(sx(player.x), sy(player.y, player.z * 0.5), 150 + Math.sin(performance.now() / 300) * 4);
  for (const fl of flares) hole(sx(fl.x), sy(fl.y, fl.z), 120, Math.min(1, fl.life));
  for (const e of emitters) if (e.fire) hole(sx(e.x), sy(e.y, e.z), 60, 0.8);
  for (const ch of chests) hole(sx(ch.x), sy(ch.y, 0), 50, 0.9);
  for (const a of allies) hole(sx(a.x), sy(a.y, a.z), 50, 0.6);
  for (const t of titans) if (t.stun > 0 && !t.dying) hole(sx(t.x), sy(t.y, t.H * 0.5), 60, 0.5);
  bctx.drawImage(c, 0, 0);
  for (const t of titans) {
    if (t.dying) continue;
    const x = sx(t.x), y = sy(t.y, t.H * 0.86), d = Math.hypot(t.x - player.x, t.y - player.y);
    if (d < 260) continue;
    bctx.globalAlpha = 0.85;
    rect(bctx, x - 3, y, 2, 1, '#ffe08a');
    rect(bctx, x + 1, y, 2, 1, '#ffe08a');
    bctx.globalAlpha = 1;
  }
}
