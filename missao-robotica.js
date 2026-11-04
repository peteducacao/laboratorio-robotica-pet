(()=>{'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlays=['startOverlay','questionOverlay','repairOverlay','pauseOverlay','deliveryOverlay','endOverlay'];
const missions=[
 {title:'Entrega na escola',desc:'Siga a faixa amarela até a escola.',to:[50,-50],label:'ESCOLA'},
 {title:'Peças para a fábrica',desc:'Siga a faixa amarela até a fábrica.',to:[50,50],label:'FÁBRICA'},
 {title:'Manutenção do parque',desc:'Siga a faixa amarela até o parque.',to:[-50,-50],label:'PARQUE'},
 {title:'Retorno ao laboratório',desc:'Siga a faixa amarela e finalize a aventura.',to:[-50,50],label:'LABORATÓRIO'}
];
const questions=[["O ESP32 liga, mas a ponte H está sem energia. O que conferir?",["Pilhas AA e gangorra dos motores","Bateria 9 V e gangorra do ESP32","Saída do LM2596 para o VIN","Fios de comando entre ESP32 e ponte H"],0],["Os dois motores avançam na mesma velocidade. O carrinho tende a...",["Girar no próprio eixo","Seguir em linha reta","Fazer uma curva constante","Recuar devagar"],1],["Para curvar à esquerda sem dar ré, qual ajuste ajuda?",["Motor esquerdo mais rápido","Ambos os motores na mesma velocidade","Motor direito mais rápido","Desligar as duas alimentações"],2],["Só o motor esquerdo parou; o direito segue. O que conferir?",["Saída do LM2596","Fios entre ponte H e motor esquerdo","Bateria de 9 V","Gangorra do ESP32"],1],["Por que usar bateria 9 V e pilhas AA separadas?",["Para somar as tensões no ESP32","Para substituir o regulador","Para alimentar controle e motores separadamente","Para dispensar o GND comum"],2],["Ao passar de frente para ré, o que muda nos motores?",["Sentido de giro dos dois","Quantidade de pilhas AA","Tensão ajustada no LM2596","Posição dos fios de alimentação"],0],["Qual é a função das gangorras no carrinho?",["Regular a velocidade de cada roda","Ligar e desligar as alimentações","Inverter o giro dos motores","Transmitir comandos do ESP32"],1],["Por que o LM2596 fica antes do ESP32?",["Para comandar o giro das rodas","Para dividir os sinais da ponte H","Para ajustar a tensão de alimentação","Para medir a energia das pilhas AA"],2],["Quem recebe os comandos do ESP32 e aciona os motores?",["LM2596","Suporte de pilhas","Gangorra","Ponte H"],3],["Após uma curva, os motores seguem iguais. O carrinho...",["Volta sozinho ao rumo anterior","Começa a dar ré","Segue reto na nova direção","Continua girando no mesmo lugar"],2]];
/* Questões reservadas por fase; cada destino só libera após concluir sua etapa.
   2 + 3 + 2 + 3 perguntas = 10 na aventura, mais 1 diagnóstico em cada fase. */
const STAGE_QUESTION_COUNTS=[2,3,2,3];
function createStageChallenges(){
 const pool=shuffled(questions.map((q,i)=>i));
 let cursor=0;
 return STAGE_QUESTION_COUNTS.map(count=>{
  const slots=pool.slice(cursor,cursor+count).map(index=>({kind:'question',index}));
  cursor+=count;
  slots.splice(Math.min(slots.length,1+rand(slots.length)),0,{kind:'repair'});
  return slots;
 });
}
const stageTotal=i=>STAGE_QUESTION_COUNTS[i]+1;
const baseWires=[
 {id:'p9',title:'Bateria 9 V (+) → gangorra ESP32 → LM2596 IN+',kind:'wire'},
 {id:'g9',title:'Bateria 9 V (−) → LM2596 IN−',kind:'wire'},
 {id:'v5',title:'LM2596 OUT+ (5 V) → ESP32 VIN',kind:'wire'},
 {id:'gn',title:'LM2596 OUT− → ESP32 GND',kind:'wire'},
 {id:'aa',title:'Suporte AA (+) → gangorra dos motores → Ponte H (+)',kind:'wire'},
 {id:'aag',title:'Suporte AA (−) → Ponte H (−)',kind:'wire'},
 {id:'commongnd',title:'Ponte H (−) → ESP32 GND',kind:'wire'},
 {id:'in1',title:'ESP32 D27 → Ponte H IN1',kind:'gpio',correct:'D27'},
 {id:'in2',title:'ESP32 D26 → Ponte H IN2',kind:'gpio',correct:'D26'},
 {id:'in3',title:'ESP32 D32 → Ponte H IN3',kind:'gpio',correct:'D32'},
 {id:'in4',title:'ESP32 D18 → Ponte H IN4',kind:'gpio',correct:'D18'},
 {id:'ma',title:'Ponte H MOTOR A → Motor esquerdo',kind:'wire'},
 {id:'mb',title:'Ponte H MOTOR B → Motor direito',kind:'wire'}
];
const faultPool=[
 {kind:'wire',id:'commongnd'},{kind:'wire',id:'in1'},{kind:'wire',id:'in2'},
 {kind:'wire',id:'in3'},{kind:'wire',id:'in4'},{kind:'wire',id:'ma'},
 {kind:'wire',id:'mb'},{kind:'wire',id:'v5'},{kind:'wire',id:'aa'},
 {kind:'wire',id:'p9'},{kind:'switch',id:'switch1'},{kind:'switch',id:'switch2'},
 {kind:'gpio',id:'in1',wrong:'D19'},{kind:'gpio',id:'in2',wrong:'D27'},
 {kind:'gpio',id:'in3',wrong:'D26'},{kind:'gpio',id:'in4',wrong:'D19'}
];

/* Diagnóstico integrado às missões. */
const diagnosticParts={
battery:['Bateria 9 V','battery-9v.svg'],bridge:['Ponte H','driver-mx1508.svg'],
esp:['ESP32','esp32.svg'],motor:['Motor DC','motor-front.svg'],
switch1:['Gangorra do ESP32 (9 V)','switch.svg'],switch2:['Gangorra dos motores (pilhas AA)','switch.svg'],
lm:['LM2596','lm2596.svg'],pack:['6 pilhas AA','battery-pack.svg'],jumper:['Jumper','jumpers.svg']
};
const diagnosticTests=[{"id":"pack","prompt":"O ESP32 liga, mas a ponte H não recebe energia das pilhas. Qual fonte verificar?","answer":"pack","options":["pack","battery","lm","esp"]},{"id":"bridge","prompt":"Há energia e comandos, mas nenhum motor responde. Qual módulo pode ter falhado?","answer":"bridge","options":["bridge","lm","battery","esp"]},{"id":"switch1","prompt":"A bateria de 9 V funciona, mas a alimentação do ESP32 está interrompida na chave. Qual peça conferir?","answer":"switch1","options":["switch1","switch2","bridge","motor"]},{"id":"switch2","prompt":"As pilhas estão carregadas, mas a chave dos motores está desligada. Qual peça verificar?","answer":"switch2","options":["switch2","switch1","lm","esp"]},{"id":"jumper","prompt":"O sinal não chega à ponte H porque um fio se soltou. O que reconectar?","answer":"jumper","options":["jumper","motor","pack","battery"]},{"id":"lm","prompt":"A bateria de 9 V funciona, mas a tensão de entrada do ESP32 não foi ajustada. Qual módulo verificar?","answer":"lm","options":["lm","bridge","switch2","motor"]},{"id":"motor","prompt":"A ponte H responde, mas uma roda não gira mesmo com os fios ligados. Qual peça pode falhar?","answer":"motor","options":["motor","esp","lm","switch1"]},{"id":"esp","prompt":"A alimentação está correta, mas não chegam comandos à ponte H. Qual placa investigar?","answer":"esp","options":["esp","pack","battery","motor"]},{"id":"battery","prompt":"O regulador não recebe energia, embora a gangorra da bateria de 9 V esteja ligada. Qual fonte conferir?","answer":"battery","options":["battery","pack","bridge","motor"]},{"id":"switch2","prompt":"O carrinho liga, mas os motores só recebem energia quando a gangorra das pilhas AA é acionada. Qual é?","answer":"switch2","options":["switch2","switch1","lm","esp"]}];
const state={mode:'start',ready:false,lives:3,mission:0,questionsCorrect:new Set(),asked:[],scoreQuestions:0,scoreRepairs:0,scoreCorrect:0,scoreWrong:0,scoreMissions:0,elapsedMs:0,activeSince:null,timerStarted:false,meters:0,nextEvent:26,nextEventTime:20,driveSeconds:0,eventCount:0,lastFault:null,lastDiagnosis:null,drive:{x:-50,z:50,angle:-Math.PI/2,a:0,b:0,collided:false},desired:[0,0],pointer:[null,null],pointerValue:[0,0],keys:new Set(),cameraTop:true,repairTab:'power',quitRemaining:0,challengeTimer:null,challengeStarted:0,challengeEnd:0,activeQuestion:null,fault:null,wires:null,switches:null,gpios:null,skipUntil:0,completed:false,recordsSaved:false,stageChallenges:[],stageSlot:0,stageMeters:0,stageLastEventMeters:0,stageLastEventSeconds:0,stageGateToastAt:0};
const world={THREE:null,renderer:null,scene:null,camera:null,car:null,carLed:null,uiTimer:0,staticStats:null,wheels:[],walls:[],goal:null,goalLabel:null,goalBeam:null,routeGroup:null,routePoints:[],routeDistance:0,routeLastPos:null,routeLastMission:-1,clockTime:0,lastFrame:0,runFrame:false,sky:null,clouds:[],clockUiAt:0,minimapUiAt:0,collisionToastAt:0,ambientMovers:[]};
const rand=n=>Math.floor(Math.random()*n);
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function overlay(name){for(const id of overlays)$(id).hidden=id!==name;}
function toast(message,error=false){const e=$('toast');e.textContent=message;e.className='game-toast visible'+(error?' error':'');clearTimeout(toast.t);toast.t=setTimeout(()=>{e.className='game-toast'},2300)}
const formatDuration=ms=>{
 const seconds=Math.floor(Math.max(0,ms)/1000),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;
 return(hours?String(hours)+':':'')+String(minutes).padStart(2,'0')+':'+String(rest).padStart(2,'0');
};
const clockMs=()=>state.elapsedMs+(state.activeSince===null?0:Math.max(0,performance.now()-state.activeSince));
function updateClock(){const node=$('runTimer');if(node)node.textContent='◷ '+formatDuration(clockMs());}
function setMode(mode){
 const now=performance.now();
 if(state.activeSince!==null){state.elapsedMs+=Math.max(0,now-state.activeSince);state.activeSince=null;}
 state.mode=mode;
 if(state.timerStarted&&!state.completed&&['drive','question','repair'].includes(mode))state.activeSince=now;
 overlay(mode==='drive'?null:mode+'Overlay');updateClock();
}
/* Dados locais do dispositivo — nenhuma conta ou servidor é necessário. */
const RECORDS_KEY='tinkerpet-petgame-recordes-v1',SOUND_KEY='tinkerpet-petgame-som-v1';
function readRecords(){
 try{
  const data=JSON.parse(localStorage.getItem(RECORDS_KEY)||'{}');
  return data&&typeof data==='object'?data:{};
 }catch{return{}}
}
function persistRecords(data){try{localStorage.setItem(RECORDS_KEY,JSON.stringify(data))}catch{}}
function displayRecords(){
 const record=readRecords(),best=record.fastestMs;
 const fmt=Number.isFinite(best)?formatDuration(best):'—';
 $('recordBestTime').textContent=fmt;
 $('recordBestScore').textContent=Number.isFinite(record.maxCorrect)?String(record.maxCorrect):'—';
 const bestRun=record.bestRun;
 $('recordBestRun').textContent=bestRun&&Number.isFinite(bestRun.correct)&&Number.isFinite(bestRun.wrong)?
  bestRun.correct+' acertos · '+bestRun.wrong+' erros':'—';
 $('startRecord').textContent=Number.isFinite(best)?'Seu recorde: '+fmt:'Seu primeiro recorde começa aqui';
}
function storeRunRecord(won){
 if(state.recordsSaved)return;
 state.recordsSaved=true;
 const old=readRecords(),elapsed=Math.max(0,Math.round(clockMs()));
 const fresh={...old,plays:(Number(old.plays)||0)+1,lastMs:elapsed,lastCorrect:state.scoreCorrect,lastWrong:state.scoreWrong,lastWon:won};
 let newFast=false,newScore=false,newPerf=false;
 if(won){
  const prev=Number(old.fastestMs);
  if(!Number.isFinite(prev)||prev<=0||elapsed<prev){fresh.fastestMs=elapsed;newFast=true}
  if(!Number.isFinite(old.maxCorrect)||state.scoreCorrect>old.maxCorrect){fresh.maxCorrect=state.scoreCorrect;newScore=true}
  const performanceScore=state.scoreCorrect*3-state.scoreWrong;
  if(!Number.isFinite(old.bestPerformance)||performanceScore>old.bestPerformance||
   (performanceScore===old.bestPerformance&&(!old.bestRun||elapsed<old.bestRun.timeMs))){
   fresh.bestPerformance=performanceScore;fresh.bestRun={correct:state.scoreCorrect,wrong:state.scoreWrong,timeMs:elapsed};
   newPerf=true;
  }
 }
 persistRecords(fresh);
 $('newRecord').hidden=!newFast&&!newScore&&!newPerf;
 $('newRecord').textContent=newFast?'★ NOVO RECORDE DE TEMPO!':
  newScore?'★ NOVO RECORDE DE ACERTOS!':'★ SUA MELHOR PARTIDA!';
 displayRecords();
}
const sound={
 enabled:false,ctx:null,osc:null,gain:null,lastEngineUpdate:0
};
try{sound.enabled=localStorage.getItem(SOUND_KEY)==='on'}catch{}
function refreshSoundButton(){
 const btn=$('soundBtn');if(!btn)return;
 btn.innerHTML=sound.enabled?
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/></svg>':
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
 btn.setAttribute('aria-pressed',String(sound.enabled));
 btn.setAttribute('aria-label',sound.enabled?'Desativar sons do jogo':'Ativar sons do jogo');
 btn.title=sound.enabled?'Desativar sons':'Ativar sons';
}
function unlockAudio(){
 if(!sound.enabled)return;
 try{
  if(!sound.ctx){
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return;
   const ctx=new Audio(),osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type='triangle';osc.frequency.value=70;gain.gain.value=0;
   osc.connect(gain);gain.connect(ctx.destination);osc.start();
   sound.ctx=ctx;sound.osc=osc;sound.gain=gain;
  }
  if(sound.ctx.state==='suspended')sound.ctx.resume().catch(()=>{});
 }catch{sound.enabled=false;refreshSoundButton()}
}
function toggleAudio(){
 sound.enabled=!sound.enabled;
 try{localStorage.setItem(SOUND_KEY,sound.enabled?'on':'off')}catch{}
 if(sound.enabled)unlockAudio();
 else if(sound.ctx){
  sound.gain?.gain.setTargetAtTime(0,sound.ctx.currentTime,.025);
  sound.ctx.suspend().catch(()=>{});
 }
 refreshSoundButton();
 if(sound.enabled)playSound('on')
}
function playSound(type){
 if(!sound.enabled)return;
 unlockAudio();
 if(!sound.ctx||sound.ctx.state!=='running')return;
 const ctx=sound.ctx,notes={
  on:[[650,.07],[900,.10]],correct:[[610,.08],[820,.14]],
  wrong:[[270,.10],[210,.10]],delivery:[[540,.10],[720,.11],[960,.20]],
  finish:[[523,.09],[659,.10],[784,.14],[1047,.25]]
 }[type]||[];
 let offset=0;
 for(const [frequency,duration] of notes){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type='sine';o.frequency.value=frequency;
  const at=ctx.currentTime+offset;
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.04,at+.014);
  g.gain.exponentialRampToValueAtTime(.001,at+duration);
  o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+duration+.012);
  o.onended=()=>{o.disconnect();g.disconnect()};offset+=duration*.80;
 }
}
function updateEngine(now){
 if(!sound.ctx||!sound.gain||now-sound.lastEngineUpdate<85)return;
 sound.lastEngineUpdate=now;
 const velocity=isDrive()?Math.max(Math.abs(state.drive.a),Math.abs(state.drive.b)):0;
 const t=sound.ctx.currentTime;
 sound.gain.gain.setTargetAtTime(sound.enabled?Math.min(.014,velocity/255*.012):0,t,.08);
 sound.osc.frequency.setTargetAtTime(65+velocity*.31,t,.08);
}
/* Mini GPS 2D: vias, posição do robô, direção, trajeto e entrega. */
function drawMiniMap(){
 if(!world.THREE||$('minimap').classList.contains('collapsed'))return;
 const canvas=$('miniCanvas'),ctx=canvas?.getContext?.('2d');
 if(!ctx)return;
 const w=canvas.width,h=canvas.height,scale=w/152;
 const px=x=>(x+76)*scale,pz=z=>(z+76)*scale;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#d6e8dc';ctx.fillRect(0,0,w,h);
 for(const [x,z,color] of [[-38,38,'#bde0e6'],[38,38,'#f3d6ae'],[38,-38,'#d6eab8'],[-38,-38,'#b7dfbe']]){
  ctx.fillStyle=color;ctx.fillRect(px(x-37),pz(z-37),74*scale,74*scale)
 }
 ctx.fillStyle='#72808a';
 for(const n of [-50,-30,-10,10,30,50]){
  ctx.fillRect(px(n-4.1),0,8.2*scale,h);
  ctx.fillRect(0,pz(n-4.1),w,8.2*scale);
 }
 ctx.save();ctx.strokeStyle='rgba(255,255,255,.56)';ctx.lineWidth=1.3;ctx.setLineDash([4,5]);
 for(const n of [-50,-30,-10,10,30,50]){
  ctx.beginPath();ctx.moveTo(px(n),0);ctx.lineTo(px(n),h);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,pz(n));ctx.lineTo(w,pz(n));ctx.stroke()
 }
 ctx.restore();
 if(world.routePoints?.length>1){
  ctx.beginPath();ctx.moveTo(px(state.drive.x),pz(state.drive.z));
  world.routePoints.slice(1).forEach(pt=>ctx.lineTo(px(pt[0]),pz(pt[1])));
  ctx.strokeStyle='#f3cf65';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()
 }
 const target=missions[Math.min(state.mission,missions.length-1)].to;
 ctx.fillStyle='#f9ba39';ctx.beginPath();ctx.arc(px(target[0]),pz(target[1]),7,0,2*Math.PI);ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 const d=state.drive;ctx.save();ctx.translate(px(d.x),pz(d.z));ctx.rotate(-d.angle);
 ctx.fillStyle='#058d86';ctx.strokeStyle='#fff';ctx.lineWidth=2.3;
 ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(8,8);ctx.lineTo(0,4);ctx.lineTo(-8,8);ctx.closePath();
 ctx.fill();ctx.stroke();ctx.restore();
}
function spawnDeliveryParticles(){
 const host=$('deliverySparkles');host.replaceChildren();
 for(let i=0;i<21;i++){
  const particle=document.createElement('span');particle.className='delivery-particle';
  const angle=i*2.3999,radius=90+(i%4)*17;
  particle.style.setProperty('--dx',Math.cos(angle)*radius+'px');
  particle.style.setProperty('--dy',Math.sin(angle)*radius*.65+'px');
  particle.style.setProperty('--delay',(i%5)*.045+'s');
  particle.style.setProperty('--color',['#08aa94','#ffd66b','#76b8ed','#f6a976'][i%4]);
  host.append(particle)
 }
 const dialog=$('deliveryOverlay').querySelector('.delivery-dialog');
 dialog.classList.remove('celebrating');void dialog.offsetWidth;dialog.classList.add('celebrating')
}
function clearChallengeTimer(){if(state.challengeTimer){clearInterval(state.challengeTimer);state.challengeTimer=null}}
function resetInputs(){state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0];for(let i=0;i<2;i++)setThumb(i,0)}
function stopRobot(){resetInputs();state.drive.a=0;state.drive.b=0;updateReadout()}
function updateLives(){$('lives').innerHTML=Array.from({length:3},(_,i)=>i<state.lives?'♥':'<span class="lost">♥</span>').join(' ');$('lives').setAttribute('aria-label',state.lives+' vidas')}
function updateMission(){const m=missions[Math.min(state.mission,missions.length-1)];$('missionNumber').textContent='MISSÃO '+String(state.mission+1).padStart(2,'0')+' DE 04';$('missionTitle').textContent=m.title;$('missionDesc').textContent=m.desc;$('missionDone').textContent=state.scoreMissions+'/4';$('missionDone').setAttribute('aria-label',state.scoreMissions+' de 4 entregas concluídas');updateStageProgress();updateDistance();updateDistrict()}
function updateStageProgress(){
 const index=Math.min(state.mission,3),total=stageTotal(index);
 const done=Math.min(state.stageSlot,total),node=$('stageProgress');
 if(node)node.textContent='Desafios desta fase: '+done+'/'+total;
}
function currentStageSlot(){return state.stageChallenges[state.mission]?.[state.stageSlot]||null}
function nextStageDistance(){
 const stage=state.mission,from=stage===0?[-50,50]:missions[stage-1].to,to=missions[stage].to;
 const route=Math.abs(from[0]-to[0])+Math.abs(from[1]-to[1]);
 return route*(state.stageSlot+1)/(stageTotal(stage)+1)
}
function updateDistance(){if(state.completed)return;const m=missions[Math.min(state.mission,3)],d=Math.hypot(state.drive.x-m.to[0],state.drive.z-m.to[1]);$('missionDistance').textContent='Destino · '+Math.ceil(d)+' m';updateCompass()}
function updateDistrict(){
 const d=state.drive,area=Math.abs(d.x)<10&&Math.abs(d.z)<10?'CENTRO':d.x>=0?(d.z>=0?'FÁBRICA':'ESCOLA'):(d.z>=0?'LABORATÓRIO':'PARQUE');
 const tag=$('districtName');if(!tag)return;
 tag.textContent='ÁREA · '+area;
 tag.dataset.area=area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}
