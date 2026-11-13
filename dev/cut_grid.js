const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const FF = path.join(process.env.HOME, 'bin/ffmpeg');
const [src, type, hs] = process.argv.slice(2);
const root = path.resolve(__dirname, '..');
const tmp = path.join(root, 'dev/out_test/w');
fs.mkdirSync(tmp, { recursive: true });

const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src]).toString();
const W = +/pixelWidth: (\d+)/.exec(dim)[1], H = +/pixelHeight: (\d+)/.exec(dim)[1];
const raw = execFileSync(FF, ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
const fill = new Array(H).fill(0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3, r = raw[i], g = raw[i + 1], b = raw[i + 2];
  if (!(r > 170 && b > 170 && g < 110)) fill[y]++;
}
let bands = [], cur = null;
for (let y = 0; y < H; y++) {
  const on = fill[y] > W * 0.004;
  if (on && !cur) cur = [y, y];
  if (on) cur[1] = y;
  if (!on && cur && y - cur[1] > 6) { bands.push(cur); cur = null; }
}
if (cur) bands.push(cur);
bands = bands.filter(b => b[1] - b[0] > 30);
while (bands.length > 3) {
  let bi = 0, bg = Infinity;
  for (let i = 0; i < bands.length - 1; i++) { const g = bands[i + 1][0] - bands[i][1]; if (g < bg) { bg = g; bi = i; } }
  bands.splice(bi, 2, [bands[bi][0], bands[bi + 1][1]]);
}
if (bands.length !== 3) { console.error('rows found:', bands.length, JSON.stringify(bands)); process.exit(1); }
const rows = [['d', 'down'], ['l', 'left'], ['u', 'up']];
bands.forEach(([a, b], r) => {
  const y0 = Math.max(0, a - 4), h = Math.min(H, b + 5) - y0;
  execFileSync(FF, ['-loglevel', 'error', '-y', '-i', src, '-vf', `crop=${W}:${h}:0:${y0}`, '-update', '1', path.join(tmp, `${type}_row${r}.png`)]);
});
for (const h of hs.split(',')) {
  bands.forEach((_, r) => {
    const [k] = rows[r];
    const out = execFileSync('node', [path.join(root, 'dev/cut.js'), path.join(tmp, `${type}_row${r}.png`), `g_${type}_${h}`, h, `${k}0,${k}1,${k}2`, tmp, '3'], { cwd: root }).toString().trim();
    console.log(out.slice(0, 160));
  });
  for (const [k, d] of rows) {
    const map = [1, 0, 2];
    map.forEach((from, i) => fs.copyFileSync(path.join(tmp, `g_${type}_${h}_${k}${from}.png`), path.join(root, `assets/sprites/titan_${type}_${h}_walk${i}_${d}.png`)));
  }
}
console.log('bands', JSON.stringify(bands), 'ok', type);
