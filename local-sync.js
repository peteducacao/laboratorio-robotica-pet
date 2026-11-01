/* Atualiza circuitos entre as janelas do MESMO dispositivo/origem.
   Não usa rede, não envia projetos e não altera a lógica do editor. */
'use strict';
(()=>{
 const FLAG='tinkerpet-local-installed-v1';
 const LIB='tinkerpet-library-v1';
 const LAST='tinkerpet-local-seen-v1';
 const PENDING='tinkerpet-local-refresh-pending-v1';
 const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||
   navigator.standalone===true;
 const read=(key,storage)=>{try{return storage.getItem(key)}catch{return null}};
 const write=(key,value,storage)=>{try{storage.setItem(key,value)}catch{}};
 if(isStandalone())write(FLAG,'1',localStorage);
 window.addEventListener('appinstalled',()=>write(FLAG,'1',localStorage));
 // Visitantes que nunca instalaram continuam exatamente como antes.
 const eligible=()=>isStandalone()||read(FLAG,localStorage)==='1';
 const signature=()=>{
  const value=read(LIB,localStorage)||'';
  let h=2166136261;
  for(let i=0;i<value.length;i++){
   h^=value.charCodeAt(i);
   h=Math.imul(h,16777619);
  }
  return value.length+':'+(h>>>0).toString(16);
 };
 let baseline=signature(),changedElsewhere=false,locked=false,reloading=false,hiddenChange=false;
 const seen=read(LAST,sessionStorage);
 const markCurrent=()=>{
  baseline=signature();
  write(LAST,baseline,sessionStorage);
 };
 function lockAndRefresh(){
  if(locked||!eligible())return;
  locked=true;
  // O aviso é independente dos estilos e diálogos do simulador.
  const cover=document.createElement('dialog');
  cover.id='tinkerpet-local-sync-cover';
  cover.setAttribute('role','alertdialog');
  cover.setAttribute('aria-modal','true');
  cover.setAttribute('aria-labelledby','tinkerpet-local-sync-title');
  cover.innerHTML='<div class="tinkerpet-local-sync-card"><div class="tinkerpet-local-sync-spinner" aria-hidden="true"></div>'+
   '<h2 id="tinkerpet-local-sync-title">Atualizando seus circuitos</h2>'+
   '<p>Encontramos alterações feitas no TinkerPET deste dispositivo. Carregando a versão mais recente para você continuar com segurança.</p></div>';
  document.documentElement.classList.add('tinkerpet-local-sync-locked');
  (document.body||document.documentElement).append(cover);
  cover.addEventListener('cancel',event=>event.preventDefault());
  try{cover.showModal();}catch{cover.setAttribute('open','');}
  cover.focus?.();
  // Marca a revisão ANTES de atualizar, evitando um ciclo infinito.
  markCurrent();
  write(PENDING,baseline,sessionStorage);
  // Dá tempo de o aviso aparecer e impede qualquer ação durante a troca.
  const reload=()=>{
   if(reloading)return;
   reloading=true;
   if(!navigator.onLine&&!navigator.serviceWorker?.controller){
    // Sem cache ativo, evite enviar o usuário a uma página de erro offline.
    cover.querySelector('p').textContent='O modo offline ainda não está preparado neste navegador. Reconecte-se para carregar as alterações.';
    reloading=false;
    return;
   }
   location.reload();
  };
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(reload,220)));
 }
 function check(){
  if(!eligible()||locked)return;
  const now=signature();
  if(changedElsewhere||hiddenChange||now!==baseline)lockAndRefresh();
 }
 window.addEventListener('storage',event=>{
  if(event.key===FLAG)return;
  if(event.key!==LIB)return;
  if(!eligible())return;
  const now=signature();
  if(now===baseline)return;
  changedElsewhere=true;
  if(document.hidden){hiddenChange=true;return;}
  lockAndRefresh();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
   if(!changedElsewhere&&!locked)markCurrent();
  }else check();
 });
 window.addEventListener('focus',check);
 window.addEventListener('pageshow',event=>{
  if(event.persisted)check();
 });
 window.addEventListener('pagehide',()=>{
  if(!changedElsewhere&&!locked)markCurrent();
 });
 if(eligible()&&seen&&seen!==baseline){
  // Outra janela fez mudanças enquanto esta estava encerrada/oculta.
  // A página recém-aberta já lê o dado atualizado, mas bloqueia durante
  // uma recarga garantida para não expor interfaces antigas do bfcache.
  const after=()=>{if(!locked)lockAndRefresh()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',after,{once:true});
  else after();
 }else if(read(PENDING,sessionStorage)){
  // Carregamento concluído: a revisão já está refletida no documento novo.
  try{sessionStorage.removeItem(PENDING)}catch{}
  markCurrent();
 }else{
  write(LAST,baseline,sessionStorage);
 }
})();