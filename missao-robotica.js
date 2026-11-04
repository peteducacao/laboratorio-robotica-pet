(()=>{'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlays=['authOverlay','startOverlay','questionOverlay','repairOverlay','pauseOverlay','endOverlay'];
const missions=[
 {title:'Entrega na escola',desc:'Siga a rota verde até a escola.',to:[50,-50],label:'ESCOLA'},
 {title:'Peças para a fábrica',desc:'Siga a rota verde até a fábrica.',to:[50,50],label:'FÁBRICA'},
 {title:'Manutenção do parque',desc:'Siga a rota verde até o parque.',to:[-50,-50],label:'PARQUE'},
 {title:'Retorno ao laboratório',desc:'Siga a rota verde e finalize a aventura.',to:[-50,50],label:'LABORATÓRIO'}
];
const questions=[
 ['Qual GPIO controla o Motor A para a frente no código?',['GPIO 32','GPIO 27','GPIO 18','GPIO 26'],0],
 ['Qual GPIO controla o Motor A em marcha à ré?',['GPIO 27','GPIO 18','GPIO 32','GPIO 19'],1],
 ['Qual GPIO controla o Motor B para a frente?',['GPIO 26','GPIO 18','GPIO 32','GPIO 27'],0],
 ['Qual GPIO controla o Motor B em marcha à ré?',['GPIO 27','GPIO 26','GPIO 19','GPIO 32'],0],
 ['No código, qual motor corresponde ao lado esquerdo?',['Motor B','Motor A','Ambos','Nenhum'],1],
 ['Qual motor corresponde ao lado direito?',['Motor B','Motor A','LM2596','ESP32'],0],
 ['Qual componente fornece os sinais de comando à ponte H?',['ESP32','Motor DC','Pilha AA','Roda'],0],
 ['Qual componente controla a alimentação dos motores e seu sentido de giro?',['LM2596','Ponte H','Bateria 9 V','Gangorra'],1],
 ['No projeto, a saída do LM2596 para o VIN do ESP32 deve ser ajustada para:',['9,0 V','3,2 V','5,0 V','12,0 V'],2],
 ['A bateria de 9 V do projeto alimenta inicialmente qual componente?',['LM2596','Motor A diretamente','Roda','Jumper'],0],
 ['Qual fonte alimenta a ponte H no projeto?',['Seis pilhas AA em série','USB do computador','Uma pilha AAA','A bateria do celular'],0],
 ['Qual é a função do GND comum entre ESP32 e ponte H?',['Aumentar a velocidade','Dar referência comum aos sinais','Carregar o Wi-Fi','Ligar o LED'],1],
 ['Qual é a função do regulador LM2596?',['Reduzir e ajustar a tensão','Controlar o Wi-Fi','Medir a distância','Girar o motor'],0],
 ['Quantas gangorras são usadas na montagem com interruptores?',['Uma','Três','Duas','Quatro'],2],
 ['Na montagem com duas gangorras, uma delas interrompe a alimentação de:',['ESP32 através do LM2596','Somente as rodas','Dois GPIOs ao mesmo tempo','Da antena do Wi-Fi'],0],
 ['Na montagem com duas gangorras, a segunda controla a alimentação de:',['Ponte H','Porta USB','Antena','LCD'],0],
 ['No código, uma velocidade PWM igual a 0 significa:',['Motor parado','Velocidade máxima','Ré máxima','Duas voltas'],0],
 ['Qual é o valor PWM máximo usado no código com resolução de 8 bits?',['100','180','255','1024'],2],
 ['Qual valor foi definido como velocidade baixa no código do carrinho?',['180','255','90','0'],0],
 ['Qual valor foi definido como velocidade alta no código do carrinho?',['100','255','180','50'],1],
 ['O que acontece quando os dois motores avançam com a mesma velocidade?',['O carrinho segue reto','Ele sempre gira','Ele dá ré','Somente a roda direita anda'],0],
 ['Se o Motor B avançar mais rápido que o Motor A, para qual lado o robô tende a curvar?',['Direita','Esquerda','Nenhum','Para trás'],1],
 ['Se o Motor A avançar mais rápido que o Motor B, a curva tende a ser para:',['Esquerda','Direita','Ré','Nenhum'],1],
 ['No código, a letra U identifica:',['Sentido para frente','Wi-Fi desligado','Motor desligado','Velocidade zero'],0],
 ['No código, a letra D identifica:',['Motor esquerdo','Sentido de ré','Dia','Somente o Motor B'],1],
 ['Qual chamada do código para os dois motores?',['pararTudo()','WiFi.softAP()','server.begin()','Serial.print()'],0],
 ['Qual recurso permite controlar o carrinho pelo navegador conectado ao ESP32?',['Servidor web do ESP32','Sensor de luz','GPS do celular','Cabo HDMI'],0],
 ['Qual endereço IP padrão aparece no código para o controle do carrinho?',['127.0.0.1','192.168.4.1','8.8.8.8','10.0.0.255'],1],
 ['No circuito, os terminais MOTOR A e MOTOR B da ponte H servem para:',['Receber sensores','Conectar os motores DC','Conectar a rede','Medir a tensão'],1],
 ['Qual ligação NÃO deve ser esquecida entre a ponte H e o ESP32?',['O GND comum','A saída do motor no VIN','A bateria direto no GPIO','O motor na porta USB'],0]
];
const baseWires=[
 {id:'p9',title:'Bateria 9 V (+) → S1 → LM2596 IN+',kind:'wire'},
 {id:'g9',title:'Bateria 9 V (−) → LM2596 IN−',kind:'wire'},
 {id:'v5',title:'LM2596 OUT+ (5 V) → ESP32 VIN',kind:'wire'},
 {id:'gn',title:'LM2596 OUT− → ESP32 GND',kind:'wire'},
 {id:'aa',title:'Suporte AA (+) → S2 → Ponte H (+)',kind:'wire'},
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
const state={mode:'auth',ready:false,lives:3,mission:0,questionsCorrect:new Set(),asked:[],scoreQuestions:0,scoreRepairs:0,scoreMissions:0,meters:0,nextEvent:95,nextEventTime:60,driveSeconds:0,eventCount:0,lastFault:null,drive:{x:-50,z:50,angle:-Math.PI/2,a:0,b:0,collided:false},desired:[0,0],pointer:[null,null],pointerValue:[0,0],keys:new Set(),cameraTop:false,repairTab:'power',quitRemaining:0,challengeTimer:null,challengeStarted:0,challengeEnd:0,activeQuestion:null,fault:null,wires:null,switches:null,gpios:null,skipUntil:0,completed:false};
const world={THREE:null,renderer:null,scene:null,camera:null,car:null,wheels:[],walls:[],goal:null,goalLabel:null,goalBeam:null,routeGroup:null,routePoints:[],routeDistance:0,routeLastPos:null,routeLastMission:-1,clockTime:0,lastFrame:0,runFrame:false};
const rand=n=>Math.floor(Math.random()*n);
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function overlay(name){for(const id of overlays)$(id).hidden=id!==name;}
function toast(message,error=false){const e=$('toast');e.textContent=message;e.className='game-toast visible'+(error?' error':'');clearTimeout(toast.t);toast.t=setTimeout(()=>{e.className='game-toast'},2300)}
function setMode(mode){state.mode=mode;overlay(mode==='drive'?null:mode+'Overlay');}
function clearChallengeTimer(){if(state.challengeTimer){clearInterval(state.challengeTimer);state.challengeTimer=null}}
function resetInputs(){state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0];for(let i=0;i<2;i++)setThumb(i,0)}
function stopRobot(){resetInputs();state.drive.a=0;state.drive.b=0;updateReadout()}
function updateLives(){$('lives').innerHTML=Array.from({length:3},(_,i)=>i<state.lives?'♥':'<span class="lost">♥</span>').join(' ');$('lives').setAttribute('aria-label',state.lives+' vidas')}
function updateMission(){const m=missions[Math.min(state.mission,missions.length-1)];$('missionNumber').textContent='MISSÃO '+String(state.mission+1).padStart(2,'0')+' DE 04';$('missionTitle').textContent=m.title;$('missionDesc').textContent=m.desc;$('missionDone').textContent=state.scoreMissions+'/4 concluídas';updateDistance()}
function updateDistance(){if(state.completed)return;const m=missions[Math.min(state.mission,3)],d=Math.hypot(state.drive.x-m.to[0],state.drive.z-m.to[1]);$('missionDistance').textContent='Destino · '+Math.ceil(d)+' m';updateCompass()}
function setThumb(i,value){const id=i===0?'thumbA':'thumbB',track=$(i===0?'trackA':'trackB');const height=track.clientHeight||160;const half=(height-49)/2;$(id).style.top='calc(50% - '+(value/255*half).toFixed(1)+'px)'}
function updateReadout(){const a=Math.round(state.drive.a),b=Math.round(state.drive.b);$('speedA').textContent=a;$('speedB').textContent=b;$('trackA').setAttribute('aria-valuenow',String(a));$('trackB').setAttribute('aria-valuenow',String(b))}
function isDrive(){return state.mode==='drive'&&state.ready&&!state.completed}
function pointerToValue(ev,el){const r=el.getBoundingClientRect(),normalized=clamp(((r.top+r.height/2)-ev.clientY)/(r.height*.5-24),-1,1);return Math.round(normalized*255)}
function installControl(i){const el=$(i===0?'trackA':'trackB');el.addEventListener('pointerdown',e=>{if(!isDrive())return;e.preventDefault();state.pointer[i]=e.pointerId;try{el.setPointerCapture(e.pointerId)}catch{}state.pointerValue[i]=pointerToValue(e,el);setThumb(i,state.pointerValue[i])});el.addEventListener('pointermove',e=>{if(state.pointer[i]!==e.pointerId||!isDrive())return;e.preventDefault();state.pointerValue[i]=pointerToValue(e,el);setThumb(i,state.pointerValue[i])});const release=e=>{if(state.pointer[i]!==e.pointerId)return;state.pointer[i]=null;state.pointerValue[i]=0;setThumb(i,0)};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
el.addEventListener('keydown',e=>{if(!isDrive())return;let change=0;if(e.key==='ArrowUp')change=35;else if(e.key==='ArrowDown')change=-35;else if(e.key==='Home'){e.preventDefault();state.pointer[i]=null;state.pointerValue[i]=0;setThumb(i,0);return}else return;e.preventDefault();state.pointer[i]='keyboard-slider';state.pointerValue[i]=clamp(state.pointerValue[i]+change,-255,255);setThumb(i,state.pointerValue[i])})}
function installKeys(){const used=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!used.has(k)||!isDrive())return;if(e.target.matches('input,textarea,select'))return;e.preventDefault();state.keys.add(k)});document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(used.has(k)){state.keys.delete(k);if(isDrive())e.preventDefault()}});window.addEventListener('blur',()=>{state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0]});document.addEventListener('visibilitychange',()=>{if(document.hidden){state.keys.clear();state.pointer=[null,null];state.pointerValue=[0,0];state.desired=[0,0]}})}
function keysPressed(){return state.keys.size>0}
function commands(){if(state.drive.collided){if(state.pointer.every(p=>p===null)&&!keysPressed())state.drive.collided=false;return[0,0]}
if(state.pointer.some(p=>p!==null))return[state.pointerValue[0],state.pointerValue[1]];
const k=state.keys,front=k.has('w')||k.has('arrowup'),back=k.has('s')||k.has('arrowdown'),left=k.has('a')||k.has('arrowleft'),right=k.has('d')||k.has('arrowright');let base=front&&!back?230:back&&!front?-195:0;return[Math.round(base*(left?.25:1)),Math.round(base*(right?.25:1))]}
function installUI(){
$('authForm').addEventListener('submit',e=>{e.preventDefault();if($('password').value.trim()!=='peteducacao'){$('authError').textContent='Senha incorreta. Tente novamente.';return}try{sessionStorage.setItem('tinkerpet-missao-3d-acesso','ok')}catch{}$('authError').textContent='';setMode('start')});
$('showPassword').addEventListener('click',()=>{const p=$('password');p.type=p.type==='password'?'text':'password';$('showPassword').textContent=p.type==='password'?'Mostrar':'Ocultar'});
$('startBtn').addEventListener('click',()=>{if(!state.ready)return;resetGame();setMode('drive');toast('Missão iniciada. Controle os dois motores!')});
$('pauseBtn').addEventListener('click',()=>{if(!isDrive())return;stopRobot();setMode('pause')});
$('resumeBtn').addEventListener('click',()=>{setMode('drive');stopRobot()});
$('pauseClose').addEventListener('click',()=>{setMode('drive');stopRobot()});
$('restartBtn').addEventListener('click',()=>{resetGame();setMode('drive');toast('Nova aventura iniciada!')});
$('viewBtn').addEventListener('click',()=>{state.cameraTop=!state.cameraTop;$('viewBtn').setAttribute('aria-label',state.cameraTop?'Ativar visão do motorista':'Ativar câmera externa');toast(state.cameraTop?'Câmera externa':'Visão do motorista')});
$('fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen()}catch{toast('Tela cheia não está disponível neste navegador.')}});
$('exitGameBtn').addEventListener('click',()=>{window.location.href='projects.html'});
$('questionClose').addEventListener('click',requestQuitChallenge);
$('repairClose').addEventListener('click',requestQuitChallenge);
$('quitCancel').addEventListener('click',cancelQuitChallenge);
$('quitConfirm').addEventListener('click',confirmQuitChallenge);
$('quitChallengeDialog').addEventListener('cancel',e=>{e.preventDefault();cancelQuitChallenge()});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if($('quitChallengeDialog').open){e.preventDefault();cancelQuitChallenge();return}
 if(state.mode==='question'||state.mode==='repair'){e.preventDefault();requestQuitChallenge();return}
 if(state.mode==='drive'){e.preventDefault();stopRobot();setMode('pause');return}
 if(state.mode==='pause'){e.preventDefault();setMode('drive');stopRobot();return}
 if(state.mode==='start'||state.mode==='auth'||state.mode==='end'){e.preventDefault();window.location.href='projects.html'}
});
$('repairTabs').addEventListener('click',e=>{const btn=e.target.closest('[data-repair-tab]');if(!btn||state.mode!=='repair')return;state.repairTab=btn.dataset.repairTab;renderRepair()});

