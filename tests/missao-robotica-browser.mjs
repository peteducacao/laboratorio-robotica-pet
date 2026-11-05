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
  assert(await page.locator('#repairOverlay').isVisible(),'A oficina não abriu');
  assert.equal(await page.locator('#repairTimer').isVisible(),false,'Sem cronômetro');
  assert.equal(await page.locator('#diagnosticClose').count(),0,'Oficina não pode ter X');
  assert.equal(await page.locator('#quitChallengeDialog').count(),0,'Não pode existir pulo');
  const stage=await page.evaluate(()=>window.__TinkerpetMission.state.stageSlot);
  await page.evaluate(()=>window.__TinkerpetMission.confirmQuitChallenge());
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.stageSlot),stage,'Não pode pular descoberta');
  const isEditor=[1,2,4,5].includes(slot.index);
  if(isEditor){
   await page.locator('#petgameWorkbenchFrame').waitFor({state:'visible',timeout:30000});
   const frame=page.frameLocator('#petgameWorkbenchFrame');
   await frame.locator('#partsLayer [data-part="esp"]').waitFor({state:'visible',timeout:30000});
   assert.equal(await frame.locator('#partsLayer .part').count(),9,'Usar os nove componentes do TinkerPET original');
   await frame.locator('#wireSvg .wire-line').first().waitFor({state:'attached',timeout:4500}).catch(()=>{});
   const visual=await frame.locator('#wireSvg').evaluate(el=>({
    count:el.children.length,svg:el.outerHTML.slice(0,230),classes:el.getAttribute('class'),
    visible:el.getBoundingClientRect().width,
    footer:document.querySelector('#statusText')?.textContent
   }));
   assert.equal(await frame.locator('#wireSvg .wire-line').count(),17,
    'Circuito deve ter 17 fios reais: '+JSON.stringify(visual)+' / JS errors: '+errors.join(' | '));
   assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0);
   await page.screenshot({path:'artifacts/petgame-oficina-'+slot.index+'-'+page.viewportSize().width+'.png'});
  }else{
   assert(await page.locator('#diagnosticChoices [data-inspect]').count()>=3,'Peças do experimento ausentes');
   await page.locator('#diagnosticChoices [data-inspect]').first().evaluate(el=>el.click());
   assert.equal(await page.locator('#diagnosticChoices .pet-observation').count(),1);
  }
  await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
  const initial=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert.equal(initial.baseline,true);
  assert.equal(initial.fixed,false);
  assert.equal(initial.tests,1);
  if(isEditor){
   const frame=page.frameLocator('#petgameWorkbenchFrame');
   const mapping={1:['b','s2.IN'],2:['b','ml.A'],4:['b','drv.GND'],5:['a','esp.D18']};
   const [end,target]=mapping[slot.index];
   const handle=frame.locator('#wireHandles .wire-end-handle[data-wire-end="'+end+'"]');
   const port=frame.locator('#partsLayer [data-port="'+target+'"]');
   await handle.waitFor({state:'visible',timeout:30000});
   await port.waitFor({state:'visible',timeout:30000});
   const a=await handle.boundingBox(),b=await port.boundingBox();
   assert(a&&b&&a.width>5&&b.width>1,'Ponta e pino devem ficar visíveis.');
   await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
   await page.mouse.down();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
   await page.mouse.up();
   await page.waitForFunction(()=>window.__TinkerpetMission.state.discovery.values.wireSolved===true,null,{timeout:20000});
   assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,
    'Só reconectar o fio não libera a entrega sem testar');
  }else if(slot.index===0){
   await page.locator('#diagnosticChoices [data-switch]').evaluate(el=>el.click());
  }else if(slot.index===3){
   await page.locator('#petVoltage').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
  const result=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert(result.fixed&&result.tests>=2,'Reparo não foi verificado: '+JSON.stringify(result));
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
