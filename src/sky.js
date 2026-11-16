'use strict';

const DAY_LEN = 300;
const SKY_KEYS = [
  [0, 0, [0, 0, 0], 0],
  [160, 0, [0, 0, 0], 0],
  [185, 0.14, [255, 120, 50], 0.16],
  [205, 0.56, [255, 120, 50], 0],
  [255, 0.56, [255, 170, 200], 0],
  [276, 0.12, [255, 170, 200], 0.12],
  [296, 0, [0, 0, 0], 0],
  [300, 0, [0, 0, 0], 0],
];
const WEATHER = {
  rain: { name: 'Rain', sub: 'Downpour beyond the Wall: distant titans are barely visible' },
  fog: { name: 'Fog', sub: 'Fog rolls in — titans appear out of nowhere' },
};
trFields(Object.values(WEATHER), ['name', 'sub']);

function skyReset() {
  game.sky = { wx: null, wxK: 0, wxT: rand(60, 110), wxLeft: 0, night: false, drops: [], splash: [] };
}

function skyOn() { return faction && faction.challenge !== 'night' && state !== 'menu'; }

function skyAt(time) {
  const c = ((time % DAY_LEN) + DAY_LEN) % DAY_LEN;
  let i = 0;
  while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1][0] <= c) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], k = (c - a[0]) / (b[0] - a[0] || 1);
  const s = k * k * (3 - 2 * k);
  return { dark: lerp(a[1], b[1], s), tint: a[3] || b[3] ? (s < 0.5 ? a[2] : b[2]) : null, tintA: lerp(a[3], b[3], s), cyc: c };
}

function skyTitanSpeed() {
  if (!game || !game.sky || !skyOn()) return 1;
  const d = skyAt(game.time).dark;
  return 1 - 0.22 * clamp((d - 0.1) / 0.45, 0, 1);
}

function skyKind() {
  if (!game || !game.sky) return 'day';
  if (game.sky.wx && game.sky.wxK > 0.5) return game.sky.wx;
  if (faction.challenge === 'night') return 'night';
  const c = skyAt(game.time).cyc;
  return c < 160 ? 'day' : c < 200 ? 'dusk' : c < 262 ? 'night' : c < 290 ? 'dawn' : 'day';
}

function skyTick(dt) {
  const S = game.sky;
  if (!S || !skyOn()) return;
  SND.setRain(S.wx === 'rain' ? S.wxK : 0);
  const sk = skyAt(game.time), night = sk.dark >= 0.4;
  if (night !== S.night) {
    S.night = night;
    if (!game.boss || !game.banner) game.banner = night
      ? { text: tr('Night'), sub: tr('Without sunlight titans weaken and move slower'), t: 2.6 }
      : { text: tr('Dawn'), sub: tr('The sun rises — titans regain their strength'), t: 2.4 };
    if (night) sfx('heartbeat', { vol: 0.35 });
    else if (save.stats) save.stats.nights = (save.stats.nights || 0) + 1;
  }
  if (S.wx) {
    S.wxLeft -= dt;
    S.wxK = S.wxLeft > 0 ? Math.min(1, S.wxK + dt / 4) : Math.max(0, S.wxK - dt / 5);
    if (S.wxLeft <= 0 && S.wxK <= 0) { S.wx = null; S.wxT = rand(70, 120); }
  } else {
    S.wxT -= dt;
    if (S.wxT <= 0) {
      const fogP = faction.map === 'ruins' ? 0.65 : faction.map === 'field' ? 0.5 : 0.35;
      S.wx = Math.random() < fogP ? 'fog' : 'rain';
      S.wxLeft = rand(35, 55);
      S.wxK = 0;
      if (!game.banner) game.banner = { text: WEATHER[S.wx].name, sub: WEATHER[S.wx].sub, t: 2.4 };
    }
  }
}

