/* TinkerPET editor: camada de interface independente da simulação.
   Não cria nem modifica fios, componentes, câmera ou estado elétrico. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const body=document.body;
body.classList.add('editor-layout');
const header=document.querySelector('.app-header');
const brand=header?.querySelector('.brand');
const right=header?.querySelector('.header-end');
const toolbarRight=document.querySelector('.toolbar-right');
const toolbarLeft=document.querySelector('.toolbar-left');
const zoom=document.querySelector('.toolbar-zoom');
const library=$('library');
const drawer=$('drawerHandle');
const closeLibrary=$('closeLibrary');
if(!header||!brand||!right||!toolbarRight||!toolbarLeft||!library||!drawer)return;
const robot='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="9" width="20" height="18" rx="6"/><path d="M16 9V5"/><circle cx="16" cy="4.5" r="1.6" fill="currentColor" stroke="none"/><path d="M3 16v6M29 16v6"/><circle cx="12" cy="17" r="1" fill="currentColor"/><path d="M20 17c1.7-.8 2.8.5 2 1.6M13 22q3 3 6 0"/></svg>';
const user='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-8 16-8 16 0"/></svg>';
const gear='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.7 2.6 10.2 4h3.6l.5-1.4 2.6 1.1-.6 1.5 2.5 2.5 1.5-.6 1.1 2.6-1.4.5v3.6l1.4.5-1.1 2.6-1.5-.6-2.5 2.5.6 1.5-2.6 1.1-.5-1.4h-3.6l-.5 1.4-2.6-1.1.6-1.5-2.5-2.5-1.5.6-1.1-2.6 1.4-.5v-3.6l-1.4-.5 1.1-2.6 1.5.6 2.5-2.5-.6-1.5z"/><circle cx="12" cy="12" r="3.3"/></svg>';
brand.innerHTML='<span class="editor-brand-icon">'+robot+'</span><span class="editor-brand-text">Tinker<span>PET Studio</span></span>';
brand.setAttribute('aria-label','Página inicial do TinkerPET');
const crumbs=document.createElement('nav');
crumbs.className='editor-crumbs';crumbs.setAttribute('aria-label','Localização da página');
crumbs.innerHTML='<span class="arrow" aria-hidden="true">›</span><a href="projects.html">Meus circuitos</a><span class="arrow" aria-hidden="true">›</span><strong id="editorCurrentTitle">Circuito em edição</strong>';
header.querySelector('.header-start').append(crumbs);
const profile=document.createElement('a');
profile.className='editor-user';profile.href='projects.html';profile.title='Meus circuitos e meu Nick';
profile.innerHTML='<span class="editor-user-icon">'+user+'</span><span id="editorNickname"></span>';
right.append(profile);
$('editorNickname').textContent=localStorage.getItem('tinkerpet-nickname-v1')||'Meu perfil';
// Os botões de lupa/zoom ficam JUNTO do seletor de cor, sem espaçamento vazio.
if(zoom)toolbarLeft.append(zoom);
const details=$('previewInspectorOpen');
if(details)details.setAttribute('tabindex','-1');
const gearButton=document.createElement('button');
gearButton.id='editorSettingsButton';gearButton.type='button';gearButton.className='control-btn';
gearButton.setAttribute('aria-label','Configurações do circuito');
gearButton.setAttribute('aria-expanded','false');
gearButton.setAttribute('aria-controls','editorSettings');
gearButton.title='Configurações do circuito';gearButton.innerHTML=gear;
toolbarRight.insertBefore(gearButton,$('hintBtn'));
const hint=$('hintBtn');if(hint)hint.innerHTML='💡 <span>Dicas</span>';
closeLibrary.innerHTML='<span class="collapse-chevron" aria-hidden="true">‹</span><span class="collapse-label">Recolher</span>';closeLibrary.setAttribute('aria-label','Recolher componentes');
closeLibrary.title='Recolher componentes';
$('drawerArrow').textContent='›';
drawer.title='Abrir ou fechar componentes';
const settings=document.createElement('aside');
settings.id='editorSettings';settings.className='editor-settings';settings.hidden=true;
settings.setAttribute('aria-label','Configurações do circuito');
settings.innerHTML=
 '<div class="editor-settings-header"><h2>Configurações do circuito</h2>'+
 '<button class="editor-settings-close" id="closeEditorSettings" type="button" aria-label="Fechar configurações">×</button></div>'+
 '<div class="editor-settings-cover"><img src="assets/esp32-devkit-v1-30p.svg?v=29" alt="" draggable="false">'+
 '<span>Projeto salvo neste navegador.<br>Edite as informações sem alterar os fios.</span></div>'+
 '<label for="editorCircuitName">Nome do circuito</label>'+
 '<input id="editorCircuitName" type="text" maxlength="80" autocomplete="off" placeholder="Nome do circuito">'+
 '<label for="editorCircuitDescription">Descrição (opcional)</label>'+
 '<textarea id="editorCircuitDescription" maxlength="500" placeholder="Descreva seu circuito..."></textarea>'+
 '<p class="editor-field-status" id="editorFieldStatus" aria-live="polite"></p>'+
 '<div class="settings-actions">'+
 '<button type="button" id="settingsPartDetails">Propriedades do componente selecionado</button>'+
 '<button type="button" class="remove-project" id="settingsRemoveProject">Excluir circuito</button>'+
 '</div>';
document.querySelector('.studio').after(settings);
const nameField=$('editorCircuitName');
const descriptionField=$('editorCircuitDescription');
const status=$('editorFieldStatus');
const title=$('editorCurrentTitle');
let currentProject=null;
const LIB='tinkerpet-library-v1',ACTIVE='tinkerpet-active-v1';
function getCurrent(){
 try{
  const list=JSON.parse(localStorage.getItem(LIB)||'null');
  const key=localStorage.getItem(ACTIVE);
  const project=list&&Array.isArray(list.projects)?list.projects.find(p=>p.id===key):null;
  return project?{list,project}:null;
 }catch{return null}
}
function loadMetadata(){
 const found=getCurrent();currentProject=found?.project?.id||null;
 const name=String(found?.project?.name||'Circuito em edição');
 title.textContent=name;
 nameField.value=found?.project?.name||'';
 descriptionField.value=found?.project?.description||'';
 $('settingsRemoveProject').hidden=!found;
 if(!found)status.textContent='Abra um projeto em Meus circuitos para salvar suas informações.';
 else status.textContent='';
}
function saveMetadata(){
 const found=getCurrent();
 if(!found){status.textContent='Crie um circuito em Meus circuitos para salvar as informações.';return}
 const value=nameField.value.trim().slice(0,80);
 if(!value){status.textContent='Informe um nome para o circuito.';return}
 const description=descriptionField.value.trim().slice(0,500);
 if(found.project.name!==value||found.project.description!==description){
  found.project.name=value;found.project.description=description;
  found.project.updatedAt=Date.now();
  try{localStorage.setItem(LIB,JSON.stringify(found.list));status.textContent='✓ Informações salvas neste navegador.'}
  catch{status.textContent='Não foi possível salvar as alterações.';return}
 }else status.textContent='✓ Informações atualizadas.';
 title.textContent=value;
}
let debounce;
for(const el of [nameField,descriptionField]){
 el.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(saveMetadata,550)});
 el.addEventListener('change',()=>{clearTimeout(debounce);saveMetadata()});
}
// Barra superior acompanha o mesmo progresso real gerado pelo app.js.
function syncProgress(){
 const count=$('connectionsCount'),badge=$('validationBadge'),bar=$('progressBar'),caption=$('progressCaption');
 const shell=$('editorToolbarProgress'),visibleBar=$('toolbarProgressBar'),track=$('toolbarProgressTrack');
 if(!shell||!visibleBar||!track)return;
 const captionText=caption?.textContent?.trim()||'Conexões';
 const countText=count?.textContent?.trim()||'0 / 0';
 const statusText=badge?.textContent?.trim()||'Aguardando montagem';
 const value=Number.parseFloat(bar?.style?.width||'0');
 const progress=Number.isFinite(value)?Math.min(100,Math.max(0,value)):0;
 $('toolbarProgressLabel').textContent=captionText;
 $('toolbarProgressCount').textContent=countText;
 $('toolbarProgressStatus').textContent=statusText;
 visibleBar.style.width=progress+'%';
 track.setAttribute('aria-valuenow',String(Math.round(progress)));
 track.setAttribute('aria-valuetext',captionText+': '+countText+'. '+statusText);
 shell.dataset.status=badge?.classList.contains('ok')?'ok':badge?.classList.contains('error')?'error':'waiting';
 shell.title=statusText;
}
for(const id of ['connectionsCount','validationBadge','progressBar','progressCaption']){
 const node=$(id);if(node&&typeof MutationObserver!=='undefined'){
  new MutationObserver(syncProgress).observe(node,{characterData:true,childList:true,subtree:true,attributes:true,attributeFilter:['style']});
 }
}
// A largura da bancada reage ao CSS e seu ResizeObserver (app.js).
// Não forçar resize aqui: isso acionava fitCamera() e alterava o zoom do usuário.
function openSettings(value){
 const yes=!!value;
 if(yes&&window.innerWidth<=1100&&body.classList.contains('components-open'))drawer.click();
 body.classList.toggle('settings-open',yes);
 settings.hidden=!yes;
 gearButton.setAttribute('aria-expanded',String(yes));
 if(yes){loadMetadata();syncProgress();}
 else{clearTimeout(debounce);if(currentProject)saveMetadata()}

}
gearButton.addEventListener('click',()=>openSettings(!body.classList.contains('settings-open')));
$('closeEditorSettings').addEventListener('click',()=>{openSettings(false);gearButton.focus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&body.classList.contains('settings-open'))openSettings(false)});
$('settingsPartDetails').addEventListener('click',()=>{
 openSettings(false);
 if(details){details.click();}
});
$('settingsRemoveProject').addEventListener('click',()=>{
 const found=getCurrent();if(!found)return;
 if(!window.confirm('Excluir “'+found.project.name+'”? Esta ação não poderá ser desfeita.'))return;
 found.list.projects=found.list.projects.filter(p=>p.id!==found.project.id);
 try{
  localStorage.setItem(LIB,JSON.stringify(found.list));
  localStorage.removeItem(ACTIVE);
  location.href='projects.html';
 }catch{status.textContent='Não foi possível excluir este circuito.'}
});
// O controle original do simulador continua responsável pela biblioteca.
const setArrow=()=>{
 const open=library.classList.contains('open');
 $('drawerArrow').textContent=open?'‹':'›';
 drawer.title=open?'Recolher componentes':'Abrir componentes';
 drawer.setAttribute('aria-expanded',String(open));
 drawer.setAttribute('aria-label',open?'Recolher componentes':'Abrir componentes');
};
if(typeof MutationObserver!=='undefined'){
 new MutationObserver(mutations=>{
  if(mutations.some(m=>m.attributeName==='class')){
   setArrow();
   if(window.innerWidth<=1100&&body.classList.contains('components-open')&&body.classList.contains('settings-open'))openSettings(false);
  }
 }).observe(body,{attributes:true,attributeFilter:['class']});
}
window.addEventListener('resize',()=>{
 if(window.innerWidth<=1100&&body.classList.contains('components-open')&&body.classList.contains('settings-open'))openSettings(false);
},{passive:true});
loadMetadata();
syncProgress();
// Desktop abre a biblioteca como no layout aprovado; no celular a bancada
// nasce livre, sem painel cobri-la ou diminuir a largura disponível.
if(window.innerWidth>1100&&!body.classList.contains('components-open'))drawer.click();
setArrow();
})();
