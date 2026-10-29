'use strict';
(() => {
const ROOT='https://raw.githubusercontent.com/gabrieljsantos/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/main/assets/images/componentes/';
const TYPES=[
 {kind:'esp',name:'ESP32 DevKit V1',img:'assets/esp32-devkit-v1-30p.svg',ids:['esp'],pins:[["VIN","VIN"],["GND","GND"],["D13","D13"],["D12","D12"],["D14","D14"],["D27","D27"],["D26","D26"],["D25","D25"],["D33","D33"],["D32","D32"],["D35","D35"],["D34","D34"],["VN","VN"],["VP","VP"],["EN","EN"],["3V3","3V3"],["GND2","GND"],["D15","D15"],["D2","D2"],["D4","D4"],["RX2","RX2"],["TX2","TX2"],["D5","D5"],["D18","D18"],["D19","D19"],["D21","D21"],["RX0","RX0"],["TX0","TX0"],["D22","D22"],["D23","D23"]],info:'Placa de 30 pinos com USB à esquerda e nomes em cada contato. Os dois GND são equivalentes.',tip:'Neste carrinho: VIN recebe 5 V, GND comum, D27→IN1, D26→IN2, D32→IN3 e D18→IN4.'},
 {kind:'driver',name:'Ponte H MX1508',img:'assets/mx1508-desenhado.svg',ids:['drv'],pins:[['VCC','VCC +'],['GND','GND −'],['IN1','IN1'],['IN2','IN2'],['IN3','IN3'],['IN4','IN4'],['OUT1','A • 1'],['OUT2','A • 2'],['OUT3','B • 1'],['OUT4','B • 2']],info:'A ponte H recebe os sinais do ESP32 e controla os dois motores. Cada motor utiliza um par de saídas.',tip:'As saídas A e B têm dois bornes cada; a numeração 1 e 2 aqui é didática.'},
 {kind:'buck',name:'Regulador LM2596',img:'assets/lm2596-desenhado.svg',ids:['lm'],pins:[['INP','IN +'],['INN','IN −'],['OUTP','OUT +'],['OUTN','OUT −']],info:'Regulador de tensão. Neste projeto, a saída para o ESP32 deve ser ajustada para 5,0 V.',tip:'Na montagem real, um responsável deve medir 5 V com multímetro antes de conectar VIN.'},
 {kind:'battery',name:'Bateria 9 V',img:'assets/bateria-9v-desenhada.svg',ids:['b1','b2'],pins:[['POS','+'],['NEG','−']],info:'Duas baterias em circuitos independentes: uma para o ESP32 e outra para os motores.',tip:'A bateria 1 alimenta o LM2596 por uma gangorra; a bateria 2 alimenta a ponte H pela outra.'},
 {kind:'switch',name:'Chave gangorra',img:'assets/gangorra-desenhada.svg',ids:['s1','s2'],pins:[['IN','IN'],['OUT','OUT']],info:'Chave física liga/desliga, instalada em série com o fio positivo da sua bateria.',tip:'São duas chaves: uma alimenta o regulador do ESP32 e a outra alimenta a ponte H.'},
 {kind:'motor',name:'Motor DC',img:'assets/motor-frontal.svg',ids:['ml','mr'],pins:[['A','+'],['B','−']],info:'Motor DC com caixa de redução amarela, eixo lateral para a roda e dois contatos no motor metálico. Na simulação, a ponte H controla o sentido de giro.',tip:'Os dois contatos ficam ao lado do motor metálico, identificados em vermelho e preto. O eixo de saída fica na caixa amarela.'}
];
const byKind=Object.fromEntries(TYPES.map(p=>[p.kind,p]));
const PART_LAYOUTS={
 esp:{w:790,h:365,pins:{"VIN":[14.4,18.5],"GND":[19.43,18.5],"D13":[24.46,18.5],"D12":[29.49,18.5],"D14":[34.52,18.5],"D27":[39.55,18.5],"D26":[44.58,18.5],"D25":[49.61,18.5],"D33":[54.64,18.5],"D32":[59.67,18.5],"D35":[64.7,18.5],"D34":[69.73,18.5],"VN":[74.76,18.5],"VP":[79.79,18.5],"EN":[84.82,18.5],"3V3":[14.4,85.7],"GND2":[19.43,85.7],"D15":[24.46,85.7],"D2":[29.49,85.7],"D4":[34.52,85.7],"RX2":[39.55,85.7],"TX2":[44.58,85.7],"D5":[49.61,85.7],"D18":[54.64,85.7],"D19":[59.67,85.7],"D21":[64.7,85.7],"RX0":[69.73,85.7],"TX0":[74.76,85.7],"D22":[79.79,85.7],"D23":[84.82,85.7]}},
 driver:{w:250,h:317,pins:{VCC:[24.3,84.5],GND:[34.7,84.5],IN1:[45,84.5],IN2:[55.3,84.5],IN3:[65.7,84.5],IN4:[76,84.5],OUT1:[25.3,12.9],OUT2:[40.7,12.9],OUT3:[58.7,12.9],OUT4:[73.7,12.9]}},
 buck:{w:288,h:180,pins:{INP:[14.72,35.1],INN:[14.72,63.1],OUTP:[85,35.1],OUTN:[85,63.1]}},
 battery:{w:170,h:228,pins:{POS:[30.6,7.4],NEG:[68.6,7.4]}},
 switch:{w:205,h:146,pins:{IN:[8,60],OUT:[92,60]}},
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
const valid=new Set(EXPECTED.map(([a,b])=>electricalKey(a,b)));
const allPorts=new Set(TYPES.flatMap(t=>t.ids.flatMap(id=>t.pins.map(p=>id+'.'+p[0]))));
const Q=id=>document.getElementById(id);
const WORLD={w:1900,h:1450};
const COLORS=['#ed654d','#316fc0','#1f434c','#32a47b','#e5a13d','#a378c8'];
let state={parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:COLORS[0],selected:null,startPort:null,inspector:'parts',completed:false,bends:[]};
let zoom=1,panX=0,panY=0,gesture=null,history=[],toastTimer=0,previewPoint=null,drawPending=false;
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
  state.parts=s.parts.filter(p=>p&&byId[p.id]&&!names.has(p.id)&&names.add(p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({id:p.id,kind:byId[p.id].kind,x:limit(p.x,0,WORLD.w-PART_LAYOUTS[byId[p.id].kind].w),y:limit(p.y,0,WORLD.h-PART_LAYOUTS[byId[p.id].kind].h),view:byId[p.id].kind==='motor'&&p.view==='side'?'side':'front'}));
  state.wires=s.wires.filter(w=>w&&allPorts.has(w.a)&&allPorts.has(w.b)&&w.a!==w.b&&exists(w.a.split('.')[0])&&exists(w.b.split('.')[0])).slice(0,80).map(w=>({a:w.a,b:w.b,color:COLORS.includes(w.color)?w.color:COLORS[0],via:Array.isArray(w.via)?w.via.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,48).map(p=>({x:limit(p.x,0,WORLD.w),y:limit(p.y,0,WORLD.h)})):[]}));
  if(Number.isFinite(s.voltage))state.voltage=limit(s.voltage,3,6);
  if(s.switches)state.switches={s1:!!s.switches.s1,s2:!!s.switches.s2};
  if(COLORS.includes(s.wireColor))state.wireColor=s.wireColor;
 }catch(err){console.warn('Progresso indisponível',err);}
}
function persist(){
 try{localStorage.setItem('tinkerpet-v2',JSON.stringify({parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches,wireColor:state.wireColor}));Q('savedIndicator').textContent='● Salvo';}catch(e){Q('savedIndicator').textContent='● Não salvo';}
}
function snapshot(){history.push(JSON.stringify({parts:state.parts,wires:state.wires,voltage:state.voltage,switches:state.switches}));if(history.length>35)history.shift();}
function undo(){
 if(state.startPort){
  if(state.bends.length){state.bends.pop();previewPoint=null;requestDraw();message('Última curva retirada.');}
  else{cancelPendingWire();message('Fio cancelado.');}
  return;
 }
 if(!history.length){message('Nada para desfazer.');return;}
 const s=JSON.parse(history.pop());Object.assign(state,s,{startPort:null,bends:[],selected:null,completed:false});
 renderAll();message('Última alteração desfeita.');
}
const limit=(x,min,max)=>Math.max(min,Math.min(max,x));
const partName=id=>{const base=byId[id];return base?base.name+(base.ids.length>1?' '+(base.ids.indexOf(id)+1):''):id;};
const portName=id=>{const [part,code]=id.split('.');const t=byId[part];const p=t&&t.pins.find(x=>x[0]===code);return partName(part)+' · '+(p?p[1]:code);};
function imageUrl(p){return p.img.startsWith('assets/')?p.img:ROOT+p.img;}
function motorImage(p){return p.view==='side'?'assets/motor-lateral.svg':'assets/motor-frontal.svg';}
function partLayout(p){return p.kind==='motor'&&p.view==='side'?PART_LAYOUTS.motorSide:PART_LAYOUTS[p.kind];}
function message(msg,toast=false){Q('statusText').textContent=msg;if(toast){const el=Q('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}}
function countGood(){return state.wires.filter(w=>valid.has(electricalKey(w.a,w.b))).length;}
function mistakes(){return state.wires.filter(w=>!valid.has(electricalKey(w.a,w.b)));}
function missing(){const wired=new Set(state.wires.map(w=>electricalKey(w.a,w.b)));return EXPECTED.filter(([a,b])=>!wired.has(electricalKey(a,b)));}
function ready(){return state.parts.length===9&&missing().length===0&&mistakes().length===0&&Math.abs(state.voltage-5)<.01&&state.switches.s1&&state.switches.s2;}
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
  if(p.kind==='switch')card.dataset.powered=state.switches[p.id]?'on':'off';
  card.className='part'+(state.selected===p.id?' selected':'');
  card.dataset.part=p.id;card.dataset.kind=p.kind;card.style.left=p.x+'px';card.style.top=p.y+'px';
  card.style.setProperty('--part-w',layout.w+'px');card.style.setProperty('--part-h',layout.h+'px');
  card.style.zIndex=state.selected===p.id?'5':'3';
  const head=document.createElement('div');head.className='part-head';
  const title=document.createElement('strong');title.textContent=partName(p.id);
  const del=document.createElement('button');del.type='button';del.className='part-remove';del.dataset.remove=p.id;
  del.title='Remover peça';del.setAttribute('aria-label','Remover '+partName(p.id));del.textContent='×';
  head.append(title,del);
  const imgbox=document.createElement('div');imgbox.className='part-image';
  const img=document.createElement('img');img.src=p.kind==='motor'?motorImage(p):imageUrl(t);img.alt='';img.draggable=false;
  imgbox.append(img);
  if(p.kind==='esp'){
   const label=document.createElement('span');label.className='esp-board-instruction';
   label.textContent='Toque nos contatos dourados para ligar fios';
   imgbox.append(label);
  }
  if(p.kind==='motor'){
   const rotor=document.createElement('span');rotor.className='motor-shaft-spinner';rotor.setAttribute('aria-hidden','true');
   imgbox.append(rotor);
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
   toggle.textContent=state.switches[p.id]?'LIGADA':'DESLIGADA';
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
 requestDraw();
}
function renderColors(){
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
  const row=document.createElement('div');row.className='wire-item';
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
 const layout=partLayout(part);part.x=limit(part.x,0,WORLD.w-layout.w);part.y=limit(part.y,0,WORLD.h-layout.h);
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
 Q('progressBar').style.width=total/EXPECTED.length*100+'%';
 const badge=Q('validationBadge');badge.className='validation-badge'+(ready()?' ok':errors?' error':'');
 badge.textContent=ready()?'✓ Circuito pronto para iniciar':errors?errors+' ligação(ões) fora do esquema':state.parts.length<9?'Peças na bancada: '+state.parts.length+' / 9':'Faltam '+missing().length+' ligações';
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
 const ix=state.parts.length;
 const layout=PART_LAYOUTS[kind];state.parts.push({id,kind,x:limit(Math.round(x),0,WORLD.w-layout.w),y:limit(Math.round(y),0,WORLD.h-layout.h),view:'front'});
 state.selected=id;state.inspector='parts';state.completed=false;state.startPort=null;refresh();
 message(partName(id)+' adicionado. Arraste pela imagem; toque nos contatos para ligar os fios.',true);
 return true;
}
function removePart(id){
 if(!exists(id))return;
 snapshot();
 state.parts=state.parts.filter(p=>p.id!==id);
 state.wires=state.wires.filter(w=>w.a.split('.')[0]!==id&&w.b.split('.')[0]!==id);
 if(state.selected===id)state.selected=null;
 if(state.startPort&&state.startPort.split('.')[0]===id){state.startPort=null;state.bends=[];previewPoint=null;}
 if(id==='s1'||id==='s2')state.switches[id]=false;
 state.completed=false;refresh();message(partName(id)+' removido.');
}
function cancelPendingWire(){
 state.startPort=null;state.bends=[];previewPoint=null;renderParts();requestDraw();
}
function addCorner(x,y){
 if(!state.startPort)return;
 const pt={x:limit(Math.round(x),0,WORLD.w),y:limit(Math.round(y),0,WORLD.h)};
 const prev=state.bends.at(-1)||getPortPos(state.startPort);
 if(prev&&Math.hypot(pt.x-prev.x,pt.y-prev.y)<6)return;
 if(state.bends.length>=48){message('Limite de curvas atingido. Termine o fio em outro pino.',true);return;}
 state.bends.push(pt);previewPoint=null;
 requestDraw();
 message('Curva '+state.bends.length+' fixada. Toque em outro ponto para continuar ou em um pino para terminar.');
}
function connect(id){
 const part=id.split('.')[0];if(!exists(part))return;
 state.selected=part;state.inspector='parts';
 if(!state.startPort){
  state.startPort=id;state.bends=[];previewPoint=null;
  message('Fio iniciado em '+portName(id)+'. Toque na bancada para criar curvas, depois no pino de destino.');
  renderParts();renderInspector();requestDraw();return;
 }
 const first=state.startPort;
 if(id===first){cancelPendingWire();message('Ligação cancelada.');return;}
 const via=state.bends.map(p=>({x:p.x,y:p.y}));
 state.startPort=null;state.bends=[];previewPoint=null;
 const index=state.wires.findIndex(w=>electricalKey(w.a,w.b)===electricalKey(first,id));
 snapshot();
 if(index>=0){state.wires.splice(index,1);message('Ligação existente removida.');}
 else{
  state.wires.push({a:first,b:id,color:state.wireColor,via});
  message(valid.has(electricalKey(first,id))?'✓ Fio sólido conectado com '+via.length+' curva(s).':'Fio criado, mas os terminais precisam ser revisados.',!valid.has(electricalKey(first,id)));
 }
 state.completed=false;refresh();
}
function removeWire(i){if(!state.wires[i])return;snapshot();state.wires.splice(i,1);state.completed=false;refresh();message('Fio removido.');}
function getPortPos(id){
 const el=$port(id);if(!el)return null;
 const box=el.getBoundingClientRect(),w=Q('world').getBoundingClientRect();
 return {x:(box.left+box.width/2-w.left)/zoom,y:(box.top+box.height/2-w.top)/zoom};
}
function wireCurve(a,b){return wireRoute(a,[],b);}
function wireRoute(start,via,end){
 const point=p=>({x:Math.round(p.x),y:Math.round(p.y)});
 const anchors=[...(via||[]),...(end?[end]:[])].map(point);
 const origin=point(start);let prev=origin;
 let path='M'+origin.x+' '+origin.y;
 for(const to of anchors){
  if(Math.abs(to.x-prev.x)<2||Math.abs(to.y-prev.y)<2){
    path+=' L'+to.x+' '+to.y;
  }else{
    path+=' L'+to.x+' '+prev.y+' L'+to.x+' '+to.y;
  }
  prev=to;
 }
 return path;
}
function drawWires(){
 drawPending=false;
 const svg=Q('wireSvg');svg.replaceChildren();
 for(let i=0;i<state.wires.length;i++){
  const w=state.wires[i],a=getPortPos(w.a),b=getPortPos(w.b);if(!a||!b)continue;
  const d=wireRoute(a,w.via||[],b);
  const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.setAttribute('d',d);hit.setAttribute('class','wire-target');hit.dataset.wireIndex=String(i);
  hit.setAttribute('aria-label','Remover ligação '+portName(w.a)+' com '+portName(w.b));
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',d);
  path.setAttribute('class','wire-line'+(valid.has(electricalKey(w.a,w.b))?'':' wire-error'));
  path.setAttribute('stroke',w.color);
  svg.append(hit,path);
 }
 if(state.startPort){
  const origin=getPortPos(state.startPort);
  if(origin){
   const anchors=state.bends||[];
   if(anchors.length||previewPoint){
    const route=wireRoute(origin,anchors,previewPoint);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',route);path.setAttribute('class','wire-line wire-pending');
    path.setAttribute('stroke',state.wireColor);
    svg.append(path);
   }
   for(const p of anchors){
    const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',String(Math.round(p.x)));dot.setAttribute('cy',String(Math.round(p.y)));
    dot.setAttribute('r','5');dot.setAttribute('class','wire-corner');
    dot.setAttribute('fill',state.wireColor);svg.append(dot);
   }
  }
 }
}
function requestDraw(){if(drawPending)return;drawPending=true;requestAnimationFrame(drawWires);}
function camera(){
 const w=Q('world');w.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
 Q('zoomLabel').textContent=Math.round(zoom*100)+'%';
 const note=Q('worldNote'),v=Q('viewport');
 note.style.left=limit((v.clientWidth/2-panX)/zoom,150,WORLD.w-150)+'px';
 note.style.top=limit((v.clientHeight/2-panY)/zoom,170,WORLD.h-170)+'px';
 requestDraw();
}
function fitCamera(){
 const vw=Q('viewport').clientWidth;
 zoom=vw<520?.83:limit((vw-55)/WORLD.w,.55,1);
 panX=vw<520?14:Math.max(14,(vw-WORLD.w*zoom)/2);
 panY=vw<520?70:32;
 camera();
}
function zoomTo(factor){
 const rect=Q('viewport').getBoundingClientRect(),cx=rect.width/2,cy=rect.height/2;
 const wx=(cx-panX)/zoom,wy=(cy-panY)/zoom;
 zoom=limit(zoom*factor,.4,1.6);
 panX=cx-wx*zoom;panY=cy-wy*zoom;camera();
}
function worldXY(clientX,clientY){
 const r=Q('viewport').getBoundingClientRect();
 return {x:(clientX-r.left-panX)/zoom,y:(clientY-r.top-panY)/zoom};
}
function centerPart(kind){
 const v=Q('viewport').getBoundingClientRect();
 const center=worldXY(v.left+v.width/2,v.top+v.height/2);
 const size=PART_LAYOUTS[kind];if(!size)return false;
 const spaces=[];
 for(let y=24;y<=WORLD.h-size.h-24;y+=125){
  for(let x=24;x<=WORLD.w-size.w-24;x+=125){
   const clear=state.parts.every(p=>{
    const d=partLayout(p),pad=26;
    return x+size.w+pad<=p.x||p.x+d.w+pad<=x||y+size.h+pad<=p.y||p.y+d.h+pad<=y;
   });
   if(clear)spaces.push({x,y,d:Math.hypot(x+size.w/2-center.x,y+size.h/2-center.y)});
  }
 }
 if(!spaces.length){message('Bancada cheia. Mova algumas peças para liberar espaço.',true);return false;}
 spaces.sort((a,b)=>a.d-b.d);
 const target=spaces[0];
 const added=addPart(kind,target.x,target.y);
 if(added){
  const sx=panX+(target.x+size.w/2)*zoom,sy=panY+(target.y+size.h/2)*zoom;
  if(sx<70||sx>v.width-70||sy<80||sy>v.height-80){
   panX=v.width/2-(target.x+size.w/2)*zoom;
   panY=v.height/2-(target.y+size.h/2)*zoom;
   camera();
  }
 }
 return added;
}
function libraryOpen(open){
 const yes=!!open;
 Q('library').classList.toggle('open',yes);
 Q('sideBackdrop').hidden=!yes;
 Q('menuBtn').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-expanded',String(yes));
 Q('drawerHandle').setAttribute('aria-label',yes?'Fechar componentes':'Abrir componentes');
 Q('drawerHandle').classList.toggle('open',yes);
}
function partDown(e){
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('button,input,label'))return;
 const el=e.target.closest('.part');if(!el)return;
 const p=byPart(el.dataset.part);if(!p)return;
 e.preventDefault();
 state.selected=p.id;state.inspector='parts';
 renderInspector();renderParts();
 gesture={type:'move',pointer:e.pointerId,partId:p.id,startX:e.clientX,startY:e.clientY,partX:p.x,partY:p.y,moved:false};
}
function paletteDown(e){
 if(e.button!==undefined&&e.button!==0)return;
 const el=e.target.closest('.catalog-card');if(!el||el.disabled)return;
 e.preventDefault();
 gesture={type:'catalog',pointer:e.pointerId,kind:el.dataset.kind,startX:e.clientX,startY:e.clientY,moved:false};
}
function viewportDown(e){
 if(e.button!==undefined&&e.button!==0)return;
 if(e.target.closest('.part')||e.target.closest('.wire-target'))return;
 e.preventDefault();
 gesture={type:'pan',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:panX,y:panY,moved:false};
}
let suppressPortClickUntil=0;
function pointerMove(e){
 if(gesture&&e.pointerId===gesture.pointer){
  const g=gesture,dx=e.clientX-g.startX,dy=e.clientY-g.startY;
  if(Math.hypot(dx,dy)>(g.type==='wire'?12:g.type==='pan'?9:6))g.moved=true;
  if(g.type==='catalog'){
   if(g.moved){const ghost=Q('dragGhost');ghost.hidden=false;ghost.textContent=byKind[g.kind].name;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}
  }else if(g.type==='move'){
   const p=byPart(g.partId);if(!p)return;
   if(g.moved&&!g.saved){snapshot();g.saved=true;}
   if(g.moved){
    const dim=partLayout(p);
    p.x=limit(Math.round(g.partX+dx/zoom),0,WORLD.w-dim.w);
    p.y=limit(Math.round(g.partY+dy/zoom),0,WORLD.h-dim.h);
    const el=[...Q('partsLayer').querySelectorAll('.part')].find(node=>node.dataset.part===p.id);
    if(el){el.style.left=p.x+'px';el.style.top=p.y+'px';}
    requestDraw();
   }
  }else if(g.type==='wire'){
   if(g.moved){
    if(!state.startPort){state.startPort=g.port;state.bends=[];}
    previewPoint=worldXY(e.clientX,e.clientY);
    requestDraw();
   }
  }else if(g.type==='pan'){if(g.moved){panX=g.x+dx;panY=g.y+dy;camera();}}
 }else if(state.startPort){
  const r=Q('viewport').getBoundingClientRect();
  if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){previewPoint=worldXY(e.clientX,e.clientY);requestDraw();}
 }
}
function pointerUp(e){
 if(!gesture||e.pointerId!==gesture.pointer)return;
 const g=gesture;gesture=null;Q('dragGhost').hidden=true;
 if(g.type==='catalog'){
  if(!g.moved){centerPart(g.kind);libraryOpen(false);}
  else{
   const box=Q('viewport').getBoundingClientRect();
   if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){const p=worldXY(e.clientX,e.clientY);addPart(g.kind,p.x-PART_LAYOUTS[g.kind].w/2,p.y-PART_LAYOUTS[g.kind].h/2);libraryOpen(false);}
   else message('Solte a peça sobre a bancada para adicioná-la.',true);
  }
 }else if(g.type==='wire'){
  if(g.moved){
   const found=document.elementFromPoint?document.elementFromPoint(e.clientX,e.clientY):null;
   const to=found&&found.closest?found.closest('[data-port]'):null;
   const first=state.startPort||g.port;
   suppressPortClickUntil=Date.now()+350;
   if(!state.startPort)connect(first);
   if(to&&to.dataset.port!==first){
     connect(to.dataset.port);
   }else{
     const box=Q('viewport').getBoundingClientRect();
     if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){
       const pos=worldXY(e.clientX,e.clientY);addCorner(pos.x,pos.y);
     }else{previewPoint=null;requestDraw();}
   }
  }
  // Em toque simples, o evento click chama connect; não resetar a origem aqui.
 }else if(g.type==='move'){
  if(g.moved)persist();
  else{state.selected=g.partId;renderParts();renderInspector();}
 }else if(g.type==='pan'&&!g.moved){
  if(state.startPort){
   const pos=worldXY(e.clientX,e.clientY);
   addCorner(pos.x,pos.y);
  }else{state.selected=null;renderParts();renderInspector();}
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
 if(!play) syncMotorAnimation(0,0);
 updateTrackLock();if(play)drawTrack();
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
  const speed=ready()&&!Q('playPanel').hidden&&!car.finished?velocities[id]:0;
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
function bind(){
 Q('menuBtn').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('drawerHandle').addEventListener('click',()=>libraryOpen(!Q('library').classList.contains('open')));
 Q('closeLibrary').addEventListener('click',()=>libraryOpen(false));Q('sideBackdrop').addEventListener('click',()=>libraryOpen(false));
 Q('componentSearch').addEventListener('input',renderCatalog);
 Q('catalog').addEventListener('pointerdown',paletteDown);
 Q('partsLayer').addEventListener('pointerdown',e=>{
   const port=e.target.closest('[data-port]');
   if(port&&e.button!==2){
     gesture={type:'wire',pointer:e.pointerId,port:port.dataset.port,startX:e.clientX,startY:e.clientY,moved:false};
     requestDraw();return;
   }
   partDown(e);
 });
 Q('viewport').addEventListener('pointerdown',viewportDown);
 window.addEventListener('pointermove',pointerMove);
 window.addEventListener('pointerup',pointerUp);
 window.addEventListener('pointercancel',pointerUp);
 Q('partsLayer').addEventListener('click',e=>{
  const pin=e.target.closest('[data-port]');if(pin){
    e.stopPropagation();
    if(Date.now()<suppressPortClickUntil)return;
    connect(pin.dataset.port);return;
  }
  const del=e.target.closest('[data-remove]');if(del){removePart(del.dataset.remove);return;}
  const toggler=e.target.closest('[data-toggle]');if(toggler){snapshot();state.switches[toggler.dataset.toggle]=!state.switches[toggler.dataset.toggle];refresh();message('Gangorra '+(state.switches[toggler.dataset.toggle]?'ligada':'desligada')+'.');return;}
 });
 Q('partsLayer').addEventListener('input',e=>{if(e.target.id==='voltageInput'){state.voltage=Number(e.target.value);const out=Q('voltageOutput');if(out)out.textContent=state.voltage.toFixed(1).replace('.',',')+' V';renderProgress();persist();updateTrackLock();}});
 Q('partsLayer').addEventListener('change',e=>{if(e.target.id==='voltageInput')message('LM2596 ajustado para '+state.voltage.toFixed(1).replace('.',',')+' V.');});
 Q('wireSvg').addEventListener('click',e=>{const el=e.target.closest('[data-wire-index]');if(el)removeWire(Number(el.dataset.wireIndex));});
 Q('inspectorBody').addEventListener('click',e=>{const view=e.target.closest('[data-motor-view]');if(view){toggleMotorView(view.dataset.motorView);return;}const demo=e.target.closest('[data-demo-motor]');if(demo){demoMotor(demo.dataset.demoMotor);return;}const del=e.target.closest('[data-remove]');if(del)removePart(del.dataset.remove);const w=e.target.closest('[data-remove-wire]');if(w)removeWire(Number(w.dataset.removeWire));});
 Q('inspectorPartsTab').addEventListener('click',()=>{state.inspector='parts';renderInspector();});
 Q('inspectorWiresTab').addEventListener('click',()=>{state.inspector='wires';renderInspector();});
 Q('colorPalette').addEventListener('click',e=>{const swatch=e.target.closest('[data-color]');if(swatch){state.wireColor=swatch.dataset.color;renderColors();requestDraw();persist();}});
 Q('undoBtn').addEventListener('click',undo);
 Q('clearBtn').addEventListener('click',()=>{if(!state.parts.length)return;if(confirm('Apagar todas as peças e fios da bancada?')){snapshot();state.parts=[];state.wires=[];state.selected=null;state.startPort=null;state.bends=[];previewPoint=null;state.switches={s1:false,s2:false};state.voltage=4;refresh();message('Bancada limpa. Comece de novo!');}});
 Q('hintBtn').addEventListener('click',hint);
 Q('saveBtn').addEventListener('click',()=>{persist();message('Seu projeto foi salvo neste navegador.',true);});
 Q('checkBtn').addEventListener('click',()=>{if(check()){switchView(true);message('Circuito conferido! Carrinho liberado.',true);}});
 Q('playTab').addEventListener('click',()=>{switchView(true);if(!ready())message('Monte o circuito e use a dica para descobrir o que falta.',true);});
 Q('editTab').addEventListener('click',()=>switchView(false));Q('backBtn').addEventListener('click',()=>switchView(false));Q('goToBuild').addEventListener('click',()=>switchView(false));
 Q('zoomIn').addEventListener('click',()=>zoomTo(1.25));Q('zoomOut').addEventListener('click',()=>zoomTo(.8));Q('fitBtn').addEventListener('click',fitCamera);
 Q('viewport').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoomTo(e.deltaY<0?1.12:.89);}}, {passive:false});
 Q('guideBtn').addEventListener('click',()=>Q('guideDialog').showModal());
 Q('closeGuide').addEventListener('click',()=>Q('guideDialog').close());
 Q('startGuide').addEventListener('click',()=>Q('guideDialog').close());
 Q('restartDrive').addEventListener('click',resetDrive);
 const binds={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state.startPort){e.preventDefault();cancelPendingWire();message('Fio cancelado.');return;}
  if(e.key==='Backspace'&&state.startPort&&!e.target.closest('input,textarea,select')){
   e.preventDefault();
   if(state.bends.length){state.bends.pop();previewPoint=null;requestDraw();message('Última curva retirada.');}
   else cancelPendingWire();
   return;
  }
  if(Q('playPanel').hidden||!ready()||e.target.closest('input,textarea,select'))return;
  if(binds[e.key]){e.preventDefault();keys[binds[e.key]]=true;}
  if(e.key===' '){e.preventDefault();Object.keys(keys).forEach(k=>keys[k]=false);Q('driveReadout').textContent='Parado';}
 });
 document.addEventListener('keyup',e=>{if(binds[e.key])keys[binds[e.key]]=false;});
 window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
 document.querySelectorAll('[data-drive]').forEach(btn=>{
  const dir=btn.dataset.drive;
  btn.addEventListener('pointerdown',e=>{
   if(!ready())return;e.preventDefault();if(dir==='stop'){Object.keys(keys).forEach(k=>keys[k]=false);Q('driveReadout').textContent='Parado';return;}
   btn.setPointerCapture(e.pointerId);keys[dir]=true;btn.classList.add('pressed');
  });
  const end=()=>{if(dir!=='stop')keys[dir]=false;btn.classList.remove('pressed');};
  btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);btn.addEventListener('lostpointercapture',end);
 });
 window.addEventListener('resize',()=>{fitCamera();requestDraw();});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(requestDraw).observe(Q('viewport'));
}
safeRestore();bind();renderAll();fitCamera();drawTrack();requestAnimationFrame(drive);
if(document.fonts)document.fonts.ready.then(requestDraw);
})();