function setThumb(i,value){const id=i===0?'thumbA':'thumbB',track=$(i===0?'trackA':'trackB');const height=track.clientHeight||160;const half=(height-49)/2;$(id).style.top='calc(50% - '+(value/255*half).toFixed(1)+'px)'}
function updateReadout(){const a=Math.round(state.drive.a),b=Math.round(state.drive.b);$('speedA').textContent=a;$('speedB').textContent=b;$('trackA').setAttribute('aria-valuenow',String(a));$('trackB').setAttribute('aria-valuenow',String(b))}
function isDrive(){return state.mode==='drive'&&state.ready&&!state.completed}
function pointerToValue(ev,el){
 const r=el.getBoundingClientRect(),normalized=clamp(((r.top+r.height/2)-ev.clientY)/(r.height*.5-24),-1,1);
 return Math.round(normalized*255)
}
function installControl(i){const el=$(i===0?'trackA':'trackB');el.addEventListener('pointerdown',e=>{if(!isDrive())return;e.preventDefault();state.pointer[i]=e.pointerId;try{el.setPointerCapture(e.pointerId)}catch{}state.pointerValue[i]=pointerToValue(e,el);setThumb(i,state.pointerValue[i])});el.addEventListener('pointermove',e=>{if(state.pointer[i]!==e.pointerId||!isDrive())return;e.preventDefault();state.pointerValue[i]=pointerToValue(e,el);setThumb(i,state.pointerValue[i])});const release=e=>{if(state.pointer[i]!==e.pointerId)return;state.pointer[i]=null;state.pointerValue[i]=0;setThumb(i,0)};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
el.addEventListener('keydown',e=>{if(!isDrive())return;let change=0;if(e.key==='ArrowUp')change=35;else if(e.key==='ArrowDown')change=-35;else if(e.key==='Home'){e.preventDefault();state.pointer[i]=null;state.pointerValue[i]=0;setThumb(i,0);return}else return;e.preventDefault();state.pointer[i]='keyboard-slider';state.pointerValue[i]=clamp(state.pointerValue[i]+change,-255,255);setThumb(i,state.pointerValue[i])})}
function installKeys(){const used=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!used.has(k)||!isDrive())return;if(e.target.matches('input,textarea,select'))return;e.preventDefault();state.keys.add(k)});document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(used.has(k)){state.keys.delete(k);if(isDrive())e.preventDefault()}});window.addEventListener('blur',()=>{state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0]});document.addEventListener('visibilitychange',()=>{if(document.hidden){state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0]}})}
function keysPressed(){return state.keys.size>0}
function commands(){
 if(state.drive.collided){
  if(state.pointer.every(p=>p===null)&&!keysPressed())state.drive.collided=false;
  return[0,0]
 }
 // Controle independente por motor, como na versão original aprovada.
 if(state.pointer.some(p=>p!==null))return[state.pointerValue[0],state.pointerValue[1]];
 const k=state.keys,front=k.has('w')||k.has('arrowup'),
 back=k.has('s')||k.has('arrowdown'),left=k.has('a')||k.has('arrowleft'),right=k.has('d')||k.has('arrowright');
 let base=front&&!back?230:back&&!front?-195:0;
 return[Math.round(base*(left?.34:1)),Math.round(base*(right?.34:1))]
}
function installUI(){
$('startBtn').addEventListener('click',()=>{if(!state.ready)return;unlockAudio();resetGame();setMode('drive');toast('Aventura iniciada. Siga a faixa amarela até o destino!')});
$('soundBtn').addEventListener('click',toggleAudio);
$('minimapToggle').addEventListener('click',()=>{const pane=$('minimap'),collapsed=pane.classList.toggle('collapsed');$('minimapToggle').textContent=collapsed?'+':'−';$('minimapToggle').setAttribute('aria-expanded',String(!collapsed));if(!collapsed)drawMiniMap()});refreshSoundButton();displayRecords();
$('nextMissionBtn').addEventListener('click',advanceMission);$('deliveryClose').addEventListener('click',advanceMission);
$('pauseBtn').addEventListener('click',()=>{if(!isDrive())return;stopRobot();setMode('pause')});
$('resumeBtn').addEventListener('click',()=>{setMode('drive');stopRobot()});
$('pauseClose').addEventListener('click',()=>{setMode('drive');stopRobot()});
$('restartBtn').addEventListener('click',()=>{unlockAudio();resetGame();setMode('drive');toast('Nova aventura iniciada!')});
$('viewBtn').addEventListener('click',()=>{state.cameraTop=!state.cameraTop;$('viewBtn').setAttribute('aria-label',state.cameraTop?'Ativar visão do motorista':'Ativar câmera externa');toast(state.cameraTop?'Câmera atrás do carrinho':'Visão do motorista')});
$('fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen()}catch{toast('Tela cheia não está disponível neste navegador.')}});
$('exitGameBtn').addEventListener('click',()=>{window.location.href='projects.html'});
$('questionClose').addEventListener('click',requestQuitChallenge);
$('diagnosticClose').addEventListener('click',requestQuitChallenge);
$('diagnosticChoices').addEventListener('click',e=>{const card=e.target.closest('button[data-diagnostic]');if(card&&!card.disabled)chooseDiagnostic(card.dataset.diagnostic,card)});
$('quitCancel').addEventListener('click',cancelQuitChallenge);
$('quitConfirm').addEventListener('click',confirmQuitChallenge);
$('quitChallengeDialog').addEventListener('cancel',e=>{e.preventDefault();cancelQuitChallenge()});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if($('quitChallengeDialog').open){e.preventDefault();cancelQuitChallenge();return}
 if(state.mode==='question'||state.mode==='repair'){e.preventDefault();requestQuitChallenge();return}
 if(state.mode==='drive'){e.preventDefault();stopRobot();setMode('pause');return}
 if(state.mode==='pause'){e.preventDefault();setMode('drive');stopRobot();return}
 if(state.mode==='delivery'){e.preventDefault();advanceMission();return}
 if(state.mode==='start'||state.mode==='end'){e.preventDefault();window.location.href='projects.html'}
});
installControl(0);installControl(1);installKeys();
window.addEventListener('resize',()=>{if(world.renderer&&world.camera){const w=$('scene').clientWidth,h=$('scene').clientHeight;world.camera.aspect=Math.max(1,w)/Math.max(1,h);world.camera.updateProjectionMatrix();world.renderer.setSize(w,h)}})}
function resetGame(){clearChallengeTimer();state.lives=3;state.mission=0;state.scoreMissions=0;state.scoreQuestions=0;state.scoreRepairs=0;state.scoreCorrect=0;state.scoreWrong=0;state.elapsedMs=0;state.activeSince=null;state.timerStarted=true;state.questionsCorrect=new Set();state.asked=[];state.meters=0;state.nextEvent=26;state.nextEventTime=20;state.driveSeconds=0;state.eventCount=0;state.lastFault=null;state.lastDiagnosis=null;state.completed=false;state.drive={x:-50,z:50,angle:-Math.PI/2,a:0,b:0,collided:false};state.desired=[0,0];state.pointer=[null,null];state.pointerValue=[0,0];state.keys.clear();state.skipUntil=0;state.recordsSaved=false;state.stageChallenges=createStageChallenges();state.stageSlot=0;state.stageMeters=0;state.stageLastEventMeters=0;state.stageLastEventSeconds=0;state.stageGateToastAt=0;state.cameraTop=true;state.repairTab='power';$('viewBtn').setAttribute('aria-label','Ativar visão do motorista');setThumb(0,0);setThumb(1,0);updateReadout();updateLives();updateMission();updateClock();if(world.car){world.car.position.set(-50,0,50);world.car.rotation.y=-Math.PI/2;for(const wheel of world.wheels)wheel.pivot.rotation.x=0}updateGoal();updateRoute(true)}
function loseLife(reason){
 const was=state.mode;
 if(was==='question'||was==='repair'){
  state.scoreWrong++;playSound('wrong');
  const slot=currentStageSlot();
  if(slot&&((was==='question'&&slot.kind==='question'&&slot.index===state.activeQuestion)||
   (was==='repair'&&slot.kind==='repair'))){state.stageSlot++;updateStageProgress()}
  state.stageLastEventMeters=state.stageMeters;state.stageLastEventSeconds=state.driveSeconds
 }
 clearChallengeTimer();state.lives--;updateLives();
 if(state.lives<=0){endGame(false);return}
 setMode('drive');stopRobot();state.drive.collided=true;
 toast(reason||'Tempo esgotado. Você perdeu uma vida.',true);
 state.skipUntil=performance.now()+2100
}
function endGame(won){
 stopRobot();clearChallengeTimer();setMode('end');state.completed=true;
 storeRunRecord(won);if(won)playSound('finish');
 const time=formatDuration(clockMs()),attempts=state.scoreCorrect+state.scoreWrong;
 $('endKicker').textContent=won?'AVENTURA CONCLUÍDA':'FIM DE JOGO';
 $('endSymbol').textContent=won?'★':'♥';
 $('endTitle').textContent=won?'Missão cumprida!':'Fim de jogo';
 const counted=state.scoreCorrect+' '+(state.scoreCorrect===1?'acerto':'acertos')+
  ' e '+state.scoreWrong+' '+(state.scoreWrong===1?'erro':'erros');
 $('endDescription').textContent=won?
  'Você completou as quatro entregas em '+time+'. Foram '+counted+'.':
  'Você concluiu '+state.scoreMissions+' de 4 entregas em '+time+'. Foram '+counted+'.';
 $('scoreElapsed').textContent=time;
 $('scoreMissions').textContent=String(state.scoreMissions);
 $('scoreCorrect').textContent=String(state.scoreCorrect);
 $('scoreWrong').textContent=String(state.scoreWrong);
 $('scoreQuestions').textContent=String(state.scoreQuestions);
 $('scoreRepairs').textContent=String(state.scoreRepairs);
 const rate=attempts?state.scoreCorrect/attempts:0;
 $('scoreFeedback').textContent=attempts===0?
  'Você percorreu a cidade sem responder a desafios.':
  rate>=.8?'Ótimo domínio do circuito! Continue praticando a direção.':
  rate>=.5?'Bom trabalho! Reveja os desafios em que teve dúvidas.':
  'Você completou etapas importantes. Vale revisar as conexões e os componentes.';
}
function startTimer(kind,remaining=30000){clearChallengeTimer();state.challengeStarted=performance.now();state.challengeEnd=state.challengeStarted+remaining;const tick=()=>{if(state.mode!==kind)return;const sec=Math.max(0,(state.challengeEnd-performance.now())/1000),node=$(kind+'Timer'),bar=$(kind+'Timebar');node.textContent=String(Math.ceil(sec));bar.style.width=(sec/30*100).toFixed(2)+'%';bar.classList.toggle('low',sec<10);node.parentElement.classList.toggle('danger',sec<10);if(sec<=0)loseLife()};state.challengeTimer=setInterval(tick,100);tick()}

