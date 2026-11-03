import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.avif':'image/avif','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path===root)path=resolve(root,'index.html');}
 catch{return res.writeHead(400).end('Bad request');}
 if(!path.startsWith(root+'/'))return res.writeHead(403).end('Forbidden');
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(path));}
 catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const rawLibrary={version:1,projects:[{
 id:'original-preservado',name:'Meu circuito original',createdAt:1762120000000,updatedAt:1762120000000,
 circuit:{parts:[{id:'esp',kind:'esp',x:400,y:200,view:'front',rotation:0,flipped:false}],
 wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#df1724'}
}]};
const raw=JSON.stringify(rawLibrary);
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,768,1366]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',resp=>{if(resp.status()===404&&resp.url().includes('component-preview'))missing.push(resp.url())});
  await page.addInitScript(data=>{
   localStorage.setItem('tinkerpet-library-v1',data);
   localStorage.setItem('tinkerpet-nickname-v1','PET Teste');
  },raw);
  await page.goto(base+'/preview-componentes.html',{waitUntil:'domcontentloaded'});
  await page.locator('#projectsGrid .card').first().waitFor({state:'visible',timeout:18000});
  assert.ok(await page.locator('#projectsGrid .card').count()>=2,'Página de Meus circuitos com exemplo e circuito real');
  assert.match(await page.locator('.components-preview-note').textContent(),/não são alterados/,'Aviso de segurança visível');
  assert.equal(await page.evaluate(()=>localStorage.getItem('tinkerpet-library-v1')),raw,'Biblioteca real preservada na listagem');
  const demo=page.locator('#projectsGrid .card').filter({hasText:'Prévia — todos os componentes'});
  assert.equal(await demo.count(),1,'Exemplo com todos os componentes aparece na listagem');
  await demo.locator('[data-action="edit"]').first().click();
  await page.waitForURL(/preview-componentes-bancada\.html/);
  await page.locator('#partsLayer .part').first().waitFor({state:'visible',timeout:20000});
  const art=await page.locator('#partsLayer .part-image img').evaluateAll(imgs=>imgs.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0})));
  assert.equal(art.length,9,'As nove peças estão na bancada '+width+': '+JSON.stringify(art));
  assert.ok(art.every(x=>x.src.includes('assets/component-preview/')&&x.loaded),'Novos desenhos estão visíveis em '+width+': '+JSON.stringify(art));
  assert.equal(await page.evaluate(()=>localStorage.getItem('tinkerpet-library-v1')),raw,'Bancada não altera projetos originais');
  assert.match(await page.locator('.preview-return-link').textContent(),/Meus circuitos/,'Voltar para a prévia presente');
  assert.deepEqual(missing,[],'Todos os SVGs da prévia carregam');
  assert.deepEqual(errors,[],'Sem erro de script em '+width+': '+errors.join('; '));
  console.log('OK prévia '+width+'px: listagem, 9 peças vetoriais, retorno e armazenamento isolado');
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
