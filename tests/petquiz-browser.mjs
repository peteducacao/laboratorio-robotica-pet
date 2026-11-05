/* PETQuiz v2: banco vinculado, 10 questões, sons, avanço automático, fullscreen e responsividade. */
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
const bonusMarkup=readFileSync(resolve(root,'petquiz.html'),'utf8');
const bonusScript=readFileSync(resolve(root,'petquiz.js'),'utf8');
assert(!bonusMarkup.includes('class="bonus-target"'),'O desafio não deve mostrar objetivo de 5 V');
const lmBonus=bonusScript.match(/id:'regulator',title:'([^']+)',prompt:'([^']+)',voltage:true/);
assert(lmBonus,'O bônus LM2596 precisa existir');
assert.equal(lmBonus[1],'Regule o LM2596!');
assert(!/5\s*V|5,0\\s*V/.test(lmBonus[1]+' '+lmBonus[2]),'O enunciado não pode entregar a regulagem');
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
mkdirSync('test-results',{recursive:true});
const screens=[
 {name:'desktop',width:1366,height:800,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'celular-vertical',width:390,height:844,touch:true},
 {name:'celular-horizontal',width:844,height:390,touch:true}
];
const answers={
 'componente-fora':'Sensor ultrassônico',
 'componente-ponte':'Ponte H',
 'componente-lm2596':'LM2596',
 'componente-gangorra':'Chave gangorra',
 'componente-jumper':'Jumper',
 'componente-esp32':'ESP32',
 'componente-motor':'Motor DC',
 'componente-rodas':'Permitir o deslocamento',
 'componente-bateria':'Uma bateria de 9 V',
 'componente-pilhas':'Para alimentar os motores',
 'funcionamento-alimentacao-ponte':'A alimentação das pilhas AA',
 'funcionamento-motor-a':'As conexões do Motor A',
 'funcionamento-seguir-reto':'Igualar as velocidades',
 'funcionamento-lm':'Reduzir a saída até 5 V',
 'funcionamento-esquerda':'A direita mais rápida',
 'funcionamento-duas-chaves':'O ESP32 pode ligar',
 'funcionamento-bateria-9v':'Bateria → gangorra → LM2596',
 'funcionamento-chave-off':'Ligar a gangorra responsável',
 'funcionamento-curva-direita':'Para a direita'
};
function validatePlan(plan){
 assert.equal(plan.length,10,'Uma rodada tem exatamente 10 questões');
 assert.equal(new Set(plan.map(x=>x.id)).size,10,'Sem perguntas duplicadas');
 assert.equal(plan.filter(x=>x.stage==='concept').length,5);
 assert.equal(plan.filter(x=>x.stage==='practice').length,5);
 const introduced=new Set();
 for(const q of plan){
  if(q.stage==='practice')for(const required of q.requires)
   assert(introduced.has(required),q.id+' veio antes de '+required);
  if(q.stage==='concept')introduced.add(q.topic);
 }
}
async function phase(page,expected,timeout=9000){
 await page.waitForFunction(p=>window.PetQuiz?.getStatus().phase===p,expected,{timeout});
}
async function fill(page,id,value){
 await page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}))},value);
}
async function layout(page,label){
 const v=await page.evaluate(()=>{
  const vp=innerWidth,doc=document.documentElement.scrollWidth;
  const objects=['#gameScreen','.question-banner','.game-hud','.answers-grid','#introScreen'];
  return {vp,doc,items:objects.map(x=>{
   const el=document.querySelector(x);if(!el||el.hidden||el.getClientRects().length===0)return null;
   const r=el.getBoundingClientRect();
   return {name:x,left:r.left,right:r.right,width:r.width};
  }).filter(Boolean),fullscreen:!!document.fullscreenElement,
   fullScroll:document.querySelector('#main').scrollHeight,
   fullHeight:document.querySelector('#main').clientHeight,
   fullOverflow:getComputedStyle(document.querySelector('#main')).overflowY};
 });
 assert(v.doc<=v.vp+4,label+' scroll horizontal '+JSON.stringify(v));
 for(const item of v.items){
  assert(item.left>=-4&&item.right<=v.vp+4,label+' lateral cortada: '+JSON.stringify(item));
 }
 if(v.fullscreen&&v.fullScroll>v.fullHeight+6)
  assert(['auto','scroll'].includes(v.fullOverflow),'Fullscreen deve permitir rolar conteúdo alto: '+JSON.stringify(v));
}


