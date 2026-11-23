'use strict';
(()=>{
 const W=1798,H=875;
 const scene=document.getElementById('welcome');
 const art=document.getElementById('welcomeArt');
 const fallback=document.getElementById('identityFallback');
 art.addEventListener('error',()=>{
  scene.classList.add('brand-unavailable');
  fallback.hidden=false;
  scheduleLayout();
 });
 if(art.complete&&!art.naturalWidth){
  scene.classList.add('brand-unavailable');
  fallback.hidden=false;
 }
 const button=document.getElementById('enterProjects');
 const robot=document.getElementById('robotInteract');
 const blink=document.getElementById('robotBlink');
 const glint=document.getElementById('robotGlint');
 const brow=document.getElementById('robotBrow');
 const cheekLeft=document.getElementById('robotCheekLeft');
 const cheekRight=document.getElementById('robotCheekRight');
 const beacon=document.getElementById('antennaGlow');
 const bubble=document.getElementById('robotExpression');
 const feedback=document.getElementById('robotFeedback');
 const dust=[...document.querySelectorAll('.light-dust')];
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const modes=[
  {id:'happy',symbol:'💙',announcement:'O robô ficou feliz!'},
  {id:'curious',symbol:'💡',announcement:'O robô está curioso!'},
  {id:'excited',symbol:'✨',announcement:'O robô está animado!'},
  {id:'sleepy',symbol:'💤',announcement:'O robô está sonolento!'}
 ];
 const points=[
  {x:240,y:190,n:5},{x:1395,y:297,n:4},{x:415,y:620,n:6},
  {x:1500,y:665,n:5},{x:730,y:756,n:5},{x:1210,y:765,n:4}
 ];
 let scale=1,left=0,top=0;
 let frame=0,blinkTimer=0,moodTimer=0,resetTimer=0,activeMood=-1;
 const installed=window.matchMedia('(display-mode: standalone)');
 const updateInstalled=()=>scene.classList.toggle('installed-pwa',installed.matches||navigator.standalone===true);
 updateInstalled();installed.addEventListener?.('change',updateInstalled);
 
 // Uma única escala para robô, nome e botão. O cenário de fundo
 // se adapta por CSS "cover", sem canvas e sem faixas verticais.
 function computeLayout(width,height){
  const narrow=width<600;
  const safeWidth=width-(narrow?18:52);
  const safeHeight=height-(height<530?52:120);
  const s=Math.max(.22,Math.min(safeWidth/760,safeHeight/700,1.36));
  return {s,left:(width-W*s)/2,top:(height-H*s)/2-(height>520?height*.012:0)};
 }
 function applyLayout(){
  frame=0;
  const width=scene.clientWidth||window.innerWidth;
  const height=scene.clientHeight||window.innerHeight;
  const view=computeLayout(width,height);
  scale=view.s;left=view.left;top=view.top;
  Object.assign(art.style,{width:W*scale+'px',height:H*scale+'px',left:left+'px',top:top+'px'});
  function place(el,x,y,w,h){
   if(!el)return;
   Object.assign(el.style,{left:left+x*scale+'px',top:top+y*scale+'px',
    width:Math.max(1,w*scale)+'px',height:Math.max(1,h*scale)+'px'});
  }
  // A área clicável coincide com a placa azul ilustrada, sem outro botão duplicado.
  place(button,585,591,604,130);
  place(fallback,520,166,760,420);
  place(robot,748,166,305,256);
  place(blink,831,315,43,34);
  place(glint,851,306,9,9);
  place(brow,826,288,41,4);
  place(cheekLeft,790,347,36,21);
  place(cheekRight,990,347,36,21);
  place(beacon,883,143,94,94);
  place(bubble,1035,218,57,57);
  for(let i=0;i<dust.length;i++){
   const p=points[i],n=Math.max(3,Math.round(p.n*scale));
   place(dust[i],p.x,p.y,n,n);
  }
  // Respeita o tamanho mínimo de toque sem deslocar a arte clicável.
  button.style.minHeight=Math.min(52,Math.max(44,130*scale))+'px';
 }
 function scheduleLayout(){
  if(frame)return;
  frame=window.requestAnimationFrame(applyLayout);
 }
 window.addEventListener('resize',scheduleLayout,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleLayout,{passive:true});
 if('ResizeObserver' in window)new ResizeObserver(scheduleLayout).observe(scene);
 document.fonts?.ready.then(scheduleLayout);
 scheduleLayout();

 function blinkOnce(){
  if(reduce.matches||document.hidden)return;
  blink.classList.remove('is-blinking');void blink.offsetWidth;
  blink.classList.add('is-blinking');
 }
 function nextBlink(){
  clearTimeout(blinkTimer);
  if(reduce.matches||document.hidden)return;
  blinkTimer=setTimeout(()=>{blinkOnce();nextBlink()},3300+Math.random()*3800);
 }
 function express(id,userInitiated=false){
  const mode=modes.find(m=>m.id===id)||modes[0];
  clearTimeout(resetTimer);
  scene.dataset.robotMood=mode.id;
  bubble.textContent=mode.symbol;
  if(userInitiated)feedback.textContent=mode.announcement;
  resetTimer=setTimeout(()=>{delete scene.dataset.robotMood;bubble.textContent='';},1700);
 }
 function nextMood(){
  clearTimeout(moodTimer);
  if(reduce.matches||document.hidden)return;
  moodTimer=setTimeout(()=>{
   if(document.activeElement!==robot)express(['curious','happy','excited'][Math.floor(Math.random()*3)]);
   nextMood();
  },8500+Math.random()*5500);
 }
 robot.addEventListener('click',()=>{
  activeMood=(activeMood+1)%modes.length;
  express(modes[activeMood].id,true);
  if(!reduce.matches)blinkOnce();
 });
 robot.addEventListener('pointermove',event=>{
  if(reduce.matches)return;
  const box=robot.getBoundingClientRect();
  const dx=Math.max(-1,Math.min(1,(event.clientX-box.left-box.width/2)/(box.width/2)));
  const dy=Math.max(-1,Math.min(1,(event.clientY-box.top-box.height/2)/(box.height/2)));
  glint.style.setProperty('--look-x',(dx*4*scale).toFixed(2)+'px');
  glint.style.setProperty('--look-y',(dy*3*scale).toFixed(2)+'px');
 });
 robot.addEventListener('pointerleave',()=>{
  glint.style.setProperty('--look-x','0px');
  glint.style.setProperty('--look-y','0px');
 });
 function start(){
  clearTimeout(blinkTimer);clearTimeout(moodTimer);
  if(!document.hidden&&!reduce.matches){nextBlink();nextMood()}
 }
 document.addEventListener('visibilitychange',start);
 reduce.addEventListener?.('change',start);
 window.addEventListener('pagehide',()=>{
  clearTimeout(blinkTimer);clearTimeout(moodTimer);clearTimeout(resetTimer);
  window.cancelAnimationFrame(frame);
 },{once:true});
 start();
})();