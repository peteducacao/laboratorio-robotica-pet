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
assert(css.includes('board-led-red')&&css.includes('board-led-blue'),'LED vermelho e Wi-Fi azul representados no ESP32');
assert(css.includes('part[data-kind="motor"].running .motor-shaft-spinner'),'motor DC tem rotação quando alimentado');
assert(css.includes('part .powered-tag'),'regulador e driver recebem status sem LED inventado');
assert(html.includes('id="openTrackBtn"')&&html.includes('id="liveCircuitStatus"'),'pista e aviso de alimentação separados');

for(const file of ['mx1508-desenhado.svg','lm2596-desenhado.svg','bateria-9v-desenhada.svg','gangorra-desenhada.svg']){
 const svg=fs.readFileSync(path.join(base,'assets',file),'utf8');
 assert(svg.includes('<svg')&&svg.includes('</svg>'),file+' presente');
}
for(const kind of ['driver','buck','battery','batteryPack','switch'])assert(types.find(t=>t.kind===kind).img.startsWith('assets/'),kind+' usa desenho vetorial');

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
assert(!js.includes("cap(a,w.color,'wire-end-cap')"),'nenhum círculo extra desenhado sobre o borne');
assert(css.includes('.wire-svg{z-index:8;pointer-events:none}'),'fios desenhados sobre componentes');

assert(html.includes('id="downloadBtn"'),'botão para baixar montagem presente');
assert(html.includes('id="copyBtn"')&&html.includes('id="pasteBtn"'),'botões copiar/colar próximos da lixeira');
assert(html.includes('class="studio-topbar"'),'ferramentas em painel superior único');
assert(html.includes('id="downloadBtn"')&&html.includes('aria-label="Baixar montagem"'),'download apenas ícone com nome acessível');
assert(html.includes('<svg viewBox="0 0 24 24"')&&html.includes('id="copyBtn"')&&html.includes('id="pasteBtn"'),'Copiar/Colar como ícones vetoriais alinhados');
assert(html.indexOf('wire-color-caption')<html.indexOf('wireColorPreview'),'texto Cor do fio fica antes da amostra');
assert(css.includes('grid-template-areas:"left zoom right"!important'),'zoom central e Dica/Simulação à direita');
assert(css.includes('.toolbar .download-btn span{display:none!important}'),'download sem texto visível');
assert(css.includes('visibility:hidden!important')&&css.includes('.library.open{'),'catálogo fica recolhido até abertura');
assert(css.includes('right:var(--catalog-width)!important'),'seta acompanha o catálogo à direita');
assert(css.includes('justify-items:center!important')&&css.includes('object-position:center center!important'),'cartões e imagens do catálogo centralizados');
assert(js.includes('function syncDrawerTop()'),'catálogo começa abaixo da barra de ferramentas');

