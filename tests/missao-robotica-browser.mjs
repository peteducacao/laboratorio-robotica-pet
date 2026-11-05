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
  if(!isEditor)await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
  const initial=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
  assert.equal(initial.baseline,true,'Oficina de fios deve abrir desbloqueada');
  assert.equal(initial.fixed,false);
  assert.equal(initial.tests,1);
  if(isEditor){
   const frame=page.frameLocator('#petgameWorkbenchFrame');
   const targets={1:'s2.IN',2:'ml.A',4:'drv.GND',5:'esp.D18'};
   const origin={1:'b2',2:'drv',4:'esp',5:'drv'}[slot.index];
   const target=targets[slot.index],destination=target.split('.')[0];
   const control=frame.locator('#petgamePickWire');
   await control.waitFor({state:'visible'});
   await control.click();
   assert((await frame.locator('#petgameHelperStatus').textContent()).includes('Ponta selecionada'),
    'Seleção do fio deve dar retorno');
   const framing=await frame.locator('#viewport').evaluate((root,ids)=>{
    const vp=root.getBoundingClientRect();
    const boxes=ids.map(id=>document.querySelector('#partsLayer [data-part="'+id+'"]')?.getBoundingClientRect()).filter(Boolean);
    return{viewport:[vp.width,vp.height],objects:boxes.map(box=>({
     width:box.width,x:box.x-vp.x,y:box.y-vp.y,
     inside:box.right>vp.left&&box.left<vp.right&&box.bottom>vp.top&&box.top<vp.bottom
    }))};
   },[origin,destination]);
   assert(framing.objects.length===2&&framing.objects.every(box=>box.inside),
    'Visualização deve mostrar origem e destino: '+JSON.stringify(framing));
   assert(framing.objects.every(box=>box.width<framing.viewport[0]*.85),
    'Peças não podem ocupar a tela toda: '+JSON.stringify(framing));
   assert.equal(await frame.locator('#petgameOverview').isVisible(),true);
   const port=frame.locator('#partsLayer [data-port="'+target+'"]');
   await port.waitFor({state:'visible'});
   // Toque físico no centro do borne: se outra caixa invisível estiver por cima,
   // o PETGame deve reconhecer o contato correto pela posição real do dedo.
   const point=await port.boundingBox();
   assert(point&&point.width>0&&point.height>0,'O borne precisa ocupar área visível');
   const cx=point.x+point.width/2,cy=point.y+point.height/2;
   if(page.viewportSize().width<900)await page.touchscreen.tap(cx,cy);
   else await page.mouse.click(cx,cy);
   await page.waitForFunction(()=>window.__TinkerpetMission.state.discovery.fixed===true,null,{timeout:15000});
   assert.equal(await page.locator('#diagnosticChoices [data-test-circuit]').count(),0,
    'Não pode exigir botão de teste depois de conectar fio certo');
   assert.equal(await page.locator('#diagnosticChoices [data-finish]').count(),0,
    'Não pode exigir botão de continuar depois de conectar fio certo');
   await page.waitForFunction(()=>window.__TinkerpetMission.state.mode==='drive',null,{timeout:10000});
  }else if(slot.index===0){
   await page.locator('#diagnosticChoices [data-switch]').evaluate(el=>el.click());
  }else if(slot.index===3){
   await page.locator('#petVoltage').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  if(!isEditor){
   await page.locator('#diagnosticChoices [data-test-circuit]').evaluate(el=>el.click());
   const result=await page.evaluate(()=>window.__TinkerpetMission.state.discovery);
   assert(result.fixed&&result.tests>=2,'Reparo não foi verificado: '+JSON.stringify(result));
   assert.equal(await page.locator('#diagnosticChoices .pet-success').count(),1);
   await page.locator('#diagnosticChoices [data-finish]').evaluate(el=>el.click());
  }
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
