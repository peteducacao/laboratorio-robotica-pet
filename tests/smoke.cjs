// Teste funcional sem dependencias: node tests/smoke.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'app.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8');
new vm.Script(js);
const types=vm.runInNewContext('['+js.match(/const TYPES=\[([\s\S]*?)\];/)[1]+']');
const edges=vm.runInNewContext('['+js.match(/const EXPECTED=\[([\s\S]*?)\];/)[1]+']');
assert.equal(types.length,6);
assert.equal(types.reduce((sum,t)=>sum+t.ids.length,0),9);
assert.equal(edges.length,17);
const ports=new Set(types.flatMap(t=>t.ids.flatMap(id=>t.pins.map(p=>id+'.'+p[0]))));
for(const [a,b] of edges){assert(ports.has(a));assert(ports.has(b));}
assert.equal(new Set(edges.map(([a,b])=>[a,b].sort().join('|'))).size,17);
for(const id of ['catalog','viewport','world','partsLayer','wireSvg','track','playPanel','buildPanel','menuBtn','checkBtn','hintBtn','saveBtn'])assert(html.includes('id="'+id+'"'),id);
assert(css.includes('touch-action:none'));
const listeners={},nodes={},storage={};
class E{
 constructor(name){this.name=name;this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.hidden=false;this.disabled=false;this.children=[];this.textContent='';this.className='';this.value='';this.clientWidth=800;this.clientHeight=610;this.classList={add(){},remove(){},toggle(){},contains(){return false}};}
 addEventListener(type,fn){(listeners[this.name+':'+type]??=[]).push(fn);}
 append(...x){this.children.push(...x)}appendChild(x){this.children.push(x)}replaceChildren(...x){this.children=x}setAttribute(){}removeAttribute(){}
 querySelectorAll(){return []}
 getBoundingClientRect(){return {left:0,top:0,right:800,bottom:610,width:800,height:610}}
 getContext(){return new Proxy({},{get:()=>()=>{}})}
 closest(){return null}
}
const doc={
 getElementById(id){return nodes[id]??(nodes[id]=new E(id))},
 createElement(tag){return new E(tag)},
 createElementNS(ns,tag){return new E(tag)},
 createTextNode(t){return {textContent:t}},
 querySelectorAll(){return []},
 addEventListener(type,fn){(listeners['doc:'+type]??=[]).push(fn)},
 fonts:null
};
// Reproduz o atributo hidden inicial da seção de simulação no HTML.
doc.getElementById('playPanel').hidden=true;
const win={addEventListener(type,fn){(listeners['window:'+type]??=[]).push(fn)}};
const store={getItem(k){return storage[k]??null},setItem(k,v){storage[k]=v}};
const fake={window:win,document:doc,localStorage:store,requestAnimationFrame(){},ResizeObserver:class{observe(){}},console,Math,JSON,confirm(){return true},setTimeout(){return 1},clearTimeout(){}};
vm.runInNewContext(js,fake);
function send(event,fnKey,target){const handlers=listeners[fnKey+':'+event];assert(handlers?.length,fnKey+':'+event);handlers[0](target);}
const saved=()=>JSON.parse(storage['tinkerpet-v2']);
let pointer=0;
function add(kind){
 const id=++pointer;
 send('pointerdown','catalog',{button:0,pointerId:id,clientX:120,clientY:250,preventDefault(){},target:{closest(q){return q==='.catalog-card'?{disabled:false,dataset:{kind}}:null}}});
 send('pointerup','window',{pointerId:id,clientX:120,clientY:250});
}
function connect(a,b){
 for(const port of [a,b])send('click','partsLayer',{stopPropagation(){},target:{closest(sel){return sel==='[data-port]'?{dataset:{port}}:null}}});
}
function toggle(id){send('click','partsLayer',{target:{closest(sel){return sel==='[data-toggle]'?{dataset:{toggle:id}}:null}}});}
function click(id){send('click',id,{});}
assert.equal(saved().parts.length,0,'bancada deve começar vazia');
for(const t of types)for(let i=0;i<t.ids.length;i++)add(t.kind);
assert.equal(saved().parts.length,9,'adicionar 9 peças pelo catálogo');
add('esp');assert.equal(saved().parts.length,9,'evitar esp32 duplicado');
connect('esp.D27','drv.IN4');
click('checkBtn');
assert.equal(nodes.playPanel.hidden,true,'não liberar circuito com fio errado');
connect('esp.D27','drv.IN4');
for(const [a,b] of edges)connect(a,b);
assert.equal(saved().wires.length,17,'criar 17 fios');
toggle('s1');toggle('s2');
send('input','partsLayer',{target:{id:'voltageInput',value:'5'}});
click('checkBtn');
assert.equal(nodes.playPanel.hidden,false,'liberar pista com circuito correto');
assert.equal(nodes.trackLock.hidden,true,'retirar bloqueio da pista');
toggle('s1');
assert.equal(nodes.trackLock.hidden,false,'desligar gangorra bloqueia pista');
click('saveBtn');assert.equal(saved().parts.length,9,'persistir projeto');
console.log('PASS: bancada vazia, 9 peças, catálogo, limite, 17 fios, erro, 5 V, duas gangorras, pista e salvamento.');
