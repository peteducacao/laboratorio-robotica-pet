import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end();}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{return res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [1024,1366]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const project={id:'rotate-symbol-test',name:'Teste visual de rotação',createdAt:1,updatedAt:1,
    circuit:{parts:[{id:'b1',kind:'battery',x:260,y:350,rotation:0,flipped:false}],
     wires:[],voltage:5,switches:{s1:false,s2:false},wireColor:'#df1724'}};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.goto(origin+'/editor.html?project=rotate-symbol-test',{waitUntil:'domcontentloaded'});
  await page.locator('[data-part="b1"] .part-image').waitFor({state:'visible',timeout:20000});
  const icon=await page.locator('#rotateBtn svg').evaluate(el=>{
   const rect=el.getBoundingClientRect(),button=el.closest('button').getBoundingClientRect();
   return {
    paths:[...el.querySelectorAll('path')].map(p=>p.getAttribute('d')),
    w:rect.width,h:rect.height, x:rect.left+rect.width/2,
    y:rect.top+rect.height/2,bx:button.left+button.width/2,
    by:button.top+button.height/2
   };
  });
  assert.equal(icon.paths.length,1,'ícone de rotação preenchido, sem caminhos soltos '+width);
  assert.equal(icon.paths[0],'M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.93 9h-2.02A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z','seta circular estável '+width);
  assert(icon.w>=17&&icon.w<=23&&icon.h>=17&&icon.h<=23,'ícone com tamanho uniforme '+width);
  assert(Math.abs(icon.x-icon.bx)<=2&&Math.abs(icon.y-icon.by)<=2,
   'ícone centralizado '+width+': '+JSON.stringify(icon));
  // O botão permanece clicável para orientar a seleção mesmo com a bancada sem foco.
  await page.locator('#partsLayer [data-part="b1"] .part-image').evaluate(el=>{
   const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
   el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,button:0,buttons:1,pointerId:19,
    pointerType:'mouse',clientX:x,clientY:y
   }));
   window.dispatchEvent(new PointerEvent('pointerup',{
    bubbles:true,cancelable:true,button:0,buttons:0,pointerId:19,
    pointerType:'mouse',clientX:x,clientY:y
   }));
  });
  assert.equal(await page.locator('#rotateBtn').isDisabled(),false,'botão funciona após seleção '+width);
  await page.locator('#rotateBtn').click();
  await page.waitForFunction(()=>{
   const p=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].circuit.parts[0];
   return p.rotation===90;
  });
  assert.equal(await page.locator('#partsLayer [data-part="b1"]').getAttribute('data-rotation'),'90',
   'botão continua girando a peça em 90 graus '+width);
  assert.deepEqual(errors,[],'sem erro JS '+width+': '+errors.join('; '));
  await page.close();
  console.log('OK ícone de rotação '+width+'px: traçado, centralização, comando 90°');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
