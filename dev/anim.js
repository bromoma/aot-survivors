const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const [query, out, w = '1400', h = '900'] = process.argv.slice(2);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-anim-'));
const r = spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${dir}/prof`, '--hide-scrollbars', `--window-size=${w},${h}`, '--virtual-time-budget=60000', '--dump-dom', `http://localhost:5520/dev/anim.html?${query}`], { maxBuffer: 1 << 30 });
const dom = r.stdout.toString();
const m = dom.match(/<pre id="frames">([\s\S]*?)<\/pre>/);
if (!m) { console.log('no frames', (dom.match(/data-err="([^"]*)"/) || [])[1]); process.exit(1); }
const frames = m[1].trim().split('\n');
frames.forEach((f, i) => fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), Buffer.from(f.split(',')[1], 'base64')));
const ff = process.env.HOME + '/bin/ffmpeg';
spawnSync(ff, ['-y', '-v', 'error', '-framerate', '20', '-i', path.join(dir, 'f%03d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=200[p];[b][p]paletteuse=dither=none', '-loop', '0', out]);
console.log('frames', frames.length, '->', out, fs.existsSync(out) ? fs.statSync(out).size : 'missing');
