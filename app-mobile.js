'use strict';
(() => {
// Visual preview uses a private localStorage copy. The normal site keeps
// its original key and nothing in the preview can overwrite its circuit.
// A aparência Studio também está na página principal: não trocar o progresso salvo.
const IS_VISUAL_PREVIEW=/(?:^|\/)studio-preview\.html$/.test(window.location.pathname);
const IS_PROJECT_EDITOR=/(?:^|\/)editor\.html$/.test(window.location.pathname);
const STORAGE_KEY=IS_VISUAL_PREVIEW?'tinkerpet-studio-preview-v1':'tinkerpet-v2';
const LIBRARY_KEY='tinkerpet-library-v1';
// Um editor sem ID não deve adivinhar o circuito pelo ACTIVE global,
// pois esse valor é alterado por outras abas. Peça a escolha segura na lista.
const EDITOR_PROJECT_ID=IS_PROJECT_EDITOR?new URLSearchParams(window.location.search).get('project'):null;
if(IS_PROJECT_EDITOR&&!EDITOR_PROJECT_ID){
 window.location.replace('projects.html?release=20261030wirepark1');
}
function activeCircuitFromLibrary(){
 if(!EDITOR_PROJECT_ID)return null;
 const lib=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'null');
 const project=Array.isArray(lib?.projects)?lib.projects.find(p=>p.id===EDITOR_PROJECT_ID):null;
 return project?.circuit||null;
}
const ROOT='https://raw.githubusercontent.com/gabrieljsantos/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/main/assets/images/componentes/';
const TYPES=[
 {kind:'esp',name:'ESP32 DevKit V1',img:'assets/esp32-devkit-v1-30p.svg?v=29',ids:['esp'],pins:[["VIN","VIN"],["GND","GND"],["D13","D13"],["D12","D12"],["D14","D14"],["D27","D27"],["D26","D26"],["D25","D25"],["D33","D33"],["D32","D32"],["D35","D35"],["D34","D34"],["VN","VN"],["VP","VP"],["EN","EN"],["3V3","3V3"],["GND2","GND"],["D15","D15"],["D2","D2"],["D4","D4"],["RX2","RX2"],["TX2","TX2"],["D5","D5"],["D18","D18"],["D19","D19"],["D21","D21"],["RX0","RX0"],["TX0","TX0"],["D22","D22"],["D23","D23"]],info:'Placa de 30 pinos com USB à esquerda e nomes em cada contato. Os dois GND são equivalentes.',tip:'Neste carrinho: VIN recebe 5 V, GND comum, D27→IN1, D26→IN2, D32→IN3 e D18→IN4.'},
 {kind:'driver',name:'Ponte H MX1508',img:'assets/mx1508-desenhado.svg?v=38',ids:['drv'],pins:[['VCC','+ motores'],['GND','GND motores'],['IN1','IN1'],['IN2','IN2'],['IN3','IN3'],['IN4','IN4'],['OUT1','A • 1'],['OUT2','A • 2'],['OUT3','B • 1'],['OUT4','B • 2']],info:'MX1508: MOTOR A e MOTOR B recebem um motor DC cada. O positivo do suporte de pilhas chega ao + da ponte pela gangorra; o negativo do suporte vai ao GND da ponte, que deve compartilhar GND com o ESP32.',tip:'IN1→GPIO27, IN2→GPIO26, IN3→GPIO32, IN4→GPIO18. Compartilhe o GND entre ESP32 e ponte H.'},
 {kind:'buck',name:'Regulador LM2596',img:'assets/lm2596-desenhado.svg',ids:['lm'],pins:[['INP','IN +'],['INN','IN −'],['OUTP','OUT +'],['OUTN','OUT −']],info:'Regulador de tensão. Neste projeto, a saída para o ESP32 deve ser ajustada para 5,0 V.',tip:'Na montagem real, um responsável deve medir 5 V com multímetro antes de conectar VIN.'},
 {kind:'battery',name:'Bateria 9 V',img:'assets/bateria-9v-desenhada.svg',ids:['b1'],pins:[['POS','+'],['NEG','−']],info:'Uma bateria de 9 V alimenta o regulador LM2596 e o ESP32.',tip:'Com gangorra: bateria (+) → contato 1 da chave; contato 2 → LM IN+. Bateria (−) → LM IN−. Ajuste LM OUT+ para 5 V antes de ligar VIN do ESP32.'},
 {kind:'batteryPack',name:'Suporte de 6 pilhas AA',img:'assets/suporte-6-pilhas.svg',ids:['b2'],pins:[['POS','+'],['NEG','−']],info:'Porta-pilhas com seis células AA: 9 V nominais se forem seis pilhas de 1,5 V. Alimenta a ponte H, não o ESP32.',tip:'Com gangorra: suporte (+) → contato 1 da chave, contato 2 → + da ponte H; suporte (−) → GND da ponte H, e GND da ponte H → GND do ESP32. Seis pilhas AA fornecem até 9 V nominais: verifique a tensão permitida pelos motores.'},
 {kind:'switch',name:'Chave gangorra',img:'assets/gangorra-desenhada.svg?v=3',ids:['s1','s2'],pins:[['IN','Contato 1'],['OUT','Contato 2'],['LEDG','LED − (indicador)']],info:'Gangorra iluminada de três terminais. Os contatos 1 e 2 abrem e fecham a alimentação: não têm polaridade para a função liga/desliga. O terceiro terminal é o retorno da luz LED, não um contato de comutação. A posição física dos terminais varia conforme o modelo.',tip:'Neste gabarito: positivo da fonte → contato 1 (IN), contato 2 (OUT) → IN+ do LM2596 ou + da ponte H. Não é necessário ligar o contato do LED na atividade. Identifique os dois contatos reais de comutação com multímetro, sem energizar o circuito.'},
 {kind:'motor',name:'Motor DC',img:'assets/motor-frontal.svg',ids:['ml','mr'],pins:[['A','+'],['B','−']],info:'Motor DC com caixa de redução amarela, eixo lateral para a roda e dois contatos no motor metálico. Na simulação, a ponte H controla o sentido de giro.',tip:'Os dois contatos ficam ao lado do motor metálico, identificados em vermelho e preto. O eixo de saída fica na caixa amarela.'}
];
const byKind=Object.fromEntries(TYPES.map(p=>[p.kind,p]));
const PART_LAYOUTS={
 esp:{w:790,h:365,pins:{"VIN":[14.4,18.5],"GND":[19.43,18.5],"D13":[24.46,18.5],"D12":[29.49,18.5],"D14":[34.52,18.5],"D27":[39.55,18.5],"D26":[44.58,18.5],"D25":[49.61,18.5],"D33":[54.64,18.5],"D32":[59.67,18.5],"D35":[64.7,18.5],"D34":[69.73,18.5],"VN":[74.76,18.5],"VP":[79.79,18.5],"EN":[84.82,18.5],"3V3":[14.4,85.7],"GND2":[19.43,85.7],"D15":[24.46,85.7],"D2":[29.49,85.7],"D4":[34.52,85.7],"RX2":[39.55,85.7],"TX2":[44.58,85.7],"D5":[49.61,85.7],"D18":[54.64,85.7],"D19":[59.67,85.7],"D21":[64.7,85.7],"RX0":[69.73,85.7],"TX0":[74.76,85.7],"D22":[79.79,85.7],"D23":[84.82,85.7]}},
 driver:{w:250,h:317,pins:{VCC:[24.3,84.5],GND:[34.7,84.5],IN1:[45,84.5],IN2:[55.3,84.5],IN3:[65.7,84.5],IN4:[76,84.5],OUT1:[70.7,16.5],OUT2:[85.7,16.5],OUT3:[24.3,16.5],OUT4:[39.3,16.5]}},
 buck:{w:288,h:180,pins:{INP:[14.72,35.1],INN:[14.72,63.1],OUTP:[85,35.1],OUTN:[85,63.1]}},
 battery:{w:170,h:228,pins:{POS:[30.6,4.7],NEG:[68.6,6.2]}},
 batteryPack:{w:265,h:255,pins:{POS:[16.1,7.7],NEG:[84.7,7.7]}},
 switch:{w:205,h:165,pins:{IN:[25,89.8],OUT:[50,89.8],LEDG:[75,89.8]}},
 motor:{w:190,h:405,pins:{A:[18,85],B:[18,80]}},
 motorSide:{w:340,h:170,pins:{A:[96,42],B:[96,63]}}
};
const byId=Object.fromEntries(TYPES.flatMap(p=>p.ids.map(id=>[id,p])));
// Os dois esquemas têm as mesmas ligações de controle, motores e GND comum.
// A única diferença é se cada positivo passa ou não por uma gangorra.
const COMMON_CONNECTIONS=[
 ['b1.NEG','lm.INN'],['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND'],
 ['b2.NEG','drv.GND'],['esp.GND','drv.GND'],
 ['esp.D27','drv.IN1'],['esp.D26','drv.IN2'],['esp.D32','drv.IN3'],['esp.D18','drv.IN4'],
 ['drv.OUT1','ml.A'],['drv.OUT2','ml.B'],['drv.OUT3','mr.A'],['drv.OUT4','mr.B']
];
const DIRECT_CONNECTIONS=[
 ['b1.POS','lm.INP'],['b2.POS','drv.VCC'],
 ...COMMON_CONNECTIONS
];
// Gabarito canônico com interruptores, também usado pelos testes existentes.
const EXPECTED=[
 ['b1.POS','s1.IN'],['s1.OUT','lm.INP'],['b1.NEG','lm.INN'],
 ['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND'],
 ['b2.POS','s2.IN'],['s2.OUT','drv.VCC'],['b2.NEG','drv.GND'],['esp.GND','drv.GND'],
 ['esp.D27','drv.IN1'],['esp.D26','drv.IN2'],['esp.D32','drv.IN3'],['esp.D18','drv.IN4'],
 ['drv.OUT1','ml.A'],['drv.OUT2','ml.B'],['drv.OUT3','mr.A'],['drv.OUT4','mr.B']
];
const SWITCHED_CONNECTIONS=EXPECTED;
const key=(a,b)=>[a,b].sort().join('|');
const canonicalPort=p=>p==='esp.GND2'?'esp.GND':p;
const electricalKey=(a,b)=>key(canonicalPort(a),canonicalPort(b));
const REQUIRED=new Set(EXPECTED.map(([a,b])=>electricalKey(a,b)));
const valid=new Set([...DIRECT_CONNECTIONS,...SWITCHED_CONNECTIONS].map(([a,b])=>electricalKey(a,b)));
const allPorts=new Set(TYPES.flatMap(t=>t.ids.flatMap(id=>t.pins.map(p=>id+'.'+p[0]))));
const Q=id=>document.getElementById(id);
// Coordenadas da bancada são livres: a câmera não impõe bordas às peças ou fios.
const WORLD={w:1900,h:1450};
const COLOR_CHOICES=[{"name":"Vermelho","value":"#ed654d"},{"name":"Azul","value":"#316fc0"},{"name":"Preto","value":"#1f434c"},{"name":"Verde","value":"#32a47b"},{"name":"Amarelo","value":"#e5a13d"},{"name":"Roxo","value":"#a378c8"},{"name":"Laranja","value":"#f17a32"},{"name":"Azul-claro","value":"#26a9e0"},{"name":"Rosa","value":"#e66da9"},{"name":"Branco","value":"#f5f7f5"},{"name":"Marrom","value":"#8e603f"},{"name":"Cinza","value":"#8895a1"},{"name":"Verde-limão","value":"#a7be4c"},{"name":"Azul-marinho","value":"#253c80"},{"name":"Turquesa","value":"#19b5ac"},{"name":"Vinho","value":"#8f3d63"},{"name":"Dourado","value":"#d0ad55"},{"name":"Lilás","value":"#c6a5f0"}];
const COLORS=COLOR_CHOICES.map(c=>c.value);
let state={parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:COLORS[0],selected:null,startPort:null,inspector:'parts',completed:false,bends:[],selectedWire:null};
let zoom=1,panX=0,panY=0,gesture=null,history=[],future=[],toastTimer=0,previewPoint=null,previewSnapPort=null,drawPending=false;
let spaceHeld=false;
let recentTap=null,doubleTapRestore=null,copiedKind=null,simulationRunning=false;
let wireAlignment=null;
let partDragAlignment=null; // Guias transitórias ao mover peças
let selectedBend=null; // quadrado isolado do jumper, não persiste.
const selectedParts=new Set(); // seleção temporária múltipla, não altera o projeto salvo
let selectionToolActive=false;
let wireTipActive=false,pendingAlignment=null;
// Alça de reconexão temporária: o fio original permanece salvo até confirmar outro pino.
let reconnectPending=null;
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
  // Clone the existing circuit only once, for visual comparison.
  // All subsequent edits made on the preview remain in its own storage key.
  if(STORAGE_KEY!=='tinkerpet-v2'&&localStorage.getItem(STORAGE_KEY)===null){
   const current=localStorage.getItem('tinkerpet-v2');
   if(current)localStorage.setItem(STORAGE_KEY,current);
  }
  // Cada aba de editor lê exclusivamente o circuito apontado por sua URL.
  // O antigo tinkerpet-v2 era global e causava a troca de circuitos no F5.
  const s=IS_PROJECT_EDITOR?activeCircuitFromLibrary():JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(!s||!Array.isArray(s.parts)||!Array.isArray(s.wires))return;
  const names=new Set();
  state.parts=s.parts.filter(p=>p&&byId[p.id]&&!names.has(p.id)&&names.add(p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({id:p.id,kind:byId[p.id].kind,x:p.x,y:p.y,view:byId[p.id].kind==='motor'&&p.view==='side'?'side':'front',rotation:normalizePartRotation(p.rotation),flipped:p.flipped===true}));
  state.wires=s.wires.filter(w=>w&&allPorts.has(w.a)&&allPorts.has(w.b)&&(w.a!==w.b||!!w.loose)&&exists(w.a.split('.')[0])&&exists(w.b.split('.')[0])).slice(0,80).map(w=>({a:w.a,b:w.b,color:COLORS.includes(w.color)?w.color:COLORS[0],via:Array.isArray(w.via)?w.via.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,48).map(p=>({x:p.x,y:p.y})):[],manual:w.manual===true,loose:(['a','b'].includes(w.loose?.end)&&Number.isFinite(w.loose?.point?.x)&&Number.isFinite(w.loose?.point?.y))?{end:w.loose.end,point:{x:w.loose.point.x,y:w.loose.point.y}}:null}));
  if(Number.isFinite(s.voltage))state.voltage=limit(s.voltage,3,6);
  if(s.switches)state.switches={s1:!!s.switches.s1,s2:!!s.switches.s2};
  if(COLORS.includes(s.wireColor))state.wireColor=s.wireColor;

  // Recupera os trajetos manuais guardados antes do alinhamento automático.
  // Mantém fios novos e a posição atual dos componentes.
  if(Array.isArray(s.autoWireBackup)){
   for(const w of state.wires){
    const old=s.autoWireBackup.find(p=>p&&p.a===w.a&&p.b===w.b);
    if(!old||!Array.isArray(old.via))continue;
    w.via=old.via.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x,y:p.y}));
    w.manual=old.manual===true;
    const a=getPortPos(w.a),b=getPortPos(w.b),oa=old.originA,ob=old.originB;
    if(a&&b&&oa&&ob){
     const dx=a.x-oa.x,dy=a.y-oa.y,ex=b.x-ob.x,ey=b.y-ob.y;
     if(Math.abs(dx-ex)<1&&Math.abs(dy-ey)<1)for(const p of w.via){p.x+=dx;p.y+=dy;}
     else{
      const first=w.via[0],last=w.via.at(-1);
      if(first){if(Math.abs(first.x-oa.x)<2)first.x+=dx;if(Math.abs(first.y-oa.y)<2)first.y+=dy;}
      if(last){if(Math.abs(last.x-ob.x)<2)last.x+=ex;if(Math.abs(last.y-ob.y)<2)last.y+=ey;}
     }
    }
   }
  }
  enforceManualMode();
 }catch(err){console.warn('Progresso indisponível',err);}
}
function persist(){
 const circuit={parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches,wireColor:state.wireColor};
 try{
  if(IS_PROJECT_EDITOR){
   // Nunca grava no circuito global: lê a biblioteca mais recente para
   // preservar os outros projetos e os metadados alterados em outras abas.
   if(!EDITOR_PROJECT_ID){Q('savedIndicator').textContent='● Abra um circuito em Meus circuitos';return;}
   const lib=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'null');
   const project=Array.isArray(lib?.projects)?lib.projects.find(p=>p.id===EDITOR_PROJECT_ID):null;
   if(!project){Q('savedIndicator').textContent='● Circuito não encontrado';return;}
   project.circuit=JSON.parse(JSON.stringify(circuit));
   project.updatedAt=Date.now();
   localStorage.setItem(LIBRARY_KEY,JSON.stringify(lib));
  }else localStorage.setItem(STORAGE_KEY,JSON.stringify(circuit));
  Q('savedIndicator').textContent='● Salvo automaticamente';
 }catch(e){console.warn('Não foi possível salvar este circuito',e);Q('savedIndicator').textContent='● Não salvo';}
}
// Cada curva e cada origem de jumper entram na linha do tempo de ações.
function historyState(){return JSON.stringify({
 parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches,
 startPort:state.startPort,bends:state.bends
});}
function updateHistoryButtons(){
 const undoBtn=Q('undoBtn'),redoBtn=Q('redoBtn'),delBtn=Q('deleteBtn');
 const rotateBtn=Q('rotateBtn'),flipBtn=Q('flipBtn'),p=byPart(state.selected);
 // O controle permanece acionável sem peça para orientar a seleção,
 // sem parecer permanentemente quebrado ou apagado na barra.
 if(rotateBtn){rotateBtn.disabled=selectedParts.size>1;rotateBtn.title=selectedParts.size>1?'Girar: selecione uma peça por vez':p?'Girar '+partName(p.id)+' 90° (R)':'Selecione um componente para girar 90°';rotateBtn.setAttribute('aria-label',rotateBtn.title);}
 if(flipBtn){
  flipBtn.disabled=!p||selectedParts.size>1;
  flipBtn.title=selectedParts.size>1?'Inverter: selecione uma peça por vez':p?'Inverter esquerda/direita de '+partName(p.id)+' (I)':'Selecione um componente para inverter esquerda e direita';
  flipBtn.setAttribute('aria-label',flipBtn.title);
  flipBtn.setAttribute('aria-pressed',String(!!p?.flipped));
 }
 updateMultiSelectionTool();
 if(undoBtn)undoBtn.disabled=history.length===0;
 if(redoBtn)redoBtn.disabled=future.length===0;
 if(delBtn){
  const wireSelected=Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire];
  const bendSelected=selectedBend&&state.wires[selectedBend.index]&&selectedBend.index===state.selectedWire;
  delBtn.disabled=!byPart(state.selected)&&!wireSelected&&!bendSelected;
  delBtn.title=bendSelected?'Excluir só este ponto de curva':wireSelected?'Excluir fio selecionado':byPart(state.selected)?'Excluir '+partName(state.selected):'Selecione uma peça, fio ou curva';
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
 enforceManualMode();
 previewPoint=null;previewSnapPort=null;pendingAlignment=null;gesture=null;reconnectPending=null;selectedBend=null;partDragAlignment=null;
 selectedParts.clear();updateMultiSelectionTool();
 renderAll();updateHistoryButtons();
}
function undo(){
 if(reconnectPending){cancelReconnect();message('Alteração do fio cancelada.');return;}
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
function normalizePartRotation(v){return Number.isFinite(v)?((Math.round(v/90)*90%360)+360)%360:0;}
function rotateVector(d,v){
 const a=normalizePartRotation(v);
 return a===90?{x:-d.y,y:d.x}:a===180?{x:-d.x,y:-d.y}:a===270?{x:d.y,y:-d.x}:{x:d.x,y:d.y};
}
function partBounds(p){
 const d=partLayout(p),side=normalizePartRotation(p.rotation)%180===90;
 return side?{x:p.x+(d.w-d.h)/2,y:p.y+(d.h-d.w)/2,w:d.h,h:d.w}:{x:p.x,y:p.y,w:d.w,h:d.h};
}
function message(msg,toast=false){Q('statusText').textContent=msg;if(toast){const el=Q('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}}
function assemblyMode(){return exists('s1')||exists('s2')?'switched':'direct';}
function requiredParts(){return assemblyMode()==='switched'?9:7;}
// Gabarito com gangorras: cada fonte interrompe SOMENTE seu positivo.
// Chave 1: bateria 9 V (+) → terminal 1 → terminal 2 → IN+ do LM2596.
// Chave 2: suporte AA (+) → terminal 1 → terminal 2 → + da MX1508.
// Negativos: 9 V (-) → LM IN-; AA (-) → MX1508 GND → ESP32 GND.
// O terceiro contato LEDG não faz parte das ligações exigidas.
// Detecta qual gangorra pertence a qual fonte pelas ligações efetuadas.
// Os dois contatos de comutação são reversíveis, mas LEDG não participa.
function switchPositiveConnections(from,to,id,reversed){
 const input=reversed?'OUT':'IN',output=reversed?'IN':'OUT';
 return [[from,id+'.'+input],[id+'.'+output,to]];
}
const SWITCH_WIRING_VARIANTS=(()=>{
 const variants=[];
 for(const espId of ['s1','s2']){
  const motorId=espId==='s1'?'s2':'s1';
  for(const espReversed of [false,true])for(const motorReversed of [false,true]){
   const esp=switchPositiveConnections('b1.POS','lm.INP',espId,espReversed);
   const motor=switchPositiveConnections('b2.POS','drv.VCC',motorId,motorReversed);
   variants.push({espId,motorId,esp,motor,pairs:[...esp,...motor]});
  }
 }
 return variants;
})();
// Uma gangorra só ganha a função de LM2596 ou de ponte H pelas
// conexões que o aluno efetivamente fez. Até lá, TODAS as atribuições
// ainda possíveis devem ser tratadas como válidas. Não fixar s1/s2
// antecipadamente, nem supor uma ordem para adicionar fios.
function switchWiringCandidates(){
 const placed=state.wires.filter(w=>!w.loose&&
  [w.a,w.b].some(p=>p.startsWith('s1.')||p.startsWith('s2.')));
 return SWITCH_WIRING_VARIANTS.filter(variant=>{
  const allowed=new Set(variant.pairs.map(([a,b])=>electricalKey(a,b)));
  return placed.every(w=>allowed.has(electricalKey(w.a,w.b)));
 });
}
function selectedSwitchConnections(){
 const compatible=switchWiringCandidates();
 if(compatible.length)return compatible[0];
 // Quando já há uma ligação contraditória, mantém a melhor hipótese
 // apenas para indicar o que falta, sem aceitar o conflito como correto.
 const actual=new Set(state.wires.filter(w=>!w.loose).map(w=>electricalKey(w.a,w.b)));
 let best=SWITCH_WIRING_VARIANTS[0],score=-1;
 for(const variant of SWITCH_WIRING_VARIANTS){
  const matches=variant.pairs.filter(([a,b])=>actual.has(electricalKey(a,b))).length;
  if(matches>score){score=matches;best=variant;}
 }
 return best;
}
// Os dois canais da MX1508 são equivalentes para motores DC.
// A posição visual de um motor na bancada e a ordem em que foi criado
// não determinam se ele precisa ficar obrigatoriamente no canal A ou B.
// Inverter os dois contatos do mesmo motor somente inverte seu giro.
const MOTOR_WIRING_VARIANTS=(()=>{
 const alternatives=[];
 for(const swap of [false,true])for(const reverseLeft of [false,true])for(const reverseRight of [false,true]){
  const wireMotor=(id,channel,reverse)=>{
   const ports=channel==='A'?['drv.OUT1','drv.OUT2']:['drv.OUT3','drv.OUT4'];
   return [[ports[0],id+'.'+(reverse?'B':'A')],[ports[1],id+'.'+(reverse?'A':'B')]];
  };
  alternatives.push([
   ...wireMotor('ml',swap?'B':'A',reverseLeft),
   ...wireMotor('mr',swap?'A':'B',reverseRight)
  ]);
 }
 return alternatives;
})();
function selectedMotorConnections(){
 const actual=new Set(state.wires.filter(w=>!w.loose).map(w=>electricalKey(w.a,w.b)));
 let best=MOTOR_WIRING_VARIANTS[0],score=-1;
 for(const variant of MOTOR_WIRING_VARIANTS){
  const matches=variant.filter(([a,b])=>actual.has(electricalKey(a,b))).length;
  if(matches>score){best=variant;score=matches;}
 }
 return best;
}
// Os quatro sinais da MX1508 podem usar qualquer permutação dos GPIOs
// 27, 26, 32 e 18, um GPIO exclusivo para cada IN.
const CONTROL_GPIO=['esp.D27','esp.D26','esp.D32','esp.D18'];
const CONTROL_INPUTS=['IN1','IN2','IN3','IN4'];
function selectedControlConnections(){
 const used=new Set();
 return CONTROL_INPUTS.map((input,i)=>{
  const target='drv.'+input;
  const matching=state.wires.filter(w=>!w.loose).map(w=>{
   if(w.a===target&&CONTROL_GPIO.includes(w.b))return w.b;
   if(w.b===target&&CONTROL_GPIO.includes(w.a))return w.a;
   return null;
  }).filter(Boolean);
  const picked=matching.find(p=>!used.has(p));
  if(picked)used.add(picked);
  // Faltando conexão, use o primeiro GPIO não reservado como expectativa.
  // Não reserve pinos para INs ainda não conectados.
  return [picked||CONTROL_GPIO.find(p=>!used.has(p))||CONTROL_GPIO[i],target];
 });
}
function expectedConnections(){
 const baseline=assemblyMode()==='switched'
  ?[...COMMON_CONNECTIONS,...selectedSwitchConnections().pairs]:DIRECT_CONNECTIONS;
 return baseline.filter(([a,b])=>!a.startsWith('drv.OUT')&&!CONTROL_INPUTS.some(pin=>b==='drv.'+pin))
  .concat(selectedControlConnections(),selectedMotorConnections());
}
function acceptedConnectionSet(){
 const allowed=new Set(expectedConnections().map(([a,b])=>electricalKey(a,b)));
 if(assemblyMode()==='switched'){
  // Enquanto as duas gangorras ainda estão sendo ligadas, não mostrar
  // erro por escolher a segunda como chave do LM2596 (ou vice-versa).
  // Nunca incluir ligações impossíveis se não houver hipótese compatível.
  for(const variant of switchWiringCandidates()){
   for(const [a,b] of variant.pairs)allowed.add(electricalKey(a,b));
  }
 }
 return allowed;
}
function countGood(){
 const expected=new Set(expectedConnections().map(([a,b])=>electricalKey(a,b)));
 return new Set(state.wires.filter(w=>!w.loose&&expected.has(electricalKey(w.a,w.b))).map(w=>electricalKey(w.a,w.b))).size;
}
function mistakes(){const allowed=acceptedConnectionSet();return state.wires.filter(w=>!!w.loose||!allowed.has(electricalKey(w.a,w.b)));}
function missing(){const wired=new Set(state.wires.filter(w=>!w.loose).map(w=>electricalKey(w.a,w.b)));return expectedConnections().filter(([a,b])=>!wired.has(electricalKey(a,b)));}
function mistakeExplanation(w){
 if(w.loose)return 'O jumper tem uma ponta solta. Arraste a bolinha até o pino correto ou remova o fio.';
 if([w.a,w.b].some(p=>p==='s1.LEDG'||p==='s2.LEDG'))
  return 'O terceiro terminal LED− da gangorra é apenas da luz indicadora e não alimenta o ESP32. Use os contatos 1 e 2 para ligar ou desligar a alimentação.';
 if(CONTROL_INPUTS.some(input=>w.a==='drv.'+input||w.b==='drv.'+input))
  return 'IN1 a IN4 aceitam GPIOs de saída distintos do ESP32. Não use VIN, GND, EN, GPIO34/35, VP ou VN; evite compartilhar o mesmo GPIO entre entradas.';
 return 'Revise o fio '+portName(w.a)+' → '+portName(w.b)+'. Cada gangorra deve ligar somente uma fonte ao módulo correspondente; os contatos 1 e 2 são reversíveis.';
}
function ready(){
 const switched=assemblyMode()==='switched';
 return state.parts.length===requiredParts()&&missing().length===0&&mistakes().length===0&&
 Math.abs(state.voltage-5)<.01&&!voltageAdjusting&&(!switched||(state.switches.s1&&state.switches.s2));
}
// Modelo pedagógico: cada circuito acende e funciona somente quando recebe
// alimentação e sinais por um caminho conectado. Não é SPICE nem execução do ESP32.
function powerStatus(){
 const has=(a,b)=>state.wires.some(w=>!w.loose&&electricalKey(w.a,w.b)===electricalKey(a,b));
 const switched=assemblyMode()==='switched';
 // A chave comuta apenas o positivo de cada fonte. Todos os GND são comuns.
 const switchWiring=selectedSwitchConnections();
 const espPositive=switched
  ?exists(switchWiring.espId)&&state.switches[switchWiring.espId]&&
   switchWiring.esp.every(([a,b])=>has(a,b))
  :has('b1.POS','lm.INP');
 const motorPositive=switched
  ?exists(switchWiring.motorId)&&state.switches[switchWiring.motorId]&&
   switchWiring.motor.every(([a,b])=>has(a,b))
  :has('b2.POS','drv.VCC');
 const buck=exists('b1')&&exists('lm')&&espPositive&&has('b1.NEG','lm.INN');
 const esp=buck&&exists('esp')&&Math.abs(state.voltage-5)<.01
  &&has('lm.OUTP','esp.VIN')&&has('lm.OUTN','esp.GND');
 const driver=exists('b2')&&exists('drv')&&motorPositive&&has('b2.NEG','drv.GND');
 const common=esp&&has('esp.GND','drv.GND');
 const assigned=selectedMotorConnections();
 const motorOn=(id)=>{
  const edges=assigned.filter(([,port])=>port.startsWith(id+'.'));
  if(edges.length!==2||!edges.every(([a,b])=>has(a,b)))return false;
  const channel=edges[0][0].startsWith('drv.OUT1')||edges[0][0].startsWith('drv.OUT2')?'A':'B';
  const controls=selectedControlConnections();
  const control=(channel==='A'?controls.slice(0,2):controls.slice(2))
   .every(([a,b])=>has(a,b));
  return driver&&common&&exists(id)&&control;
 };
 return {buck,esp,driver,common,motors:{ml:motorOn('ml'),mr:motorOn('mr')}};
}
function updateLiveSimulation(){
 const live=powerStatus(),enabled=simulationRunning;
 Q('buildPanel').classList.toggle('simulation-active',enabled);
 const sim=Q('checkBtn');sim.classList.toggle('is-running',enabled);
 sim.setAttribute('aria-pressed',String(enabled));
 Q('simLabel').textContent=enabled?'Parar simulação':'Iniciar simulação';
 Q('simIcon').textContent=enabled?'■':'▶';
 Q('openTrackBtn').hidden=true; // Pista reservada para etapa futura.
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
   const isEspSwitch=id===selectedSwitchConnections().espId;
   const source=isEspSwitch?live.buck:live.driver;
   const negative=isEspSwitch?'b1.NEG':'b2.NEG';
   const indicator=enabled&&source&&state.wires.some(w=>!w.loose&&electricalKey(w.a,w.b)===electricalKey(negative,id+'.LEDG'));
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
    const battery=p.id===selectedSwitchConnections().espId?'b1':'b2';
    const ledConnected=state.wires.some(w=>!w.loose&&electricalKey(w.a,w.b)===electricalKey(battery+'.NEG',p.id+'.LEDG'));
    card.dataset.indicator=state.switches[p.id]&&ledConnected?'on':'off';
  }
  card.className='part'+(state.selected===p.id||selectedParts.has(p.id)?' selected':'')+(selectedParts.has(p.id)?' multi-selected':'');
  card.dataset.part=p.id;card.dataset.kind=p.kind;card.style.left=p.x+'px';card.style.top=p.y+'px';
  if(selectedParts.has(p.id)){
   const badge=document.createElement('span');badge.className='component-selection-badge';
   badge.textContent='✓ '+(Array.from(selectedParts).indexOf(p.id)+1);
   badge.title=partName(p.id)+' selecionado';badge.setAttribute('aria-hidden','true');card.append(badge);
  }
  card.style.setProperty('--part-w',layout.w+'px');card.style.setProperty('--part-h',layout.h+'px');
  card.style.transform='rotate('+normalizePartRotation(p.rotation)+'deg) scaleX('+(p.flipped?'-1':'1')+')';
  card.style.transformOrigin='50% 50%';
  card.dataset.rotation=String(normalizePartRotation(p.rotation));card.dataset.flipped=String(!!p.flipped);
  card.style.zIndex=selectedParts.has(p.id)?'6':state.selected===p.id?'5':'3';
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
   const id=p.id+'.'+code,connected=state.wires.some(w=>(w.loose?.end!=='a'&&w.a===id)||(w.loose?.end!=='b'&&w.b===id)),wrong=mistakes().some(w=>(w.loose?.end!=='a'&&w.a===id)||(w.loose?.end!=='b'&&w.b===id));
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
 const selected=COLOR_CHOICES.find(c=>c.value===state.wireColor)||COLOR_CHOICES[0];
 const preview=Q('wireColorPreview');
 if(preview)preview.style.background=selected.value;
 const trigger=Q('wireColorButton');
 if(trigger)trigger.title='Cor do fio: '+selected.name+'. Clique para escolher outra.';
 // O menu usa bolinhas em grade, sem nomes visíveis, e fica FORA da barra.
 const menu=Q('wireColorMenu');
 if(menu){
  menu.replaceChildren();
  COLOR_CHOICES.forEach(({name,value})=>{
   const button=document.createElement('button');button.type='button';
   button.className='wire-color-choice'+(selected.value===value?' active':'');
   button.style.setProperty('--choice-color',value);
   button.dataset.color=value;button.title=name;
   button.setAttribute('aria-label',name);
   button.setAttribute('aria-pressed',String(selected.value===value));
   const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');
   button.append(dot);menu.append(button);
  });
 }
 // Preserva a paleta legada, oculta, para compatibilidade com outras telas.
 const legacy=Q('colorPalette');
 if(legacy)legacy.replaceChildren();
}
function positionWireColorMenu(){
 const button=Q('wireColorButton'),menu=Q('wireColorMenu');
 if(!button||!menu||menu.hidden)return;
 const box=button.getBoundingClientRect(),gap=8;
 const width=208,maxH=Math.min(320,window.innerHeight-20);
 const estimatedHeight=210;
 const top=box.bottom+gap+estimatedHeight>window.innerHeight-8&&box.top>estimatedHeight+gap
  ?box.top-estimatedHeight-gap:box.bottom+gap;
 const left=Math.max(8,Math.min(window.innerWidth-width-8,box.left));
 menu.style.left=left+'px';
 menu.style.top=Math.max(8,Math.min(top,window.innerHeight-48))+'px';
 menu.style.maxHeight=maxH+'px';
}
function closeWireColorMenu(restoreFocus=false){
 const menu=Q('wireColorMenu'),button=Q('wireColorButton');if(!menu||!button)return;
 menu.hidden=true;button.setAttribute('aria-expanded','false');
 if(restoreFocus)button.focus();
}
function toggleWireColorMenu(){
 const menu=Q('wireColorMenu'),button=Q('wireColorButton');
 if(!menu||!button)return;
 const open=menu.hidden;menu.hidden=!open;
 button.setAttribute('aria-expanded',String(open));
 if(open)positionWireColorMenu();
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
 const rotate=document.createElement('button');rotate.type='button';rotate.className='inspect-action';
 rotate.dataset.rotatePart=p.id;rotate.textContent='↻ Girar 90° · '+normalizePartRotation(p.rotation)+'°';
 rotate.setAttribute('aria-label','Girar '+partName(p.id)+' 90 graus');actions.append(rotate);
 const flip=document.createElement('button');flip.type='button';flip.className='inspect-action';
 flip.dataset.flipPart=p.id;flip.textContent='↔ Inverter esquerda/direita'+(p.flipped?' · invertido':'');
 flip.setAttribute('aria-label','Inverter esquerda e direita de '+partName(p.id));actions.append(flip);
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
  const names=document.createElement('div');names.className='wire-names';names.textContent=(w.loose?.end==='a'?'Ponta solta':portName(w.a))+' → '+(w.loose?.end==='b'?'Ponta solta':portName(w.b))+(w.via&&w.via.length?' · '+w.via.length+' curva(s)':'')+(!w.loose&&acceptedConnectionSet().has(electricalKey(w.a,w.b))?' · ✓':w.loose?' · Ponta solta':' · Rever');
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
 const total=countGood(),errors=mistakes().length,expected=expectedConnections();
 const required=requiredParts(),partsDone=state.parts.length,switched=assemblyMode()==='switched';
 const inAssembly=partsDone<required;
 const progress=inAssembly?partsDone/required:total/expected.length;
 Q('progressBar').style.width=Math.round(progress*100)+'%';
 Q('connectionsCount').textContent=inAssembly?partsDone+'/'+required:total+'/'+expected.length;
 Q('progressCaption').textContent=inAssembly?'Componentes':'Conexões corretas';
 const wiringComplete=!inAssembly&&!errors&&missing().length===0;
 const voltageValid=Math.abs(state.voltage-5)<.01;
 const switchesValid=!switched||(state.switches.s1&&state.switches.s2);
 const fullyValid=wiringComplete&&voltageValid&&switchesValid&&!voltageAdjusting;
 const badge=Q('validationBadge');
 badge.className='validation-badge'+(fullyValid?' ok':errors||wiringComplete&&!voltageValid?' error':'');
 badge.textContent=fullyValid?'✓ Montagem concluída ('+(switched?'com gangorras':'sem gangorras')+')':
  wiringComplete&&voltageAdjusting?'Ajustando LM2596… solte para conferir os 5,0 V':
  wiringComplete&&!voltageValid?'⚠ Ajuste o LM2596 para 5,0 V (atual: '+state.voltage.toFixed(1).replace('.',',')+' V)':
  wiringComplete&&!switchesValid?'Ative as duas gangorras para concluir':
  errors?(mistakes().some(w=>[w.a,w.b].some(p=>p.endsWith('.LEDG')))?errors+' fio(s) a revisar · LED− não é saída':errors+' ligação(ões) a revisar'):
  inAssembly?'Continue adicionando componentes':'Faltam '+missing().length+' ligações';
 const invalid=mistakes(),pending=missing();
 badge.title=invalid.length
  ?invalid.map(w=>w.loose?'Jumper com ponta solta: mova a bolinha até um pino.':'Fio incorreto: '+portName(w.a)+' → '+portName(w.b)).join('\n')
   +(pending.length?'\nFaltam '+pending.length+' ligações corretas.':'')
  :pending.length?'Faltam '+pending.length+' ligações. Clique no progresso para saber a próxima.':
   (voltageAdjusting?'Solte a regulagem do LM2596 e aguarde a verificação dos 5,0 V.':!voltageValid?'Ajuste o LM2596 para 5,0 V. Valor atual: '+state.voltage.toFixed(1)+' V.':!switchesValid?'Ative as duas gangorras.':'Todas as ligações e a tensão estão corretas.');
 const progressDetails=Q('editorToolbarProgress');
 if(progressDetails)progressDetails.title=badge.title;
 const missionTitle=Q('missionTitle'),missionText=Q('missionText');
 if(!partsDone){Q('stepNumber').textContent='01';missionTitle.textContent='Sua bancada está vazia';missionText.textContent='Monte a versão direta com 7 peças ou adicione duas gangorras para a versão com chaves (9 peças).';}
 else if(inAssembly){Q('stepNumber').textContent='01';missionTitle.textContent='Monte seu conjunto de peças';missionText.textContent='Modo '+(switched?'com gangorras':'sem gangorras')+': você colocou '+partsDone+' de '+required+' peças.';}
 else if(missing().length||errors){Q('stepNumber').textContent='02';missionTitle.textContent='Conecte os terminais';missionText.textContent=total+' das '+expected.length+' ligações corretas no modo '+(switched?'com gangorras':'direto')+'. Suporte (−) → GND da ponte H → GND do ESP32. As gangorras interrompem apenas os positivos.';}
 else if(Math.abs(state.voltage-5)>.01||(switched&&(!state.switches.s1||!state.switches.s2))){Q('stepNumber').textContent='03';missionTitle.textContent='Ligações concluídas! Ative a alimentação';missionText.textContent='Ajuste a saída do LM2596 para 5,0 V'+(switched?' e ligue as duas gangorras.':'.');}
 else {Q('stepNumber').textContent='04';missionTitle.textContent='Circuito completo!';missionText.textContent='Parabéns! Montagem '+(switched?'com':'sem')+' gangorras validada. Inicie a simulação e abra a pista.';}
}
// Celebra somente quando uma edição transforma um circuito incompleto em
// completo. A primeira renderização após F5 estabelece o estado inicial e
// nunca abre a mensagem. Toda edição posterior pode rearmar a celebração.
// Os 5,0 V só são confirmados depois de soltar o controle e estabilizar.
let voltageAdjusting=false,voltageSettleTimer=0;
const VOLTAGE_SETTLE_MS=450;
let completionKnown=false,completionWasValid=false;
const COMPLETION_DURATION_MS=10000;
let completionCloseTimer=0,completionCountTimer=0,completionLastFocus=null;
function dismissCompletionCelebration(){
 const dialog=Q('completionDialog');
 clearTimeout(completionCloseTimer);clearInterval(completionCountTimer);
 completionCloseTimer=0;completionCountTimer=0;
 if(dialog?.open)dialog.close();
 if(completionLastFocus?.isConnected && typeof completionLastFocus.focus==='function'){
  try{completionLastFocus.focus({preventScroll:true});}catch{completionLastFocus.focus();}
 }
 completionLastFocus=null;
}
function showCompletionCelebration(){
 const dialog=Q('completionDialog');
 if(!dialog||dialog.open)return;
 const label=Q('completionConnections');
 if(label)label.textContent=expectedConnections().length+' conexões corretas';
 const mode=Q('completionMode');
 if(mode)mode.textContent=assemblyMode()==='switched'?'Montagem com gangorras':'Montagem sem gangorras';
 const confetti=Q('completionConfetti');
 if(confetti){
  confetti.replaceChildren();
  const colors=['#16a394','#1b7ab7','#f3bd50','#d8a5e9','#f18670'];
  // Confetes caem em toda a área desfocada, atrás do cartão central.
  // Fases diferentes mantêm uma chuva leve durante os 10 segundos.
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  for(let i=0;i<(reducedMotion?0:56);i++){
   const piece=document.createElement('span');
   piece.className='completion-confetti-piece';
   piece.style.setProperty('--c',colors[i%colors.length]);
   piece.style.setProperty('--x',(2+(i*43)%96)+'%');
   piece.style.setProperty('--delay',(-((i*23)%67)/10)+'s');
   piece.style.setProperty('--duration',(4.7+(i%7)*.47)+'s');
   piece.style.setProperty('--side',((i%2?-1:1)*(22+(i*13)%85))+'px');
   piece.style.setProperty('--turn',((i%2?-1:1)*(180+(i*71)%540))+'deg');
   piece.style.setProperty('--w',(4+i%4)+'px');
   piece.style.setProperty('--h',(7+(i*3)%7)+'px');
   piece.style.setProperty('--round',i%8===0?'50%':'2px');
   confetti.append(piece);
  }
 }
 const ring=Q('completionTimerRing');
 if(ring){ring.style.animation='none';void ring.getBoundingClientRect();ring.style.animation='';}
 const count=Q('completionSeconds');
 if(count)count.textContent=String(COMPLETION_DURATION_MS/1000);
 completionLastFocus=document.activeElement;
 try{dialog.showModal()}catch{return;}
 Q('completionClose')?.focus({preventScroll:true});
 const end=performance.now()+COMPLETION_DURATION_MS;
 clearTimeout(completionCloseTimer);clearInterval(completionCountTimer);
 completionCountTimer=setInterval(()=>{
  if(!dialog.open){clearInterval(completionCountTimer);return;}
  if(count)count.textContent=String(Math.max(0,Math.ceil((end-performance.now())/1000)));
 },100);
 completionCloseTimer=setTimeout(dismissCompletionCelebration,COMPLETION_DURATION_MS);
}
function syncCompletionCelebration(){
 // Nunca celebrar enquanto o dedo/mouse ainda está ajustando a tensão.
 if(voltageAdjusting)return;
 // A exigência de 5 V e todas as ligações certas faz parte de ready().
 const correct=ready();
 if(!completionKnown){
  completionKnown=true;completionWasValid=correct;return;
 }
 if(!completionWasValid&&correct)showCompletionCelebration();
 completionWasValid=correct;
}
function refresh(){
 renderCatalog();renderParts();renderColors();renderInspector();renderProgress();
 persist();updateTrackLock();syncCompletionCelebration();
}
function renderAll(){refresh();}
function addPart(kind,x,y){
 if(reconnectPending)cancelReconnect();
 const t=byKind[kind];if(!t)return false;
 const id=t.ids.find(id=>!exists(id));if(!id){message('Você já colocou todas as peças deste tipo.',true);return false;}
 snapshot();
 selectedParts.clear();selectedParts.add(id);
 state.parts.push({id,kind,x:Math.round(x),y:Math.round(y),view:'front',rotation:0,flipped:false});
 state.selected=id;state.selectedWire=null;selectedBend=null;state.inspector='parts';state.completed=false;state.startPort=null;refresh();
 message(partName(id)+' adicionado. Arraste pela imagem; toque nos contatos para ligar os fios.',true);
 return true;
}
// Gira em passos de 90° mantendo o centro visual e os fios nos mesmos pinos.
function rotatePart(id){
 const p=byPart(id);if(!p)return false;
 if(reconnectPending)cancelReconnect();
 if(state.startPort)cancelPendingWire();
 const attached=state.wires.filter(w=>(w.loose?.end!=='a'&&w.a.split('.')[0]===id)||(w.loose?.end!=='b'&&w.b.split('.')[0]===id));
 const previous=new Map(attached.map(w=>[w,{a:getPortPos(w.a),b:getPortPos(w.b)}]));
 snapshot();
 p.rotation=(normalizePartRotation(p.rotation)+90)%360;
 for(const w of attached){
  if(!w.manual||!w.via?.length)continue;
  const old=previous.get(w),via=w.via.map(point=>({...point}));
  if(w.a.split('.')[0]===id){
   const before=old.a,after=getPortPos(w.a),first=via[0];
   if(Math.abs(before.x-first.x)<2)first.x=Math.round(after.x);
   else if(Math.abs(before.y-first.y)<2)first.y=Math.round(after.y);
  }
  if(w.b.split('.')[0]===id){
   const before=old.b,after=getPortPos(w.b),last=via.at(-1);
   if(Math.abs(before.x-last.x)<2)last.x=Math.round(after.x);
   else if(Math.abs(before.y-last.y)<2)last.y=Math.round(after.y);
  }
  w.via=via;
 }
 
 state.selected=id;state.selectedWire=null;selectedBend=null;state.inspector='parts';state.completed=false;refresh();
 message(partName(id)+' girado para '+p.rotation+'°. Conexões mantidas.',true);
 return true;
}
function rotateSelectedPart(){
 const p=byPart(state.selected);
 if(!p){message('Selecione um componente para girar.',true);return false;}
 return rotatePart(p.id);
}
// Espelha a peça visualmente na horizontal local, sem trocar os nomes dos pinos
// nem apagar conexões já criadas. Reverte com outro clique ou Ctrl+Z.
function flipPart(id){
 const p=byPart(id);if(!p||selectedParts.size>1)return false;
 if(reconnectPending)cancelReconnect();
 if(state.startPort)cancelPendingWire();
 const attached=state.wires.filter(w=>(w.loose?.end!=='a'&&w.a.split('.')[0]===id)||(w.loose?.end!=='b'&&w.b.split('.')[0]===id));
 const previous=new Map(attached.map(w=>[w,{a:getPortPos(w.a),b:getPortPos(w.b)}]));
 snapshot();
 p.flipped=!p.flipped;
 for(const w of attached){
  if(!w.manual||!w.via?.length)continue;
  const old=previous.get(w),via=w.via.map(point=>({...point}));
  if(w.a.split('.')[0]===id&&old.a){
   const after=getPortPos(w.a),first=via[0];
   if(Math.abs(old.a.x-first.x)<2)first.x=Math.round(after.x);
   else if(Math.abs(old.a.y-first.y)<2)first.y=Math.round(after.y);
  }
  if(w.b.split('.')[0]===id&&old.b){
   const after=getPortPos(w.b),last=via.at(-1);
   if(Math.abs(old.b.x-last.x)<2)last.x=Math.round(after.x);
   else if(Math.abs(old.b.y-last.y)<2)last.y=Math.round(after.y);
  }
  w.via=via;
 }
 state.selected=id;state.selectedWire=null;selectedBend=null;state.inspector='parts';
 state.completed=false;refresh();
 message(partName(id)+(p.flipped?' invertido para o outro lado.':' voltou ao lado original.')+' Ligações preservadas.',true);
 return true;
}
function flipSelectedPart(){
 const p=byPart(state.selected);
 if(!p||selectedParts.size>1){message('Selecione uma peça por vez para inverter.',true);return false;}
 return flipPart(p.id);
}
function removePart(id,skipSnapshot=false){
 if(!exists(id))return;
 if(reconnectPending)cancelReconnect();
 if(!skipSnapshot)snapshot();
 selectedBend=null;selectedParts.delete(id);
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
 if(reconnectPending){finishReconnect(id);return;}
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
  message(acceptedConnectionSet().has(electricalKey(first,id))?'✓ Fio sólido conectado com '+via.length+' curva(s).':'Fio criado, mas os terminais precisam ser revisados.',!acceptedConnectionSet().has(electricalKey(first,id)));
 }
 state.completed=false;refresh();
}
// Ao selecionar uma curva, o botão Excluir atua só no quadrado ativo.
function selectBend(index,vertex){
 const w=state.wires[index],pts=w&&wirePoints(w);
 if(!pts||vertex<=0||vertex>=pts.length-1)return false;
 selectedBend={index,vertex};state.selectedWire=index;state.selected=null;state.inspector='wires';
 state.wireColor=w.color;renderParts();renderColors();renderInspector();updateHistoryButtons();requestDraw();
 message('Quadrado selecionado. Pressione Delete ou Excluir para remover só este ponto.',true);
 return true;
}
function removeBendFromRoute(points,vertex){
 if(!Array.isArray(points)||vertex<1||vertex>=points.length-1)return null;
 const route=points.map(p=>({x:Math.round(p.x),y:Math.round(p.y)}));
 const chosen=route[vertex],prev=route[vertex-1],next=route[vertex+1];
 route.splice(vertex,1);
 if(prev.x!==next.x&&prev.y!==next.y){
  // Uma conexão ortogonal sempre precisa de uma curva; troca a posição
  // do cotovelo em vez de transformar o fio em diagonal.
  const variants=[{x:prev.x,y:next.y},{x:next.x,y:prev.y}];
  const corner=variants.find(p=>p.x!==chosen.x||p.y!==chosen.y)||variants[0];
  route.splice(vertex,0,corner);
 }
 const result=[];
 for(const p of route){
  const last=result.at(-1),before=result.at(-2);
  if(last&&last.x===p.x&&last.y===p.y)continue;
  if(before&&((before.x===last.x&&last.x===p.x)||(before.y===last.y&&last.y===p.y)))result[result.length-1]=p;
  else result.push(p);
 }
 return result;
}
function removeSelectedBend(){
 if(!selectedBend)return false;
 const {index,vertex}=selectedBend,w=state.wires[index];
 if(!w){selectedBend=null;updateHistoryButtons();return false;}
 const points=wirePoints(w),route=removeBendFromRoute(points,vertex);
 if(!route||route.length<2)return false;
 snapshot();
 w.manual=true;w.via=route.slice(1,-1);
 selectedBend=null;state.selectedWire=index;state.selected=null;state.inspector='wires';state.completed=false;
 refresh();
 message(route.length<points.length?'Ponto removido. Fio e conexões preservados.':'Ponto removido e curva ajustada para manter o fio reto.',true);
 return true;
}
function removeWire(i){if(!state.wires[i])return;snapshot();reconnectPending=null;selectedBend=null;state.wires.splice(i,1);state.selectedWire=null;state.completed=false;refresh();message('Fio removido.');}
function getPortPos(id){
 const [partId,pinId]=id.split('.');
 const p=byPart(partId);if(!p)return null;
 const d=partLayout(p),pin=d.pins[pinId];if(!pin)return null;
 const offset=rotateVector({x:(p.flipped?-1:1)*d.w*(pin[0]/100-.5),y:d.h*(pin[1]/100-.5)},p.rotation);
 return {x:p.x+d.w/2+offset.x,y:p.y+d.h/2+offset.y};
}
// Desempata os dois terminais do motor pelas coordenadas reais, mesmo
// se o navegador escolher a caixa de clique do terminal vizinho.
function actualMotorPort(e,id){
 const [partId,pin]=id.split('.'),p=byPart(partId);
 if(p?.kind!=='motor'||!['A','B'].includes(pin))return id;
 const box=Q('viewport').getBoundingClientRect();
 let winner=id,distance=Infinity;
 for(const name of ['A','B']){
  const v=getPortPos(partId+'.'+name);if(!v)continue;
  const d=Math.hypot(box.left+panX+v.x*zoom-e.clientX,box.top+panY+v.y*zoom-e.clientY);
  if(d<distance){distance=d;winner=partId+'.'+name;}
 }
 return winner;
}
function portDirection(id){
 if(!id)return {x:0,y:-1};
 const [partId,code]=id.split('.');
 const p=byPart(partId);if(!p)return {x:0,y:-1};
 let d={x:0,y:-1};
 if(p.kind==='esp')d={x:0,y:['3V3','GND2','D15','D2','D4','RX2','TX2','D5','D18','D19','D21','RX0','TX0','D22','D23'].includes(code)?1:-1};
 else if(p.kind==='driver')d={x:0,y:code.startsWith('OUT')?-1:1};
 else if(p.kind==='buck')d={x:code.startsWith('IN')?-1:1,y:0};
 else if(p.kind==='battery')d={x:0,y:-1};
 else if(p.kind==='switch')d={x:0,y:1};
 else if(p.kind==='motor')d=p.view==='side'?{x:1,y:0}:{x:-1,y:0};
 if(p.flipped)d.x=-d.x;
 return rotateVector(d,p.rotation);
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
 const a=w.loose?.end==='a'?w.loose.point:getPortPos(w.a);
 const b=w.loose?.end==='b'?w.loose.point:getPortPos(w.b);
 return a&&b?(w.manual?manualWirePoints(a,w.via||[],b):wireRoutePoints(a,w.via||[],b,w.a,w.b)):[];
}
// Compatibilidade: alguns jumpers antigos usam o gerador procedural de
// cantos mesmo com "Fios auto OFF". Converte o que já aparece na tela
// em vértices EXPLÍCITOS, sem mudar seu desenho ou a conexão.
function makeWireFullyManual(w){
 if(!w)return;
 if(w.manual!==true){
  const points=wirePoints(w);
  if(points.length>=2)w.via=points.slice(1,-1).map(p=>({...p}));
  w.manual=true;
 }
}
function enforceManualMode(){for(const w of state.wires)makeWireFullyManual(w);}
function segmentAt(clientX,clientY){
 const p=worldXY(clientX,clientY),tolerance=Math.min(90,Math.max(10,12/zoom));
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
 const cursor=worldXY(clientX,clientY),radius=Math.min(110,Math.max(10,11/zoom));
 let best={index:-1,vertex:-1,dist:radius*radius};
 state.wires.forEach((wire,i)=>{
  const points=wirePoints(wire);
  for(let k=1;k<points.length-1;k++){
   const pt=points[k],before=points[k-1],after=points[k+1];
   if(before&&after&&(
    (Math.abs(before.x-pt.x)<2&&Math.abs(after.x-pt.x)<2)||
    (Math.abs(before.y-pt.y)<2&&Math.abs(after.y-pt.y)<2)))continue;
   const dist=(cursor.x-pt.x)**2+(cursor.y-pt.y)**2;
   if(dist<best.dist)best={index:i,vertex:k,dist};
  }
 });
 return best;
}
function beginBendDrag(e,index,vertex){
 const wire=state.wires[index];if(!wire||state.startPort||reconnectPending)return false;
 const original=wirePoints(wire);
 if(!Number.isInteger(vertex)||vertex<1||vertex>=original.length-1)return false;
 if(e.cancelable!==false)e.preventDefault();
 state.selectedWire=index;state.selected=null;state.inspector='wires';
 selectedBend={index,vertex};
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
 wire.via=via;wire.manual=true;
 // O vértice em edição recebe a mesma indicação do jumper ainda livre.
 const vertex=via[g.vertex-1],prev=original[g.vertex-1],next=original[g.vertex+1];
 const straight=[prev,next].some(pt=>pt&&(
  Math.abs(vertex.x-pt.x)<=8/zoom||Math.abs(vertex.y-pt.y)<=8/zoom));
 wireAlignment=straight?closestComponentGuide(vertex):null;
 requestDraw();
}
// Só um segmento INTERNO pode ser transladado sem alterar o borne original.
// Os dois vértices existentes mudam juntos: nunca se inserem novos nós.
function movableWireSegment(points,segment){
 if(!Array.isArray(points)||segment<1||segment>=points.length-2)return false;
 const prev=points[segment-1],a=points[segment],b=points[segment+1],next=points[segment+2];
 if(!prev||!a||!b||!next)return false;
 const horizontal=Math.abs(a.y-b.y)<2,vertical=Math.abs(a.x-b.x)<2;
 if(horizontal===vertical)return false; // Não editar diagonais/segmentos de zero comprimento.
 // Os trechos vizinhos precisam ser perpendiculares ao selecionado.
 return horizontal
  ?Math.abs(prev.x-a.x)<2&&Math.abs(next.x-b.x)<2
  :Math.abs(prev.y-a.y)<2&&Math.abs(next.y-b.y)<2;
}
function moveWireSegment(g,clientX,clientY){
 const wire=state.wires[g.wireIndex];if(!wire)return;
 const points=g.original,segment=g.segment;
 if(!movableWireSegment(points,segment)){wireAlignment=null;requestDraw();return;}
 const first=points[segment],second=points[segment+1];
 const horizontal=Math.abs(first.y-second.y)<2;
 const delta=Math.round(((horizontal?clientY-g.startY:clientX-g.startX)/zoom));
 const changed=points.map(p=>({...p}));
 const dimension=horizontal?'y':'x';
 changed[segment][dimension]=first[dimension]+delta;
 changed[segment+1][dimension]=second[dimension]+delta;
 // Remove cotovelos colineares gerados por versões antigas do editor.
 // Não altera os conectores; os únicos pontos mantidos são curvas reais.
 const route=[];
 for(const p of changed){
  const previous=route.at(-1),before=route.at(-2);
  if(previous&&previous.x===p.x&&previous.y===p.y)continue;
  if(before&&(
   (before.x===previous.x&&previous.x===p.x)||
   (before.y===previous.y&&previous.y===p.y)))route[route.length-1]=p;
  else route.push(p);
 }
 wire.via=route.slice(1,-1);
 wire.manual=true;
 // Guias completas durante a edição, sempre sobre segmentos ortogonais.
 // Ao arrastar um segmento horizontal, a guia HORIZONTAL também aparece.
 const guides=horizontal
  ?[{axis:'y',value:changed[segment].y},
    {axis:'x',value:changed[segment].x},
    {axis:'x',value:changed[segment+1].x}]
  :[{axis:'x',value:changed[segment].x},
    {axis:'y',value:changed[segment].y},
    {axis:'y',value:changed[segment+1].y}];
 wireAlignment=guides.filter((g,i,list)=>list.findIndex(x=>x.axis===g.axis&&Math.abs(x.value-g.value)<1)===i);
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

/* Reconectar uma ponta como no Tinkercad: duas bolinhas aparecem quando
   um fio é selecionado. A origem oposta e a cor nunca se perdem. */
// Move uma extremidade sem reaproveitar o cotovelo antigo do terminal.
// Preserva as curvas do restante do jumper e recria só a aproximação final.
function reconnectRoute(pending,position){
 const w=state.wires[pending.index],all=pending.base|| (w&&wirePoints(w));
 if(!all||all.length<2||!position)return [];
 const round=point=>({x:Math.round(point.x),y:Math.round(point.y)});
 const fixed=pending.end==='b'?all.slice(0,-1).map(round):all.slice(1).reverse().map(round);
 // O último cotovelo pertencia ao pino que foi desplugado. Ele não pode
 // continuar como uma sobra à direita/esquerda do novo caminho.
 if(fixed.length>1)fixed.pop();
 const path=fixed;
 const append=raw=>{
  const point=round(raw),last=path.at(-1),previous=path.at(-2);
  if(last&&point.x===last.x&&point.y===last.y)return;
  if(previous&&last&&(
   (previous.x===last.x&&last.x===point.x)||
   (previous.y===last.y&&last.y===point.y)
  ))path[path.length-1]=point;
  else path.push(point);
 };
 const addOrthogonal=raw=>{
  const target=round(raw),last=path.at(-1);
  if(!last)return append(target);
  if(last.x!==target.x&&last.y!==target.y){
   const previous=path.at(-2);
   const oldTip=pending.end==='b'?all.at(-1):all[0];
   const oldApproach=pending.end==='b'?all.at(-2):all[1];
   const wasVertical=oldTip&&oldApproach&&Math.abs(oldTip.x-oldApproach.x)<2;
   const horizontal=previous?Math.abs(previous.y-last.y)<2:
    wasVertical?true:oldTip&&oldApproach&&Math.abs(oldTip.y-oldApproach.y)<2?false:
    Math.abs(target.x-last.x)>=Math.abs(target.y-last.y);
   // Continua na direção da última curva, sem alongar o antigo terminal.
   append(horizontal?{x:target.x,y:last.y}:{x:last.x,y:target.y});
  }
  append(target);
 };
 for(const corner of pending.corners||[])addOrthogonal(corner);
 addOrthogonal(position);
 return pending.end==='b'?path:path.reverse();
}
function addReconnectCorner(x,y){
 if(!reconnectPending)return false;
 const obj=reconnectPending,tip={x:Math.round(x),y:Math.round(y)};
 const points=reconnectRoute(obj,tip),before=obj.end==='b'?points.at(-2):points[1];
 if(!before||Math.hypot(tip.x-before.x,tip.y-before.y)<6)return false;
 if(obj.corners.length>=48){message('Limite de curvas atingido.',true);return false;}
 obj.corners.push(tip);obj.point=tip;obj.snapPort=null;pendingAlignment=null;
 requestDraw();message('Curva fixada. Clique novamente para dobrar ou escolha um pino.',true);return true;
}
function renderWireHandles(){
 const layer=Q('wireHandles');if(!layer)return;
 const w=Number.isInteger(state.selectedWire)?state.wires[state.selectedWire]:null;
 if(!w||state.startPort){layer.replaceChildren();layer.dataset.index='';return;}
 const selected=String(state.selectedWire);
 if(layer.dataset.index!==selected||layer.children.length!==2){
  layer.replaceChildren();
  for(const end of ['a','b']){
   const button=document.createElement('button');button.type='button';
   button.className='wire-end-handle';button.dataset.wireEnd=end;
   button.setAttribute('aria-label','Soltar ponta '+(end==='a'?'inicial':'final')+' do fio e conectar a outro pino');
   button.title='Arraste a bolinha até um pino, ou solte-a em qualquer lugar da bancada';
   layer.append(button);
  }
  layer.dataset.index=selected;
 }
 for(const button of layer.children){
  const end=button.dataset.wireEnd;
  const active=reconnectPending&&reconnectPending.index===state.selectedWire&&reconnectPending.end===end;
  const point=active?reconnectPending.point:(w.loose?.end===end?w.loose.point:getPortPos(w[end]));
  if(!point){button.hidden=true;continue;}
  button.hidden=false;
  // Área de toque compacta (26px de tela), com aro visual menor (12px).
  // O tamanho anterior de 42px cobria bornes adjacentes no celular.
  const size=26/zoom;
  button.style.setProperty('--mobile-ring-size',(12/zoom)+'px');
  button.style.setProperty('--mobile-ring-border',(2/zoom)+'px');
  // Depois de soltar a bolinha, ela deixa o pino de destino clicável.
  button.classList.toggle('awaiting-target',!!active&&(!gesture||gesture.type!=='wire-end'));
  button.style.left=point.x+'px';button.style.top=point.y+'px';
  button.style.width=size+'px';button.style.height=size+'px';
  button.style.borderWidth='0px';
  button.classList.toggle('reconnecting',!!active);
  button.style.setProperty('--handle-shadow-size','0px');
 }
}
function beginReconnect(e,index,end){
 if(e.button!==undefined&&e.button!==0)return;
 const wire=state.wires[index];if(!wire||state.startPort||!['a','b'].includes(end))return;
 if(wire.loose&&wire.loose.end!==end){message('Reconecte primeiro a ponta solta deste jumper.',true);return;}
 if(e.cancelable)e.preventDefault();
 e.stopPropagation?.();
 state.selectedWire=index;state.selected=null;state.inspector='wires';state.wireColor=wire.color;
 reconnectPending={index,end,point:wire.loose?.end===end?{...wire.loose.point}:getPortPos(wire[end]),snapPort:null,corners:[],base:wirePoints(wire).map(p=>({...p}))};
 gesture={type:'wire-end',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
 renderColors();renderInspector();updateHistoryButtons();requestDraw();
}
function moveReconnect(clientX,clientY){
 if(!reconnectPending)return;
 const box=Q('viewport').getBoundingClientRect();
 if(clientX<box.left||clientX>box.right||clientY<box.top||clientY>box.bottom)return;
 const wire=state.wires[reconnectPending.index];if(!wire){cancelReconnect();return;}
 const fixed=wire[reconnectPending.end==='a'?'b':'a'];
 const pin=nearestPort(clientX,clientY,fixed,32);
 reconnectPending.snapPort=pin;
 reconnectPending.point=pin?getPortPos(pin):worldXY(clientX,clientY);
 const base=reconnectPending.base||wirePoints(wire);
 const near=reconnectPending.end==='b'?base.at(-3):base[2];
 const anchor=reconnectPending.corners.at(-1)||near||getPortPos(wire[reconnectPending.end==='b'?'a':'b']);
 pendingAlignment=visualPendingAlignment(clientX,clientY,anchor);
 requestDraw();
}
function cancelReconnect(){
 if(!reconnectPending)return;
 reconnectPending=null;pendingAlignment=null;wireAlignment=null;
 requestDraw();
}
// Ao soltar a ponta em uma área livre, finaliza o arraste e guarda a posição.
function leaveReconnectLoose(clientX,clientY){
 const pending=reconnectPending;
 if(!pending)return false;
 const wire=state.wires[pending.index];if(!wire){cancelReconnect();return false;}
 const box=Q('viewport').getBoundingClientRect();
 const inside=clientX>=box.left&&clientX<=box.right&&clientY>=box.top&&clientY<=box.bottom;
 const point=inside?worldXY(clientX,clientY):pending.point;
 if(!point)return false;
 const route=reconnectRoute(pending,point);
 if(route.length<2)return false;
 snapshot();
 wire.loose={end:pending.end,point:{x:Math.round(point.x),y:Math.round(point.y)}};
 wire.via=route.slice(1,-1);wire.manual=true;
 state.selectedWire=pending.index;state.selected=null;state.inspector='wires';state.completed=false;
 reconnectPending=null;pendingAlignment=null;wireAlignment=null;
 refresh();
 message('Ponta solta posicionada. Ela fica aqui até você arrastá-la para um pino.',true);
 return true;
}
function finishReconnect(newPort){
 const pending=reconnectPending;
 if(!pending)return false;
 const wire=state.wires[pending.index];if(!wire){cancelReconnect();return false;}
 const fixed=wire[pending.end==='a'?'b':'a'];
 if(!exists(newPort.split('.')[0])||!getPortPos(newPort)||newPort===fixed){
  message('Escolha outro pino, diferente da ponta que continua conectada.',true);return false;
 }
 if(newPort===wire[pending.end]&&!wire.loose){
  cancelReconnect();message('Ponta mantida no pino original.',true);return true;
 }
 if(state.wires.some((w,i)=>i!==pending.index&&electricalKey(w.a,w.b)===electricalKey(fixed,newPort))){
  message('Já existe um fio ligando esses dois contatos.',true);return false;
 }
 const route=reconnectRoute(pending,getPortPos(newPort),newPort);
 if(route.length<2)return false;
 snapshot();
 wire[pending.end]=newPort;wire.via=route.slice(1,-1);
 wire.loose=null;wire.manual=true;
 state.selectedWire=pending.index;state.selected=null;state.inspector='wires';
 state.wireColor=wire.color;state.completed=false;
 reconnectPending=null;pendingAlignment=null;wireAlignment=null;
 refresh();
 message('✓ Ponta reconectada em '+portName(newPort)+'. O outro terminal e a cor foram preservados.',true);
 return true;
}
function eagerWireTouchTarget(){return window.matchMedia?.('(pointer:coarse)')?.matches===true;}
function drawWires(){
 drawPending=false;
 Q('viewport').classList.toggle('is-wiring',!!(state.startPort||reconnectPending));
 const svg=Q('wireSvg');svg.replaceChildren();
 const ns='http://www.w3.org/2000/svg';
 for(let i=0;i<state.wires.length;i++){
  const w=state.wires[i],points=wirePoints(w);
  if(points.length<2)continue;
  if(reconnectPending&&reconnectPending.index===i)continue; // Uma única prévia, sem o fio antigo duplicado.
  const d=wirePath(points);
  const line=document.createElementNS(ns,'path');
  line.setAttribute('d',d);
  line.setAttribute('class','wire-line'+(!w.loose&&acceptedConnectionSet().has(electricalKey(w.a,w.b))?'':' wire-error')+(state.selectedWire===i?' wire-selected':''));
  line.setAttribute('stroke',w.color);svg.append(line);
  // O traço termina no furo do pino; nenhum círculo fica sobre o componente.
  // Um alvo por segmento, inclusive para fios retos sem curvas intermediárias.
  // Encurta o trecho perto dos bornes para não bloquear os cliques nos pinos.
  for(let seg=0;seg<points.length-1;seg++){
   const from=points[seg],to=points[seg+1];
   const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
   if(length<8)continue;
   // Área clicável contínua de todos os trechos do fio, inclusive curtos.
   // Reserva somente o centro de cada borne para não bloquear a conexão
   // de novos fios (o SVG fica sobre os componentes no empilhamento).
   const safeGap=Math.min(length*.16,16/zoom);
   const fromGap=seg===0?safeGap:0;
   const toGap=seg===points.length-2?safeGap:0;
   const u={x:from.x+dx*fromGap/length,y:from.y+dy*fromGap/length};
   const v={x:to.x-dx*toGap/length,y:to.y-dy*toGap/length};
   const hit=document.createElementNS(ns,'path');
   hit.setAttribute('d',wirePath([u,v]));
   hit.setAttribute('class','wire-target');
   hit.setAttribute('stroke','transparent');
   hit.setAttribute('fill','none');
   hit.style.setProperty('--hit-width',Math.min(100,Math.max(18, (eagerWireTouchTarget()?20:24)/zoom))+'px');
   hit.setAttribute('stroke-linecap','butt');
   hit.dataset.wireIndex=String(i);
   hit.dataset.wireSegment=String(seg);
   hit.setAttribute('aria-label','Arrastar trecho '+(seg+1)+' do jumper '+portName(w.a)+' a '+portName(w.b));
   svg.append(hit);
  }
 }
 // Alças quadradas sem halos: apenas a curva tocada muda de ângulo.
 if(!state.startPort&&!reconnectPending)for(let i=0;i<state.wires.length;i++){
  const points=wirePoints(state.wires[i]);
  for(let vertex=1;vertex<points.length-1;vertex++){
   const p=points[vertex],before=points[vertex-1],after=points[vertex+1];
   if(before&&after&&(
    (Math.abs(before.x-p.x)<2&&Math.abs(after.x-p.x)<2)||
    (Math.abs(before.y-p.y)<2&&Math.abs(after.y-p.y)<2)))continue;
   const hitSize=Math.min(130,Math.max(22,20/zoom));
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
    mark.setAttribute('class','wire-bend-mark'+(selectedBend?.index===i&&selectedBend.vertex===vertex?' bend-picked':''));svg.append(mark);
   }
  }
 }
 // Tanto a edição do jumper quanto o seu traçado usam a mesma geometria.
 drawComponentGuide(svg,wireAlignment,ns);
 drawComponentGuide(svg,partDragAlignment,ns);
 if((state.startPort&&previewPoint)||reconnectPending)drawComponentGuide(svg,pendingAlignment,ns);
 if(reconnectPending){
  const w=state.wires[reconnectPending.index];
  const points=reconnectRoute(reconnectPending,reconnectPending.point,reconnectPending.snapPort);
  if(w&&points.length>=2){
   const path=document.createElementNS(ns,'path');
   path.setAttribute('d',wirePath(points));
   path.setAttribute('class','wire-line wire-reconnect-preview');
   path.setAttribute('stroke',w.color);
   svg.append(path);
  }
 }
 renderWireHandles();
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
 fitRegion(partBounds(p));
}
function fitCamera(){
 if(state.parts.length){
  const x=Math.min(...state.parts.map(p=>partBounds(p).x));
  const y=Math.min(...state.parts.map(p=>partBounds(p).y));
  const right=Math.max(...state.parts.map(p=>partBounds(p).x+partBounds(p).w));
  const bottom=Math.max(...state.parts.map(p=>partBounds(p).y+partBounds(p).h));
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
function nearestPort(clientX,clientY,exclude,threshold=19){
 const r=Q('viewport').getBoundingClientRect();let distance=threshold*threshold,chosen=null;
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
// Guias de alinhamento pelo CORPO do componente, não apenas pelos pinos.
// Uma ponta alinhada a qualquer altura/largura da peça recebe uma régua sutil.
// A guia não move o fio, não cria curvas e não altera a montagem salva.
// Alinhamento preciso com pinos e eixo da peça, não qualquer ponto da sua caixa.
function closestComponentGuide(point,axisFilter=null,span=null,anchor=null){
 const tolerance=8/zoom,maxAlong=650/zoom;
 // Guias só durante trechos retos; nenhum traço azul surge sobre fio diagonal.
 if(anchor&&Math.abs(point.x-anchor.x)>tolerance&&Math.abs(point.y-anchor.y)>tolerance)return null;
 const found=[];
 for(const axis of (axisFilter?[axisFilter]:['x','y'])){
  let best=null,scoreBest=Infinity;
  for(const part of state.parts){
   const box=partLayout(part),left=part.x,right=left+box.w,top=part.y,bottom=top+box.h;
   const list=[];
   for(const [pin] of byKind[part.kind].pins){
    const pos=getPortPos(part.id+'.'+pin);
    if(pos)list.push({pos,pin:true});
   }
   // Corpo: somente limites e centro, sem "alinhamento" falso em área inteira.
   for(const x of [left,(left+right)/2,right])
    for(const y of [top,(top+bottom)/2,bottom])list.push({pos:{x,y},pin:false});
   for(const candidate of list){
    const pos=candidate.pos;
    const deviation=Math.abs(axis==='x'?point.x-pos.x:point.y-pos.y);
    if(deviation>tolerance)continue;
    const along=Math.abs(axis==='x'?point.y-pos.y:point.x-pos.x);
    if(along>maxAlong)continue;
    const score=deviation*zoom*40+along*zoom*.5+(candidate.pin?0:18);
    if(score<scoreBest){
     scoreBest=score;
     best={axis,value:axis==='x'?pos.x:pos.y,pin:candidate.pin,partId:part.id};
    }
   }
  }
  if(best)found.push(best);
 }
 return found.length?found:null;
}
function drawComponentGuide(svg,guides,ns){
 if(!guides)return;
 const list=Array.isArray(guides)?guides:[guides];
 const viewport=Q('viewport').getBoundingClientRect();
 const start=worldXY(viewport.left,viewport.top),end=worldXY(viewport.right,viewport.bottom);
 for(const g of list){
  if(!g||!Number.isFinite(g.value))continue;
  const line=document.createElementNS(ns,'line');
  line.setAttribute('class','wire-pending-guide component-alignment-guide');
  // Régua de borda a borda da tela, horizontal OU vertical.
  if(g.axis==='x'){
   line.setAttribute('x1',String(g.value));line.setAttribute('x2',String(g.value));
   line.setAttribute('y1',String(start.y));line.setAttribute('y2',String(end.y));
  }else{
   line.setAttribute('y1',String(g.value));line.setAttribute('y2',String(g.value));
   line.setAttribute('x1',String(start.x));line.setAttribute('x2',String(end.x));
  }
  line.style.strokeWidth=1.5/zoom+'px';
  line.setAttribute('aria-hidden','true');
  svg.append(line);
 }
}
function partAlignmentAnchors(p){
 const b=partBounds(p),cx=b.x+b.w/2,cy=b.y+b.h/2;
 const anchors=[{x:cx,y:cy,role:'center'},{x:b.x,y:cy,role:'left'},
 {x:b.x+b.w,y:cy,role:'right'},{x:cx,y:b.y,role:'top'},
 {x:cx,y:b.y+b.h,role:'bottom'}];
 for(const [name] of byKind[p.kind].pins){
  const pin=getPortPos(p.id+'.'+name);if(pin)anchors.push({...pin,role:'pin'});
 }
 return anchors;
}
function componentDragGuides(partId,ignoreIds=null){
 const moving=byPart(partId);if(!moving)return null;
 const sources=partAlignmentAnchors(moving),tolerance=8/zoom,maxDistance=1100/zoom,found=[];
 for(const axis of ['x','y']){
  let best=null,scoreBest=Infinity;
  for(const other of state.parts){
   if(other.id===partId||ignoreIds?.has(other.id))continue;
   const targets=partAlignmentAnchors(other);
   for(const m of sources)for(const n of targets){
    if(m.role!==n.role)continue;
    const deviation=Math.abs(axis==='x'?m.x-n.x:m.y-n.y);
    if(deviation>tolerance)continue;
    const along=Math.abs(axis==='x'?m.y-n.y:m.x-n.x);
    if(along>maxDistance)continue;
    const score=deviation*zoom*30+along*zoom*.2+(m.role==='pin'?0:m.role==='center'?4:9);
    if(score<scoreBest){
     scoreBest=score;best={axis,value:axis==='x'?n.x:n.y,partId:other.id,role:m.role};
    }
   }
  }
  if(best)found.push(best);
 }
 return found.length?found:null;
}
function visualPendingAlignment(clientX,clientY,anchor=null){
 return closestComponentGuide(worldXY(clientX,clientY),null,null,anchor);
}
function setPendingPreview(e){
 if(!wireTipActive||!state.startPort)return;
 // O jumper acompanha o ponteiro exatamente, independentemente da guia.
 previewPoint=worldXY(e.clientX,e.clientY);
 previewSnapPort=null;
 pendingAlignment=visualPendingAlignment(e.clientX,e.clientY,lastWireTip());
 requestDraw();
}
function wireAt(clientX,clientY){return segmentAt(clientX,clientY).index;}
function selectWire(i){
 if(!state.wires[i])return;
 selectedParts.clear();updateMultiSelectionTool();
 selectedBend=null;
 if(reconnectPending&&reconnectPending.index!==i)reconnectPending=null;
 state.selectedWire=i;state.selected=null;state.inspector='wires';
 state.wireColor=state.wires[i].color; // O seletor exibe a cor do fio clicado.
 renderParts();renderColors();renderInspector();updateHistoryButtons();requestDraw();
 // A instrução extensa como toast escondia a própria montagem no Android.
 message('Fio selecionado. Toque e arraste o trecho ou a ponta para ajustar.',false);
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
 // A lista de componentes não é modal: bancada e painel permanecem ativos.
 Q('sideBackdrop').hidden=true;
 document.body.classList.toggle('components-open',yes);
 Q('menuBtn').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-label',yes?'Fechar componentes':'Abrir componentes');
 Q('drawerHandle').classList.toggle('open',yes);
}
function beginWireDrag(e,index,segment){
 selectedBend=null;
 const wire=state.wires[index];if(!wire||state.startPort||reconnectPending)return false;
 const original=wirePoints(wire);
 if(segment<0||segment>=original.length-1)return false;
 // Não é possível deslocar um trecho ligado diretamente a um pino sem criar
 // novos cotovelos. Nesses casos só selecionar o fio, sem modificar sua rota.
 if(!movableWireSegment(original,segment)){
  selectWire(index);
  message('Para ajustar a saída do fio, mova a bolinha da ponta.',false);
  return true;
 }
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
// Mantém as curvas junto às peças arrastadas, em vez de esticar a linha
// diagonalmente até o terminal fixo. NÃO é roteamento automático.
function elasticWireBends(original,from,to,moveA,moveB,dx,dy){
 const x=Math.round(dx),y=Math.round(dy);
 const corners=(original||[]).map(p=>({x:Math.round(p.x),y:Math.round(p.y)}));
 if(!moveA&&!moveB)return corners;
 if(moveA&&moveB)return corners.map(p=>({x:p.x+x,y:p.y+y}));
 if(!from||!to)return corners;
 const start=moveA?{x:from.x+x,y:from.y+y}:from;
 const end=moveB?{x:to.x+x,y:to.y+y}:to;
 if(!corners.length){
  if(start.x===end.x||start.y===end.y)return [];
  // Era um trecho reto. O único cotovelo necessário acompanha a peça.
  const oldH=Math.abs(from.y-to.y)<2,oldV=Math.abs(from.x-to.x)<2;
  const p=oldH?{x:start.x,y:end.y}
   :oldV?{x:end.x,y:start.y}
   :moveA?{x:start.x,y:end.y}:{x:end.x,y:start.y};
  return (p.x===start.x&&p.y===start.y)||(p.x===end.x&&p.y===end.y)?[]:[p];
 }
 const shifted=corners.map(p=>({x:p.x+x,y:p.y+y}));
 // Todas as curvas acompanham a peça. Corrigimos SOMENTE a última curva
 // junto à ponta fixa para que a linha diminua/aumente sem virar diagonal.
 if(moveA&&!moveB){
  const last=shifted.at(-1),oldLast=corners.at(-1);
  if(Math.abs(oldLast.y-to.y)<2)last.y=to.y;
  else if(Math.abs(oldLast.x-to.x)<2)last.x=to.x;
  else if(Math.abs(oldLast.x-to.x)>=Math.abs(oldLast.y-to.y))last.y=to.y;
  else last.x=to.x;
 }else if(moveB&&!moveA){
  const first=shifted[0],oldFirst=corners[0];
  if(Math.abs(oldFirst.y-from.y)<2)first.y=from.y;
  else if(Math.abs(oldFirst.x-from.x)<2)first.x=from.x;
  else if(Math.abs(oldFirst.x-from.x)>=Math.abs(oldFirst.y-from.y))first.y=from.y;
  else first.x=from.x;
 }
 // Um circuito com alguma diagonal LEGADA é reparado apenas quando é
 // movimentado, acrescentando um cotovelo no próprio trecho errado.
 const points=[start,...shifted,end],fixed=[points[0]];
 for(let i=1;i<points.length;i++){
  const next=points[i],previous=fixed.at(-1);
  if(Math.abs(next.x-previous.x)>1&&Math.abs(next.y-previous.y)>1){
   const before=fixed.at(-2);
   const prevHorizontal=before&&Math.abs(before.y-previous.y)<2;
   const prevVertical=before&&Math.abs(before.x-previous.x)<2;
   const elbow=prevHorizontal?{x:next.x,y:previous.y}:
    prevVertical?{x:previous.x,y:next.y}:
    moveA?{x:previous.x,y:next.y}:{x:next.x,y:previous.y};
   if((elbow.x!==previous.x||elbow.y!==previous.y)&&
      (elbow.x!==next.x||elbow.y!==next.y))fixed.push(elbow);
  }
  fixed.push(next);
 }
 return fixed.slice(1,-1);
}
function anchoredWireBends(part,dx,dy,anchors){
 for(const item of anchors||[]){
  const wire=state.wires[item.i];
  if(!wire||!wire.manual)continue;
  wire.via=elasticWireBends(item.via,item.start,item.end,item.a,item.b,dx,dy);
 }
}

function updateMultiSelectionTool(){
 const button=Q('selectionToolBtn'),counter=Q('selectionCount');
 if(!button)return;
 button.classList.toggle('active',selectionToolActive);
 button.setAttribute('aria-pressed',String(selectionToolActive));
 button.title=selectionToolActive?'Seletor ligado: clique para escolher peças; arraste uma selecionada para mover o grupo':'Seleção múltipla (ou Shift+clique)';
 if(counter){counter.textContent=String(selectedParts.size);counter.hidden=selectedParts.size===0;}
 const label=Q('selectionSummary');if(label)label.textContent=selectedParts.size?selectedParts.size+' selecionado'+(selectedParts.size!==1?'s':''):'Selecionar';
}
function singleComponentSelection(id){
 selectedParts.clear();
 if(id&&byPart(id))selectedParts.add(id);
 updateMultiSelectionTool();
}
function toggleComponentSelection(id){
 if(!byPart(id))return;
 if(selectedParts.has(id))selectedParts.delete(id);else selectedParts.add(id);
 state.selected=selectedParts.has(id)?id:([...selectedParts].at(-1)||null);
 state.selectedWire=null;selectedBend=null;state.inspector='parts';
 renderParts();renderInspector();updateHistoryButtons();updateMultiSelectionTool();
 const count=selectedParts.size;
 message(count?count+' componentes selecionados. Segure Shift para acrescentar ou retirar; arraste um deles para mover todos.':'Seleção limpa.',true);
}
function multiSelectCapture(e){
 // Seleção primeiro, antes dos botões dos pinos e dos fios sobrepostos.
 if(!selectionToolActive&&!e.shiftKey)return;
 if(state.startPort||reconnectPending||spaceHeld||pinch||activeTouches.size>=2)return;
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('input,textarea,select,[contenteditable],[data-remove],[data-toggle]'))return;
 let node=e.target.closest('.part');
 if(!node&&document.elementsFromPoint)node=document.elementsFromPoint(e.clientX,e.clientY)
  .find(el=>el.classList?.contains('part')&&el.closest('#partsLayer'));
 if(!node||!byPart(node.dataset.part))return;
 const id=node.dataset.part;
 if(e.cancelable)e.preventDefault();
 e.stopImmediatePropagation();
 if(e.shiftKey){toggleComponentSelection(id);return;}
 if(selectionToolActive){
  if(selectedParts.has(id)&&selectedParts.size>1)beginGroupMove(e,id);
  else toggleComponentSelection(id);
 }
}
function beginGroupMove(e,id){
 if(selectedParts.size<2||!selectedParts.has(id))return false;
 if(e.cancelable)e.preventDefault();
 const parts=[...selectedParts].map(key=>byPart(key)).filter(Boolean).map(p=>({id:p.id,x:p.x,y:p.y}));
 const wires=state.wires.map((w,i)=>{
  const moveA=w.loose?.end!=='a'&&selectedParts.has(w.a.split('.')[0]),moveB=w.loose?.end!=='b'&&selectedParts.has(w.b.split('.')[0]);
  if(!moveA&&!moveB)return null;
  return {i,moveA,moveB,via:(w.via||[]).map(v=>({...v})),start:w.loose?.end==='a'?w.loose.point:getPortPos(w.a),end:w.loose?.end==='b'?w.loose.point:getPortPos(w.b)};
 }).filter(Boolean);
 state.selected=id;state.selectedWire=null;state.inspector='parts';selectedBend=null;
 partDragAlignment=null;
 gesture={type:'group-move',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,parts,wires,main:id,
  panStartX:panX,panStartY:panY,lastClientX:e.clientX,lastClientY:e.clientY,moved:false,saved:false};
 renderParts();renderInspector();
 return true;
}
function translateGroup(group,dx,dy){
 const x=Math.round(dx),y=Math.round(dy);
 for(const item of group.parts){
  const p=byPart(item.id);if(p){p.x=item.x+x;p.y=item.y+y;}
 }
 for(const item of group.wires){
  const w=state.wires[item.i];if(!w||!w.manual)continue;
  w.via=elasticWireBends(item.via,item.start,item.end,item.moveA,item.moveB,x,y);
 }
}
function partDown(e){
 if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('button,input,label'))return;
 const el=e.target.closest('.part');if(!el)return;
 const p=byPart(el.dataset.part);if(!p)return;
 e.preventDefault();
 if(e.shiftKey){toggleComponentSelection(p.id);return;}
 if(selectionToolActive&&!selectedParts.has(p.id)){toggleComponentSelection(p.id);return;}
 if(selectedParts.size>1&&selectedParts.has(p.id)){beginGroupMove(e,p.id);return;}
 singleComponentSelection(p.id);
 state.selected=p.id;state.selectedWire=null;selectedBend=null;state.inspector='parts';
 partDragAlignment=null;renderInspector();renderParts();
 gesture={type:'move',pointer:e.pointerId,partId:p.id,startX:e.clientX,startY:e.clientY,partX:p.x,partY:p.y,
  panStartX:panX,panStartY:panY,lastClientX:e.clientX,lastClientY:e.clientY,
  anchors:state.wires.map((w,i)=>({
   i,a:w.loose?.end!=='a'&&w.a.split('.')[0]===p.id,b:w.loose?.end!=='b'&&w.b.split('.')[0]===p.id,
   via:(w.via||[]).map(point=>({...point})),start:w.loose?.end==='a'?w.loose.point:getPortPos(w.a),end:w.loose?.end==='b'?w.loose.point:getPortPos(w.b)
  })).filter(item=>item.a||item.b),moved:false};
}
function paletteDown(e){
 if(e.button!==undefined&&e.button!==0)return;
 const el=e.target.closest('.catalog-card');if(!el||el.disabled)return;
 // No celular, o navegador deve poder rolar o catálogo a partir de
 // qualquer cartão (não somente pela barra de rolagem).
 // Clique/toque curto e arrasto horizontal para a bancada continuam ativos.
 if(e.pointerType!=='touch')e.preventDefault();
 gesture={type:'catalog',pointer:e.pointerId,kind:el.dataset.kind,startX:e.clientX,startY:e.clientY,moved:false};
}
function captureBendNearComponents(e){
 if(!state.startPort&&!reconnectPending)return;
 if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil||spaceHeld)return;
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('.wire-end-handle'))return;
 const port=e.target.closest('[data-port]');
 if(port){
  const at=getPortPos(port.dataset.port),r=Q('viewport').getBoundingClientRect();
  if(at){
   const cx=r.left+panX+at.x*zoom,cy=r.top+panY+at.y*zoom;
   const radius=e.pointerType==='touch'?16:12;
   if(Math.hypot(e.clientX-cx,e.clientY-cy)<=radius)return;
  }
 }
 // Captura antes do componente para não o selecionar ao clicar perto dele.
 if(e.cancelable)e.preventDefault();
 e.stopPropagation();
 suppressPortClickUntil=Date.now()+300;
 gesture={type:reconnectPending?'reconnect-bend':'bend',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
}
function viewportDown(e){
 if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
 if(e.button!==undefined&&e.button!==0&&e.button!==1)return;
 if(e.target.closest('.canvas-zoom-button,.canvas-zoom-panel,button,input'))return;
 if(reconnectPending){
  if(e.target.closest('.part,.wire-end-handle'))return;
  e.preventDefault();gesture={type:'reconnect-bend',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
  return;
 }
 if(spaceHeld||e.button===1){startPan(e);return;}
 if(e.target.closest('.part'))return;
 if(!state.startPort){
  const bend=bendAt(e.clientX,e.clientY);
  if(bend.index>=0&&beginBendDrag(e,bend.index,bend.vertex))return;
  const selected=segmentAt(e.clientX,e.clientY);
  if(selected.index>=0&&beginWireDrag(e,selected.index,selected.segment))return;
 }
 if(!state.startPort&&e.target.closest('.wire-target,.wire-bend-target'))return;
 e.preventDefault();
 gesture={type:state.startPort?'bend':'pan',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:panX,y:panY,moved:false};
}
let suppressPortClickUntil=0;
// Pan automático junto às bordas ao mover peças com mouse ou toque.
// O componente segue sob o ponteiro mesmo se a câmera avançar sem pointermove.
let dragEdgePanFrame=0,dragEdgePanLastTime=0;
function stopDragEdgePan(){
 if(dragEdgePanFrame)cancelAnimationFrame(dragEdgePanFrame);
 dragEdgePanFrame=0;dragEdgePanLastTime=0;
}
function applyDraggedPosition(g,clientX,clientY){
 if(!g.moved)return;
 // Sem compensar pan, o componente escaparia do cursor na borda.
 const dx=(clientX-g.startX-(panX-g.panStartX))/zoom;
 const dy=(clientY-g.startY-(panY-g.panStartY))/zoom;
 if(g.type==='group-move'){
  translateGroup(g,dx,dy);
  partDragAlignment=componentDragGuides(g.main,selectedParts);
  for(const item of g.parts){
   const p=byPart(item.id);
   const el=Q('partsLayer').querySelector('[data-part="'+item.id+'"]');
   if(p&&el){el.style.left=p.x+'px';el.style.top=p.y+'px';}
  }
 }else if(g.type==='move'){
  const p=byPart(g.partId);if(!p)return;
  p.x=Math.round(g.partX+dx);p.y=Math.round(g.partY+dy);
  anchoredWireBends(p,p.x-g.partX,p.y-g.partY,g.anchors);
  partDragAlignment=componentDragGuides(p.id);
  const el=Q('partsLayer').querySelector('[data-part="'+p.id+'"]');
  if(el){el.style.left=p.x+'px';el.style.top=p.y+'px';}
  highlightDropZone(removeZoneAt(clientX,clientY));
 }
 requestDraw();
}
function dragEdgeSpeed(pos,low,high,zone){
 if(pos<low-65||pos>high+65)return 0;
 const nearStart=pos<low+zone?(low+zone-pos)/zone:0;
 const nearEnd=pos>high-zone?(pos-(high-zone))/zone:0;
 const amount=nearEnd-nearStart;
 return Math.sign(amount)*Math.min(1.65,Math.abs(amount))*15;
}
function dragEdgePanTick(now){
 dragEdgePanFrame=0;
 const g=gesture;
 if(!g||!g.moved||(g.type!=='move'&&g.type!=='group-move')||pinch||activeTouches.size>=2){
  dragEdgePanLastTime=0;return;
 }
 const r=Q('viewport').getBoundingClientRect();
 const zoneX=Math.min(85,Math.max(36,r.width*.14));
 const zoneY=Math.min(85,Math.max(36,r.height*.14));
 const vx=dragEdgeSpeed(g.lastClientX,r.left,r.right,zoneX);
 const vy=dragEdgeSpeed(g.lastClientY,r.top,r.bottom,zoneY);
 const dt=dragEdgePanLastTime?Math.min(36,Math.max(0,now-dragEdgePanLastTime)):16;
 dragEdgePanLastTime=now;
 if(vx||vy){
  // Na borda superior, a câmera desloca o conteúdo para baixo e revela o alto.
  panX-=vx*dt/16;panY-=vy*dt/16;
  camera();
  applyDraggedPosition(g,g.lastClientX,g.lastClientY);
 }
 dragEdgePanFrame=requestAnimationFrame(dragEdgePanTick);
}
function startDragEdgePan(){
 if(!dragEdgePanFrame)dragEdgePanFrame=requestAnimationFrame(dragEdgePanTick);
}

// VERSÃO MÓVEL: gestos de fio seguem o dedo e registram as viradas.
// Não existe no app.js do computador.
function mobileRoundPoint(p){return {x:Math.round(p.x),y:Math.round(p.y)};}
function mobileNormalizeRoute(points){
 const route=[];
 for(const raw of points){
  if(!raw)continue;
  const p=mobileRoundPoint(raw),a=route.at(-1),b=route.at(-2);
  if(a&&a.x===p.x&&a.y===p.y)continue;
  if(b&&((b.x===a.x&&a.x===p.x)||(b.y===a.y&&a.y===p.y)))route[route.length-1]=p;
  else route.push(p);
 }
 return route;
}
function mobileFingerRoute(g,e){
 if(!g||e.pointerType!=='touch')return;
 const current=mobileRoundPoint(worldXY(e.clientX,e.clientY));
 if(!g.fingerFixed){
  const start=getPortPos(g.port);
  if(!start)return;
  g.fingerFixed=[mobileRoundPoint(start)];
  g.fingerAxis=null;g.fingerPrevious=mobileRoundPoint(worldXY(g.startX,g.startY));
  g.fingerHead=g.fingerFixed[0];
  g.fingerDirectionCandidate=null;
 }
 const prev=g.fingerPrevious;
 const deltaX=current.x-prev.x,deltaY=current.y-prev.y;
 const distance=Math.hypot(deltaX,deltaY),minimum=6/zoom;
 if(distance>=minimum){
  const candidate=Math.abs(deltaX)>Math.abs(deltaY)*1.2?'x':
    Math.abs(deltaY)>Math.abs(deltaX)*1.2?'y':null;
  if(candidate&&!g.fingerAxis)g.fingerAxis=candidate;
  else if(candidate&&candidate!==g.fingerAxis){
   const axisValue=candidate==='x'?current.x:current.y;
   const oldAxisValue=candidate==='x'?prev.x:prev.y;
   const distanceTurn=Math.abs(axisValue-oldAxisValue)*zoom;
   if(distanceTurn>=7){
    // Consolida a curva no local da última ponta antes da mudança de direção.
    const head=mobileRoundPoint(g.fingerHead);
    const last=g.fingerFixed.at(-1);
    if(last&&(head.x!==last.x||head.y!==last.y)&&g.fingerFixed.length<44)
     g.fingerFixed.push(head);
    g.fingerAxis=candidate;
   }
  }
  g.fingerPrevious=current;
 }
 const base=g.fingerFixed.at(-1);
 if(!base)return;
 const activeAxis=g.fingerAxis|| (Math.abs(current.x-base.x)>=Math.abs(current.y-base.y)?'x':'y');
 const head=mobileRoundPoint(activeAxis==='x'?{x:current.x,y:base.y}:{x:base.x,y:current.y});
 g.fingerHead=head;
 // Um segundo trecho curto fecha exatamente na posição do dedo; quando
 // ele vira, a curva anterior fica fixada e o trajeto continua do novo eixo.
 const route=mobileNormalizeRoute([...g.fingerFixed,head,current]);
 // O limite de curvas é aplicado nos pontos fixados, sem cortar a origem.
 const fixedStart=route[0];
 const tip=route.at(-1);
 if(!fixedStart||!tip)return;
 state.bends=route.slice(1,-1);
 previewPoint=tip;
 previewSnapPort=null;
 pendingAlignment=null;
 requestDraw();
}
// Arraste de um jumper já conectado: a bolinha acompanha o dedo e
// as mudanças reais de direção geram novos pontos em pending.corners.
function mobileReconnectFinger(g,e){
 if(e.pointerType!=='touch'||!g?.moved||!reconnectPending)return;
 const point=mobileRoundPoint(worldXY(e.clientX,e.clientY));
 if(!g.reconnectFingerLast){
  g.reconnectFingerLast=mobileRoundPoint(worldXY(g.startX,g.startY));
  g.reconnectFingerAxis=null;
  return;
 }
 const prev=g.reconnectFingerLast,dx=point.x-prev.x,dy=point.y-prev.y;
 if(Math.hypot(dx,dy)<7/zoom)return;
 const axis=Math.abs(dx)>Math.abs(dy)*1.25?'x':
   Math.abs(dy)>Math.abs(dx)*1.25?'y':null;
 if(axis&&!g.reconnectFingerAxis)g.reconnectFingerAxis=axis;
 else if(axis&&axis!==g.reconnectFingerAxis){
  if(Math.abs(axis==='x'?dx:dy)*zoom>=8 &&
     reconnectPending.corners.length<40){
   const last=g.reconnectFingerLast,existing=reconnectPending.corners.at(-1);
   if(!existing||Math.hypot(existing.x-last.x,existing.y-last.y)>7/zoom)
    reconnectPending.corners.push({...last});
   g.reconnectFingerAxis=axis;
  }
 }
 g.reconnectFingerLast=point;
}
function mobileFinishFingerRoute(g,targetPort=null,looseTip=null){
 if(!g?.fingerFixed)return;
 let points=mobileNormalizeRoute([...g.fingerFixed,g.fingerHead,looseTip||previewPoint]);
 if(points.length<2)return;
 if(targetPort){
  const end=getPortPos(targetPort);
  if(end){
   const tail=points.at(-1);
   if(tail&&tail.x!==Math.round(end.x)&&tail.y!==Math.round(end.y)){
    const prev=points.at(-2);
    const horizontal=prev&&Math.abs(prev.y-tail.y)<2;
    const corner=horizontal?{x:Math.round(end.x),y:tail.y}:{x:tail.x,y:Math.round(end.y)};
    points.push(corner);
   }
   points.push(mobileRoundPoint(end));
  }
 }
 points=mobileNormalizeRoute(points);
 if(points.length>49)points=points.slice(0,48).concat(points.at(-1));
 state.bends=points.slice(1,-1);
 previewPoint=points.at(-1);
 requestDraw();
}
function pointerMove(e){
 if(trackingTouchMove(e)||pinch)return;
 if(gesture&&e.pointerId===gesture.pointer){
  const g=gesture,dx=e.clientX-g.startX,dy=e.clientY-g.startY;
  if(Math.hypot(dx,dy)>(g.type==='wire'&&e.pointerType==='touch'?7:g.type==='wire'?12:g.type==='wire-end'&&e.pointerType==='touch'?5:g.type==='pan'?9:6))g.moved=true;
  if(g.type==='catalog'){
   if(e.pointerType==='touch'&&Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)*1.2){
    // Deslizar para cima/baixo é rolagem, nunca arraste de peça.
    gesture=null;Q('dragGhost').hidden=true;
    Q('viewport').classList.remove('component-drop-ready');return;
   }
   if(g.moved){
    const ghost=Q('dragGhost');
    if(ghost.dataset.kind!==g.kind||!ghost.firstElementChild){
     const img=document.createElement('img');img.src=imageUrl(byKind[g.kind]);img.alt='';img.draggable=false;
     const title=document.createElement('strong');title.textContent=byKind[g.kind].name;
     ghost.replaceChildren(img,title);ghost.dataset.kind=g.kind;
    }
    const box=Q('viewport').getBoundingClientRect();
    const inside=e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom;
    const sidebar=Q('library').getBoundingClientRect();
    const overSidebar=Q('library').classList.contains('open')&&e.clientX>=sidebar.left&&e.clientX<=sidebar.right&&e.clientY>=sidebar.top&&e.clientY<=sidebar.bottom;
    const validDrop=inside&&!overSidebar;
    ghost.hidden=false;ghost.classList.toggle('valid-drop',validDrop);
    ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
    Q('viewport').classList.toggle('component-drop-ready',validDrop);
   }
  }else if(g.type==='group-move'||g.type==='move'){
   g.lastClientX=e.clientX;g.lastClientY=e.clientY;
   if(g.moved){
    if(!g.saved){snapshot();g.saved=true;}
    applyDraggedPosition(g,e.clientX,e.clientY);
    startDragEdgePan();
   }
  }else if(g.type==='wire-end'||g.type==='reconnect-bend'){
   if(g.type==='wire-end')mobileReconnectFinger(g,e);
   moveReconnect(e.clientX,e.clientY);
  }else if(g.type==='wire-bend'){
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved)moveWireBend(g,e.clientX,e.clientY);
  }else if(g.type==='wire-segment'){
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved)moveWireSegment(g,e.clientX,e.clientY);
  }else if(g.type==='wire'){
   if(g.moved){
    if(!state.startPort){snapshot();g.startedNew=true;state.startPort=g.port;state.bends=[];wireTipActive=true;updateHistoryButtons();}
    mobileFingerRoute(g,e);
   }
  }else if(g.type==='bend'){
   setPendingPreview(e);
  }
  else if(g.type==='pan'){if(g.moved){panX=g.x+dx;panY=g.y+dy;camera();}}
 }else if(reconnectPending){
  // Após soltar uma ponta, só outro arraste poderá movimentá-la.
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
 if(gesture?.pointer===e.pointerId)stopDragEdgePan();
 if(e.type==='pointercancel'&&gesture?.pointer===e.pointerId){
  if(gesture.type==='wire-end')cancelReconnect();
  gesture=null;Q('dragGhost').hidden=true;Q('viewport').classList.remove('component-drop-ready');
  wireAlignment=null;partDragAlignment=null;highlightDropZone(false);trackingTouchEnd(e);requestDraw();return;
 }
 if(trackingTouchEnd(e)||pinch)return;
 if(!gesture||e.pointerId!==gesture.pointer)return;
 const g=gesture;gesture=null;Q('dragGhost').hidden=true;
 Q('viewport').classList.remove('component-drop-ready');
 highlightDropZone(false);
 if(handleDoubleTap(e,g))return;
 if(g.type==='reconnect-bend'){
  if(reconnectPending){
   const w=state.wires[reconnectPending.index],fixed=w?.[reconnectPending.end==='a'?'b':'a'];
   const dest=fixed?nearestPort(e.clientX,e.clientY,fixed,9):null;
   if(dest)finishReconnect(dest);
   else{
    const box=Q('viewport').getBoundingClientRect();
    if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){
     const pt=worldXY(e.clientX,e.clientY);addReconnectCorner(pt.x,pt.y);
    }
   }
  }
 }else if(g.type==='wire-end'){
  if(g.moved){
   const wire=state.wires[reconnectPending?.index];
   const fixed=wire?.[reconnectPending.end==='a'?'b':'a'];
   const destination=fixed?nearestPort(e.clientX,e.clientY,fixed,32):null;
   if(destination){suppressPortClickUntil=Date.now()+380;finishReconnect(destination);}
   else leaveReconnectLoose(e.clientX,e.clientY);
  }else cancelReconnect();
  requestDraw();
 }else if(g.type==='catalog'){
  // O painel permanece aberto para arrastar vários componentes seguidos.
  if(!g.moved){centerPart(g.kind);}
  else{
   const box=Q('viewport').getBoundingClientRect();
   const panel=Q('library').getBoundingClientRect();
   const overSidebar=Q('library').classList.contains('open')&&e.clientX>=panel.left&&e.clientX<=panel.right&&e.clientY>=panel.top&&e.clientY<=panel.bottom;
   if(!overSidebar&&e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){
    const p=worldXY(e.clientX,e.clientY);
    addPart(g.kind,p.x-PART_LAYOUTS[g.kind].w/2,p.y-PART_LAYOUTS[g.kind].h/2);
   }else if(!overSidebar)message('Solte o componente na área de criação.',true);
  }
  }else if(g.type==='wire-bend'){
  wireAlignment=null;
  if(g.moved){persist();renderInspector();message('Ângulo da curva ajustado. Outros pontos e conexões mantidos.',true);}
  else message('Ponto selecionado. Excluir apaga somente este quadrado.',true);
  updateHistoryButtons();requestDraw();
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
   // Mesmo ao chegar ao borne, o último trecho respeita a direção do dedo.
   if(e.pointerType==='touch')mobileFinishFingerRoute(g,destination,
    destination?null:worldXY(e.clientX,e.clientY));
   if(destination){connect(destination);
   }else{
     // Um jumper novo também deve parar ao soltar o mouse ou o dedo
     // em um ponto vazio; só um NOVO arraste volta a mover sua bolinha.
     const box=Q('viewport').getBoundingClientRect();
     if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom && state.startPort){
       const position=worldXY(e.clientX,e.clientY);
       const origin=state.startPort;
       if(!g.startedNew)snapshot();
       state.wires.push({
        a:origin,b:origin,color:state.wireColor,
        via:state.bends.map(p=>({...p})),manual:true,
        loose:{end:'b',point:{x:Math.round(position.x),y:Math.round(position.y)}}
       });
       state.startPort=null;state.bends=[];wireTipActive=false;
       previewPoint=null;previewSnapPort=null;pendingAlignment=null;
       state.selectedWire=state.wires.length-1;state.selected=null;state.inspector='wires';
       state.completed=false;refresh();
       message('Ponta solta fixada na bancada. Arraste a bolinha para conectar a um pino.',true);
     }else{previewPoint=null;requestDraw();}
   }
  }
  // O preventDefault do touch suprime o click sintético em alguns celulares.
  // Por isso o toque simples também é tratado aqui, sem depender do navegador.
  if(!g.moved&&e.pointerType==='touch'){
   suppressPortClickUntil=Date.now()+350;
   connect(g.port);
  }
 }else if(g.type==='group-move'){
  partDragAlignment=null;
  if(g.moved){persist();message(g.parts.length+' componentes movidos juntos, com as conexões preservadas.',true);}
  else if(selectionToolActive)toggleComponentSelection(g.main);
  else{renderParts();renderInspector();}
  requestDraw();
 }else if(g.type==='move'){
  partDragAlignment=null;
  if(g.moved&&removeZoneAt(e.clientX,e.clientY)){
   removePart(g.partId,true);
   message('Peça devolvida ao catálogo e removida da montagem.',true);
  }else if(g.moved){persist();}
  else{state.selected=g.partId;renderParts();renderInspector();}
  requestDraw();
 }else if(g.type==='bend'){
  if(g.moved){
   // Não transformar um arraste casual da bancada em uma curva nova.
   setPendingPreview(e);
  }else{
   const pin=nearestPort(e.clientX,e.clientY,state.startPort,9);
   if(pin)connect(pin);
   else{const pos=worldXY(e.clientX,e.clientY);addCorner(pos.x,pos.y);}
  }
 }else if(g.type==='pan'&&!g.moved&&!spaceHeld){
  const wire=wireAt(e.clientX,e.clientY);
  if(wire>=0)selectWire(wire);
  else{state.selected=null;state.selectedWire=null;selectedBend=null;selectedParts.clear();renderParts();renderInspector();updateHistoryButtons();requestDraw();}
 }

}
function hint(){
 const needed=requiredParts();
 if(state.parts.length<needed){
  const next=TYPES.find(t=>t.ids.some(id=>!exists(id))&&(assemblyMode()==='switched'||t.kind!=='switch'));
  if(next)message('Pegue no catálogo: '+next.name+'. Faltam '+(needed-state.parts.length)+' peça(s).',true);
  return;
 }
 const wrong=mistakes()[0];if(wrong){message(mistakeExplanation(wrong),true);return;}
 const miss=missing()[0];if(miss){message('Experimente ligar: '+portName(miss[0])+' → '+portName(miss[1])+'.',true);return;}
 if(Math.abs(state.voltage-5)>.01){message('Ajuste a saída do LM2596 para 5,0 V.',true);return;}
 if(assemblyMode()==='switched'&&(!state.switches.s1||!state.switches.s2)){
  message('Ligue as duas gangorras (cada uma controla só sua própria fonte).',true);return;
 }
 message('Circuito '+(assemblyMode()==='switched'?'com':'sem')+' gangorras completo! Pode iniciar a simulação.',true);
}
function check(){
 const needed=requiredParts();
 if(state.parts.length!==needed){message('O modo '+(assemblyMode()==='switched'?'com':'sem')+' gangorras exige '+needed+' peças. Ainda faltam '+(needed-state.parts.length)+'.',true);return false;}
 if(mistakes().length){message(mistakeExplanation(mistakes()[0]),true);state.inspector='wires';renderInspector();return false;}
 const m=missing();if(m.length){message('Faltam '+m.length+' ligações. Dica: '+portName(m[0][0])+' → '+portName(m[0][1])+'.',true);return false;}
 if(Math.abs(state.voltage-5)>.01){message('Ajuste a saída do LM2596 para 5,0 V.',true);return false;}
 if(assemblyMode()==='switched'&&(!state.switches.s1||!state.switches.s2)){message('Ligue as duas gangorras.',true);return false;}
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
 directConnections:DIRECT_CONNECTIONS.map(([a,b],i)=>({n:i+1,from:portName(a),to:portName(b),a,b})),
 directGroups:[
  {title:'Alimentação do ESP32 (direta)',from:0,to:1,color:'#d9634e',info:'Bateria 9 V positiva diretamente no IN+ do LM2596'},
  {title:'Alimentação dos motores (direta)',from:1,to:2,color:'#d38f39',info:'Seis pilhas AA positivas diretamente no + da MX1508'},
  {title:'Negativos e GND comum',from:2,to:7,color:'#6c8797',info:'LM2596 e MX1508 compartilham terra com ESP32; − da ponte H vai ao GND do ESP32'},
  {title:'Sinais ESP32 → MX1508',from:7,to:11,color:'#3d84b8',info:'GPIO27→IN1, GPIO26→IN2, GPIO32→IN3, GPIO18→IN4'},
  {title:'Motores A e B',from:11,to:15,color:'#229786',info:'Motor A: saídas à direita; Motor B: saídas à esquerda'}
 ],
 components:TYPES.flatMap(t=>t.ids.map(id=>({id,kind:t.kind,name:partName(id),image:t.img,width:PART_LAYOUTS[t.kind].w,height:PART_LAYOUTS[t.kind].h,pins:PART_LAYOUTS[t.kind].pins})))
};

