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
 function explanation(w,category,step,switched,portName){
  const named=p=>typeof portName==='function'?portName(p):p;
  const original=named(w.a)+' → '+named(w.b);
  const prefix='Revise este fio: '+original+'. ';
  switch(category){
   case 'motor':{
    const motor=[w.a,w.b].find(p=>['ml','mr'].includes(part(p)));
    const motorName=motor?(part(motor)==='ml'?'motor esquerdo':'motor direito'):'motor DC';
    return prefix+'Os dois contatos do '+motorName+' precisam estar no mesmo canal da Ponte H: MOTOR A (OUT1 e OUT2) ou MOTOR B (OUT3 e OUT4). A ordem dos fios do motor pode ser invertida.';
   }
   case 'gpio':
    return prefix+'Na ligação ESP32 → Ponte H, use os GPIOs 27, 26, 32 e 18 para IN1, IN2, IN3 e IN4, com um GPIO diferente para cada entrada. Confira o terminal ligado, sem repetir GPIO.';
   case 'switchLed':
    return prefix+'O pino LED− da gangorra é apenas do indicador luminoso; ele não substitui os dois terminais de comutação. Passe somente o positivo da fonte pelos contatos 1 e 2.';
   case 'ground':
    return prefix+'O GND da Ponte H deve compartilhar o terra com o ESP32 (qualquer pino GND da placa). Confira os negativos antes de prosseguir.';
   case 'lm':
    if([w.a,w.b].some(p=>p==='esp.VIN'||p==='lm.OUTP'||p==='lm.OUTN'||p==='esp.GND'||p==='esp.GND2'))
     return prefix+'Na alimentação do ESP32, LM2596 OUT+ → VIN e LM2596 OUT− → GND. Não inverta positivo e negativo.';
    return prefix+(switched?'No primeiro conjunto, bateria 9 V (−) → LM2596 IN−. O positivo (+) passa pelos contatos 1 e 2 de uma gangorra antes de chegar ao LM2596 IN+.':'No primeiro conjunto, bateria 9 V (−) → LM2596 IN− e bateria 9 V (+) → LM2596 IN+.');
   case 'drive':
   default:
    return prefix+(switched?'Na alimentação da Ponte H, suporte AA (−) → GND. O positivo (+) passa pelos contatos 1 e 2 da outra gangorra antes de chegar ao VCC da Ponte H.':'Na alimentação da Ponte H, suporte AA (−) → GND e suporte AA (+) → VCC.');
  }
 }
 function getAdvice(wires,allowed,switched,portName,selected){
  if(!Array.isArray(wires)||!allowed)return null;
  // Ponta solta significa uma ligação em andamento, não um erro confirmado.
  const wrong=wires.map((w,index)=>({w,index})).filter(({w})=>w&&!w.loose&&
   !allowed.has([stepKey(w.a),stepKey(w.b)].sort().join('|')));
  if(!wrong.length)return null;
  const steps=sequence(Boolean(switched));
  const ordered=wrong.map(({w,index})=>{
   const match=relevantStep(w,steps);
   return {w,index,step:match.step,indexInGuide:match.index};
  }).sort((a,b)=>a.indexInGuide-b.indexInGuide||a.index-b.index);
  // Se o aluno selecionou exatamente um fio errado, mostre a dica DELE.
  const chosen=ordered.find(item=>item.index===selected)||ordered[0];
  const category=kind(chosen.w);
  const inSection=steps.filter(s=>s.section===chosen.step.section);
  const stepWithin=inSection.indexOf(chosen.step)+1;
  const number=chosen.step.section==='lm'?1:2;
  const title=number===1?'Alimentação · LM2596':'Ponte H · Motores e ESP32';
  const header='Etapa '+number+'/2 · '+title+' · passo '+stepWithin+'/'+inSection.length;
  const detail=explanation(chosen.w,category,chosen.step,Boolean(switched),portName);
  return {header,detail,text:header+'. '+detail,wireIndex:chosen.index,number,step:stepWithin,total:inSection.length,category};
 }
 const api={sequence,getAdvice};
 if(typeof window!=='undefined')window.TinkerpetStepHints=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
