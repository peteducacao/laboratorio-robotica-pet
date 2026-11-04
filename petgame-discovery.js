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
 {title:'De onde vem a energia?',prompt:'Na fábrica, as pilhas foram trocadas. Falta completar a ligação entre os suportes.',parts:['pack','battery','bridge'],target:'pack',action:'Unir A+ ao B− (ligação em série)',before:'O suporte de 4 pilhas e o de 2 precisam formar um conjunto de 6 pilhas em série.',after:'A ligação em série conecta o positivo do suporte A ao negativo do suporte B. O conjunto alimenta a ponte H, passando pela gangorra.',hints:['As pilhas do ESP32 e dos motores usam fontes diferentes.','Os suportes de 4 e 2 pilhas ficam juntos na alimentação dos motores.']},
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
let active=null;
function get(){return active?.state.discovery}
function ensure(state,preserve){
 if(!preserve||!state.discovery||!Array.isArray(state.discovery.inspected)){
  state.discovery={inspected:[],selected:null,hints:0,motors:[0,0],fixed:false,message:''};
 }
 return state.discovery;
}
function begin(state,kind,index,finished,preserve=false){
 const table=kind==='repair'?investigations:experiments;
 if(!table[index])throw Error('Investigação não encontrada: '+kind+' '+index);
 active={state,kind,index,finished};ensure(state,preserve);
 if(kind==='repair')renderRepair();else renderExperiment();
}
function clue(data,d){
 if(!d.hints)return '';
 const amount=Math.min(d.hints,2);
 return amount?'<div class="pet-clue" role="status"><strong>💡 Pista '+amount+'</strong><p>'+esc(data.hints[amount-1])+'</p></div>':'';
}
function componentCard(key,d){
 const [name,file]=parts[key],isSelected=d.selected===key;
 return '<button type="button" class="pet-part '+(isSelected?'active':'')+'" data-inspect="'+key+'" aria-pressed="'+isSelected+'">'+
  '<img src="assets/component-preview/'+file+'" alt="" loading="eager"><strong>'+esc(name)+'</strong>'+
  (d.inspected.includes(key)?'<small>Observado ✓</small>':'<small>Toque para investigar</small>')+'</button>';
}
function circuitVisual(data,d){
 const powered=d.fixed?' powered':'';
 const labels=['FONTE','CONTROLE','MOTORES'];
 return '<div class="pet-circuit'+powered+'" role="img" aria-label="Esquema simplificado da alimentação e controle do carrinho">'+
 '<svg viewBox="0 0 520 108" aria-hidden="true"><defs><linearGradient id="petFlow"><stop stop-color="#08b4a8"/><stop offset="1" stop-color="#a2f25a"/></linearGradient></defs>'+
 '<path class="circuit-wire" d="M100 54H209M309 54H415"/><rect x="8" y="15" width="96" height="78" rx="12" class="circuit-node"/>'+
 '<rect x="208" y="15" width="104" height="78" rx="12" class="circuit-node"/><rect x="413" y="15" width="99" height="78" rx="12" class="circuit-node"/>'+
 '<text x="56" y="51" text-anchor="middle">PILHAS</text><text x="56" y="66" text-anchor="middle">AA</text>'+
 '<text x="260" y="51" text-anchor="middle">PONTE H</text><text x="260" y="66" text-anchor="middle">CONTROLE</text>'+
 '<text x="462" y="51" text-anchor="middle">MOTORES</text><text x="462" y="66" text-anchor="middle">A + B</text>'+
 '<circle cx="157" cy="54" r="6" class="power-led"/><circle cx="363" cy="54" r="6" class="power-led"/></svg>'+
 '<div class="pet-circuit-status"><span class="power-indicator"></span>'+ (d.fixed?'Circuito restabelecido!':'Circuito em investigação')+'</div></div>';
}
function renderRepair(){
 if(!active||active.kind!=='repair')return;
 const data=investigations[active.index],d=get();
 $('diagnosticTitle').textContent=data.title;
 $('diagnosticQuestion').textContent=data.prompt;
 $('diagnosticFeedback').textContent=d.message||'Observe os componentes e investigue o que cada um faz.';
 const selection=d.selected&&parts[d.selected];
 const observed=selection?'<div class="pet-observation"><strong>O que você encontrou?</strong><p>'+esc(parts[d.selected][2])+'</p>'+
 (d.selected===data.target?'<p>'+esc(data.before)+'</p>':'<p>Esse componente tem sua função. Você pode continuar examinando os demais.</p>')+'</div>':'';
 let action='';
 if(d.selected===data.target&&!d.fixed){
  if(data.kind==='voltage'){
   const voltage=Number.isFinite(d.voltage)?d.voltage:9;
   action='<div class="pet-repair-action"><label for="petVoltage">Simule a regulagem do LM2596: <b id="petVoltageValue">'+voltage+' V</b></label>'+
   '<input id="petVoltage" type="range" min="3" max="9" step="1" value="'+voltage+'"><p class="pet-secondary">Ajuste a saída antes de conectar ao VIN.</p>'+
   '<button class="button primary block" data-repair="1" type="button">Testar a saída</button></div>';
  }else{
   action='<div class="pet-repair-action"><p class="pet-secondary">Agora que você identificou a peça, experimente a ação:</p>'+
   '<button class="button primary block" data-repair="1" type="button">'+esc(data.action)+' →</button></div>';
  }
 }
 const success=d.fixed?'<div class="pet-success" role="status"><strong>✓ Descoberta realizada!</strong><p>'+esc(data.after)+'</p>'+
 '<button class="button primary block" data-finish="1" type="button">Continuar entrega →</button></div>':'';
 $('diagnosticChoices').innerHTML=circuitVisual(data,d)+
 '<div class="pet-instruction">Toque nas peças para observar antes de reparar</div>'+
 '<div class="pet-parts">'+data.parts.map(k=>componentCard(k,d)).join('')+'</div>'+
 observed+action+success+clue(data,d)+
 (!d.fixed?'<button class="pet-hint-button" data-hint="1" type="button">💡 '+(d.hints>0?'Outra pista':'Preciso de uma pista')+'</button>':'');
}
function renderExperiment(){
 if(!active||active.kind!=='question')return;
 const data=experiments[active.index],d=get(),[a,b]=d.motors;
 $('challengeTitle').textContent=data.title;
 $('questionEyebrow').textContent='MISSÃO · EXPERIMENTO COM MOTORES';
 $('questionText').textContent=data.prompt;
 $('questionResponse').textContent=d.message||'Arraste os controles dos motores, observe o movimento e teste sua ideia.';
 const wheel=(id,v)=>'<label class="pet-motor-experiment"><span><strong>Motor '+id+'</strong><b id="petMotorValue'+id+'">'+v+'%</b></span>'+
 '<input type="range" min="0" max="100" step="25" value="'+v+'" data-experiment-motor="'+id+'"><small>Parado · Lento · Rápido</small></label>';
 $('answers').innerHTML='<div class="pet-experiment-visual"><div class="pet-mini-car"><span class="pet-wheel" id="petWheelA"></span>'+
 '<span class="pet-mini-body">ESP32<br>↟</span><span class="pet-wheel" id="petWheelB"></span></div><p>Observe os dois motores</p></div>'+
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
 const motors=get().motors;
 ['A','B'].forEach((k,i)=>{
  const w=$('petWheel'+k),value=$('petMotorValue'+k);
  if(w){w.style.setProperty('--spin',motors[i]>0?(2.7-motors[i]/50)+'s':'0s');w.classList.toggle('moving',motors[i]>0)}
  if(value)value.textContent=motors[i]+'%';
 });
}
function handleClick(e){
 if(!active)return false;
 const button=e.target.closest('button');
 if(!button)return false;
 const d=get();
 if(button.dataset.inspect){
  const key=button.dataset.inspect;if(!parts[key])return true;
  if(!d.inspected.includes(key))d.inspected.push(key);
  d.selected=key;d.message='Você está investigando. Continue observando as peças.';renderRepair();return true
 }
 if(button.dataset.hint){
  d.hints=Math.min(2,d.hints+1);
  if(active.kind==='repair'&&d.hints===2){d.selected=investigations[active.index].target}
  active.kind==='repair'?renderRepair():renderExperiment();return true
 }
 if(button.dataset.repair){
  const item=investigations[active.index];
  if(item.kind==='voltage'&&Number(d.voltage??9)!==5){
   d.message='Ainda não está em 5 V. Mova o controle até 5 V e teste novamente.';renderRepair();return true
  }
  d.fixed=true;d.message='Agora o circuito funciona. Observe o que mudou.';renderRepair();return true
 }
 if(button.dataset.try){
  const ex=experiments[active.index],a=d.motors[0],b=d.motors[1];
  if(ex.works(a,b)){d.fixed=true;d.message=ex.result}else d.message='Observe o movimento: '+(a===0&&b===0?'os dois motores estão parados.':'experimente velocidades diferentes e veja o que acontece.');
  renderExperiment();return true
 }
 if(button.dataset.finish&&d.fixed){const finish=active.finished;active=null;finish();return true}
 return false
}
function handleInput(e){
 if(!active)return false;
 if(e.target.id==='petVoltage'){get().voltage=Number(e.target.value);const out=$('petVoltageValue');if(out)out.textContent=e.target.value+' V';return true}
 if(e.target.dataset.experimentMotor){const i=e.target.dataset.experimentMotor==='A'?0:1;get().motors[i]=Number(e.target.value);paintWheels();return true}
 return false
}
window.PetGameDiscovery={begin,handleClick,handleInput,investigations,experiments,parts};
})();
