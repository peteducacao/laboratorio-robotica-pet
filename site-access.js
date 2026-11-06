'use strict';
(async()=>{
 let flags={quizEnabled:true,answerKeyEnabled:true};
 try{
  const response=await fetch('petquiz-settings.json?nocache='+Date.now(),{cache:'no-store'});
  if(response.ok){const settings=await response.json();flags.quizEnabled=settings.quizEnabled!==false;flags.answerKeyEnabled=settings.answerKeyEnabled!==false}
 }catch(error){console.warn('Acesso: configurações públicas indisponíveis',error)}
 const blocked=(el,label)=>{
  if(!el)return;
  el.setAttribute('aria-disabled','true');el.title=label+' temporariamente bloqueado pelo administrador';
  el.style.opacity='.46';el.style.cursor='not-allowed';
  el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();alert(label+' temporariamente indisponível.');},true);
 };
 const quiz=document.getElementById('openPetQuiz');
 const gate=document.getElementById('openGate');
 if(!flags.quizEnabled)blocked(quiz,'PETQuiz');
 if(!flags.answerKeyEnabled){
  blocked(gate,'Gabarito');
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
})();