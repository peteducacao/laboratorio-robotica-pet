'use strict';
(()=>{
 const robot=document.getElementById('robotInteract');
 const reaction=document.getElementById('robotExpression');
 const status=document.getElementById('robotFeedback');
 if(!robot||!reaction||!status)return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const moods=[
  {id:'happy',emoji:'💙',label:'O robô ficou feliz!'},
  {id:'curious',emoji:'💡',label:'O robô está curioso!'},
  {id:'excited',emoji:'✨',label:'O robô está animado!'},
  {id:'sleepy',emoji:'💤',label:'O robô está com sono!'}
 ];
 let next=0,blinkTimer=0,moodTimer=0,clearTimer=0;
 const timers=()=>{clearTimeout(blinkTimer);clearTimeout(moodTimer);};
 function blink(){
  if(document.hidden||reduced?.matches)return;
  robot.classList.remove('is-blinking');
  void robot.offsetWidth;
  robot.classList.add('is-blinking');
  setTimeout(()=>robot.classList.remove('is-blinking'),230);
 }
 function showMood(mood,announce){
  clearTimeout(clearTimer);
  robot.dataset.mood=mood.id;
  reaction.textContent=mood.emoji;
  if(announce)status.textContent=mood.label;
  clearTimer=setTimeout(()=>{delete robot.dataset.mood;reaction.textContent='';},1700);
 }
 function schedule(){
  timers();
  if(document.hidden||reduced?.matches)return;
  blinkTimer=setTimeout(()=>{blink();schedule()},3500+Math.random()*3700);
  moodTimer=setTimeout(()=>{
   if(document.activeElement!==robot)showMood(moods[Math.floor(Math.random()*3)],false);
  },7500+Math.random()*3900);
 }
 robot.addEventListener('click',()=>{
  const mood=moods[next];next=(next+1)%moods.length;
  showMood(mood,true);blink();
 });
 document.addEventListener('visibilitychange',schedule);
 reduced?.addEventListener?.('change',schedule);
 window.addEventListener('pagehide',()=>{
  timers();clearTimeout(clearTimer);
 },{once:true});
 schedule();
})();