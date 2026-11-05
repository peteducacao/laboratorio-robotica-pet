'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const tasks=[
  {id:'forward',title:'Faça o carrinho andar para a frente!',kind:'motor',
   initial:[0,0],check:(a,b)=>a>0&&a===b},
  {id:'left',title:'Faça o carrinho virar à esquerda!',kind:'motor',
   initial:[0,0],check:(a,b)=>b>a},
  {id:'right',title:'Faça o carrinho virar à direita!',kind:'motor',
   initial:[0,0],check:(a,b)=>a>b},
  {id:'reverse',title:'Faça o carrinho andar para trás!',kind:'motor',
   initial:[0,0],check:(a,b)=>a<0&&a===b},
  {id:'stop',title:'Pare o carrinho em movimento!',kind:'motor',
   initial:[60,60],check:(a,b)=>a===0&&b===0},
  {id:'straight',title:'Faça o carrinho seguir em linha reta!',kind:'motor',
   initial:[80,40],check:(a,b)=>a!==0&&a===b},
  {id:'regulator',title:'Regule o LM2596!',kind:'voltage',
   initial:[9],check:v=>v===5},
  {id:'motor-a',title:'Faça o Motor A funcionar!',kind:'wiring',
   expected:2},
  {id:'ponte-h',title:'Faça a ponte H funcionar!',kind:'wiring',
   expected:17}
 ];
 let index=0,loadId=0,solved=new Set(),currentWiring=null;
 const solvedMsg='Concluído! O desafio reconheceu a configuração.';
 const inspectMsg='Faça a regulagem e confira o resultado.';
 function invalidateCurrent(){
  if(solved.delete(tasks[index].id))renderNav();
 }
 function updateMotion(){
  const a=Number($('motorA').value),b=Number($('motorB').value);
  $('motorAValue').value=a+'%';$('motorBValue').value=b+'%';
  for(const [id,value] of [['wheelA',a],['wheelB',b]]){
   const el=$(id);el.classList.toggle('spinning',value!==0);
   el.style.setProperty('--wheel-duration',Math.max(.18,1.1-Math.abs(value)/100)+'s');
   el.dataset.direction=value<0?'reverse':'forward';
  }
  const angle=(a-b)*.2;
  $('rover').style.transform='rotate('+Math.max(-20,Math.min(20,angle))+'deg)';
  if(!$('feedback').classList.contains('ok')){
   $('feedback').classList.remove('err');
   $('feedback').textContent=inspectMsg;
  }
 }
 function updateVoltage(){
  const v=Number($('voltage').value).toFixed(1).replace('.',',')+' V';
  $('voltageValue').value=v;$('voltageDisplay').textContent=v;
  if(!$('feedback').classList.contains('ok')){
   $('feedback').classList.remove('err');$('feedback').textContent=inspectMsg;
  }
 }
 function feedback(message,type){
  $('feedback').classList.remove('ok','err');
  if(type)$('feedback').classList.add(type);
  $('feedback').textContent=message;
 }
 function markSolved(){
  solved.add(tasks[index].id);
  feedback(solvedMsg,'ok');
  renderNav();
 }
 function renderNav(){
  $('selector').replaceChildren();
  tasks.forEach((task,i)=>{
   const b=document.createElement('button');
   b.type='button';b.textContent=String(i+1);
   b.title=task.title;
   b.classList.toggle('current',i===index);
   b.classList.toggle('solved',solved.has(task.id));
   b.setAttribute('aria-label','Testar bônus '+(i+1)+': '+task.title);
   b.setAttribute('aria-current',i===index?'step':'false');
   b.addEventListener('click',()=>show(i));
   $('selector').append(b);
  });
  $('trackBar').style.width=(solved.size/tasks.length*100)+'%';
  $('progressText').textContent=solved.size+' de '+tasks.length+' testados';
 }
 function show(i){
  if(i<0||i>=tasks.length)return;
  index=i;
  const task=tasks[index];
  $('testCount').textContent=(index+1)+' / '+tasks.length;
  $('typeLabel').textContent=task.kind==='wiring'?'MONTAGEM INTERATIVA':task.kind==='voltage'?'TENSÃO':'MOVIMENTO';
  $('challengeTitle').textContent=task.title;
  $('motorGrid').hidden=task.kind!=='motor';
  $('voltageGrid').hidden=task.kind!=='voltage';
  $('wiringGrid').hidden=task.kind!=='wiring';
  $('check').hidden=task.kind==='wiring';
  $('check').textContent=task.kind==='voltage'?'Conferir medição':'Testar movimento';
  $('next').textContent=index===tasks.length-1?'Ver resultado →':'Próximo bônus →';
  $('prev').disabled=index===0;
  if(task.kind==='motor'){
   $('motorA').value=task.initial[0];$('motorB').value=task.initial[1];
   $('wiringFrame').removeAttribute('src');
   feedback(inspectMsg);updateMotion();
  }else if(task.kind==='voltage'){
   $('voltage').value=task.initial[0];$('wiringFrame').removeAttribute('src');
   feedback(inspectMsg);updateVoltage();
  }else{
   feedback('Conecte os terminais na bancada. O resultado será conferido automaticamente.');
   currentWiring=null;
   $('wiringCount').textContent='Conexões 0/'+task.expected;
   $('wiringErrors').textContent='Sem fios errados';
   const url='petquiz-bonus-bancada.html?challenge='+encodeURIComponent(task.id)+'&teste='+(++loadId);
   $('wiringFrame').src=url;
  }
  renderNav();
 }
 function check(){
  const task=tasks[index];
  if(task.kind==='wiring')return;
  const correct=task.kind==='voltage'?
   task.check(Number($('voltage').value)):
   task.check(Number($('motorA').value),Number($('motorB').value));
  if(correct)markSolved();
  else feedback('Ainda não deu certo. Ajuste e tente novamente.','err');
 }
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin)return;
  const data=e.data;
  if(!data||data.source!=='petquiz-bancada'||tasks[index]?.kind!=='wiring'||data.challenge!==tasks[index].id)return;
  currentWiring=data;
  $('wiringCount').textContent='Conexões '+data.good+'/'+data.total;
  $('wiringErrors').textContent=data.errors?'Fios pendentes/incorretos: '+data.errors:'Sem fios errados';
  if(data.success&&!solved.has(data.challenge))markSolved();
  else if(!data.success&&solved.has(data.challenge)){
   solved.delete(data.challenge);
   feedback('A ligação foi alterada. Confira as conexões.');
   renderNav();
  }
 });
 $('motorA').addEventListener('input',()=>{invalidateCurrent();feedback(inspectMsg);updateMotion()});
 $('motorB').addEventListener('input',()=>{invalidateCurrent();feedback(inspectMsg);updateMotion()});
 $('voltage').addEventListener('input',()=>{invalidateCurrent();feedback(inspectMsg);updateVoltage()});
 $('check').addEventListener('click',check);
 $('prev').addEventListener('click',()=>show(index-1));
 $('next').addEventListener('click',()=>{
  if(index===tasks.length-1){
   feedback('Você validou '+solved.size+' dos '+tasks.length+' bônus nesta sessão.'+(solved.size===tasks.length?' Todos concluídos!':''),'ok');
   return;
  }
  show(index+1);
 });
 $('restart').addEventListener('click',()=>show(index));
 show(0);
})();
