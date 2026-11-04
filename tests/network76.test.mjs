import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../market-ui.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/export /g,'');let calls=0,expire;
const ctx=vm.createContext({document:{},AbortController,fetch:async()=>{calls++;return {ok:true,json:async()=>({ok:true,value:1})};},setTimeout:fn=>(expire=fn,1),clearTimeout(){},console,Error});vm.runInContext(source+'\nthis.read=api;',ctx);assert.equal((await ctx.read('/api/test')).value,1);
ctx.fetch=async()=>({ok:true,json:async()=>{throw Error('html');}});await assert.rejects(()=>ctx.read('/api/test'),/respuesta inesperada/);
ctx.fetch=async(url,options)=>{calls++;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));};const before=calls,pending=ctx.read('/api/test',{method:'POST'});expire();await assert.rejects(()=>pending,/tardado demasiado/);assert.equal(calls,before+1);
console.log('PASS shared API handles JSON errors and times out without replaying mutations.');
