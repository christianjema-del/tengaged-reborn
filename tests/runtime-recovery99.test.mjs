import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const timers=new Map(),scripts=[];let id=0;class E{remove(){this.removed=true;}}
const window={},c=vm.createContext({window,document:{createElement:()=>new E(),head:{append:s=>scripts.push(s)}},WebAssembly:{},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
vm.runInContext(readFileSync(new URL('../original-flash.js',import.meta.url),'utf8').replace('export async function play','async function play')+'\nthis.loader=loadRuffle;this.deadline=withLoadDeadline;',c);
const first=c.loader();assert.equal(first,c.loader());const timeout=[...timers.values()].find(x=>x.ms===30000);timeout.fn();await assert.rejects(first,/tardado/);assert.equal(window.__ruffleLoading,null);assert.equal(scripts[0].removed,true);
const retry=c.loader();window.RufflePlayer.newest=()=>({});scripts[1].onload();await retry;assert.equal(timers.size,0);
let removed=false,resolveLoad;const task=new Promise(r=>resolveLoad=r);const runtime=c.deadline(task,()=>removed=true);[...timers.values()].find(x=>x.ms===60000).fn();await assert.rejects(runtime,/tardado/);assert.equal(removed,true);resolveLoad();await new Promise(r=>setImmediate(r));assert.equal(timers.size,0);
const done=await c.deadline(Promise.resolve('ok'),()=>{throw Error('No debe cancelar');});assert.equal(done,'ok');assert.equal(timers.size,0);
const source=readFileSync(new URL('../shell.js',import.meta.url),'utf8'),start=source.indexOf('let sessionRequest='),end=source.indexOf('let indicatorsBusy=',start);assert.ok(start>=0&&end>start);
let fetches=0,release;const pending=new Promise(r=>release=r),node={style:{}};const session=vm.createContext({AbortController,setTimeout,clearTimeout,fetch:async()=>{fetches++;await pending;return {ok:true,status:200,json:async()=>({ok:true,user:{username:'Cristi'}})};},$:()=>node,render(){},updateIndicators(){}});
vm.runInContext(source.slice(start,end)+'\nthis.refreshSession=refresh;',session);const a=session.refreshSession(),b=session.refreshSession();assert.equal(a,b);assert.equal(fetches,1);release();assert.equal((await a).username,'Cristi');await session.refreshSession();assert.equal(fetches,2);
console.log('PASS shared renderer/session loads, bounded script/runtime waits, cleanup, retry and no timeout after successful game load.');
