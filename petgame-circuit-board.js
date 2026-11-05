/* PETGame 2.1 · bancada visual do carrinho ESP32.
   Os fios reais do circuito são desenhados; uma conexão é retirada ou trocada.
   Controles: arrastar a ponta livre ou tocá-la e tocar em outro terminal.
   Não se trata de uma ligação com o editor principal ou de uma simulação elétrica SPICE. */
(()=>{
'use strict';
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ASSET='assets/component-preview/';
const PARTS=[
 {id:'battery9',name:'BATERIA 9 V',x:28,y:45,w:160,h:115,img:'battery-9v.svg',color:'#dce9f5'},
 {id:'switch1',name:'GANGORRA ESP32',x:242,y:70,w:130,h:85,img:'switch.svg',color:'#dce9f5'},
 {id:'buck',name:'LM2596',x:420,y:43,w:175,h:134,img:'lm2596.svg',color:'#dce9f5'},
 {id:'esp',name:'ESP32',x:706,y:25,w:190,h:288,img:'esp32.svg',color:'#dce9f5'},
 {id:'pack4',name:'SUPORTE A · 4 AA',x:27,y:440,w:168,h:120,pack:4,color:'#f8e7c8'},
 {id:'pack2',name:'SUPORTE B · 2 AA',x:248,y:437,w:140,h:122,pack:2,color:'#f8e7c8'},
 {id:'switch2',name:'GANGORRA MOTORES',x:441,y:459,w:132,h:95,img:'switch.svg',color:'#f8e7c8'},
 {id:'driver',name:'PONTE H',x:720,y:392,w:202,h:174,img:'driver-mx1508.svg',color:'#e6def4'},
 {id:'motorA',name:'MOTOR A',x:1000,y:386,w:150,h:104,img:'motor-front.svg',color:'#d8f3ee'},
 {id:'motorB',name:'MOTOR B',x:1000,y:520,w:150,h:104,img:'motor-front.svg',color:'#d8f3ee'}
];
const PINS={
 'battery9.POS':[188,92],'battery9.NEG':[188,135],
 'switch1.IN':[242,103],'switch1.OUT':[372,103],
 'buck.INP':[420,92],'buck.INN':[420,144],'buck.OUTP':[595,92],'buck.OUTN':[595,144],
 'esp.VIN':[706,85],'esp.GND':[706,132],
 'esp.D27':[706,186],'esp.D26':[706,215],'esp.D32':[706,244],
 'esp.D18':[896,240],'esp.D19':[896,274],
 'pack4.POS':[195,469],'pack4.NEG':[195,530],
 'pack2.NEG':[248,473],'pack2.POS':[388,473],
 'switch2.IN':[441,503],'switch2.OUT':[573,503],
 'driver.VCC':[720,420],'driver.GND':[720,452],
 'driver.IN1':[720,481],'driver.IN2':[720,502],'driver.IN3':[720,524],'driver.IN4':[720,547],
 'driver.MA+':[922,422],'driver.MA-':[922,452],
 'driver.MB+':[922,505],'driver.MB-':[922,536],
 'motorA.POS':[1000,422],'motorA.NEG':[1000,455],
 'motorB.POS':[1000,547],'motorB.NEG':[1000,583]
};
// Each wire represents one established connection in the six-AA + 9 V car design.
const WIRES=[
 ['bat9-sw','battery9.POS','switch1.IN','#e9963c'],
 ['sw-buck','switch1.OUT','buck.INP','#e9963c'],
 ['bat9-ground','battery9.NEG','buck.INN','#4b6a8d'],
 ['buck-esp-vin','buck.OUTP','esp.VIN','#e9963c'],
 ['buck-esp-ground','buck.OUTN','esp.GND','#4b6a8d'],
 ['aa-series','pack4.POS','pack2.NEG','#f29c31'],
 ['aa-switch','pack2.POS','switch2.IN','#e25b5e'],
 ['switch-driver','switch2.OUT','driver.VCC','#e25b5e'],
 ['aa-driver-ground','pack4.NEG','driver.GND','#4b6a8d'],
 ['common-ground','driver.GND','esp.GND','#307fa1'],
 ['command-in1','esp.D27','driver.IN1','#7382d7'],
 ['command-in2','esp.D26','driver.IN2','#7382d7'],
 ['command-in3','esp.D32','driver.IN3','#7382d7'],
 ['command-in4','driver.IN4','esp.D18','#a86cd9'],
 ['motor-a-positive','driver.MA+','motorA.POS','#dfac46'],
 ['motor-a-negative','driver.MA-','motorA.NEG','#dfac46'],
 ['motor-b-positive','driver.MB+','motorB.POS','#45b89e'],
 ['motor-b-negative','driver.MB-','motorB.NEG','#45b89e']
];
const FAULTS={
 1:{wire:'aa-series',loose:[220,515],target:'pack2.NEG',title:'Ligação entre os dois suportes de pilhas'},
 2:{wire:'motor-a-positive',loose:[969,466],target:'motorA.POS',title:'Fio do Motor A'},
 4:{wire:'common-ground',loose:[652,394],target:'esp.GND',title:'GND compartilhado'},
 5:{wire:'command-in4',bad:'esp.D19',target:'esp.D18',title:'Comando IN4 no pino incorreto'}
};
let drag=null;
const isWiring=i=>Object.prototype.hasOwnProperty.call(FAULTS,i);
const getPin=id=>PINS[id]||null;
function wirePath(a,b,variant=0){
 const [x,y]=a,[u,v]=b,mx=x+(u-x)*.49;
 // The curves are separate SVG paths so children can inspect every wire.
 return 'M '+x+' '+y+' C '+(x+(u-x)*.34)+' '+(y+(variant%3-1)*5)+' '+
 (u-(u-x)*.34)+' '+(v+(variant%3-1)*5)+' '+u+' '+v;
}
function packImage(n,x,y,w,h){
 const bw=n===4?26:36;
 let cells='';
 for(let i=0;i<n;i++){
  const bx=x+16+(i%(n===4?4:2))*(bw+5),by=y+26;
  cells+='<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="45" rx="5" fill="#cad3d4" stroke="#72858e" stroke-width="1.5"/>'+
    '<rect x="'+(bx+5)+'" y="'+(by+4)+'" width="'+(bw-10)+'" height="34" rx="3" fill="#e7d56b"/>'+
    '<rect x="'+(bx+bw/2-4)+'" y="'+(by-4)+'" width="8" height="4" rx="1.5" fill="#879eaa"/>';
 }
 return '<g aria-hidden="true"><rect x="'+(x+8)+'" y="'+(y+19)+'" width="'+(w-16)+'" height="61" rx="10" fill="#343e48"/>'+cells+'</g>';
}
function node(c){
 const {x,y,w,h,name,color}=c;
 const image=c.pack?packImage(c.pack,x,y,w,h):
  '<image href="'+ASSET+c.img+'" x="'+(x+11)+'" y="'+(y+18)+'" width="'+(w-22)+'" height="'+(h-23)+'" preserveAspectRatio="xMidYMid meet"/>';
 return '<g class="pg-component" data-component="'+c.id+'">'+
  '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="13" fill="#fffefc" stroke="'+color+'" stroke-width="3"/>'+
  '<rect x="'+(x+1)+'" y="'+(y+1)+'" width="'+(w-2)+'" height="22" rx="11" fill="'+color+'"/>'+
  '<rect x="'+(x+1)+'" y="'+(y+15)+'" width="'+(w-2)+'" height="9" fill="'+color+'"/>'+
  '<text class="pg-component-label" x="'+(x+w/2)+'" y="'+(y+16)+'" text-anchor="middle">'+esc(name)+'</text>'+
 image+'</g>';
}
function pinLabel(id,x,y){
 const label=id.split('.')[1].replace('POS','+').replace('NEG','−').replace('INP','IN+').replace('INN','IN−').replace('OUTP','OUT+').replace('OUTN','OUT−');
 // Labels sit to the left/right of a terminal, depending on component side.
 const isLeft=['switch1.IN','buck.INP','buck.INN','esp.VIN','esp.GND','esp.D27','esp.D26','esp.D32',
 'driver.VCC','driver.GND','driver.IN1','driver.IN2','driver.IN3','driver.IN4','pack2.NEG','switch2.IN'].includes(id);
 const sx=x+(isLeft?-13:13),anchor=isLeft?'end':'start';
 return '<text class="pg-pin-label" x="'+sx+'" y="'+(y-10)+'" text-anchor="'+anchor+'">'+esc(label)+'</text>';
}
function render(index,d){
 if(!isWiring(index))return '';
 const fault=FAULTS[index],selected=!!d.values.wireSelected;
 let allWires='',floating='',pins='';
 const destination=(d.values.wireDestination===undefined)?fault.bad||'':d.values.wireDestination;
 const faultWire=WIRES.find(w=>w[0]===fault.wire);
 if(!faultWire)return '';
 const final=faultWire[2];
 for(let i=0;i<WIRES.length;i++){
  const [key,src,dest,color]=WIRES[i];
  const start=getPin(src);
  const isFault=key===fault.wire;
  const to=isFault?(getPin(destination)||fault.loose):getPin(dest);
  const complete=!!getPin(destination);
  const p='<path class="pg-wire'+(isFault?' pg-fault-wire':'')+
   (isFault&&complete?' pg-repositioned':'')+'" data-wire="'+esc(key)+'" d="'+wirePath(start,to,i)+
   '" stroke="'+color+'" fill="none" stroke-width="'+(isFault?6:3.3)+'" stroke-linecap="round"/>';
  allWires+=p;
  if(isFault){
   const [ex,ey]=to;
   floating='<g class="pg-wire-handle'+(selected?' selected':'')+'" role="button" tabindex="0" '+
    'data-wire-handle="1" aria-label="Segurar e mover a ponta do fio com defeito" transform="translate('+ex+' '+ey+')">'+
    '<circle r="18" fill="#fff9da" stroke="#da793e" stroke-width="3" stroke-dasharray="'+(complete?'0':'4 3')+'"/>'+
    '<circle r="7" fill="'+color+'" stroke="#ffffff" stroke-width="2"/></g>';
  }
 }
 for(const [id,xy] of Object.entries(PINS)){
  const [x,y]=xy;
  pins+='<g class="pg-pin'+(selected?' ready':'')+'" data-pin="'+esc(id)+'" role="button" tabindex="0" '+
   'aria-label="Terminal '+esc(id.replace('.',' '))+'">'+
   '<circle cx="'+x+'" cy="'+y+'" r="14" fill="transparent" stroke="transparent"/>'+
   '<circle cx="'+x+'" cy="'+y+'" r="6.2" fill="#fff" stroke="#285c69" stroke-width="2.5"/>'+
   pinLabel(id,x,y)+'</g>';
 }
 const status=selected?'Ponta selecionada: toque no terminal para conectar.':
  destination===fault.target?'Ligação alterada: teste o circuito para verificar.':
  'Observe os fios. A ponta destacada pode ser arrastada ou tocada e conectada a outro pino.';
 const hint=destination?'Você pode mudar a ligação novamente.':'O circuito está montado com um fio desconectado.';
 return '<section class="pg-assembly" aria-label="Bancada visual do carrinho ESP32">'+
  '<div class="pg-assembly-top"><strong>Montagem do carrinho — circuito quase completo</strong>'+
  '<span>Deslize para os lados no celular para ver toda a bancada</span></div>'+
  '<div class="pg-board-scroll"><div class="pg-board-inner"><svg class="pg-real-circuit" viewBox="0 0 1180 675" '+
   'role="group" aria-label="Circuito com bateria de 9 V, LM2596, ESP32, 6 pilhas AA, ponte H, gangorras e motores" '+
   'preserveAspectRatio="xMidYMid meet">'+
   '<rect x="0" y="0" width="1180" height="675" rx="16" fill="#f4faf7"/>'+
   '<defs><pattern id="pgGrid" width="20" height="20" patternUnits="userSpaceOnUse">'+
   '<circle cx="1" cy="1" r="1" fill="#bfd2cd"/></pattern></defs>'+
   '<rect width="1180" height="675" fill="url(#pgGrid)"/>'+
   '<path d="M 22 333 H 1157" stroke="#a6cfc4" stroke-width="2" stroke-dasharray="6 7"/>'+
   '<text class="pg-zone-label" x="25" y="23">ALIMENTAÇÃO ESP32 · BATERIA 9 V</text>'+
   '<text class="pg-zone-label" x="26" y="373">ALIMENTAÇÃO DOS MOTORES · 6 PILHAS AA</text>'+
   PARTS.map(node).join('')+
   '<g class="pg-wires">'+allWires+'</g><g class="pg-pin-layer">'+pins+'</g>'+
   floating+'</svg></div></div>'+
   '<div class="pg-assembly-status" role="status"><span class="pg-signal"></span><span>'+
   esc(status)+'</span></div><p class="pg-assembly-note">'+esc(hint)+'</p></section>';
}
function setDestination(index,d,dest){
 if(!isWiring(index)||!PINS[dest])return false;
 d.values.wireDestination=dest;d.values.wireSelected=false;d.testResult=null;
 d.message='Você mudou a ligação do fio. Teste o circuito para ver o resultado.';
 return true;
}
function beginWire(index,d){if(!isWiring(index)||!d.baseline||d.fixed)return false;d.values.wireSelected=true;return true}
function handleClick(e,index,d,refresh){
 if(!isWiring(index)||!d.baseline||d.fixed)return false;
 const handle=e.target.closest('[data-wire-handle]');
 if(handle){
  if(!beginWire(index,d))return true;
  refresh();return true;
 }
 const port=e.target.closest('[data-pin]');
 if(port){
  if(d.values.wireSelected){setDestination(index,d,port.dataset.pin);refresh()}
  else{d.message='Selecione primeiro a ponta do fio destacada e depois o terminal.';refresh()}
  return true;
 }
 return false;
}
const svgPoint=(svg,e)=>{
 const rect=svg.getBoundingClientRect();
 return [1180*(e.clientX-rect.left)/Math.max(rect.width,1),
         675*(e.clientY-rect.top)/Math.max(rect.height,1)];
};
function handlePointerDown(e,index,d){
 if(!isWiring(index)||!d.baseline||d.fixed)return;
 if(!e.target.closest('[data-wire-handle]'))return;
 const svg=e.target.closest('svg.pg-real-circuit');if(!svg)return;
 e.preventDefault();
 const [x,y]=svgPoint(svg,e);
 drag={pointerId:e.pointerId,svg,start:[x,y],moved:false,index};
 try{svg.setPointerCapture(e.pointerId)}catch{}
}
function handlePointerMove(e,index,d){
 if(!drag||drag.pointerId!==e.pointerId||drag.index!==index)return;
 const [x,y]=svgPoint(drag.svg,e),[a,b]=drag.start;
 if(Math.hypot(x-a,y-b)>8)drag.moved=true;
 if(!drag.moved)return;
 const fault=FAULTS[index],wire=WIRES.find(w=>w[0]===fault.wire),source=PINS[wire[1]];
 const path=drag.svg.querySelector('[data-wire="'+fault.wire+'"]'),handle=drag.svg.querySelector('[data-wire-handle]');
 if(path)path.setAttribute('d',wirePath(source,[x,y]));
 if(handle)handle.setAttribute('transform','translate('+x+' '+y+')');
}
function handlePointerUp(e,index,d,refresh){
 if(!drag||drag.pointerId!==e.pointerId||drag.index!==index)return false;
 const ctx=drag;drag=null;
 try{ctx.svg.releasePointerCapture(e.pointerId)}catch{}
 if(!ctx.moved)return false; // A tap falls through to the click handler.
 const [x,y]=svgPoint(ctx.svg,e);
 let near=null,best=30;
 for(const [id,xy] of Object.entries(PINS)){
  const distance=Math.hypot(x-xy[0],y-xy[1]);
  if(distance<best){best=distance;near=id}
 }
 if(near)setDestination(index,d,near);
 else {d.values.wireSelected=true;d.message='Agora toque no terminal que deseja usar.'}
 refresh();return true;
}
window.PetGameCircuitBoard={render,isWiring,handleClick,handlePointerDown,handlePointerMove,
 handlePointerUp,beginWire,setDestination,PINS,WIRES,FAULTS};
})();