const skyLayer = makeCanvas(1, 1);
function skyHole(g, x, y, r, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(0,0,0,${a})`);
  gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.8})`);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function lightHoles(g, scale) {
  const now = performance.now() / 1000;
  skyHole(g, sx(player.x), sy(player.y, player.z * 0.5), (150 + Math.sin(now * 3.3) * 4) * scale, 1);
  for (const fl of flares) skyHole(g, sx(fl.x), sy(fl.y, fl.z), 130 * scale, Math.min(1, fl.life));
  for (const e of emitters) if (e.fire) skyHole(g, sx(e.x), sy(e.y, e.z), 70 * scale, 0.85);
  for (const ch of chests) skyHole(g, sx(ch.x), sy(ch.y, 0), 55 * scale, 0.9);
  for (const a of allies) skyHole(g, sx(a.x), sy(a.y, a.z), 50 * scale, 0.6);
  for (const p of props) {
    if (p.key !== 'lamp_post_wood') continue;
    const x = sx(p.x), y = sy(p.y, 0) - p.img.height + 5;
    if (x < -60 || y < -60 || x > bw + 60 || y > bh + 60) continue;
    skyHole(g, x, y, (46 + Math.sin(now * 7 + p.x) * 1.5) * scale, 0.9);
  }
}

function lampGlow() {
  const gs = glowSprite();
  bctx.globalAlpha = 0.5;
  for (const p of props) {
    if (p.key !== 'lamp_post_wood') continue;
    const x = sx(p.x), y = sy(p.y, 0) - p.img.height + 5;
    if (x < -20 || y < -20 || x > bw + 20 || y > bh + 20) continue;
    bctx.drawImage(gs, x - (gs.width >> 1), y - (gs.height >> 1));
  }
  bctx.globalAlpha = 1;
}

function titanEyes(minD) {
  for (const t of titans) {
    if (t.dying) continue;
    const x = sx(t.x), y = sy(t.y, t.H * 0.86), d = Math.hypot(t.x - player.x, t.y - player.y);
    if (d < minD || x < -4 || y < -4 || x > bw + 4 || y > bh + 4) continue;
    bctx.globalAlpha = 0.85;
    rect(bctx, x - 3, y, 2, 1, '#ffe08a');
    rect(bctx, x + 1, y, 2, 1, '#ffe08a');
    bctx.globalAlpha = 1;
  }
}

let fogTex = null;
function fogTexture() {
  if (fogTex) return fogTex;
  const [c, g] = makeCanvas(192, 144);
  const R = makeRng(77);
  for (let i = 0; i < 26; i++) {
    const x = R.range(0, 192), y = R.range(0, 144), r = R.range(18, 46), a = R.range(0.25, 0.6);
    for (const ox of [-192, 0, 192]) for (const oy of [-144, 0, 144]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      gr.addColorStop(0, `rgba(226,232,236,${a})`);
      gr.addColorStop(1, 'rgba(226,232,236,0)');
      g.fillStyle = gr;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  fogTex = c;
  return c;
}

function drawSky() {
  if (!game.sky || !skyOn()) return;
  const S = game.sky, sk = skyAt(game.time), [c, g] = skyLayer;
  if (sk.tint && sk.tintA > 0.005) {
    bctx.fillStyle = `rgba(${sk.tint[0]},${sk.tint[1]},${sk.tint[2]},${sk.tintA.toFixed(3)})`;
    bctx.fillRect(0, 0, bw, bh);
  }
  if (S.wx === 'rain' && S.wxK > 0) drawRain(S);
  if (S.wx === 'fog' && S.wxK > 0) {
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, bw, bh);
    const tex = fogTexture(), now = performance.now() / 1000;
    const ox = -(((camA.x * 0.6 + now * 6) % 192) + 192) % 192, oy = -(((camA.y * 0.6 + now * 2) % 144) + 144) % 144;
    for (let y = oy; y < bh; y += 144) for (let x = ox; x < bw; x += 192) g.drawImage(tex, Math.round(x), Math.round(y));
    g.fillStyle = 'rgba(214,220,226,0.35)';
    g.fillRect(0, 0, bw, bh);
    g.globalCompositeOperation = 'destination-out';
    skyHole(g, sx(player.x), sy(player.y, player.z * 0.5), 170, 0.9);
    bctx.globalAlpha = 0.85 * S.wxK;
    bctx.drawImage(c, 0, 0);
    bctx.globalAlpha = 1;
  }
  if (sk.dark > 0.01) {
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, bw, bh);
    g.fillStyle = `rgba(8, 12, 34, ${sk.dark.toFixed(3)})`;
    g.fillRect(0, 0, bw, bh);
    g.globalCompositeOperation = 'destination-out';
    lightHoles(g, 0.8);
    bctx.drawImage(c, 0, 0);
    if (sk.dark > 0.3) { lampGlow(); titanEyes(300); }
  }
}

