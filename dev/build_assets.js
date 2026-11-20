const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const raw = f => path.join(root, 'assets/raw', f);
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
  { key: 'titan_crawler', src: 'aot_titan_crawler.png', h: [80, 100, 120] },
  { key: 'titan_small', src: 'aot_titan_small.png', h: [60, 72, 84] },
  { key: 'titan_thrower', src: 'aot_titan_thrower.png', h: [140, 170, 200] },
  { key: 'titan_giant', src: 'aot_titan_giant.png', h: [240, 280] },
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
  for (const t of ['normal', 'lanky', 'fat', 'aberrant']) if (fs.existsSync(raw(`aot_titan_${t}_grab.png`))) for (const h of [110, 140, 170, 200]) run('cut.js', [raw(`aot_titan_${t}_grab.png`), `titan_${t}_${h}_grab`, String(h), DIRS, 'assets/sprites']);
  for (const [t, hs] of [['crawler', '80,100,120'], ['small', '60,72,84'], ['thrower', '140,170,200'], ['giant', '240,280']]) if (fs.existsSync(raw(`aot_titan_${t}_walk.png`))) console.log(execFileSync('node', [path.join(root, 'dev/cut_grid.js'), raw(`aot_titan_${t}_walk.png`), t, hs], { cwd: root }).toString().trim().split('\n').pop());
  for (const [k, h] of [['female', 170], ['armored', 190], ['beast', 210], ['colossal', 300], ['jaw', 130], ['cart', 160], ['hammer', 210], ['reiss', 300]]) if (fs.existsSync(raw(`aot_boss_${k}.png`))) run('cut.js', [raw(`aot_boss_${k}.png`), `boss_${k}`, String(h), DIRS, 'assets/sprites']);
  if (fs.existsSync(raw('aot_ruins.png'))) run('cut.js', [raw('aot_ruins.png'), 'ruin', '110', 'r1,r2,r3,r4', 'assets/sprites']);
  if (fs.existsSync(raw('aot_wall.png'))) run('cut.js', [raw('aot_wall.png'), 'wall', '96', 'a', 'assets/sprites']);
}

if (!only || only === 'sprites' || only === 'heroes') {
  for (const id of ['cadet', 'connie', 'sasha', 'jean', 'armin', 'hange', 'mikasa', 'levi', 'erwin', 'historia', 'mike']) {
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

if (!only || only === 'world') {
  execFileSync('python3', [path.join(root, 'dev/gen_ground.py')], { stdio: 'inherit' });
  const tmp = path.join(root, 'dev/out_test/world');
  const kit = (sheet, names) => execFileSync('python3', [path.join(root, 'dev/cut_kit.py'), raw(sheet), tmp, names, '1'], { stdio: 'ignore' });
  const fit = (spec, out = 'assets/props', colors = '40') => execFileSync('python3', [path.join(root, 'dev/fit_sprites.py'), tmp, path.join(root, out), spec, colors], { stdio: 'ignore' });
  kit('aot_nature.png', 'oak,apple_tree,pine1,pine2,pine3,bush0,bush1,bush2,bush_berry,grass_tall,flowers_wild,flowers_blue');
  fit('oak:116,apple_tree:118,pine1:153,pine2:139,pine3:143,bush0:23,bush1:27,bush2:37,bush_berry:34,grass_tall:29,flowers_wild:32,flowers_blue:30');
  kit('aot_props.png', 'well,hay_bales,cart,flower_pots,rain_barrel,lamp_post_wood,bench,woodpile,statue,log_mossy,rock_mossy,crate,dice,rank,seal_green,seal_red');
  fit('well:46,hay_bales:36,cart:34,flower_pots:29,rain_barrel:34,lamp_post_wood:66,bench:30,woodpile:40,statue:92,log_mossy:29,rock_mossy:36,crate:30');
  fit('dice:22,rank:28,seal_green:34,seal_red:34', 'assets/ui', '32');
}

if (!only || only === 'atlas' || only === 'sprites' || only === 'heroes' || only === 'world') {
  console.log(execFileSync('node', [path.join(root, 'dev/pack.js')], { cwd: root }).toString().trim().split('\n').pop());
}
