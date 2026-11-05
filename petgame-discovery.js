/* PETGame 2.0 — oficina de investigação. Sem cronômetro, vidas ou respostas punitivas. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const parts={
 switch2:['Gangorra dos motores','switch.svg','A chave interrompe ou permite a alimentação das pilhas AA.'],
 pack:['Suportes de pilhas AA','battery-pack.svg','Os suportes de 4 e 2 pilhas formam uma alimentação em série.'],
 motor:['Motor DC','motor-front.svg','A ponte H envia energia para cada motor por dois fios.'],
 bridge:['Ponte H','driver-mx1508.svg','A ponte H recebe os comandos do ESP32 e controla os motores.'],
 lm:['Regulador LM2596','lm2596.svg','O LM2596 reduz e ajusta a tensão antes do VIN do ESP32.'],
 esp:['Placa ESP32','esp32.svg','O ESP32 envia os comandos para a ponte H.'],
 jumper:['Fios jumpers','jumpers.svg','Os fios unem os componentes e compartilham o GND.'],
 switch1:['Gangorra do ESP32','switch.svg','A gangorra da bateria de 9 V controla somente a alimentação do ESP32.'],
 battery:['Bateria de 9 V','battery-9v.svg','A bateria de 9 V alimenta o regulador LM2596.']
};
const investigations=[
 {title:'Sem energia nas rodas',prompt:'O ESP32 está ligado, mas as rodas não respondem. Veja como a energia chega aos motores.',parts:['esp','switch2','bridge'],target:'switch2',action:'Ligar a gangorra dos motores',before:'A gangorra dos motores está desligada. As pilhas não estão alimentando a ponte H.',after:'A gangorra permite a passagem de energia das pilhas AA até a ponte H. Agora os motores podem funcionar.',hints:['O ESP32 está aceso. Investigue a alimentação separada dos motores.','Procure a chave que fica entre as pilhas AA e a ponte H.']},
 {title:'A ponte H está sem alimentação',prompt:'Na fábrica, o circuito está quase pronto, mas a ponte H não recebe energia do suporte AA. Encontre a ponta solta.',parts:['pack','switch2','bridge'],target:'switch2',action:'Conectar suporte AA à gangorra',before:'O fio positivo do conjunto AA está solto antes da gangorra que alimenta a ponte H.',after:'Você ligou o positivo do suporte AA à gangorra. Agora a energia pode seguir para a ponte H.',hints:['O ESP32 usa outra fonte. Observe o caminho das pilhas dos motores.','Procure uma ponta solta entre o suporte AA e a gangorra dos motores.']},
 {title:'Uma roda ficou parada',prompt:'Um motor gira, mas o Motor A não. Observe o caminho entre a ponte H e os motores.',parts:['motor','bridge','lm'],target:'motor',action:'Reconectar os dois fios do Motor A',before:'O Motor A está com uma conexão solta na saída MOTOR A da ponte H.',after:'O Motor A voltou a receber energia pela ponte H. Cada motor pode girar independentemente.',hints:['A ponte H controla os dois motores por saídas diferentes.','Olhe os dois fios que vão da saída MOTOR A até o motor.']},
 {title:'Energia na medida certa',prompt:'No parque, a alimentação do ESP32 precisa passar pelo regulador. Observe a tensão de saída.',parts:['lm','battery','esp'],target:'lm',action:'Testar tensão de saída',before:'Antes de alimentar o VIN, ajuste a saída do LM2596 para aproximadamente 5 V.',after:'O regulador ajustou a tensão para 5 V, adequada à entrada VIN do ESP32 neste circuito.',hints:['A bateria de 9 V não deve ir diretamente ao VIN neste projeto.','Selecione o LM2596 e ajuste o controle até 5 V.'],kind:'voltage'},
 {title:'Todo circuito precisa de referência',prompt:'No laboratório, os módulos recebem energia, mas os comandos aos motores falham. Investigue o GND comum.',parts:['jumper','bridge','esp'],target:'jumper',action:'Ligar GND da ponte H ao GND do ESP32',before:'A ponte H e o ESP32 ainda não compartilham a mesma referência elétrica (GND).',after:'A ponte H e o ESP32 agora compartilham o GND. Os sinais de controle podem ser interpretados corretamente.',hints:['Os sinais precisam de uma referência elétrica comum.','Observe o fio de GND entre a ponte H e o ESP32.']},
 {title:'O último comando',prompt:'Um jumper de comando foi colocado no pino errado. Compare com o esquema destacado.',parts:['jumper','esp','bridge'],target:'jumper',action:'Conectar IN4 ao pino D18',before:'O esquema do carrinho indica IN1→27, IN2→26, IN3→32 e IN4→18.',after:'IN4 está ligado ao D18, conforme o esquema do carrinho. Os sinais da ponte H estão completos.',hints:['Não precisa decorar portas: o esquema está disponível na bancada.','Procure a conexão IN4→D18 indicada no esquema.']}
];
const experiments=[
 {title:'Dois motores, um caminho',prompt:'Experimente controlar as duas rodas. Como fazer o carrinho seguir em linha reta?',hint:'Para andar reto, as duas rodas precisam avançar com a mesma velocidade.',result:'Com as duas rodas avançando na mesma velocidade, o carrinho segue reto.',works:(a,b)=>a>0&&a===b},
 {title:'Vamos fazer uma curva',prompt:'Agora queremos fazer uma curva para a esquerda, sem dar ré. Ajuste as velocidades.',hint:'A roda do lado de fora da curva percorre um caminho maior. Faça o motor direito girar mais rápido.',result:'O Motor A (esquerdo) ficou mais lento que o Motor B (direito). O carrinho vira para a esquerda.',works:(a,b)=>a>=0&&b>0&&b>a}
];

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Cada desafio começa com um teste real de falha; só depois a criança
   manipula controles e testa outra vez. Não há botão "consertar" automático. */
