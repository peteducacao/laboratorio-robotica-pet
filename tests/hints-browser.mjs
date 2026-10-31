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
   // No teste, o sorteio sempre libera a dica no segundo erro, nunca no primeiro.
   Math.random=()=>0;
   const mk=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false});
   const project={id:'hint-test',name:'Teste das dicas',createdAt:1,updatedAt:1,
    circuit:{
     parts:[mk('b1','battery',25,70),mk('lm','buck',270,125),mk('esp','esp',600,180)],
     wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#ed654d'
    }};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[project]}));
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
  assert.equal(await page.locator('#hintBtn').isVisible(),false,'nenhum erro, botão oculto '+width);
  async function connect(a,b){
   await page.evaluate(([from,to])=>{
    const tap=id=>{
     const node=document.querySelector('[data-port="'+id+'"]');
     if(!node)throw Error('Pino não encontrado: '+id);
     node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    };
    tap(from);tap(to);
   },[a,b]);
  }
  await connect('b1.NEG','lm.OUTP'); // primeira ligação errada
  assert.equal(await page.locator('#hintBtn').isVisible(),false,'não oferecer dica no primeiro erro '+width);
  await connect('b1.NEG','lm.OUTP'); // remover tentativa anterior
  assert.equal(await page.locator('#hintBtn').isVisible(),false,'remover fio não é erro novo '+width);
  await connect('b1.NEG','lm.OUTP'); // segunda tentativa errada
  await page.locator('#hintBtn').waitFor({state:'visible',timeout:5000});
  await page.locator('#hintBtn').click();
  await page.locator('#wireHintDialog[open]').waitFor({state:'visible'});
  assert.match(await page.locator('#wireHintWhat').textContent(),/Bateria 9 V.*Regulador LM2596.*OUT\+/,'texto descreve a ligação real '+width);
  assert.match(await page.locator('#wireHintCorrect').textContent(),/Bateria 9 V.*Regulador LM2596.*IN/,'texto mostra borne correto '+width);
  assert.doesNotMatch(await page.locator('#wireHintCorrect').textContent(),/ESP32/,'não misturar dica de outro componente '+width);
  await page.locator('#wireHintClose').click();
  await connect('b1.NEG','lm.OUTP'); // remover fio incorreto
  await connect('b1.NEG','lm.INN'); // corrigir
  assert.equal(await page.locator('#hintBtn').isVisible(),false,'dica some após corrigir '+width);
  assert.equal(errors.length,0,'sem erros JS '+width+': '+errors.join('; '));
  await page.close();
 }
 console.log('OK: primeiro erro sem dica, sorteio no segundo erro e correção clara no desktop e celular.');
}finally{if(browser)await browser.close();server.close();}
