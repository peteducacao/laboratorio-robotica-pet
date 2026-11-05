import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
mkdirSync(resolve(root,'test-results'),{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent((req.url||'/').split('?')[0]);
 const loc=resolve(root,'.'+pathname);
 if(!loc.startsWith(root+'/'))return res.writeHead(403).end('Forbidden');
 try{const body=readFileSync(loc);res.writeHead(200,{'Content-Type':mime[extname(loc)]||'application/octet-stream'}).end(body)}
 catch{return res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const errors=[];
try{
 for(const device of [{name:'desktop',width:1280,height:820},{name:'celular',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.name==='celular',hasTouch:device.name==='celular'});
  const page=await context.newPage();
  page.on('pageerror',err=>errors.push(device.name+': '+err.message));
  await page.goto(base+'/petquiz-bonus-teste.html',{waitUntil:'domcontentloaded'});
  await page.locator('#selector button').first().waitFor();
  assert.equal(await page.locator('#selector button').count(),9,'Nove bônus na área de testes');
  assert.equal(await page.locator('#challengeTitle').textContent(),'Faça o carrinho andar para a frente!');
  const setMotor=async(a,b)=>{
   await page.evaluate(([a,b])=>{
    for(const [id,value] of [['motorA',a],['motorB',b]]){
     const el=document.getElementById(id);el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
    }
   },[a,b]);
  };
  const checkMotor=async(a,b,expected=true)=>{
   await setMotor(a,b);
   await page.locator('#check').click();
   const approved=await page.locator('#feedback').evaluate(el=>el.classList.contains('ok'));
   assert.equal(approved,expected,
    'Validação incorreta '+JSON.stringify({a,b,expected,title:await page.locator('#challengeTitle').textContent()}));
  };
  // Para a frente: ambos avançando juntos, sem fazer uma curva.
  await checkMotor(40,50,false);await checkMotor(40,40);
  await page.locator('#next').click();
  // Curva à esquerda: mesmo com motor esquerdo em marcha à ré, vira à esquerda.
  await checkMotor(50,40,false);
  await checkMotor(-10,100,true);
  const tiltLeft=await page.locator('#rover').evaluate(el=>getComputedStyle(el).transform);
  assert.notEqual(tiltLeft,'none','A prévia deve mostrar curva');
  await page.locator('#next').click();
  await checkMotor(40,50,false);await checkMotor(100,-10);
  await page.locator('#next').click();
  // Para trás: ambos em ré e sem diferença de velocidade.
  await checkMotor(-50,-60,false);await checkMotor(-50,-50);
  assert.equal(await page.locator('#wheelA').getAttribute('data-direction'),'reverse');
  assert.equal(await page.locator('#wheelB').getAttribute('data-direction'),'reverse');
  await page.locator('#next').click();
  assert.equal(await page.locator('#motorA').inputValue(),'60');
  await checkMotor(20,0,false);await checkMotor(0,0);
  await page.locator('#next').click();
  assert.equal(await page.locator('#motorA').inputValue(),'80');
  await checkMotor(50,-50,false);await checkMotor(-50,-50);
  await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Regule o LM2596!');
  assert(!/5\s*V/.test(await page.locator('#challengeTitle').textContent()));
  const setVoltage=async value=>page.evaluate(value=>{
   const el=document.getElementById('voltage');el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  await setVoltage(7);await page.locator('#check').click();
  assert.equal(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')),false,'7 V não pode ser aceito');
  await setVoltage(5);await page.locator('#check').click();
  assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')));
  await setVoltage(6);
  assert.equal(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')),false,'Ao mudar a resposta, perde a aprovação anterior');
  await setVoltage(5);await page.locator('#check').click();
  assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')));
  await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Faça o Motor A funcionar!');
  const frame=page.frameLocator('#wiringFrame');
  await frame.locator('#viewport').waitFor({timeout:25000});
  await frame.locator('#connectionsCount').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('0/2'),{timeout:18000});
  const status=await frame.locator('body').evaluate(()=>window.PetQuizWiringTest?.());
  assert.equal(status.total,2,'No Motor A, conectar os dois bornes');
  assert.equal(status.good,0,'Iniciar sem nenhum fio pré-conectado');
  const stateCheck=await frame.locator('body').evaluate(()=>({s:localStorage.getItem('tinkerpet-v2'),lib:localStorage.getItem('tinkerpet-library-v1')}));
  if(device.name==='desktop'){
   const connect=async(a,b)=>{
    await frame.locator('[data-port="'+a+'"]').first().click({timeout:9000});
    await frame.locator('[data-port="'+b+'"]').first().click({timeout:9000});
   };
   // Os fios do Motor A podem ser invertidos (isso apenas muda o giro).
   await connect('drv.OUT1','ml.B');
   await connect('drv.OUT2','ml.A');
   await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('2/2'),{timeout:12000});
   assert.equal((await frame.locator('body').evaluate(()=>window.PetQuizWiringTest())).success,true);
   assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')));
  }
  if(device.name==='celular'){
   // Gesto Android real: tirar um jumper de um pino, deixá-lo solto,
   // reabrir pelo quadradinho e puxar a ponta até outra posição.
   const pin=frame.locator('[data-port="drv.OUT1"]').first();
   await pin.scrollIntoViewIfNeeded();
   const b=await pin.boundingBox(),viewport=await frame.locator('#viewport').boundingBox();
   assert(b&&viewport,'Bornes e bancada precisam estar disponíveis');
   const sx=b.x+b.width/2,sy=b.y+b.height/2;
   const ex=sx<viewport.x+viewport.width/2?viewport.x+viewport.width*.78:viewport.x+viewport.width*.22;
   const ey=sy<viewport.y+viewport.height/2?viewport.y+viewport.height*.74:viewport.y+viewport.height*.26;
   const session=await context.newCDPSession(page);
   async function touchPath(points,id){
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:points[0][0],y:points[0][1],id}]});
    for(const [x,y] of points.slice(1)){
     await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y,id}]});
     await new Promise(done=>setTimeout(done,45));
    }
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   await touchPath([[sx,sy],[sx+ (ex-sx)*.3,sy],[sx+(ex-sx)*.55,ey],[ex,ey]],21);
   const loose=frame.locator('#wireHandles .wire-end-handle[data-loose="true"]').first();
   await loose.waitFor({state:'visible',timeout:6500});
   const radius=await loose.evaluate(el=>getComputedStyle(el,'::after').borderRadius);
   assert.equal(radius,'2px','A ponta solta deve parecer um quadradinho no celular');
   const before=await loose.boundingBox();
   const nx=Math.max(viewport.x+30,Math.min(viewport.x+viewport.width-30,ex-65));
   const ny=Math.max(viewport.y+30,Math.min(viewport.y+viewport.height-30,ey+55));
   const mx=before.x+before.width/2,my=before.y+before.height/2;
   await touchPath([[mx,my],[mx+(nx-mx)*.3,my],[mx+(nx-mx)*.65,ny],[nx,ny]],22);
   await loose.waitFor({state:'visible',timeout:6500});
   const after=await loose.boundingBox();
   assert(Math.hypot(after.x-before.x,after.y-before.y)>13,
    'O quadrado da ponta solta precisa seguir o dedo e permitir editar o fio');
   console.log('✓ Android: ponta solta quadrada, selecionável e arrastável seguindo o dedo.');
  }
  await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Faça a ponte H funcionar!');
  await frame.locator('#viewport').waitFor({timeout:25000});
  await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('0/17'),{timeout:15000});
  assert.equal((await frame.locator('body').evaluate(()=>window.PetQuizWiringTest())).total,17);
  if(device.name==='desktop'){
   // Reproduz montagem completa do zero usando o editor verdadeiro.
   const all=[
    ['b1.POS','s1.IN'],['s1.OUT','lm.INP'],['b1.NEG','lm.INN'],
    ['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND'],
    ['b2.POS','s2.IN'],['s2.OUT','drv.VCC'],['b2.NEG','drv.GND'],
    ['esp.GND','drv.GND'],
    ['esp.D27','drv.IN1'],['esp.D26','drv.IN2'],['esp.D32','drv.IN3'],['esp.D18','drv.IN4'],
    ['drv.OUT1','ml.B'],['drv.OUT2','ml.A'],['drv.OUT3','mr.A'],['drv.OUT4','mr.B']
   ];
   for(const [a,b] of all){
    const src=frame.locator('[data-port="'+a+'"]').first();
    const dest=frame.locator('[data-port="'+b+'"]').first();
    await src.evaluate(el=>el.click());await dest.evaluate(el=>el.click());
   }
   await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('17/17'),{timeout:15000});
   assert.equal((await frame.locator('body').evaluate(()=>window.PetQuizWiringTest())).success,true,
    'Montagem completa deve validar com Motor A invertido');
  }
  const finalState=await frame.locator('body').evaluate(()=>({s:localStorage.getItem('tinkerpet-v2'),lib:localStorage.getItem('tinkerpet-library-v1')}));
  assert.deepEqual(finalState,stateCheck,'Bancadas de teste não alteram circuitos salvos');
  await page.screenshot({path:resolve(root,'test-results/petquiz-bonus-'+device.name+'.png'),fullPage:true});
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(width.scroll<=width.viewport+5,'Sem overflow horizontal na página de teste: '+JSON.stringify(width));
  await context.close();
  console.log('✓ Nove bônus na '+device.name+'; bancada isolada e pontuação da montagem.');
 }
 assert.deepEqual(errors,[],'Sem erros JavaScript nas duas orientações');
 console.log('✓ Todos os bônus, bancada e isolamento dos circuitos aprovados.');
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
