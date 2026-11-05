'use strict';
(()=> {
 const $=id=>document.getElementById(id);
 const STORAGE='petlab-discoveries-v1';
 const IDS=['motors','energy','voltage','diagnosis','track'];
 const defaultState=()=>({done:[],motorStep:0,energyStep:0,diagStep:0,trackStep:0,selected:'motors'});
 function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
 function load(){
  try{
   const x=JSON.parse(localStorage.getItem(STORAGE)||'null');if(!x||!Array.isArray(x.done))return defaultState();
   return {done:x.done.filter(v=>IDS.includes(v)),motorStep:clamp(Number(x.motorStep)||0,0,3),
    energyStep:clamp(Number(x.energyStep)||0,0,2),diagStep:clamp(Number(x.diagStep)||0,0,2),
    trackStep:clamp(Number(x.trackStep)||0,0,3),selected:IDS.includes(x.selected)?x.selected:'motors'};
  }catch{return defaultState()}
 }
 let s=load(),probeSeen=new Set(),diagnosed=false,trackBusy=false;
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify(s))}catch{}}
 function status(id,message,tone=''){
  const el=$(id);if(!el)return;
  el.classList.remove('success','notice');if(tone)el.classList.add(tone);
  el.textContent=message;
 }
 function completed(id){
  if(!s.done.includes(id))s.done.push(id);
  save();updateProgress();
 }
 function updateProgress(){
  $('overallProgress').textContent=s.done.length+' de 5';
  $('progressBar').style.width=(s.done.length*20)+'%';
  document.querySelectorAll('[data-done]').forEach(el=>{el.textContent=s.done.includes(el.dataset.done)?'✓':''});
  document.querySelectorAll('[data-tab]').forEach(button=>{
   button.classList.toggle('completed',s.done.includes(button.dataset.tab));
   button.classList.toggle('active',s.selected===button.dataset.tab);
   if(s.selected===button.dataset.tab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
 }
 function select(id,scroll=false){
  if(!IDS.includes(id))return;
  s.selected=id;
  document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==id);
  updateProgress();save();
  if(scroll){const el=$('labTabs');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
 }
 // --- 1. Two DC motors: controls change the wheels right away. ---
 const motorGoals=[
  {title:'Faça o carrinho andar para frente em linha reta.',hint:'As duas rodas devem girar para a frente, com a mesma velocidade.',
   check:(a,b)=>a>=20&&b>=20&&Math.abs(a-b)<=10,
   good:'Isso! As duas rodas avançaram na mesma velocidade. O carrinho segue reto.'},
  {title:'Agora faça uma curva para a esquerda sem dar ré.',hint:'A roda direita precisa girar mais rápido que a esquerda.',
   check:(a,b)=>a>=0&&b>=30&&b-a>=20,
   good:'Boa descoberta! Quando o Motor B gira mais rápido que o A, o carrinho curva para a esquerda.'},
  {title:'Faça o carrinho girar no próprio lugar.',hint:'Experimente um motor para a frente e o outro para trás.',
   check:(a,b)=>a<=-20&&b>=20,
   good:'Conseguiu! As rodas em sentidos opostos fazem o carrinho girar no próprio eixo.'}
 ];
 function motorValues(){return [Number($('motorA').value),Number($('motorB').value)]}
 function setWheel(el,value){
  el.classList.toggle('spinning',value!==0);
  el.classList.toggle('backward',value<0);
  el.style.setProperty('--speed',Math.max(.16,1.15-(Math.abs(value)/100)*.92)+'s');
  el.style.animationPlayState=value===0?'paused':'running';
 }
 function renderMotorLive(){
  const [a,b]=motorValues();
  $('motorAValue').textContent=a+'%';$('motorBValue').textContent=b+'%';
  setWheel($('wheelLeft'),a);setWheel($('wheelRight'),b);
  $('motorLed').classList.toggle('on',a!==0||b!==0);
  let direction='Parado';
  if(a===0&&b===0)direction='Parado';
  else if(a<0&&b>0)direction='Girando à esquerda';
  else if(a>0&&b<0)direction='Girando à direita';
  else if(a<0&&b<0)direction='Em marcha à ré';
  else if(a>0&&b>0&&b-a>10)direction='Curva à esquerda';
  else if(a>0&&b>0&&a-b>10)direction='Curva à direita';
  else if(a>0&&b>0)direction='Seguindo em frente';
  else direction='Uma roda está em movimento';
  $('motorDirection').textContent=direction;
  $('motorObservation').textContent=a===0&&b===0?'As rodas estão paradas.':
   'A: '+(a<0?'ré ':a>0?'frente ':'parado ')+Math.abs(a)+'% · B: '+(b<0?'ré ':b>0?'frente ':'parado ')+Math.abs(b)+'%';
  const angle=a<0&&b>0?-25:a>0&&b<0?25:clamp((a-b)*.16,-12,12);
  $('simulationCar').style.transform='rotate('+angle+'deg)';
 }
 function renderMotorStage(){
  const n=s.motorStep;
  $('motorCounter').textContent=n>=3?'3 de 3 · Concluído':'Etapa '+(n+1)+' de 3';
  $('motorPrompt').textContent=n>=3?'Você descobriu como as velocidades dos motores A e B alteram a direção. Continue experimentando livremente.':motorGoals[n].title;
  $('motorNext').hidden=true;$('motorTest').disabled=false;
  $('motorTest').textContent=n>=3?'Experimentar novamente':'Testar meu movimento →';
  if(n>=3)status('motorFeedback','Laboratório dos motores concluído! Experimente outras combinações ou escolha outra atividade.','success');
  else status('motorFeedback',motorGoals[n].hint);
 }
 function testMotors(){
  if(s.motorStep>=3){status('motorFeedback','Você já concluiu este laboratório. Continue mexendo nas rodas para descobrir outros movimentos.','success');return}
  const [a,b]=motorValues(),goal=motorGoals[s.motorStep];
  if(goal.check(a,b)){
   status('motorFeedback',goal.good,'success');
   if(s.motorStep===2){s.motorStep=3;completed('motors');renderMotorStage()}
   else {$('motorNext').hidden=false;$('motorTest').disabled=true}
  }else{
   status('motorFeedback','Ainda não é esse movimento. '+goal.hint+' Não tem problema tentar de novo.','notice');
   $('motorNext').hidden=true;
  }
 }
 function changeMotor(){renderMotorLive();if(s.motorStep<3){$('motorTest').disabled=false;$('motorNext').hidden=true;}}
 // --- 2. Separate power circuits. ---
 let espOn=false,motorsOn=false;
 const energyGoals=[
  {title:'Deixe apenas o ESP32 ligado. Mantenha a alimentação dos motores desligada.',
   check:()=>espOn&&!motorsOn,
   good:'O ESP32 recebe energia da bateria de 9 V pelo LM2596. A ponte H continua sem a alimentação das pilhas AA.'},
  {title:'Agora ligue também a alimentação dos motores, mantendo o ESP32 ligado.',
   check:()=>espOn&&motorsOn,
   good:'As duas alimentações estão ativas. A ponte H recebe energia das pilhas AA, e o ESP32 pode enviar os comandos.'}
 ];
 function updateEnergyLive(){
  for(const [id,on] of [['switchEsp',espOn],['switchMotors',motorsOn]]){
   $(id).setAttribute('aria-checked',String(on));$(id).querySelector('b').textContent=on?'ON':'OFF';
  }
  $('lineEsp').classList.toggle('on',espOn);$('lineBridge').classList.toggle('on',motorsOn);
  $('espLed').classList.toggle('on',espOn);$('bridgeLed').classList.toggle('on',motorsOn);
  $('espStatus').textContent=espOn?'Energizado':'Desligado';
  $('bridgeStatus').textContent=motorsOn?'Alimentada':'Sem alimentação';
 }
 function renderEnergyStage(){
  const n=s.energyStep;
  $('energyCounter').textContent=n>=2?'2 de 2 · Concluído':'Etapa '+(n+1)+' de 2';
  $('energyPrompt').textContent=n>=2?'Você descobriu que a alimentação dos motores é separada da alimentação do ESP32.':energyGoals[n].title;
  $('energyNext').hidden=true;$('energyTest').disabled=false;
  if(n>=2)status('energyFeedback','Experiência concluída! Experimente ligar e desligar as duas gangorras.','success');
  else status('energyFeedback','Observe os LEDs do ESP32 e da ponte H. Eles podem ser ligados de forma independente.');
  updateEnergyLive();
 }
 function testEnergy(){
  if(s.energyStep>=2){status('energyFeedback','Você já concluiu a descoberta. Continue testando os dois interruptores.','success');return}
  const goal=energyGoals[s.energyStep];
  if(goal.check()){
   status('energyFeedback',goal.good,'success');
   if(s.energyStep===1){s.energyStep=2;completed('energy');renderEnergyStage()}
   else {$('energyNext').hidden=false;$('energyTest').disabled=true}
  }else status('energyFeedback','Observe novamente: '+goal.title+' Experimente mudar uma gangorra de cada vez.','notice');
 }
 // --- 3. Voltage measurement: educational, not a real circuit emulator. ---
 function volts(n){return n.toFixed(1).replace('.',',')+' V'}
 function renderVoltage(){
  const v=Number($('voltageRange').value);
  $('voltageScreen').textContent=volts(v);$('voltageBig').innerHTML=v.toFixed(1).replace('.',',')+' <small>V</small>';
  $('voltageRangeValue').textContent=volts(v);
  $('voltageMeter').classList.toggle('correct',v===5);
  $('voltWire').classList.toggle('on',v===5);
  $('voltageState').textContent=v===5?'Valor de referência atingido':v>5?'Acima de 5 V':'Abaixo de 5 V';
 }
 function testVoltage(){
  const v=Number($('voltageRange').value);
  if(v===5){completed('voltage');status('voltageFeedback','Medição confirmada! Nesta montagem, a saída ajustada para 5,0 V pode alimentar o VIN do ESP32.','success');}
  else status('voltageFeedback',v>5?'A saída está acima dos 5,0 V desejados. Reduza um pouco e observe o medidor.':'Ainda está abaixo de 5,0 V. Aumente lentamente e acompanhe o medidor.','notice');
 }
 // --- 4. Investigate a problem, gather evidence, change one control. ---
 const cases=[
  {prompt:'O ESP32 acende, mas nenhuma roda gira. Investigue os componentes antes de mexer no carrinho.',
   required:'switch',repair:'Ligar a gangorra dos motores',illustration:'⏻ Alimentação dos motores: OFF → ON',
   findings:{esp:'O ESP32 está ligado e recebe energia da bateria de 9 V.',battery:'As pilhas AA estão colocadas e têm energia.',
    switch:'Teste realizado: a gangorra dos motores está desligada.',bridge:'A ponte H não recebe energia das pilhas.',motor:'Os dois motores permanecem parados.'},
   good:'As pilhas agora alimentam a ponte H. Com o ESP32 enviando comandos, os motores podem girar.'},
  {prompt:'O Motor B gira, mas o Motor A não responde. Teste os componentes antes de tentar o reparo.',
   required:'motor',repair:'Encaixar conector do Motor A',illustration:'◉ Conector do Motor A: solto → encaixado',
   findings:{esp:'O ESP32 está funcionando e enviando os comandos.',battery:'O conjunto de pilhas AA fornece energia para a ponte H.',
    switch:'A gangorra dos motores já está ligada.',bridge:'A ponte H está alimentada e recebe sinais de controle.',motor:'O Motor B funciona. O cabo do Motor A está desconectado de sua saída.'},
   good:'O cabo do Motor A foi encaixado, permitindo que ele receba energia da ponte H. Os dois motores respondem.'}
 ];
 function renderDiagnosis(){
  const n=s.diagStep,item=cases[Math.min(n,1)];
  $('diagCounter').textContent=n>=2?'2 de 2 · Concluído':'Situação '+(n+1)+' de 2';
  $('diagPrompt').textContent=n>=2?'As duas situações foram resolvidas. Você pode investigar novamente os componentes.':item.prompt;
  $('probeCount').textContent=probeSeen.size+' de 5';
  document.querySelectorAll('[data-probe]').forEach(el=>el.classList.toggle('seen',probeSeen.has(el.dataset.probe)));
  const enough=probeSeen.size>=2&&probeSeen.has(item.required);
  $('repairControl').hidden=!enough||diagnosed||n>=2;
  $('diagTest').hidden=!diagnosed||n>=2;
  $('diagNext').hidden=true;
  $('diagRepair').textContent=item.repair+' →';
  $('repairIllustration').textContent=item.illustration;
  $('diagWheelA').classList.toggle('working',diagnosed||false);
  $('diagWheelB').classList.toggle('working',n===1||diagnosed);
  if(n===0&&!diagnosed){$('diagWheelA').classList.remove('working');$('diagWheelB').classList.remove('working')}
  $('diagGuidance').textContent=n>=2?'Você já concluiu as investigações.':
   diagnosed?'Observe o efeito da mudança. Faça um teste para verificar se o carrinho voltou a funcionar.':
   enough?'Você reuniu as evidências necessárias. Agora experimente corrigir o problema.':
   'Teste pelo menos dois componentes, incluindo aquele que apresenta o problema, antes de reparar.';
  if(n>=2){status('diagFeedback','Investigação concluída! Você aprendeu a usar evidências para reconhecer falhas.','success');}
 }
 function probe(key){
  const n=Math.min(s.diagStep,1),item=cases[n];
  if(!item.findings[key])return;
  probeSeen.add(key);$('probeReport').textContent=item.findings[key];
  renderDiagnosis();
  if(s.diagStep<2&&probeSeen.size<2)status('diagFeedback','Você já verificou '+probeSeen.size+' componente(s). Faça outros testes antes de reparar.');
 }
 function repair(){
  const item=cases[Math.min(s.diagStep,1)];
  if(probeSeen.size<2||!probeSeen.has(item.required))return;
  diagnosed=true;renderDiagnosis();
  status('diagFeedback','Você alterou o componente. Agora teste se o problema foi resolvido.');
 }
 function diagnoseTest(){
  if(!diagnosed)return;
  const n=s.diagStep,item=cases[Math.min(n,1)];
  status('diagFeedback',item.good,'success');
  $('diagTest').hidden=true;
  if(n===1){s.diagStep=2;completed('diagnosis');renderDiagnosis();}
  else {$('diagNext').hidden=false}
 }
 function nextDiagnosis(){
  if(s.diagStep>=2)return;
  s.diagStep++;probeSeen=new Set();diagnosed=false;
  $('probeReport').textContent='Escolha um componente e observe o resultado do teste.';
  renderDiagnosis();status('diagFeedback','Nova situação! Investigue os componentes e procure as evidências.');
  save();
 }
 // --- 5. Guided 2D path, no collisions or timer. Three different motor settings. ---
 const trackGoals=[
  {title:'Reta',hint:'As duas rodas precisam avançar com a mesma velocidade.',
   check:(a,b)=>a>=30&&b>=30&&Math.abs(a-b)<=10,
   good:'As rodas avançaram juntas. O carrinho percorreu a reta!'},
  {title:'Curva à esquerda',hint:'O Motor B (direito) deve girar mais rápido que o A (esquerdo).',
   check:(a,b)=>a>=0&&b>=30&&b-a>=20,
   good:'O Motor B ficou mais rápido, e o carrinho realizou a curva à esquerda.'},
  {title:'Curva à direita',hint:'Agora o Motor A (esquerdo) precisa girar mais rápido que o B.',
   check:(a,b)=>b>=0&&a>=30&&a-b>=20,
   good:'O Motor A ficou mais rápido, e o carrinho virou à direita até chegar à escola.'}
 ];
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d','M 79 286 H 220 Q 265 286 265 244 V 129 Q 265 94 310 94 H 518');
 path.setAttribute('fill','none');path.setAttribute('stroke','none');
 $('trackMap').appendChild(path);
 const distance=path.getTotalLength();
 const fractions=[0,.31,.7,1];
 function paintTrack(f){
  const len=Math.max(0,Math.min(distance,distance*f));
  const p=path.getPointAtLength(len),next=path.getPointAtLength(Math.min(distance,len+2));
  const deg=Math.atan2(next.x-p.x,-(next.y-p.y))*180/Math.PI;
  $('trackCar').setAttribute('transform','translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+') rotate('+deg.toFixed(2)+')');
 }
 function renderTrack(){
  const n=s.trackStep;
  $('trackCounter').textContent=n>=3?'3 de 3 · Chegou!':'Trecho '+(n+1)+' de 3';
  $('trackSectionLabel').textContent=n>=3?'Chegou à escola!':trackGoals[n].title;
  $('trackHint').textContent=n>=3?'Você completou todo o percurso.':trackGoals[n].hint;
  $('trackProgressLabel').textContent=n+'/3 trechos';
  $('trackMove').hidden=n>=3;$('trackRestart').hidden=n<3;
  $('trackMove').disabled=trackBusy;
  if(!trackBusy)paintTrack(fractions[n]);
  if(n>=3)status('trackFeedback','Missão cumprida! As velocidades diferentes fizeram o carrinho completar o percurso.','success');
 }
 function updateTrackValues(){
  $('trackAValue').textContent=$('trackMotorA').value+'%';
  $('trackBValue').textContent=$('trackMotorB').value+'%';
 }
 function moveTrack(){
  if(trackBusy||s.trackStep>=3)return;
  const n=s.trackStep,a=Number($('trackMotorA').value),b=Number($('trackMotorB').value);
  const goal=trackGoals[n];
  if(!goal.check(a,b)){
   status('trackFeedback','O carrinho ainda não conseguiu realizar esse movimento. '+goal.hint,'notice');return;
  }
  trackBusy=true;$('trackMove').disabled=true;
  status('trackFeedback','Observe o carrinho percorrendo o trecho...');
  const from=fractions[n],to=fractions[n+1],start=performance.now(),duration=980;
  function animate(t){
   const u=Math.min(1,(t-start)/duration),v=u*u*(3-2*u);
   paintTrack(from+(to-from)*v);
   if(u<1){requestAnimationFrame(animate);return}
   s.trackStep=n+1;trackBusy=false;completedStep();
   status('trackFeedback',goal.good,'success');
  }
  function completedStep(){if(s.trackStep>=3)completed('track');else save();renderTrack();}
  requestAnimationFrame(animate);
 }
 function restartTrack(){
  if(trackBusy)return;
  s.trackStep=0;s.done=s.done.filter(v=>v!=='track');save();updateProgress();renderTrack();
  status('trackFeedback','Nova volta! Ajuste as rodas para percorrer a reta.');
 }
 function reset(){
  if(!window.confirm('Recomeçar apenas as descobertas do PETLab? Os circuitos salvos no TinkerPET não serão alterados.'))return;
  s=defaultState();probeSeen=new Set();diagnosed=false;espOn=false;motorsOn=false;trackBusy=false;
  for(const id of ['motorA','motorB'])$(id).value=0;
  for(const id of ['trackMotorA','trackMotorB'])$(id).value=50;
  $('voltageRange').value=9;
  save();updateProgress();renderAll();select('motors',true);
 }
 function renderAll(){
  renderMotorLive();renderMotorStage();renderEnergyStage();renderVoltage();renderDiagnosis();renderTrack();updateTrackValues();
  if(s.done.includes('voltage'))status('voltageFeedback','Tensão ajustada! Você já concluiu esta experiência.','success');
 }
 function wireEvents(){
  $('labTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)select(b.dataset.tab)});
  $('resetLab').addEventListener('click',reset);
  for(const id of ['motorA','motorB'])$(id).addEventListener('input',changeMotor);
  document.querySelectorAll('[data-motor-preset]').forEach(b=>b.addEventListener('click',()=>{
   const p=b.dataset.motorPreset,vals=p==='straight'?[50,50]:p==='left'?[25,75]:[0,0];
   $('motorA').value=vals[0];$('motorB').value=vals[1];changeMotor();
  }));
  $('motorTest').addEventListener('click',testMotors);
  $('motorNext').addEventListener('click',()=>{if(s.motorStep<2){s.motorStep++;save();renderMotorStage()}});
  $('switchEsp').addEventListener('click',()=>{espOn=!espOn;updateEnergyLive();$('energyTest').disabled=false;$('energyNext').hidden=true});
  $('switchMotors').addEventListener('click',()=>{motorsOn=!motorsOn;updateEnergyLive();$('energyTest').disabled=false;$('energyNext').hidden=true});
  $('energyTest').addEventListener('click',testEnergy);
  $('energyNext').addEventListener('click',()=>{if(s.energyStep===0){s.energyStep=1;save();renderEnergyStage()}});
  $('voltageRange').addEventListener('input',renderVoltage);
  $('voltageTest').addEventListener('click',testVoltage);
  document.querySelectorAll('[data-probe]').forEach(b=>b.addEventListener('click',()=>probe(b.dataset.probe)));
  $('diagRepair').addEventListener('click',repair);
  $('diagTest').addEventListener('click',diagnoseTest);
  $('diagNext').addEventListener('click',nextDiagnosis);
  for(const id of ['trackMotorA','trackMotorB'])$(id).addEventListener('input',updateTrackValues);
  document.querySelectorAll('[data-track-preset]').forEach(b=>b.addEventListener('click',()=>{
   const preset=b.dataset.trackPreset,vals=preset==='equal'?[50,50]:preset==='left'?[30,75]:[75,30];
   $('trackMotorA').value=vals[0];$('trackMotorB').value=vals[1];updateTrackValues();
  }));
  $('trackMove').addEventListener('click',moveTrack);
  $('trackRestart').addEventListener('click',restartTrack);
 }
 wireEvents();renderAll();select(s.selected);
 window.PetlabDiagnostics={getState:()=>({...s}),select,version:'1.0'};
})();
