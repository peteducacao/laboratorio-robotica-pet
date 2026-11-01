import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.avif':'image/avif','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 let path;try{path=resolve(root,'.'+decodeURIComponent(pathname));if(path===root)path=resolve(root,'index.html');}
 catch{return res.writeHead(400).end();}
 if(!path.startsWith(root+'/'))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(path));}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  const mobile=width===390,context=await browser.newContext({
   viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,
   serviceWorkers:'allow'
  });
  const errors=[];
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  let remoteSha='a'.repeat(40);
  await page.route('https://api.github.com/repos/peteducacao/laboratorio-robotica-pet/commits/main',route=>
   route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({sha:remoteSha})})
  );
  await page.addInitScript(()=>localStorage.setItem('tinkerpet-nickname-v1','Teste'));
  await page.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
  const fixture={version:1,projects:[{id:'pwa-teste-circuito',name:'Circuito preservado',createdAt:1,updatedAt:1,
   circuit:{parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#df1724'}}]};
  await page.evaluate(data=>{
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify(data));
   localStorage.setItem('pwa-preserve-this','circuitos-inalterados');
  },fixture);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:25000});
  await page.waitForFunction(()=>localStorage.getItem('tinkerpet-pwa-installed-revision-v1')==='a'.repeat(40),null,{timeout:12000});
  assert.equal(await page.locator('#pwaUpdateButton').getAttribute('hidden'),'','atualização oculta na versão atual');
  await page.locator('#toggleLibraryInfo').click();
  assert.equal(await page.locator('#pwaInstallButton').count(),1,'Instalar no menu Informações');
  assert.equal(await page.locator('#pwaInstallButton').isVisible(),true);
  await page.locator('#pwaInstallButton').click();
  assert.equal(await page.locator('#pwaInstallHelp').isVisible(),true,'instruções quando não existe evento de instalação');
  const manifest=await page.evaluate(async()=>{
   const link=document.querySelector('link[rel=manifest]');
   return fetch(link.href).then(x=>x.json());
  });
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.icons.length,2);
  await page.waitForFunction(async()=>await caches.has('tinkerpet-offline-shell-20261031-first-install-v1'),null,{timeout:12000});
  await context.setOffline(true);
  for(const [path,needle] of [
   ['/index.html','#enterProjects'],
   ['/projects.html','#projectsGrid'],
   ['/como-funciona.html','#componentsGrid'],
   ['/editor.html?project=pwa-teste-circuito','#undoBtn']
  ]){
   await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:15000});
   assert.equal(await page.locator(needle).count(),1,path+' acessível sem internet');
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-preserve-this')),'circuitos-inalterados');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1'))),fixture,'biblioteca permanece salva offline');
  await context.setOffline(false);
  await page.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  remoteSha='b'.repeat(40);
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.waitForFunction(()=>!document.getElementById('pwaUpdateButton').hidden,null,{timeout:12000});
  assert.equal(await page.locator('#pwaUpdateButton').isVisible(),false,'atualização aparece somente dentro de Informações fechado');
  await page.locator('#toggleLibraryInfo').click();
  assert.equal(await page.locator('#pwaUpdateButton').isVisible(),true);
  await page.locator('#pwaUpdateButton').click();
  await page.waitForFunction(()=>localStorage.getItem('tinkerpet-pwa-installed-revision-v1')==='b'.repeat(40),null,{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#pwaUpdateButton')?.hidden===true,null,{timeout:15000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-preserve-this')),'circuitos-inalterados','atualização não altera dados');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1'))),fixture,'atualização preserva a biblioteca');
  assert.equal(await page.evaluate(async()=>await caches.has('tinkerpet-offline-shell-'+'b'.repeat(40))),true,'novo cache instalado');
  assert.deepEqual(errors,[],'sem erros de script '+width+': '+errors.join('; '));
  console.log('OK PWA '+width+'px: instalação, offline, atualização oculta e dados preservados');
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}