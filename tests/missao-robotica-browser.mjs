/* Testes reais do PETGame 2.0 — Chromium desktop, tablet e celulares. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const host='http://127.0.0.1:8738';
const server=spawn('python3',['-m','http.server','8738','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage']});
const views=[
 {name:'pc',width:1366,height:768,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'celular-horizontal',width:844,height:390,touch:true},
 {name:'celular-vertical',width:390,height:844,touch:true}
];
const errors=[];
async function beginSlot(page){
 return await page.evaluate(()=>{
  const a=window.__TinkerpetMission,slot=a.currentStageSlot();
  if(!slot)throw Error('Nenhuma descoberta nesta posição');
  if(slot.kind==='repair')a.beginRepair(slot.index);else a.beginQuestion(slot.index);
  return slot;
 });
}
async function solveSlot(page,slot){
 if(slot.kind==='repair'){
  assert(await page.locator('#repairOverlay').isVisible(),'A bancada não abriu');
  assert.equal(await page.locator('#repairTimer').isVisible(),false,'Desafio sem contagem regressiva');
  assert(await page.locator('#diagnosticChoices [data-inspect]').count()>=3,'Peças ausentes');
  assert.equal(await page.locator('#diagnosticClose').count(),0,'X não pode sair do desafio');
  assert.equal(await page.locator('#quitChallengeDialog').count(),0,'Não pode existir pulo de descoberta');
  const slotBefore=await page.evaluate(()=>window.__TinkerpetMission.state.stageSlot);
  await page.evaluate(()=>window.__TinkerpetMission.confirmQuitChallenge());
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.stageSlot),slotBefore,'Não pode pular a etapa');
  if(slot.index===0){
   await page.locator('#diagnosticChoices [data-hint]').evaluate(el=>el.click());
   assert((await page.locator('#diagnosticChoices .pet-clue').textContent()).includes('Pista 1'));
  }
  await page.locator('#diagnosticChoices [data-inspect]').first().evaluate(el=>el.click());
  assert.equal(await page.locator('#diagnosticChoices .pet-observation').count(),1);
  assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,'Tocar na peça não conclui investigação');
  assert.equal(await page.locator('#diagnosticChoices [data-setting]').count(),0);
  await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
  const baseline=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert.equal(baseline.baseline,true);
  assert.equal(baseline.fixed,false);
  assert.equal(baseline.tests,1);
  assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,'Não pode avançar após detectar a falha');
  if([1,2,4,5].includes(slot.index)){
   assert.equal(await page.locator('#diagnosticChoices .pg-component').count(),10,'O circuito deve mostrar dez componentes.');
   assert.equal(await page.locator('#diagnosticChoices .pg-wire').count(),18,'O circuito deve mostrar todas as dezoito ligações.');
   assert.equal(await page.locator('#diagnosticChoices .pg-fault-wire').count(),1,'Apenas uma ligação deve estar com defeito.');
   const wire=await page.evaluate(i=>{
    const board=window.PetGameCircuitBoard,fault=board.FAULTS[i];
    return{target:fault.target,loose:fault.wire};
   },slot.index);
   assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,'Não basta observar o fio.');
   // A mesma interação funciona por toque em dois pontos ou por arrasto.
   await page.locator('#diagnosticChoices [data-wire-handle]').dispatchEvent('click');
   assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.discovery.values.wireSelected),true,'A ponta solta deve ser selecionável.');
   if(slot.index===1){
    // Tentar o pino errado nunca pode resolver o defeito.
    await page.locator('#diagnosticChoices [data-pin="pack2.POS"]').dispatchEvent('click');
    await page.locator('#diagnosticChoices [data-test-circuit]').dispatchEvent('click');
    const failed=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
    assert.equal(failed.fixed,false,'A conexão no terminal errado não pode liberar a criança.');
    await page.locator('#diagnosticChoices [data-wire-handle]').dispatchEvent('click');
   }
   await page.locator('#diagnosticChoices [data-pin="'+wire.target+'"]').dispatchEvent('click');
   assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.discovery.values.wireDestination),wire.target,
    'O fio precisa conectar ao terminal correto: '+wire.target);
  }else if(slot.index===0){
   assert.equal(await page.locator('#diagnosticChoices [data-switch]').count(),1,'Gangorra deve manter experimento físico.');
   await page.locator('#diagnosticChoices [data-switch]').dispatchEvent('click');
   assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.discovery.values.switchOn),true);
  }else if(slot.index===3){
   assert.equal(await page.locator('#petVoltage').count(),1,'LM2596 deve manter controle de tensão.');
   await page.locator('#petVoltage').evaluate(el=>{
    el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));
   });
   assert.equal(await page.locator('#petVoltageValue').textContent(),'5 V');
  }else throw Error('Cenário de descoberta desconhecido: '+slot.index);
  assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,'Mudar um controle não basta: precisa testar');
  await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
  const result=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert(result.fixed&&result.tests>=2,'O teste do reparo deve passar antes do avanço: '+JSON.stringify(result));
  assert.equal(await page.locator('#diagnosticChoices .pet-success').count(),1);
  await page.locator('#diagnosticChoices [data-finish]').evaluate(el=>el.click());
 }else{
  assert(await page.locator('#questionOverlay').isVisible(),'Experimento não abriu');
  assert.equal(await page.locator('#questionClose').count(),0,'Experimento não pode ter X');
  assert.equal(await page.locator('#questionTimer').isVisible(),false,'Experimento sem relógio');
  const motors=slot.index===0?[50,50]:[25,75];
  for(const [i,id] of ['A','B'].entries()){
   await page.locator('[data-experiment-motor="'+id+'"]').evaluate((el,value)=>{
    el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
   },motors[i]);
  }
  await page.locator('#answers [data-try]').evaluate(el=>el.click());
  const outcome=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert.equal(outcome.fixed,true,'Motores não reconheceram a combinação '+JSON.stringify(outcome));
  assert.equal(await page.locator('#answers .pet-success').count(),1);
  await page.locator('#answers [data-finish]').evaluate(el=>el.click());
 }
 assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','Depois de solucionar, deve voltar à direção');
}

try{
 await wait(700);
 const projects=readFileSync('projects.html','utf8');
 assert(projects.includes('href="missao-robotica.html"'),'PETGame não aparece em Meus circuitos');
 for(const view of views){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height},isMobile:view.touch,hasTouch:view.touch,deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(view.name+': '+e.message));
  await page.goto(host+'/missao-robotica.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TinkerpetMission?.state.ready,{timeout:60000});
  assert(await page.locator('#startOverlay').isVisible(),'Aventura não inicia na apresentação');
  assert(await page.locator('#startBtn').isEnabled());
  assert.equal(await page.locator('#lives').count(),0,'Corações/vidas devem estar ausentes');
  assert.equal(await page.locator('#runTimer').isVisible(),false,'Tempo deve ficar oculto');
  assert.equal(await page.locator('#stageProgress').textContent(),'Descobertas nesta região: 0/2');
  assert.equal(await page.locator('#questionTimer').isVisible(),false);
  await page.locator('#startBtn').evaluate(el=>el.click());
  const ready=await page.evaluate(()=>{
   const a=window.__TinkerpetMission;
   return{
    load:!!a.world.renderer,trees:a.world.visualUpgrade?.treeCount||0,
    flowers:a.world.visualUpgrade?.flowerCount||0,textures:a.world.visualUpgrade?.detailTextures||0,
    instances:a.world.staticStats?.batchSavings||0,
    stages:a.state.stageChallenges.map(p=>({size:p.length,repair:p.filter(q=>q.kind==='repair').length,question:p.filter(q=>q.kind==='question').length}))
   };
  });
  assert(ready.load&&ready.trees>=30&&ready.flowers>=100&&ready.textures>=3&&ready.instances>25,'Novo mapa não foi renderizado '+JSON.stringify(ready));
  assert.deepEqual(ready.stages.map(x=>x.size),[2,2,2,2]);
  assert.deepEqual(ready.stages.map(x=>x.repair),[1,2,1,2]);
  assert.deepEqual(ready.stages.map(x=>x.question),[1,0,1,0]);
  await page.screenshot({path:'artifacts/petgame-mapa-'+view.name+'.png'});
  const motors=await page.evaluate(()=>{
   const a=window.__TinkerpetMission,s=a.state;
   s.pointer=['touch-A',null];s.pointerValue=[180,0];
   const one=a.commands();
   s.pointer=['touch-A','touch-B'];s.pointerValue=[200,140];
   const two=a.commands();
   s.pointer=[null,null];s.pointerValue=[0,0];
   return{one,two};
  });
  assert.deepEqual(motors.one,[180,0]);
  assert.deepEqual(motors.two,[200,140]);
  assert(await page.locator('#minimap').isVisible());
   const collision=await page.evaluate(()=>{
    const a=window.__TinkerpetMission,s=a.state;
    const points={road:a.collides(-50,-40),house:a.collides(-60,-60),edge:a.collides(0,0)};
    const solids=a.world.walls.filter(w=>!w.ghost).length;
    s.drive={x:-50,z:-40,angle:-Math.PI/2,a:0,b:0,collided:false};
    s.keys.add('w');
    for(let t=0;t<150;t++)a.physics(1/60);
    s.keys.clear();
    const stopped=s.drive.x;
    a.resetGame();s.mode='drive';
    return {...points,solids,stopped};
   });
   assert.equal(collision.road,false,'Pista deve permanecer livre');
   assert.equal(collision.house,true,'Casa sólida não pode ser atravessada');
   assert.equal(collision.edge,true,'Edificação central precisa colidir');
   assert(collision.solids>150,'Árvores, bancos e postes precisam de colisão '+JSON.stringify(collision));
   assert(collision.stopped>-50&&collision.stopped< -45,'Carrinho cruzou o meio-fio ou não se movimentou '+JSON.stringify(collision));
   // Teste de tela cheia com investigação na camada superior.
   await page.locator('#fullBtn').click();
   const fsActive=await page.evaluate(()=>!!document.fullscreenElement);
   if(view.name==='pc')assert(fsActive,'Tela cheia deve abrir no navegador desktop');
   if(fsActive){
    const root=await page.evaluate(()=>document.fullscreenElement===document.documentElement);
    assert(root,'Tela cheia deve abranger os diálogos e não só o canvas');
   }
  const before=await page.evaluate(()=>{const a=window.__TinkerpetMission;return{phase:a.state.mission,slot:a.state.stageSlot}});
  assert.equal(before.slot,0);
  // Salvar e recuperar durante investigação com a primeira peça examinada.
  const slot0=await beginSlot(page);
  assert.equal(slot0.kind,'repair');
  if(fsActive){
    assert(await page.locator('#repairOverlay').isVisible(),'Investigação sumiu na tela cheia');
    const above=await page.evaluate(()=>{
     const pane=document.querySelector('#repairOverlay'),box=pane.querySelector('.dialog').getBoundingClientRect();
     const middle=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,box.left+box.width/2)),
      Math.min(innerHeight-1,Math.max(0,box.top+Math.min(60,box.height/2))));
     return pane.contains(middle);
    });
    assert(above,'Diálogo não está interativo sobre o canvas em tela cheia');
   }
   await page.locator('#diagnosticChoices [data-inspect]').first().evaluate(el=>el.click());
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__TinkerpetMission?.state.ready,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'repair','A investigação não foi recuperada');
  assert(await page.locator('#diagnosticChoices .pet-part.active').count()===1,'Peça observada não foi preservada');
  await solveSlot(page,slot0);
  // Completar oito descobertas distribuídas entre as quatro áreas.
  for(let phase=0;phase<4;phase++){
   for(let n=phase===0?1:0;n<2;n++){
    const slot=await beginSlot(page);
    await solveSlot(page,slot);
   }
   const stage=await page.evaluate(()=>window.__TinkerpetMission.state.stageSlot);
   assert.equal(stage,2,'Cada região deve ter duas descobertas');
   await page.evaluate(()=>{
    const a=window.__TinkerpetMission,s=a.state,p=a.missions[s.mission].to;
    s.drive.x=p[0];s.drive.z=p[1];a.physics(.016);
   });
   assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'delivery','Entrega não foi concluída');
   await page.locator('#nextMissionBtn').evaluate(el=>el.click());
   if(phase<3){
    assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mission),phase+1);
   }
  }
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'end','Fim da aventura não apareceu');
  assert.equal(await page.locator('#scoreCorrect').textContent(),'8','Oito descobertas deveriam ser contabilizadas');
  assert.equal(await page.locator('#scoreMissions').textContent(),'4','Quatro entregas deveriam ser concluídas');
  assert((await page.locator('#endDescription').textContent()).includes('investigou 8 situações'));
  await page.screenshot({path:'artifacts/petgame-final-'+view.name+'.png'});
  assert.equal(errors.length,0,'Erro de JavaScript '+errors.join('; '));
  await context.close();
  console.log('✓ '+view.name+': cidade detalhada, oito descobertas, progresso salvo, quatro entregas e sem cronômetro.');
 }
 console.log('PETGame 2.0: verificações concluídas.');
}finally{
 await browser.close();server.kill('SIGTERM');
}