assert(!html.includes('>PEÇAS</small>'),'alça do catálogo apresenta somente seta');
assert(css.includes('.part.selected::after,.part.selected::before{display:none!important;'),'peças sem moldura de seleção');
assert(css.includes('.wire-spark{'),'faíscas da ponta do jumper disponíveis');
assert(!espArt.includes('>ESPRESSIF<')&&!espArt.includes('2.4 GHz'),'módulo metálico sem texto interno');
assert.equal(types.length,7,'sete tipos: uma 9V e um suporte com seis pilhas');
assert.deepEqual([...types.find(t=>t.kind==='battery').ids],['b1'],'apenas uma bateria de 9V');
assert.deepEqual([...types.find(t=>t.kind==='batteryPack').ids],['b2'],'suporte de seis AA é a fonte da ponte H');
const packAsset=fs.readFileSync(path.join(base,'assets/suporte-6-pilhas.svg'),'utf8');
assert.equal((packAsset.match(/<g transform="translate\(/g)||[]).length,6,'suporte desenha exatamente seis pilhas');
assert(packAsset.includes('6 × AA · 9 V'),'suporte identifica seis AA de 1,5V');
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
// Hook somente para testes: inspeciona curvas pendentes, sem expor dados na aplicação.
const instrumented=js.replace(/\}\)\(\);\s*$/, "window.__pendingForTests=()=>({startPort:state.startPort,bends:state.bends.map(p=>({...p})),preview:previewPoint&&{...previewPoint},points:pendingWirePoints()});window.__powerForTests=()=>({live:powerStatus(),running:simulationRunning});window.__wireForTests=()=>({points:state.wires.map(w=>wirePoints(w)),align:wireAlignment,selected:state.selectedWire,zoom});window.__drawWireForTests=drawWires;})();");
assert.notEqual(instrumented,js,'instrumentação do teste de histórico aplicada');
vm.runInNewContext(instrumented,fake);
const pending=()=>win.__pendingForTests();
const power=()=>win.__powerForTests();
const wiresView=()=>win.__wireForTests();
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
// O catálogo não deve abrir teclado automaticamente no celular.
let autoFocuses=0,blurCalls=0;
nodes.componentSearch.focus=()=>{autoFocuses++;};
nodes.componentSearch.blur=()=>{blurCalls++;};
click('openComponentPicker');
assert.equal(autoFocuses,0,'abrir catálogo não ativa o teclado por foco automático');
click('closeLibrary');
assert(blurCalls>0,'fechar catálogo desfoca o campo de pesquisa');

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
// O canvas aceita coordenadas negativas e não corta o SVG nas bordas antigas.
assert(!js.includes("limit(p.x,0,WORLD"),'componentes não são limitados ao retângulo antigo');
assert(!js.includes("limit(Math.round(g.partX"),'arrasto não fica preso a limites');
assert(css.includes('.parts-layer,.wire-svg{overflow:visible!important}'),'fios e peças podem ultrapassar a área antiga');
assert(!html.includes('id="panModeBtn"'),'botão Mover redundante foi retirado');
function dragEsp(dx,dy){
 const id=++pointer;
 send('pointerdown','partsLayer',{button:0,pointerId:id,clientX:400,clientY:280,preventDefault(){},target:{closest(sel){return sel==='.part'?{dataset:{part:'esp'}}:null;}}});
 send('pointermove','window',{pointerId:id,clientX:400+dx,clientY:280+dy});
 send('pointerup','window',{pointerId:id,clientX:400+dx,clientY:280+dy});
}
const originalEsp=saved().parts.find(p=>p.id==='esp');
dragEsp(-5000,-4000);
assert(saved().parts.find(p=>p.id==='esp').x<0,'posições negativas são aceitas');
assert(saved().parts.find(p=>p.id==='esp').y<0,'peça pode subir além da origem');
dragEsp(12000,10000);
assert(saved().parts.find(p=>p.id==='esp').x>1900,'peça pode ir além da borda direita antiga');
assert(saved().parts.find(p=>p.id==='esp').y>1450,'peça pode ir além da borda inferior antiga');
click('undoBtn');click('undoBtn');
assert.equal(saved().parts.find(p=>p.id==='esp').x,originalEsp.x,'desfazer recupera posição anterior');

dragEsp(0,0); // Seleciona ESP32 sem deslocá-lo
click('copyBtn');
assert.equal(nodes.pasteBtn.disabled,false,'Copiar habilita Colar');
click('deleteBtn');
assert.equal(saved().parts.length,8,'Lixeira remove o componente selecionado');
click('pasteBtn');
assert.equal(saved().parts.length,9,'Colar recupera um ESP32 removido');
click('pasteBtn');
assert.equal(saved().parts.length,9,'Colar respeita limite original de uma ESP32');
const removedByDrop=++pointer;
doc.elementFromPoint=()=>({closest(sel){return sel==='#library,#drawerHandle'?{id:'library'}:null;}});
send('pointerdown','partsLayer',{button:0,pointerId:removedByDrop,clientX:420,clientY:290,
 target:{closest(sel){return sel==='.part'?{dataset:{part:'esp'}}:null;}},preventDefault(){}});
send('pointermove','window',{pointerId:removedByDrop,clientX:610,clientY:350});
send('pointerup','window',{pointerId:removedByDrop,clientX:610,clientY:350});
delete doc.elementFromPoint;
assert.equal(saved().parts.length,8,'arrastar componente para catálogo remove a peça');
click('undoBtn');
assert.equal(saved().parts.length,9,'desfazer recupera a peça devolvida ao catálogo');
assert(js.includes('function downloadWorkspace()'),'baixar montagem disponível no app');
assert(js.includes("canvas.toBlob(resolve,'image/png')"),'exporta imagem PNG da montagem');
assert(js.includes("downloadBlob(blob,'TinkerPET-montagem.svg')"),'SVG completo é alternativa ao PNG');

const panBefore=nodes.world.style.transform;
const beforeNaturalPanEsp=saved().parts.find(p=>p.id==='esp').x;
const naturalPanId=++pointer;
send('pointerdown','viewport',{button:0,pointerId:naturalPanId,clientX:270,clientY:250,preventDefault(){},target:{closest(){return null}}});
send('pointermove','window',{pointerId:naturalPanId,clientX:520,clientY:420});
send('pointerup','window',{pointerId:naturalPanId,clientX:520,clientY:420});
assert.equal(saved().parts.find(p=>p.id==='esp').x,beforeNaturalPanEsp,'arrastar fundo não move componentes');
assert.notEqual(nodes.world.style.transform,panBefore,'arrastar fundo move a bancada sem botão extra');
const wheelBefore=nodes.world.style.transform;
send('wheel','viewport',{deltaX:0,deltaY:240,shiftKey:false,ctrlKey:false,metaKey:false,clientX:400,clientY:300,preventDefault(){}});
assert.notEqual(nodes.world.style.transform,wheelBefore,'roda do mouse move a bancada');
const zoomBefore=Number(nodes.zoomSlider.value);
send('wheel','viewport',{deltaX:0,deltaY:-240,shiftKey:false,ctrlKey:true,metaKey:false,clientX:400,clientY:300,preventDefault(){}});
assert(Number(nodes.zoomSlider.value)>zoomBefore,'Ctrl e roda aplicam zoom na bancada');




// Dois duplos toques consecutivos no celular alternam entre zoom e vista anterior.
function doubleTap(x,y){
 for(let i=0;i<2;i++){
  const id=++pointer;
  send('pointerdown','viewport',{pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:y,preventDefault(){},target:{closest(){return null}}});
  send('pointerup','window',{pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:y,preventDefault(){}});
 }
}
const beforeDoubleTap=nodes.world.style.transform,initialDoubleZoom=Number(nodes.zoomSlider.value);
doubleTap(430,290);
assert(Number(nodes.zoomSlider.value)>initialDoubleZoom,'primeiro toque duplo amplia a bancada');
assert.notEqual(nodes.world.style.transform,beforeDoubleTap,'a câmera realmente se aproxima');
doubleTap(430,290);
assert.equal(nodes.world.style.transform,beforeDoubleTap,'segundo toque duplo restaura zoom e enquadramento');
assert.equal(Number(nodes.zoomSlider.value),initialDoubleZoom,'valor de zoom também é restaurado');
assert(css.includes('.pin-btn.connected:not(.selected)'),'pinos ligados não recebem aro verde');

const circleReset = css.slice(css.indexOf('/* v31 · Terminais SEM auréola.'));
assert(circleReset.length>3000,'o pacote de correção dos terminais está na folha de estilos');
for(const sel of [
 '#partsLayer .part .pin-btn:hover',
 '#partsLayer .part .pin-btn:focus',
 '#partsLayer .part .pin-btn:focus-visible',
 '#partsLayer .part .pin-btn.selected',
 '#partsLayer .part .pin-btn.connected',
 '#partsLayer .part .pin-btn.selected:hover',
 '#partsLayer .part .pin-btn.connected:focus-visible'
])assert(circleReset.includes(sel),'anel deve ser removido inclusive no estado: '+sel);
assert(circleReset.includes('background:transparent!important;'),'fundo de seleção do pino é transparente');
assert(circleReset.includes('outline:0!important;'),'nenhum contorno azul de foco nos pinos');
assert(circleReset.includes('box-shadow:none!important;'),'nenhum halo sombreado nos pinos');
assert(circleReset.includes('-webkit-tap-highlight-color:transparent!important;'),'toque no celular não desenha realce nativo');
assert(circleReset.includes('::before')&&circleReset.includes('::after'),'pseudo-elementos não desenham aro artificial');
assert(circleReset.includes('@media(max-width:760px)'),'a bancada ganha layout móvel dedicado');
assert(circleReset.includes('grid-template-areas:"tools" "zoom" "right"!important'),'celular estreito evita sobrepor zoom e ações');
assert(circleReset.includes('@media(max-width:449px)'),'breakpoint celular estreito controla terceira fileira');
assert(circleReset.includes('@media(min-width:450px) and (max-width:760px)'),'larguras maiores usam zoom centralizado e ações à direita');
assert(circleReset.includes('overflow-x:hidden!important'),'não há rolagem lateral de página');

assert(css.includes('.pin-btn.connected .pin-dot'),'terminais de motores e baterias mantêm cor neutra ao ligar');

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
const firstPortPos=pending().points[0];
assert.equal(pending().points.length,1,'a prévia começa apenas no pino, sem trecho curto artificial');
// O ponteiro anda livre: apenas uma linha do borne até sua posição, mesmo na diagonal.
send('pointermove','window',{pointerId:9877,clientX:580,clientY:315});
const straightPreview=pending().points;
assert.equal(straightPreview.length,2,'antes do clique o jumper tem somente uma linha reta');
assert.notEqual(straightPreview[1].x,firstPortPos.x,'ponta segue a posição horizontal do cursor');
assert.notEqual(straightPreview[1].y,firstPortPos.y,'ponta segue a posição vertical do cursor');
assert.equal(pending().bends.length,0,'movimentar o cursor não registra curva automaticamente');

// Enquanto um jumper está em andamento, Espaço + arrastar move a câmera.
send('keydown','doc',{key:' ',preventDefault(){},target:{closest(){return null}}});
const beforePendingPan=nodes.world.style.transform;
const panId=++pointer;
send('pointerdown','viewport',{button:0,pointerId:panId,clientX:250,clientY:260,preventDefault(){},target:{closest(){return null}}});
send('pointermove','window',{pointerId:panId,clientX:440,clientY:370});
send('pointerup','window',{pointerId:panId,clientX:440,clientY:370});
assert.notEqual(nodes.world.style.transform,beforePendingPan,'Espaço permite mover a câmera durante uma ligação');
send('keyup','doc',{key:' '});
tapCanvas(205,180);
assert.equal(pending().bends.length,1,'primeiro clique fixa um único vértice escolhido');
const frozenFirst=JSON.stringify(pending().bends);
assert.equal(pending().points.length,2,'após clique a ponta termina no vértice fixado');
send('pointermove','window',{pointerId:9878,clientX:750,clientY:540});
const freeTipA=pending().preview;
assert(freeTipA&&Number.isFinite(freeTipA.x),'ponta continua seguindo o mouse sem botão pressionado');
assert.equal(JSON.stringify(pending().bends),frozenFirst,'mover o mouse não altera o trecho já fixado');
assert.equal(pending().points.length,3,'após o clique surge apenas uma nova linha reta até o cursor');
send('pointermove','window',{pointerId:9878,clientX:695,clientY:510});
assert.notEqual(JSON.stringify(pending().preview),JSON.stringify(freeTipA),'ponta livre acompanha novo movimento do cursor');
tapCanvas(295,240);
assert.equal(saved().wires.length,0,'curvas devem ficar pendentes até o segundo pino');
assert.equal(pending().startPort,'b1.POS','primeiro terminal continua selecionado');
assert.equal(pending().bends.length,2,'cada clique da bancada fixa só uma curva');
const firstTrailLength=JSON.parse(JSON.stringify(pending().bends)).length;
const beforeUndoBends=JSON.stringify(pending().bends);
function shortcut(key,opts={}){
 let prevented=false;
 send('keydown','doc',{key,ctrlKey:true,shiftKey:!!opts.shiftKey,altKey:false,
  target:{closest(){return opts.editing?{}:null;}},preventDefault(){prevented=true;}});
 return prevented;
}
assert(shortcut('z'),'Ctrl+Z impede desfazer padrão do navegador na bancada');
assert.equal(pending().bends.length,1,'primeiro Ctrl+Z desfaz só a última curva fixada');
assert(shortcut('z'),'segundo Ctrl+Z é interceptado');
assert.equal(pending().bends.length,0,'segundo Ctrl+Z desfaz a curva anterior, sem apagar o fio iniciado');
assert.equal(pending().startPort,'b1.POS','origem ainda selecionada após desfazer curvas');
assert(shortcut('z'),'terceiro Ctrl+Z é interceptado');
assert.equal(pending().startPort,null,'terceiro Ctrl+Z desfaz a seleção do pino inicial');
assert(shortcut('y'),'Ctrl+Y refaz a primeira ação');
assert.equal(pending().startPort,'b1.POS','Ctrl+Y refaz a origem do jumper');
assert(shortcut('z',{shiftKey:true}),'Ctrl+Shift+Z refaz');
assert.equal(pending().bends.length,1,'Ctrl+Shift+Z refaz somente o clique anterior');
assert(shortcut('y'),'Ctrl+Y refaz a segunda curva');
assert.equal(JSON.stringify(pending().bends),beforeUndoBends,'refazer recompõe a rota exatamente');
const notPrevented=shortcut('z',{editing:true});
assert.equal(notPrevented,false,'Ctrl+Z no campo de texto preserva desfazer nativo');
assert.equal(pending().bends.length,firstTrailLength,'Ctrl+Z no campo de texto não mexe na bancada');
tapPin('s1.IN');
assert.equal(saved().wires.length,1,'segundo pino finaliza ligação');
assert(shortcut('z'),'Ctrl+Z também funciona após conexão terminada');
assert.equal(saved().wires.length,0,'desfazer conexão retorna jumper ao estado em construção');
assert.equal(pending().startPort,'b1.POS','desfazer conexão restaura pino inicial');
assert.equal(JSON.stringify(pending().bends),beforeUndoBends,'desfazer conexão restaura todas as curvas');
click('undoBtn');assert.equal(pending().bends.length,1,'botão Desfazer volta a última curva');
click('redoBtn');assert.equal(pending().bends.length,firstTrailLength,'botão Refazer recupera curva do jumper');
assert(shortcut('y'),'Ctrl+Y refaz a conexão');
assert.equal(saved().wires.length,1,'refazer restabelece o fio conectado');
assert.equal(pending().startPort,null,'ao refazer conexão não resta fio solto');

assert.equal(saved().wires[0].via.length,2,'guardar exatamente os dois vértices escolhidos');
const bends=saved().wires[0].via;
assert.equal(saved().wires[0].manual,true,'a conexão nova preserva rota manual sem curvas automáticas');
assert(js.includes('manual:w.manual===true'),'ligações manuais mantêm tipo de rota após recarregar do armazenamento');
assert(js.includes('w.manual?manualWirePoints(a,w.via||[],b)'),'rota manual é desenhada sem dobrar automaticamente');
assert(js.includes('w.manual?wirePath(manualWirePoints(from,w.via||[],to))'),'exportação respeita formato reto da rota manual');
assert(js.includes('manual:true'),'conexão criada armazena o traçado livre');

assert.notEqual(bends[0].x,bends[1].x,'trechos diagonais são permitidos entre cliques');
assert.notEqual(bends[0].y,bends[1].y,'trechos seguem cursor sem dobrar sozinhos');
const curved=JSON.stringify(saved().wires[0].via);
click('saveBtn');
assert.equal(JSON.stringify(saved().wires[0].via),curved,'persistir curvas da ligação');
send('click','wireSvg',{stopPropagation(){},target:{closest(sel){return sel==='[data-wire-index]'?{dataset:{wireIndex:'0'}}:null;}}});
assert.equal(nodes.deleteBtn.disabled,false,'selecionar um fio ativa o botão Excluir');
click('deleteBtn');
assert.equal(saved().wires.length,0,'Excluir apaga o fio selecionado');
connect('b1.POS','s1.IN');
assert.equal(saved().wires.length,1,'refazer conexão após exclusão');
win.__drawWireForTests();
assert(nodes.wireSvg.children.some(child=>child.dataset.wireIndex==='0'&&child.dataset.wireSegment==='0'),'jumper reto também recebe alvo de arraste próprio');
const beforeMoveParts=JSON.stringify(saved().parts);
const beforeMoveWire=JSON.stringify(saved().wires[0]);
const fixedStart=wiresView().points[0][0],fixedEnd=wiresView().points[0].at(-1);
const segmentGesture=++pointer;
let wireDownPrevented=false,wireDownStopped=false;
send('pointerdown','wireSvg',{button:0,pointerId:segmentGesture,clientX:230,clientY:190,
 preventDefault(){wireDownPrevented=true},stopPropagation(){wireDownStopped=true},
 target:{closest(sel){return sel==='[data-wire-index]'?{dataset:{wireIndex:'0',wireSegment:'0'}}:null}}});
assert(wireDownPrevented&&wireDownStopped,'clicar no segmento inicia o arraste sem mover a bancada');
assert.equal(wiresView().selected,0,'jumper selecionado para ajuste');
send('pointermove','window',{pointerId:segmentGesture,clientX:230,clientY:266});
assert(wiresView().points[0].length>=4,'arrastar linha reta cria dois cotovelos para manter as extremidades');
assert.deepEqual(wiresView().points[0][0],fixedStart,'jumper permanece no pino de origem ao arrastar');
assert.deepEqual(wiresView().points[0].at(-1),fixedEnd,'jumper permanece no pino de destino ao arrastar');
send('pointerup','window',{pointerId:segmentGesture,clientX:230,clientY:266});
assert.notEqual(JSON.stringify(saved().wires[0]),beforeMoveWire,'novo caminho do jumper salvo');
assert.equal(saved().wires[0].manual,true,'fio antigo fica editável após arrastar');
assert.equal(JSON.stringify(saved().parts),beforeMoveParts,'arrastar jumper não movimenta bateria, ESP32 ou outras peças');
assert.equal(wiresView().align,null,'guia desaparece depois de soltar fio');
click('undoBtn');
assert.equal(JSON.stringify(saved().wires[0]),beforeMoveWire,'desfazer recupera o traçado anterior do jumper');
click('redoBtn');
assert.notEqual(JSON.stringify(saved().wires[0]),beforeMoveWire,'refazer recupera o trecho ajustado');
click('undoBtn');
const b1Before=JSON.parse(JSON.stringify(saved().parts.find(p=>p.id==='b1')));
const s1Before=JSON.parse(JSON.stringify(saved().parts.find(p=>p.id==='s1')));
const pieceGesture=++pointer;
send('pointerdown','partsLayer',{button:0,pointerId:pieceGesture,clientX:300,clientY:220,preventDefault(){},
 target:{closest(sel){return sel==='.part'?{dataset:{part:'b1'}}:null}}});
send('pointermove','window',{pointerId:pieceGesture,clientX:395,clientY:268});
send('pointerup','window',{pointerId:pieceGesture,clientX:395,clientY:268});
assert.notEqual(saved().parts.find(p=>p.id==='b1').x,b1Before.x,'arrastar bateria muda sua posição');
assert.deepEqual(saved().parts.find(p=>p.id==='s1'),s1Before,'arrastar bateria não desloca a gangorra');
assert.deepEqual(wiresView().points[0].at(-1),fixedEnd,'o destino do fio fica preso à gangorra parada');
assert.notDeepEqual(wiresView().points[0][0],fixedStart,'a origem do fio acompanha a bateria movida');
click('undoBtn');
assert.equal(saved().parts.find(p=>p.id==='b1').x,b1Before.x,'desfazer recupera posição da bateria');
assert.deepEqual(wiresView().points[0][0],fixedStart,'fio acompanha bateria também ao desfazer');
assert(css.includes('.wire-alignment-guide')&&css.includes('.wire-alignment-label'),'guia de alinhamento do jumper está estilizada');
assert(js.includes("hit.dataset.wireSegment=String(seg)"),'cada segmento recebe alvo próprio para arraste');
assert(js.includes("function moveWireSegment("),'geometria do jumper pode ser reposicionada');
assert(js.includes("function anchoredWireBends("),'cotovelos próximos aos bornes acompanham peça arrastada');
assert(css.includes("cursor:grab!important"),'o cursor indica que o fio pode ser arrastado');
assert(js.includes("movedA.y=movedB.y=guideValue")&&js.includes("movedA.x=movedB.x=guideValue"),'o guia endireita segmentos horizontais ou verticais');


assert(!js.includes("setAttribute('stroke-dasharray'"),'nenhum fio tracejado');
assert(js.includes("hit.dataset.wireIndex=String(i)"),'fio tem área clicável própria');
assert(js.includes("setAttribute('r','10')")===false,'encaixe da ponta do jumper não fica como bola gigante');
assert(js.includes("// O traço termina no furo do pino; nenhum círculo"),'jumper termina no terminal sem círculo extra');
assert(js.includes("const pts=pendingWirePoints();"),'prévia usa pontos sem dobras automáticas');
assert(js.includes("state.bends.push(tip);"),'somente clique fixa novo vértice');
assert(js.includes('function nearestPort('),'pino atrai fio quando ponta está próxima');
assert(js.includes('function wireAt('),'seleciona fio por toque no caminho');
assert(html.includes('answer-key.js?v='),'gabarito carrega na bancada');
assert(answerKey.includes("value!=='peteduca'"),'gabarito requer senha');
assert(answerKey.includes("TinkerPET-gabarito.svg"),'gabarito pode ser baixado');
connect('b1.POS','s1.IN'); // remove a ligação de teste antes da montagem completa
assert.equal(saved().wires.length,0,'fio existente pode ser removido');

connect('esp.D27','drv.IN4');
click('checkBtn');
assert.equal(nodes.playPanel.hidden,true,'simulação incompleta permanece na bancada');
assert.equal(power().running,true,'Iniciar simulação funciona com um fio errado ou faltando');
assert.equal(nodes.simLabel.textContent,'Parar simulação','simulação começa independentemente das ligações');
assert.equal(power().live.esp,false,'ESP32 sem alimentação ainda não acende');
click('checkBtn');
assert.equal(power().running,false,'botão também interrompe simulação sem circuito completo');
connect('esp.D27','drv.IN4');
for(const [a,b] of edges)connect(a,a==='lm.OUTN'?'esp.GND2':b); // usar o segundo GND real e validar equivalência
assert.equal(saved().wires.length,17,'criar 17 fios');
const espBeforeMove=JSON.parse(JSON.stringify(saved().parts.find(p=>p.id==='esp')));
const driverBeforeMove=JSON.parse(JSON.stringify(saved().parts.find(p=>p.id==='drv')));
const espEdgeIndex=saved().wires.findIndex(w=>w.a==='esp.D27'&&w.b==='drv.IN1');
assert(espEdgeIndex>=0,'cabo ESP32 → ponte H presente');
const signalBefore=wiresView().points[espEdgeIndex];
dragEsp(90,-45);
const signalAfter=wiresView().points[espEdgeIndex];
assert.notDeepEqual(signalAfter[0],signalBefore[0],'fio do GPIO acompanha o ESP32');
assert.deepEqual(signalAfter.at(-1),signalBefore.at(-1),'terminal da ponte H fica no lugar');
assert.deepEqual(saved().parts.find(p=>p.id==='drv'),driverBeforeMove,'a ponte H não se move junto do ESP32');
click('undoBtn');
assert.deepEqual(saved().parts.find(p=>p.id==='esp'),espBeforeMove,'desfazer recoloca ESP32 sem desconectar fio');
assert.equal(saved().wires.length,17,'mover ESP32 e desfazer preserva todas as ligações');

// LED extra é opcional: mantém a validação de 17 fios necessários.
connect('b1.NEG','s1.LEDG');assert.equal(saved().wires.length,18,'terceiro pino aceita retorno para LED');
toggle('s1');toggle('s2');

click('checkBtn');
assert.equal(power().running,true,'simulação inicia sem exigir 5V na saída do LM2596');
assert.equal(power().live.buck,true,'LM2596 recebe a alimentação de 9V');
assert.equal(power().live.driver,true,'ponte H recebe alimentação do suporte 6×AA');
assert.equal(power().live.esp,false,'ESP32 não recebe indicador ligado com saída fora de 5V');
assert.equal(power().live.motors.ml,false,'motor parado até sinal e alimentação do ESP32');
send('input','partsLayer',{target:{id:'voltageInput',value:'5'}});
assert.equal(power().live.esp,true,'ESP32 liga após LM2596 em 5V e fios corretos');
assert.equal(power().live.motors.ml,true,'motor esquerdo gira com alimentações e sinais corretos');
assert.equal(power().live.motors.mr,true,'motor direito gira com alimentações e sinais corretos');
// Se um cabo do motor esquerdo for retirado, só ele para; o direito continua.
connect('drv.OUT1','ml.A');
assert.equal(power().live.motors.ml,false,'motor esquerdo para se sua saída desconectar');
assert.equal(power().live.motors.mr,true,'motor direito continua funcionando de forma independente');
connect('drv.OUT1','ml.A');
assert.equal(power().live.motors.ml,true,'restaurar jumper retoma motor esquerdo');
// Sem terra comum, os motores param, embora as fontes permaneçam energizadas.
connect('esp.GND','drv.GND');
assert.equal(power().live.driver,true,'ponte continua com seis AA');
assert.equal(power().live.esp,true,'ESP32 continua alimentado');
assert.equal(power().live.motors.ml,false,'sem GND comum motor esquerdo para');
assert.equal(power().live.motors.mr,false,'sem GND comum motor direito para');
connect('esp.GND','drv.GND');
assert.equal(power().live.motors.ml,true,'restaurar terra comum recupera motor esquerdo');
assert.equal(power().live.motors.mr,true,'restaurar terra comum recupera motor direito');
assert.equal(nodes.playPanel.hidden,true,'Iniciar simulação mantém bancada visível para observar LEDs e motores');
assert.equal(nodes.trackLock.hidden,true,'a pista fica desbloqueada quando os 17 fios estão corretos');
assert.equal(nodes.openTrackBtn.hidden,false,'Abrir pista aparece apenas quando montagem está pronta');
click('openTrackBtn');
assert.equal(nodes.playPanel.hidden,false,'Abrir pista oferece controle do carrinho');
click('backBtn');
assert.equal(nodes.playPanel.hidden,true,'Voltar à bancada mantém simulação ligada');
click('checkBtn');
assert.equal(power().running,false,'Parar simulação encerra o efeito na bancada');
assert.equal(nodes.simLabel.textContent,'Iniciar simulação','botão retorna a Iniciar simulação');
click('checkBtn');
toggle('s1');
assert.equal(power().live.esp,false,'gangorra ESP32 desligada apaga LEDs');
assert.equal(power().live.driver,true,'suporte de AA mantém ponte H alimentada pela outra gangorra');
assert.equal(power().live.motors.ml,false,'motor desliga quando ESP32 perde alimentação');
assert.equal(nodes.trackLock.hidden,false,'gangorra desligada bloqueia a pista');
assert.equal(nodes.openTrackBtn.hidden,true,'sem alimentação completa a pista não é oferecida');
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
assert(Number(nodes.zoomSlider.value)>=4,'enquadramento calcula um zoom válido sem forçar o limite antigo');


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


// O gesto de conexão por toque não transfere foco para campos de texto.
assert(js.includes("if(e.pointerType==='touch'){"),'ligação com touch tem tratamento próprio');
assert(js.includes("if(e.cancelable!==false)e.preventDefault();"),'toque no pino não usa foco nativo');
assert(js.includes("if(!g.moved&&e.pointerType==='touch')"),'pointerup liga o pino mesmo sem click sintético');
assert(!js.includes("Q('componentSearch').focus?.()"),'abrir catálogo não ativa teclado automaticamente');

console.log('PASS: bancada vazia, 9 peças, catálogo, limite, 17 fios, erro, 5 V, duas gangorras, pista e salvamento.');
