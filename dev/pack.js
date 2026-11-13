// Packs every sprite the game loads into a few palette-compressed atlases: assets/atlas/<group>.<hash>.png + atlas.json
const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const FF = path.join(os.homedir(), 'bin/ffmpeg');
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-pack-'));
const dom = spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', `file://${path.join(root, 'dev/pack.html')}`], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
fs.rmSync(prof, { recursive: true, force: true });
const err = dom.match(/data-err="([^"]*)"/);
if (err) { console.error('ERR', err[1]); process.exit(1); }
const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.error('no output'); process.exit(1); }
const out = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
const dir = path.join(root, 'assets/atlas');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-atlas-'));
const files = {};
let before = 0, after = 0;
for (const [g, info] of Object.entries(out.groups)) {
  const raw = path.join(tmp, g + '.png');
  fs.writeFileSync(raw, Buffer.from(info.data.split(',')[1], 'base64'));
  const q = path.join(tmp, g + '_q.png');
  const colors = g === 'ground' ? 256 : g.startsWith('titan') ? 192 : 255;
  execFileSync(FF, ['-loglevel', 'error', '-y', '-i', raw, '-vf', `split[a][b];[a]palettegen=max_colors=${colors}:reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=none:alpha_threshold=128`, '-pix_fmt', 'pal8', '-compression_level', '9', q]);
  const pick = fs.statSync(q).size < fs.statSync(raw).size ? q : raw;
  const buf = fs.readFileSync(pick);
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
  const name = `${g}.${hash}.png`;
  fs.writeFileSync(path.join(dir, name), buf);
  files[g] = name;
  before += fs.statSync(raw).size;
  after += buf.length;
  console.log(g.padEnd(16), String(info.n).padStart(3), `${info.w}x${info.h}`.padEnd(10), (buf.length / 1e3).toFixed(0) + 'KB');
}
fs.writeFileSync(path.join(dir, 'atlas.json'), JSON.stringify({ files, map: out.map }));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('atlases', Object.keys(files).length, 'sprites', Object.keys(out.map).length, 'raw', (before / 1e6).toFixed(1) + 'MB', '->', (after / 1e6).toFixed(1) + 'MB');
