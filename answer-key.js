'use strict';
(()=>{
 const data=window.tinkerpetAnswerData;
 if(!data||!Array.isArray(data.connections))return;
 const btn=document.createElement('button');
 btn.id='answerKeyBtn';btn.type='button';btn.className='answer-key-trigger';
 btn.textContent='🔒 Gabarito';btn.setAttribute('aria-haspopup','dialog');
 const header=document.querySelector('.header-end');
 header.insertBefore(btn,header.firstChild);
 const dialog=document.createElement('dialog');
 dialog.id='answerKeyDialog';dialog.className='answer-key-dialog';
 dialog.setAttribute('aria-label','Gabarito de conexões do TinkerPET');
 dialog.innerHTML=`<div class="answer-head"><div><small>PET EDUCAÇÃO • TINKERPET</small><h2>Gabarito de conexões</h2></div><button id="answerClose" type="button" aria-label="Fechar gabarito">×</button></div>
 <form id="answerForm" class="answer-gate" autocomplete="off">
 <div class="answer-lock">🔐</div><h3>Acesso ao gabarito</h3>
 <p>Digite a senha para consultar a montagem correta do carrinho.</p>
 <label for="answerPassword">Senha de acesso</label><input id="answerPassword" type="password" required autocomplete="off" placeholder="Digite a senha">
 <span id="answerError" role="alert"></span><button type="submit" class="answer-main">Desbloquear gabarito</button></form>
 <div id="answerContent" class="answer-content" hidden>
 <div class="answer-summary"><b>17 conexões obrigatórias</b><span>Consulte origem e destino de cada fio, na ordem.</span></div>
 <div id="answerGroups"></div>
 <div class="answer-info"><strong>Antes de testar</strong>
 <p>GND e GND2 da ESP32 são equivalentes. Ajuste o LM2596 para <b>5,0 V</b> e ligue as duas gangorras.</p>
 <p><b>Conexões opcionais:</b> bateria 1 NEG → gangorra 1 LED− e bateria 2 NEG → gangorra 2 LED−.</p></div>
 <div class="answer-actions"><button id="answerDownload" type="button" class="answer-main">↓ Baixar gabarito (SVG)</button>
 <button id="answerPrint" type="button" class="answer-alt">⎙ Imprimir / salvar PDF</button></div></div>`;
 document.body.append(dialog);
 const el=id=>dialog.querySelector('#'+id);
 function render(){
  const root=el('answerGroups');root.replaceChildren();
  for(const group of data.groups){
   const section=document.createElement('section');section.className='answer-group';
   section.style.setProperty('--section-color',group.color);
   const h=document.createElement('h3');h.textContent=group.title;
   const p=document.createElement('p');p.textContent=group.info;
   section.append(h,p);
   for(const w of data.connections.slice(group.from,group.to)){
    const row=document.createElement('div');row.className='answer-row';
    for(const [value,cls] of [[String(w.n).padStart(2,'0'),'answer-n'],[w.from,'answer-port'],['→','answer-arrow'],[w.to,'answer-port']]){
     const span=document.createElement('span');span.className=cls;span.textContent=value;row.append(span);
    }
    section.append(row);
   }
   root.append(section);
  }
 }
 const escapeSvg=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function makeSvg(){
  const out=['<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1730" viewBox="0 0 1240 1730">',
   '<rect width="1240" height="1730" fill="#f3f7f9"/>',
   '<rect width="1240" height="124" fill="#193b4b"/>',
   '<text x="56" y="69" font-size="44" font-weight="bold" font-family="Arial,sans-serif" fill="#fff">TinkerPET | Gabarito de conexões</text>',
   '<text x="58" y="103" font-size="20" font-family="Arial,sans-serif" fill="#cce9e8">PET Educação - UFS | Carrinho ESP32 | 17 fios obrigatórios</text>'];
  let y=155;
  for(const g of data.groups){
   const rows=data.connections.slice(g.from,g.to),height=98+rows.length*56;
   out.push('<rect x="46" y="'+y+'" width="1148" height="'+height+'" rx="20" fill="#fff" stroke="#d7e5e9" stroke-width="2"/>');
   out.push('<rect x="46" y="'+y+'" width="12" height="'+height+'" rx="6" fill="'+g.color+'"/>');
   out.push('<text x="80" y="'+(y+39)+'" font-size="29" font-family="Arial,sans-serif" font-weight="bold" fill="#23414e">'+escapeSvg(g.title)+'</text>');
   out.push('<text x="81" y="'+(y+69)+'" font-size="19" font-family="Arial,sans-serif" fill="#617f88">'+escapeSvg(g.info)+'</text>');
   rows.forEach((w,i)=>{
    const ry=y+109+i*56;
    if(i%2===0)out.push('<rect x="76" y="'+(ry-32)+'" width="1088" height="48" rx="8" fill="#f3f8f9"/>');
    out.push('<text x="91" y="'+ry+'" font-size="24" font-family="Arial,sans-serif" font-weight="bold" fill="'+g.color+'">'+String(w.n).padStart(2,'0')+'</text>');
    out.push('<text x="144" y="'+ry+'" font-size="21" font-family="Arial,sans-serif" fill="#27424c">'+escapeSvg(w.from)+'</text>');
    out.push('<text x="604" y="'+ry+'" font-size="29" font-family="Arial,sans-serif" fill="'+g.color+'">→</text>');
    out.push('<text x="674" y="'+ry+'" font-size="21" font-family="Arial,sans-serif" fill="#27424c">'+escapeSvg(w.to)+'</text>');
   });
   y+=height+22;
  }
  out.push('<rect x="47" y="'+(y+6)+'" width="1146" height="108" rx="17" fill="#dff2ec"/>');
  out.push('<text x="78" y="'+(y+48)+'" font-size="25" font-family="Arial,sans-serif" font-weight="bold" fill="#285e52">Antes de testar</text>');
  out.push('<text x="78" y="'+(y+83)+'" font-size="19" font-family="Arial,sans-serif" fill="#315c54">Ajuste o LM2596 para 5 V, ligue as duas chaves e confira os pinos GND.</text>');
  out.push('<text x="58" y="1697" font-size="19" font-family="Arial,sans-serif" fill="#577983">Opcionais: bateria 1 NEG → gangorra 1 LED−; bateria 2 NEG → gangorra 2 LED−.</text>');
  out.push('</svg>');return out.join('');
 }
 function open(){
  el('answerForm').hidden=false;el('answerContent').hidden=true;el('answerError').textContent='';el('answerPassword').value='';
  dialog.showModal();el('answerPassword').focus();
 }
 btn.addEventListener('click',open);
 el('answerClose').addEventListener('click',()=>dialog.close());
 el('answerForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(el('answerPassword').value!=='peteduca'){
   el('answerError').textContent='Senha incorreta. Tente novamente.';
   el('answerPassword').value='';el('answerPassword').focus();return;
  }
  el('answerPassword').value='';el('answerError').textContent='';
  el('answerForm').hidden=true;el('answerContent').hidden=false;render();
 });
 el('answerDownload').addEventListener('click',()=>{
  const blob=new Blob([makeSvg()],{type:'image/svg+xml;charset=utf-8'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='TinkerPET-gabarito.svg';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 el('answerPrint').addEventListener('click',()=>window.print());
})();
