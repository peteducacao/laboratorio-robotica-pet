// Teste funcional sem dependencias: node tests/smoke.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'app.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8');
const answerKey=fs.readFileSync(path.join(base,'answer-key.js'),'utf8');
new vm.Script(answerKey);
new vm.Script(js);
const types=vm.runInNewContext('['+js.match(/const TYPES=\[([\s\S]*?)\];/)[1]+']');
const edges=vm.runInNewContext('['+js.match(/const EXPECTED=\[([\s\S]*?)\];/)[1]+']');
const esp=types.find(t=>t.kind==='esp');
assert.equal(esp.pins.length,30,'ESP32 precisa ter 30 contatos físicos na bancada');
assert(esp.pins.some(([id,label])=>id==='GND2'&&label==='GND'),'dois GND equivalentes');
const espArt=fs.readFileSync(path.join(base,'assets/esp32-devkit-v1-30p.svg'),'utf8');
for(const name of ['VIN','3V3','GND','D27','D26','D32','D18','D13','EN','D23']){
 assert(espArt.includes('>'+name+'</text>'),'nome '+name+' precisa estar impresso na placa');
}
assert.equal(types.find(t=>t.kind==='motor').name,'Motor DC','motor deve ser comum, não TT');
assert.equal(types.find(t=>t.kind==='motor').img,'assets/motor-frontal.svg');
const front=fs.readFileSync(path.join(base,'assets/motor-frontal.svg'),'utf8');
const side=fs.readFileSync(path.join(base,'assets/motor-lateral.svg'),'utf8');
assert(front.includes('Motor DC'),'imagem frontal do motor');
assert(front.includes('terminals')||front.includes('terminais'),'vista frontal com terminais');
assert(side.includes('Motor DC')&&side.includes('terminais'),'vista lateral com terminais');
assert(js.includes('function toggleMotorView('),'alternar vistas do motor');

assert(html.includes('id="preview-ml"')&&html.includes('id="preview-mr"'),'painel dos dois motores');
assert(css.includes('.demo-running')&&css.includes('motor-shaft-spinner'),'prévia do eixo animado');
for(const file of ['mx1508-desenhado.svg','lm2596-desenhado.svg','bateria-9v-desenhada.svg','gangorra-desenhada.svg']){
 const svg=fs.readFileSync(path.join(base,'assets',file),'utf8');
 assert(svg.includes('<svg')&&svg.includes('</svg>'),file+' presente');
}
for(const kind of ['driver','buck','battery','switch'])assert(types.find(t=>t.kind===kind).img.startsWith('assets/'),kind+' usa desenho vetorial');

