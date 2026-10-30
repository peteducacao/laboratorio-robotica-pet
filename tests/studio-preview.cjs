'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const base=read('index.html'),preview=read('studio-preview.html');
const css=read('studio-preview.css'),ui=read('studio-preview.js');
const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const originalIds=ids(base);
for(const id of originalIds)assert(preview.includes('id="'+id+'"'),'Prévia precisa preservar controle de simulador: '+id);
assert.equal(new Set(ids(preview)).size,ids(preview).length,'IDs sem duplicidade');
assert(preview.includes('href="styles.css?v=36"')&&preview.includes('src="app.js?v=38"'),'mesmo motor do site atual, sem fork de circuitos');
assert(preview.includes('studio-preview.css?v=3')&&preview.includes('studio-preview.js?v=1'),'assets da prévia isolados');
assert(preview.includes('href="./"'),'voltar à versão atual');
assert(preview.includes('id="previewInspectorOpen"')&&preview.includes('id="previewInspectorClose"'),'propriedades no modo sob demanda');
for(const id of ['viewport','world','wireSvg','partsLayer','library','drawerHandle','catalog','zoomLabel','zoomIn','checkBtn','wireColorSelect','progressBar','connectionsCount','validationBadge'])
 assert(preview.includes('id="'+id+'"'),'controle funcional ausente: '+id);
assert(css.includes('--studio-warm:#fcf8f2')&&css.includes('--studio-navy:#173d72')&&css.includes('--studio-teal:#159ca5'),'identidade visual PET');
assert(css.includes('grid-template-areas:"left zoom right"'),'comandos agrupados como editor');
assert(css.includes('.preview-studio .studio{'),'bancada ocupa toda a largura');
assert(css.includes('display:none!important;flex-direction:column!important'),'inspetor não ocupa área permanentemente');
assert(css.includes('@media(max-width:600px)')&&css.includes('@media(max-width:376px)'),'regras de celular');
assert(css.includes('--studio-top-offset'),'gaveta sincronizada com a barra');
assert(ui.includes('aria-expanded')&&ui.includes('aria-hidden'),'detalhes acessíveis');
assert(!ui.includes('localStorage')&&!ui.includes('state.parts')&&!ui.includes('state.wires'),'script de prévia não altera montagem nem motor');
assert(read('app.js').includes("tinkerpet-studio-preview-v1"),'motor separa o armazenamento da prévia e o original');
const brackets=s=>{
 let depth=0,comment=false,str=null,esc=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i],nx=s[i+1];
  if(comment){if(ch==='*'&&nx==='/'){comment=false;i++;}continue;}
  if(str){if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===str)str=null;continue;}
  if(ch==='/'&&nx==='*'){comment=true;i++;continue;}
  if(ch==='"'||ch==="'"){str=ch;continue;}
  if(ch==='{')depth++;
  if(ch==='}'){depth--;assert(depth>=0,'CSS com chave a mais');}
 }
 assert.equal(depth,0,'CSS com blocos equilibrados');
};
brackets(css);
console.log('✓ Prévia isolada: controles originais preservados, CSS consistente, mobile e painel acessível.');
