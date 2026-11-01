'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const modal=$('presentationDialog'),launch=$('startPresentation');
 const fullscreenTarget=modal?.querySelector('.presentation-layout');
 if(!modal||!launch)return;
 const cards=[...document.querySelectorAll('.component-card')];
 const data=window.TinkerPETComponentInfo||{};
 let current=0;
 let launcher=launch,closing=false;
 const mobileViewport=matchMedia('(max-width: 700px)');
 const stage=modal.querySelector('.presentation-stage');
 let gesture=null,pendingTap=null,tapTimer=null;
 function render(){
  const card=cards[current],info=data[card?.dataset.part];if(!card||!info)return;
  $('slideTitle').textContent=card.querySelector('.component-label').textContent;
  $('slideImage').src=card.querySelector('img').getAttribute('src');
  $('slideImage').alt=$('slideTitle').textContent;
  $('slideWhat').textContent=info.what;
  $('slideHow').textContent=info.how;
  $('slideCar').textContent=info.car;
  $('slideCounter').textContent=String(current+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  $('slidePrev').disabled=current===0;
  $('slideNext').textContent=current===cards.length-1?'Recomeçar →':'Próximo →';
  const dots=$('slideDots');dots.replaceChildren();
  cards.forEach((card,i)=>{
   const button=document.createElement('button');
   button.type='button';button.title=card.querySelector('.component-label').textContent;
   button.setAttribute('aria-label','Apresentar '+button.title);
   if(i===current)button.setAttribute('aria-current','step');
   button.classList.toggle('is-current',i===current);
   button.addEventListener('click',()=>{current=i;render();});
   dots.append(button);
  });
 }
 function navigate(direction){
  current=direction>0?(current+1)%cards.length:Math.max(0,current-1);
  render();
  // Um novo componente sempre começa pelo topo da apresentação no celular.
  if(mobileViewport.matches){
   modal.scrollTop=0;
   fullscreenTarget.scrollTop=0;
  }
 }
 function clearPendingTap(){
  if(tapTimer!==null)clearTimeout(tapTimer);
  tapTimer=null;
  pendingTap=null;
 }
 function handleMobileTap(x,y){
  const now=Date.now();
  if(pendingTap&&now-pendingTap.at<340&&Math.hypot(x-pendingTap.x,y-pendingTap.y)<75){
   clearPendingTap();
   // Primeiro sai da tela cheia nativa; fora dela, volta ao guia.
   if(document.fullscreenElement===fullscreenTarget){
    void document.exitFullscreen().then(setFullscreenText).catch(()=>close());
   }else{
    void close();
   }
   return;
  }
  clearPendingTap();
  pendingTap={x,y,at:now};
  // Espera o segundo toque antes de trocar o componente.
  tapTimer=setTimeout(()=>{
   const tap=pendingTap;
   clearPendingTap();
   if(!tap||!modal.open||!mobileViewport.matches)return;
   const rect=stage.getBoundingClientRect();
   navigate(tap.x<rect.left+rect.width/2?-1:1);
  },340);
 }
 const setFullscreenText=()=>{
  const on=document.fullscreenElement===fullscreenTarget||modal.classList.contains('fullscreen-fallback');
  const button=$('presentationFullscreen');
  button.setAttribute('aria-label',on?'Sair da tela cheia':'Entrar em tela cheia');
  button.querySelector('span').textContent=on?'Sair da tela cheia':'Tela cheia';
  button.setAttribute('aria-pressed',String(on));
 };
 const open=()=>{
  launcher=document.activeElement instanceof HTMLElement?document.activeElement:launch;
  const selected=cards.findIndex(card=>card.classList.contains('is-selected'));
  current=selected>=0?selected:0;
  render();
  if(!modal.open)modal.showModal();
  if(mobileViewport.matches)$('closePresentation').focus({preventScroll:true});
  else $('slideNext').focus();
 };
 async function close(){
  if(closing)return;closing=true;
  clearPendingTap();gesture=null;
  try{
   if(document.fullscreenElement){
    try{await document.exitFullscreen();}catch{}
   }
   modal.classList.remove('fullscreen-fallback');
   if(modal.open)modal.close();
  }finally{
   closing=false;
   setFullscreenText();
   (launcher?.isConnected?launcher:launch).focus({preventScroll:true});
  }
 }
 async function toggleFullscreen(){
  if(document.fullscreenElement===fullscreenTarget){
   try{await document.exitFullscreen();}catch{}
  }else if(modal.classList.contains('fullscreen-fallback')){
   modal.classList.remove('fullscreen-fallback');
  }else{
   try{
    if(typeof fullscreenTarget.requestFullscreen!=='function')throw Error('unsupported');
    await fullscreenTarget.requestFullscreen({navigationUI:'hide'});
   }catch{
    // No Safari/iOS e em navegadores que bloqueiam Fullscreen API:
    // a própria janela ocupa todo o espaço disponível da tela.
    modal.classList.add('fullscreen-fallback');
   }
  }
  setFullscreenText();
 }
 // Gestos somente no celular: toque à direita/à esquerda, arraste na horizontal
 // e toque duplo para sair. Arrastar verticalmente continua rolando o texto.
 stage.addEventListener('pointerdown',event=>{
  if(!mobileViewport.matches||!modal.open||event.isPrimary===false||!['touch','pen'].includes(event.pointerType))return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,at:Date.now()};
 });
 stage.addEventListener('pointerup',event=>{
  if(!mobileViewport.matches||!gesture||event.pointerId!==gesture.id)return;
  const start=gesture;gesture=null;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.25){
   clearPendingTap();
   navigate(dx<0?1:-1);
  }else if(Math.abs(dx)<22&&Math.abs(dy)<22&&Date.now()-start.at<500){
   handleMobileTap(event.clientX,event.clientY);
  }
 });
 stage.addEventListener('pointercancel',()=>{gesture=null;});
 launch.addEventListener('click',open);
 $('closePresentation').addEventListener('click',close);
 $('presentationFullscreen').addEventListener('click',toggleFullscreen);
 $('slideNext').addEventListener('click',()=>navigate(1));
 $('slidePrev').addEventListener('click',()=>navigate(-1));
 modal.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}
  if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}
 });
 // Ao pressionar Esc, fecha a janela e sai do modo tela cheia.
 modal.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.addEventListener('fullscreenchange',setFullscreenText);
 modal.addEventListener('close',()=>{
  clearPendingTap();gesture=null;
  if(document.fullscreenElement===fullscreenTarget)document.exitFullscreen().catch(()=>{});
  modal.classList.remove('fullscreen-fallback');
  setFullscreenText();
  (launcher?.isConnected?launcher:launch).focus({preventScroll:true});
 });
})();