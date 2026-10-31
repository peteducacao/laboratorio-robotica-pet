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
 catch{return res.writeHead(400).end('Bad request')}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [360,390,768,1366]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('tinkerpet-nickname-v1','Teste'));
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  const link=page.locator('#openHow');
  await link.waitFor({state:'visible'});
  assert.equal(await link.getAttribute('href'),'como-funciona.html','link Como funciona');
  const pos=await page.evaluate(()=>{
   const rect=id=>document.getElementById(id).getBoundingClientRect();
   return {credits:rect('openCredits'),how:rect('openHow'),width:document.documentElement.scrollWidth};
  });
  assert(pos.how.top>=pos.credits.bottom-1,'Como funciona abaixo de Créditos '+width);
  assert(pos.width<=width+2,'menu sem overflow '+width);
  await link.click();
  await page.waitForURL('**/como-funciona.html');
  assert.equal(await page.locator('.how-intro h1').textContent(),'Como funciona');
  assert.equal(await page.locator('.how-intro p').textContent(),'Explore as peças utilizadas no carrinho.');
  const cards=page.locator('.component-card');
  assert.equal(await cards.count(),8,'todos os oito componentes presentes '+width);
  const measures=await page.evaluate(()=>{
   const card=document.querySelector('.component-card');
   const figure=card.querySelector('.component-figure');
   const grid=document.getElementById('componentsGrid');
   return {cardHeight:card.getBoundingClientRect().height,
    figureHeight:figure.getBoundingClientRect().height,
    gap:parseFloat(getComputedStyle(grid).columnGap),
    scrollWidth:document.documentElement.scrollWidth};
  });
  assert(measures.cardHeight<=190,'cartão compacto '+width+': '+JSON.stringify(measures));
  assert(measures.figureHeight<=120,'imagem compacta '+width);
  assert(measures.gap<=13,'espaçamento compacto '+width);
  assert(measures.scrollWidth<=width+2,'sem barra horizontal '+width);
  assert.equal(await page.locator('#componentPanel').isVisible(),false,'sem painel até selecionar '+width);
  const images=await cards.locator('img').evaluateAll(elements=>Promise.all(elements.map(img=>img.complete ? {src:img.getAttribute('src'),width:img.naturalWidth}:new Promise(resolve=>{img.onload=()=>resolve({src:img.src,width:img.naturalWidth});img.onerror=()=>resolve({src:img.src,width:0});}))));
  assert(images.every(image=>image.width>0),'nenhuma imagem quebrada '+width+': '+JSON.stringify(images));
  const cardInfo=[['esp','ESP32'],['lm','LM2596'],['drv','Ponte H MX1508'],['s1','Chave gangorra'],['ml','Motor DC'],['b1','Bateria 9 V'],['b2','Pilhas AA'],['jumper','Fios jumper']];
  for(const [id,name] of cardInfo){
   const card=page.locator('[data-part="'+id+'"]');
   await card.click();
   assert.equal(await page.locator('#componentPanel').isVisible(),true,'painel visível '+name+' '+width);
   if(id==='esp'){
    await page.waitForTimeout(650);
    const scroll=await page.evaluate(()=>{
     const header=document.querySelector('.how-top').getBoundingClientRect();
     const box=document.getElementById('componentPanel').getBoundingClientRect();
     return {
      scrollY:window.scrollY,
      maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),
      top:box.top,header:header.height,viewport:innerHeight
     };
    });
    assert(scroll.top<scroll.viewport-90,'clicar rola para tornar a explicação visível '+width+': '+JSON.stringify(scroll));
    if(scroll.maxScroll>10)
     assert(scroll.scrollY>2,'clicar move página automaticamente quando cabe rolar '+width+': '+JSON.stringify(scroll));
    if(width>810){
     const frame=await page.evaluate(()=>{
      const rect=selector=>document.querySelector(selector).getBoundingClientRect();
      return {card:rect('[data-part="esp"]'),panel:rect('#componentPanel'),
       header:rect('.how-top')};
     });
     assert(frame.card.top>=frame.header.bottom-5,'mostrar a figura acima da explicação no computador '+width);
     assert(frame.card.bottom<=frame.panel.top+5,'o cartão deve aparecer inteiro antes do painel '+width);
     assert(frame.panel.top<scroll.viewport-90,'texto do painel deve aparecer também '+width);
    }
   }
   assert.equal(await card.getAttribute('aria-expanded'),'true','cartão selecionado '+name);
   assert.equal(await page.locator('#componentName').textContent(),name);
   assert.equal(await page.locator('#componentWhat').evaluate(x=>x.open),false,'pergunta começa recolhida '+name);
   assert.equal(await page.locator('#componentHow').evaluate(x=>x.open),false,'funcionamento começa recolhido '+name);
   assert.equal(await page.locator('#componentWhatText').textContent().then(x=>x.length>50),true,'definição '+name);
   assert.equal(await page.locator('#componentHowText').textContent().then(x=>x.length>50),true,'funcionamento '+name);
   assert.equal(await page.locator('.component-in-our-car h3').textContent(),'No nosso carrinho','destaque prático '+name);
   assert.equal(await page.locator('#componentInCarText').isVisible(),true,'exemplo do carrinho sempre visível '+name);
   assert.equal(await page.locator('#componentInCarText').textContent().then(x=>x.length>35),true,'exemplo prático sem gabarito '+name);
   await page.locator('#componentWhat summary').click();
   assert.equal(await page.locator('#componentWhat').evaluate(x=>x.open),true,'abre O que é? '+name);
   await page.locator('#componentHow summary').click();
   assert.equal(await page.locator('#componentHow').evaluate(x=>x.open),true,'abre Como funciona? '+name);
   const panelText=await page.locator('#componentPanel').textContent();
   assert(!/(?:IN1|IN2|IN3|IN4|OUT\+|GPIO ?(?:18|26|27|32)|ligue o fio)/i.test(panelText),'não mostrar gabarito no painel '+name);
  }
  const last=page.locator('[data-part="jumper"]');
  await last.click();
  assert.equal(await page.locator('#componentPanel').isVisible(),false,'repetir clique recolhe a explicação '+width);
  await page.locator('[data-part="esp"]').click();
  // O painel abre diretamente depois da última peça da linha selecionada.
  const located=await page.evaluate(()=>{
   const grid=document.getElementById('componentsGrid');
   const cols=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
   const buttons=[...document.querySelectorAll('.component-card')];
   const panel=document.getElementById('componentPanel');
   return {cols,prev:panel.previousElementSibling.dataset.part,expected:buttons[cols-1].dataset.part};
  });
  assert.equal(located.prev,located.expected,'explicação abaixo da linha selecionada '+width);
  await page.locator('#componentClose').click();
  assert.equal(await page.locator('#componentPanel').isVisible(),false,'X fecha painel '+width);
  await page.locator('#openCredits').click();
  await page.waitForURL('**/projects.html#creditos');
  assert.equal(await page.locator('#creditsDialog').evaluate(el=>el.open),true,'Créditos continuam acessíveis '+width);
  await page.locator('#creditsClose').click();
  await page.goto(origin+'/como-funciona.html',{waitUntil:'domcontentloaded'});
  await page.locator('#openGate').click();
  await page.waitForURL('**/projects.html#abrir-gabarito');
  assert.equal(await page.locator('#gateDialog').evaluate(el=>el.open),true,'Gabarito segue protegido por senha '+width);
  assert.deepEqual(errors,[],'sem erros Javascript '+width+': '+errors.join('; '));
  await page.close();
  console.log('OK Como funciona '+width+'px: 8 componentes, imagens, explicações, menu, créditos e proteção do Gabarito');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
