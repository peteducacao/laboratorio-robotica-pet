/* A bancada de prévia lê uma CÓPIA do circuito, não o original. */
(()=>{'use strict';
 const DEMO={"parts":[{"id":"esp","kind":"esp","x":960,"y":65,"view":"front","rotation":0,"flipped":false},{"id":"drv","kind":"driver","x":710,"y":660,"view":"front","rotation":0,"flipped":false},{"id":"lm","kind":"buck","x":580,"y":110,"view":"front","rotation":0,"flipped":false},{"id":"b1","kind":"battery","x":80,"y":110,"view":"front","rotation":0,"flipped":false},{"id":"b2","kind":"batteryPack","x":80,"y":690,"view":"front","rotation":0,"flipped":false},{"id":"s1","kind":"switch","x":338,"y":140,"view":"front","rotation":0,"flipped":false},{"id":"s2","kind":"switch","x":364,"y":733,"view":"front","rotation":0,"flipped":false},{"id":"ml","kind":"motor","x":1130,"y":680,"view":"front","rotation":0,"flipped":false},{"id":"mr","kind":"motor","x":1450,"y":680,"view":"front","rotation":0,"flipped":false}],"wires":[],"voltage":4,"switches":{"s1":false,"s2":false},"wireColor":"#df1724"};
 let target=DEMO;
 try{
  const id=new URLSearchParams(location.search).get('project');
  const list=JSON.parse(localStorage.getItem('tinkerpet-componentes-preview-library-v1')||'null');
  const project=Array.isArray(list?.projects)?list.projects.find(p=>p.id===id):null;
  if(project?.circuit&&Array.isArray(project.circuit.parts)&&Array.isArray(project.circuit.wires))target=project.circuit;
  else if(id&&id!=='preview-componentes-demo'){
   const real=JSON.parse(localStorage.getItem('tinkerpet-library-v1')||'null');
   const found=Array.isArray(real?.projects)?real.projects.find(p=>p.id===id):null;
   if(found?.circuit&&Array.isArray(found.circuit.parts)&&Array.isArray(found.circuit.wires))target=found.circuit;
  }
 }catch{}
 try{localStorage.setItem('tinkerpet-componentes-preview-v1',JSON.stringify(target));}catch{}
})();