'use strict';

const DIR_KEYS = ['down', 'left', 'right', 'up'];
const HERO_IDS = ['cadet', 'connie', 'sasha', 'jean', 'eren', 'armin', 'hange', 'mikasa', 'levi'];
const TITAN_TYPES = ['normal', 'lanky', 'fat', 'aberrant'];
const NEW_TYPES = ['crawler', 'small', 'thrower', 'giant'];
const TITAN_SIZES = [110, 140, 170, 200];
const ART_SIZES = { crawler: [80, 100, 120], small: [60, 72, 84], thrower: [140, 170, 200], giant: [240, 280] };
const sizesOf = t => ART_SIZES[t] || TITAN_SIZES;
const ALL_TYPES = () => TITAN_TYPES.concat(NEW_TYPES);
const GRAB_TYPES = ['normal', 'lanky', 'fat', 'aberrant'];
const WALK_TYPES = ['crawler', 'giant', 'small', 'thrower'];
const WALK_BASE = ['giant', 'small', 'thrower'];
const CIV_RUN = ['man', 'woman'];
const BOSS_KINDS = ['female', 'armored', 'beast', 'colossal'];
const TR_PROPS = ['oak', 'apple_tree', 'pine1', 'pine2', 'pine3', 'well', 'hay_bales', 'cart', 'flower_pots', 'rain_barrel', 'lamp_post_wood',
  'bush1', 'bush_berry', 'bush0', 'bush2', 'log_mossy', 'rock_mossy', 'statue', 'bench', 'woodpile', 'flowers_wild', 'flowers_blue', 'grass_tall'];
const TR_GROUND = ['grass', 'grass3', 'path', 'paving_a', 'paving_b', 'paving_c'];

function assetList() {
  const L = {};
  for (const d of DIR_KEYS) {
    L[`hero_${d}`] = `assets/sprites/hero_${d}.png`;
    L[`herofly_${d}`] = `assets/sprites/herofly_${d}.png`;
    L[`civ_man_${d}`] = `assets/sprites/civ_man_${d}.png`;
    L[`civ_woman_${d}`] = `assets/sprites/civ_woman_${d}.png`;
    if (d !== 'right') for (const w of CIV_RUN) for (let i = 0; i < 3; i++) L[`civ_${w}_run${i}_${d}`] = `assets/sprites/civ_${w}_run${i}_${d}.png`;
    L[`rider_${d}`] = `assets/sprites/rider_${d}.png`;
    for (const k of BOSS_KINDS) L[`boss_${k}_${d}`] = `assets/sprites/boss_${k}_${d}.png`;
    for (const id of HERO_IDS) {
      L[`hero_${id}_${d}`] = `assets/sprites/hero_${id}_${d}.png`;
      L[`herofly_${id}_${d}`] = `assets/sprites/herofly_${id}_${d}.png`;
    }
    for (const t of ALL_TYPES()) for (const h of sizesOf(t)) L[`titan_${t}_${h}_${d}`] = `assets/sprites/titan_${t}_${h}_${d}.png`;
    for (const t of GRAB_TYPES) for (const h of TITAN_SIZES) L[`titan_${t}_${h}_grab_${d}`] = `assets/sprites/titan_${t}_${h}_grab_${d}.png`;
    if (d !== 'right') for (const t of WALK_TYPES) for (const h of sizesOf(t)) for (let i = 0; i < 3; i++) L[`titan_${t}_${h}_walk${i}_${d}`] = `assets/sprites/titan_${t}_${h}_walk${i}_${d}.png`;
  }
  for (const k of ['house_h1', 'house_h2', 'house_h3', 'house_tower', 'ruin_r1', 'ruin_r2', 'ruin_r3', 'ruin_r4', 'wall_a']) L[k] = `assets/sprites/${k}.png`;
  for (const k of TR_GROUND.concat(TR_PROPS)) L[k] = `assets/tradisea/${k}.png`;
  return L;
}

const SPR = {};
const NAPE = {};

function toCanvas(im) {
  const [c, g] = makeCanvas(im.naturalWidth, im.naturalHeight);
  g.drawImage(im, 0, 0);
  return c;
}

