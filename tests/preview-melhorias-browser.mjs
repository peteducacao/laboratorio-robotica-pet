import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end('Bad request')}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end('Forbidden');
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const capture=join(root,'test-results','preview-melhorias');
mkdirSync(capture,{recursive:true});
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,768,1366]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  const errors=[];const responseErrors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',res=>{if(res.status()>=400)responseErrors.push(res.url()+': '+res.status())});
  await page.addInitScript(()=>{
   localStorage.setItem('tinkerpet-library-v1','sentinel-projects-DO-NOT-TOUCH');
   sessionStorage.setItem('tinkerpet-preview-test','sentinel-session');
  });
  await page.goto(origin+'/preview-melhorias.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('h1').textContent().then(s=>s.includes('O mesmo TinkerPET.')),true,'título da prévia');
  assert.equal(await page.locator('[data-tab]').count(),3,'três propostas');
  assert.equal(await page.locator('.component-choice').count(),8,'oito componentes');
  await page.locator('.component-choice').nth(1).click();
  assert.equal(await page.locator('#selectedTitle').textContent(),'LM2596');
  await page.locator('#presentSelected').click();
  assert.equal(await page.locator('#presentationDialog').evaluate(el=>el.open),true,'apresentação abre');
  assert.equal(await page.locator('#slideTitle').textContent(),'LM2596');
  assert.equal(await page.locator('#slideDots button').count(),8,'slides navegáveis');
  await page.locator('#slideNext').click();
  assert.equal(await page.locator('#slideTitle').textContent(),'Ponte H MX1508');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#slideTitle').textContent(),'Chave gangorra');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#slideTitle').textContent(),'Ponte H MX1508');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#presentationDialog').evaluate(el=>el.open),false,'Esc encerra');
  await page.locator('[data-tab="backup"]').click();
  assert.equal(await page.locator('#panel-backup').isVisible(),true,'aba backup visível');
  await page.locator('#simulateExport').click();
  assert.match(await page.locator('#backupResult').textContent(),/tinkerpet-backup-completo.json/,'simula exportação');
  await page.locator('#simulateImport').click();
  assert.match(await page.locator('#backupResult').textContent(),/Adicionar sem excluir/,'simula restauração segura');
  await page.locator('[name="restoreMock"][value="replace"]').check();
  await page.locator('[data-tab="menus"]').click();
  assert.equal(await page.locator('#menuMock').getAttribute('data-version'),'now');
  assert.equal(await page.locator('.menu-create-project').isVisible(),true,'comparação original');
  await page.locator('#menuNext').click();
  assert.equal(await page.locator('#menuMock').getAttribute('data-version'),'next');
  assert.equal(await page.locator('.menu-create-project').isVisible(),false,'cartão redundante removido na proposta');
  await page.locator('#toggleMenuInfo').click();
  assert.equal(await page.locator('#menuStats').isVisible(),true,'informações expansíveis');
  await page.locator('#toggleMenuInfo').click();
  assert.equal(await page.locator('#menuStats').isVisible(),false,'informações fecham');
  await page.locator('#fakeCreate').click();
  assert.match(await page.locator('#previewToast').textContent(),/Apenas prévia/);
  const dimensions=await page.evaluate(()=>({
   viewport:innerWidth,
   scrollWidth:document.documentElement.scrollWidth,
   currentLocal:localStorage.getItem('tinkerpet-library-v1'),
   currentSession:sessionStorage.getItem('tinkerpet-preview-test')
  }));
  assert(dimensions.scrollWidth<=width+2,'não criar rolagem horizontal '+width+': '+JSON.stringify(dimensions));
  assert.equal(dimensions.currentLocal,'sentinel-projects-DO-NOT-TOUCH','não acessar projetos reais '+width);
  assert.equal(dimensions.currentSession,'sentinel-session','não interferir na sessão '+width);
  assert.deepEqual(errors,[],'JS sem erros '+width+': '+errors.join(' | '));
  assert.deepEqual(responseErrors,[],'imagens e arquivos carregados '+width+': '+responseErrors.join(' | '));
  if(width===1366){
   await page.locator('[data-tab="presentation"]').click();
   await page.screenshot({path:join(capture,'desktop-presentation.png'),fullPage:true});
   await page.locator('[data-tab="backup"]').click();
   await page.screenshot({path:join(capture,'desktop-backup.png'),fullPage:true});
   await page.locator('[data-tab="menus"]').click();
   await page.locator('#menuNext').click();
   await page.screenshot({path:join(capture,'desktop-menus.png'),fullPage:true});
  }else if(width===390){
   await page.locator('[data-tab="presentation"]').click();
   await page.screenshot({path:join(capture,'mobile.png'),fullPage:true});
  }
  await page.close();
  console.log('OK prévia isolada '+width+'px: slides, backup fictício, menus, sem alterar dados, sem overflow');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}