function drawRain(S) {
  const n = Math.round(240 * S.wxK);
  while (S.drops.length < n) S.drops.push({ x: rand(0, bw + 60), y: rand(-bh, bh), v: rand(300, 420), l: Math.random() < 0.3 ? 8 : 6 });
  if (S.drops.length > n) S.drops.length = n;
  const dt = Math.min(0.05, (performance.now() - (S.last || performance.now())) / 1000);
  S.last = performance.now();
  bctx.fillStyle = `rgba(30, 40, 66, ${(0.22 * S.wxK).toFixed(3)})`;
  bctx.fillRect(0, 0, bw, bh);
  bctx.fillStyle = 'rgba(214, 228, 250, 0.7)';
  for (const d of S.drops) {
    d.y += d.v * dt;
    d.x -= d.v * 0.25 * dt;
    if (d.y > bh || d.x < -10) {
      if (Math.random() < 0.5) S.splash.push({ x: d.x, y: rand(10, bh), t: 0.25 });
      d.x = rand(0, bw + 60); d.y = rand(-40, 0);
    }
    const x = Math.round(d.x), y = Math.round(d.y);
    bctx.fillRect(x, y, 1, d.l >> 1);
    bctx.fillRect(x - 1, y + (d.l >> 1), 1, d.l >> 1);
  }
  bctx.fillStyle = 'rgba(220, 232, 250, 0.6)';
  for (const s of S.splash) {
    s.t -= dt;
    const w = s.t > 0.12 ? 1 : 3;
    bctx.fillRect(Math.round(s.x) - (w >> 1), Math.round(s.y), w, 1);
  }
  S.splash = S.splash.filter(s => s.t > 0);
}

const SKY_ICONS = {};
function skyIcon(kind) {
  if (SKY_ICONS[kind]) return SKY_ICONS[kind];
  const [c, g] = makeCanvas(13, 13);
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (kind === 'day' || kind === 'dusk' || kind === 'dawn') {
    const sun = kind === 'day' ? '#ffd36e' : '#ff9a4a', ray = kind === 'day' ? '#ffb23a' : '#e0603a';
    const top = kind === 'day' ? 0 : 3;
    P(4, 3 + top, 5, 7, sun); P(3, 4 + top, 7, 5, sun);
    for (const [x, y] of [[6, 0], [6, 12], [0, 6], [12, 6], [2, 2], [10, 2], [2, 10], [10, 10]]) if (y + top < 13 && (kind === 'day' || y < 8)) P(x, y + top, 1, 1, ray);
    if (kind !== 'day') { P(0, 10, 13, 3, '#4a5a7a'); P(0, 10, 13, 1, '#8a9aba'); }
  } else if (kind === 'night') {
    P(4, 1, 5, 11, '#e8ecff'); P(3, 2, 7, 9, '#e8ecff'); P(2, 4, 8, 5, '#e8ecff');
    P(6, 1, 5, 9, '#1a2240'); P(7, 2, 5, 7, '#1a2240');
    P(10, 10, 1, 1, '#ffe08a'); P(11, 3, 1, 1, '#ffe08a');
  } else if (kind === 'rain') {
    P(2, 3, 9, 4, '#c8d0dc'); P(4, 1, 5, 3, '#c8d0dc'); P(1, 4, 11, 2, '#aab4c4');
    for (const [x, y] of [[3, 8], [6, 9], [9, 8], [4, 11], [8, 11]]) P(x, y, 1, 2, '#7ab8ff');
  } else if (kind === 'fog') {
    for (const [y, x, w] of [[2, 1, 9], [5, 3, 9], [8, 0, 10], [11, 2, 8]]) P(x, y, w, 2, '#d8dee6');
  }
  return (SKY_ICONS[kind] = c);
}
