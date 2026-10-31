'use strict';
/* TinkerPET — registro opcional de Nicks no GitHub.
   Depois de publicar o Worker, cole sua URL HTTPS abaixo (sem / final).
   Nunca coloque tokens do GitHub ou a senha de Admin neste arquivo público. */
(()=>{
 const API_URL='';
 const PENDING='tinkerpet-nicks-pending-v1';
 const DONE='tinkerpet-nicks-registered-v1';
 let sending=false;
 const nameOf=v=>String(v||'').trim().replace(/\s+/g,' ').slice(0,24);
 const keyOf=v=>nameOf(v).normalize('NFKC').toLocaleLowerCase('pt-BR');
 const read=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
 const write=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data))}catch{}};
 const api=(path,body)=>fetch(API_URL+path,{
  method:'POST',mode:'cors',cache:'no-store',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify(body)
 });
 async function flush(){
  if(!API_URL||sending)return false;
  sending=true;
  try{
   for(const nick of read(PENDING)){
    const sent=read(DONE),key=keyOf(nick);
    if(sent.includes(key)){
     write(PENDING,read(PENDING).filter(n=>keyOf(n)!==key));continue;
    }
    try{
     const response=await api('/register',{nick});
     if(!response.ok)break;
     write(DONE,[...sent,key].slice(-500));
     write(PENDING,read(PENDING).filter(n=>keyOf(n)!==key));
    }catch{break}
   }
  }finally{sending=false}
  return read(PENDING).length===0;
 }
 function register(value){
  const nick=nameOf(value);if(!nick)return Promise.resolve(false);
  if(!read(DONE).includes(keyOf(nick))&&!read(PENDING).some(n=>keyOf(n)===keyOf(nick))){
   write(PENDING,[...read(PENDING),nick].slice(-100));
  }
  return flush().catch(()=>false);
 }
 async function list(password){
  if(!API_URL)throw Error('Integração ainda não configurada.');
  const response=await api('/admin',{password});
  if(!response.ok){const error=Error('Falha ao consultar registro');error.status=response.status;throw error}
  const result=await response.json();
  return Array.isArray(result.nicks)?result.nicks:[];
 }
 window.TinkerpetNickRegistry={enabled:Boolean(API_URL),register,list};
})();