// Testes de fumaça sem dependências externas. Execute: node tests/smoke.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
new vm.Script(src);
const parts=vm.runInNewContext('['+src.match(/const P=\[([\s\S]*?)\];/)[1]+']');
const expected=vm.runInNewContext('['+src.match(/const E=\[([\s\S]*?)\];/)[1]+']');
const available=new Set(parts.flatMap(p=>p.pins.map(pin=>p.id+'.'+pin[0])));
assert.equal(parts.length,9);
assert.equal(expected.length,17);
assert.equal(new Set(expected.map(([a,b])=>[a,b].sort().join('|'))).size,expected.length);
for(const [a,b] of expected){assert(available.has(a));assert(available.has(b));}
for(const name of ['buildView','driveView','board','track','modules','nextBtn','resetBtn','wireCount','progressLabel']) assert(page.includes('id="'+name+'"'));
function environment(memory={}){
 const listeners={};const nodes={};
 class Element{
  constructor(id){this.id=id;this.dataset={};this.style={};this.hidden=false;this.textContent='';this.innerHTML='';this.clientWidth=900;this.clientHeight=900;this.classList={add(){},remove(){},toggle(){}};}
  addEventListener(event,cb){(listeners[this.id+':'+event]??=[]).push(cb);}
  setAttribute(){} removeAttribute(){} replaceChildren(){} append(){} appendChild(){}
  querySelectorAll(){return []}
  getBoundingClientRect(){return {left:0,top:0,right:900,bottom:900,width:900,height:900}}
  getContext(){return new Proxy({},{get:()=>()=>{}})}
 }
 const document={getElementById(id){return nodes[id]??(nodes[id]=new Element(id))},querySelectorAll(){return []},querySelector(){return new Element('query')},createElement(){return new Element('new')},createElementNS(){return new Element('new-svg')},addEventListener(e,cb){(listeners['document:'+e]??=[]).push(cb)}};
 const window={innerWidth:390,addEventListener(e,cb){(listeners['window:'+e]??=[]).push(cb)}};
 const localStorage={getItem(k){return memory[k]??null},setItem(k,v){memory[k]=v}};
 vm.runInNewContext(src,{window,document,localStorage,requestAnimationFrame(){},ResizeObserver:class{observe(){}},confirm(){return true},setTimeout(){return 1},clearTimeout(){},console,Math,JSON});
 const sendPin=id=>listeners['modules:click'][0]({target:{closest(s){return s==='[data-pin]'?{dataset:{pin:id}}:null;}}});
 const toggle=id=>listeners['modules:click'][0]({target:{closest(s){return s==='[data-toggle]'?{dataset:{toggle:id}}:null;}}});
 const next=()=>listeners['nextBtn:click'][0]();
 const input=v=>listeners['modules:input'][0]({target:{id:'voltageInput',value:String(v)}});
 const saved=()=>JSON.parse(memory['labpet-carrinho-v1']);
 return {nodes,sendPin,toggle,next,input,saved,memory};
}
let app=environment();
app.sendPin('esp.D27');app.sendPin('drv.IN4'); // fio incorreto
app.next();app.next();app.next(); // tentar conferir
assert.equal(app.saved().tested,false);
assert.equal(app.saved().stage,2);
app.sendPin('esp.D27');app.sendPin('drv.IN4'); // remover fio ruim
for(const [a,b] of expected){app.sendPin(a);app.sendPin(b);}
app.toggle('s1');app.toggle('s2');app.input(5);
app.next();
assert.equal(app.saved().tested,true);
assert.equal(app.saved().stage,3);
assert.equal(app.nodes.progressLabel.textContent,'100%');
app=environment(app.memory); // simula F5
assert.equal(app.saved().tested,true);
assert.equal(app.saved().stage,3);
app.toggle('s1'); // desligar gangorra invalida teste
assert.equal(app.saved().tested,false);
console.log('OK: sintaxe, terminais, validacao, erro, 17 fios, 5 V, 2 chaves, desbloqueio, F5 e desligamento.');
