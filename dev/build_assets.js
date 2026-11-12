const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const raw = f => path.join(root, 'assets/raw', f);
const TR = path.join(process.env.HOME, 'GitHub/Ecomodef/assets/sprites/world');
const only = process.argv[2] || '';
const T = 32;

function run(script, args) {
  const out = execFileSync('node', [path.join(root, 'dev', script), ...args], { cwd: root }).toString().trim();
  console.log(out);
}

const DIRS = 'down,left,right,up';
const sheets = [
  { key: 'hero', src: 'aot_scout_pixel.png', h: [48] },
  { key: 'herofly', src: 'aot_scout_fly_pixel.png', h: [44] },
  { key: 'titan_lanky', src: 'aot_titan_lanky_pixel.png', h: [110, 140, 170, 200] },
  { key: 'titan_normal', src: 'aot_titan_normal.png', h: [110, 140, 170, 200] },
  { key: 'titan_fat', src: 'aot_titan_fat.png', h: [110, 140, 170, 200] },
  { key: 'titan_aberrant', src: 'aot_titan_aberrant.png', h: [110, 140, 170, 200] },
  { key: 'civ', src: 'aot_civs.png', h: [42], labels: 'man_down,man_left,man_right,man_up,woman_down,woman_left,woman_right,woman_up' },
  { key: 'rider', src: 'aot_rider.png', h: [58] },
];

if (!only || only === 'sprites') {
  for (const s of sheets) {
    if (!fs.existsSync(raw(s.src))) { console.log('skip (no file)', s.src); continue; }
    for (const h of s.h) run('cut.js', [raw(s.src), s.h.length > 1 ? `${s.key}_${h}` : s.key, String(h), s.labels || DIRS, 'assets/sprites']);
  }
  if (fs.existsSync(raw('aot_houses_tradisea.png'))) {
    run('cut.js', [raw('aot_houses_tradisea.png'), 'house', '120', 'h1,h2,h3,tower', 'assets/sprites']);
    run('cut.js', [raw('aot_houses_tradisea.png'), 'tall', '150', 'a,b,c,tower', 'assets/sprites']);
    fs.copyFileSync(path.join(root, 'assets/sprites/tall_tower.png'), path.join(root, 'assets/sprites/house_tower.png'));
    for (const k of ['a', 'b', 'c', 'tower']) fs.unlinkSync(path.join(root, `assets/sprites/tall_${k}.png`));
  }
  for (const [k, h] of [['female', 170], ['armored', 190], ['beast', 210], ['colossal', 300]]) if (fs.existsSync(raw(`aot_boss_${k}.png`))) run('cut.js', [raw(`aot_boss_${k}.png`), `boss_${k}`, String(h), DIRS, 'assets/sprites']);
  if (fs.existsSync(raw('aot_ruins.png'))) run('cut.js', [raw('aot_ruins.png'), 'ruin', '110', 'r1,r2,r3,r4', 'assets/sprites']);
  if (fs.existsSync(raw('aot_wall.png'))) run('cut.js', [raw('aot_wall.png'), 'wall', '96', 'a', 'assets/sprites']);
}

if (!only || only === 'sprites' || only === 'heroes') {
  for (const id of ['cadet', 'connie', 'sasha', 'jean', 'armin', 'hange', 'mikasa', 'levi']) {
    if (fs.existsSync(raw(`aot_hero_${id}.png`))) console.log(execFileSync('bash', [path.join(root, 'dev/cut_hero.sh'), id]).toString().trim());
  }
  const ef = path.join(root, 'dev/out_test/h');
  run('cut.js', [raw('aot_scout_pixel.png'), 'eren', '48', DIRS, 'dev/out_test/h']);
  run('cut.js', [raw('aot_scout_fly_pixel.png'), 'erenfly', '38', DIRS, 'dev/out_test/h']);
  for (const d of DIRS.split(',')) {
    fs.renameSync(path.join(ef, `eren_${d}.png`), path.join(root, `assets/sprites/hero_eren_${d}.png`));
    fs.renameSync(path.join(ef, `erenfly_${d}.png`), path.join(root, `assets/sprites/herofly_eren_${d}.png`));
  }
}

if (!only || only === 'tradisea') {
  const px = (src, out, w, trim) => run('pixelate.js', [src, path.join('assets/tradisea', out), '', w ? String(w) : '', trim ? '1' : '']);
  px(`${TR}/grass/ground/grass.png`, 'grass.png');
  px(`${TR}/grass/ground/grass3.png`, 'grass3.png');
  px(`${TR}/grass/ground/path.png`, 'path.png');
  for (const c of 'abc') px(`${TR}/rock/ground/paving_${c}.png`, `paving_${c}.png`);
  const props = {
    'grass/nature/oak.png': 3.6, 'grass/nature/apple_tree.png': 2.8, 'grass/nature/well.png': 1.3, 'grass/nature/hay_bales.png': 1.2,
    'grass/nature/cart.png': 1.7, 'grass/nature/flower_pots.png': 1.2, 'grass/nature/rain_barrel.png': 0.7, 'grass/nature/lamp_post_wood.png': 0.95,
    'grass/nature/bush1.png': 1.3, 'grass/nature/bush_berry.png': 1.5, 'common/nature/bush0.png': 1.3, 'common/nature/bush2.png': 1.5,
    'grass/nature/log_mossy.png': 1.8, 'grass/nature/rock_mossy.png': 1.25, 'grass/nature/statue.png': 1.2, 'grass/nature/bench.png': 1.5,
    'grass/nature/woodpile.png': 1.45, 'common/nature/flowers_wild.png': 1.3, 'grass/nature/flowers_blue.png': 1.3, 'common/nature/grass_tall.png': 1.2,
  };
  for (const [f, k] of Object.entries(props)) if (fs.existsSync(`${TR}/${f}`)) px(`${TR}/${f}`, path.basename(f), Math.round(T * k * (/bush|flower|grass_tall/.test(f) ? 0.8 : 1)), true);
  const tmp = path.join(root, 'dev/out_test');
  fs.mkdirSync(tmp, { recursive: true });
  const cols = [[44, 358], [438, 901], [936, 1494]];
  cols.forEach(([a, b], i) => {
    execFileSync('sips', ['-c', '1024', String(b - a), '--cropOffset', '0', String(a), `${TR}/grass/nature/pines.png`, '--out', path.join(tmp, `pine${i + 1}.png`)], { stdio: 'ignore' });
    px(path.join(tmp, `pine${i + 1}.png`), `pine${i + 1}.png`, [60, 80, 92][i], true);
  });
}
