import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.avif':'image/avif','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 let path;
 try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
   if(path===root)path=resolve(root,'index.html');}
 catch{return res.writeHead(400).end();}
 if(!path.startsWith(root+'/'))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(path));}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const credit='© 2026 TinkerPET Studio · Desenvolvido por Sérgio R. Santos';
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [360,390,768,1366]){
  const mobile=width<=390, height=mobile?800:900;
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{
   localStorage.setItem('tinkerpet-nickname-v1','PET Teste');
   localStorage.setItem('tinkerpet-credit-test','preservado');
  });
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  const opening=await page.evaluate(()=>{
    const footer=document.querySelector('.site-credit-home'),button=document.querySelector('#enterProjects');
    const a=footer.getBoundingClientRect(),b=button.getBoundingClientRect();
    return {text:footer.textContent.trim(),x:a.x,y:a.y,w:a.width,h:a.height,
      buttonBottom:b.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,
      scrollWidth:document.documentElement.scrollWidth,
      fontSize:getComputedStyle(footer).fontSize,display:getComputedStyle(footer).display};
  });
  assert.equal(opening.text,credit,'Autoria na abertura '+width);
  assert.ok(opening.y>=0&&opening.y+opening.h<=height+1,'Rodapé visível sem rolagem na abertura '+width);
  assert.ok(opening.y>opening.buttonBottom+8,'Rodapé não cobre botão na abertura '+width);
  assert.ok(opening.scrollWidth<=width+2,'Abertura sem rolagem horizontal '+width);
  assert.equal(opening.fontSize,'10px','Fonte pequena na abertura '+width);
  await page.goto(origin+'/projects.html',{waitUntil:'domcontentloaded'});
  await page.locator('.create-card').first().waitFor({timeout:12000});
  const library=await page.evaluate(()=>{
    const footer=document.querySelector('.site-credit-projects'),
      board=document.querySelector('#projectsGrid'),main=document.querySelector('main.main');
    const r=footer.getBoundingClientRect(),b=board.getBoundingClientRect(),m=main.getBoundingClientRect();
    return {text:footer.textContent.trim(),y:r.top,bottom:r.bottom,x:r.x,width:r.width,
      boardBottom:b.bottom,mainBottom:m.bottom,scrollWidth:document.documentElement.scrollWidth,
      fontSize:getComputedStyle(footer).fontSize};
  });
  assert.equal(library.text,credit,'Autoria na biblioteca '+width);
  assert.ok(library.y>=library.boardBottom+20,'Rodapé fica após os cartões '+width+': '+JSON.stringify(library));
  assert.ok(library.bottom<=library.mainBottom+1,'Rodapé permanece na área de conteúdo '+width);
  assert.ok(library.scrollWidth<=width+2,'Biblioteca sem rolagem horizontal '+width);
  assert.equal(library.fontSize,'10px','Fonte pequena na biblioteca '+width);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tinkerpet-credit-test')),'preservado','Dados locais preservados '+width);
  assert.deepEqual(errors,[],'Sem erros JavaScript '+width+': '+errors.join('; '));
  console.log('OK rodapé em '+width+'px: duas páginas, sem sobreposição ou perda de dados');
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
