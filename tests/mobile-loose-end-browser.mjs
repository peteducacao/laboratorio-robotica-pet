import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let filepath;
 try{filepath=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end()}
 if(!(filepath===root||filepath.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(filepath)]||'application/octet-stream'}).end(readFileSync(filepath))}
 catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(()=>{
  const p=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false});
  const project={id:'loose-touch-test',name:'Ponta solta por toque',
   createdAt:1,updatedAt:2,circuit:{
    parts:[p('b1','battery',100,120),p('s1','switch',470,110)],
    wires:[{a:'b1.POS',b:'b1.POS',manual:true,via:[],color:'#df1724',
      loose:{end:'b',point:{x:325,y:225}}}],
    voltage:5,switches:{s1:false},wireColor:'#df1724'
   }};
  localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
 });
 const url='http://127.0.0.1:'+server.address().port+'/editor.html?project=loose-touch-test';
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#wireSvg .wire-line').first().waitFor({timeout:20000});
 // Clique no fio para mostrar suas extremidades; isto não faz parte do gesto testado.
 await page.evaluate(()=>{
  document.querySelector('#wireSvg .wire-target[data-wire-index="0"]')
   .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))
 });
 const handle=page.locator('#wireHandles .wire-end-handle[data-wire-end="b"]');
 await handle.waitFor({state:'visible',timeout:10000});
 const box=await handle.boundingBox();
 assert(box,'Ponta livre visível no celular');
 const x=box.x+box.width/2,y=box.y+box.height/2;
 const hit=await page.evaluate(({x,y})=>
  !!document.elementFromPoint(x,y)?.closest('.wire-end-handle'),{x,y});
 assert(hit,'A ponta solta deve receber o toque, não um elemento sobreposto');
 // Primeiro toque curto ativa a edição; antes ele cancelava imediatamente.
 await page.touchscreen.tap(x,y);
 await page.waitForTimeout(90);
 assert(await page.locator('#wireSvg .wire-reconnect-preview').count()>0,
  'Toque curto na ponta solta não ativou a continuação do fio');
 const hitAgain=await page.evaluate(({x,y})=>
  !!document.elementFromPoint(x,y)?.closest('.wire-end-handle'),{x,y});
 assert(hitAgain,'A ponta deve permanecer tocável depois de selecionada');
 // Segundo gesto: deslizar a ponta livre para formar um cotovelo.
 const cdp=await context.newCDPSession(page);
 const press=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,
  touchPoints:points.map(p=>({x:p.x,y:p.y,id:41,force:1}))});
 await press('touchStart',[{x,y}]);
 for(let n=1;n<=8;n++){
  const nx=x+Math.round(54*n/8),ny=y+Math.round(65*n/8);
  await press('touchMove',[{x:nx,y:ny}]);
  await page.waitForTimeout(18);
 }
 await press('touchEnd',[]);
 await page.waitForTimeout(200);
 const changed=await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0];
  const w=p.circuit.wires[0];
  return {loose:w.loose,via:w.via,wireCount:p.circuit.wires.length,
   stillSelected:document.querySelector('#wireHandles .wire-end-handle[data-wire-end="b"]')!==null};
 });
 assert(changed.loose?.end==='b','A ponta precisa continuar solta após a curva');
 assert(changed.loose.point.x>337&&changed.loose.point.y>235,
  'Ponta não seguiu a segunda passada do dedo: '+JSON.stringify(changed));
 assert(changed.via.length>=1,'A curva deve formar ao menos um cotovelo ortogonal');
 assert.equal(changed.wireCount,1,'Não duplicar o jumper ao curvar a ponta');
 // Reproduz a falha real: parar, pegar a ponta quadrada DE NOVO e
 // fazer várias viradas horizontais/verticais com o dedo no Android.
 const box2=await handle.boundingBox();
 assert(box2,'O quadrado da ponta deve permanecer disponível após a primeira soltura');
 const x2=box2.x+box2.width/2,y2=box2.y+box2.height/2;
 const touchSteps=async(path,id)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',
   touchPoints:[{x:path[0][0],y:path[0][1],id,force:1}]});
  for(let i=1;i<path.length;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
    touchPoints:[{x:path[i][0],y:path[i][1],id,force:1}]});
   await page.waitForTimeout(35);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 const path=[
  [x2,y2],[x2+17,y2],[x2+38,y2],[x2+58,y2],
  [x2+58,y2-20],[x2+58,y2-43],[x2+58,y2-70],
  [x2+76,y2-70],[x2+99,y2-70],
  [x2+99,y2-47],[x2+99,y2-22]
 ];
 const vp=await page.locator('#viewport').boundingBox();
 assert(vp,'Bancada precisa existir');
 assert(path.every(([px,py])=>px>vp.x+8&&px<vp.x+vp.width-8&&py>vp.y+8&&py<vp.y+vp.height-8),
  'O teste tem de criar as curvas dentro da bancada: '+JSON.stringify({x2,y2,vp}));
 await touchSteps(path,92);
 await page.waitForTimeout(150);
 const changedTwice=await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0];
  return {wire:p.circuit.wires[0],count:p.circuit.wires.length,
   path:document.querySelector('#wireSvg .wire-line')?.getAttribute('d')||''};
 });
 console.log('DEBUG retomada fio:',JSON.stringify({x2,y2,path,changedTwice}));
 assert.equal(changedTwice.count,1,'Repetir a edição nunca duplica o fio');
 assert.equal(changedTwice.wire.loose?.end,'b','A ponta permanece solta após fazer mais curvas');
 assert(changedTwice.wire.via.length>=3,
  'A retomada precisa guardar várias curvas do dedo: '+JSON.stringify(changedTwice));
 assert(changedTwice.wire.loose.point.x>changed.loose.point.x+50,
  'O quadrado não acompanhou o segundo gesto: '+JSON.stringify(changedTwice));
 const stateBeforeReload=JSON.stringify(changedTwice.wire);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#wireSvg .wire-line').first().waitFor({timeout:15000});
 const stateAfterReload=await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0];
  return p.circuit.wires[0];
 });
 assert.equal(JSON.stringify(stateAfterReload),stateBeforeReload,
  'As curvas refeitas devem continuar salvas após atualizar a página');
 console.log('PASS Android: segunda retomada registra várias curvas, sem duplicar fio, e persiste após F5');
 assert(changed.stillSelected,'Ponta continua selecionável para conectar ao pino');
 assert.deepEqual(errors,[],'Erros Javascript: '+errors.join('; '));
 console.log('PASS Android touch: ponta livre ativada por toque, acompanha arraste, salva a curva sem duplicar o fio');
 await context.close();
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