function requestQuitChallenge(){
 if(state.mode!=='question'&&state.mode!=='repair')return;
 if($('quitChallengeDialog').open)return;
 state.quitRemaining=Math.max(1,state.challengeEnd-performance.now());
 clearChallengeTimer();
 // A confirmação de saída não consome o tempo da aventura.
 if(state.activeSince!==null){state.elapsedMs+=Math.max(0,performance.now()-state.activeSince);state.activeSince=null}
 $('quitChallengeDialog').showModal();updateClock()
}
function cancelQuitChallenge(){
 if($('quitChallengeDialog').open)$('quitChallengeDialog').close();
 if(state.mode==='question'||state.mode==='repair'){
  if(state.timerStarted&&!state.completed)state.activeSince=performance.now();
  startTimer(state.mode,state.quitRemaining)
 }
}
function confirmQuitChallenge(){if($('quitChallengeDialog').open)$('quitChallengeDialog').close();if(state.mode==='question'||state.mode==='repair')loseLife('Desafio abandonado: você perdeu uma vida.')}

function pickQuestion(){
 const indices=(state.stageChallenges[state.mission]||[]).filter(slot=>slot.kind==='question').map(slot=>slot.index);
 const available=indices.filter(i=>!state.questionsCorrect.has(i));
 if(!available.length)return null;
 const index=available[rand(available.length)];state.asked.push(index);return index
}
function renderQuestion(assignedIndex=null){const i=assignedIndex===null?pickQuestion():assignedIndex;if(i===null){solveChallenge('Todas as perguntas foram respondidas!');return}state.activeQuestion=i;const q=questions[i];$('questionText').textContent=q[0];$('answers').replaceChildren();shuffled(q[1].map((txt,index)=>({txt,correct:index===q[2]}))).forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='answer';const letter=document.createElement('span');letter.className='letter';letter.textContent='ABCD'[i];const label=document.createElement('span');label.textContent=a.txt;b.append(letter,label);b.addEventListener('click',()=>answer(a.correct,b));$('answers').append(b)});}
function beginQuestion(assignedIndex=null){
 stopRobot();setMode('question');
 $('questionEyebrow').textContent='PARADA DE CONHECIMENTO · FASE '+(state.mission+1);
 $('questionResponse').textContent='Atenção: uma resposta incorreta custa uma vida.';
 renderQuestion(assignedIndex);
 if(state.mode==='question')startTimer('question')
}
function answer(correct,button){
 if(state.mode!=='question')return;
 if(performance.now()>=state.challengeEnd){loseLife();return}
 if(correct){
  playSound('correct');state.questionsCorrect.add(state.activeQuestion);
  state.scoreQuestions++;state.scoreCorrect++;
  solveChallenge('Resposta correta! Continue a missão.');return
 }
 if(button){button.disabled=true;button.classList.add('wrong')}
 loseLife('Resposta incorreta! Você perdeu uma vida.')
}
function beginDiagnostic(){
 stopRobot();
 const fresh=diagnosticTests.filter(item=>item!==state.lastDiagnosis);
 state.fault=fresh[rand(fresh.length)];
 state.lastDiagnosis=state.fault;
 $('diagnosticQuestion').textContent=state.fault.prompt;
 $('diagnosticFeedback').textContent='Atenção: escolher o componente errado custa uma vida.';
 const grid=$('diagnosticChoices');grid.replaceChildren();
 for(const key of shuffled(state.fault.options)){
  const [name,file]=diagnosticParts[key],card=document.createElement('button');
  card.type='button';card.className='diagnostic-card';card.dataset.diagnostic=key;
  card.setAttribute('aria-label','Selecionar '+name);
  const img=document.createElement('img');img.src='assets/component-preview/'+file;img.alt='';img.loading='eager';
  const label=document.createElement('span');label.textContent=name;card.append(img,label);grid.append(card);
 }
 setMode('repair');startTimer('repair');
}
function chooseDiagnostic(key,card){
 if(state.mode!=='repair'||!state.fault)return;
 if(performance.now()>=state.challengeEnd){loseLife();return}
 if(key!==state.fault.answer){card.disabled=true;card.classList.add('wrong');loseLife('Diagnóstico incorreto! Você perdeu uma vida.');return}
 state.scoreRepairs++;state.scoreCorrect++;playSound('correct');solveChallenge('Diagnóstico correto! Circuito restabelecido.');
}
function beginRepair(){beginDiagnostic()}
function solveChallenge(message){
 const slot=currentStageSlot();
 if(slot&&((state.mode==='question'&&slot.kind==='question'&&slot.index===state.activeQuestion)||
  (state.mode==='repair'&&slot.kind==='repair'))){state.stageSlot++;updateStageProgress()}
 state.stageLastEventMeters=state.stageMeters;
 state.stageLastEventSeconds=state.driveSeconds;
 clearChallengeTimer();setMode('drive');stopRobot();state.drive.collided=true;
 state.skipUntil=performance.now()+2100;toast(message)
}
function triggerEvent(force=false){
 if(!isDrive()||!currentStageSlot())return false;
 if(performance.now()<state.skipUntil)return false;
 // Separação real na estrada: sem desafios consecutivos logo após responder.
 if(state.stageSlot>0&&(state.stageMeters-state.stageLastEventMeters<15||
   state.driveSeconds-state.stageLastEventSeconds<5.5))return false;
 if(!force&&state.stageMeters<nextStageDistance())return false;
 const slot=currentStageSlot();state.eventCount++;
 if(slot.kind==='question')beginQuestion(slot.index);else beginRepair();
 return true
}
function completeMission(){
 if(currentStageSlot()){
  if(!triggerEvent(true)&&performance.now()-state.stageGateToastAt>6000){
   state.stageGateToastAt=performance.now();
   toast('Ainda há desafios nesta fase. Continue dirigindo para encontrá-los.')
  }
  return
 }
 const m=missions[state.mission];state.scoreMissions++;stopRobot();state.drive.collided=true;playSound('delivery');
 $('deliveryTitle').textContent=m.label==='ESCOLA'?'Entrega na escola concluída!':m.label==='FÁBRICA'?'Entrega na fábrica concluída!':m.label==='PARQUE'?'Entrega no parque concluída!':'Retorno ao laboratório concluído!';
 $('deliveryDesc').textContent='Você chegou ao destino! Entrega '+state.scoreMissions+' de '+missions.length+' concluída.';
 $('deliveryProgress').textContent=state.scoreMissions+' de '+missions.length+' entregas concluídas';
 $('nextMissionBtn').innerHTML=state.scoreMissions>=missions.length?'Ver resultado <span>→</span>':'Próxima entrega <span>→</span>';
 setMode('delivery');spawnDeliveryParticles();
}
function advanceMission(){if(state.mode!=='delivery')return;state.mission++;
 if(state.mission>=missions.length){endGame(true);return}
 state.stageSlot=0;state.stageMeters=0;state.stageLastEventMeters=0;state.stageLastEventSeconds=state.driveSeconds;state.stageGateToastAt=0;updateMission();updateGoal();state.skipUntil=performance.now()+1000;
 setMode('drive');stopRobot();toast('Entrega concluída. Siga a rota para a próxima!');
}

