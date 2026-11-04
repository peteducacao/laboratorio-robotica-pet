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
  const pausedSegments=(paused.match(/[0-9]+:[0-9]{2}/)?.[0]||'').split(':').map(Number);
  assert(pausedSegments.length===2&&pausedSegments[0]*60+pausedSegments[1]>=63,
   'tempo da aventura não foi contabilizado: '+paused);
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
  // Um único erro em pergunta consome vida e fecha o desafio.
  const wrongQuestion=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';a.beginQuestion();
   const index=s.activeQuestion,q=a.questions[index];
   const bad=q[1].find(x=>x!==q[1][q[2]]);
   const choice=[...document.querySelectorAll('.answer')].find(el=>el.textContent.includes(bad));
   if(!choice)throw Error('Alternativa incorreta não encontrada');
   choice.click();
   return{lives:s.lives,mode:s.mode,wrong:s.scoreWrong,question:index,
    stageSlot:s.stageSlot,oldChoiceDisabled:choice.disabled};
  });
  assert.equal(wrongQuestion.lives,2,'errar uma pergunta deve tirar uma vida de imediato');
  assert.equal(wrongQuestion.mode,'drive','pergunta errada deve se encerrar sem outra tentativa');
  assert.equal(wrongQuestion.wrong,1,'erro de pergunta deve ser contado exatamente uma vez');
  assert(await page.locator('#questionOverlay').isHidden(),'pergunta errada não pode continuar aberta');

  // Mesmo comportamento para diagnóstico com componente errado.
  const wrongDiagnostic=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';a.beginRepair();
   const wrong=s.fault.options.find(x=>x!==s.fault.answer);
   document.querySelector('.diagnostic-card[data-diagnostic="'+wrong+'"]').click();
   return{lives:s.lives,mode:s.mode,wrong:s.scoreWrong};
  });
  assert.equal(wrongDiagnostic.lives,2,'diagnóstico errado precisa tirar vida de imediato');
  assert.equal(wrongDiagnostic.mode,'drive','diagnóstico errado não permite segunda escolha');
  assert.equal(wrongDiagnostic.wrong,1,'diagnóstico errado deve ser contabilizado apenas uma vez');

  // Partida completa: 10 perguntas nas quatro fases e quatro diagnósticos,
  // com uma resposta incorreta que elimina a tentativa, mas não pula a fase.
  const walkthrough=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';
   const phases=[],shown=[],expected=[2,3,2,3];
   let deducted=false,separationVerified=false;
   for(let phase=0;phase<4;phase++){
    const goal=a.missions[phase].to;
    s.drive.x=goal[0];s.drive.z=goal[1];a.physics(.016);
    if(s.mode==='delivery')throw Error('Fase '+(phase+1)+' deixou concluir sem desafios');
    let qCount=0,dCount=0,guard=0;
    while(s.mode!=='delivery'){
     if(++guard>18)throw Error('Desafios não terminam na fase '+(phase+1));
     if(s.mode==='question'){
      const idx=s.activeQuestion,q=a.questions[idx],correct=q[1][q[2]],buttons=[...document.querySelectorAll('.answer')];
      shown.push(idx);qCount++;
      if(!deducted){
       const wrong=buttons.find(btn=>!btn.textContent.includes(correct));
       if(!wrong)throw Error('Falta opção incorreta');
       const prevSlot=s.stageSlot;
       wrong.click();
       if(s.mode!=='drive'||s.lives!==2||s.stageSlot!==prevSlot+1||s.scoreWrong!==1)
        throw Error('A resposta errada não perdeu vida ou tentou repetir a pergunta');
       // Mesmo zerando o bloqueio temporal, precisa dirigir antes de outra questão.
       s.skipUntil=0;
       if(a.triggerEvent(true))throw Error('Nova pergunta surgiu sem dirigir');
       separationVerified=true;deducted=true;
      }else{
       const right=buttons.find(btn=>btn.textContent.includes(correct));
       if(!right)throw Error('Falta opção correta');
       right.click();
      }
     }else if(s.mode==='repair'){
      a.chooseDiagnostic(s.fault.answer,document.createElement('button'));dCount++;
     }else if(s.mode==='drive'){
      // Simula a pilotagem real entre desafios, sem usar pausa ou teleporte
      // para burlar o intervalo mínimo (15m e 5,5s de direção).
      s.stageMeters+=20;s.driveSeconds+=6.0;s.skipUntil=0;
      s.drive.x=goal[0];s.drive.z=goal[1];a.physics(.016);
     }else throw Error('Modo inesperado: '+s.mode);
    }
    if(qCount!==expected[phase]||dCount!==1)throw Error('Distribuição errada na fase '+(phase+1));
    phases.push({questions:qCount,diagnostics:dCount,completed:s.scoreMissions});
    document.querySelector('#nextMissionBtn').click();
    if(phase<3&&(s.stageSlot!==0||s.mission!==phase+1))throw Error('Próxima fase não reiniciou desafios');
   }
   return{phases,shown,deducted,separationVerified,mode:s.mode,lives:s.lives,
    questionsCorrect:s.scoreQuestions,repairsCorrect:s.scoreRepairs,
    correct:s.scoreCorrect,wrong:s.scoreWrong};
  });
  assert.deepEqual(walkthrough.phases.map(p=>p.questions),[2,3,2,3],'10 perguntas não distribuídas nas quatro fases');
  assert.deepEqual(walkthrough.phases.map(p=>p.diagnostics),[1,1,1,1],'diagnóstico ausente em alguma fase');
  assert.equal(new Set(walkthrough.shown).size,10,'uma pergunta foi repetida ou apareceu em outra fase');
  assert(walkthrough.deducted&&walkthrough.separationVerified,'erro e espaçamento precisam estar funcionando');
  assert.equal(walkthrough.mode,'end','resultado final não apareceu');
  assert.equal(walkthrough.lives,2);
  assert.equal(walkthrough.correct,13,'uma questão incorreta não pode virar acerto');
  assert.equal(walkthrough.wrong,1,'erro deve ser contado uma única vez');
  assert.equal(await page.locator('#scoreCorrect').textContent(),'13');
  assert.equal(await page.locator('#scoreWrong').textContent(),'1');
  assert.equal(await page.locator('#scoreMissions').textContent(),'4');
  assert((await page.locator('#endDescription').textContent()).includes('13 acertos e 1 erro'),'relatório incorreto');
  assert(/[0-9]+:[0-9]{2}/.test(await page.locator('#scoreElapsed').textContent()),'tempo final em formato incorreto');
  const stored=await page.evaluate(()=>window.__TinkerpetMission.readRecords());
  assert(stored.plays>=1&&stored.fastestMs>=0,'recorde não foi gravado');
  assert.equal(stored.maxCorrect,13,'recorde de acertos incorreto');
  await page.locator('#restartBtn').click();
  assert.equal(await page.locator('#stageProgress').textContent(),'Desafios desta fase: 0/3');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.lives),3);
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),0);
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreCorrect),0);
  // O eixo local X deve rodar a montagem da roda sem inclinar o pneu.
  const axle=await page.evaluate(()=>{
   const a=window.__TinkerpetMission;
   return a.world.wheels.map(w=>({
    hasPivot:!!w.pivot,axleX:w.pivot?.rotation.x,
    tireTilt:w.mesh.rotation.z,offset:w.mesh.position.length()
   }));
  });
  assert(axle.length===4&&axle.every(w=>w.hasPivot&&Math.abs(w.tireTilt-Math.PI/2)<.01&&w.offset===0),
   'Pneu não gira em torno do centro do seu eixo');
  await page.screenshot({path:'artifacts/petgame-cidade-'+size.name+'.png'});
  await context.close();
  console.log('PASS',size.name,'início, 3D, regiões, 10 perguntas, diagnóstico e entregas');
 }
 assert.deepEqual(errors,[],'erros JS no navegador: '+errors.join(' | '));
 console.log('PASS PETGame: aventura principal sem testes, oficina por 4 imagens, bairros texturizados, PC e celulares.');
}finally{await browser.close();server.kill()}
