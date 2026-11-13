'use strict';

const SKILLS = {
  spin: {
    name: 'Вихрь клинков', icon: 4, max: 5,
    cd: [6, 5, 4.2, 3.5, 2.8], rad: [155, 175, 195, 215, 240],
    text: l => l === 0 ? tr('Время от времени режет всех титанов вокруг. Работает только в воздухе') : tr('Вихрь шире и чаще'),
  },
  flash: {
    name: 'Световая ракета', icon: 7, max: 5,
    cd: [9, 8, 7, 6, 5], rad: [220, 250, 280, 310, 350], dur: [2, 2.4, 2.8, 3.2, 3.6],
    text: l => l === 0 ? tr('Ослепляет толпу титанов: они замирают, а их затылок проще достать') : tr('Вспышка шире, титаны слепнут дольше'),
  },
  cannon: {
    name: 'Пушки гарнизона', icon: 8, max: 5,
    cd: [4, 3.6, 3.2, 2.8, 2.4], shots: [1, 1, 2, 2, 3], stun: [0.8, 1, 1, 1.2, 1.4],
    text: l => l === 0 ? tr('Стена стреляет по титанам рядом с тобой: сбивает с ног и прерывает захват') : l === 1 || l === 3 ? tr('Залп из двух ядер') : tr('Пушки бьют чаще и сильнее'),
  },
  ally: {
    name: 'Боевой товарищ', icon: 9, max: 5,
    count: [1, 1, 2, 2, 3], cd: [9, 7, 7, 5.5, 5.5],
    text: l => l === 0 ? tr('С тобой летит разведчик и сам срезает затылки титанам') : l === 1 || l === 3 ? tr('Ещё один товарищ в отряде') : tr('Товарищи атакуют чаще'),
  },
  trap: {
    name: 'Ловушка Ханджи', icon: 10, max: 5,
    cd: [12, 11, 10, 9, 8], caps: [1, 1, 2, 2, 3], dur: [4, 5, 5, 6, 7],
    text: l => l === 0 ? tr('Сеть из тросов на пути титана: пойманный стоит на месте, затылок низко') : tr('Сеть держит дольше и ловит больше титанов'),
  },
};

const PASSIVES = {
  speed: { name: 'Мощная лебёдка', icon: 0, max: 5, text: () => tr('Летаешь на 10% быстрее'), apply: s => { s.speed *= 1.1; } },
  range: { name: 'Длинные тросы', icon: 1, max: 5, text: () => tr('Тросы и атака достают на 15% дальше'), apply: s => { s.range *= 1.15; s.engage *= 1.15; } },
  orbit: { name: 'Быстрый облёт', icon: 2, max: 5, text: () => tr('Заходишь титану за спину на 15% быстрее'), apply: s => { s.orbit *= 1.15; } },
  hp: { name: 'Перевязка', icon: 3, max: 5, text: () => tr('+1 к здоровью и лечение'), apply: s => { s.maxHp += 1; player.hp = Math.min(s.maxHp, player.hp + 2); } },
  heal: { name: 'Полевой медик', icon: 5, max: 5, text: () => tr('Лечение за убийства приходит быстрее'), apply: s => { s.healEvery = Math.max(6, s.healEvery - 4); } },
  glide: { name: 'Лёгкий газ', icon: 6, max: 5, text: () => tr('Планируешь вниз на 25% медленнее'), apply: s => { s.glide *= 0.75; } },
};

const BOSSES = [
  { kind: 'female', at: 150, name: 'Женская особь', size: 170, hp: 3, speed: 150, wp: 'лодыжки', wz: 0.06, ws: 0.11, kneel: 3 },
  { kind: 'armored', at: 300, name: 'Бронированный титан', size: 190, hp: 4, speed: 70, wp: 'колени', wz: 0.2, ws: 0.13, kneel: 3.4 },
  { kind: 'beast', at: 450, name: 'Звероподобный титан', size: 210, hp: 3, speed: 60, wp: 'руки', wz: 0.42, ws: 0.24, kneel: 3.6 },
  { kind: 'colossal', at: 570, name: 'Колоссальный титан', size: 300, hp: 4, speed: 22, wp: 'лодыжки', wz: 0.05, ws: 0.12, kneel: 4 },
];

trFields(Object.values(SKILLS), ['name']);
trFields(Object.values(PASSIVES), ['name']);
trFields(BOSSES, ['name', 'wp']);
let allies = [], traps = [], shots = [], rocks = [], marks = [];

function combatReset() {
  allies = [];
  traps = [];
  shots = [];
  rocks = [];
  marks = [];
  stats.skills = { spin: 0, flash: 0, cannon: 0, ally: 0, trap: 0 };
  stats.pass = { speed: 0, range: 0, orbit: 0, hp: 0, heal: 0, glide: 0 };
  game.sk = { spin: 3, flash: 2, cannon: 1.5, trap: 3 };
  game.boss = null;
  game.bossIdx = 0;
  game.bossKills = 0;
  game.banner = null;
}

