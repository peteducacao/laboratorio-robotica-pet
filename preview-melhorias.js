'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const items=[
  {id:'esp',name:'ESP32',img:'assets/esp32-devkit-v1-30p.svg?v=29',
   what:'É uma placa com microcontrolador, capaz de executar programas e se comunicar por Wi-Fi e Bluetooth.',
   how:'O programa recebe comandos e envia sinais pelos pinos da placa para orientar outros componentes.',
   car:'Recebe pelo Wi-Fi os comandos do celular e orienta a ponte H sobre o movimento dos motores.'},
  {id:'lm',name:'LM2596',img:'assets/lm2596-desenhado.svg',
   what:'É um módulo que reduz a tensão elétrica de uma fonte para um valor apropriado.',
   how:'Seu circuito regulador transforma uma tensão maior em outra menor, ajustável por um pequeno trimpot.',
   car:'Reduz a tensão da bateria de 9 V para cerca de 5 V para alimentar o ESP32, após conferência com multímetro.'},
  {id:'drv',name:'Ponte H MX1508',img:'assets/mx1508-desenhado.svg?v=38',
   what:'É um módulo eletrônico usado para controlar a rotação de motores de corrente contínua.',
   how:'Recebe sinais da controladora e utiliza a alimentação dos motores para fazê-los girar em diferentes sentidos.',
   car:'Comanda os dois motores conforme as instruções do ESP32, permitindo avançar, recuar e fazer curvas.'},
  {id:'s1',name:'Chave gangorra',img:'assets/gangorra-desenhada.svg?v=3',
   what:'É um interruptor que permanece ligado ou desligado até ser acionado novamente.',
   how:'Ao ligar, seus contatos fecham o circuito e permitem a passagem da energia; ao desligar, interrompem essa passagem.',
   car:'Uma gangorra controla a alimentação do ESP32 e a outra a alimentação dos motores.'},
  {id:'ml',name:'Motor DC',img:'assets/motor-frontal.svg',
   what:'É um motor que transforma energia elétrica em movimento giratório.',
   how:'A corrente elétrica faz o eixo girar. As engrenagens ajudam a aumentar a força para movimentar as rodas.',
   car:'Os dois motores fazem as rodas girarem; a ponte H orienta o sentido de cada motor.'},
  {id:'b1',name:'Bateria 9 V',img:'assets/bateria-9v-desenhada.svg',
   what:'É uma fonte portátil de energia elétrica em corrente contínua.',
   how:'A energia química armazenada na bateria é transformada em energia elétrica quando o circuito é fechado.',
   car:'Fornece energia ao módulo LM2596, que regula a alimentação destinada ao ESP32.'},
  {id:'b2',name:'Pilhas AA',img:'assets/suporte-6-pilhas.svg',
   what:'São fontes portáteis de energia que podem ser organizadas em um suporte.',
   how:'Quando ligadas em série, suas tensões se somam, permitindo alimentar dispositivos que precisam de mais tensão.',
   car:'O conjunto de seis pilhas AA alimenta a ponte H e os dois motores.'},
  {id:'jumper',name:'Fios jumper',img:'assets/fios-jumper-ilustracao.svg',
   what:'São pequenos cabos com conectores, usados para interligar componentes eletrônicos.',
   how:'Permitem que energia e sinais elétricos passem de uma peça a outra sem alterar a tensão por conta própria.',
   car:'São os cabos usados para fazer conexões durante a montagem e os testes do carrinho.'}
 ];
 let activeSlide=0;
 let toastTimer=null;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

 function activateTab(name){
  const names=['presentation','backup','menus'];
  if(!names.includes(name))return;
  for(const key of names){
   const active=key===name;
   const tab=$('tab-'+key);
   const panel=$('panel-'+key);
   tab.classList.toggle('active',active);
   tab.setAttribute('aria-selected',String(active));
   tab.tabIndex=active?0:-1;
   panel.hidden=!active;
  }
 }
 document.querySelectorAll('[data-tab]').forEach(el=>{
  el.addEventListener('click',()=>{
   const key=el.dataset.tab;
   activateTab(key);
   if(history.replaceState)history.replaceState(null,'','#'+key);
  });
 });
 function selectComponent(index){
  activeSlide=(index+items.length)%items.length;
  const item=items[activeSlide];
  document.querySelectorAll('.component-choice').forEach((button,i)=>{
   button.classList.toggle('is-active',i===activeSlide);
   button.setAttribute('aria-pressed',String(i===activeSlide));
  });
  $('selectedArt').src=item.img;
  $('selectedTitle').textContent=item.name;
  $('selectedDescription').textContent=item.car;
 }
 function buildComponentCards(){
  const target=$('componentThumbs');
  items.forEach((item,i)=>{
   const button=document.createElement('button');
   button.type='button';
   button.className='component-choice';
   button.setAttribute('aria-label','Selecionar '+item.name);
   button.setAttribute('aria-pressed',String(i===0));
   button.innerHTML='<img src="'+item.img+'" alt=""><span>'+item.name+'</span>';
   button.addEventListener('click',()=>selectComponent(i));
   target.append(button);
  });
  selectComponent(0);
 }
 const modal=$('presentationDialog');
 function renderSlide(){
  const item=items[activeSlide];
  $('slideImage').src=item.img;
  $('slideImage').alt=item.name;
  $('slideCounter').textContent=String(activeSlide+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
  $('slideTitle').textContent=item.name;
  $('slideWhat').textContent=item.what;
  $('slideHow').textContent=item.how;
  $('slideCar').textContent=item.car;
  $('slidePrev').disabled=activeSlide===0;
  $('slideNext').innerHTML=activeSlide===items.length-1?'Recomeçar <svg><use href="#i-arrow-right"></use></svg>':'Próximo <svg><use href="#i-arrow-right"></use></svg>';
  $('slideDots').replaceChildren();
  items.forEach((entry,i)=>{
   const dot=document.createElement('button');
   dot.type='button';
   dot.title=entry.name;
   dot.setAttribute('aria-label','Ir para '+entry.name);
   dot.setAttribute('aria-current',String(i===activeSlide));
   dot.classList.toggle('is-current',i===activeSlide);
   dot.addEventListener('click',()=>{activeSlide=i;renderSlide();});
   $('slideDots').append(dot);
  });
 }
 function openPresentation(){
  renderSlide();
  if(!modal.open)modal.showModal();
  $('slideNext').focus();
 }
 async function closePresentation(){
  if(document.fullscreenElement===modal){
   try{await document.exitFullscreen();}catch{}
  }
  if(modal.open)modal.close();
 }
 function nextSlide(){
  activeSlide=(activeSlide+1)%items.length;
  selectComponent(activeSlide);
  renderSlide();
 }
 function prevSlide(){
  if(activeSlide<=0)return;
  activeSlide--;
  selectComponent(activeSlide);
  renderSlide();
 }
 $('openPresentation').addEventListener('click',openPresentation);
 $('presentSelected').addEventListener('click',openPresentation);
 $('closePresentation').addEventListener('click',closePresentation);
 $('slideNext').addEventListener('click',nextSlide);
 $('slidePrev').addEventListener('click',prevSlide);
 modal.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();nextSlide();}
  if(e.key==='ArrowLeft'){e.preventDefault();prevSlide();}
 });
 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement===modal)await document.exitFullscreen();
   else if(modal.requestFullscreen)await modal.requestFullscreen();
   else showToast('Este navegador não oferece tela cheia neste modo.');
  }catch{
   showToast('O navegador bloqueou a tela cheia. A apresentação continua ampliada.');
  }
 }
 $('presentationFullscreen').addEventListener('click',toggleFullscreen);
 document.addEventListener('fullscreenchange',()=>{
  $('presentationFullscreen').innerHTML=document.fullscreenElement===modal?
   '<svg><use href="#i-maximize"></use></svg> Sair da tela cheia':
   '<svg><use href="#i-maximize"></use></svg> Tela cheia';
 });
 function showToast(msg){
  const el=$('previewToast');
  clearTimeout(toastTimer);
  el.textContent=msg;
  el.hidden=false;
  toastTimer=setTimeout(()=>{el.hidden=true;},3200);
 }

 // Esta demonstração não consulta localStorage nem aceita arquivos.
 // Os circuitos exibidos são fictícios: nenhum backup real é gerado.
 const result=$('backupResult');
 function showBackupResult(mode){
  result.hidden=false;
  if(mode==='export'){
   result.innerHTML='<h3>Como seria o arquivo de backup</h3>'+
    '<p>Ao usar a função no site definitivo, o TinkerPET criaria um arquivo com todos os seus projetos. Aqui está somente um exemplo do nome e do resumo; nenhum circuito real foi lido.</p>'+
    '<div class="backup-sample"><span>tinkerpet-backup-completo.json · 3 projetos fictícios</span><svg><use href="#i-check"></use></svg></div>';
  }else{
   result.innerHTML='<h3>Como seria a restauração</h3>'+
    '<p>Antes de recuperar projetos de um arquivo, o site mostraria uma prévia e perguntaria como deseja prosseguir. Nesta demonstração, nenhuma importação acontece.</p>'+
    '<div class="backup-sample"><span>Arquivo de exemplo encontrado · 3 circuitos para conferir</span><svg><use href="#i-folder"></use></svg></div>'+
    '<div class="backup-choice" role="group" aria-label="Opções ilustrativas de restauração">'+
    '<label><input type="radio" name="restoreMock" value="add" checked> Adicionar sem excluir</label>'+
    '<label><input type="radio" name="restoreMock" value="replace"> Substituir somente após confirmar</label></div>';
  }
  result.scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'});
 }
 $('simulateExport').addEventListener('click',()=>showBackupResult('export'));
 $('simulateImport').addEventListener('click',()=>showBackupResult('import'));

 function setMenuVersion(version){
  const next=version==='next';
  $('menuMock').dataset.version=version;
  $('menuNow').classList.toggle('active',!next);
  $('menuNext').classList.toggle('active',next);
  $('menuNow').setAttribute('aria-pressed',String(!next));
  $('menuNext').setAttribute('aria-pressed',String(next));
  $('toggleMenuInfo').hidden=!next;
  $('toggleMenuInfo').setAttribute('aria-expanded','false');
  $('menuStats').classList.remove('is-open');
 }
 $('menuNow').addEventListener('click',()=>setMenuVersion('now'));
 $('menuNext').addEventListener('click',()=>setMenuVersion('next'));
 $('toggleMenuInfo').addEventListener('click',()=>{
  const open=$('toggleMenuInfo').getAttribute('aria-expanded')!=='true';
  $('toggleMenuInfo').setAttribute('aria-expanded',String(open));
  $('menuStats').classList.toggle('is-open',open);
 });
 $('fakeCreate').addEventListener('click',()=>showToast('Apenas prévia: o botão real de Novo circuito permanece no TinkerPET.'));

 buildComponentCards();
 setMenuVersion('now');
 const initial=location.hash.slice(1);
 activateTab(['backup','menus','presentation'].includes(initial)?initial:'presentation');
})();