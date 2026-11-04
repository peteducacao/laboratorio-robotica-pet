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
 assert(changed.stillSelected,'Ponta continua selecionável para conectar ao pino');
 assert.deepEqual(errors,[],'Erros Javascript: '+errors.join('; '));
 console.log('PASS Android touch: ponta livre ativada por toque, acompanha arraste, salva a curva sem duplicar o fio');
 await context.close();
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
