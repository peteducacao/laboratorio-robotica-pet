import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname))}
 catch{return res.writeHead(400).end()}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:width<600?844:900},isMobile:width<600,hasTouch:width<600});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const part=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false,view:'front'});
   const project={id:'saved-test',name:'Meu carrinho',createdAt:1234,updatedAt:1234,circuit:{
    parts:[part('b1','battery',25,70),part('lm','buck',270,125)],
    wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#ed654d'
   }};
   localStorage.setItem('tinkerpet-nickname-v1','Teste');
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.card[data-id="saved-test"]').waitFor();
  const badge=page.locator('.card[data-id="saved-test"] .status');
  assert.equal(await badge.count(),0,'não mostrar Salvo ao abrir lista '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await badge.count(),0,'não mostrar Salvo ao atualizar/F5 '+width);
  await page.locator('#sortCircuits').selectOption('name');
  await page.locator('#searchCircuits').fill('carrinho');
  assert.equal(await badge.count(),0,'busca e ordenação não contam como salvar '+width);
  await page.locator('#searchCircuits').fill('');
  await page.locator('[data-id="saved-test"] [data-action="rename"]').click();
  await page.locator('#editInput').fill('Meu carrinho renovado');
  await page.locator('#editSave').click();
  assert.equal(await badge.count(),1,'renomear mostra Salvo '+width);
  await page.waitForTimeout(3250);
  assert.equal(await badge.count(),0,'selo some depois de três segundos '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await badge.count(),0,'renomeação não reaparece no F5 '+width);
  await page.locator('[data-id="saved-test"] [data-action="rename"]').click();
  await page.locator('#editSave').click();
  assert.equal(await badge.count(),0,'salvar sem alterar nome não aciona selo '+width);
  const timestampAfterRename=await page.evaluate(()=>
   JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].updatedAt);
  await page.locator('[data-id="saved-test"] .card-buttons [data-action="edit"]').click();
  await page.waitForURL('**/editor.html?project=saved-test*');
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:15000});
  assert.equal(await page.locator('#savedIndicator').isVisible(),false,'sem Salvo ao abrir editor '+width);
  const time=await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].updatedAt);
  assert.equal(time,timestampAfterRename,'abrir editor não deve alterar data '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:15000});
  assert.equal(await page.locator('#savedIndicator').isVisible(),false,'sem Salvo ao atualizar editor '+width);
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await badge.count(),0,'abrir e atualizar editor sem mexer não aciona selo '+width);
  await page.locator('[data-id="saved-test"] .card-buttons [data-action="edit"]').click();
  await page.locator('[data-port="b1.NEG"]').first().waitFor({state:'attached',timeout:15000});
  await page.evaluate(()=>{
   for(const pin of ['b1.NEG','lm.INN']){
    const el=document.querySelector('[data-port="'+pin+'"]');
    if(!el)throw Error('Pino não encontrado '+pin);
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
   }
  });
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].circuit.wires.length===1);
  assert.equal(await page.locator('#savedIndicator').isVisible(),true,'alteração na bancada mostra confirmação '+width);
  await page.waitForTimeout(3150);
  assert.equal(await page.locator('#savedIndicator').isVisible(),false,'confirmação na bancada desaparece '+width);
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await badge.count(),1,'modificar ligação mostra selo ao voltar '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await badge.count(),0,'F5 consome aviso anterior sem reaparecer '+width);
  await page.locator('#newCircuit').click();
  await page.waitForURL('**/editor.html?project=*');
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  const newBadge=page.locator('.card[data-id]:not([data-id="saved-test"]) .status');
  assert.equal(await newBadge.count(),1,'circuito recém-criado recebe Salvo '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await newBadge.count(),0,'novo circuito não repete Salvo ao atualizar '+width);
  assert.deepEqual(errors,[],'sem erros JavaScript '+width+': '+errors.join('; '));
  await page.close();
  console.log('OK Salvo '+width+'px: F5, edição real, nome, criação, expiração e editor');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
