'use strict';
(()=>{
 // Remove aviso antigo de importação, inclusive se o HTML estiver em cache.
 document.querySelector('.side-note')?.remove();
 const ROOT='tinkerpet-v2', LIB='tinkerpet-library-v1', ACTIVE='tinkerpet-active-v1', NICK='tinkerpet-nickname-v1';
 const $=id=>document.getElementById(id);
 const typeKinds={esp:'esp',drv:'driver',lm:'buck',b1:'battery',b2:'batteryPack',s1:'switch',s2:'switch',ml:'motor',mr:'motor'};
 const geometry={
  esp:[790,365,'assets/esp32-devkit-v1-30p.svg?v=29'],driver:[250,317,'assets/mx1508-desenhado.svg?v=38'],
  buck:[288,180,'assets/lm2596-desenhado.svg'],battery:[170,228,'assets/bateria-9v-desenhada.svg'],
  batteryPack:[265,255,'assets/suporte-6-pilhas.svg'],switch:[205,165,'assets/gangorra-desenhada.svg?v=3'],
  motor:[190,405,'assets/motor-frontal.svg']
 };
 const pins={
  esp:{"VIN":[14.4,18.5],"GND":[19.43,18.5],"D13":[24.46,18.5],"D12":[29.49,18.5],"D14":[34.52,18.5],"D27":[39.55,18.5],"D26":[44.58,18.5],"D25":[49.61,18.5],"D33":[54.64,18.5],"D32":[59.67,18.5],"D35":[64.7,18.5],"D34":[69.73,18.5],"VN":[74.76,18.5],"VP":[79.79,18.5],"EN":[84.82,18.5],"3V3":[14.4,85.7],"GND2":[19.43,85.7],"D15":[24.46,85.7],"D2":[29.49,85.7],"D4":[34.52,85.7],"RX2":[39.55,85.7],"TX2":[44.58,85.7],"D5":[49.61,85.7],"D18":[54.64,85.7],"D19":[59.67,85.7],"D21":[64.7,85.7],"RX0":[69.73,85.7],"TX0":[74.76,85.7],"D22":[79.79,85.7],"D23":[84.82,85.7]},
  driver:{VCC:[24.3,84.5],GND:[34.7,84.5],IN1:[45,84.5],IN2:[55.3,84.5],IN3:[65.7,84.5],IN4:[76,84.5],OUT1:[70.7,16.5],OUT2:[85.7,16.5],OUT3:[24.3,16.5],OUT4:[39.3,16.5]},
  buck:{INP:[14.72,35.1],INN:[14.72,63.1],OUTP:[85,35.1],OUTN:[85,63.1]},
  battery:{POS:[30.6,4.7],NEG:[68.6,6.2]},batteryPack:{POS:[16.1,7.7],NEG:[84.7,7.7]},
  switch:{IN:[25,89.8],OUT:[50,89.8],LEDG:[75,89.8]},motor:{A:[18,85],B:[18,80]}
 };
 const clone=obj=>JSON.parse(JSON.stringify(obj));
 const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'tp-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 const blank=()=>({parts:[],wires:[],voltage:4,switches:{s1:false,s2:false},wireColor:'#ed654d'});
 const valid=c=>c&&Array.isArray(c.parts)&&Array.isArray(c.wires)&&c.parts.length<=80&&c.wires.length<=600;
 const parse=s=>{try{return JSON.parse(s)}catch{return null}};
 const usable=c=>valid(c)&&c.parts.some(p=>p&&typeKinds[p.id]===p.kind);
 const sanitize=c=>{
  if(!valid(c))throw Error('O arquivo não contém uma montagem válida.');
  const out=clone(c);
  out.parts=out.parts.filter(p=>p&&typeKinds[p.id]===p.kind&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(out.parts.length>9)out.parts=out.parts.slice(0,9);
  const names=new Set(out.parts.map(p=>p.id));
  out.wires=out.wires.filter(w=>w&&typeof w.a==='string'&&typeof w.b==='string'&&
   names.has(w.a.split('.')[0])&&names.has(w.b.split('.')[0])&&Array.isArray(w.via||[])&&
   (w.via||[]).length<80);
  out.selected=null;out.startPort=null;out.selectedWire=null;out.bends=[];out.completed=false;
  return out;
 };
 let lib=null;
 function toast(message){const node=$('notice');if(!node)return;node.textContent=message;node.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{node.hidden=true},4100);}
 function save(){
  try{localStorage.setItem(LIB,JSON.stringify(lib));return true}
  catch(e){toast('Não foi possível salvar: confira o espaço do navegador.');return false}
 }
 function init(){
  lib=parse(localStorage.getItem(LIB));
  if(!lib||!Array.isArray(lib.projects)){lib={version:1,projects:[]};
   const legacy=parse(localStorage.getItem(ROOT));
   if(usable(legacy)){
    const first={id:id(),name:legacy.parts.some(p=>p.kind==='switch')?'Carrinho com gangorras':'Meu primeiro circuito',
     createdAt:Date.now(),updatedAt:Date.now(),circuit:sanitize(legacy)};
    lib.projects.push(first);localStorage.setItem(ACTIVE,first.id);
   }
   save();
  }
  if(lib.projects.length===0&&usable(parse(localStorage.getItem(ROOT)))&&!localStorage.getItem(ACTIVE)){
   // Não recria o circuito se a biblioteca já foi usada e ficou vazia.
  }
  syncEditor();
 }
 function syncEditor(){
  const currentId=localStorage.getItem(ACTIVE),project=lib.projects.find(p=>p.id===currentId);
  if(!project)return;
  const live=parse(localStorage.getItem(ROOT));
  if(!valid(live))return;
  const circuit=sanitize(live);
  if(JSON.stringify(circuit)!==JSON.stringify(project.circuit)){
   project.circuit=circuit;project.updatedAt=Date.now();save();
  }
 }
 function goEditor(project){
  syncEditor();
  localStorage.setItem(ROOT,JSON.stringify(project.circuit));
  localStorage.setItem(ACTIVE,project.id);
  location.href='editor.html?release=20261030edgepan1';
 }
 function newCircuit(){
  syncEditor();const now=Date.now();
  const project={id:id(),name:'Novo circuito',createdAt:now,updatedAt:now,circuit:blank()};
  lib.projects.unshift(project);if(!save())return;goEditor(project);
 }
 function duplicate(project){
  syncEditor();
  const copy={id:id(),name:project.name+' (cópia)',createdAt:Date.now(),updatedAt:Date.now(),circuit:clone(project.circuit)};
  lib.projects.unshift(copy);if(save()){render();toast('Cópia criada. O original foi preservado.')}
 }
 function rename(project){
  openEdit('Renomear circuito',project.name,'Salvar',value=>{
   const name=value.trim().slice(0,80);if(!name)return false;
   project.name=name;project.updatedAt=Date.now();if(save()){render();return true}return false;
  });
 }
 function remove(project){
  openConfirm('Excluir circuito','Excluir “'+project.name+'”? Esta ação não pode ser desfeita.',()=>{
   const after=lib.projects.filter(p=>p.id!==project.id);
   lib.projects=after;
   if(localStorage.getItem(ACTIVE)===project.id)localStorage.removeItem(ACTIVE);
   if(save()){render();toast('Circuito excluído.')}
  });
 }
 function download(project){
  syncEditor();const pack={app:'TinkerPET Studio',version:1,name:project.name,exportedAt:new Date().toISOString(),circuit:clone(project.circuit)};
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=(project.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'circuito')+'.tinkerpet.json';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Arquivo do circuito baixado. Pode importá-lo em outro dispositivo.');
 }
 async function importCircuit(file){
  if(!file)return;
  if(file.size>4000000){toast('Arquivo muito grande. Escolha um projeto do TinkerPET.');return}
  try{
   const payload=parse(await file.text());
   const raw=payload?.circuit||payload?.project?.circuit||payload;
   const circuit=sanitize(raw);
   if(!circuit.parts.length)throw Error('O arquivo não tem componentes válidos.');
   syncEditor();
   const name=String(payload?.name||file.name.replace(/\.(tinkerpet\.)?json$/i,'')||'Circuito importado').slice(0,80);
   const project={id:id(),name,createdAt:Date.now(),updatedAt:Date.now(),circuit};
   lib.projects.unshift(project);
   if(save()){render();toast('Circuito importado! Clique em Editar para continuar.')}
  }catch(err){toast('Falha ao importar: '+err.message)}
  finally{$('importFile').value=''}
 }
 const memorySize=()=>{try{return new Blob([localStorage.getItem(LIB)||'']).size}catch{return 0}};
 const date=ts=>new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 const icon=(name)=>{
  const shapes={edit:'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L10 16l-4 1 1-4z"/>',
   copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
   rename:'<path d="m4 20 7-17 7 17M6 15h10"/>',download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
   trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
   plus:'<path d="M12 4v16M4 12h16"/>'};
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.plus)+'</svg>';
 };
 function safeText(t){const node=document.createElement('span');node.textContent=String(t);return node.innerHTML}
 function thumb(project,canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const W=canvas.width=640,H=canvas.height=300,c=project.circuit,parts=c.parts||[],wires=c.wires||[];
  ctx.fillStyle='#f4f8f9';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#d5e4e8';for(let x=10;x<W;x+=17)for(let y=9;y<H;y+=17){ctx.beginPath();ctx.arc(x,y,.8,0,7);ctx.fill()}
  if(!parts.length){ctx.fillStyle='#91a9b3';ctx.font='bold 25px Arial';ctx.textAlign='center';ctx.fillText('Bancada vazia',W/2,H/2);return}
  const bounds=parts.map(p=>{const g=geometry[p.kind],sz=p.kind==='motor'&&p.view==='side'?[340,170]:g;
   return {x:p.x,y:p.y,w:sz[0],h:sz[1]};});
  const x0=Math.min(...bounds.map(b=>b.x)),y0=Math.min(...bounds.map(b=>b.y));
  const x1=Math.max(...bounds.map(b=>b.x+b.w)),y1=Math.max(...bounds.map(b=>b.y+b.h));
  const midX=(x0+x1)/2,midY=(y0+y1)/2,spanX=Math.max(100,x1-x0),spanY=Math.max(100,y1-y0);
  const scale=Math.min((W-56)/spanX,(H-40)/spanY,1.8);
  const map=(x,y)=>({x:W/2+(x-midX)*scale,y:H/2+(y-midY)*scale});
  const getPort=port=>{
   const [pid,name]=port.split('.'),p=parts.find(p=>p.id===pid);if(!p)return null;
   const side=p.kind==='motor'&&p.view==='side';
   const sz=side?[340,170]:geometry[p.kind];
   const pos=side?({A:[96,42],B:[96,63]})[name]:pins[p.kind]?.[name];
   if(!pos)return null;
   let x=p.x+sz[0]*pos[0]/100,y=p.y+sz[1]*pos[1]/100;
   const angle=((p.rotation||0)%360)*Math.PI/180;
   if(angle){const cx=p.x+sz[0]/2,cy=p.y+sz[1]/2,dx=x-cx,dy=y-cy;
    x=cx+dx*Math.cos(angle)-dy*Math.sin(angle);
    y=cy+dx*Math.sin(angle)+dy*Math.cos(angle);}
   return map(x,y);
  };
  const renderWires=()=>{
   ctx.lineWidth=Math.max(2,8*scale);ctx.lineCap='round';ctx.lineJoin='round';
   for(const wire of wires){
    const start=getPort(wire.a),end=getPort(wire.b);if(!start||!end)continue;
    ctx.beginPath();ctx.moveTo(start.x,start.y);
    for(const b of wire.via||[]){const point=map(b.x,b.y);ctx.lineTo(point.x,point.y)}
    ctx.lineTo(end.x,end.y);ctx.strokeStyle=wire.color||'#ed654d';ctx.stroke();
   }
  };
  let loaded=0;const sprites=parts.map(p=>{
   const g=geometry[p.kind];if(!g)return null;
   const img=new Image();img.src=p.kind==='motor'&&p.view==='side'?'assets/motor-lateral.svg':g[2];
   return {p,img,w:p.kind==='motor'&&p.view==='side'?340:g[0],h:p.kind==='motor'&&p.view==='side'?170:g[1]};
  }).filter(Boolean);
  const draw=()=>{
   ctx.fillStyle='#f4f8f9';ctx.fillRect(0,0,W,H);
   ctx.fillStyle='#d5e4e8';for(let x=10;x<W;x+=17)for(let y=9;y<H;y+=17){ctx.beginPath();ctx.arc(x,y,.8,0,7);ctx.fill()}
   for(const {p,img,w,h} of sprites){
    const pt=map(p.x,p.y);
    if(img.complete&&img.naturalWidth){
     ctx.save();ctx.translate(pt.x+w*scale/2,pt.y+h*scale/2);
     ctx.rotate(((p.rotation||0)%360)*Math.PI/180);
     ctx.drawImage(img,-w*scale/2,-h*scale/2,w*scale,h*scale);ctx.restore();
    }
   }
   renderWires();
  };
  sprites.forEach(({img})=>{img.addEventListener('load',draw,{once:true});img.addEventListener('error',draw,{once:true})});draw();
 }
 function render(){
  const grid=$('projectsGrid'),projects=lib.projects.slice(),query=$('searchCircuits').value.trim().toLocaleLowerCase('pt-BR'),sort=$('sortCircuits').value;
  projects.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name,'pt-BR'):sort==='components'?
   (a,b)=>b.circuit.parts.length-a.circuit.parts.length:(a,b)=>b.updatedAt-a.updatedAt);
  const filtered=projects.filter(p=>p.name.toLocaleLowerCase('pt-BR').includes(query));
  grid.replaceChildren();
  if(!query){
   const create=document.createElement('article');create.className='create-card';
   create.innerHTML='<button class="create-inner" data-action="new"><span class="create-icon">'+icon('plus')+'</span><strong>Criar novo circuito</strong></button>';
   grid.append(create);
  }
  if(!filtered.length&&query){
   const empty=document.createElement('div');empty.className='empty';
   empty.innerHTML='<h2>Nenhum circuito encontrado</h2><p>Experimente outro nome ou importe um projeto.</p>';
   grid.append(empty);
  }
  for(const p of filtered){
   const card=document.createElement('article');card.className='card';card.dataset.id=p.id;
   const name=safeText(p.name);card.innerHTML='<div class="card-art">'
    +'<button type="button" class="card-photo" data-action="edit" aria-label="Editar circuito: '+name+'" title="Abrir circuito para editar">'
    +'<canvas aria-label="Miniatura do circuito"></canvas></button>'
    +'<span class="status">✓ Salvo</span><button class="more" data-action="menu" aria-label="Opções de '+name+'">⋮</button></div>'
    +'<h2>'+name+'</h2><div class="meta"><span>▣ '+p.circuit.parts.length+' componentes</span><span>◷ '+date(p.updatedAt)+'</span></div>'
    +'<div class="divider"></div><div class="card-buttons">'
    +'<button class="edit" data-action="edit">'+icon('edit')+' Editar</button>'
    +'<button data-action="duplicate">'+icon('copy')+' Duplicar</button>'
    +'<button data-action="rename">'+icon('rename')+' Renomear</button>'
    +'<button data-action="download">'+icon('download')+' Baixar</button>'
    +'<button class="delete" data-action="delete">'+icon('trash')+' Excluir</button></div>';
   grid.append(card);thumb(p,card.querySelector('canvas'));
  }
  $('projectCount').textContent=lib.projects.length;
  const latest=projects[0];$('lastCircuit').textContent=latest?latest.name:'Nenhum circuito';
  const kb=memorySize()/1024;
  $('storageUsed').textContent=kb<1000?kb.toFixed(0)+' KB usados':(kb/1024).toFixed(1)+' MB usados';
  $('storageBar').style.width=Math.min(100,kb/4800*100)+'%';
  $('nickText').textContent=localStorage.getItem(NICK)||'Seu Nick';
 }
 let dialogHandler=null;
 function openEdit(title,current,action,onConfirm){
  $('editTitle').textContent=title;$('editInput').value=current;$('editSave').textContent=action;$('editError').textContent='';
  dialogHandler=onConfirm;$('editDialog').showModal();$('editInput').focus();$('editInput').select();
 }
 function openConfirm(title,body,onConfirm){
  $('confirmTitle').textContent=title;$('confirmBody').textContent=body;dialogHandler=onConfirm;
  $('confirmDialog').showModal();
 }
 function editNickname(){
  openEdit(localStorage.getItem(NICK)?'Alterar Nick':'Escolher meu Nick',localStorage.getItem(NICK)||'','Salvar',v=>{
   const name=v.trim().slice(0,24);if(!name){$('editError').textContent='Informe seu Nick.';return false}
   localStorage.setItem(NICK,name);render();return true;
  });
 }
 function openGate(){
  $('gatePassword').value='';$('gateError').textContent='';$('gateDialog').showModal();$('gatePassword').focus();
 }
 function attach(){
  $('projectsGrid').addEventListener('click',e=>{
   const button=e.target.closest('[data-action]');if(!button)return;
   const action=button.dataset.action;
   if(action==='new'){newCircuit();return}
   const id=button.closest('[data-id]')?.dataset.id,p=lib.projects.find(p=>p.id===id);if(!p)return;
   if(action==='edit')goEditor(p);
   else if(action==='duplicate')duplicate(p);
   else if(action==='rename')rename(p);
   else if(action==='download')download(p);
   else if(action==='delete')remove(p);
   else if(action==='menu')rename(p);
  });
  $('newCircuit').addEventListener('click',newCircuit);
  $('importCircuit').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',e=>importCircuit(e.target.files[0]));
  $('searchCircuits').addEventListener('input',render);
  $('sortCircuits').addEventListener('change',render);
  $('nickButton').addEventListener('click',editNickname);
  $('editForm').addEventListener('submit',e=>{e.preventDefault();const accept=dialogHandler?.($('editInput').value);if(accept!==false)$('editDialog').close()});
  $('cancelEdit').addEventListener('click',()=>$('editDialog').close());
  $('confirmYes').addEventListener('click',()=>{dialogHandler?.();$('confirmDialog').close()});
  $('confirmNo').addEventListener('click',()=>$('confirmDialog').close());
  $('openGate').addEventListener('click',openGate);
  $('gateClose').addEventListener('click',()=>$('gateDialog').close());
  $('gateForm').addEventListener('submit',e=>{
   e.preventDefault();if($('gatePassword').value!=='peteduca'){
    $('gatePassword').value='';$('gateError').textContent='Senha incorreta.';$('gatePassword').focus();return;
   }
   sessionStorage.setItem('tinkerpet-gabarito-access','ok');
   location.href='gabarito.html';
  });
  if(!localStorage.getItem(NICK))setTimeout(()=>{if(!$('editDialog').open)editNickname()},350);
  window.addEventListener('pageshow',e=>{if(e.persisted){syncEditor();render()}});
 }
 init();attach();render();
})();
