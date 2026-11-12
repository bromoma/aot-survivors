const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [src, name, h = '64', labels = 'down,left,right,up', outDir = 'assets/sprites', uniform = ''] = process.argv.slice(2);
const root = path.resolve(__dirname, '..');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = path.join(require('os').tmpdir(), 'aot-cut-' + process.pid);
const url = `file://${root}/dev/cutter.html#src=${encodeURIComponent('file://' + path.resolve(src))}&name=${name}&h=${h}&labels=${labels}${uniform ? '&uniform=' + uniform : ''}`;
const dom = spawnSync(chrome, ['--headless=new', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--virtual-time-budget=20000', '--dump-dom', url], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
const err = dom.match(/data-err="([^"]*)"/);
if (err) { console.error('ERR', err[1]); process.exit(1); }
const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.error('no output'); process.exit(1); }
const res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
fs.mkdirSync(path.resolve(outDir), { recursive: true });
const summary = {};
for (const [lab, f] of Object.entries(res.frames)) {
  const file = path.resolve(outDir, `${name}_${lab}.png`);
  fs.writeFileSync(file, Buffer.from(f.png.split(',')[1], 'base64'));
  summary[lab] = `${f.w}x${f.h}`;
}
console.log(name, 'segments', res.segments, res.cc ? 'cc' : 'cols', JSON.stringify(summary));
