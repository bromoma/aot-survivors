// usage: node dev/record.js "<url query>" out.gif [seconds=8] [fps=10] [w=1280] [h=800] [actions-json]
// Real-time capture through the Chrome DevTools Protocol (CSS animations, canvas and rAF all run normally).
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const [query, out, secs = '8', fps = '10', W = '1280', H = '800', acts = '[]'] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FF = path.join(os.homedir(), 'bin/ffmpeg');
const port = 9300 + (process.pid % 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-rec-'));
const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-frames-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find(t => t.type === 'page');
      if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl);
    } catch (e) {}
    if (!ws) await sleep(250);
  }
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m.error); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: /mobile=1/.test(query) });
  if (/mobile=1/.test(query)) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: `http://localhost:5520/?${query}` });
  await sleep(+(process.env.WAIT || 2500));
  const plan = JSON.parse(acts);
  const n = Math.round(+secs * +fps);
  const shots = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.screencastFrame') { shots.push({ t: Date.now(), data: m.params.data }); send('Page.screencastFrameAck', { sessionId: m.params.sessionId }); }
  });
  const t0 = Date.now();
  await send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1, maxWidth: +W, maxHeight: +H });
  const done = new Set();
  while (Date.now() - t0 < +secs * 1000) {
    const fi = Math.floor((Date.now() - t0) / (1000 / +fps));
    for (const [k, a] of plan.entries()) if (!done.has(k) && a.f <= fi) {
      done.add(k);
      if (a.js) await send('Runtime.evaluate', { expression: a.js, awaitPromise: true });
      if (a.click) for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: a.click[0], y: a.click[1], button: 'left', clickCount: 1 });
      if (a.key) for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code: a.key, key: a.key });
    }
    await sleep(30);
  }
  await send('Page.stopScreencast');
  for (let i = 0; i < n; i++) {
    const tt = t0 + i * 1000 / +fps;
    let best = shots[0];
    for (const s2 of shots) if (s2.t <= tt) best = s2; else break;
    if (best) fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(best.data, 'base64'));
  }
  console.log('screencast frames', shots.length);
  const real = +secs;
  const err = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__errs || [])', returnByValue: true });
  ws.close();
  chrome.kill();
  const efps = (n / real).toFixed(2);
  execFileSync(FF, ['-loglevel', 'error', '-y', '-framerate', efps, '-i', path.join(frames, 'f%04d.jpg'), '-vf', `scale=${Math.min(+W, 900)}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, out]);
  if (process.env.TILES) execFileSync(FF, ['-loglevel', 'error', '-y', '-i', path.join(frames, 'f%04d.jpg'), '-vf', `select='gte(n\\,${process.env.TSTART || 0})*not(mod(n-${process.env.TSTART || 0}\\,${process.env.TILES}))',scale=480:-1,tile=4x3`, '-frames:v', '1', '-update', '1', out.replace(/\.gif$/, '_tiles.png')]);
  console.log('frames', n, 'real', real.toFixed(1) + 's', 'fps', efps, '->', out, fs.statSync(out).size, 'errs', err.result && err.result.value);
  fs.rmSync(frames, { recursive: true, force: true });
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
}
main().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
