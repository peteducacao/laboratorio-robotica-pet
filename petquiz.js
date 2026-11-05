'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const KEY='petquiz-session-v1';
 const FAST=window.__PETQUIZ_TEST_SPEED__===true;
 const DUR={read:FAST?180:5000,answer:FAST?1800:20000,result:FAST?160:4000,bonus:FAST?5000:35000,bonusResult:FAST?220:1900};
 const QUESTIONS=[
  {prompt:'O ESP32 está ligado, mas a ponte H não recebe energia das pilhas AA. Qual é a primeira verificação mais adequada?',
   choices:['Revisar os fios de sinal IN1 e IN2','Verificar o conjunto AA, a gangorra dos motores e a entrada de energia da ponte H','Trocar os terminais do Motor A','Aumentar a tensão do LM2596 para 9 V'],correct:1,
   why:'O ESP32 e a ponte H têm alimentações distintas. Primeiro é preciso investigar o caminho das pilhas AA até a ponte H.'},
  {prompt:'O Motor B gira, mas o Motor A não responde. Por onde começar a investigação?',
   choices:['Conferir as duas conexões do Motor A na ponte H','Inverter os fios da bateria de 9 V','Alterar a gangorra do ESP32','Aumentar igualmente as velocidades dos motores'],correct:0,
   why:'Como o Motor B responde, vale verificar primeiro os terminais e a fiação específicos do Motor A.'},
  {prompt:'No nosso carrinho, qual caminho alimenta o ESP32 a partir da bateria de 9 V?',
   choices:['Bateria 9 V → saída Motor A → GPIO','Bateria 9 V → ponte H → pino D27','Bateria 9 V → conjunto AA → GND','Bateria 9 V → gangorra → LM2596 ajustado → VIN e GND do ESP32'],correct:3,
   why:'O LM2596 reduz e regula a tensão antes da alimentação do ESP32 pelo VIN e GND.'},
  {prompt:'A ponte H recebe alimentação das pilhas, mas os comandos do ESP32 não são reconhecidos. O que pode estar faltando?',
   choices:['Uma segunda bateria de 9 V nos motores','Ligar o negativo da ponte H a um GND do ESP32','Ligar a saída do Motor B ao VIN','Remover o fio GND do regulador'],correct:1,
   why:'Os circuitos de controle precisam de uma referência de GND compartilhada para interpretar corretamente os sinais.'},
  {prompt:'As duas rodas avançam, mas o carrinho precisa fazer uma curva para a esquerda. Qual ajuste tende a produzir essa curva?',
   choices:['Fazer o Motor B girar para a frente mais rápido que o A','Aumentar igualmente A e B','Desligar a alimentação do ESP32','Aumentar o Motor A para a frente mais que o B'],correct:0,
   why:'Em um carrinho diferencial, a roda do lado direito mais rápida faz o robô curvar para a esquerda.'},
  {prompt:'A entrada do LM2596 recebe 9 V. Antes de ligá-lo ao VIN do ESP32 deste projeto, o que deve ser feito?',
   choices:['Conectar a saída sem medi-la','Ligar a saída diretamente no pino D18','Ajustar e conferir a saída em aproximadamente 5 V','Juntar o OUT+ e o OUT−'],correct:2,
   why:'No projeto, a saída do regulador deve ser ajustada e medida em torno de 5 V antes de conectar ao VIN.'},
  {prompt:'Os suportes A (4 pilhas) e B (2 pilhas) serão ligados em série. Qual conexão entre eles está correta?',
   choices:['A− com B−','A+ com B+','A− com B+ e também A+ com B−','A+ com B−, deixando as outras pontas para alimentar o circuito'],correct:3,
   why:'Na ligação em série do projeto, A+ conecta-se ao B−. Os terminais livres formam a alimentação do conjunto.'},
  {prompt:'O esquema do carrinho usa IN4 da ponte H no pino D18 do ESP32, mas o fio está em D19. Qual correção corresponde ao esquema?',
   choices:['Mover IN4 para D18','Mover IN4 para VIN','Mover IN1 para D19','Unir IN4 à saída do Motor A'],correct:0,
   why:'O sinal IN4 deve seguir para D18, conforme o esquema de ligações escolhido para esse carrinho.'},
  {prompt:'O ESP32 acende quando sua gangorra é ligada, mas os motores seguem sem energia. Qual explicação é mais adequada?',
   choices:['O regulador impede os motores de receber comandos','O motor só funciona com Wi-Fi','A alimentação dos motores depende de outra gangorra e das pilhas AA','O ESP32 não pode funcionar enquanto a ponte H está desligada'],correct:2,
   why:'Existem duas alimentações e duas gangorras. Ligar somente a do ESP32 não liga a ponte H.'},
  {prompt:'No projeto, qual é o papel principal da ponte H entre o ESP32 e os motores DC?',
   choices:['Medir a qualidade da água','Receber sinais de controle e acionar os motores nos sentidos desejados','Carregar a bateria de 9 V','Substituir todas as pilhas AA'],correct:1,
   why:'A ponte H usa os comandos do microcontrolador para controlar o acionamento e o sentido dos motores.'},
  {prompt:'O carrinho deveria andar reto, mas uma roda gira bem mais devagar do que a outra. O que faz mais sentido verificar primeiro?',
   choices:['Se as velocidades comandadas para os dois motores estão iguais','Se a bateria de 9 V está conectada a D27','Se o LM2596 está no máximo','Se as gangorras estão em posições opostas'],correct:0,
   why:'Antes de mudar fios, compare os comandos e velocidades dos motores A e B: diferenças podem provocar curvas.'},
  {prompt:'Uma criança quer fazer o carrinho girar no próprio lugar. Qual combinação de comandos para os motores é mais apropriada?',
   choices:['Ambos parados','A e B para a frente, iguais','A mais lento e B mais rápido, ambos para a frente','Motor A para trás e Motor B para a frente'],correct:3,
   why:'Rodas girando em sentidos opostos podem fazer o carrinho diferencial girar sobre o próprio eixo.'}
 ];
 const BONUS=[
  {id:'straight',title:'Faça as duas rodas avançarem juntas!',prompt:'Regule os motores A e B para a frente, na mesma velocidade. Observe as rodas girando.',voltage:false,
   check:(a,b)=>a>=30&&b>=30&&Math.abs(a-b)<=10,tip:'As duas rodas precisam avançar em velocidades semelhantes.'},
  {id:'curve',title:'Faça o carrinho virar à esquerda!',prompt:'Experimente deixar o Motor B mais rápido que o A, ambos para a frente.',voltage:false,
   check:(a,b)=>a>=0&&b>=30&&b-a>=20,tip:'A roda do lado direito precisa girar mais rápido.'},
  {id:'regulator',title:'Regule o LM2596 para 5 V!',prompt:'A entrada recebe 9 V. Ajuste a saída simulada para 5 V e confirme a medição.',voltage:true,
   check:v=>v===5,tip:'Observe o valor de saída no mostrador.'}
 ];
 const keys=['read','answer','result','bonus','bonusResult'];
 function shuffle(arr){
  const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
 }
 function scheduleBonus(){
  const candidates=shuffle([2,3,4,5,6,7,8,9,10]);
  const chosen=[];
  for(const x of candidates){if(chosen.every(y=>Math.abs(x-y)>=2))chosen.push(x);if(chosen.length===3)break}
  if(chosen.length<2)throw Error('Não foi possível distribuir os eventos bônus');
  return chosen.sort((a,b)=>a-b);
 }
 const fresh=()=>({
  phase:'intro',idx:0,order:shuffle(QUESTIONS.map((_,i)=>i)),options:QUESTIONS.map(()=>shuffle([0,1,2,3])),
  bonusAt:scheduleBonus(),bonusOrder:shuffle(BONUS.map((_,i)=>i)),shownBonus:[],currentBonus:null,solvedBonus:0,
  score:0,correct:0,wrong:0,timeout:0,last:null,deadline:0
 });
 function load(){
  try{
   const s=JSON.parse(localStorage.getItem(KEY)||'null');
   if(!s||!keys.includes(s.phase)&&!['intro','finished'].includes(s.phase))return fresh();
   if(!Array.isArray(s.order)||s.order.length!==QUESTIONS.length||!Array.isArray(s.bonusAt))return fresh();
   if(!Array.isArray(s.options)||s.options.length!==QUESTIONS.length)return fresh();
   if(!Array.isArray(s.shownBonus))s.shownBonus=[];
   return s;
  }catch{return fresh()}
 }
 let state=load();
 let timeoutHandle=null;
 let advancing=false;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
 const fmt=n=>Math.round(n).toLocaleString('pt-BR');
 function setPhase(phase,duration){
  state.phase=phase;
  state.deadline=duration?Date.now()+duration:0;
  save();draw();
 }
 function activeQuestion(){return QUESTIONS[state.order[state.idx]]}
 function activeOptions(){return state.options[state.order[state.idx]]}
 function view(id){
  ['introScreen','gameScreen'].forEach(x=>$(x).hidden=x!==id);
  if(id==='gameScreen'){
   $('questionView').hidden=state.phase==='bonus'||state.phase==='bonusResult'||state.phase==='finished';
   $('bonusView').hidden=state.phase!=='bonus'&&state.phase!=='bonusResult';
   $('finalView').hidden=state.phase!=='finished';
  }
 }
 function updateHud(){
  $('scoreValue').textContent=fmt(state.score);
  $('questionCount').innerHTML=String(Math.min(state.idx+1,QUESTIONS.length)).padStart(2,'0')+' <small>/ '+QUESTIONS.length+'</small>';
  const bonus=state.phase==='bonus'||state.phase==='bonusResult';
  $('stageLabel').textContent=bonus?'BÔNUS':'PERGUNTA';
  $('phaseLabel').textContent=state.phase==='read'?'LEITURA':state.phase==='answer'?'RESPOSTAS':bonus?'EVENTO BÔNUS':state.phase==='finished'?'CONCLUÍDO':'RESULTADO';
  $('hudInfo').textContent=state.phase==='read'?'Só a pergunta por 5 segundos':state.phase==='answer'?'20 segundos para escolher':bonus?'Não vale pontos':state.phase==='result'?'Veja a explicação':'';
  const total=QUESTIONS.length;
  $('runProgress').style.width=((state.idx+(state.phase==='result'?1:0))/total*100)+'%';
 }
 function renderQuestion(){
  const q=activeQuestion(),isRead=state.phase==='read',result=state.phase==='result';
  $('questionText').textContent=q.prompt;
  $('answersWrap').hidden=isRead;
  $('readingPlaceholder').hidden=!isRead;
  $('readHint').textContent=isRead?'Leia com atenção. As alternativas aparecerão em 5 segundos.':
   result?'Veja a explicação antes de continuar.':'Escolha a alternativa que melhor resolve a situação.';
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
   $('feedbackExplanation').textContent=q.why;
  }
 }
 function paintBonus(){
  const type=BONUS[state.currentBonus];if(!type)return;
  $('bonusTitle').textContent=type.title;
  $('bonusPrompt').textContent=type.prompt;
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
    'Experimento concluído! Você descobriu o resultado. +0 ponto, porque é bônus.':
    'O evento bônus terminou. Seus pontos permanecem iguais.';
  }else{
   $('bonusMessage').classList.remove('ok');
   $('bonusMessage').textContent='Desafio extra: sem pontos e sem penalidade.';
  }
  drawBonusControls();
 }
 function drawBonusControls(){
  const a=Number($('bonusA').value),b=Number($('bonusB').value),v=Number($('bonusVoltage').value);
  $('bonusAValue').textContent=a+'%';$('bonusBValue').textContent=b+'%';
  $('bonusVoltageValue').textContent=v.toFixed(1).replace('.',',')+' V';
  $('bonusVoltageDisplay').innerHTML=v.toFixed(1).replace('.',',')+' <small>V</small>';
  $('bonusCarLed').classList.toggle('active',a!==0||b!==0);
  const angle=a<0&&b>0?-23:a>0&&b<0?23:Math.max(-16,Math.min(16,(a-b)*.20));
  $('bonusCar').style.transform='rotate('+angle+'deg)';
  for(const [id,val] of [['bonusWheelA',a],['bonusWheelB',b]]){
   const wheel=$(id);wheel.classList.toggle('spinning',val!==0);wheel.classList.toggle('backward',val<0);
   wheel.style.setProperty('--speed',Math.max(.14,1.18-.95*Math.abs(val)/100)+'s');
  }
  let observation=a===0&&b===0?'As rodas estão paradas.':
   a>0&&b>0&&Math.abs(a-b)<=10?'As duas rodas avançam juntas.':
   a>=0&&b>a?'O motor direito gira mais rápido: tendência de curva à esquerda.':
   b>=0&&a>b?'O motor esquerdo gira mais rápido: tendência de curva à direita.':
   'As rodas estão se movendo com velocidades ou sentidos diferentes.';
  $('bonusMotorStatus').textContent=observation;
 }
 function drawFinal(){
  $('finalScore').textContent=fmt(state.score);
  $('finalCorrect').textContent=state.correct;
  $('finalWrong').textContent=state.wrong;
  $('finalTimeout').textContent=state.timeout;
  $('finalBonus').textContent=state.shownBonus.length;
 }
 function draw(){
  const phase=state.phase;
  view(phase==='intro'?'introScreen':'gameScreen');
  $('resetQuiz').hidden=phase==='intro';
  if(phase==='intro')return;
  updateHud();
  if(phase==='read'||phase==='answer'||phase==='result')renderQuestion();
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
   $('timerValue').textContent=Math.ceil(remaining/1000);
   const circle=$('timerCircle');circle.classList.toggle('urgent',phase==='answer'&&remaining<=5000);
   circle.style.background=phase==='answer'&&remaining<=5000?
    'conic-gradient(#df5955 '+(frac*360)+'deg,#f5d7d4 0)':
    'conic-gradient(#19ad91 '+(frac*360)+'deg,#c9e5db 0)';
  }
 }
 function start(){
  if(state.phase==='intro')setPhase('read',DUR.read);
  else draw();
 }
 function answer(choice){
  if(state.phase!=='answer'||Date.now()>=state.deadline)return;
  const q=activeQuestion(),remaining=Math.max(0,state.deadline-Date.now()),correct=choice===q.correct;
  const delta=correct?Math.max(250,Math.round(1000*remaining/DUR.answer)):0;
  if(correct){state.correct++;state.score+=delta}else state.wrong++;
  state.last={status:correct?'correct':'wrong',selected:choice,delta};
  setPhase('result',DUR.result);
 }
 function timeoutQuestion(){
  if(state.phase!=='answer')return;
  state.timeout++;state.last={status:'timeout',selected:null,delta:0};
  setPhase('result',DUR.result);
 }
 function next(){
  if(state.phase!=='result'||advancing)return;
  advancing=true;
  const completedCount=state.idx+1;
  if(completedCount>=QUESTIONS.length){setPhase('finished',0);advancing=false;return}
  if(state.bonusAt.includes(completedCount)&&!state.shownBonus.includes(completedCount)){
   state.shownBonus.push(completedCount);
   state.currentBonus=state.bonusOrder[(state.shownBonus.length-1)%state.bonusOrder.length];
   $('bonusA').value=0;$('bonusB').value=0;$('bonusVoltage').value=9;
   state.bonusSuccess=false;
   setPhase('bonus',DUR.bonus);
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
  else $('bonusMessage').textContent='Ainda não deu certo. '+type.tip+' Você pode tentar novamente.';
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
  else if(state.phase==='answer')timeoutQuestion();
  else if(state.phase==='result')next();
  else if(state.phase==='bonus')completeBonus(false);
  else if(state.phase==='bonusResult')leaveBonus();
 }
 function reset(){
  state=fresh();save();draw();
 }
 function bind(){
  $('startQuiz').addEventListener('click',start);
  $('resetQuiz').addEventListener('click',reset);
  $('playAgain').addEventListener('click',()=>{reset();start()});
  $('nextQuestion').addEventListener('click',next);
  $('bonusTry').addEventListener('click',bonusTry);
  $('bonusSkip').addEventListener('click',leaveBonus);
  ['bonusA','bonusB','bonusVoltage'].forEach(id=>$(id).addEventListener('input',drawBonusControls));
  document.addEventListener('keydown',e=>{
   if(e.target instanceof HTMLInputElement)return;
   if(state.phase!=='answer')return;
   const idx=['1','2','3','4'].indexOf(e.key);
   if(idx>=0)answer(activeOptions()[idx]);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)clockTick()});
 }
 // Resume a previously started quiz without changing the ongoing timer.
 bind();draw();setInterval(clockTick,100);
 window.PetQuiz={getStatus:()=>({
   phase:state.phase,index:state.idx,score:state.score,correct:state.correct,wrong:state.wrong,
   timeout:state.timeout,bonusCount:state.shownBonus.length,bonusSolved:state.solvedBonus,deadline:state.deadline,
   bonusAt:[...state.bonusAt]
 }),version:'1.0'};
})();