function boot(){installUI();updateLives();updateMission();setMode('start');load3D()}
async function load3D(){try{
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
 init3D(THREE);state.ready=true;$('startBtn').disabled=false;
 }catch(error){console.error('Não foi possível carregar a cidade 3D',error);$('startBtn').disabled=true;$('startBtn').textContent='Não foi possível carregar o mapa 3D';toast('Não foi possível carregar o cenário 3D. Verifique a conexão.',true)}
}
function init3D(T){
world.THREE=T;const scene=new T.Scene();
scene.background=new T.Color(0xc7e0ec);scene.fog=new T.Fog(0xc7e0ec,124,234);world.scene=scene;
const camera=new T.PerspectiveCamera(75,Math.max(1,$('scene').clientWidth)/Math.max(1,$('scene').clientHeight),.1,260);world.camera=camera;
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.matchMedia('(pointer: coarse)').matches?1.15:1.45));renderer.setSize(Math.max(1,$('scene').clientWidth),Math.max(1,$('scene').clientHeight));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;$('scene').append(renderer.domElement);world.renderer=renderer;
scene.add(new T.HemisphereLight(0xf0f7ff,0xa79e82,2.0));
const daylight=new T.DirectionalLight(0xffeed4,2.0);daylight.position.set(55,80,-35);scene.add(daylight);
// Dome com transição suave do azul alto ao horizonte; sempre acompanha a câmera.
const sky=new T.Mesh(new T.SphereGeometry(245,28,16),new T.ShaderMaterial({
 side:T.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:'varying vec3 vDir; void main(){float h=normalize(vDir).y;float t=smoothstep(-0.10,0.70,h);vec3 horizon=vec3(0.83,0.90,0.94);vec3 top=vec3(0.25,0.57,0.88);gl_FragColor=vec4(mix(horizon,top,t),1.0);}'
}));
sky.frustumCulled=false;sky.renderOrder=-5;scene.add(sky);world.sky=sky;
function cloudCanvas(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
 const ctx=canvas.getContext('2d');
 for(const [cx,cy,rx,ry] of [[78,76,49,27],[115,56,59,35],[161,72,56,28],[197,81,30,19]]){
  ctx.save();ctx.translate(cx,cy);ctx.scale(1,ry/rx);
  const g=ctx.createRadialGradient(0,0,6,0,0,rx);
  g.addColorStop(0,'rgba(255,255,255,.95)');
  g.addColorStop(.60,'rgba(255,255,255,.82)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();ctx.restore()
 }
 return canvas
}
const cloudTexture=new T.CanvasTexture(cloudCanvas());cloudTexture.colorSpace=T.SRGBColorSpace;
for(const [x,y,z,w] of [[95,53,40,27],[110,42,-28,35],[-80,55,-115,43],[20,43,-105,35],[-125,47,30,37],[0,50,125,38],[115,51,110,28],[-100,51,110,32],[70,58,-110,42]]){
 const cloud=new T.Sprite(new T.SpriteMaterial({map:cloudTexture,transparent:true,depthWrite:false,opacity:.89,fog:false}));
 cloud.position.set(x,y,z);cloud.scale.set(w,w*.50,1);cloud.userData.origin=x;scene.add(cloud);world.clouds.push(cloud)
}
const sunCanvas=document.createElement('canvas');sunCanvas.width=sunCanvas.height=256;
const sc=sunCanvas.getContext('2d'),halo=sc.createRadialGradient(128,128,7,128,128,125);
halo.addColorStop(0,'rgba(255,252,223,1)');halo.addColorStop(.20,'rgba(255,247,197,1)');
halo.addColorStop(.27,'rgba(255,235,155,.90)');halo.addColorStop(.55,'rgba(255,223,148,.28)');
halo.addColorStop(1,'rgba(255,223,148,0)');sc.fillStyle=halo;sc.fillRect(0,0,256,256);
const sunTexture=new T.CanvasTexture(sunCanvas);sunTexture.colorSpace=T.SRGBColorSpace;
const sunDisc=new T.Sprite(new T.SpriteMaterial({map:sunTexture,transparent:true,depthWrite:false,fog:false}));
sunDisc.position.set(144,75,-24);sunDisc.scale.set(42,42,1);scene.add(sunDisc);world.sunDisc=sunDisc;
function tileTexture(kind,base,seed,repeat){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,128,128);
 let val=seed>>>0;const random=()=>{val=(1664525*val+1013904223)>>>0;return val/4294967296};
 for(let i=0;i<(kind==='road'?520:kind==='brick'?140:380);i++){
  const x=random()*128,y=random()*128,s=.6+random()*(kind==='road'?2.2:3.5);
  ctx.fillStyle=random()>.5?'rgba(255,255,255,.13)':'rgba(17,34,42,.10)';
  ctx.fillRect(x,y,s,s*(.5+random()))
 }
 if(kind==='brick'){
  ctx.strokeStyle='rgba(38,62,63,.12)';ctx.lineWidth=2;
  for(let y=0;y<=128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();
  for(let x=(y/32)%2?0:32;x<128;x+=64){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke()}}
 }
 if(kind==='grass')for(let i=0;i<115;i++){
  const x=random()*128,y=random()*128;ctx.strokeStyle=random()>.5?'rgba(255,255,255,.21)':'rgba(38,75,51,.17)';
  ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*2-1,y-2-random()*4);ctx.stroke()
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.anisotropy=4;return texture
}
const textured=(kind,color,seed,repeat=8)=>new T.MeshLambertMaterial({map:tileTexture(kind,color,seed,repeat),color:0xffffff});
const mats={grass:textured('grass','#9dbc94',101,20),road:textured('road','#656c77',202,12),sidewalk:textured('road','#e2d9c6',303,7),zoneFactory:textured('grass','#d4a780',311,12),zoneLab:textured('grass','#84bebe',411,12),zoneSchool:textured('grass','#bad49b',511,12),zonePark:textured('grass','#7ca77e',611,12),factoryWall:textured('brick','#c88e75',711,3),labWall:textured('brick','#92bbcd',811,3),schoolWall:textured('brick','#f0d3a0',911,3),parkWall:textured('brick','#b9bba1',1011,3),line:new T.MeshBasicMaterial({color:0xf5f1e8}),yellow:new T.MeshLambertMaterial({color:0xf2c04b}),dark:new T.MeshLambertMaterial({color:0x303e4c}),teal:new T.MeshLambertMaterial({color:0x2d8ead}),white:new T.MeshLambertMaterial({color:0xfff9ed}),leaf:new T.MeshLambertMaterial({color:0x829366}),trunk:new T.MeshLambertMaterial({color:0x92755b}),red:new T.MeshLambertMaterial({color:0xe17968}),window:new T.MeshLambertMaterial({color:0xa7c5db}),board:new T.MeshLambertMaterial({color:0x326f91}),cone:new T.MeshLambertMaterial({color:0xf08e51}),roofBlue:textured('brick','#7b9fa9',1245,3),roofTerracotta:textured('brick','#d58a77',1246,3),flower:new T.MeshLambertMaterial({color:0xf6bca3}),water:new T.MeshLambertMaterial({color:0x6eb9c6}),lawn:new T.MeshLambertMaterial({color:0x96c68a}),sign:new T.MeshBasicMaterial({color:0xf5e7a0}),door:new T.MeshLambertMaterial({color:0x456475}),trim:new T.MeshLambertMaterial({color:0xffeee2}),awning:new T.MeshLambertMaterial({color:0xefb261}),glass:new T.MeshLambertMaterial({color:0x83c6d8}),metal:new T.MeshLambertMaterial({color:0xbecbd0}),railPost:new T.MeshLambertMaterial({color:0x7c939b}),bush:new T.MeshLambertMaterial({color:0x649478}),lampGlow:new T.MeshBasicMaterial({color:0xffe7a5}),hill:new T.MeshLambertMaterial({color:0x819da0}),hillLight:new T.MeshLambertMaterial({color:0x9cb4a3})};
const box=(parent,w,h,d,x,y,z,mat)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);parent.add(o);return o};
const cyl=(parent,rt,rb,h,segments,x,y,z,mat)=>{const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),mat);o.position.set(x,y,z);parent.add(o);return o};
box(scene,152,.3,152,0,-.24,0,mats.grass);
for(const [x,z,material] of [[-38,38,mats.zoneLab],[38,38,mats.zoneFactory],[38,-38,mats.zoneSchool],[-38,-38,mats.zonePark]])box(scene,75,.08,75,x,-.09,z,material);
const dashedVertical=[],dashedHorizontal=[],crossV=[],crossH=[];
for(const axis of ['x','z'])for(const pos of [-50,-30,-10,10,30,50]){if(axis==='x'){box(scene,10,.07,152,pos,-.025,0,mats.sidewalk);box(scene,8.1,.1,152,pos,.015,0,mats.road);for(let i=-72;i<=72;i+=9)dashedVertical.push([pos,.073,i])}
else{box(scene,152,.07,10,0,-.024,pos,mats.sidewalk);box(scene,152,.1,8.1,0,.02,pos,mats.road);for(let i=-72;i<=72;i+=9)dashedHorizontal.push([i,.077,pos])}}
for(const x of [-50,-30,-10,10,30,50])for(const z of [-50,-30,-10,10,30,50])for(let k=-2;k<=2;k++){crossV.push([x-6.1,.09,z+k*1.5]);crossV.push([x+6.1,.09,z+k*1.5])}
function batchCubes(positions,w,h,d){const mesh=new T.InstancedMesh(new T.BoxGeometry(w,h,d),mats.line,positions.length),dummy=new T.Object3D();positions.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;scene.add(mesh)}
batchCubes(dashedVertical,.17,.11,3.3);batchCubes(dashedHorizontal,3.3,.11,.17);batchCubes(crossV,.68,.13,1.3);
const makeLabel=(txt,w=170)=>{const c=document.createElement('canvas');c.width=512;c.height=116;const ctx=c.getContext('2d');ctx.fillStyle='#ffffffed';ctx.beginPath();ctx.roundRect(5,6,502,102,22);ctx.fill();ctx.fillStyle='#096f69';ctx.font='bold 45px Manrope, Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,256,59,480);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(w/25,1.7,1);return sprite};
const homeWallPalette=[0xdcb9a6,0xe5d4b2,0xa9bed1,0xd1c2ba,0xd3ccae,0xb6c1bf].map(color=>new T.MeshLambertMaterial({color}));
function building(x,z,kind,index){const mat=kind==='factory'?mats.factoryWall:kind==='lab'?mats.labWall:kind==='school'?mats.schoolWall:kind==='park'?mats.parkWall:homeWallPalette[index%homeWallPalette.length];const special={school:'ESCOLA',factory:'FÁBRICA',workshop:'OFICINA',lab:'LABORATÓRIO',park:'PARQUE'}[kind];
if(kind==='park'){box(scene,11,.2,11,x,.02,z,new T.MeshLambertMaterial({color:0x9ab784}));for(const [dx,dz] of [[-3,-2],[2,2],[3,-3]])tree(x+dx,z+dz,.9);const tag=makeLabel(special);tag.position.set(x,4.9,z);scene.add(tag);world.walls.push({type:'rect',x,z,hw:5,hd:5,ghost:true});return}
const height=kind==='factory'?7:kind==='school'?5:kind==='lab'?6.5:3.2+(index%4)*1.1,ww=kind==='factory'?12:10,dd=kind==='factory'?10:9.5;box(scene,ww,height,dd,x,height/2,z,mat);box(scene,ww+.7,.45,dd+.7,x,height+.23,z,mats.white);
// Fachadas com entradas, cobertura, janelas emolduradas e elementos por função.
const front=z-dd/2-.085;
box(scene,1.6,2.2,.13,x,1.12,front-.11,mats.door);
box(scene,2.35,.18,1.1,x,2.4,front-.5,kind==='lab'?mats.teal:mats.awning);
for(let i=-1;i<=1;i++){
 const px=x+i*2.5,py=Math.max(1.8,height*.63);
 if(i!==0){
  box(scene,1.65,1.58,.15,px,py,front-.1,mats.trim);
  box(scene,1.30,1.3,.17,px,py,front-.2,kind==='lab'?mats.glass:mats.window);
  box(scene,.075,1.32,.19,px,py,front-.3,mats.door);
 }
 box(scene,.14,1.38,1.35,x+ww/2+.13,py,z+i*2.5,mats.trim);
 box(scene,.15,1.14,1.16,x+ww/2+.25,py,z+i*2.5,kind==='lab'?mats.glass:mats.window)
}
if(kind==='school'){
 box(scene,ww,.18,.45,x,height*.42,front-.13,mats.awning);
 box(scene,2.1,.85,.16,x,height*.75,front-.1,mats.board);
 box(scene,2.4,.28,1.5,x,2.4,front-.7,mats.white)
}else if(kind==='factory'){
 for(const xx of [-3,0,3])cyl(scene,.38,.42,2.5,8,x+xx,height+1.2,z+2,mats.metal);
 box(scene,4.5,2.6,.18,x,1.5,front-.17,mats.metal);
 for(const xx of [-1.2,0,1.2])box(scene,.1,2.4,.22,x+xx,1.5,front-.32,mats.railPost)
}else if(kind==='lab'){
 box(scene,8,.42,8,x,height+.67,z,mats.teal);
 box(scene,ww,.2,.48,x,3.15,front-.13,mats.teal);
 box(scene,3.5,1.2,.15,x,height*.78,front-.20,mats.glass)
}else{
 box(scene,ww+.2,.18,dd+.2,x,height+.52,z,mats.awning);
 box(scene,1.15,.62,.13,x,2.1,front-.17,mats.window)
}
if(special){const tag=makeLabel(special);tag.position.set(x,height+2.1,z);scene.add(tag)}
world.walls.push({type:'rect',x,z,hw:ww/2+.2,hd:dd/2+.2});
}
function tree(x,z,scale=1){cyl(scene,.23*scale,.3*scale,2*scale,7,x,1.08*scale,z,mats.trunk);cyl(scene,1.33*scale,1.6*scale,3*scale,7,x,3.1*scale,z,mats.leaf);world.walls.push({type:'circle',x,z,r:.83*scale,ghost:true})}
const specials={'40,-40':'school','40,40':'factory','-40,40':'lab','-40,-40':'park','0,0':'workshop'};
/* Todas as zonas têm silhuetas reconhecíveis, não só blocos de cores.
   Detalhes dentro dos lotes para não obstruir a via. */
function residenceDetails(x,z,i){
 const height=3.2+(i%4)*1.1;
 if(i%3!==1){
  const roof=new T.Mesh(new T.ConeGeometry(7.1,2.25,4),i%2?mats.roofTerracotta:mats.roofBlue);
  roof.rotation.y=Math.PI/4;roof.position.set(x,height+1.6,z);scene.add(roof);
 }else{
  // Terraço com parapeito, claraboia e floreira
  for(const zz of [-4.4,4.4])box(scene,9.2,.55,.18,x,height+.7,z+zz,mats.trim);
  box(scene,3.5,.25,2,x,height+.6,z,mats.glass);
  box(scene,2.5,.24,.8,x,height+.93,z+2.4,mats.lawn)
 }
 const back=z+4.86,side=x-5.14,py=Math.max(1.65,height*.57);
 for(const dx of [-2,2]){
  box(scene,1.45,1.4,.19,x+dx,py,back,mats.trim);
  box(scene,1.16,1.10,.21,x+dx,py,back+.1,mats.window);
 }
 for(const dz of [-2.1,2.1]){
  box(scene,.2,1.45,1.32,side,py,z+dz,mats.trim);
  box(scene,.22,1.14,1.03,side-.13,py,z+dz,mats.window);
 }
 if(i%4===0){
  const front=z-4.88;
  box(scene,3.2,.16,1.2,x,2.52,front-.38,mats.trim);
  box(scene,.14,.9,.14,x-1.35,2.05,front-.78,mats.railPost);
  box(scene,.14,.9,.14,x+1.35,2.05,front-.78,mats.railPost)
 }
}
let index=0;
for(const x of [-60,-40,-20,0,20,40,60])for(const z of [-60,-40,-20,0,20,40,60]){
 const kind=specials[x+','+z]||'house',i=index++;
 building(x,z,kind,i);
 if(kind==='house'){residenceDetails(x,z,i);tree(x-6,z-6,.6);if(index%3===0)tree(x+6,z+6,.7)}
}
function sceneryDecorations(){
 // ESCOLA: telhado colorido, fachada marcada e bandeira no pátio.
 const sx=40,sz=-40,front=sz-5;
 box(scene,12,.18,1.0,sx,5.65,sz-4.9,mats.roofTerracotta);
 box(scene,6,.20,3.0,sx,5.46,sz+2.4,mats.awning);
 for(let dx=-4;dx<=4;dx+=2)box(scene,1.3,.12,.8,sx+dx,5.6,sz-4.2,dx%4?mats.teal:mats.flower);
 cyl(scene,.07,.07,4.4,8,sx+4.2,2.2,front+.4,mats.metal);
 box(scene,1.65,.75,.07,sx+3.33,3.55,front+.4,mats.teal);
 for(const ox of [-2.8,2.8])box(scene,1,.65,.27,sx+ox,1.25,front-.12,mats.lawn);
 // FÁBRICA: chaminés, dutos, painéis e portão de carga.
 const fx=40,fz=40;
 for(const dx of [-3.6,-1.2,1.2,3.6]){
  const smokestack=cyl(scene,.44,.44,2.8,10,fx+dx,8.55,fz+2.3,mats.metal);
  cyl(scene,.48,.48,.35,10,fx+dx,10.1,fz+2.3,mats.railPost)
 }
 for(let n=0;n<5;n++)box(scene,4.5,.075,.15,fx,1.0+n*.55,fz-5.13,mats.railPost);
 box(scene,8,.2,.8,fx,7.43,fz-4.6,mats.roofTerracotta);
 box(scene,1.25,1.1,1.4,fx-4.6,7.8,fz-1.3,mats.awning);
 box(scene,1.25,1.1,1.4,fx+4.6,7.8,fz-1.3,mats.awning);
 // LABORATÓRIO: domo de vidro, antena giratória e placas solares no teto.
 const lx=-40,lz=40;
 const dome=new T.Mesh(new T.SphereGeometry(2.25,16,9,0,Math.PI*2,0,Math.PI/2),mats.glass);
 dome.position.set(lx,7.1,lz);scene.add(dome);
 const ring=new T.Mesh(new T.TorusGeometry(2.3,.12,7,28),mats.teal);
 ring.rotation.x=Math.PI/2;ring.position.set(lx,7.12,lz);scene.add(ring);
 for(const xx of [-3.4,3.4])for(const zz of [-2,0,2]){
  box(scene,1.75,.1,1.35,lx+xx,7.3,lz+zz,mats.board);
  box(scene,1.60,.02,1.18,lx+xx,7.37,lz+zz,mats.glass)
 }
 const dish=new T.Group();dish.position.set(lx+3.45,8.25,lz);scene.add(dish);
 const antenna=new T.Mesh(new T.CylinderGeometry(.08,.08,1.4,8),mats.metal);
 antenna.position.y=.65;dish.add(antenna);
 const dishHead=new T.Mesh(new T.SphereGeometry(.65,12,6,0,Math.PI*2,0,Math.PI/2),mats.white);
 dishHead.position.y=1.45;dish.add(dishHead);world.ambientMovers.push({group:dish,speed:.23});
 // PARQUE: lago raso e caminhos, árvores e flores; somente decoração.
 const px=-40,pz=-40;
 const pond=new T.Mesh(new T.CylinderGeometry(1.7,1.7,.14,24),mats.water);
 pond.position.set(px-1,.22,pz+.7);scene.add(pond);
 const pondRim=new T.Mesh(new T.TorusGeometry(1.73,.12,7,32),mats.white);
 pondRim.rotation.x=Math.PI/2;pondRim.position.set(px-1,.31,pz+.7);scene.add(pondRim);
 const fountain=cyl(scene,.10,.18,1.25,8,px-1,.86,pz+.7,mats.metal);
 const fountainBall=new T.Mesh(new T.SphereGeometry(.35,9,7),mats.water);
 fountainBall.position.set(px-1,1.55,pz+.7);scene.add(fountainBall);
 for(const [dx,dz] of [[-3.6,-3.6],[-3.5,3.2],[3.6,-3.5],[3.5,3.2]]){
  for(let k=0;k<5;k++){
   const flower=new T.Mesh(new T.SphereGeometry(.16,7,5),k%2?mats.flower:mats.awning);
   flower.position.set(px+dx+(k%3)*.3,.35,pz+dz+Math.floor(k/3)*.3);scene.add(flower)
  }
 }
 for(const zz of [-3,3]){
  box(scene,2,.14,.65,px+2.2,.65,pz+zz,mats.awning);
  box(scene,.12,.60,.11,px+1.3,.35,pz+zz,mats.railPost);
  box(scene,.12,.60,.11,px+3.1,.35,pz+zz,mats.railPost)
 }
 // OFICINA central: bancada e símbolo luminoso de robótica no teto.
 const cx=0,cz=0;
 box(scene,8,.20,6,cx,6.8,cz,mats.roofBlue);
 for(const xx of [-2.6,2.6]){
  const light=new T.Mesh(new T.SphereGeometry(.38,10,8),mats.lampGlow);
  light.position.set(cx+xx,7.2,cz-1);scene.add(light)
 }
}
sceneryDecorations();
function cone(x,z){cyl(scene,.12,.73,1.5,9,x,.82,z,mats.cone);cyl(scene,.44,.44,.2,9,x,.7,z,mats.white);box(scene,1.45,.15,1.45,x,.09,z,mats.dark);world.walls.push({type:'circle',x,z,r:.91})}
// Pista livre: as curvas e a direção diferencial são o desafio.
function crate(x,z){box(scene,2.1,1.8,2.1,x,.98,z,mats.yellow);box(scene,2.15,.17,.15,x,1.5,z-1.1,mats.dark);world.walls.push({type:'rect',x,z,hw:1.1,hd:1.1})}
// Sem caixas espalhadas no percurso.
function lamp(x,z){cyl(scene,.1,.12,4.4,7,x,2.2,z,mats.dark);cyl(scene,.45,.55,.3,9,x,4.65,z,mats.metal);cyl(scene,.30,.35,.12,10,x,4.44,z,mats.lampGlow)}
for(const [x,z] of [[-23,26],[16,-24],[23,15],[-16,-24],[-35,-15],[5,15],[-5,-35],[45,45],[-43,53],[53,-44]])lamp(x,z);

/* Guard-rails contínuos nas bordas externas das avenidas, com postes regulares.
   Ficam fora das rotas de entrega e preservam todos os cruzamentos. */
function guardrail(vertical,offset){
 const total=144,start=-72;
 for(let p=start;p<start+total;p+=12){
  const center=p+6;
  if(vertical){
   box(scene,.14,.2,11.7,offset,.77,center,mats.metal);
   box(scene,.12,.08,11.7,offset,1.04,center,mats.railPost);
  }else{
   box(scene,11.7,.2,.14,center,.77,offset,mats.metal);
   box(scene,11.7,.08,.12,center,1.04,offset,mats.railPost);
  }
 }
 for(let p=-70;p<=70;p+=5){
  if(vertical)box(scene,.22,.87,.22,offset,.45,p,mats.railPost);
  else box(scene,.22,.87,.22,p,.45,offset,mats.railPost);
 }
}
for(const p of [-75,75]){guardrail(true,p);guardrail(false,p)}

/* Silhuetas de colinas ao longe para que o mapa não termine em um vazio. */
for(let i=0;i<24;i++){
 const angle=i*Math.PI/12,dist=99+(i%4)*6;
 const mound=new T.Mesh(new T.ConeGeometry(13+(i%3)*3,19+(i%5)*3,7),i%2?mats.hill:mats.hillLight);
 mound.position.set(Math.cos(angle)*dist,5,Math.sin(angle)*dist);
 scene.add(mound);
}
/* Jardins baixos nas margens; não criam obstáculos invisíveis. */
for(let i=0;i<40;i++){
 const t=(i-19.5)*3.6,edge=i%2?66:-66;
 const x=i%4<2?edge:t,z=i%4<2?t:edge;
 const shrub=new T.Mesh(new T.DodecahedronGeometry(.8+(i%3)*.17,0),mats.bush);
 shrub.position.set(x,.63,z);
 scene.add(shrub);
}

/* Geometria estática reunida em instâncias: menos chamadas à GPU no celular. */
function compactCity(){
 const groups=new Map();const before=scene.children.filter(o=>o.isMesh).length;
 for(const obj of [...scene.children]){
  if(!obj.isMesh||obj.isInstancedMesh||!obj.material?.color)continue;
  const geo=obj.geometry,p=geo?.parameters,type=geo?.type;
  if(!p||!(type==='BoxGeometry'||type==='CylinderGeometry'))continue;
  const nums=type==='BoxGeometry'?[p.width,p.height,p.depth]:[p.radiusTop,p.radiusBottom,p.height,p.radialSegments,p.heightSegments||1];
  const key=type+'|'+nums.join(',')+'|'+obj.material.type+'|'+obj.material.uuid;
  if(!groups.has(key))groups.set(key,{type,nums,material:obj.material,items:[]});
  groups.get(key).items.push(obj);
 }
 let reduced=0;
 for(const group of groups.values()){
  if(group.items.length<3)continue;
  const geometry=group.type==='BoxGeometry'?new T.BoxGeometry(...group.nums):new T.CylinderGeometry(...group.nums);
  const mesh=new T.InstancedMesh(geometry,group.material,group.items.length);
  mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
  group.items.forEach((o,i)=>{o.updateMatrix();mesh.setMatrixAt(i,o.matrix);scene.remove(o);o.geometry.dispose()});
  mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);reduced+=group.items.length-1;
 }
 world.staticStats={before,after:scene.children.filter(o=>o.isMesh).length,batchSavings:reduced};
}
compactCity();

