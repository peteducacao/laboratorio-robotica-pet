import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let path;
 try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname))}catch{return res.writeHead(400).end()}
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{return res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{return res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
mkdirSync('test-results',{recursive:true});
const layouts=[{name:'pc',width:1366,height:800,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'mobile-portrait',width:390,height:844,touch:true},
 {name:'mobile-landscape',width:844,height:390,touch:true}];
async function setRange(page,id,value){
 await page.locator('#'+id).evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}))},value)
}
async function switchTab(page,name){await page.locator('[data-tab="'+name+'"]').click();}
try{
 for(const device of layouts){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.touch,hasTouch:device.touch,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/petlab.html',{waitUntil:'domcontentloaded'});
  await page.locator('#overallProgress').waitFor();
  assert.equal(await page.locator('[data-panel]').count(),5);
  assert.equal(await page.locator('#overallProgress').textContent(),'0 de 5');
  const linkPage=await context.newPage();await linkPage.goto(url+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await linkPage.locator('#openPetQuiz').count(),1,'PETQuiz deve estar no menu Meus circuitos');
  await linkPage.close();
  // Motor speeds, three different outcomes.
  await setRange(page,'motorA',50);await setRange(page,'motorB',50);
  await page.locator('#motorTest').click();assert.equal(await page.locator('#motorNext').isVisible(),true);
  await page.locator('#motorNext').click();
  await setRange(page,'motorA',20);await setRange(page,'motorB',70);
  await page.locator('#motorTest').click();assert.equal(await page.locator('#motorNext').isVisible(),true);
  await page.locator('#motorNext').click();
  await setRange(page,'motorA',-40);await setRange(page,'motorB',40);
  await page.locator('#motorTest').click();
  assert((await page.locator('#motorCounter').textContent()).includes('Concluído'));
  assert.equal(await page.locator('#overallProgress').textContent(),'1 de 5');
  // Two separately controlled sources.
  await switchTab(page,'energy');
  await page.locator('#switchEsp').click();
  assert.equal(await page.locator('#espStatus').textContent(),'Energizado');
  assert.equal(await page.locator('#bridgeStatus').textContent(),'Sem alimentação');
  await page.locator('#energyTest').click();assert.equal(await page.locator('#energyNext').isVisible(),true);
  await page.locator('#energyNext').click();
  await page.locator('#switchMotors').click();
  await page.locator('#energyTest').click();
  assert.equal(await page.locator('#overallProgress').textContent(),'2 de 5');
  // LM2596 must not accept a voltage other than 5.
  await switchTab(page,'voltage');
  await setRange(page,'voltageRange',6);
  await page.locator('#voltageTest').click();
  assert.equal(await page.locator('#overallProgress').textContent(),'2 de 5');
  await setRange(page,'voltageRange',5);
  await page.locator('#voltageTest').click();
  assert.equal(await page.locator('#overallProgress').textContent(),'3 de 5');
  // Investigation requires evidence before corrective action.
  await switchTab(page,'diagnosis');
  assert.equal(await page.locator('#repairControl').isVisible(),false);
  await page.locator('[data-probe="esp"]').click();
  assert.equal(await page.locator('#repairControl').isVisible(),false);
  await page.locator('[data-probe="switch"]').click();
  assert.equal(await page.locator('#repairControl').isVisible(),true);
  await page.locator('#diagRepair').click();
  assert.equal(await page.locator('#diagTest').isVisible(),true);
  await page.locator('#diagTest').click();
  assert.equal(await page.locator('#diagNext').isVisible(),true);
  await page.locator('#diagNext').click();
  await page.locator('[data-probe="bridge"]').click();
  await page.locator('[data-probe="motor"]').click();
  assert.equal(await page.locator('#repairControl').isVisible(),true);
  await page.locator('#diagRepair').click();
  await page.locator('#diagTest').click();
  assert.equal(await page.locator('#overallProgress').textContent(),'4 de 5');
  // Simple guided track: no physics or collision game.
  await switchTab(page,'track');
  await page.locator('#trackMove').click();
  await page.waitForFunction(()=>window.PetlabDiagnostics.getState().trackStep===1,null,{timeout:6000});
  await setRange(page,'trackMotorA',20);await setRange(page,'trackMotorB',70);
  await page.locator('#trackMove').click();
  await page.waitForFunction(()=>window.PetlabDiagnostics.getState().trackStep===2,null,{timeout:6000});
  await setRange(page,'trackMotorA',70);await setRange(page,'trackMotorB',20);
  await page.locator('#trackMove').click();
  await page.waitForFunction(()=>window.PetlabDiagnostics.getState().trackStep===3,null,{timeout:6000});
  assert.equal(await page.locator('#overallProgress').textContent(),'5 de 5');
  const geometry=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(geometry.doc<=geometry.viewport+3,'PETLab não deve causar rolagem horizontal: '+JSON.stringify(geometry));
  await page.screenshot({path:'test-results/petlab-'+device.name+'.png',fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#overallProgress').textContent(),'5 de 5','Progresso precisa permanecer após F5');
  assert.equal(await page.locator('#motorCounter').textContent(),'3 de 3 · Concluído');
  assert.equal(errors.length,0,'Erros JavaScript: '+errors.join('; '));
  console.log('✓ PETLab '+device.name+': cinco jogos completos e progresso persistente.');
  await context.close();
 }
 console.log('✓ PETLab: jogos 2D jogáveis nas quatro configurações.');
}finally{
 await browser.close();await new Promise(ok=>server.close(ok));
}
