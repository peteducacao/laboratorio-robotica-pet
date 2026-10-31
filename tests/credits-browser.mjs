import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const contentTypes={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let pathname;
 try{pathname=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end('Bad request')}
 if(!(pathname===root||pathname.startsWith(root+'/')))return res.writeHead(403).end('Forbidden');
 try{res.writeHead(200,{'Content-Type':contentTypes[extname(pathname)]||'application/octet-stream'}).end(readFileSync(pathname))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [360,390,768,1366]){
  const page=await browser.newPage({
   viewport:{width,height:width<600?800:900},
   isMobile:width<600,hasTouch:width<600
  });
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{
   localStorage.setItem('tinkerpet-nickname-v1','Aluno Teste');
  });
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  await page.locator('#openCredits').waitFor({state:'visible',timeout:15000});
  const layout=await page.evaluate(()=>{
   const rect=id=>{const x=document.getElementById(id).getBoundingClientRect();
    return {top:x.top,bottom:x.bottom,left:x.left,right:x.right,width:x.width};};
   return {gate:rect('openGate'),credits:rect('openCredits'),
    scrollWidth:document.documentElement.scrollWidth};
  });
  assert(layout.scrollWidth<=width+2,'Menu sem barra horizontal '+width+': '+JSON.stringify(layout));
  const searchSize=await page.locator('#searchCircuits').evaluate(el=>{
   const rect=el.getBoundingClientRect();
   return {width:rect.width,height:rect.height};
  });
  assert(searchSize.width<=227,'Buscar circuito precisa ser mais estreito '+width+': '+JSON.stringify(searchSize));
  assert(searchSize.height<=43,'Buscar circuito precisa ser mais baixo '+width+': '+JSON.stringify(searchSize));
  await page.locator('#searchCircuits').fill('carrinho');
  assert.equal(await page.locator('#searchCircuits').inputValue(),'carrinho','campo de busca continua funcional '+width);
  await page.locator('#searchCircuits').fill('');
  assert(layout.credits.top>=layout.gate.top,'Créditos não aparece acima do Gabarito '+width);
  if(width>810)assert(layout.credits.top>=layout.gate.bottom-1,'Créditos abaixo no desktop '+width);
  if(width<=810)assert(layout.credits.top>=layout.gate.bottom-1,'Créditos abaixo no mobile '+width);
  await page.locator('#openCredits').click();
  const dialog=page.locator('#creditsDialog');
  await dialog.waitFor({state:'visible',timeout:5000});
  assert.equal(await dialog.evaluate(e=>e.open),true,'Modal de créditos aberto '+width);
  assert.equal(await page.locator('.credits-person-original strong').textContent(),'Gabriel J. Santos');
  assert.equal(await page.locator('.credits-person-developer strong').textContent(),'Sérgio R. Santos');
  assert.match(await page.locator('.credits-person-original').textContent(),/PROJETO ORIGINAL DO CARRINHO/);
  assert.match(await page.locator('.credits-person-developer').textContent(),/DESENVOLVIMENTO DO SITE/);
  const links=await page.locator('#creditsDialog a').evaluateAll(els=>els.map(el=>({
   href:el.href,target:el.target,rel:el.rel,label:el.textContent.trim()
  })));
  assert.equal(links.length,2,'dois links de autoria');
  assert.equal(links[0].href,'https://gabrieljsantos.github.io/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/conteudos/08-carrinho-wifi-esp32-pet-v1.html');
  assert.equal(links[1].href,'https://www.instagram.com/sergioricz?vrfl=MXV4bTVud2k0MG5kNw==');
  for(const link of links){
   assert.equal(link.target,'_blank','links em nova aba');
   assert(link.rel.includes('noopener')&&link.rel.includes('noreferrer'),'sem acesso indevido à aba');
  }
  const modalLayout=await dialog.evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,
    scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
  });
  assert(modalLayout.left>=-1&&modalLayout.right<=width+1,'Modal cabe na tela '+width);
  assert(modalLayout.scrollWidth<=modalLayout.clientWidth+2,'Modal não corta texto '+width);
  await page.locator('#creditsClose').click();
  assert.equal(await dialog.evaluate(e=>e.open),false,'X fecha a janela '+width);
  await page.locator('#openCredits').click();
  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate(e=>e.open),false,'Escape fecha a janela '+width);
  await page.locator('#openCredits').click();
  await page.locator('#creditsDone').click();
  assert.equal(await dialog.evaluate(e=>e.open),false,'Fechar funciona '+width);
  // A função original de Gabarito precisa seguir funcional, independente dos créditos.
  await page.locator('#openGate').click();
  assert.equal(await page.locator('#gateDialog').evaluate(e=>e.open),true,'Gabarito continua abrindo '+width);
  await page.locator('#gateClose').click();
  assert.deepEqual(errors,[],'sem erros JavaScript '+width+': '+errors.join('; '));
  await page.close();
  console.log('OK Créditos '+width+'px: menu, autores, links, modal e Gabarito');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
