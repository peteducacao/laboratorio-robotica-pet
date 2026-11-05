/* PETGame 2.0: camada de cidade detalhada, procedural e leve para WebGL mobile. */
(()=>{
'use strict';
window.PetgameWorld2={enhance({T,scene,mats,box,cyl,world,renderer,daylight}) {
 let seed=734922;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const choose=a=>a[Math.floor(rnd()*a.length)];
 const solid=(x,z,r)=>world.walls.push({type:'circle',x,z,r});
 const pal={
  grass:['#85ab68','#9abb76','#a2bd81','#769b60'],road:['#5c646e','#636973'],side:['#d8c9b5','#f0e2ce']
 };
 function texture(kind,size=384,repeats=12){
  const c=document.createElement('canvas');c.width=c.height=size;
  const x=c.getContext('2d');
  x.fillStyle=kind==='road'?'#666c74':kind==='grass'?'#95b78b':'#e5dacc';x.fillRect(0,0,size,size);
  seed+=25;
  if(kind==='side'){
   for(let row=0;row<7;row++)for(let col=0;col<7;col++){
    const sx=col*55+(row%2)*8,sy=row*55,noise=rnd();
    x.fillStyle=choose(['#e8dbca','#d9cabc','#eee2d4','#e1d6c8']);
    x.fillRect(sx+1,sy+1,53,53);
    x.fillStyle='rgba(42,53,55,.12)';x.fillRect(sx,sy,1.5,55);
    x.fillRect(sx,sy,55,1.5);
    if(noise>.88){x.strokeStyle='rgba(91,91,85,.15)';x.beginPath();x.moveTo(sx+9,sy+7);x.lineTo(sx+23,sy+22);x.lineTo(sx+29,sy+23);x.stroke()}
   }
  }
  if(kind==='road'){
   for(let i=0;i<7500;i++){
    const px=rnd()*size,py=rnd()*size,z=.4+rnd()*2.5;
    x.fillStyle=rnd()>.45?'rgba(226,226,218,.13)':'rgba(21,29,38,.11)';
    x.fillRect(px,py,z,z*.7);
   }
   for(let i=0;i<12;i++){
    const px=rnd()*size,py=rnd()*size;
    x.beginPath();x.strokeStyle='rgba(31,39,45,.10)';x.lineWidth=.6+rnd();
    x.moveTo(px,py);x.lineTo(px+9+rnd()*26,py+3+rnd()*14);x.stroke();
   }
  }
  if(kind==='grass'){
   for(let i=0;i<5200;i++){
    const px=rnd()*size,py=rnd()*size;
    x.fillStyle=choose(['rgba(40,106,36,.12)','rgba(219,245,165,.24)','rgba(89,131,60,.12)','rgba(238,222,135,.09)']);
    x.fillRect(px,py,1+rnd()*4,1+rnd()*3);
   }
   for(let i=0;i<300;i++){
    x.strokeStyle=rnd()>.5?'rgba(41,90,46,.18)':'rgba(235,252,179,.22)';
    const px=rnd()*size,py=rnd()*size;x.beginPath();x.moveTo(px,py);x.lineTo(px+2,py-4-rnd()*3);x.stroke();
   }
  }
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;
  t.colorSpace=T.SRGBColorSpace;t.repeat.set(repeats,repeats);t.anisotropy=2;return t;
 }
 mats.road.map=texture('road',384,11);mats.road.needsUpdate=true;
 mats.sidewalk.map=texture('side',384,8);mats.sidewalk.needsUpdate=true;
 mats.grass.map=texture('grass',384,17);mats.grass.needsUpdate=true;
 for(const [k,repeat] of [['zoneSchool',6],['zoneLab',6],['zonePark',6],['zoneFactory',6]]){
  if(mats[k]){mats[k].map=texture('grass',256,repeat);mats[k].needsUpdate=true}
 }
 const material=(color,roughness=1)=>new T.MeshLambertMaterial({color});
 const brick=material('#c57056'),cream=material('#eee4c8'),white=material('#fff1db'),
 dark=material('#50616a'),roadMark=material('#f6e7c2'),wood=material('#b3784c'),
 iron=material('#547381'),glass=material('#9dd8d8'),yellow=material('#f5c854'),
 shrub=[material('#5c9a68'),material('#83b65d'),material('#a2c768'),material('#4c936f'),material('#a9bc5b')],
 treeGreen=[material('#447e56'),material('#558f63'),material('#699f65'),material('#8bbf59'),material('#c0b45f')],
 flowers=[material('#ff8d77'),material('#ed78a8'),material('#edcf68'),material('#d6a1df')],
 roof=[material('#ce7759'),material('#e2a267'),material('#6e9eb1'),material('#b56554')];
 // Instâncias para repetir milhares de detalhes sem criar milhares de draw calls.
 function scatter(geo,materials,instances){
  const list=Array.isArray(materials)?materials:[materials];let total=0;
  const object=new T.Object3D();
  list.forEach((m,mi)=>{
   const filtered=instances.filter((_,i)=>i%list.length===mi);
   if(!filtered.length)return;
   const inst=new T.InstancedMesh(geo,m,filtered.length);
   filtered.forEach((it,i)=>{object.position.set(it[0],it[1],it[2]);object.rotation.set(it[6]||0,it[3]||0,it[7]||0);object.scale.set(it[4]||1,it[5]||1,it[4]||1);object.updateMatrix();inst.setMatrixAt(i,object.matrix)});
   inst.instanceMatrix.needsUpdate=true;inst.frustumCulled=false;scene.add(inst);total+=filtered.length;
  });return total
 }
 // Calçadas com borda, meio-fio de concreto e textura distinta por quarteirão.
 for(const road of [-50,-30,-10,10,30,50]){
  for(let at=-60;at<=60;at+=20){
   for(const edge of [-4.65,4.65]){
    box(scene,.3,.22,11.3,road+edge,.16,at,cream);
    box(scene,11.3,.22,.3,at,.16,road+edge,cream);
    box(scene,.13,.035,10.8,road+edge*1.13,.31,at,white);
    box(scene,10.8,.035,.13,at,.31,road+edge*1.13,white);
   }
  }
 }
 // Linhas laterais das pistas, sem bloquear cruzamentos.
 const edgeMarks=[];
 for(const road of [-50,-30,-10,10,30,50])for(let at=-66;at<=66;at+=4.5){
  const nearCross=[-50,-30,-10,10,30,50].some(v=>Math.abs(at-v)<6.5);
  if(nearCross)continue;
  edgeMarks.push([road-3.75,.09,at,0,.06,2.2], [road+3.75,.09,at,0,.06,2.2]);
 }
 scatter(new T.BoxGeometry(1,.1,1),roadMark,edgeMarks.map(v=>[v[0],v[1],v[2],0,v[4],v[5]]));
 // Lotes: jardins e pequenas construções com volumes variados, sem bloquear as vias.
 const shade=[],planter=[],smallFlowers=[],twigs=[];
 const foliageGeo=new T.DodecahedronGeometry(1,0),flowerGeo=new T.IcosahedronGeometry(1,0);
 let treeCount=0;
 function detailedTree(x,z,s=1,variant=0){
  solid(x,z,.36*s);
  cyl(scene,.17*s,.25*s,2.15*s,7,x,1.1*s,z,wood);
  const heights=[2.85,3.4,2.95,3.2];
  const top=heights[variant%4]*s;
  shade.push([x,.045,z,0,1.5*s,.12]);
  for(let n=0;n<5;n++){
   const dx=[0,.66,-.62,.25,-.30][n]*s,dz=[0,.1,.28,-.7,.66][n]*s;
   planter.push([x+dx,top+(.35*(n%2))*s,z+dz,rnd()*6.28,(n===0?1.22:.84)*s,.85*s]);
  }
  treeCount++;
 }
 for(const x of [-60,-40,-20,0,20,40,60])for(const z of [-60,-40,-20,0,20,40,60]){
  const isCenter=x===0&&z===0,atPOI=Math.abs(x)===40&&Math.abs(z)===40;
  if(isCenter)continue;
  // Rua viva: cada lote recebe composição própria, preservando faixa de rodagem.
  const s=.75+rnd()*.3;
  for(const [dx,dz] of [[-6.3,-6.3],[6.3,6.3]]){
   if(atPOI&&rnd()>.47)continue;
   detailedTree(x+dx,z+dz,s,Math.floor(rnd()*4));
  }
  const count=atPOI?8:4;
  for(let i=0;i<count;i++){
   const side=i%2===0?-1:1;
   const px=x+side*(6.9+rnd()*1.35),pz=z+(rnd()-.5)*13.7;
   const size=.35+rnd()*.34;
   for(let k=0;k<3;k++)planter.push([px+(k-1)*.34,.36,pz+(k%2)*.27,0,size,.7]);
   if(i%3===0)for(let k=0;k<3;k++)smallFlowers.push([px+(k-1)*.32,.8,pz,0,.13,.7]);
  }
  if(!atPOI&&rnd()>.35){
   // Pequenos jardins diante das casas, floreiras e cercas.
   const fx=x-6.3,fz=z-6.7;
   box(scene,2.6,.16,1.2,fx,.14,fz,wood);
   for(let j=0;j<4;j++)smallFlowers.push([fx+(j-1.5)*.55,.33,fz,0,.17,1]);
   for(let j=0;j<5;j++){
    box(scene,.12,.74,.12,x-7.9+j*.55,.42,z-7.9,wood);
   }
   box(scene,2.4,.14,.13,x-6.8,.73,z-7.9,wood);
  }
  // Marquises, toldos, faixas e tijolos: quebram o efeito de cubos maciços.
  if(!atPOI){
   const fz=z-4.91;
   box(scene,2.8,.12,1.15,x,2.6,fz-.38,choose(roof));
   if(rnd()>.4){
    for(const j of [-2.0,2.0]){
     box(scene,.9,.22,.26,x+j,1.18,fz-.25,cream);
     for(let k=0;k<3;k++)smallFlowers.push([x+j+(k-1)*.22,1.36,fz-.41,0,.13,.85]);
    }
   }
   if(rnd()>.5){
    box(scene,2.8,.28,.14,x,3.1,fz-.15,choose(roof));
   }
  }
 }
 scatter(new T.CircleGeometry(1,10),new T.MeshBasicMaterial({color:0x233f32,transparent:true,opacity:.11,depthWrite:false,side:T.DoubleSide}),shade.map(t=>[t[0],t[1],t[2],0,t[4],t[5],Math.PI/2]));
 scatter(foliageGeo,treeGreen,planter);
 scatter(flowerGeo,flowers,smallFlowers);
 // Arbustos e pequenas flores distribuídas pelo parque e pelos jardins.
 const parkX=-40,parkZ=-40,parks=[],parkBlooms=[];
 for(let i=0;i<90;i++){
  const px=parkX-8+rnd()*16,pz=parkZ-8+rnd()*16;
  if(Math.abs(px-parkX)<4.9&&Math.abs(pz-parkZ)<4.9)continue;
  parks.push([px,.23,pz,0,.22+rnd()*.24,.8]);
  if(i%3===0)parkBlooms.push([px,.57,pz,0,.12,.7]);
 }
 scatter(foliageGeo,shrub,parks);
 scatter(flowerGeo,flowers,parkBlooms);
 // Bancos, lixeiras, hidrantes e flores: ruas vivas sem novos obstáculos.
 function bench(x,z,angle=0){
  solid(x,z,1.05);
  const g=new T.Group();g.position.set(x,.1,z);g.rotation.y=angle;scene.add(g);
  box(g,2.7,.20,.63,0,.63,0,wood);box(g,2.7,.85,.15,0,1.06,.30,wood);
  for(const xx of [-1,1])for(const zz of [-.2,.2])box(g,.15,.56,.15,xx,.3,zz,dark);
 }
 function lamp(x,z){
  solid(x,z,.28);
  cyl(scene,.075,.09,3.95,8,x,2,z,dark);
  cyl(scene,.3,.39,.32,10,x,4.05,z,iron);
  const bulb=new T.Mesh(new T.SphereGeometry(.27,10,8),mats.lampGlow);
  bulb.position.set(x,3.96,z);scene.add(bulb);
  cyl(scene,.12,.18,.30,8,x,.16,z,cream);
 }
 for(const [x,z] of [[-45,-46],[-35,-46],[-45,-34],[-36,-34],[39,-47],[42,-32],[38,32],[43,48],[-36,33],[-44,46],[-2,7],[7,-1]]){
  bench(x,z,Math.floor(rnd()*4)*Math.PI/2);
 }
 for(const x of [-66,-46,-26,-6,14,34,54,66]){
  for(const z of [-64,-24,16,56]){
   if(Math.abs(x)>70||Math.abs(z)>70)continue;
   // Lâmpadas sobre as calçadas, afastadas dos cruzamentos.
   lamp(x,z);
  }
 }
 // Pinturas no pátio da escola: amarelinha e linhas lúdicas, sem colisões.
 const schoolX=40,schoolZ=-40;
 for(let i=0;i<5;i++){
  box(scene,.92,.025,.92,schoolX-7.3+(i%2)*.9,.13,schoolZ-4.5+Math.floor(i/2)*1.6,
   choose([mats.flower,mats.yellow,mats.teal]));
 }
 // Sinalização e pequenos detalhes industriais.
 const fx=40,fz=40;
 for(let i=0;i<5;i++){
  box(scene,1.2,1,.9,fx-5.6,.55,fz-6+i*2.5,choose([wood,dark,mats.awning]));
  solid(fx-5.6,fz-6+i*2.5,.62);
 }
 for(let j=0;j<6;j++){
  box(scene,1.5,.055,.25,fx-5+j*1.3,.13,fz-7.7,mats.yellow);
 }
 // Uma sequência de placas nas vias principais.
 function sign(x,z,txt,color){
  solid(x,z,.3);
  cyl(scene,.065,.075,2.45,6,x,1.26,z,iron);
  const c=document.createElement('canvas');c.width=256;c.height=128;
  const ctx=c.getContext('2d');ctx.fillStyle=color||'#26758c';ctx.fillRect(5,5,246,118);
  ctx.lineWidth=8;ctx.strokeStyle='#f9f0d9';ctx.strokeRect(6,6,244,116);
  ctx.fillStyle='#fff';ctx.font='bold 33px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,128,64,235);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(2.2,1.1),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));
  panel.position.set(x,2.56,z);scene.add(panel);
 }
 sign(44,-57,'ESCOLA','#2b81b6');sign(44,56,'FÁBRICA','#7f6b57');
 sign(-44,56,'LAB','#438fa6');sign(-44,-57,'PARQUE','#4a925c');
 // Gramado e ruas com sombras de contato falsas no celular: preserva desempenho.
 if(renderer){renderer.toneMappingExposure=1.15;}
 if(daylight)daylight.intensity=1.65;
 world.visualUpgrade={version:2,treeCount,flowerCount:smallFlowers.length+parkBlooms.length,detailTextures:3,optimized:true};
 return world.visualUpgrade;
}};
})();
