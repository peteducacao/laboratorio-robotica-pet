import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let file;try{file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end()}
 if(!(file===root||file.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file))}
 catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const host='http://127.0.0.1:'+server.address().port,id='empty-progress-test';
 const parts=[['b1','battery',80,170],['s1','switch',360,170],['lm','buck',630,170],
  ['esp','esp',1000,100],['drv','driver',1640,170],['ml','motor',1060,580],
  ['mr','motor',1750,580],['s2','switch',360,550],['b2','batteryPack',630,550]]
  .map(([id,kind,x,y])=>({id,kind,x,y,rotation:0,flipped:false}));
 for(const width of [390,1366]){
  const mobile=width===390,ctx=await browser.newContext({
   viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(({id,parts})=>localStorage.setItem('tinkerpet-library-v1',JSON.stringify({
   version:1,projects:[{id,name:'Novo circuito',createdAt:1,updatedAt:2,circuit:{
    parts,wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#df1724'
   }}]
  })),{id,parts});
  await page.goto(host+'/editor.html?project='+id,{waitUntil:'domcontentloaded'});
  const status=async()=>{
   await page.locator('#validationBadge').waitFor({state:'attached'});
   await page.waitForTimeout(150);
   return await page.evaluate(()=>({
    count:document.querySelector('#connectionsCount').textContent,
    badge:document.querySelector('#validationBadge').textContent,
    wires:document.querySelector('#wiresBadge').textContent,
    drawn:document.querySelectorAll('#wireSvg .wire-line').length
   }))
  };
  const setWires=async wires=>{
   await page.evaluate(({id,wires})=>{
    const data=JSON.parse(localStorage.getItem('tinkerpet-library-v1'));
    data.projects.find(p=>p.id===id).circuit.wires=wires;
    localStorage.setItem('tinkerpet-library-v1',JSON.stringify(data));
   },{id,wires});
   await page.reload({waitUntil:'domcontentloaded'});return await status()
  };
  const blank=await status();
  assert.equal(blank.count,'0/17','sem conexões: '+width);
  assert.match(blank.badge,/Faltam 17 ligações/,'sem fios não pode indicar erro '+width);
  assert.equal(blank.wires,'0','sem fios reais '+width);
  const ghost={a:'b1.POS',b:'b1.POS',color:'#df1724',manual:true,via:[],
   loose:{end:'b',point:{x:132,y:181}}};
  const phantom=await setWires([ghost]);
  assert.equal(phantom.count,'0/17','contagem incorreta para fio invisível '+width);
  assert.match(phantom.badge,/Faltam 17 ligações/,'não penalizar fio invisível '+width);
  assert.equal(phantom.wires,'0','limpar fio fantasma ao abrir '+width);
  assert.equal(phantom.drawn,0,'sem fio no desenho '+width);
  const realLoose={...ghost,loose:{end:'b',point:{x:500,y:440}}};
  const unfinished=await setWires([realLoose]);
  assert.equal(unfinished.count,'0/17','ponta solta não é ligação correta '+width);
  assert.match(unfinished.badge,/1 fio\(s\) com ponta solta/,'ponta solta requer aviso próprio '+width);
  assert.equal(unfinished.wires,'1','preservar ponta realmente solta '+width);
  assert(unfinished.drawn>=1,'ponta solta visível '+width);
  const wrong=await setWires([{a:'b1.POS',b:'drv.IN1',color:'#df1724',manual:true,via:[]}]);
  assert.equal(wrong.count,'0/17','ligação errada não conta como acerto '+width);
  assert.match(wrong.badge,/1 ligação\(ões\) a revisar/,'erro elétrico verdadeiro permanece '+width);
  assert.equal(wrong.wires,'1','preservar ligação errada para corrigir '+width);
  assert.deepEqual(errors,[],'sem erros de navegador '+width+': '+errors.join('; '));
  console.log('PASS '+width+'px: sem fios, fio fantasma, ponta solta, conexão incorreta');
  await ctx.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
