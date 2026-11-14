// node dev/errs.js "<query>" — prints console errors and exceptions while the page loads
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const q = process.argv[2] || 'lang=ru';
const port = 9800 + (process.pid % 150);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'aot-err-'));
const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) {} if (!ws) await sleep(250); }
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; console.log('EXC', (d.exception && d.exception.description || d.text).slice(0, 400), '@', d.url && d.url.split('/').pop(), d.lineNumber); }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) console.log('CON', m.params.type, m.params.args.map(a => a.value || a.description).join(' ').slice(0, 300));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') console.log('LOG', m.params.entry.text.slice(0, 200), m.params.entry.url || '');
  });
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }));
  send('Runtime.enable'); send('Log.enable');
  if (process.env.W) send('Emulation.setDeviceMetricsOverride', { width: +process.env.W, height: +process.env.H, deviceScaleFactor: 1, mobile: false });
  send('Page.navigate', { url: `http://localhost:5520/?${q}` });
  await sleep(+(process.env.T || 8000));
  await new Promise(r => { const i = ++id; ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id === i) { console.log('STATE', JSON.stringify(m.result.result.value)); r(); } }); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: 'JSON.stringify({ state: typeof state !== "undefined" ? state : null, loadP: typeof loadP !== "undefined" ? loadP : null, ui: !!document.getElementById("ui") })', returnByValue: true } })); });
  if (process.env.SHOT) await new Promise(r => { const i = ++id; ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id === i) { fs.writeFileSync(process.env.SHOT, Buffer.from(m.result.data, 'base64')); r(); } }); ws.send(JSON.stringify({ id: i, method: 'Page.captureScreenshot', params: { format: 'png' } })); });
  ws.close(); ch.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
})();
