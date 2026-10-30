'use strict';(()=>{
 const W=1536,H=1024,asset='assets/welcome-approved.avif';
 const art=document.getElementById('welcomeArt'),button=document.getElementById('enterProjects');
 const blink=document.getElementById('robotBlink');
 const beacon=document.getElementById('antennaGlow');
 const particles=[...document.querySelectorAll('.light-dust')];
 const particlesWorld=[
  {x:460,y:235,n:6},{x:1092,y:310,n:5},{x:388,y:652,n:6},
  {x:1182,y:720,n:7},{x:528,y:837,n:5},{x:1048,y:868,n:6}
 ];
 const crops=[{el:document.getElementById('floatingArduino'),x:36,y:218,w:330,h:250},
  {el:document.getElementById('floatingMotor'),x:1230,y:222,w:290,h:280},
  {el:document.getElementById('floatingSensor'),x:198,y:678,w:265,h:170}];
 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const portrait=width<=900||width/height<=.8;
  const shortLandscape=height<=520&&width>height;
  // Retrato: o enquadramento central mostra o título INTEIRO. A oficina
  // continua em tela cheia por meio do segundo plano suave em CSS.
  // Paisagem curta: sem cortar antena, título nem botão.
  let scale;
  if(shortLandscape)scale=Math.min(width/W,height/H);
  else if(portrait)scale=Math.min(width/780,height/930);
  else scale=Math.max(width/W,height/H);
  const imgWidth=W*scale,imgHeight=H*scale;
  const left=(width-imgWidth)/2,top=(height-imgHeight)/2;
  art.style.width=imgWidth+'px';
  art.style.height=imgHeight+'px';
  art.style.left=left+'px';
  art.style.top=top+'px';
  art.style.objectFit='fill';
  // A área clicável coincide com o botão da arte original, mesmo ao girar
  // a tela do celular ou abrir no tablet.
  const place=(el,x,y,w,h)=>{
   if(!el)return;
   el.style.left=(left+x*scale)+'px';el.style.top=(top+y*scale)+'px';
   el.style.width=w*scale+'px';el.style.height=h*scale+'px';
  };
  place(button,504,631,526,126);
  place(blink,718,339,46,30);
  place(beacon,726,118,92,92);
  particles.forEach((particle,i)=>{
   const world=particlesWorld[i];if(!world)return;
   const n=Math.max(3,Math.round(world.n*scale));
   place(particle,world.x,world.y,n,n);
  });
  for(const {el,x,y,w,h}of crops){
   if(!el)continue;
   place(el,x,y,w,h);
   el.style.backgroundImage='url("'+asset+'")';
   el.style.backgroundSize=imgWidth+'px '+imgHeight+'px';
   el.style.backgroundPosition=(-x*scale)+'px '+(-y*scale)+'px';
  }
 }
 window.addEventListener('resize',layout,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',layout,{passive:true});
 if(art)art.addEventListener('load',layout,{once:true});
 layout();
})();