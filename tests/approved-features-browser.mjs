import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let p;try{p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname))}
 catch{return res.writeHead(400).end();}
 if(!(p===root||p.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream'}).end(readFileSync(p))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const rootUrl='http://127.0.0.1:'+server.address().port;
 const original={
  id:'original-001',name:'Carrinho original',createdAt:1700000000000,updatedAt:1700000000000,
  circuit:{parts:[{id:'b1',kind:'battery',x:20,y:30,rotation:0,flipped:false}],wires:[],voltage:5,switches:{s1:false,s2:false},wireColor:'#df1724'}
 };
 const incoming={
  id:'incoming-001',name:'Restauração segura',createdAt:1701000000000,updatedAt:1702000000000,
  circuit:{parts:[{id:'esp',kind:'esp',x:120,y:160,rotation:0,flipped:false}],wires:[],voltage:5,switches:{s1:false,s2:false},wireColor:'#df1724'}
 };
 const payload={app:'TinkerPET Studio',format:'tinkerpet-library-backup',version:1,
  exportedAt:'2026-10-31T12:00:00.000Z',projects:[incoming]};
 const file={name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))};
 for(const width of [390,768,1366]){
  const page=await browser.newPage({
   viewport:{width,height:width<600?840:900},isMobile:width<600,hasTouch:width<600,acceptDownloads:true
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(project=>{
   localStorage.setItem('tinkerpet-nickname-v1','PETiano Teste');
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  },original);
  await page.goto(rootUrl+'/projects.html',{waitUntil:'domcontentloaded'});
  await page.locator('#importCircuit').waitFor({state:'visible'});
  assert.equal(await page.locator('#newCircuit').count(),0,'sem botão redundante '+width);
  assert.equal(await page.locator('.create-inner').count(),1,'cartão Criar novo circuito preservado '+width);
  const importButton=page.locator('#importCircuit');
  assert(importButton.evaluate(el=>getComputedStyle(el).backgroundImage).then(x=>x.includes('gradient')),'fundo verde de Importar '+width);
  assert.equal(await page.locator('#sortCircuits option').count(),2,'sem Mais peças '+width);
  assert.equal(await page.locator('#libraryStats').isVisible(),false,'estatísticas recolhidas '+width);
  await page.locator('#toggleLibraryInfo').click();
  assert.equal(await page.locator('#libraryStats').isVisible(),true,'abre estatísticas '+width);
  await page.locator('#toggleLibraryInfo').click();
  assert.equal(await page.locator('#libraryStats').isVisible(),false,'fecha estatísticas '+width);
  await page.locator('#backupCircuits').click();
  assert.equal(await page.locator('#backupDialog').evaluate(x=>x.open),true,'backup modal '+width);
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#downloadBackup').click();
  const download=await downloadEvent;
  assert.match(download.suggestedFilename(),/^tinkerpet-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const filePath=await download.path();
  const saved=JSON.parse(readFileSync(filePath,'utf8'));
  assert.equal(saved.format,'tinkerpet-library-backup');
  assert.equal(saved.projects.length,1);
  assert.deepEqual(saved.projects[0],original,'backup integral do circuito original '+width);
  await page.locator('#restoreFile').setInputFiles(file);
  await page.locator('#backupReview').waitFor({state:'visible'});
  assert.equal(await page.locator('[name="restoreMode"]:checked').inputValue(),'merge','padrão adicionar '+width);
  await page.locator('#confirmRestore').click();
  await page.locator('#backupDialog').waitFor({state:'hidden'});
  let current=await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects);
  assert.equal(current.length,2,'adiciona projeto sem apagar existente '+width);
  assert.deepEqual(current.find(x=>x.id===original.id),original,'projeto original preservado '+width);
  assert(current.some(x=>x.name===incoming.name),'recuperou projeto '+width);
  await page.locator('#backupCircuits').click();
  await page.locator('#restoreFile').setInputFiles(file);
  await page.locator('#backupReview').waitFor({state:'visible'});
  await page.locator('input[name="restoreMode"][value="replace"]').check();
  assert.equal(await page.locator('#backupReplaceWarning').isVisible(),true,'aviso de substituição '+width);
  await page.locator('#confirmRestore').click();
  assert.match(await page.locator('#backupError').textContent(),/Marque a confirmação/,'não substitui por engano '+width);
  current=await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects);
  assert.equal(current.length,2,'cancelou substituição não confirmada '+width);
  await page.locator('#confirmReplaceLibrary').check();
  await page.locator('#confirmRestore').click();
  await page.locator('#backupDialog').waitFor({state:'hidden'});
  current=await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects);
  assert.deepEqual(current,[incoming],'substituição explícita preserva todos os dados do arquivo '+width);
  // Uma restauração inválida jamais pode apagar a biblioteca.
  await page.locator('#backupCircuits').click();
  await page.locator('#restoreFile').setInputFiles({
   name:'arquivo-danificado.json',mimeType:'application/json',
   buffer:Buffer.from('{"format":"tinkerpet-library-backup","version":1,"projects":[{"id":"bad"}]}')
  });
  await page.locator('#backupReview').waitFor({state:'visible'});
  assert.equal(await page.locator('#confirmRestore').isDisabled(),true,'backup inválido não pode aplicar '+width);
  current=await page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects);
  assert.deepEqual(current,[incoming],'backup inválido não altera os circuitos '+width);
  await page.locator('#backupClose').click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.card').count(),1,'dados persistem após F5 '+width);
  assert.deepEqual(errors,[],'sem erros JS '+width+': '+errors.join(' | '));
  console.log('OK backup+menu '+width+'px: exportação real, adição, substituição confirmada, arquivo inválido e F5');
  await page.close();
 }
 // Modo apresentação: abrir do guia, navegar, tela cheia e fechar de duas formas.
 for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(rootUrl+'/como-funciona.html',{waitUntil:'domcontentloaded'});
  await page.locator('#startPresentation').click();
  const modal=page.locator('#presentationDialog');
  assert.equal(await modal.evaluate(el=>el.open),true,'apresentação abre '+width);
  assert.equal(await page.locator('#slideDots button').count(),8,'oito componentes '+width);
  await page.locator('#slideNext').click();
  assert.equal(await page.locator('#slideTitle').textContent(),'LM2596');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#slideTitle').textContent(),'Ponte H MX1508');
  await page.locator('#slidePrev').click();
  assert.equal(await page.locator('#slideTitle').textContent(),'LM2596');
  if(width===1366){
   await page.locator('#presentationFullscreen').click();
   await page.waitForFunction(()=>!!document.fullscreenElement,{timeout:4000});
   assert.equal(await page.evaluate(()=>document.fullscreenElement?.id),'presentationDialog',
    'fullscreen real no computador');
   assert.match(await page.locator('#presentationFullscreen').getAttribute('aria-label'),/Sair/);
   await page.locator('#presentationFullscreen').click();
   await page.waitForFunction(()=>!document.fullscreenElement,{timeout:4000});
   assert.equal(await modal.evaluate(el=>el.open),true,'sair da tela cheia mantém apresentação '+width);
  }
  await page.locator('#closePresentation').click();
  await page.waitForFunction(()=>!document.querySelector('#presentationDialog').open);
  assert.equal(await page.locator('#startPresentation').isVisible(),true,'volta ao guia '+width);
  await page.locator('#startPresentation').click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#presentationDialog').open);
  assert.deepEqual(errors,[],'sem erro de apresentação '+width+': '+errors.join(' | '));
  console.log('OK modo apresentação '+width+'px: oito slides, fechar, Esc, tela cheia');
  await page.close();
 }
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
