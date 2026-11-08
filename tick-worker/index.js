// V299: cada minuto visita las partidas en curso para que avancen sin que nadie abra la página.
export async function tick(env,fetcher=fetch){
 const site=env.SITE,headers={'User-Agent':'TengagedTick/1.0','Accept':'application/json'};
 const list=await fetcher(site+'/api/tick',{headers});if(!list.ok)throw new Error('tick list '+list.status);
 const targets=((await list.json()).targets||[]).filter(p=>typeof p==='string'&&p.startsWith('/api/')).slice(0,40);
 const results=[];
 for(let i=0;i<targets.length;i+=4){
  results.push(...await Promise.all(targets.slice(i,i+4).map(async path=>{try{const r=await fetcher(site+path,{headers});await r.arrayBuffer();return path+' '+r.status;}catch(e){return path+' error';}})));
 }
 return results;
}
// Deja constancia de la última ejecución para poder comprobar que el reloj funciona.
export async function record(env,text){if(!env.DB)return;await env.DB.prepare('CREATE TABLE IF NOT EXISTS game_tick299(id INTEGER PRIMARY KEY CHECK(id=1),ran_at INTEGER NOT NULL,result TEXT NOT NULL)').run();await env.DB.prepare('INSERT INTO game_tick299(id,ran_at,result) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET ran_at=excluded.ran_at,result=excluded.result').bind(Date.now(),String(text).slice(0,2000)).run();}
export default {
 async scheduled(event,env,ctx){ctx.waitUntil(tick(env).then(r=>record(env,r.join(' | '))).catch(e=>record(env,'error: '+String(e?.message||e))));}
};
