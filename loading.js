/* Carregamento de abertura e navegação: sem alterar armazenamento ou circuitos. */
'use strict';
(()=>{
 const root=document.documentElement;
 const started=performance.now();
 const MIN_VISIBLE_MS=650;
 let done=false,deadline=0;
 root.classList.add('tinkerpet-booting');
 function hide(){
  if(done)return;
  done=true;
  clearTimeout(deadline);
  root.classList.remove('tinkerpet-booting');
  const overlay=document.getElementById('tinkerpetLoading');
  if(overlay)overlay.setAttribute('aria-hidden','true');
 }
 function afterReady(){
  const remain=Math.max(0,MIN_VISIBLE_MS-(performance.now()-started));
  window.setTimeout(hide,remain);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterReady,{once:true});
 else afterReady();
 deadline=window.setTimeout(hide,6500);
 function show(){
  done=false;
  clearTimeout(deadline);
  root.classList.add('tinkerpet-booting');
  const overlay=document.getElementById('tinkerpetLoading');
  if(overlay)overlay.removeAttribute('aria-hidden');
  // Falha de navegação não pode manter o usuário preso na tela de carregamento.
  deadline=window.setTimeout(hide,8000);
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link||link.download||link.target&&link.target!=='_self')return;
  try{
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;
   if(!url.pathname.endsWith('.html')&&!url.pathname.endsWith('/'))return;
   show();
  }catch{}
 },true);
 window.addEventListener('pageshow',event=>{if(event.persisted)hide()});
 window.TinkerPETLoading=Object.freeze({show,hide});
})();