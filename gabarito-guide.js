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
 b1:{POS:[.94,.20],NEG:[.94,.74]},b2:{POS:[.95,.18],NEG:[.95,.78]},
 s1:{IN:[.19,.94],OUT:[.49,.94]},s2:{IN:[.19,.94],OUT:[.49,.94]},
 lm:{INP:[.06,.22],INN:[.06,.72],OUTP:[.94,.22],OUTN:[.94,.72]},
 esp:{VIN:[.07,.08],GND:[.13,.08],GND2:[.13,.92],D27:[.38,.08],D26:[.43,.08],D32:[.67,.08],D18:[.69,.92]},
 drv:{VCC:[.16,.95],GND:[.30,.95],IN1:[.43,.95],IN2:[.54,.95],IN3:[.67,.95],IN4:[.79,.95],OUT1:[.19,.08],OUT2:[.38,.08],OUT3:[.68,.08],OUT4:[.86,.08]},
 ml:{A:[.13,.76],B:[.13,.83]},mr:{A:[.13,.76],B:[.13,.83]}
};
let mode=null,all=[],section='lm',index=0,full=false;
function pos(port){const [id,pin]=port.split('.'),p=parts[id],a=anchors[id][pin];return [p.x+p.w*a[0],p.y+p.h*a[1]];}
function esc(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function label(port){const [id,pin]=port.split('.');return parts[id].label+' · '+pin.replace('OUTP','OUT+').replace('OUTN','OUT−').replace('INP','IN+').replace('INN','IN−').replace('POS','+').replace('NEG','−');}
function path(w,i){const [x1,y1]=pos(w.a),[x2,y2]=pos(w.b),bend=(x1+x2)/2+(i%3-1)*12;return 'M'+x1+' '+y1+' H'+bend+' V'+y2+' H'+x2;}
function visibleParts(wires){const set=new Set();wires.forEach(w=>{set.add(w.a.split('.')[0]);set.add(w.b.split('.')[0]);});return set;}
function drawing(wires,active=-1,print=false){
 const visible=visibleParts(wires);
 const nodes=Object.entries(parts).filter(([id])=>visible.has(id)).map(([id,p])=>'<image href="'+p.asset+'" x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" preserveAspectRatio="xMidYMid meet"/><text x="'+(p.x+p.w/2)+'" y="'+(p.y-7)+'" font-size="14" text-anchor="middle" font-weight="700" fill="#315663">'+esc(p.label)+'</text>').join('');
 const lines=wires.map((w,i)=>'<path class="wire '+(active>=0?(i===active?'active':'dim'):'')+'" d="'+path(w,i)+'" stroke="'+w.color+'" stroke-width="4.5" fill="none"/>'+((active===i||print)?[w.a,w.b].map(port=>{const [x,y]=pos(port);return '<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+w.color+'" stroke="#fff" stroke-width="2"/>';}).join(''):'')).join('');
 return '<svg viewBox="0 0 960 605" role="img" aria-label="Esquema de ligação dos componentes">'+nodes+lines+'</svg>';
}
function sequence(){return section==='esp'?all:all.filter(w=>w.section===section);}
function render(){
 if(!mode)return;
 const seq=sequence(),current=seq[Math.min(index,seq.length-1)];
 $('stageTitle').textContent=groups.find(g=>g.id===section).title;
 $('stageTag').textContent=full?'Montagem completa':'Ligação '+(index+1)+' de '+seq.length;
 $('mainTitle').textContent='Gabarito '+(mode==='switch'?'com gangorras':'sem gangorras');
 $('viewer').innerHTML=full?drawing(all,-1):drawing(seq.slice(0,index+1),index);
 $('instruction').textContent=full?'Todas as conexões reunidas':label(current.a)+' → '+label(current.b);
 $('description').textContent=full?'Explore o circuito completo ou volte às etapas para acompanhar cada fio.':'A ligação destacada indica os dois terminais. As conexões anteriores permanecem discretas para orientar a montagem.';
 $('count').textContent=full?all.length+' ligações':'Passo '+(index+1)+' / '+seq.length;
 $('bar').style.width=(full?100:(index+1)/seq.length*100)+'%';
 $('prev').disabled=full||index===0;
 $('next').disabled=full||section==='esp'&&index===seq.length-1;
 $('next').textContent=(!full&&index===seq.length-1)?(section==='esp'?'Concluir ✓':'Avançar →'):'Próximo →';
 $('stepList').innerHTML=seq.map((w,i)=>'<li class="'+(full?'done':i===index?'current':i<index?'done':'')+'">'+(i+1)+'. '+esc(label(w.a))+' → '+esc(label(w.b))+'</li>').join('');
 $('all').textContent=full?'Voltar ao passo a passo':'Ver circuito completo';
 $('tabs').innerHTML=groups.map(g=>'<button data-section="'+g.id+'" class="'+(section===g.id?'selected':'')+'">'+g.title+'</button>').join('');
 $('download').disabled=false;
}
function selectMode(m){mode=m;all=[...(m==='switch'?switched:direct),...remaining];$('chooser').hidden=true;section='lm';index=0;full=false;render();}
$('chooser').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)selectMode(b.dataset.mode);});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(b){section=b.dataset.section;index=0;full=false;render();}});
$('prev').onclick=()=>{index=Math.max(0,index-1);render();};
$('next').onclick=()=>{index=Math.min(sequence().length-1,index+1);render();};
$('repeat').onclick=()=>{full=false;index=0;render();};
$('all').onclick=()=>{full=!full;render();};
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