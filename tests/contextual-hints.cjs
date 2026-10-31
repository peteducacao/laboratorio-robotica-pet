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
assert.match(lm.correct,/lm.OUTP.*esp.VIN/,'dica LM cita a ligação correta');
assert.doesNotMatch(lm.correct,/drv.OUT/,'erro LM não fala do motor');
const motor=hints.getAdvice([wrongMotor],new Set(),true);
assert.equal(motor.number,2,'motor fica na etapa Ponte H');
assert.match(motor.correct,/drv.OUT[1-4]/,'dica do motor indica um borne válido da ponte H');
assert.doesNotMatch(motor.correct,/b1.NEG/,'erro do motor não mostra dica LM');
const gpio=hints.getAdvice([wrongGPIO],new Set(),false);
assert.match(gpio.correct,/esp.D18.*drv.IN4|drv.IN4.*esp.D18/,'GPIO incorreto aponta o sinal esperado');
const errors=[wrongMotor,lmError];
assert.equal(hints.getAdvice(errors,new Set(),false).category,'lm','na sequência pedagógica, LM vem antes de motor');
assert.equal(hints.getAdvice(errors,new Set(),false,undefined,0).category,'motor','fio selecionado recebe dica de seu próprio erro');
const mixed=hints.getAdvice([wrongMotor,{a:'lm.OUTP',b:'esp.VIN'}],good([['lm.OUTP','esp.VIN']]),false);
assert.equal(mixed.category,'motor','uma ligação correta não substitui o erro real');
const switchError=hints.getAdvice([{a:'s2.LEDG',b:'drv.VCC'}],new Set(),true);
assert.match(switchError.correct,/s2.(?:IN|OUT)/,'o contato LED− não é usado como comutação');

// A dica corrige o terminal envolvido no fio real, não uma ligação genérica.
const batteryMistake=hints.getAdvice([{a:'b1.NEG',b:'lm.OUTP'}],new Set(),false);
assert.equal(batteryMistake.what,'b1.NEG → lm.OUTP');
assert.equal(batteryMistake.correct,'b1.NEG → lm.INN');
assert.equal(lm.correct,'lm.OUTP → esp.VIN');
assert.equal(hints.getAdvice([{a:'lm.OUTP',b:'esp.GND'}],new Set(),false).correct,'lm.OUTP → esp.VIN');
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
 assert.match(src,/hintDelay\?\.record\(!acceptedConnectionSet\(\)/,'reconexões erradas contam');
 assert.doesNotMatch(src,/Experimente ligar: /,'não revelar ligações faltantes em dicas');
}
const html=fs.readFileSync(path.join(__dirname,'..','editor.html'),'utf8');
assert.match(html,/<script src="step-hints\.js\?v=2"><\/script>/);
assert.match(html,/id="hintBtn"[^>]*hidden>/,'inicialmente oculto');
console.log('OK: ligações corrigidas com clareza e sorteio de 2 a 10 tentativas, PC e mobile.');
