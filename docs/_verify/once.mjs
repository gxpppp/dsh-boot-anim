import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const dirn = path.dirname(path.resolve(process.argv[1]));
const probeSrc = fs.readFileSync(path.join(dirn, 'probeOnce.js'), 'utf8');
const udd = 'C:\\Windows\\Temp\\once-' + Date.now();
const p = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=0','--user-data-dir='+udd,'--window-size=1440,900', url], { stdio: ['ignore','pipe','pipe'] });
let buf='';
const wsUrl = await new Promise((res, rej) => { const to=setTimeout(()=>rej(new Error('to')),20000); p.stderr.on('data',d=>{buf+=d;const m=/ws:[^ ]+/.exec(buf); if(m){clearTimeout(to);res(m[0]);}}); });
const ws = new WebSocket(wsUrl, { perMessageDeflate:false, maxPayload:64*1024*1024 });
await new Promise(r=>ws.on('open',r));
let id=0; const w=new Map();
ws.on('message', raw=>{ const m=JSON.parse(raw.toString()); if(m.id&&w.has(m.id)){w.get(m.id)(m);w.delete(m.id);} });
const send=(m,pa,s)=>new Promise(res=>{const i=++id;w.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:pa||{},sessionId:s}));});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tgt=null; for(let i=0;i<40&&!tgt;i++){const r=await send('Target.getTargets');tgt=(r.result?.targetInfos||[]).find(t=>t.type==='page');if(!tgt)await sleep(250);}
const sid=(await send('Target.attachToTarget',{targetId:tgt.targetId,flatten:true})).result.sessionId;
await send('Runtime.enable',{},sid); await send('Page.enable',{},sid);
const probeId = (await send('Page.addScriptToEvaluateOnNewDocument',{source: probeSrc},sid)).result.identifier;
const report = async (tag) => {
  const r = await send('Runtime.evaluate',{expression:'JSON.stringify({tag:"'+tag+'", played: sessionStorage.getItem("dsh-enter-anim-played"), reduce: window.__R__&&window.__R__.reduce, stat: window.__R__&&window.__R__.stat, frames: window.__R__&&window.__R__.frames.length, first: window.__R__&&window.__R__.frames.slice(0,4).map(f=>({f:f.f,t:f.t,ready:f.ready,pending:f.pending,cells:f.cells}))})',returnByValue:true},sid);
  console.log(r.result?.result?.value);
};
await send('Page.reload',{ignoreCache:true},sid); await sleep(3000);
await report('A-first-load');
await send('Page.reload',{ignoreCache:true},sid); await sleep(3000);
await report('B-second-load');
await send('Runtime.evaluate',{expression:'sessionStorage.clear()',returnByValue:true},sid);
await send('Page.reload',{ignoreCache:true},sid); await sleep(3000);
await report('C-after-clear');
await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:probeId},sid);
ws.close();p.kill();process.exit(0);
