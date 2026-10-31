import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let file;try{file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}
 catch{return res.writeHead(400).end('Bad request')}
 if(!(file===root||file.startsWith(root+'/')))return res.writeHead(403).end('Forbidden');
 try{res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file));}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const url='http://127.0.0.1:'+server.address().port+'/projects.html';
 for(const width of [360,390,768,1366]){
  const page=await browser.newPage({viewport:{width,height:width<600?800:900},isMobile:width<600,hasTouch:width<600});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   localStorage.setItem('tinkerpet-nickname-v1','PETiano Teste');
   const parts=[{id:'b1',kind:'battery',x:20,y:30,rotation:0,flipped:false}];
   const project={id:'card-test',name:'Teste2',createdAt:1761950940000,updatedAt:1761950940000,
    circuit:{parts,wires:[],voltage:5,switches:{s1:false,s2:false},wireColor:'#df1724'}};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('.card').first().waitFor({state:'visible',timeout:15000});
  const metrics=await page.evaluate(()=>{
   const r=sel=>{const x=document.querySelector(sel).getBoundingClientRect();
    return {x:x.x,y:x.y,w:x.width,h:x.height};};
   const sort=document.querySelector('#sortCircuits');
   return {search:r('#searchCircuits'),sort:r('#sortCircuits'),top:r('.top'),
    scrollWidth:document.documentElement.scrollWidth,
    textAlign:getComputedStyle(sort).textAlignLast};
  });
  assert(metrics.search.w<=175,'Busca não deve ficar larga '+width+': '+JSON.stringify(metrics));
  assert(metrics.search.h<=41,'Busca compacta em altura '+width);
  assert(Math.abs(metrics.search.h-metrics.sort.h)<=2,'Busca e ordenação harmônicas '+width);
  assert.equal(metrics.textAlign,'center','Mais recentes centralizado '+width);
  assert(metrics.scrollWidth<=width+2,'Sem barra horizontal '+width+': '+JSON.stringify(metrics));
  if(width<=810)assert(Math.abs(metrics.search.y-metrics.sort.y)<=2,'Busca e ordenação alinhadas '+width);
  assert.equal(await page.locator('#nickText').textContent(),'PETiano Teste');
  assert(!/[✎✏🖉]/.test(await page.locator('#nickButton').textContent()),'Sem lápis no Nick '+width);
  await page.locator('#nickButton').click();
  assert.equal(await page.locator('#editDialog').evaluate(el=>el.open),true,'Ainda pode editar Nick pelo nome');
  await page.locator('#cancelEdit').click();
  assert.equal(await page.locator('#gateLabel').textContent(),'Gabarito','Sem emoji de cadeado '+width);
  assert.equal(await page.locator('.card').count(),1,'Circuito de teste');
  const card=page.locator('.card').first();
  assert.match(await card.locator('.meta time').textContent(),/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/,'Somente data e horário '+width);
  assert(!/componentes|▣|◷/.test(await card.locator('.meta').textContent()),'Sem contador de peças nem ícones na data '+width);
  const ren=card.locator('[data-action="rename"]');
  assert.equal((await ren.textContent()).trim(),'Renomear','Sem A no Renomear '+width);
  assert.equal(await ren.locator('svg').count(),0,'Sem ícone A no Renomear '+width);
  await page.locator('#searchCircuits').fill('Teste');
  assert.equal(await page.locator('.card').count(),1,'Busca ainda funciona');
  await page.locator('#searchCircuits').fill('Não encontrado');
  assert.equal(await page.locator('.card').count(),0,'Busca filtra circuitos');
  await page.locator('#searchCircuits').fill('');
  await page.locator('#sortCircuits').selectOption('name');
  assert.equal(await page.locator('#sortCircuits').inputValue(),'name','Ordenação continua ativa');
  await page.locator('#openGate').click();
  assert.equal(await page.locator('#gateDialog').evaluate(el=>el.open),true,'Gabarito permanece protegido por senha');
  await page.locator('#gateClose').click();
  assert.deepEqual(errors,[],'Sem erros JavaScript '+width+': '+errors.join('; '));
  console.log('OK polimento '+width+'px: busca compacta, ordenação centrada, nick sem lápis, cartão sem contador, menu sem cadeado');
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
