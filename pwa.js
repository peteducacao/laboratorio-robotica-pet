/* Instalação e aviso de atualização: exclusivamente dentro de Informações. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const install=$('pwaInstallButton'),update=$('pwaUpdateButton'),notice=$('pwaNotice'),help=$('pwaInstallHelp');
 if(!install||!update||!('serviceWorker' in navigator))return;
 const KEY='tinkerpet-pwa-installed-revision-v1';
 const API='https://api.github.com/repos/peteducacao/laboratorio-robotica-pet/commits/main';
 let registration=null,installPrompt=null,pendingRevision='',updating=false,lastCheck=0;
 function status(message,error=false){
  notice.textContent=message;notice.classList.toggle('error',error);notice.hidden=!message;
 }
 function installed(){
  return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 }
 function setInstallState(){install.hidden=installed();}
 function setUpdateState(show){
  update.hidden=!show;
  if(!show){pendingRevision='';update.disabled=false;$('pwaUpdateDescription').textContent='Nova versão pronta';}
 }
 function revealWaiting(){
  if(registration?.waiting&&navigator.serviceWorker.controller){
   update.hidden=false;
   $('pwaUpdateDescription').textContent='Toque para instalar a nova versão';
  }
 }
 async function checkForUpdates(force=false){
  if(!navigator.onLine||!registration||!navigator.serviceWorker.controller)return;
  const now=Date.now();
  if(!force&&now-lastCheck<15*60*1000)return;
  lastCheck=now;
  try{await registration.update();}catch{}
  if(registration.waiting){revealWaiting();return;}
  try{
   const response=await fetch(API,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!response.ok)return;
   const {sha}=await response.json();
   if(!/^[0-9a-f]{40}$/.test(sha||''))return;
   let previous='';
   try{previous=localStorage.getItem(KEY)||'';}catch{}
   if(!previous){try{localStorage.setItem(KEY,sha);}catch{};return;}
   if(previous!==sha){pendingRevision=sha;update.hidden=false;}
   else setUpdateState(false);
  }catch{/* Rede ou limite do GitHub: sem alertas incorretos. */}
 }
 async function installApp(){
  if(installed()){setInstallState();return;}
  if(installPrompt){
   const prompt=installPrompt;installPrompt=null;
   try{await prompt.prompt();const result=await prompt.userChoice;
    if(result?.outcome==='accepted'){help.hidden=true;status('Instalação solicitada. O TinkerPET será adicionado aos aplicativos.');}
   }catch{showInstructions();}
  }else showInstructions();
 }
 function showInstructions(){
  const ua=navigator.userAgent||'';
  help.textContent=/iPad|iPhone|iPod/.test(ua)
   ? 'No Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.'
   : /Android/i.test(ua)
    ? 'No Chrome, abra o menu ⋮ e escolha Instalar aplicativo ou Adicionar à tela inicial.'
    : 'No Chrome ou Edge, abra o menu do navegador e escolha Instalar TinkerPET ou Instalar este site como aplicativo.';
  help.hidden=!help.hidden;
 }
 function sendRefresh(revision){
  return new Promise((resolve,reject)=>{
   if(!navigator.serviceWorker.controller){reject(Error('Abra esta página novamente para habilitar o modo offline.'));return;}
   const channel=new MessageChannel();
   const timeout=setTimeout(()=>{channel.port1.close();reject(Error('A atualização não respondeu. Tente novamente.'));},30000);
   channel.port1.onmessage=event=>{
    clearTimeout(timeout);channel.port1.close();
    if(event.data?.ok)resolve();
    else reject(Error(event.data?.error||'Falha ao preparar os arquivos.'));
   };
   navigator.serviceWorker.controller.postMessage({type:'REFRESH_OFFLINE',revision},[channel.port2]);
  });
 }
 async function applyUpdate(){
  if(updating||!navigator.onLine)return;
  updating=true;update.disabled=true;
  $('pwaUpdateDescription').textContent='Baixando arquivos...';status('');
  try{
   if(registration?.waiting){
    let reloading=false;
    const reload=()=>{if(reloading)return;reloading=true;location.reload();};
    navigator.serviceWorker.addEventListener('controllerchange',reload,{once:true});
    registration.waiting.postMessage({type:'ACTIVATE_WAITING'});
    setTimeout(()=>{if(!reloading){status('Abra novamente o TinkerPET para concluir.');updating=false;update.disabled=false;}},10000);
    return;
   }
   if(!/^[0-9a-f]{40}$/.test(pendingRevision))throw Error('Não foi possível identificar a nova versão.');
   await sendRefresh(pendingRevision);
   try{localStorage.setItem(KEY,pendingRevision);}catch{}
   setUpdateState(false);
   location.reload();
  }catch(err){
   status(err?.message||'Erro ao atualizar. Tente novamente.',true);
   update.disabled=false;$('pwaUpdateDescription').textContent='Tentar atualizar';updating=false;
  }
 }
 install.addEventListener('click',installApp);
 update.addEventListener('click',applyUpdate);
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;setInstallState();
 });
 window.addEventListener('appinstalled',()=>{
  installPrompt=null;setInstallState();help.hidden=true;
  status('TinkerPET instalado. Os recursos preparados também funcionam offline.');
 });
 window.addEventListener('online',()=>{lastCheck=0;checkForUpdates(true);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdates();});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{checkForUpdates(true);});
 setInstallState();
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
  registration=reg;
  if(reg.waiting)revealWaiting();
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;
   worker?.addEventListener('statechange',()=>{
    if(worker.state==='installed')revealWaiting();
   });
  });
  await navigator.serviceWorker.ready;
  checkForUpdates(true);
 }).catch(()=>status('Não foi possível preparar o modo offline neste navegador.',true));
})();