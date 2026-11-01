'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const modal=$('presentationDialog'),launch=$('startPresentation');
 if(!modal||!launch)return;
 const cards=[...document.querySelectorAll('.component-card')];
 const data=window.TinkerPETComponentInfo||{};
 let current=0;
 let launcher=launch,closing=false;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
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
 const setFullscreenText=()=>{
  const on=document.fullscreenElement===modal;
  const button=$('presentationFullscreen');
  button.setAttribute('aria-label',on?'Sair da tela cheia':'Entrar em tela cheia');
  button.querySelector('span').textContent=on?'Sair da tela cheia':'Tela cheia';
 };
 const open=()=>{
  launcher=document.activeElement instanceof HTMLElement?document.activeElement:launch;
  const selected=cards.findIndex(card=>card.classList.contains('is-selected'));
  current=selected>=0?selected:0;
  render();
  if(!modal.open)modal.showModal();
  $('slideNext').focus();
 };
 async function close(){
  if(closing)return;closing=true;
  try{
   if(document.fullscreenElement){
    try{await document.exitFullscreen();}catch{}
   }
   if(modal.open)modal.close();
  }finally{
   closing=false;
   setFullscreenText();
   (launcher?.isConnected?launcher:launch).focus({preventScroll:true});
  }
 }
 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement===modal)await document.exitFullscreen();
   else if(modal.requestFullscreen)await modal.requestFullscreen();
   else throw Error('indisponível');
  }catch{
   $('presentationFullscreen').title='Tela cheia indisponível neste navegador.';
  }finally{setFullscreenText();}
 }
 launch.addEventListener('click',open);
 $('closePresentation').addEventListener('click',close);
 $('presentationFullscreen').addEventListener('click',toggleFullscreen);
 $('slideNext').addEventListener('click',()=>{
  current=(current+1)%cards.length;render();
 });
 $('slidePrev').addEventListener('click',()=>{
  current=Math.max(0,current-1);render();
 });
 modal.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();current=(current+1)%cards.length;render();}
  if(e.key==='ArrowLeft'){e.preventDefault();current=Math.max(0,current-1);render();}
 });
 // Ao pressionar Esc, fecha a janela e sai do modo tela cheia.
 modal.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.addEventListener('fullscreenchange',setFullscreenText);
 modal.addEventListener('close',()=>{
  if(document.fullscreenElement===modal)document.exitFullscreen().catch(()=>{});
  setFullscreenText();
  (launcher?.isConnected?launcher:launch).focus({preventScroll:true});
 });
})();