'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 const CONFIG='petquiz-settings.json',DRAFT='tinkerpet-admin-draft-v1';
 const REPO='peteducacao/laboratorio-robotica-pet';
 const auth=sessionStorage.getItem('tinkerpet-admin-auth')==='ok';
 const login=$('loginForm');
 if(!auth){
  login.addEventListener('submit',e=>{
   e.preventDefault();
   if($('password').value==='peteducacao'){
    sessionStorage.setItem('tinkerpet-admin-auth','ok');location.reload();
   }else{$('loginError').textContent='Senha incorreta.';$('password').value='';$('password').focus()}
  });
  return;
 }
 $('authOverlay').hidden=true;$('adminShell').hidden=false;
 const placeholder={version:1,quizEnabled:true,answerKeyEnabled:true,questionCount:10,bonusCount:2,
  categories:[{id:'componentes',name:'Componentes',stage:'concept'},{id:'situacoes',name:'Situações práticas',stage:'practice'}],
  prerequisites:[],questions:[]};
 let settings={...placeholder},selectedId=null,remoteSettings=null,editingCategory=null,editingTopic=null;
 const clone=obj=>JSON.parse(JSON.stringify(obj));
 const qs=()=>settings.questions;
 function notice(message,error=false){
  const el=$('notice');el.textContent=message;el.classList.toggle('error',error);el.hidden=false;
 }
 function saveDraft(){
  localStorage.setItem(DRAFT,JSON.stringify(settings));
  $('saveState').textContent='Prévia local · publique para atualizar os alunos';
 }
 const defaultCategory=stage=>stage==='practice'?'situacoes':'componentes';
 const slug=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,35)||'novo';
 function normalize(data){
  if(!data||!Array.isArray(data.questions))throw Error('Banco de questões inválido.');
  const categories=Array.isArray(data.categories)&&data.categories.length?
   data.categories.filter(c=>c?.id&&c.name&&['concept','practice'].includes(c.stage)):
   clone(placeholder.categories);
  const names={outros:'Outros componentes',ponte:'Ponte H',lm2596:'LM2596',
   gangorra:'Chave gangorra',jumper:'Jumpers',esp32:'ESP32',motor:'Motor DC',
   rodas:'Rodas',bateria:'Bateria de 9 V',pilhas:'Pilhas AA'};
  const topicIds=new Set(data.questions.flatMap(q=>[q.topic,...(q.requires||[])].filter(Boolean)));
  const prerequisites=Array.isArray(data.prerequisites)?data.prerequisites.filter(t=>t?.id&&t.name):[];
  for(const id of topicIds)if(!prerequisites.some(t=>t.id===id))prerequisites.push({id,name:names[id]||id});
  const out={version:1,quizEnabled:data.quizEnabled!==false,answerKeyEnabled:data.answerKeyEnabled!==false,
   questionCount:Math.max(1,Math.min(99,Math.trunc(Number(data.questionCount)||10))),
   bonusCount:Math.max(0,Math.min(7,Math.trunc(data.bonusCount==null?2:Number(data.bonusCount)||0))),
   categories,prerequisites,
   questions:data.questions.filter(q=>q&&typeof q.prompt==='string').map(q=>({
    ...q,active:q.active!==false,
    categoryId:categories.some(c=>c.id===q.categoryId)?q.categoryId:
     (categories.find(c=>c.stage===q.stage)?.id||defaultCategory(q.stage))
   }))};
  const active=out.questions.filter(q=>q.active).length;
  if(active&&out.questionCount>active)out.questionCount=active;
  return out;
 }
 function countControl(kind,step){
  const max=kind==='bonusCount'?7:Math.max(1,qs().filter(q=>q.active).length);
  const min=kind==='bonusCount'?0:1;
  settings[kind]=Math.min(max,Math.max(min,settings[kind]+step));
  saveDraft();renderOverview();
 }
 function renderOverview(){
  for(const id of ['homeQuizEnabled','settingsQuizEnabled'])$(id).checked=settings.quizEnabled;
  for(const id of ['homeAnswerEnabled','settingsAnswerEnabled'])$(id).checked=settings.answerKeyEnabled;
  for(const id of ['homeQuestionCount','settingsQuestionCount'])$(id).textContent=settings.questionCount;
  for(const id of ['homeBonusCount','settingsBonusCount'])$(id).textContent=settings.bonusCount;
  $('questionAvailable').textContent=qs().filter(q=>q.active).length;
 }
 function setPage(page){
  for(const p of document.querySelectorAll('.page'))p.classList.toggle('active',p.id==='page-'+page);
  for(const b of document.querySelectorAll('.nav-btn'))b.classList.toggle('active',b.dataset.page===page);
  const labels={inicio:['Painel de Controle','Gerencie o PETQuiz de forma rápida.'],
   questoes:['Banco de Questões','Cadastre e revise as perguntas do jogo.'],
   taxonomia:['Categorias e Requisitos','Organize as opções para cadastrar perguntas.'],
   configuracoes:['Configurações do Jogo','Defina a disponibilidade e o número de desafios.']};
  $('pageTitle').textContent=labels[page][0];$('pageDescription').textContent=labels[page][1];
  if(page==='questoes')renderList();
  if(page==='taxonomia')renderTaxonomies();
  window.scrollTo({top:0,behavior:'instant'});
  const active=document.querySelector('.nav-btn.active'),nav=document.querySelector('.side-nav');
  if(active&&nav&&window.innerWidth<=700){
   const goal=active.offsetLeft-nav.offsetLeft-(nav.clientWidth-active.clientWidth)/2;
   nav.scrollTo({left:Math.max(0,goal),behavior:'smooth'});
  }
 }
 function renderList(){
  const filter=$('searchQuestions').value.trim().toLowerCase();
  const list=$('questionList');list.replaceChildren();
  const all=qs().filter(q=>(q.prompt+' '+(q.topic||'')+' '+(q.requires||[]).join(' ')).toLowerCase().includes(filter));
  $('bankCount').textContent=all.length+' pergunta'+(all.length===1?'':'s');
  all.forEach((q,i)=>{
   const row=document.createElement('button');row.type='button';row.className='question-row';
   row.classList.toggle('active',q.id===selectedId);
   const num=document.createElement('span');num.className='question-number';num.textContent=String(qs().indexOf(q)+1).padStart(2,'0');
   const info=document.createElement('span'),heading=document.createElement('strong'),meta=document.createElement('small');
   heading.textContent=q.prompt;
   meta.textContent=(q.stage==='practice'?'Situação prática':'Componentes')+' · '+(q.active?'Ativa':'Inativa');
   if(!q.active)meta.className='off';
   info.append(heading,meta);row.append(num,info);
   row.addEventListener('click',()=>selectQuestion(q.id));
   list.append(row);
  });
  if(!all.length){const p=document.createElement('p');p.className='muted';p.textContent='Nenhuma pergunta encontrada.';list.append(p)}
 }
 function selectQuestion(id){
  const q=qs().find(x=>x.id===id);if(!q)return;
  selectedId=id;$('editorTitle').textContent='Editar pergunta';
  $('questionText').value=q.prompt;
  q.choices.forEach((text,i)=>{$('opt'+i).value=text});
  $('correctSelect').value=String(q.correct);
  $('stageSelect').value=q.stage==='practice'?'practice':'concept';
  $('topicInput').value=q.stage==='practice'?(q.requires||[]).join(', '):q.topic||'';
  $('activeQuestion').checked=q.active!==false;
  $('deleteQuestion').disabled=false;
  renderList();
 }
 function newQuestion(){
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const q={id,stage:'concept',topic:'assunto-'+id,prompt:'',choices:['','','',''],correct:0,why:'',active:true};
  settings.questions.push(q);saveDraft();selectQuestion(id);setPage('questoes');$('questionText').focus();
  notice('Nova pergunta criada. Preencha e salve as alternativas.');
 }
 function validate(){
  if(!Array.isArray(settings.questions)||!settings.questions.length)throw Error('Cadastre ao menos uma pergunta.');
  const active=qs().filter(q=>q.active!==false);
  if(!active.length)throw Error('Ative ao menos uma pergunta.');
  const ids=new Set();
  for(const q of qs()){
   if(!q.id||ids.has(q.id))throw Error('IDs de pergunta repetidos.');
   ids.add(q.id);
   if(!q.prompt.trim()||!Array.isArray(q.choices)||q.choices.length!==4||
    q.choices.some(c=>!String(c).trim()))throw Error('Preencha as quatro alternativas de todas as perguntas. Verifique: '+(q.prompt||q.id));
   if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)throw Error('Gabarito inválido: '+q.prompt);
  }
  settings.questionCount=Math.max(1,Math.min(settings.questionCount,active.length));
  settings.bonusCount=Math.max(0,Math.min(7,settings.bonusCount));
  return true;
 }
 function deleteQuestion(){
  const q=qs().find(q=>q.id===selectedId);if(!q)return;
  if(!confirm('Excluir permanentemente esta pergunta do rascunho?'))return;
  if(qs().length<=1){notice('É necessário manter ao menos uma pergunta.',true);return}
  settings.questions=settings.questions.filter(x=>x.id!==selectedId);
  selectedId=settings.questions[0]?.id||null;
  if(settings.questionCount>settings.questions.filter(q=>q.active).length)
   settings.questionCount=Math.max(1,settings.questions.filter(q=>q.active).length);
  saveDraft();renderOverview();renderList();
  if(selectedId)selectQuestion(selectedId);
  notice('Pergunta excluída do rascunho.');
 }
 function saveQuestion(e){
  e.preventDefault();
  const q=qs().find(x=>x.id===selectedId);if(!q)return;
  const text=$('questionText').value.trim(),choices=[0,1,2,3].map(i=>$('opt'+i).value.trim());
  if(!text||choices.some(x=>!x)){notice('Preencha o enunciado e as quatro alternativas.',true);return}
  const stage=$('stageSelect').value,topic=$('topicInput').value.trim();
  q.prompt=text;q.choices=choices;q.correct=Number($('correctSelect').value);
  q.stage=stage;q.active=$('activeQuestion').checked;
  if(stage==='practice'){q.requires=topic?topic.split(',').map(x=>x.trim()).filter(Boolean):[];delete q.topic;}
  else {q.topic=topic||('tema-'+q.id);delete q.requires;}
  if(!q.active&&settings.questionCount>qs().filter(q=>q.active).length)
   settings.questionCount=Math.max(1,qs().filter(q=>q.active).length);
  saveDraft();renderOverview();renderList();notice('Pergunta salva no rascunho.');
 }
 async function publish(){
  try{validate()}catch(err){notice(err.message,true);return}
  const token=$('githubToken').value.trim();
  if(!token){setPage('configuracoes');$('githubToken').focus();notice('Para publicar no site dos alunos, informe o token GitHub. O rascunho já está salvo aqui.',true);return}
  const btn=$('publish');btn.disabled=true;$('publishFooter').disabled=true;notice('Publicando no GitHub...');
  try{
   const uri='https://api.github.com/repos/'+REPO+'/contents/'+CONFIG;
   const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
   const current=await fetch(uri,{headers,cache:'no-store'});
   if(!current.ok)throw Error('Não foi possível obter o arquivo no GitHub (HTTP '+current.status+'). Confira as permissões do token.');
   const doc=await current.json();
   const json=JSON.stringify(settings,null,2)+'\n';
   const bytes=new TextEncoder().encode(json);let binary='';
   for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.slice(i,i+16384));
   const content=btoa(binary);
   const response=await fetch(uri,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},
    body:JSON.stringify({message:'Admin: atualizar banco de questões e configuração do PETQuiz',content,sha:doc.sha,branch:'main'})});
   if(!response.ok){const detail=await response.text();throw Error('Falha ao publicar ('+response.status+'): '+detail.slice(0,180))}
   localStorage.removeItem(DRAFT);remoteSettings=clone(settings);
   $('saveState').textContent='Publicação enviada ao GitHub';
   notice('Publicado! As alterações ficam disponíveis após a atualização do GitHub Pages.');
  }catch(err){console.error(err);notice(err.message||'Falha na publicação',true)}
  finally{btn.disabled=false;$('publishFooter').disabled=false}
 }
 function exportJson(){
  try{validate()}catch(err){notice(err.message,true);return}
  const blob=new Blob([JSON.stringify(settings,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='petquiz-settings.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 for(const el of document.querySelectorAll('[data-page]'))el.addEventListener('click',()=>setPage(el.dataset.page));
 for(const el of document.querySelectorAll('[data-counter]'))el.addEventListener('click',()=>countControl(el.dataset.counter,Number(el.dataset.step)));
 for(const id of ['homeQuizEnabled','settingsQuizEnabled'])$(id).addEventListener('change',e=>{
  settings.quizEnabled=e.target.checked;saveDraft();renderOverview();
 });
 for(const id of ['homeAnswerEnabled','settingsAnswerEnabled'])$(id).addEventListener('change',e=>{
  settings.answerKeyEnabled=e.target.checked;saveDraft();renderOverview();
 });
 $('searchQuestions').addEventListener('input',renderList);
 $('addQuestion').addEventListener('click',newQuestion);
 $('questionForm').addEventListener('submit',saveQuestion);
 $('deleteQuestion').addEventListener('click',deleteQuestion);
 $('publish').addEventListener('click',publish);$('publishFooter').addEventListener('click',publish);
 $('exportSettings').addEventListener('click',exportJson);
 $('discardDraft').addEventListener('click',()=>{
  if(!confirm('Descartar alterações locais e voltar à última versão publicada?'))return;
  if(remoteSettings){settings=clone(remoteSettings);localStorage.removeItem(DRAFT);selectedId=settings.questions[0]?.id||null;
   if(selectedId)selectQuestion(selectedId);renderOverview();notice('Rascunho descartado.')}
 });
 $('logout').addEventListener('click',()=>{sessionStorage.removeItem('tinkerpet-admin-auth');location.href='admin.html'});
 try{
  const response=await fetch(CONFIG+'?nocache='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('Não foi possível carregar as configurações publicadas ('+response.status+').');
  remoteSettings=normalize(await response.json());
  let draft=null;try{draft=JSON.parse(localStorage.getItem(DRAFT)||'null')}catch{}
  settings=normalize(draft||remoteSettings);
  if(draft){notice('Rascunho local recuperado. Publique para atualizar o site dos alunos.');$('saveState').textContent='Há alterações ainda não publicadas'}
  selectedId=qs()[0]?.id||null;
  renderOverview();if(selectedId)selectQuestion(selectedId);
  renderList();
 }catch(err){notice(err.message,true);$('saveState').textContent='Falha ao carregar configurações';$('publish').disabled=true}
 window.TinkerPETAdmin={getSettings:()=>clone(settings),publish,selectQuestion,newQuestion,deleteQuestion};
})();