function downloadBlob(blob,filename){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=filename;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1800);
}
// A mesma imagem SVG é usada na prévia E no PNG. Nunca recrie o caminho
// com um roteador diferente, nem suponha que a arte ocupe toda a caixa HTML.
let exportPreviewSnapshot=null;
function exportEsc(value){
 return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
function exportImageLocalRect(img,card){
 // Offset é pré-transformação: não sofre o giro de 90° nem o zoom/pan.
 // Inclui as margens, padding e centralização reais do CSS da bancada.
 let x=0,y=0,node=img,steps=0;
 while(node&&node!==card&&steps++<12){
  x+=node.offsetLeft||0;y+=node.offsetTop||0;
  node=node.offsetParent;
 }
 if(node!==card)throw Error('Não foi possível medir a posição real da imagem.');
 return {x,y,w:img.offsetWidth,h:img.offsetHeight};
}
function exportRotatedBounds(rect,part){
 const d=partLayout(part),cx=part.x+d.w/2,cy=part.y+d.h/2;
 const corners=[
  {x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},
  {x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}
 ].map(p=>{
  const rotated=rotateVector({x:(part.flipped?-1:1)*(p.x-cx),y:p.y-cy},part.rotation);
  return {x:cx+rotated.x,y:cy+rotated.y};
 });
 return {minX:Math.min(...corners.map(p=>p.x)),minY:Math.min(...corners.map(p=>p.y)),
  maxX:Math.max(...corners.map(p=>p.x)),maxY:Math.max(...corners.map(p=>p.y))};
}
async function buildWorkspaceExport(){
 // O editor desenha cada fio num path.wire-line; é essa mesma geometria,
 // inclusive as curvas manuais e posições exatas dos contatos, que copiamos.
 drawWires();
 const svgLayer=Q('wireSvg'),partLayer=Q('partsLayer');
 const paths=[...svgLayer.querySelectorAll('path.wire-line')]
  .filter(el=>!el.classList.contains('wire-pending')&&!el.classList.contains('wire-reconnect-preview'));
 if(paths.length!==state.wires.length){
  throw Error('Termine a conexão ou reconexão pendente antes de gerar a prévia.');
 }
 const wireBounds=paths.map(path=>{
  const b=path.getBBox(),style=getComputedStyle(path);
  const width=parseFloat(style.strokeWidth)||9;
  return {minX:b.x-width,minY:b.y-width,maxX:b.x+b.width+width,maxY:b.y+b.height+width};
 });
 const imageCache=new Map(),parts=[],bounds=[...wireBounds];
 for(const p of state.parts){
  const card=[...partLayer.querySelectorAll('.part')].find(el=>el.dataset.part===p.id);
  const img=card?.querySelector('.part-image img');
  if(!card||!img)throw Error('Componente sem imagem na bancada: '+partName(p.id));
  const relative=exportImageLocalRect(img,card),image={
   x:p.x+relative.x,y:p.y+relative.y,w:relative.w,h:relative.h
  };
  if(!(image.w>0&&image.h>0))throw Error('A imagem de '+partName(p.id)+' ainda não carregou.');
  bounds.push(exportRotatedBounds(image,p));
  const url=img.currentSrc||img.src;
  let href=imageCache.get(url);
  if(!href){
   const response=await fetch(url);
   if(!response.ok)throw Error('Não foi possível carregar a arte de '+partName(p.id));
   const raw=await response.text();
   href='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(raw);
   imageCache.set(url,href);
  }
  const angle=normalizePartRotation(p.rotation);
  const d=partLayout(p),centerX=p.x+d.w/2,centerY=p.y+d.h/2;
  const fit=getComputedStyle(img).objectFit==='fill'?'none':'xMidYMid meet';
  const transformation=p.flipped
   ?'translate('+centerX+' '+centerY+') rotate('+angle+') scale(-1 1) translate('+-centerX+' '+-centerY+')'
   :angle?'rotate('+angle+' '+centerX+' '+centerY+')':'';
  parts.push('<g'+(transformation?' transform="'+transformation+'"':'')+'>'
   +'<image href="'+exportEsc(href)+'" x="'+image.x+'" y="'+image.y+'" width="'+image.w
   +'" height="'+image.h+'" preserveAspectRatio="'+fit+'"/></g>');
 }
 const pad=55;
 const minX=Math.floor(Math.min(...bounds.map(b=>b.minX))-pad);
 const minY=Math.floor(Math.min(...bounds.map(b=>b.minY))-pad);
 const maxX=Math.ceil(Math.max(...bounds.map(b=>b.maxX))+pad);
 const maxY=Math.ceil(Math.max(...bounds.map(b=>b.maxY))+pad);
 const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
 const wires=paths.map(path=>{
  const style=getComputedStyle(path);
  // Mesmo d, mesma cor, espessura e junção que a linha visível no editor.
  const stroke=path.getAttribute('stroke')||style.stroke||'#284452';
  const thickness=parseFloat(style.strokeWidth)||9;
  const opacity=parseFloat(style.opacity);
  return '<path d="'+exportEsc(path.getAttribute('d')||'')+'" fill="none" stroke="'
   +exportEsc(stroke)+'" stroke-width="'+thickness
   +'" stroke-linejoin="round" stroke-linecap="round"'
   +(Number.isFinite(opacity)&&opacity<1?' opacity="'+opacity+'"':'')+'/>';
 }).join('');
 const background=getComputedStyle(Q('viewport')).backgroundColor;
 const fill=/^rgba?\(/.test(background)&&background==='rgba(0, 0, 0, 0)'?'#f7f9fa':(background||'#f7f9fa');
 const xml='<?xml version="1.0" encoding="UTF-8"?>'
  +'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
  +' viewBox="'+minX+' '+minY+' '+width+' '+height+'" width="'+width+'" height="'+height+'">'
  +'<defs><pattern id="bench-dots" width="20" height="20" patternUnits="userSpaceOnUse">'
  +'<circle cx="1" cy="1" r="1.05" fill="#cfdae0"/></pattern></defs>'
  +'<rect x="'+minX+'" y="'+minY+'" width="'+width+'" height="'+height+'" fill="'+exportEsc(fill)+'"/>'
  +'<rect x="'+minX+'" y="'+minY+'" width="'+width+'" height="'+height+'" fill="url(#bench-dots)"/>'
  +parts.join('')+wires+'</svg>';
 return {svg:xml,width,height};
}
function clearExportPreview(){
 if(exportPreviewSnapshot?.url)URL.revokeObjectURL(exportPreviewSnapshot.url);
 exportPreviewSnapshot=null;
 const img=Q('exportPreviewImage');if(img)img.removeAttribute('src');
}
async function downloadWorkspace(){
 if(!state.parts.length){message('Adicione componentes para visualizar a montagem.',true);return;}
 const button=Q('downloadBtn');button.disabled=true;
 try{
  clearExportPreview();
  const image=await buildWorkspaceExport();
  const blob=new Blob([image.svg],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  exportPreviewSnapshot={...image,blob,url};
  Q('exportPreviewImage').src=url;
  Q('exportPreviewSize').textContent=image.width+' × '+image.height+' px · prévia do arquivo';
  Q('exportPreviewDialog').showModal();
 }catch(err){clearExportPreview();message('Não foi possível gerar a prévia: '+err.message,true);}
 finally{button.disabled=false;}
}
async function confirmExportDownload(){
 const snapshot=exportPreviewSnapshot;
 if(!snapshot)return;
 const button=Q('exportConfirmDownload');
 button.disabled=true;button.textContent='Preparando PNG…';
 try{
  const picture=new Image();picture.src=snapshot.url;
  await picture.decode();
  const scale=Math.max(.1,Math.min(2.4,3600/Math.max(snapshot.width,snapshot.height),
   Math.sqrt(13500000/(snapshot.width*snapshot.height))));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(snapshot.width*scale));
  canvas.height=Math.max(1,Math.round(snapshot.height*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Canvas indisponível');
  ctx.drawImage(picture,0,0,canvas.width,canvas.height);
  const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!png)throw Error('Não foi possível converter a imagem para PNG.');
  downloadBlob(png,'TinkerPET-montagem.png');
  message('PNG baixado com o mesmo desenho mostrado na prévia.',true);
 }catch(err){
  message('Falha ao gerar PNG: '+err.message+'. Você pode salvar em SVG.',true);
 }finally{
  button.disabled=false;button.textContent='Baixar PNG';
 }
}
function downloadExportVector(){
 if(!exportPreviewSnapshot)return;
 downloadBlob(exportPreviewSnapshot.blob,'TinkerPET-montagem.svg');
 message('Prévia salva em SVG.',true);
}

function bind(){
 Q('menuBtn').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('drawerHandle').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('openComponentPicker').addEventListener('click',()=>libraryOpen(true));
 Q('closeLibrary').addEventListener('click',()=>libraryOpen(false));Q('sideBackdrop').addEventListener('click',()=>libraryOpen(false));
 Q('componentSearch').addEventListener('input',renderCatalog);
 Q('catalog').addEventListener('pointerdown',paletteDown);
 Q('wireHandles').addEventListener('pointerdown',e=>{
  const handle=e.target.closest('.wire-end-handle');
  if(!handle||pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil||spaceHeld)return;
  beginReconnect(e,state.selectedWire,handle.dataset.wireEnd);
 });
 Q('wireHandles').addEventListener('click',e=>{if(e.target.closest('.wire-end-handle')){e.preventDefault();e.stopPropagation();}});
 Q('partsLayer').addEventListener('pointerdown',e=>{
   if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil)return;
   // A ferramenta mão não deve desativar o seletor de tensão ou as teclas das gangorras.
   if((spaceHeld||e.button===1)&&!e.target.closest('input,select,[data-toggle],[data-remove]')){startPan(e);return;}
   const port=e.target.closest('[data-port]');
   const exactPort=port?actualMotorPort(e,port.dataset.port):null;
   if(reconnectPending&&port){
    // No toque, finalizar aqui (o preventDefault pode suprimir o click).
    if(e.pointerType==='touch'){e.preventDefault();suppressPortClickUntil=Date.now()+450;finishReconnect(exactPort);}
    return;
   }
   if(port&&e.button!==2){
     // Android: os bornes são botões, não campos de texto. Evita foco/teclado
     // sem perder o toque simples, que é finalizado em pointerUp.
     if(e.pointerType==='touch'){
      const active=document.activeElement;
      if(active&&(/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)||active.isContentEditable))active.blur?.();
      Q('componentSearch').blur?.();
      if(e.cancelable!==false)e.preventDefault();
     }
     gesture={type:'wire',pointer:e.pointerId,port:exactPort,startX:e.clientX,startY:e.clientY,moved:false};
     requestDraw();return;
   }
   partDown(e);
 });
 Q('viewport').addEventListener('pointerdown',trackingTouchDown,true);
 Q('viewport').addEventListener('pointerdown',multiSelectCapture,true);
 Q('viewport').addEventListener('pointerdown',captureBendNearComponents,true);
 Q('viewport').addEventListener('pointerdown',viewportDown);
 window.addEventListener('pointermove',pointerMove);
 window.addEventListener('pointerup',pointerUp);
 window.addEventListener('pointercancel',pointerUp);
 Q('partsLayer').addEventListener('click',e=>{
  const pin=e.target.closest('[data-port]');if(pin){
    const exactPort=actualMotorPort(e,pin.dataset.port);
    e.stopPropagation();
    if(spaceHeld||Date.now()<suppressPortClickUntil)return;
    // Em telas pequenas o espaçamento físico dos 30 contatos diminui bastante.
    // O primeiro toque aproxima a placa; o próximo faz a ligação com precisão.
    if(e.isTrusted&&zoom<.69&&pin.dataset.port.startsWith('esp.')){
      cameraZoom(.95,e.clientX,e.clientY);
      message('ESP32 ampliado para selecionar o contato com precisão.',true);
      return;
    }
    if(reconnectPending)finishReconnect(exactPort);
    else connect(exactPort);
    return;
  }
  const del=e.target.closest('[data-remove]');if(del){removePart(del.dataset.remove);return;}
  const toggler=e.target.closest('[data-toggle]');if(toggler){snapshot();state.switches[toggler.dataset.toggle]=!state.switches[toggler.dataset.toggle];refresh();message('Gangorra '+(state.switches[toggler.dataset.toggle]?'ligada':'desligada')+'.');return;}
 });
 // Validação do LM2596: entrada acompanha o controle, mas a conclusão
 // e os confetes só são liberados após soltar e estabilizar por 450 ms.
 function settleVoltageAfterRelease(){
  if(!voltageAdjusting)return;
  clearTimeout(voltageSettleTimer);
  voltageSettleTimer=setTimeout(()=>{
   voltageSettleTimer=0;
   voltageAdjusting=false;
   renderProgress();
   updateTrackLock();
   updateLiveSimulation();
   syncCompletionCelebration();
  },VOLTAGE_SETTLE_MS);
 }
 Q('partsLayer').addEventListener('input',e=>{
  if(e.target.id!=='voltageInput')return;
  clearTimeout(voltageSettleTimer);voltageSettleTimer=0;
  voltageAdjusting=true;
  state.voltage=Number(e.target.value);
  if(Math.abs(state.voltage-5)>.01)completionWasValid=false;
  const out=Q('voltageOutput');
  if(out)out.textContent=state.voltage.toFixed(1).replace('.',',')+' V';
  renderProgress();persist();updateTrackLock();updateLiveSimulation();
 });
 Q('partsLayer').addEventListener('change',e=>{
  if(e.target.id!=='voltageInput')return;
  state.voltage=Number(e.target.value);
  // Change acontece na liberação do range; pointerup cobre o gesto sem change.
  settleVoltageAfterRelease();
  message('LM2596 ajustado para '+state.voltage.toFixed(1).replace('.',',')+' V.');
 });
 Q('partsLayer').addEventListener('pointerup',e=>{
  if(e.target.id==='voltageInput')settleVoltageAfterRelease();
 });
 Q('partsLayer').addEventListener('pointercancel',e=>{
  if(e.target.id==='voltageInput')settleVoltageAfterRelease();
 });
 Q('partsLayer').addEventListener('focusout',e=>{
  if(e.target.id==='voltageInput')settleVoltageAfterRelease();
 });
 Q('wireSvg').addEventListener('pointerdown',e=>{
  if(pinch||activeTouches.size>=2||Date.now()<gestureBlockedUntil||spaceHeld||reconnectPending)return;
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
   if(spaceHeld||state.startPort||reconnectPending)return;
   const target=e.target.closest('[data-wire-index]');if(!target)return;
   e.stopPropagation?.();
   const i=Number(target.dataset.wireIndex);
   if(!state.wires[i])return;
   if(target.dataset.wireVertex!==undefined){
    selectBend(i,Number(target.dataset.wireVertex));return;
   }
   if(selectedBend?.index===i&&target.classList?.contains('wire-bend-mark'))return;
   selectWire(i);
 });
 Q('inspectorBody').addEventListener('click',e=>{const rotate=e.target.closest('[data-rotate-part]');if(rotate){rotatePart(rotate.dataset.rotatePart);return;}const flip=e.target.closest('[data-flip-part]');if(flip){flipPart(flip.dataset.flipPart);return;}const view=e.target.closest('[data-motor-view]');if(view){toggleMotorView(view.dataset.motorView);return;}const demo=e.target.closest('[data-demo-motor]');if(demo){demoMotor(demo.dataset.demoMotor);return;}const del=e.target.closest('[data-remove]');if(del)removePart(del.dataset.remove);const w=e.target.closest('[data-remove-wire]');if(w){removeWire(Number(w.dataset.removeWire));return;}const row=e.target.closest('[data-select-wire]');if(row)selectWire(Number(row.dataset.selectWire));});
 Q('inspectorPartsTab').addEventListener('click',()=>{state.inspector='parts';renderInspector();});
 Q('inspectorWiresTab').addEventListener('click',()=>{state.inspector='wires';renderInspector();});
 Q('colorPalette').addEventListener('click',e=>{
  const swatch=e.target.closest('[data-color]');
  if(swatch)chooseWireColor(swatch.dataset.color);
 });
 Q('wireColorButton').addEventListener('click',e=>{e.stopPropagation();toggleWireColorMenu();});
 Q('wireColorMenu').addEventListener('click',e=>{
  const item=e.target.closest('[data-color]');if(!item)return;
  chooseWireColor(item.dataset.color);closeWireColorMenu(true);
 });
 document.addEventListener('pointerdown',e=>{
  if(!e.target.closest('#wireColorButton,#wireColorMenu'))closeWireColorMenu();
 },true);
 window.addEventListener('resize',positionWireColorMenu,{passive:true});
 Q('undoBtn').addEventListener('click',undo);
 Q('redoBtn').addEventListener('click',redo);
 Q('copyBtn').addEventListener('click',copySelection);
 Q('rotateBtn').addEventListener('click',rotateSelectedPart);
 const flipButton=document.createElement('button');
 flipButton.id='flipBtn';flipButton.className='control-btn flip-component-btn';flipButton.type='button';
 flipButton.disabled=true;flipButton.title='Selecione um componente para inverter esquerda e direita';
 flipButton.setAttribute('aria-label',flipButton.title);flipButton.setAttribute('aria-pressed','false');
 flipButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18" stroke-dasharray="2 3"/><path d="m9 7-5 5 5 5M15 7l5 5-5 5"/><path d="M4 12h16"/></svg>';
 Q('rotateBtn').after(flipButton);
 flipButton.addEventListener('click',flipSelectedPart);
 Q('selectionToolBtn').addEventListener('click',()=>{
  if(!selectionToolActive){if(state.startPort)cancelPendingWire();if(reconnectPending)cancelReconnect();}
  selectionToolActive=!selectionToolActive;updateMultiSelectionTool();
  message(selectionToolActive?'Seletor ligado: clique nas peças e arraste qualquer selecionada para mover o grupo.':'Seletor desligado. Shift+clique também seleciona várias peças.',true);
 });
 Q('pasteBtn').disabled=true;
 Q('pasteBtn').addEventListener('click',pasteSelection);
 Q('deleteBtn').addEventListener('click',()=>{
  if(selectedBend&&removeSelectedBend())return;
  if(selectedParts.size>1){message('Selecione uma única peça para excluí-la.',true);return;}
  if(Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire]){removeWire(state.selectedWire);return;}
  const selected=byPart(state.selected);
  if(selected)removePart(selected.id);
  else if(state.startPort)cancelPendingWire();
  else message('Toque em uma peça ou em um fio para selecionar e excluir.',true);
 });
 Q('clearBtn').addEventListener('click',()=>{if(!state.parts.length)return;if(confirm('Apagar todas as peças e fios da bancada?')){snapshot();selectedParts.clear();state.parts=[];state.wires=[];state.selected=null;state.startPort=null;state.bends=[];previewPoint=null;state.switches={s1:false,s2:false};state.voltage=4;refresh();message('Bancada limpa. Comece de novo!');}});
 Q('downloadBtn').addEventListener('click',downloadWorkspace);
 Q('exportConfirmDownload').addEventListener('click',confirmExportDownload);
 Q('exportDownloadSvg').addEventListener('click',downloadExportVector);
 Q('exportPreviewClose').addEventListener('click',()=>Q('exportPreviewDialog').close());
 Q('exportPreviewDialog').addEventListener('close',clearExportPreview);
 Q('exportPreviewDialog').addEventListener('click',e=>{
  if(e.target===Q('exportPreviewDialog'))Q('exportPreviewDialog').close();
 });
 Q('hintBtn').addEventListener('click',hint);
 Q('saveBtn').addEventListener('click',()=>{persist();message('Seu projeto foi salvo neste navegador.',true);});
 // Progresso interativo: explica o fio errado, não só o total.
 const progressDetails=Q('editorToolbarProgress');
 if(progressDetails){
  const explain=()=>{
   const bad=mistakes(),needed=missing();
   if(bad.length){
    const w=bad[0];
    message(w.loose?'Jumper com ponta solta: arraste a bolinha até um pino.':('Fio incorreto: '+portName(w.a)+' → '+portName(w.b)+'. Remova esse jumper e confira a alimentação. '+(needed.length?'Faltam '+needed.length+' ligações.':'')),true);
   }else if(needed.length){
    const [from,to]=needed[0];
    message('Faltam '+needed.length+' ligações. Próxima: '+portName(from)+' → '+portName(to)+'.',true);
   }else message('Todas as ligações estão corretas!',true);
  };
  progressDetails.addEventListener('click',explain);
  progressDetails.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();explain();}
  });
 }
 const done=Q('completionDialog');
 if(done){
  Q('completionClose')?.addEventListener('click',dismissCompletionCelebration);
  done.addEventListener('cancel',e=>{e.preventDefault();dismissCompletionCelebration();});
  done.addEventListener('close',()=>{clearTimeout(completionCloseTimer);clearInterval(completionCountTimer);completionCloseTimer=0;completionCountTimer=0;});
 }
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
  if(e.key==='Escape'&&!Q('wireColorMenu').hidden){
   e.preventDefault();closeWireColorMenu(true);return;
  }
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
  if(e.key==='Escape'&&reconnectPending){e.preventDefault();cancelReconnect();message('Ponta restaurada ao contato original.');return;}
  if(e.key==='Escape'&&state.startPort){e.preventDefault();cancelPendingWire();message('Fio cancelado.');return;}
  if(e.key==='Escape'&&selectedParts.size>0){
   e.preventDefault();selectedParts.clear();selectionToolActive=false;state.selected=null;
   updateMultiSelectionTool();renderParts();renderInspector();message('Seleção desfeita.',true);return;
  }
  if(e.key==='Backspace'&&state.startPort&&!e.target.closest('input,textarea,select')){
   e.preventDefault();undo();return;
  }
  if((e.key==='r'||e.key==='R')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,[contenteditable]')&&byPart(state.selected)){
   e.preventDefault();rotateSelectedPart();return;
  }
  if((e.key==='i'||e.key==='I')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,[contenteditable]')&&byPart(state.selected)){
   e.preventDefault();flipSelectedPart();return;
  }
  if(['Delete','Backspace'].includes(e.key)&&!e.target.closest('input,textarea,select')){
    if(selectedBend){e.preventDefault();removeSelectedBend();return;}
    if(Number.isInteger(state.selectedWire)&&state.wires[state.selectedWire]){e.preventDefault();removeWire(state.selectedWire);return;}
    if(selectedParts.size>1){e.preventDefault();message('Para excluir uma única peça, selecione-a individualmente.',true);return;}
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
 window.addEventListener('blur',()=>{stopDragEdgePan();spaceHeld=false;Q('viewport').classList.remove('pan-space');Object.keys(keys).forEach(k=>keys[k]=false);});
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
