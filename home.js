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

 // A composição mobile não estica pixels da primeira ou última linha:
 // desenha a oficina na escala ORIGINAL e completa apenas o ambiente.
 let mobileLastSize='';
 function renderMobileScene(width,height,scale,left,top){
  if(!art.complete||!art.naturalWidth)return false;
  const dpr=Math.min(window.devicePixelRatio||1,1.35);
  const targetW=Math.round(width*dpr),targetH=Math.round(height*dpr);
  const key=targetW+':'+targetH+':'+scale.toFixed(5)+':'+top.toFixed(1);
  if(mobileLastSize===key&&backdrop.width===targetW&&backdrop.height===targetH)return true;
  try{
   backdrop.width=targetW;backdrop.height=targetH;
   const ctx=backdrop.getContext('2d',{alpha:false});
   if(!ctx)return false;
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   // Parede azul contínua, sem filter:blur e sem ampliar um pixel isolado.
   const wall=ctx.createLinearGradient(0,0,0,height);
   wall.addColorStop(0,'#081a35');
   wall.addColorStop(.44,'#0b284e');
   wall.addColorStop(1,'#075484');
   ctx.fillStyle=wall;ctx.fillRect(0,0,width,height);
   const warm=ctx.createRadialGradient(-width*.08,height*.33,0,0,height*.33,width*.58);
   warm.addColorStop(0,'#75513c83');warm.addColorStop(1,'#75513c00');
   ctx.fillStyle=warm;ctx.fillRect(0,0,width,height);
   const cool=ctx.createRadialGradient(width*1.1,height*.30,0,width,height*.30,width*.70);
   cool.addColorStop(0,'#269bf454');cool.addColorStop(1,'#269bf400');
   ctx.fillStyle=cool;ctx.fillRect(0,0,width,height);
   // A grade da bancada prolonga o chão original com linhas nítidas.
   const floor=top+H*scale-38;
   ctx.lineWidth=.8;
   for(let y=Math.max(0,floor);y<height;y+=26){
    const strength=Math.min(.25,.07+(y-floor)/Math.max(1,height-floor)*.18);
    ctx.strokeStyle='rgba(119,210,255,'+Math.max(0,strength)+')';
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();
   }
   for(let x=-width*2;x<width*3;x+=34){
    ctx.strokeStyle='rgba(115,210,255,.12)';
    ctx.beginPath();
    ctx.moveTo(width/2+(x-width/2)*.13,floor);
    ctx.lineTo(x,height);
    ctx.stroke();
   }
   // Robô, marca, botão e oficina vêm da arte aprovada, na mesma proporção.
   // Só há uma transição curta (36 px), não faixas turvas gigantes.
   const plate=document.createElement('canvas');
   plate.width=targetW;plate.height=targetH;
   const layer=plate.getContext('2d');
   if(!layer)return false;
   layer.setTransform(dpr,0,0,dpr,0,0);
   layer.imageSmoothingEnabled=true;layer.imageSmoothingQuality='high';
   layer.drawImage(art,left,top,W*scale,H*scale);
   layer.globalCompositeOperation='destination-in';
   const mask=layer.createLinearGradient(0,0,0,height);
   const stop=(y,a)=>mask.addColorStop(Math.max(0,Math.min(1,y/height)),'rgba(0,0,0,'+a+')');
   const edge=top+H*scale;
   stop(0,0);stop(top+1,0);stop(top+36,1);
   stop(edge-38,1);stop(edge+1,0);stop(height,0);
   layer.fillStyle=mask;layer.fillRect(0,0,width,height);
   ctx.drawImage(plate,0,0,width,height);
   mobileLastSize=key;return true;
  }catch(err){
   console.warn('TinkerPET: cenário mobile indisponível',err);
   return false;
  }
 }

 function layout(){
  const width=document.documentElement.clientWidth||window.innerWidth;
  const height=window.innerHeight;
  const mobile=width<=900||width/height<.8;
  const shortLandscape=height<=520&&width>height;
  const scale=shortLandscape?Math.min(width/W,height/H):
   mobile?Math.min(width/830,height/780):
   Math.min(width/W,height/H)*.84;
  // Mobile tem um enquadramento independente. O desktop abaixo não muda.
  if(mobile&&!shortLandscape){
   // Ajuste para tablets deitados sem cortar o botão.
   const mobileScale=Math.min(scale,(height-38)/770);
   const top=Math.max(10,Math.min(height*.19,146,height-733*mobileScale));
   const left=(width-W*mobileScale)/2;
   Object.assign(art.style,{
    left:left+'px',top:top+'px',width:W*mobileScale+'px',height:H*mobileScale+'px'
   });
   const place=(el,x,y,w,h)=>{
    if(el)Object.assign(el.style,{
     left:left+x*mobileScale+'px',top:top+y*mobileScale+'px',
     width:w*mobileScale+'px',height:h*mobileScale+'px'
    });
   };
   place(button,585,591,604,130);
   place(blink,831,315,43,34);
   place(beacon,883,143,94,94);
   particles.forEach((el,i)=>{
    const p=coords[i];if(p){
     const n=Math.max(3,Math.round(p.n*mobileScale));
     place(el,p.x,p.y,n,n);
    }
   });
   const composed=renderMobileScene(width,height,mobileScale,left,top);
   scene.classList.toggle('composed',composed);
   scene.classList.toggle('mobile-clean',composed);
   return;
  }
  scene.classList.remove('mobile-clean');
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