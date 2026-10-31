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
 esp:{VIN:[101/930,56/430],GND:[152.5/930,56/430],GND2:[152.5/930,373/430],D27:[358.5/930,56/430],D26:[410/930,56/430],D32:[564.5/930,56/430],D18:[564.5/930,373/430]},
 drv:{VCC:[73/300,321/380],GND:[104/300,321/380],IN1:[135/300,321/380],IN2:[166/300,321/380],IN3:[197/300,321/380],IN4:[228/300,321/380],OUT1:[212/300,63/380],OUT2:[257/300,63/380],OUT3:[73/300,63/380],OUT4:[118/300,63/380]},
 ml:{A:[45/300,567/640],B:[45/300,533/640]},mr:{A:[45/300,567/640],B:[45/300,533/640]}
};
let mode=null,all=[],section='lm',index=0,full=false,lastGuideSection='lm',lastGuideIndex=0;
function pos(port){const [id,pin]=port.split('.'),p=parts[id],a=anchors[id][pin];return [p.x+p.w*a[0],p.y+p.h*a[1]];}
function esc(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function label(port){const [id,pin]=port.split('.');return parts[id].label+' · '+pin.replace('OUTP','OUT+').replace('OUTN','OUT−').replace('INP','IN+').replace('INN','IN−').replace('POS','+').replace('NEG','−');}
function path(w,i){const [x1,y1]=pos(w.a),[x2,y2]=pos(w.b),bend=(x1+x2)/2+(i%3-1)*12;return 'M'+x1+' '+y1+' H'+bend+' V'+y2+' H'+x2;}
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
$('chooser').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)selectMode(b.dataset.mode);});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(b)selectSection(b.dataset.section);});
$('prev').onclick=()=>{
 if(full){returnToGuide();return;}
 if(index>0)index--;
 else if(section==='drv'){section='lm';index=sequence().length-1;}
 render();
};
$('next').onclick=()=>{
 if(full){location.href='projects.html';return;}
 if(index<sequence().length-1){index++;render();return;}
 if(section==='lm'){selectSection('drv');return;}
 if(section==='drv')showFull();
};
$('repeat').onclick=()=>{if(full){selectSection('lm');return;}index=0;render();};
$('all').onclick=()=>{if(full)returnToGuide();else showFull();};
$('download').onclick=()=>{
 if(!mode)return;
 const pages=groups.map((g,n)=>{
  const wires=g.id==='esp'?all:all.filter(w=>w.section===g.id);
  const items=wires.map((w,i)=>'<div>'+(i+1)+'. '+esc(label(w.a))+' → '+esc(label(w.b))+'</div>').join('');
  return '<section class="sheet" style="--sheet-color:'+g.color+'"><header><img src="assets/logo-pet.svg" alt=""><strong>TinkerPET Studio · Gabaritos</strong></header><h2>'+esc(g.title)+'</h2><p>Montagem '+(mode==='switch'?'com gangorras':'sem gangorras')+' · '+wires.length+' ligações</p>'+drawing(wires,-1,true)+'<div class="print-lines">'+items+'</div><footer>Página '+(n+1)+' de 3 · PET Educação · TinkerPET Studio</footer></section>';
 }).join('');
 $('printPages').innerHTML=pages;
 window.print();
};
})();