// usage: node dev/perf.js "<query>" [seconds=15]  — real-time frame stats while flying straight
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const [q = 'lang=ru', secs = '15'] = process.argv.slice(2);
const port = 9500 + (process.pid % 400);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-perf-'));
const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--mute-audio', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) {} if (!ws) await sleep(250); }
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value;
  await send('Page.navigate', { url: `http://localhost:5520/?${q}` });
  for (let i = 0; i < 100; i++) { await sleep(200); if (await ev('typeof UI !== "undefined" && !!document.getElementById("ui")')) break; }
  await ev(`(() => { SND.setMuted(true); start(); player.hp = 999; stats.maxHp = 999;
    window.__gen = []; const og = genChunk; genChunk = function (a, b) { const t = performance.now(); const r = og(a, b); __gen.push(performance.now() - t); return r; };
    window.__slow = []; const wrapT = (nm) => { const o = window[nm]; window[nm] = function (...a) { const t = performance.now(); const r = o.apply(this, a); (window.__cur = window.__cur || {})[nm] = ((window.__cur[nm]) || 0) + performance.now() - t; return r; }; eval(nm + ' = window[nm]'); };
    for (const nm of ['update', 'render', 'worldTick', 'drawWorld', 'drawGround', 'drawParticles', 'updateTitans', 'syncWorldLists', 'drawWorldTexts']) wrapT(nm);
    const os2 = UI.sync; UI.sync = function (dt) { const t = performance.now(); os2(dt); (window.__cur = window.__cur || {}).sync = performance.now() - t; };
    window.__ft = []; let l = performance.now(); const f = t => { const d = t - l; __ft.push(d); if (d > 40) __slow.push([Math.round(d), Object.fromEntries(Object.entries(window.__cur || {}).map(([k, v]) => [k, +v.toFixed(1)]))]); window.__cur = {}; l = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
    let k = 0; window.__steer = setInterval(() => { k++; keys.KeyD = true; keys.KeyW = (k % 80) < 40; keys.KeyS = !keys.KeyW; player.hp = 999; if (state === 'levelup') choose(0); }, 50); })()`);
  await sleep(+secs * 1000);
  const r = await ev(`(() => { const a = __ft.slice(10).sort((x, y) => x - y), n = a.length, g = __gen.slice().sort((x, y) => x - y);
    return { frames: n, fps: (1000 / (a.reduce((s, v) => s + v, 0) / n)).toFixed(1), median: a[n >> 1].toFixed(1), p95: a[Math.floor(n * 0.95)].toFixed(1), p99: a[Math.floor(n * 0.99)].toFixed(1), max: a[n - 1].toFixed(0), over33: a.filter(v => v > 33).length, over50: a.filter(v => v > 50).length,
      chunks: g.length, genMed: g.length ? g[g.length >> 1].toFixed(1) : 0, genMax: g.length ? g[g.length - 1].toFixed(1) : 0, titans: titans.length, parts: particles.length, dist: Math.round(player.x), slow: __slow.slice(0, 12) }; })()`);
  console.log(q, JSON.stringify(r));
  ws.close(); ch.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
})();
