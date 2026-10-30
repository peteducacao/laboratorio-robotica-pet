'use strict';
(()=>{
 const data=window.tinkerpetAnswerData;
 if(!data||!Array.isArray(data.connections)||!Array.isArray(data.components))return;
 const WIDTH=2050,HEIGHT=1450;
 const places={
  b1:[100,180],s1:[365,220],lm:[655,205],esp:[1040,130],
  b2:[85,815],s2:[440,855],drv:[1010,820],ml:[1420,775],mr:[1695,775]
 };
 // Cada jumper possui cor identificável; motores usam famílias bem diferentes.
 const colors=['#ce3638','#e9634b','#36485b','#e59a22','#263d5b',
               '#d34073','#a349a4','#657684','#465665',
               '#1767b2','#18a4bf','#8450c4','#c44b9f',
               '#107b50','#83af28','#ad5312','#eba12a'];
 const switchedCategories=[
  {id:'all',label:'Tudo',title:'Circuito completo',indices:[...Array(17).keys()]},
  {id:'esp',label:'Energia ESP32',title:'Bateria 1 → gangorra 1 → LM2596 → ESP32',indices:[0,1,2,3,4]},
  {id:'motorPower',label:'Energia motores',title:'6 pilhas AA → gangorra 2 → ponte H e GND comum',indices:[5,6,7,8]},
  {id:'control',label:'Comandos',title:'ESP32 → IN1, IN2, IN3 e IN4 da ponte H',indices:[9,10,11,12]},
  {id:'motor1',label:'Motor 1',title:'Ponte H → motor DC 1 (verde)',indices:[13,14]},
  {id:'motor2',label:'Motor 2',title:'Ponte H → motor DC 2 (laranja)',indices:[15,16]}
 ];
 const directCategories=[
  {id:'all',label:'Tudo',title:'Circuito sem gangorras',indices:[...Array(15).keys()]},
  {id:'esp',label:'Energia ESP32',title:'9 V direto → LM2596 → ESP32',indices:[0,2,3,4]},
  {id:'motorPower',label:'Energia motores',title:'6 AA direto → MX1508 + GND comum',indices:[1,5,6]},
  {id:'control',label:'Comandos',title:'GPIOs 27, 26, 32, 18 → IN1 a IN4',indices:[7,8,9,10]},
  {id:'motor1',label:'Motor A',title:'MX1508 MOTOR A → motor 1',indices:[11,12]},
  {id:'motor2',label:'Motor B',title:'MX1508 MOTOR B → motor 2',indices:[13,14]}
 ];
 let answerMode='switched',categories=switchedCategories,connections=data.connections,
     components=data.components,groups=data.groups;
 let activeCategory='all',activeWire=-1;
 const byId=Object.fromEntries(data.components.map(p=>[p.id,p]));
 const btn=document.createElement('button');
 btn.id='answerKeyBtn';btn.type='button';btn.className='answer-key-trigger';
 btn.textContent='🔒 Gabarito';btn.setAttribute('aria-haspopup','dialog');
 const header=document.querySelector('.header-end');
 header.insertBefore(btn,header.firstChild);
 const dialog=document.createElement('dialog');
 dialog.id='answerKeyDialog';dialog.className='answer-key-dialog';
 dialog.setAttribute('aria-label','Gabarito visual: circuito completo do TinkerPET');
 dialog.innerHTML='<div class="answer-head"><div><small>PET EDUCAÇÃO • TINKERPET</small><h2>Gabarito visual</h2></div><button id="answerClose" type="button" aria-label="Fechar gabarito">×</button></div>'+
 '<form id="answerForm" class="answer-gate" autocomplete="off">'+
 '<div class="answer-lock">🔐</div><h3>Acesso ao circuito pronto</h3>'+
 '<p>Digite a senha para visualizar a bancada completa, com os componentes e os fios conectados.</p>'+
 '<label for="answerPassword">Senha de acesso</label><input id="answerPassword" type="password" required autocomplete="off" placeholder="Digite a senha">'+
 '<span id="answerError" role="alert"></span><button type="submit" class="answer-main">Mostrar circuito pronto</button></form>'+
 '<div id="answerContent" class="answer-content" hidden>'+
 '<div class="answer-visual-top"><span id="answerCounter" class="answer-counter">✓ 9 peças • 17 fios conectados</span>'+
 '<div class="answer-zoom" aria-label="Ampliar gabarito"><button type="button" id="answerZoomOut" aria-label="Diminuir gabarito">−</button><b id="answerZoomLabel">100%</b><button type="button" id="answerZoomIn" aria-label="Ampliar gabarito">+</button><button type="button" id="answerZoomFit">Enquadrar</button></div></div>'+
 '<div class="answer-mode-row" aria-label="Escolher alternativa"><button id="answerModeDirect" type="button">Sem gangorras · 7 peças / 15 fios</button><button id="answerModeSwitched" type="button">Com gangorras · 9 peças / 17 fios</button></div>'+
 '<div class="answer-filter-head"><b>Visualizar por circuito</b><span>Escolha uma etapa para esconder os demais fios</span></div>'+
 '<div id="answerFilters" class="answer-filters" aria-label="Filtros de ligação"></div>'+
 '<div id="answerWirePicker" class="answer-wire-picker" aria-label="Escolher um fio específico"></div>'+
 '<div id="answerSelectedInfo" class="answer-selected-info" role="status" aria-live="polite"></div>'+
 '<div class="answer-board-scroll" id="answerBoardScroll" tabindex="0" aria-label="Bancada com carrinho ESP32 montado; use o zoom para ampliar">'+
 '<div class="answer-board" id="answerDiagram"></div></div>'+
 '<div class="answer-actions"><button id="answerPng" type="button" class="answer-main">↓ Baixar imagem PNG</button>'+
 '<button id="answerDownload" type="button" class="answer-alt">↓ Baixar SVG</button>'+
 '<button id="answerPrint" type="button" class="answer-alt">⎙ Salvar PDF / imprimir</button></div>'+
 '<details id="answerDetails" class="answer-details"><summary id="answerDetailsTitle">Ver resumo das 17 conexões</summary>'+
 '<div id="answerGroups"></div><div class="answer-info"><strong>Antes de testar</strong>'+
 '<p>GND e GND2 do ESP32 são equivalentes. <b>O negativo da MX1508 liga ao negativo do suporte AA e também ao GND do ESP32.</b> A bateria 9 V alimenta IN+/IN− do LM2596; ajuste a saída para <b>5,0 V</b>. Se usar gangorras, ligue as duas.</p>'+
 '<p><b>Opcionais:</b> bateria 1 NEG → gangorra 1 LED− e suporte 6 AA NEG → gangorra 2 LED−.</p></div></details></div>';
 document.body.append(dialog);
 const el=id=>dialog.querySelector('#'+id);
 const escaped=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 let magnification=1;
 let busy=false;
 const displayedPorts=i=>{
  const w=connections[i];
  // Usar qualquer GND do ESP32; o segundo GND facilita desenhar o gabarito.
  return {a:((answerMode==='switched'&&i===8)||(answerMode==='direct'&&i===6))?'esp.GND2':w.a,b:w.b};
 };
 function portPosition(id){
  const parts=id.split('.'),part=byId[parts[0]],where=places[parts[0]];
  if(!part||!where||!part.pins[parts[1]])return null;
  const pct=part.pins[parts[1]];
  return {x:where[0]+part.width*pct[0]/100,y:where[1]+part.height*pct[1]/100};
 }
 function bendsFor(i,a,b){
  const x=a.x,y=a.y,X=b.x,Y=b.y;
  if(answerMode==='direct')return [[x,Y]];
  // Corredores separados, incluindo gangorras e pares de cada motor.
  switch(i){
   case 0:return [[302,y],[302,Y]];
   case 1:return [[x,446],[558,446],[558,Y]];
   case 2:return [[251,y],[251,164],[578,164],[578,Y]];
   case 3:return [[905,y],[905,158],[X,158]];
   case 4:return [[885,y],[885,125],[X,125]];
   case 5:return [[300,y],[300,Y]];
   case 6:return [[555,y],[555,1176],[X,1176]];
   case 7:return [[238,y],[238,1250],[X,1250]];
   case 8:return [[850,y],[850,1298],[X,1298]];
   case 9:return [[x,94],[914,94],[914,1164],[X,1164]];
   case 10:return [[x,68],[944,68],[944,1187],[X,1187]];
   case 11:return [[x,41],[974,41],[974,1209],[X,1209]];
   case 12:return [[x,495],[1004,495],[1004,1233],[X,1233]];
   case 13:return [[x,720],[1390,720],[1390,Y]];
   case 14:return [[x,749],[1360,749],[1360,Y]];
   case 15:return [[x,620],[1665,620],[1665,Y]];
   case 16:return [[x,653],[1635,653],[1635,Y]];
   default:return [[x,Y]];
  }
 }
 function makeSvg(embedded={},category=activeCategory,wire=activeWire){
  const pieces=[];
  pieces.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 '+WIDTH+' '+HEIGHT+'" width="'+WIDTH+'" height="'+HEIGHT+'" role="img" aria-label="Gabarito visual das duas formas de montagem do carrinho ESP32">');
  pieces.push('<defs><pattern id="answerDots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.45" fill="#ccdce1"/></pattern></defs>');
  pieces.push('<rect width="'+WIDTH+'" height="'+HEIGHT+'" rx="30" fill="#eef5f6"/>');
  pieces.push('<rect x="24" y="24" width="2002" height="1402" rx="28" fill="#f8fbfc" stroke="#b4cbd2" stroke-width="3"/>');
  pieces.push('<rect x="25" y="25" width="2000" height="1400" rx="27" fill="url(#answerDots)"/>');
  pieces.push('<rect x="55" y="77" width="1938" height="486" rx="27" fill="#e4eff5" fill-opacity=".43" stroke="#d5e5eb" stroke-width="2"/>');
  pieces.push('<rect x="55" y="600" width="1938" height="725" rx="27" fill="#e4f2ed" fill-opacity=".30" stroke="#d5e6de" stroke-width="2"/>');
  pieces.push('<text x="75" y="67" fill="#1a5362" font-family="Arial,sans-serif" font-weight="bold" font-size="29">CIRCUITO PRONTO · ESP32</text>');
  pieces.push('<text x="1280" y="67" fill="#63838c" font-family="Arial,sans-serif" font-size="23">TinkerPET • PET Educação • '+components.length+' peças / '+connections.length+' conexões</text>');
  pieces.push('<text x="81" y="146" fill="#347e82" font-family="Arial,sans-serif" font-weight="bold" font-size="20" letter-spacing="2">ALIMENTAÇÃO E CONTROLE</text>');
  pieces.push('<text x="81" y="678" fill="#347e82" font-family="Arial,sans-serif" font-weight="bold" font-size="20" letter-spacing="2">ALIMENTAÇÃO DOS MOTORES</text>');
  const contacts=[];
  connections.forEach((w,i)=>{
   if(wire>=0?i!==wire:category!=='all'&&!categories.find(c=>c.id===category).indices.includes(i))return;
   const ports=displayedPorts(i),start=portPosition(ports.a),end=portPosition(ports.b);
   if(!start||!end)return;
   const waypoints=[start,...bendsFor(i,start,end).map(p=>({x:p[0],y:p[1]})),end];
   // Corrige quaisquer aproximações diagonais: fio sempre horizontal ou vertical.
   // Bornes laterais de LM2596 e motores recebem a última seção na horizontal.
   const destination=byId[ports.b.split('.')[0]];
   const points=[waypoints[0]];
   waypoints.slice(1).forEach((p,j)=>{
    const last=points[points.length-1];
    if(Math.abs(p.x-last.x)>0.01&&Math.abs(p.y-last.y)>0.01){
     const lastSegment=j===waypoints.length-2;
     const sideConnection=lastSegment&&['buck','motor'].includes(destination.kind);
     points.push(sideConnection?{x:last.x,y:p.y}:{x:p.x,y:last.y});
    }
    points.push(p);
   });
   const d=points.map((p,j)=>(j?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
   const color=colors[i];
   const label=escaped(w.from+' → '+w.to);
   pieces.push('<path d="'+d+'" fill="none" stroke="#fff" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"/>');
   pieces.push('<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" data-answer-wire="'+i+'" class="answer-svg-wire"><title>Fio '+(i+1)+': '+label+'</title></path>');
   contacts.push({x:start.x,y:start.y,color,label},{x:end.x,y:end.y,color,label});
  });
  // Mesmas imagens e pontos reais de conexão usados na bancada editável.
  components.forEach(part=>{
   const pos=places[part.id],href=embedded[part.image]||part.image;
   if(!pos)return;
   pieces.push('<image x="'+pos[0]+'" y="'+pos[1]+'" width="'+part.width+'" height="'+part.height+'" preserveAspectRatio="none" pointer-events="none" href="'+escaped(href)+'" xlink:href="'+escaped(href)+'"><title>'+escaped(part.name)+'</title></image>');
   let labelX=pos[0]+part.width/2, labelY=pos[1]-21;
   if(part.kind==='battery'||part.kind==='batteryPack')labelY=pos[1]+part.height+37;
   if(part.kind==='switch')labelY=pos[1]-22;
   if(part.kind==='motor')labelY=pos[1]+part.height+36;
   pieces.push('<rect x="'+(labelX-111)+'" y="'+(labelY-27)+'" width="222" height="39" rx="19" fill="#fff" stroke="#c5d9dd" stroke-width="2"/>');
   pieces.push('<text x="'+labelX+'" y="'+labelY+'" font-size="20" font-family="Arial,sans-serif" font-weight="bold" fill="#234a57" text-anchor="middle">'+escaped(part.name)+'</text>');
  });
  // Pontas preenchidas exatamente no centro dos terminais dos SVGs.
  contacts.forEach(c=>{
   pieces.push('<circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="10" fill="'+c.color+'" stroke="#fff" stroke-width="3"><title>'+c.label+'</title></circle>');
  });
  // Nos dois interruptores, os três terminais ficam nomeados e alinhados aos pinos reais.
  for(const id of answerMode==='switched'?['s1','s2']:[]){
   for(const [pin,label] of [['IN','IN'],['OUT','OUT'],['LEDG','LED−']]){
    const p=portPosition(id+'.'+pin),x=p.x,y=p.y+38;
    const accent=pin==='LEDG'?'#607582':id==='s1'?'#bb453b':'#b23a75';
    pieces.push('<path d="M'+p.x+' '+(p.y+10)+' V'+(y-16)+'" stroke="'+accent+'" stroke-width="2"/>');
    pieces.push('<rect x="'+(x-30)+'" y="'+(y-16)+'" width="60" height="29" rx="9" fill="#fff" stroke="'+accent+'" stroke-width="2"/>');
    pieces.push('<text x="'+x+'" y="'+(y+4)+'" font-family="Arial,sans-serif" font-weight="bold" font-size="17" fill="'+accent+'" text-anchor="middle">'+label+'</text>');
   }
  }
  pieces.push('<rect x="69" y="1346" width="1912" height="58" rx="20" fill="#e3eff1"/>');
  const legend=[['#ce3638','ESP32 / energia'],['#d34073','Motores / energia'],['#1767b2','Comandos'],['#107b50','Motor 1'],['#eba12a','Motor 2']];
  legend.forEach((item,i)=>{
   const x=99+i*378;
   pieces.push('<path d="M'+x+' 1376 H'+(x+54)+'" stroke="'+item[0]+'" stroke-width="11" stroke-linecap="round"/>');
   pieces.push('<text x="'+(x+67)+'" y="1384" font-size="21" font-family="Arial,sans-serif" fill="#315d68">'+item[1]+'</text>');
  });
  pieces.push('</svg>');
  return pieces.join('');
 }
 const partLabels={b1:'Bateria 1',s1:'Gangorra 1',lm:'LM2596',esp:'ESP32',
                   b2:'Suporte 6 AA',s2:'Gangorra 2',drv:'Ponte H',ml:'Motor 1',mr:'Motor 2'};
 const pinLabels={POS:'+',NEG:'−',INP:'IN+',INN:'IN−',OUTP:'OUT+',OUTN:'OUT−',VCC:'VCC',GND:'GND',GND2:'GND2',
                  A:'A',B:'B',IN:'IN',OUT:'OUT'};
 function wireName(i){
  const w=connections[i],a=displayedPorts(i).a,b=w.b;
  const part=s=>{
   const parts=s.split('.');
   return (partLabels[parts[0]]||parts[0])+' '+(pinLabels[parts[1]]||parts[1]);
  };
  return part(a)+' → '+part(b);
 }
 function showGroup(group){
  activeCategory=group;activeWire=-1;refresh();
 }
 function showWire(i){
  if(activeWire===i){activeWire=-1;}
  else{activeWire=i;
   const category=categories.find(c=>c.id!=='all'&&c.indices.includes(i));
   if(category)activeCategory=category.id;
  }
  refresh();
 }
 function renderFilters(){
  const root=el('answerFilters');root.replaceChildren();
  for(const category of categories){
   const button=document.createElement('button');
   button.type='button';button.textContent=category.label;
   button.className='answer-filter'+(activeCategory===category.id?' is-active':'');
   button.setAttribute('aria-pressed',String(activeCategory===category.id));
   button.addEventListener('click',()=>showGroup(category.id));
   root.append(button);
  }
  const picker=el('answerWirePicker');picker.replaceChildren();
  const current=categories.find(c=>c.id===activeCategory)||categories[0];
  for(const i of current.indices){
   const button=document.createElement('button');button.type='button';
   button.className='answer-wire-choice'+(activeWire===i?' is-active':'');
   button.style.setProperty('--wire-color',colors[i]);
   button.textContent=String(i+1).padStart(2,'0')+' · '+wireName(i);
   button.setAttribute('title','Destacar fio '+(i+1)+': '+wireName(i));
   button.setAttribute('aria-pressed',String(activeWire===i));
   button.addEventListener('click',()=>showWire(i));
   picker.append(button);
  }
  const status=el('answerSelectedInfo');
  if(activeWire>=0)status.textContent='Fio '+String(activeWire+1).padStart(2,'0')+' • '+wireName(activeWire)+' — toque novamente para ver toda a etapa.';
  else status.textContent=current.title+' • '+current.indices.length+' fios visíveis. Toque no número de um fio para acompanhá-lo sozinho.';
  status.style.setProperty('--wire-color',activeWire>=0?colors[activeWire]:'#1b8374');
 }
 function renderSummary(){
  const root=el('answerGroups');root.replaceChildren();
  for(const group of groups){
   const section=document.createElement('section');section.className='answer-group';
   section.style.setProperty('--section-color',group.color);
   const heading=document.createElement('h3');heading.textContent=group.title;
   const p=document.createElement('p');p.textContent=group.info;section.append(heading,p);
   for(const w of connections.slice(group.from,group.to)){
    const row=document.createElement('div');row.className='answer-row';
    row.style.setProperty('--section-color',colors[w.n-1]);
    for(const [v,css] of [[String(w.n).padStart(2,'0'),'answer-n'],[w.from,'answer-port'],['→','answer-arrow'],[w.to,'answer-port']]){
     const span=document.createElement('span');span.className=css;span.textContent=v;row.append(span);
    }
    section.append(row);
   }
   root.append(section);
  }
 }
 function applyZoom(){
  const board=el('answerDiagram'),svg=board.querySelector('svg');
  if(svg){svg.style.width=Math.round(100*magnification)+'%';svg.style.height='auto';}
  el('answerZoomLabel').textContent=Math.round(magnification*100)+'%';
 }
 function refresh(){
  el('answerDiagram').innerHTML=makeSvg();
  renderFilters();applyZoom();
 }
 function setAnswerMode(mode){
  answerMode=mode==='direct'?'direct':'switched';
  connections=answerMode==='direct'?data.directConnections:data.connections;
  components=answerMode==='direct'?data.components.filter(p=>p.kind!=='switch'):data.components;
  groups=answerMode==='direct'?data.directGroups:data.groups;
  categories=answerMode==='direct'?directCategories:switchedCategories;
  for(const id of ['Direct','Switched']){
   const active=id.toLowerCase()===answerMode;
   el('answerMode'+id).classList.toggle('is-active',active);
   el('answerMode'+id).setAttribute('aria-pressed',String(active));
  }
  el('answerCounter').textContent='✓ '+components.length+' peças • '+connections.length+' fios conectados';
  el('answerDetailsTitle').textContent='Ver resumo das '+connections.length+' conexões';
  activeCategory='all';activeWire=-1;magnification=1;
  renderSummary();refresh();
 }
 function renderCircuit(){setAnswerMode(answerMode);}
 function open(){
  el('answerForm').hidden=false;el('answerContent').hidden=true;
  el('answerError').textContent='';el('answerPassword').value='';
  el('answerDetails').open=false;
  dialog.showModal();el('answerPassword').focus();
 }
 btn.addEventListener('click',open);
 el('answerClose').addEventListener('click',()=>dialog.close());
 el('answerForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(el('answerPassword').value!=='peteduca'){
   el('answerError').textContent='Senha incorreta. Tente novamente.';
   el('answerPassword').value='';el('answerPassword').focus();return;
  }
  el('answerPassword').value='';el('answerError').textContent='';
  el('answerForm').hidden=true;el('answerContent').hidden=false;
  renderCircuit();
 });
 el('answerModeDirect').addEventListener('click',()=>setAnswerMode('direct'));
 el('answerModeSwitched').addEventListener('click',()=>setAnswerMode('switched'));
 el('answerDiagram').addEventListener('click',e=>{
  const index=e.target?.getAttribute?.('data-answer-wire');
  if(index!==null&&index!==undefined)showWire(Number(index));
 });
 el('answerZoomIn').addEventListener('click',()=>{magnification=Math.min(3.5,magnification+.35);applyZoom();});
 el('answerZoomOut').addEventListener('click',()=>{magnification=Math.max(1,magnification-.35);applyZoom();});
 el('answerZoomFit').addEventListener('click',()=>{magnification=1;applyZoom();el('answerBoardScroll').scrollLeft=0;});
 function download(blob,name){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
 }
 // Um SVG independente precisa incorporar as imagens locais dos componentes.
 async function withEmbeddedAssets(){
  const paths=[...new Set(components.map(p=>p.image))];
  const entries=await Promise.all(paths.map(async path=>{
   const response=await fetch(path);
   if(!response.ok)throw new Error('Imagem indisponível: '+path);
   const svg=await response.text();
   return [path,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)];
  }));
  return makeSvg(Object.fromEntries(entries));
 }
 function exportSvg(){
  const fallback=()=>download(new Blob([makeSvg()],{type:'image/svg+xml;charset=utf-8'}),'TinkerPET-gabarito.svg');
  if(typeof fetch!=='function'){fallback();return;}
  withEmbeddedAssets().then(svg=>download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'TinkerPET-gabarito.svg'))
   .catch(()=>{fallback();alert('Algumas imagens podem exigir abrir o SVG junto aos arquivos do site.');});
 }
 el('answerDownload').addEventListener('click',exportSvg);
 el('answerPng').addEventListener('click',async()=>{
  if(busy)return;busy=true;
  const button=el('answerPng');button.disabled=true;button.textContent='Preparando imagem…';
  let u='';
  try{
   const svg=await withEmbeddedAssets();
   u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
   const img=new Image();
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=u;});
   const canvas=document.createElement('canvas');canvas.width=3075;canvas.height=2175;
   const context=canvas.getContext('2d');if(!context)throw new Error('Canvas indisponível');
   context.drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob)throw new Error('Falha na imagem');
   download(blob,'TinkerPET-gabarito-visual.png');
  }catch(err){alert('Não foi possível criar o PNG neste navegador. Use o download SVG ou Salvar PDF.');}
  finally{if(u)URL.revokeObjectURL(u);button.disabled=false;button.textContent='↓ Baixar imagem PNG';busy=false;}
 });
 el('answerPrint').addEventListener('click',()=>window.print());
})();
