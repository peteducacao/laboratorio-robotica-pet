'use strict';(()=>{
 const W=1536,H=1024,asset='assets/welcome-approved.avif';
 const art=document.getElementById('welcomeArt'),button=document.getElementById('enterProjects');
 const canvas=document.getElementById('welcomePanorama'),scene=document.querySelector('.welcome');
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
 let lastCanvasSize='';
 function paintPanorama(width,height,mapX){
  if(!art.complete||!art.naturalWidth){scene.classList.remove('panorama-on');return false}
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const pw=Math.round(width*dpr),ph=Math.round(height*dpr);
  const size=pw+'x'+ph;
  if(lastCanvasSize===size&&canvas.width===pw&&canvas.height===ph){
   scene.classList.add('panorama-on');return true;
  }
  canvas.width=pw;canvas.height=ph;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx){scene.classList.remove('panorama-on');return false}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  // Panorâmica suave: nenhum recorte, nenhuma borda desfocada e
  // nenhuma alteração na proporção central (robô, título, botão).
  // A ampliação horizontal cresce gradualmente só nas extremidades.
  const step=3;
  for(let sx=0;sx<W;sx+=step){
   const sw=Math.min(step,W-sx),dx=mapX(sx),dw=mapX(sx+sw)-dx;
   ctx.drawImage(art,sx,0,sw,H,dx,0,dw+.55,height);
  }
  lastCanvasSize=size;
  scene.classList.add('panorama-on');
  return true;
 }
 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const portrait=width<=900||width/height<=.8;
  const shortLandscape=height<=520&&width>height;
  const panorama=!portrait&&!shortLandscape&&width/height>1.53;
  // Smartphone/tablet preservam o enquadramento aprovado.
  const scale=shortLandscape?Math.min(width/W,height/H):
   portrait?Math.min(width/780,height/930):Math.min(width/W,height/H);
  const imgWidth=W*scale,imgHeight=H*scale;
  const left=(width-imgWidth)/2,top=(height-imgHeight)/2;
  art.style.width=imgWidth+'px';art.style.height=imgHeight+'px';
  art.style.left=left+'px';art.style.top=top+'px';
  art.style.objectFit='fill';
  const edgeExtra=(width-imgWidth)/2;
  const mapX=x=>panorama?width/2+(x-W/2)*scale+
   edgeExtra*Math.pow((x-W/2)/(W/2),3):left+x*scale;
  if(panorama)paintPanorama(width,height,mapX);
  else{scene.classList.remove('panorama-on');lastCanvasSize=''}
  // Todas as animações e a área clicável seguem as mesmas coordenadas
  // da arte exibida — inclusive a adaptação panorâmica nas pontas.
  const place=(el,x,y,w,h)=>{
   if(!el)return;
   el.style.left=mapX(x)+'px';el.style.top=(top+y*scale)+'px';
   el.style.width=(mapX(x+w)-mapX(x))+'px';el.style.height=h*scale+'px';
  };
  place(button,504,631,526,126);
  place(blink,718,339,46,30);
  place(beacon,726,118,92,92);
  particles.forEach((particle,i)=>{
   const p=particlesWorld[i];if(p)place(particle,p.x,p.y,Math.max(3,p.n),Math.max(3,p.n));
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
 art.addEventListener('load',()=>{lastCanvasSize='';layout()},{once:true});
 layout();
})();