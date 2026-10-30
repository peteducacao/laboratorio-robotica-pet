/* TinkerPET Studio preview — only presentation, never changes circuit data. */
(() => {
 'use strict';
 const button=document.getElementById('previewInspectorOpen');
 const close=document.getElementById('previewInspectorClose');
 const panel=document.getElementById('previewInspector');
 const bar=document.querySelector('.studio-topbar');
 if(!button||!close||!panel||!bar)return;
 const setOpen=(value)=>{
  const open=!!value;
  document.body.classList.toggle('studio-inspector-open',open);
  button.setAttribute('aria-expanded',String(open));
  panel.setAttribute('aria-hidden',String(!open));
  if(open)panel.scrollTop=0;
 };
 button.addEventListener('click',()=>setOpen(!document.body.classList.contains('studio-inspector-open')));
 close.addEventListener('click',()=>{setOpen(false);button.focus()});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.body.classList.contains('studio-inspector-open')){
   setOpen(false);
  }
 });
 // Dynamic sizing makes the component library align with the toolbar
 // on phones, desktop, zoomed displays and when text wraps.
 const syncHeader=()=>{
  const bottom=Math.max(60,Math.ceil(bar.getBoundingClientRect().bottom));
  document.documentElement.style.setProperty('--studio-top-offset',bottom+'px');
 };
 syncHeader();
 window.addEventListener('resize',syncHeader,{passive:true});
 if(typeof ResizeObserver!=='undefined'){
  const obs=new ResizeObserver(syncHeader);
  obs.observe(bar);
  obs.observe(document.querySelector('.app-header'));
 }
 // Never open inspector automatically: preserve room for the infinite canvas.
 document.getElementById('backBtn')?.addEventListener('click',()=>setOpen(false));
 document.getElementById('openTrackBtn')?.addEventListener('click',()=>setOpen(false));
})();