installControl(0);installControl(1);installKeys();
$('componentBoard').addEventListener('click',e=>{if(state.mode!=='repair'||!state.fault)return;const box=e.target.closest('[data-component]');if(!box)return;const id=box.dataset.component;if(id==='switch1'||id==='switch2'){state.switches[id]=!state.switches[id];renderRepair();checkRepair()}});
$('connectionList').addEventListener('click',e=>{if(state.mode!=='repair'||!state.fault)return;const row=e.target.closest('[data-wire]');if(!row||e.target.tagName==='SELECT')return;const id=row.dataset.wire;if(state.wires[id]===false){state.wires[id]=true;renderRepair();checkRepair()}});
$('connectionList').addEventListener('change',e=>{if(state.mode!=='repair'||!state.fault||!e.target.matches('select[data-gpio]'))return;state.gpios[e.target.dataset.gpio]=e.target.value;renderRepair();checkRepair()});
window.addEventListener('resize',()=>{if(world.renderer&&world.camera){const w=$('scene').clientWidth,h=$('scene').clientHeight;world.camera.aspect=Math.max(1,w)/Math.max(1,h);world.camera.updateProjectionMatrix();world.renderer.setSize(w,h)}})}
function resetGame(){clearChallengeTimer();state.lives=3;state.mission=0;state.scoreMissions=0;state.scoreQuestions=0;state.scoreRepairs=0;state.questionsCorrect=new Set();state.asked=[];state.meters=0;state.nextEvent=95;state.nextEventTime=60;state.driveSeconds=0;state.eventCount=0;state.lastFault=null;state.completed=false;state.drive={x:-50,z:50,angle:-Math.PI/2,a:0,b:0,collided:false};state.desired=[0,0];state.pointer=[null,null];state.pointerValue=[0,0];state.keys.clear();state.skipUntil=0;state.cameraTop=false;state.repairTab='power';setThumb(0,0);setThumb(1,0);updateReadout();updateLives();updateMission();if(world.car){world.car.position.set(-50,0,50);world.car.rotation.y=-Math.PI/2}updateGoal();updateRoute(true)}
function loseLife(reason){clearChallengeTimer();state.lives--;updateLives();if(state.lives<=0){endGame(false);return}setMode('drive');stopRobot();state.drive.collided=true;toast(reason||'Tempo esgotado. Você perdeu uma vida.',true);state.skipUntil=performance.now()+10000}
function endGame(won){state.completed=true;stopRobot();clearChallengeTimer();$('endKicker').textContent=won?'AVENTURA CONCLUÍDA':'FIM DE JOGO';$('endSymbol').textContent=won?'★':'♥';$('endTitle').textContent=won?'Missão cumprida!':'Fim de jogo';$('endDescription').textContent=won?'Você percorreu a cidade e concluiu todas as entregas!':'As três vidas terminaram. Reinicie para tentar novamente.';$('scoreMissions').textContent=state.scoreMissions;$('scoreQuestions').textContent=state.scoreQuestions;$('scoreRepairs').textContent=state.scoreRepairs;setMode('end')}
function startTimer(kind,remaining=30000){clearChallengeTimer();state.challengeStarted=performance.now();state.challengeEnd=state.challengeStarted+remaining;const prefix=kind==='question'?'question':'repair';const tick=()=>{if(state.mode!==kind)return;const sec=Math.max(0,(state.challengeEnd-performance.now())/1000),node=$(prefix+'Timer'),bar=$(prefix+'Timebar');node.textContent=String(Math.ceil(sec));bar.style.width=(sec/30*100).toFixed(2)+'%';bar.classList.toggle('low',sec<10);node.parentElement.classList.toggle('danger',sec<10);if(sec<=0)loseLife()};state.challengeTimer=setInterval(tick,100);tick()}

