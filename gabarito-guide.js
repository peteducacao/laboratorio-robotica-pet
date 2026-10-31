'use strict';
(()=>{
const $=id=>document.getElementById(id);
if(sessionStorage.getItem('tinkerpet-gabarito-access')!=='ok'){location.replace('projects.html');return;}
const parts={
 b1:{label:'Bateria 9 V',asset:'assets/bateria-9v-desenhada.svg',x:20,y:85,w:88,h:125},
 s1:{label:'Gangorra 1',asset:'assets/gangorra-desenhada.svg?v=3',x:138,y:98,w:95,h:77},
 lm:{label:'LM2596',asset:'assets/lm2596-desenhado.svg',x:267,y:87,w:137,h:88},
 esp:{label:'ESP32',asset:'assets/esp32-devkit-v1-30p.svg?v=29',x:523,y:65,w:410,h:190},
 b2:{label:'Suporte de pilhas',asset:'assets/suporte-6-pilhas.svg',x:25,y:340,w:130,h:125},
 s2:{label:'Gangorra 2',asset:'assets/gangorra-desenhada.svg?v=3',x:181,y:357,w:94,h:75},
 drv:{label:'Ponte H',asset:'assets/mx1508-desenhado.svg?v=38',x:445,y:370,w:155,h:188},
 ml:{label:'Motor 1',asset:'assets/motor-frontal.svg',x:700,y:325,w:86,h:177},
 mr:{label:'Motor 2',asset:'assets/motor-frontal.svg',x:848,y:325,w:86,h:177}
};
const groups=[
 {id:'lm',title:'Alimentação · LM2596',color:'#2465ad',parts:['b1','s1','lm','esp']},
 {id:'drv',title:'Ponte H · Motores',color:'#d34d43',parts:['b2','s2','drv','ml','mr','esp']},
 {id:'esp',title:'ESP32 · Circuito completo',color:'#26343d',parts:Object.keys(parts)}
];
const wire=(a,b,section,color)=>({a,b,section,color});
// Ordem pedagógica: fonte de energia -> interruptor (quando houver) -> módulo -> controlador.
// Não ordenar alfabeticamente nem pela posição dos componentes.
const direct=[
 wire('b1.NEG','lm.INN','lm','#263f4a'),
 wire('b1.POS','lm.INP','lm','#e96550'),
 wire('lm.OUTP','esp.VIN','lm','#e96550'),
 wire('lm.OUTN','esp.GND','lm','#263f4a'),
 wire('b2.NEG','drv.GND','drv','#263f4a'),
 wire('b2.POS','drv.VCC','drv','#e96550')
];
const switched=[
 wire('b1.NEG','lm.INN','lm','#263f4a'),
 wire('b1.POS','s1.IN','lm','#e96550'),
 wire('s1.OUT','lm.INP','lm','#e96550'),
 wire('lm.OUTP','esp.VIN','lm','#e96550'),
 wire('lm.OUTN','esp.GND','lm','#263f4a'),
 wire('b2.NEG','drv.GND','drv','#263f4a'),
 wire('b2.POS','s2.IN','drv','#e96550'),
 wire('s2.OUT','drv.VCC','drv','#e96550')
];
const remaining=[
 wire('drv.GND','esp.GND2','drv','#263f4a'),
 wire('drv.IN1','esp.D27','drv','#9468bd'),
 wire('drv.IN2','esp.D26','drv','#9468bd'),
 wire('drv.IN3','esp.D32','drv','#269e79'),
 wire('drv.IN4','esp.D18','drv','#269e79'),
 wire('drv.OUT1','mr.B','drv','#2c9879'),
 wire('drv.OUT2','mr.A','drv','#2c9879'),
 wire('drv.OUT3','ml.B','drv','#986cc0'),
 wire('drv.OUT4','ml.A','drv','#986cc0')
];
const anchors={
 b1:{POS:[78/255,16/340],NEG:[175/255,21/340]},
 b2:{POS:[44/330,15/315],NEG:[286/330,15/315]},
 s1:{IN:[70/280,194/225],OUT:[140/280,194/225]},
 s2:{IN:[70/280,194/225],OUT:[140/280,194/225]},
 lm:{INP:[53/360,79/225],INN:[53/360,142/225],OUTP:[307/360,79/225],OUTN:[307/360,142/225]},
 esp:{VIN:[101/930,56/430],GND:[152.5/930,56/430],GND2:[152.5/930,373/430],D27:[358.5/930,56/430],D26:[410/930,56/430],D32:[564.5/930,56/430],D18:[513/930,373/430]},
 drv:{VCC:[73/300,321/380],GND:[104/300,321/380],IN1:[135/300,321/380],IN2:[166/300,321/380],IN3:[197/300,321/380],IN4:[228/300,321/380],OUT1:[212/300,63/380],OUT2:[257/300,63/380],OUT3:[73/300,63/380],OUT4:[118/300,63/380]},
 ml:{A:[45/300,567/640],B:[45/300,533/640]},mr:{A:[45/300,567/640],B:[45/300,533/640]}
};
let mode=null,all=[],section='lm',index=0,full=false,lastGuideSection='lm',lastGuideIndex=0;
function pos(port){const [id,pin]=port.split('.'),p=parts[id],a=anchors[id][pin];return [p.x+p.w*a[0],p.y+p.h*a[1]];}
function esc(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function label(port){const [id,pin]=port.split('.');return parts[id].label+' · '+pin.replace('OUTP','OUT+').replace('OUTN','OUT−').replace('INP','IN+').replace('INN','IN−').replace('POS','+').replace('NEG','−');}
function path(w,i){
 const [x1,y1]=pos(w.a),[x2,y2]=pos(w.b),bend=(x1+x2)/2+(i%3-1)*12;
 // Em vez de atravessar a fileira de pinos na horizontal, o fio chega
 // perpendicularmente ao furo correto. Isso evita confundir D18 com D19.
 if(w.b.startsWith('esp.')){
  const bottom=w.b==='esp.D18'||w.b==='esp.GND2';
  const outside=bottom?parts.esp.y+parts.esp.h+18+(i%3)*6:parts.esp.y-18-(i%3)*6;
  return 'M'+x1+' '+y1+' H'+bend+' V'+outside+' H'+x2+' V'+y2;
 }
 return 'M'+x1+' '+y1+' H'+bend+' V'+y2+' H'+x2;
}
function visibleParts(wires){const set=new Set();wires.forEach(w=>{set.add(w.a.split('.')[0]);set.add(w.b.split('.')[0]);});return set;}
function drawing(wires,active=-1,print=false){
 const visible=visibleParts(wires);
 const nodes=Object.entries(parts).filter(([id])=>visible.has(id)).map(([id,p])=>'<image href="'+p.asset+'" x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" preserveAspectRatio="xMidYMid meet"/><text x="'+(p.x+p.w/2)+'" y="'+(p.y-7)+'" font-size="14" text-anchor="middle" font-weight="700" fill="#315663">'+esc(p.label)+'</text>').join('');
 const lines=wires.map((w,i)=>'<path class="wire '+(active>=0?(i===active?'active':'dim'):'')+'" d="'+path(w,i)+'" stroke="'+w.color+'" stroke-width="4.5" fill="none"/>'+((active===i||active<0||print)?[w.a,w.b].map(port=>{const [x,y]=pos(port);return '<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+w.color+'" stroke="#fff" stroke-width="2"/>';}).join(''):'')).join('');
 const boxes=[...visible].map(id=>parts[id]);const x=Math.max(0,Math.min(...boxes.map(p=>p.x))-24),y=Math.max(0,Math.min(...boxes.map(p=>p.y))-30),right=Math.min(960,Math.max(...boxes.map(p=>p.x+p.w))+24),bottom=Math.min(605,Math.max(...boxes.map(p=>p.y+p.h))+24);return '<svg viewBox="'+x+' '+y+' '+(right-x)+' '+(bottom-y)+'" role="img" aria-label="Esquema de ligação dos componentes">'+nodes+lines+'</svg>';
}
function sequence(){return section==='esp'?all:all.filter(w=>w.section===section);}
// Uma tela de ESP32 completa nunca deve iniciar numa ligação isolada.
function showFull(){
 if(!full){lastGuideSection=section==='esp'?'lm':section;lastGuideIndex=section==='esp'?0:index;}
 section='esp';full=true;index=0;render();
}
function returnToGuide(){section=lastGuideSection;index=lastGuideIndex;full=false;render();}
function selectSection(id){
 if(id==='esp'){showFull();return;}
 section=id;lastGuideSection=id;index=0;full=false;render();
}
function render(){
 if(!mode)return;
 const seq=sequence(),current=!full?seq[Math.min(index,seq.length-1)]:null;
 $('stageTitle').textContent=groups.find(g=>g.id===section).title;
 $('stageTag').textContent=full?'Montagem completa':'Ligação '+(index+1)+' de '+seq.length;
 $('mainTitle').textContent='Gabarito '+(mode==='switch'?'com gangorras':'sem gangorras');
 $('viewer').classList.toggle('complete',full);
 $('viewer').innerHTML=full?drawing(all,-1):drawing(seq.slice(0,index+1),index);
 $('instruction').textContent=full?'Circuito completo: todas as conexões':label(current.a)+' → '+label(current.b);
 $('description').textContent=full?'Todos os fios já estão conectados. No celular, deslize a imagem para os lados para observar os terminais.':'A ligação destacada indica os dois terminais. As conexões anteriores permanecem discretas para orientar a montagem.';
 $('count').textContent=full?all.length+' ligações':'Passo '+(index+1)+' / '+seq.length;
 $('bar').style.width=(full?100:(index+1)/seq.length*100)+'%';
 $('prev').disabled=!full&&section==='lm'&&index===0;
 $('next').disabled=false;
 $('next').textContent=full?'Concluir ✓':(index===seq.length-1?'Avançar →':'Próximo →');
 $('stepList').innerHTML=full?all.map((w,i)=>'<li class="done">'+(i+1)+'. '+esc(label(w.a))+' → '+esc(label(w.b))+'</li>').join(''):seq.map((w,i)=>'<li class="'+(i===index?'current':i<index?'done':'')+'">'+(i+1)+'. '+esc(label(w.a))+' → '+esc(label(w.b))+'</li>').join('');
 $('all').textContent=full?'Voltar ao passo a passo':'Ver circuito completo';
 $('tabs').innerHTML=groups.map(g=>'<button data-section="'+g.id+'" class="'+(section===g.id?'selected':'')+'">'+g.title+'</button>').join('');
 $('download').disabled=false;
}
function selectMode(m){
 mode=m;all=[...(m==='switch'?switched:direct),...remaining];
 $('chooser').hidden=true;section='lm';index=0;full=false;lastGuideSection='lm';lastGuideIndex=0;render();
}
// Fechar o seletor volta à lista de circuitos, sem deixar a tela de gabarito vazia.
function exitChooser(){location.href='projects.html?release=20261031-gpio18-mobile-fix-v2';}
$('cancelChooser').addEventListener('click',exitChooser);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('chooser').hidden){e.preventDefault();exitChooser();}
});
$('cancelChooser').focus({preventScroll:true});
$('chooser').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)selectMode(b.dataset.mode);});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(b)selectSection(b.dataset.section);});
$('prev').onclick=()=>{
 if(full){returnToGuide();return;}
 if(index>0)index--;
 else if(section==='drv'){section='lm';index=sequence().length-1;}
 render();
};
$('next').onclick=()=>{
 if(full){location.href='projects.html?release=20261031-gpio18-mobile-fix-v2';return;}
 if(index<sequence().length-1){index++;render();return;}
 if(section==='lm'){selectSection('drv');return;}
 if(section==='drv')showFull();
};
$('repeat').onclick=()=>{if(full){selectSection('lm');return;}index=0;render();};
$('all').onclick=()=>{if(full)returnToGuide();else showFull();};

