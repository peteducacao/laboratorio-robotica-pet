'use strict';
window.tinkerpetAccessReady=(async()=>{
 let flags={quizEnabled:true,answerKeyEnabled:true};
 try{
  const response=await fetch('petquiz-settings.json?nocache='+Date.now(),{cache:'no-store'});
  if(response.ok){
   const remote=await response.json();
   flags.quizEnabled=remote.quizEnabled!==false;
   flags.answerKeyEnabled=remote.answerKeyEnabled!==false;
  }
 }catch(error){console.warn('Acesso: configurações publicadas indisponíveis',error)}
 // Prévia imediata somente quando há sessão administrativa neste navegador.
 // Outros dispositivos dependem de Publicar no GitHub.
 if(sessionStorage.getItem('tinkerpet-admin-auth')==='ok'){
  try{
   const draft=JSON.parse(localStorage.getItem('tinkerpet-admin-draft-v1')||'null');
   if(draft){
    flags.quizEnabled=draft.quizEnabled!==false;
    flags.answerKeyEnabled=draft.answerKeyEnabled!==false;
   }
  }catch(error){console.warn('Rascunho administrativo inválido',error)}
 }
 window.tinkerpetAccessFlags=flags;
 const blockLink=(el,label)=>{
  if(!el)return;
  el.setAttribute('aria-disabled','true');
  el.title=label+' bloqueado pelo administrador';
  el.style.opacity='.46';el.style.cursor='not-allowed';
  el.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   alert(label+' temporariamente indisponível.');
  },true);
 };
 if(!flags.quizEnabled)blockLink(document.getElementById('openPetQuiz'),'PETQuiz');
 if(!flags.answerKeyEnabled){
  blockLink(document.getElementById('openGate'),'Gabarito');
  const label=document.getElementById('gateLabel');
  if(label)label.textContent='Gabarito bloqueado';
 }
 if(location.pathname.endsWith('/gabarito.html')&&!flags.answerKeyEnabled){
  document.body.replaceChildren();
  document.body.style.cssText='font:16px system-ui;background:#f1faf6;color:#143e50;min-height:100dvh;display:grid;place-items:center;margin:0;padding:20px';
  const main=document.createElement('main');
  main.style.cssText='max-width:500px;text-align:center;background:white;padding:32px;border-radius:22px;box-shadow:0 12px 34px #0c454418';
  const h=document.createElement('h1');h.textContent='Gabarito indisponível';
  const p=document.createElement('p');p.textContent='O acesso foi bloqueado pelo administrador.';
  const a=document.createElement('a');a.textContent='Voltar aos meus circuitos';a.href='projects.html';a.style.color='#087b75';
  main.append(h,p,a);document.body.append(main);
 }
 return flags;
})();
