'use strict';
(function(){
  const P=[
    {id:'b1',name:'Bateria 9 V • ESP',short:'9 V',color:'bat1',pins:[['POS','+'],['NEG','−']],desc:'Fonte de energia do ESP32. O positivo passa pela gangorra 1 antes de chegar ao regulador.',tip:'A bateria fornece 9 V. O LM2596 ajusta a tensão de saída para 5 V.'},
    {id:'s1',name:'Gangorra • ESP',short:'ON / OFF',color:'sw1',pins:[['IN','IN'],['OUT','OUT']],desc:'Chave liga/desliga do circuito do ESP32. Interrompe ou libera a passagem de energia no fio positivo.',tip:'Toque no interruptor para ligar ou desligar. A outra gangorra é independente.'},
    {id:'lm',name:'Regulador LM2596',short:'LM2596',color:'buck',pins:[['INP','IN +'],['INN','IN −'],['OUTP','OUT +'],['OUTN','OUT −']],desc:'Recebe energia da bateria e fornece uma saída ajustável. Neste projeto, a saída para o ESP32 deve estar em 5 V.',tip:'O controle deslizante é uma simulação do ajuste. Na montagem real, confira com multímetro.'},
    {id:'esp',name:'ESP32 • Controle',short:'ESP32',color:'esp',pins:[['VIN','VIN'],['GND','GND'],['D27','D27'],['D26','D26'],['D32','D32'],['D18','D18']],desc:'O cérebro do carrinho. Ele recebe alimentação e envia sinais para a ponte H controlar os motores.',tip:'Neste projeto: D27→IN1, D26→IN2, D32→IN3 e D18→IN4.'},
    {id:'drv',name:'Ponte H MX1508',short:'MX1508',color:'driver',pins:[['VCC','VCC +'],['GND','GND −'],['IN1','IN1'],['IN2','IN2'],['IN3','IN3'],['IN4','IN4'],['OUT1','A · 1'],['OUT2','A · 2'],['OUT3','B · 1'],['OUT4','B · 2']],desc:'Recebe comandos do ESP32 e controla o sentido de giro dos motores por suas saídas.',tip:'Os pinos IN recebem sinais do ESP32. As duas saídas de motor possuem um par de bornes cada: Motor A e Motor B. Os bornes individuais não têm esses números escritos na placa real.'},
    {id:'ml',name:'Motor esquerdo',short:'MOTOR',color:'left',pins:[['A','A'],['B','B']],desc:'Motor DC que movimenta uma das rodas. Recebe alimentação de um par de saídas da ponte H.',tip:'A direção depende de como a ponte H comanda os dois fios do motor.'},
    {id:'b2',name:'Bateria 9 V • Motores',short:'9 V',color:'bat2',pins:[['POS','+'],['NEG','−']],desc:'Fonte de alimentação separada para o conjunto de motores, com sua própria gangorra.',tip:'O circuito precisa compartilhar a referência GND com o ESP32.'},
    {id:'s2',name:'Gangorra • Motores',short:'ON / OFF',color:'sw2',pins:[['IN','IN'],['OUT','OUT']],desc:'Chave que liga e desliga a alimentação da ponte H e dos motores.',tip:'Você pode desligar os motores sem desligar o ESP32.'},
    {id:'mr',name:'Motor direito',short:'MOTOR',color:'right',pins:[['A','A'],['B','B']],desc:'Segundo motor DC do carrinho. Com o motor esquerdo, permite andar para a frente, para trás e virar.',tip:'Cada motor é ligado a um par diferente de saídas da MX1508.'}
  ];
  const E=[
    ['b1.POS','s1.IN','#e76e57'],['s1.OUT','lm.INP','#f08353'],['b1.NEG','lm.INN','#4f6070'],
    ['lm.OUTP','esp.VIN','#f07761'],['lm.OUTN','esp.GND','#415c64'],
    ['b2.POS','s2.IN','#f07b5e'],['s2.OUT','drv.VCC','#e56b56'],['b2.NEG','drv.GND','#4b6474'],
    ['drv.GND','esp.GND','#45545e'],
    ['esp.D27','drv.IN1','#a46a46'],['esp.D26','drv.IN2','#2b78ba'],['esp.D32','drv.IN3','#404f5d'],['esp.D18','drv.IN4','#77b8cb'],
    ['drv.OUT1','ml.A','#458f70'],['drv.OUT2','ml.B','#936341'],['drv.OUT3','mr.A','#3f7ca7'],['drv.OUT4','mr.B','#ed965d']
  ];
  const byId=Object.fromEntries(P.map(p=>[p.id,p]));
  const linkKey=(a,b)=>[a,b].sort().join('|');
  const rules=new Map(E.map(a=>[linkKey(a[0],a[1]),{a:a[0],b:a[1],color:a[2]}]));
  const els={};
  const $=id=>document.getElementById(id);
  let stage=0;
  let wires=[];
  let seen=new Set();
  let selected=null;
  let switches={s1:false,s2:false};
  let voltage=4;
  let tested=false;
  let courseComplete=false;
  let toastTimer=null;
  let dragged=null;
  const positions={};
  let viewWidth=window.innerWidth;
  const pinName=id=>{const [p,k]=id.split('.');const item=byId[p];const pin=item&&item.pins.find(x=>x[0]===k);return item?item.name+' · '+(pin?pin[1]:k):id;};
  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem('labpet-carrinho-v1')||'{}');
      if(Array.isArray(s.wires)) wires=s.wires.filter(x=>Array.isArray(x)&&x.length===2&&x.every(t=>P.some(p=>p.pins.some(k=>p.id+'.'+k[0]===t)))).slice(0,70);
      if(Array.isArray(s.seen)) seen=new Set(s.seen.filter(x=>byId[x]));
      if(Number.isFinite(s.voltage)) voltage=Math.min(6,Math.max(3,s.voltage));
      if(s.switches&&typeof s.switches==='object') switches={s1:s.switches.s1===true,s2:s.switches.s2===true};
      if(Number.isInteger(s.stage)) stage=Math.max(0,Math.min(3,s.stage));
      tested=s.tested===true;courseComplete=s.complete===true;
    }catch(err){console.warn('Progresso não recuperado',err);}
    if(!readyCircuit()) tested=false;
  }
  function persist(){
    try{localStorage.setItem('labpet-carrinho-v1',JSON.stringify({wires,seen:[...seen],voltage,switches,stage,tested,complete:courseComplete}));}catch(err){/* armazenamento opcional */}
  }
  function correctCount(){return wires.filter(x=>rules.has(linkKey(x[0],x[1]))).length;}
  function invalidLinks(){return wires.filter(x=>!rules.has(linkKey(x[0],x[1])));}
  function missingLinks(){
    const found=new Set(wires.map(x=>linkKey(x[0],x[1])));
    return E.filter(x=>!found.has(linkKey(x[0],x[1])));
  }
  function readyCircuit(){return missingLinks().length===0&&invalidLinks().length===0&&Math.abs(voltage-5)<.01&&switches.s1&&switches.s2;}
  function locked(){return !(tested&&readyCircuit());}
  function renderModules(){
    $('modules').innerHTML=P.map(p=>{
      const pinButtons=p.pins.map(x=>{
        const id=p.id+'.'+x[0];
        const isConnected=wires.some(pair=>pair.includes(id));
        const isBad=wires.some(pair=>pair.includes(id)&&!rules.has(linkKey(pair[0],pair[1])));
        return '<button type="button" class="pin'+(selected===id?' selected':'')+(isConnected?' connected':'')+(isBad?' bad-pin':'')+'" data-pin="'+id+'" aria-label="Terminal '+pinName(id)+'" title="'+pinName(id)+'"><span class="pin-dot"></span>'+x[1]+'</button>';
      }).join('');
      let extra='';
      if(p.id==='s1'||p.id==='s2') extra='<div class="module-extra"><button type="button" class="toggle '+(switches[p.id]?'on':'')+'" data-toggle="'+p.id+'" aria-pressed="'+switches[p.id]+'">'+(switches[p.id]?'● LIGADA':'○ DESLIGADA')+'</button></div>';
      if(p.id==='lm') extra='<div class="module-extra voltage"><label for="voltageInput">Saída</label><input id="voltageInput" type="range" min="3" max="6" step=".5" value="'+voltage+'" aria-label="Ajustar a saída do LM2596 em volts"><output id="voltageOutput">'+voltage.toFixed(1).replace('.',',')+' V</output></div>';
      return '<article class="module mod-'+p.color+'" data-part="'+p.id+'"><div class="module-top"><button type="button" class="module-name" data-detail="'+p.id+'">'+p.name+'</button><span class="drag-handle" role="button" tabindex="0" aria-label="Mover '+p.name+'" title="Arraste para mover">⠿</span></div><div class="illustration"><span class="silk">'+p.short+'</span><span class="board-dot"></span></div><div class="pins">'+pinButtons+'</div>'+extra+'</article>';
    }).join('');
    Object.entries(positions).forEach(([id,pos])=>{const card=[...document.querySelectorAll('.module')].find(el=>el.dataset.part===id);if(card){card.style.transform='translate('+pos.x+'px,'+pos.y+'px)';card.dataset.dx=String(pos.x);card.dataset.dy=String(pos.y);}});
    requestAnimationFrame(drawWires);
  }
  function showPart(id){
    const p=byId[id];if(!p)return;
    seen.add(id);
    $('panelTitle').textContent=p.name;
    $('panelText').textContent=p.desc;
    $('panelExtra').textContent=p.tip;
    persist();refreshProgress();
  }
  function toast(text){
    const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
  }
  function announce(text,popup=false){
    $('actionStatus').textContent=text;
    if(popup)toast(text);
  }
  function pinClick(id){
    const part=id.split('.')[0];showPart(part);
    if(!selected){
      selected=id;announce('Primeiro terminal: '+pinName(id)+'. Agora escolha o destino.');
    }else if(selected===id){
      selected=null;announce('Seleção cancelada. Toque em um terminal para começar.');
    }else{
      const a=selected,b=id;selected=null;
      const k=linkKey(a,b);
      if(wires.some(w=>linkKey(w[0],w[1])===k)){
        wires=wires.filter(w=>linkKey(w[0],w[1])!==k);
        announce('Fio removido. Você pode fazer outra ligação.');
      }else{
        wires.push([a,b]);
        const good=rules.has(k);
        announce(good?'Ligação correta! Continue descobrindo os próximos fios.':'Fio conectado, mas esta ligação precisa ser revisada.',!good);
      }
      tested=false;courseComplete=false;
    }
    update();
  }
  function removeWire(k){
    wires=wires.filter(w=>linkKey(w[0],w[1])!==k);
    tested=false;courseComplete=false;update();announce('Fio removido.');
  }
  function renderWiringList(){
    const box=$('panelExtra');
    if(stage!==1||selected||wires.length===0)return;
    const caption=document.createElement('div');caption.style.marginBottom='7px';caption.textContent='Toque em × para remover uma ligação:';
    const list=document.createElement('div');list.className='wire-list';
    wires.forEach(w=>{
      const k=linkKey(w[0],w[1]);const chip=document.createElement('span');chip.className='wire-chip'+(rules.has(k)?'':' invalid');
      const text=document.createElement('span');text.textContent=w[0].split('.')[1]+' ↔ '+w[1].split('.')[1];text.title=pinName(w[0])+' — '+pinName(w[1]);
      const btn=document.createElement('button');btn.type='button';btn.textContent='×';btn.setAttribute('aria-label','Remover '+pinName(w[0])+' com '+pinName(w[1]));btn.addEventListener('click',()=>removeWire(k));
      chip.append(text,btn);list.appendChild(chip);
    });
    box.replaceChildren(caption,list);
  }
  function update(){
    renderModules();
    $('wireCount').textContent=correctCount()+' / '+E.length;
    $('badCount').textContent=invalidLinks().length;
    $('wireBar').style.width=(100*correctCount()/E.length)+'%';
    $('benchStatus').textContent=correctCount()+' de '+E.length+' ligações corretas';
    renderWiringList();refreshProgress();persist();refreshDrive();
  }
  function refreshProgress(){
    const percent=Math.min(100,Math.round(seen.size/P.length*15+correctCount()/E.length*55+(Math.abs(voltage-5)<.01?10:0)+(switches.s1&&switches.s2?10:0)+(tested&&readyCircuit()?10:0)));
    $('progressBar').style.width=percent+'%';$('progressLabel').textContent=percent+'%';
  }
  function drawWires(){
    const svg=$('wireLayer'),board=$('board');
    if(!board||!svg)return;
    const r=board.getBoundingClientRect();
    svg.setAttribute('viewBox','0 0 '+board.clientWidth+' '+board.clientHeight);
    svg.replaceChildren();
    wires.forEach(pair=>{
      const elsPair=pair.map(id=>[...board.querySelectorAll('[data-pin]')].find(el=>el.dataset.pin===id));
      if(!elsPair[0]||!elsPair[1])return;
      const coords=elsPair.map(el=>{let rect=el.getBoundingClientRect();return{x:rect.left-r.left+rect.width/2,y:rect.top-r.top+rect.height/2};});
      const a=coords[0],b=coords[1];
      const bend=Math.max(28,Math.min(95,Math.abs(b.x-a.x)*.32));
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const k=linkKey(pair[0],pair[1]);const good=rules.get(k);
      path.setAttribute('d','M'+a.x+' '+a.y+' C'+(a.x+bend)+' '+a.y+' '+(b.x-bend)+' '+b.y+' '+b.x+' '+b.y);
      path.setAttribute('stroke',good?good.color:'#e65e57');
      path.setAttribute('class','wire-path'+(good?'':' invalid'));
      svg.appendChild(path);
    });
  }
  const STAGES=[
    {e:'MISSÃO 01 • EXPLORAÇÃO',h:'Conheça o seu carrinho',p:'Toque no nome de cada peça. Descubra para que ela serve antes de conectar os fios.',tip:'Toque numa peça para ver sua função. Use ⠿ para movê-la pela bancada.',next:'Conectar os fios ↗'},
    {e:'MISSÃO 02 • CONEXÕES',h:'Cada fio tem um destino',p:'Toque em um pino de origem e depois no pino de destino. Errou? Remova e tente novamente.',tip:'Toque em dois terminais para criar um fio. Clique num fio da lista abaixo para removê-lo.',next:'Ligar a energia ↗'},
    {e:'MISSÃO 03 • ALIMENTAÇÃO',h:'Hora de conferir a energia',p:'Ajuste o regulador LM2596 para 5 V, ligue as gangorras e confira se os fios estão corretos.',tip:'Ajuste o LM2596 para 5 V e ligue as duas gangorras. Depois toque em Conferir circuito.',next:'Conferir circuito ↗'},
    {e:'MISSÃO 04 • PISTA',h:'Agora você é o piloto!',p:'Use o teclado ou os botões da tela. Desvie dos obstáculos e alcance a chegada.',tip:'Leve seu carrinho até a chegada.',next:''}
  ];
  function setStage(n){
    stage=Math.max(0,Math.min(3,n));selected=null;
    document.querySelectorAll('.step').forEach(b=>{b.classList.toggle('active',Number(b.dataset.step)===stage);if(Number(b.dataset.step)===stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    const s=STAGES[stage];
    $('stepEyebrow').textContent=s.e;$('stepTitle').textContent=s.h;$('stepDescription').textContent=s.p;
    $('buildView').hidden=stage===3;$('driveView').hidden=stage!==3;
    $('boardInstruction').textContent=s.tip;
    $('nextBtn').textContent=s.next;
    if(stage===0){$('benchStatus').textContent='Explore os componentes';announce('Escolha uma das peças para começar.');}
    else if(stage===1){announce('Selecione dois pinos para fazer uma ligação.');}
    else if(stage===2){announce('Confira todas as ligações, ajuste 5 V e ligue as duas gangorras.');}
    else{announce('Hora do teste!');}
    update();refreshDrive();
    if(stage===3)requestAnimationFrame(()=>drawTrack());
    persist();
  }
  function hint(){
    const wrong=invalidLinks();
    if(wrong.length){announce('Dica: existe uma ligação fora do esquema. Confira os fios marcados para revisão.',true);return;}
    const missing=missingLinks();
    if(stage===0){toast('Toque nos nomes ESP32, MX1508, LM2596, motores e gangorras para conhecê-los.');return;}
    if(missing.length){const x=missing[0];announce('Experimente: '+pinName(x[0])+' → '+pinName(x[1])+'.',true);return;}
    if(Math.abs(voltage-5)>.01){announce('O ESP32 precisa receber 5,0 V da saída do LM2596.',true);return;}
    if(!switches.s1||!switches.s2){announce('Ligue as duas gangorras na bancada. Cada uma controla um circuito.',true);return;}
    announce('Tudo pronto! Use Conferir circuito para liberar a pista.',true);
  }
  function checkCircuit(){
    if(invalidLinks().length){announce('Encontramos '+invalidLinks().length+' ligação(ões) incorreta(s). Use a dica ou a lista de fios para revisar.',true);return;}
    const left=missingLinks();
    if(left.length){announce('Faltam '+left.length+' conexão(ões). Primeira dica: '+pinName(left[0][0])+' → '+pinName(left[0][1])+'.',true);return;}
    if(Math.abs(voltage-5)>.01){announce('Antes de avançar, ajuste a saída do LM2596 para 5,0 V.',true);return;}
    if(!switches.s1||!switches.s2){announce('Falta ligar '+(!switches.s1&&!switches.s2?'as duas gangorras':!switches.s1?'a gangorra do ESP32':'a gangorra dos motores')+'.',true);return;}
    tested=true;update();setStage(3);toast('Circuito conferido! A pista está liberada. 🏁');
  }
  function refreshDrive(){
    const isOpen=!locked();
    $('trackOverlay').hidden=isOpen;
    $('driveTitle').textContent=isOpen?'Circuito aprovado • motores prontos':'A pista está aguardando você!';
    $('driveSubtitle').textContent=isOpen?'Pilote e complete o desafio!':'Conclua o circuito para liberar os controles.';
    document.querySelector('.drive-banner').classList.toggle('ready',isOpen);
    if(!isOpen){$('driveReadout').textContent='Aguardando montagem';Object.keys(pressed).forEach(k=>pressed[k]=false);}
    else if(!courseComplete)$('driveReadout').textContent='Pronto para pilotar';
    if(isOpen&&stage===3)drawTrack();
  }
  function beginDrag(e){
    const h=e.target.closest('.drag-handle');if(!h)return;
    const card=h.closest('.module'),board=$('board');
    if(!card||!board)return;
    e.preventDefault();h.setPointerCapture&&h.setPointerCapture(e.pointerId);
    const x=Number(card.dataset.dx||0),y=Number(card.dataset.dy||0);
    dragged={card,handle:h,id:e.pointerId,startX:e.clientX,startY:e.clientY,x,y};
    card.style.zIndex='7';
  }
  function dragMove(e){
    if(!dragged||dragged.id!==e.pointerId)return;
    const d=dragged,b=$('board').getBoundingClientRect(),c=d.card.getBoundingClientRect();
    let dx=d.x+(e.clientX-d.startX),dy=d.y+(e.clientY-d.startY);
    dx=Math.max(d.x-(c.left-b.left)+8,Math.min(d.x+(b.right-c.right)-8,dx));
    dy=Math.max(d.y-(c.top-b.top)+8,Math.min(d.y+(b.bottom-c.bottom)-8,dy));
    d.card.style.transform='translate('+dx+'px,'+dy+'px)';
    d.card.dataset.dx=String(dx);d.card.dataset.dy=String(dy);positions[d.card.dataset.part]={x:dx,y:dy};drawWires();
  }
  function endDrag(e){if(!dragged||dragged.id!==e.pointerId)return;dragged.card.style.zIndex='';dragged=null;}
  // Pista de brinquedo: modelo cinemático simplificado, sem ligação Wi-Fi real.
  const canvas=$('track'),ctx=canvas.getContext('2d');
  const car={x:145,y:455,angle:0},pressed={up:false,down:false,left:false,right:false};
  const obstacles=[{x:310,y:295,r:23},{x:445,y:174,r:26},{x:605,y:377,r:25},{x:730,y:248,r:25}];
  let previousTime=0;
  function resetTrack(){car.x=145;car.y=455;car.angle=0;courseComplete=false;Object.keys(pressed).forEach(k=>pressed[k]=false);$('driveReadout').textContent='Pronto para pilotar';persist();drawTrack();}
  function moveCar(dt){
    if(locked()||courseComplete||stage!==3)return;
    const forward=(pressed.up?1:0)-(pressed.down?1:0);
    const steering=(pressed.right?1:0)-(pressed.left?1:0);
    if(steering)car.angle+=steering*2.5*dt*(forward<0?-1:1);
    if(forward){
      const speed=forward>0?185:118;
      const ox=car.x,oy=car.y;
      car.x+=Math.sin(car.angle)*forward*speed*dt;
      car.y-=Math.cos(car.angle)*forward*speed*dt;
      car.x=Math.max(80,Math.min(880,car.x));
      car.y=Math.max(74,Math.min(485,car.y));
      if(obstacles.some(o=>Math.hypot(car.x-o.x,car.y-o.y)<o.r+24)){car.x=ox;car.y=oy;$('driveReadout').textContent='Obstáculo à frente!';}
      else $('driveReadout').textContent=forward>0?'Em movimento':'Marcha à ré';
    }else if(steering)$('driveReadout').textContent='Virando';
    if(Math.hypot(car.x-820,car.y-105)<55){courseComplete=true;Object.keys(pressed).forEach(k=>pressed[k]=false);$('driveReadout').textContent='🏆 Missão concluída!';toast('Parabéns! Você levou o carrinho até a chegada!');persist();}
  }
  function trackLoop(time){
    const dt=Math.min(.05,(time-previousTime)/1000||0);previousTime=time;
    if(stage===3&&!locked()){moveCar(dt);drawTrack();}
    requestAnimationFrame(trackLoop);
  }
  function rr(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function drawTrack(){
    ctx.clearRect(0,0,960,560);
    ctx.fillStyle='#7caf85';ctx.fillRect(0,0,960,560);
    for(let x=24;x<960;x+=78)for(let y=20;y<560;y+=68){ctx.fillStyle=(x+y)%3?'#a8ce91':'#91bf7c';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
    rr(56,47,848,465,38,'#d9e0db');rr(66,57,828,445,31,'#354c56');rr(84,75,792,409,21,'#3d555f');
    ctx.strokeStyle='#dbe1c8';ctx.lineWidth=3;ctx.setLineDash([20,20]);ctx.strokeRect(101,92,758,375);ctx.setLineDash([]);
    rr(92,414,96,14,3,'#e8f4c9');ctx.fillStyle='#eff4e8';ctx.font='bold 20px sans-serif';ctx.fillText('INÍCIO',106,405);
    for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#122e36':'#fff';ctx.fillRect(790+i*11,79,11,50);ctx.fillStyle=i%2?'#fff':'#122e36';ctx.fillRect(790+i*11,129,11,11);}
    rr(794,151,57,20,5,'#d7ecb0');ctx.fillStyle='#204536';ctx.font='bold 12px sans-serif';ctx.fillText('FIM',811,165);
    obstacles.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y+4,o.r+3,0,Math.PI*2);ctx.fillStyle='#142e3544';ctx.fill();ctx.beginPath();ctx.moveTo(o.x,o.y-o.r);ctx.lineTo(o.x+o.r*.83,o.y+o.r*.85);ctx.lineTo(o.x-o.r*.83,o.y+o.r*.85);ctx.closePath();ctx.fillStyle='#ffab6e';ctx.fill();ctx.fillStyle='#fff5d5';ctx.fillRect(o.x-11,o.y+5,22,5);});
    ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);
    rr(-27,-31,12,25,5,'#151e23');rr(15,-31,12,25,5,'#151e23');rr(-27,8,12,25,5,'#151e23');rr(15,8,12,25,5,'#151e23');
    rr(-19,-35,38,70,10,'#e1eabf');rr(-15,-28,30,55,7,'#1c5662');rr(-11,-18,22,25,3,'#9bc8c9');
    rr(-12,10,24,7,2,'#c6eb79');ctx.fillStyle='#f1c66b';ctx.fillRect(-14,-32,8,5);ctx.fillRect(6,-32,8,5);ctx.restore();
    if(courseComplete){rr(292,230,375,85,20,'#163b46');ctx.fillStyle='#d2f28f';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText('🏁 VOCÊ CONSEGUIU!',480,265);ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText('Missão concluída • PET Educação',480,294);ctx.textAlign='left';}
  }
  function bind(){
    $('modules').addEventListener('click',e=>{
      const pin=e.target.closest('[data-pin]');if(pin){pinClick(pin.dataset.pin);return;}
      const detail=e.target.closest('[data-detail]');if(detail){showPart(detail.dataset.detail);announce('Você descobriu o componente '+byId[detail.dataset.detail].name+'.');return;}
      const toggler=e.target.closest('[data-toggle]');if(toggler){switches[toggler.dataset.toggle]=!switches[toggler.dataset.toggle];tested=false;courseComplete=false;update();announce('Gangorra '+(toggler.dataset.toggle==='s1'?'do ESP32':'dos motores')+' '+(switches[toggler.dataset.toggle]?'ligada.':'desligada.'));return;}
    });
    $('modules').addEventListener('input',e=>{
      if(e.target.id==='voltageInput'){voltage=Number(e.target.value);const output=$('voltageOutput');if(output)output.textContent=voltage.toFixed(1).replace('.',',')+' V';tested=false;courseComplete=false;persist();refreshProgress();refreshDrive();announce('Saída do LM2596 ajustada para '+voltage.toFixed(1).replace('.',',')+' V.');}
    });
    document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>setStage(Number(b.dataset.step))));
    $('nextBtn').addEventListener('click',()=>{if(stage===2)checkCircuit();else setStage(stage+1);});
    $('cancelWire').addEventListener('click',()=>{selected=null;update();announce('Seleção de fio cancelada.');});
    $('hintBtn').addEventListener('click',hint);
    $('clearWires').addEventListener('click',()=>{if(!wires.length)return;if(confirm('Remover todos os fios desta montagem?')){wires=[];selected=null;tested=false;courseComplete=false;update();announce('Bancada limpa. Vamos tentar de novo!');}});
    $('resetBtn').addEventListener('click',()=>{if(confirm('Reiniciar a oficina e apagar seu progresso neste dispositivo?')){wires=[];seen=new Set();switches={s1:false,s2:false};voltage=4;tested=false;courseComplete=false;selected=null;resetTrack();setStage(0);toast('Nova oficina iniciada!');}});
    $('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());
    $('closeHelp').addEventListener('click',()=>$('helpDialog').close());
    $('dismissHelp').addEventListener('click',()=>$('helpDialog').close());
    $('goBuild').addEventListener('click',()=>setStage(2));
    $('returnBench').addEventListener('click',()=>setStage(1));
    $('restartTrack').addEventListener('click',resetTrack);
    $('board').addEventListener('pointerdown',beginDrag);
    window.addEventListener('pointermove',dragMove);
    window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);
    window.addEventListener('resize',()=>{if((window.innerWidth<=720)!==(viewWidth<=720)){Object.keys(positions).forEach(k=>delete positions[k]);document.querySelectorAll('.module').forEach(c=>{c.style.transform='';delete c.dataset.dx;delete c.dataset.dy;});}viewWidth=window.innerWidth;requestAnimationFrame(drawWires);});
    window.addEventListener('scroll',drawWires,{passive:true});$('board').addEventListener('scroll',drawWires,{passive:true});
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(drawWires).observe($('board'));
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&selected){selected=null;update();return;}
      if(stage!==3||locked()||e.target.matches('input,textarea,select'))return;
      const keyMap={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
      const action=keyMap[e.key];if(action){e.preventDefault();pressed[action]=true;}
      if(e.key===' '){e.preventDefault();Object.keys(pressed).forEach(k=>pressed[k]=false);$('driveReadout').textContent='Parado';}
    });
    document.addEventListener('keyup',e=>{const map={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(map[e.key]){pressed[map[e.key]]=false;}});
    window.addEventListener('blur',()=>Object.keys(pressed).forEach(k=>pressed[k]=false));
    document.querySelectorAll('[data-drive]').forEach(b=>{
      const action=b.dataset.drive;
      b.addEventListener('pointerdown',e=>{
        if(locked())return;e.preventDefault();
        if(action==='stop'){Object.keys(pressed).forEach(k=>pressed[k]=false);$('driveReadout').textContent='Parado';return;}
        if(b.setPointerCapture)b.setPointerCapture(e.pointerId);
        pressed[action]=true;b.classList.add('pressed');
        moveCar(.085);drawTrack();
      });
      const end=()=>{if(action!=='stop')pressed[action]=false;b.classList.remove('pressed');};
      b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);
    });
  }
  restore();bind();setStage(stage);drawTrack();requestAnimationFrame(trackLoop);
  if(typeof document.fonts!=='undefined')document.fonts.ready.then(drawWires);
})();