/* Teste do PETQuiz: 5s leitura, 20s respostas, bônus surpresa sem pontos.
   Exercita a partida inteira em desktop, tablet e celulares. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!(file===root||file.startsWith(root+'/')))return res.writeHead(403).end();
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(readFileSync(file));
 }catch{return res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
mkdirSync('test-results',{recursive:true});
const screens=[
 {name:'pc',width:1366,height:800,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'celular-vertical',width:390,height:844,touch:true},
 {name:'celular-horizontal',width:844,height:390,touch:true}
];
async function phase(page,name,timeout=8000){
 await page.waitForFunction(n=>window.PetQuiz?.getStatus().phase===n,name,{timeout});
}
async function fill(page,id,v){
 await page.locator('#'+id).evaluate((el,value)=>{
  el.value=String(value);
  el.dispatchEvent(new Event('input',{bubbles:true}));
 },v);
}
try{
 // Uma verificação com o TEMPO REAL, sem aceleração de testes.
 const real=await browser.newContext({viewport:{width:1280,height:760}});
 const realPage=await real.newPage();
 await realPage.goto(base+'/petquiz.html',{waitUntil:'domcontentloaded'});
 assert(await realPage.locator('#introScreen').isVisible());
 await realPage.locator('#startQuiz').click();
 assert.equal(await realPage.locator('#answersWrap').isVisible(),false,'As alternativas não podem aparecer junto com a pergunta');
 assert.equal(await realPage.locator('#timerValue').textContent(),'5','Contagem inicial deve ser 5 segundos');
 await realPage.waitForTimeout(1700);
 assert.equal(await realPage.locator('#answersWrap').isVisible(),false,'As alternativas devem esperar 5 segundos');
 await phase(realPage,'answer',6000);
 assert.equal(await realPage.locator('.answer-btn').count(),4,'Quatro alternativas devem aparecer depois de 5s');
 const readElapsed=await realPage.evaluate(()=>({phase:window.PetQuiz.getStatus().phase,limit:document.querySelector('#timerValue').textContent}));
 assert(Number(readElapsed.limit)<=20&&Number(readElapsed.limit)>=18,'A contagem de resposta deveria começar em 20s');
 await real.close();
 console.log('✓ PETQuiz tempos reais: leitura de 5s antes das alternativas, depois resposta de 20s.');

 for(const screen of screens){
  const context=await browser.newContext({viewport:{width:screen.width,height:screen.height},
   isMobile:screen.touch,hasTouch:screen.touch,deviceScaleFactor:1});
  await context.addInitScript(()=>{window.__PETQUIZ_TEST_SPEED__=true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/petquiz.html',{waitUntil:'domcontentloaded'});
  assert(await page.locator('#introScreen').isVisible());
  const menu=await context.newPage();await menu.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await menu.locator('#openPetQuiz').count(),1,'PETQuiz deve estar no menu Meus circuitos');
  assert((await menu.locator('#openPetQuiz').getAttribute('href')).includes('petquiz.html'));
  await menu.close();
  await page.locator('#startQuiz').click();
  // O quiz deve poder ser abandonado em qualquer fase, mesmo antes das opções.
  assert.equal(await page.locator('#quitQuiz').isVisible(),true,'Desistir precisa aparecer na partida');
  await page.locator('#quitQuiz').click();
  assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().phase),'intro','Desistir deve encerrar a partida');
  assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().score),0,'Desistir deve apagar pontos');
  assert.equal(await page.locator('#introScreen').isVisible(),true,'Desistir deve voltar para o início');
  assert.equal(await page.evaluate(()=>localStorage.getItem('petquiz-session-v1')),null,'Não pode existir salvamento da partida');
  // Mesmo saindo por um link e voltando pelo histórico, a partida não é restaurada.
  await page.locator('#startQuiz').click();
  await page.locator('.back-link').click();
  await page.goBack({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().phase),'intro','Voltar à página deve reabrir início');
  await page.locator('#startQuiz').click();
  let questionResults=0,bonusCount=0,timeoutCount=0,bonusSuccess=0,loop=0;
  while(loop++<100){
   const data=await page.evaluate(()=>window.PetQuiz.getStatus());
   if(data.phase==='finished')break;
   if(data.phase==='read'){
    assert.equal(await page.locator('#answersWrap').isVisible(),false,'Leitura deve ocultar alternativas');
    await phase(page,'answer',4000);
   }else if(data.phase==='answer'){
    if(questionResults===3){
     // Uma resposta sem marcar também deve ser contabilizada ao final do tempo.
     await phase(page,'result',5000);timeoutCount++;
    }else{
     await page.locator('.answer-btn').first().click();
     await phase(page,'result',3500);
    }
   }else if(data.phase==='result'){
    const scoreBefore=await page.evaluate(()=>window.PetQuiz.getStatus().score);
    assert(scoreBefore>=0,'Pontuação nunca é negativa');
    assert(await page.locator('#answerFeedback').isVisible(),'Feedback precisa explicar a resposta');
    assert((await page.locator('#feedbackExplanation').textContent()).length>=25,'Uma explicação deve acompanhar a alternativa');
    questionResults++;
    await page.locator('#nextQuestion').click();
   }else if(data.phase==='bonus'){
    bonusCount++;
    assert.equal((await page.locator('#bonusView').isVisible()),true,'Evento surpresa precisa aparecer');
    assert.equal(await page.locator('#quitQuiz').isVisible(),true,'Desistir também precisa aparecer no bônus');
    assert((await page.locator('.bonus-label').textContent()).includes('0 PONTO'));
    const beforeScore=data.score;
    if(bonusCount===2){
     await page.locator('#bonusSkip').click();
    }else{
     const title=(await page.locator('#bonusTitle').textContent()).toLowerCase();
     if(title.includes('lm2596'))await fill(page,'bonusVoltage',5);
     else if(title.includes('esquerda')){await fill(page,'bonusA',20);await fill(page,'bonusB',70)}
     else{await fill(page,'bonusA',50);await fill(page,'bonusB',50)}
     await page.locator('#bonusTry').click();
     await phase(page,'bonusResult',2000);
     bonusSuccess++;
     assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().score),beforeScore,'Bônus não pode pontuar');
     await phase(page,'read',5000);
    }
    assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().score),beforeScore,'Bônus não muda a pontuação');
   }else if(data.phase==='bonusResult'){
    await phase(page,'read',5000);
   }else throw new Error('Fase inesperada '+data.phase);
  }
  assert(loop<100,'Quiz não terminou após 12 questões');
  const result=await page.evaluate(()=>window.PetQuiz.getStatus());
  assert.equal(result.phase,'finished');
  assert.equal(result.correct+result.wrong+result.timeout,12,'Todas as perguntas precisam ser contabilizadas');
  assert.equal(result.timeout,1,'Pergunta sem resposta deveria contar como timeout');
  assert(bonusCount>=2&&bonusCount<=3,'Devem existir dois ou três bônus aleatórios');
  assert.equal(result.bonusCount,bonusCount,'Todos os eventos devem aparecer na contagem final');
  assert.equal(result.bonusSolved,bonusSuccess);
  assert.equal(await page.locator('#finalBonus').textContent(),String(bonusCount));
  assert.equal(await page.locator('#finalScore').textContent(),result.score.toLocaleString('pt-BR'));
  const sizes=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(sizes.doc<=sizes.viewport+3,'Não pode haver rolagem horizontal: '+JSON.stringify(sizes));
  await page.screenshot({path:'test-results/petquiz-'+screen.name+'.png',fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().phase),'intro','O quiz não deve guardar progresso após atualizar');
  assert.equal(await page.locator('#introScreen').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.PetQuiz.getStatus().score),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('petquiz-session-v1')),null);
  assert.equal(errors.length,0,'Erros JavaScript: '+errors.join('; '));
  console.log('✓ '+screen.name+': 12 perguntas, 5s leitura, bônus sem pontos, resultado e retorno ao início sem salvamento.');
  await context.close();
 }
 console.log('✓ PETQuiz: verificação concluída.');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