function loadAssets(onProgress) {
  const list = Object.entries(assetList());
  let done = 0;
  return Promise.all(list.map(([key, src]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { SPR[key] = toCanvas(im); done++; if (onProgress) onProgress(done / list.length); res(); };
    im.onerror = () => { SPR[key] = null; done++; if (onProgress) onProgress(done / list.length); res(); };
    im.src = (window.ASSET_BASE || '') + src;
  }))).then(() => {
    for (const t of WALK_BASE) for (const h of sizesOf(t)) {
      for (const d of ['down', 'left', 'up']) { const w = SPR[`titan_${t}_${h}_walk0_${d}`]; if (w) SPR[`titan_${t}_${h}_${d}`] = w; }
      const wl = SPR[`titan_${t}_${h}_walk0_left`];
      if (wl) SPR[`titan_${t}_${h}_right`] = variant(wl, 'flip');
    }
    for (const t of NEW_TYPES) for (const h of sizesOf(t)) for (const d of DIR_KEYS) { dekey(SPR[`titan_${t}_${h}_${d}`]); for (let i = 0; i < 3; i++) dekey(SPR[`titan_${t}_${h}_walk${i}_${d}`]); }
    for (const t of ALL_TYPES()) for (const h of sizesOf(t)) {
      const up = SPR[`titan_${t}_${h}_up`];
      if (up) { NAPE[`${t}_${h}`] = findNape(up); scrubRed(up); }
      for (let i = 0; i < 3; i++) {
        const wl = SPR[`titan_${t}_${h}_walk${i}_left`];
        if (wl) SPR[`titan_${t}_${h}_walk${i}_right`] = variant(wl, 'flip');
        const wu = SPR[`titan_${t}_${h}_walk${i}_up`];
        if (wu) scrubRed(wu);
      }
      const gl = SPR[`titan_${t}_${h}_grab_left`];
      if (gl) SPR[`titan_${t}_${h}_grab_right`] = variant(gl, 'flip');
      const gup = SPR[`titan_${t}_${h}_grab_up`];
      if (gup) scrubRed(gup);
      for (const d of DIR_KEYS) { const s = SPR[`titan_${t}_${h}_${d}`]; if (s) { variant(s, 'white'); variant(s, 'tint'); } }
    }
    for (const d of DIR_KEYS) { const s = SPR[`boss_colossal_${d}`]; if (s) unpink(s); }
    for (const k of BOSS_KINDS) for (const d of DIR_KEYS) { const s = SPR[`boss_${k}_${d}`]; if (s) { variant(s, 'white'); variant(s, 'tint'); } }
    for (const w of CIV_RUN) for (let i = 0; i < 3; i++) { const l = SPR[`civ_${w}_run${i}_left`]; if (l) SPR[`civ_${w}_run${i}_right`] = variant(l, 'flip'); }
    if (typeof proceduralWalk === 'function') for (const t of ALL_TYPES()) for (const h of sizesOf(t)) for (const d of DIR_KEYS) { const s = SPR[`titan_${t}_${h}_${d}`]; if (s) proceduralWalk(s, t, d); }
    for (const d of DIR_KEYS) for (const k of ['hero', 'herofly']) {
      if (SPR[`${k}_${d}`]) variant(SPR[`${k}_${d}`], 'white');
      for (const id of HERO_IDS) if (SPR[`${k}_${id}_${d}`]) variant(SPR[`${k}_${id}_${d}`], 'white');
    }
  });
}

function findNape(c) {
  const g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < c.height * 0.6; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    if (d[i + 3] < 200) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    if (r > 190 && gg < 90 && b < 90) { sx += x; sy += y; n++; }
  }
  if (!n) return { fx: 0.5, fy: 0.2 };
  return { fx: sx / n / c.width, fy: sy / n / c.height };
}

