import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(path===root)path=resolve(root,'index.html');}
 catch{return res.writeHead(400).end()}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(path))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port;
let browser;
const fixture=()=>({version:1,projects:[]});
const make=(id,name)=>({id,name,createdAt:Date.now(),updatedAt:Date.now(),circuit:{parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#df1724'}});
const write=async(page,data)=>page.evaluate(lib=>localStorage.setItem('tinkerpet-library-v1',JSON.stringify(lib)),data);
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,serviceWorkers:'allow'});
  const a=await context.newPage(),b=await context.newPage();
  for(const p of [a,b]){p.on('pageerror',e=>console.error('PAGE JS',e.message));await p.addInitScript(()=>localStorage.setItem('tinkerpet-nickname-v1','Teste'))}
  await a.goto(url+'/projects.html',{waitUntil:'domcontentloaded'});
  await b.goto(url+'/projects.html',{waitUntil:'domcontentloaded'});
  await write(b,{version:1,projects:[make('normal-1','Visitante sem app')]});
  await a.waitForTimeout(550);
  assert.equal(await a.locator('#tinkerpet-local-sync-cover').count(),0,'nunca bloquear visitante sem instalação');
  await b.evaluate(()=>localStorage.setItem('tinkerpet-local-installed-v1','1'));
  await a.reload({waitUntil:'domcontentloaded'});
  await b.reload({waitUntil:'domcontentloaded'});
  // O app grava outra edição e o navegador deve bloquear e recarregar a revisão.
  await write(b,{version:1,projects:[make('pc-1','Editado no aplicativo')]});
  await a.waitForFunction(()=>document.querySelector('#projectsGrid')?.textContent?.includes('Editado no aplicativo'),null,{timeout:9000});
  await a.waitForFunction(()=>sessionStorage.getItem('tinkerpet-local-refresh-pending-v1')===null,null,{timeout:9000});
  assert.equal(await a.evaluate(()=>document.querySelector('#tinkerpet-local-sync-cover')===null),true,'modal removido após recarga');
  assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].name),'Editado no aplicativo');
  // Navegação inversa: app precisa visualizar mudança do navegador.
  await write(a,{version:1,projects:[make('pc-2','Editado no navegador')]});
  await b.waitForFunction(()=>document.querySelector('#projectsGrid')?.textContent?.includes('Editado no navegador'),null,{timeout:9000});
  assert.equal(await b.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].name),'Editado no navegador');
  // Offline continua no MESMO localStorage, sem enviar para servidor.
  await a.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:15000});
  await b.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:15000});
  await context.setOffline(true);
  await write(a,{version:1,projects:[make('offline-3','Editado sem Wi-Fi')]});
  await b.waitForFunction(()=>document.querySelector('#projectsGrid')?.textContent?.includes('Editado sem Wi-Fi'),null,{timeout:10000});
  assert.equal(await b.evaluate(()=>navigator.onLine),false);
  assert.equal(await b.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects.length),1);
  await context.setOffline(false);
  // Mesmo projeto, acesso pelo editor usa seu ID e deve permanecer preservado.
  await a.goto(url+'/editor.html?project=offline-3',{waitUntil:'domcontentloaded'});
  assert.equal(await a.locator('#undoBtn').count(),1,'editor intacto');
  assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].name),'Editado sem Wi-Fi');
  console.log('OK sincronização local '+width+'px: somente instalado, duas direções, offline e editor preservado');
  await context.close();
 }
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
