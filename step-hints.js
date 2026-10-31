'use strict';
/* Dicas contextuais do TinkerPET: segue a ordem do gabarito.
   Não decide se uma ligação é válida: essa decisão pertence ao
   validador do editor, que aceita gangorras invertidas, canais de
   motor equivalentes e GPIOs intercambiáveis. */
(()=>{
 const connection=(a,b,section)=>({a,b,section});
 const lm=[
  connection('b1.NEG','lm.INN','lm'),
  connection('b1.POS','lm.INP','lm'),
  connection('lm.OUTP','esp.VIN','lm'),
  connection('lm.OUTN','esp.GND','lm')
 ];
 const lmSwitch=[
  connection('b1.NEG','lm.INN','lm'),
  connection('b1.POS','s1.IN','lm'),
  connection('s1.OUT','lm.INP','lm'),
  connection('lm.OUTP','esp.VIN','lm'),
  connection('lm.OUTN','esp.GND','lm')
 ];
 const drive=[
  connection('b2.NEG','drv.GND','drv'),
  connection('b2.POS','drv.VCC','drv')
 ];
 const driveSwitch=[
  connection('b2.NEG','drv.GND','drv'),
  connection('b2.POS','s2.IN','drv'),
  connection('s2.OUT','drv.VCC','drv')
 ];
 // Mesma ordem pedagógica que a sequência "remaining" do gabarito.
 const rest=[
  connection('drv.GND','esp.GND2','drv'),
  connection('drv.IN1','esp.D27','drv'),
  connection('drv.IN2','esp.D26','drv'),
  connection('drv.IN3','esp.D32','drv'),
  connection('drv.IN4','esp.D18','drv'),
  connection('drv.OUT1','mr.B','drv'),
  connection('drv.OUT2','mr.A','drv'),
  connection('drv.OUT3','ml.B','drv'),
  connection('drv.OUT4','ml.A','drv')
 ];
 const sequence=switched=>[...(switched?lmSwitch:lm),...(switched?driveSwitch:drive),...rest];
 const stepKey=s=>s==='esp.GND2'?'esp.GND':s;
 const part=p=>String(p||'').split('.')[0];
 const pin=p=>String(p||'').split('.')[1]||'';
 const same=(a,b)=>stepKey(a)===stepKey(b);
 function kind(w){
  const points=[w.a,w.b],ids=points.map(part);
  const has=(prefix)=>ids.includes(prefix);
  if(ids.some(id=>id==='ml'||id==='mr')||points.some(p=>/^drv\.OUT[1-4]$/.test(p)))return 'motor';
  if(points.some(p=>/^drv\.IN[1-4]$/.test(p)||/^esp\.(?:D27|D26|D32|D18|D\d+)$/.test(p)))return 'gpio';
  if(points.some(p=>/\.LEDG$/.test(p)))return 'switchLed';
  if(has('lm')||has('b1')||points.includes('esp.VIN'))return 'lm';
  if(has('b2')||points.includes('drv.VCC'))return 'drive';
  if(has('drv')&&points.some(p=>/^esp\.GND2?$/.test(p)))return 'ground';
  if(has('drv')||points.some(p=>/^s[12]\./.test(p)))return 'drive';
  if(has('esp'))return 'lm';
  return 'drive';
 }
 function relevantStep(w,steps){
  const category=kind(w);
  const eligible=steps.map((step,index)=>({step,index})).filter(({step})=>{
   if(category==='motor')return /^drv\.OUT/.test(step.a);
   if(category==='gpio')return /^drv\.IN/.test(step.a);
   if(category==='ground')return step.a==='drv.GND'&&step.b==='esp.GND2';
   if(category==='lm')return step.section==='lm';
   if(category==='drive')return step.section==='drv'&&!/^drv\.(IN|OUT)/.test(step.a);
   if(category==='switchLed')return /^s[12]\./.test(step.a)||/^s[12]\./.test(step.b);
   return true;
  });
  const candidates=eligible.length?eligible:steps.map((step,index)=>({step,index}));
  let best=candidates[0],score=-1;
  for(const candidate of candidates){
   const a=candidate.step.a,b=candidate.step.b;
   const hits=[w.a,w.b].filter(p=>same(p,a)||same(p,b)).length;
   const exact=(same(w.a,a)&&same(w.b,b))||(same(w.a,b)&&same(w.b,a));
   const value=hits*10+(exact?4:0);
   if(value>score){score=value;best=candidate}
  }
  return best;
 }
 // Só recomenda mover UMA ponta quando a ligação resultante foi confirmada
 // pelo próprio verificador do editor. A ordem do gabarito desempata opções.
 function chooseRepair(w,index,switched,allPorts,canApply){
  if(!w||typeof canApply!=='function'||!Array.isArray(allPorts))return null;
  const guide=sequence(Boolean(switched));
  const canon=(a,b)=>[stepKey(a),stepKey(b)].sort().join('|');
  const guideOrder=new Map(guide.map((p,i)=>[canon(p.a,p.b),i]));
  const options=[];
  for(const end of ['b','a']){
   const fixed=w[end==='a'?'b':'a'],old=w[end];
   for(const next of allPorts){
    if(next===old||next===fixed||!canApply(index,end,next))continue;
    const pair=canon(fixed,next);
    const rank=guideOrder.get(pair);
    const score=(part(next)===part(old)?50:0)
      +(rank!==undefined?30:0)
      +(end==='b'?12:0)
      +(rank!==undefined?(guide.length-rank)/100:0);
    options.push({end,from:old,to:next,keep:fixed,score});
   }
  }
  if(!options.length)return null;
  options.sort((a,b)=>b.score-a.score||a.to.localeCompare(b.to));
  const best=options[0];
  return {end:best.end,from:best.from,to:best.to,keep:best.keep};
 }
 function getAdvice(wires,allowed,switched,portName,selected,expected,resolveRepair){
  if(!Array.isArray(wires)||!allowed)return null;
  const wrong=wires.map((w,index)=>({w,index})).filter(({w})=>w&&!w.loose&&
   !allowed.has([stepKey(w.a),stepKey(w.b)].sort().join('|')));
  if(!wrong.length)return null;
  const steps=sequence(Boolean(switched));
  const ordered=wrong.map(({w,index})=>{
   const match=relevantStep(w,steps);
   return {w,index,step:match.step,indexInGuide:match.index};
  }).sort((a,b)=>a.indexInGuide-b.indexInGuide||a.index-b.index);
  const chosen=ordered.find(item=>item.index===selected)||ordered[0];
  const category=kind(chosen.w);
  const label=p=>typeof portName==='function'?portName(p):p;
  const repair=typeof resolveRepair==='function'?
   resolveRepair(chosen.w,chosen.index,Boolean(switched)):null;
  const what=label(chosen.w.a)+' → '+label(chosen.w.b);
  const from=repair?label(repair.from):null;
  const to=repair?label(repair.to):null;
  const keep=repair?label(repair.keep):null;
  const section=category==='lm'?'Bateria e LM2596':
   category==='motor'?'Motor e Ponte H':
   category==='gpio'?'ESP32 e Ponte H':
   category==='ground'?'Ligação do GND':
   category==='switchLed'?'Ligação da gangorra':
   'Ponte H e alimentação';
  return {
   header:section,what,correct:to,from,to,keep,repair,
   fallback:'Tire esse fio e confira o próximo passo no gabarito antes de ligar novamente.',
   detail:repair?'Tire a ponta de '+from+' e coloque em '+to+'.':'Remova este fio e confira o gabarito.',
   text:repair?'Tire a ponta de '+from+' e coloque em '+to+'.':'Confira a ligação no gabarito.',
   wireIndex:chosen.index,
   number:chosen.step.section==='lm'?1:2,
   step:steps.filter(p=>p.section===chosen.step.section).indexOf(chosen.step)+1,
   total:steps.filter(p=>p.section===chosen.step.section).length,
   category
  };
 }
 // Cada erro é uma TENTATIVA real de ligação ou reconexão, não um render,
 // um toque na bancada ou uma ponta solta. Sorteio novo após a ajuda.
 function createDelay(random=Math.random){
  const draw=()=>2+Math.min(8,Math.max(0,Math.floor(random()*9)));
  let attempts=0,target=draw(),unlocked=false;
  return {
   record(wrong){
    if(!wrong||unlocked)return unlocked;
    attempts++;
    if(attempts>=target)unlocked=true;
    return unlocked;
   },
   visible(hasWrong){return Boolean(unlocked&&hasWrong)},
   clearIfResolved(hasWrong){
    if(!hasWrong&&unlocked){attempts=0;target=draw();unlocked=false;}
   },
   get attempts(){return attempts},
   get target(){return target},
   get unlocked(){return unlocked}
  };
 }
 const api={sequence,getAdvice,chooseRepair,createDelay};
 if(typeof window!=='undefined')window.TinkerpetStepHints=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