function scrubRed(c) {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width, h = c.height;
  const lim = Math.floor(h * 0.5);
  const bad = new Uint8Array(w * h);
  const isRed = i => d[i + 3] > 128 && d[i] > 90 && d[i] > d[i + 1] * 2.1 && d[i] > d[i + 2] * 2.1;
  let any = false;
  for (let y = 0; y < lim; y++) for (let x = 0; x < w; x++) if (isRed((y * w + x) * 4)) { bad[y * w + x] = 1; any = true; }
  if (!any) return;
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (let y = 1; y < lim; y++) for (let x = 1; x < w - 1; x++) {
      const k = y * w + x;
      if (bad[k] || d[k * 4 + 3] < 128) continue;
      if (!(bad[k - 1] || bad[k + 1] || bad[k - w] || bad[k + w])) continue;
      const i = k * 4;
      const bright = d[i] > 225 && d[i + 1] > 180;
      const warm = d[i] > d[i + 1] * 1.6;
      if (bright || warm || pass === 1) add.push(k);
    }
    for (const k of add) bad[k] = 1;
  }
  for (let it = 0; it < 60; it++) {
    let left = 0;
    const fill = [];
    for (let k = 0; k < w * lim; k++) {
      if (!bad[k]) continue;
      let r = 0, gg = 0, bb = 0, n = 0;
      for (const j of [k - 1, k + 1, k - w, k + w]) {
        if (j < 0 || j >= w * h || bad[j] || d[j * 4 + 3] < 128) continue;
        r += d[j * 4]; gg += d[j * 4 + 1]; bb += d[j * 4 + 2]; n++;
      }
      if (n) fill.push([k, r / n, gg / n, bb / n]); else left++;
    }
    for (const [k, r, gg, bb] of fill) { d[k * 4] = r; d[k * 4 + 1] = gg; d[k * 4 + 2] = bb; bad[k] = 0; }
    if (!left) break;
  }
  g.putImageData(img, 0, 0);
}

function heroImg(id, dir, fly) {
  const k = fly ? 'herofly_' : 'hero_';
  return SPR[k + id + '_' + dir] || (fly ? SPR['hero_' + id + '_' + dir] : null) || SPR[k + dir] || SPR['hero_' + dir];
}

const portraitCache2 = {};
function heroPortrait(id) {
  const s = SPR['hero_' + id + '_down'] || (id === 'eren' ? SPR.hero_down : null);
  if (!s) return null;
  if (portraitCache2[id]) return portraitCache2[id];
  const size = Math.round(s.height * 0.5);
  const [c, g] = makeCanvas(size, size);
  g.drawImage(s, Math.round((size - s.width) / 2), -Math.round(s.height * 0.02));
  portraitCache2[id] = c;
  return c;
}

function dekey(c) {
  if (!c) return;
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    if (r > 120 && b > 110 && gg < Math.min(r, b) * 0.62) d[i + 3] = 0;
  }
  g.putImageData(img, 0, 0);
}

function unpink(c) {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    if (r > 140 && b > 140 && gg < Math.min(r, b) - 28) {
      const v = Math.min(255, gg + 45);
      d[i] = v; d[i + 1] = v; d[i + 2] = Math.min(255, v + 6);
    }
  }
  g.putImageData(img, 0, 0);
}

const variantCache = new WeakMap();
function variant(img, kind) {
  if (!img) return img;
  let m = variantCache.get(img);
  if (!m) { m = {}; variantCache.set(img, m); }
  if (m[kind]) return m[kind];
  const [c, g] = makeCanvas(img.width, img.height);
  if (kind === 'flip') {
    g.translate(img.width, 0);
    g.scale(-1, 1);
    g.drawImage(img, 0, 0);
  } else {
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = kind === 'white' ? '#ffffff' : kind === 'tint' ? '#8a2a22' : kind === 'ghost' ? '#bfeaff' : '#000000';
    g.fillRect(0, 0, img.width, img.height);
  }
  m[kind] = c;
  return c;
}

const dir4 = a => {
  const c = Math.cos(a), s = Math.sin(a);
  return Math.abs(c) > Math.abs(s) * 0.9 ? (c > 0 ? 'right' : 'left') : (s > 0 ? 'down' : 'up');
};

function titanSet(t) {
  for (const type of [t.art, 'lanky', 'normal', 'fat', 'aberrant']) if (SPR[`titan_${type}_${t.size}_down`]) return type;
  return null;
}