function requestQuitChallenge(){if(state.mode!=='question'&&state.mode!=='repair')return;if($('quitChallengeDialog').open)return;state.quitRemaining=Math.max(1,state.challengeEnd-performance.now());clearChallengeTimer();$('quitChallengeDialog').showModal()}
function cancelQuitChallenge(){if($('quitChallengeDialog').open)$('quitChallengeDialog').close();if(state.mode==='question'||state.mode==='repair')startTimer(state.mode,state.quitRemaining)}
function confirmQuitChallenge(){if($('quitChallengeDialog').open)$('quitChallengeDialog').close();if(state.mode==='question'||state.mode==='repair')loseLife('Desafio abandonado: você perdeu uma vida.')}

function pickQuestion(){let eligible=questions.map((q,i)=>i).filter(i=>!state.questionsCorrect.has(i));if(!eligible.length)return null;const notLast=eligible.filter(i=>i!==state.asked.at(-1));if(notLast.length)eligible=notLast;const fresh=eligible.filter(i=>!state.asked.includes(i));const index=(fresh.length?fresh:eligible)[rand((fresh.length?fresh:eligible).length)];state.asked.push(index);return index}
function renderQuestion(){const i=pickQuestion();if(i===null){solveChallenge('Todas as perguntas foram respondidas!');return}state.activeQuestion=i;const q=questions[i];$('questionText').textContent=q[0];$('answers').replaceChildren();shuffled(q[1].map((txt,index)=>({txt,correct:index===q[2]}))).forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='answer';const letter=document.createElement('span');letter.className='letter';letter.textContent='ABCD'[i];const label=document.createElement('span');label.textContent=a.txt;b.append(letter,label);b.addEventListener('click',()=>answer(a.correct));$('answers').append(b)});}
function beginQuestion(){stopRobot();setMode('question');$('questionResponse').textContent='Escolha a alternativa correta para continuar.';renderQuestion();startTimer('question')}
function answer(correct){if(state.mode!=='question')return;if(performance.now()>=state.challengeEnd){loseLife();return}if(correct){state.questionsCorrect.add(state.activeQuestion);state.scoreQuestions++;solveChallenge('Resposta correta! Continue a missão.');return}$('questionResponse').textContent='Resposta incorreta. Nova pergunta!';renderQuestion()}
function newFault(){const available=faultPool.filter(f=>f.kind+f.id!==state.lastFault);const fault=available[rand(available.length)];state.lastFault=fault.kind+fault.id;return {...fault}}
function beginRepair(){stopRobot();state.fault=newFault();state.wires=Object.fromEntries(baseWires.map(w=>[w.id,true]));state.switches={switch1:true,switch2:true};state.gpios=Object.fromEntries(baseWires.filter(w=>w.kind==='gpio').map(w=>[w.id,w.correct]));if(state.fault.kind==='wire')state.wires[state.fault.id]=false;if(state.fault.kind==='switch')state.switches[state.fault.id]=false;if(state.fault.kind==='gpio')state.gpios[state.fault.id]=state.fault.wrong;state.repairTab='power';setMode('repair');renderRepair();startTimer('repair')}
function renderRepair(){
for(const id of ['switch1','switch2']){const node=$('switch'+id.slice(-1)+'status');node.textContent=state.switches[id]?'LIGADA':'DESLIGADA';document.querySelector('[data-component="'+id+'"]').classList.toggle('off',!state.switches[id])}
for(const tab of document.querySelectorAll('[data-repair-tab]')){const yes=tab.dataset.repairTab===state.repairTab;tab.classList.toggle('active',yes);tab.setAttribute('aria-selected',String(yes))}
const groups={power:['p9','g9','v5','gn','aa','aag','commongnd'],gpio:['in1','in2','in3','in4'],motors:['ma','mb']};
const shortLabels={p9:'9 V (+) → S1 → LM2596',g9:'9 V (−) → LM2596',v5:'LM2596 → VIN do ESP32',gn:'LM2596 → GND do ESP32',aa:'6 pilhas (+) → S2 → Ponte H',aag:'6 pilhas (−) → Ponte H',commongnd:'GND comum · ESP32 e Ponte H',in1:'Ponte H · IN1',in2:'Ponte H · IN2',in3:'Ponte H · IN3',in4:'Ponte H · IN4',ma:'Ponte H → Motor esquerdo',mb:'Ponte H → Motor direito'};
const list=$('connectionList');list.replaceChildren();
for(const id of groups[state.repairTab]){const wire=baseWires.find(w=>w.id===id),good=state.wires[id],row=document.createElement(wire.kind==='gpio'&&good?'div':'button');if(row.tagName==='BUTTON')row.type='button';row.className='wire-row';row.dataset.wire=id;const name=document.createElement('span');name.textContent=shortLabels[id];row.append(name);
if(wire.kind==='gpio'&&good){const s=document.createElement('select');s.dataset.gpio=id;s.setAttribute('aria-label','GPIO conectado ao '+shortLabels[id]);for(const value of ['D18','D19','D26','D27','D32']){const o=document.createElement('option');o.value=value;o.textContent=value;s.append(o)}s.value=state.gpios[id];row.append(s)}
else{const tag=document.createElement('span');tag.className='wire-status'+(good?'':' loose');tag.textContent=good?'✓':'Solto';row.classList.toggle('loose',!good);row.append(tag);row.disabled=good}
list.append(row)}
$('repairStatus').textContent='Confira energia, GPIOs e motores.'
}
function checkRepair(){const good=baseWires.every(w=>state.wires[w.id]&&(w.kind!=='gpio'||state.gpios[w.id]===w.correct))&&Object.values(state.switches).every(Boolean);if(good){state.scoreRepairs++;solveChallenge('Circuito restabelecido! Volte à missão.')}}
function solveChallenge(message){clearChallengeTimer();setMode('drive');stopRobot();state.drive.collided=true;state.skipUntil=performance.now()+25000;toast(message)}
function triggerEvent(){if(!isDrive()||performance.now()<state.skipUntil||state.driveSeconds<state.nextEventTime||state.meters<state.nextEvent)return;state.nextEvent+=85+rand(25);state.nextEventTime=state.driveSeconds+50+rand(12);state.eventCount++;if(state.eventCount%2===1)beginQuestion();else beginRepair()}
function completeMission(){state.scoreMissions++;state.mission++;stopRobot();state.drive.collided=true;if(state.mission>=missions.length){endGame(true);return}updateMission();updateGoal();state.skipUntil=performance.now()+25000;toast('Entrega concluída! Siga a faixa verde para o próximo destino.')}
function boot(){installUI();updateLives();updateMission();if(sessionStorage.getItem('tinkerpet-missao-3d-acesso')==='ok')setMode('start');else setMode('auth');load3D()}
async function load3D(){try{
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
 init3D(THREE);state.ready=true;$('startBtn').disabled=false;
 }catch(error){console.error('Não foi possível carregar a cidade 3D',error);$('startBtn').disabled=true;$('startBtn').textContent='Não foi possível carregar o mapa 3D';if(state.mode==='auth')$('authError').textContent='O mapa precisa de conexão para carregar. Verifique a internet.';toast('Não foi possível carregar o cenário 3D. Verifique a conexão.',true)}
}
function init3D(T){
world.THREE=T;const scene=new T.Scene();scene.background=new T.Color(0xc5e9ed);scene.fog=new T.Fog(0xc5e9ed,100,205);world.scene=scene;
const camera=new T.PerspectiveCamera(75,Math.max(1,$('scene').clientWidth)/Math.max(1,$('scene').clientHeight),.1,260);world.camera=camera;
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setSize(Math.max(1,$('scene').clientWidth),Math.max(1,$('scene').clientHeight));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;$('scene').append(renderer.domElement);world.renderer=renderer;
scene.add(new T.HemisphereLight(0xf4ffff,0x7d9983,2.35));const sun=new T.DirectionalLight(0xfff4dc,2.4);sun.position.set(-35,65,25);scene.add(sun);
const mats={grass:new T.MeshLambertMaterial({color:0x8fcb99}),road:new T.MeshLambertMaterial({color:0x415766}),sidewalk:new T.MeshLambertMaterial({color:0xdbe5df}),line:new T.MeshBasicMaterial({color:0xf1f5e9}),yellow:new T.MeshLambertMaterial({color:0xf6c65c}),dark:new T.MeshLambertMaterial({color:0x243946}),teal:new T.MeshLambertMaterial({color:0x12a18d}),white:new T.MeshLambertMaterial({color:0xfff9ed}),leaf:new T.MeshLambertMaterial({color:0x2f9c7a}),trunk:new T.MeshLambertMaterial({color:0x956b49}),red:new T.MeshLambertMaterial({color:0xe17968}),window:new T.MeshLambertMaterial({color:0x89cfdf}),board:new T.MeshLambertMaterial({color:0x1c6e69}),cone:new T.MeshLambertMaterial({color:0xf08e51})};
const box=(parent,w,h,d,x,y,z,mat)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);parent.add(o);return o};
const cyl=(parent,rt,rb,h,segments,x,y,z,mat)=>{const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),mat);o.position.set(x,y,z);parent.add(o);return o};
box(scene,152,.3,152,0,-.24,0,mats.grass);
const dashedVertical=[],dashedHorizontal=[],crossV=[],crossH=[];
for(const axis of ['x','z'])for(const pos of [-50,-30,-10,10,30,50]){if(axis==='x'){box(scene,10,.07,152,pos,-.025,0,mats.sidewalk);box(scene,8.1,.1,152,pos,.015,0,mats.road);for(let i=-72;i<=72;i+=9)dashedVertical.push([pos,.073,i])}
else{box(scene,152,.07,10,0,-.024,pos,mats.sidewalk);box(scene,152,.1,8.1,0,.02,pos,mats.road);for(let i=-72;i<=72;i+=9)dashedHorizontal.push([i,.077,pos])}}
for(const x of [-50,-30,-10,10,30,50])for(const z of [-50,-30,-10,10,30,50])for(let k=-2;k<=2;k++){crossV.push([x-6.1,.09,z+k*1.5]);crossV.push([x+6.1,.09,z+k*1.5])}
function batchCubes(positions,w,h,d){const mesh=new T.InstancedMesh(new T.BoxGeometry(w,h,d),mats.line,positions.length),dummy=new T.Object3D();positions.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;scene.add(mesh)}
batchCubes(dashedVertical,.17,.11,3.3);batchCubes(dashedHorizontal,3.3,.11,.17);batchCubes(crossV,.68,.13,1.3);
const makeLabel=(txt,w=170)=>{const c=document.createElement('canvas');c.width=512;c.height=116;const ctx=c.getContext('2d');ctx.fillStyle='#ffffffed';ctx.beginPath();ctx.roundRect(5,6,502,102,22);ctx.fill();ctx.fillStyle='#096f69';ctx.font='bold 45px Manrope, Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,256,59,480);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(w/25,1.7,1);return sprite};
function building(x,z,kind,index){const scheme=[0xb6d9da,0xe8d6b5,0xe0c0c3,0xb6cddd,0xe1d6c4,0xa9cdc2];const mat=new T.MeshLambertMaterial({color:scheme[index%scheme.length]});const special={school:'ESCOLA',factory:'FÁBRICA',workshop:'OFICINA',lab:'LABORATÓRIO',park:'PARQUE'}[kind];
if(kind==='park'){box(scene,11,.2,11,x,.02,z,new T.MeshLambertMaterial({color:0x7bbd84}));for(const [dx,dz] of [[-3,-2],[2,2],[3,-3]])tree(x+dx,z+dz,.9);const tag=makeLabel(special);tag.position.set(x,4.9,z);scene.add(tag);world.walls.push({type:'rect',x,z,hw:5,hd:5,ghost:true});return}
const height=kind==='factory'?7:kind==='school'?5:kind==='lab'?6.5:3.2+(index%4)*1.1,ww=kind==='factory'?12:10,dd=kind==='factory'?10:9.5;box(scene,ww,height,dd,x,height/2,z,mat);box(scene,ww+.7,.45,dd+.7,x,height+.23,z,mats.white);
if(kind==='school'){box(scene,3,1.5,.12,x,1.6,z-dd/2-.07,mats.board);box(scene,2.5,1,.2,x,2.2,z-dd/2-.1,mats.white)}
else if(kind==='factory'){for(const xx of [-3,0,3])cyl(scene,.45,.45,2.5,8,x+xx,height+1.2,z+2,mats.dark)}
else if(kind==='lab'){box(scene,8,.42,8,x,height+.67,z,mats.teal)}
for(let i=-1;i<=1;i++){box(scene,1.35,1.38,.1,x+i*2.5,Math.max(1.4,height*.58),z-dd/2-.1,mats.window);box(scene,.1,1.38,1.35,x+ww/2+.1,Math.max(1.4,height*.58),z+i*2.5,mats.window)}
if(special){const tag=makeLabel(special);tag.position.set(x,height+2.1,z);scene.add(tag)}
world.walls.push({type:'rect',x,z,hw:ww/2+.2,hd:dd/2+.2});
}
function tree(x,z,scale=1){cyl(scene,.23*scale,.3*scale,2*scale,7,x,1.08*scale,z,mats.trunk);cyl(scene,1.33*scale,1.6*scale,3*scale,7,x,3.1*scale,z,mats.leaf);world.walls.push({type:'circle',x,z,r:.83*scale})}
const specials={'40,-40':'school','40,40':'factory','-40,40':'lab','-40,-40':'park','0,0':'workshop'};
let index=0;for(const x of [-60,-40,-20,0,20,40,60])for(const z of [-60,-40,-20,0,20,40,60]){const kind=specials[x+','+z]||'house';building(x,z,kind,index++);if(kind==='house'){tree(x-6,z-6,.6);if(index%3===0)tree(x+6,z+6,.7)}}
function cone(x,z){cyl(scene,.12,.73,1.5,9,x,.82,z,mats.cone);cyl(scene,.44,.44,.2,9,x,.7,z,mats.white);box(scene,1.45,.15,1.45,x,.09,z,mats.dark);world.walls.push({type:'circle',x,z,r:.91})}
for(const [x,z] of [[-50,13],[-30,3],[-50,-5],[10,-22],[50,4],[30,20],[5,50],[10,1],[-23,-10],[-10,-17],[50,-23],[-10,37],[-50,31],[30,-43]])cone(x,z);
function crate(x,z){box(scene,2.1,1.8,2.1,x,.98,z,mats.yellow);box(scene,2.15,.17,.15,x,1.5,z-1.1,mats.dark);world.walls.push({type:'rect',x,z,hw:1.1,hd:1.1})}
for(const [x,z] of [[-10,22],[50,-25],[2,-50],[30,43],[-50,-15]])crate(x,z);
function lamp(x,z){cyl(scene,.1,.12,4.4,7,x,2.2,z,mats.dark);cyl(scene,.38,.55,.45,7,x,4.6,z,mats.white)}
for(const [x,z] of [[-23,26],[16,-24],[23,15],[-16,-24],[-35,-15],[5,15],[-5,-35],[45,45],[-43,53],[53,-44]])lamp(x,z);
const car=new T.Group();world.car=car;scene.add(car);
box(car,1.85,.42,3.2,0,.65,0,mats.dark);box(car,1.55,.65,2.1,0,1.02,.1,mats.teal);box(car,1.25,.15,.9,0,1.43,.1,mats.board);box(car,1.3,.18,.5,0,.97,-1.13,mats.yellow);for(const side of [-1,1])for(const zz of [-1.05,1.03]){const wheel=new T.Mesh(new T.CylinderGeometry(.49,.49,.27,14),mats.dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.03,.51,zz);car.add(wheel);world.wheels.push({mesh:wheel,side});box(car,.24,.23,.73,side*.65,.51,zz,mats.yellow)}
box(car,.5,.18,.14,-.42,.85,-1.5,mats.white);box(car,.5,.18,.14,.42,.85,-1.5,mats.white);box(car,1.8,.18,.18,0,.5,1.63,mats.red);car.position.set(-50,0,50);
const goal=new T.Group();world.goal=goal;scene.add(goal);const ring=new T.Mesh(new T.TorusGeometry(2.25,.22,8,36),new T.MeshBasicMaterial({color:0xffd56c}));ring.rotation.x=Math.PI/2;ring.position.y=.25;goal.add(ring);cyl(goal,.28,.28,5,10,0,2.5,0,mats.teal);const marker=new T.Mesh(new T.OctahedronGeometry(1.5),new T.MeshBasicMaterial({color:0xffda7a}));marker.position.y=6.25;goal.add(marker);world.goalBeam=marker;updateGoal();
let last=performance.now();function animate(now){world.runFrame=true;requestAnimationFrame(animate);const dt=Math.min(.10,Math.max(0,(now-last)/1000));last=now;world.clockTime+=dt;if(isDrive())physics(dt);
car.position.x=state.drive.x;car.position.z=state.drive.z;car.rotation.y=state.drive.angle;
for(const wheel of world.wheels)wheel.mesh.rotation.y+=((wheel.side<0?state.drive.a:state.drive.b)/255)*dt*13;
goal.children[0].rotation.z=world.clockTime*.5;marker.position.y=6.1+Math.sin(world.clockTime*2)*.3;marker.rotation.y=world.clockTime*.5;
const angle=state.drive.angle,external=state.cameraTop,px=state.drive.x,pz=state.drive.z,fx=-Math.sin(angle),fz=-Math.cos(angle);const want=new T.Vector3(px-fx*(external?9:.25),external?6.2:1.95,pz-fz*(external?9:.25));camera.position.lerp(want,Math.min(1,dt*(external?6:13)));camera.lookAt(px+fx*(external?8:16),external?1.35:.48,pz+fz*(external?8:16));renderer.render(scene,camera)}
camera.position.set(-49.75,1.95,50);camera.lookAt(-30,.48,50);requestAnimationFrame(animate)}
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
 if(!force&&stamp&&world.routeLastMission===state.mission&&Math.hypot(d.x-stamp[0],d.z-stamp[1])<3.8)return;
 const T=world.THREE;
 const points=buildPoints();
 if(!world.routeGroup){world.routeGroup=new T.Group();world.scene.add(world.routeGroup)}
 const group=world.routeGroup;for(const mesh of [...group.children]){group.remove(mesh);mesh.geometry?.dispose();mesh.material?.dispose?.()}
 const ribbonMaterial=new T.MeshBasicMaterial({color:0x29e4b7,transparent:true,opacity:.79,depthWrite:false,depthTest:true});
 const arrowMaterial=new T.MeshBasicMaterial({color:0xfaff9b,transparent:true,opacity:.98,depthWrite:false,side:T.DoubleSide});
 let distance=0;
 for(let i=1;i<points.length;i++){
  const p=points[i-1],q=points[i],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);
  if(len<.5)continue;distance+=len;
  const seg=new T.Mesh(new T.BoxGeometry(.95,.025,len),ribbonMaterial.clone());
  seg.position.set((p[0]+q[0])/2,.153,(p[1]+q[1])/2);
  seg.rotation.y=Math.atan2(-dx,-dz);
  group.add(seg);
  const ux=dx/len,uz=dz/len,px=-uz,pz=ux;
  for(let t=6;t<len-1.2;t+=8){
   const cx=p[0]+ux*t,cz=p[1]+uz*t;
   const coords=[cx+ux*1.15,.187,cz+uz*1.15,cx-ux*.72+px*.66,.187,cz-uz*.72+pz*.66,cx-ux*.72-px*.66,.187,cz-uz*.72-pz*.66];
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));g.computeVertexNormals();
   group.add(new T.Mesh(g,arrowMaterial.clone()));
  }
 }
 group.visible=state.mode==='drive'||state.mode==='pause'||state.mode==='start';
 ribbonMaterial.dispose();arrowMaterial.dispose();
 world.routePoints=points;world.routeDistance=distance;world.routeLastPos=[d.x,d.z];world.routeLastMission=state.mission;
 updateCompass();
}