function skillLevelText(id, l) {
  const S = SKILLS[id];
  if (id === 'spin') return tr('Каждые {0} с', S.cd[l]);
  if (id === 'flash') return tr('Каждые {0} с, ослепляет на {1} с', S.cd[l], S.dur[l]);
  if (id === 'cannon') return tr('Каждые {0} с, ядер: {1}', S.cd[l], S.shots[l]);
  if (id === 'ally') return tr('Товарищей: {0}, атака раз в {1} с', S.count[l], S.cd[l]);
  return tr('Каждые {0} с, ловит до {1}, держит {2} с', S.cd[l], S.caps[l], S.dur[l]);
}

function rollChoices(n) {
  const pool = [];
  const owned = Object.values(stats.skills).filter(Boolean).length;
  for (const [id, S] of Object.entries(SKILLS)) {
    const l = stats.skills[id];
    if (l < S.max) pool.push({ kind: 'skill', id, w: l ? 1.6 : 1.2 });
  }
  for (const [id, P] of Object.entries(PASSIVES)) if (stats.pass[id] < P.max) pool.push({ kind: 'pass', id, w: 1 });
  const out = [];
  if (!owned && game.level <= 4) {
    const fresh = pool.filter(p => p.kind === 'skill');
    if (fresh.length) {
      const f = pick(fresh);
      out.push(f);
      pool.splice(pool.indexOf(f), 1);
    }
  }
  while (out.length < n && pool.length) {
    let sum = 0;
    for (const p of pool) sum += p.w;
    let r = Math.random() * sum, k = 0;
    while (k < pool.length - 1 && (r -= pool[k].w) > 0) k++;
    out.push(pool.splice(k, 1)[0]);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (!out.length) out.push({ kind: 'pass', id: 'hp', w: 1 });
  return out.map(makeChoice);
}

function makeChoice(p) {
  if (p.kind === 'skill') {
    const S = SKILLS[p.id], l = stats.skills[p.id];
    return {
      id: p.id, kind: 'skill', name: S.name, icon: S.icon, lvl: l, max: S.max, isNew: l === 0,
      desc: () => S.text(l) + '. ' + skillLevelText(p.id, l),
      apply: () => {
        stats.skills[p.id]++;
        if (p.id === 'ally') syncAllies();
        if (p.id === 'spin') game.sk.spin = Math.min(game.sk.spin, 1);
      },
    };
  }
  const P = PASSIVES[p.id], l = stats.pass[p.id];
  return {
    id: p.id, kind: 'pass', name: P.name, icon: P.icon, lvl: l, max: P.max, isNew: l === 0,
    desc: () => P.text(l),
    apply: () => { stats.pass[p.id]++; P.apply(stats); },
  };
}

const alive = t => !t.dying;
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function stunTitan(t, dur, kind) {
  if (t.dying) return;
  if (t.boss) {
    if (t.boss.kind === 'armored' || (kind === 'trap' && t.boss.kind === 'colossal')) return;
    dur *= kind === 'trap' ? 0.3 : 0.35;
  }
  t.stun = Math.max(t.stun, dur);
  if (t.state === 'grab' || t.state === 'recover') { t.state = 'walk'; t.hand = null; t.grabCd = 1; }
}

function updateSkills(dt) {
  const L = stats.skills, p = player, sk = game.sk;
  if (L.spin) {
    sk.spin -= dt;
    if (sk.spin <= 0) {
      const S = SKILLS.spin, rad = S.rad[L.spin - 1];
      sk.spin = S.cd[L.spin - 1];
      rings.push({ x: p.x, y: p.y, r: rad, life: 0.35, color: '#dfe8f0' });
      for (let i = 0; i < 4; i++) slashes.push({ x: p.x, y: p.y - KZ * p.z, ang: i * Math.PI / 2, life: 0.22, big: true });
      sfx('spin', { vol: 0.7 });
      for (const t of titans) {
        if (t.dying || t.boss) continue;
        if (Math.hypot(t.x - p.x, t.y - p.y) < rad + t.H * 0.1 && p.z >= reqZ(t) * 0.5) cutTitan(t);
      }
    }
  }
  if (L.flash) {
    sk.flash -= dt;
    if (sk.flash <= 0) {
      const S = SKILLS.flash, rad = S.rad[L.flash - 1];
      let best = null, bc = 0;
      for (const t of titans) {
        if (t.dying || dist2(t, p) > 750) continue;
        let c = 0;
        for (const o of titans) if (!o.dying && dist2(o, t) < rad) c += o.boss ? 3 : 1;
        if (c > bc) { bc = c; best = t; }
      }
      if (best) {
        sk.flash = S.cd[L.flash - 1];
        const cx = best.x, cy = best.y;
        rings.push({ x: cx, y: cy, r: rad, life: 0.35, color: '#fff6c8' });
        rings.push({ x: cx, y: cy, r: rad * 0.6, life: 0.3, color: '#ffffff' });
        for (let i = 0; i < 26; i++) {
          const a = rand(0, TAU), s = rand(80, 320);
          particles.push({ x: cx, y: cy - 160, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, size: rand(2, 4), g: 60, kind: 'flare', color: '#fff2b0' });
        }
        game.flashT = 0.12;
        sfx('flashbang', { x: cx, y: cy, vol: 0.8 });
        for (const t of titans) if (!t.dying && dist2(t, best) < rad) stunTitan(t, S.dur[L.flash - 1], 'flash');
      } else sk.flash = 0.5;
    }
  }
  if (L.cannon) {
    sk.cannon -= dt;
    if (sk.cannon <= 0) {
      const S = SKILLS.cannon;
      const near = titans.filter(t => !t.dying && dist2(t, p) < 650);
      if (near.length) {
        sk.cannon = S.cd[L.cannon - 1];
        const n = Math.min(near.length, S.shots[L.cannon - 1]);
        for (let i = 0; i < n; i++) {
          const t = near.splice(Math.floor(Math.random() * near.length), 1)[0];
          const side = pick([[-1, 0], [1, 0], [0, -1], [0, 1]]);
          shots.push({ x0: t.x + side[0] * 900 + rand(-200, 200), y0: t.y + side[1] * 900 + rand(-200, 200), t: 0, dur: 0.55 + i * 0.12, target: t, x: t.x, y: t.y, stun: S.stun[L.cannon - 1] });
        }
        sfx('boom', { vol: 0.35, rate: 1.4, tag: 'cannonfire' });
      } else sk.cannon = 0.5;
    }
  }
  if (L.trap) {
    sk.trap -= dt;
    if (sk.trap <= 0) {
      const S = SKILLS.trap;
      let tgt = null, bd = 520;
      for (const t of titans) if (!t.dying && !t.stun && dist2(t, p) < bd) { bd = dist2(t, p); tgt = t; }
      if (tgt) {
        sk.trap = S.cd[L.trap - 1];
        const ahead = 60;
        traps.push({ x: tgt.x + Math.cos(tgt.face) * ahead, y: tgt.y + Math.sin(tgt.face) * ahead, r: 95, life: 10, caps: S.caps[L.trap - 1], dur: S.dur[L.trap - 1], caught: [], seed: Math.random() * 10 });
        sfx('snap', { vol: 0.5, tag: 'trapset' });
      } else sk.trap = 0.6;
    }
  }
  updateShots(dt);
  updateTraps(dt);
  updateAllies(dt);
  updateRocks(dt);
}

function updateShots(dt) {
  for (const s of shots) {
    s.t += dt;
    if (s.target && !s.target.dying) { s.x = s.target.x; s.y = s.target.y; }
    if (s.t >= s.dur && !s.done) {
      s.done = true;
      const t = s.target;
      if (t && !t.dying) {
        stunTitan(t, s.stun, 'cannon');
        if (!t.boss || t.boss.kind !== 'armored') {
          const a = Math.atan2(t.y - player.y, t.x - player.x);
          t.x += Math.cos(a) * 60;
          t.y += Math.sin(a) * 60;
        }
      }
      for (let i = 0; i < 14; i++) particles.push({ x: s.x + rand(-20, 20), y: s.y - rand(40, 140), vx: rand(-120, 120), vy: rand(-160, 20), life: rand(0.4, 0.8), max: 0.8, size: rand(1, 2.5), g: 300, kind: 'px', color: pick(['#ffd36e', '#ff9a3a', '#5a4a3a']) });
      steam(s.x, s.y - 90, 4, 30);
      game.shake = Math.max(game.shake, 5);
      sfx('boom', { x: s.x, y: s.y, vol: 0.8 });
    }
  }
  shots = shots.filter(s => !s.done || s.t < s.dur + 0.05);
}

function updateTraps(dt) {
  for (const tr of traps) {
    tr.life -= dt;
    if (tr.caught.length < tr.caps && tr.life > 0) {
      for (const t of titans) {
        if (t.dying || t.bound || tr.caught.includes(t)) continue;
        if (Math.hypot(t.x - tr.x, t.y - tr.y) > tr.r + t.H * 0.05) continue;
        if (t.boss && (t.boss.kind === 'armored' || t.boss.kind === 'colossal')) continue;
        stunTitan(t, tr.dur, 'trap');
        t.bound = tr;
        tr.caught.push(t);
        addText(tr('Пойман!'), t.x, t.y - KZ * t.H * 0.6, '#7ad8d0');
        sfx('snap', { x: t.x, y: t.y, vol: 0.8 });
        if (tr.caught.length >= tr.caps) break;
      }
    }
    for (const t of tr.caught) if (t.bound === tr && (t.stun <= 0 || t.dying)) t.bound = null;
  }
  traps = traps.filter(tr => tr.life > 0 || tr.caught.some(t => t.bound === tr));
}

function allyHeroes() {
  const ids = CHARS.map(c => c.id).filter(id => id !== player.char && save.chars[id]);
  const rest = CHARS.map(c => c.id).filter(id => id !== player.char && !ids.includes(id));
  return ids.concat(rest);
}

function syncAllies() {
  const want = SKILLS.ally.count[stats.skills.ally - 1] || 0;
  const pool = allyHeroes();
  while (allies.length < want) {
    const hero = pool[allies.length % pool.length];
    allies.push({ hero, x: player.x, y: player.y, z: player.z + 40, vx: 0, vy: 0, state: 'follow', cd: 2 + allies.length, target: null, dir: Math.PI / 2, idx: allies.length });
  }
}

function updateAllies(dt) {
  if (!allies.length) return;
  const L = stats.skills.ally, cd = SKILLS.ally.cd[L - 1];
  const taken = new Set(allies.map(a => a.target).filter(Boolean));
  for (const a of allies) {
    const ox = a.x, oy = a.y;
    if (a.state === 'follow') {
      a.cd -= dt;
      const ang = game.time * 1.3 + a.idx * TAU / allies.length;
      const tx = player.x + Math.cos(ang) * 80, ty = player.y + Math.sin(ang) * 50;
      const k = 1 - Math.exp(-4 * dt);
      a.x = lerp(a.x, tx, k);
      a.y = lerp(a.y, ty, k);
      a.z = lerp(a.z, Math.max(70, player.z + 30), k);
      if (a.cd <= 0) {
        let best = null, bd = 620;
        for (const t of titans) {
          if (t.dying || t.boss || taken.has(t) || t === player.target) continue;
          const d = dist2(t, a);
          if (d < bd) { bd = d; best = t; }
        }
        if (best) { a.state = 'attack'; a.target = best; a.t = 0; taken.add(best); sfx('rope', { x: a.x, y: a.y, vol: 0.4, tag: 'allyrope' }); }
        else a.cd = 0.5;
      }
    } else if (a.state === 'attack') {
      a.t += dt;
      const t = a.target;
      if (!t || t.dying || a.t > 4) { a.state = 'return'; a.target = null; continue; }
      const n = nape(t);
      const dx = n.x - a.x, dy = n.y - a.y, dz = n.z - a.z, d = Math.hypot(dx, dy, dz);
      const sp = 900 * dt;
      if (d <= sp + 10) {
        cutTitan(t, true);
        a.state = 'return';
        a.target = null;
        a.cd = cd;
      } else {
        a.x += dx / d * sp;
        a.y += dy / d * sp;
        a.z += dz / d * sp;
      }
    } else {
      const dx = player.x - a.x, dy = player.y - a.y, d = Math.hypot(dx, dy);
      if (d < 120) a.state = 'follow';
      else { a.x += dx / d * 700 * dt; a.y += dy / d * 700 * dt; a.z = lerp(a.z, player.z + 30, 1 - Math.exp(-3 * dt)); }
    }
    const mx = a.x - ox, my = a.y - oy;
    if (Math.hypot(mx, my) > 0.5) a.dir = Math.atan2(my, mx);
    if (Math.random() < dt * 8) particles.push({ x: a.x, y: a.y - KZ * a.z + 4, vx: -mx * 4, vy: -my * 4, life: 0.3, max: 0.3, size: rand(1, 2), g: 0, kind: 'gas' });
  }
}

function updateRocks(dt) {
  for (const r of rocks) {
    r.t += dt;
    if (r.t >= r.dur && !r.done) {
      r.done = true;
      const p = player;
      if (Math.hypot(p.x - r.tx, p.y - r.ty) < 75 && p.z < (r.fire ? 320 : 230)) hurtPlayer({ x: r.tx, y: r.ty });
      if (r.fire) for (let i = 0; i < 8; i++) particles.push({ x: r.tx + rand(-20, 20), y: r.ty + rand(-10, 10), vx: rand(-90, 90), vy: rand(-200, -60), life: 0.6, max: 0.6, size: 2, g: 300, kind: 'px', color: pick(['#ff9a3a', '#ffd36e', '#e5484d']) });
      for (const t of titans) if (!t.dying && !t.boss && Math.hypot(t.x - r.tx, t.y - r.ty) < 90) stunTitan(t, 1, 'rock');
      for (const c of civs) if (Math.hypot(c.x - r.tx, c.y - r.ty) < 60) { c.dead = true; game.lost++; }
      for (let i = 0; i < 18; i++) particles.push({ x: r.tx + rand(-25, 25), y: r.ty + rand(-12, 12), vx: rand(-160, 160), vy: rand(-240, -40), life: rand(0.4, 0.9), max: 0.9, size: rand(1, 3), g: 600, kind: 'px', color: pick(['#8a8478', '#6a655c', '#a8a090', '#5a4a3a']) });
      steam(r.tx, r.ty, 3, 30);
      game.shake = Math.max(game.shake, 7);
      sfx('boom', { x: r.tx, y: r.ty, vol: 0.9, rate: 0.8, tag: 'rock' });
    }
  }
  rocks = rocks.filter(r => !r.done);
  for (const m of marks) m.life -= dt;
  marks = marks.filter(m => m.life > 0);
}

function bossSchedule() {
  if (game.boss) return;
  const cycle = Math.floor(game.bossIdx / BOSSES.length);
  const def = BOSSES[game.bossIdx % BOSSES.length];
  const at = def.at + cycle * 600;
  if (game.time >= at) {
    spawnBoss(def, cycle);
    game.bossIdx++;
  }
}

function spawnBoss(def, cycle = 0) {
  const p = player;
  const a = rand(0, TAU), dist = Math.hypot(viewW(), viewH()) / 2 + 200;
  let x = p.x + Math.cos(a) * dist;
  let y = p.y + Math.sin(a) * dist;
  if (def.kind === 'colossal') { x = p.x + rand(-200, 200); y = p.y - 950; }
  const H = def.size * ART;
  const hp = Math.max(2, def.hp + (factionSel === 0 ? -1 : 0) + cycle + Math.floor((threat - 1) / 2));
  const t = {
    x, y, H, Hp: def.size, size: def.size, art: 'boss', set: 'boss', napeZ: H * 0.82, face: Math.atan2(p.y - y, p.x - x),
    type: 'normal', g: bodyOf('normal'), speed: def.speed * faction.speed, aberrant: false,
    state: 'walk', grabT: 0, grabCd: 2, grabAng: 0, hand: null, prey: null, preyT: 99, held: -1,
    stun: 0, lunge: 0, lungeCd: 99, flash: 0, phase: 0, dying: 0, fallDir: 1, fallSide: 1, deathKey: 'down',
    boss: { kind: def.kind, name: def.name, hp, max: hp, harden: 0, act: 'walk', actT: 0, cd: 3, dir: 0, warned: 0, def, kneel: 0, wp: [{ side: -1, cut: false }, { side: 1, cut: false }], kickCd: 3, callT: 14, rainT: 6 },
  };
  titans.push(t);
  game.boss = t;
  game.banner = { text: def.name, sub: tr('Подрежь {0}, чтобы открыть затылок', def.wp), t: 3.4 };
  game.shake = 18;
  fireFlare(p.x + Math.cos(a) * 300, p.y + Math.sin(a) * 300, '#ff3a2a');
  sfx('horn', { vol: 0.9 });
}

function wpPos(t, w) {
  const def = t.boss.def, s = w.side * t.H * def.ws;
  return { x: t.x - Math.sin(t.face) * s + Math.cos(t.face) * t.H * 0.03, y: t.y + Math.cos(t.face) * s * 0.7 + Math.sin(t.face) * t.H * 0.03, z: t.H * def.wz };
}

function bossWeak(t) {
  let best = null, bd = Infinity;
  for (const w of t.boss.wp) {
    if (w.cut) continue;
    const q = wpPos(t, w), d = Math.hypot(q.x - player.x, q.y - player.y);
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}

function cutWeakPoint(t, w) {
  const b = t.boss, p = player, q = wpPos(t, w);
  w.cut = true;
  burst(q.x, q.y - KZ * q.z, 26, '#b3122e');
  steam(q.x, q.y - KZ * q.z, 8, 12);
  slashes.push({ x: q.x, y: q.y - KZ * q.z, ang: t.face + Math.PI / 2, life: 0.22, big: true });
  splatDecal(q.x, q.y, 7);
  sfx('slash', { vol: 1 });
  sfx('cut', { vol: 0.9, rate: 0.9 });
  game.hitstop = 0.06;
  game.shake = Math.max(game.shake, 8);
  const ax = q.x - t.x, ay = q.y - t.y, al = Math.hypot(ax, ay) || 1;
  p.mode = 'fly';
  p.target = null;
  p.wp = null;
  p.vx = ax / al * 460;
  p.vy = ay / al * 460;
  p.z += 50;
  p.engageCd = 0.25;
  gainXp(2);
  const left = b.wp.filter(x => !x.cut).length;
  if (left) { addText(tr('Подрезано: {0} {1}/2', b.def.wp, 2 - left), q.x, q.y - KZ * q.z - 30, '#ffd27a'); return; }
  b.kneel = b.def.kneel;
  t.stun = b.kneel;
  t.state = 'walk';
  t.hand = null;
  t.lunge = 0;
  b.act = 'walk';
  b.harden = 0;
  game.shake = 16;
  rings.push({ x: t.x, y: t.y, r: t.H * 0.6, life: 0.35, color: '#d8c8a0' });
  for (let i = 0; i < 24; i++) { const a = rand(0, TAU), s = rand(100, 320); particles.push({ x: t.x + rand(-30, 30), y: t.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, life: 0.7, max: 0.7, size: 2, g: 0, kind: 'dust' }); }
  sfx('boom', { x: t.x, y: t.y, vol: 1, rate: 0.6 });
  game.banner = { text: tr('На колени!'), sub: tr('Затылок открыт — бей!'), t: 1.6, win: true };
}

function bossRise(t) {
  const b = t.boss;
  b.kneel = 0;
  t.stun = 0;
  for (const w of b.wp) {
    if (w.cut) { const q = wpPos(t, w); steam(q.x, q.y - KZ * q.z, 6, 10); }
    w.cut = false;
  }
}

function updateBoss(t, dt) {
  const b = t.boss, p = player;
  b.harden = Math.max(0, b.harden - dt);
  t.preyT = 99;
  t.prey = null;
  const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy) || 1;
  b.cd -= dt;
  b.kickCd -= dt;
  if (b.act === 'kick') {
    b.actT -= dt;
    t.phase += dt * 3;
    if (b.actT <= 0) {
      b.act = 'walk';
      const R = 240;
      rings.push({ x: t.x, y: t.y, r: R, life: 0.35, color: '#9fe8ff' });
      game.shake = Math.max(game.shake, 9);
      sfx('crystal', { x: t.x, y: t.y, vol: 0.9 });
      sfx('boom', { x: t.x, y: t.y, vol: 0.7, rate: 1.2 });
      if (Math.hypot(p.x - t.x, p.y - t.y) < R && p.z < t.H * 0.75) hurtPlayer(t);
    }
    return true;
  }
  if (b.kickCd <= 0 && d < 250 && p.z < t.H * 0.75 && t.state === 'walk' && (b.kind === 'female' || b.kind === 'armored')) {
    b.act = 'kick';
    b.actT = 0.65;
    b.kickCd = rand(4, 6);
    marks.push({ x: t.x, y: t.y, r: 240, life: 0.65, max: 0.65, kind: 'rock' });
    sfx('swing', { x: t.x, y: t.y, vol: 0.8, rate: 0.8, tag: 'kick' });
    return true;
  }
  if (b.kind === 'beast') {
    b.callT -= dt;
    if (b.callT <= 0 && d < 1500) {
      b.callT = rand(20, 26);
      sfx('roar', { x: t.x, y: t.y, vol: 1 });
      for (let i = 0; i < 3; i++) rings.push({ x: t.x, y: t.y - 10, r: 160 + i * 110, life: 0.35 + i * 0.08, color: '#fff6e0' });
      game.shake = Math.max(game.shake, 8);
      for (let i = 0; i < 3; i++) { const a = rand(0, TAU); spawnTitan({ x: t.x + Math.cos(a) * 320, y: t.y + Math.sin(a) * 320 }, Math.random() < 0.5 ? 'small' : 'normal'); }
      game.banner = { text: tr('Зверь зовёт стаю!'), sub: tr('Титаны идут на рёв'), t: 1.8 };
    }
  }
  if (b.kind === 'colossal') {
    b.rainT -= dt;
    if (b.rainT <= 0 && d < 1600) {
      b.rainT = rand(6.5, 8.5);
      for (let i = 0; i < 5; i++) {
        const tx = p.x + p.vx * 0.9 + rand(-260, 260), ty = p.y + p.vy * 0.9 + rand(-200, 200), dur = 1.3 + i * 0.12;
        rocks.push({ x0: tx + rand(-60, 60), y0: ty - 40, z0: 950, tx, ty, t: 0, dur, fire: true });
        marks.push({ x: tx, y: ty, r: 75, life: dur, max: dur, kind: 'rock' });
      }
      sfx('rumble', { vol: 0.8, tag: 'rain' });
    }
  }
  if (b.kind === 'female') {
    if (b.act === 'flee') {
      b.actT -= dt;
      t.face = Math.atan2(-dy, -dx);
      t.x -= dx / d * 280 * dt;
      t.y -= dy / d * 280 * dt;
      t.phase += dt * 10;
      if (b.actT <= 0) b.act = 'walk';
      clampTitan(t);
      return true;
    }
    if (b.cd <= 0 && d > 160 && d < 520 && t.state === 'walk') {
      t.face = Math.atan2(dy, dx);
      t.lunge = 0.45;
      b.cd = rand(3, 4.5);
      sfx('swing', { x: t.x, y: t.y, vol: 0.9 });
    }
    return false;
  }
  if (b.kind === 'armored') {
    if (b.act === 'aim') {
      b.actT -= dt;
      t.face = b.dir;
      if (b.actT <= 0) { b.act = 'charge'; b.actT = 0.9; sfx('rumble', { x: t.x, y: t.y, vol: 1 }); }
      return true;
    }
    if (b.act === 'charge') {
      b.actT -= dt;
      t.x += Math.cos(b.dir) * 950 * dt;
      t.y += Math.sin(b.dir) * 950 * dt;
      t.phase += dt * 16;
      game.shake = Math.max(game.shake, 3);
      if (Math.random() < dt * 30) particles.push({ x: t.x + rand(-30, 30), y: t.y + rand(-10, 10), vx: rand(-80, 80), vy: rand(-60, -10), life: 0.6, max: 0.6, size: 2, g: 0, kind: 'dust' });
      if (Math.hypot(p.x - t.x, p.y - t.y) < 90 && p.z < t.H * 0.6) hurtPlayer(t);
      for (const o of titans) if (o !== t && !o.dying && !o.boss && Math.hypot(o.x - t.x, o.y - t.y) < 80) { o.x += Math.cos(b.dir) * 40; o.y += Math.sin(b.dir) * 40; stunTitan(o, 1, 'rock'); }
      clampTitan(t);
      if (b.actT <= 0) {
        b.act = 'walk';
        b.cd = rand(5, 7);
        t.stun = 1.8;
        addText(tr('Застрял!'), t.x, t.y - KZ * t.H * 0.9, '#ffd27a');
        sfx('thud', { x: t.x, y: t.y, vol: 0.9 });
      }
      return true;
    }
    if (b.cd <= 0 && d < 900 && t.state === 'walk') {
      b.act = 'aim';
      b.actT = 1.1;
      b.dir = Math.atan2(dy, dx);
      sfx('horn', { x: t.x, y: t.y, vol: 0.5, rate: 1.4, tag: 'aim' });
      return true;
    }
    return false;
  }
  if (b.kind === 'beast') {
    if (b.cd <= 0 && d < 1100) {
      b.cd = rand(3.2, 4.2);
      const n = 3 + Math.floor(difficulty() * 3);
      for (let i = 0; i < n; i++) {
        const lead = 0.8;
        const tx = p.x + p.vx * lead + rand(-150, 150);
        const ty = p.y + p.vy * lead + rand(-150, 150);
        const dur = 1.15 + i * 0.12;
        rocks.push({ x0: t.x, y0: t.y, z0: t.H * 0.85, tx, ty, t: 0, dur });
        marks.push({ x: tx, y: ty, r: 75, life: dur, max: dur, kind: 'rock' });
      }
      sfx('swing', { x: t.x, y: t.y, vol: 1, rate: 0.7, tag: 'throw' });
    }
    if (d < reachOf(t) + 40) return false;
    const want = d > 700 ? 1 : d < 450 ? -1 : 0;
    t.face = Math.atan2(dy, dx);
    if (want) {
      t.x += dx / d * want * t.speed * 1.4 * dt;
      t.y += dy / d * want * t.speed * 1.4 * dt;
      t.phase += dt * 6;
    }
    clampTitan(t);
    return true;
  }
  if (b.kind === 'colossal') {
    if (b.act === 'steam') {
      b.actT -= dt;
      if (Math.random() < dt * 30) steam(t.x + rand(-60, 60), t.y - KZ * t.H * rand(0.3, 0.9), 1, 30);
      if (b.actT <= 0) {
        b.act = 'vent';
        b.actT = 1.6;
        b.harden = 2.8;
        rings.push({ x: t.x, y: t.y, r: 430, life: 0.35, color: '#f4f6f8' });
        steam(t.x, t.y - KZ * t.H * 0.5, 40, 200);
        game.shake = 16;
        sfx('steamburst', { vol: 1 });
        if (Math.hypot(p.x - t.x, p.y - t.y) < 430) {
          hurtPlayer(t);
          p.vx = (p.x - t.x) / (d || 1) * 900;
          p.vy = (p.y - t.y) / (d || 1) * 900;
        }
      }
      return true;
    }
    if (b.act === 'vent') {
      b.actT -= dt;
      if (Math.random() < dt * 20) steam(t.x + rand(-80, 80), t.y - KZ * t.H * rand(0.2, 0.9), 1, 40);
      if (b.actT <= 0) { b.act = 'walk'; b.cd = rand(6, 8); }
      return true;
    }
    if (b.cd <= 0) {
      b.act = 'steam';
      b.actT = 1.4;
      marks.push({ x: t.x, y: t.y, r: 430, life: 1.4, max: 1.4, kind: 'steam' });
      sfx('hiss', { x: t.x, y: t.y, vol: 1, tag: 'colhiss' });
      return true;
    }
    return false;
  }
  return false;
}

function clampTitan(t) {
}

function bossHit(t) {
  const b = t.boss, p = player;
  b.hp--;
  t.flash = 0.15;
  game.hitstop = 0.1;
  game.shake = 12;
  const n = nape(t);
  burst(n.x, n.y - KZ * n.z, 24, '#b3122e');
  steam(n.x, n.y - KZ * n.z, 8);
  slashes.push({ x: n.x, y: n.y - KZ * n.z, ang: t.face + Math.PI, life: 0.22 });
  sfx('slash', { vol: 1 });
  sfx('cut', { vol: 0.9, rate: 0.75 });
  p.mode = 'fly';
  p.target = null;
  p.vx = -Math.cos(t.face) * 420;
  p.vy = -Math.sin(t.face) * 420;
  p.engageCd = 0.6;
  if (b.hp <= 0) {
    game.boss = null;
    game.bossKills++;
    (game.bossKinds || (game.bossKinds = [])).push(b.kind);
    killTitan(t);
    gainXp(25 + game.bossKills * 10);
    if (player.hp < stats.maxHp) player.hp++;
    game.banner = { text: b.name, sub: tr('Повержен! Награда — улучшение'), t: 2.6, win: true };
    sfx('victory', { vol: 0.7 });
    pendingLevels++;
    if (state === 'play') openLevelUp();
    return;
  }
  bossRise(t);
  b.harden = 1.6;
  sfx('crystal', { x: t.x, y: t.y, vol: 0.8 });
  addText(tr('Есть! Осталось {0}/{1}', b.hp, b.max), n.x, n.y - KZ * n.z - 40, '#9fe8ff');
  gainXp(6);
  if (b.kind === 'female') { b.act = 'flee'; b.actT = 2.4; }
}

const STAR_PX = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];
function drawStunStars(x, y, n = 3) {
  const now = performance.now() / 1000;
  for (let i = 0; i < n; i++) {
    const a = now * 4 + i * TAU / n;
    const px = Math.round(x + Math.cos(a) * 9), py = Math.round(y + Math.sin(a) * 3);
    for (const [ox, oy] of STAR_PX) rect(bctx, px + ox, py + oy, 1, 1, i % 2 ? '#fff2a8' : '#ffd36e');
  }
}

