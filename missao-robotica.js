(()=>{'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlays=['authOverlay','startOverlay','questionOverlay','repairOverlay','pauseOverlay','endOverlay'];
const missions=[
 {title:'Entrega na escola',desc:'Leve o material da oficina até a escola.',to:[-10,-30],label:'ESCOLA'},
 {title:'Peças para a fábrica',desc:'Transporte peças até a zona industrial.',to:[30,-10],label:'FÁBRICA'},
 {title:'Manutenção do parque',desc:'Entregue os equipamentos no parque da cidade.',to:[30,30],label:'PARQUE'},
 {title:'De volta ao laboratório',desc:'Conclua a última entrega no laboratório de robótica.',to:[-30,-30],label:'LABORATÓRIO'}
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
const state={mode:'auth',ready:false,lives:3,mission:0,questionsCorrect:new Set(),asked:[],scoreQuestions:0,scoreRepairs:0,scoreMissions:0,meters:0,nextEvent:22,eventCount:0,lastFault:null,drive:{x:-30,z:30,angle:Math.PI/2,a:0,b:0,collided:false},desired:[0,0],pointer:[null,null],pointerValue:[0,0],keys:new Set(),cameraTop:false,challengeTimer:null,challengeStarted:0,challengeEnd:0,activeQuestion:null,fault:null,wires:null,switches:null,gpios:null,skipUntil:0,completed:false};
const world={THREE:null,renderer:null,scene:null,camera:null,car:null,wheels:[],walls:[],goal:null,goalLabel:null,goalBeam:null,clockTime:0,lastFrame:0,runFrame:false};
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
function updateDistance(){if(state.completed)return;const m=missions[Math.min(state.mission,3)],d=Math.hypot(state.drive.x-m.to[0],state.drive.z-m.to[1]);$('missionDistance').textContent='Destino · '+Math.ceil(d)+' m'}
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
const k=state.keys,front=k.has('w')||k.has('arrowup'),back=k.has('s')||k.has('arrowdown'),left=k.has('a')||k.has('arrowleft'),right=k.has('d')||k.has('arrowright');let base=front&&!back?230:back&&!front?-195:0;if(left)base*=1;if(right)base*=1;return[Math.round(base*(left?.25:1)),Math.round(base*(right?.25:1))]}
function installUI(){
$('authForm').addEventListener('submit',e=>{e.preventDefault();if($('password').value.trim()!=='peteducacao'){$('authError').textContent='Senha incorreta. Tente novamente.';return}try{sessionStorage.setItem('tinkerpet-missao-3d-acesso','ok')}catch{}$('authError').textContent='';setMode('start')});
$('showPassword').addEventListener('click',()=>{const p=$('password');p.type=p.type==='password'?'text':'password';$('showPassword').textContent=p.type==='password'?'Mostrar':'Ocultar'});
$('startBtn').addEventListener('click',()=>{if(!state.ready)return;resetGame();setMode('drive');toast('Missão iniciada. Controle os dois motores!')});
$('pauseBtn').addEventListener('click',()=>{if(!isDrive())return;stopRobot();setMode('pause')});
$('resumeBtn').addEventListener('click',()=>{setMode('drive');stopRobot()});
$('restartBtn').addEventListener('click',()=>{resetGame();setMode('drive');toast('Nova aventura iniciada!')});
$('viewBtn').addEventListener('click',()=>{state.cameraTop=!state.cameraTop;$('viewBtn').setAttribute('aria-label',state.cameraTop?'Câmera de acompanhamento':'Câmera superior')});
$('fullBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen()}catch{toast('Tela cheia não está disponível neste navegador.')}});
installControl(0);installControl(1);installKeys();
$('componentBoard').addEventListener('click',e=>{if(state.mode!=='repair'||!state.fault)return;const box=e.target.closest('[data-component]');if(!box)return;const id=box.dataset.component;if(id==='switch1'||id==='switch2'){state.switches[id]=!state.switches[id];renderRepair();checkRepair()}});
$('connectionList').addEventListener('click',e=>{if(state.mode!=='repair'||!state.fault)return;const row=e.target.closest('[data-wire]');if(!row||e.target.tagName==='SELECT')return;const id=row.dataset.wire;if(state.wires[id]===false){state.wires[id]=true;renderRepair();checkRepair()}});
$('connectionList').addEventListener('change',e=>{if(state.mode!=='repair'||!state.fault||!e.target.matches('select[data-gpio]'))return;state.gpios[e.target.dataset.gpio]=e.target.value;renderRepair();checkRepair()});
window.addEventListener('resize',()=>{if(world.renderer&&world.camera){const w=$('scene').clientWidth,h=$('scene').clientHeight;world.camera.aspect=Math.max(1,w)/Math.max(1,h);world.camera.updateProjectionMatrix();world.renderer.setSize(w,h)}})}
function resetGame(){clearChallengeTimer();state.lives=3;state.mission=0;state.scoreMissions=0;state.scoreQuestions=0;state.scoreRepairs=0;state.questionsCorrect=new Set();state.asked=[];state.meters=0;state.nextEvent=22;state.eventCount=0;state.lastFault=null;state.completed=false;state.drive={x:-30,z:30,angle:Math.PI/2,a:0,b:0,collided:false};state.desired=[0,0];state.pointer=[null,null];state.pointerValue=[0,0];state.keys.clear();state.skipUntil=0;setThumb(0,0);setThumb(1,0);updateReadout();updateLives();updateMission();if(world.car){world.car.position.set(-30,0,30);world.car.rotation.y=Math.PI/2}updateGoal()}
function loseLife(){clearChallengeTimer();state.lives--;updateLives();if(state.lives<=0){endGame(false);return}setMode('drive');stopRobot();state.drive.collided=true;toast('Tempo esgotado. Você perdeu uma vida.',true);state.skipUntil=performance.now()+10000}
function endGame(won){state.completed=true;stopRobot();clearChallengeTimer();$('endKicker').textContent=won?'AVENTURA CONCLUÍDA':'FIM DE JOGO';$('endSymbol').textContent=won?'★':'♥';$('endTitle').textContent=won?'Missão cumprida!':'Fim de jogo';$('endDescription').textContent=won?'Você percorreu a cidade e concluiu todas as entregas!':'As três vidas terminaram. Reinicie para tentar novamente.';$('scoreMissions').textContent=state.scoreMissions;$('scoreQuestions').textContent=state.scoreQuestions;$('scoreRepairs').textContent=state.scoreRepairs;setMode('end')}
function startTimer(kind){clearChallengeTimer();state.challengeStarted=performance.now();state.challengeEnd=state.challengeStarted+30000;const prefix=kind==='question'?'question':'repair';const tick=()=>{if(state.mode!==kind)return;const sec=Math.max(0,(state.challengeEnd-performance.now())/1000),node=$(prefix+'Timer'),bar=$(prefix+'Timebar');node.textContent=String(Math.ceil(sec));bar.style.width=(sec/30*100).toFixed(2)+'%';bar.classList.toggle('low',sec<10);node.parentElement.classList.toggle('danger',sec<10);if(sec<=0)loseLife()};state.challengeTimer=setInterval(tick,100);tick()}
function pickQuestion(){let eligible=questions.map((q,i)=>i).filter(i=>!state.questionsCorrect.has(i));if(!eligible.length)return null;const notLast=eligible.filter(i=>i!==state.asked.at(-1));if(notLast.length)eligible=notLast;const fresh=eligible.filter(i=>!state.asked.includes(i));const index=(fresh.length?fresh:eligible)[rand((fresh.length?fresh:eligible).length)];state.asked.push(index);return index}
function renderQuestion(){const i=pickQuestion();if(i===null){solveChallenge('Todas as perguntas foram respondidas!');return}state.activeQuestion=i;const q=questions[i];$('questionText').textContent=q[0];$('answers').replaceChildren();shuffled(q[1].map((txt,index)=>({txt,correct:index===q[2]}))).forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='answer';const letter=document.createElement('span');letter.className='letter';letter.textContent='ABCD'[i];const label=document.createElement('span');label.textContent=a.txt;b.append(letter,label);b.addEventListener('click',()=>answer(a.correct));$('answers').append(b)});}
function beginQuestion(){stopRobot();setMode('question');$('questionResponse').textContent='Escolha a alternativa correta para continuar.';renderQuestion();startTimer('question')}
function answer(correct){if(state.mode!=='question')return;if(performance.now()>=state.challengeEnd){loseLife();return}if(correct){state.questionsCorrect.add(state.activeQuestion);state.scoreQuestions++;solveChallenge('Resposta correta! Continue a missão.');return}$('questionResponse').textContent='Resposta incorreta. Nova pergunta!';renderQuestion()}
function newFault(){const available=faultPool.filter(f=>f.kind+f.id!==state.lastFault);const fault=available[rand(available.length)];state.lastFault=fault.kind+fault.id;return {...fault}}
function beginRepair(){stopRobot();state.fault=newFault();state.wires=Object.fromEntries(baseWires.map(w=>[w.id,true]));state.switches={switch1:true,switch2:true};state.gpios=Object.fromEntries(baseWires.filter(w=>w.kind==='gpio').map(w=>[w.id,w.correct]));if(state.fault.kind==='wire')state.wires[state.fault.id]=false;if(state.fault.kind==='switch')state.switches[state.fault.id]=false;if(state.fault.kind==='gpio')state.gpios[state.fault.id]=state.fault.wrong;setMode('repair');renderRepair();startTimer('repair')}
function renderRepair(){
for(const id of ['switch1','switch2']){const node=$('switch'+id.slice(-1)+'status');node.textContent=state.switches[id]?'LIGADA':'DESLIGADA';document.querySelector('[data-component="'+id+'"]').classList.toggle('off',!state.switches[id])}
const list=$('connectionList');list.replaceChildren();
for(const wire of baseWires){const row=document.createElement('button');row.type='button';row.className='wire-row';row.dataset.wire=wire.id;const name=document.createElement('span');name.textContent=wire.title;row.append(name);
if(wire.kind==='gpio'){const s=document.createElement('select');s.dataset.gpio=wire.id;s.setAttribute('aria-label','Selecionar GPIO de '+wire.title.split('→').pop().trim());for(const value of ['D18','D19','D26','D27','D32']){const o=document.createElement('option');o.value=value;o.textContent=value;s.append(o)}s.value=state.gpios[wire.id];row.append(s)}
else{const good=state.wires[wire.id];const tag=document.createElement('span');tag.className='wire-status'+(good?'':' loose');tag.textContent=good?'Ligado':'Solto';row.classList.toggle('loose',!good);row.append(tag);row.disabled=good}
list.append(row)}
$('repairStatus').textContent='Confira todos os terminais, conexões e chaves.'
}
function checkRepair(){const good=baseWires.every(w=>w.kind==='gpio'?state.gpios[w.id]===w.correct:state.wires[w.id])&&Object.values(state.switches).every(Boolean);if(good){state.scoreRepairs++;solveChallenge('Circuito restabelecido! Volte à missão.')}}
function solveChallenge(message){clearChallengeTimer();setMode('drive');stopRobot();state.drive.collided=true;state.skipUntil=performance.now()+9000;toast(message)}
function triggerEvent(){if(!isDrive()||performance.now()<state.skipUntil)return;state.nextEvent+=27+rand(10);state.eventCount++;if(state.eventCount%2===1)beginQuestion();else beginRepair()}
function completeMission(){state.scoreMissions++;state.mission++;stopRobot();state.drive.collided=true;if(state.mission>=missions.length){endGame(true);return}updateMission();updateGoal();state.skipUntil=performance.now()+7500;toast('Entrega concluída! Próxima missão desbloqueada.')}
function boot(){installUI();updateLives();updateMission();if(sessionStorage.getItem('tinkerpet-missao-3d-acesso')==='ok')setMode('start');else setMode('auth');load3D()}
async function load3D(){try{
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
 init3D(THREE);state.ready=true;$('startBtn').disabled=false;
 }catch(error){console.error('Não foi possível carregar a cidade 3D',error);$('startBtn').disabled=true;$('startBtn').textContent='Não foi possível carregar o mapa 3D';if(state.mode==='auth')$('authError').textContent='O mapa precisa de conexão para carregar. Verifique a internet.';toast('Não foi possível carregar o cenário 3D. Verifique a conexão.',true)}
}
function init3D(T){
world.THREE=T;const scene=new T.Scene();scene.background=new T.Color(0xc5e9ed);scene.fog=new T.Fog(0xc5e9ed,65,145);world.scene=scene;
const camera=new T.PerspectiveCamera(55,Math.max(1,$('scene').clientWidth)/Math.max(1,$('scene').clientHeight),.1,210);world.camera=camera;
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setSize(Math.max(1,$('scene').clientWidth),Math.max(1,$('scene').clientHeight));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;$('scene').append(renderer.domElement);world.renderer=renderer;
scene.add(new T.HemisphereLight(0xf4ffff,0x7d9983,2.35));const sun=new T.DirectionalLight(0xfff4dc,2.4);sun.position.set(-35,65,25);scene.add(sun);
const mats={grass:new T.MeshLambertMaterial({color:0x8fcb99}),road:new T.MeshLambertMaterial({color:0x415766}),sidewalk:new T.MeshLambertMaterial({color:0xdbe5df}),line:new T.MeshBasicMaterial({color:0xf1f5e9}),yellow:new T.MeshLambertMaterial({color:0xf6c65c}),dark:new T.MeshLambertMaterial({color:0x243946}),teal:new T.MeshLambertMaterial({color:0x12a18d}),white:new T.MeshLambertMaterial({color:0xfff9ed}),leaf:new T.MeshLambertMaterial({color:0x2f9c7a}),trunk:new T.MeshLambertMaterial({color:0x956b49}),red:new T.MeshLambertMaterial({color:0xe17968}),window:new T.MeshLambertMaterial({color:0x89cfdf}),board:new T.MeshLambertMaterial({color:0x1c6e69}),cone:new T.MeshLambertMaterial({color:0xf08e51})};
const box=(parent,w,h,d,x,y,z,mat)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);parent.add(o);return o};
const cyl=(parent,rt,rb,h,segments,x,y,z,mat)=>{const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),mat);o.position.set(x,y,z);parent.add(o);return o};
box(scene,112,.3,112,0,-.24,0,mats.grass);
for(const axis of ['x','z'])for(const pos of [-30,-10,10,30]){if(axis==='x'){box(scene,10,.07,112,pos,-.025,0,mats.sidewalk);box(scene,8.1,.1,112,pos,.015,0,mats.road);for(let i=-52;i<=52;i+=9)box(scene,.17,.11,3.3,pos,.073,i,mats.line)}
else{box(scene,112,.07,10,0,-.024,pos,mats.sidewalk);box(scene,112,.1,8.1,0,.02,pos,mats.road);for(let i=-52;i<=52;i+=9)box(scene,3.3,.11,.17,i,.077,pos,mats.line)}}
for(const x of [-30,-10,10,30])for(const z of [-30,-10,10,30]){for(let k=-2;k<=2;k++){box(scene,.68,.13,1.3,x-6.1,.09,z+k*1.5,mats.line);box(scene,.68,.13,1.3,x+6.1,.09,z+k*1.5,mats.line)}}
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
const specials={'-20,-20':'school','20,-20':'factory','-20,20':'workshop','20,20':'park','0,0':'lab'};
let index=0;for(const x of [-40,-20,0,20,40])for(const z of [-40,-20,0,20,40]){const kind=specials[x+','+z]||'house';building(x,z,kind,index++);if(kind==='house'){tree(x-6,z-6,.6);if(index%3===0)tree(x+6,z+6,.7)}}
function cone(x,z){cyl(scene,.12,.73,1.5,9,x,.82,z,mats.cone);cyl(scene,.44,.44,.2,9,x,.7,z,mats.white);box(scene,1.45,.15,1.45,x,.09,z,mats.dark);world.walls.push({type:'circle',x,z,r:.91})}
for(const [x,z] of [[-30,13],[-10,3],[-30,-5],[10,-22],[30,4],[30,20],[5,30],[10,1],[-23,-10],[-10,-17]])cone(x,z);
function crate(x,z){box(scene,2.1,1.8,2.1,x,.98,z,mats.yellow);box(scene,2.15,.17,.15,x,1.5,z-1.1,mats.dark);world.walls.push({type:'rect',x,z,hw:1.1,hd:1.1})}
for(const [x,z] of [[-10,22],[30,-25],[2,-30]])crate(x,z);
function lamp(x,z){cyl(scene,.1,.12,4.4,7,x,2.2,z,mats.dark);cyl(scene,.38,.55,.45,7,x,4.6,z,mats.white)}
for(const [x,z] of [[-23,26],[16,-24],[23,15],[-16,-24],[-35,-15],[5,15],[-5,-35]])lamp(x,z);
const car=new T.Group();world.car=car;scene.add(car);
box(car,1.85,.42,3.2,0,.65,0,mats.dark);box(car,1.55,.65,2.1,0,1.02,.1,mats.teal);box(car,1.25,.15,.9,0,1.43,.1,mats.board);box(car,1.3,.18,.5,0,.97,-1.13,mats.yellow);for(const side of [-1,1])for(const zz of [-1.05,1.03]){const wheel=new T.Mesh(new T.CylinderGeometry(.49,.49,.27,14),mats.dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.03,.51,zz);car.add(wheel);world.wheels.push(wheel);box(car,.24,.23,.73,side*.65,.51,zz,mats.yellow)}
box(car,.5,.18,.14,-.42,.85,-1.5,mats.white);box(car,.5,.18,.14,.42,.85,-1.5,mats.white);box(car,1.8,.18,.18,0,.5,1.63,mats.red);car.position.set(-30,0,30);
const goal=new T.Group();world.goal=goal;scene.add(goal);const ring=new T.Mesh(new T.TorusGeometry(2.25,.22,8,36),new T.MeshBasicMaterial({color:0xffd56c}));ring.rotation.x=Math.PI/2;ring.position.y=.25;goal.add(ring);cyl(goal,.28,.28,5,10,0,2.5,0,mats.teal);const marker=new T.Mesh(new T.OctahedronGeometry(1.5),new T.MeshBasicMaterial({color:0xffda7a}));marker.position.y=6.25;goal.add(marker);world.goalBeam=marker;updateGoal();
let last=performance.now();function animate(now){world.runFrame=true;requestAnimationFrame(animate);const dt=Math.min(.042,Math.max(0,(now-last)/1000));last=now;world.clockTime+=dt;if(isDrive())physics(dt);
car.position.x=state.drive.x;car.position.z=state.drive.z;car.rotation.y=state.drive.angle;
for(const wheel of world.wheels)wheel.rotation.y+=((state.drive.a+state.drive.b)*.5/255)*dt*13;
goal.children[0].rotation.z=world.clockTime*.5;marker.position.y=6.1+Math.sin(world.clockTime*2)*.3;marker.rotation.y=world.clockTime*.5;
const angle=state.drive.angle,top=state.cameraTop,px=state.drive.x,pz=state.drive.z;const want=new T.Vector3(px+(top?0:Math.sin(angle)*10),top?28:10,pz+(top?0:Math.cos(angle)*10));camera.position.lerp(want,Math.min(1,dt*5));camera.lookAt(px,0,pz);renderer.render(scene,camera)}
camera.position.set(-20,12,43);camera.lookAt(-30,0,30);requestAnimationFrame(animate)}
function updateGoal(){if(!world.goal)return;const m=missions[Math.min(state.mission,3)];world.goal.position.set(m.to[0],0,m.to[1]);if(world.goalLabel){world.scene.remove(world.goalLabel);world.goalLabel.material.dispose();world.goalLabel=null}if(world.THREE){const T=world.THREE;const c=document.createElement('canvas');c.width=360;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#fff9ed';ctx.beginPath();ctx.roundRect(5,4,350,72,22);ctx.fill();ctx.fillStyle='#126d6a';ctx.font='bold 31px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.label,180,40,338);const t=new T.CanvasTexture(c);const sprite=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false}));sprite.scale.set(7.2,1.6,1);sprite.position.set(m.to[0],9,m.to[1]);world.scene.add(sprite);world.goalLabel=sprite}}
function collides(x,z){if(Math.abs(x)>52||Math.abs(z)>52)return true;for(const wall of world.walls){if(wall.ghost)continue;if(wall.type==='circle'){if(Math.hypot(x-wall.x,z-wall.z)<wall.r+1)return true}
else{const dx=Math.max(Math.abs(x-wall.x)-wall.hw,0),dz=Math.max(Math.abs(z-wall.z)-wall.hd,0);if(Math.hypot(dx,dz)<1)return true}}return false}
function physics(dt){const d=state.drive,cmd=commands();state.desired=cmd;for(let i=0;i<2;i++)if(state.pointer[i]===null)setThumb(i,cmd[i]);const prevA=d.a,prevB=d.b;for(const [key,i] of [['a',0],['b',1]]){const target=cmd[i],current=d[key],rate=Math.abs(target)>Math.abs(current)?570:1550;d[key]=current+clamp(target-current,-rate*dt,rate*dt);if(Math.abs(d[key])<.7)d[key]=0}updateReadout();
const a=d.a/255,b=d.b/255;const v=(a+b)/2*9.2,omega=(b-a)*1.85;const angleNext=d.angle+omega*dt;const nx=d.x-Math.sin((d.angle+angleNext)/2)*v*dt,nz=d.z-Math.cos((d.angle+angleNext)/2)*v*dt;if((Math.abs(v)>.1||Math.abs(omega)>.1)&&collides(nx,nz)){stopRobot();d.collided=true;toast('Obstáculo! Solte os controles e acelere novamente.',true);return}
d.angle=angleNext;d.x=nx;d.z=nz;state.meters+=Math.abs(v*dt);updateDistance();
const goal=missions[Math.min(state.mission,3)].to;if(Math.hypot(d.x-goal[0],d.z-goal[1])<2.65){completeMission();return}
if(state.meters>=state.nextEvent)triggerEvent()}
window.__TinkerpetMission={state,questions,missions,baseWires,beginQuestion,beginRepair,resetGame,physics,commands,collides};
boot();
})();