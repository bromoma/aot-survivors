'use strict';

// Guided first run. The clock and spawns wait until the player has learned to move, climb, attack and use the ultimate.
const TUT_STEPS = [
  { id: 'move', text: () => IS_TOUCH ? tr('Drag your finger anywhere to fly') : tr('Fly with WASD or the arrow keys'), focus: null },
  { id: 'climb', text: () => tr('Fly towards rooftops and trees: your cables lift you up. Watch the HEIGHT gauge'), focus: 'gauge' },
  { id: 'attack', text: () => IS_TOUCH ? tr('A titan! Climb above the mark on the gauge and press the round button') : tr('A titan! Climb above the mark on the gauge and press Space'), focus: 'gauge' },
  { id: 'ult', text: () => IS_TOUCH ? tr('Your ultimate is ready: press the star button') : tr('Your ultimate is ready: press E'), focus: 'ult' },
  { id: 'done', text: () => tr('Survive until 10:00. Shifters arrive at 2:00, golden elites drop chests. Good luck!'), focus: null },
];
const TUT_REWARD = 150;
let tut = null;

function tutWanted() { return !challengeOn && (save.tutForce || (!save.tutDone && !(save.stats && save.stats.runs > 0))); }

function tutStart() {
  tut = tutWanted() ? { i: 0, t: 0, moved: 0, x: player.x, y: player.y } : null;
  if (!tut) return;
  titans.length = 0;
  game.spawnT = 999;
}

function tutHold() { return !!tut && tut.i < 4; }
function tutStep() { return tut ? TUT_STEPS[tut.i] : null; }

function tutNext() {
  tut.i++;
  tut.t = 0;
  sfx('chime3', { vol: 0.6, tag: 'tut' });
  if (tut.i === 2) {
    const a = rand(0, TAU);
    spawnTitan({ x: player.x + Math.cos(a) * 520, y: player.y + Math.sin(a) * 380 }, 'normal');
    const t = titans[titans.length - 1];
    t.speed *= 0.45;
    t.hp = 1;
    t.tut = true;
  }
  if (tut.i === 3) game.ult = 1;
  if (tut.i === 4) tutFinish(false);
}

function tutFinish(skipped) {
  save.tutDone = true;
  save.tutForce = false;
  if (!skipped && !save.tutPaid) {
    save.tutPaid = true;
    save.tokens += TUT_REWARD;
    addText(tr('Training complete! +{0}', TUT_REWARD), player.x, player.y - KZ * player.z - 80, '#ffd36e');
  }
  persist();
  game.spawnT = Math.min(game.spawnT, 2);
  if (skipped) tut = null;
}

function tutSkip() {
  if (!tut) return;
  tutFinish(true);
}

function tutTick(dt) {
  if (!tut) return;
  tut.t += dt;
  const p = player;
  if (tut.i < 4) game.spawnT = Math.max(game.spawnT, 1);
  if (tut.i === 0) {
    tut.moved += Math.hypot(p.x - tut.x, p.y - tut.y);
    tut.x = p.x; tut.y = p.y;
    if (tut.moved > 500 && tut.t > 3) tutNext();
  } else if (tut.i === 1) {
    if ((p.z - floorZ(p.x, p.y) > 120 && tut.t > 3) || tut.t > 20) tutNext();
  } else if (tut.i === 2) {
    if (game.kills > 0) tutNext();
    else if (!titans.some(t => t.tut && !t.dying)) { tut.i = 1; tutNext(); }
  } else if (tut.i === 3) {
    if (game.ultUses > 0 || tut.t > 25) tutNext();
    else if (game.ult < 1 && !game.ultFx) game.ult = 1;
  } else if (tut.i === 4 && tut.t > 7) tut = null;
}
