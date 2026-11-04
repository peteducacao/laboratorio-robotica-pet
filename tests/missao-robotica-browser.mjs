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
 assert(!projects.includes('JOGO 3D · 🔒'),'PETGame não deve mostrar cadeado no menu');
 for(const size of sizes){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:size.touch,hasTouch:size.touch,deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(size.name+': '+e.message));
  await page.goto(host+'/missao-robotica.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#authOverlay').count(),0,'PETGame não deve pedir senha');
  assert.equal(await page.locator('#password').count(),0,'campo de senha deve ser removido do jogo');
  assert(await page.locator('#startOverlay').isVisible(),'entrada direta deve abrir apresentação');
  await page.waitForFunction(()=>window.__TinkerpetMission?.state.ready,{timeout:60000});
  assert.equal(await page.locator('#startBtn').isEnabled(),true);
  assert.equal(await page.locator('#pauseTestBtn').count(),0,'menu de testes não deve existir');
  assert.equal(await page.locator('#testSummaryOverlay').count(),0,'resumo de testes não deve existir');
  assert.equal(await page.locator('#playBtn').count(),0,'início deve ser único');
  await page.screenshot({path:'artifacts/petgame-inicio-'+size.name+'.png'});
  await page.locator('#startBtn').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','início deve entrar na aventura normal');
  assert.equal(await page.locator('#questionOverlay').isVisible(),false,'rodada de teste não pode surgir');
  assert.equal(await page.locator('#stageProgress').textContent(),'Desafios desta fase: 0/4','fase inicial exige 3 desafios');
  const stages=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,plan=a.state.stageChallenges;
   return{counts:plan.map(p=>p.filter(s=>s.kind==='question').length),
    fixes:plan.map(p=>p.filter(s=>s.kind==='repair').length),
    questionIds:plan.flat().filter(s=>s.kind==='question').map(s=>s.index),repairIds:plan.flat().filter(s=>s.kind==='repair').map(s=>s.index)}
  });
  assert.deepEqual(stages.counts,[2,1,2,1],'seis perguntas, presentes nas quatro fases');
  assert.deepEqual(stages.fixes,[2,2,2,2],'dois circuitos por fase');
  assert.equal(new Set(stages.questionIds).size,6,'as perguntas não devem se repetir');
  assert.equal(new Set(stages.repairIds).size,8,'os diagnósticos não devem se repetir');
  assert(stages.repairIds.length>stages.questionIds.length,'mais circuitos que perguntas');
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
  // Três erros de qualquer tipo consomem uma vida, sem repetir os desafios.
  const penalties=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';
   const snapshot=()=>({lives:s.lives,wrong:s.scoreWrong,toward:s.mistakesTowardLife});
   function question(){
    a.beginQuestion();
    const q=a.questions[s.activeQuestion],bad=q[1].find(t=>t!==q[1][q[2]]);
    [...document.querySelectorAll('.answer')].find(b=>b.textContent.includes(bad)).click();
    if(s.mode!=='drive')throw Error('Resposta errada não encerrou desafio')
   }
   function circuit(){
    a.beginRepair();
    a.chooseDiagnostic(s.fault.options.find(k=>k!==s.fault.answer),document.createElement('button'));
    if(s.mode!=='drive')throw Error('Diagnóstico errado não encerrou desafio')
   }
   question();const first=snapshot();
   circuit();const second=snapshot();
   question();const third=snapshot();
   circuit();const fourth=snapshot();
   return{first,second,third,fourth}
  });
  assert.deepEqual(penalties,{
   first:{lives:3,wrong:1,toward:1},second:{lives:3,wrong:2,toward:2},
   third:{lives:2,wrong:3,toward:0},fourth:{lives:2,wrong:4,toward:1}
  },'três erros acumulados devem tirar uma vida');

  // Todas as fases: oito diagnósticos distintos e seis perguntas sorteadas.
  const walkthrough=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   a.resetGame();s.mode='drive';
   const phases=[],shownQ=[],shownD=[];
   let failedOnce=false,spacingChecked=false;
   for(let phase=0;phase<4;phase++){
    const goal=a.missions[phase].to;
    s.drive.x=goal[0];s.drive.z=goal[1];a.physics(.016);
    if(s.mode==='delivery')throw Error('Entrega antes dos desafios da fase');
    let countQ=0,countD=0,guard=0;
    while(s.mode!=='delivery'){
     if(++guard>18)throw Error('Desafios não terminaram na fase '+phase+' / '+s.mode);
     if(s.mode==='question'){
      const id=s.activeQuestion,q=a.questions[id],correct=q[1][q[2]];
      const options=[...document.querySelectorAll('.answer')];
      shownQ.push(id);countQ++;
      if(!failedOnce){
       const wrong=options.find(o=>!o.textContent.includes(correct));
       const stageSlot=s.stageSlot;wrong.click();
       if(s.mode!=='drive'||s.lives!==3||s.mistakesTowardLife!==1||s.scoreWrong!==1||
         s.stageSlot!==stageSlot+1)throw Error('Primeiro erro não contou 1/3');
       s.skipUntil=0;
       if(a.triggerEvent(true))throw Error('Outra pergunta apareceu antes de dirigir');
       failedOnce=true;spacingChecked=true
      }else options.find(o=>o.textContent.includes(correct)).click()
     }else if(s.mode==='repair'){
      shownD.push(s.fault.id);countD++;
      a.chooseDiagnostic(s.fault.answer,document.createElement('button'))
     }else if(s.mode==='drive'){
      s.stageMeters+=20;s.driveSeconds+=6;s.skipUntil=0;
      s.drive.x=goal[0];s.drive.z=goal[1];a.physics(.016)
     }else throw Error('Modo inesperado '+s.mode)
    }
    if(countQ!==[2,1,2,1][phase]||countD!==2)
     throw Error('Quantidade errada na fase '+(phase+1)+' '+countQ+' perguntas / '+countD+' circuitos');
    phases.push({q:countQ,d:countD});
    document.querySelector('#nextMissionBtn').click();
    if(phase<3&&(s.mission!==phase+1||s.stageSlot!==0))throw Error('Desafios da fase não reiniciaram')
   }
   return{phases,shownQ,shownD,failedOnce,spacingChecked,mode:s.mode,lives:s.lives,
    correct:s.scoreCorrect,wrong:s.scoreWrong,pending:s.mistakesTowardLife,q:s.scoreQuestions,d:s.scoreRepairs}
  });
  assert.deepEqual(walkthrough.phases.map(x=>x.q),[2,1,2,1]);
  assert.deepEqual(walkthrough.phases.map(x=>x.d),[2,2,2,2]);
  assert.equal(new Set(walkthrough.shownQ).size,6,'perguntas repetidas');
  assert.equal(new Set(walkthrough.shownD).size,8,'diagnósticos de circuito repetidos');
  assert(walkthrough.failedOnce&&walkthrough.spacingChecked,'erro e espaçamento inválidos');
  assert.equal(walkthrough.mode,'end');
  assert.equal(walkthrough.lives,3);
  assert.equal(walkthrough.pending,1);
  assert.equal(walkthrough.correct,13);
  assert.equal(walkthrough.wrong,1);
  assert.equal(walkthrough.q,5);
  assert.equal(walkthrough.d,8);
  assert.equal(await page.locator('#scoreCorrect').textContent(),'13');
  assert.equal(await page.locator('#scoreWrong').textContent(),'1');
  assert.equal(await page.locator('#scoreMissions').textContent(),'4');
  assert((await page.locator('#endDescription').textContent()).includes('13 acertos e 1 erro'));
  const stored=await page.evaluate(()=>window.__TinkerpetMission.readRecords());
  assert(stored.plays>=1&&stored.fastestMs>=0);
  assert.equal(stored.maxCorrect,13);
  await page.locator('#restartBtn').click();
  assert.equal(await page.locator('#stageProgress').textContent(),'Desafios desta fase: 0/4');
  assert.equal(await page.locator('#mistakeProgress').textContent(),'Erros: 0/3');
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.lives),3);
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.scoreWrong),0);
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mistakesTowardLife),0);
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
  console.log('PASS',size.name,'início, 3D, regiões, 6 perguntas, 8 diagnósticos e entregas');
 }
 assert.deepEqual(errors,[],'erros JS no navegador: '+errors.join(' | '));
 console.log('PASS PETGame: aventura principal sem testes, oficina por 4 imagens, bairros texturizados, PC e celulares.');
}finally{await browser.close();server.kill()}
