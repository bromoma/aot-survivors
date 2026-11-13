const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const FF = path.join(process.env.HOME, 'bin/ffmpeg');
const [src, outDir, names, size = '40'] = process.argv.slice(2);
const ids = names.split(',');
const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src]).toString();
const W = +/pixelWidth: (\d+)/.exec(dim)[1], H = +/pixelHeight: (\d+)/.exec(dim)[1];
const raw = execFileSync(FF, ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
const bg = (x, y) => { const i = (y * W + x) * 3, r = raw[i], g = raw[i + 1], b = raw[i + 2]; return r > 170 && b > 170 && g < 110; };
function bands(n, len, filled, minGap, minLen) {
  const out = [];
  let cur = null;
  for (let i = 0; i < len; i++) {
    const on = filled(i);
    if (on && !cur) cur = [i, i];
    if (on) cur[1] = i;
    if (!on && cur && i - cur[1] > minGap) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  let b = out.filter(x => x[1] - x[0] > minLen);
  while (b.length > n) {
    let bi = 0, bgp = Infinity;
    for (let i = 0; i < b.length - 1; i++) { const g = b[i + 1][0] - b[i][1]; if (g < bgp) { bgp = g; bi = i; } }
    b.splice(bi, 2, [b[bi][0], b[bi + 1][1]]);
  }
  return b;
}
const cols = 4, rows = Math.ceil(ids.length / cols);
const rowFill = y => { let c = 0; for (let x = 0; x < W; x++) if (!bg(x, y)) c++; return c > W * 0.004; };
const R = bands(rows, H, rowFill, 4, 20);
if (R.length !== rows) { console.error('rows', R.length, JSON.stringify(R)); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
let k = 0;
for (const [y0, y1] of R) {
  const colFill = x => { let c = 0; for (let y = y0; y <= y1; y++) if (!bg(x, y)) c++; return c > (y1 - y0) * 0.01; };
  const C = bands(cols, W, colFill, 4, 10);
  if (C.length !== cols) { console.error('cols', C.length, 'row', y0); process.exit(1); }
  for (const [x0, x1] of C) {
    let t = y1, b = y0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!bg(x, y)) { if (y < t) t = y; if (y > b) b = y; }
    const w = x1 - x0 + 1, h = b - t + 1, side = Math.max(w, h) + 6;
    const cx = Math.round((x0 + x1) / 2 - side / 2), cy = Math.round((t + b) / 2 - side / 2);
    const id = ids[k++];
    const out = path.join(outDir, `gear_${id}.png`);
    const crop = `crop=${side}:${side}:${Math.max(0, cx)}:${Math.max(0, cy)}`;
    execFileSync(FF, ['-loglevel', 'error', '-y', '-i', src, '-vf', `${crop},colorkey=0xFF00FF:0.32:0.08,scale=${size}:${size}:flags=area,format=rgba`, '-update', '1', out]);
  }
}
console.log('icons', k);
