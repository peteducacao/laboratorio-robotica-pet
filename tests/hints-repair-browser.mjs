import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={esp:'esp',drv:'driver',lm:'buck',b1:'battery',b2:'batteryPack',
 s1:'switch',s2:'switch',ml:'motor',mr:'motor'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname))}
 catch{return res.writeHead(400).end();}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':({
  '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'
 })[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/editor.html?project=hint-cases';
const cases=[
 {name:'Bateria negativa no OUT+',parts:['b1','lm','esp'],bad:['b1.NEG','lm.OUTP'],from:/LM2596.*OUT/,to:/LM2596.*IN/},
 {name:'Ponte H IN3 ligada no LM',parts:['drv','lm','esp'],bad:['drv.IN3','lm.OUTP'],from:/LM2596.*OUT/,to:/ESP32.*D32/},
 {name:'ESP32 GPIO19 não programado',parts:['esp','drv'],bad:['esp.D19','drv.IN4'],from:/ESP32.*D19/,to:/ESP32.*D18/},
 {name:'Motor no IN1',parts:['ml','drv'],bad:['ml.A','drv.IN1'],from:/Ponte H.*IN1/,to:/Ponte H.*(?:A|B).*[-•]?\s*[12]/},
 {name:'Gangorra 2 como chave do LM',parts:['b1','lm','s2'],bad:['b1.POS','s2.LEDG'],from:/gangorra.*LED/i,to:/gangorra.*Contato [12]/i},
 {name:'Gangorra usada corretamente não pode receber ligação duplicada',parts:['b1','lm','s2'],good:[['b1.POS','s2.IN'],['s2.OUT','lm.INP']],bad:['b1.POS','s2.LEDG'],fallback:true},
 {name:'Motores em canais trocados',parts:['ml','mr','drv'],good:[['ml.A','drv.OUT3'],['ml.B','drv.OUT4']],bad:['mr.A','drv.IN3'],from:/Ponte H.*IN3/,to:/Ponte H.*(?:A|B).*[-•]?\s*[12]/},
 {name:'GPIO32 já ocupado corretamente',parts:['esp','drv'],good:[['esp.D32','drv.IN2']],bad:['esp.D19','drv.IN3'],from:/ESP32.*D19/,to:/ESP32.*D(?:18|26|27)/,not:/D32/},
 {name:'Motor já ligado não precisa de outro fio',parts:['ml','drv','esp'],good:[['ml.A','drv.OUT1'],['ml.B','drv.OUT2']],bad:['ml.A','drv.IN3'],fallback:true}
];
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  for(const item of cases){
   const page=await browser.newPage({
    viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390
   });
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   const fixture={
    parts:item.parts.map((id,i)=>({id,kind:types[id],x:60+i*260,y:120+(i%2)*330,rotation:0,flipped:false})),
    wires:(item.good||[]).map(([a,b])=>({a,b,color:'#ed654d',via:[],manual:false})),
    voltage:5,switches:{s1:false,s2:false},wireColor:'#ed654d'
   };
   await page.addInitScript(fixture=>{
    Math.random=()=>0;
    localStorage.setItem('tinkerpet-library-v1',JSON.stringify({
     version:1,projects:[{id:'hint-cases',name:'Casos',createdAt:1,updatedAt:1,circuit:fixture}]
    }));
   },fixture);
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
   async function connect(){
    await page.evaluate(([a,b])=>{
     for(const id of [a,b]){
      const el=document.querySelector('[data-port="'+id+'"]');
      if(!el)throw Error('Terminal indisponível '+id);
      el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
     }
    },item.bad);
   }
   await connect();
   assert.equal(await page.locator('#hintBtn').isVisible(),false,item.name+' libera cedo no '+width);
   await connect(); // clicar no mesmo par remove sem contar
   await connect(); // segundo erro
   await page.locator('#hintBtn').waitFor({state:'visible',timeout:7000});
   await page.locator('#hintBtn').click();
   await page.locator('#wireHintDialog[open]').waitFor({state:'visible'});
   const source=await page.locator('#wireHintWhat').textContent();
   const target=await page.locator('#wireHintCorrect').textContent();
   if(item.fallback){
    assert.match(target,/gabarito/i,item.name+' deveria usar gabarito, não inventar pino no '+width);
   }else{
    assert.match(source,item.from,item.name+' ponta incorreta: '+source);
    assert.match(target,item.to,item.name+' alvo: '+target);
    if(item.not)assert.doesNotMatch(target,item.not,item.name+' não ocupa pino em uso');
    assert.equal(await page.locator('#wireHintKeep').isVisible(),true,
     item.name+' deve informar ponta mantida');
   }
   assert.deepEqual(errors,[],item.name+' JavaScript '+width+': '+errors.join(','));
   await page.close();
   console.log('PASS',width,item.name,'=>',source,'→',target);
  }
 }
 console.log('OK: nove tipos de correção verificadas em PC e celular.');
}finally{
 if(browser)await browser.close();
 server.close();
}