function drawCombatGround() {
  const now = performance.now() / 1000;
  for (const tr of traps) {
    const x = sx(tr.x), y = sy(tr.y, 0), R = tr.r / ART;
    if (tr.life > 0) {
      bctx.fillStyle = 'rgba(122, 216, 208, 0.55)';
      for (let a = 0; a < TAU; a += 3 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R * 0.6), 1, 1);
    }
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + tr.seed, px = Math.round(x + Math.cos(a) * R), py = Math.round(y + Math.sin(a) * R * 0.6);
      rect(bctx, px - 1, py - 6, 3, 7, '#2a1c12');
      rect(bctx, px, py - 5, 1, 5, '#8a6a44');
    }
  }
  for (const m of marks) {
    const x = sx(m.x), y = sy(m.y, 0), k = 1 - m.life / m.max, R = m.r / ART;
    if (m.kind === 'rock') {
      bctx.globalAlpha = 0.35 + 0.3 * k;
      disc(bctx, x, y, R * k, R * k * 0.6, '#c0392b');
      bctx.globalAlpha = 1;
      bctx.fillStyle = Math.floor(now * 8) % 2 ? '#ff6b4a' : '#ffd36e';
      for (let a = 0; a < TAU; a += 2.5 / R) bctx.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R * 0.6), 1, 1);
    } else {
      bctx.fillStyle = `rgba(244, 246, 248, ${(0.3 + 0.5 * k).toFixed(2)})`;
      const rr = R * (0.3 + 0.7 * k);
      for (let a = 0; a < TAU; a += 2 / rr) bctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.6), 2, 1);
    }
  }
  const B = game.boss;
  if (B && B.boss.kind === 'armored' && B.boss.act === 'aim') {
    const x = sx(B.x), y = sy(B.y, 0), dir = B.boss.dir;
    bctx.fillStyle = Math.floor(now * 10) % 2 ? '#e5484d' : '#ff9a8a';
    for (let d = 20; d < 950 / ART; d += 6) {
      for (const off of [-12, 12]) {
        const px = x + Math.cos(dir) * d - Math.sin(dir) * off, py = y + Math.sin(dir) * d * 0.75 + Math.cos(dir) * off * 0.75;
        bctx.fillRect(Math.round(px), Math.round(py), 3, 2);
      }
    }
  }
}

