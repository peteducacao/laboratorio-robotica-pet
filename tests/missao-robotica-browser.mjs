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
  const rules=await page.evaluate(()=>({n:window.__TinkerpetMission.questions.length,q:window.__TinkerpetMission.questions.map(q=>q[0])}));
  assert.equal(rules.n,10,'esperadas dez perguntas revisadas');
  assert(rules.q.every(q=>q.length<100&&!/GPIO|192\.168|pararTudo\(/i.test(q)),'perguntas não devem cobrar pinos ou código');
  const state3d=await page.evaluate(()=>({loaded:!!window.__TinkerpetMission.world.renderer,route:window.__TinkerpetMission.world.routePoints.length,batched:window.__TinkerpetMission.world.staticStats?.batchSavings||0}));
  assert(state3d.loaded&&state3d.route>=2&&state3d.batched>0,'cidade texturizada ou GPS não carregou');
  for(const [x,z,area] of [[35,35,'FÁBRICA'],[-35,35,'LABORATÓRIO'],[35,-35,'ESCOLA'],[-35,-35,'PARQUE']]){
   const label=await page.evaluate(({x,z})=>{const a=window.__TinkerpetMission;a.state.drive.x=x;a.state.drive.z=z;a.physics(.12);return document.querySelector('#districtName').textContent},{x,z});
   assert(label.includes(area),'cor / identificação incorreta da área '+area+': '+label);
  }
  await page.evaluate(()=>{const a=window.__TinkerpetMission;a.resetGame();a.state.mode='drive';a.beginQuestion()});
  assert(await page.locator('#questionOverlay').isVisible(),'pergunta principal não apareceu');
  assert.equal(await page.locator('.answer').count(),4,'pergunta exige quatro alternativas');
  await page.screenshot({path:'artifacts/petgame-pergunta-'+size.name+'.png'});
  await page.evaluate(()=>{const a=window.__TinkerpetMission,q=a.questions[a.state.activeQuestion],txt=q[1][q[2]];const b=[...document.querySelectorAll('.answer')].find(el=>el.textContent.includes(txt));if(!b)throw Error('Resposta não encontrada');b.click()});
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','acerto deve voltar à avenida');
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
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.challengeEnd),started,'erro não pode reiniciar o relógio');
  await page.screenshot({path:'artifacts/petgame-diagnostico-'+size.name+'.png'});
  await page.locator('.diagnostic-card[data-diagnostic="'+fault.answer+'"]').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mode),'drive','acerto de diagnóstico deve voltar à missão');
  await page.evaluate(()=>window.__TinkerpetMission.beginRepair());
  await page.locator('#diagnosticClose').click();
  assert(await page.locator('#quitChallengeDialog').evaluate(e=>e.open),'sair do desafio exige confirmação');
  await page.locator('#quitCancel').click();
  assert(await page.locator('#repairOverlay').isVisible(),'cancelar saída deve manter o desafio');
  await page.locator('#diagnosticClose').click();
  await page.locator('#quitConfirm').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.lives),2,'abandonar desafio deve perder uma vida');
  await page.evaluate(()=>{const a=window.__TinkerpetMission;a.resetGame();a.state.drive.x=a.missions[0].to[0];a.state.drive.z=a.missions[0].to[1];a.physics(.016)});
  assert(await page.locator('#deliveryOverlay').isVisible(),'entrega do mapa não concluiu');
  await page.locator('#deliveryClose').click();
  assert.equal(await page.evaluate(()=>window.__TinkerpetMission.state.mission),1,'próxima entrega não avançou');
  await page.screenshot({path:'artifacts/petgame-cidade-'+size.name+'.png'});
  await context.close();
  console.log('PASS',size.name,'início, 3D, regiões, 10 perguntas, diagnóstico e entregas');
 }
 assert.deepEqual(errors,[],'erros JS no navegador: '+errors.join(' | '));
 console.log('PASS PETGame: aventura principal sem testes, oficina por 4 imagens, bairros texturizados, PC e celulares.');
}finally{await browser.close();server.kill()}
