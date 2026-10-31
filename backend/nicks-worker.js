/**
 * TinkerPET Nick Registry — Cloudflare Worker (sem banco de dados).
 * A lista mora em data/nicks.json de um repositório GitHub.
 * Configure GH_TOKEN (secret), ADMIN_PASSWORD (secret),
 * GH_OWNER, GH_REPO, GH_BRANCH e ALLOWED_ORIGIN (vars).
 *
 * ATENÇÃO: repositório GitHub público = lista de Nicks pública,
 * mesmo se o painel exigir senha. Prefira um repo privado.
 * Não exponha este token ou a senha no GitHub Pages.
 */
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}
});
const normalize=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const key=nick=>normalize(nick).toLocaleLowerCase('pt-BR');
function settings(env){
 if(!env.GH_TOKEN||!env.ADMIN_PASSWORD||!env.GH_OWNER||!env.GH_REPO)
  throw Error('Configuração incompleta do servidor.');
 return {owner:env.GH_OWNER,repo:env.GH_REPO,branch:env.GH_BRANCH||'main',file:'data/nicks.json'};
}
function headers(env){
 return {
  'Authorization':'Bearer '+env.GH_TOKEN,
  'Accept':'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28',
  'User-Agent':'TinkerPET-NickRegistry'
 };
}
function url(cfg){
 return 'https://api.github.com/repos/'+encodeURIComponent(cfg.owner)+'/'+encodeURIComponent(cfg.repo)+'/contents/'+cfg.file;
}
const from64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const to64=s=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
async function load(env,cfg){
 const response=await fetch(url(cfg)+'?ref='+encodeURIComponent(cfg.branch),{
  headers:headers(env),cache:'no-store'
 });
 if(response.status===404)return {nicks:[],sha:null};
 if(!response.ok)throw Error('GitHub read status '+response.status);
 const data=await response.json();
 const values=JSON.parse(from64(data.content||'W10='));
 if(!Array.isArray(values))throw Error('O arquivo JSON não contém uma lista.');
 return {nicks:values.filter(v=>typeof v==='string'),sha:data.sha};
}
async function save(env,cfg,nicks,sha){
 const payload={message:'Registrar novo Nick no TinkerPET',branch:cfg.branch,
  content:to64(JSON.stringify(nicks,null,2)+'\n')};
 if(sha)payload.sha=sha;
 const response=await fetch(url(cfg),{
  method:'PUT',headers:{...headers(env),'Content-Type':'application/json'},
  body:JSON.stringify(payload)
 });
 if(response.status===409||response.status===422)return false;
 if(!response.ok)throw Error('GitHub write status '+response.status);
 return true;
}
async function register(env,nick){
 const cfg=settings(env);
 for(let attempt=0;attempt<5;attempt++){
  const {nicks,sha}=await load(env,cfg);
  if(nicks.some(v=>key(v)===key(nick)))return;
  const next=[...nicks,nick];
  if(await save(env,cfg,next,sha))return;
 }
 throw Error('Conflito de gravação no GitHub.');
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://peteducacao.github.io';
  const cors={
   'Access-Control-Allow-Origin':allowed,
   'Vary':'Origin',
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type',
   'Access-Control-Max-Age':'86400'
  };
  if(origin!==allowed)return json({error:'Origem não permitida.'},403,{'Cache-Control':'no-store'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return json({error:'Método inválido.'},405,cors);
  const pathname=new URL(request.url).pathname.replace(/\/+$/,'');
  if(pathname!=='/register'&&pathname!=='/admin')return json({error:'Não encontrado.'},404,cors);
  let body;
  try{body=await request.json()}catch{return json({error:'JSON inválido.'},400,cors)}
  try{
   if(pathname==='/admin'){
    settings(env);
    if(typeof body.password!=='string'||body.password!==env.ADMIN_PASSWORD)
     return json({error:'Senha incorreta.'},401,cors);
    const result=await load(env,settings(env));
    return json({nicks:result.nicks},200,cors);
   }
   const nick=normalize(body?.nick);
   if(!nick||Array.from(nick).length>24||/[\u0000-\u001f\u007f]/u.test(nick))
    return json({error:'Nick inválido.'},400,cors);
   await register(env,nick);
   return json({ok:true},200,cors);
  }catch(e){
   console.error('TinkerPET Nick Registry error:',e.message);
   return json({error:'Serviço temporariamente indisponível.'},503,cors);
  }
 }
};