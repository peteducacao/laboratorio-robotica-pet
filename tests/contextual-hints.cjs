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
assert.match(lm.detail,/OUT\+.*VIN/,'dica LM cita terminais de saída corretos');
assert.doesNotMatch(lm.detail,/MOTOR A/,'erro LM não fala do motor');
const motor=hints.getAdvice([wrongMotor],new Set(),true);
assert.equal(motor.number,2,'motor fica na etapa Ponte H');
assert.match(motor.detail,/MOTOR A.*OUT1.*OUT2/,'dica do motor é específica');
assert.doesNotMatch(motor.detail,/bateria 9 V/,'erro do motor não mostra dica LM');
const gpio=hints.getAdvice([wrongGPIO],new Set(),false);
assert.match(gpio.detail,/GPIOs 27, 26, 32 e 18/);
const errors=[wrongMotor,lmError];
assert.equal(hints.getAdvice(errors,new Set(),false).category,'lm','na sequência pedagógica, LM vem antes de motor');
assert.equal(hints.getAdvice(errors,new Set(),false,undefined,0).category,'motor','fio selecionado recebe dica de seu próprio erro');
const mixed=hints.getAdvice([wrongMotor,{a:'lm.OUTP',b:'esp.VIN'}],good([['lm.OUTP','esp.VIN']]),false);
assert.equal(mixed.category,'motor','uma ligação correta não substitui o erro real');
const switchError=hints.getAdvice([{a:'s2.LEDG',b:'drv.VCC'}],new Set(),true);
assert.match(switchError.detail,/LED−/,'não usar o contato da luz da gangorra');
for(const script of ['app.js','app-mobile.js']){
 const src=fs.readFileSync(path.join(__dirname,'..',script),'utf8');
 assert.match(src,/function contextualWrongAdvice\(\)/,script+' usa a mesma lógica');
 assert.match(src,/updateContextualHint\(\)/,script+' atualiza visibilidade do botão');
 assert.match(src,/hintButton\.hidden=!advice/,'botão só aparece se houver erro');
 assert.doesNotMatch(src,/Experimente ligar: /,'não revelar ligações faltantes em dicas');
}
const html=fs.readFileSync(path.join(__dirname,'..','editor.html'),'utf8');
assert.match(html,/<script src="step-hints\.js\?v=1"><\/script>/);
assert.match(html,/id="hintBtn"[^>]*hidden>/,'inicialmente oculto');
console.log('OK: sequência do gabarito e dicas de erros específicos, desktop e celular.');
