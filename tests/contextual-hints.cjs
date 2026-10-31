'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const hints=require('../step-hints.js');
const key=(a,b)=>[a==='esp.GND2'?'esp.GND':a,b==='esp.GND2'?'esp.GND':b].sort().join('|');
const good=(pairs)=>new Set(pairs.map(([a,b])=>key(a,b)));
const direct=hints.sequence(false),withSwitch=hints.sequence(true);
assert.equal(direct.length,15,'Gabarito sem gangorras: 15 ligações');
assert.equal(withSwitch.length,17,'Gabarito com gangorras: 17 ligações');
assert.deepEqual(direct.slice(0,4).map(w=>[w.a,w.b]),[
 ['b1.NEG','lm.INN'],['b1.POS','lm.INP'],['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND']
]);
assert.deepEqual(withSwitch.slice(0,5).map(w=>[w.a,w.b]),[
 ['b1.NEG','lm.INN'],['b1.POS','s1.IN'],['s1.OUT','lm.INP'],['lm.OUTP','esp.VIN'],['lm.OUTN','esp.GND']
]);
assert.equal(hints.getAdvice([],new Set(),false),null,'sem fios = sem botão');
assert.equal(hints.getAdvice([{a:'b1.POS',b:'b1.POS',loose:{end:'b'}}],new Set(),false),null,'fio solto não é erro confirmado');
assert.equal(hints.getAdvice([{a:'b1.NEG',b:'lm.INN'}],good([['b1.NEG','lm.INN']]),false),null,'fio correto não dá dica');
const lmError={a:'lm.OUTP',b:'esp.GND'};
const wrongMotor={a:'ml.A',b:'drv.IN1'};
const wrongGPIO={a:'esp.D19',b:'drv.IN4'};
const lm=hints.getAdvice([lmError],new Set(),false);
assert.equal(lm.number,1,'erro do LM é primeira etapa');
assert.equal(lm.repair,null,'sem verificador não deve inventar reparo');
assert.equal(lm.correct,null,'sem validar não deve informar pino como certo');
assert.match(lm.fallback,/gabarito/);
const motor=hints.getAdvice([wrongMotor],new Set(),true);
assert.equal(motor.number,2,'motor fica na etapa Ponte H');
assert.equal(motor.repair,null,'erro no motor também exige validação');
const gpio=hints.getAdvice([wrongGPIO],new Set(),false);
assert.equal(gpio.repair,null,'não sugerir GPIO sem avaliar ocupação');
const errors=[wrongMotor,lmError];
assert.equal(hints.getAdvice(errors,new Set(),false).category,'lm','na sequência pedagógica, LM vem antes do motor');
assert.equal(hints.getAdvice(errors,new Set(),false,undefined,0).category,'motor','fio selecionado usa sua própria dica');
const mixed=hints.getAdvice([wrongMotor,{a:'lm.OUTP',b:'esp.VIN'}],good([['lm.OUTP','esp.VIN']]),false);
assert.equal(mixed.category,'motor','conexão correta não substitui erro real');

// Geração de correção SOMENTE se o validador aprovar o destino.
function verified(w,from,to){
 const ports=[w.a,w.b,from,to,'lm.INN','esp.D32','esp.D27','drv.OUT1','drv.OUT2'];
 return hints.chooseRepair(w,0,false,[...new Set(ports)],(_index,end,next)=>
  w[end]===from&&next===to);
}
assert.deepEqual(verified({a:'b1.NEG',b:'lm.OUTP'},'lm.OUTP','lm.INN'),{
 end:'b',from:'lm.OUTP',to:'lm.INN',keep:'b1.NEG'
},'deve mover somente a ponta errada no LM');
assert.deepEqual(verified({a:'drv.IN3',b:'lm.OUTP'},'lm.OUTP','esp.D32'),{
 end:'b',from:'lm.OUTP',to:'esp.D32',keep:'drv.IN3'
},'deve preservar IN3 da ponte H');
assert.deepEqual(verified({a:'esp.D19',b:'drv.IN4'},'esp.D19','esp.D18')?.from,'esp.D19');
assert.equal(hints.chooseRepair({a:'lm.OUTP',b:'esp.GND'},0,false,
 ['esp.D32','lm.INN'],()=>false),null,'sem reparo validado, nada de pino inventado');
const restored=hints.getAdvice([{a:'b1.NEG',b:'lm.OUTP'}],new Set(),false,undefined,0,[],
 ()=>({from:'lm.OUTP',to:'lm.INN',keep:'b1.NEG',end:'b'}));
assert.equal(restored.from,'lm.OUTP');
assert.equal(restored.to,'lm.INN');
assert.equal(restored.keep,'b1.NEG');
const switchError=hints.getAdvice([{a:'s2.LEDG',b:'drv.VCC'}],new Set(),true);
assert.equal(switchError.category,'switchLed');
assert.equal(switchError.repair,null,'interruptor precisa de prova para sugerir pino');

const randomized=hints.createDelay(()=>0.6); // sorteio 7
assert.equal(randomized.target,7);
for(let n=1;n<=6;n++){
 randomized.record(true);
 assert.equal(randomized.visible(true),false,'não mostrar dica antes do sorteio: '+n);
}
randomized.record(true);
assert.equal(randomized.visible(true),true,'libera no 7º erro');
assert.equal(randomized.visible(false),false,'não mostra dica depois de consertar o fio');
randomized.clearIfResolved(false);
assert.equal(randomized.visible(true),false,'a próxima sequência volta a exigir tentativas');
const first=hints.createDelay(()=>0);
assert.equal(first.target,2,'nunca libera na primeira tentativa');
first.record(false);
assert.equal(first.attempts,0,'ligação correta não conta como erro');
first.record(true);
assert.equal(first.visible(true),false,'primeira tentativa errada não mostra dica');
first.record(true);
assert.equal(first.visible(true),true,'libera na segunda se esse foi o número sorteado');
const last=hints.createDelay(()=>0.999);
assert.equal(last.target,10,'pode sortear até 10 tentativas');

for(const script of ['app.js','app-mobile.js']){
 const src=fs.readFileSync(path.join(__dirname,'..',script),'utf8');
 assert.match(src,/function contextualWrongAdvice\(\)/,script+' usa a mesma lógica');
 assert.match(src,/updateContextualHint\(\)/,script+' atualiza visibilidade do botão');
 assert.match(src,/hintButton\.hidden=!advice/,'botão só aparece após a liberação e com erro');
 assert.match(src,/hintDelay\?\.record\(!correctWire\)/,'erros ao criar fio são contados');
 assert.match(src,/function validatedHintRepair\(/,'dicas exigem validação da troca real');
 assert.match(src,/hintDelay\?\.record\(!acceptedConnectionSet\(\)/,'reconexões erradas contam');
 assert.doesNotMatch(src,/Experimente ligar: /,'não revelar ligações faltantes em dicas');
}
const html=fs.readFileSync(path.join(__dirname,'..','editor.html'),'utf8');
assert.match(html,/<script src="step-hints\.js\?v=3"><\/script>/);
assert.match(html,/id="hintBtn"[^>]*hidden>/,'inicialmente oculto');
console.log('OK: ligações corrigidas com clareza e sorteio de 2 a 10 tentativas, PC e mobile.');
