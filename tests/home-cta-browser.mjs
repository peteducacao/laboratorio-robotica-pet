import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.avif':'image/avif','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
  let path;
  try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(path===root)path=resolve(root,'index.html');}
  catch{return res.writeHead(400).end()}
  if(!path.startsWith(root+'/'))return res.writeHead(403).end();
  try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(path))}
  catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,691,1366]){
   const mobile=width<900;
   const context=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#enterProjects')?.getBoundingClientRect().width>0);
   const metrics=await page.evaluate(()=>{
     const btn=document.getElementById('enterProjects');
     const rect=btn.getBoundingClientRect(),scene=document.querySelector('.welcome').getBoundingClientRect();
     return {
       left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,
       width:scene.width,height:scene.height,energy: getComputedStyle(btn.querySelector('.cta-energy')).display,
       glow:getComputedStyle(btn).animationName,
       href:btn.getAttribute('href')
     };
   });
   assert.ok(metrics.left>=-1&&metrics.right<=width+1,'Botão visível na largura '+width+': '+JSON.stringify(metrics));
   assert.ok(metrics.top>=0&&metrics.bottom<=metrics.height+1,'Botão dentro da tela '+width);
   assert.equal(metrics.energy,mobile?'none':'block','Traços ausentes no mobile e preservados no desktop');
   assert.ok(metrics.glow.includes('buttonGlow'),'Brilho externo preservado');
   assert.equal(metrics.href.startsWith('projects.html'),true,'CTA continua levando à biblioteca');
   // Em janela de aplicativo, também esconde o traço mesmo em PC.
   if(!mobile){
     const cdp=await context.newCDPSession(page);
     await cdp.send('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'display-mode',value:'standalone'}]});
     assert.equal(await page.locator('.cta-energy').evaluate(el=>getComputedStyle(el).display),'none','Aplicativo desktop sem traço deslocado');
   }
   await page.locator('#enterProjects').click();
   await page.waitForURL(/projects\.html/);
   assert.equal(await page.locator('#projectsGrid').count(),1,'Navegação da chamada principal mantida');
   assert.deepEqual(errors,[],'Sem erro Javascript em '+width+'px');
   console.log('OK início '+width+'px: botão correto, animação segura e navegação');
   await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