const operations=[
 {kind:'switch',check:v=>v.switchOn===true,
  fail:'O ESP32 está ligado, mas as pilhas não alimentam a ponte H. Observe o estado da gangorra.',
  effect:'A gangorra abriu ou fechou o caminho das pilhas AA até a ponte H.'},
 {kind:'series',check:v=>v.wireSolved===true,
  fail:'A ponte H ainda não recebe energia das pilhas AA.',
  effect:'O positivo do conjunto AA foi reconectado à gangorra dos motores.'},
 {kind:'motor',check:v=>v.wireSolved===true,
  fail:'O Motor A não está conectado aos dois terminais da saída MOTOR A da ponte H.',
  effect:'Os fios do Motor A estão conectados às duas saídas MOTOR A da ponte H.'},
 {kind:'voltage',check:v=>Number(v.voltage)===5,
  fail:'O medidor ainda não indica 5 V. Ajuste o LM2596 e teste novamente.',
  effect:'A saída do regulador está ajustada para 5 V, conforme o esquema deste carrinho.'},
 {kind:'ground',check:v=>v.wireSolved===true,
  fail:'Os módulos ainda não compartilham a referência GND. Confira as duas extremidades do jumper.',
  effect:'O negativo da ponte H agora está ligado ao GND do ESP32.'},
 {kind:'gpio',check:v=>v.wireSolved===true,
  fail:'A entrada IN4 continua no pino errado. Consulte o esquema e tente outra porta.',
  effect:'IN4 da ponte H foi ligado ao D18 do ESP32, conforme o esquema do projeto.'}
];
let active=null;
const get=()=>active?.state.discovery;
function ensure(state,preserve){
 if(!preserve||!state.discovery||!Array.isArray(state.discovery.inspected)){
  state.discovery={inspected:[],selected:null,hints:0,motors:[0,0],fixed:false,message:'',
   baseline:false,tests:0,values:{switchOn:false,source:'',dest:'',positive:'',negative:'',voltage:9,pin:''},testResult:null};
 }
 const d=state.discovery;
 if(!d.values||typeof d.values!=='object')d.values={switchOn:false,source:'',dest:'',positive:'',negative:'',voltage:9,pin:''};
 if(!Array.isArray(d.motors))d.motors=[0,0];
 if(!Array.isArray(d.inspected))d.inspected=[];
 if(typeof d.baseline!=='boolean')d.baseline=false;
 if(!Number.isFinite(d.tests))d.tests=0;
 return d;
}
function begin(state,kind,index,finished,preserve=false){
 const table=kind==='repair'?investigations:experiments;
 if(!table[index])throw Error('Descoberta inválida '+kind+' '+index);
 active={state,kind,index,finished};ensure(state,preserve);
 if(kind==='repair')renderRepair();else renderExperiment();
}
function componentCard(key,d){
 const [name,file]=parts[key],activeCard=d.selected===key;
 return '<button type="button" class="pet-part '+(activeCard?'active':'')+'" data-inspect="'+key+
  '" aria-pressed="'+activeCard+'"><img src="assets/component-preview/'+file+'" alt="" loading="eager">'+
  '<strong>'+esc(name)+'</strong><small>'+(d.inspected.includes(key)?'Observado ✓':'Observar peça')+'</small></button>';
}
function circuitVisual(index,d){
 let labels=index===3?['BATERIA 9 V','REGULADOR','ESP32']:index>=4?['ESP32','CONEXÕES','PONTE H']:['PILHAS AA','PONTE H','MOTORES'];
 const group=d.fixed?' powered':'';
 return '<div class="pet-circuit'+group+'" role="img" aria-label="Esquema ilustrado do circuito em teste">'+
 '<svg viewBox="0 0 520 108" aria-hidden="true"><defs><linearGradient id="petFlow" x2="1"><stop stop-color="#08b4a8"/>'+
 '<stop offset="1" stop-color="#a2f25a"/></linearGradient></defs>'+
 '<path class="circuit-wire" d="M100 54H209M309 54H415"/>'+
 '<rect x="8" y="15" width="96" height="78" rx="12" class="circuit-node"/>'+
 '<rect x="208" y="15" width="104" height="78" rx="12" class="circuit-node"/>'+
 '<rect x="413" y="15" width="99" height="78" rx="12" class="circuit-node"/>'+
 '<text x="56" y="60" text-anchor="middle">'+esc(labels[0])+'</text>'+
 '<text x="260" y="60" text-anchor="middle">'+esc(labels[1])+'</text>'+
 '<text x="462" y="60" text-anchor="middle">'+esc(labels[2])+'</text>'+
 '<circle cx="158" cy="54" r="6" class="power-led"/><circle cx="364" cy="54" r="6" class="power-led"/></svg>'+
 '<div class="pet-circuit-status"><span class="power-indicator"></span>'+
 (d.fixed?'Teste concluído: circuito funcionando':d.baseline?'Teste inicial feito · Experimente a correção':'Circuito pronto para ser testado')+'</div></div>';
}
const options=(values,current)=>values.map(o=>'<option value="'+esc(o)+'"'+(current===o?' selected':'')+'>'+esc(o)+'</option>').join('');
function selector(title,key,values,d){
 return '<label><span>'+esc(title)+'</span><select data-setting="'+key+'" aria-label="'+esc(title)+'">'+
 options(['Escolha um terminal',...values],d.values[key]||'')+'</select></label>';
}
function operationControl(index,d){
 const v=d.values,kind=operations[index].kind;
 if(kind==='switch'){
  return '<div class="pet-switch-layout"><div><strong>Gangorra das pilhas AA</strong>'+
  '<p class="pet-secondary">Toque para ligar ou desligar a alimentação dos motores.</p></div>'+
  '<button type="button" data-switch="1" class="pet-switch '+(v.switchOn?'on':'')+
  '" aria-pressed="'+!!v.switchOn+'">'+(v.switchOn?'ON · LIGADA':'OFF · DESLIGADA')+'</button></div>';
 }
 if(kind==='series'){
  return '<p>Monte a união em série entre os dois suportes de pilhas:</p><div class="pet-task-row">'+
  selector('Do suporte A (4 pilhas):','source',['A+','A-'],d)+
  selector('Para o suporte B (2 pilhas):','dest',['B+','B-'],d)+'</div>';
 }
 if(kind==='motor'){
  return '<p>Reconecte os dois fios do Motor A às saídas da ponte H:</p><div class="pet-task-row">'+
  selector('Fio positivo do Motor A:','positive',['A+','B+'],d)+
  selector('Fio negativo do Motor A:','negative',['A-','B-'],d)+'</div>';
 }
 if(kind==='voltage'){
  const voltage=Number.isFinite(Number(v.voltage))?Number(v.voltage):9;
  return '<label for="petVoltage">Saída do LM2596: <b id="petVoltageValue">'+voltage+' V</b></label>'+
  '<input id="petVoltage" type="range" min="3" max="9" step="1" value="'+voltage+'">'+
  '<p>Gire o ajuste simulado do regulador até a tensão indicada no esquema.</p>';
 }
 if(kind==='ground'){
  return '<p>Complete a referência elétrica compartilhada:</p><div class="pet-task-row">'+
  selector('Origem do fio:','source',['Ponte H GND','Ponte H +'],d)+
  selector('Destino do fio:','dest',['ESP32 GND','ESP32 VIN'],d)+'</div>';
 }
 return '<p>Confira o diagrama: IN1→D27 · IN2→D26 · IN3→D32 · IN4→D18.</p>'+
 selector('Pino do ESP32 para a entrada IN4:','pin',['D19','D26','D27','D18'],d);
}
function clue(data,d){
 if(!d.hints)return '';
 return '<div class="pet-clue" role="status"><strong>💡 Pista '+Math.min(2,d.hints)+'</strong>'+
  '<p>'+esc(data.hints[Math.min(2,d.hints)-1])+'</p></div>';
}
function output(d){
 if(!d.testResult)return '';
 return '<div class="pet-test-output '+(d.testResult.ok?'ok':'')+'" role="status"><strong>'+
  esc(d.testResult.title)+'</strong><p>'+esc(d.testResult.text)+'</p></div>';
}
function renderRepair(){
 if(!active||active.kind!=='repair')return;
 const item=investigations[active.index],d=get(),isWiring=isWiringChallenge(active.index);
 $('diagnosticTitle').textContent=item.title;
 $('diagnosticQuestion').textContent=item.prompt;
 $('diagnosticFeedback').textContent=d.message||'Observe o circuito, faça o teste inicial e experimente uma correção.';
 const observation=d.selected&&parts[d.selected]?'<div class="pet-observation"><strong>Você observou: '+esc(parts[d.selected][0])+'</strong>'+
 '<p>'+esc(parts[d.selected][2])+'</p></div>':'';
 let task='';
 if(!d.fixed){
  task='<div class="pet-task"><h3>'+(d.baseline?'2. Experimente e teste novamente':'1. Teste o circuito antes de alterar')+'</h3>'+
  (d.baseline?'<p>O teste mostrou o problema. '+(isWiring?'Arraste a ponta destacada para um terminal ou toque na ponta e depois no pino.':'Altere o ajuste e observe o resultado.')+'</p>'+
   (isWiring?'':operationControl(active.index,d)):'<p>Verifique como o circuito se comporta com a falha. Depois você poderá alterar seus componentes.</p>')+
  '<button class="button primary block" data-test-circuit="1" type="button">'+
  (d.baseline?'Testar o circuito depois da mudança →':'Testar o circuito agora →')+'</button></div>';
 }
 const success=d.fixed?'<div class="pet-success" role="status"><strong>✓ Circuito funcionando!</strong>'+
  '<p>'+esc(item.after)+'</p><button class="button primary block" data-finish="1" type="button">'+
  'Continuar entrega →</button></div>':'';
 const host=$('petgameWorkbenchHost');
 if(host){
  host.hidden=!isWiring;
  if(isWiring){
   const existing=host.querySelector('iframe');
   const index=String(active.index);
   if(!existing||existing.dataset.challenge!==index){
    host.replaceChildren();
    const frame=document.createElement('iframe');
    frame.id='petgameWorkbenchFrame';frame.dataset.challenge=index;
    frame.title='Bancada original TinkerPET com todos os componentes e uma ligação para corrigir';
    frame.loading='eager';frame.allow='fullscreen';
    frame.src='petgame-workbench.html?challenge='+encodeURIComponent(index)+
      (d.values?.wireSolved?'&solved=1':'')+'&v=2';
    host.append(frame);
   }
   host.dataset.locked=String(!d.baseline&&!d.fixed);
  }else host.replaceChildren();
 }
 $('diagnosticChoices').innerHTML=(isWiring?'':circuitVisual(active.index,d))+
  '<div class="pet-instruction">'+(isWiring?'Encontre o fio solto ou trocado na bancada original do TinkerPET.':'Observe as peças para compreender o circuito')+'</div>'+
  (isWiring?'':'<div class="pet-parts">'+item.parts.map(k=>componentCard(k,d)).join('')+'</div>')+
  observation+task+output(d)+clue(item,d)+success+
  (!d.fixed?'<button class="pet-hint-button" data-hint="1" type="button">💡 '+
   (d.hints>=1?'Mais uma pista':'Preciso de uma pista')+'</button>':'');
// O iframe permanece montado durante as pistas e testes para não perder os fios.
}
function renderExperiment(){
 if(!active||active.kind!=='question')return;
 const data=experiments[active.index],d=get(),[a,b]=d.motors;
 $('challengeTitle').textContent=data.title;
 $('questionEyebrow').textContent='MISSÃO · EXPERIMENTO COM MOTORES';
 $('questionText').textContent=data.prompt;
 $('questionResponse').textContent=d.message||'Ajuste os controles, observe as rodas e teste o movimento.';
 const wheel=(id,v)=>'<label class="pet-motor-experiment"><span><strong>Motor '+id+'</strong><b id="petMotorValue'+id+'">'+v+'%</b></span>'+
 '<input type="range" min="0" max="100" step="25" value="'+v+'" data-experiment-motor="'+id+'"><small>Parado · Lento · Rápido</small></label>';
 $('answers').innerHTML='<div class="pet-experiment-visual"><div class="pet-mini-car">'+
  '<span class="pet-wheel" id="petWheelA"></span><span class="pet-mini-body">ESP32<br>↟</span>'+
  '<span class="pet-wheel" id="petWheelB"></span></div><p>Observe os dois motores</p></div>'+
  '<div class="pet-motor-pair">'+wheel('A',a)+wheel('B',b)+'</div>'+
  (d.fixed?'<div class="pet-success"><strong>✓ Você descobriu!</strong><p>'+esc(data.result)+'</p>'+
   '<button class="button primary block" data-finish="1" type="button">Continuar entrega →</button></div>':
   '<button class="button primary block" data-try="1" type="button">Testar movimento →</button>')+
  (d.hints?'<div class="pet-clue"><strong>💡 Pista</strong><p>'+esc(data.hint)+'</p></div>':'')+
  (!d.fixed?'<button class="pet-hint-button" data-hint="1" type="button">💡 Ver pista</button>':'');
 paintWheels();
}
function paintWheels(){
 if(!active||active.kind!=='question')return;
 const v=get().motors;
 ['A','B'].forEach((key,i)=>{
  const wheel=$('petWheel'+key),readout=$('petMotorValue'+key);
  if(wheel){wheel.style.setProperty('--spin',v[i]>0?(2.7-v[i]/50)+'s':'0s');wheel.classList.toggle('moving',v[i]>0)}
  if(readout)readout.textContent=v[i]+'%';
 });
}
function handleClick(e){
 if(!active)return false;
 const d=get();
 const button=e.target.closest('button');if(!button)return false;
 if(button.dataset.inspect){
  const key=button.dataset.inspect;if(!parts[key])return true;
  if(!d.inspected.includes(key))d.inspected.push(key);
  d.selected=key;d.message='Observe o componente e pense em sua função no circuito.';
  renderRepair();return true;
 }
 if(button.dataset.hint){
  d.hints=Math.min(2,d.hints+1);
  active.kind==='repair'?renderRepair():renderExperiment();return true;
 }
 if(button.dataset.switch&&active.kind==='repair'&&d.baseline&&!d.fixed){
  d.values.switchOn=!d.values.switchOn;
  d.testResult=null;d.message='Você mudou a posição da gangorra. Teste o circuito para ver a diferença.';
  renderRepair();return true;
 }
 if(button.dataset.testCircuit&&active.kind==='repair'){
  const item=investigations[active.index],operation=operations[active.index];
  d.tests++;
  if(!d.baseline){
   d.baseline=true;
   d.testResult={ok:false,title:'O teste encontrou um problema',text:item.before};
   d.message='Agora investigue uma conexão e faça outro teste para conferir sua hipótese.';
  }else if(operation.check(d.values)){
   d.fixed=true;
   d.testResult={ok:true,title:'O novo teste funcionou!',text:operation.effect};
   d.message='Compare o antes e o depois: a alteração resolveu a falha.';
  }else{
   d.testResult={ok:false,title:'Ainda não funcionou',text:isWiringChallenge(active.index)?'O fio ainda não está no terminal que resolve o defeito. Observe as ligações e experimente novamente.':operation.fail};
   d.message='Confira o que a medição mostrou e continue experimentando.';
  }
  renderRepair();return true;
 }
 if(button.dataset.try&&active.kind==='question'){
  const ex=experiments[active.index],a=d.motors[0],b=d.motors[1];
  if(ex.works(a,b)){d.fixed=true;d.message=ex.result}
  else d.message='Observe as rodas: '+(a===0&&b===0?'ambos os motores estão parados.':'os motores estão girando. Experimente outra combinação para chegar ao movimento pedido.');
  renderExperiment();return true;
 }
 if(button.dataset.finish&&d.fixed){
  const finish=active.finished;active=null;finish();return true;
 }
 return false;
}
function isWiringChallenge(index){return [1,2,4,5].includes(index)}
function handlePointerDown(){}
function handlePointerMove(){}
function handlePointerUp(){}
window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin||event.data?.type!=='petgame-workbench-status')return;
 if(!active||active.kind!=='repair'||event.data.challenge!==active.index)return;
 const frame=$('petgameWorkbenchHost')?.querySelector('iframe');
 if(!frame||event.source!==frame.contentWindow)return;
 const d=get(),before=!!d.values.wireSolved,solved=event.data.solved===true;
 d.values.wireSolved=solved;
 d.values.wireDestination=typeof event.data.chosenPort==='string'?event.data.chosenPort:'';
 if(before!==solved&&!d.fixed){
  d.message=solved?'A ligação foi restaurada. Faça o novo teste para confirmar.':
   'Você mexeu na fiação. Teste novamente para observar o resultado.';
  const feedback=$('diagnosticFeedback');if(feedback)feedback.textContent=d.message;
  d.testResult=null;
 }
});
function handleInput(e){
 if(!active)return false;
 const d=get();
 if(e.target.id==='petVoltage'&&active.kind==='repair'){
  d.values.voltage=Number(e.target.value);d.testResult=null;
  const output=$('petVoltageValue');if(output)output.textContent=e.target.value+' V';
  return true;
 }
 if(e.target.dataset.setting&&active.kind==='repair'){
  const key=e.target.dataset.setting;d.values[key]=e.target.value;
  d.testResult=null;return true;
 }
 if(e.target.dataset.experimentMotor&&active.kind==='question'){
  d.motors[e.target.dataset.experimentMotor==='A'?0:1]=Number(e.target.value);
  paintWheels();return true;
 }
 return false;
}
window.PetGameDiscovery={begin,handleClick,handleInput,handlePointerDown,handlePointerMove,handlePointerUp,investigations,experiments,operations,parts};
})();
