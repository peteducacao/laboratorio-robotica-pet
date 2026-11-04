import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const host='http://127.0.0.1:8738';
const server=spawn('python3',['-m','http.server','8738','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage']});
const sizes=[
 {name:'pc',width:1366,height:768,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'celular-horizontal',width:844,height:390,touch:true},
 {name:'celular-vertical',width:390,height:844,touch:true}
];
const errors=[];
try{
 await wait(800);
 const projects=readFileSync('projects.html','utf8');
 assert(projects.includes('href="missao-robotica.html"'),'PETGame sumiu de Meus circuitos');
 for(const size of sizes){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:size.touch,hasTouch:size.touch,deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(size.name+': '+e.message));
  await page.goto(host+'/missao-robotica.html',{waitUntil:'domcontentloaded'});
  assert(await page.locator('#authOverlay').isVisible(),'acesso deve ser protegido');
  await page.locator('#password').fill('senha-errada');
  await page.locator('#authForm button[type="submit"]').click();
  assert(await page.locator('#authOverlay').isVisible(),'senha errada não pode liberar');
  await page.locator('#password').fill('peteducacao');
  await page.locator('#authForm button[type="submit"]').click();
  assert(await page.locator('#startOverlay').isVisible(),'entrada deve abrir apresentação');
  await page.waitForFunction(()=>window.__TinkerpetMission?.state.ready,{timeout:60000});
  assert.equal(await page.locator('#startBtn').isEnabled(),true);
  assert.equal(await page.locator('#pauseTestBtn').count(),0,'menu de testes não deve existir');
  assert.equal(await page.locator('#testSummaryOverlay').count(),0,'resumo de testes não deve existir');
  assert.equal(await page.locator('#playBtn').count(),0,'início deve ser único');
  await page.screenshot({path:'artifacts/petgame-inicio-'+size.name+'.png'});
  await page.locator('#startBtn').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','início deve entrar na aventura normal');
  assert.equal(await page.locator('#questionOverlay').isVisible(),false,'rodada de teste não pode surgir');
  assert.equal(await page.locator('#stageProgress').textContent(),'Desafios desta fase: 0/3','fase inicial exige 3 desafios');
  const stages=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,plan=a.state.stageChallenges;
   return{counts:plan.map(p=>p.filter(s=>s.kind==='question').length),
    fixes:plan.map(p=>p.filter(s=>s.kind==='repair').length),
    questionIds:plan.flat().filter(s=>s.kind==='question').map(s=>s.index)}
  });
  assert.deepEqual(stages.counts,[2,3,2,3],'dez perguntas devem estar divididas entre as quatro fases');
  assert.deepEqual(stages.fixes,[1,1,1,1],'cada fase deve ter um diagnóstico obrigatório');
  assert.equal(new Set(stages.questionIds).size,10,'perguntas não devem repetir entre fases');
  // O modo de direção voltou a ter um motor para cada controle.
  const motors=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   s.drive.collided=false;s.pointer=['touch-A',null];s.pointerValue=[175,0];
   const one=a.commands();
   s.pointer=['touch-A','touch-B'];s.pointerValue=[190,120];
   const two=a.commands();
   s.pointer=[null,null];s.pointerValue=[0,0];
   return{one,two}
  });
  assert.deepEqual(motors.one,[175,0],'um controle não pode acelerar o outro motor');
  assert.deepEqual(motors.two,[190,120],'controles A e B devem permanecer independentes');
  assert(await page.locator('#minimap').isVisible(),'minimapa não apareceu');
  const canvas=await page.locator('#miniCanvas').evaluate(el=>({width:el.width,height:el.height}));
  assert(canvas.width>=200&&canvas.height>=200,'minimapa com resolução insuficiente');
  await page.locator('#minimapToggle').click();
  assert.equal(await page.locator('#miniCanvas').isVisible(),false,'recolher minimapa não funcionou');
  await page.locator('#minimapToggle').click();
  assert(await page.locator('#miniCanvas').isVisible(),'expandir minimapa não funcionou');
  const sfx=await page.locator('#soundBtn').getAttribute('aria-pressed');
  assert.equal(sfx,'false','som deve vir desligado por padrão');
  await page.locator('#soundBtn').click();
  assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true','som não ativou');
  await page.locator('#soundBtn').click();
  assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false','som não desligou');
  assert(await page.locator('#runTimer').isVisible(),'cronômetro precisa estar na missão');
  await page.evaluate(()=>{window.__TinkerpetMission.state.activeSince-=63000});
  await page.locator('#pauseBtn').click();
  const paused=await page.locator('#runTimer').textContent();
  assert(paused.includes('01:03'),'tempo da aventura não foi contabilizado: '+paused);
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#runTimer').textContent(),paused,'cronômetro deve parar na pausa');
  await page.locator('#resumeBtn').click();
  const rules=await page.evaluate(()=>({n:window.__TinkerpetMission.questions.length,q:window.__TinkerpetMission.questions.map(q=>q[0])}));
  assert.equal(rules.n,10,'esperadas dez perguntas revisadas');
  assert(rules.q.every(q=>q.length<100&&!/GPIO|192\.168|pararTudo\(/i.test(q)),'perguntas não devem cobrar pinos ou código');
  const state3d=await page.evaluate(()=>({loaded:!!window.__TinkerpetMission.world.renderer,route:window.__TinkerpetMission.world.routePoints.length,batched:window.__TinkerpetMission.world.staticStats?.batchSavings||0}));
  assert(state3d.loaded&&state3d.route>=2&&state3d.batched>0,'cidade texturizada ou GPS não carregou');
  const scenery=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,w=a.world;
   return{sky:!!w.sky,clouds:w.clouds.length,sun:!!w.sunDisc,
    tires:w.wheels.map(w=>w.mesh.geometry.parameters.radiusTop),
    streets:[[-50,13],[-30,3],[10,-22],[50,4]].map(p=>a.collides(p[0],p[1]))};
  });
  assert(scenery.sky&&scenery.sun&&scenery.clouds>=5,'céu com sol e nuvens não carregou');
  assert(scenery.tires.length===4&&scenery.tires.every(r=>r<=.34),'pneus continuam grandes');
  assert(scenery.streets.every(x=>!x),'cones e caixas ainda bloqueiam a pista');
  const city=await page.evaluate(()=>({
   moving:window.__TinkerpetMission.world.ambientMovers.length,
   drawSaving:window.__TinkerpetMission.world.staticStats.batchSavings
  }));
  assert(city.moving>=1&&city.drawSaving>30,'cenário não tem detalhes ou otimização estática');
  for(const [x,z,area] of [[35,35,'FÁBRICA'],[-35,35,'LABORATÓRIO'],[35,-35,'ESCOLA'],[-35,-35,'PARQUE']]){
   const label=await page.evaluate(({x,z})=>{const a=window.__TinkerpetMission;a.state.drive.x=x;a.state.drive.z=z;a.physics(.12);return document.querySelector('#districtName').textContent},{x,z});
   assert(label.includes(area),'cor / identificação incorreta da área '+area+': '+label);
  }
  await page.evaluate(()=>{const a=window.__TinkerpetMission;a.resetGame();a.state.mode='drive';a.beginQuestion()});
  assert(await page.locator('#questionOverlay').isVisible(),'pergunta principal não apareceu');
  assert.equal(await page.locator('.answer').count(),4,'pergunta exige quatro alternativas');
  await page.evaluate(()=>{
   const a=window.__TinkerpetMission,q=a.questions[a.state.activeQuestion],wrong=q[1].find(t=>t!==q[1][q[2]]);
   const btn=[...document.querySelectorAll('.answer')].find(el=>el.textContent.includes(wrong));
   if(!btn)throw Error('Alternativa incorreta não encontrada');btn.click()
  });
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),1,'erro de pergunta não contabilizado');
  assert.equal(await page.locator('#questionOverlay').isVisible(),true,'erro não deve sair da pergunta atual');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.activeQuestion),await page.evaluate(()=>window.__TinkerpetMission.state.asked.at(-1)),'erro não pode sortear outra pergunta');
  await page.screenshot({path:'artifacts/petgame-pergunta-'+size.name+'.png'});
  await page.evaluate(()=>{const a=window.__TinkerpetMission,q=a.questions[a.state.activeQuestion],txt=q[1][q[2]];const b=[...document.querySelectorAll('.answer')].find(el=>el.textContent.includes(txt));if(!b)throw Error('Resposta não encontrada');b.click()});
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','acerto deve voltar à avenida');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreCorrect),1,'acerto de pergunta não contabilizado');
  await page.evaluate(()=>window.__TinkerpetMission.beginRepair());
  assert(await page.locator('#repairOverlay').isVisible(),'oficina principal não apareceu');
  assert.equal(await page.locator('.diagnostic-card').count(),4,'diagnóstico exige 4 ícones');
  const imgs=await page.locator('.diagnostic-card img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')));
  assert(imgs.every(src=>src?.startsWith('assets/component-preview/')),'ícones do carrinho inválidos');
  const fault=await page.evaluate(()=>window.__TinkerpetMission.state.fault);
  assert(fault.answer&&fault.prompt,'não existe falha sorteada');
  const wrong=fault.options.find(x=>x!==fault.answer);
  const started=await page.evaluate(()=>window.__TinkerpetMission.state.challengeEnd);
  await page.locator('.diagnostic-card[data-diagnostic="'+wrong+'"]').click();
  assert.equal(await page.locator('.diagnostic-card.wrong').count(),1,'erro deve aparecer na imagem escolhida');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),2,'erro de diagnóstico não contabilizado');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.challengeEnd),started,'erro não pode reiniciar o relógio');
  await page.screenshot({path:'artifacts/petgame-diagnostico-'+size.name+'.png'});
  await page.locator('.diagnostic-card[data-diagnostic="'+fault.answer+'"]').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','acerto de diagnóstico deve voltar à missão');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreCorrect),2,'acerto de diagnóstico não contabilizado');
  await page.evaluate(()=>window.__TinkerpetMission.beginRepair());
  await page.locator('#diagnosticClose').click();
  assert(await page.locator('#quitChallengeDialog').evaluate(e=>e.open),'sair do desafio exige confirmação');
  await page.locator('#quitCancel').click();
  assert(await page.locator('#repairOverlay').isVisible(),'cancelar saída deve manter o desafio');
  await page.locator('#diagnosticClose').click();
  await page.locator('#quitConfirm').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.lives),2,'abandonar desafio deve perder uma vida');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),3,'desafio abandonado deve aparecer no relatório');
  // Garante que nem um salto direto ao destino permita escapar dos desafios.
  const walkthrough=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';
   const phases=[],shown=[],expected=[2,3,2,3];
   let wrongRetainsQuestion=false;
   for(let phase=0;phase<4;phase++){
    const firstGoal=a.missions[phase].to;
    s.drive.x=firstGoal[0];s.drive.z=firstGoal[1];a.physics(.016);
    if(s.mode==='delivery')throw Error('Entrega '+(phase+1)+' ignorou desafios pendentes');
    let countQ=0,countD=0,guard=0;
    while(s.mode!=='delivery'){
     if(++guard>15)throw Error('Desafios não terminam na fase '+(phase+1));
     if(s.mode==='question'){
      const idx=s.activeQuestion,q=a.questions[idx],correct=q[1][q[2]],options=[...document.querySelectorAll('.answer')];
      if(phase===0&&!wrongRetainsQuestion){
       const wrong=options.find(b=>!b.textContent.includes(correct));
       if(!wrong)throw Error('Alternativa errada não localizada');
       wrong.click();
       if(s.activeQuestion!==idx||s.mode!=='question'||s.scoreWrong!==1)throw Error('Erro mudou a pergunta atual');
       wrongRetainsQuestion=true;
      }
      const btn=options.find(b=>b.textContent.includes(correct));
      if(!btn)throw Error('Resposta correta indisponível');
      btn.click();shown.push(idx);countQ++;
     }else if(s.mode==='repair'){
      a.chooseDiagnostic(s.fault.answer,document.createElement('button'));countD++;
     }else if(s.mode==='drive'){
      s.drive.x=firstGoal[0];s.drive.z=firstGoal[1];a.physics(.016);
     }else throw Error('Modo inesperado na fase '+(phase+1)+': '+s.mode);
    }
    if(countQ!==expected[phase]||countD!==1)throw Error('Quantidade incorreta na fase '+(phase+1));
    phases.push({questions:countQ,diagnostics:countD,mission:s.mission,progress:document.querySelector('#stageProgress').textContent});
    if(document.querySelectorAll('#deliverySparkles span').length!==21)throw Error('Faltam efeitos de entrega');
    document.querySelector('#nextMissionBtn').click();
    if(phase<3&&(s.stageSlot!==0||s.mission!==phase+1))throw Error('Desafios da próxima fase não reiniciaram');
   }
   return{phases,shown,wrongRetainsQuestion,mode:s.mode,
    questions:s.scoreQuestions,repairs:s.scoreRepairs,correct:s.scoreCorrect,wrong:s.scoreWrong};
  });
  assert.deepEqual(walkthrough.phases.map(p=>p.questions),[2,3,2,3],'perguntas não respeitam o limite das fases');
  assert.deepEqual(walkthrough.phases.map(p=>p.diagnostics),[1,1,1,1],'diagnósticos não respeitam as fases');
  assert.equal(new Set(walkthrough.shown).size,10,'repetição ou vazamento de pergunta entre fases');
  assert(walkthrough.wrongRetainsQuestion,'errar deve preservar a pergunta da fase');
  assert.equal(walkthrough.mode,'end','quatro fases resolvidas devem abrir o relatório');
  assert.equal(walkthrough.questions,10);
  assert.equal(walkthrough.repairs,4);
  assert.equal(walkthrough.correct,14);
  assert.equal(walkthrough.wrong,1);
  assert(await page.locator('#endOverlay').isVisible(),'relatório final não apareceu');
  assert.equal(await page.locator('#scoreCorrect').textContent(),'14');
  assert.equal(await page.locator('#scoreWrong').textContent(),'1');
  assert.equal(await page.locator('#scoreMissions').textContent(),'4');
  assert(/[0-9]+:[0-9]{2}/.test(await page.locator('#scoreElapsed').textContent()),'tempo final com formato errado');
  assert((await page.locator('#endDescription').textContent()).includes('14 acertos e 1 erro'),'resumo final não bate');
  const stored=await page.evaluate(()=>window.__TinkerpetMission.readRecords());
  assert(stored.plays>=1&&stored.fastestMs>=0,'recorde não foi gravado');
  assert.equal(stored.maxCorrect,14,'recorde de acertos incorreto');
  assert.equal(await page.locator('#recordBestScore').textContent(),'14');
  await page.locator('#restartBtn').click();
  assert.equal(await page.locator('#stageProgress').textContent(),'Desafios desta fase: 0/3');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),0,'reiniciar não zerou erros');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreCorrect),0,'reiniciar não zerou acertos');
  await page.screenshot({path:'artifacts/petgame-cidade-'+size.name+'.png'});
  await context.close();
  console.log('PASS',size.name,'início, 3D, regiões, 10 perguntas, diagnóstico e entregas');
 }
 assert.deepEqual(errors,[],'erros JS no navegador: '+errors.join(' | '));
 console.log('PASS PETGame: aventura principal sem testes, oficina por 4 imagens, bairros texturizados, PC e celulares.');
}finally{await browser.close();server.kill()}