/* Verificação visual: largura real dos cards, títulos e rotação da abertura. */
async function validateIntro(page,label){
 const v=await page.evaluate(()=>{
  const intro=document.querySelector('#introScreen'),grid=document.querySelector('.intro-rules');
  const cards=[...grid.children].map(el=>{
   const r=el.getBoundingClientRect(),b=el.querySelector('b');
   return {width:r.width,left:r.left,right:r.right,
    boldScroll:b.scrollWidth,boldClient:b.clientWidth};
  });
  const g=grid.getBoundingClientRect(),gap=parseFloat(getComputedStyle(grid).columnGap);
  const btn=document.querySelector('#startQuiz').getBoundingClientRect();
  const title=document.querySelector('#introTitle').getBoundingClientRect();
  return {vp:innerWidth,vh:innerHeight,bodyScroll:getComputedStyle(document.body).overflowY,
   intro:{width:intro.getBoundingClientRect().width,scrollWidth:intro.scrollWidth},
   gridWidth:g.width,gap,cards,btn:{width:btn.width,left:btn.left,right:btn.right},
   title:{left:title.left,right:title.right},pageHeight:document.documentElement.scrollHeight};
 });
 const expected=(v.gridWidth-v.gap)/2;
 assert.equal(v.cards.length,3,label+' exige três cards');
 for(const [i,c] of v.cards.entries()){
  const min=i===2?v.gridWidth*.92:expected*.92;
  assert(c.width>=min,label+' card '+i+' estreito: '+JSON.stringify({min,actual:c.width,all:v}));
  assert(c.boldScroll<=c.boldClient+2,label+' texto do card '+i+' cortado: '+JSON.stringify(v));
  assert(c.left>=-3&&c.right<=v.vp+3,label+' card '+i+' extrapola a tela');
 }
 if(v.vp<=980)assert(v.btn.width>=Math.min(v.gridWidth*.8,260),label+' botão estreito');
 assert(v.btn.left>=-3&&v.btn.right<=v.vp+3,label+' botão fora da tela');
 assert(v.title.left>=-3&&v.title.right<=v.vp+3,label+' título fora da tela');
 assert(v.pageHeight<=v.vh+5||v.bodyScroll!=='hidden',label+' rolagem vertical indisponível');
 // Elementos decorativos (círculos e ondas) extrapolam o contêiner intencionalmente.
 // Título, três cards e botão são medidos individualmente acima.
 return v;
}

