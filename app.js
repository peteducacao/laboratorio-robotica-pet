'use strict';
(() => {
const ROOT='https://raw.githubusercontent.com/gabrieljsantos/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/main/assets/images/componentes/';
const TYPES=[
 {kind:'esp',name:'ESP32 DevKit V1',img:'assets/esp32-devkit-v1-30p.svg?v=29',ids:['esp'],pins:[["VIN","VIN"],["GND","GND"],["D13","D13"],["D12","D12"],["D14","D14"],["D27","D27"],["D26","D26"],["D25","D25"],["D33","D33"],["D32","D32"],["D35","D35"],["D34","D34"],["VN","VN"],["VP","VP"],["EN","EN"],["3V3","3V3"],["GND2","GND"],["D15","D15"],["D2","D2"],["D4","D4"],["RX2","RX2"],["TX2","TX2"],["D5","D5"],["D18","D18"],["D19","D19"],["D21","D21"],["RX0","RX0"],["TX0","TX0"],["D22","D22"],["D23","D23"]],info:'Placa de 30 pinos com USB à esquerda e nomes em cada contato. Os dois GND são equivalentes.',tip:'Neste carrinho: VIN recebe 5 V, GND comum, D27→IN1, D26→IN2, D32→IN3 e D18→IN4.'},
 {kind:'driver',name:'Ponte H MX1508',img:'assets/mx1508-desenhado.svg',ids:['drv'],pins:[['VCC','+ motores'],['GND','GND motores'],['IN1','IN1'],['IN2','IN2'],['IN3','IN3'],['IN4','IN4'],['OUT1','A • 1'],['OUT2','A • 2'],['OUT3','B • 1'],['OUT4','B • 2']],info:'A ponte H recebe os sinais do ESP32 e controla os dois motores. Cada motor utiliza um par de saídas.',tip:'As saídas A e B têm dois bornes cada; a numeração 1 e 2 aqui é didática.'},
 {kind:'buck',name:'Regulador LM2596',img:'assets/lm2596-desenhado.svg',ids:['lm'],pins:[['INP','IN +'],['INN','IN −'],['OUTP','OUT +'],['OUTN','OUT −']],info:'Regulador de tensão. Neste projeto, a saída para o ESP32 deve ser ajustada para 5,0 V.',tip:'Na montagem real, um responsável deve medir 5 V com multímetro antes de conectar VIN.'},
 {kind:'battery',name:'Bateria 9 V',img:'assets/bateria-9v-desenhada.svg',ids:['b1'],pins:[['POS','+'],['NEG','−']],info:'Uma bateria de 9 V alimenta o regulador LM2596 e o ESP32.',tip:'O LM2596 deve reduzir a tensão para 5,0 V antes de alimentar o VIN do ESP32.'},
 {kind:'batteryPack',name:'Suporte de 6 pilhas AA',img:'assets/suporte-6-pilhas.svg',ids:['b2'],pins:[['POS','+'],['NEG','−']],info:'Porta-pilhas com seis células AA: 9 V nominais se forem seis pilhas de 1,5 V. Alimenta a ponte H, não o ESP32.',tip:'Com seis pilhas AA de 1,5 V, são 9 V nominais; seis NiMH de 1,2 V dão 7,2 V. Verifique a tensão nominal dos motores: 9 V pode exceder a especificação de motores de 3–6 V.'},
 {kind:'switch',name:'Chave gangorra',img:'assets/gangorra-desenhada.svg',ids:['s1','s2'],pins:[['IN','IN +'],['OUT','SAÍDA'],['LEDG','LED −']],info:'Gangorra iluminada de 3 terminais: entrada positiva, saída comutada e negativo opcional do LED. A tecla bascula ao ligar.',tip:'O terceiro contato acende o indicador quando ligado ao negativo da bateria correspondente. Confirme o esquema do seu modelo físico antes de montar.'},
 {kind:'motor',name:'Motor DC',img:'assets/motor-frontal.svg',ids:['ml','mr'],pins:[['A','+'],['B','−']],info:'Motor DC com caixa de redução amarela, eixo lateral para a roda e dois contatos no motor metálico. Na simulação, a ponte H controla o sentido de giro.',tip:'Os dois contatos ficam ao lado do motor metálico, identificados em vermelho e preto. O eixo de saída fica na caixa amarela.'}
];
const byKind=Object.fromEntries(TYPES.map(p=>[p.kind,p]));
const PART_LAYOUTS={
 esp:{w:790,h:365,pins:{"VIN":[14.4,18.5],"GND":[19.43,18.5],"D13":[24.46,18.5],"D12":[29.49,18.5],"D14":[34.52,18.5],"D27":[39.55,18.5],"D26":[44.58,18.5],"D25":[49.61,18.5],"D33":[54.64,18.5],"D32":[59.67,18.5],"D35":[64.7,18.5],"D34":[69.73,18.5],"VN":[74.76,18.5],"VP":[79.79,18.5],"EN":[84.82,18.5],"3V3":[14.4,85.7],"GND2":[19.43,85.7],"D15":[24.46,85.7],"D2":[29.49,85.7],"D4":[34.52,85.7],"RX2":[39.55,85.7],"TX2":[44.58,85.7],"D5":[49.61,85.7],"D18":[54.64,85.7],"D19":[59.67,85.7],"D21":[64.7,85.7],"RX0":[69.73,85.7],"TX0":[74.76,85.7],"D22":[79.79,85.7],"D23":[84.82,85.7]}},
 driver:{w:250,h:317,pins:{VCC:[24.3,84.5],GND:[34.7,84.5],IN1:[45,84.5],IN2:[55.3,84.5],IN3:[65.7,84.5],IN4:[76,84.5],OUT1:[25.3,12.9],OUT2:[40.7,12.9],OUT3:[58.7,12.9],OUT4:[73.7,12.9]}},
 buck:{w:288,h:180,pins:{INP:[14.72,35.1],INN:[14.72,63.1],OUTP:[85,35.1],OUTN:[85,63.1]}},
 battery:{w:170,h:228,pins:{POS:[30.6,4.7],NEG:[68.6,6.2]}},
 batteryPack:{w:265,h:255,pins:{POS:[16.1,7.7],NEG:[84.7,7.7]}},
 switch:{w:205,h:165,pins:{IN:[25,89.8],OUT:[50,89.8],LEDG:[75,89.8]}},
 motor:{w:190,h:405,pins:{A:[18,85],B:[18,80]}},
 motorSide:{w:340,h:170,pins:{A:[96,42],B:[96,63]}}
};
const byId=Object.fromEntries(TYPES.flatMap(p=>p.ids.map(id=>[id,p])));
const EXPECTED=[
 ['b1.POS','s1.IN'],['s1.OUT','lm.INP'],['b1.NEG','lm.INN'],['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND'],
 ['b2.POS','s2.IN'],['s2.OUT','drv.VCC'],['b2.NEG','drv.GND'],['esp.GND','drv.GND'],
 ['esp.D27','drv.IN1'],['esp.D26','drv.IN2'],['esp.D32','drv.IN3'],['esp.D18','drv.IN4'],
 ['drv.OUT1','ml.A'],['drv.OUT2','ml.B'],['drv.OUT3','mr.A'],['drv.OUT4','mr.B']
];
const key=(a,b)=>[a,b].sort().join('|');
const canonicalPort=p=>p==='esp.GND2'?'esp.GND':p;
const electricalKey=(a,b)=>key(canonicalPort(a),canonicalPort(b));
const OPTIONAL=[['b1.NEG','s1.LEDG'],['b2.NEG','s2.LEDG']];
const REQUIRED=new Set(EXPECTED.map(([a,b])=>electricalKey(a,b)));
const valid=new Set([...EXPECTED,...OPTIONAL].map(([a,b])=>electricalKey(a,b)));
const allPorts=new Set(TYPES.flatMap(t=>t.ids.flatMap(id=>t.pins.map(p=>id+'.'+p[0]))));
const Q=id=>document.getElementById(id);
// Coordenadas da bancada são livres: a câmera não impõe bordas às peças ou fios.
const WORLD={w:1900,h:1450};
const COLORS=['#ed654d','#316fc0','#1f434c','#32a47b','#e5a13d','#a378c8'];
let state={parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:COLORS[0],selected:null,startPort:null,inspector:'parts',completed:false,bends:[],selectedWire:null};
let zoom=1,panX=0,panY=0,gesture=null,history=[],future=[],toastTimer=0,previewPoint=null,previewSnapPort=null,drawPending=false;
let spaceHeld=false;
let recentTap=null,doubleTapRestore=null,copiedKind=null,simulationRunning=false;
let wireAlignment=null;
let wireTipActive=false,pendingAlignment=null;
const activeTouches=new Map();
let pinch=null;
let gestureBlockedUntil=0;
const car={x:150,y:447,a:0,finished:false};
const keys={up:false,down:false,left:false,right:false};
let lastFrame=0;
const $port=id=>[...Q('partsLayer').querySelectorAll('[data-port]')].find(el=>el.dataset.port===id);
const exists=id=>state.parts.some(p=>p.id===id);
const byPart=id=>state.parts.find(p=>p.id===id);
function safeRestore(){
 try{
  const s=JSON.parse(localStorage.getItem('tinkerpet-v2')||'null');
  if(!s||!Array.isArray(s.parts)||!Array.isArray(s.wires))return;
  const names=new Set();
  state.parts=s.parts.filter(p=>p&&byId[p.id]&&!names.has(p.id)&&names.add(p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({id:p.id,kind:byId[p.id].kind,x:p.x,y:p.y,view:byId[p.id].kind==='motor'&&p.view==='side'?'side':'front'}));
  state.wires=s.wires.filter(w=>w&&allPorts.has(w.a)&&allPorts.has(w.b)&&w.a!==w.b&&exists(w.a.split('.')[0])&&exists(w.b.split('.')[0])).slice(0,80).map(w=>({a:w.a,b:w.b,color:COLORS.includes(w.color)?w.color:COLORS[0],via:Array.isArray(w.via)?w.via.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,48).map(p=>({x:p.x,y:p.y})):[],manual:w.manual===true}));
  if(Number.isFinite(s.voltage))state.voltage=limit(s.voltage,3,6);
  if(s.switches)state.switches={s1:!!s.switches.s1,s2:!!s.switches.s2};
  if(COLORS.includes(s.wireColor))state.wireColor=s.wireColor;
 }catch(err){console.warn('Progresso indisponível',err);}
}
function persist(){
 try{localStorage.setItem('tinkerpet-v2',JSON.stringify({parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches,wireColor:state.wireColor}));Q('savedIndicator').textContent='● Salvo automaticamente';}catch(e){Q('savedIndicator').textContent='● Não salvo';}
}
// Cada curva e cada origem de jumper entram na linha do tempo de ações.
function historyState(){return JSON.stringify({
 parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches,
 startPort:state.startPort,bends:state.bends
});}
function updateHistoryButtons(){
 const undoBtn=Q('undoBtn'),redoBtn=Q('redoBtn'),delBtn=Q('deleteBtn');
 if(undoBtn)undoBtn.disabled=history.length===0;
 if(redoBtn)redoBtn.disabled=future.length===0;
 if(delBtn){
  const wireSelected=Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire];
  delBtn.disabled=!byPart(state.selected)&&!wireSelected;
  delBtn.title=wireSelected?'Excluir fio selecionado':byPart(state.selected)?'Excluir '+partName(state.selected):'Selecione uma peça ou fio para excluir';
  delBtn.setAttribute('aria-label',delBtn.title);
 }
}
function snapshot(){
 history.push(historyState());if(history.length>45)history.shift();
 future=[];updateHistoryButtons();
}
function restoreHistory(s){
 const saved=JSON.parse(s);
 Object.assign(state,saved,{
  startPort:saved.startPort||null,bends:Array.isArray(saved.bends)?saved.bends:[],
  selected:null,selectedWire:null,completed:false
 });
 wireTipActive=!!state.startPort;
 previewPoint=null;previewSnapPort=null;pendingAlignment=null;gesture=null;
 renderAll();updateHistoryButtons();
}
function undo(){
 if(!history.length)return;
 future.push(historyState());
 restoreHistory(history.pop());
 message(state.startPort?'Voltou uma etapa do jumper.':'Última ação desfeita.');
}
function redo(){
 if(!future.length)return;
 history.push(historyState());
 restoreHistory(future.pop());
 message(state.startPort?'Etapa do jumper refeita.':'Última ação refeita.');
}
const limit=(x,min,max)=>Math.max(min,Math.min(max,x));
const partName=id=>{const base=byId[id];return base?base.name+(base.ids.length>1?' '+(base.ids.indexOf(id)+1):''):id;};
const portName=id=>{const [part,code]=id.split('.');const t=byId[part];const p=t&&t.pins.find(x=>x[0]===code);return partName(part)+' · '+(p?p[1]:code);};
function imageUrl(p){return p.img.startsWith('assets/')?p.img:ROOT+p.img;}
function motorImage(p){return p.view==='side'?'assets/motor-lateral.svg':'assets/motor-frontal.svg';}
function partLayout(p){return p.kind==='motor'&&p.view==='side'?PART_LAYOUTS.motorSide:PART_LAYOUTS[p.kind];}
function message(msg,toast=false){Q('statusText').textContent=msg;if(toast){const el=Q('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}}
function countGood(){return new Set(state.wires.filter(w=>REQUIRED.has(electricalKey(w.a,w.b))).map(w=>electricalKey(w.a,w.b))).size;}
function mistakes(){return state.wires.filter(w=>!valid.has(electricalKey(w.a,w.b)));}
function missing(){const wired=new Set(state.wires.map(w=>electricalKey(w.a,w.b)));return EXPECTED.filter(([a,b])=>!wired.has(electricalKey(a,b)));}
function ready(){return state.parts.length===9&&missing().length===0&&mistakes().length===0&&Math.abs(state.voltage-5)<.01&&state.switches.s1&&state.switches.s2;}
// Modelo pedagógico: cada circuito acende e funciona somente quando recebe
// alimentação e sinais por um caminho conectado. Não é SPICE nem execução do ESP32.
function powerStatus(){
 const has=(a,b)=>state.wires.some(w=>electricalKey(w.a,w.b)===electricalKey(a,b));
 const source9=exists('b1')&&exists('s1')&&exists('lm')&&state.switches.s1
  &&has('b1.POS','s1.IN')&&has('s1.OUT','lm.INP')&&has('b1.NEG','lm.INN');
 const esp=source9&&Math.abs(state.voltage-5)<.01&&exists('esp')
  &&has('lm.OUTP','esp.VIN')&&has('lm.OUTN','esp.GND');
 const pack6=exists('b2')&&exists('s2')&&exists('drv')&&state.switches.s2
  &&has('b2.POS','s2.IN')&&has('s2.OUT','drv.VCC')&&has('b2.NEG','drv.GND');
 const common=esp&&has('esp.GND','drv.GND');
 const motorA=pack6&&common&&exists('ml')
  &&has('esp.D27','drv.IN1')&&has('esp.D26','drv.IN2')
  &&has('drv.OUT1','ml.A')&&has('drv.OUT2','ml.B');
 const motorB=pack6&&common&&exists('mr')
  &&has('esp.D32','drv.IN3')&&has('esp.D18','drv.IN4')
  &&has('drv.OUT3','mr.A')&&has('drv.OUT4','mr.B');
 return {buck:source9,esp,driver:pack6,common,motors:{ml:motorA,mr:motorB}};
}
function updateLiveSimulation(){
 const live=powerStatus(),enabled=simulationRunning;
 Q('buildPanel').classList.toggle('simulation-active',enabled);
 const sim=Q('checkBtn');sim.classList.toggle('is-running',enabled);
 sim.setAttribute('aria-pressed',String(enabled));
 Q('simLabel').textContent=enabled?'Parar simulação':'Iniciar simulação';
 Q('simIcon').textContent=enabled?'■':'▶';
 Q('openTrackBtn').hidden=!(enabled&&ready());
 const status=Q('liveCircuitStatus');
 if(status){
  status.hidden=!enabled;
  const active=[live.buck?'LM2596 energizado':null,live.esp?'ESP32 ligado · Wi-Fi simulado':null,
   live.driver?'Ponte H alimentada':null,...Object.entries(live.motors).filter(([,on])=>on).map(([id])=>id==='ml'?'Motor esquerdo girando':'Motor direito girando')].filter(Boolean);
  status.textContent=enabled?(active.length?active.join('  •  '):'Simulação ativa: conecte a alimentação para observar os componentes.'):'';
 }
 for(const card of Q('partsLayer').querySelectorAll('.part')){
  const id=card.dataset.part;
  const on=id==='esp'?live.esp:id==='lm'?live.buck:id==='drv'?live.driver:
   id==='ml'||id==='mr'?live.motors[id]:false;
  card.classList.toggle('powered',enabled&&!!on);
  if(id==='ml'||id==='mr')card.classList.toggle('running',enabled&&!!on);
  if(id==='s1'||id==='s2'){
   const source=id==='s1'?live.buck:live.driver;
   const negative=id==='s1'?'b1.NEG':'b2.NEG';
   const indicator=enabled&&source&&state.wires.some(w=>electricalKey(w.a,w.b)===electricalKey(negative,id+'.LEDG'));
   card.dataset.indicator=indicator?'on':'off';
  }
 }
}
function toggleSimulation(){
 simulationRunning=!simulationRunning;
 if(!simulationRunning&&!Q('playPanel').hidden)switchView(false);
 updateLiveSimulation();
 if(simulationRunning){
  message('Simulação ligada: observe na bancada o que está alimentado; não é necessário concluir todos os fios.',true);
 }else{
  message('Simulação desligada. LEDs e motores pararam.',true);
 }
}
function renderCatalog(){
 const query=Q('componentSearch').value.trim().toLowerCase();
 Q('catalog').replaceChildren();
 TYPES.filter(t=>t.name.toLowerCase().includes(query)).forEach(t=>{
  const n=t.ids.filter(exists).length,left=t.ids.length-n;
  const btn=document.createElement('button');btn.type='button';btn.className='catalog-card'+(left===0?' unavailable':'');btn.disabled=left===0;btn.dataset.kind=t.kind;btn.setAttribute('aria-label','Adicionar '+t.name+', '+left+' disponível(is)');
  const img=document.createElement('img');img.src=imageUrl(t);img.alt='';img.loading='lazy';img.draggable=false;
  const text=document.createElement('span');text.className='catalog-card-text';
  const title=document.createElement('strong');title.textContent=t.name;
  const small=document.createElement('small');small.textContent=left?left+' disponível(is)':'Todas na bancada';
  text.append(title,small);
  const plus=document.createElement('span');plus.className='catalog-plus';plus.textContent=left?'+':'✓';btn.append(img,text,plus);
  Q('catalog').appendChild(btn);
 });
}
function renderParts(){
 const layer=Q('partsLayer');layer.replaceChildren();
 for(const p of state.parts){
  const t=byKind[p.kind],layout=partLayout(p),card=document.createElement('article');
  if(p.kind==='motor')card.dataset.motorView=p.view==='side'?'side':'front';
  if(p.kind==='esp')card.dataset.boardModel='devkit30';
  if(p.kind==='switch'){
    card.dataset.powered=state.switches[p.id]?'on':'off';
    const battery=p.id==='s1'?'b1':'b2';
    const ledConnected=state.wires.some(w=>electricalKey(w.a,w.b)===electricalKey(battery+'.NEG',p.id+'.LEDG'));
    card.dataset.indicator=state.switches[p.id]&&ledConnected?'on':'off';
  }
  card.className='part'+(state.selected===p.id?' selected':'');
  card.dataset.part=p.id;card.dataset.kind=p.kind;card.style.left=p.x+'px';card.style.top=p.y+'px';
  card.style.setProperty('--part-w',layout.w+'px');card.style.setProperty('--part-h',layout.h+'px');
  card.style.zIndex=state.selected===p.id?'5':'3';
  const head=document.createElement('div');head.className='part-head';
  card.setAttribute('aria-label',partName(p.id));
  const del=document.createElement('button');del.type='button';del.className='part-remove';del.dataset.remove=p.id;
  del.title='Remover peça';del.setAttribute('aria-label','Remover '+partName(p.id));del.textContent='×';
  head.append(del);
  const imgbox=document.createElement('div');imgbox.className='part-image';
  const img=document.createElement('img');img.src=p.kind==='motor'?motorImage(p):imageUrl(t);img.alt='';img.draggable=false;
  imgbox.append(img);
  if(p.kind==='motor'){
   const rotor=document.createElement('span');rotor.className='motor-shaft-spinner';rotor.setAttribute('aria-hidden','true');
   imgbox.append(rotor);
  }
  if(p.kind==='esp'){
   const ledRed=document.createElement('span');ledRed.className='board-led board-led-red';
   ledRed.title='LED de alimentação do ESP32';
   const ledBlue=document.createElement('span');ledBlue.className='board-led board-led-blue';
   ledBlue.title='Atividade Wi-Fi simulada (indicador didático)';
   imgbox.append(ledRed,ledBlue);
  }
  if(p.kind==='buck'||p.kind==='driver'){
   const badge=document.createElement('span');
   badge.className='powered-tag';
   badge.textContent=p.kind==='buck'?'ENTRADA · 9 V':'ALIMENTAÇÃO';
   badge.title='Estado energético didático; esta versão da placa não apresenta LED de indicação no desenho.';
   imgbox.append(badge);
  }
  const pins=document.createElement('div');pins.className='part-pins';
  t.pins.forEach(([code,txt])=>{
   const id=p.id+'.'+code,connected=state.wires.some(w=>w.a===id||w.b===id),wrong=mistakes().some(w=>w.a===id||w.b===id);
   const at=layout.pins[code]||[50,50];
   const btn=document.createElement('button');btn.type='button';
   btn.className='pin-btn'+(state.startPort===id?' selected':'')+(connected?' connected':'')+(wrong?' invalid':'');
   btn.style.setProperty('--pin-x',at[0]+'%');btn.style.setProperty('--pin-y',at[1]+'%');
   btn.dataset.port=id;btn.title=portName(id);btn.setAttribute('aria-label','Conectar terminal '+portName(id));
   const dot=document.createElement('span');dot.className='pin-dot';btn.append(dot,document.createTextNode(txt));
   pins.append(btn);
  });
  card.append(head,imgbox,pins);
  if(p.kind==='switch'){
   const actions=document.createElement('div');actions.className='part-actions';
   const toggle=document.createElement('button');toggle.type='button';toggle.dataset.toggle=p.id;
   toggle.className='part-switch'+(state.switches[p.id]?' on':'');
   toggle.textContent=state.switches[p.id]?'I':'O';
   toggle.setAttribute('aria-pressed',String(state.switches[p.id]));
   toggle.setAttribute('aria-label',(state.switches[p.id]?'Desligar':'Ligar')+' gangorra '+partName(p.id));
   actions.append(toggle);card.append(actions);
  }
  if(p.kind==='buck'){
   const wrap=document.createElement('div');wrap.className='part-actions';
   const meter=document.createElement('label');meter.className='part-voltage';meter.textContent='Saída';
   const range=document.createElement('input');range.type='range';range.min='3';range.max='6';range.step='.5';
   range.value=state.voltage;range.id='voltageInput';range.setAttribute('aria-label','Saída em volts');
   const out=document.createElement('output');out.id='voltageOutput';
   out.textContent=state.voltage.toFixed(1).replace('.',',')+' V';
   meter.append(range,out);wrap.append(meter);card.append(wrap);
  }
  layer.append(card);
 }
 Q('worldNote').hidden=state.parts.length>0;
 updateLiveSimulation();
 updateHistoryButtons();requestDraw();
}
function chooseWireColor(color){
 if(!COLORS.includes(color))return;
 const selected=Number.isInteger(state.selectedWire)?state.wires[state.selectedWire]:null;
 if(selected&&selected.color!==color){
  snapshot(); // Ctrl+Z restaura a cor anterior do fio.
  selected.color=color;
  message('Cor do jumper selecionado alterada.',true);
 }
 state.wireColor=color; // Também permanece como cor para o próximo fio.
 renderColors();renderInspector();requestDraw();persist();
}
function renderColors(){
 const dropdown=Q('wireColorSelect');if(dropdown)dropdown.value=state.wireColor;
 const preview=Q('wireColorPreview');if(preview)preview.style.background=state.wireColor;
 Q('colorPalette').replaceChildren();
 COLORS.forEach((c,i)=>{
  const b=document.createElement('button');b.type='button';b.className='swatch'+(state.wireColor===c?' active':'');b.title='Fio '+(i+1);b.style.background=c;b.dataset.color=c;b.setAttribute('aria-label','Selecionar cor '+(i+1));b.setAttribute('aria-pressed',String(state.wireColor===c));Q('colorPalette').append(b);
 });
}
function inspectorPart(p){
 const t=byId[p.id];const body=Q('inspectorBody');body.replaceChildren();
 const img=document.createElement('img');img.className='inspect-image';img.src=p.kind==='motor'?motorImage(p):imageUrl(t);img.alt=partName(p.id);
 const name=document.createElement('div');name.className='inspect-name';name.textContent=partName(p.id);
 const tag=document.createElement('p');tag.className='inspect-type';tag.textContent='COMPONENTE SELECIONADO';
 const para=document.createElement('p');para.className='inspect-paragraph';para.textContent=t.info;
 const note=document.createElement('div');note.className='inspect-pins';note.textContent='✳ '+t.tip;
 const pins=document.createElement('p');pins.className='inspect-paragraph';pins.textContent=t.pins.length+' terminais disponíveis. Toque em um terminal na bancada para começar a ligação.';
 const actions=document.createElement('div');actions.className='inspect-actions';
 if(p.kind==='motor'){
  const change=document.createElement('button');change.type='button';change.className='inspect-action';change.dataset.motorView=p.id;change.textContent=p.view==='side'?'↻ Ver vista frontal':'↻ Ver vista lateral';actions.append(change);
  const demo=document.createElement('button');demo.type='button';demo.className='inspect-action';demo.dataset.demoMotor=p.id;
  demo.textContent='▶ Ver o eixo girar (prévia visual)';
  actions.append(demo);
 }
 const remove=document.createElement('button');remove.type='button';remove.className='inspect-action';remove.dataset.remove=p.id;remove.textContent='✕ Remover da bancada';
 actions.append(remove);body.append(img,name,tag,para,note,pins,actions);
}
function inspectorWires(){
 const body=Q('inspectorBody');body.replaceChildren();
 if(!state.wires.length){body.innerHTML='<div class="inspect-empty"><span>〰</span><h3>Nenhum fio ainda</h3><p>Toque num terminal, marque as curvas na bancada e finalize no outro terminal.</p></div>';return;}
 state.wires.forEach((w,i)=>{
  const row=document.createElement('div');row.className='wire-item'+(state.selectedWire===i?' is-selected':'');row.dataset.selectWire=String(i);row.tabIndex=0;row.title='Selecionar jumper para trocar sua cor';
  const dot=document.createElement('span');dot.className='wire-dot';dot.style.background=w.color;
  const names=document.createElement('div');names.className='wire-names';names.textContent=portName(w.a)+' → '+portName(w.b)+(w.via&&w.via.length?' · '+w.via.length+' curva(s)':'')+(valid.has(electricalKey(w.a,w.b))?' · ✓':' · Rever');
  const btn=document.createElement('button');btn.type='button';btn.dataset.removeWire=String(i);btn.title='Remover fio';btn.textContent='×';
  row.append(dot,names,btn);body.append(row);
 });
}
function renderInspector(){
 Q('inspectorPartsTab').classList.toggle('active',state.inspector==='parts');
 Q('inspectorWiresTab').classList.toggle('active',state.inspector==='wires');
 Q('wiresBadge').textContent=state.wires.length;
 const body=Q('inspectorBody');
 if(state.inspector==='wires'){inspectorWires();return;}
 const p=byPart(state.selected);
 if(p){inspectorPart(p);return;}
 body.innerHTML='<div class="inspect-empty"><span>⌁</span><h3>Selecione uma peça</h3><p>Coloque um componente na bancada e toque nele para descobrir sua função e seus terminais.</p></div>';
}
function toggleMotorView(id){
 const part=byPart(id);if(!part||part.kind!=='motor')return;
 snapshot();part.view=part.view==='side'?'front':'side';
 // Alternar a vista não desloca nem limita a posição escolhida na área infinita.
 refresh();message('Motor: vista '+(part.view==='side'?'lateral':'frontal')+'. Os fios foram preservados.',true);
}
function demoMotor(id){
 const el=[...Q('partsLayer').querySelectorAll('.part')].find(p=>p.dataset.part===id);
 if(!el)return;
 el.classList.add('demo-running');
 message('Prévia visual: observe o eixo do '+partName(id)+' girando. A montagem ainda precisa do circuito.',true);
 setTimeout(()=>el.classList.remove('demo-running'),3500);
}
function renderProgress(){
 const total=countGood(),errors=mistakes().length;
 Q('connectionsCount').textContent=total+' / '+EXPECTED.length;
 const partsDone=state.parts.length;
 const inAssembly=partsDone<9;
 const progress=inAssembly?partsDone/9:total/EXPECTED.length;
 Q('progressBar').style.width=Math.round(progress*100)+'%';
 Q('connectionsCount').textContent=inAssembly?partsDone+'/9':total+'/'+EXPECTED.length;
 Q('progressCaption').textContent=inAssembly?'Componentes':'Conexões corretas';
 const badge=Q('validationBadge');badge.className='validation-badge'+(ready()?' ok':errors?' error':'');
 badge.textContent=ready()?'✓ Circuito pronto para iniciar':errors?errors+' ligação(ões) fora do esquema':state.parts.length<9?'Continue adicionando componentes':'Faltam '+missing().length+' ligações';
 const missionTitle=Q('missionTitle'),missionText=Q('missionText');
 if(!state.parts.length){Q('stepNumber').textContent='01';missionTitle.textContent='Sua bancada está vazia';missionText.textContent='Arraste as peças do catálogo e solte onde quiser.';}
 else if(state.parts.length<9){Q('stepNumber').textContent='01';missionTitle.textContent='Monte seu conjunto de peças';missionText.textContent='Você colocou '+state.parts.length+' das 9 peças. Continue arrastando do menu.';}
 else if(missing().length||errors){Q('stepNumber').textContent='02';missionTitle.textContent='Agora conecte os terminais';missionText.textContent=total+' ligações corretas de '+EXPECTED.length+'. Toque num pino e depois no outro.';}
 else if(!state.switches.s1||!state.switches.s2||Math.abs(state.voltage-5)>.01){Q('stepNumber').textContent='03';missionTitle.textContent='Hora de ligar a energia';missionText.textContent='Ajuste 5 V na LM2596 e ligue as duas gangorras.';}
 else {Q('stepNumber').textContent='04';missionTitle.textContent='Tudo pronto para testar!';missionText.textContent='Toque em Iniciar simulação para dirigir o carrinho.';}
}
function refresh(){renderCatalog();renderParts();renderColors();renderInspector();renderProgress();persist();updateTrackLock();}
function renderAll(){refresh();}
function addPart(kind,x,y){
 const t=byKind[kind];if(!t)return false;
 const id=t.ids.find(id=>!exists(id));if(!id){message('Você já colocou todas as peças deste tipo.',true);return false;}
 snapshot();
 state.parts.push({id,kind,x:Math.round(x),y:Math.round(y),view:'front'});
 state.selected=id;state.selectedWire=null;state.inspector='parts';state.completed=false;state.startPort=null;refresh();
 message(partName(id)+' adicionado. Arraste pela imagem; toque nos contatos para ligar os fios.',true);
 return true;
}
function removePart(id,skipSnapshot=false){
 if(!exists(id))return;
 if(!skipSnapshot)snapshot();
 state.parts=state.parts.filter(p=>p.id!==id);
 state.wires=state.wires.filter(w=>w.a.split('.')[0]!==id&&w.b.split('.')[0]!==id);
 if(state.selected===id)state.selected=null;
 state.selectedWire=null;
 if(state.startPort&&state.startPort.split('.')[0]===id){state.startPort=null;state.bends=[];previewPoint=null;}
 if(id==='s1'||id==='s2')state.switches[id]=false;
 state.completed=false;refresh();message(partName(id)+' removido.');
}
function copySelection(){
 const p=byPart(state.selected);
 if(!p){message('Selecione um componente para copiar.',true);return;}
 copiedKind=p.kind;Q('pasteBtn').disabled=false;
 message(partName(p.id)+' copiado. Use Colar ou Ctrl+V.',true);
}
function pasteSelection(){
 if(!copiedKind){message('Copie uma peça antes de colar.',true);return;}
 if(!byKind[copiedKind].ids.some(id=>!exists(id))){
  message('Limite de peças desse tipo atingido.',true);return;
 }
 centerPart(copiedKind);
 message('Componente colado. Posicione-o na bancada.',true);
}
function removeZoneAt(x,y){
 const target=document.elementFromPoint?.(x,y);
 if(target?.closest?.('#library,#drawerHandle'))return true;
 const library=Q('library'),box=library.getBoundingClientRect?.();
 const visible=library.classList.contains('open')||window.matchMedia?.('(min-width:1191px)')?.matches;
 return !!(visible&&box&&x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom);
}
function highlightDropZone(active){
 Q('library').classList.toggle('drop-target',!!active);
 Q('drawerHandle').classList.toggle('drop-target',!!active);
}
function cancelPendingWire(){
 if(!state.startPort)return;
 snapshot();
 state.startPort=null;state.bends=[];wireTipActive=false;previewPoint=null;previewSnapPort=null;
 pendingAlignment=null;
 renderParts();requestDraw();updateHistoryButtons();
}
function tipOrigin(){
 if(!state.startPort)return null;
 const p=getPortPos(state.startPort),direction=portDirection(state.startPort);
 return p?{x:p.x+direction.x*24,y:p.y+direction.y*24}:null;
}
function lastWireTip(){
 return state.bends.at(-1)||getPortPos(state.startPort);
}
function previousWirePoint(){
 if(!state.startPort)return null;
 if(state.bends.length>1)return state.bends.at(-2);
 return state.bends.length?tipOrigin():getPortPos(state.startPort);
}
// Jumper flexível: os dois eixos acompanham o cursor sem recuar nem travar.
function orthogonalTrail(last,wanted,previous){
 if(!last||!wanted)return [];
 const p={x:Math.round(wanted.x),y:Math.round(wanted.y)};
 const dx=p.x-last.x,dy=p.y-last.y;
 if(Math.abs(dx)<2&&Math.abs(dy)<2)return [];
 if(Math.abs(dx)<2||Math.abs(dy)<2)return [p];
 const vertical=previous?Math.abs(last.y-previous.y)>=Math.abs(last.x-previous.x):true;
 const elbow=vertical?{x:last.x,y:p.y}:{x:p.x,y:last.y};
 return [elbow,p];
}
function projectFromTip(from,wanted,previous=null){
 const points=orthogonalTrail(from,wanted,previous);
 return points.length?points[points.length-1]:null;
}
function addCorner(x,y){
 if(!state.startPort)return;
 const last=lastWireTip(),tip={x:Math.round(x),y:Math.round(y)};
 if(!last||Math.hypot(tip.x-last.x,tip.y-last.y)<6){requestDraw();return;}
 if(state.bends.length>=48){message('Limite de curvas: finalize em um pino.',true);return;}
 // Somente o clique fixa a ponta. Enquanto o cursor se move, não há curvas.
 // Cada clique é um passo independente para Ctrl+Z / Ctrl+Y.
 snapshot();state.bends.push(tip);
 // O clique fixa o vértice, mas a próxima ponta continua seguindo o cursor.
 wireTipActive=true;previewPoint=tip;previewSnapPort=null;pendingAlignment=null;
 updateHistoryButtons();requestDraw();
 message('Curva fixada. Continue movimentando o cursor até a próxima curva ou pino.');
}
function connect(id){
 const part=id.split('.')[0];if(!exists(part))return;
 state.selected=part;state.selectedWire=null;state.inspector='parts';
 if(!state.startPort){
  snapshot();
  state.startPort=id;state.bends=[];wireTipActive=true;previewPoint=null;previewSnapPort=null;pendingAlignment=null;updateHistoryButtons();
  message('Fio iniciado em '+portName(id)+'. Toque na bancada para criar curvas, depois no pino de destino.');
  renderParts();renderInspector();requestDraw();return;
 }
 const first=state.startPort;
 if(id===first){cancelPendingWire();message('Ligação cancelada.');return;}
 const via=state.bends.map(p=>({x:p.x,y:p.y}));
 // Antes de finalizar, guarda o jumper parcialmente desenhado.
 snapshot();
 state.startPort=null;state.bends=[];wireTipActive=false;previewPoint=null;previewSnapPort=null;pendingAlignment=null;
 const index=state.wires.findIndex(w=>electricalKey(w.a,w.b)===electricalKey(first,id));
 if(index>=0){state.wires.splice(index,1);message('Ligação existente removida.');}
 else{
  state.wires.push({a:first,b:id,color:state.wireColor,via,manual:true});
  message(valid.has(electricalKey(first,id))?'✓ Fio sólido conectado com '+via.length+' curva(s).':'Fio criado, mas os terminais precisam ser revisados.',!valid.has(electricalKey(first,id)));
 }
 state.completed=false;refresh();
}
function removeWire(i){if(!state.wires[i])return;snapshot();state.wires.splice(i,1);state.selectedWire=null;state.completed=false;refresh();message('Fio removido.');}
function getPortPos(id){
 const [partId,pinId]=id.split('.');
 const p=byPart(partId);if(!p)return null;
 const layout=partLayout(p),pos=layout.pins[pinId];if(!pos)return null;
 return {x:p.x+layout.w*pos[0]/100,y:p.y+layout.h*pos[1]/100};
}
function portDirection(id){
 if(!id)return {x:0,y:-1};
 const [partId,code]=id.split('.');
 const p=byPart(partId);if(!p)return {x:0,y:-1};
 if(p.kind==='esp')return {x:0,y:['3V3','GND2','D15','D2','D4','RX2','TX2','D5','D18','D19','D21','RX0','TX0','D22','D23'].includes(code)?1:-1};
 if(p.kind==='driver')return {x:0,y:code.startsWith('OUT')?-1:1};
 if(p.kind==='buck')return {x:code.startsWith('IN')?-1:1,y:0};
 if(p.kind==='battery')return {x:0,y:-1};
 if(p.kind==='switch')return {x:0,y:1};
 if(p.kind==='motor')return p.view==='side'?{x:1,y:0}:{x:-1,y:0};
 return {x:0,y:-1};
}
// Caminho manual: cada ponto do desenho é uma escolha explícita do usuário.
// Não insere a dobra ortogonal antes do clique nem cria cotovelos automáticos.
function manualWirePoints(start,via,end){
 if(!start)return [];
 const points=[start,...(via||[]),...(end?[end]:[])];
 const result=[];
 for(const p of points){
  if(!p)continue;
  const rounded={x:Math.round(p.x),y:Math.round(p.y)},last=result.at(-1);
  if(!last||last.x!==rounded.x||last.y!==rounded.y)result.push(rounded);
 }
 return result;
}
function pendingWirePoints(){
 if(!state.startPort)return [];
 const start=getPortPos(state.startPort);
 const tip=previewPoint;
 return manualWirePoints(start,state.bends,tip);
}
// Edita um segmento de um jumper conectado sem alterar os dois bornes.
// A primeira movimentação converte ligações antigas para a rota manual visível.
function wirePoints(w){
 const a=getPortPos(w.a),b=getPortPos(w.b);
 return a&&b?(w.manual?manualWirePoints(a,w.via||[],b):wireRoutePoints(a,w.via||[],b,w.a,w.b)):[];
}
function segmentAt(clientX,clientY){
 const p=worldXY(clientX,clientY),tolerance=Math.min(90,Math.max(15,17/zoom));
 let best={index:-1,segment:-1,dist:tolerance*tolerance};
 state.wires.forEach((w,i)=>{
  const pts=wirePoints(w);
  for(let k=0;k<pts.length-1;k++){
   const a=pts[k],b=pts[k+1],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
   const t=len?limit(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1):0;
   const dist=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
   if(dist<best.dist){best={index:i,segment:k,dist};}
  }
 });
 return best;
}
// Puxar uma curva ajusta só o vértice escolhido, não o segmento inteiro.
function bendAt(clientX,clientY){
 const cursor=worldXY(clientX,clientY),radius=Math.min(110,Math.max(17,17/zoom));
 let best={index:-1,vertex:-1,dist:radius*radius};
 state.wires.forEach((wire,i)=>{
  const points=wirePoints(wire);
  for(let k=1;k<points.length-1;k++){
   const pt=points[k],dist=(cursor.x-pt.x)**2+(cursor.y-pt.y)**2;
   if(dist<best.dist)best={index:i,vertex:k,dist};
  }
 });
 return best;
}
function beginBendDrag(e,index,vertex){
 const wire=state.wires[index];if(!wire||state.startPort)return false;
 const original=wirePoints(wire);
 if(!Number.isInteger(vertex)||vertex<1||vertex>=original.length-1)return false;
 if(e.cancelable!==false)e.preventDefault();
 state.selectedWire=index;state.selected=null;state.inspector='wires';
 state.wireColor=wire.color;
 renderColors();renderInspector();updateHistoryButtons();
 gesture={type:'wire-bend',pointer:e.pointerId,wireIndex:index,vertex,
  original:original.map(p=>({...p})),startX:e.clientX,startY:e.clientY,
  moved:false,saved:false};
 wireAlignment=null;requestDraw();
 return true;
}
function moveWireBend(g,clientX,clientY){
 const wire=state.wires[g.wireIndex];if(!wire)return;
 const original=g.original,target=original[g.vertex];if(!target)return;
 const via=original.slice(1,-1).map(p=>({...p}));
 via[g.vertex-1]={
  x:Math.round(target.x+(clientX-g.startX)/zoom),
  y:Math.round(target.y+(clientY-g.startY)/zoom)
 };
 wire.via=via;wire.manual=true;wireAlignment=null;
 requestDraw();
}
function moveWireSegment(g,clientX,clientY){
 const wire=state.wires[g.wireIndex];
 if(!wire)return;
 const original=g.original,a=original[g.segment],b=original[g.segment+1];
 if(!a||!b)return;
 const axisX=b.x-a.x,axisY=b.y-a.y,length=Math.hypot(axisX,axisY);
 if(length<3)return;
 const nx=-axisY/length,ny=axisX/length;
 const deltaX=(clientX-g.startX)/zoom,deltaY=(clientY-g.startY)/zoom;
 let shift=deltaX*nx+deltaY*ny;
 let aligned=false,guideValue=null;
 const horizontal=Math.abs(axisY)<length*.15,vertical=Math.abs(axisX)<length*.15;
 if(horizontal||vertical){
  const base=horizontal?a.y:a.x,perp=horizontal?ny:nx;
  const value=base+shift*perp;
  const candidates=[];
  const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  for(const part of state.parts)for(const [pin] of byKind[part.kind].pins){
   const pos=getPortPos(part.id+'.'+pin);if(!pos)continue;
   const along=Math.abs(horizontal?pos.x-midpoint.x:pos.y-midpoint.y)*zoom;
   if(along<=250)candidates.push(horizontal?pos.y:pos.x);
  }
  // Indicador visual momentâneo; não atrai nem muda a posição do fio.
  const match=candidates.sort((left,right)=>Math.abs(left-value)-Math.abs(right-value))
   .find(candidate=>Math.abs(candidate-value)<=6/zoom);
  if(match!==undefined){guideValue=match;aligned=true;}
 }
 const movedA={x:Math.round(a.x+nx*shift),y:Math.round(a.y+ny*shift)};
 const movedB={x:Math.round(b.x+nx*shift),y:Math.round(b.y+ny*shift)};
 // A guia não movimenta o segmento, apenas sinaliza o alinhamento.
 // Preserva os terminais originais. Acrescenta cotovelos somente ao arrastar.
 const nodes=[
  ...original.slice(0,g.segment+1),
  movedA,movedB,
  ...original.slice(g.segment+1)
 ];
 const clean=[];
 for(const pt of nodes){
  const last=clean.at(-1);
  if(!last||last.x!==pt.x||last.y!==pt.y)clean.push({...pt});
 }
 wire.via=clean.slice(1,-1);
 wire.manual=true;
 wireAlignment=aligned?{horizontal,value:guideValue,start:movedA,end:movedB}:null;
 requestDraw();
}
function wireRoutePoints(start,via,end,startPort,endPort){
 const round=p=>({x:Math.round(p.x),y:Math.round(p.y)});
 const direction=portDirection(startPort);
 const first=round(start),stub={x:first.x+direction.x*24,y:first.y+direction.y*24};
 const pts=[first,stub];
 const push=p=>{const last=pts.at(-1);if(Math.hypot(last.x-p.x,last.y-p.y)>1)pts.push(round(p));};
 for(const raw of via||[]){
  const prev=pts.at(-1);
  // Compatibilidade com os fios antigos: normaliza qualquer curva diagonal.
  const fixed=(Math.abs(raw.x-prev.x)<2||Math.abs(raw.y-prev.y)<2)?round(raw):projectFromTip(prev,raw);
  push(fixed);
 }
 if(end){
  const last=pts.at(-1),target=round(end),inDir=portDirection(endPort);
  const endStub={x:target.x+inDir.x*24,y:target.y+inDir.y*24};
  // A curva automática ocorre apenas a partir da última ponta,
  // com uma aproximação reta ao conector final.
  if(inDir.y!==0)push({x:endStub.x,y:last.y});
  else push({x:last.x,y:endStub.y});
  push(endStub);push(target);
 }
 // Elimina trechos consecutivos duplicados e evita a ponta parecer dois fios.
 const clean=[];
 for(const pt of pts){
  const p={x:Math.round(pt.x),y:Math.round(pt.y)},a=clean.at(-1),b=clean.at(-2);
  if(a&&a.x===p.x&&a.y===p.y)continue;
  if(b&&((b.x===a.x&&a.x===p.x)||(b.y===a.y&&a.y===p.y)))clean[clean.length-1]=p;
  else clean.push(p);
 }
 return clean;
}
function wirePath(pts){
 return pts.length?'M'+pts.map(p=>Math.round(p.x)+' '+Math.round(p.y)).join(' L'):'';
}
function wireRoute(start,via,end,startPort,endPort){
 return wirePath(wireRoutePoints(start,via,end,startPort,endPort));
}
function drawWires(){
 drawPending=false;
 const svg=Q('wireSvg');svg.replaceChildren();
 const ns='http://www.w3.org/2000/svg';
 for(let i=0;i<state.wires.length;i++){
  const w=state.wires[i],points=wirePoints(w);
  if(points.length<2)continue;
  const d=wirePath(points);
  const line=document.createElementNS(ns,'path');
  line.setAttribute('d',d);
  line.setAttribute('class','wire-line'+(valid.has(electricalKey(w.a,w.b))?'':' wire-error')+(state.selectedWire===i?' wire-selected':''));
  line.setAttribute('stroke',w.color);svg.append(line);
  // O traço termina no furo do pino; nenhum círculo fica sobre o componente.
  // Um alvo por segmento, inclusive para fios retos sem curvas intermediárias.
  // Encurta o trecho perto dos bornes para não bloquear os cliques nos pinos.
  for(let seg=0;seg<points.length-1;seg++){
   const from=points[seg],to=points[seg+1];
   const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
   if(length<8)continue;
   const trimStart=seg===0?Math.min(length*.22,24/zoom):0;
   const trimEnd=seg===points.length-2?Math.min(length*.22,24/zoom):0;
   const u={x:from.x+dx*trimStart/length,y:from.y+dy*trimStart/length};
   const v={x:to.x-dx*trimEnd/length,y:to.y-dy*trimEnd/length};
   const hit=document.createElementNS(ns,'path');
   hit.setAttribute('d',wirePath([u,v]));
   hit.setAttribute('class','wire-target');
   hit.setAttribute('stroke','transparent');
   hit.setAttribute('fill','none');
   hit.style.setProperty('--hit-width',Math.min(90,Math.max(22,20/zoom))+'px');
   hit.setAttribute('stroke-linecap','butt');
   hit.dataset.wireIndex=String(i);
   hit.dataset.wireSegment=String(seg);
   hit.setAttribute('aria-label','Arrastar trecho '+(seg+1)+' do jumper '+portName(w.a)+' a '+portName(w.b));
   svg.append(hit);
  }
 }
 // Alças quadradas sem halos: apenas a curva tocada muda de ângulo.
 if(!state.startPort)for(let i=0;i<state.wires.length;i++){
  const points=wirePoints(state.wires[i]);
  for(let vertex=1;vertex<points.length-1;vertex++){
   const p=points[vertex],hitSize=Math.min(130,Math.max(32,29/zoom));
   const hit=document.createElementNS(ns,'rect');
   hit.setAttribute('x',String(p.x-hitSize/2));hit.setAttribute('y',String(p.y-hitSize/2));
   hit.setAttribute('width',String(hitSize));hit.setAttribute('height',String(hitSize));
   hit.setAttribute('class','wire-bend-target');
   hit.dataset.wireIndex=String(i);hit.dataset.wireVertex=String(vertex);
   hit.setAttribute('aria-label','Arrastar somente o vértice '+vertex+' do jumper');
   svg.append(hit);
   if(state.selectedWire===i){
    const size=Math.min(55,Math.max(10,10/zoom));
    const mark=document.createElementNS(ns,'rect');
    mark.setAttribute('x',String(p.x-size/2));mark.setAttribute('y',String(p.y-size/2));
    mark.setAttribute('width',String(size));mark.setAttribute('height',String(size));
    mark.setAttribute('class','wire-bend-mark');svg.append(mark);
   }
  }
 }
 if(wireAlignment){
  // Também no ajuste de fio conectado: guia fina, sem atrair o segmento.
  const g=wireAlignment,guide=document.createElementNS(ns,'line');
  const box=Q('viewport').getBoundingClientRect();
  const upper=worldXY(box.left,box.top);
  const lower=worldXY(box.right,box.bottom);
  guide.setAttribute('class','wire-pending-guide');
  if(g.horizontal){
   guide.setAttribute('x1',String(upper.x));guide.setAttribute('x2',String(lower.x));
   guide.setAttribute('y1',String(g.value));guide.setAttribute('y2',String(g.value));
  }else{
   guide.setAttribute('y1',String(upper.y));guide.setAttribute('y2',String(lower.y));
   guide.setAttribute('x1',String(g.value));guide.setAttribute('x2',String(g.value));
  }
  guide.style.strokeWidth=(1.5/zoom)+'px';
  svg.append(guide);
 }
 if(state.startPort&&pendingAlignment&&previewPoint){
  // Régua fina como no Tinkercad: indica eixo coincidente sem alterar fio.
  const match=pendingAlignment,box=Q('viewport').getBoundingClientRect();
  const top=worldXY(box.left,box.top),bottom=worldXY(box.right,box.bottom);
  const guide=document.createElementNS(ns,'line');
  guide.setAttribute('class','wire-pending-guide');
  if(match.axis==='x'){
   guide.setAttribute('x1',String(match.pin.x));
   guide.setAttribute('x2',String(match.pin.x));
   guide.setAttribute('y1',String(Math.min(top.y,match.pin.y,previewPoint.y)));
   guide.setAttribute('y2',String(Math.max(match.pin.y,previewPoint.y)));
  }else{
   guide.setAttribute('y1',String(match.pin.y));
   guide.setAttribute('y2',String(match.pin.y));
   guide.setAttribute('x1',String(Math.min(top.x,match.pin.x,previewPoint.x)));
   guide.setAttribute('x2',String(Math.max(match.pin.x,previewPoint.x)));
  }
  guide.style.strokeWidth=(1.5/zoom)+'px';
  svg.append(guide);
 }
 if(state.startPort){
  const start=getPortPos(state.startPort);
  if(!start)return;
  // Um único segmento livre, direto do último ponto fixado ao cursor.
  // Não criar cotovelos enquanto o aluno apenas movimenta o ponteiro.
  const pts=pendingWirePoints();
  const preview=document.createElementNS(ns,'path');
  preview.setAttribute('d',wirePath(pts));
  preview.setAttribute('class','wire-line wire-pending');
  preview.setAttribute('stroke',state.wireColor);svg.append(preview);
  const tip=pts.at(-1)||start;
  if(tip&&wireTipActive&&previewPoint){
   const spark=document.createElementNS(ns,'g');
   spark.setAttribute('class','wire-spark');
   spark.setAttribute('transform','translate('+Math.round(tip.x)+' '+Math.round(tip.y)+')');
   spark.setAttribute('stroke','#ffbd53');spark.setAttribute('stroke-width','3.5');
   spark.setAttribute('stroke-linecap','round');
   for(const angle of [-90,-30,30,90,150,210]){
    const line=document.createElementNS(ns,'line'),r=angle*Math.PI/180;
    line.setAttribute('x1',String(Math.round(Math.cos(r)*9)));
    line.setAttribute('y1',String(Math.round(Math.sin(r)*9)));
    line.setAttribute('x2',String(Math.round(Math.cos(r)*15)));
    line.setAttribute('y2',String(Math.round(Math.sin(r)*15)));
    spark.append(line);
   }
   svg.append(spark);
  }
 }
}
function requestDraw(){if(drawPending)return;drawPending=true;requestAnimationFrame(drawWires);}
function camera(){
 const w=Q('world'),v=Q('viewport');
 w.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
 Q('zoomLabel').textContent=Math.round(zoom*100)+'%';
 // A grade pertence à janela, não a um retângulo de 1900x1450.
 // Sua origem acompanha a câmera e pode avançar indefinidamente nas quatro direções.
 const grid=20*zoom;
 v.style.backgroundSize=grid+'px '+grid+'px';
 v.style.backgroundPosition=panX+'px '+panY+'px';
 // Em zoom muito baixo as bolinhas se sobreporiam: oculta a grade até ampliar.
 const radius=Math.min(1.15,zoom*1.15);
 v.style.setProperty('background-image',zoom<.25?'none':'radial-gradient(circle,#cfd7de '+radius+'px,transparent '+(radius+.15)+'px)','important');
 const note=Q('worldNote');
 note.style.left='50%';note.style.top='50%';
 requestDraw();
}
const MIN_ZOOM=.04,MAX_ZOOM=2.4;
function cameraZoom(nextZoom,clientX,clientY){
 const r=Q('viewport').getBoundingClientRect(),cx=clientX===undefined?r.left+r.width/2:clientX,cy=clientY===undefined?r.top+r.height/2:clientY;
 const wx=(cx-r.left-panX)/zoom,wy=(cy-r.top-panY)/zoom;
 zoom=limit(nextZoom,MIN_ZOOM,MAX_ZOOM);
 panX=cx-r.left-wx*zoom;panY=cy-r.top-wy*zoom;
 camera();Q('zoomSlider').value=String(Math.round(zoom*100));
}
function fitRegion(box){
 const v=Q('viewport'),w=v.clientWidth,h=v.clientHeight;
 zoom=limit(Math.min((w-28)/(box.w+90),(h-28)/(box.h+90)),MIN_ZOOM,1.35);
 panX=w/2-(box.x+box.w/2)*zoom;
 panY=h/2-(box.y+box.h/2)*zoom;
 camera();Q('zoomSlider').value=String(Math.round(zoom*100));
}
function focusPart(id){
 const p=byPart(id);if(!p)return;
 const d=partLayout(p);
 fitRegion({x:p.x,y:p.y,w:d.w,h:d.h});
}
function fitCamera(){
 if(state.parts.length){
  const x=Math.min(...state.parts.map(p=>p.x));
  const y=Math.min(...state.parts.map(p=>p.y));
  const right=Math.max(...state.parts.map(p=>p.x+partLayout(p).w));
  const bottom=Math.max(...state.parts.map(p=>p.y+partLayout(p).h));
  fitRegion({x,y,w:right-x,h:bottom-y});
 }else fitRegion({x:-370,y:-250,w:740,h:500});
}
function zoomTo(factor){cameraZoom(zoom*factor);}
function trackingTouchDown(e){
 if(e.pointerType!=='touch')return;
 activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(activeTouches.size>=2){
  const ps=[...activeTouches.values()].slice(0,2),cx=(ps[0].x+ps[1].x)/2,cy=(ps[0].y+ps[1].y)/2,r=Q('viewport').getBoundingClientRect();
  pinch={distance:Math.max(1,Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y)),zoom,wx:(cx-r.left-panX)/zoom,wy:(cy-r.top-panY)/zoom};
  gesture=null;previewPoint=null;previewSnapPort=null;gestureBlockedUntil=Date.now()+420;suppressPortClickUntil=gestureBlockedUntil;
 }
}
function trackingTouchMove(e){
 if(!activeTouches.has(e.pointerId))return false;
 activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!pinch||activeTouches.size<2)return false;
 if(e.cancelable)e.preventDefault();
 const ps=[...activeTouches.values()].slice(0,2);
 const d=Math.max(1,Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y));
 const cx=(ps[0].x+ps[1].x)/2,cy=(ps[0].y+ps[1].y)/2,r=Q('viewport').getBoundingClientRect();
 zoom=limit(pinch.zoom*d/pinch.distance,MIN_ZOOM,MAX_ZOOM);
 panX=cx-r.left-pinch.wx*zoom;panY=cy-r.top-pinch.wy*zoom;
 camera();Q('zoomSlider').value=String(Math.round(zoom*100));
 return true;
}
function trackingTouchEnd(e){
 if(!activeTouches.has(e.pointerId))return false;
 const wasPinching=!!pinch;
 activeTouches.delete(e.pointerId);
 if(wasPinching){
  gesture=null;gestureBlockedUntil=Date.now()+420;suppressPortClickUntil=gestureBlockedUntil;
  if(activeTouches.size<2)pinch=null;
 }
 return wasPinching;
}
function worldXY(clientX,clientY){
 const r=Q('viewport').getBoundingClientRect();
 return {x:(clientX-r.left-panX)/zoom,y:(clientY-r.top-panY)/zoom};
}
// Encaixe magnético em pixels da tela, mesmo com zoom.
function nearestPort(clientX,clientY,exclude){
 const r=Q('viewport').getBoundingClientRect();let distance=19*19,chosen=null;
 for(const part of state.parts)for(const [pin] of byKind[part.kind].pins){
  const id=part.id+'.'+pin;if(id===exclude)continue;
  const point=getPortPos(id);if(!point)continue;
  const dx=r.left+panX+point.x*zoom-clientX,dy=r.top+panY+point.y*zoom-clientY,d=dx*dx+dy*dy;
  if(d<distance){distance=d;chosen=id;}
 }
 return chosen;
}
// Guia exclusivamente visual. Detecta coordenada de pino próxima ao cursor
// sem alterar a posição real da ponta nem aplicar qualquer resistência.
function visualPendingAlignment(clientX,clientY,exclude){
 const box=Q('viewport').getBoundingClientRect();
 const raw=worldXY(clientX,clientY),screen=p=>({x:box.left+panX+p.x*zoom,y:box.top+panY+p.y*zoom});
 const threshold=6;let best=null,bestScore=Infinity;
 for(const part of state.parts)for(const [pin] of byKind[part.kind].pins){
  const id=part.id+'.'+pin;if(id===exclude)continue;
  const pos=getPortPos(id);if(!pos)continue;
  const sp=screen(pos),dx=Math.abs(sp.x-clientX),dy=Math.abs(sp.y-clientY);
  for(const axis of ['x','y']){
   const deviation=axis==='x'?dx:dy;
   const along=axis==='x'?dy:dx;
   const score=deviation+along*.015;
   if(deviation<=threshold&&along<=280&&score<bestScore){
    bestScore=score;best={axis,point:raw,pin:pos,port:id};
   }
  }
 }
 return best;
}
function setPendingPreview(e){
 if(!wireTipActive||!state.startPort)return;
 // O jumper acompanha o ponteiro exatamente, independentemente da guia.
 previewPoint=worldXY(e.clientX,e.clientY);
 previewSnapPort=null;
 pendingAlignment=visualPendingAlignment(e.clientX,e.clientY,state.startPort);
 requestDraw();
}
function wireAt(clientX,clientY){return segmentAt(clientX,clientY).index;}
function selectWire(i){
 if(!state.wires[i])return;
 state.selectedWire=i;state.selected=null;state.inspector='wires';
 state.wireColor=state.wires[i].color; // O seletor exibe a cor do fio clicado.
 renderParts();renderColors();renderInspector();updateHistoryButtons();requestDraw();
 message('Jumper selecionado. Arraste um trecho para mudar o caminho; as pontas ficam conectadas.',true);
}
function centerPart(kind){
 const v=Q('viewport').getBoundingClientRect();
 const center=worldXY(v.left+v.width/2,v.top+v.height/2);
 const size=PART_LAYOUTS[kind];if(!size)return false;
 // Procura um espaço livre em espiral a partir da região que o usuário está vendo,
 // sem percorrer uma grade limitada ou declarar a bancada cheia.
 const step=125;
 const baseX=Math.round((center.x-size.w/2)/step)*step;
 const baseY=Math.round((center.y-size.h/2)/step)*step;
 let target=null;
 for(let radius=0;radius<200&&!target;radius++){
  for(let row=-radius;row<=radius&&!target;row++){
   for(let col=-radius;col<=radius;col++){
    if(radius&&Math.max(Math.abs(row),Math.abs(col))!==radius)continue;
    const x=baseX+col*step,y=baseY+row*step;
    const clear=state.parts.every(p=>{
     const d=partLayout(p),pad=26;
     return x+size.w+pad<=p.x||p.x+d.w+pad<=x||y+size.h+pad<=p.y||p.y+d.h+pad<=y;
    });
    if(clear){target={x,y};break;}
   }
  }
 }
 if(!target)return false;
 const added=addPart(kind,target.x,target.y);
 if(added){
  if(size.w*zoom>v.width-32||size.h*zoom>v.height-65)focusPart(state.selected);
  else{
   const sx=panX+(target.x+size.w/2)*zoom,sy=panY+(target.y+size.h/2)*zoom;
   if(sx<70||sx>v.width-70||sy<80||sy>v.height-80){
    panX=v.width/2-(target.x+size.w/2)*zoom;
    panY=v.height/2-(target.y+size.h/2)*zoom;camera();
   }
  }
 }
 return added;
}
function syncDrawerTop(){
 // A lateral começa abaixo do cabeçalho e da barra, em todos os tamanhos.
 const bar=document.querySelector?.('.studio-topbar');
 const top=Math.ceil(bar?.getBoundingClientRect?.().bottom||0);
 if(top>0)document.documentElement?.style?.setProperty('--drawer-top',top+'px');
}
function libraryOpen(open){
 const yes=!!open;
 syncDrawerTop();
 // Encerrar o foco da busca ao fechar a gaveta evita teclado preso no Android.
 if(!yes)Q('componentSearch').blur?.();
 Q('library').classList.toggle('open',yes);
 Q('sideBackdrop').hidden=!yes;
 Q('menuBtn').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-label',yes?'Fechar componentes':'Abrir componentes');
 Q('drawerHandle').classList.toggle('open',yes);
}
function beginWireDrag(e,index,segment){
 const wire=state.wires[index];if(!wire||state.startPort)return false;
 const original=wirePoints(wire);
 if(segment<0||segment>=original.length-1)return false;
 if(e.cancelable!==false)e.preventDefault();
 state.selectedWire=index;state.selected=null;state.inspector='wires';
 state.wireColor=wire.color;
 renderColors();renderInspector();updateHistoryButtons();
 gesture={type:'wire-segment',pointer:e.pointerId,wireIndex:index,segment,
  original:original.map(p=>({...p})),startX:e.clientX,startY:e.clientY,
  moved:false,saved:false};
 wireAlignment=null;requestDraw();
 return true;
}
function startPan(e){
 if(e.cancelable!==false)e.preventDefault();
 gesture={type:'pan',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:panX,y:panY,moved:false};
}
function anchoredWireBends(part,dx,dy,anchors){
 // Ao mover somente uma peça, os cotovelos ortogonais próximos ao borne
 // acompanham a peça. O borne da outra extremidade nunca é modificado.
 for(const item of anchors||[]){
  const wire=state.wires[item.i],old=item.via;
  if(!wire||!wire.manual||!old.length)continue;
  const via=old.map(p=>({...p}));
  if(item.a){
   if(Math.abs(old[0].x-item.start.x)<2)via[0].x=Math.round(old[0].x+dx);
   if(Math.abs(old[0].y-item.start.y)<2)via[0].y=Math.round(old[0].y+dy);
  }
  if(item.b){
   const n=old.length-1;
   if(Math.abs(old[n].x-item.end.x)<2)via[n].x=Math.round(old[n].x+dx);
   if(Math.abs(old[n].y-item.end.y)<2)via[n].y=Math.round(old[n].y+dy);
  }
  wire.via=via;
 }
}
function partDown(e){
 if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('button,input,label'))return;
 const el=e.target.closest('.part');if(!el)return;
 const p=byPart(el.dataset.part);if(!p)return;
 e.preventDefault();
 state.selected=p.id;state.selectedWire=null;state.inspector='parts';
 renderInspector();renderParts();
 gesture={type:'move',pointer:e.pointerId,partId:p.id,startX:e.clientX,startY:e.clientY,partX:p.x,partY:p.y,
  anchors:state.wires.map((w,i)=>({
   i,a:w.a.split('.')[0]===p.id,b:w.b.split('.')[0]===p.id,
   via:(w.via||[]).map(point=>({...point})),start:getPortPos(w.a),end:getPortPos(w.b)
  })).filter(item=>item.a||item.b),moved:false};
}
function paletteDown(e){
 if(e.button!==undefined&&e.button!==0)return;
 const el=e.target.closest('.catalog-card');if(!el||el.disabled)return;
 e.preventDefault();
 gesture={type:'catalog',pointer:e.pointerId,kind:el.dataset.kind,startX:e.clientX,startY:e.clientY,moved:false};
}
function viewportDown(e){
 if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
 if(e.button!==undefined&&e.button!==0&&e.button!==1)return;
 if(e.target.closest('.canvas-zoom-button,.canvas-zoom-panel,button,input'))return;
 if(spaceHeld||e.button===1){startPan(e);return;}
 if(e.target.closest('.part'))return;
 if(!state.startPort){
  const bend=bendAt(e.clientX,e.clientY);
  if(bend.index>=0&&beginBendDrag(e,bend.index,bend.vertex))return;
  const selected=segmentAt(e.clientX,e.clientY);
  if(selected.index>=0&&beginWireDrag(e,selected.index,selected.segment))return;
 }
 if(e.target.closest('.wire-target,.wire-bend-target'))return;
 e.preventDefault();
 gesture={type:state.startPort?'bend':'pan',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:panX,y:panY,moved:false};
}
let suppressPortClickUntil=0;
function pointerMove(e){
 if(trackingTouchMove(e)||pinch)return;
 if(gesture&&e.pointerId===gesture.pointer){
  const g=gesture,dx=e.clientX-g.startX,dy=e.clientY-g.startY;
  if(Math.hypot(dx,dy)>(g.type==='wire'?12:g.type==='pan'?9:6))g.moved=true;
  if(g.type==='catalog'){
   if(g.moved){const ghost=Q('dragGhost');ghost.hidden=false;ghost.textContent=byKind[g.kind].name;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}
  }else if(g.type==='move'){
   const p=byPart(g.partId);if(!p)return;
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved){
    p.x=Math.round(g.partX+dx/zoom);
    p.y=Math.round(g.partY+dy/zoom);
    anchoredWireBends(p,p.x-g.partX,p.y-g.partY,g.anchors);
    const el=[...Q('partsLayer').querySelectorAll('.part')].find(node=>node.dataset.part===p.id);
    if(el){el.style.left=p.x+'px';el.style.top=p.y+'px';}
    highlightDropZone(removeZoneAt(e.clientX,e.clientY));
    requestDraw();
   }
  }else if(g.type==='wire-bend'){
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved)moveWireBend(g,e.clientX,e.clientY);
  }else if(g.type==='wire-segment'){
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved)moveWireSegment(g,e.clientX,e.clientY);
  }else if(g.type==='wire'){
   if(g.moved){
    if(!state.startPort){snapshot();state.startPort=g.port;state.bends=[];wireTipActive=true;updateHistoryButtons();}
    setPendingPreview(e,g.port);
   }
  }else if(g.type==='bend'){
   setPendingPreview(e);
  }
  else if(g.type==='pan'){if(g.moved){panX=g.x+dx;panY=g.y+dy;camera();}}
 }else if(state.startPort){
  const r=Q('viewport').getBoundingClientRect();
  if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){
   setPendingPreview(e);
  }
 }
}
// Gesto móvel reversível: primeiro duplo toque amplia, segundo restaura a vista.
// Não interfere com os pinos nem com um jumper que está sendo traçado.
function handleDoubleTap(e,g){
 if(e.pointerType!=='touch'||g.moved||state.startPort||!['pan','move'].includes(g.type)){
  if(e.pointerType==='touch')recentTap=null;
  return false;
 }
 const now=Date.now(),previous=recentTap;
 recentTap={time:now,x:e.clientX,y:e.clientY};
 if(!previous||now-previous.time>360||Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>38)return false;
 recentTap=null;
 e.preventDefault?.();
 if(doubleTapRestore){
  zoom=doubleTapRestore.zoom;
  panX=doubleTapRestore.panX;
  panY=doubleTapRestore.panY;
  doubleTapRestore=null;
  camera();
  Q('zoomSlider').value=String(Math.round(zoom*100));
 }else{
  doubleTapRestore={zoom,panX,panY};
  cameraZoom(Math.max(.95,Math.min(MAX_ZOOM,zoom*1.9)),e.clientX,e.clientY);
 }
 // Não bloquear cliques seguintes nos pinos: o aluno pode conectar um fio
 // imediatamente depois de afastar a câmera.
 return true;
}
function pointerUp(e){
 if(trackingTouchEnd(e)||pinch)return;
 if(!gesture||e.pointerId!==gesture.pointer)return;
 const g=gesture;gesture=null;Q('dragGhost').hidden=true;
 highlightDropZone(false);
 if(handleDoubleTap(e,g))return;
 if(g.type==='catalog'){
  if(!g.moved){centerPart(g.kind);libraryOpen(false);}
  else{
   const box=Q('viewport').getBoundingClientRect();
   if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){const p=worldXY(e.clientX,e.clientY);addPart(g.kind,p.x-PART_LAYOUTS[g.kind].w/2,p.y-PART_LAYOUTS[g.kind].h/2);libraryOpen(false);}
   else message('Solte a peça sobre a bancada para adicioná-la.',true);
  }
 }else if(g.type==='wire-bend'){
  if(g.moved){persist();renderInspector();message('Ângulo da curva ajustado. Outros pontos e conexões mantidos.',true);}
  requestDraw();
 }else if(g.type==='wire-segment'){
  wireAlignment=null;
  if(g.moved){persist();renderInspector();message('Trecho do jumper ajustado. As peças permanecem no lugar.',true);}
  requestDraw();
 }else if(g.type==='wire'){
  if(g.moved){
   const found=document.elementFromPoint?document.elementFromPoint(e.clientX,e.clientY):null;
   const to=found&&found.closest?found.closest('[data-port]'):null;
   const first=state.startPort||g.port;
   const destination=(to&&to.dataset.port!==first?to.dataset.port:null)||nearestPort(e.clientX,e.clientY,first);
   suppressPortClickUntil=Date.now()+350;
   if(!state.startPort)connect(first);
   if(destination){connect(destination);
   }else{
     const box=Q('viewport').getBoundingClientRect();
     if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){
       const pos=worldXY(e.clientX,e.clientY);addCorner(pos.x,pos.y);
     }else{previewPoint=null;requestDraw();}
   }
  }
  // O preventDefault do touch suprime o click sintético em alguns celulares.
  // Por isso o toque simples também é tratado aqui, sem depender do navegador.
  if(!g.moved&&e.pointerType==='touch'){
   suppressPortClickUntil=Date.now()+350;
   connect(g.port);
  }
 }else if(g.type==='move'){
  if(g.moved&&removeZoneAt(e.clientX,e.clientY)){
   removePart(g.partId,true);
   message('Peça devolvida ao catálogo e removida da montagem.',true);
  }else if(g.moved)persist();
  else{state.selected=g.partId;renderParts();renderInspector();}
 }else if(g.type==='bend'){
  const pin=nearestPort(e.clientX,e.clientY,state.startPort);
  if(pin)connect(pin);else{const pos=worldXY(e.clientX,e.clientY);addCorner(pos.x,pos.y);}
 }else if(g.type==='pan'&&!g.moved&&!spaceHeld){
  const wire=wireAt(e.clientX,e.clientY);
  if(wire>=0)selectWire(wire);
  else{state.selected=null;state.selectedWire=null;renderParts();renderInspector();updateHistoryButtons();requestDraw();}
 }

}
function hint(){
 if(state.parts.length<9){const next=TYPES.find(t=>t.ids.some(id=>!exists(id)));message('Pegue no catálogo: '+next.name+'. Toque para adicionar ou arraste para a bancada.',true);return;}
 const wrong=mistakes()[0];if(wrong){message('Revise este fio: '+portName(wrong.a)+' → '+portName(wrong.b)+'.',true);return;}
 const miss=missing()[0];if(miss){message('Experimente ligar: '+portName(miss[0])+' → '+portName(miss[1])+'.',true);return;}
 if(state.voltage!==5){message('Ajuste o LM2596 para 5,0 V.',true);return;}
 if(!state.switches.s1||!state.switches.s2){message('Ligue as duas chaves gangorra.',true);return;}
 message('Tudo correto! Toque em Iniciar simulação.',true);
}
function check(){
 if(state.parts.length<9){message('Primeiro coloque todas as 9 peças. Ainda faltam '+(9-state.parts.length)+'.',true);return false;}
 if(mistakes().length){message('Existem '+mistakes().length+' fio(s) ligado(s) a terminais que não combinam. Revise os fios.',true);state.inspector='wires';renderInspector();return false;}
 const m=missing();if(m.length){message('Faltam '+m.length+' ligações. Dica: '+portName(m[0][0])+' → '+portName(m[0][1])+'.',true);return false;}
 if(Math.abs(state.voltage-5)>.01){message('Ajuste a saída do LM2596 para 5,0 V.',true);return false;}
 if(!state.switches.s1||!state.switches.s2){message('Ligue as duas gangorras para iniciar.',true);return false;}
 return true;
}
function switchView(play){
 Q('buildPanel').hidden=play;Q('playPanel').hidden=!play;
 Q('editTab').classList.toggle('active',!play);Q('playTab').classList.toggle('active',play);
 if(play){car.x=150;car.y=447;car.a=0;car.finished=false;Q('driveReadout').textContent=ready()?'Pronto para pilotar':'Aguardando montagem';}
 if(!play)syncMotorAnimation(0,0);
 updateTrackLock();updateLiveSimulation();if(play)drawTrack();
}
function updateTrackLock(){Q('trackLock').hidden=ready();if(!ready()){Object.keys(keys).forEach(k=>keys[k]=false);syncMotorAnimation(0,0);}}
const ctx=Q('track').getContext('2d');
const obstacles=[{x:300,y:280,r:26},{x:458,y:180,r:27},{x:585,y:365,r:27},{x:727,y:265,r:25}];
function rr(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawTrack(){
 ctx.clearRect(0,0,960,560);ctx.fillStyle='#8abb8d';ctx.fillRect(0,0,960,560);
 for(let x=20;x<960;x+=68)for(let y=30;y<560;y+=78){ctx.fillStyle='#a4d0a5';ctx.fillRect(x,y,5,5);}
 rr(48,41,863,476,42,'#e2eadc');rr(60,54,841,451,36,'#354d59');rr(80,74,801,410,21,'#435d68');
 ctx.strokeStyle='#dce8d8';ctx.lineWidth=3;ctx.setLineDash([21,17]);ctx.strokeRect(101,95,757,363);ctx.setLineDash([]);
 rr(98,411,102,15,2,'#c8e99a');ctx.fillStyle='#fff';ctx.font='bold 19px sans-serif';ctx.fillText('INÍCIO',110,405);
 for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#1b303e':'white';ctx.fillRect(782+i*10,78,10,60);ctx.fillStyle=i%2?'white':'#1b303e';ctx.fillRect(782+i*10,138,10,10);}
 rr(786,155,66,22,5,'#c8ee82');ctx.fillStyle='#31554b';ctx.font='bold 12px sans-serif';ctx.fillText('CHEGADA',790,170);
 obstacles.forEach(o=>{ctx.fillStyle='#23333d5e';ctx.beginPath();ctx.arc(o.x,o.y+6,o.r+3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(o.x,o.y-o.r);ctx.lineTo(o.x+o.r*.9,o.y+o.r*.8);ctx.lineTo(o.x-o.r*.9,o.y+o.r*.8);ctx.closePath();ctx.fillStyle='#f8a45e';ctx.fill();ctx.fillStyle='white';ctx.fillRect(o.x-12,o.y+3,24,5);});
 ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.a);
 rr(-26,-32,11,25,4,'#172733');rr(15,-32,11,25,4,'#172733');rr(-26,9,11,25,4,'#172733');rr(15,9,11,25,4,'#172733');
 rr(-19,-34,38,68,10,'#d5deba');rr(-15,-27,30,54,7,'#155b6a');rr(-11,-18,22,24,3,'#a4cbd2');rr(-12,12,24,7,3,'#bdeb87');
 ctx.fillStyle='#efcd74';ctx.fillRect(-14,-31,8,5);ctx.fillRect(6,-31,8,5);ctx.restore();
 if(car.finished){rr(286,234,387,93,17,'#163644');ctx.fillStyle='#bcec8b';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText('🏁 VOCÊ CONSEGUIU!',480,268);ctx.fillStyle='white';ctx.font='17px sans-serif';ctx.fillText('Parabéns! Missão concluída.',480,301);ctx.textAlign='left';}
}
function syncMotorAnimation(v,turn){
 // Comandos educativos de um sistema de tração diferencial: o eixo anima ao receber um comando.
 const velocities={ml:v+turn,mr:v-turn};
 for(const id of ['ml','mr']){
  const motor=Q('preview-'+id);
  if(!motor)continue;
  const speed=simulationRunning&&ready()&&!Q('playPanel').hidden&&!car.finished?velocities[id]:0;
  const motion=Math.abs(speed)<.01?'idle':speed<0?'reverse':'forward';
  if(motor.dataset.motion===motion)continue;
  motor.dataset.motion=motion;
  motor.classList.toggle('running',motion!=='idle');
  motor.classList.toggle('reverse',motion==='reverse');
  const status=Q('motor-status-'+id);
  if(status)status.textContent=motion==='idle'?'Parado':motion==='reverse'?'Giro reverso':'Girando';
 }
}
function drive(time){
 const dt=Math.min(.05,(time-lastFrame)/1000||0);lastFrame=time;
 if(!Q('playPanel').hidden&&ready()&&!car.finished){
  const v=(keys.up?1:0)-(keys.down?1:0),turn=(keys.right?1:0)-(keys.left?1:0);
  syncMotorAnimation(v,turn);
  car.a+=turn*2.8*dt*(v<0?-1:1);
  if(v){
   const x=car.x,y=car.y;
   car.x=limit(car.x+Math.sin(car.a)*v*(v>0?200:140)*dt,82,880);
   car.y=limit(car.y-Math.cos(car.a)*v*(v>0?200:140)*dt,77,483);
   if(obstacles.some(o=>Math.hypot(car.x-o.x,car.y-o.y)<o.r+25)){car.x=x;car.y=y;Q('driveReadout').textContent='Desvie do obstáculo!';}
   else Q('driveReadout').textContent=v>0?'Avançando':'Marcha à ré';
  }
  if(Math.hypot(car.x-820,car.y-111)<53){car.finished=true;Object.keys(keys).forEach(k=>keys[k]=false);syncMotorAnimation(0,0);Q('driveReadout').textContent='🏆 Chegada!';message('Parabéns! Você concluiu a pista!',true);}
  drawTrack();
 }
 requestAnimationFrame(drive);
}
function resetDrive(){car.x=150;car.y=447;car.a=0;car.finished=false;Object.keys(keys).forEach(k=>keys[k]=false);syncMotorAnimation(0,0);Q('driveReadout').textContent='Pronto para pilotar';drawTrack();}
window.tinkerpetAnswerData={
 groups:[
 {title:'Alimentação do ESP32',from:0,to:5,color:'#d9634e',info:'Bateria 1, gangorra e regulador LM2596'},
 {title:'Energia dos motores',from:5,to:9,color:'#d38f39',info:'Suporte de 6 pilhas AA, gangorra, ponte H e GND comum'},
 {title:'Sinais de controle',from:9,to:13,color:'#3d84b8',info:'GPIOs da ESP32 ligados à ponte H'},
 {title:'Saídas para os motores',from:13,to:17,color:'#229786',info:'Ponte H conectada aos dois motores DC'}
 ],
 connections:EXPECTED.map(([a,b],i)=>({n:i+1,from:portName(a),to:portName(b),a,b})),
 components:TYPES.flatMap(t=>t.ids.map(id=>({id,kind:t.kind,name:partName(id),image:t.img,width:PART_LAYOUTS[t.kind].w,height:PART_LAYOUTS[t.kind].h,pins:PART_LAYOUTS[t.kind].pins})))
};

function downloadBlob(blob,filename){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=filename;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1800);
}
async function downloadWorkspace(){
 if(!state.parts.length){message('Adicione peças para baixar a montagem.',true);return;}
 const button=Q('downloadBtn');button.disabled=true;
 const escapeXml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
 try{
  // Exportação integral: imagens são embutidas, portanto funcionam fora do site.
  const pad=85;
  const routePoints=state.wires.flatMap(w=>w.via||[]);
  const minX=Math.min(...state.parts.map(p=>p.x),...routePoints.map(p=>p.x))-pad;
  const minY=Math.min(...state.parts.map(p=>p.y),...routePoints.map(p=>p.y))-pad;
  const maxX=Math.max(...state.parts.map(p=>p.x+partLayout(p).w),...routePoints.map(p=>p.x))+pad;
  const maxY=Math.max(...state.parts.map(p=>p.y+partLayout(p).h),...routePoints.map(p=>p.y))+pad;
  const width=Math.ceil(maxX-minX),height=Math.ceil(maxY-minY);
  const imageCache=new Map();
  const parts=[];
  for(const p of state.parts){
   const src=p.kind==='motor'?motorImage(p):imageUrl(byKind[p.kind]);
   let href=imageCache.get(src);
   if(!href){
    const response=await fetch(src);
    if(!response.ok)throw Error('Não foi possível obter imagem de '+partName(p.id));
    const raw=await response.text();
    href='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(raw);
    imageCache.set(src,href);
   }
   const size=partLayout(p);
   parts.push('<image href="'+escapeXml(href)+'" x="'+p.x+'" y="'+p.y+'" width="'+size.w+'" height="'+size.h+'" preserveAspectRatio="xMidYMid meet"/>');
  }
  const wires=state.wires.map(w=>{
   const from=getPortPos(w.a),to=getPortPos(w.b);
   if(!from||!to)return '';
   return '<path d="'+escapeXml(w.manual?wirePath(manualWirePoints(from,w.via||[],to)):wireRoute(from,w.via||[],to,w.a,w.b))+'" fill="none" stroke="'+escapeXml(w.color)+'" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>';
  }).join('');
  const svg='<?xml version="1.0" encoding="UTF-8"?>'
   +'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="'+minX+' '+minY+' '+width+' '+height+'" width="'+width+'" height="'+height+'">'
   +'<rect x="'+minX+'" y="'+minY+'" width="'+width+'" height="'+height+'" fill="#f4f5f6"/>'
   +parts.join('')+wires+'</svg>';
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  // PNG permite compartilhar a montagem; SVG vetorial é alternativa universal.
  const url=URL.createObjectURL(blob);
  try{
   const bitmap=new Image();
   await new Promise((resolve,reject)=>{bitmap.onload=resolve;bitmap.onerror=reject;bitmap.src=url;});
   const canvas=document.createElement('canvas');
   const factor=Math.min(2.25,3600/Math.max(width,height));
   canvas.width=Math.round(width*factor);canvas.height=Math.round(height*factor);
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!png)throw Error('PNG indisponível');
   downloadBlob(png,'TinkerPET-montagem.png');
   message('Imagem PNG da montagem baixada com os componentes e jumpers.',true);
  }catch(err){
   downloadBlob(blob,'TinkerPET-montagem.svg');
   message('Montagem vetorial SVG baixada.',true);
  }finally{URL.revokeObjectURL(url);}
 }catch(err){message('Falha ao baixar montagem: '+err.message,true);}
 finally{button.disabled=false;}
}
function bind(){
 Q('menuBtn').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('drawerHandle').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('openComponentPicker').addEventListener('click',()=>libraryOpen(true));
 Q('closeLibrary').addEventListener('click',()=>libraryOpen(false));Q('sideBackdrop').addEventListener('click',()=>libraryOpen(false));
 Q('componentSearch').addEventListener('input',renderCatalog);
 Q('catalog').addEventListener('pointerdown',paletteDown);
 Q('partsLayer').addEventListener('pointerdown',e=>{
   if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
   // A ferramenta mão não deve desativar o seletor de tensão ou as teclas das gangorras.
   if((spaceHeld||e.button===1)&&!e.target.closest('input,select,[data-toggle],[data-remove]')){startPan(e);return;}
   const port=e.target.closest('[data-port]');
   if(port&&e.button!==2){
     // Android: os bornes são botões, não campos de texto. Evita foco/teclado
     // sem perder o toque simples, que é finalizado em pointerUp.
     if(e.pointerType==='touch'){
      const active=document.activeElement;
      if(active&&(/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)||active.isContentEditable))active.blur?.();
      Q('componentSearch').blur?.();
      if(e.cancelable!==false)e.preventDefault();
     }
     gesture={type:'wire',pointer:e.pointerId,port:port.dataset.port,startX:e.clientX,startY:e.clientY,moved:false};
     requestDraw();return;
   }
   partDown(e);
 });
 Q('viewport').addEventListener('pointerdown',trackingTouchDown,true);
 Q('viewport').addEventListener('pointerdown',viewportDown);
 window.addEventListener('pointermove',pointerMove);
 window.addEventListener('pointerup',pointerUp);
 window.addEventListener('pointercancel',pointerUp);
 Q('partsLayer').addEventListener('click',e=>{
  const pin=e.target.closest('[data-port]');if(pin){
    e.stopPropagation();
    if(spaceHeld||Date.now()<suppressPortClickUntil)return;
    // Em telas pequenas o espaçamento físico dos 30 contatos diminui bastante.
    // O primeiro toque aproxima a placa; o próximo faz a ligação com precisão.
    if(e.isTrusted&&zoom<.69&&pin.dataset.port.startsWith('esp.')){
      cameraZoom(.95,e.clientX,e.clientY);
      message('ESP32 ampliado para selecionar o contato com precisão.',true);
      return;
    }
    connect(pin.dataset.port);return;
  }
  const del=e.target.closest('[data-remove]');if(del){removePart(del.dataset.remove);return;}
  const toggler=e.target.closest('[data-toggle]');if(toggler){snapshot();state.switches[toggler.dataset.toggle]=!state.switches[toggler.dataset.toggle];refresh();message('Gangorra '+(state.switches[toggler.dataset.toggle]?'ligada':'desligada')+'.');return;}
 });
 Q('partsLayer').addEventListener('input',e=>{if(e.target.id==='voltageInput'){state.voltage=Number(e.target.value);const out=Q('voltageOutput');if(out)out.textContent=state.voltage.toFixed(1).replace('.',',')+' V';renderProgress();persist();updateTrackLock();updateLiveSimulation();}});
 Q('partsLayer').addEventListener('change',e=>{if(e.target.id==='voltageInput')message('LM2596 ajustado para '+state.voltage.toFixed(1).replace('.',',')+' V.');});
 Q('wireSvg').addEventListener('pointerdown',e=>{
  if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil||spaceHeld)return;
  if(e.button!==undefined&&e.button!==0)return;
  const path=e.target.closest?.('[data-wire-index]');
  if(!path)return;
  const index=Number(path.dataset.wireIndex);
  if(path.dataset.wireVertex!==undefined){
   if(beginBendDrag(e,index,Number(path.dataset.wireVertex)))e.stopPropagation?.();
   return;
  }
  const bend=bendAt(e.clientX,e.clientY);
  if(bend.index>=0&&beginBendDrag(e,bend.index,bend.vertex)){
   e.stopPropagation?.();return;
  }
  const seg=Number(path.dataset.wireSegment);
  if(!Number.isInteger(seg))return;
  if(beginWireDrag(e,index,seg))e.stopPropagation?.();
 });
 Q('wireSvg').addEventListener('click',e=>{
   if(spaceHeld)return;
   const target=e.target.closest('[data-wire-index]');if(!target)return;
   e.stopPropagation?.();
   const i=Number(target.dataset.wireIndex);
   if(!state.wires[i])return;
   selectWire(i);
 });
 Q('inspectorBody').addEventListener('click',e=>{const view=e.target.closest('[data-motor-view]');if(view){toggleMotorView(view.dataset.motorView);return;}const demo=e.target.closest('[data-demo-motor]');if(demo){demoMotor(demo.dataset.demoMotor);return;}const del=e.target.closest('[data-remove]');if(del)removePart(del.dataset.remove);const w=e.target.closest('[data-remove-wire]');if(w){removeWire(Number(w.dataset.removeWire));return;}const row=e.target.closest('[data-select-wire]');if(row)selectWire(Number(row.dataset.selectWire));});
 Q('inspectorPartsTab').addEventListener('click',()=>{state.inspector='parts';renderInspector();});
 Q('inspectorWiresTab').addEventListener('click',()=>{state.inspector='wires';renderInspector();});
 Q('colorPalette').addEventListener('click',e=>{
  const swatch=e.target.closest('[data-color]');
  if(swatch)chooseWireColor(swatch.dataset.color);
 });
 Q('wireColorSelect').addEventListener('change',e=>chooseWireColor(e.target.value));
 Q('undoBtn').addEventListener('click',undo);
 Q('redoBtn').addEventListener('click',redo);
 Q('copyBtn').addEventListener('click',copySelection);
 Q('pasteBtn').disabled=true;
 Q('pasteBtn').addEventListener('click',pasteSelection);
 Q('deleteBtn').addEventListener('click',()=>{
  if(Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire]){removeWire(state.selectedWire);return;}
  const selected=byPart(state.selected);
  if(selected)removePart(selected.id);
  else if(state.startPort)cancelPendingWire();
  else message('Toque em uma peça ou em um fio para selecionar e excluir.',true);
 });
 Q('clearBtn').addEventListener('click',()=>{if(!state.parts.length)return;if(confirm('Apagar todas as peças e fios da bancada?')){snapshot();state.parts=[];state.wires=[];state.selected=null;state.startPort=null;state.bends=[];previewPoint=null;state.switches={s1:false,s2:false};state.voltage=4;refresh();message('Bancada limpa. Comece de novo!');}});
 Q('downloadBtn').addEventListener('click',downloadWorkspace);
 Q('hintBtn').addEventListener('click',hint);
 Q('saveBtn').addEventListener('click',()=>{persist();message('Seu projeto foi salvo neste navegador.',true);});
 Q('checkBtn').addEventListener('click',toggleSimulation);
 Q('openTrackBtn').addEventListener('click',()=>{
  if(!simulationRunning||!ready()){message('Conclua a montagem para abrir a pista. A simulação da bancada continua disponível.',true);return;}
  switchView(true);message('Pista liberada! Use WASD, setas ou os botões.',true);
 });
 Q('playTab').addEventListener('click',()=>{if(simulationRunning&&ready())switchView(true);});
 Q('editTab').addEventListener('click',()=>switchView(false));Q('backBtn').addEventListener('click',()=>switchView(false));Q('goToBuild').addEventListener('click',()=>switchView(false));
 Q('zoomIn').addEventListener('click',()=>zoomTo(1.25));
 Q('zoomOut').addEventListener('click',()=>zoomTo(.8));
 Q('fitBtn').addEventListener('click',fitCamera);
 Q('zoomTool').addEventListener('click',()=>{Q('zoomPopover').hidden=!Q('zoomPopover').hidden;});
 Q('zoomSlider').addEventListener('input',e=>cameraZoom(Number(e.target.value)/100));
 Q('zoomFitPart').addEventListener('click',()=>{const p=byPart(state.selected);if(p)focusPart(p.id);else fitCamera();Q('zoomPopover').hidden=true;});
 Q('zoomFitAll').addEventListener('click',()=>{fitCamera();Q('zoomPopover').hidden=true;});
 Q('viewport').addEventListener('wheel',e=>{
  e.preventDefault();
  if(e.ctrlKey||e.metaKey){
   cameraZoom(zoom*(e.deltaY<0?1.12:.89),e.clientX,e.clientY);
  }else{
   panX-=(e.shiftKey?e.deltaY:e.deltaX);
   panY-=e.shiftKey?e.deltaX:e.deltaY;
   camera();
  }
 },{passive:false});
 Q('guideBtn').addEventListener('click',()=>Q('guideDialog').showModal());
 Q('closeGuide').addEventListener('click',()=>Q('guideDialog').close());
 Q('startGuide').addEventListener('click',()=>Q('guideDialog').close());
 Q('restartDrive').addEventListener('click',resetDrive);
 const binds={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
 document.addEventListener('keydown',e=>{
  // Ctrl+Z / Cmd+Z desfaz uma etapa de cada vez; Ctrl+Y ou Ctrl+Shift+Z refaz.
  // A edição de campos de texto conserva o desfazer próprio do navegador.
  const editable=e.target?.closest?.('input,textarea,select,[contenteditable="true"]');
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!editable){
   const key=e.key.toLowerCase();
   if(key==='c'){e.preventDefault();copySelection();return;}
   if(key==='v'){e.preventDefault();pasteSelection();return;}
   if(key==='z'||key==='y'){
    e.preventDefault();
    if(key==='y'||e.shiftKey)redo();else undo();
    return;
   }
  }
  if(e.key===' '&&Q('playPanel').hidden&&!e.target.closest('input,textarea,select,button')){
   e.preventDefault();spaceHeld=true;Q('viewport').classList.add('pan-space');return;
  }
  if(e.key==='Escape'&&state.startPort){e.preventDefault();cancelPendingWire();message('Fio cancelado.');return;}
  if(e.key==='Backspace'&&state.startPort&&!e.target.closest('input,textarea,select')){
   e.preventDefault();undo();return;
  }
  if(['Delete','Backspace'].includes(e.key)&&!e.target.closest('input,textarea,select')){
    if(Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire]){e.preventDefault();removeWire(state.selectedWire);return;}
    if(byPart(state.selected)){e.preventDefault();removePart(state.selected);return;}
   }
   if(Q('playPanel').hidden||!ready()||e.target.closest('input,textarea,select'))return;
  if(binds[e.key]){e.preventDefault();keys[binds[e.key]]=true;}
  if(e.key===' '){e.preventDefault();Object.keys(keys).forEach(k=>keys[k]=false);Q('driveReadout').textContent='Parado';}
 });
 document.addEventListener('keyup',e=>{
  if(e.key===' '){spaceHeld=false;Q('viewport').classList.remove('pan-space');}
  if(binds[e.key])keys[binds[e.key]]=false;
 });
 window.addEventListener('blur',()=>{spaceHeld=false;Q('viewport').classList.remove('pan-space');Object.keys(keys).forEach(k=>keys[k]=false);});
 document.querySelectorAll('[data-drive]').forEach(btn=>{
  const dir=btn.dataset.drive;
  btn.addEventListener('pointerdown',e=>{
   if(!ready())return;e.preventDefault();if(dir==='stop'){Object.keys(keys).forEach(k=>keys[k]=false);Q('driveReadout').textContent='Parado';return;}
   btn.setPointerCapture(e.pointerId);keys[dir]=true;btn.classList.add('pressed');
  });
  const end=()=>{if(dir!=='stop')keys[dir]=false;btn.classList.remove('pressed');};
  btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);btn.addEventListener('lostpointercapture',end);
 });
 window.addEventListener('resize',()=>{syncDrawerTop();fitCamera();requestDraw();});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(requestDraw).observe(Q('viewport'));
}
safeRestore();bind();syncDrawerTop();renderAll();fitCamera();drawTrack();requestAnimationFrame(drive);
if(document.fonts)document.fonts.ready.then(requestDraw);
})();
