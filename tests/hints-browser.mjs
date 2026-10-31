import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let local;try{local=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
 catch{return res.writeHead(400).end();}
 const file=resolve(root,'.'+local);
 if(!(file===root||file.startsWith(root+'/')))return res.writeHead(403).end();
 try{const bytes=readFileSync(file);res.writeHead(200,{'Content-Type':(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8'}).end(bytes)}
 catch{res.writeHead(404).end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/editor.html?project=hint-test';
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  const mobile=width===390;
  const page=await browser.newPage({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{
   const mk=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false});
   const fixed=sessionStorage.getItem('hint-test-correct')==='yes';
   const wires=[{a:'lm.OUTP',b:fixed?'esp.VIN':'esp.GND',color:'#ed654d',via:[],manual:false}];
   const project={id:'hint-test',name:'Teste das dicas',createdAt:1,updatedAt:1,
    circuit:{parts:[mk('lm','buck',100,100),mk('esp','esp',450,100)],wires,voltage:4,switches:{s1:false,s2:false},wireColor:'#ed654d'}};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#hintBtn').waitFor({state:'visible',timeout:20000});
  await page.locator('#hintBtn').click();
  await page.locator('#wireHintDialog[open]').waitFor({state:'visible'});
  assert.match(await page.locator('#wireHintText').textContent(),/OUT\+.*VIN/,'LM2596 recebe dica específica '+width);
  assert.doesNotMatch(await page.locator('#wireHintText').textContent(),/MOTOR A/,'dica não mistura motor '+width);
  await page.locator('#wireHintClose').click();
  await page.evaluate(()=>sessionStorage.setItem('hint-test-correct','yes'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
  const hintState=await page.locator('#hintBtn').evaluate(el=>({
   hidden:el.hidden,display:getComputedStyle(el).display,
   body:document.body.className,
   wires:JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].circuit.wires,
   scripts:[...document.scripts].map(s=>s.src).filter(s=>s.includes('hint'))
  }));
  console.log('HINT DEBUG',width,JSON.stringify(hintState));
  assert.equal(await page.locator('#hintBtn').isVisible(),false,'sem erro, dica oculta '+width+': '+JSON.stringify(hintState));
  assert.equal(errors.length,0,'sem erros JS '+width+': '+errors.join('; '));
  await page.close();
 }
 console.log('OK: dicas aparecem apenas para fio incorreto; desktop e celular.');
}finally{if(browser)await browser.close();server.close();}
