// node dev/i18n_check.js en|es — walks every screen and prints strings with no translation
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const lang = process.argv[2] || 'en';
const port = 9700 + (process.pid % 200);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-i18n-'));
const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--mute-audio', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) {} if (!ws) await sleep(250); }
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.exceptionDetails ? 'EXC ' + r.exceptionDetails.exception.description.slice(0, 200) : r.result.value; };
  await send('Page.navigate', { url: `http://localhost:5520/?lang=${lang}&all=1&tokens=9000&stats=1` });
  for (let i = 0; i < 100; i++) { await sleep(200); if (await ev('typeof UI !== "undefined" && !!document.getElementById("ui")')) break; }
  await ev('SND.setMuted(true); for (let i = 0; i < 30; i++) grantGear(GEAR[i % GEAR.length].id, 1 + i % 5); 1');
  for (const s of ['hub', 'battle', 'squad', 'gear', 'training', 'gacha', 'missions', 'records', 'settings']) { await ev(`UI.go('${s}'); 1`); await sleep(300); }
  const steps = [`(() => { UI.go('gacha'); document.querySelectorAll('#g-tabs .gt')[1].click(); document.querySelectorAll('#g-tabs .gt')[3].click(); document.querySelector('#g-hist-btn') && 1; return 1; })()`,
    `(() => { UI.go('gacha'); save.pity5 = 69; gachaState().chest.event = 9.5; [...document.querySelectorAll('#g-tabs .gt')][0].click(); [...document.querySelectorAll('#g-btns .k-btn')].find(b => /×10/.test(b.textContent) && !/\\(/.test(b.textContent)).click(); return state; })()`];
  for (const st of steps) { console.log('step', await ev(st)); await sleep(1500); }
  const ph = []; for (let i = 0; i < 25; i++) { ph.push(await ev("window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' })); state + ':' + UI.rvPhase()")); await sleep(700); } console.log(ph.join(' '));
  console.log('after pulls state', await ev('state'));
  await ev(`(() => { start(); SND.setMuted(true); for (let i = 0; i < 600; i++) { player.hp = 9; update(1 / 30); if (state === 'levelup') { UI.sync(0); choose(0); } } spawnBoss(BOSSES[5]); for (let i = 0; i < 300; i++) { player.hp = 9; if (i % 20 === 0) engage(); update(1 / 30); if (state === 'levelup') { UI.sync(0); choose(0); } } UI.sync(0); state = 'paused'; UI.sync(0); state = 'play'; finishRun(true); state = 'win'; UI.sync(0); return 1; })()`);
  await sleep(500);
  const miss = await ev('[...I18N_MISSING]');
  const cyr = await ev(`[...document.querySelectorAll('#ui *')].filter(e => e.children.length === 0 && /[А-Яа-яЁё]/.test(e.textContent) && e.offsetParent).map(e => e.textContent.trim().slice(0, 60)).slice(0, 30)`);
  console.log(lang, 'missing', JSON.stringify(miss), '| visible cyrillic', JSON.stringify(cyr));
  ws.close(); ch.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
})();
