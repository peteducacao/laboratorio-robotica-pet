'use strict';(()=>{
 const W=1536,H=1024;
 const art=document.getElementById('welcomeArt'),button=document.getElementById('enterProjects');
 const blink=document.getElementById('robotBlink');
 const beacon=document.getElementById('antennaGlow');
 const particles=[...document.querySelectorAll('.light-dust')];
 const particlesWorld=[
  {x:460,y:235,n:6},{x:1092,y:310,n:5},{x:388,y:652,n:6},
  {x:1182,y:720,n:7},{x:528,y:837,n:5},{x:1048,y:868,n:6}
 ];
 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const portrait=width<=900||width/height<=.8;
  const shortLandscape=height<=520&&width>height;
  // Escala UNIFORME: nunca distorcer robô, título ou ícones.
  // Mobile prioriza a largura central e mantém o nome completo.
  const scale=shortLandscape?Math.min(width/W,height/H):
   portrait?Math.min(width/780,height/930):Math.min(width/W,height/H);
  const left=(width-W*scale)/2,top=(height-H*scale)/2;
  Object.assign(art.style,{
   left:left+'px',top:top+'px',width:W*scale+'px',height:H*scale+'px'
  });
  const place=(el,x,y,w,h)=>{
   if(!el)return;
   Object.assign(el.style,{
    left:(left+x*scale)+'px',top:(top+y*scale)+'px',
    width:w*scale+'px',height:h*scale+'px'
   });
  };
  place(button,504,631,526,126);
  place(blink,718,339,46,30);
  place(beacon,726,118,92,92);
  particles.forEach((el,i)=>{
   const p=particlesWorld[i];if(!p)return;
   const n=Math.max(3,Math.round(p.n*scale));
   place(el,p.x,p.y,n,n);
  });
 }
 window.addEventListener('resize',layout,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',layout,{passive:true});
 art.addEventListener('load',layout,{once:true});
 layout();
})();