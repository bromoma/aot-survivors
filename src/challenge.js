'use strict';

const CHALLENGES = [
  { id: 'night', map: 2, name: 'Night Sortie', text: 'Darkness beyond the Wall: you only see what is near you, your flares and the fires' },
  { id: 'aberrant', map: 1, name: 'Aberrant Invasion', text: 'Only aberrant titans and crawlers: fast and unpredictable' },
  { id: 'giants', map: 2, name: 'Land of Giants', text: 'Fewer titans, but all of them huge: giants, throwers and 15-meter ones' },
  { id: 'glass', map: 0, name: 'Last Stand', text: 'One heart and no healing, but double XP' },
  { id: 'bosses', map: 1, name: 'Shifter Hunt', text: 'Shifters arrive every 70 seconds' },
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
  if (save.stats) save.stats.chalWins = (save.stats.chalWins || 0) + 1;
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
  lightHoles(g, 1);
  bctx.drawImage(c, 0, 0);
  lampGlow();
  titanEyes(260);
}
