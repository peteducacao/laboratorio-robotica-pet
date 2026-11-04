import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const host='http://127.0.0.1:8738';
const server=spawn('python3',['-m','http.server','8738','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage']});
const screens=[
 {name:'pc',width:1366,height:768,touch:false},
 {name:'tablet',width:1024,height:768,touch:true},
 {name:'celular-horizontal',width:844,height:390,touch:true},
 {name:'celular-vertical',width:390,height:844,touch:true}
];
const problems=[];
try{
 await sleep(850);
 const home=readFileSync('projects.html','utf8');
 assert(home.includes('href="missao-robotica.html"'),'link para o jogo ausente');
 assert(home.indexOf('id="openMissionGame"')>home.indexOf('id="openHow"'),'link do jogo não está abaixo de Como funciona');
 for(const v of screens){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},isMobile:v.touch,hasTouch:v.touch,deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>problems.push(v.name+': '+e.message));
  await page.goto(host+'/missao-robotica.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#authOverlay').isVisible(),true,'senha deve ser exigida');
  assert.equal(await page.locator('#startOverlay').isVisible(),false,'não abrir sem senha');
  await page.locator('#password').fill('incorreta');
  await page.locator('#authForm button[type="submit"]').click();
  assert.equal(await page.locator('#authOverlay').isVisible(),true,'senha incorreta deve bloquear');
  await page.locator('#password').fill('peteducacao');
  await page.locator('#authForm button[type="submit"]').click();
  assert.equal(await page.locator('#startOverlay').isVisible(),true,'senha correta deve abrir início');
  await page.waitForFunction(()=>window.__TinkerpetMission?.state.ready,{timeout:60000});
  await page.locator('#startBtn').click();
  assert.equal(await page.locator('#authOverlay').isVisible(),false);
  assert.equal(await page.locator('#startOverlay').isVisible(),false);
  assert.equal(await page.locator('#scene canvas').count(),1,'mapa 3D sem canvas');
  const viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth,scene:document.querySelector('#scene canvas').getBoundingClientRect().width}));
  assert(viewport.scroll<=viewport.inner+2,v.name+' overflow horizontal '+JSON.stringify(viewport));
  assert(viewport.scene>100,'canvas invisível');
  assert.equal(await page.locator('.motor-track').count(),2,'precisa de 2 controles');
  assert.equal(await page.locator('#lives').getAttribute('aria-label'),'3 vidas');
  if(v.name==='pc'){
   await page.keyboard.down('w');await page.evaluate(()=>window.__TinkerpetMission.physics(.3));
   const straight=await page.evaluate(()=>({a:window.__TinkerpetMission.state.drive.a,b:window.__TinkerpetMission.state.drive.b}));
   assert(straight.a>50&&straight.b>50,'W não acelera ambos os motores: '+JSON.stringify(straight)+' '+JSON.stringify(await page.evaluate(()=>({mode:window.__TinkerpetMission.state.mode,keys:[...window.__TinkerpetMission.state.keys],collided:window.__TinkerpetMission.state.drive.collided,pos:[window.__TinkerpetMission.state.drive.x,window.__TinkerpetMission.state.drive.z],ready:window.__TinkerpetMission.state.ready}))));
   await page.keyboard.down('a');await page.evaluate(()=>window.__TinkerpetMission.physics(.3));
   const curve=await page.evaluate(()=>({a:window.__TinkerpetMission.state.drive.a,b:window.__TinkerpetMission.state.drive.b}));
   assert(curve.b>curve.a+25,'A não desacelera motor esquerdo');
   await page.keyboard.up('w');await page.keyboard.up('a');await page.evaluate(()=>window.__TinkerpetMission.physics(.5));
   const off=await page.evaluate(()=>({a:window.__TinkerpetMission.state.drive.a,b:window.__TinkerpetMission.state.drive.b}));
   assert(Math.abs(off.a)<10&&Math.abs(off.b)<10,'motores não param quando soltam teclas');
   // Ensaiar colisão, exigindo soltar as teclas antes de acelerar de novo.
   const collision=await page.evaluate(()=>{
    const api=window.__TinkerpetMission,s=api.state;s.drive.x=-30;s.drive.z=16;s.drive.angle=0;s.drive.a=200;s.drive.b=200;s.keys=new Set(['w']);for(let i=0;i<28&&!s.drive.collided;i++)api.physics(.045);
    const result={collided:s.drive.collided,lives:s.lives,motors:[s.drive.a,s.drive.b]};s.keys.clear();api.physics(.02);
    return {...result,released:!s.drive.collided};
   });
   assert(collision.collided,'colisão não detetada');
   assert(collision.lives===3,'colisão não deve tirar vida');
   assert(collision.released,'colisão não liberou após soltar');
   // Perguntas: erro apresenta outra e acerto não volta.
   await page.evaluate(()=>window.__TinkerpetMission.beginQuestion());
   const before=await page.evaluate(()=>window.__TinkerpetMission.state.activeQuestion);
   await page.evaluate(()=>{
    const api=window.__TinkerpetMission,q=api.questions[api.state.activeQuestion],bad=q[1].find(a=>a!==q[1][q[2]]);
    const el=[...document.querySelectorAll('.answer')].find(a=>a.textContent.includes(bad));el.click()
   });
   const after=await page.evaluate(()=>window.__TinkerpetMission.state.activeQuestion);
   assert(before!==after,'pergunta errada não foi trocada');
   await page.evaluate(()=>{
    const api=window.__TinkerpetMission,q=api.questions[api.state.activeQuestion],correct=q[1][q[2]];
    [...document.querySelectorAll('.answer')].find(a=>a.textContent.includes(correct)).click()
   });
   const answered=await page.evaluate(()=>({mode:window.__TinkerpetMission.state.mode,score:window.__TinkerpetMission.state.scoreQuestions,seen:[...window.__TinkerpetMission.state.questionsCorrect]}));
   assert(answered.mode==='drive'&&answered.score===1&&answered.seen.length===1,'acerto não salva e fecha desafio');
   // Defeitos independentes do editor do usuário; testar formatos diferentes.
   for(let i=0;i<12;i++){
    await page.evaluate(()=>window.__TinkerpetMission.beginRepair());
    const fault=await page.evaluate(()=>window.__TinkerpetMission.state.fault);
    if(fault.kind==='switch')await page.locator('[data-component="'+fault.id+'"]').click();
    else if(fault.kind==='gpio')await page.locator('select[data-gpio="'+fault.id+'"]').selectOption(fault.id==='in1'?'D27':fault.id==='in2'?'D26':fault.id==='in3'?'D32':'D18');
    else await page.locator('.wire-row.loose').click();
    const repaired=await page.evaluate(()=>window.__TinkerpetMission.state.mode);
    assert(repaired==='drive','falha '+JSON.stringify(fault)+' não foi resolvida');
   }
   // Estourar temporizador leva à perda de vidas e game over com reinício total.
   for(let i=0;i<3;i++){
    await page.evaluate(()=>{window.__TinkerpetMission.beginQuestion();window.__TinkerpetMission.state.challengeEnd=performance.now()-1});
    await page.waitForTimeout(220);
   }
   assert.equal(await page.locator('#endOverlay').isVisible(),true,'fim de jogo não aparece');
   await page.locator('#restartBtn').click();
   assert.equal(await page.locator('#lives').getAttribute('aria-label'),'3 vidas');
   const reset=await page.evaluate(()=>({missions:window.__TinkerpetMission.state.scoreMissions,correct:window.__TinkerpetMission.state.questionsCorrect.size,repairs:window.__TinkerpetMission.state.scoreRepairs}));
   assert.deepEqual(reset,{missions:0,correct:0,repairs:0},'reiniciar não limpou a partida');
  } else {
   // Duas áreas de toque simultâneas e independentes.
   const touch=await page.evaluate(()=>{
    const api=window.__TinkerpetMission,A=document.querySelector('#trackA'),B=document.querySelector('#trackB'),ra=A.getBoundingClientRect(),rb=B.getBoundingClientRect();
    const dispatch=(el,type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y}));
    dispatch(A,'pointerdown',31,ra.left+ra.width/2,ra.top+23);
    dispatch(B,'pointerdown',32,rb.left+rb.width/2,rb.top+23);
    const both=[...api.state.pointerValue];
    dispatch(A,'pointerup',31,ra.left+ra.width/2,ra.top+23);
    dispatch(B,'pointerup',32,rb.left+rb.width/2,rb.top+23);
    return {both,released:api.state.pointer.every(p=>p===null)};
   });
   assert(touch.both[0]>0&&touch.both[1]>0&&touch.released,'toque simultâneo no tablet/celular falhou');
   await page.evaluate(()=>window.__TinkerpetMission.beginQuestion());
   assert.equal(await page.locator('#questionOverlay').isVisible(),true);
   await page.screenshot({path:'artifacts/missao-'+v.name+'-pergunta.png'});
   await page.evaluate(()=>window.__TinkerpetMission.beginRepair());
   assert.equal(await page.locator('#repairOverlay').isVisible(),true);
   if(v.name==='celular-horizontal'){const bounds=await page.evaluate(()=>({foot:document.querySelector('.repair-footer').getBoundingClientRect().bottom,view:innerHeight,list:document.querySelector('.connection-list').getBoundingClientRect().height}));assert(bounds.foot<=bounds.view+2&&bounds.list>85,'reparo inacessível no celular horizontal: '+JSON.stringify(bounds))}
   await page.screenshot({path:'artifacts/missao-'+v.name+'-circuito.png'});
   if(v.name==='celular-horizontal')console.log('VISUAL_REPAIR='+((await page.screenshot({type:'jpeg',quality:56,scale:'css'})).toString('base64')));
   await page.evaluate(()=>window.__TinkerpetMission.resetGame());
   await page.evaluate(()=>{document.querySelector('#repairOverlay').hidden=true;window.__TinkerpetMission.state.mode='drive'});
  }
  await page.screenshot({path:'artifacts/missao-'+v.name+'.png',fullPage:true});
  if(v.name==='pc'||v.name==='celular-horizontal'){const audit=(await page.screenshot({type:'jpeg',quality:50,scale:'css'})).toString('base64');console.log('VISUAL_AUDIT_'+v.name+'='+audit)}
  await context.close();
  console.log('PASS',v.name,'mapa, UI, senha, cena 3D, controles, layout');
 }
 assert.deepEqual(problems,[],'Erros do navegador: '+problems.join('\n'));
 console.log('SUCESSO: autenticação, mapa 3D, navegação, entrada por teclado e toque, perguntas, sorteio, reparos, tempo, 3 vidas, game over, reinício, colisão e telas responsivas.');
}finally{await browser.close();server.kill()}