function drawAlly(a) {
  const img = heroImg(a.hero, dir4(a.dir), true);
  if (!img) return;
  const x = sx(a.x), y = sy(a.y, a.z);
  bctx.globalAlpha = 0.25;
  disc(bctx, x, sy(a.y, 0), 6, 2, '#000');
  bctx.globalAlpha = 1;
  if (a.state === 'attack' && a.target) {
    const n = nape(a.target);
    wire(bctx, x, y - 12, sx(n.x), sy(n.y, n.z), 2, 0.9);
  }
  bctx.drawImage(img, x - (img.width >> 1), y - img.height + Math.round(Math.sin(game.time * 6 + a.idx)));
}

function drawCombatAir() {
  for (const s of shots) {
    if (s.done) continue;
    const k = Math.min(1, s.t / s.dur);
    const wx = lerp(s.x0, s.x, k), wy = lerp(s.y0, s.y, k), wz = Math.sin(k * Math.PI) * 260 + (1 - k) * 60 + k * 100;
    const x = sx(wx), y = sy(wy, wz);
    bctx.globalAlpha = 0.3;
    disc(bctx, sx(wx), sy(wy, 0), 3, 1, '#000');
    bctx.globalAlpha = 1;
    disc(bctx, x, y, 2, 2, '#1e1a18');
    rect(bctx, x - 1, y - 1, 1, 1, '#8a8478');
    if (Math.random() < 0.6) particles.push({ x: wx, y: wy - KZ * wz, vx: rand(-10, 10), vy: rand(-20, 0), life: 0.4, max: 0.4, size: 1.5, g: 0, kind: 'dust' });
  }
  for (const r of rocks) {
    const k = Math.min(1, r.t / r.dur);
    const wx = lerp(r.x0, r.tx, k), wy = lerp(r.y0, r.ty, k), wz = lerp(r.z0, 0, k) + Math.sin(k * Math.PI) * 320;
    const x = sx(wx), y = sy(wy, wz);
    bctx.globalAlpha = 0.3;
    disc(bctx, sx(wx), sy(wy, 0), 5, 2, '#000');
    bctx.globalAlpha = 1;
    disc(bctx, x, y, 5, 4, r.fire ? '#3a1a10' : '#3a3530');
    disc(bctx, x - 1, y - 1, 4, 3, r.fire ? '#c0502a' : '#7a746a');
    rect(bctx, x - 2, y - 2, 2, 1, r.fire ? '#ffd36e' : '#a8a090');
    if (r.fire && Math.random() < 0.7) particles.push({ x: wx, y: wy - KZ * wz, vx: rand(-15, 15), vy: rand(-30, 0), life: 0.5, max: 0.5, size: rand(2, 4), g: -10, kind: 'smoke' });
  }
}

function drawBoundCables(t, dx, dy, img) {
  const tr = t.bound;
  if (!tr || t.stun <= 0) return;
  const x = sx(tr.x), y = sy(tr.y, 0), R = tr.r / ART;
  const hx = dx + img.width / 2, hy = dy + img.height * 0.55;
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + tr.seed;
    wire(bctx, Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R * 0.6) - 5, Math.round(hx + Math.cos(a) * 6), Math.round(hy), 1, 0.85);
  }
}
