'use strict';
(()=>{
 // Consulta rápida: sem conexões elétricas, sem gabarito e sem alterar projetos.
 const contents={
  esp:{
   what:'É uma placa com um pequeno computador chamado microcontrolador. Ela executa programas e pode se comunicar por Wi-Fi e Bluetooth.',
   how:'O programa recebe comandos e envia sinais elétricos pelos pinos da placa. Esses sinais orientam outros componentes a realizar ações.',
   car:'Recebe pelo Wi-Fi os comandos do celular e avisa à ponte H como os motores devem se movimentar.'
  },
  lm:{
   what:'É um módulo regulador de tensão. Ele reduz a tensão elétrica de uma fonte para um valor adequado ao equipamento.',
   how:'Um circuito eletrônico transforma uma tensão maior em outra menor. A tensão de saída pode ser ajustada por um pequeno controle chamado trimpot.',
   car:'Reduz a energia da bateria de 9 V para cerca de 5 V, usados para alimentar o ESP32. A tensão deve ser conferida com multímetro antes do uso.'
  },
  drv:{
   what:'É um módulo de controle de motores. Ele permite ligar, parar e inverter o sentido de giro de motores elétricos.',
   how:'Recebe sinais de uma placa controladora e usa uma alimentação própria para movimentar os motores em diferentes sentidos.',
   car:'Controla os dois motores a partir dos comandos enviados pelo ESP32, permitindo avançar, recuar e fazer curvas.'
  },
  s1:{
   what:'É um interruptor que permanece na posição escolhida: ligado ou desligado.',
   how:'Ao acionar a chave, os contatos elétricos se fecham e permitem a passagem de energia. Ao desligá-la, a passagem é interrompida.',
   car:'Usamos duas gangorras: uma liga ou desliga a alimentação do ESP32 e a outra controla a alimentação dos motores.'
  },
  ml:{
   what:'É um motor elétrico que transforma energia elétrica em movimento de rotação.',
   how:'A energia elétrica faz o eixo girar. Na versão com caixa de engrenagens, a rotação fica mais lenta e ganha força para movimentar uma carga.',
   car:'Os dois motores giram as rodas do carrinho. A ponte H permite controlar o sentido de giro de cada um.'
  },
  b1:{
   what:'É uma bateria portátil que fornece energia elétrica em corrente contínua, com tensão nominal de 9 V.',
   how:'Armazena energia química e a transforma em energia elétrica quando faz parte de um circuito fechado.',
   car:'Fornece energia ao LM2596, que regula a tensão utilizada para alimentar o ESP32.'
  },
  b2:{
   what:'É um suporte que acomoda as pilhas AA e organiza os contatos necessários para fornecer energia.',
   how:'As pilhas instaladas em série somam suas tensões. Assim, o conjunto pode alimentar componentes que precisam de uma tensão maior do que uma pilha fornece sozinha.',
   car:'O conjunto de seis pilhas AA fornece a energia utilizada pela ponte H e pelos motores, separada da alimentação do ESP32.'
  },
  jumper:{
   what:'São cabos de conexão com pequenas pontas que ajudam a interligar componentes eletrônicos.',
   how:'Criam caminhos para os sinais ou para a energia circularem entre peças. Não controlam nem modificam a tensão por conta própria.',
   car:'São os fios usados para fazer as conexões entre as peças durante a montagem e os testes do circuito.'
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
  byId('componentInCarText').textContent=data.car;
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
