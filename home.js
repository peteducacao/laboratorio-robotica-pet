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
 let next=0,blinkTimer=0,moodTimer=0,clearTimer=0,blinkClearTimer=0;
 function clearTimers(){
  clearTimeout(blinkTimer);clearTimeout(moodTimer);
  clearTimeout(clearTimer);clearTimeout(blinkClearTimer);
 }
 function blink(){
  if(document.hidden||reduced?.matches)return;
  robot.classList.remove('is-blinking');
  void robot.offsetWidth;
  robot.classList.add('is-blinking');
  clearTimeout(blinkClearTimer);
  blinkClearTimer=setTimeout(()=>robot.classList.remove('is-blinking'),230);
 }
 function showMood(mood,announce){
  clearTimeout(clearTimer);
  robot.dataset.mood=mood.id;
  reaction.textContent=mood.emoji;
  if(announce)status.textContent=mood.label;
  clearTimer=setTimeout(()=>{delete robot.dataset.mood;reaction.textContent='';},1750);
 }
 function scheduleBlink(){
  clearTimeout(blinkTimer);
  if(document.hidden||reduced?.matches)return;
  blinkTimer=setTimeout(()=>{blink();scheduleBlink()},3400+Math.random()*3000);
 }
 function scheduleMood(){
  clearTimeout(moodTimer);
  if(document.hidden||reduced?.matches)return;
  moodTimer=setTimeout(()=>{
   if(document.activeElement!==robot)showMood(moods[Math.floor(Math.random()*3)],false);
   scheduleMood();
  },7600+Math.random()*5100);
 }
 function start(){
  clearTimeout(blinkTimer);clearTimeout(moodTimer);
  if(!document.hidden&&!reduced?.matches){scheduleBlink();scheduleMood()}
 }
 robot.addEventListener('click',()=>{
  const mood=moods[next];next=(next+1)%moods.length;
  showMood(mood,true);blink();
 });
 document.addEventListener('visibilitychange',start);
 reduced?.addEventListener?.('change',start);
 window.addEventListener('pagehide',clearTimers,{once:true});
 start();
})();