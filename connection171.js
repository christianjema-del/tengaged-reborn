/* In-flight coordination only. No responses or account data are stored on disk.
   Reads may retry one transient transport failure; writes are sent exactly once. */
(function(){
 'use strict';if(window.TengagedConnection171)return;window.TengagedConnection171=true;
 const native=window.fetch.bind(window),jobs=new Map(),queue=[];let active=0,background=0,generation=0;
 const abortError=()=>new DOMException('Solicitud cancelada','AbortError');
 const invalidate=()=>{generation++;};addEventListener('tengaged:session',invalidate);addEventListener('storage',e=>{if(e.key==='tengaged_logout'||e.key==='tengaged_user')invalidate();});
 function finish(job,error,response){
  if(jobs.get(job.key)===job)jobs.delete(job.key);
  for(const consumer of job.consumers){consumer.signal?.removeEventListener('abort',consumer.abort);if(error)consumer.reject(error);else consumer.resolve(response.clone());}
  job.consumers.clear();
 }
 function pump(){
  while(active<4){const i=queue.findIndex(j=>!j.low||background<2);if(i<0)return;const job=queue.splice(i,1)[0];if(!job.consumers.size){if(jobs.get(job.key)===job)jobs.delete(job.key);continue;}
   active++;if(job.low)background++;job.running=true;
   run(job).finally(()=>{active--;if(job.low)background--;pump();});
  }
 }
 async function run(job){
  let lastError;
  for(let attempt=0;attempt<2&&job.consumers.size;attempt++){
   job.controller=new AbortController();const timer=setTimeout(()=>job.controller.abort(),45000);
   try{
    const response=await native(job.input,{...job.init,signal:job.controller.signal});
    const transient=[502,503,504].includes(response.status);let quota=false;
    if(response.status===503){try{quota=(await response.clone().json()).code==='DB_DAILY_LIMIT';}catch{}}
    // Drain a clone before releasing a slot: slow bodies also occupy connections.
    await response.clone().arrayBuffer();
    if(transient&&!quota&&attempt===0&&job.consumers.size){clearTimeout(timer);await new Promise(resolve=>setTimeout(resolve,600+Math.floor(Math.random()*400)));continue;}
    finish(job,null,response);return;
   }catch(error){lastError=error;if(!job.consumers.size)return;if(attempt===0){clearTimeout(timer);await new Promise(resolve=>setTimeout(resolve,600+Math.floor(Math.random()*400)));}}
   finally{clearTimeout(timer);}
  }
  finish(job,lastError||abortError());
 }
 window.fetch=function(input,init={}){
  init=init||{};
  let url;try{url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);}catch{return native(input,init);}
  const method=String(init.method||(typeof input==='object'&&input.method)||'GET').toUpperCase();
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return native(input,init);
  if(method!=='GET'){invalidate();return native(input,init);}
  const signal=init.signal||(typeof input==='object'?input.signal:undefined);if(signal?.aborted)return Promise.reject(abortError());
  const headers=new Headers(init.headers||(typeof input==='object'&&input.headers)||undefined);
  const key=generation+'|'+url.href+'|'+(init.credentials||'same-origin')+'|'+JSON.stringify([...headers]);
  let job=jobs.get(key),created=false;
  if(!job){job={key,input,init,consumers:new Set(),low:/^\/api\/(?:avatar|design-image|user-colors)(?:\/|$)/.test(url.pathname)};jobs.set(key,job);created=true;}
  const promise=new Promise((resolve,reject)=>{
   const consumer={resolve,reject,signal,abort:null};consumer.abort=()=>{job.consumers.delete(consumer);signal?.removeEventListener('abort',consumer.abort);reject(abortError());if(!job.consumers.size){if(jobs.get(key)===job)jobs.delete(key);job.controller?.abort();}};
   job.consumers.add(consumer);signal?.addEventListener('abort',consumer.abort,{once:true});
  });
  if(created){queue.push(job);queue.sort((a,b)=>Number(a.low)-Number(b.low));Promise.resolve().then(pump);}
  return promise;
 };
})();
