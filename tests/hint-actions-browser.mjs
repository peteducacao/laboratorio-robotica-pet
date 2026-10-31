import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let path;try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname))}
 catch{return res.writeHead(400).end();}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/editor.html?project=hint-actions';
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1366]){
  const mobile=width===390;
  const page=await browser.newPage({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   Math.random=()=>0; // sorteio determinístico: ajuda após 2 erros
   const part=(id,kind,x,y)=>({id,kind,x,y,rotation:0,flipped:false});
   const valid={a:'b1.NEG',b:'lm.INN',color:'#ed654d',
    via:[{x:180,y:410},{x:330,y:410}],manual:true};
   const data={id:'hint-actions',name:'Testes de interação',createdAt:1,updatedAt:1,
    circuit:{parts:[part('b1','battery',25,75),part('lm','buck',300,160),
     part('esp','esp',730,140),part('drv','driver',530,520)],
     wires:[valid],voltage:5,switches:{s1:false,s2:false},wireColor:'#ed654d'}};
   localStorage.setItem('tinkerpet-library-v1',JSON.stringify({version:1,projects:[data]}));
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:20000});
  const visible=()=>page.locator('#hintBtn').isVisible();
  const pairs=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tinkerpet-library-v1')).projects[0].circuit.wires);
  const tap=([a,b])=>page.evaluate(([p,q])=>{
   for(const id of [p,q]){
    const el=document.querySelector('[data-port="'+id+'"]');
    if(!el)throw Error('Pino ausente: '+id);
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
   }
  },[a,b]);
  const selectWire=index=>page.evaluate(index=>{
   const path=document.querySelector('#wireSvg [data-wire-index="'+index+'"]');
   if(!path)throw Error('Fio ausente no SVG: '+index);
   path.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  },index);
  const button=id=>page.locator('#'+id).evaluate(el=>el.click());
  assert.equal(await visible(),false,'a bancada começa sem dica '+width);

  // A porta D19 existe, mas NÃO é uma das quatro saídas previstas.
  await tap(['esp.D19','drv.IN4']);
  assert.equal((await pairs()).length,2,'fio conectado no GPIO19 foi criado '+width);
  assert.equal(await page.locator('#wireSvg .wire-error').count(),1,'D19→IN4 sinalizado como inválido '+width);
  assert.equal(await visible(),false,'1º erro no GPIO19 não deve liberar dica '+width);

  // Mover uma curva de um fio já existente não altera os terminais elétricos,
  // portanto não representa uma tentativa de ligação errada.
  const before=(await pairs())[0].via.map(v=>({...v}));
  const bend=page.locator('#wireSvg .wire-bend-target[data-wire-index="0"]').first();
  await bend.waitFor({state:'attached'});
  await bend.evaluate(el=>{
   const rect=el.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
   const pointer=(type,atX,atY)=>new PointerEvent(type,{
    bubbles:true,cancelable:true,pointerId:77,pointerType:'mouse',button:0,
    clientX:atX,clientY:atY
   });
   el.dispatchEvent(pointer('pointerdown',x,y));
   window.dispatchEvent(pointer('pointermove',x+42,y+28));
   window.dispatchEvent(pointer('pointerup',x+42,y+28));
  });
  const after=(await pairs())[0].via;
  assert.notDeepEqual(after,before,'editar a curva realmente mudou o traçado '+width);
  assert.equal(await visible(),false,'mudar curva não conta como outro erro '+width);
  // Desfazer e refazer alterações de traçado também não contam.
  await button('undoBtn');
  assert.equal(await visible(),false,'desfazer curva não conta como erro '+width);
  await button('redoBtn');
  assert.equal(await visible(),false,'refazer curva não conta como erro '+width);

  // Excluir um fio inválido, desfazer e refazer a exclusão não pode
  // acrescentar novas tentativas à contagem.
  await selectWire(1);await button('deleteBtn');
  assert.equal((await pairs()).length,1,'deletar remove o jumper '+width);
  assert.equal(await visible(),false,'deletar não gera erro '+width);
  await button('undoBtn');
  assert.equal((await pairs()).length,2,'retornar restaura o fio '+width);
  assert.equal(await visible(),false,'retornar não contabiliza novo erro '+width);
  await button('redoBtn');
  assert.equal((await pairs()).length,1,'refazer volta a excluir o fio '+width);
  assert.equal(await visible(),false,'refazer não contabiliza erro '+width);

  // O D18 é válido; adicioná-lo não deve liberar a dica.
  await tap(['esp.D18','drv.IN4']);
  assert.equal(await page.locator('#wireSvg .wire-error').count(),0,'D18→IN4 é correto '+width);
  assert.equal(await visible(),false,'conexão correta não aumenta tentativas '+width);

  // Segunda tentativa errada em D19 dispara a ajuda (sorteio=2).
  await tap(['esp.D19','drv.IN3']);
  await page.locator('#hintBtn').waitFor({state:'visible',timeout:6000});
  await button('hintBtn');
  await page.locator('#wireHintDialog[open]').waitFor({state:'visible'});
  assert.match(await page.locator('#wireHintWhat').textContent(),/D19.*IN3/,'mostra GPIO19 usado '+width);
  assert.match(await page.locator('#wireHintCorrect').textContent(),/D32.*IN3/,'mostra GPIO32 correto '+width);
  await button('wireHintClose');

  // Se todos os erros sumirem, o próximo ciclo sorteia de novo.
  await selectWire(2);await button('deleteBtn');
  assert.equal(await visible(),false,'corrigir apaga a dica '+width);
  await tap(['esp.D19','drv.IN2']);
  assert.equal(await visible(),false,'novo ciclo: 1º erro escondido '+width);
  // Reconectar a ponta do mesmo fio a outra porta igualmente inválida
  // deve representar mais uma tentativa errada, sem precisar criar outro fio.
  await selectWire(2);
  await page.locator('#wireHandles [data-wire-end="b"]').waitFor({state:'attached',timeout:5000});
  await page.evaluate(()=>{
   const h=document.querySelector('#wireHandles [data-wire-end="b"]');
   h.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:98,pointerType:'mouse',button:0,clientX:300,clientY:500
   }));
   const pin=document.querySelector('[data-port="drv.IN1"]');
   pin.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
   window.dispatchEvent(new PointerEvent('pointerup',{
    bubbles:true,cancelable:true,pointerId:98,pointerType:'mouse',button:0,clientX:300,clientY:500
   }));
  });
  assert((await pairs()).some(w=>w.a==='esp.D19'&&w.b==='drv.IN1'),
   'reconexão mudou realmente a porta IN2 para IN1 '+width);
  await page.locator('#hintBtn').waitFor({state:'visible',timeout:6000});
  await button('hintBtn');
  assert.match(await page.locator('#wireHintCorrect').textContent(),/D27.*IN1/,'reconexão incorreta recebe destino certo '+width);
  await button('wireHintClose');
  assert.deepEqual(errors,[],'sem erros JS no '+width+': '+errors.join('; '));
  await page.close();
 }
 console.log('OK: excluir, desfazer/refazer, mover curva, GPIO19, GPIO18 e reconectar, mobile e desktop.');
}finally{
 if(browser)await browser.close();server.close();
}
