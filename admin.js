'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 const CONFIG='petquiz-settings.json',DRAFT='tinkerpet-admin-draft-v1';
 const auth=sessionStorage.getItem('tinkerpet-admin-auth')==='ok';
 const login=$('loginForm');
 const visibility=$('toggleAdminPassword');
 visibility.addEventListener('click',()=>{
  const input=$('password'),show=input.type==='password';
  input.type=show?'text':'password';
  visibility.setAttribute('aria-pressed',String(show));
  visibility.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
  visibility.title=show?'Ocultar senha':'Mostrar senha';
  input.focus();
 });
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
 let toastTimer=null;
 function showSaveToast(message='Alterações salvas!'){
  const toast=$('saveToast');$('saveToastText').textContent=message;
  toast.hidden=false;toast.classList.remove('toast-show');
  void toast.offsetWidth;toast.classList.add('toast-show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{toast.hidden=true;toast.classList.remove('toast-show')},2400);
 }
 const clone=obj=>JSON.parse(JSON.stringify(obj));
 const qs=()=>settings.questions;
 function notice(message,error=false){
  const el=$('notice');el.textContent=message;el.classList.toggle('error',error);el.hidden=false;
 }
 function saveDraft(){
  localStorage.setItem(DRAFT,JSON.stringify(settings));
  $('saveState').textContent='Salvo neste aparelho · envie o arquivo para atualizar todos';
  showSaveToast();
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
   configuracoes:['Configurações do Jogo','Defina a disponibilidade e o número de desafios.'],
   ajuda:['Ajuda','Aprenda a administrar as perguntas e os acessos.']};
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
 function renderEditorOptions(){
  const stageSelect=$('stageSelect'),topicSelect=$('topicInput');
  const selectedStage=stageSelect.value,selectedTopic=topicSelect.value;
  stageSelect.replaceChildren();topicSelect.replaceChildren();
  for(const category of settings.categories){
   const option=document.createElement('option');option.value=category.id;option.textContent=category.name;
   stageSelect.append(option);
  }
  const none=document.createElement('option');none.value='';none.textContent='Nenhum';
  topicSelect.append(none);
  for(const topic of settings.prerequisites){
   const option=document.createElement('option');option.value=topic.id;option.textContent=topic.name;
   topicSelect.append(option);
  }
  if(settings.categories.some(c=>c.id===selectedStage))stageSelect.value=selectedStage;
  if(settings.prerequisites.some(t=>t.id===selectedTopic))topicSelect.value=selectedTopic;
 }
 function updateTopicLabel(){
  const category=settings.categories.find(c=>c.id===$('stageSelect').value);
  $('topicLabel').firstChild.textContent=category?.stage==='practice'?
   'Pré-requisito (opcional)':'Assunto apresentado';
 }
 function renderTaxonomies(){
  const categoryList=$('categoryList'),topicList=$('topicList');
  categoryList.replaceChildren();topicList.replaceChildren();
  const makeRow=(list,item,meta,onEdit,onDelete)=>{
   const row=document.createElement('div');row.className='taxonomy-row';
   const main=document.createElement('div'),title=document.createElement('strong'),small=document.createElement('small');
   title.textContent=item.name;small.textContent=meta;main.append(title,small);
   const tools=document.createElement('div');tools.className='taxonomy-tools';
   const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.addEventListener('click',onEdit);
   const del=document.createElement('button');del.type='button';del.className='delete';del.textContent='Excluir';del.addEventListener('click',onDelete);
   tools.append(edit,del);row.append(main,tools);list.append(row);
  };
  for(const category of settings.categories)makeRow(categoryList,category,
   category.stage==='practice'?'Situação prática':'Conhecimento',
   ()=>{editingCategory=category.id;$('categoryName').value=category.name;
    $('categoryStage').value=category.stage;$('categorySave').textContent='Salvar categoria';
    $('categoryName').focus();},
   ()=>{if(qs().some(q=>q.categoryId===category.id)){
     notice('Esta categoria está em uso. Troque a categoria das perguntas antes de excluir.',true);return}
    if(!confirm('Excluir categoria '+category.name+'?'))return;
    settings.categories=settings.categories.filter(c=>c.id!==category.id);
    clearTaxonomy('category');saveDraft();renderTaxonomies();renderEditorOptions();
    notice('Categoria excluída do rascunho.');});
  for(const topic of settings.prerequisites)makeRow(topicList,topic,
   qs().filter(q=>q.topic===topic.id||(q.requires||[]).includes(topic.id)).length+' pergunta(s)',
   ()=>{editingTopic=topic.id;$('topicName').value=topic.name;$('topicSave').textContent='Salvar requisito';$('topicName').focus();},
   ()=>{if(qs().some(q=>q.topic===topic.id||(q.requires||[]).includes(topic.id))){
     notice('Este assunto está em uso. Troque o requisito das perguntas antes de excluir.',true);return}
    if(!confirm('Excluir assunto '+topic.name+'?'))return;
    settings.prerequisites=settings.prerequisites.filter(t=>t.id!==topic.id);
    clearTaxonomy('topic');saveDraft();renderTaxonomies();renderEditorOptions();
    notice('Pré-requisito excluído do rascunho.');});
 }
 function clearTaxonomy(kind){
  if(kind==='category'){editingCategory=null;$('categoryForm').reset();$('categorySave').textContent='Adicionar'}
  else{editingTopic=null;$('topicForm').reset();$('topicSave').textContent='Adicionar'}
 }
 function saveCategory(event){
  event.preventDefault();
  const name=$('categoryName').value.trim(),stage=$('categoryStage').value;
  if(!name)return;
  if(settings.categories.some(c=>c.name.toLowerCase()===name.toLowerCase()&&c.id!==editingCategory)){
   notice('Já existe uma categoria com este nome.',true);return}
  if(editingCategory){
   const category=settings.categories.find(c=>c.id===editingCategory);
   if(!category)return;
   if(category.stage!==stage&&qs().some(q=>q.categoryId===category.id)){
    notice('Altere a categoria das perguntas antes de mudar seu tipo.',true);return}
   category.name=name;category.stage=stage;
  }else{
   settings.categories.push({id:'categoria-'+slug(name)+'-'+Date.now().toString(36),name,stage});
  }
  clearTaxonomy('category');saveDraft();renderTaxonomies();renderEditorOptions();renderList();
  notice('Categoria salva no rascunho.');
 }
 function saveTopic(event){
  event.preventDefault();
  const name=$('topicName').value.trim();if(!name)return;
  if(settings.prerequisites.some(t=>t.name.toLowerCase()===name.toLowerCase()&&t.id!==editingTopic)){
   notice('Já existe um assunto com este nome.',true);return}
  if(editingTopic){const topic=settings.prerequisites.find(t=>t.id===editingTopic);if(!topic)return;topic.name=name;}
  else settings.prerequisites.push({id:'assunto-'+slug(name)+'-'+Date.now().toString(36),name});
  clearTaxonomy('topic');saveDraft();renderTaxonomies();renderEditorOptions();
  notice('Pré-requisito salvo no rascunho.');
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
   meta.textContent=(settings.categories.find(c=>c.id===q.categoryId)?.name||(q.stage==='practice'?'Situação prática':'Componentes'))+' · '+(q.active?'Ativa':'Inativa');
   if(!q.active)meta.className='off';
   info.append(heading,meta);row.append(num,info);
   row.addEventListener('click',()=>selectQuestion(q.id,true));
   list.append(row);
  });
  if(!all.length){const p=document.createElement('p');p.className='muted';p.textContent='Nenhuma pergunta encontrada.';list.append(p)}
 }
 function selectQuestion(id,scrollToEditor=false){
  const q=qs().find(x=>x.id===id);if(!q)return;
  selectedId=id;$('editorTitle').textContent='Editar pergunta';
  $('questionText').value=q.prompt;
  q.choices.forEach((text,i)=>{$('opt'+i).value=text});
  $('correctSelect').value=String(q.correct);
  renderEditorOptions();
  $('stageSelect').value=q.categoryId||defaultCategory(q.stage);
  $('topicInput').value=q.stage==='practice'?(q.requires||[])[0]||'':q.topic||'';
  updateTopicLabel();
  $('activeQuestion').checked=q.active!==false;
  $('deleteQuestion').disabled=false;
  renderList();
  if(scrollToEditor&&window.innerWidth<=1080){
   requestAnimationFrame(()=>$('editorPanel').scrollIntoView({behavior:'smooth',block:'start'}));
  }
 }
 function newQuestion(){
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const q={id,stage:'concept',categoryId:settings.categories.find(c=>c.stage==='concept')?.id||settings.categories[0]?.id,
   topic:settings.prerequisites[0]?.id||'',prompt:'',choices:['','','',''],correct:0,why:'',active:true};
  settings.questions.push(q);saveDraft();setPage('questoes');selectQuestion(id,true);
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
   const category=settings.categories.find(c=>c.id===q.categoryId);
   if(!category||category.stage!==q.stage)throw Error('Categoria inválida: '+q.prompt);
   if(q.stage==='concept'){
    if(q.topic&&!settings.prerequisites.some(t=>t.id===q.topic))throw Error('Assunto inválido: '+q.prompt);
   }else if((q.requires||[]).some(id=>!settings.prerequisites.some(t=>t.id===id))){
    throw Error('Pré-requisito inválido: '+q.prompt);
   }
  }
  const activeTopics=new Set(active.filter(q=>q.stage==='concept').map(q=>q.topic).filter(Boolean));
  const invalidPractice=active.find(q=>q.stage==='practice'&&(q.requires||[]).some(t=>!activeTopics.has(t)));
  if(invalidPractice)throw Error('Esta situação prática precisa de uma pergunta ativa que apresente seu assunto: '+invalidPractice.prompt);
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
  const categoryId=$('stageSelect').value;
  const category=settings.categories.find(c=>c.id===categoryId);
  if(!category){notice('Selecione uma categoria cadastrada.',true);return}
  const stage=category.stage,topic=$('topicInput').value;
  q.prompt=text;q.choices=choices;q.correct=Number($('correctSelect').value);
  q.stage=stage;q.categoryId=categoryId;q.active=$('activeQuestion').checked;
  if(stage==='practice'){q.requires=topic?[topic]:[];delete q.topic;}
  else {q.topic=topic;delete q.requires;}
  if(!q.active&&settings.questionCount>qs().filter(q=>q.active).length)
   settings.questionCount=Math.max(1,qs().filter(q=>q.active).length);
  saveDraft();renderOverview();renderList();notice('Pergunta salva no rascunho.');
 }
 function downloadUpdate(){
  try{validate()}catch(err){notice(err.message,true);return}
  saveDraft();
  const json=JSON.stringify(settings,null,2)+'\n';
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='petquiz-settings.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  notice('Atualização preparada! Envie o arquivo petquiz-settings.json nesta conversa para eu publicar para todos os alunos.');
 }
 async function copyUpdate(){
  try{validate()}catch(err){notice(err.message,true);return}
  saveDraft();
  const json=JSON.stringify(settings,null,2)+'\n';
  try{
   await navigator.clipboard.writeText(json);
   notice('Atualização copiada! Cole o texto nesta conversa para eu publicar no GitHub.');
  }catch(err){
   const box=document.createElement('textarea');
   box.value=json;box.style.cssText='position:fixed;left:12px;top:12px;width:calc(100vw - 24px);height:180px;z-index:9999';
   document.body.append(box);box.focus();box.select();
   try{
    if(document.execCommand('copy')){box.remove();notice('Atualização copiada. Cole nesta conversa para publicar.');return;}
   }catch{}
   notice('A cópia automática não foi permitida. Selecione e copie o texto aberto na tela.',true);
  }
 }
 for(const el of document.querySelectorAll('[data-page]'))el.addEventListener('click',()=>setPage(el.dataset.page));
 for(const el of document.querySelectorAll('[data-counter]'))el.addEventListener('click',()=>countControl(el.dataset.counter,Number(el.dataset.step)));
 for(const id of ['homeQuizEnabled','settingsQuizEnabled'])$(id).addEventListener('change',e=>{
  settings.quizEnabled=e.target.checked;saveDraft();renderOverview();
 });
 for(const id of ['homeAnswerEnabled','settingsAnswerEnabled'])$(id).addEventListener('change',e=>{
  settings.answerKeyEnabled=e.target.checked;saveDraft();renderOverview();
 });
 $('categoryForm').addEventListener('submit',saveCategory);
 $('topicForm').addEventListener('submit',saveTopic);
 $('categoryCancel').addEventListener('click',()=>clearTaxonomy('category'));
 $('topicCancel').addEventListener('click',()=>clearTaxonomy('topic'));
 $('stageSelect').addEventListener('change',updateTopicLabel);
 $('searchQuestions').addEventListener('input',renderList);
 $('addQuestion').addEventListener('click',newQuestion);
 $('questionForm').addEventListener('submit',saveQuestion);
 $('deleteQuestion').addEventListener('click',deleteQuestion);
 $('publish').addEventListener('click',downloadUpdate);$('publishFooter').addEventListener('click',downloadUpdate);
 $('exportSettings').addEventListener('click',copyUpdate);
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
  if(draft){notice('Rascunho recuperado. Baixe a atualização e me envie o arquivo para atualizar o site dos alunos.');$('saveState').textContent='Salvo neste aparelho · ainda não publicado online'}
  selectedId=qs()[0]?.id||null;
  renderOverview();if(selectedId)selectQuestion(selectedId);
  renderList();
 }catch(err){notice(err.message,true);$('saveState').textContent='Falha ao carregar configurações';$('publish').disabled=true}
 window.TinkerPETAdmin={getSettings:()=>clone(settings),downloadUpdate,selectQuestion,newQuestion,deleteQuestion};
})();