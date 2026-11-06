import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const original=JSON.parse(readFileSync(resolve(root,'petquiz-settings.json'),'utf8'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let path;
 try{path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{res.writeHead(400).end();return}
 if(!path.startsWith(root+'/')){res.writeHead(403).end();return}
 try{res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}).end(readFileSync(path))}
 catch{res.writeHead(404).end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const origin='http://127.0.0.1:'+server.address().port;
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  sessionStorage.setItem('tinkerpet-admin-github-token','ci-test-token');
  sessionStorage.setItem('tinkerpet-admin-auth','ok');
 });
 let published=null,writes=0;
 await context.route('**/petquiz-settings.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published||original)}));
 await context.route('https://api.github.com/repos/peteducacao/laboratorio-robotica-pet/contents/petquiz-settings.json',route=>{
  const req=route.request(),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,PUT,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(req.method()==='GET')return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({sha:'sha-'+writes})});
  if(req.method()==='PUT'){
   published=JSON.parse(Buffer.from(JSON.parse(req.postData()).content,'base64').toString('utf8'));
   writes++;
   return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({content:{sha:'sha-'+writes}})});
  }
  return route.fulfill({status:405,headers});
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/admin.html');
 await page.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:10000});
 await page.locator('.nav-btn[data-page="questoes"]').click();
 const count=original.questions.length;
 assert(count>0,'Banco não vazio');
 assert.equal(await page.locator('#activateAllQuestions').count(),1);
 assert.equal(await page.locator('#deactivateAllQuestions').count(),1);
 await page.locator('#searchQuestions').fill('ESP32');
 await page.locator('#deactivateAllQuestions').click();
 let settings=await page.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(settings.questions.length,count,'Não perde perguntas');
 assert(settings.questions.every(q=>!q.active),'Desativa todas, mesmo com busca filtrada');
 assert.equal(await page.locator('#activeQuestionCount').textContent(),'0');
 assert.equal(await page.locator('#inactiveQuestionCount').textContent(),String(count));
 assert.equal(await page.locator('#deactivateAllQuestions').isDisabled(),true);
 assert.equal(await page.locator('#homeQuestionCount').textContent(),'0');
 await page.waitForFunction(()=>document.querySelector('#saveState')?.textContent.includes('GitHub'),{timeout:12000});
 assert(published&&published.questions.every(q=>!q.active),'Publica desativação de todas');
 assert.equal(published.quizEnabled,original.quizEnabled,'Mantém estado do PETQuiz');
 assert.equal(published.answerKeyEnabled,original.answerKeyEnabled,'Mantém estado do Gabarito');
 // Página do jogo deve aceitar banco sem questões ativas.
 const game=await context.newPage();
 game.on('pageerror',e=>errors.push(e.message));
 await game.goto(origin+'/petquiz.html');
 if(original.quizEnabled){
  await game.waitForFunction(()=>document.querySelector('#startQuiz')?.disabled,{timeout:10000});
  assert((await game.locator('#introQuestionCount').textContent()).includes('0 perguntas'));
  assert((await game.locator('.intro-subtitle').textContent()).includes('Não há perguntas ativas'));
 }
 await game.close();
 await page.locator('#activateAllQuestions').click();
 settings=await page.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(settings.questions.every(q=>q.active),'Ativa todas');
 assert.equal(await page.locator('#activeQuestionCount').textContent(),String(count));
 assert.equal(await page.locator('#inactiveQuestionCount').textContent(),'0');
 assert.equal(await page.locator('#activateAllQuestions').isDisabled(),true);
 await page.waitForFunction(()=>document.querySelector('#saveState')?.textContent.includes('GitHub'),{timeout:12000});
 assert(published&&published.questions.every(q=>q.active),'Publica ativação de todas');
 assert(writes>=2,'Salvamento automático em ambas as ações');
 assert.deepEqual(errors,[],'Sem erros de JavaScript');
 console.log('PASS: ativar todas, desativar todas, busca, zero perguntas e publicação automática');
 await context.close();
}catch(error){console.error(error);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}
