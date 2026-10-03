import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const prog = process.argv[2];
const shots = (process.argv[3] || '').split(',').map(x => x.trim()).filter(Boolean).map(Number);
const udd = 'C:\\Windows\\Temp\\cuv-' + Date.now();
const url = prog.startsWith('http') ? prog : 'file:///' + path.resolve(prog).replace(/\\/g, '/');

const extra = (process.env.EXTRA_FLAGS || '').split(' ').map(s => s.trim()).filter(Boolean);
const p = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=0',
  '--user-data-dir=' + udd, '--window-size=1440,900', '--allow-file-access-from-files', ...extra, url],
  { stdio: ['ignore','pipe','pipe'] });

let buf = '';
const wsUrl = await new Promise((res, rej) => {
  const to = setTimeout(() => rej(new Error('timeout waiting devtools')), 20000);
  p.stderr.on('data', d => { buf += d; const m = /ws:[^ ]+/.exec(buf); if (m) { clearTimeout(to); res(m[0]); } });
  p.on('exit', c => rej(new Error('chrome exited ' + c)));
});
const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
await new Promise(r => ws.on('open', r));
let id = 0; const waiters = new Map();
ws.on('message', raw => { const m = JSON.parse(raw.toString()); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } });
const send = (method, params, sessionId) => new Promise(res => { const i = ++id; waiters.set(i, res); ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tgt = null;
for (let i = 0; i < 40 && !tgt; i++) { const r = await send('Target.getTargets'); tgt = (r.result?.targetInfos || []).find(t => t.type === 'page'); if (!tgt) await sleep(250); }
const sid = (await send('Target.attachToTarget', { targetId: tgt.targetId, flatten: true })).result.sessionId;
await send('Runtime.enable', {}, sid);
await send('Page.enable', {}, sid);

// 等待页面自身完成（若页面带 __DONE__）
const waitSelfDone = Date.now() + 3000;
while (Date.now() < waitSelfDone) {
  const r = await send('Runtime.evaluate', { expression: 'String(!!window.__DONE__)', returnByValue: true }, sid);
  if (r.result?.result?.value === 'true') break;
  await sleep(100);
}

// 执行外部注入探针：优先用 addScriptToEvaluateOnNewDocument（document_start 注入）
if (process.env.PROBE_JS) {
  const fnText = fs.readFileSync(process.env.PROBE_JS, 'utf8');
  const body = 'window.__PROBE_ERR__=null; document.addEventListener("DOMContentLoaded", function(){ (async function(){ try { ' + fnText + ' } catch(e) { window.__PROBE_ERR__ = String(e && e.stack || e); } })(); });';
  const add = await send('Page.addScriptToEvaluateOnNewDocument', { source: body }, sid);
  if (add.error) console.error('ADD SCRIPT ERR', JSON.stringify(add.error));
  const rounds = Number(process.env.RELOAD_ROUNDS || 1);
  for (let k = 0; k < rounds; k++) {
    const rl = await send('Page.reload', { ignoreCache: true }, sid);
    if (rl.error) console.error('RELOAD ERR', JSON.stringify(rl.error));
    await sleep(Number(process.env.PROBE_WAIT || 8000));
    if (rounds > 1) {
      const g = await send('Runtime.evaluate', { expression: 'JSON.stringify({round:' + (k+1) + ', played: sessionStorage.getItem("dsh-enter-anim-played"), frames: window.__R__ ? window.__R__.frames.length : -1, moved: window.__R__ ? window.__R__.frames.some(f => f.cells && f.cells.some(c => /,x=(-?[1-9]|0\.)/.test(c))) : null})', returnByValue: true }, sid);
      console.log(g.result?.result?.value || 'round-null');
    }
  }
}

if (shots.length) {
  const started = Date.now(); const out = [];
  for (const d of shots) {
    const wait = d - (Date.now() - started); if (wait > 0) await sleep(wait);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sid);
    if (r.result?.data) { const base = prog.startsWith('http') ? path.join(process.env.SHOT_DIR || '.', '') : path.dirname(path.resolve(prog)); const f = path.join(base, 'shot-' + d + 'ms.png'); fs.writeFileSync(f, Buffer.from(r.result.data, 'base64')); out.push({ at: Date.now() - started, file: f, bytes: fs.statSync(f).size }); }
    else out.push({ at: Date.now() - started, error: JSON.stringify(r).slice(0, 200) });
  }
  console.log(JSON.stringify({ shots: out }, null, 1));
} else {
  const expr = process.env.EXPR || 'JSON.stringify(window.__R__ || null)';
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid);
  const v = r.result?.result?.value;
  console.log(typeof v === 'string' ? v : JSON.stringify(r.result, null, 1));
}
ws.close(); p.kill();
process.exit(0);