const car=new T.Group();world.car=car;scene.add(car);
box(car,1.85,.42,3.2,0,.65,0,mats.dark);box(car,1.55,.65,2.1,0,1.02,.1,mats.yellow);box(car,1.25,.15,.9,0,1.43,.1,mats.board);box(car,1.3,.18,.5,0,.97,-1.13,mats.teal);for(const side of [-1,1])for(const zz of [-1.05,1.03]){
 const spin=new T.Group();spin.position.set(side*.95,.42,zz);car.add(spin);
 const wheel=new T.Mesh(new T.CylinderGeometry(.32,.32,.21,18),mats.dark);
 wheel.rotation.z=Math.PI/2;spin.add(wheel);
 const hub=new T.Mesh(new T.CylinderGeometry(.13,.13,.235,12),mats.metal);
 hub.rotation.z=Math.PI/2;hub.position.x=side*.015;spin.add(hub);
 world.wheels.push({mesh:wheel,pivot:spin,side});
 box(car,.20,.18,.66,side*.66,.46,zz,mats.yellow)
}
box(car,.5,.18,.14,-.42,.85,-1.5,mats.white);box(car,.5,.18,.14,.42,.85,-1.5,mats.white);
box(car,1.8,.18,.18,0,.5,1.63,mats.red);
const espBoard=box(car,1.05,.12,.8,0,1.59,.14,mats.board);
box(car,.68,.07,.45,0,1.68,.14,mats.dark);
const ledMat=new T.MeshBasicMaterial({color:0x20dfaa});
const carLed=new T.Mesh(new T.SphereGeometry(.075,8,6),ledMat);carLed.position.set(.35,1.77,-.05);car.add(carLed);world.carLed=carLed;car.position.set(-50,0,50);
const goal=new T.Group();world.goal=goal;scene.add(goal);const ring=new T.Mesh(new T.TorusGeometry(2.25,.22,8,36),new T.MeshBasicMaterial({color:0xffd56c}));ring.rotation.x=Math.PI/2;ring.position.y=.25;goal.add(ring);cyl(goal,.28,.28,5,10,0,2.5,0,mats.teal);const marker=new T.Mesh(new T.OctahedronGeometry(1.5),new T.MeshBasicMaterial({color:0xffda7a}));marker.position.y=6.25;goal.add(marker);world.goalBeam=marker;updateGoal();
let last=performance.now(),accum=0;
const fixedStep=1/60,cameraTarget=new T.Vector3();
function animate(now){
 world.runFrame=true;requestAnimationFrame(animate);
 const dt=Math.min(.085,Math.max(0,(now-last)/1000));last=now;world.clockTime+=dt;
 if(now-world.clockUiAt>250){world.clockUiAt=now;updateClock()}
 if(now-world.minimapUiAt>130){world.minimapUiAt=now;drawMiniMap()}
 updateEngine(now);
 if(isDrive()){
  accum+=dt;let steps=0;
  while(accum>=fixedStep&&steps<5&&isDrive()){physics(fixedStep);accum-=fixedStep;steps++}
  if(steps>=5)accum=0;
 }else accum=0;
 car.position.set(state.drive.x,0,state.drive.z);car.rotation.y=state.drive.angle;
 for(const wheel of world.wheels)wheel.pivot.rotation.x+=((wheel.side<0?state.drive.a:state.drive.b)/255)*dt*13;
 if(world.carLed)world.carLed.scale.setScalar(1+.12*Math.sin(world.clockTime*6));
 if(world.sky)world.sky.position.copy(camera.position);
 for(let i=0;i<world.clouds.length;i++){const cloud=world.clouds[i];cloud.position.x=cloud.userData.origin+Math.sin(world.clockTime*.065+i)*1.5}
 for(const mover of world.ambientMovers)mover.group.rotation.y+=mover.speed*dt;
 goal.children[0].rotation.z=world.clockTime*.5;const glow=1+Math.sin(world.clockTime*3)*.10;goal.children[0].scale.set(glow,glow,glow);marker.position.y=6.1+Math.sin(world.clockTime*2)*.3;marker.rotation.y=world.clockTime*.5;
 const angle=state.drive.angle,external=state.cameraTop,px=state.drive.x,pz=state.drive.z,fx=-Math.sin(angle),fz=-Math.cos(angle);
 cameraTarget.set(px-fx*(external?8.4:.25),external?3.6:1.95,pz-fz*(external?8.4:.25));
 camera.position.lerp(cameraTarget,1-Math.exp(-11*dt));
 camera.lookAt(px+fx*(external?8.8:16),external?1.05:.48,pz+fz*(external?8.8:16));
 renderer.render(scene,camera)
}
camera.position.set(-58.4,3.6,50);camera.lookAt(-40,1.05,50);requestAnimationFrame(animate)}
function updateGoal(){if(!world.goal)return;const m=missions[Math.min(state.mission,3)];world.goal.position.set(m.to[0],0,m.to[1]);if(world.goalLabel){world.scene.remove(world.goalLabel);world.goalLabel.material.dispose();world.goalLabel=null}if(world.THREE){const T=world.THREE;const c=document.createElement('canvas');c.width=360;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#fff9ed';ctx.beginPath();ctx.roundRect(5,4,350,72,22);ctx.fill();ctx.fillStyle='#126d6a';ctx.font='bold 31px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.label,180,40,338);const t=new T.CanvasTexture(c);const sprite=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false}));sprite.scale.set(7.2,1.6,1);sprite.position.set(m.to[0],9,m.to[1]);world.scene.add(sprite);world.goalLabel=sprite}updateRoute(true)}

/* GPS da cidade: rota verde sobre as ruas; recalcula ao mudar de corredor ou sair do caminho. */
const ROAD_GRID=[-50,-30,-10,10,30,50];
function nearestRoad(n){return ROAD_GRID.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a,ROAD_GRID[0])}
function buildPoints(){
 const d=state.drive,to=missions[Math.min(state.mission,3)].to,x=d.x,z=d.z,rx=nearestRoad(x),rz=nearestRoad(z);
 const horizontal=[[x,z],[x,rz],[to[0],rz],[to[0],to[1]]];
 const vertical=[[x,z],[rx,z],[rx,to[1]],[to[0],to[1]]];
 const length=pts=>pts.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0);
 const facingHorizontal=Math.abs(Math.sin(d.angle))>=Math.abs(Math.cos(d.angle));
 const costH=length(horizontal)+Math.abs(z-rz)*1.2+(facingHorizontal?0:5);
 const costV=length(vertical)+Math.abs(x-rx)*1.2+(facingHorizontal?5:0);
 const points=(costH<=costV?horizontal:vertical).filter((p,i,arr)=>!i||Math.hypot(p[0]-arr[i-1][0],p[1]-arr[i-1][1])>.25);
 return points;
}
function updateCompass(){
 const arrow=$('navCompass');if(!arrow)return;
 let pts=world.routePoints;const d=state.drive;
 let next=pts.find((p,i)=>i>0&&Math.hypot(p[0]-d.x,p[1]-d.z)>3);
 if(!next)next=missions[Math.min(state.mission,3)].to;
 const wanted=Math.atan2(-(next[0]-d.x),-(next[1]-d.z));
 const angle=Math.atan2(Math.sin(d.angle-wanted),Math.cos(d.angle-wanted));
 arrow.style.transform='rotate('+(angle*180/Math.PI).toFixed(1)+'deg)';
}
function updateRoute(force=false){
 if(!world.THREE||!world.scene||state.completed)return;
 const d=state.drive,stamp=world.routeLastPos;
 if(!force&&stamp&&world.routeLastMission===state.mission&&Math.hypot(d.x-stamp[0],d.z-stamp[1])<8)return;
 const T=world.THREE;
 const points=buildPoints();
 if(!world.routeGroup){world.routeGroup=new T.Group();world.scene.add(world.routeGroup)}
 const group=world.routeGroup;const oldMaterials=new Set();for(const mesh of [...group.children]){group.remove(mesh);mesh.geometry?.dispose();if(mesh.material)oldMaterials.add(mesh.material)}for(const mat of oldMaterials)mat.dispose();
 const ribbonMaterial=new T.MeshBasicMaterial({color:0xf3c375,transparent:true,opacity:.69,depthWrite:false,depthTest:true});
 const arrowMaterial=new T.MeshBasicMaterial({color:0xfffdf2,transparent:true,opacity:.98,depthWrite:false,side:T.DoubleSide});
 let distance=0;
 for(let i=1;i<points.length;i++){
  const p=points[i-1],q=points[i],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);
  if(len<.5)continue;distance+=len;
  const seg=new T.Mesh(new T.BoxGeometry(.82,.025,len),ribbonMaterial);
  seg.position.set((p[0]+q[0])/2,.153,(p[1]+q[1])/2);
  seg.rotation.y=Math.atan2(-dx,-dz);
  group.add(seg);
  const ux=dx/len,uz=dz/len,px=-uz,pz=ux;
  for(let t=6;t<len-1.2;t+=8){
   const cx=p[0]+ux*t,cz=p[1]+uz*t;
   const coords=[cx+ux*1.15,.187,cz+uz*1.15,cx-ux*.72+px*.66,.187,cz-uz*.72+pz*.66,cx-ux*.72-px*.66,.187,cz-uz*.72-pz*.66];
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));g.computeVertexNormals();
   group.add(new T.Mesh(g,arrowMaterial));
  }
 }
 group.visible=true;
 world.routePoints=points;world.routeDistance=distance;world.routeLastPos=[d.x,d.z];world.routeLastMission=state.mission;
 updateCompass();
}