const sw=types.find(t=>t.kind==='switch');
assert.equal(sw.pins.length,3,'chave gangorra com 3 terminais');
assert(sw.pins.some(([id])=>id==='LEDG'),'pino de negativo do LED da gangorra');
const rocker=fs.readFileSync(path.join(base,'assets/gangorra-desenhada.svg'),'utf8');
assert(rocker.includes('três terminais'),'gangorra desenhada com três contatos');
const lm=fs.readFileSync(path.join(base,'assets/lm2596-desenhado.svg'),'utf8');
for(const v of ['470','>220<','>100<','STEP-DOWN'])assert(!lm.includes(v),'LM2596 não repete '+v);
const drv=fs.readFileSync(path.join(base,'assets/mx1508-desenhado.svg'),'utf8');
assert(!drv.includes('100</text>')&&!drv.includes('16V'),'MX1508 sem legendas de capacitor');
const battery=fs.readFileSync(path.join(base,'assets/bateria-9v-desenhada.svg'),'utf8');
assert(battery.includes('#d83b3c')&&battery.includes('#1f2b34'),'polos da bateria vermelho/preto');
assert(js.includes('wire-end-cap'),'contatos visuais dos fios presos ao borne');
assert(css.includes('.wire-svg{z-index:8;pointer-events:none}'),'fios desenhados sobre componentes');
assert.equal(types.length,6);
assert.equal(types.reduce((sum,t)=>sum+t.ids.length,0),9);
assert.equal(edges.length,17);
// Os quatro comandos e as saídas do MX1508 são conferidos com a imagem de referência.
// As chaves e baterias devem continuar sendo as peças originais do TinkerPET.
for(const [origin,target] of [
 ['esp.D27','drv.IN1'],['esp.D26','drv.IN2'],
 ['esp.D32','drv.IN3'],['esp.D18','drv.IN4'],
 ['drv.OUT1','ml.A'],['drv.OUT2','ml.B'],
 ['drv.OUT3','mr.A'],['drv.OUT4','mr.B'],
 ['b1.POS','s1.IN'],['s1.OUT','lm.INP'],
 ['b2.POS','s2.IN'],['s2.OUT','drv.VCC']
])assert(edges.some(([a,b])=>a===origin&&b===target),'ligação da referência: '+origin+' → '+target);
const ports=new Set(types.flatMap(t=>t.ids.flatMap(id=>t.pins.map(p=>id+'.'+p[0]))));
for(const [a,b] of edges){assert(ports.has(a));assert(ports.has(b));}
assert.equal(new Set(edges.map(([a,b])=>[a,b].sort().join('|'))).size,17);
for(const id of ['catalog','viewport','world','partsLayer','wireSvg','track','playPanel','buildPanel','menuBtn','checkBtn','hintBtn','saveBtn'])assert(html.includes('id="'+id+'"'),id);
assert(css.includes('touch-action:none'));
assert(html.includes('id="redoBtn"')&&html.includes('id="wireColorSelect"'),'toolbar contém refazer e seletor');
assert(html.includes('class="simulation-toggle"'),'simulação está na barra superior');
assert(html.includes('id="progressBar"')&&html.indexOf('id="progressBar"')<html.indexOf('id="viewport"'),'progresso agora está acima da bancada');
assert(css.includes('.simulation-toggle.is-running'),'estado vermelho de parar simulação');
assert(css.includes('.wire-line.wire-pending{stroke-width:10'),'fio grosso contínuo');

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
function send(event,fnKey,target){const handlers=listeners[fnKey+':'+event];assert(handlers?.length,fnKey+':'+event);for(const handler of handlers)handler(target);}
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
assert(html.includes('id="openComponentPicker"'),'botão + central na área vazia');
assert(!html.includes('BANCADA VIRTUAL'),'etiqueta de bancada removida');
assert(css.includes('.world-note[hidden]{display:none!important}'),'botão central desaparece após adicionar peça');
click('openComponentPicker');
assert.equal(nodes.sideBackdrop.hidden,false,'+ abre a gaveta de peças');
click('closeLibrary');
assert.equal(nodes.sideBackdrop.hidden,true,'gaveta pode ser fechada');
assert.equal(saved().parts.length,0,'bancada deve começar vazia');
for(const t of types)for(let i=0;i<t.ids.length;i++)add(t.kind);
assert.equal(saved().parts.length,9,'adicionar 9 peças pelo catálogo');
click('undoBtn');
assert.equal(saved().parts.length,8,'Desfazer remove última peça');
click('redoBtn');
assert.equal(saved().parts.length,9,'Refazer restaura a peça');
send('change','wireColorSelect',{target:{value:'#316fc0'}});
assert.equal(saved().wireColor,'#316fc0','seletor muda cor dos fios');
send('change','wireColorSelect',{target:{value:'#ed654d'}});
assert.equal(saved().wireColor,'#ed654d','seletor restaura vermelho');
send('click','inspectorBody',{target:{closest(q){return q==='[data-motor-view]'?{dataset:{motorView:'ml'}}:null;}}});
assert.equal(saved().parts.find(p=>p.id==='ml').view,'side','trocar para vista lateral');
send('click','inspectorBody',{target:{closest(q){return q==='[data-motor-view]'?{dataset:{motorView:'ml'}}:null;}}});
assert.equal(saved().parts.find(p=>p.id==='ml').view,'front','voltar para vista frontal');
add('esp');assert.equal(saved().parts.length,9,'evitar esp32 duplicado');