try{
 // Testar tempos REAIS uma vez, sem acelerar.
 const context=await browser.newContext({viewport:{width:1280,height:760}});
 const page=await context.newPage();
 await page.goto(base+'/petquiz.html',{waitUntil:'domcontentloaded'});
 assert.match(await page.locator('#introTitle').textContent(),/PETQuiz/);
 assert.equal(await page.locator('.header-label').count(),0,'Sem título PETQuiz duplicado no topo');
 await page.locator('#startQuiz').click();
 assert.equal(await page.locator('#answersWrap').isVisible(),false,'Alternativas ficam escondidas durante leitura');
 assert.equal(await page.locator('#timerValue').textContent(),'5');
 await page.waitForTimeout(1400);
 assert.equal(await page.locator('#answersWrap').isVisible(),false);
 await phase(page,'answer',6000);
 assert.equal(await page.locator('.answer-btn').count(),4);
 const t=Number(await page.locator('#timerValue').textContent());
 assert(t>=18&&t<=20,'A resposta tem 20 segundos: '+t);
 const status=await page.evaluate(()=>window.PetQuiz.getStatus());
 validatePlan(status.plan);
 await context.close();
 console.log('✓ Tempos reais: 5 s apenas pergunta, depois 20 s com quatro alternativas.');

 for(const screen of screens){
  const ctx=await browser.newContext({viewport:{width:screen.width,height:screen.height},
   isMobile:screen.touch,hasTouch:screen.touch,deviceScaleFactor:1});
  await ctx.addInitScript(()=>{window.__PETQUIZ_TEST_SPEED__=true});
  const p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/petquiz.html',{waitUntil:'domcontentloaded'});
  assert.equal(await p.locator('.intro-rules>div').count(),3);
  await layout(p,'abertura '+screen.name);
  await validateIntro(p,'abertura '+screen.name);
  await p.screenshot({path:'test-results/petquiz-'+screen.name+'-abertura.png',fullPage:true});
  if(screen.name==='celular-vertical'){
   // A mesma página deve sobreviver à rotação Android sem preservar scroll antigo.
   await p.evaluate(()=>window.scrollTo(0,350));
   await p.setViewportSize({width:844,height:390});
   await p.waitForTimeout(360);
   await validateIntro(p,'rotação para horizontal');
   assert.equal(await p.evaluate(()=>scrollY),0,'Ao girar para horizontal deve voltar ao topo');
   await p.screenshot({path:'test-results/petquiz-girado-horizontal.png',fullPage:true});
   await p.setViewportSize({width:390,height:844});
   await p.waitForTimeout(360);
   await validateIntro(p,'rotação de volta para vertical');
   await p.screenshot({path:'test-results/petquiz-girado-vertical.png',fullPage:true});
  }
  if(screen.name==='desktop'){
   // Repetir a seleção confirma variações de combinação e dependências.
   const layouts=new Set();
   for(let k=0;k<22;k++){
    const plan=(await p.evaluate(()=>window.PetQuiz.getStatus())).plan;
    validatePlan(plan);layouts.add(plan.map(x=>x.id).join('|'));
    await p.reload({waitUntil:'domcontentloaded'});
   }
   assert(layouts.size>=12,'O sorteio das perguntas não pode ser fixo');
  }

  const menu=await ctx.newPage();await menu.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await menu.locator('#openPetQuiz').count(),1);
  assert.equal(await menu.locator('#openPetQuiz').isVisible(),true);
  await menu.close();

  await p.locator('#startQuiz').click();
  assert.equal(await p.locator('#quitQuiz').isVisible(),true);
  await p.locator('#soundToggle').click();
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().soundEnabled),false);
  await p.locator('#soundToggle').click();
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().soundEnabled),true);
  await p.locator('#fullscreenToggle').click();
  await p.waitForTimeout(100);
  await layout(p,'tela cheia '+screen.name);
  const fullscreenSupported=await p.evaluate(()=>!!document.fullscreenElement);
  if(fullscreenSupported){
   assert.equal(await p.locator('#fullscreenToggle').getAttribute('aria-pressed'),'true');
   await p.locator('#fullscreenToggle').click();
   await p.waitForTimeout(80);
   assert.equal(await p.evaluate(()=>document.fullscreenElement),null);
  }
  // Desistir logo no início: mostrar um placar parcial de zero, sem reiniciar.
  await p.locator('#quitQuiz').click();
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().phase),'finished');
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().finishedReason),'quit');
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().score),0);
  assert.equal(await p.locator('#finalView').isVisible(),true);
  assert.equal(await p.locator('#finalTitle').textContent(),'Partida encerrada');
  assert.equal(await p.locator('#finalScore').textContent(),'0');
  assert.match(await p.locator('#finalProgress').textContent(),/0 de 10/);
  assert.equal(await p.locator('#quitQuiz').isVisible(),false);
  assert.equal(await p.evaluate(()=>localStorage.getItem('petquiz-session-v1')),null);
  // Recomeçar limpa a partida anterior e permite acumular pontos de novo.
  await p.locator('#playAgain').click();
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().phase),'read');
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().score),0);
  await phase(p,'answer',3500);
  const first=(await p.evaluate(()=>window.PetQuiz.getStatus())).plan[0];
  const gabarito=answers[first.id];
  const firstOptions=await p.locator('.answer-btn').allTextContents();
  const rightIndex=firstOptions.findIndex(t=>t.includes(gabarito));
  assert(rightIndex>=0,'Gabarito da primeira questão não encontrado');
  await p.locator('.answer-btn').nth(rightIndex).click();
  await phase(p,'result',1200);
  const earned=(await p.evaluate(()=>window.PetQuiz.getStatus())).score;
  assert(earned>0,'Uma resposta correta deve somar pontos antes da desistência');
  await p.locator('#quitQuiz').click();
  const partial=await p.evaluate(()=>window.PetQuiz.getStatus());
  assert.equal(partial.phase,'finished','Ao desistir deve mostrar o resultado parcial');
  assert.equal(partial.finishedReason,'quit');
  assert.equal(partial.score,earned,'Não perder a pontuação acumulada');
  assert.equal(partial.correct,1,'Um acerto deve permanecer no placar');
  assert.equal(partial.answered,1,'Pergunta não terminada não deve ser contabilizada');
  assert.equal(await p.locator('#finalScore').textContent(),earned.toLocaleString('pt-BR'));
  assert.equal(await p.locator('#finalCorrect').textContent(),'1');
  assert.match(await p.locator('#finalProgress').textContent(),/1 de 10/);
  await p.waitForTimeout(1200); // O avanço automático anterior não pode voltar a agir.
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().phase),'finished');
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().score),earned);
  await p.locator('.back-link').click();
  await p.goBack({waitUntil:'domcontentloaded'});
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().phase),'intro',
   'Navegar para fora continua sem salvar progresso');
  await p.locator('#startQuiz').click();
  const plan=(await p.evaluate(()=>window.PetQuiz.getStatus())).plan;
  validatePlan(plan);
  let answered=0,bonusCount=0,wrong=0,correct=0,timeouts=0;
  let iterations=0;
  while(iterations++<130){
   const st=await p.evaluate(()=>window.PetQuiz.getStatus());
   if(st.phase==='finished')break;
   if(st.phase==='read'){
    assert.equal(await p.locator('#answersWrap').isVisible(),false);
    await phase(p,'answer',3500);
   }else if(st.phase==='answer'){
    const q=plan[st.index],key=answers[q.id];
    assert(key,'Faltou gabarito para '+q.id);
    if(answered===3){await phase(p,'result',4500);timeouts++;}
    else{
     const buttons=p.locator('.answer-btn');
     const count=await buttons.count();assert.equal(count,4);
     const labels=await buttons.allTextContents();
     let correctIndex=labels.findIndex(t=>t.includes(key));
     assert(correctIndex>=0,'Gabarito não encontrado: '+q.id+' '+JSON.stringify(labels));
     const intentionallyWrong=answered===1;
     const target=intentionallyWrong?(correctIndex+1)%4:correctIndex;
     await buttons.nth(target).click();
     await phase(p,'result',1500);
     if(intentionallyWrong)wrong++;else correct++;
    }
    assert.equal(await p.locator('#answerFeedback').isVisible(),true,'Feedback após resposta');
    assert.equal(await p.locator('#nextQuestion').isVisible(),false,'Avanço automático sem botão');
    assert((await p.locator('#feedbackExplanation').textContent()).length>20);
    assert.equal(await p.locator('.answer-btn.correct').count(),1,'Marcar resposta correta no resultado');
    if(answered===0)await p.screenshot({path:'test-results/petquiz-'+screen.name+'-correcao.png',fullPage:true});
    answered++;
    await p.waitForFunction((previous)=>{
     const x=window.PetQuiz.getStatus();
     return x.index>previous||['bonus','bonusResult','finished'].includes(x.phase);
    },st.index,{timeout:4500});
   }else if(st.phase==='bonus'){
    bonusCount++;
    assert.equal(await p.locator('#quitQuiz').isVisible(),true,'Desistir no bônus');
    if(bonusCount===2){await p.locator('#bonusSkip').click();}
    else{
     const title=(await p.locator('#bonusTitle').textContent()).toLowerCase();
     if(title.includes('lm2596')){
      assert.equal(await p.locator('.bonus-target').count(),0,'Sem objetivo visível no LM2596');
      assert.equal(await p.locator('#bonusTitle').textContent(),'Regule o LM2596!');
      assert(!/5\s*V/.test(await p.locator('#bonusPrompt').textContent()),'Sem resposta no enunciado');
      await fill(p,'bonusVoltage',5);
     }
     else if(title.includes('esquerda')){await fill(p,'bonusA',20);await fill(p,'bonusB',70)}
     else{await fill(p,'bonusA',50);await fill(p,'bonusB',50)}
     await p.locator('#bonusTry').click();
     await phase(p,'bonusResult',2000);
    }
   }else if(st.phase==='bonusResult')await phase(p,'read',3000);
   else if(st.phase==='result'){
    // Phase de resultado é avançada automaticamente, mesmo após erro/timeout.
    await p.waitForFunction((previous)=>{
     const x=window.PetQuiz.getStatus();
     return x.index>previous||['bonus','bonusResult','finished'].includes(x.phase);
    },st.index,{timeout:4500});
   }else throw Error('Fase inesperada '+st.phase);
  }
  assert(iterations<130,'Partida não chegou ao resultado');
  const final=await p.evaluate(()=>window.PetQuiz.getStatus());
  assert.equal(final.phase,'finished');
  assert.equal(final.finishedReason,null,'Concluir as dez questões não é desistência');
  assert.equal(await p.locator('#finalTitle').textContent(),'Parabéns!');
  assert.match(await p.locator('#finalProgress').textContent(),/10 de 10/);
  assert.equal(final.questionTotal,10);
  assert.equal(final.correct+final.wrong+final.timeout,10);
  assert.equal(final.correct,correct);assert.equal(final.wrong,wrong);assert.equal(final.timeout,timeouts);
  assert(final.score<=10000&&final.score>=correct*500,'Pontuação de velocidade');
  assert.equal(bonusCount,2,'Exatamente dois bônus fora das dez perguntas');
  assert.equal(final.bonusCount,2,'O placar deve confirmar dois bônus');
  assert.equal(await p.locator('#finalBonus').textContent(),'2','Resumo final inclui os dois bônus');
  assert.equal(await p.locator('#finalCorrect').textContent(),String(correct));
  assert.equal(await p.locator('#finalWrong').textContent(),String(wrong));
  await layout(p,'final '+screen.name);
  await p.screenshot({path:'test-results/petquiz-'+screen.name+'-final.png',fullPage:true});
  await p.reload({waitUntil:'domcontentloaded'});
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().phase),'intro');
  assert.equal(await p.evaluate(()=>window.PetQuiz.getStatus().score),0);
  assert.equal(await p.evaluate(()=>localStorage.getItem('petquiz-session-v1')),null);
  assert.equal(errors.length,0,'Erros JS: '+errors.join(' / '));
  console.log('✓ '+screen.name+': 10 perguntas vinculadas, sons, fullscreen='+fullscreenSupported+', correção e avanço automáticos, 2 bônus fixos em posições aleatórias, pódio e sem salvamento.');
  await ctx.close();
 }
 console.log('✓ PETQuiz: verificações aprovadas.');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
