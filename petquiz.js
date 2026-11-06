'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 const KEY='petquiz-session-v1';
 const FAST=window.__PETQUIZ_TEST_SPEED__===true;
 const DUR={read:FAST?300:5000,answer:FAST?2500:20000,result:FAST?850:4000,bonusIntro:FAST?420:2500,bonus:FAST?5000:35000,bonusResult:FAST?450:1900};
 let QUESTIONS=[
  {
    "id": "componente-fora",
    "stage": "concept",
    "topic": "outros",
    "prompt": "Qual desses componentes não faz parte da montagem do nosso carrinho?",
    "choices": [
      "ESP32",
      "Sensor ultrassônico",
      "Ponte H",
      "Motor DC"
    ],
    "correct": 1,
    "why": "O carrinho utiliza ESP32, ponte H e motores DC. O sensor ultrassônico não faz parte dessa montagem."
  },
  {
    "id": "componente-ponte",
    "stage": "concept",
    "topic": "ponte",
    "prompt": "Qual desses componentes é responsável por controlar os motores?",
    "choices": [
      "Regulador de tensão",
      "Suporte de pilhas",
      "Ponte H",
      "Chave gangorra"
    ],
    "correct": 2,
    "why": "A ponte H recebe os comandos do ESP32 e controla o acionamento dos motores."
  },
  {
    "id": "componente-lm2596",
    "stage": "concept",
    "topic": "lm2596",
    "prompt": "Qual componente utilizamos para regular a tensão que alimenta o ESP32?",
    "choices": [
      "Ponte H",
      "Motor DC",
      "Chave gangorra",
      "LM2596"
    ],
    "correct": 3,
    "why": "O LM2596 permite ajustar a tensão de saída para alimentar o ESP32 no projeto."
  },
  {
    "id": "componente-gangorra",
    "stage": "concept",
    "topic": "gangorra",
    "prompt": "Qual deles é utilizado para ligar e desligar o carrinho?",
    "choices": [
      "Chave gangorra",
      "Jumper",
      "Ponte H",
      "ESP32"
    ],
    "correct": 0,
    "why": "As chaves gangorra interrompem ou liberam a alimentação elétrica."
  },
  {
    "id": "componente-jumper",
    "stage": "concept",
    "topic": "jumper",
    "prompt": "Qual é o nome dos fios usados no carrinho?",
    "choices": [
      "Motor DC",
      "Roda",
      "Jumper",
      "Suporte de pilhas"
    ],
    "correct": 2,
    "why": "Os jumpers são fios usados para interligar os componentes do circuito."
  },
  {
    "id": "componente-esp32",
    "stage": "concept",
    "topic": "esp32",
    "prompt": "Qual componente funciona como o cérebro do carrinho?",
    "choices": [
      "Ponte H",
      "ESP32",
      "LM2596",
      "Chave gangorra"
    ],
    "correct": 1,
    "why": "O ESP32 executa os comandos que orientam o comportamento do carrinho."
  },
  {
    "id": "componente-motor",
    "stage": "concept",
    "topic": "motor",
    "prompt": "Qual deles movimenta as rodas do carrinho?",
    "choices": [
      "Motor DC",
      "Regulador de tensão",
      "ESP32",
      "Suporte de pilhas"
    ],
    "correct": 0,
    "why": "Os motores DC giram seus eixos e movimentam as rodas."
  },
  {
    "id": "componente-rodas",
    "stage": "concept",
    "topic": "rodas",
    "prompt": "Qual é a função das rodas no carrinho robótico?",
    "choices": [
      "Controlar a tensão elétrica",
      "Receber os comandos do ESP32",
      "Permitir que o carrinho ande",
      "Armazenar energia"
    ],
    "correct": 2,
    "why": "As rodas transformam o giro dos motores em deslocamento do carrinho."
  },
  {
    "id": "componente-bateria",
    "stage": "concept",
    "topic": "bateria",
    "prompt": "Qual dessas fontes de energia utilizamos para o ESP32?",
    "choices": [
      "Uma pilha AA",
      "Um painel solar",
      "O suporte de seis pilhas AA",
      "Uma bateria de 9 V"
    ],
    "correct": 3,
    "why": "No projeto, a bateria de 9 V passa pela chave gangorra e pelo regulador antes de alimentar o ESP32."
  },
  {
    "id": "componente-pilhas",
    "stage": "concept",
    "topic": "pilhas",
    "prompt": "Para que utilizamos os suportes de pilhas AA no carrinho?",
    "choices": [
      "Para controlar a direção",
      "Para alimentar os motores por meio da ponte H",
      "Para transmitir comandos por Wi-Fi",
      "Para regular a saída do LM2596"
    ],
    "correct": 1,
    "why": "O conjunto de pilhas AA alimenta a ponte H, que fornece energia aos motores."
  },
  {
    "id": "funcionamento-alimentacao-ponte",
    "stage": "practice",
    "requires": [
      "pilhas"
    ],
    "prompt": "O ESP32 ligou, mas a ponte H não recebeu energia. O que verificar primeiro?",
    "choices": [
      "As conexões de controle entre ESP32 e ponte H",
      "A alimentação das pilhas AA e a gangorra dos motores",
      "As conexões do Motor A com a ponte H",
      "A saída do regulador de tensão"
    ],
    "correct": 1,
    "why": "O ESP32 e os motores possuem alimentações diferentes. Confira as pilhas AA e a gangorra dos motores."
  },
  {
    "id": "funcionamento-motor-a",
    "stage": "practice",
    "requires": [
      "motor"
    ],
    "prompt": "O Motor B funciona, mas o Motor A permanece parado. Qual conexão deve ser investigada primeiro?",
    "choices": [
      "A conexão entre o regulador e o ESP32",
      "A conexão da bateria de 9 V",
      "As conexões do Motor A na ponte H",
      "A conexão da gangorra do ESP32"
    ],
    "correct": 2,
    "why": "Se um motor responde e o outro não, vale começar pelas conexões do motor parado."
  },
  {
    "id": "funcionamento-seguir-reto",
    "stage": "practice",
    "requires": [
      "rodas"
    ],
    "prompt": "As duas rodas funcionam, mas o carrinho faz uma curva quando deveria seguir reto. O que ajustar?",
    "choices": [
      "Igualar as velocidades dos motores",
      "Diminuir apenas a velocidade da roda esquerda",
      "Inverter o sentido de uma das rodas",
      "Aumentar apenas a velocidade da roda direita"
    ],
    "correct": 0,
    "why": "Rodas que giram em velocidades diferentes podem fazer o carrinho virar."
  },
  {
    "id": "funcionamento-lm",
    "stage": "practice",
    "requires": [
      "lm2596"
    ],
    "prompt": "Durante a regulagem do LM2596, o medidor parou em 7 V. Qual ajuste devemos fazer?",
    "choices": [
      "Aumentar a saída até 9 V",
      "Manter a saída em 7 V",
      "Diminuir a saída até 3 V",
      "Reduzir a saída até 5 V e conferir a medição"
    ],
    "correct": 3,
    "why": "No projeto, regulamos e conferimos a saída do LM2596 em aproximadamente 5 V antes de alimentar o ESP32."
  },
  {
    "id": "funcionamento-esquerda",
    "stage": "practice",
    "requires": [
      "rodas"
    ],
    "prompt": "O carrinho precisa virar à esquerda. Como as rodas devem girar?",
    "choices": [
      "As duas para a frente, com a mesma velocidade",
      "A esquerda mais rápida que a direita",
      "A direita mais rápida que a esquerda",
      "As duas para trás, com a mesma velocidade"
    ],
    "correct": 2,
    "why": "Com ambas avançando, a roda direita mais rápida faz o carrinho tender a virar à esquerda."
  },
  {
    "id": "funcionamento-duas-chaves",
    "stage": "practice",
    "requires": [
      "gangorra"
    ],
    "prompt": "A gangorra do ESP32 está ligada, mas a dos motores está desligada. O que acontece?",
    "choices": [
      "O carrinho funciona normalmente",
      "O ESP32 pode ligar, mas a ponte H fica sem alimentação das pilhas AA",
      "A ponte H recebe energia diretamente do regulador",
      "Os motores recebem energia pelos pinos do ESP32"
    ],
    "correct": 1,
    "why": "Há chaves e fontes distintas: o ESP32 pode ligar sem que os motores estejam alimentados."
  },
  {
    "id": "funcionamento-bateria-9v",
    "stage": "practice",
    "requires": [
      "bateria"
    ],
    "prompt": "A bateria de 9 V será utilizada para alimentar o ESP32. Qual sequência corresponde ao projeto?",
    "choices": [
      "Bateria → ponte H → ESP32",
      "Bateria → motor → regulador → ESP32",
      "Bateria → ESP32 → regulador",
      "Bateria → gangorra → LM2596 → ESP32"
    ],
    "correct": 3,
    "why": "A bateria passa pela chave gangorra e pelo LM2596 ajustado antes de alimentar o ESP32."
  },
  {
    "id": "funcionamento-chave-off",
    "stage": "practice",
    "requires": [
      "gangorra"
    ],
    "prompt": "A gangorra dos motores está desligada. Como ligar a alimentação dos motores?",
    "choices": [
      "Aumentar a velocidade dos motores",
      "Trocar a conexão entre o ESP32 e o regulador",
      "Acionar a chave gangorra dos motores",
      "Ajustar o LM2596 para 9 V"
    ],
    "correct": 2,
    "why": "A chave gangorra dos motores deve ser ligada para permitir a passagem de energia das pilhas AA para a ponte H."
  },
  {
    "id": "funcionamento-curva-direita",
    "stage": "practice",
    "requires": [
      "rodas"
    ],
    "prompt": "A roda esquerda gira mais rápido que a direita, com ambas avançando. Para qual lado o carrinho vai virar?",
    "choices": [
      "Para a direita",
      "Para a esquerda",
      "Segue reto",
      "Gira no próprio lugar"
    ],
    "correct": 0,
    "why": "Quando a roda esquerda avança mais rápido, o carrinho tende a virar para a direita."
  }
];
 // Valores negativos representam ré, positivos representam avanço.
 // O movimento reto exige a mesma velocidade nas duas rodas.
 const isForward=(a,b)=>a>0&&a===b;
 const isLeftCurveMotion=(a,b)=>a>=0&&b>0&&b>a;
 const isRightCurveMotion=(a,b)=>b>=0&&a>0&&a>b;
 const isReverse=(a,b)=>a<0&&a===b;
 const isStopped=(a,b)=>a===0&&b===0;
 const isStraightMotion=(a,b)=>a!==0&&a===b;
 const BONUS=[
  {id:'forward',title:'Faça o carrinho andar para a frente!',voltage:false,initial:[0,0],check:isForward},
  {id:'left',title:'Faça o carrinho virar à esquerda!',voltage:false,initial:[0,0],check:isLeftCurveMotion},
  {id:'right',title:'Faça o carrinho virar à direita!',voltage:false,initial:[0,0],check:isRightCurveMotion},
  {id:'reverse',title:'Faça o carrinho dar ré!',voltage:false,initial:[0,0],check:isReverse},
  {id:'stop',title:'Pare o carrinho em movimento!',voltage:false,initial:[60,60],check:isStopped},
  {id:'straight',title:'Faça o carrinho seguir em linha reta!',voltage:false,initial:[80,40],check:isStraightMotion},
  {id:'regulator',title:'Regule o LM2596!',voltage:true,initial:[9],check:v=>v===5}
 ];

 let GAME_SETTINGS={questionCount:10,bonusCount:2,quizEnabled:true};
 try{
  const response=await fetch('petquiz-settings.json?nocache='+Date.now(),{cache:'no-store'});
  if(response.ok){
   const remote=await response.json();
   if(Array.isArray(remote.questions)&&remote.questions.length){
    const valid=remote.questions.filter(q=>q&&typeof q.prompt==='string'&&
     Array.isArray(q.choices)&&q.choices.length===4&&Number.isInteger(q.correct)&&
     q.correct>=0&&q.correct<=3&&q.choices.every(c=>typeof c==='string')&&q.active!==false);
    if(valid.length)QUESTIONS=valid;
   }
   GAME_SETTINGS={...GAME_SETTINGS,
    questionCount:Math.max(1,Math.min(99,Math.trunc(Number(remote.questionCount)||10))),
    bonusCount:Math.max(0,Math.min(7,Math.trunc(remote.bonusCount==null?2:Number(remote.bonusCount)||0))),
    quizEnabled:remote.quizEnabled!==false};
  }
 }catch(err){console.warn('PETQuiz: usando banco padrão',err);}
 if(!GAME_SETTINGS.quizEnabled){
  document.body.innerHTML='<main style="max-width:540px;margin:14vh auto;padding:32px;text-align:center;font:16px system-ui;color:#143d50"><img width="80" src="assets/logo-pet.svg" alt=""><h1>PETQuiz indisponível</h1><p>O acesso está temporariamente bloqueado pelo administrador.</p><a href="projects.html" style="color:#087e81">Voltar aos meus circuitos</a></main>';
  return;
 }
 const introFoot=document.getElementById('introFoot');
 if(introFoot)introFoot.textContent=GAME_SETTINGS.questionCount+' perguntas por partida · Alternativas sorteadas';
 const keys=['read','answer','result','bonus','bonusResult'];
 function shuffle(arr){
  const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
 }
 function scheduleBonus(total){
  const count=Math.max(0,Math.min(GAME_SETTINGS.bonusCount,BONUS.length,Math.max(0,total-1)));
  const slots=shuffle(Array.from({length:Math.max(0,total-1)},(_,i)=>i+1));
  const chosen=[];
  for(const slot of slots){if(chosen.length>=count)break;if(chosen.every(p=>Math.abs(p-slot)>=2))chosen.push(slot);}
  for(const slot of slots){if(chosen.length>=count)break;if(!chosen.includes(slot))chosen.push(slot);}
  return chosen.sort((a,b)=>a-b);
 }
 // Cinco situações de aplicação e cinco perguntas sobre componentes.
 // Cada situação precisa aparecer depois da apresentação de seu componente.
 function buildRound(){
  const pool=QUESTIONS.map((q,i)=>({q,i})).filter(x=>x.q.active!==false);
  const concepts=pool.filter(x=>x.q.stage==='concept');
  const topics=new Set(concepts.map(x=>x.q.topic));
  const practices=pool.filter(x=>x.q.stage==='practice'&&(x.q.requires||[]).every(t=>topics.has(t)));
  const total=Math.min(Math.max(1,GAME_SETTINGS.questionCount),concepts.length+practices.length);
  if(total<1)return [];
  // Primeiro escolher situações práticas que caibam nos pré-requisitos;
  // para 10 questões manter a proporção de 5 componentes + 5 situações.
  const desired=Math.min(Math.floor(total/2),practices.length);
  let candidates=[],needed=[];
  for(const item of shuffle(practices)){
   if(candidates.length>=desired)break;
   const possible=[...candidates,item];
   const required=new Set(possible.flatMap(x=>x.q.requires||[]));
   if(required.size+possible.length<=total)candidates=possible;
  }
  const required=new Set(candidates.flatMap(x=>x.q.requires||[]));
  needed=concepts.filter(x=>required.has(x.q.topic));
  const selected=[...needed,...candidates],used=new Set(selected.map(x=>x.i));
  for(const item of shuffle(concepts)){
   if(selected.length>=total)break;
   if(!used.has(item.i)){selected.push(item);used.add(item.i)}
  }
  for(const item of shuffle(practices)){
   if(selected.length>=total)break;
   if(!used.has(item.i)&&(item.q.requires||[]).every(t=>selected.some(x=>x.q.topic===t))){
    selected.push(item);used.add(item.i);
   }
  }
  const remaining=[...selected],order=[],introduced=new Set();
  while(remaining.length){
   const ready=remaining.filter(x=>x.q.stage==='concept'||(x.q.requires||[]).every(t=>introduced.has(t)));
   if(!ready.length)throw Error('Banco de perguntas sem ordem válida');
   const conceptsReady=ready.filter(x=>x.q.stage==='concept');
   const practicesReady=ready.filter(x=>x.q.stage==='practice');
   const choice=practicesReady.length&&(!conceptsReady.length||Math.random()<.62)?
    shuffle(practicesReady)[0]:shuffle(conceptsReady)[0];
   order.push(choice.i);
   if(choice.q.stage==='concept')introduced.add(choice.q.topic);
   remaining.splice(remaining.indexOf(choice),1);
  }
  return order;
 }
 function bonusOrderForGame(){
  const order=shuffle(BONUS.map((_,i)=>i));
  const forced=FAST?BONUS.findIndex(b=>b.id===window.__PETQUIZ_TEST_BONUS_ID__):-1;
  return forced<0?order:[forced,...order.filter(i=>i!==forced)];
 }
 const fresh=()=>{
  const order=buildRound();
  return {phase:'intro',idx:0,order,options:QUESTIONS.map(()=>shuffle([0,1,2,3])),
   bonusAt:scheduleBonus(order.length),bonusOrder:bonusOrderForGame(),
   shownBonus:[],currentBonus:null,solvedBonus:0,bonusFeedback:null,
   score:0,correct:0,wrong:0,timeout:0,last:null,deadline:0,finishedReason:null};
 };
 // A partida existe somente enquanto a página estiver aberta. Não salvar pontuação,
 // rodada, perguntas ou bônus: ao voltar, sempre abrir a tela inicial.
 try{localStorage.removeItem(KEY)}catch{}
 let state=fresh();
 let advancing=false;
 const fmt=n=>Math.round(n).toLocaleString('pt-BR');
 let audio=null,soundOn=true,lastWarning=-1;
 function audioReady(){
  if(!soundOn)return null;
  try{
   const C=window.AudioContext||window.webkitAudioContext;
   if(!C)return null;
   audio ||=new C();
   if(audio.state==='suspended')audio.resume().catch(()=>{});
   return audio;
  }catch{return null}
 }
 function tone(freq,duration=.09,type='sine',delay=0,volume=.024){
  const a=audioReady();if(!a||a.state==='closed')return;
  try{
   const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;
   o.type=type;o.frequency.setValueAtTime(freq,t);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);
   g.gain.exponentialRampToValueAtTime(.0001,t+duration);
   o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+duration+.018);
  }catch{}
 }
 function sound(event){
  if(!soundOn)return;
  if(event==='start'){tone(520,.09);tone(740,.11,'sine',.10)}
  if(event==='reveal'){tone(720,.08);tone(900,.1,'sine',.10)}
  if(event==='correct'){tone(660,.1);tone(880,.14,'sine',.11);tone(1100,.23,'sine',.25)}
  if(event==='wrong'){tone(380,.17,'triangle');tone(250,.22,'triangle',.17)}
  if(event==='timeout'){tone(270,.14,'triangle');tone(210,.25,'triangle',.18)}
  if(event==='warning')tone(670,.065,'square',0,.015);
  if(event==='bonus'){tone(660,.1);tone(830,.11,'sine',.11);tone(1110,.3,'sine',.24)}
  if(event==='finish'){tone(523,.12);tone(659,.12,'sine',.14);tone(784,.12,'sine',.28);tone(1047,.35,'sine',.43)}
 }
 // Trilha instrumental original, sem música de terceiros.
 let nextMusicTime=0,musicStep=0;
 const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66,
  261.63,329.63,392,523.25,493.88,392,329.63,293.66];
 function musicTick(){
  if(!soundOn||state.phase==='intro'||state.phase==='finished')return;
  const ac=audioReady();if(!ac||ac.state!=='running')return;
  if(nextMusicTime<ac.currentTime)nextMusicTime=ac.currentTime+.08;
  while(nextMusicTime<ac.currentTime+.35){
   const n=notes[musicStep%notes.length],o=ac.createOscillator(),g=ac.createGain();
   o.type='sine';o.frequency.value=n;
   g.gain.setValueAtTime(.0001,nextMusicTime);
   g.gain.linearRampToValueAtTime(.007,nextMusicTime+.025);
   g.gain.exponentialRampToValueAtTime(.0001,nextMusicTime+.19);
   o.connect(g);g.connect(ac.destination);
   o.start(nextMusicTime);o.stop(nextMusicTime+.21);
   nextMusicTime+=.32;musicStep++;
  }
 }
 function syncSoundButton(){
  const b=$('soundToggle');b.setAttribute('aria-pressed',String(soundOn));
  b.title=soundOn?'Silenciar sons':'Ativar sons';
  b.innerHTML=soundOn?'♪ <span>Som ligado</span>':'♩ <span>Sem som</span>';
 }
 function syncFullscreenButton(){
  const active=!!document.fullscreenElement;
  const b=$('fullscreenToggle');b.setAttribute('aria-pressed',String(active));
  b.title=active?'Sair da tela cheia':'Entrar em tela cheia';
  b.innerHTML=active?'⊡ <span>Sair da tela cheia</span>':'⛶ <span>Tela cheia</span>';
 }
 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else if($('main').requestFullscreen)await $('main').requestFullscreen();
   else $('fullscreenToggle').title='Tela cheia não disponível neste navegador';
  }catch{$('fullscreenToggle').title='Tela cheia não disponível neste navegador'}
  syncFullscreenButton();
 }

 function setPhase(phase,duration){
  state.phase=phase;
  state.deadline=duration?Date.now()+duration:0;
  lastWarning=-1;
  draw();
  if(['read','bonusIntro','bonus','finished'].includes(phase)){
   if(document.fullscreenElement)$('main').scrollTo({top:0,behavior:'instant'});
   else window.scrollTo({top:0,behavior:'instant'});
  }
  if(phase==='read')sound('start');
  else if(phase==='answer')sound('reveal');
  else if(phase==='bonusIntro')sound('bonus');
  else if(phase==='finished'&&state.finishedReason!=='quit')sound('finish');
 }
 function activeQuestion(){return QUESTIONS[state.order[state.idx]]}
 function activeOptions(){return state.options[state.order[state.idx]]}
 function view(id){
  ['introScreen','gameScreen'].forEach(x=>$(x).hidden=x!==id);
  if(id==='gameScreen'){
   $('questionView').hidden=state.phase==='bonusIntro'||state.phase==='bonus'||state.phase==='bonusResult'||state.phase==='finished';
   $('bonusIntroView').hidden=state.phase!=='bonusIntro';
   $('bonusView').hidden=state.phase!=='bonus'&&state.phase!=='bonusResult';
   $('finalView').hidden=state.phase!=='finished';
  }
 }
 function updateHud(){
  $('scoreValue').textContent=fmt(state.score);
  $('questionCount').innerHTML=String(Math.min(state.idx+1,state.order.length)).padStart(2,'0')+' <small>/ '+state.order.length+'</small>';
  const bonus=state.phase==='bonusIntro'||state.phase==='bonus'||state.phase==='bonusResult';
  $('stageLabel').textContent=bonus?'BÔNUS':'PERGUNTA';
  $('phaseLabel').textContent=state.phase==='read'?'LEITURA':state.phase==='answer'?'RESPOSTAS':bonus?'EVENTO BÔNUS':state.phase==='finished'?'CONCLUÍDO':'RESULTADO';
  $('hudInfo').textContent=state.phase==='read'?'Só a pergunta por 5 segundos':state.phase==='answer'?'20 segundos para escolher':bonus?'Não vale pontos':state.phase==='result'?'Veja a explicação':'';
  const total=state.order.length;
  const completed=state.correct+state.wrong+state.timeout;
   const progress=state.phase==='finished'?completed:state.idx+(state.phase==='result'?1:0);
   $('runProgress').style.width=(total?Math.min(100,progress/total*100):100)+'%';
 }
 function renderQuestion(){
  const q=activeQuestion(),isRead=state.phase==='read',result=state.phase==='result';
  $('questionText').textContent=q.prompt;
  $('answersWrap').hidden=isRead;
  $('readingPlaceholder').hidden=!isRead;
  $('readHint').textContent=isRead?'Leia com atenção. As alternativas aparecerão em 5 segundos.':
   result?'Próxima pergunta em instantes.':'Escolha a alternativa que melhor resolve a situação.';
  $('timerCaption').textContent=isRead?'LEITURA':result?'RESULTADO':'RESPOSTA';
  $('answerFeedback').hidden=!result;
  const grid=$('answersGrid');grid.replaceChildren();
  if(!isRead){
   const names=['triângulo','losango','círculo','quadrado'],symbols=['▲','◆','●','■'];
   for(const [i,option] of activeOptions().entries()){
    const button=document.createElement('button');button.type='button';button.className='answer-btn a'+i;
    button.setAttribute('aria-label',names[i]+': '+q.choices[option]);
    const shape=document.createElement('span');shape.className='answer-shape';shape.textContent=symbols[i];
    const label=document.createElement('span');label.textContent=q.choices[option];
    button.append(shape,label);
    if(result){
     button.disabled=true;
     if(option===q.correct)button.classList.add('correct');
     else if(option===state.last?.selected)button.classList.add('wrong');
     else button.classList.add('muted');
    }else button.addEventListener('click',()=>answer(option));
    grid.append(button);
   }
  }
  if(result){
   const last=state.last||{selected:null,delta:0,status:'timeout'},correct=last.status==='correct';
   $('answerFeedback').classList.toggle('correct',correct);
   $('answerFeedback').classList.toggle('wrong',!correct);
   $('answerSymbol').textContent=correct?'✓':last.status==='timeout'?'◷':'!';
   $('feedbackHeading').textContent=correct?'Resposta correta!':last.status==='timeout'?'Tempo encerrado!':'Boa tentativa!';
   $('feedbackPoints').textContent=correct?'+'+fmt(last.delta)+' pontos':'0 ponto nesta pergunta';
   $('feedbackAdvance').textContent='A próxima atividade começa automaticamente.';
   // Justificativa guardada no banco de questões, não exibida ao aluno.
  }
 }
 function paintBonus(){
  const type=BONUS[state.currentBonus];if(!type)return;
  $('bonusTitle').textContent=type.title;
  $('bonusPrompt').textContent='';
  $('bonusMotorView').hidden=type.voltage;
  $('bonusVoltageView').hidden=!type.voltage;
  $('bonusMotorControls').hidden=type.voltage;
  $('bonusVoltageControls').hidden=!type.voltage;
  $('bonusTry').textContent=type.voltage?'Conferir medição →':'Testar movimento →';
  const finished=state.phase==='bonusResult';
  $('bonusTry').disabled=finished;
  $('bonusSkip').hidden=finished;
  if(finished){
   $('bonusMessage').classList.add('ok');
   $('bonusMessage').textContent=state.bonusSuccess?
    'Experimento concluído! Movimento reconhecido.':
    'O evento bônus terminou. Seus pontos permanecem iguais.';
  }else{
   $('bonusMessage').classList.remove('ok');
   $('bonusMessage').textContent='Desafio extra: sem pontos e sem penalidade.';
  }
  drawBonusControls();
  if(finished)setBonusCarMood(state.bonusSuccess?'success':'fail');
 }
 function setBonusCarMood(mood){
  const car=$('bonusCar');
  car.dataset.mood=mood;
  car.classList.toggle('reacting',mood==='success'||mood==='fail');
 }
 function drawBonusControls(){
  const a=Number($('bonusA').value),b=Number($('bonusB').value),v=Number($('bonusVoltage').value);
  $('bonusAValue').textContent=a+'%';$('bonusBValue').textContent=b+'%';
  $('bonusVoltageValue').textContent=v.toFixed(1).replace('.',',')+' V';
  $('bonusVoltageDisplay').innerHTML=v.toFixed(1).replace('.',',')+' <small>V</small>';
  $('bonusCarLed').classList.toggle('active',a!==0||b!==0);
  const angle=Math.max(-20,Math.min(20,(a-b)*.20));
  $('bonusCar').style.transform='rotate('+angle+'deg)';
   const intensity=Math.max(Math.abs(a),Math.abs(b));
   $('bonusCar').dataset.speed=intensity===0?'off':intensity<35?'slow':intensity<70?'medium':'fast';
  for(const [id,val] of [['bonusWheelA',a],['bonusWheelB',b]]){
   const wheel=$(id);
   wheel.classList.toggle('spinning',val!==0);
   wheel.classList.toggle('backward',val<0);
   wheel.dataset.direction=val>0?'forward':val<0?'reverse':'stopped';
   wheel.dataset.arrow=val>0?'↑':val<0?'↓':'·';
   wheel.style.setProperty('--speed',Math.max(.25,1.5-1.12*Math.abs(val)/100)+'s');
  }
  const motion=a===0&&b===0?'As rodas estão paradas.':
   isForward(a,b)?'O carrinho avança em linha reta.':
   isReverse(a,b)?'O carrinho está andando de ré.':
   isLeftCurveMotion(a,b)?'O carrinho está virando à esquerda.':
   isRightCurveMotion(a,b)?'O carrinho está virando à direita.':
   'Os motores estão ajustados.';
  $('bonusMotorStatus').textContent=motion;
  const mood=state.bonusFeedback==='wrong'?'fail':
   a===0&&b===0?'idle':a<0&&b<0?'reverse':a*b<0?'surprised':
   b>a?'left':a>b?'right':'forward';
  if(state.phase==='bonus')setBonusCarMood(mood);
 }
 function drawFinal(){
  const withdrew=state.finishedReason==='quit';
  const answered=state.correct+state.wrong+state.timeout;
  $('finalView').classList.toggle('is-abandoned',withdrew);
  $('finalKicker').textContent=withdrew?'RESULTADO DA PARTIDA':'FIM DO PETQUIZ';
  $('finalTitle').textContent=withdrew?'Partida encerrada':'Parabéns!';
  $('finalDescription').textContent=withdrew?
   'Este é seu placar até o momento da desistência.':'Você concluiu o desafio.';
  $('finalScoreLabel').textContent=withdrew?'PONTOS ACUMULADOS':'SUA PONTUAÇÃO';
  $('finalProgress').textContent=answered+' de '+state.order.length+' perguntas respondidas';
  $('finalScore').textContent=fmt(state.score);
  $('finalCorrect').textContent=state.correct;
  $('finalWrong').textContent=state.wrong;
  $('finalTimeout').textContent=state.timeout;
  $('finalBonus').textContent=state.shownBonus.length;
  $('quitQuiz').hidden=true;
 }
 function draw(){
  const phase=state.phase;
  view(phase==='intro'?'introScreen':'gameScreen');
  $('resetQuiz').hidden=phase==='intro';
  $('quitQuiz').hidden=phase==='intro'||phase==='finished';
  if(phase==='intro')return;
  updateHud();
  if(phase==='read'||phase==='answer'||phase==='result')renderQuestion();
  if(phase==='bonusIntro'){
   $('bonusIntroCount').textContent=String(state.shownBonus.length)+' de '+state.bonusAt.length;
   $('bonusIntroView').style.setProperty('--intro-duration',DUR.bonusIntro+'ms');
  }
  if(phase==='bonus'||phase==='bonusResult')paintBonus();
  if(phase==='finished')drawFinal();
  tickDisplay();
 }
 function tickDisplay(){
  if(!state.deadline)return;
  const phase=state.phase,remaining=Math.max(0,state.deadline-Date.now());
  const total=DUR[phase]||1000,frac=Math.max(0,Math.min(1,remaining/total));
  if(phase==='bonus'||phase==='bonusResult'){
   $('bonusTimerValue').textContent=Math.ceil(remaining/1000)+'s';
  }else if(phase==='read'||phase==='answer'||phase==='result'){
   const sec=Math.ceil(remaining/1000);
   $('timerValue').textContent=sec;
   if(phase==='result')$('feedbackAdvance').textContent='Próxima atividade em '+sec+'s';
   if(phase==='answer'&&sec<=5&&sec>0&&sec!==lastWarning){
    lastWarning=sec;sound('warning');
   }
   const circle=$('timerCircle');circle.classList.toggle('urgent',phase==='answer'&&remaining<=5000);
   circle.style.background=phase==='answer'&&remaining<=5000?
    'conic-gradient(#df5955 '+(frac*360)+'deg,#f5d7d4 0)':
    'conic-gradient(#19ad91 '+(frac*360)+'deg,#c9e5db 0)';
  }
 }
 function start(){
  if(state.phase==='intro'){audioReady();nextMusicTime=0;setPhase('read',DUR.read);}
  else draw();
 }
 function answer(choice){
  if(state.phase!=='answer'||Date.now()>=state.deadline)return;
  const q=activeQuestion(),remaining=Math.max(0,state.deadline-Date.now()),correct=choice===q.correct;
  const elapsed=Math.max(0,DUR.answer-remaining);
  const delta=correct?(elapsed<500?1000:Math.round(1000*(1-elapsed/(2*DUR.answer)))):0;
  if(correct){state.correct++;state.score+=delta}else state.wrong++;
  state.last={status:correct?'correct':'wrong',selected:choice,delta};
  setPhase('result',DUR.result);
  sound(correct?'correct':'wrong');
 }
 function timeoutQuestion(){
  if(state.phase!=='answer')return;
  state.timeout++;state.last={status:'timeout',selected:null,delta:0};
  setPhase('result',DUR.result);
  sound('timeout');
 }
 function next(){
  if(state.phase!=='result'||advancing)return;
  advancing=true;
  const completedCount=state.idx+1;
  if(completedCount>=state.order.length){setPhase('finished',0);advancing=false;return}
  if(state.bonusAt.includes(completedCount)&&!state.shownBonus.includes(completedCount)){
   state.shownBonus.push(completedCount);
   state.currentBonus=state.bonusOrder[(state.shownBonus.length-1)%state.bonusOrder.length];
   const selected=BONUS[state.currentBonus];
   $('bonusA').value=selected.initial[0];
   $('bonusB').value=selected.initial[1]??selected.initial[0];
   $('bonusVoltage').value=selected.voltage?selected.initial[0]:9;
   state.bonusFeedback=null;
   state.bonusSuccess=false;
   setBonusCarMood('idle');
   setPhase('bonusIntro',DUR.bonusIntro);
  }else{
   state.idx++;
   state.last=null;
   setPhase('read',DUR.read);
  }
  advancing=false;
 }
 function completeBonus(success){
  if(state.phase!=='bonus')return;
  state.bonusSuccess=!!success;
  if(success)state.solvedBonus=(state.solvedBonus||0)+1;
  setPhase('bonusResult',DUR.bonusResult);
 }
 function bonusTry(){
  if(state.phase!=='bonus')return;
  const type=BONUS[state.currentBonus];
  const a=Number($('bonusA').value),b=Number($('bonusB').value),v=Number($('bonusVoltage').value);
  const ok=type.voltage?type.check(v):type.check(a,b);
  if(ok)completeBonus(true);
  else{
   state.bonusFeedback='wrong';
   setBonusCarMood('fail');
   $('bonusMessage').textContent='Ainda não deu certo. Tente novamente.';
  }
 }
 function leaveBonus(){
  if(state.phase!=='bonus'&&state.phase!=='bonusResult')return;
  state.idx++;
  state.last=null;
  state.currentBonus=null;
  setPhase('read',DUR.read);
 }
 function clockTick(){
  if(!state.deadline)return;
  const remaining=state.deadline-Date.now();
  if(remaining>0){tickDisplay();return}
  if(state.phase==='read')setPhase('answer',DUR.answer);
  else if(state.phase==='bonusIntro')setPhase('bonus',DUR.bonus);
  else if(state.phase==='answer')timeoutQuestion();
  else if(state.phase==='result')next();
  else if(state.phase==='bonus')completeBonus(false);
  else if(state.phase==='bonusResult')leaveBonus();
 }
 function reset(){
  state=fresh();
  advancing=false;
  draw();
 }
 function abandonQuiz(){
  if(state.phase==='intro'||state.phase==='finished')return;
  // Não reiniciar: conservar os pontos e respostas já registrados.
  // Uma pergunta ainda sem resposta não vira erro nem tempo esgotado.
  state.finishedReason='quit';
  setPhase('finished',0);
  // O resultado permanece visível e nenhuma contagem continua em segundo plano.
 }
 function bind(){
  $('startQuiz').addEventListener('click',start);
  $('quitQuiz').addEventListener('click',abandonQuiz);
  $('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;syncSoundButton();if(soundOn){audioReady();nextMusicTime=0;sound('start')}});
  $('fullscreenToggle').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',syncFullscreenButton);
  syncSoundButton();syncFullscreenButton();
  $('resetQuiz').addEventListener('click',reset);
  $('playAgain').addEventListener('click',()=>{reset();start()});
  $('nextQuestion').addEventListener('click',next);
  $('bonusTry').addEventListener('click',bonusTry);
  $('bonusSkip').addEventListener('click',leaveBonus);
  ['bonusA','bonusB','bonusVoltage'].forEach(id=>$(id).addEventListener('input',()=>{
   if(state.phase!=='bonus')return;
   state.bonusFeedback=null;
   $('bonusMessage').classList.remove('ok');
   $('bonusMessage').textContent='Ajuste os controles e teste o resultado.';
   drawBonusControls();
  }));
  document.addEventListener('keydown',e=>{
   if(e.target instanceof HTMLInputElement)return;
   if(state.phase!=='answer')return;
   const idx=['1','2','3','4'].indexOf(e.key);
   if(idx>=0)answer(activeOptions()[idx]);
  });
  // Ao girar o telefone na abertura, voltar ao topo para não mostrar
  // o início cortado pela posição de rolagem da orientação anterior.
  let lastOrientation=window.innerWidth>window.innerHeight;
  window.addEventListener('resize',()=>{
   const landscape=window.innerWidth>window.innerHeight;
   if(landscape!==lastOrientation){
    lastOrientation=landscape;
    if(state.phase==='intro')requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));
   }
  });
  // Se sair da aba, trocar de aplicativo ou navegar para fora, encerrar a partida.
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden&&state.phase!=='intro')reset();
  });
  window.addEventListener('pagehide',()=>{
   if(state.phase!=='intro')reset();
  });
  // Ao voltar pelo histórico do navegador, inclusive pelo bfcache, recomeçar.
  window.addEventListener('pageshow',event=>{
   if(event.persisted&&state.phase!=='intro')reset();
  });
 }
 // Nenhum dado de partida é recuperado ou armazenado entre visitas.
 bind();draw();setInterval(clockTick,100);setInterval(musicTick,180);
 window.PetQuiz={getStatus:()=>({
   phase:state.phase,index:state.idx,score:state.score,correct:state.correct,wrong:state.wrong,
   timeout:state.timeout,bonusCount:state.shownBonus.length,bonusSolved:state.solvedBonus,deadline:state.deadline,
   bonusAt:[...state.bonusAt],questionTotal:state.order.length,
   finishedReason:state.finishedReason,answered:state.correct+state.wrong+state.timeout,
   plan:state.order.map(i=>({id:QUESTIONS[i].id,stage:QUESTIONS[i].stage,topic:QUESTIONS[i].topic||null,requires:QUESTIONS[i].requires||[]})),
   activeBonusId:state.currentBonus===null?null:BONUS[state.currentBonus].id,
   bonusIds:BONUS.map(b=>b.id),
   soundEnabled:soundOn,fullscreen:!!document.fullscreenElement
 }),version:'2.1'};
 // Ferramenta de regressão disponível apenas no modo de teste automatizado.
 // Não é exibida nem executável durante o uso normal do PETQuiz.
 if(FAST)window.PetQuiz.testBonus=(id)=>{
  const i=BONUS.findIndex(b=>b.id===id);
  if(i<0)throw Error('Bônus de teste desconhecido: '+id);
  state.currentBonus=i;
  state.shownBonus=[2];
  state.bonusSuccess=false;
  state.bonusFeedback=null;
  const config=BONUS[i];
  $('bonusA').value=config.initial[0];
  $('bonusB').value=config.initial[1]??config.initial[0];
  $('bonusVoltage').value=config.voltage?config.initial[0]:9;
  setBonusCarMood('idle');
  setPhase('bonusIntro',DUR.bonusIntro);
 };
})();