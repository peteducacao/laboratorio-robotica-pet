import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let filename;
 try{filename=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}
 catch{return res.writeHead(400).end()}
 if(!(filename===root||filename.startsWith(root+'/')))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream'}).end(readFileSync(filename))}
 catch{res.writeHead(404).end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const original=JSON.parse(readFileSync(resolve(root,'petquiz-settings.json'),'utf8'));
mkdirSync('test-results',{recursive:true});
let browser;
const errors=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const admin=await context.newPage();admin.on('pageerror',e=>errors.push('Admin '+e.message));
 await admin.goto(origin+'/admin.html');
 assert(await admin.locator('#authOverlay').isVisible(),'Painel pede autenticação');
 await admin.locator('#password').fill('senha errada');
 await admin.locator('#loginForm button[type="submit"]').click();
 assert((await admin.locator('#loginError').textContent()).includes('incorreta'),'Senha errada rejeitada');
 await admin.locator('#password').fill('peteducacao');
 await admin.locator('#loginForm button[type="submit"]').click();
 await admin.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:15000});
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).questions.length,19,'Banco carrega 19 perguntas');
 await admin.locator('.nav-btn[data-page="questoes"]').click();
 await admin.locator('#addQuestion').click();
 await admin.locator('#questionText').fill('Qual é a função do ESP32 neste teste?');
 await admin.locator('#opt0').fill('Executar comandos');
 await admin.locator('#opt1').fill('Guardar pilhas');
 await admin.locator('#opt2').fill('Controlar luz solar');
 await admin.locator('#opt3').fill('Ser uma roda');
 await admin.locator('#correctSelect').selectOption('0');
 await admin.locator('#topicInput').fill('esp32');
 await admin.locator('#questionForm button[type="submit"]').click();
 let data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(data.questions.length,20,'Cadastra questão');
 assert(data.questions.some(q=>q.prompt.includes('neste teste')),'Salva enunciado da nova questão');
 await admin.locator('#questionText').fill('Qual componente executa os comandos no teste?');
 await admin.locator('#opt0').fill('Motor DC');
 await admin.locator('#opt1').fill('ESP32');
 await admin.locator('#correctSelect').selectOption('1');
 await admin.locator('#questionForm button[type="submit"]').click();
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(data.questions.some(q=>q.prompt==='Qual componente executa os comandos no teste?'&&q.correct===1),'Edita pergunta e gabarito');
 admin.once('dialog',dialog=>dialog.accept());
 await admin.locator('#deleteQuestion').click();
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(data.questions.length,19,'Exclui pergunta');
 await admin.locator('.nav-btn[data-page="inicio"]').click();
 await admin.locator('#homeQuizEnabled').uncheck({force:true});
 await admin.locator('#homeAnswerEnabled').uncheck({force:true});
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(!data.quizEnabled&&!data.answerKeyEnabled,'Bloqueia quiz e gabarito separadamente');
 await admin.locator('[data-counter="questionCount"][data-step="-1"]').first().click();
 await admin.locator('[data-counter="bonusCount"][data-step="1"]').first().click();
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(data.questionCount,9,'Altera quantidade de questões');
 assert.equal(data.bonusCount,3,'Altera quantidade de bônus');
 await admin.locator('#homeQuizEnabled').check({force:true});
 await admin.locator('#homeAnswerEnabled').check({force:true});
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).quizEnabled,'Desbloqueia quiz');
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).answerKeyEnabled,'Desbloqueia gabarito');

 // Publicação simulada: valida payload integral sem enviar credencial real.
 let writes=0,published=null;
 await admin.route('https://api.github.com/repos/peteducacao/laboratorio-robotica-pet/contents/petquiz-settings.json',async route=>{
  const request=route.request();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*',
    'access-control-allow-methods':'GET,PUT,OPTIONS'};
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(request.method()==='GET')return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({sha:'fake-sha'})});
  if(request.method()==='PUT'){
   const body=JSON.parse(request.postData());
   published=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));
   writes++;
   return route.fulfill({status:200,headers,contentType:'application/json',body:'{"content":{"sha":"new"}}'});
  }
  return route.fulfill({status:405,headers});
 });
 await admin.locator('[data-page="configuracoes"].nav-btn').click();
 await admin.locator('#githubToken').fill('github_pat_teste_local');
 await admin.locator('#publish').click();
 await admin.waitForFunction(()=>document.querySelector('#notice')?.textContent.includes('Publicado!'),{timeout:15000});
 assert.equal(writes,1,'Publicação enviou uma atualização');
 assert.equal(published.questions.length,19,'Publicação mantém banco completo');
 assert(published.quizEnabled&&published.answerKeyEnabled,'Publicação reabre acessos');
 assert(!await admin.evaluate(()=>!!localStorage.getItem('tinkerpet-admin-draft-v1')),'Apaga rascunho após publicar');
 await admin.screenshot({path:'test-results/petquiz-admin-desktop.png',fullPage:true});
 await context.close();
 console.log('PASS admin: senha, cadastro, edição, exclusão, configurações, bloqueios, desbloqueios e publicação simulada');

 const mobileAdminContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const mobileAdmin=await mobileAdminContext.newPage();
 await mobileAdmin.addInitScript(()=>sessionStorage.setItem('tinkerpet-admin-auth','ok'));
 await mobileAdmin.goto(origin+'/admin.html');
 await mobileAdmin.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:15000});
 await mobileAdmin.locator('.nav-btn[data-page="questoes"]').click();
 assert(await mobileAdmin.locator('#questionList .question-row').count()>0,'Banco visível no celular');
 assert(await mobileAdmin.locator('#questionForm').isVisible(),'Editor disponível no celular');
 const mobileWidth=await mobileAdmin.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert(mobileWidth.scroll<=mobileWidth.viewport+4,'Sem rolagem horizontal no admin: '+JSON.stringify(mobileWidth));
 await mobileAdmin.screenshot({path:'test-results/petquiz-admin-mobile.png',fullPage:true});
 await mobileAdminContext.close();
 console.log('PASS admin mobile: lista, formulário e responsividade');

 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const quiz=await mobile.newPage();quiz.on('pageerror',e=>errors.push('PETQuiz '+e.message));
 await quiz.addInitScript(()=>{window.__PETQUIZ_TEST_SPEED__=true});
 await quiz.goto(origin+'/petquiz.html');
 await quiz.waitForFunction(()=>!!window.PetQuiz,{timeout:15000});
 assert.equal(await quiz.locator('.intro-rules>div').count(),2,'Abertura sem anúncio de bônus');
 assert.equal(await quiz.locator('#feedbackExplanation').count(),0,'Não exibir resolução/justificativa');
 await quiz.locator('#startQuiz').click();
 let totalAnswers=0,turns=0;
 while(turns++<600){
  const st=await quiz.evaluate(()=>window.PetQuiz.getStatus());
  if(st.phase==='finished')break;
  if(st.phase==='answer'){
   const q=original.questions.find(q=>q.id===st.plan[st.index].id);
   assert(q,'Questão jogada pertence ao banco');
   const choice=totalAnswers===0?(q.correct+1)%4:q.correct;
   const text=q.choices[choice];
   await quiz.locator('.answer-btn').filter({hasText:text}).first().click({timeout:1000});
   totalAnswers++;
  }else if(st.phase==='bonus'){
   await quiz.locator('#bonusSkip').click();
  }else await quiz.waitForTimeout(45);
 }
 const final=await quiz.evaluate(()=>window.PetQuiz.getStatus());
 assert.equal(final.phase,'finished','Partida termina');
 assert.equal(totalAnswers,10,'Joga 10 perguntas');
 assert.equal(final.correct,9,'9 acertos');
 assert.equal(final.wrong,1,'1 erro');
 assert.equal(final.bonusCount,2,'2 bônus por partida');
 assert.equal(await quiz.locator('#runProgress').evaluate(el=>el.style.width),'100%','Barra chega a 100%');
 console.log('PASS jogo: partida completa 10 perguntas, acerto, erro, dois bônus e progresso 100%');

 // Rosto reage ao dedo e à intensidade, inclusive após erro.
 await quiz.evaluate(()=>window.PetQuiz.testBonus('left'));
 await quiz.waitForFunction(()=>window.PetQuiz.getStatus().phase==='bonus',{timeout:7000});
 const change=async (a,b)=>quiz.evaluate(([a,b])=>{
  for(const [id,value] of [['bonusA',a],['bonusB',b]]){
   const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
  }
 },[a,b]);
 await change(30,90);
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-mood'),'left','Rosto vira para esquerda');
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-speed'),'fast','Rosto identifica intensidade alta');
 await change(-60,-60);
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-mood'),'reverse','Rosto para ré');
 await change(70,-40);
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-mood'),'surprised','Rosto para sentidos opostos');
 await quiz.locator('#bonusTry').click();
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-mood'),'fail','Rosto após erro');
 await change(20,80);
 assert.equal(await quiz.locator('#bonusCar').getAttribute('data-mood'),'left','Rosto reage novamente ao controle');
 await quiz.locator('#bonusTry').click();
 assert.equal((await quiz.evaluate(()=>window.PetQuiz.getStatus())).phase,'bonusResult','Bônus acertado');
 await mobile.close();
 console.log('PASS bônus: expressão muda por direção, intensidade, erro e acerto');

 const locked=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await locked.addInitScript(()=>window.__PETQUIZ_TEST_SPEED__=true);
 const lockPage=await locked.newPage();
 const blocked={...original,quizEnabled:false,answerKeyEnabled:false};
 await lockPage.route('**/petquiz-settings.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(blocked)}));
 await lockPage.goto(origin+'/petquiz.html');
 await lockPage.waitForFunction(()=>document.body.textContent.includes('PETQuiz indisponível'),{timeout:7000});
 await lockPage.goto(origin+'/projects.html');
 await lockPage.waitForFunction(()=>document.querySelector('#openPetQuiz')?.getAttribute('aria-disabled')==='true'&&document.querySelector('#openGate')?.getAttribute('aria-disabled')==='true',{timeout:8000});
 await lockPage.evaluate(()=>sessionStorage.setItem('tinkerpet-gabarito-access','ok'));
 await lockPage.goto(origin+'/gabarito.html');
 await lockPage.waitForFunction(()=>document.body.textContent.includes('Gabarito indisponível'),{timeout:8000});
 await locked.close();
 console.log('PASS bloqueios: quiz e gabarito protegidos na entrada e por URL direta');
 assert.deepEqual(errors,[],'Erros JS: '+errors.join('; '));
 console.log('PASS todos os cenários de administração e jogo');
}catch(err){console.error(err);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}
