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
 const STRONG='#df1724',OLD='#ed654d',ID='red-wire-test';
 for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(({id,old})=>{
   localStorage.setItem('tinkerpet-nickname-v1','Teste');
   const p=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false});
   const project={id,name:'Fio vermelho antigo',createdAt:1,updatedAt:1234567,
    circuit:{parts:[p('b1','battery',70,150),p('lm','buck',400,210)],
     wires:[{a:'b1.NEG',b:'lm.INN',via:[],manual:true,color:old}],
     voltage:5,switches:{s1:false,s2:false},wireColor:old}};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  },{id:ID,old:OLD});
  await page.goto(origin+'/editor.html?project='+ID,{waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#wireSvg path.wire-line')!==null);
  const getState=()=>page.evaluate(id=>{
   const project=JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects.find(p=>p.id===id);
   return {
    modified:project.updatedAt,
    storedRed:project.circuit.wires[0].color,
    indicatorVisible:!!document.getElementById('savedIndicator')?.offsetParent,
    preview:getComputedStyle(document.getElementById('wireColorPreview')).backgroundColor,
    visibleWire:document.querySelector('#wireSvg path.wire-line')?.getAttribute('stroke'),
    redOption:document.querySelector('#wireColorMenu [aria-label="Vermelho"]')?.dataset.color
   };
  },ID);
  let result=await getState();
  assert.equal(result.modified,1234567,'Abrir não altera data '+width);
  assert.equal(result.storedRed,OLD,'Abrir não regrava projeto antigo '+width);
  assert.equal(result.indicatorVisible,false,'Não mostrar Salvo ao abrir '+width);
  assert.equal(result.visibleWire,STRONG,'Fio antigo fica vermelho vivo '+width);
  assert.equal(result.preview,'rgb(223, 23, 36)','Seletor exibe vermelho vivo '+width);
  assert.equal(result.redOption,STRONG,'Paleta usa vermelho vivo '+width);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#wireSvg path.wire-line')!==null);
  result=await getState();
  assert.equal(result.modified,1234567,'F5 não altera data '+width);
  assert.equal(result.indicatorVisible,false,'F5 não mostra Salvo '+width);
  assert.equal(result.visibleWire,STRONG,'F5 mantém vermelho vivo '+width);
  assert.deepEqual(errors,[],'Sem erros JS '+width+': '+errors.join('; '));
  await page.close();
  console.log('OK '+width+'px: vermelho forte, cor antiga convertida no desenho e F5 sem aviso Salvo');
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
