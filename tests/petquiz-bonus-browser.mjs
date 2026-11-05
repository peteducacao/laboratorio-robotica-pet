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
  const solveMotor=async(a,b)=>{
   await page.evaluate(([a,b])=>{
    for(const [id,value] of [['motorA',a],['motorB',b]]){
     const el=document.getElementById(id);el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
    }
   },[a,b]);
   await page.locator('#check').click();
   assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')),
    'Bônus de movimento correto não validou: '+await page.locator('#challengeTitle').textContent());
  };
  await solveMotor(40,40);await page.locator('#next').click();
  await solveMotor(40,50);await page.locator('#next').click();
  await solveMotor(50,40);await page.locator('#next').click();
  await solveMotor(-50,-50);await page.locator('#next').click();
  assert.equal(await page.locator('#motorA').inputValue(),'60');
  await solveMotor(0,0);await page.locator('#next').click();
  assert.equal(await page.locator('#motorA').inputValue(),'80');
  await solveMotor(50,50);await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Regule o LM2596!');
  assert(!/5\s*V/.test(await page.locator('#challengeTitle').textContent()));
  await page.evaluate(()=>{const el=document.getElementById('voltage');el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#check').click();
  assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')));
  await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Faça o Motor A funcionar!');
  const frame=page.frameLocator('#wiringFrame');
  await frame.locator('#viewport').waitFor({timeout:25000});
  await frame.locator('#connectionsCount').waitFor();
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
   await connect('drv.OUT1','ml.A');
   await connect('drv.OUT2','ml.B');
   await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('2/2'),{timeout:12000});
   assert.equal((await frame.locator('body').evaluate(()=>window.PetQuizWiringTest())).success,true);
   assert(await page.locator('#feedback').evaluate(el=>el.classList.contains('ok')));
  }
  await page.locator('#next').click();
  assert.equal(await page.locator('#challengeTitle').textContent(),'Faça a ponte H funcionar!');
  await frame.locator('#viewport').waitFor({timeout:25000});
  await page.waitForFunction(()=>document.getElementById('wiringCount').textContent.includes('0/17'),{timeout:15000});
  assert.equal((await frame.locator('body').evaluate(()=>window.PetQuizWiringTest())).total,17);
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
