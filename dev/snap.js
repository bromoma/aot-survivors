const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [page, hash, out, w = '1280', h = '800'] = process.argv.slice(2);
const dom = spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${require('os').tmpdir()}/aot-snap-${process.pid}`, '--allow-file-access-from-files', `--window-size=${w},${h}`, `--virtual-time-budget=${process.env.VT || 15000}`, '--dump-dom', `file://${path.resolve(page)}#${hash}`], { maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
const lg = dom.match(/id="log"[^>]*>([^<]*)</); if (lg) console.log('LOG:', lg[1]);
const err = dom.match(/data-err[0-9]*="([^"]*)"/); if (err) console.log('ERR:', err[1]);
const m = dom.match(/id="snap"[^>]*>data:image\/png;base64,([A-Za-z0-9+/=]+)</);
if (!m) { console.log('no snapshot'); process.exit(1); }
fs.writeFileSync(out, Buffer.from(m[1], 'base64'));
console.log('ok', out);
