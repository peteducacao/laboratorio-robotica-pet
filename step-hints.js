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
 function correctionFor(w,category,steps,expected){
  // A correção vem das ligações válidas da montagem atual, não do terminal
  // que o estudante ligou errado. Isso também respeita gangorras e motores
  // intercambiáveis que o simulador já reconhece.
  const candidates=(Array.isArray(expected)&&expected.length
   ?expected.map(([a,b])=>({a,b,section:kind({a,b})==='lm'?'lm':'drv'}))
   :steps).filter(candidate=>{
    const ids=[part(candidate.a),part(candidate.b)];
    if(category==='motor')return ids.includes('ml')||ids.includes('mr');
    if(category==='gpio')return [candidate.a,candidate.b].some(p=>/^drv\.IN[1-4]$/.test(p));
    if(category==='ground')return ids.includes('drv')&&ids.includes('esp');
    if(category==='switchLed'){
     const switchId=[w.a,w.b].find(p=>/^s[12]\./.test(p));
     return switchId?ids.includes(part(switchId)):ids.includes('s1')||ids.includes('s2');
    }
    if(category==='lm')return ids.includes('b1')||ids.includes('lm')||ids.includes('esp')&&[candidate.a,candidate.b].includes('esp.VIN');
    if(category==='drive')return ids.includes('b2')||ids.includes('drv')&&
     [candidate.a,candidate.b].some(p=>p==='drv.VCC'||p==='drv.GND')||
     ids.includes('s1')||ids.includes('s2');
    return true;
   });
  const options=candidates.length?candidates:steps;
  let best=null,bestScore=-Infinity;
  for(const [i,c] of options.entries()){
   const connected=[w.a,w.b],wanted=[c.a,c.b];
   const matched=connected.filter(v=>wanted.some(p=>same(v,p)));
   if(!matched.length)continue;
   const sameParts=new Set(connected.map(part));
   const sharedParts=wanted.filter(p=>sameParts.has(part(p))).length;
   const specificity=matched.reduce((total,p)=>total+(
    /^(?:esp\.GND2?|drv\.GND)$/.test(p)?0.15:1),0);
   const score=matched.length*100+sharedParts*10+specificity*3-i*.001;
   if(score>bestScore){bestScore=score;best=c;}
  }
  return best||options[0]||null;
 }
 function getAdvice(wires,allowed,switched,portName,selected,expected){
  if(!Array.isArray(wires)||!allowed)return null;
  // Só ligações completas e realmente inválidas disparam dicas.
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
  const correction=correctionFor(chosen.w,category,steps,expected);
  const label=p=>typeof portName==='function'?portName(p):p;
  const what=label(chosen.w.a)+' → '+label(chosen.w.b);
  const correct=correction?label(correction.a)+' → '+label(correction.b):
   'Confira os terminais deste componente no gabarito.';
  const section=category==='lm'?'Alimentação · LM2596':
   category==='motor'?'Ponte H · Motor DC':
   category==='gpio'?'ESP32 · Ponte H':
   category==='ground'?'GND comum':
   category==='switchLed'?'Gangorra · Terminais':
   'Alimentação · Ponte H';
  return {
   header:section,what,correct,detail:'Correto: '+correct,
   text:'O que você fez: '+what+'. Correto: '+correct,
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
 const api={sequence,getAdvice,createDelay};
 if(typeof window!=='undefined')window.TinkerpetStepHints=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
