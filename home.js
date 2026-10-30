'use strict';(()=>{
 const W=1798,H=875;
 const art=document.getElementById('welcomeArt');
 const button=document.getElementById('enterProjects');
 const blink=document.getElementById('robotBlink');
 const beacon=document.getElementById('antennaGlow');
 const particles=[...document.querySelectorAll('.light-dust')];
 const coords=[{x:240,y:190,n:5},{x:1395,y:297,n:4},{x:415,y:620,n:6},
  {x:1500,y:665,n:5},{x:730,y:756,n:5},{x:1210,y:765,n:4}];
 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const mobile=width<=900||width/height<.8;
  const shortLandscape=height<=520&&width>height;
  // O desktop faz COVER com escala uniforme. No celular recortamos as
  // bordas laterais, nunca o robô, o nome ou o botão.
  const scale=shortLandscape?Math.min(width/W,height/H):
   mobile?Math.min(width/830,height/780):Math.max(width/W,height/H);
  const left=(width-W*scale)/2,top=(height-H*scale)/2;
  Object.assign(art.style,{left:left+'px',top:top+'px',width:W*scale+'px',height:H*scale+'px'});
  const place=(el,x,y,w,h)=>{
   if(!el)return;
   Object.assign(el.style,{left:left+x*scale+'px',top:top+y*scale+'px',
    width:w*scale+'px',height:h*scale+'px'});
  };
  // Botão, imagem e animações usam as mesmas coordenadas de origem.
  place(button,585,590,604,131);
  place(blink,831,315,43,34);
  place(beacon,883,143,94,94);
  particles.forEach((el,i)=>{
   const p=coords[i];if(!p)return;
   const n=Math.max(3,Math.round(p.n*scale));place(el,p.x,p.y,n,n);
  });
 }
 window.addEventListener('resize',layout,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',layout,{passive:true});
 art.addEventListener('load',layout,{once:true});
 layout();
})();