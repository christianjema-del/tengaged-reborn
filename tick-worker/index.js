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
export default {
 async scheduled(event,env,ctx){ctx.waitUntil(tick(env).then(r=>console.log(r.join(' | '))).catch(e=>console.error(e)));}
};