function collides(x,z){if(Math.abs(x)>73||Math.abs(z)>73)return true;for(const wall of world.walls){if(wall.ghost)continue;if(wall.type==='circle'){if(Math.hypot(x-wall.x,z-wall.z)<wall.r+1)return true}
else{const dx=Math.max(Math.abs(x-wall.x)-wall.hw,0),dz=Math.max(Math.abs(z-wall.z)-wall.hd,0);if(Math.hypot(dx,dz)<1)return true}}return false}
function physics(dt){const d=state.drive,cmd=commands();state.desired=cmd;state.driveSeconds+=dt;world.uiTimer+=dt;if(world.uiTimer>=.10){world.uiTimer=0;for(let i=0;i<2;i++)if(state.pointer[i]===null)setThumb(i,cmd[i]);updateReadout();updateDistance();updateDistrict()}const prevA=d.a,prevB=d.b;for(const [key,i] of [['a',0],['b',1]]){const target=cmd[i],current=d[key],rate=Math.abs(target)>Math.abs(current)?570:1550;d[key]=current+clamp(target-current,-rate*dt,rate*dt);if(Math.abs(d[key])<.7)d[key]=0}
const a=d.a/255,b=d.b/255;const v=(a+b)/2*9.2,omega=(b-a)*1.68;const angleNext=d.angle+omega*dt;const nx=d.x-Math.sin((d.angle+angleNext)/2)*v*dt,nz=d.z-Math.cos((d.angle+angleNext)/2)*v*dt;if((Math.abs(v)>.1||Math.abs(omega)>.1)&&collides(nx,nz)){
 d.a=0;d.b=0;updateReadout();
 const now=performance.now();
 if(now-world.collisionToastAt>1800){world.collisionToastAt=now;toast('Borda da via. Faça a curva ou dê ré para continuar.',true)}
 return
}
d.angle=angleNext;d.x=nx;d.z=nz;state.meters+=Math.abs(v*dt);state.stageMeters+=Math.abs(v*dt);updateRoute();
const goal=missions[Math.min(state.mission,3)].to;if(Math.hypot(d.x-goal[0],d.z-goal[1])<2.65){completeMission();return}
triggerEvent()}
window.__TinkerpetMission={state,world,STAGE_QUESTION_COUNTS,currentStageSlot,nextStageDistance,readRecords,displayRecords,drawMiniMap,sound,questions,missions,baseWires,diagnosticParts,diagnosticTests,chooseDiagnostic,beginQuestion,beginRepair,resetGame,physics,commands,collides,updateRoute,buildPoints,triggerEvent,requestQuitChallenge,cancelQuitChallenge,confirmQuitChallenge};
boot();
})();