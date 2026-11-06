'use strict';
// Gabarito e PETQuiz são permissões INDEPENDENTES, lidas sempre da versão publicada.
// Não reutilizar rascunhos locais: eles podem conter valores antigos dos dois controles.
window.tinkerpetAccessFlags={quizEnabled:true,answerKeyEnabled:true};
const configUrl=()=> 'petquiz-settings.json?nocache='+Date.now();
const updateUI=flags=>{
 const controls=[
  {id:'openPetQuiz',enabled:flags.quizEnabled,label:'PETQuiz'},
  {id:'openGate',enabled:flags.answerKeyEnabled,label:'Gabarito'}
 ];
 for(const control of controls){
  const element=document.getElementById(control.id);
  if(!element)continue;
  const blocked=!control.enabled;
  element.setAttribute('aria-disabled',String(blocked));
  element.classList.toggle('access-blocked',blocked);
  element.title=blocked?control.label+' bloqueado pelo administrador':'';
  element.style.opacity=blocked?'.46':'';
  element.style.cursor=blocked?'not-allowed':'';
 }
 const label=document.getElementById('gateLabel');
 if(label)label.textContent=flags.answerKeyEnabled?'Gabarito':'Gabarito bloqueado';
};
async function loadPublishedAccess(){
 let flags={...window.tinkerpetAccessFlags};
 try{
  const response=await fetch(configUrl(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const remote=await response.json();
  // Interpretar as duas opções separadamente, sem inferir uma a partir da outra.
  flags={
   quizEnabled:remote.quizEnabled!==false,
   answerKeyEnabled:remote.answerKeyEnabled!==false
  };
 }catch(error){
  console.warn('TinkerPET: não foi possível atualizar permissões, mantendo o estado anterior.',error);
 }
 window.tinkerpetAccessFlags=flags;
 updateUI(flags);
 return flags;
}
// Handler único: só cancela o acesso específico que estiver bloqueado.
for(const [id,key,label] of [
 ['openPetQuiz','quizEnabled','PETQuiz'],
 ['openGate','answerKeyEnabled','Gabarito']
]){
 const element=document.getElementById(id);
 if(element)element.addEventListener('click',event=>{
  if(window.tinkerpetAccessFlags[key]!==false)return;
  event.preventDefault();event.stopImmediatePropagation();
  alert(label+' temporariamente indisponível.');
 },true);
}
window.tinkerpetAccessReady=loadPublishedAccess();
window.tinkerpetRefreshAccess=loadPublishedAccess;
// Quando o navegador restaura uma aba antiga do cache, refazer a leitura.
window.addEventListener('pageshow',event=>{
 if(event.persisted)loadPublishedAccess();
});
if(location.pathname.endsWith('/gabarito.html')){
 window.tinkerpetAccessReady.then(flags=>{
  if(flags.answerKeyEnabled)return;
  document.body.replaceChildren();
  document.body.style.cssText='font:16px system-ui;background:#f1faf6;color:#143e50;min-height:100dvh;display:grid;place-items:center;margin:0;padding:20px';
  const main=document.createElement('main');
  main.style.cssText='max-width:500px;text-align:center;background:white;padding:32px;border-radius:22px;box-shadow:0 12px 34px #0c454418';
  const title=document.createElement('h1');title.textContent='Gabarito indisponível';
  const description=document.createElement('p');description.textContent='O acesso foi bloqueado pelo administrador.';
  const link=document.createElement('a');link.textContent='Voltar aos meus circuitos';link.href='projects.html';link.style.color='#087b75';
  main.append(title,description,link);document.body.append(main);
 });
}
