'use strict';(()=>{
 const W=1536,H=1024,src='assets/welcome-approved.png';
 const art=document.getElementById('welcomeArt'),button=document.getElementById('enterProjects');
 const blink=document.getElementById('robotBlink');
 const crops=[{el:document.getElementById('floatingArduino'),x:36,y:218,w:330,h:250},
  {el:document.getElementById('floatingMotor'),x:1230,y:222,w:290,h:280},
  {el:document.getElementById('floatingSensor'),x:198,y:678,w:265,h:170}];
 function layout(){
  const screenW=window.innerWidth,screenH=window.innerHeight;
  const scale=Math.max(screenW/W,screenH/H);
  const imgW=W*scale,imgH=H*scale,left=(screenW-imgW)/2,top=(screenH-imgH)/2;
  const place=(el,x,y,w,h)=>{
   el.style.left=(left+x*scale)+'px';el.style.top=(top+y*scale)+'px';
   el.style.width=w*scale+'px';el.style.height=h*scale+'px';
  };
  // Hitbox fica sobre o botão azul da arte aprovada, inclusive em telas
  // verticais onde a imagem é cortada pelo object-fit:cover.
  place(button,504,631,526,126);
  place(blink,718,339,46,30);
  for(const {el,x,y,w,h}of crops){
   if(!el)continue;
   place(el,x,y,w,h);
   el.style.backgroundImage='url("'+src+'")';
   el.style.backgroundSize=imgW+'px '+imgH+'px';
   el.style.backgroundPosition=(-x*scale)+'px '+(-y*scale)+'px';
  }
 }
 window.addEventListener('resize',layout,{passive:true});
 if(window.visualViewport)visualViewport.addEventListener('resize',layout,{passive:true});
 document.addEventListener('DOMContentLoaded',layout);
 art.addEventListener('load',layout,{once:true});
 layout();
})();