const printPartNames={b1:'Bateria 9 V',b2:'Suporte 6 pilhas AA',s1:'Gangorra 1',s2:'Gangorra 2',lm:'LM2596',esp:'ESP32',drv:'Ponte H',ml:'Motor 1',mr:'Motor 2'};
function printPortName(port){
 const [id,pin]=port.split('.');
 const names={POS:'positivo (+)',NEG:'negativo (−)',INP:'IN+',INN:'IN−',OUTP:'OUT+',OUTN:'OUT−',VCC:'positivo (+)',GND:'GND',GND2:'GND',IN:'contato 1',OUT:'contato 2',A:'terminal +',B:'terminal −'};
 const pinName=names[pin]||(pin.startsWith('D')?'GPIO '+pin.slice(1):pin);
 return printPartNames[id]+' · '+pinName;
}
// Versão vertical do esquema de energia, projetada para preencher a primeira folha A4.
function printPowerDiagram(wires){
 const layout={
  b1:{x:40,y:82,w:123,h:173},s1:{x:201,y:110,w:116,h:95},
  lm:{x:378,y:82,w:195,h:124},esp:{x:65,y:320,w:612,h:283}
 };
 function get(port){
  const [id,pin]=port.split('.'),part=layout[id],coord=anchors[id][pin];
  if(!part||!coord)throw new Error('Terminal inexistente: '+port);
  return [part.x+part.w*coord[0],part.y+part.h*coord[1]];
 }
 const routes={
  'b1.NEG|lm.INN':(a,b)=>[[171,a[1]],[171,275],[358,275],[358,b[1]]],
  'b1.POS|lm.INP':(a,b)=>[[a[0],43],[357,43],[357,b[1]]],
  'b1.POS|s1.IN':(a,b)=>[[a[0],43],[188,43],[188,b[1]]],
  's1.OUT|lm.INP':(a,b)=>[[343,a[1]],[343,b[1]]],
  'lm.OUTP|esp.VIN':(a,b)=>[[594,a[1]],[594,285],[b[0],285]],
  'lm.OUTN|esp.GND':(a,b)=>[[629,a[1]],[629,303],[b[0],303]]
 };
 const point=p=>p.map(n=>n.toFixed(1)).join(' ');
 const lines=wires.map(w=>{
  const a=get(w.a),b=get(w.b),route=routes[w.a+'|'+w.b];
  if(!route)throw new Error('Ligação sem trajeto: '+w.a+' → '+w.b);
  const path=[a,...route(a,b),b].map((p,i)=>(i?'L':'M')+point(p)).join(' ');
  return '<path d="'+path+'" stroke="white" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
   '<path d="'+path+'" stroke="'+w.color+'" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
 }).join('');
 const names={b1:'BATERIA 9 V',s1:'GANGORRA',lm:'REGULADOR LM2596',esp:'ESP32'};
 const visible=Object.keys(layout).filter(id=>id!=='s1'||wires.some(w=>w.a.startsWith('s1.')||w.b.startsWith('s1.')));
 const partsSvg=visible.map(id=>{
  const p=layout[id];
  return '<image href="'+parts[id].asset+'" x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" preserveAspectRatio="xMidYMid meet"/>'+
   '<text x="'+(p.x+p.w/2)+'" y="'+(p.y-15)+'" fill="#234b58" font-family="Arial,sans-serif" font-size="17" font-weight="700" text-anchor="middle">'+names[id]+'</text>';
 }).join('');
 const ends=wires.map(w=>[w.a,w.b].map(port=>{
  const [x,y]=get(port);
  return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5.3" fill="'+w.color+'" stroke="white" stroke-width="2"/>';
 }).join('')).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 625" role="img" aria-label="Alimentação do ESP32 com componentes ampliados para impressão">'+
  '<rect width="720" height="625" rx="16" fill="#f7fbfc"/>'+
  '<rect x="12" y="12" width="696" height="600" rx="12" fill="none" stroke="#dce9ee" stroke-width="2"/>'+
  '<path d="M34 294H685" fill="none" stroke="#d8e6eb" stroke-width="2" stroke-dasharray="5 10"/>'+
  lines+partsSvg+ends+'</svg>';
}
const printDescriptions={
 lm:'Fonte de 9 V, regulador LM2596 e alimentação da placa ESP32.',
 drv:'Alimentação, comandos da ponte H e saídas para os motores.',
 esp:'Visão geral das ligações de todos os componentes do carrinho.'
};

