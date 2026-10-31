/* TinkerPET mobile enhancements — desktop runtime is not modified. */
(()=>{
 'use strict';
 const onlyMobile=window.matchMedia('(max-width:700px)');
 const initialize=()=>{
  if(!onlyMobile.matches)return;
  const viewport=document.getElementById('viewport');
  if(!viewport)return;
  // O SVG original tinha um canto reto parecido com ponteiro de relógio.
  // No celular, usar uma seta circular com ponta claramente desenhada.
  // Preserva o botão, o mesmo ID e seu listener de rotação do app-mobile.js.
  const rotateBtn=document.getElementById('rotateBtn');
  if(rotateBtn){
   rotateBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.8 9a8.5 8.5 0 1 0 .6 6.5"/><path d="m15 4 5 4.7-6.2 2.1"/></svg>';
   rotateBtn.style.touchAction='manipulation';
  }
  // Todos os circuitos (antigos ou novos) usam a versão móvel atual.
  // Links do breadcrumb são criados pelo editor-layout.js após o carregamento.
  document.querySelectorAll('a[href*="projects.html"]').forEach(link=>{
   try{
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)return;
    url.searchParams.set('release','20261031switches-dynamic-v3');
    link.href=url.pathname+url.search+url.hash;
   }catch{/* Manter o link original se o navegador rejeitar a URL. */}
  });
  // Preserve the same pointer-drag gestures as desktop even when a finger
  // crosses a pin, wire segment or board on Android. Never synthesize clicks
  // or build a separate wire-routing algorithm.
  const movableSelector='[data-port], .wire-end-handle, #wireSvg [data-wire-index]';
  viewport.addEventListener('pointerdown',e=>{
   if(!onlyMobile.matches||e.pointerType!=='touch')return;
   const target=e.target.closest?.(movableSelector);
   if(!target)return;
   // A própria rota SVG é redesenhada em cada movimento.
   // Capture no viewport estável (e não no path descartado) para que o
   // Android não cancele a movimentação no meio do arraste.
   try{viewport.setPointerCapture(e.pointerId)}catch{/* Captura implícita permanece. */}
  },{capture:true,passive:true});
  // When app.js dispatches the actual PNG anchor click, the export has been
  // initiated. Close the preview then; keep it open on generation failures.
  document.addEventListener('click',e=>{
   if(!onlyMobile.matches)return;
   const link=e.target.closest?.('a[download]');
   if(!link||!String(link.download||'').toLowerCase().endsWith('.png'))return;
   const dialog=document.getElementById('exportPreviewDialog');
   if(!dialog?.open)return;
   window.setTimeout(()=>{if(dialog.open)dialog.close();},0);
  },true);
 };
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();