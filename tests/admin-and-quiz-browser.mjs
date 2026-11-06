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
const initialQuestionCount=original.questions.length;
const bonusCatalog=JSON.parse(readFileSync(resolve(root,'petquiz-bonuses.json'),'utf8'));
mkdirSync('test-results',{recursive:true});
let browser;
const errors=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const validToken='github_pat_teste_publicacao';
 let writes=0,published=null,currentSha='test-sha';
 await context.route('https://api.github.com/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*',
   'access-control-allow-methods':'GET,PUT,OPTIONS'};
  const answer=(status,body)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const authenticated=request.headers().authorization==='Bearer '+validToken;
  if(url.pathname==='/user')return answer(authenticated?200:401,authenticated?{login:'teste'}:{message:'Bad credentials'});
  if(url.pathname==='/repos/peteducacao/laboratorio-robotica-pet')
   return answer(authenticated?200:401,authenticated?{permissions:{push:true}}:{message:'Bad credentials'});
  if(url.pathname.endsWith('/contents/petquiz-settings.json')){
   if(!authenticated)return answer(401,{message:'Bad credentials'});
   if(request.method()==='GET')return answer(200,{sha:currentSha});
   if(request.method()==='PUT'){
    const body=JSON.parse(request.postData());
    published=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));
    currentSha='test-sha-'+ ++writes;
    return answer(200,{content:{sha:currentSha}});
   }
  }
  return answer(404,{message:'Not found'});
 });
 await context.route('**/petquiz-settings.json?confirm=*',route=>
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published||original)}));
 const admin=await context.newPage();admin.on('pageerror',e=>errors.push('Admin '+e.message));
 await admin.goto(origin+'/admin.html');
 assert(await admin.locator('#authOverlay').isVisible(),'Painel pede autenticação');
 await admin.locator('#password').fill('senha errada');
 await admin.locator('#toggleAdminPassword').click();
 assert.equal(await admin.locator('#password').getAttribute('type'),'text','Revela senha');
 await admin.locator('#toggleAdminPassword').click();
 assert.equal(await admin.locator('#password').getAttribute('type'),'password','Oculta senha');
 await admin.locator('#loginForm button[type="submit"]').click();
 await admin.waitForFunction(()=>document.querySelector('#loginError')?.textContent.includes('inválido'),{timeout:8000});
 assert((await admin.locator('#loginError').textContent()).includes('inválido'),'Token incorreto rejeitado');
 await admin.locator('#password').fill(validToken);
 await admin.locator('#loginForm button[type="submit"]').click();
 await admin.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:15000});
 await admin.locator('.nav-btn[data-page="ajuda"]').click();
 assert(await admin.locator('#page-ajuda').isVisible(),'A aba Ajuda abre');
 assert((await admin.locator('#page-ajuda').textContent()).includes('Salvar e atualizar'),'Ajuda explica publicação');

 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).questions.length,initialQuestionCount,'Carrega banco inteiro');
 await admin.locator('.nav-btn[data-page="questoes"]').click();
 // Mover de Ativas para Inativas e voltar com o mouse.
 const row=admin.locator('#activeQuestionList .question-row').first();
 const itemId=await row.getAttribute('data-question-id');
 const drag=async(from,to)=>{
  const fromBox=await from.boundingBox(),toBox=await to.boundingBox();
  assert(fromBox&&toBox,'Origem e destino visíveis');
  await admin.mouse.move(fromBox.x+fromBox.width*.5,fromBox.y+Math.min(fromBox.height*.5,28));
  await admin.mouse.down();
  await admin.mouse.move(toBox.x+toBox.width*.5,toBox.y+Math.min(toBox.height*.5,80),{steps:12});
  await admin.mouse.up();
 };
 await drag(row,admin.locator('[data-status-zone="inactive"]'));
 assert.equal(await admin.locator('#inactiveQuestionList [data-question-id="'+itemId+'"]').count(),1,
  'Arrastar para Inativas desativa');
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).questions.find(q=>q.id===itemId).active,false);
 await drag(admin.locator('#inactiveQuestionList [data-question-id="'+itemId+'"]'),
  admin.locator('[data-status-zone="active"]'));
 assert.equal(await admin.locator('#activeQuestionList [data-question-id="'+itemId+'"]').count(),1,
  'Arrastar para Ativas reativa');
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).questions.find(q=>q.id===itemId).active,true);
 assert.equal(await admin.locator('#activeQuestionCount').textContent(),String(initialQuestionCount));
 assert.equal(await admin.locator('#inactiveQuestionCount').textContent(),'0');
 assert.equal(await admin.locator('#activeQuestion').count(),0,'Sem checkbox de ativação');
 assert((await admin.locator('#bonusCatalogSummary').textContent()).includes(bonusCatalog.bonuses.length+' desafios'),
  'Total de bônus é carregado do catálogo');
 await admin.locator('#addQuestion').click();
 await admin.locator('#questionText').fill('Qual é a função do ESP32 neste teste?');
 await admin.locator('#opt0').fill('Executar comandos');
 await admin.locator('#opt1').fill('Guardar pilhas');
 await admin.locator('#opt2').fill('Controlar luz solar');
 await admin.locator('#opt3').fill('Ser uma roda');
 await admin.locator('#correctSelect').selectOption('0');
 await admin.locator('#topicInput').selectOption('esp32');
 await admin.locator('#questionForm button[type="submit"]').click();
 await admin.waitForFunction(()=>!document.getElementById('saveToast').hidden);
 assert((await admin.locator('#saveToast').textContent()).includes('Salvo!'),'Popup confirma salvamento');
 let data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(data.questions.length,initialQuestionCount+1,'Cadastra questão');
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
 assert.equal(data.questions.length,initialQuestionCount,'Exclui pergunta');
 await admin.locator('.nav-btn[data-page="taxonomia"]').click();
 const catCount=(await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).categories.length;
 await admin.locator('#categoryName').fill('Eletrônica básica');
 await admin.locator('#categorySave').click();
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).categories.length,catCount+1);
 await admin.locator('#categoryList .taxonomy-row').last().getByText('Editar').click();
 await admin.locator('#categoryName').fill('Eletrônica e circuitos');
 await admin.locator('#categorySave').click();
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).categories.some(x=>x.name==='Eletrônica e circuitos'));
 admin.once('dialog',d=>d.accept());
 await admin.locator('#categoryList .taxonomy-row').last().getByText('Excluir').click();
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).categories.length,catCount);
 const topicCount=(await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).prerequisites.length;
 await admin.locator('#topicName').fill('Fios especiais');
 await admin.locator('#topicSave').click();
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).prerequisites.length,topicCount+1);
 await admin.locator('#topicList .taxonomy-row').last().getByText('Editar').click();
 await admin.locator('#topicName').fill('Fios de teste');
 await admin.locator('#topicSave').click();
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).prerequisites.some(x=>x.name==='Fios de teste'));
 admin.once('dialog',d=>d.accept());
 await admin.locator('#topicList .taxonomy-row').last().getByText('Excluir').click();
 assert.equal((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).prerequisites.length,topicCount);
 await admin.locator('.nav-btn[data-page="inicio"]').click();
 // Verde = BLOQUEADO; cinza = LIBERADO. Testar os dois separadamente.
 await admin.locator('#homeQuizEnabled').uncheck({force:true});
 await admin.locator('#homeAnswerEnabled').uncheck({force:true});
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(data.quizEnabled&&data.answerKeyEnabled,'Ambos liberados com as chaves desligadas');
 await admin.locator('#homeQuizEnabled').check({force:true});
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(!data.quizEnabled&&data.answerKeyEnabled,'Bloquear PETQuiz preserva Gabarito');
 assert(await admin.locator('#settingsQuizEnabled').isChecked(),'Sincroniza chave do PETQuiz');
 await admin.locator('#homeQuizEnabled').uncheck({force:true});
 await admin.locator('#homeAnswerEnabled').check({force:true});
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert(data.quizEnabled&&!data.answerKeyEnabled,'Bloquear Gabarito preserva PETQuiz');
 assert(await admin.locator('#settingsAnswerEnabled').isChecked(),'Sincroniza chave do Gabarito');
 await admin.locator('[data-counter="questionCount"][data-step="-1"]').first().click();
 await admin.locator('[data-counter="bonusCount"][data-step="1"]').first().click();
 data=await admin.evaluate(()=>window.TinkerPETAdmin.getSettings());
 assert.equal(data.questionCount,9,'Altera quantidade de questões');
 assert.equal(data.bonusCount,3,'Altera quantidade de bônus');
 await admin.locator('#homeQuizEnabled').check({force:true});
 await admin.locator('#homeAnswerEnabled').check({force:true});
 assert(!(await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).quizEnabled,'Ativado bloqueia o PETQuiz');
 assert(!(await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).answerKeyEnabled,'Ativado bloqueia o Gabarito');
 await admin.locator('#homeQuizEnabled').uncheck({force:true});
 await admin.locator('#homeAnswerEnabled').uncheck({force:true});
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).quizEnabled,'Desativado libera PETQuiz');
 assert((await admin.evaluate(()=>window.TinkerPETAdmin.getSettings())).answerKeyEnabled,'Desativado libera Gabarito');

 // O mesmo token da entrada é reutilizado em toda publicação.
 await admin.locator('[data-page="configuracoes"].nav-btn').click();
 assert.equal(await admin.locator('#githubToken').count(),0,'Token não é solicitado novamente');
 await admin.waitForFunction(()=>{
  const status=document.querySelector('#saveState')?.textContent||'';
  return status.includes('Salvo no GitHub')||status.includes('Disponível para todos');
 },{timeout:12000});
 assert(writes>0,'Salvamento enviou PUT automaticamente ao GitHub');
 assert.equal(published.questions.length,initialQuestionCount,'Publicação mantém todas as perguntas');
 assert(published.quizEnabled&&published.answerKeyEnabled,'Publica controles de acesso');
 assert.equal(published.questionCount,9,'Publica quantidade de perguntas');
 assert.equal(published.bonusCount,3,'Publica quantidade de bônus');
 assert.equal(published.categories.length,original.categories.length,'Publica categorias');
 assert.equal(published.prerequisites.length,original.prerequisites.length,'Publica requisitos');
 assert.equal(await admin.evaluate(()=>sessionStorage.getItem('tinkerpet-admin-github-token')),validToken,'Token mantido na sessão');
 assert(!JSON.stringify(published).includes(validToken),'Token nunca é incluído no banco de perguntas');
 assert((await admin.locator('#page-ajuda').textContent()).includes('token GitHub')|| (await admin.locator('#page-ajuda').textContent()).includes('token'),'Ajuda explica token');
 assert.equal(await admin.evaluate(()=>localStorage.getItem('tinkerpet-admin-github-token')),null,'Token nunca salvo em armazenamento permanente');
 const before=writes;
 await admin.locator('#publish').click();
 await admin.waitForFunction(()=>{
  const status=document.querySelector('#saveState')?.textContent||'';
  return status.includes('Salvo no GitHub')||status.includes('Disponível para todos');
 },{timeout:12000});
 assert(writes>before,'Botão Publicar reutiliza o token sem novo login');
 await admin.waitForFunction(()=>document.querySelector('#saveState')?.textContent.includes('Disponível para todos'),{timeout:15000});
 assert((await admin.locator('#saveState').textContent()).includes('atualização confirmada no site'),
  'Só informar disponível quando a configuração atual aparecer no site');
 const downloaded=admin.waitForEvent('download');
 await admin.locator('#exportSettings').click();
 const file=await downloaded;
 assert.equal(file.suggestedFilename(),'petquiz-settings.json','Backup opcional');
 const exported=JSON.parse(readFileSync(await file.path(),'utf8'));
 assert.equal(exported.questions.length,initialQuestionCount,'Backup mantém perguntas');
 await admin.screenshot({path:'test-results/petquiz-admin-desktop.png',fullPage:true});
 await context.close();
 console.log('PASS admin: token único, CRUD, salvamento automático, publicação repetida e backup');

 const mobileAdminContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const mobileAdmin=await mobileAdminContext.newPage();
 await mobileAdmin.addInitScript(()=>{sessionStorage.setItem('tinkerpet-admin-auth','ok');sessionStorage.setItem('tinkerpet-admin-github-token','github_pat_teste_publicacao')});
 await mobileAdmin.goto(origin+'/admin.html');
 await mobileAdmin.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:15000});
 await mobileAdmin.locator('.nav-btn[data-page="configuracoes"]').click();
 await mobileAdmin.waitForTimeout(450);
 const visibleTab=await mobileAdmin.locator('.nav-btn[data-page="configuracoes"]').evaluate(el=>{
  const rect=el.getBoundingClientRect();return rect.left>=-1&&rect.right<=innerWidth+1;
 });
 assert(visibleTab,'Aba ativa deve ficar inteira visível no celular');
 await mobileAdmin.locator('.nav-btn[data-page="questoes"]').click();
 assert(await mobileAdmin.locator('#questionList .question-row').count()>0,'Banco visível no celular');
 assert(await mobileAdmin.locator('#questionForm').isVisible(),'Editor disponível no celular');
 await mobileAdmin.locator('#questionList .question-row').nth(2).click();
 await mobileAdmin.waitForTimeout(650);
 const editorVisible=await mobileAdmin.evaluate(()=>{
  const rect=document.getElementById('editorPanel').getBoundingClientRect();
  return scrollY>0&&rect.top>=-30&&rect.top<innerHeight*.65;
 });
 assert(editorVisible,'A pergunta selecionada leva ao editor no celular');
 assert.equal(await mobileAdmin.locator('#topicInput').evaluate(el=>el.tagName),'SELECT');
 // Arrastar de verdade usando o gesto de toque do navegador no celular.
 const mobileFirst=mobileAdmin.locator('#activeQuestionList .question-row').first();
 await mobileFirst.scrollIntoViewIfNeeded();
 const mobileQuestionId=await mobileFirst.getAttribute('data-question-id');
 const touch=await mobileAdmin.context().newCDPSession(mobileAdmin);
 const moveTouch=async(from,to)=>{
  await from.scrollIntoViewIfNeeded();
  const a=await from.boundingBox(),b=await to.boundingBox();
  assert(a&&b,'As colunas devem estar visíveis');
  const x=a.x+a.width*.50,y=a.y+Math.min(a.height*.5,30);
  const endX=b.x+b.width*.5,endY=b.y+Math.min(b.height*.5,65);
  const point=(cx,cy)=>[{x:cx,y:cy}];
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(x,y)});
  for(let i=1;i<=12;i++){
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',
    touchPoints:point(x+(endX-x)*i/12,y+(endY-y)*i/12)});
  }
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 await moveTouch(mobileFirst,mobileAdmin.locator('[data-status-zone="inactive"]'));
 await mobileAdmin.waitForFunction(id=>!!document.querySelector('#inactiveQuestionList [data-question-id="'+id+'"]'),
  mobileQuestionId,{timeout:5000});
 assert.equal((await mobileAdmin.evaluate(()=>window.TinkerPETAdmin.getSettings())).questions.find(q=>q.id===mobileQuestionId).active,false);
 await moveTouch(mobileAdmin.locator('#inactiveQuestionList [data-question-id="'+mobileQuestionId+'"]'),
  mobileAdmin.locator('[data-status-zone="active"]'));
 await mobileAdmin.waitForFunction(id=>!!document.querySelector('#activeQuestionList [data-question-id="'+id+'"]'),
  mobileQuestionId,{timeout:5000});
 console.log('PASS arrastar por toque: desativa e reativa a pergunta');
 const mobileWidth=await mobileAdmin.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert(mobileWidth.scroll<=mobileWidth.viewport+4,'Sem rolagem horizontal no admin: '+JSON.stringify(mobileWidth));
 await mobileAdmin.screenshot({path:'test-results/petquiz-admin-mobile.png',fullPage:true});
 await mobileAdminContext.close();
 console.log('PASS admin mobile: lista, formulário e responsividade');

 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const gameSettings={...original,quizEnabled:true,answerKeyEnabled:true};
 await mobile.route('**/petquiz-settings.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(gameSettings)}));
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

 // Quatro combinações independentes + rascunho antigo que não pode bloquear o segundo recurso.
 for(const [quizEnabled,answerKeyEnabled] of [[true,true],[false,true],[true,false],[false,false]]){
  const flags={...original,quizEnabled,answerKeyEnabled};
  const scenario=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await scenario.addInitScript(snapshot=>{
   sessionStorage.setItem('tinkerpet-admin-auth','ok');
   // Simula um rascunho de sessão anterior que tinha ambos bloqueados.
   localStorage.setItem('tinkerpet-admin-draft-v1',JSON.stringify({...snapshot,quizEnabled:false,answerKeyEnabled:false}));
  },original);
  await scenario.route('**/petquiz-settings.json*',route=>
   route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(flags)}));
  const page=await scenario.newPage();
  page.on('pageerror',e=>errors.push('Acessos '+e.message));
  await page.goto(origin+'/projects.html');
  await page.waitForFunction(()=>!!window.tinkerpetAccessFlags&&
   document.getElementById('openPetQuiz')?.hasAttribute('aria-disabled')&&
   document.getElementById('openGate')?.hasAttribute('aria-disabled'));
  const state=await page.evaluate(()=>({
   quiz:document.getElementById('openPetQuiz').getAttribute('aria-disabled'),
   answer:document.getElementById('openGate').getAttribute('aria-disabled'),
   flags:window.tinkerpetAccessFlags
  }));
  assert.equal(state.quiz,String(!quizEnabled),'PETQuiz independente: '+JSON.stringify(flags));
  assert.equal(state.answer,String(!answerKeyEnabled),'Gabarito independente: '+JSON.stringify(flags));
  assert.equal(state.flags.quizEnabled,quizEnabled,'Valor do PETQuiz não herda rascunho');
  assert.equal(state.flags.answerKeyEnabled,answerKeyEnabled,'Valor do Gabarito não herda rascunho');
  await page.goto(origin+'/petquiz.html');
  if(quizEnabled){
   await page.waitForFunction(()=>!!window.PetQuiz,{timeout:8000});
   assert(await page.locator('#startQuiz').isVisible(),'PETQuiz liberado entra');
  }else{
   await page.waitForFunction(()=>document.body.textContent.includes('PETQuiz indisponível'),{timeout:8000});
  }
  await page.goto(origin+'/gabarito.html');
  if(answerKeyEnabled){
   await page.waitForFunction(()=>document.getElementById('chooser')&&
    getComputedStyle(document.getElementById('chooser')).display!=='none',{timeout:8000});
   assert(await page.locator('#chooser').isVisible(),'Gabarito liberado sem senha');
  }else{
   await page.waitForFunction(()=>document.body.textContent.includes('Gabarito indisponível'),{timeout:8000});
  }
  await scenario.close();
 }
 console.log('PASS permissões: quatro combinações independentes e rascunho antigo ignorado');
 // O painel também precisa ignorar o valor antigo do controle NÃO alterado.
 {
  const stale=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await stale.addInitScript(snapshot=>{
   sessionStorage.setItem('tinkerpet-admin-github-token','github_pat_teste_publicacao');
   localStorage.setItem('tinkerpet-admin-draft-v1',JSON.stringify({...snapshot,quizEnabled:false,answerKeyEnabled:false}));
   localStorage.removeItem('tinkerpet-admin-draft-access-keys-v1');
  },original);
  await stale.route('**/petquiz-settings.json*',route=>
   route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({...original,quizEnabled:false,answerKeyEnabled:true})}));
  const ap=await stale.newPage();
  ap.on('pageerror',e=>errors.push('Admin stale '+e.message));
  await ap.goto(origin+'/admin.html');
  await ap.waitForFunction(()=>!!window.TinkerPETAdmin,{timeout:8000});
  const opts=await ap.evaluate(()=>window.TinkerPETAdmin.getSettings());
  assert.equal(opts.quizEnabled,false,'Respeitar PETQuiz bloqueado no publicado');
  assert.equal(opts.answerKeyEnabled,true,'Gabarito liberado não pode herdar bloqueio antigo');
  await stale.close();
 }
 console.log('PASS admin: rascunho antigo não muda outro bloqueio');

 const allowed=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await allowed.route('**/petquiz-settings.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...original,quizEnabled:true,answerKeyEnabled:true})}));
 const allowedPage=await allowed.newPage();
 await allowedPage.goto(origin+'/projects.html');
 await allowedPage.locator('#openGate').click();
 await allowedPage.waitForURL(/gabarito\.html/,{timeout:8000});
 assert(await allowedPage.locator('#chooser').isVisible(),'Gabarito liberado abre sem senha');
 await allowedPage.goto(origin+'/gabarito.html');
 assert(await allowedPage.locator('#chooser').isVisible(),'Link direto abre gabarito liberado');
 await allowed.close();
 console.log('PASS acesso: gabarito aberto sem pedir senha, pelo menu e por link direto');
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