function collides(x,z){if(Math.abs(x)>73||Math.abs(z)>73)return true;for(const wall of world.walls){if(wall.ghost)continue;if(wall.type==='circle'){if(Math.hypot(x-wall.x,z-wall.z)<wall.r+1)return true}
else{const dx=Math.max(Math.abs(x-wall.x)-wall.hw,0),dz=Math.max(Math.abs(z-wall.z)-wall.hd,0);if(Math.hypot(dx,dz)<1)return true}}return false}
function physics(dt){const d=state.drive,cmd=commands();state.desired=cmd;state.driveSeconds+=dt;for(let i=0;i<2;i++)if(state.pointer[i]===null)setThumb(i,cmd[i]);const prevA=d.a,prevB=d.b;for(const [key,i] of [['a',0],['b',1]]){const target=cmd[i],current=d[key],rate=Math.abs(target)>Math.abs(current)?570:1550;d[key]=current+clamp(target-current,-rate*dt,rate*dt);if(Math.abs(d[key])<.7)d[key]=0}updateReadout();
const a=d.a/255,b=d.b/255;const v=(a+b)/2*9.2,omega=(b-a)*1.85;const angleNext=d.angle+omega*dt;const nx=d.x-Math.sin((d.angle+angleNext)/2)*v*dt,nz=d.z-Math.cos((d.angle+angleNext)/2)*v*dt;if((Math.abs(v)>.1||Math.abs(omega)>.1)&&collides(nx,nz)){d.a=0;d.b=0;state.desired=[0,0];d.collided=true;updateReadout();toast('Obstáculo! Solte os controles e acelere novamente.',true);return}
d.angle=angleNext;d.x=nx;d.z=nz;state.meters+=Math.abs(v*dt);updateDistance();updateRoute();
const goal=missions[Math.min(state.mission,3)].to;if(Math.hypot(d.x-goal[0],d.z-goal[1])<2.65){completeMission();return}
if(state.meters>=state.nextEvent&&state.driveSeconds>=state.nextEventTime)triggerEvent()}
window.__TinkerpetMission={state,questions,missions,baseWires,beginQuestion,beginRepair,resetGame,physics,commands,collides,updateRoute,buildPoints,triggerEvent,requestQuitChallenge,cancelQuitChallenge,confirmQuitChallenge};
boot();
})();