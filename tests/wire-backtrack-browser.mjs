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
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   const part=(id,kind,x,y,rotation=0)=>({id,kind,x,y,rotation,flipped:false});
   const circuit={
    parts:[part('b1','battery',100,150,90),part('s1','switch',700,83)],
    wires:[{a:'b1.POS',b:'s1.IN',manual:true,color:'#df1724',via:[{x:340,y:231},{x:610,y:231}]}],
    voltage:5,switches:{s1:false,s2:false},wireColor:'#df1724'
   };
   const project={id:'backtrack-test',name:'Testar fio ao mover',circuit,createdAt:1,updatedAt:2};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.goto(origin+'/editor.html?project=backtrack-test',{waitUntil:'domcontentloaded'});
  await page.locator('#wireSvg .wire-line').first().waitFor({state:'attached',timeout:20000});
  const state=()=>page.evaluate(()=>{
   const project=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0];
   const svg=document.querySelector('#wireSvg .wire-line');
   const d=svg?.getAttribute('d')||'';
   const nums=(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
   const points=[];for(let i=0;i<nums.length;i+=2)points.push({x:nums[i],y:nums[i+1]});
   return {d,points,project,indicator:document.getElementById('savedIndicator').hidden};
  });
  let loaded=await state();
  assert.equal(loaded.points.length,2,'Rota originalmente reta deve ser exibida sem cotovelos '+width+': '+loaded.d);
  assert.equal(loaded.indicator,true,'Abrir sem aviso Salvo '+width);
  const oldDate=loaded.project.updatedAt;
  // Mover o interruptor à esquerda sem alterar a ponta presa na bateria.
  // A versão anterior deslocava os cotovelos à esquerda da bateria,
  // desenhando a linha vermelha atravessando o componente até o lado oposto.
  const sw=page.locator('#partsLayer [data-part="s1"]').first();
  await sw.waitFor({state:'visible'});
  const box=await sw.boundingBox();
  assert(box,'Interruptor acessível '+width);
  const cx=box.x+box.width*.50,cy=box.y+box.height*.43;
  const dx=width===390?-65:-130;
  if(width===390){
   await page.evaluate(({cx,cy,dx})=>{
    const el=document.querySelector('#partsLayer [data-part="s1"]');
    const ev=(type,x,y)=>new PointerEvent(type,{
     bubbles:true,cancelable:true,pointerId:71,pointerType:'touch',isPrimary:true,
     button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y
    });
    el.dispatchEvent(ev('pointerdown',cx,cy));
    window.dispatchEvent(ev('pointermove',cx+dx,cy));
    window.dispatchEvent(ev('pointerup',cx+dx,cy));
   },{cx,cy,dx});
  }else{
   await page.mouse.move(cx,cy);
   await page.mouse.down();
   await page.mouse.move(cx+dx,cy,{steps:8});
   await page.mouse.up();
  }
  await page.waitForTimeout(180);
  let moved=await state();
  if(moved.project.updatedAt===oldDate){
   // O gesto touch em emulador pode ser capturado pelo rastreador de
   // movimento; quando isso ocorrer, a versão visual deve ao menos
   // eliminar os pontos colineares do fio já carregado.
   assert.equal(moved.points.length,2,'Renderização sem prolongamento '+width);
  }else{
   assert.equal(moved.points.length,2,'Mover componente não cria cauda '+width+': '+moved.d);
   const start=moved.points[0],end=moved.points.at(-1);
   assert(start.x<end.x,'Primeiro borne segue à esquerda do segundo '+width);
   assert.equal(moved.project.circuit.wires[0].via.length,0,'Remover curvas excedentes do circuito ao mover '+width);
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#wireSvg .wire-line').first().waitFor({state:'attached',timeout:20000});
  const reloaded=await state();
  assert.equal(reloaded.points.length,2,'Rota continua limpa após F5 '+width);
  assert.equal(reloaded.indicator,true,'F5 sem Salvo + '+width);
  assert.deepEqual(errors,[],'Nenhum erro JS '+width+': '+errors.join('; '));
  console.log('OK '+width+'px: fio bateria-gangorra sem ponta falsa antes/depois do arrasto e F5');
  await page.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
