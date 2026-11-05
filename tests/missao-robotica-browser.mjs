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
  assert.equal(await page.locator('#repairTimer').isVisible(),false,'Cronômetro não pode pressionar a criança');
  assert(await page.locator('#diagnosticChoices [data-inspect]').count()>=3,'Peças interativas ausentes');
  if(slot.index===0){
   await page.locator('#diagnosticChoices [data-hint]').evaluate(btn=>btn.click());
   assert((await page.locator('.pet-clue').textContent()).includes('Pista 1'),'Dica não apareceu');
  }
  const data=await page.evaluate(i=>window.PetGameDiscovery.investigations[i],slot.index);
  await page.locator('[data-inspect="'+data.target+'"]').evaluate(el=>el.click());
  assert(await page.locator('.pet-observation').count()>0,'A peça não pode ser observada');
  if(data.kind==='voltage'){
   await page.locator('#petVoltage').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))});
   assert.equal(await page.locator('#petVoltageValue').textContent(),'5 V');
  }
  await page.locator('[data-repair]').evaluate(el=>el.click());
  assert(await page.locator('#diagnosticChoices .pet-success').count()===1,'A correção precisa mostrar uma explicação');
  await page.locator('#diagnosticChoices [data-finish]').evaluate(el=>el.click());
 }else{
  assert(await page.locator('#questionOverlay').isVisible(),'Experimento não abriu');
  assert.equal(await page.locator('#questionTimer').isVisible(),false,'Experimento não pode ter relógio');
  const motors=slot.index===0?[50,50]:[25,75];
  for(const [i,id] of ['A','B'].entries()){
   await page.locator('[data-experiment-motor="'+id+'"]').evaluate((el,value)=>{
    el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
   },motors[i]);
  }
  await page.locator('[data-try]').evaluate(el=>el.click());
  const diagnostic=await page.evaluate(()=>({mode:window.__TinkerpetMission.state.mode, discovery:window.__TinkerpetMission.state.discovery,
   text:document.querySelector('#questionResponse')?.textContent,
   buttons:[...document.querySelectorAll('#answers button')].map(b=>b.dataset),
   success:document.querySelectorAll('#answers .pet-success').length}));
  assert(await page.locator('#answers .pet-success').count()===1,'Experimento não reconheceu a descoberta: '+JSON.stringify(diagnostic));
  await page.locator('#answers [data-finish]').evaluate(el=>el.click());
 }
 assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive');
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
  const before=await page.evaluate(()=>{const a=window.__TinkerpetMission;return{phase:a.state.mission,slot:a.state.stageSlot}});
  assert.equal(before.slot,0);
  // Salvar e recuperar durante investigação com a primeira peça examinada.
  const slot0=await beginSlot(page);
  assert.equal(slot0.kind,'repair');
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