// Testa o fluxo real de toque: pino inicial → dois cliques na bancada → pino final.
function tapPin(port){
 const id=++pointer;
 const target={closest(sel){return sel==='[data-port]'?{dataset:{port}}:null}};
 send('pointerdown','partsLayer',{button:0,pointerId:id,clientX:100,clientY:100,target});
 send('pointerup','window',{pointerId:id,clientX:100,clientY:100});
 send('click','partsLayer',{target,stopPropagation(){}});
}
function tapCanvas(x,y){
 const id=++pointer;
 send('pointerdown','viewport',{button:0,pointerId:id,clientX:x,clientY:y,preventDefault(){},target:{closest(){return null}}});
 send('pointerup','window',{pointerId:id,clientX:x,clientY:y});
}
tapPin('b1.POS');
assert.equal(saved().wires.length,0,'primeiro pino não fecha a ligação');
tapCanvas(205,180);
tapCanvas(295,240);
assert.equal(saved().wires.length,0,'curvas devem ficar pendentes até o segundo pino');
tapPin('s1.IN');
assert.equal(saved().wires.length,1,'segundo pino finaliza ligação');
assert.equal(saved().wires[0].via.length,2,'guardar duas curvas');
const bends=saved().wires[0].via;
assert(bends[0].x===bends[1].x||bends[0].y===bends[1].y,'curva nova prolonga apenas a ponta, sem diagonais');
const curved=JSON.stringify(saved().wires[0].via);
click('saveBtn');
assert.equal(JSON.stringify(saved().wires[0].via),curved,'persistir curvas da ligação');
send('click','wireSvg',{stopPropagation(){},target:{closest(sel){return sel==='[data-wire-index]'?{dataset:{wireIndex:'0'}}:null;}}});
assert.equal(nodes.deleteBtn.disabled,false,'selecionar um fio ativa o botão Excluir');
click('deleteBtn');
assert.equal(saved().wires.length,0,'Excluir apaga o fio selecionado');
connect('b1.POS','s1.IN');
assert.equal(saved().wires.length,1,'refazer conexão após exclusão');
assert(!js.includes("setAttribute('stroke-dasharray'"),'nenhum fio tracejado');
assert(js.includes("hit.dataset.wireIndex=String(i)"),'fio tem área clicável própria');
assert(js.includes("setAttribute('r','10')")===false,'encaixe da ponta do jumper não fica como bola gigante');
assert(js.includes("node.setAttribute('stroke','none')"),'pino fica preenchido sem aro branco');
assert(js.includes("projectFromTip(last,{x,y},previousWirePoint())"),'curva respeita sentido da última ponta');
assert(js.includes('function nearestPort('),'pino atrai fio quando ponta está próxima');
assert(js.includes('function wireAt('),'seleciona fio por toque no caminho');
assert(html.includes('answer-key.js?v='),'gabarito carrega na bancada');
assert(answerKey.includes("value!=='peteduca'"),'gabarito requer senha');
assert(answerKey.includes("TinkerPET-gabarito.svg"),'gabarito pode ser baixado');
connect('b1.POS','s1.IN'); // remove a ligação de teste antes da montagem completa
assert.equal(saved().wires.length,0,'fio existente pode ser removido');

connect('esp.D27','drv.IN4');
click('checkBtn');
assert.equal(nodes.playPanel.hidden,true,'não liberar circuito com fio errado');
connect('esp.D27','drv.IN4');
for(const [a,b] of edges)connect(a,a==='lm.OUTN'?'esp.GND2':b); // usar o segundo GND real e validar equivalência
assert.equal(saved().wires.length,17,'criar 17 fios');
// LED extra é opcional: mantém a validação de 17 fios necessários.
connect('b1.NEG','s1.LEDG');assert.equal(saved().wires.length,18,'terceiro pino aceita retorno para LED');
toggle('s1');toggle('s2');

