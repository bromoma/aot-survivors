const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const [src, out, px = '', tw = '', trim = ''] = process.argv.slice(2);
const url = `file://${root}/dev/pixelate.html#src=${encodeURIComponent('file://' + path.resolve(src))}${px ? '&px=' + px : ''}${tw ? '&w=' + tw : ''}${trim ? '&trim=1' : ''}`;
const dom = spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${require('os').tmpdir()}/aot-cut-${process.pid}`, '--allow-file-access-from-files', '--virtual-time-budget=20000', '--dump-dom', url], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
const err = dom.match(/data-err="([^"]*)"/); if (err) { console.error('ERR', err[1]); process.exit(1); }
const res = JSON.parse(dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
console.log(path.basename(src), 'px', res.s, '->', res.w + 'x' + res.h);
