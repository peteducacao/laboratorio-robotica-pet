/* Apenas abertura: não intercepta links, nem toca em circuitos ou quiz. */
'use strict';
(()=>{
 const root=document.documentElement;
 const path=location.pathname;
 const home=path.endsWith('/')||path.endsWith('/index.html');
 const projects=path.endsWith('/projects.html');
 const standalone=matchMedia('(display-mode: standalone)').matches||
   matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
 let internal=false;
 try{const previous=new URL(document.referrer);internal=previous.origin===location.origin&&previous.pathname!==path;}catch{}
 // Entrada pelo site ou lançamento direto do aplicativo instalado. Sem tela nas navegações internas.
 let fromWelcome=false;
 try{const previous=new URL(document.referrer);const scope=new URL('./',location.href);fromWelcome=previous.origin===scope.origin&&(previous.pathname===scope.pathname||previous.pathname===scope.pathname+'index.html');}catch{}
 if(!projects||(!fromWelcome&&(internal||!standalone)))return;
 const start=performance.now();
 const theme=document.querySelector('meta[name="theme-color"]');
 const previousTheme=theme?.content;
 if(theme)theme.content='#041a3b';
 root.classList.add('tinkerpet-booting');
 let hidden=false,timer=0;
 function hide(){
   if(hidden)return;
   hidden=true;clearTimeout(timer);root.classList.remove('tinkerpet-booting');
   if(theme&&previousTheme)theme.content=previousTheme;
   document.getElementById('tinkerpetLoading')?.setAttribute('aria-hidden','true');
 }
 function ready(){
   const overlay=document.getElementById('tinkerpetLoading');
   if(!overlay){hide();return;}
   overlay.removeAttribute('aria-hidden');
   const image=overlay.querySelector('img');
   function finish(){setTimeout(hide,Math.max(0,1500-(performance.now()-start)));}
   if(image&&!image.complete){image.addEventListener('load',finish,{once:true});image.addEventListener('error',finish,{once:true});}
   else finish();
 }
 timer=setTimeout(hide,4000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 window.addEventListener('pageshow',event=>{if(event.persisted)hide();});
})();