$('download').onclick=()=>{
 if(!mode)return;
 const pages=groups.map((g,n)=>{
  const wires=g.id==='esp'?all:all.filter(w=>w.section===g.id);
  const rows=wires.map((w,i)=>'<div class="print-item"><span class="print-step-num">'+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="print-connection"><strong>'+esc(printPortName(w.a))+'</strong><span class="print-arrow">→</span><strong>'+esc(printPortName(w.b))+'</strong></span></div>').join('');
  const visual=g.id==='lm'?printPowerDiagram(wires):drawing(wires,-1,true);
  return '<section class="sheet sheet--'+g.id+'" style="--sheet-color:'+g.color+'">'+
   '<header class="print-head"><div class="print-brand"><img src="assets/logo-pet.svg" alt="PET Educação"><div><strong>TinkerPET Studio</strong><span>GUIA DE MONTAGEM • PET EDUCAÇÃO</span></div></div>'+
   '<div class="print-page-meta">ETAPA '+String(n+1).padStart(2,'0')+' / 03</div></header>'+
   '<div class="print-heading"><div class="print-heading-top"><h2>'+esc(g.title)+'</h2><span class="print-badge">'+wires.length+' ligações</span></div>'+
   '<p>'+esc(printDescriptions[g.id])+'</p><div class="print-mode">'+(mode==='switch'?'COM GANGORRAS':'SEM GANGORRAS')+'</div></div>'+
   '<div class="print-figure">'+visual+'</div>'+
   '<section class="print-connections"><h3>Conexões dos componentes</h3><div class="print-lines">'+rows+'</div></section>'+
   '<footer class="print-foot"><span>TinkerPET • PET Educação</span><span>Página '+(n+1)+' de 3</span></footer></section>';
 }).join('');
 $('printPages').innerHTML=pages;
 window.print();
};})();