send('input','partsLayer',{target:{id:'voltageInput',value:'5'}});
click('checkBtn');
assert.equal(nodes.playPanel.hidden,false,'liberar pista com circuito correto');
assert.equal(nodes.trackLock.hidden,true,'retirar bloqueio da pista');
assert.equal(nodes.simLabel.textContent,'Parar simulação','botão muda para Parar simulação');
click('checkBtn');
assert.equal(nodes.playPanel.hidden,true,'Parar simulação retorna à bancada');
assert.equal(nodes.simLabel.textContent,'Iniciar simulação','botão volta a Iniciar simulação');
click('checkBtn');
assert.equal(nodes.playPanel.hidden,false,'simulação pode reiniciar');
toggle('s1');
assert.equal(nodes.trackLock.hidden,false,'desligar gangorra bloqueia pista');
click('saveBtn');assert.equal(saved().parts.length,9,'persistir projeto');
assert(html.includes('id="zoomSlider"')&&html.includes('id="zoomTool"'),'lupa e barra de zoom presentes');
assert(!js.includes("title.textContent=partName(p.id)"),'sem nome flutuante no topo das peças');
assert(!rocker.includes('>IN</text>')&&!rocker.includes('>OUT</text>')&&!rocker.includes('>LED−</text>'),'gangorra sem nomes impressos');
assert(!lm.includes('<ellipse'),'LM2596 sem componentes redondos centrais');
assert(!drv.includes('<ellipse')&&!drv.includes('y="216" width="15"'),'MX1508 sem peças redondas e três traços');
const beforeZoom=Number(nodes.zoomSlider.value);
const pinchEvent=(pointerId,x,y)=>({pointerType:'touch',pointerId,clientX:x,clientY:y,button:0,preventDefault(){},target:{closest(){return null}}});
send('pointerdown','viewport',pinchEvent(9001,100,100));
send('pointerdown','viewport',pinchEvent(9002,200,100));
send('pointermove','window',pinchEvent(9002,260,100));
assert(Number(nodes.zoomSlider.value)>beforeZoom,'pinça com dois dedos amplia');
send('pointerup','window',pinchEvent(9002,260,100));
send('pointerup','window',pinchEvent(9001,100,100));
send('input','zoomSlider',{target:{value:'25'}});
assert.equal(nodes.zoomSlider.value,'25','lupa permite reduzir o zoom até 25%');
send('click','zoomFitAll',{});
assert(Number(nodes.zoomSlider.value)>=17,'enquadramento calcula um zoom válido');


 // Gabarito: testa abertura, senha, 17 linhas, download, impressão e bloqueio ao reabrir.
 class KeyNode {
  constructor(name){this.name=name;this.events={};this.children=[];this.hidden=false;this.open=false;this.value='';this.textContent='';this.style={setProperty(){}};}
  addEventListener(type,fn){this.events[type]=fn;}
  setAttribute(){}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  querySelector(selector){return keyNode(selector.slice(1));}
  insertBefore(child){this.children.unshift(child);}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  click(){this.events.click?.({preventDefault(){}});}
  remove(){}
 }
 const keyNodes=new Map();
 const keyNode=id=>{if(!keyNodes.has(id))keyNodes.set(id,new KeyNode(id));return keyNodes.get(id);};
 const keyDoc={
  createElement(name){const node=new KeyNode(name);if(name==='dialog')keyNodes.set('dialogRoot',node);return node;},
  querySelector(query){return query==='.header-end'?keyNode('headerEnd'):null;},
  body:keyNode('keyBody')
 };
 let downloaded=null,printed=false;
 const keyWindow={tinkerpetAnswerData:win.tinkerpetAnswerData,print(){printed=true}};
 vm.runInNewContext(answerKey,{
  window:keyWindow,document:keyDoc,Blob,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:gabarito'},revokeObjectURL(){}},
  setTimeout(){return 1}
 });
 assert.equal(keyDoc.querySelector('.header-end').children.length,1,'botão Gabarito aparece no cabeçalho');
 const answerButton=keyDoc.querySelector('.header-end').children[0];
 const keyDialog=keyNode('dialogRoot');
 answerButton.click();
 assert.equal(keyDialog.open,true,'gabarito abre na bancada');
 assert.equal(keyNode('answerContent').hidden,true,'conteúdo fica protegido até digitar senha');
 keyNode('answerPassword').value='nao-e-a-senha';
 keyNode('answerForm').events.submit({preventDefault(){}});
 assert.equal(keyNode('answerContent').hidden,true,'senha incorreta não revela conteúdo');
 assert(keyNode('answerError').textContent.includes('incorreta'),'senha incorreta dá aviso');
 keyNode('answerPassword').value='peteduca';
 keyNode('answerForm').events.submit({preventDefault(){}});
 assert.equal(keyNode('answerContent').hidden,false,'senha correta revela gabarito');
 const svgBancada=keyNode('answerDiagram').innerHTML;
 assert(svgBancada.includes('<svg'),'gabarito abre circuito visual SVG na própria janela');
 assert.equal((svgBancada.match(/<image /g)||[]).length,9,'gabarito visual apresenta exatamente 9 componentes desenhados');
 assert.equal((svgBancada.match(/stroke-width="17" stroke-linejoin/g)||[]).length,17,'17 contornos de fios');
 assert.equal((svgBancada.match(/stroke-width="10" stroke-linejoin/g)||[]).length,17,'17 fios visíveis entre os terminais');
 assert(svgBancada.includes('esp32-devkit-v1-30p.svg'),'usa a mesma imagem ESP32 do laboratório');
 assert(svgBancada.includes('mx1508-desenhado.svg'),'usa a ponte H da bancada real');
 assert(!svgBancada.includes('NaN')&&!svgBancada.includes('undefined'),'nenhum terminal ficou sem posição');
 const visualWires=[...svgBancada.matchAll(/<path d="([^"]+)" fill="none" stroke="(#[a-fA-F0-9]{6})" stroke-width="10"/g)];
 assert.equal(visualWires.length,17,'gabarito usa os 17 fios do projeto');
 for(const wire of visualWires){
  const points=[...wire[1].matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(match=>[Number(match[1]),Number(match[2])]);
  assert(points.length>=2,'cada fio possui terminais e rota');
  for(let i=1;i<points.length;i++){
   const dx=Math.abs(points[i][0]-points[i-1][0]);
   const dy=Math.abs(points[i][1]-points[i-1][1]);
   assert(dx<.01||dy<.01,'gabarito não usa diagonais nas ligações');
  }
 }
 for(const asset of ['bateria-9v-desenhada.svg','gangorra-desenhada.svg','motor-frontal.svg']){
  assert(svgBancada.includes(asset),'gabarito usa o componente original '+asset);
 }
 assert.equal(new Set(visualWires.map(w=>w[2])).size,17,'cada uma das 17 ligações possui cor diferenciada');
 assert(svgBancada.includes('>IN</text>')&&svgBancada.includes('>OUT</text>')&&svgBancada.includes('>LED−</text>'),'gabarito identifica os pinos das duas gangorras');
 const filterBtns=keyNode('answerFilters').children;
 assert.equal(filterBtns.length,6,'seis opções de visualização do circuito');
 const countVisible=()=>((keyNode('answerDiagram').innerHTML.match(/stroke-width="10" stroke-linejoin/g)||[]).length);
 const motor1=filterBtns.find(b=>b.textContent==='Motor 1');
 motor1.click();assert.equal(countVisible(),2,'filtro motor 1 oculta os outros quinze fios');
 assert.equal(keyNode('answerWirePicker').children.length,2,'motor 1 oferece seus dois fios separadamente');
 keyNode('answerWirePicker').children[0].click();
 assert.equal(countVisible(),1,'toque no fio destaca só aquela conexão');
 assert(keyNode('answerSelectedInfo').textContent.includes('Motor 1'),'fio selecionado exibe origem e destino');
 keyNode('answerWirePicker').children[0].click();
 assert.equal(countVisible(),2,'segundo toque restaura o grupo');
 keyNode('answerFilters').children.find(b=>b.textContent==='Motor 2').click();
 assert.equal(countVisible(),2,'motor 2 tem grupo próprio');
 assert(!keyNode('answerDiagram').innerHTML.includes('stroke="#107b50" stroke-width="10"'),'motor 2 não compartilha os fios verdes do motor 1');
 keyNode('answerFilters').children.find(b=>b.textContent==='Comandos').click();
 assert.equal(countVisible(),4,'filtro de comando mostra quatro GPIOs e somente eles');
 keyNode('answerFilters').children.find(b=>b.textContent==='Energia ESP32').click();
 assert.equal(countVisible(),5,'filtro de alimentação ESP32 mostra os cinco fios');
 keyNode('answerFilters').children.find(b=>b.textContent==='Tudo').click();
 assert.equal(countVisible(),17,'voltar à visão geral recupera as 17 ligações');
 assert(!keyNode('answerDetails').open,'resumo em texto começa recolhido');

 assert.equal(keyNode('answerGroups').children.length,4,'quatro grupos de conexões');
 assert.equal(keyNode('answerGroups').children.reduce((n,g)=>n+g.children.filter(c=>c.className==='answer-row').length,0),17,'gabarito mostra 17 fios');
 keyNode('answerDownload').click();
 assert(downloaded&&downloaded.size>4000,'download SVG tem conteúdo vetorial');
 keyNode('answerPrint').click();
 assert(printed,'gabarito oferece imprimir / salvar PDF');
 keyNode('answerClose').click();
 assert.equal(keyDialog.open,false,'gabarito fecha');
 answerButton.click();
 assert.equal(keyNode('answerContent').hidden,true,'nova abertura pede senha novamente');

console.log('PASS: bancada vazia, 9 peças, catálogo, limite, 17 fios, erro, 5 V, duas gangorras, pista e salvamento.');
