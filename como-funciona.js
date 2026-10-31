'use strict';
(()=>{
 // Consulta rápida: sem conexões elétricas, sem gabarito e sem alterar projetos.
 const contents={
  esp:{
   what:'É uma placa com microcontrolador, capaz de executar programas e se comunicar por Wi-Fi e Bluetooth. É como o centro de comando do carrinho.',
   how:'No carrinho, o ESP32 cria uma rede Wi-Fi para receber os comandos enviados pelo celular. Depois, envia sinais de controle à ponte H. Ele decide o movimento, mas não fornece diretamente a energia dos motores.'
  },
  lm:{
   what:'É um módulo regulador de tensão. Sua função é reduzir a tensão recebida de uma fonte para um valor adequado a outro equipamento.',
   how:'No nosso carrinho, o LM2596 recebe energia da bateria de 9 V e reduz a tensão para aproximadamente 5 V, usada na alimentação do ESP32. O ajuste é feito pelo trimpot, e a tensão deve ser medida com multímetro antes de conectar a placa.'
  },
  drv:{
   what:'É uma placa de controle que permite ligar motores de corrente contínua e mudar o sentido em que giram.',
   how:'A ponte H recebe os comandos do ESP32 e a energia do conjunto de pilhas. Com isso, controla os dois motores, fazendo o carrinho avançar, recuar ou virar. Os sinais do ESP32 orientam o movimento; a energia dos motores vem das pilhas.'
  },
  s1:{
   what:'É um interruptor que permanece na posição escolhida: ligado ou desligado, até alguém acioná-lo novamente.',
   how:'Ao ligar a gangorra, o circuito de alimentação é fechado e a energia pode passar. Ao desligá-la, a passagem é interrompida. No carrinho, usamos duas chaves: uma para a alimentação do ESP32 e outra para a dos motores.'
  },
  ml:{
   what:'É um motor elétrico que transforma energia em movimento de rotação. No carrinho, esse movimento faz as rodas girarem.',
   how:'A ponte H controla o sentido de giro de cada motor. A caixa de engrenagens do motor reduz a velocidade de rotação e aumenta a força disponível para mover as rodas.'
  },
  b1:{
   what:'É uma fonte portátil de energia elétrica que fornece aproximadamente 9 volts em corrente contínua.',
   how:'No carrinho, essa bateria alimenta o módulo LM2596. O regulador reduz a tensão antes que ela seja utilizada pela placa ESP32, que precisa de uma alimentação adequada.'
  },
  b2:{
   what:'É uma peça que acomoda as pilhas AA e mantém seus contatos elétricos organizados para fornecer energia ao circuito.',
   how:'No nosso carrinho, seis pilhas AA ligadas em série somam suas tensões. Essa energia alimenta a ponte H e os motores, separadamente da bateria utilizada para o ESP32.'
  },
  jumper:{
   what:'São pequenos cabos com conectores nas pontas, usados para fazer ligações entre componentes eletrônicos.',
   how:'Os jumpers criam caminhos para a passagem de energia ou de sinais de controle entre as peças. Eles não reduzem a tensão nem decidem o funcionamento do circuito: apenas fazem a conexão.'
  }
 };
 const grid=document.getElementById('componentsGrid');
 const panel=document.getElementById('componentPanel');
 const cards=[...document.querySelectorAll('.component-card')];
 const byId=id=>document.getElementById(id);
 if(!grid||!panel||cards.length!==Object.keys(contents).length)return;
 let selected=null;
 function placePanel(){
  if(!selected)return;
  const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  const index=cards.findIndex(card=>card.dataset.part===selected);
  const rowEnd=Math.min(cards.length-1,(Math.floor(index/Math.max(columns,1))+1)*Math.max(columns,1)-1);
  cards[rowEnd].after(panel);
 }
 function close(){
  selected=null;
  panel.hidden=true;
  for(const card of cards){card.classList.remove('is-selected');card.setAttribute('aria-expanded','false');}
 }
 function open(card){
  if(selected===card.dataset.part){close();return;}
  const data=contents[card.dataset.part];if(!data)return;
  selected=card.dataset.part;
  for(const button of cards){
   const active=button===card;
   button.classList.toggle('is-selected',active);
   button.setAttribute('aria-expanded',String(active));
  }
  byId('componentName').textContent=card.querySelector('.component-label').textContent;
  byId('componentImage').src=card.querySelector('.component-figure img').getAttribute('src');
  byId('componentWhatText').textContent=data.what;
  byId('componentHowText').textContent=data.how;
  byId('componentWhat').open=false;
  byId('componentHow').open=false;
  panel.hidden=false;
  placePanel();
  if(matchMedia('(max-width:810px)').matches){
   requestAnimationFrame(()=>{
    const bounds=panel.getBoundingClientRect();
    if(bounds.top>innerHeight-180){
     panel.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
   });
  }
 }
 for(const card of cards)card.addEventListener('click',()=>open(card));
 byId('componentClose').addEventListener('click',()=>{
  const last=cards.find(c=>c.dataset.part===selected);
  close();last?.focus();
 });
 window.addEventListener('resize',placePanel);
})();
