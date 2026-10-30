'use strict';(()=>{
 const W=1798,H=875,CX=W/2,CY=H/2;
 const scene=document.querySelector('.welcome'),art=document.getElementById('welcomeArt');
 const backdrop=document.getElementById('welcomeBackdrop');
 const button=document.getElementById('enterProjects');
 const blink=document.getElementById('robotBlink');
 const beacon=document.getElementById('antennaGlow');
 const particles=[...document.querySelectorAll('.light-dust')];
 const coords=[
  {x:240,y:190,n:5},{x:1395,y:297,n:4},{x:415,y:620,n:6},
  {x:1500,y:665,n:5},{x:730,y:756,n:5},{x:1210,y:765,n:4}
 ];
 let lastSize='',drawing=false;
 function renderScene(width,height,s,mapX,mapY){
  if(!art.complete||!art.naturalWidth)return false;
  const dpr=Math.min(window.devicePixelRatio||1,1.35);
  const targetW=Math.round(width*dpr),targetH=Math.round(height*dpr);
  const key=[targetW,targetH,s.toFixed(5)].join(':');
  if(lastSize===key&&backdrop.width===targetW&&backdrop.height===targetH)return true;
  if(drawing)return false;
  drawing=true;
  try{
   const middle=document.createElement('canvas');
   middle.width=targetW;middle.height=H;
   const m=middle.getContext('2d',{alpha:false});
   if(!m)return false;
   m.imageSmoothingEnabled=true;m.imageSmoothingQuality='high';
   // A largura extra é retirada unicamente do ambiente periférico.
   // Uma curva suave protege a proporção do mascote, texto e botão.
   const step=3;
   for(let x=0;x<W;x+=step){
    const sw=Math.min(step,W-x);
    const from=mapX(x)*dpr,to=mapX(x+sw)*dpr;
    if(to<0||from>targetW)continue;
    m.drawImage(art,x,0,sw,H,from,0,to-from+.55,H);
   }
   backdrop.width=targetW;backdrop.height=targetH;
   const ctx=backdrop.getContext('2d',{alpha:false});
   if(!ctx)return false;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   // No celular, ampliamos as áreas da PAREDE e da BANCADA para ocupar
   // o topo e a parte inferior. Não há mais filtro blur nem faixas turvas.
   for(let y=0;y<H;y+=step){
    const sh=Math.min(step,H-y);
    const from=mapY(y)*dpr,to=mapY(y+sh)*dpr;
    if(to<0||from>targetH)continue;
    ctx.drawImage(middle,0,y,targetW,sh,0,from,targetW,to-from+.55);
   }
   lastSize=key;
   return true;
  }catch(error){
   console.warn('TinkerPET: imagem responsiva indisponível',error);
   return false;
  }finally{drawing=false}
 }
 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const mobile=width<=900||width/height<.8;
  const shortLandscape=height<=520&&width>height;
  const scale=shortLandscape?Math.min(width/W,height/H):
   mobile?Math.min(width/830,height/780):
   Math.min(width/W,height/H)*.84;
  const extraX=(width-W*scale)/2,extraY=(height-H*scale)/2;
  const mapX=x=>{
   const centered=(x-CX)/CX;
   // Celular: cortar apenas o cenário exterior, mantendo todo o logotipo.
   return width/2+(x-CX)*scale+
    (!mobile&&!shortLandscape?extraX*centered**5:0);
  };
  const mapY=y=>height/2+(y-CY)*scale+extraY*((y-CY)/CY)**5;
  const left=(width-W*scale)/2,top=(height-H*scale)/2;
  Object.assign(art.style,{
   left:left+'px',top:top+'px',width:W*scale+'px',height:H*scale+'px'
  });
  const place=(el,x,y,w,h)=>{
   if(!el)return;
   Object.assign(el.style,{
    left:mapX(x)+'px',top:mapY(y)+'px',
    width:(mapX(x+w)-mapX(x))+'px',
    height:(mapY(y+h)-mapY(y))+'px'
   });
  };
  // A arte já contém a seta perfeitamente centralizada. O contorno
  // animado ocupa exatamente o seu botão azul, sem criar outra moldura.
  place(button,585,591,604,130);
  place(blink,831,315,43,34);
  place(beacon,883,143,94,94);
  particles.forEach((el,i)=>{
   const p=coords[i];if(!p)return;
   const n=Math.max(3,Math.round(p.n*scale));
   place(el,p.x,p.y,n,n);
  });
  const composed=renderScene(width,height,scale,mapX,mapY);
  scene.classList.toggle('composed',composed);
 }
 window.addEventListener('resize',layout,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',layout,{passive:true});
 art.addEventListener('load',()=>{lastSize='';layout()},{once:true});
 layout();
})();